package dkron

import (
	"context"
	"testing"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel/trace/noop"
)

func TestExecutionStats(t *testing.T) {
	logger := logrus.NewEntry(logrus.New())
	tracer := noop.NewTracerProvider().Tracer("test")

	store, err := NewStore(logger, tracer)
	require.NoError(t, err)
	defer store.Shutdown()

	ctx := context.Background()
	now := time.Now()

	t.Run("IncrementExecutionStat creates new stat entry", func(t *testing.T) {
		err := store.IncrementExecutionStat(ctx, now, true)
		require.NoError(t, err)

		stats, err := store.GetExecutionStats(ctx, 1)
		require.NoError(t, err)
		require.Len(t, stats.Stats, 1)

		assert.Equal(t, 1, stats.Stats[0].SuccessCount)
		assert.Equal(t, 0, stats.Stats[0].FailedCount)
	})

	t.Run("IncrementExecutionStat increments existing stat", func(t *testing.T) {
		// Add another success
		err := store.IncrementExecutionStat(ctx, now, true)
		require.NoError(t, err)

		// Add a failure
		err = store.IncrementExecutionStat(ctx, now, false)
		require.NoError(t, err)

		stats, err := store.GetExecutionStats(ctx, 1)
		require.NoError(t, err)
		require.Len(t, stats.Stats, 1)

		assert.Equal(t, 2, stats.Stats[0].SuccessCount)
		assert.Equal(t, 1, stats.Stats[0].FailedCount)
	})

	t.Run("GetExecutionStats returns empty stats for missing days", func(t *testing.T) {
		// Create a new store to have clean data
		store2, err := NewStore(logger, tracer)
		require.NoError(t, err)
		defer store2.Shutdown()

		stats, err := store2.GetExecutionStats(ctx, 7)
		require.NoError(t, err)
		require.Len(t, stats.Stats, 7)

		// All should be zero
		for _, stat := range stats.Stats {
			assert.Equal(t, 0, stat.SuccessCount)
			assert.Equal(t, 0, stat.FailedCount)
		}
	})

	t.Run("GetExecutionStats returns stats in chronological order", func(t *testing.T) {
		store3, err := NewStore(logger, tracer)
		require.NoError(t, err)
		defer store3.Shutdown()

		// Add stats for yesterday
		yesterday := now.AddDate(0, 0, -1)
		err = store3.IncrementExecutionStat(ctx, yesterday, true)
		require.NoError(t, err)

		// Add stats for today
		err = store3.IncrementExecutionStat(ctx, now, false)
		require.NoError(t, err)

		stats, err := store3.GetExecutionStats(ctx, 2)
		require.NoError(t, err)
		require.Len(t, stats.Stats, 2)

		// First stat should be yesterday
		assert.Equal(t, 1, stats.Stats[0].SuccessCount)
		assert.Equal(t, 0, stats.Stats[0].FailedCount)

		// Second stat should be today
		assert.Equal(t, 0, stats.Stats[1].SuccessCount)
		assert.Equal(t, 1, stats.Stats[1].FailedCount)
	})

	t.Run("TotalExecutions returns sum of success and failed", func(t *testing.T) {
		stat := ExecutionStat{
			SuccessCount: 5,
			FailedCount:  3,
		}
		assert.Equal(t, 8, stat.TotalExecutions())
	})
}

func TestSetExecutionDoneUpdatesStats(t *testing.T) {
	logger := logrus.NewEntry(logrus.New())
	tracer := noop.NewTracerProvider().Tracer("test")

	store, err := NewStore(logger, tracer)
	require.NoError(t, err)
	defer store.Shutdown()

	ctx := context.Background()

	// Create a test job
	testJob := &Job{
		Name:           "stats-test-job",
		Schedule:       "@manually",
		Executor:       "shell",
		ExecutorConfig: map[string]string{"command": "/bin/true"},
	}

	err = store.SetJob(ctx, testJob, true)
	require.NoError(t, err)

	now := time.Now()

	// Create a successful execution
	exec1 := &Execution{
		JobName:    testJob.Name,
		Group:      now.UnixNano(),
		StartedAt:  now,
		FinishedAt: now.Add(time.Second),
		NodeName:   "test-node",
		Success:    true,
		Output:     "success output",
	}

	// SetExecutionDone should update the stats
	_, err = store.SetExecutionDone(ctx, exec1)
	require.NoError(t, err)

	// Check stats were updated
	stats, err := store.GetExecutionStats(ctx, 1)
	require.NoError(t, err)
	require.Len(t, stats.Stats, 1)
	assert.Equal(t, 1, stats.Stats[0].SuccessCount)
	assert.Equal(t, 0, stats.Stats[0].FailedCount)

	// Create a failed execution
	exec2 := &Execution{
		JobName:    testJob.Name,
		Group:      now.UnixNano() + 1,
		StartedAt:  now,
		FinishedAt: now.Add(time.Second),
		NodeName:   "test-node",
		Success:    false,
		Output:     "failed output",
	}

	_, err = store.SetExecutionDone(ctx, exec2)
	require.NoError(t, err)

	// Check stats were updated
	stats, err = store.GetExecutionStats(ctx, 1)
	require.NoError(t, err)
	require.Len(t, stats.Stats, 1)
	assert.Equal(t, 1, stats.Stats[0].SuccessCount)
	assert.Equal(t, 1, stats.Stats[0].FailedCount)
}
