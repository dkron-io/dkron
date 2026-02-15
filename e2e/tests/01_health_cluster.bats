#!/usr/bin/env bats
# e2e/tests/01_health_cluster.bats
# Tests for health checks and cluster endpoints

load '../lib/helpers'

setup_file() {
    # Wait for the API to be ready before running tests
    wait_for_api 60
}

# ============================================================================
# Health Endpoint Tests
# ============================================================================

@test "GET /health returns 200" {
    response=$(api_get "/health")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "GET /health returns healthy status" {
    response=$(api_get "/health")
    body=$(get_response_body "$response")
    
    # Health endpoint should return some indication of health
    [ -n "$body" ]
}

# ============================================================================
# API Index Tests
# ============================================================================

@test "GET /v1 returns 200" {
    response=$(api_get "/v1")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "GET /v1 returns agent information" {
    response=$(api_get "/v1")
    body=$(get_response_body "$response")
    
    # Should contain agent field
    agent=$(json_get "$body" ".agent")
    [ -n "$agent" ]
    [ "$agent" != "null" ]
}

@test "GET /v1/ (with trailing slash) returns 200" {
    response=$(api_get "/v1/")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

# ============================================================================
# Cluster Members Tests
# ============================================================================

@test "GET /v1/members returns 200" {
    response=$(api_get "/v1/members")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "GET /v1/members returns array of members" {
    response=$(api_get "/v1/members")
    body=$(get_response_body "$response")
    
    # Should be a JSON array
    length=$(json_array_length "$body")
    [ "$length" -ge 1 ]
}

@test "GET /v1/members includes leader node" {
    response=$(api_get "/v1/members")
    body=$(get_response_body "$response")
    
    # Should have at least one member with Name field
    has_name=$(echo "$body" | jq '.[0].Name != null' 2>/dev/null)
    [ "$has_name" = "true" ]
}

@test "GET /v1/members includes member status" {
    response=$(api_get "/v1/members")
    body=$(get_response_body "$response")
    
    # Members should have Status field (1 = alive)
    has_status=$(echo "$body" | jq 'all(.[]; .Status != null)' 2>/dev/null)
    [ "$has_status" = "true" ]
}

@test "GET /v1/members includes member tags" {
    response=$(api_get "/v1/members")
    body=$(get_response_body "$response")
    
    # Members should have Tags field
    has_tags=$(echo "$body" | jq 'all(.[]; .Tags != null)' 2>/dev/null)
    [ "$has_tags" = "true" ]
}

@test "Cluster has expected number of members (at least 1)" {
    # Wait for cluster to stabilize
    wait_for_cluster_members 1 30
    
    response=$(api_get "/v1/members")
    body=$(get_response_body "$response")
    
    length=$(json_array_length "$body")
    [ "$length" -ge 1 ]
}

# ============================================================================
# Leader Tests
# ============================================================================

@test "GET /v1/leader returns 200" {
    response=$(api_get "/v1/leader")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "GET /v1/leader returns leader information" {
    response=$(api_get "/v1/leader")
    body=$(get_response_body "$response")
    
    # Should contain Name field
    name=$(json_get "$body" ".Name")
    [ -n "$name" ]
    [ "$name" != "null" ]
}

@test "GET /v1/leader returns leader with address" {
    response=$(api_get "/v1/leader")
    body=$(get_response_body "$response")
    
    # Should contain Addr field
    addr=$(json_get "$body" ".Addr")
    [ -n "$addr" ]
    [ "$addr" != "null" ]
}

@test "GET /v1/isleader returns 200" {
    response=$(api_get "/v1/isleader")
    status=$(get_status_code "$response")
    
    # Should return 200 if this node is leader, or might redirect
    # The leader node should return 200
    [ "$status" = "200" ] || [ "$status" = "307" ]
}

# ============================================================================
# Busy Jobs Tests
# ============================================================================

@test "GET /v1/busy returns 200" {
    response=$(api_get "/v1/busy")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "GET /v1/busy returns array" {
    response=$(api_get "/v1/busy")
    body=$(get_response_body "$response")
    
    # Should be a JSON array (even if empty)
    is_array=$(echo "$body" | jq 'type == "array"' 2>/dev/null)
    [ "$is_array" = "true" ]
}

# ============================================================================
# Debug/Metrics Endpoints
# ============================================================================

@test "GET /debug/vars returns 200" {
    response=$(api_get "/debug/vars")
    status=$(get_status_code "$response")
    
    [ "$status" = "200" ]
}

@test "GET /debug/vars returns expvar data" {
    response=$(api_get "/debug/vars")
    body=$(get_response_body "$response")
    
    # Should contain cmdline or memstats
    has_data=$(echo "$body" | jq 'has("cmdline") or has("memstats")' 2>/dev/null)
    [ "$has_data" = "true" ]
}
