---
title: Embedded storage
---

Dkron keeps its cluster state on the server nodes that participate in Raft. The state machine uses an embedded store and Raft persists the replicated log and snapshots under the node's `data-dir`.

This design keeps the default deployment simple. You do not need to run a separate database just to store job definitions, execution metadata, and the Raft state that coordinates the cluster.

## What Dkron stores

At a high level, Dkron stores:

- job definitions and schedules
- recent execution metadata and status
- Raft log entries and snapshots for cluster coordination

The embedded state store is part of the Dkron server itself, and the replicated cluster state is persisted through Raft.

## Where the data lives

Server nodes store their cluster data under the configured `data-dir`. By default, that directory is `dkron.data`.

Important paths include:

- `data-dir/raft` for Raft snapshots and Raft log data
- `data-dir/raft/raft.db` when using the default BoltDB-backed Raft log
- `data-dir/raft/peers.json` only when performing a manual quorum recovery procedure

Agent-only nodes execute jobs, but they do not hold the authoritative Raft state for the cluster.

## Backup guidance

Use the backup method that matches what you need to recover:

- **Jobs export and restore**: export `/v1/jobs` and keep the resulting `backup.json` file
- **Cluster state recovery**: back up the `data-dir` of the server nodes, especially the `raft` directory

:::warning
Exporting `/v1/jobs` is not the same as taking a full snapshot of the cluster. It restores jobs from the exported payload, but it does not recreate Raft state or execution history.
:::

## Operational notes

- Back up server data before changing storage-related settings.
- If you are switching Raft storage backends in Dkron Pro, treat it as a storage migration.
- Keep recovery procedures such as `raft/peers.json` for outage scenarios only.
- Test your backup and restore process in staging before relying on it in production.
