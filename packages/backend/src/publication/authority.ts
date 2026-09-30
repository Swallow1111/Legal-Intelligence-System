import type { FeedItemSummary } from "@aihot/contracts/site";
import { sql } from "../db.ts";
import { ITEM_COLUMNS, ITEM_FROM, selectedCondition, toFeedItemSummary, type ItemRow } from "./items.ts";

export const AUTHORITY_WINDOW_HOURS = 48;
export const AUTHORITY_CATEGORIES = [
  "legislation-policy",
  "judicial-rules",
  "case-rules",
  "regulatory-enforcement",
] as const;

interface CandidateRow {
  id: string;
  score: number | null;
  timeline_at: Date;
}

export interface AuthorityUpdateEntry {
  rank: number;
  storyPublicId: string | null;
  item: FeedItemSummary;
}

export interface AuthorityUpdatesResult {
  entries: AuthorityUpdateEntry[];
  refreshAt: string | null;
}

/**
 * Selected first-party legal changes from authoritative sources. Unlike the hot board this lane does
 * not require multiple participants and never uses repost/discussion heat. One representative is kept
 * for each story/fact so multiple official pages about the same legal event do not crowd the homepage.
 */
export async function loadAuthorityUpdates(limit = 5, now = new Date()): Promise<AuthorityUpdatesResult> {
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const windowStart = new Date(now.getTime() - AUTHORITY_WINDOW_HOURS * 60 * 60 * 1000);

  const [candidates, nextRelease] = await Promise.all([
    sql<CandidateRow[]>`
      WITH candidates AS (
        SELECT
          p.article_id AS id,
          p.score,
          p.timeline_at,
          row_number() OVER (
            PARTITION BY coalesce('s' || p.story_id::text, 'f' || p.fact_id::text, 'a' || p.article_id)
            ORDER BY p.score DESC NULLS LAST, p.timeline_at DESC, p.article_id COLLATE "C" ASC
          ) AS group_rank
        FROM publications p
        JOIN sources s ON s.id = p.source_id
        WHERE ${selectedCondition(now)}
          AND p.first_party
          AND s.tier IN ('T1', 'T1_5')
          AND p.category IN ${sql([...AUTHORITY_CATEGORIES])}
          AND p.timeline_at >= ${windowStart}
      )
      SELECT id, score, timeline_at
      FROM candidates
      WHERE group_rank = 1
      ORDER BY score DESC NULLS LAST, timeline_at DESC, id COLLATE "C" ASC
      LIMIT ${safeLimit}`,
    sql<{ t: Date | null }[]>`
      SELECT min(p.visible_after) AS t
      FROM publications p
      JOIN sources s ON s.id = p.source_id
      WHERE p.visibility = 'public'
        AND p.selected
        AND p.visible_after > ${now}
        AND p.first_party
        AND s.tier IN ('T1', 'T1_5')
        AND p.category IN ${sql([...AUTHORITY_CATEGORIES])}
        AND p.timeline_at >= ${windowStart}`,
  ]);

  if (candidates.length === 0) {
    return { entries: [], refreshAt: nextRelease[0]?.t?.toISOString() ?? null };
  }

  // Hydrate only through the shared public item projection, rechecking visibility/release after the
  // ranking read so a concurrent withdrawal cannot leak through this lane.
  const rows = await sql<ItemRow[]>`
    SELECT ${ITEM_COLUMNS} ${ITEM_FROM}
    WHERE p.article_id IN ${sql(candidates.map((c) => c.id))}
      AND ${selectedCondition(now)}`;
  const byId = new Map(rows.map((row) => [row.id, row]));
  const entries = candidates.flatMap((candidate, index) => {
    const row = byId.get(candidate.id);
    if (!row) return [];
    return [{ rank: index + 1, storyPublicId: row.story_public_id, item: toFeedItemSummary(row) }];
  });

  return { entries, refreshAt: nextRelease[0]?.t?.toISOString() ?? null };
}
