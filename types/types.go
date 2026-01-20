// Package types provides type definitions for the Dkron API.
// This package re-exports types from various packages for convenience.
package types

import (
	"github.com/distribworks/dkron/v4/dkron"
	typesv1 "github.com/distribworks/dkron/v4/gen/proto/types/v1"
)

// Job represents a scheduled job
type Job = dkron.Job

// Execution represents a job execution
type Execution = dkron.Execution

// Member represents a cluster member
type Member = typesv1.Member

// Policy represents a policy
type Policy = typesv1.Policy
