# Configuration

Dkron Pro uses the [same configuration sources and base parameters](/docs/basics/configuration) as Dkron OSS, and adds a small set of Pro-specific options.

## Configuration sources

Like OSS, Dkron Pro can be configured through:

- command-line flags
- environment variables prefixed with `DKRON_`
- the `dkron.yml` configuration file

In most cases, config file keys closely match the command-line flags without the leading `--`, but follow the examples in the configuration docs when a setting uses a different structure.

## Pro-specific options

### Authentication and TLS

- `--username` - Authentication username
- `--password` - Authentication password
- `--cert-file` - Path to the client server TLS certificate file
- `--key-file` - Path to the client server TLS key file
- `--client-crl-file` - Path to the client certificate revocation list file
- `--trusted-ca-file` - Path to the trusted client CA certificate file
- `--client-cert-auth` - Enable client certificate authentication
- `--auto-tls` - Enable automatically generated client TLS certificates

### Raft storage and federation

- `--fast` - Enable the Raft FastLog storage engine
- `--raft-duration` - Tune FastLog durability and write performance (`-1`, `0`, `1`)
- `--federation-mode` - Configure federation mode between clusters in different regions

## Related documentation

- [Raft FastLog](/docs/pro/raft-fastlog)
- [Cross region failover](/docs/pro/failover)
