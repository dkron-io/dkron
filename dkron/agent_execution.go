package dkron

import (
	"errors"

	typesv1 "github.com/distribworks/dkron/v4/gen/proto/types/v1"
)

func (a *Agent) applySetExecution(execution *typesv1.Execution) error {
	cmd, err := Encode(SetExecutionType, execution)
	if err != nil {
		return err
	}

	af := a.RaftApply(cmd)
	if af == nil {
		return errors.New("raft apply unavailable")
	}

	return af.Error()
}
