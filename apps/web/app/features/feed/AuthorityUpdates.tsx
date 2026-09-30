import { Link } from "react-router";
import type { FeedItemSummary } from "@aihot/contracts/site";

export interface AuthorityUpdateEntry {
  rank: number;
  storyPublicId: string | null;
  item: FeedItemSummary;
}

export interface AuthorityUpdatesResponse {
  entries: AuthorityUpdateEntry[];
  refreshAt: string | null;
  generatedAt: string;
}

const CATEGORY_NAME: Record<string, string> = {
  "legislation-policy": "立法政策",
  "judicial-rules": "司法规则",
  "case-rules": "案例规则",
  "regulatory-enforcement": "监管执法",
};

function hrefOf(entry: AuthorityUpdateEntry) {
  return entry.storyPublicId ? `/story/${entry.storyPublicId}` : `/items/${entry.item.id}`;
}

export function AuthorityUpdates({ entries }: { entries: AuthorityUpdateEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby="authority-updates" className="card mb-6 overflow-hidden px-4 pb-2 pt-3.5 lg:px-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 id="authority-updates" className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <span className="inline-flex size-2 rounded-full bg-accent" aria-hidden="true" />
          权威更新
        </h2>
        <span className="text-[12px] text-ink-4">48 小时内 · 按法律重要性排序</span>
      </div>
      <ol>
        {entries.slice(0, 5).map((entry) => (
          <li key={entry.item.id}>
            <Link
              to={hrefOf(entry)}
              className="group -mx-2 grid grid-cols-[20px_minmax(0,1fr)] items-start gap-x-3 rounded-tile px-2 py-2.5 transition-colors hover:bg-bg-sunk/70 sm:grid-cols-[20px_minmax(0,1fr)_auto] dark:hover:bg-bg-muted/40"
            >
              <span className="num pt-0.5 text-center text-[13px] font-bold text-accent">{entry.rank}</span>
              <span className="min-w-0">
                <span className="line-clamp-2 block text-[14px] font-semibold leading-[1.5] text-ink transition-colors group-hover:text-accent lg:line-clamp-1">
                  {entry.item.title}
                </span>
                {entry.item.summary && <span className="mt-0.5 line-clamp-1 block text-[12.5px] text-ink-3">{entry.item.summary}</span>}
              </span>
              <span className="hidden whitespace-nowrap pt-0.5 text-[12px] text-ink-4 sm:block">
                {CATEGORY_NAME[entry.item.category ?? ""] ?? "权威发布"} · {entry.item.source.name}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
