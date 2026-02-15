#!/usr/bin/env bats
# e2e/tests/04_pause_unpause.bats
# Tests for pause/unpause functionality

load '../lib/helpers'

setup_file() {
    # Wait for the API to be ready before running tests
    wait_for_api 60
}

teardown_file() {
    # Ensure system is unpaused after tests
    api_post "/v1/unpause" "" > /dev/null 2>&1 || true
}

setup() {
    # Generate unique job name for each test
    export TEST_JOB_NAME="e2e-pause-$(date +%s%N | md5sum | head -c 8)"
    # Ensure we start unpaused
    api_post "/v1/unpause" "" > /dev/null 2>&1 || true
}

teardown() {
    # Clean up the test job
    delete_job "$TEST_JOB_NAME" || true
    # Ensure we're unpaused after each test
    api_post "/v1/unpause" "" > /dev/null 2>&1 || true
}

# ============================================================================
# Pause Status Tests
# ============================================================================

@test "GET /v1/pause returns pause status" {
    response=$(api_get "/v1/pause")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "GET /v1/pause returns paused field" {
    response=$(api_get "/v1/pause")
    body=$(get_response_body "$response")
    
    # Should have a paused field (boolean)
    paused=$(json_get "$body" ".paused")
    [ "$paused" = "true" ] || [ "$paused" = "false" ]
}

# ============================================================================
# Pause Tests
# ============================================================================

@test "POST /v1/pause pauses job submissions" {
    response=$(api_post "/v1/pause" "")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "POST /v1/pause sets paused to true" {
    api_post "/v1/pause" ""
    
    response=$(api_get "/v1/pause")
    body=$(get_response_body "$response")
    
    paused=$(json_get "$body" ".paused")
    [ "$paused" = "true" ]
}

@test "POST /v1/pause is idempotent" {
    # Pause twice
    api_post "/v1/pause" ""
    response=$(api_post "/v1/pause" "")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
    
    # Should still be paused
    response=$(api_get "/v1/pause")
    body=$(get_response_body "$response")
    paused=$(json_get "$body" ".paused")
    
    [ "$paused" = "true" ]
}

# ============================================================================
# Unpause Tests
# ============================================================================

@test "POST /v1/unpause unpauses job submissions" {
    # First pause
    api_post "/v1/pause" ""
    
    # Then unpause
    response=$(api_post "/v1/unpause" "")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "POST /v1/unpause sets paused to false" {
    # First pause
    api_post "/v1/pause" ""
    
    # Then unpause
    api_post "/v1/unpause" ""
    
    response=$(api_get "/v1/pause")
    body=$(get_response_body "$response")
    
    paused=$(json_get "$body" ".paused")
    [ "$paused" = "false" ]
}

@test "POST /v1/unpause is idempotent" {
    # Unpause twice
    api_post "/v1/unpause" ""
    response=$(api_post "/v1/unpause" "")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
    
    # Should still be unpaused
    response=$(api_get "/v1/pause")
    body=$(get_response_body "$response")
    paused=$(json_get "$body" ".paused")
    
    [ "$paused" = "false" ]
}

# ============================================================================
# Pause Effect on Job Execution Tests
# ============================================================================

@test "Job creation is blocked when paused" {
    # Pause the system first
    local _pause_resp
    _pause_resp=$(api_post "/v1/pause" "")
    
    # Small delay to ensure pause is effective
    sleep 1
    
    # Try to create a job while paused - should fail with 503
    local job_json='{
        "name": "'"$TEST_JOB_NAME"'",
        "schedule": "@every 1h",
        "disabled": false,
        "executor": "shell",
        "executor_config": {
            "command": "echo should-not-create"
        }
    }'
    
    local response
    response=$(api_post "/v1/jobs" "$job_json")
    local status
    status=$(get_status_code "$response")
    
    # Job creation should be blocked (503 Service Unavailable)
    [ "$status" = "503" ]
    
    # Verify the job was NOT created
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}")
    status=$(get_status_code "$response")
    
    # Should return 404 (job doesn't exist)
    [ "$status" = "404" ]
}

@test "Jobs resume executing after unpause" {
    # Create an enabled job with quick schedule
    job_json='{
        "name": "'"$TEST_JOB_NAME"'",
        "schedule": "@every 3s",
        "disabled": false,
        "executor": "shell",
        "executor_config": {
            "command": "echo resumed-test"
        }
    }'
    
    response=$(api_post "/v1/jobs" "$job_json")
    status=$(get_status_code "$response")
    [ "$status" = "201" ]
    
    # Pause the system
    api_post "/v1/pause" ""
    
    # Clear any existing executions
    api_delete "/v1/jobs/${TEST_JOB_NAME}/executions" > /dev/null 2>&1 || true
    
    # Unpause the system
    api_post "/v1/unpause" ""
    
    # Wait for execution
    wait_for_successful_executions "$TEST_JOB_NAME" 1 30
    
    # Verify execution happened
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    count=$(json_array_length "$body")
    
    [ "$count" -ge 1 ]
}

@test "Manual job execution works when paused" {
    # Create an ENABLED job (disabled jobs cannot be run manually)
    local _cr
    _cr=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo manual-run" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    # Pause the system
    api_post "/v1/pause" ""
    
    # Trigger manual execution via /run endpoint - this should still work
    response=$(api_post "/v1/jobs/${TEST_JOB_NAME}/run" "")
    status=$(get_status_code "$response")
    
    # Manual execution should be accepted even when paused
    [ "$status" = "200" ]
    
    # Wait for execution
    wait_for_execution "$TEST_JOB_NAME" 30
    
    # Verify execution happened
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    count=$(json_array_length "$body")
    
    [ "$count" -ge 1 ]
}
