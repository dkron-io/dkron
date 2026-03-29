package dkron

import (
	"context"
	"testing"
	"time"

	"github.com/hashicorp/serf/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestReconcileRunningExecutionOrphansCleansStaleExecutions(t *testing.T) {
	a := startTestLeaderAgent(t)
	defer func() {
		_ = a.Stop()
	}()

	ctx := context.Background()
	job := scaffoldJob()
	job.Name = "stale-running-job"
	require.NoError(t, a.Store.SetJob(ctx, job, false))

	staleExecution := &Execution{
		JobName:    job.Name,
		StartedAt:  time.Now().UTC().Add(-DefaultStaleExecutionThreshold - time.Minute),
		FinishedAt: time.Time{},
		Success:    false,
		Output:     "running",
		NodeName:   a.config.NodeName,
		Group:      time.Now().UTC().Add(-DefaultStaleExecutionThreshold - time.Minute).UnixNano(),
		Attempt:    1,
	}

	_, err := a.Store.SetExecution(ctx, staleExecution)
	require.NoError(t, err)

	err = a.reconcileRunningExecutionOrphans(ctx, []*Job{job}, map[string]struct{}{})
	require.NoError(t, err)

	runningExecs, err := a.Store.GetRunningExecutions(ctx, job.Name)
	require.NoError(t, err)
	assert.Empty(t, runningExecs)

	storedExecution, err := a.Store.GetExecution(ctx, job.Name, staleExecution.Key())
	require.NoError(t, err)
	assert.False(t, storedExecution.FinishedAt.IsZero())
	assert.False(t, storedExecution.Success)
	assert.Contains(t, storedExecution.Output, "Execution marked as failed: detected as stale")
}

func TestReconcileRunningExecutionOrphansLeavesRecentExecutions(t *testing.T) {
	a := startTestLeaderAgent(t)
	defer func() {
		_ = a.Stop()
	}()

	ctx := context.Background()
	job := scaffoldJob()
	job.Name = "recent-running-job"
	require.NoError(t, a.Store.SetJob(ctx, job, false))

	recentExecution := &Execution{
		JobName:    job.Name,
		StartedAt:  time.Now().UTC().Add(-10 * time.Minute),
		FinishedAt: time.Time{},
		Success:    false,
		Output:     "running",
		NodeName:   a.config.NodeName,
		Group:      time.Now().UTC().Add(-10 * time.Minute).UnixNano(),
		Attempt:    1,
	}

	_, err := a.Store.SetExecution(ctx, recentExecution)
	require.NoError(t, err)

	err = a.reconcileRunningExecutionOrphans(ctx, []*Job{job}, map[string]struct{}{})
	require.NoError(t, err)

	runningExecs, err := a.Store.GetRunningExecutions(ctx, job.Name)
	require.NoError(t, err)
	assert.Len(t, runningExecs, 1)
	assert.Equal(t, recentExecution.Key(), runningExecs[0].Key())

	storedExecution, err := a.Store.GetExecution(ctx, job.Name, recentExecution.Key())
	require.NoError(t, err)
	assert.True(t, storedExecution.FinishedAt.IsZero())
}

func startTestLeaderAgent(t *testing.T) *Agent {
	t.Helper()

	ip, returnFn := testutil.TakeIP()
	t.Cleanup(returnFn)

	c := DefaultConfig()
	c.BindAddr = ip.String()
	c.NodeName = "leader-test-" + time.Now().UTC().Format("150405.000000000")
	c.Server = true
	c.LogLevel = logLevel
	c.DevMode = true
	c.HTTPAddr = "127.0.0.1:0"

	a := NewAgent(c)
	require.NoError(t, a.Start())

	require.Eventually(t, func() bool {
		return a.IsLeader()
	}, 5*time.Second, 100*time.Millisecond)

	return a
}
