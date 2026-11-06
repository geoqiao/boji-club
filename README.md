# 薄肌俱乐部 · Boji Club

Status: **active**

[boji-club.geoqiao.me](https://boji-club.geoqiao.me/) 是以健康、长期坚持为目标的健身入门知识库。内容与讨论来自本仓库的 GitHub Issues；站点采用 Astro 静态构建，部署到 Cloudflare Workers Static Assets。

## 编辑与发布

1. 在本仓库创建 Issue，标题即页面标题。
2. 添加 `type:blog` 标签，按下方格式写正文。未添加 `published` 时不进入网站；公开仓库的草稿仍然在 GitHub 上可见。
3. 添加 `published` 标签后，GitHub Actions 导出全部已发布内容、检查并构建，成功后提交 `content/`；Cloudflare Git 构建接着部署。
4. 直接编辑同一个 Issue 更新内容。实质修订时填写 `update_date`，保留原 slug 与 Issue 编号。
5. 移除 `published` 撤稿。关闭 Issue 保持发布状态。删除或转移 Issue 会在下一次成功导出中移除页面。
6. 内容分组与顺序在 `src/lib/navigation.ts` 配置；新增章节时把对应 slug 加入目录。不按创建日期排列。

```markdown
---
slug: chest-training
description: 从器械推胸开始，学会胸部训练的基本动作与进阶。
created_date: "2026-11-06"
---

## 先掌握一个动作

正文从二级标题开始。标题由 Issue 原生标题提供。

## 来源

- [来源名称](https://example.com/)
```

支持的正文元数据为 `slug`、`description`、`created_date`、`update_date`。发布和类型使用 GitHub labels，不写入正文元数据。请勿手工编辑 `content/`，它由 [escaping-site](https://github.com/geoqiao/escaping) 管理。

## 视频

独占一个段落的 HTTPS Bilibili 视频链接会生成点击加载的播放器：

```markdown
[邵艾伦Alan：如何练出薄肌？训练、饮食、减脂一次讲透](https://www.bilibili.com/video/BV1httT6LEfy/)
```

GitHub 中保留可点击原始链接，网站中点击按钮才连接第三方播放器。只识别合法 BV 号和官方域名；正文中的原始 iframe、脚本等会被过滤。视频播放与评论都依赖第三方网络，始终保留原站链接。

## 评论

使用 Utterances，精确绑定 `geoqiao/boji-club` 中正文的 Issue 编号。改标题或域名不重建讨论串。新增评论无需重建站点；读者需要 GitHub 账号。Utterances GitHub App 必须具有本仓库的访问权限。

## 本地开发

需要 Node.js 24+、pnpm 和 uv。依赖由本项目的 lockfile 独立管理。

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test
pnpm build
```

仓库保留最后一次成功导出的 `content/`，本地预览不需要 Token。如需直接从最新 Issues 重新导出：

```bash
GITHUB_TOKEN="$(gh auth token)" uvx --python 3.14 escaping-site@0.6.0 export --config config.yaml --output content
```

导出返回 2 表示部分 Issue 被跳过，需要查看错误后修正；不要覆盖自动生成内容来绕过校验。

## 部署

- Worker：`boji-club`
- 自定义域名：`boji-club.geoqiao.me`
- 生产分支：`main`
- Cloudflare Git 构建：`pnpm build`
- 部署命令：`pnpm exec wrangler deploy`
- 产物目录：`dist/`
- 不启用分支预览，不需要数据库或运行时密钥

Cloudflare 使用已授权的 GitHub App 拉取仓库，构建令牌保存在 Cloudflare 内。不要把本机 OAuth Token 放入仓库或 GitHub Secrets。手动发布使用 `pnpm build && pnpm deploy`，回滚使用 `pnpm exec wrangler rollback`；代码回滚不撤销 Issue 正文的修改。

正文、搜索索引、sitemap 都在构建时生成，读者浏览不会调用 GitHub 内容 API。静态构建会检查站内链接。正文 iframe 清洗、视频域名白名单和中文目录锚点有针对性测试。

## 内容口径

首版为通用健身入门资料，训练安排中的具体组合标为本站示例；公共指南和个人实践分开写。资料来源及获取日期见各篇正文和 [研究记录](docs/research.md)。已有伤病或基础疾病时，应根据医生或具资质专业人员的建议调整。

上海新天地的健身房比较覆盖加五磅、超级猩猩与 247。门店地址、营业状态、价格、开放时段与具体设备以品牌官方小程序和现场核实为准，不根据旧活动信息填写现价。
