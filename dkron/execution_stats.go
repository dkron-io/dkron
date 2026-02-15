package dkron

import "time"

// ExecutionStat represents aggregated execution statistics for a specific time period
type ExecutionStat struct {
	// Date is the date for which this stat is recorded (truncated to day)
	Date time.Time `json:"date"`
	// SuccessCount is the number of successful executions on this date
	SuccessCount int `json:"success_count"`
	// FailedCount is the number of failed executions on this date
	FailedCount int `json:"failed_count"`
}

// ExecutionStats is a collection of execution statistics
type ExecutionStats struct {
	Stats []ExecutionStat `json:"stats"`
}

// TotalExecutions returns the total number of executions
func (es *ExecutionStat) TotalExecutions() int {
	return es.SuccessCount + es.FailedCount
}
