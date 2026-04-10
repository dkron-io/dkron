# Cross region failover

:::warning
This feature is experimental and should be handled with care.
:::

Dkron Pro can run federated across regions and use failover mode to operate two clusters in an active-passive topology. This lets you keep a secondary region ready for recovery if the primary region becomes unavailable.

## Overview

In a cross-region failover setup, one cluster handles the active workload and the secondary cluster is kept ready to take over when needed. The Pro agent exposes federation settings for this mode through the Pro configuration surface.

Use this feature when you need a disaster-recovery strategy across regions and you are prepared to run and test two clusters as a coordinated system.

## Operational guidance

- Define clearly which region is active and which region is passive.
- Make sure only one cluster is actively responsible for a given workload at a time.
- Keep job definitions, tags, credentials, and network access consistent across both regions.
- Test failover and failback in staging before relying on the setup in production.
- Monitor both clusters during drills and after a real failover event.

## Configuration notes

The Pro agent exposes `--federation-mode` for cross-region federation. Keep the rest of the cluster configuration aligned between regions, especially node tags, networking, and any integrations your jobs depend on.

## Before production rollout

Before enabling cross-region failover in production:

1. Document the failover decision criteria.
2. Write a runbook for promotion and rollback.
3. Verify that critical jobs are safe to restart or re-run after failover.
4. Practice the procedure with realistic traffic and job schedules.

Because this feature is experimental, treat the first rollout as an operational exercise rather than a one-time configuration task.
