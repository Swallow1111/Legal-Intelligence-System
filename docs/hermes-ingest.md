# Hermes 法律监测接入

本协议把 Hermes 的 `court-monitor` / `procuratorate-monitor` 监测结果送入 Legal Intelligence，形成：

`官方页面 → Hermes 监测 → /api/ingest/items → 判重/分析/归组 → 律师精选 / 权威更新 → 法律变化卡`

## 1. 固定 source 映射

| Hermes profile | Legal Intelligence sourceId | 含义 |
|---|---|---|
| `court-monitor` | `external-courts` | 法院系统官方一手页面 |
| `procuratorate-monitor` | `external-procuratorates` | 检察机关官方一手页面 |

这两个 source 均为 `T1 + first_party + editorial`。因此 **只能推送法院/检察机关自己的官方发布**。法律媒体、律所转载、培训推广、个人评论不得走这两个 source；否则会错误获得 T1 一手来源身份。

最高人民法院已经由站内 `spc-typical-cases` / `spc-judicial-interpretations` 直接采集的页面，仍可被 Hermes 再次发现。文章身份按规范化 URL 全局判重，同一个 URL 不会生成两篇文章，第二个入口只记录 discovery。

## 2. Hermes 输出契约

监测任务最后应产出 JSON 数组，或 `{ "items": [...] }`。每项结构：

```json
{
  "title": "最高人民法院发布……",
  "url": "https://官方原文地址",
  "publishedAt": "2026-09-30T08:00:00+08:00",
  "sourceUpdatedAt": "2026-09-30T09:00:00+08:00",
  "author": "最高人民法院",
  "language": "zh-CN",
  "excerpt": "可选：短摘要或页面导语",
  "bodyText": "可选但建议：Hermes 已抓取的官方正文纯文本",
  "raw": {
    "monitorRunId": "可选的运行标识",
    "_aihot": { "backfill": false }
  }
}
```

最低要求只有 `title + url`。建议同时提供 `publishedAt` 和 `bodyText`：

- `publishedAt` 决定 48 小时新旧判定；缺失时只能按发现时间处理。
- `bodyText` 可避免 Legal Intelligence 再抓一次可能有反爬的官方详情页。
- `excerpt` 最多保留 8,000 字符。
- `bodyText` 最多保留 120,000 字符；模型侧仍按自身上下文上限截取。
- Hermes 不需要生成分类、评分、法律变化卡，这些由 Legal Intelligence 自己完成。

若是历史回灌，设置：

```json
{ "raw": { "_aihot": { "backfill": true } } }
```

即使没有显式标记，首次发现时原文已发布超过 48 小时，也会由统一 timeline 规则自动归档为历史资料，不刷“今天”。

## 3. 推送命令

仓库提供 `scripts/push-hermes-monitor.ts`。它只从环境变量读取地址和 token，不把 secret 写入参数或输出。

环境：

```bash
LEGAL_INTELLIGENCE_URL=https://legal.example.com
INGEST_TOKEN=<与 Legal Intelligence 服务端一致的至少 16 位 token>
```

法院：

```bash
node --env-file-if-exists=.env scripts/push-hermes-monitor.ts court-monitor < court-monitor-output.json
```

检察：

```bash
node --env-file-if-exists=.env scripts/push-hermes-monitor.ts procuratorate-monitor < procuratorate-monitor-output.json
```

也可以直接把生成 JSON 的命令 stdout 管道给脚本，不必落盘。

脚本会：

1. 验证 profile，只允许上述两个 profile；
2. 丢弃缺少 `title` 或 `url` 的行；
3. 自动加入 `raw._legalIntelligence.ingestedBy=hermes` 和 profile 信息；
4. 每 50 条拆一个请求；
5. POST 到 `/api/ingest/items`；
6. 任一请求非 2xx 立即以非零状态退出，让 cron/LaunchAgent 能检测到失败；
7. 成功仅输出形如 `{"ok":true,"profile":"court-monitor","received":3,"created":2}` 的摘要，不输出 token。

## 4. 服务端鉴权与失败语义

`/api/ingest/items` 使用：

```http
Authorization: Bearer <INGEST_TOKEN>
```

规则：

- 服务端未设置 token、token 为占位值或少于 16 位：全部返回 `401`。
- 单请求最多 50 条。
- 每个客户端 IP 每分钟最多 10 次，超限 `429`。
- 同一请求重复 URL 只处理第一条。
- URL 在整个文章库全局判重，不按 source 重复建文。
- 未预置的 sourceId 会自动建成 `T2 + isolated`，不会进入公开页面。因此生产任务必须使用固定 sourceId，不要动态拼 sourceId。

## 5. 正文与版权边界

`external-courts` / `external-procuratorates` 的 `site_fulltext=false`、`syndicate_fulltext=false`。

Hermes 推送的 `bodyText` 用于：

- 法律相关性预筛；
- 双评分；
- 内容理解；
- 事件归组；
- 法律变化卡抽取。

它不会因为已经存入数据库就自动获得公开全文展示或全文 RSS 权限。公开端仍以摘要 + 原始官方链接为主。

## 6. 生产验收标准

接线后至少做一次每个 profile 的真实 smoke：

1. 推一条当天官方页面；
2. 再推同 URL，确认 `created` 从 `1` 变 `0`；
3. 数据库中正文状态应为 `ok`（如果传了 `bodyText`）；
4. 处理队列应进入分析；
5. 达到精选门槛的规则型材料应能够进入“权威更新”；
6. 材料明确支持规则变化时，应出现“法律变化卡”；
7. 推一条超过 48 小时的旧文，确认不会刷入今日权威更新。
