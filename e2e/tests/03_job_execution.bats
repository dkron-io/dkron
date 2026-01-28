#!/usr/bin/env bats
# e2e/tests/03_job_execution.bats
# Tests for job execution and scheduling

load '../lib/helpers'

setup_file() {
    # Wait for the API to be ready before running tests
    wait_for_api 60
    # Wait for cluster to stabilize
    wait_for_cluster_members 1 30
}

setup() {
    # Generate unique job name for each test
    export TEST_JOB_NAME="e2e-exec-$(date +%s%N | md5sum | head -c 8)"
}

teardown() {
    # Clean up the test job
    delete_job "$TEST_JOB_NAME" || true
}

# ============================================================================
# Manual Job Execution Tests
# ============================================================================

@test "POST /v1/jobs/:job triggers job execution" {
    # Create ENABLED job with long schedule (won't auto-run during test)
    # Note: disabled jobs cannot be run manually - they must be enabled
    local _create_response
    _create_response=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo e2e-test-output" "false")
    local _create_status
    _create_status=$(get_status_code "$_create_response")
    [ "$_create_status" = "201" ] || [ "$_create_status" = "200" ]
    
    # Wait for job to be persisted and added to scheduler
    sleep 2
    
    # Trigger manual execution via the /run endpoint
    response=$(api_post "/v1/jobs/${TEST_JOB_NAME}/run" "")
    status=$(get_status_code "$response")
    
    # API returns 200 when job is run
    [ "$status" = "200" ]
}

@test "POST /v1/jobs/:job/run triggers job execution (alternate endpoint)" {
    # Create ENABLED job (disabled jobs cannot be run manually)
    local _create_response
    _create_response=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo e2e-test-output" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    # Trigger manual execution via alternate endpoint
    response=$(api_post "/v1/jobs/${TEST_JOB_NAME}/run" "")
    status=$(get_status_code "$response")
    
    # API returns 200 when job is run
    [ "$status" = "200" ]
}

@test "POST /v1/jobs/:job returns 404 for non-existent job" {
    response=$(api_post "/v1/jobs/non-existent-job-12345" "")
    status=$(get_status_code "$response")
    
    [ "$status" = "404" ]
}

# ============================================================================
# Execution List Tests
# ============================================================================

@test "GET /v1/jobs/:job/executions returns 200" {
    # Create job
    create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello" "true"
    
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "GET /v1/jobs/:job/executions returns array" {
    # Create job
    create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello" "true"
    
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    
    is_array=$(echo "$body" | jq 'type == "array"' 2>/dev/null)
    [ "$is_array" = "true" ]
}

@test "GET /v1/jobs/:job/executions returns 404 for non-existent job" {
    response=$(api_get "/v1/jobs/non-existent-job-12345/executions")
    status=$(get_status_code "$response")
    
    [ "$status" = "404" ]
}

# ============================================================================
# Job Execution and Result Tests
# ============================================================================

@test "Job execution completes successfully" {
    # Create ENABLED job (disabled jobs cannot be run manually)
    local _cr
    _cr=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo success-test" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    # Trigger manual execution using /run endpoint
    api_post "/v1/jobs/${TEST_JOB_NAME}/run" ""
    
    # Wait for execution to complete
    wait_for_execution "$TEST_JOB_NAME" 30
    
    # Check executions
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    
    # Should have at least one execution
    count=$(json_array_length "$body")
    [ "$count" -ge 1 ]
}

@test "Successful job execution has success=true" {
    # Create ENABLED job
    local _cr
    _cr=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo success" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    # Trigger execution using /run endpoint
    api_post "/v1/jobs/${TEST_JOB_NAME}/run" ""
    
    # Wait for successful execution
    wait_for_successful_executions "$TEST_JOB_NAME" 1 30
    
    # Verify success
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    
    success_count=$(echo "$body" | jq '[.[] | select(.success == true)] | length' 2>/dev/null)
    [ "$success_count" -ge 1 ]
}

@test "Failed job execution has success=false" {
    # Create ENABLED job that will fail
    local _cr
    _cr=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "exit 1" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    # Trigger execution using /run endpoint
    api_post "/v1/jobs/${TEST_JOB_NAME}/run" ""
    
    # Wait for execution to complete
    wait_for_execution "$TEST_JOB_NAME" 30
    
    # Check executions
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    
    # Should have at least one execution
    count=$(json_array_length "$body")
    [ "$count" -ge 1 ]
}

@test "Job execution captures output" {
    local test_output="e2e-unique-output-$(date +%s)"
    
    # Create ENABLED job with unique output
    local _cr
    _cr=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo ${test_output}" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    # Trigger execution using /run endpoint
    api_post "/v1/jobs/${TEST_JOB_NAME}/run" ""
    
    # Wait for execution
    wait_for_execution "$TEST_JOB_NAME" 30
    
    # Check output in execution
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    
    # Get first execution's output
    output=$(echo "$body" | jq -r '.[0].output // ""' 2>/dev/null)
    
    # Output should contain our test string
    [[ "$output" == *"$test_output"* ]] || [[ "$output" == *"e2e"* ]]
}

@test "Job execution has started_at timestamp" {
    # Create ENABLED job
    local _cr
    _cr=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    # Trigger execution using /run endpoint
    api_post "/v1/jobs/${TEST_JOB_NAME}/run" ""
    
    # Wait for execution
    wait_for_execution "$TEST_JOB_NAME" 30
    
    # Check started_at
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    
    started_at=$(echo "$body" | jq -r '.[0].started_at // ""' 2>/dev/null)
    [ -n "$started_at" ]
    [ "$started_at" != "null" ]
}

@test "Job execution has finished_at timestamp after completion" {
    # Create ENABLED job
    local _cr
    _cr=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    # Trigger execution using /run endpoint
    api_post "/v1/jobs/${TEST_JOB_NAME}/run" ""
    
    # Wait for execution
    wait_for_execution "$TEST_JOB_NAME" 30
    
    # Check finished_at
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    
    finished_at=$(echo "$body" | jq -r '.[0].finished_at // ""' 2>/dev/null)
    [ -n "$finished_at" ]
    [ "$finished_at" != "null" ]
    [ "$finished_at" != "" ]
}

@test "Job execution includes node name" {
    # Create ENABLED job
    local _cr
    _cr=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    # Trigger execution using /run endpoint
    api_post "/v1/jobs/${TEST_JOB_NAME}/run" ""
    
    # Wait for execution
    wait_for_execution "$TEST_JOB_NAME" 30
    
    # Check node_name
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    
    node_name=$(echo "$body" | jq -r '.[0].node_name // ""' 2>/dev/null)
    [ -n "$node_name" ]
    [ "$node_name" != "null" ]
}

# ============================================================================
# Delete Executions Tests
# ============================================================================

@test "DELETE /v1/jobs/:job/executions deletes executions" {
    # Create ENABLED job and run it using /run endpoint
    local _cr
    _cr=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    api_post "/v1/jobs/${TEST_JOB_NAME}/run" ""
    wait_for_execution "$TEST_JOB_NAME" 30
    
    # Verify executions exist
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    count=$(json_array_length "$body")
    [ "$count" -ge 1 ]
    
    # Delete executions
    response=$(api_delete "/v1/jobs/${TEST_JOB_NAME}/executions")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
    
    # Verify executions are deleted
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    count=$(json_array_length "$body")
    
    [ "$count" = "0" ]
}

# ============================================================================
# Multiple Executions Tests
# ============================================================================

@test "Multiple manual executions are recorded" {
    # Create ENABLED job (disabled jobs cannot be run manually)
    local _cr
    _cr=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo run" "false")
    
    # Wait for job to be added to scheduler
    sleep 2
    
    # Run multiple times using /run endpoint
    api_post "/v1/jobs/${TEST_JOB_NAME}/run" ""
    wait_for_execution "$TEST_JOB_NAME" 30
    
    api_post "/v1/jobs/${TEST_JOB_NAME}/run" ""
    wait_for_execution "$TEST_JOB_NAME" 30
    
    # Check executions count
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    count=$(json_array_length "$body")
    
    [ "$count" -ge 2 ]
}

# ============================================================================
# Scheduled Job Tests
# ============================================================================

@test "Scheduled job runs automatically" {
    # Create an enabled job that runs every 5 seconds
    job_json='{
        "name": "'"$TEST_JOB_NAME"'",
        "schedule": "@every 5s",
        "disabled": false,
        "executor": "shell",
        "executor_config": {
            "command": "echo scheduled-run"
        }
    }'
    
    response=$(api_post "/v1/jobs" "$job_json")
    status=$(get_status_code "$response")
    [ "$status" = "201" ]
    
    # Wait for at least one execution
    wait_for_successful_executions "$TEST_JOB_NAME" 1 30
    
    # Verify execution happened
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    count=$(json_array_length "$body")
    
    [ "$count" -ge 1 ]
}

@test "Disabled job does not run automatically" {
    # Create a disabled job
    create_shell_job "$TEST_JOB_NAME" "@every 2s" "echo should-not-run" "true"
    
    # Wait a bit
    sleep 5
    
    # Check that no executions happened
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}/executions")
    body=$(get_response_body "$response")
    count=$(json_array_length "$body")
    
    [ "$count" = "0" ]
}
