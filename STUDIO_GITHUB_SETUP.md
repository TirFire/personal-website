# Studio GitHub 云端编辑配置

这份文档用于把 `/studio` 切到 GitHub 云端编辑模式。

## 原理

当下面两个条件同时满足时：

- 已设置 `STUDIO_GITHUB_TOKEN`
- 仓库地址可确定

`/studio` 会自动切到 `GitHub 云端编辑模式`：

- 博客 / 笔记 / 项目：直接读写仓库里的 `content/**/*.mdx`
- 结构化资料：直接读写仓库里的 `content/data/*.json`
- 上传素材：直接写入仓库里的 `public/uploads/studio/**`

每次保存、删除、上传都会直接提交到 GitHub，对接到 Vercel 的主分支后会自动触发重新部署。

## 必填环境变量

在 Vercel 项目环境变量中至少设置：

```bash
STUDIO_PASSWORD=你的Studio密码
STUDIO_GITHUB_TOKEN=你的GitHub令牌
```

## 推荐补充环境变量

```bash
STUDIO_GITHUB_REPO=TirFire/personal-website
STUDIO_GITHUB_BRANCH=main
STUDIO_GITHUB_COMMITTER_NAME=Studio Bot
STUDIO_GITHUB_COMMITTER_EMAIL=41898282+github-actions[bot]@users.noreply.github.com
```

说明：

- `STUDIO_GITHUB_REPO` 不填时，会优先回退到站点配置里的仓库地址
- `STUDIO_GITHUB_BRANCH` 不填时，默认使用 `main`
- `STUDIO_GITHUB_TOKEN` 建议使用 Fine-grained Personal Access Token

## GitHub Token 权限建议

这个 Token 至少需要对目标仓库有：

- `Contents: Read and write`
- 如果仓库是私有仓库，还需要确保该 Token 被授权访问这个仓库

## Vercel 配置建议

在 Vercel 项目中：

1. 打开 `Settings -> Environment Variables`
2. 添加上面的环境变量
3. 重新部署一次

## 启用后的表现

启用成功后，打开 `/studio` 顶部会看到：

- `GitHub 云端编辑模式`

此时：

- 可以在公网直接编辑内容
- 保存后会写回 GitHub
- Vercel 会重新部署，几分钟后公开页面同步更新

## 当前第一版的边界

这一版已经能用，但还有几个现实边界：

- 上传到 GitHub 的图片，公开站点要等重新部署后才会真正出现在正式页面
- 改完内容后，`/studio` 里的公开链接不会瞬时反映新部署结果
- “改 slug/改 locale” 当前会走“新建目标文件 + 删除旧文件”的两次提交，不是单次原子提交

这些都属于后续可以继续打磨的范围，不影响第一版云端编辑落地。
