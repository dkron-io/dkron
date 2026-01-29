#!/usr/bin/env bash
# e2e/lib/helpers.bash
# Helper functions for Dkron E2E tests

# Configuration
export DKRON_API_URL="${DKRON_API_URL:-http://localhost:8080}"
export DKRON_API_TIMEOUT="${DKRON_API_TIMEOUT:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# API Request Helpers
# ============================================================================

# Make a GET request to the Dkron API
# Usage: api_get "/v1/jobs"
api_get() {
    local endpoint="$1"
    local url="${DKRON_API_URL}${endpoint}"
    
    curl -s -w "\n%{http_code}" \
        -H "Accept: application/json" \
        --max-time "$DKRON_API_TIMEOUT" \
        "$url"
}

# Make a POST request to the Dkron API
# Usage: api_post "/v1/jobs" '{"name": "test"}'
api_post() {
    local endpoint="$1"
    local data="$2"
    local url="${DKRON_API_URL}${endpoint}"
    
    curl -s -w "\n%{http_code}" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        --max-time "$DKRON_API_TIMEOUT" \
        -X POST \
        -d "$data" \
        "$url"
}

# Make a PUT request to the Dkron API
# Usage: api_put "/v1/jobs/test-job" '{"name": "test-job", ...}'
api_put() {
    local endpoint="$1"
    local data="$2"
    local url="${DKRON_API_URL}${endpoint}"
    
    curl -s -w "\n%{http_code}" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        --max-time "$DKRON_API_TIMEOUT" \
        -X PUT \
        -d "$data" \
        "$url"
}

# Make a DELETE request to the Dkron API
# Usage: api_delete "/v1/jobs/test-job"
api_delete() {
    local endpoint="$1"
    local url="${DKRON_API_URL}${endpoint}"
    
    curl -s -w "\n%{http_code}" \
        -H "Accept: application/json" \
        --max-time "$DKRON_API_TIMEOUT" \
        -X DELETE \
        "$url"
}

# Make a PATCH request to the Dkron API
# Usage: api_patch "/v1/jobs" '{"name": "test"}'
api_patch() {
    local endpoint="$1"
    local data="$2"
    local url="${DKRON_API_URL}${endpoint}"
    
    curl -s -w "\n%{http_code}" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        --max-time "$DKRON_API_TIMEOUT" \
        -X PATCH \
        -d "$data" \
        "$url"
}

# ============================================================================
# Response Parsing Helpers
# ============================================================================

# Extract HTTP status code from response (last line)
# Usage: status=$(get_status_code "$response")
get_status_code() {
    echo "$1" | tail -n1
}

# Extract response body from response (all but last line)
# Usage: body=$(get_response_body "$response")
get_response_body() {
    echo "$1" | sed '$d'
}

# Parse JSON field from response body
# Usage: value=$(json_get "$body" ".name")
json_get() {
    local json="$1"
    local field="$2"
    echo "$json" | jq -r "$field"
}

# Check if JSON array contains a specific value
# Usage: json_array_contains "$body" ".name" "test-job"
json_array_contains() {
    local json="$1"
    local field="$2"
    local value="$3"
    echo "$json" | jq -e "map(select($field == \"$value\")) | length > 0" > /dev/null 2>&1
}

# Get length of JSON array
# Usage: len=$(json_array_length "$body")
json_array_length() {
    local json="$1"
    echo "$json" | jq 'length'
}

# ============================================================================
# Wait/Retry Helpers
# ============================================================================

# Wait for a condition to be true
# Usage: wait_for "api_get /health returns 200" 30 1 "check_health"
wait_for() {
    local description="$1"
    local timeout="$2"
    local interval="$3"
    local check_fn="$4"
    shift 4
    local args=("$@")
    
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if "$check_fn" "${args[@]}" 2>/dev/null; then
            return 0
        fi
        sleep "$interval"
        elapsed=$((elapsed + interval))
    done
    
    echo "Timeout waiting for: $description" >&2
    return 1
}

# Wait for Dkron API to be ready
# Usage: wait_for_api 30
wait_for_api() {
    local timeout="${1:-30}"
    local interval=1
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        local response
        response=$(api_get "/health" 2>/dev/null)
        local status
        status=$(get_status_code "$response")
        
        if [ "$status" = "200" ]; then
            return 0
        fi
        
        sleep "$interval"
        elapsed=$((elapsed + interval))
    done
    
    echo "Timeout waiting for Dkron API to be ready" >&2
    return 1
}

# Wait for cluster to have expected number of members
# Usage: wait_for_cluster_members 3 30
wait_for_cluster_members() {
    local expected_count="$1"
    local timeout="${2:-30}"
    local interval=2
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        local response
        response=$(api_get "/v1/members" 2>/dev/null)
        local body
        body=$(get_response_body "$response")
        local count
        count=$(json_array_length "$body" 2>/dev/null || echo "0")
        
        if [ "$count" -ge "$expected_count" ]; then
            return 0
        fi
        
        sleep "$interval"
        elapsed=$((elapsed + interval))
    done
    
    echo "Timeout waiting for $expected_count cluster members" >&2
    return 1
}

# Wait for a job execution to complete
# Usage: wait_for_execution "test-job" 60
wait_for_execution() {
    local job_name="$1"
    local timeout="${2:-60}"
    local interval=2
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        local response
        response=$(api_get "/v1/jobs/${job_name}/executions" 2>/dev/null)
        local body
        body=$(get_response_body "$response")
        
        # Check if there's at least one finished execution
        local has_finished
        has_finished=$(echo "$body" | jq '[.[] | select(.finished_at != null and .finished_at != "")] | length > 0' 2>/dev/null || echo "false")
        
        if [ "$has_finished" = "true" ]; then
            return 0
        fi
        
        sleep "$interval"
        elapsed=$((elapsed + interval))
    done
    
    echo "Timeout waiting for job execution to complete" >&2
    return 1
}

# Wait for job to have at least N successful executions
# Usage: wait_for_successful_executions "test-job" 1 60
wait_for_successful_executions() {
    local job_name="$1"
    local expected_count="$2"
    local timeout="${3:-60}"
    local interval=2
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        local response
        response=$(api_get "/v1/jobs/${job_name}/executions" 2>/dev/null)
        local body
        body=$(get_response_body "$response")
        
        local success_count
        success_count=$(echo "$body" | jq '[.[] | select(.success == true)] | length' 2>/dev/null || echo "0")
        
        if [ "$success_count" -ge "$expected_count" ]; then
            return 0
        fi
        
        sleep "$interval"
        elapsed=$((elapsed + interval))
    done
    
    echo "Timeout waiting for $expected_count successful executions" >&2
    return 1
}

# ============================================================================
# Job Helpers
# ============================================================================

# Create a simple shell job
# Usage: create_shell_job "test-job" "@every 10s" "echo hello"
create_shell_job() {
    local name="$1"
    local schedule="$2"
    local command="$3"
    local disabled="${4:-false}"
    
    local job_json
    job_json=$(cat <<EOF
{
    "name": "$name",
    "schedule": "$schedule",
    "disabled": $disabled,
    "executor": "shell",
    "executor_config": {
        "command": "$command"
    }
}
EOF
)
    
    api_post "/v1/jobs" "$job_json"
}

# Create a job that will fail
# Usage: create_failing_job "fail-job" "@every 10s"
create_failing_job() {
    local name="$1"
    local schedule="$2"
    
    create_shell_job "$name" "$schedule" "exit 1"
}

# Create a job with tags
# Usage: create_tagged_job "test-job" "@every 10s" "echo hello" "role:worker"
create_tagged_job() {
    local name="$1"
    local schedule="$2"
    local command="$3"
    local tags="$4"
    
    local job_json
    job_json=$(cat <<EOF
{
    "name": "$name",
    "schedule": "$schedule",
    "executor": "shell",
    "executor_config": {
        "command": "$command"
    },
    "tags": {
        $tags
    }
}
EOF
)
    
    api_post "/v1/jobs" "$job_json"
}

# Delete a job (ignore errors)
# Usage: delete_job "test-job"
delete_job() {
    local name="$1"
    api_delete "/v1/jobs/${name}" > /dev/null 2>&1 || true
}

# Run a job manually
# Usage: run_job "test-job"
run_job() {
    local name="$1"
    api_post "/v1/jobs/${name}/run" ""
}

# Toggle a job (enable/disable)
# Usage: toggle_job "test-job"
toggle_job() {
    local name="$1"
    api_post "/v1/jobs/${name}/toggle" ""
}

# Get job details
# Usage: get_job "test-job"
get_job() {
    local name="$1"
    api_get "/v1/jobs/${name}"
}

# Get job executions
# Usage: get_executions "test-job"
get_executions() {
    local name="$1"
    api_get "/v1/jobs/${name}/executions"
}

# ============================================================================
# Cleanup Helpers
# ============================================================================

# Clean up all test jobs (jobs starting with "test-" or "e2e-")
cleanup_test_jobs() {
    local response
    response=$(api_get "/v1/jobs")
    local body
    body=$(get_response_body "$response")
    
    local job_names
    job_names=$(echo "$body" | jq -r '.[] | select(.name | test("^(test-|e2e-)")) | .name' 2>/dev/null || echo "")
    
    for job_name in $job_names; do
        delete_job "$job_name"
    done
}

# ============================================================================
# Assertion Helpers (for use with bats)
# ============================================================================

# Assert HTTP status code
# Usage: assert_status 200 "$response"
assert_status() {
    local expected="$1"
    local response="$2"
    local actual
    actual=$(get_status_code "$response")
    
    if [ "$actual" != "$expected" ]; then
        echo "Expected status $expected, got $actual" >&2
        echo "Response: $(get_response_body "$response")" >&2
        return 1
    fi
}

# Assert JSON field value
# Usage: assert_json_value "test-job" ".name" "$body"
assert_json_value() {
    local expected="$1"
    local field="$2"
    local json="$3"
    local actual
    actual=$(json_get "$json" "$field")
    
    if [ "$actual" != "$expected" ]; then
        echo "Expected $field to be '$expected', got '$actual'" >&2
        return 1
    fi
}

# Assert JSON field exists and is not null/empty
# Usage: assert_json_exists ".name" "$body"
assert_json_exists() {
    local field="$1"
    local json="$2"
    local value
    value=$(json_get "$json" "$field")
    
    if [ -z "$value" ] || [ "$value" = "null" ]; then
        echo "Expected $field to exist and not be null" >&2
        return 1
    fi
}

# Assert array length
# Usage: assert_array_length 3 "$body"
assert_array_length() {
    local expected="$1"
    local json="$2"
    local actual
    actual=$(json_array_length "$json")
    
    if [ "$actual" != "$expected" ]; then
        echo "Expected array length $expected, got $actual" >&2
        return 1
    fi
}

# Assert array length is at least N
# Usage: assert_array_min_length 1 "$body"
assert_array_min_length() {
    local min="$1"
    local json="$2"
    local actual
    actual=$(json_array_length "$json")
    
    if [ "$actual" -lt "$min" ]; then
        echo "Expected array length at least $min, got $actual" >&2
        return 1
    fi
}
