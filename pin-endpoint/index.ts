import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { CID } from "multiformats/cid";

const KUBO_API = process.env.KUBO_API || "http://kubo:5001";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const app = Fastify({ logger: true });
await app.register(multipart, { limits: { fileSize: MAX_FILE_SIZE } });

// CORS
app.addHook("onRequest", (req, reply, done) => {
  reply.header("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    reply.status(204).send();
    return;
  }
  done();
});

app.get("/health", async () => ({ ok: true }));

app.post("/api/pin", async (req, reply) => {
  const file = await req.file();
  if (!file) return reply.status(400).send({ error: "No file uploaded" });

  if (!ALLOWED_TYPES.has(file.mimetype)) {
    return reply
      .status(400)
      .send({ error: `File type not allowed: ${file.mimetype}. Accepted: jpg, png, webp` });
  }

  const form = new FormData();
  const buf = await file.toBuffer();

  if (buf.length > MAX_FILE_SIZE) {
    return reply.status(413).send({ error: "File exceeds 10 MB limit" });
  }

  form.append("file", new Blob([new Uint8Array(buf)]), file.filename);

  const res = await fetch(`${KUBO_API}/api/v0/add?cid-version=1`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    req.log.error({ status: res.status, body: text }, "Kubo add failed");
    return reply.status(502).send({ error: "IPFS add failed" });
  }

  const { Hash } = (await res.json()) as { Hash: string; Name: string; Size: string };

  // Ensure CIDv1 base32 — Kubo should return v1 due to config, but guard anyway
  let cidStr = Hash;
  if (cidStr.startsWith("Qm")) {
    const v0 = CID.parse(cidStr);
    cidStr = v0.toV1().toString();
  }

  return { cid: cidStr };
});

await app.listen({ port: 3000, host: "0.0.0.0" });
