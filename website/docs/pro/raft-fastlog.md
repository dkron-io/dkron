# Raft FastLog

Dkron Pro supports the [Raft FastLog](https://github.com/tidwall/raft-fastlog) storage engine for Raft state. FastLog keeps the Raft log in memory for fast access while persisting it to disk, which can reduce Raft write latency and improve throughput compared to the default BoltDB-backed Raft log.

## Overview

FastLog is optimized for Raft's append-heavy write pattern. It is a good fit when the default Raft storage becomes a bottleneck for cluster coordination, scheduling activity, or leader-side state changes.

Typical reasons to evaluate FastLog include:

- **Higher Raft throughput** for write-heavy workloads
- **Lower commit latency** for Raft log operations
- **Faster in-memory access** to recent Raft log entries
- **Durability tuning** through the `--raft-duration` setting

FastLog is most useful when you are running busy production clusters, scheduling a high volume of jobs, or trying to reduce the overhead of Raft log persistence.

## Configuration

Enable FastLog with the `--fast` flag when starting Dkron Pro.

### CLI example

```bash
dkron agent --server --bootstrap-expect=3 --fast --raft-duration=0
```

### Environment variables

```bash
DKRON_FAST=true
DKRON_RAFT_DURATION=0
```

### Config file

```yaml
fast: true
raft-duration: 0
```

## Durability and performance tuning

The `--raft-duration` flag controls how aggressively FastLog flushes Raft log data to disk. Lower values favor performance. Higher values favor durability.

| Value | Mode | Behavior | Trade-off |
|-------|------|----------|-----------|
| `-1` | Low | No explicit fsync by FastLog | Highest performance, highest risk of losing recent writes after a crash or power loss |
| `0` | Mid | Fsync approximately once per second | Default setting and the best starting point for most deployments |
| `1` | High | Fsync on every change | Strongest durability, lowest write throughput |

For most clusters, start with `--raft-duration=0`. Move to `1` if you need the strongest durability guarantees, or test `-1` only if you fully understand the crash-recovery trade-off.

## When to use FastLog

FastLog is a good option when:

- You are running a busy production cluster with frequent scheduling activity.
- Raft log persistence is contributing noticeable latency.
- You want more control over the durability/performance trade-off for Raft writes.
- You are scaling the server side of the cluster and want to reduce Raft storage overhead.

If your cluster is small and Raft storage is not a bottleneck, BoltDB may remain the simpler default choice.

## Operational considerations

### Storage format compatibility

FastLog uses a different on-disk format than BoltDB. The Raft storage files are not interchangeable.

:::warning
Do not point a FastLog-enabled node at an existing BoltDB Raft data directory and expect it to reuse the old log files. Treat the switch as a storage migration.
:::

### Migration from BoltDB

Switching an existing cluster from BoltDB to FastLog should be planned as a maintenance operation.

1. Stop all Dkron server nodes in the cluster.
2. Back up the existing `data-dir` on every node.
3. Remove or archive the existing Raft log data.
4. Restart the cluster with `--fast` enabled on every server node.
5. Verify cluster health, leadership, and job scheduling after the cluster comes back.

Because the storage formats differ, you should not mix old BoltDB Raft state with a FastLog deployment.

### Rollout guidance

- **Test in staging first** using a workload that resembles production.
- **Monitor memory usage** because FastLog keeps the Raft log in memory for fast access.
- **Watch disk latency and Raft health** after rollout, especially if you change `--raft-duration`.
- **Keep backups** of your cluster data before changing Raft storage settings.

## Summary

FastLog gives Dkron Pro operators a faster Raft storage backend with configurable durability. Enable it with `--fast`, tune it with `--raft-duration`, and plan migrations carefully because the underlying storage format is different from BoltDB.
