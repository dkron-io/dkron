---
title: Upgrade from v2.0.x to v2.2.x
---

For this upgrade path, migrate jobs by exporting them from the v2.0.x cluster and restoring them into a fresh v2.2.x cluster.

## Recommended method

Use the [backup and restore upgrade guide](/docs/usage/upgrade#backup-and-restore) as the primary reference.

## Migration steps

1. Export the current jobs from the v2.0.x cluster:

```bash
curl -fsS http://localhost:8080/v1/jobs > backup.json
```

2. Bring up the v2.2.x cluster and wait until it elects a leader.

3. Restore the exported jobs into the new cluster:

```bash
curl -fsS -X POST http://localhost:8080/v1/restore \
  --form 'file=@backup.json'
```

## Important note

This flow restores jobs from the exported `/v1/jobs` payload. It does not migrate the old Raft state or execution history.
