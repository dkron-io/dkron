#!/usr/bin/env bats
# e2e/tests/02_jobs_crud.bats
# Tests for Job CRUD operations

load '../lib/helpers'

setup_file() {
    # Wait for the API to be ready before running tests
    wait_for_api 60
}

setup() {
    # Generate unique job name for each test to avoid conflicts
    export TEST_JOB_NAME="e2e-test-job-$(date +%s%N | md5sum | head -c 8)"
}

teardown() {
    # Clean up the test job
    delete_job "$TEST_JOB_NAME" || true
}

# ============================================================================
# List Jobs Tests
# ============================================================================

@test "GET /v1/jobs returns 200" {
    response=$(api_get "/v1/jobs")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "GET /v1/jobs returns array" {
    response=$(api_get "/v1/jobs")
    body=$(get_response_body "$response")
    
    is_array=$(echo "$body" | jq 'type == "array"' 2>/dev/null)
    [ "$is_array" = "true" ]
}

# ============================================================================
# Create Job Tests
# ============================================================================

@test "POST /v1/jobs creates a new job" {
    response=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello")
    status=$(get_status_code "$response")
    
    [ "$status" = "201" ]
}

@test "POST /v1/jobs returns the created job" {
    response=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello")
    body=$(get_response_body "$response")
    
    name=$(json_get "$body" ".name")
    [ "$name" = "$TEST_JOB_NAME" ]
}

@test "POST /v1/jobs sets correct schedule" {
    response=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello")
    body=$(get_response_body "$response")
    
    schedule=$(json_get "$body" ".schedule")
    [ "$schedule" = "@every 1h" ]
}

@test "POST /v1/jobs sets correct executor" {
    response=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello")
    body=$(get_response_body "$response")
    
    executor=$(json_get "$body" ".executor")
    [ "$executor" = "shell" ]
}

@test "POST /v1/jobs sets executor config" {
    response=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello")
    body=$(get_response_body "$response")
    
    command=$(json_get "$body" ".executor_config.command")
    [ "$command" = "echo hello" ]
}

@test "POST /v1/jobs with invalid schedule returns 422" {
    job_json='{
        "name": "'"$TEST_JOB_NAME"'",
        "schedule": "invalid-schedule",
        "executor": "shell",
        "executor_config": {
            "command": "echo hello"
        }
    }'
    
    response=$(api_post "/v1/jobs" "$job_json")
    status=$(get_status_code "$response")
    
    # Should return 422 Unprocessable Entity for invalid schedule
    [ "$status" = "422" ] || [ "$status" = "400" ]
}

@test "POST /v1/jobs with missing name returns error" {
    job_json='{
        "schedule": "@every 1h",
        "executor": "shell",
        "executor_config": {
            "command": "echo hello"
        }
    }'
    
    response=$(api_post "/v1/jobs" "$job_json")
    status=$(get_status_code "$response")
    
    # Should return error status (400 or 422)
    [ "$status" = "400" ] || [ "$status" = "422" ]
}

@test "POST /v1/jobs can create disabled job" {
    response=$(create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello" "true")
    body=$(get_response_body "$response")
    status=$(get_status_code "$response")
    
    [ "$status" = "201" ]
    
    disabled=$(json_get "$body" ".disabled")
    [ "$disabled" = "true" ]
}

# ============================================================================
# Get Job Tests
# ============================================================================

@test "GET /v1/jobs/:job returns the job" {
    # Create job first
    create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello"
    
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}")
    status=$(get_status_code "$response")
    body=$(get_response_body "$response")
    
    [ "$status" = "200" ]
    
    name=$(json_get "$body" ".name")
    [ "$name" = "$TEST_JOB_NAME" ]
}

@test "GET /v1/jobs/:job returns 404 for non-existent job" {
    response=$(api_get "/v1/jobs/non-existent-job-12345")
    status=$(get_status_code "$response")
    
    [ "$status" = "404" ]
}

@test "GET /v1/jobs/:job returns all job fields" {
    create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello"
    
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}")
    body=$(get_response_body "$response")
    
    # Check required fields exist
    name=$(json_get "$body" ".name")
    schedule=$(json_get "$body" ".schedule")
    executor=$(json_get "$body" ".executor")
    
    [ "$name" != "null" ]
    [ "$schedule" != "null" ]
    [ "$executor" != "null" ]
}

# ============================================================================
# Update Job Tests
# ============================================================================

@test "PUT /v1/jobs/:job updates the job" {
    # Create job first
    create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello"
    
    # Update job
    job_json='{
        "name": "'"$TEST_JOB_NAME"'",
        "schedule": "@every 2h",
        "executor": "shell",
        "executor_config": {
            "command": "echo updated"
        }
    }'
    
    response=$(api_put "/v1/jobs/${TEST_JOB_NAME}" "$job_json")
    status=$(get_status_code "$response")
    body=$(get_response_body "$response")
    
    [ "$status" = "200" ] || [ "$status" = "201" ]
    
    schedule=$(json_get "$body" ".schedule")
    [ "$schedule" = "@every 2h" ]
}

@test "PATCH /v1/jobs can update job" {
    # Create job first
    create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello"
    
    # Update job via PATCH
    job_json='{
        "name": "'"$TEST_JOB_NAME"'",
        "schedule": "@every 30m",
        "executor": "shell",
        "executor_config": {
            "command": "echo patched"
        }
    }'
    
    response=$(api_patch "/v1/jobs" "$job_json")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ] || [ "$status" = "201" ]
}

# ============================================================================
# Delete Job Tests
# ============================================================================

@test "DELETE /v1/jobs/:job deletes the job" {
    # Create job first
    create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello"
    
    # Verify it exists
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}")
    status=$(get_status_code "$response")
    [ "$status" = "200" ]
    
    # Delete the job
    response=$(api_delete "/v1/jobs/${TEST_JOB_NAME}")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "DELETE /v1/jobs/:job removes job from list" {
    # Create job first
    create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello"
    
    # Delete the job
    api_delete "/v1/jobs/${TEST_JOB_NAME}"
    
    # Verify it's gone
    response=$(api_get "/v1/jobs/${TEST_JOB_NAME}")
    status=$(get_status_code "$response")
    
    [ "$status" = "404" ]
}

@test "DELETE /v1/jobs/:job returns 404 for non-existent job" {
    response=$(api_delete "/v1/jobs/non-existent-job-12345")
    status=$(get_status_code "$response")
    
    [ "$status" = "404" ]
}

# ============================================================================
# Toggle Job Tests
# ============================================================================

@test "POST /v1/jobs/:job/toggle disables enabled job" {
    # Create enabled job
    create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello" "false"
    
    # Toggle it (should disable)
    response=$(api_post "/v1/jobs/${TEST_JOB_NAME}/toggle" "")
    status=$(get_status_code "$response")
    body=$(get_response_body "$response")
    
    [ "$status" = "200" ]
    
    disabled=$(json_get "$body" ".disabled")
    [ "$disabled" = "true" ]
}

@test "POST /v1/jobs/:job/toggle enables disabled job" {
    # Create disabled job
    create_shell_job "$TEST_JOB_NAME" "@every 1h" "echo hello" "true"
    
    # Toggle it (should enable)
    response=$(api_post "/v1/jobs/${TEST_JOB_NAME}/toggle" "")
    status=$(get_status_code "$response")
    body=$(get_response_body "$response")
    
    [ "$status" = "200" ]
    
    disabled=$(json_get "$body" ".disabled")
    [ "$disabled" = "false" ]
}

@test "POST /v1/jobs/:job/toggle returns 404 for non-existent job" {
    response=$(api_post "/v1/jobs/non-existent-job-12345/toggle" "")
    status=$(get_status_code "$response")
    
    [ "$status" = "404" ]
}

# ============================================================================
# Job with Complex Configuration
# ============================================================================

@test "Create job with retries configuration" {
    job_json='{
        "name": "'"$TEST_JOB_NAME"'",
        "schedule": "@every 1h",
        "executor": "shell",
        "executor_config": {
            "command": "echo hello"
        },
        "retries": 3
    }'
    
    response=$(api_post "/v1/jobs" "$job_json")
    body=$(get_response_body "$response")
    status=$(get_status_code "$response")
    
    [ "$status" = "201" ]
    
    retries=$(json_get "$body" ".retries")
    [ "$retries" = "3" ]
}

@test "Create job with timezone" {
    # When using timezone, Dkron requires a 6-field cron expression (with seconds)
    job_json='{
        "name": "'"$TEST_JOB_NAME"'",
        "schedule": "0 0 0 * * *",
        "timezone": "America/New_York",
        "executor": "shell",
        "executor_config": {
            "command": "echo hello"
        }
    }'
    
    response=$(api_post "/v1/jobs" "$job_json")
    body=$(get_response_body "$response")
    status=$(get_status_code "$response")
    
    # Accept both 200 (update) and 201 (create)
    [ "$status" = "201" ] || [ "$status" = "200" ]
    
    timezone=$(json_get "$body" ".timezone")
    [ "$timezone" = "America/New_York" ]
}

@test "Create job with concurrency policy" {
    job_json='{
        "name": "'"$TEST_JOB_NAME"'",
        "schedule": "@every 1h",
        "executor": "shell",
        "executor_config": {
            "command": "echo hello"
        },
        "concurrency": "forbid"
    }'
    
    response=$(api_post "/v1/jobs" "$job_json")
    body=$(get_response_body "$response")
    status=$(get_status_code "$response")
    
    [ "$status" = "201" ]
    
    concurrency=$(json_get "$body" ".concurrency")
    [ "$concurrency" = "forbid" ]
}
