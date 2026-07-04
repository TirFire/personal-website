# personal-website

这是一个基于 Next.js 16 构建的个人网站项目，当前定位是：

- 研究型个人主页
- 项目档案库
- 技术写作与学习记录平台
- 带有生活化内容层的长期内容站点

当前项目已经完成主骨架搭建，重点进入“易用性优化、内容维护效率提升、长期维护文档化”的阶段。

## 当前状态

可以先看这几份项目治理文档：

- [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- [USABILITY_OPTIMIZATION_PLAN.md](./USABILITY_OPTIMIZATION_PLAN.md)
- [PROJECT_CHANGELOG.md](./PROJECT_CHANGELOG.md)
- [AGENTS.md](./AGENTS.md)

如果你是新接手这个仓库，优先看：

1. `README.md`
2. `PROJECT_STATUS.md`
3. `USABILITY_OPTIMIZATION_PLAN.md`
4. `AGENTS.md`

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- MDX
- Giscus
- Vercel Analytics

## 目录结构

```text
app/                     路由层与 API
components/              页面组件、布局组件、UI 组件
content/
  data/                  结构化 JSON 内容
  zh|en/                 博客 / 笔记 / 项目的 MDX 内容
lib/
  content/               内容读取、Studio、索引生成辅助逻辑
  seo.ts                 SEO 与 metadata
public/                  静态资源
scripts/                 内容索引与校验脚本
graphify-out/            当前项目代码图谱输出
```

## 内容系统

项目目前有两套内容来源：

### 1. MDX 内容

用于：

- 博客
- 学习笔记
- 项目档案

目录：

```text
content/zh/blog
content/zh/notes
content/zh/projects
content/en/blog
content/en/notes
content/en/projects
```

内容索引由下面的命令生成：

```bash
pnpm content:generate
```

### 2. 结构化 JSON 内容

用于：

- 个人资料
- 社交信息
- 研究方向
- Now
- 说说
- 相册
- 友链
- 站点配置

目录：

```text
content/data
```

## `/studio` 工作台

`/studio` 是当前项目最重要的后台内容入口，已经支持：

- 新建和编辑 MDX 内容
- 编辑结构化 JSON 资料
- 预览 MDX 渲染结果
- 上传图片与部分媒体资源
- 导入 `.md` / `.mdx`
- 部分 Obsidian 内容兼容

当前已经完成一轮易用性增强，包括：

- 内容搜索
- 草稿 / 已发布筛选
- 语言筛选
- 最近编辑
- 继续上次内容
- 更清晰的保存状态反馈
- 内容列表快捷操作
  - 复制 slug
  - 复制路径
  - 打开公开页
  - 一键填充同类新建参数

### Studio 访问保护

`/studio` 与 `/api/studio/*` 现在已经接入访问保护。

推荐在环境变量中设置：

```bash
STUDIO_PASSWORD=your-strong-password
```

行为规则：

- 生产环境：强烈建议始终设置 `STUDIO_PASSWORD`
- 本地开发：如果未设置密码，系统默认放行，方便本地调试
- 一旦设置密码，页面访问和相关 API 调用都会要求授权

## 本地开发

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm dev
```

默认会先生成内容索引，再启动 Next.js 开发服务器。

## 常用命令

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm content:generate
pnpm content:check
pnpm exec tsc --noEmit
```

## 部署说明

当前项目已经适配 Vercel 部署。

构建流程依赖：

```bash
pnpm content:generate
pnpm build
```

如果部署到其他平台，至少要保证：

- Node 环境可用
- `pnpm` 可用
- 构建前会运行 `content:generate`

## 代码图谱与 AI 辅助入口

当前仓库已经建立第一版代码图谱，用于帮助 AI 更快理解项目结构，减少重复读取成本。

相关文件：

- `AGENTS.md`
- `graphify-out/PROJECT_MAP.md`
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.json`

如果后续代码结构变化较大，建议重新更新图谱。

## 当前维护重点

接下来最重要的方向不是继续堆新页面，而是：

1. 继续优化 `/studio` 的维护效率
2. 做整站桌面端 / 移动端适配 QA
3. 收口视觉细节与字体系统
4. 继续完善项目文档和维护流程

详细规划见：

- [USABILITY_OPTIMIZATION_PLAN.md](./USABILITY_OPTIMIZATION_PLAN.md)

## 验证要求

后续改动建议至少执行：

```bash
pnpm lint
pnpm exec tsc --noEmit
```

如果改动涉及内容系统，额外执行：

```bash
pnpm content:generate
pnpm content:check
```

## 备注

- `next-build/` 是历史构建产物目录，不再纳入当前 TypeScript 检查范围
- `graphify-out/` 为当前图谱输出目录，后续可以按需要继续更新
- 当前仓库根目录下的治理文档已经是后续推进的单一事实来源，尽量不要再把状态只留在聊天记录里
