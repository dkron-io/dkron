// Package types provides type definitions for the Dkron API.
// This package re-exports types from various packages for convenience and backwards compatibility.
// It bridges between internal Go types (dkron package) and protobuf-generated types (gen/proto/types/v1).
package types

import (
	// Import internal dkron types for core job and execution data structures
	"github.com/distribworks/dkron/v4/dkron"
	// Import protobuf-generated types for cluster member and policy structures
	typesv1 "github.com/distribworks/dkron/v4/gen/proto/types/v1"
)

// Job represents a scheduled job. Re-exported from dkron package.
type Job = dkron.Job

// Execution represents a job execution. Re-exported from dkron package.
type Execution = dkron.Execution

// Member represents a cluster member. Re-exported from protobuf-generated types.
type Member = typesv1.Member

// Policy represents a policy. Re-exported from protobuf-generated types.
type Policy = typesv1.Policy
