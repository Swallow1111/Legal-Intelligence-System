// 法律情报站点身份与读者可见文案。
// 域名由 SITE_URL 配置；本文件只定义产品身份与法律行业语境。

export const SITE = {
  name: "Legal Intelligence",
  subject: "法律",
  homeTitle: "Legal Intelligence — 法律热点 · 规则变化 · 实务精选",
  description: "持续追踪权威法律信源与高质量实务内容，用模型筛选、归并和摘要，帮助律师快速识别真正影响法律适用、案件策略与客户决策的新变化。",
  tagline: "把真正影响法律实践的变化筛出来",
  locale: "zh-CN",
  defaultUrl: "http://localhost:3000",
  mcpPrefix: "legal_intel",
  contactEmail: null as string | null,
  footerNote: "基于 AIHOT 开源框架构建",
  icp: null as string | null,
  organization: {
    name: "Legal Intelligence",
    founder: null as null | { name: string; url?: string; description?: string },
  },
  crawlerName: "LegalIntelligenceBot",
} as const;

export const ABOUT = {
  kicker: `关于 ${SITE.name}`,
  headline: ["法律信息每天都在增加，", "真正改变实务的，只有一小部分。"] as [string, string],
  lead: `${SITE.name} 持续追踪 {sources} 个法律信源：采集、判重、评分、归并，把新规则、重要案例、监管执法和高质量实务分析整理成可执行的法律情报。`,
  steps: {
    collect: "优先追踪立法机关、法院、检察院、行政监管机关等权威一手来源，同时吸收法律媒体、律所、律师与学者的高质量分析。",
    store: "同一法规、案件或监管事件的不同报道会归并到同一事件；原始来源、发布时间与后续进展分别保留。",
    select: "模型不按传播量选新闻，而按规范重要性、法律增量、证据强度、影响范围和实务可操作性独立评分两次。",
    publish: "每天生成法律日报，并持续提供热点、主题页、RSS、公开 API 与 MCP，供律师和 Agent 继续检索与处理。",
  },
  maker: null as null | {
    name: string;
    greeting: string[];
    avatarSourceId?: string | null;
    wechat?: { title: string; note: string };
    feishu?: { title: string; note: string };
  },
  copyright: `${SITE.name} 是法律资讯聚合、摘要与阅读索引，不替代原始法律文件、裁判文书或专业法律意见。原文版权归各来源所有；如需更正、下架或调整展示方式，可以通过`,
} as const;

export function withSubject(noun: string): string {
  return /[A-Za-z0-9]$/.test(SITE.subject) ? `${SITE.subject} ${noun}` : `${SITE.subject}${noun}`;
}
