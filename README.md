# hera-node

**IPFS infrastructure for the Sporechain biodiversity network.** hera-node is a Docker Compose distribution that operators clone and run to join the network. It provides content-addressed storage for biodiversity data — photos, documents, datasets — referenced by CID in [Sporechain](https://github.com/HERAFoundation/sporechain) AT Protocol entries. The [Hypha](https://hypha.pages.dev) web app uses hera-node's pin API to upload content and its IPFS gateway to retrieve it.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) v2+
- A domain with DNS pointing to your server (Caddy needs this for automatic HTTPS)

## Quick start

```bash
git clone https://github.com/HERAFoundation/hera-node.git
cd hera-node
cp .env.example .env
```

Edit `.env`:

```bash
DOMAIN=node.yourdomain.com
ALLOWED_ORIGIN=https://hypha.pages.dev
```

Start the stack:

```bash
docker compose up -d
```

That's it. Caddy provisions TLS certificates automatically via Let's Encrypt.

## Services

| Service | Image | Purpose |
|---------|-------|---------|
| **kubo** | `ipfs/kubo:latest` | IPFS daemon — stores and serves content-addressed data. Port 4001 is public for swarm peering. |
| **pin-endpoint** | Built from `./pin-endpoint` | Accepts file uploads via `POST /api/pin`, validates type and size, forwards to Kubo, returns a CIDv1. |
| **caddy** | `caddy:latest` | Reverse proxy with automatic HTTPS. Routes `/api/pin*` → pin-endpoint, `/ipfs/*` → Kubo gateway. |

### How Caddy handles HTTPS

Caddy automatically obtains and renews TLS certificates from Let's Encrypt using the ACME protocol. All you need is:
- Ports 80 and 443 open on your server
- DNS for your domain pointing to the server's IP

No manual certificate management required.

## Verify it's working

```bash
# Health check
curl https://node.yourdomain.com/health
# → {"ok":true}

# Pin a file
curl -X POST https://node.yourdomain.com/api/pin \
  -F "file=@photo.jpg"
# → {"cid":"bafybeig..."}

# Retrieve via IPFS gateway
curl https://node.yourdomain.com/ipfs/bafybeig...
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DOMAIN` | Yes | Your node's domain. Caddy uses this for automatic HTTPS. |
| `ALLOWED_ORIGIN` | Yes | Origin allowed for CORS on the pin endpoint (e.g., `https://hypha.pages.dev`). |
| `CLUSTER_SECRET` | Post-MVP | 32-byte hex string shared across all IPFS Cluster peers. |

## Pin endpoint

`POST /api/pin` — multipart file upload.

- **Accepted types:** jpg, jpeg, png, webp
- **Max size:** 10 MB
- **Response:** `{ "cid": "bafybeig..." }` (CIDv1 base32)
- **Errors:** 400 for missing file or invalid type, 413 for oversized file

All CIDs are v1 base32 format (`bafybeig...`), never v0 (`Qm...`).

## IPFS Cluster (multi-node federation)

For production federation deployments where multiple nodes need to coordinate pinning:

1. Uncomment the `ipfs-cluster` service block in `docker-compose.yml`
2. Uncomment `cluster_data` in the volumes section
3. Generate a shared cluster secret:
   ```bash
   od -vN 32 -An -tx1 /dev/urandom | tr -d ' \n'
   ```
4. Set `CLUSTER_SECRET` in `.env` — the same value on every peer
5. Update the pin endpoint's `KUBO_API` to target the cluster proxy (`http://ipfs-cluster:9095`) instead of Kubo directly

## Links

- [Sporechain protocol](https://github.com/HERAFoundation/sporechain) — the `network.sporechain.entry` lexicon and spec
- [HERA Foundation](https://hera.earth) — Human-Earth Resilience Alliance
