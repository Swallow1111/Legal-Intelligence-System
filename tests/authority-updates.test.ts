import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { closeDb, sql } from "@aihot/backend/db";
import { upsertMaterial } from "@aihot/backend/content/materials";
import { publishArticle } from "@aihot/backend/publication/publish";
import { loadAuthorityUpdates } from "@aihot/backend/publication/authority";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { tag } from "./setup.ts";

const T = tag();
const T1 = `test-authority-t1-${T}`;
const T15 = `test-authority-t15-${T}`;
const T2 = `test-authority-t2-${T}`;
const NON_FIRST = `test-authority-nonfirst-${T}`;
const NOW = new Date();

before(async () => {
  await sql`
    INSERT INTO sources (id, name, kind, tier, first_party, participation_mode, next_fetch_at) VALUES
      (${T1}, 'Authority T1', 'rss', 'T1', true, 'editorial', '2100-01-01'),
      (${T15}, 'Authority T1.5', 'rss', 'T1_5', true, 'editorial', '2100-01-01'),
      (${T2}, 'Authority T2', 'rss', 'T2', true, 'editorial', '2100-01-01'),
      (${NON_FIRST}, 'Authority non-first', 'rss', 'T1', false, 'editorial', '2100-01-01')`;
});

after(async () => {
  await stopBoss();
  await closeDb();
});

let n = 0;
async function makeItem(sourceId: string, category: string, score: number, hoursAgo = 1) {
  n += 1;
  const publishedAt = new Date(NOW.getTime() - hoursAgo * 60 * 60 * 1000);
  const { articleId } = await upsertMaterial({
    sourceId,
    url: `https://example.com/${T}/authority-${n}`,
    title: `Authority ${n} ${T}`,
    bodyText: `Legal authority update ${n} ${T}. `.repeat(20),
    bodyStatus: "ok",
    via: "fetch",
    publishedAt,
  });
  await sql`
    INSERT INTO analyses (article_id, input_revision, origin, relevance, category, title_zh, summary_zh, reason_zh, score, selected)
    VALUES (${articleId}, 1, 'rule', 'pass', ${category}, ${`权威更新 ${n}-${T}`}, ${`摘要 ${n}-${T}`}, '影响法律适用', ${score}, true)`;
  await publishArticle(articleId, { releasedAt: new Date(NOW.getTime() - 5 * 60 * 1000) });
  // Keep the test independent of publication timeline heuristics: authority freshness is explicitly
  // defined against the publication timeline field.
  await sql`UPDATE publications SET timeline_at = ${publishedAt}, sort_at = ${publishedAt} WHERE article_id = ${articleId}`;
  return articleId;
}

test("authority updates are first-party authoritative legal changes, ranked by legal score inside 48h", async () => {
  const top = await makeItem(T1, "judicial-rules", 94, 2);
  const second = await makeItem(T15, "legislation-policy", 88, 1);
  const wrongCategory = await makeItem(T1, "legal-industry", 100, 1);
  const weakTier = await makeItem(T2, "judicial-rules", 100, 1);
  const notFirstParty = await makeItem(NON_FIRST, "regulatory-enforcement", 100, 1);
  const expired = await makeItem(T1, "case-rules", 100, 72);

  const result = await loadAuthorityUpdates(10, NOW);
  assert.deepEqual(result.entries.map((entry) => entry.item.id), [top, second]);
  assert.deepEqual(result.entries.map((entry) => entry.rank), [1, 2]);
  assert.ok(!result.entries.some((entry) => [wrongCategory, weakTier, notFirstParty, expired].includes(entry.item.id)));
  assert.equal(result.entries[0]!.item.source.name, "Authority T1");
  assert.equal(result.entries[1]!.item.source.name, "Authority T1.5");
});
