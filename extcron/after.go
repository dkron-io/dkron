package extcron

import (
	"sync"
	"time"
)

// AfterSchedule represents a schedule that runs once at a specific time,
// with a grace period during which it can still run immediately if missed.
type AfterSchedule struct {
	Date        time.Time
	GracePeriod time.Duration

	mu       sync.Mutex
	consumed bool
}

// After creates an AfterSchedule with the given date and grace period.
func After(date time.Time, gracePeriod time.Duration) *AfterSchedule {
	return &AfterSchedule{
		Date:        date,
		GracePeriod: gracePeriod,
	}
}

// Next conforms to the Schedule interface.
// It returns:
// - The scheduled date if current time is before the scheduled date
// - A near-immediate future time if current time is within grace period after the scheduled date
// - Zero time (never runs) if current time is beyond the grace period
func (schedule *AfterSchedule) Next(t time.Time) time.Time {
	schedule.mu.Lock()
	defer schedule.mu.Unlock()

	if schedule.consumed {
		return time.Time{}
	}

	// If the date is after the reference time, return it
	if schedule.Date.After(t) {
		return schedule.Date
	}

	// If we're within the grace period (including the exact end moment), run once immediately.
	// The cron.Schedule contract requires returning a time later than t.
	gracePeriodEnd := schedule.Date.Add(schedule.GracePeriod)
	if !t.After(gracePeriodEnd) {
		schedule.consumed = true
		return t.Add(time.Nanosecond)
	}

	// Beyond grace period, never run
	return time.Time{}
}
