---
title: Upgrade methods
---

# Upgrade methods

Use the upgrade method that matches the kind of change you are making. In most cases, a rolling upgrade is the safest option because it lets you replace nodes gradually while keeping the cluster available. Use backup and restore when you are building a fresh cluster, migrating to new infrastructure, or when release notes require a full rebuild instead of mixed-version operation.

## Before you start

Before upgrading any node:

1. Read the release notes for the target version and check whether mixed-version clusters are supported during the transition.
2. Make sure the current cluster is healthy and has quorum.
3. Export the current jobs so you have a recovery point:

```bash
curl -fsS http://localhost:8080/v1/jobs > backup.json
```

4. Inspect the current Raft peers so you know which server is the leader and which peer IDs are registered:

```bash
dkron raft list-peers
```

:::tip
When upgrading server nodes, it is usually best to leave the current leader for last. That reduces unnecessary leader elections while you rotate the rest of the cluster.
:::

## Rolling upgrade

Use a rolling upgrade when you want to keep the cluster online and the target version supports a gradual transition.

### Recommended order

1. Upgrade agent-only nodes first.
2. Upgrade follower server nodes one at a time.
3. Upgrade the leader last.

### Server rotation procedure

Use the following procedure to replace server nodes one at a time:

1. Add a new server running the target version and configure it to join the existing cluster.
2. Wait until the new server has joined successfully and the cluster is healthy.
3. Stop Dkron on one old server.
4. If that server was the leader, wait until a new leader is elected before continuing.
5. List the current peers and identify the old server's peer ID:

```bash
dkron raft list-peers
```

6. Remove the old server from the Raft configuration:

```bash
dkron raft remove-peer --peer-id <peer-id>
```

7. Confirm the cluster is healthy again.
8. Repeat the process until every old server has been replaced.

:::warning
Do not remove multiple server nodes at once. Dkron needs a healthy Raft quorum to continue scheduling jobs.
:::

## Backup and restore

Use backup and restore when you need to recreate the cluster on new infrastructure or when a rolling upgrade is not appropriate.

### Export jobs from the existing cluster

```bash
curl -fsS http://localhost:8080/v1/jobs > backup.json
```

### Restore jobs into the new cluster

After the new cluster is running and has elected a leader, restore the exported jobs file:

```bash
curl -fsS -X POST http://localhost:8080/v1/restore \
  --form 'file=@backup.json'
```

The restore endpoint expects a multipart form field named `file`. If a job in the file already exists in the target cluster, it is overwritten with the definition from the backup.

:::warning
This export and restore flow restores job definitions from the `/v1/jobs` payload. It should not be treated as a full cluster snapshot, and it does not recreate Raft state or execution history.
:::

## After the upgrade

After either method completes:

1. Run `dkron raft list-peers` and confirm the expected server set is present.
2. Verify that one node is leader and the cluster remains stable.
3. Check the UI or API and confirm the expected jobs are present.
4. Watch the next scheduled executions to ensure jobs are still running as expected.
5. Keep the exported `backup.json` until you are confident the upgrade is complete.
