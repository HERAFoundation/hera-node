# hera-node

IPFS infrastructure node for the Sporechain biodiversity network. Part of the HERA Foundation ecosystem.

Linear: https://linear.app/sporechain/issue/SPO-14

## What this is

hera-node is a Docker Compose distribution that provides IPFS storage and a pin API for the Sporechain network. The Hypha web app (separate repo) calls the pin endpoint to upload biodiversity content (photos, documents) and retrieves it via the IPFS gateway. Entries in AT Protocol reference this content by CID.

## Services

1. **kubo** — IPFS daemon. Stores and serves content-addressed data. Port 4001 is public (swarm/peering). Ports 5001 (API) and 8080 (gateway) are internal only.
2. **pin-endpoint** — Thin TypeScript proxy (Fastify) that accepts file uploads, validates type/size, forwards to Kubo, and returns a CIDv1. Listens on internal port 3000.
3. **caddy** — Reverse proxy with automatic HTTPS. Routes `/api/pin*` to pin-endpoint and `/ipfs/*` to Kubo's gateway.

## Security

**Port 5001 must NEVER be exposed publicly.** Kubo's API has no authentication — anyone with access can add, pin, remove, or garbage-collect content. It is only accessible within the Docker network.

## Development

```bash
cp .env.example .env
# Edit DOMAIN and ALLOWED_ORIGIN
docker compose up
```

For local dev without a domain, you can temporarily change the Caddyfile to `localhost` or `:80`.

## Testing the pin endpoint

```bash
# Health check
curl http://localhost/health

# Pin a file
curl -X POST http://localhost/api/pin \
  -F "file=@photo.jpg"
# → {"cid":"bafybeig..."}

# Retrieve via gateway
curl http://localhost/ipfs/<cid>
```

## IPFS Cluster upgrade path

For multi-node federation pinning:

1. Uncomment the `ipfs-cluster` service in `docker-compose.yml`
2. Uncomment `cluster_data` in the volumes section
3. Generate a shared secret: `od -vN 32 -An -tx1 /dev/urandom | tr -d ' \n'`
4. Set `CLUSTER_SECRET` in `.env` (same value on all peers)
5. Update the pin endpoint to target the cluster proxy (port 9095) instead of Kubo directly

## Commit rules

- Do not include any AI co-author lines in commits
- Do not reference Claude, Anthropic, or any AI tool in commit messages
- Keep commit messages short and descriptive
