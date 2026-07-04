# 项目变更日志

这个文件用于从 `2026-06-28` 开始持续记录项目的重要改动。

## 使用方式

每完成一批有意义的改动，就新增一条记录。内容保持简短，但要具体。

### 记录模板

```md
## YYYY-MM-DD

### 改动
- 做了什么改动

### 涉及文件
- /absolute/or/repo-relative/path

### 原因
- 为什么要做这次改动

### 验证
- 做了哪些检查

### 下一步
- 如果还有后续工作，写在这里
```

---

## 2026-06-28

### 改动
- 为核心运行目录 `app`、`components`、`lib` 建立了第一版代码图谱
- 新增 AI 导航文档 `AGENTS.md`
- 生成代码导航与节省上下文成本所需的图谱产物

### 涉及文件
- `AGENTS.md`
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/PROJECT_MAP.md`
- `graphify-out/graph.json`
- `graphify-out/.graphify_labels.json`

### 原因
- 项目已经扩展出内容系统、SEO、`/studio` 等多个子系统
- 后续 AI 会话需要一个稳定的入口层，而不是每次都重新通读整个仓库

### 验证
- 已确认图谱文件成功生成
- 已确认 `AGENTS.md` 记录了主要阅读顺序和任务路由方式

### 下一步
- 建立长期维护用的项目进度与优化规划文档
- 后续任务默认优先使用图谱和 `AGENTS.md` 作为项目入口

## 2026-06-28

### 改动
- 新增项目治理文档，用于长期维护
- 建立当前项目状态视图与下一阶段易用性优化规划

### 涉及文件
- `PROJECT_CHANGELOG.md`
- `PROJECT_STATUS.md`
- `USABILITY_OPTIMIZATION_PLAN.md`

### 原因
- 网站已经能用，但后续推进开始变得零散
- 下一阶段尤其需要更清晰地跟踪 `/studio` 易用性与整体维护体验

### 验证
- 已复核仓库结构、图谱产物、`AGENTS.md`、`components/pages/studio-page.tsx`、`lib/content/studio.ts`

### 下一步
- 按 `USABILITY_OPTIMIZATION_PLAN.md` 开始执行第一阶段
- 后续所有代码改动统一记录到本文件

## 2026-06-28

### 改动
- 开始执行 `/studio` 第一阶段易用性优化
- 为内容与结构化资料列表补充搜索与语言筛选
- 为内容列表补充发布状态筛选
- 增加未保存内容离开确认
- 增加更明确的保存状态、最近保存时间与内容索引刷新提示

### 涉及文件
- `components/pages/studio-page.tsx`

### 原因
- 当前 `/studio` 已经能用，但高频编辑时查找内容、辨认状态、避免误操作仍然不够顺手

### 验证
- 已单独通过 `components/pages/studio-page.tsx` 的 ESLint 检查
- 已确认新增交互不会改动底层内容系统与 API 结构
- 已运行全量 TypeScript 检查，发现若干仓库内既有错误，和本次改动无直接关系

### 下一步
- 继续补 `/studio` 的最近编辑、快捷操作与更清晰的结果反馈
- 再单独处理仓库里已有的全局 TypeScript 问题，恢复全量检查通过

## 2026-06-28

### 改动
- 为 `/studio` 增加“快捷继续 / 最近编辑 / 最近编辑的资料”入口
- 为内容编辑与结构化资料编辑增加更清楚的状态反馈卡片
- 修复多处全局 TypeScript 旧错误，恢复全量类型检查通过
- 调整 `tsconfig.json`，避免把过期的 `next-build` 生成类型继续纳入检查

### 涉及文件
- `components/pages/studio-page.tsx`
- `components/site/reveal.tsx`
- `components/pages/contact-page.tsx`
- `lib/content/data.ts`
- `lib/content/studio.ts`
- `mdx-components.tsx`
- `tsconfig.json`

### 原因
- `/studio` 仍缺少“继续上次工作”和“快速回到最近内容”的操作入口
- 保存结果之前主要依赖零散文字提示，状态不够直观
- 仓库存在一批历史类型问题与过期生成产物引用，影响后续稳定迭代

### 验证
- 已通过 `pnpm lint`
- 已通过 `pnpm exec tsc --noEmit --pretty false`

### 下一步
- 继续做 `/studio` 的快捷操作与列表效率优化
- 视情况继续把根目录 `README.md` 改造成真实项目说明

## 2026-06-28

### 改动
- 为 `/studio` 内容列表补充快捷操作
  - 复制 slug
  - 复制内容文件路径
  - 打开公开页
  - 一键填充同类新建参数
- 重写根目录 `README.md`，改为真实项目入口文档
- 让 `README.md` 与当前项目进度、优化规划、变更日志、AI 导航文档衔接

### 涉及文件
- `components/pages/studio-page.tsx`
- `README.md`

### 原因
- `/studio` 内容列表虽然已经能筛选和搜索，但高频编辑时仍缺少真正省步数的快捷动作
- 仓库根目录文档仍是模板内容，无法承接当前项目的真实维护状态

### 验证
- 已通过 `pnpm lint`
- 已通过 `pnpm exec tsc --noEmit --pretty false`

### 下一步
- 继续优化 `/studio` 的批量操作、结果提示和内容组织效率
- 视情况继续清理图谱产物目录与仓库根目录结构

## 2026-06-29

### 改动
- 为 `/studio` 页面增加访问门禁
- 为 `/api/studio/*` 接口增加统一访问保护
- 新增基于 `STUDIO_PASSWORD` 的最小可用认证方案
- 在 `README.md` 中补充 Studio 访问保护配置说明

### 涉及文件
- `lib/studio-auth.ts`
- `components/pages/studio-access-page.tsx`
- `app/studio/page.tsx`
- `app/api/studio/auth/route.ts`
- `middleware.ts`
- `README.md`

### 原因
- 之前任何人都可以直接访问编辑后台和相关接口，存在明显安全风险

### 验证
- 已通过 `pnpm lint`
- 已通过 `pnpm exec tsc --noEmit --pretty false`

### 下一步
- 为 Studio 增加退出登录入口
- 视部署方式补充环境变量配置与安全说明

## 2026-06-29

### 改动
- 为 Studio 增加“退出登录”按钮
- 退出时会清理认证 session，并清空本地最近编辑记录

### 涉及文件
- `components/pages/studio-page.tsx`

### 原因
- 既然已经加了 Studio 访问保护，就需要完整的退出闭环，方便切换设备、演示和本地共享环境使用

### 验证
- 已通过 `pnpm lint`
- 已通过 `pnpm exec tsc --noEmit --pretty false`

### 下一步
- 视需要继续补登录状态提示或更细的后台安全策略
