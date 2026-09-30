import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDb, sql } from "@aihot/backend/db";
import { ingestItems } from "@aihot/backend/ingest/items";
import { normalizeHermesPayload, sourceForHermesProfile } from "@aihot/backend/ingest/hermes-adapter";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { tag } from "./setup.ts";

const T = tag();

after(async () => {
  await stopBoss();
  await closeDb();
});

test("Hermes profiles map to dedicated generic official ingest sources", () => {
  assert.deepEqual(sourceForHermesProfile("court-monitor"), {
    sourceId: "external-courts",
    sourceName: "法院系统 · Hermes 权威监测",
  });
  assert.deepEqual(sourceForHermesProfile("procuratorate-monitor"), {
    sourceId: "external-procuratorates",
    sourceName: "检察机关 · Hermes 权威监测",
  });
  assert.throws(() => sourceForHermesProfile("knowledge-agent"), /unsupported Hermes profile/);
});

test("Hermes payload normalization keeps legal provenance and drops malformed rows", () => {
  const result = normalizeHermesPayload({
    items: [
      {
        title: "  最高人民法院发布司法文件  ",
        url: " https://www.court.gov.cn/example ",
        publishedAt: "2026-09-30T08:00:00+08:00",
        bodyText: "正文",
        raw: { docket: "x", _aihot: { backfill: false }, _legalIntelligence: { runId: "r1" } },
      },
      { title: "缺网址" },
      null,
    ],
  }, "court-monitor");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.title, "最高人民法院发布司法文件");
  assert.equal(result[0]!.url, "https://www.court.gov.cn/example");
  assert.equal(result[0]!.bodyText, "正文");
  assert.deepEqual(result[0]!.raw?._legalIntelligence, { runId: "r1", ingestedBy: "hermes", profile: "court-monitor" });
  assert.deepEqual(result[0]!.raw?._aihot, { backfill: false });
});

test("ingest preserves externally extracted body text and metadata for anti-bot official pages", async () => {
  const sourceId = `test-hermes-ingest-${T}`;
  const url = `https://example.gov.cn/${T}/legal-update`;
  const bodyText = `权威法律正文 ${T} `.repeat(40);
  const result = await ingestItems({
    sourceId,
    sourceName: "Hermes test source",
    items: [
      {
        title: `司法规则 ${T}`,
        url,
        publishedAt: "2026-09-30T08:00:00+08:00",
        sourceUpdatedAt: "2026-09-30T09:00:00+08:00",
        author: "某法院",
        language: "zh-CN",
        excerpt: `摘要 ${T}`,
        bodyText,
        raw: { _legalIntelligence: { ingestedBy: "hermes", profile: "court-monitor" } },
      },
      // Same URL in one request is ignored after the first row.
      { title: `重复 ${T}`, url },
    ],
  });

  assert.equal(result.created, 1);
  const [row] = await sql<{
    body_text: string | null;
    excerpt: string | null;
    language: string | null;
    author: string | null;
    body_status: string;
    source_updated_at: Date | null;
    raw: Record<string, unknown> | null;
  }[]>`
    SELECT body_text, excerpt, language, author, body_status, source_updated_at, raw
    FROM articles WHERE identity_key = ${`url:${url}`}`;

  // identityKeyForUrl may canonicalize the key differently; fall back to the normalized URL lookup.
  const [byUrl] = row ? [row] : await sql<{
    body_text: string | null;
    excerpt: string | null;
    language: string | null;
    author: string | null;
    body_status: string;
    source_updated_at: Date | null;
    raw: Record<string, unknown> | null;
  }[]>`SELECT body_text, excerpt, language, author, body_status, source_updated_at, raw FROM articles WHERE url = ${url} LIMIT 1`;

  const stored = row ?? byUrl;
  assert.ok(stored);
  assert.equal(stored.body_text, bodyText.trim());
  assert.equal(stored.excerpt, `摘要 ${T}`);
  assert.equal(stored.language, "zh-CN");
  assert.equal(stored.author, "某法院");
  assert.equal(stored.body_status, "ok");
  assert.equal(stored.source_updated_at?.toISOString(), "2026-09-30T01:00:00.000Z");
  assert.deepEqual((stored.raw?._legalIntelligence as Record<string, unknown> | undefined)?.profile, "court-monitor");
});
