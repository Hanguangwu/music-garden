# 音乐花园 · Music Garden

> 纯前端多源音乐搜索与播放器，部署于 GitHub Pages。

## 功能特性

- **多源聚合搜索** — 同时搜索网易云、QQ音乐、酷我、酷狗、咪咕五大平台
- **在线播放** — 支持播放/暂停、上一曲/下一曲、进度拖拽、音量控制
- **播放模式** — 顺序播放、单曲循环、随机播放
- **歌词同步** — 自动获取 LRC 歌词，实时滚动高亮
- **播放列表** — 管理当前队列，支持导入/清空
- **收藏夹** — 收藏喜欢的歌曲，独立管理
- **数据持久化** — 播放列表、收藏、音量设置自动保存至 localStorage

## 架构说明

```
浏览器 ──→ CORS Proxy ──→ Meting API (api.qijieya.cn) ──→ 音乐平台
         (corsproxy.io)        ↓
                           JSON 响应 + CORS 头 ──→ 浏览器
```

本项目是**纯前端应用**，部署在 GitHub Pages 上，没有后端服务器。

由于浏览器同源策略限制，前端无法直接调用第三方音乐 API。解决方案是通过公共 CORS 代理服务 `corsproxy.io` 转发请求，代理在响应中添加 `Access-Control-Allow-Origin` 头，从而绕过浏览器的跨域限制。

### API 来源

| API | 地址 | 状态 |
|-----|------|------|
| Meting | `api.qijieya.cn/meting` | ✅ 可用（经 CORS 代理） |
| TuneHub | `music-dl.sayqz.com` | ❌ 服务端宕机（502） |
| JBSou | `www.jbsou.cn` | ❌ 接口不兼容（405） |

目前实际可用的搜索源为 Meting API，覆盖网易云、QQ音乐、酷我、酷狗四个平台。

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Vue 3（Composition API + `<script setup>`） |
| 语言 | TypeScript |
| 构建 | Vite |
| 样式 | CSS Variables + Glassmorphism 设计 |
| 部署 | GitHub Pages（GitHub Actions 自动部署） |
| CORS 代理 | corsproxy.io |

无外部 UI 库依赖，无后端依赖。

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查并构建
pnpm build

# 预览构建产物
pnpm preview
```

### 开发环境 CORS 说明

本地开发时浏览器同样会拦截跨域请求。有两种方式解决：

1. **配置 Vite 代理**（推荐）：在 `vite.config.ts` 中添加 `server.proxy` 规则
2. **使用线上 CORS 代理**：代码默认已配置 `corsproxy.io`，开发环境同样生效

如需切换 CORS 代理服务，修改 `src/services/api.ts` 中的 `defaultApiConfig.corsProxy` 值即可。

## 部署

推送到 `main` 分支会自动触发 GitHub Actions 构建并部署到 GitHub Pages：

```bash
git push origin main
```

部署配置见 `.github/workflows/deploy.yml`。

如果使用自己的域名，修改 `vite.config.ts` 中的 `base` 路径。

## 项目结构

```
src/
├── App.vue                  # 主布局，状态协调
├── main.ts                  # 入口
├── style.css                # 全局样式 + CSS 变量
├── components/
│   ├── SearchPanel.vue      # 搜索面板
│   ├── PlayerPanel.vue      # 播放器控制面板
│   ├── LyricsDisplay.vue    # 歌词显示
│   ├── PlaylistPanel.vue    # 播放列表 / 收藏夹
│   └── Toast.vue            # 轻提示
├── composables/
│   ├── useSearch.ts         # 搜索逻辑
│   ├── usePlayer.ts         # 播放器逻辑
│   └── useStorage.ts        # localStorage 持久化
├── services/
│   └── api.ts               # API 调用层 + CORS 代理
└── types/
    └── index.ts             # 类型定义
```

## 免责声明

本项目仅供学习和个人使用。音乐版权归各音乐平台所有，请勿将本项目用于商业用途或侵权用途。
