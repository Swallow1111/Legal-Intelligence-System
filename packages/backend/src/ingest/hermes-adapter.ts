export const HERMES_INGEST_SOURCES = {
  "court-monitor": { sourceId: "external-courts", sourceName: "法院系统 · Hermes 权威监测" },
  "procuratorate-monitor": { sourceId: "external-procuratorates", sourceName: "检察机关 · Hermes 权威监测" },
} as const;

export type HermesMonitorProfile = keyof typeof HERMES_INGEST_SOURCES;

export interface HermesIngestItem {
  title: string;
  url: string;
  publishedAt?: string;
  sourceUpdatedAt?: string;
  author?: string;
  language?: string;
  excerpt?: string;
  bodyText?: string;
  raw?: Record<string, unknown>;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function sourceForHermesProfile(profile: string) {
  const source = HERMES_INGEST_SOURCES[profile as HermesMonitorProfile];
  if (!source) throw new Error(`unsupported Hermes profile: ${profile}`);
  return source;
}

/**
 * Stable boundary between Hermes monitor output and /api/ingest/items. The monitor may return either
 * a JSON array or {items:[...]}. Unknown fields are not promoted into the ingest contract; callers can
 * preserve provenance under raw. Invalid rows are dropped rather than turned into malformed articles.
 */
export function normalizeHermesPayload(payload: unknown, profile: string): HermesIngestItem[] {
  sourceForHermesProfile(profile);
  const root = record(payload);
  const input = Array.isArray(payload) ? payload : Array.isArray(root?.items) ? root.items : [];
  const out: HermesIngestItem[] = [];
  for (const value of input) {
    const item = record(value);
    if (!item) continue;
    const title = optionalString(item.title);
    const url = optionalString(item.url);
    if (!title || !url) continue;
    const incomingRaw = record(item.raw) ?? {};
    const legalIntel = record(incomingRaw._legalIntelligence) ?? {};
    out.push({
      title,
      url,
      ...(optionalString(item.publishedAt) ? { publishedAt: optionalString(item.publishedAt)! } : {}),
      ...(optionalString(item.sourceUpdatedAt) ? { sourceUpdatedAt: optionalString(item.sourceUpdatedAt)! } : {}),
      ...(optionalString(item.author) ? { author: optionalString(item.author)! } : {}),
      ...(optionalString(item.language) ? { language: optionalString(item.language)! } : {}),
      ...(optionalString(item.excerpt) ? { excerpt: optionalString(item.excerpt)! } : {}),
      ...(optionalString(item.bodyText) ? { bodyText: optionalString(item.bodyText)! } : {}),
      raw: {
        ...incomingRaw,
        _legalIntelligence: { ...legalIntel, ingestedBy: "hermes", profile },
      },
    });
  }
  return out;
}
