---
title: Outage recovery
---

## Outage Recovery

Don't panic! This is a critical first step.

Depending on your deployment configuration, it may take only a single server failure for cluster unavailability. Recovery requires an operator to intervene, but the process is straightforward.

:::tip
This guide is for recovery from a Dkron outage due to a majority of server nodes in a datacenter being lost. If you are looking to add or remove servers, see the [clustering](/docs/usage/clustering) guide.
:::

## Failure of a Single Server Cluster

If you had only a single server and it has failed, first try to restart it. A single-server deployment requires `--bootstrap-expect=1`. If that server is unrecoverable, you need to rebuild the cluster on a new server and restore jobs from backup if you have one.

In the case of an unrecoverable server failure in a single server cluster, data loss is inevitable since data was not replicated to any other servers. This is why a single server deploy is never recommended.

## Failure of a Server in a Multi-Server Cluster

If you think the failed server is recoverable, the safest option is usually to bring it back online and let it rejoin the cluster. If you need to replace it, add the replacement server carefully and confirm the cluster is healthy before removing anything else.

If the failed server will not come back, remove the stale peer from the Raft configuration. If the node is still reachable, `dkron leave` is the cleanest option. If it is gone completely, use `dkron raft remove-peer` after identifying the stale peer ID.

You can use `dkron raft list-peers` to inspect the current Raft configuration:

```bash
$ dkron raft list-peers
Node                   ID               Address          State     Voter
dkron-server01.global  dkron-server01.global  10.10.11.5:6868  follower  true
dkron-server02.global  dkron-server02.global  10.10.11.6:6868  leader    true
dkron-server03.global  dkron-server03.global  10.10.11.7:6868  follower  true
```

Then remove the failed peer if needed:

```bash
dkron raft remove-peer --peer-id <peer-id>
```

## Failure of Multiple Servers in a Multi-Server Cluster

In the event that multiple servers are lost, causing a loss of quorum and a complete outage, partial recovery is possible using data on the remaining servers in the cluster. There may be data loss in this situation because multiple servers were lost, so information about what's committed could be incomplete. The recovery process implicitly commits all outstanding Raft log entries, so it's also possible to commit data that was uncommitted before the failure.

See the section below for details of the recovery procedure. You simply include just the remaining servers in the raft/peers.json recovery file. The cluster should be able to elect a leader once the remaining servers are all restarted with an identical raft/peers.json configuration.

Any new servers you introduce later can be fresh with totally clean data directories.

In extreme cases, it should be possible to recover with just a single remaining server by starting that single server with itself as the only peer in the raft/peers.json recovery file.

The raft/peers.json recovery file is final, and a snapshot is taken after it is ingested, so you are guaranteed to start with your recovered configuration. This does implicitly commit all Raft log entries, so should only be used to recover from an outage, but it should allow recovery from any situation where there's some cluster data available.

## Manual Recovery Using peers.json

Use this procedure only after a real outage that has already caused quorum loss.

1. Stop all remaining server nodes.
2. Back up the `data-dir` from each remaining server before changing anything.
3. Create the same `raft/peers.json` file on each remaining server.
4. Start the remaining servers and wait for a leader election.
5. Verify the recovered peer set with `dkron raft list-peers`.

Using raft/peers.json for recovery can cause uncommitted Raft log entries to be implicitly committed, so this should only be used after an outage where no other option is available to recover a lost server. Make sure you don't have any automated processes that will put the peers file in place on a periodic basis.

Go to the `data-dir` of each remaining server. Inside that directory, create `raft/peers.json`. It should look like this:

```json
[
  {
    "id": "node1",
    "address": "10.1.0.1:6868"
  },
  {
    "id": "node2",
    "address": "10.1.0.2:6868"
  },
  {
    "id": "node3",
    "address": "10.1.0.3:6868"
  }
]
```

Create entries only for the surviving servers that should remain in the recovered cluster. You must confirm that excluded servers are truly gone or intentionally left out of the recovered cluster. The `peers.json` file must be identical on every remaining server.

When Dkron starts and ingests the recovery file, it deletes `peers.json` automatically after successful recovery. You should see log messages similar to:

```
found peers.json file, recovering Raft configuration...
deleted peers.json file after successful recovery
```

Once the cluster is healthy again, you can add replacement servers in the normal way.

At this point, the cluster should be in an operable state again. One of the nodes should claim leadership and emit a log like:

`[INFO] Dkron: cluster leadership acquired`

You can use the `dkron raft list-peers` command to inspect the Raft configuration:

```bash
$ dkron raft list-peers
Node   ID     Address          State     Voter
node1  node1  10.10.11.5:6868  follower  true
node2  node2  10.10.11.6:6868  leader    true
node3  node3  10.10.11.7:6868  follower  true
```

`id` is the node ID used by the server. `address` is the server communication address in `ip:port` format, typically using the node's RPC port.

:::warning
Do not use `raft/peers.json` as a routine cluster management tool. It is a last-resort recovery path for quorum loss.
:::
