#!/usr/bin/env bash
# e2e/run-e2e-tests.sh
# Main runner script for Dkron E2E tests
#
# Usage:
#   ./e2e/run-e2e-tests.sh              # Run all tests
#   ./e2e/run-e2e-tests.sh --no-build   # Skip Docker build
#   ./e2e/run-e2e-tests.sh --keep       # Keep cluster running after tests
#   ./e2e/run-e2e-tests.sh --filter 01  # Run only tests matching pattern
#   ./e2e/run-e2e-tests.sh --help       # Show help

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.e2e.yml"
COMPOSE_PROJECT="dkron-e2e"
DKRON_API_URL="${DKRON_API_URL:-http://localhost:8080}"
STARTUP_TIMEOUT="${STARTUP_TIMEOUT:-120}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Options
BUILD=true
KEEP_RUNNING=false
FILTER=""
VERBOSE=false

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

print_usage() {
    cat <<EOF
Dkron E2E Test Runner

Usage: $(basename "$0") [OPTIONS]

Options:
    --no-build      Skip Docker image build
    --keep          Keep cluster running after tests complete
    --filter PATTERN Only run tests matching pattern (e.g., "01" for health tests)
    --verbose       Show verbose output
    --help          Show this help message

Environment Variables:
    DKRON_API_URL       API URL (default: http://localhost:8080)
    STARTUP_TIMEOUT     Cluster startup timeout in seconds (default: 120)

Examples:
    # Run all tests
    ./e2e/run-e2e-tests.sh

    # Run only job CRUD tests
    ./e2e/run-e2e-tests.sh --filter 02

    # Keep cluster running for debugging
    ./e2e/run-e2e-tests.sh --keep

    # Run against existing cluster (no build, no teardown)
    ./e2e/run-e2e-tests.sh --no-build --keep
EOF
}

check_dependencies() {
    local missing=()
    
    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing+=("docker-compose or docker compose plugin")
    fi
    
    if ! command -v bats &> /dev/null; then
        missing+=("bats")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing+=("jq")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing+=("curl")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing[*]}"
        log_info "Please install the missing dependencies and try again."
        log_info ""
        log_info "Installation hints:"
        log_info "  - bats: npm install -g bats (or your package manager)"
        log_info "  - jq: apt-get install jq (or your package manager)"
        log_info "  - curl: apt-get install curl (or your package manager)"
        exit 1
    fi
    
    log_success "All dependencies found"
}

docker_compose_cmd() {
    if docker compose version &> /dev/null 2>&1; then
        docker compose -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" "$@"
    else
        docker-compose -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" "$@"
    fi
}

start_cluster() {
    log_info "Starting Dkron cluster..."
    
    if [ "$BUILD" = true ]; then
        log_info "Building Docker images..."
        docker_compose_cmd build --quiet
    fi
    
    docker_compose_cmd up -d
    
    log_info "Waiting for cluster to be ready (timeout: ${STARTUP_TIMEOUT}s)..."
    
    local elapsed=0
    local interval=5
    
    while [ $elapsed -lt "$STARTUP_TIMEOUT" ]; do
        if curl -s -o /dev/null -w "%{http_code}" "${DKRON_API_URL}/health" 2>/dev/null | grep -q "200"; then
            log_success "Cluster is ready!"
            return 0
        fi
        
        sleep $interval
        elapsed=$((elapsed + interval))
        echo -n "."
    done
    
    echo ""
    log_error "Timeout waiting for cluster to be ready"
    log_info "Checking container logs..."
    docker_compose_cmd logs --tail=50
    return 1
}

stop_cluster() {
    if [ "$KEEP_RUNNING" = true ]; then
        log_info "Keeping cluster running (--keep specified)"
        log_info "To stop: docker compose -f $COMPOSE_FILE -p $COMPOSE_PROJECT down"
        return 0
    fi
    
    log_info "Stopping cluster..."
    docker_compose_cmd down -v --remove-orphans
    log_success "Cluster stopped"
}

run_tests() {
    log_info "Running E2E tests..."
    echo ""
    
    local test_files=()
    
    if [ -n "$FILTER" ]; then
        # Find test files matching the filter
        while IFS= read -r -d '' file; do
            test_files+=("$file")
        done < <(find "${SCRIPT_DIR}/tests" -name "*${FILTER}*.bats" -print0 | sort -z)
        
        if [ ${#test_files[@]} -eq 0 ]; then
            log_error "No test files found matching filter: $FILTER"
            return 1
        fi
    else
        # Run all test files
        while IFS= read -r -d '' file; do
            test_files+=("$file")
        done < <(find "${SCRIPT_DIR}/tests" -name "*.bats" -print0 | sort -z)
    fi
    
    log_info "Found ${#test_files[@]} test file(s) to run"
    echo ""
    
    local exit_code=0
    local bats_opts=()
    
    if [ "$VERBOSE" = true ]; then
        bats_opts+=("--verbose-run")
    fi
    
    # Export environment variables for tests
    export DKRON_API_URL
    
    # Run bats tests
    if ! bats "${bats_opts[@]}" "${test_files[@]}"; then
        exit_code=1
    fi
    
    return $exit_code
}

cleanup_on_error() {
    log_error "An error occurred. Cleaning up..."
    if [ "$KEEP_RUNNING" != true ]; then
        docker_compose_cmd down -v --remove-orphans 2>/dev/null || true
    fi
}

# ============================================================================
# Main
# ============================================================================

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-build)
                BUILD=false
                shift
                ;;
            --keep)
                KEEP_RUNNING=true
                shift
                ;;
            --filter)
                FILTER="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done
    
    echo ""
    echo "========================================"
    echo "       Dkron E2E Test Runner"
    echo "========================================"
    echo ""
    
    # Set up error handling
    trap cleanup_on_error ERR
    
    # Check dependencies
    check_dependencies
    
    # Start cluster
    if ! start_cluster; then
        log_error "Failed to start cluster"
        stop_cluster
        exit 1
    fi
    
    # Show cluster status
    log_info "Cluster status:"
    docker_compose_cmd ps
    echo ""
    
    # Run tests
    local test_result=0
    if ! run_tests; then
        test_result=1
    fi
    
    echo ""
    
    # Stop cluster
    stop_cluster
    
    echo ""
    if [ $test_result -eq 0 ]; then
        log_success "All E2E tests passed!"
    else
        log_error "Some E2E tests failed"
    fi
    
    exit $test_result
}

main "$@"
