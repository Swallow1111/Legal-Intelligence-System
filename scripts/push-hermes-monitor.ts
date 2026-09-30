// Push normalized court-monitor / procuratorate-monitor JSON into Legal Intelligence.
// Usage:
//   node --env-file-if-exists=.env scripts/push-hermes-monitor.ts court-monitor < monitor-output.json
// Environment: LEGAL_INTELLIGENCE_URL (or SITE_URL), INGEST_TOKEN.
import { readFile } from "node:fs/promises";
import { normalizeHermesPayload, sourceForHermesProfile } from "@aihot/backend/ingest/hermes-adapter";

const profile = process.argv[2] ?? "";
const source = sourceForHermesProfile(profile);
const baseUrl = (process.env.LEGAL_INTELLIGENCE_URL ?? process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");
const token = (process.env.INGEST_TOKEN ?? "").trim();

if (!/^https?:\/\//.test(baseUrl)) throw new Error("LEGAL_INTELLIGENCE_URL or SITE_URL must be an http(s) URL");
if (token.length < 16) throw new Error("INGEST_TOKEN must be configured and at least 16 characters");

const stdin = await readFile(0, "utf8");
if (!stdin.trim()) throw new Error("expected Hermes monitor JSON on stdin");
const items = normalizeHermesPayload(JSON.parse(stdin), profile);
if (items.length === 0) {
  console.log(JSON.stringify({ ok: true, profile, received: 0, created: 0 }));
  process.exit(0);
}

let created = 0;
for (let start = 0; start < items.length; start += 50) {
  const batch = items.slice(start, start + 50);
  const response = await fetch(`${baseUrl}/api/ingest/items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ sourceId: source.sourceId, sourceName: source.sourceName, items: batch }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`ingest failed: HTTP ${response.status}${text ? ` ${text.slice(0, 500)}` : ""}`);
  const result = JSON.parse(text) as { ok?: boolean; created?: number };
  if (result.ok !== true) throw new Error("ingest returned an invalid success payload");
  created += Number(result.created ?? 0);
}

console.log(JSON.stringify({ ok: true, profile, received: items.length, created }));
