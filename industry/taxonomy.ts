// 法律行业分类体系：一级按“信息性质”分类，部门法作为主题标签。
// 这样避免把“司法解释”“典型案例”“监管执法”强行塞进单一部门法。

export const CATEGORIES = [
  { key: "legislation-policy", label: "立法政策", section: "立法与政策", guide: "法律、行政法规、部门规章、规范性文件、政策文件、征求意见稿、立法审议与废改立动态" },
  { key: "judicial-rules", label: "司法规则", section: "司法规则", guide: "司法解释、批复、会议纪要、司法规范性文件、审判执行规则与检察规范" },
  { key: "case-rules", label: "案例规则", section: "案例与裁判规则", guide: "指导性案例、典型案例、人民法院案例库案例、公报案例及具有明确规则价值的重要裁判" },
  { key: "major-cases", label: "重大案件", section: "重大案件", guide: "具有重大法律争议、程序进展、社会影响或规则意义的诉讼、仲裁、执行及刑事案件" },
  { key: "regulatory-enforcement", label: "监管执法", section: "监管与执法", guide: "证券、金融、市场监管、反垄断、数据、网信、知识产权等监管执法、处罚与合规规则" },
  { key: "practice-research", label: "实务研究", section: "实务研究", guide: "律师、法官、检察官、学者的高质量法律分析、办案方法、规则梳理与实务复盘" },
  { key: "legal-industry", label: "法律行业", section: "法律行业", guide: "律师行业、司法改革、法律服务市场、Legal AI、法律科技与专业工作方式变化" },
] as const;

export const ITEM_TYPES = [
  "legislation_policy",
  "judicial_rule",
  "guiding_typical_case",
  "major_judgment",
  "regulatory_enforcement",
  "practice_analysis",
  "legal_industry",
] as const;

export const CATEGORY_TAGS = [
  "立法政策",
  "司法规则",
  "案例规则",
  "重大案件",
  "监管执法",
  "实务研究",
  "法律行业",
  "其他",
] as const;

export const TOPIC_TAGS = [
  "刑事",
  "民商事",
  "公司治理",
  "证券资本市场",
  "金融",
  "知识产权",
  "劳动人事",
  "建设工程",
  "房地产",
  "破产重整",
  "行政法",
  "数据合规",
  "个人信息保护",
  "网络安全",
  "反垄断",
  "反不正当竞争",
  "税务",
  "国际贸易",
  "涉外争议",
  "仲裁",
  "执行",
  "证据",
  "诉讼程序",
  "Legal AI",
  "法律科技",
] as const;

export const ENTITY_TAGS = [
  "全国人大",
  "国务院",
  "最高人民法院",
  "最高人民检察院",
  "司法部",
  "市场监管总局",
  "证监会",
  "金融监管总局",
  "国家网信办",
  "国家知识产权局",
] as const;

export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  法律法规: "立法政策",
  法规政策: "立法政策",
  立法动态: "立法政策",
  司法解释: "司法规则",
  会议纪要: "司法规则",
  裁判规则: "案例规则",
  典型案例: "案例规则",
  指导性案例: "案例规则",
  监管: "监管执法",
  行政处罚: "监管执法",
  执法: "监管执法",
  律师实务: "实务研究",
  法律分析: "实务研究",
  行业动态: "法律行业",
  法律AI: "Legal AI",
  AI法律: "Legal AI",
  商事: "民商事",
  民事: "民商事",
  公司法: "公司治理",
  证券: "证券资本市场",
  资本市场: "证券资本市场",
  数据: "数据合规",
  隐私: "个人信息保护",
  反垄断法: "反垄断",
  程序法: "诉讼程序",
};

export const CATEGORY_BY_ITEM_TYPE: Readonly<Record<string, string>> = {
  legislation_policy: "立法政策",
  judicial_rule: "司法规则",
  guiding_typical_case: "案例规则",
  major_judgment: "重大案件",
  regulatory_enforcement: "监管执法",
  practice_analysis: "实务研究",
  legal_industry: "法律行业",
};

export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[] }> = {
  npc: { name: "全国人大", displayTag: "全国人大", aliases: ["全国人民代表大会", "全国人大", "全国人大常委会", "全国人民代表大会常务委员会"] },
  statecouncil: { name: "国务院", displayTag: "国务院", aliases: ["国务院", "中国政府网"] },
  spc: { name: "最高人民法院", displayTag: "最高人民法院", aliases: ["最高人民法院", "最高法", "人民法院新闻传媒总社"] },
  spp: { name: "最高人民检察院", displayTag: "最高人民检察院", aliases: ["最高人民检察院", "最高检"] },
  moj: { name: "司法部", displayTag: "司法部", aliases: ["司法部"] },
  samr: { name: "市场监管总局", displayTag: "市场监管总局", aliases: ["国家市场监督管理总局", "市场监管总局", "国家市场监管总局"] },
  csrc: { name: "证监会", displayTag: "证监会", aliases: ["中国证券监督管理委员会", "中国证监会", "证监会"] },
  nfra: { name: "金融监管总局", displayTag: "金融监管总局", aliases: ["国家金融监督管理总局", "金融监管总局"] },
  cac: { name: "国家网信办", displayTag: "国家网信办", aliases: ["国家互联网信息办公室", "国家网信办", "网信办"] },
  cnipa: { name: "国家知识产权局", displayTag: "国家知识产权局", aliases: ["国家知识产权局", "知识产权局"] },
};

export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "npc", name: "全国人大", patterns: [/全国人民代表大会|全国人大(?:常委会)?|全国人民代表大会常务委员会/] },
  { id: "statecouncil", name: "国务院", patterns: [/国务院|中国政府网/] },
  { id: "spc", name: "最高人民法院", patterns: [/最高人民法院|最高法/] },
  { id: "spp", name: "最高人民检察院", patterns: [/最高人民检察院|最高检/] },
  { id: "moj", name: "司法部", patterns: [/司法部/] },
  { id: "samr", name: "市场监管总局", patterns: [/国家市场监督管理总局|市场监管总局|国家市场监管总局/] },
  { id: "csrc", name: "证监会", patterns: [/中国证券监督管理委员会|中国证监会|证监会/] },
  { id: "nfra", name: "金融监管总局", patterns: [/国家金融监督管理总局|金融监管总局/] },
  { id: "cac", name: "国家网信办", patterns: [/国家互联网信息办公室|国家网信办|网信办/] },
  { id: "cnipa", name: "国家知识产权局", patterns: [/国家知识产权局|知识产权局/] },
];

export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "npc", domains: ["npc.gov.cn"] },
  { entityId: "statecouncil", domains: ["gov.cn"] },
  { entityId: "spc", domains: ["court.gov.cn"] },
  { entityId: "spp", domains: ["spp.gov.cn"] },
  { entityId: "moj", domains: ["moj.gov.cn"] },
  { entityId: "samr", domains: ["samr.gov.cn"] },
  { entityId: "csrc", domains: ["csrc.gov.cn"] },
  { entityId: "nfra", domains: ["nfra.gov.cn"] },
  { entityId: "cac", domains: ["cac.gov.cn"] },
  { entityId: "cnipa", domains: ["cnipa.gov.cn"] },
];

export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "spc", pattern: /人民法院案例库|法答网/ },
  { entityId: "spp", pattern: /检察机关案例库/ },
];
