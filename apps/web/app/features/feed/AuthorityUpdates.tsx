import { Link } from "react-router";
import type { FeedItemSummary } from "@aihot/contracts/site";

export interface LegalChangeCard {
  status: string | null;
  whatHappened: string;
  previousRule: string | null;
  whatChanged: string;
  affectedWork: string | null;
  lawyerAction: string | null;
}

export interface AuthorityUpdateEntry {
  rank: number;
  storyPublicId: string | null;
  item: FeedItemSummary;
  legalChange: LegalChangeCard | null;
  originalUrl: string;
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

function ChangeCard({ change, originalUrl }: { change: LegalChangeCard; originalUrl: string }) {
  const rows = [
    ["发生了什么", change.whatHappened],
    ["原规则", change.previousRule],
    ["改了什么", change.whatChanged],
    ["影响哪些案件/业务", change.affectedWork],
    ["律师注意什么", change.lawyerAction],
  ].filter((row): row is [string, string] => !!row[1]);

  return (
    <div className="mt-2 rounded-tile bg-bg-sunk/65 px-3 py-2.5 ring-1 ring-inset ring-line-soft dark:bg-bg-muted/35">
      {change.status && (
        <div className="mb-2 flex items-start gap-2 text-[12px] leading-[1.6]">
          <span className="shrink-0 font-semibold text-accent">当前阶段</span>
          <span className="text-ink-2">{change.status}</span>
        </div>
      )}
      <dl className="space-y-2">
        {rows.map(([label, text]) => (
          <div key={label} className="grid gap-0.5 sm:grid-cols-[116px_minmax(0,1fr)] sm:gap-3">
            <dt className="text-[12px] font-semibold text-ink-4">{label}</dt>
            <dd className="text-[12.5px] leading-[1.65] text-ink-2">{text}</dd>
          </div>
        ))}
      </dl>
      <a
        href={originalUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2.5 inline-flex text-[12px] font-semibold text-accent transition-opacity hover:opacity-75"
      >
        原始法律文件 ↗
      </a>
    </div>
  );
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
      <ol className="divide-y divide-line-soft">
        {entries.slice(0, 5).map((entry) => (
          <li key={entry.item.id} className="py-2.5">
            <div className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-x-3 sm:grid-cols-[20px_minmax(0,1fr)_auto]">
              <span className="num pt-0.5 text-center text-[13px] font-bold text-accent">{entry.rank}</span>
              <span className="min-w-0">
                <Link
                  to={hrefOf(entry)}
                  className="line-clamp-2 block text-[14px] font-semibold leading-[1.5] text-ink transition-colors hover:text-accent lg:line-clamp-1"
                >
                  {entry.item.title}
                </Link>
                {entry.item.summary && <span className="mt-0.5 line-clamp-1 block text-[12.5px] text-ink-3">{entry.item.summary}</span>}
              </span>
              <span className="hidden whitespace-nowrap pt-0.5 text-[12px] text-ink-4 sm:block">
                {CATEGORY_NAME[entry.item.category ?? ""] ?? "权威发布"} · {entry.item.source.name}
              </span>
            </div>
            {entry.legalChange && (
              <details open={entry.rank === 1} className="group ml-8 mt-1">
                <summary className="cursor-pointer select-none text-[12px] font-semibold text-accent marker:text-ink-4">
                  <span className="group-open:hidden">查看法律变化卡</span>
                  <span className="hidden group-open:inline">收起法律变化卡</span>
                </summary>
                <ChangeCard change={entry.legalChange} originalUrl={entry.originalUrl} />
              </details>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
