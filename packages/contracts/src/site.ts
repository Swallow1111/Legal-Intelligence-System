// First-party site API (/api/site/*). Not a public API: it may evolve with the website,
// but it is served from the same public read layer as v1, RSS and MCP.
import type { CategoryKey, ChannelKey } from "./taxonomy.ts";

export type SourceKind = "rss" | "web_list" | "json_list" | "x_search" | "mp_account" | "external";

export interface SourceRef {
  id: string;
  name: string;
  kind: SourceKind;
  firstParty: boolean;
  iconUrl: string | null;
  iconSrcSet?: string;
}

export interface MediaView {
  kind: "image" | "video";
  url: string;
  /** Full image for an on-demand viewer; list previews stay small. */
  fullUrl?: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  poster: string | null;
  srcSet?: string;
}

export interface XPostView {
  authorName: string;
  handle: string;
  avatarUrl: string | null;
  avatarSrcSet?: string;
  text: string;
  translation: string | null;
  /** translation: Chinese translation of the quoted post, when it is in another language. */
  quoted: { authorName: string; handle: string; text: string; url: string; translation: string | null } | null;
  media: MediaView[];
}

export interface StoryRef {
  publicId: string;
  title: string;
}

export interface ItemSummary {
  id: string;
  revision: number;
  title: string;
  originalTitle: string | null;
  summary: string | null;
  reason: string | null;
  source: SourceRef;
  links: { aihot: string; original: string };
  publishedAt: string | null;
  discoveredAt: string;
  timelineAt: string;
  category: CategoryKey | null;
  tags: string[];
  score: number | null;
  selected: boolean;
  channel: "news" | "x";
  story: StoryRef | null;
  x: XPostView | null;
}

/** The fields rendered by a site feed card; full original text lives in the item detail. */
export interface FeedItemSummary extends Pick<ItemSummary, "id" | "title" | "summary" | "reason" | "publishedAt" | "timelineAt" | "category" | "tags" | "score" | "selected" | "channel"> {
  source: Pick<SourceRef, "name">;
  x: (Pick<XPostView, "authorName" | "handle" | "avatarUrl" | "avatarSrcSet" | "media"> & {
    quoted: Omit<NonNullable<XPostView["quoted"]>, "url"> | null;
  }) | null;
}

export interface GroupInfo {
  factId: string;
  story: StoryRef | null;
  /** Other public sources of the fact the card represents (same set as the expandable reports). */
  additionalSourceCount: number;
  /** Distinct public reports across the group's facts. */
  reportCount: number;
  /** Facts of the group (the card's own included) with at least one selected item under the current filters. */
  developmentCount: number;
  /** The newest development when it is not the card's own fact: why the card sits where it does. */
  latestDevelopment?: { factId: string; title: string; at: string } | null;
}

export interface TimelineCard {
  key: string;
  anchorAt: string;
  item: FeedItemSummary;
  group: GroupInfo | null;
}

export interface AuthorityUpdateEntry {
  rank: number;
  storyPublicId: string | null;
  item: FeedItemSummary;
}

export interface HotStripEntry {
  rank: number;
  title: string;
  heat: number;
  trend: "up" | "down" | "flat" | "new" | "unknown";
  storyPublicId: string | null;
  itemId: string | null;
  participants: HotParticipant[];
  participantCount: number;
}

export interface TimelineFilters {
  channel: ChannelKey;
  category: CategoryKey | null;
  tag: string | null;
  topic?: string | null;
}

export interface TimelineResponse {
  filters: TimelineFilters;
  cards: TimelineCard[];
  nextCursor: string | null;
  /** Absolute time when a pending item in this scope becomes visible; the page re-checks then. */
  refreshAt: string | null;
  authority: AuthorityUpdateEntry[] | null;
  hot: HotStripEntry[] | null;
  dayCounts: Record<string, number>;
  generatedAt: string;
}

export interface PoolResponse {
  filters: TimelineFilters & { q: string | null; tab: "time" | "relevance" };
  items: FeedItemSummary[];
  page: number;
  pageCount: number;
  total: number;
  todayCount: number;
  freshness: string;
  generatedAt: string;
}

export interface OutlineEntry {
  id: string;
  text: string;
  level: number;
}

export interface ItemDetail extends ItemSummary {
  readingMode: "full" | "summary-only";
  author: string | null;
  language: string | null;
  /** Chinese body (translation or Chinese original) and original body, whitelisted HTML. */
  body: { zh: string | null; original: string | null; zhKind: "translation" | "original" | null; complete: boolean } | null;
  outline: OutlineEntry[];
  relatedStories: StoryRef[];
  indexable: boolean;
  markdownAvailable: boolean;
  group: GroupInfo | null;
}

export interface ItemOriginalDetail extends Omit<ItemDetail, "body"> {
  body: { zh: null; original: string | null; zhKind: null; complete: boolean } | null;
}

export interface HotParticipant {
  sourceId: string;
  sourceName: string;
  sourceIconUrl: string | null;
  sourceTier: string | null;
  firstParty: boolean;
}

export interface HotDetailEntry extends HotStripEntry {
  representative: FeedItemSummary | null;
  updatedAt: string;
}

export interface HotResponse {
  entries: HotDetailEntry[];
  computedAt: string | null;
  ruleVersion: string | null;
  generatedAt: string;
}

export interface TopicSummary {
  slug: string;
  name: string;
  group: string;
  definition: string;
}

export interface TopicPage extends TopicSummary {
  items: TimelineCard[];
}
