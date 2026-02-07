# MeeWoo 项目功能索引
## 项目概述

MeeWoo 是一个 SVGA 动画预览与转换工具，支持多种动画格式的预览、编辑、转换和导出，提供素材替换、GIF 导出、MP4 转换等核心功能。

## 职责
- 查找项目所有功能模块时提供索引
- 确保索引内容准确、及时更新

## 目录结构

```
/
├── src/                  # 源代码目录
│   ├── assets/           # 资源文件目录
│   │   ├── css/          # 样式文件
│   │   ├── dar_svga/     # DAR SVGA 相关资源
│   │   ├── img/          # 图片资源
│   │   ├── js/           # JavaScript 代码
│   │   │   ├── components/      # 组件模块
│   │   │   ├── controllers/     # 控制器模块
│   │   │   ├── core/            # 核心功能模块
│   │   │   ├── lib/             # 库文件
│   │   │   ├── mixins/          # 混合模块
│   │   │   ├── service/         # 服务模块
│   │   │   │   ├── dual-channel/    # 双通道 MP4 相关服务
│   │   │   │   ├── ffmpeg/          # FFmpeg 相关服务
│   │   │   │   ├── oxipng/          # OXIPNG 相关服务
│   │   │   │   └── svga/            # SVGA 相关服务
│   │   │   └── utils/           # 工具函数模块
│   │   ├── mingren_gift_1photo/ # 名人礼物相关资源
│   │   ├── png/          # PNG 图片
│   │   ├── sth_auto_img/ # 素材自助相关图片
│   │   │   └── mingren_gift_video/ # 名人礼物视频
│   │   ├── svga/         # SVGA 示例文件
│   │   └── xunzhang/     # 勋章相关资源
│   ├── gadgets/          # 小工具集合
│   └── index.html        # 主应用页面
├── 归档/                 # 归档目录
├── README.md             # 项目主 README
├── AD-CONFIG-README.md   # 广告配置说明
├── CODE_STYLE.md         # 代码风格规范
├── DEVELOPMENT_FLOW.md   # 开发流程文档
├── GET_TIME.md           # 时间戳获取方法
├── LICENSE               # 项目许可证
├── SECURITY.md           # 安全说明
├── UI-DESIGN-SYSTEM.md   # UI 设计系统
├── UPDATE_LOG.md         # 更新日志
├── site-config.json      # 站点配置文件
├── package.json          # 项目依赖配置
└── 其他配置文件          # 如 .gitignore、CNAME 等
```

## 功能索引

### 1. 主要应用页面 (src/)

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `src/index.html` | 主应用页面，包含 SVGA 预览、编辑和转换功能 | 主页面、SVGA 预览、动画编辑 |
| `src/sth_auto.html` | 素材自助页面，用于 SVGA 素材替换和导出 | 素材自助、素材替换、SVGA 导出 |
| `src/coi-serviceworker.js` | COI Service Worker，用于启用 SharedArrayBuffer 支持 | COI、Service Worker、SharedArrayBuffer |
| `src/favicon.png` | 网站图标 | 网站图标、favicon |
| `src/svga.proto` | SVGA 文件格式的 Protocol Buffers 定义 | SVGA 格式、Protocol Buffers |
| `src/help.md` | 帮助文档，包含功能说明和使用指南 | 帮助文档、使用指南 |

### 2. 核心功能模块 (src/assets/js/core/)

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `src/assets/js/core/app.js` | 应用核心逻辑，包含 SVGA 播放器初始化和管理 | 应用核心、SVGA 播放器、初始化 |
| `src/assets/js/core/material-editor.js` | 素材编辑器，支持 SVGA 素材的编辑功能 | 素材编辑、素材管理、编辑器 |
| `src/assets/js/core/material-interactions.js` | 素材交互逻辑，包含素材的交互操作 | 素材交互、交互操作 |
| `src/assets/js/core/material-operations.js` | 素材操作逻辑，包含素材替换、保存等功能 | 素材操作、替换逻辑、保存逻辑 |
| `src/assets/js/core/material-state.js` | 素材状态管理，记录素材编辑状态 | 状态管理、素材状态、编辑状态 |
| `src/assets/js/core/konva-command.js` | Konva 命令系统，用于画布操作的撤销/重做 | Konva、命令系统、撤销/重做 |
| `src/assets/js/core/konva-element.js` | Konva 元素管理，用于创建和管理画布元素 | Konva、元素管理 |
| `src/assets/js/core/konva-export.js` | Konva 导出功能，用于将画布内容导出为图片 | Konva、导出功能 |
| `src/assets/js/core/konva-selection.js` | Konva 选择功能，用于选择和操作画布元素 | Konva、选择功能 |
| `src/assets/js/core/konva-stage.js` | Konva 舞台管理，用于创建和管理画布舞台 | Konva、舞台管理 |
| `src/assets/js/core/konva-transformer.js` | Konva 变形器，用于变换画布元素 | Konva、变形器、变换操作 |

### 3. 组件模块 (src/assets/js/components/)

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `src/assets/js/components/index.js` | 组件入口文件，导出所有组件 | 组件入口、导出管理 |
| `src/assets/js/components/chromakey-panel.js` | 绿幕抠图面板组件 | 绿幕抠图、面板组件、视频编辑 |
| `src/assets/js/components/dual-channel-panel.js` | 双通道 MP4 转换面板 | 双通道、MP4 转换、面板组件 |
| `src/assets/js/components/gif-panel.js` | GIF 导出面板组件 | GIF 导出、面板组件、动画转换 |
| `src/assets/js/components/material-panel.js` | 素材管理面板组件 | 素材管理、面板组件、素材替换 |
| `src/assets/js/components/standard-mp4-panel.js` | 标准 MP4 转换面板 | 标准 MP4、转换面板、视频转换 |
| `src/assets/js/components/to-svga-panel.js` | 转 SVGA 面板组件 | SVGA 转换、面板组件、格式转换 |

### 4. 混合模块 (src/assets/js/mixins/)

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `src/assets/js/mixins/panel-mixin.js` | 右侧面板管理 Mixin，负责面板状态和业务逻辑 | 面板管理、Mixin、状态管理 |

### 5. 控制器模块 (src/assets/js/controllers/)

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `src/assets/js/controllers/ad-controller.js` | 广告控制器，管理广告位和广告显示 | 广告管理、广告控制、广告位 |
| `src/assets/js/controllers/input-controller.js` | 输入控制器，处理用户输入事件 | 输入处理、事件管理、用户交互 |
| `src/assets/js/controllers/player-controller.js` | 播放器控制器，管理 SVGA 播放器状态 | 播放器管理、状态控制、播放控制 |
| `src/assets/js/controllers/user-type-controller.js` | 用户类型控制器，根据用户类型控制页面元素显示/隐藏 | 用户类型、权限控制、元素显示 |
| `src/assets/js/controllers/viewport-controller.js` | 视口控制器，管理页面视图状态和缩放 | 视口管理、状态控制、缩放控制 |

### 6. 服务模块 (src/assets/js/service/)

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `src/assets/js/service/config-manager.js` | 配置管理器，管理应用配置 | 配置管理、配置加载、应用配置 |
| `src/assets/js/service/dual-channel/` | 双通道 MP4 相关服务 | 双通道、MP4 服务、视频处理 |
| `src/assets/js/service/dual-channel/dual-channel-composer.js` | 双通道合成器，用于合成双通道视频（内置Worker代码） | 双通道、视频合成、内联Worker |
| `src/assets/js/service/ffmpeg/` | FFmpeg 相关服务，用于视频转换 | FFmpeg、视频转换、服务模块 |
| `src/assets/js/service/ffmpeg/ffmpeg-service.js` | FFmpeg 服务，提供视频转换功能 | FFmpeg、视频转换 |
| `src/assets/js/service/gif/` | GIF 导出相关服务 | GIF 导出、服务模块、动画处理 |
| `src/assets/js/service/gif/gif-exporter.js` | GIF 导出器，用于导出 GIF 动画 | GIF 导出 |
| `src/assets/js/service/gif/gif.worker.js` | GIF 工作线程，用于后台处理 GIF 导出 | GIF、工作线程 |
| `src/assets/js/service/image-compression-service.js` | 图片压缩服务，用于素材图片压缩 | 图片压缩、服务模块、图像处理 |
| `src/assets/js/service/library-loader.js` | 库加载器，动态加载第三方库 | 库管理、动态加载、第三方库 |
| `src/assets/js/service/oxipng/` | OXIPNG 相关服务，用于 PNG 优化 | OXIPNG、PNG 优化 |
| `src/assets/js/service/resource-manager.js` | 资源管理器，管理应用资源 | 资源管理、资源加载、资源释放 |
| `src/assets/js/service/site-config-loader.js` | 站点配置加载器，加载站点配置 | 站点配置、配置加载、服务模块 |
| `src/assets/js/service/svga/` | SVGA 相关服务，用于 SVGA 处理 | SVGA 服务、格式处理、动画服务 |
| `src/assets/js/service/svga/svga-builder.js` | SVGA 构建器，用于构建 SVGA 文件 | SVGA 构建、格式处理 |
| `src/assets/js/service/task-manager.js` | 任务管理器，管理应用任务 | 任务管理、异步任务、任务调度 |

### 7. 工具模块 (src/assets/js/utils/)

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `src/assets/js/utils/file-validator.js` | 文件验证工具，验证上传文件的合法性 | 文件验证、上传验证、合法性检查 |
| `src/assets/js/utils/utils.js` | 通用工具函数，包含各种辅助功能 | 工具函数、辅助功能、通用工具 |
| `src/assets/js/utils/auth-utils.js` | 登录状态管理工具，处理登录状态和token管理 | 登录状态、token管理、认证工具 |
| `src/assets/js/utils/image-api.js` | 图片处理API调用工具，与www.imghlp.com的API交互 | 图片API、跨域调用、认证处理 |

### 8. 库文件 (src/assets/js/lib/)

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `src/assets/js/lib/ffmpeg.min.js` | FFmpeg 库，用于视频转换 | FFmpeg、视频转换、第三方库 |
| `src/assets/js/lib/gif.js` | GIF 编码器，用于 GIF 导出 | GIF 编码、第三方库、动画处理 |
| `src/assets/js/lib/howler.min.js` | 音频库，用于音频处理 | 音频处理、第三方库、音效 |
| `src/assets/js/lib/html2canvas.min.js` | HTML 转 Canvas 库，用于截图和素材编辑 | HTML 转 Canvas、截图 |
| `src/assets/js/lib/jszip.min.js` | ZIP 压缩库，用于文件压缩和解压缩 | ZIP 压缩、文件处理 |
| `src/assets/js/lib/konva.min.js` | Konva 图形库，用于画布操作 | Konva、图形库、画布操作 |
| `src/assets/js/lib/lottie.min.js` | Lottie 动画库，用于 Lottie 动画播放 | Lottie、动画库、动画播放 |
| `src/assets/js/lib/marked.min.js` | Markdown 解析库，用于解析帮助文档 | Markdown 解析、帮助文档 |
| `src/assets/js/lib/pako.min.js` | 压缩库，用于 SVGA 文件压缩和解压缩 | 压缩库、SVGA 处理、第三方库 |
| `src/assets/js/lib/pngquant.wasm` | PNG 压缩库（WASM），用于 PNG 优化 | PNG 压缩、WASM |
| `src/assets/js/lib/protobuf.min.js` | Protocol Buffers 库，用于 SVGA 文件解析 | Protocol Buffers、SVGA 解析、第三方库 |
| `src/assets/js/lib/svga.min.js` | SVGA 播放器库，用于 SVGA 动画播放 | SVGA 播放器、动画播放、第三方库 |
| `src/assets/js/lib/vue.min.js` | Vue.js 框架，用于页面交互和组件管理 | Vue.js、框架、组件管理 |

### 8. 样式与资源文件

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `docs/assets/css/` | 样式文件目录，包含应用的 CSS 样式 | 样式文件、CSS、样式设计 |
| `docs/assets/dar_svga/` | DAR SVGA 相关资源 | DAR SVGA、资源文件 |
| `docs/assets/img/` | 图片资源目录，包含应用使用的各种图标和图片 | 图片资源、图标、静态资源 |
| `docs/assets/fonts/` | 字体资源目录，包含应用使用的字体文件 | 字体资源、字体文件、静态资源 |
| `docs/assets/mingren_gift_1photo/` | 名人礼物相关资源 | 名人礼物、资源文件、静态资源 |
| `docs/assets/sth_auto_img/` | 素材自助相关图片资源 | 素材自助、图片资源、静态资源 |
| `docs/assets/svga/` | SVGA 示例文件目录 | SVGA 示例、示例文件、静态资源 |
| `docs/assets/xunzhang/` | 勋章相关资源 | 勋章、资源文件 |

### 9. 小工具集合 (docs/gadgets/)

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `docs/gadgets/png_compression.html` | PNG 压缩工具页面 | PNG 压缩、小工具、图片优化 |
| `docs/gadgets/png_compression.js` | PNG 压缩工具的 JavaScript 逻辑 | PNG 压缩、JavaScript、图片处理 |
| `docs/gadgets/png_compression.css` | PNG 压缩工具的样式文件 | PNG 压缩、CSS、样式设计 |
| `docs/gadgets/fix_garbled_text.html` | 修复中文乱码工具页面 | 中文乱码、修复工具、字符编码 |
| `docs/gadgets/fix_garbled_logic.js` | 修复中文乱码的核心逻辑 | 中文乱码、修复逻辑、字符编码 |
| `docs/gadgets/common_chars.js` | 常用字符集数据 | 字符集、数据文件、字符编码 |
| `docs/gadgets/encoding-indexes.js` | 编码索引数据 | 编码索引、数据文件、字符编码 |

### 10. 根目录文档和配置文件

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `README.md` | 项目主 README，包含功能概览和使用说明 | 项目说明、功能概览、使用指南 |
| `AD-CONFIG-README.md` | 广告配置说明文档 | 广告配置、说明文档 |
| `CODE_STYLE.md` | 代码风格规范文档 | 代码规范、编码标准、风格指南 |
| `DEVELOPMENT_FLOW.md` | 开发流程文档 | 开发流程、工作流、开发规范 |
| `GET_TIME.md` | 时间戳获取方法文档 | 时间戳、获取方法 |
| `LICENSE` | 项目许可证文件 | 许可证、版权 |
| `SECURITY.md` | 安全说明文档 | 安全、说明文档 |
| `UI-DESIGN-SYSTEM.md` | UI 设计系统文档 | UI 设计、设计系统 |
| `UPDATE_LOG.md` | 更新日志，记录版本更新内容 | 更新日志、版本记录、变更历史 |
| `site-config.json` | 站点配置文件 | 站点配置、配置文件、应用配置 |
| `.gitignore` | Git 忽略文件配置 | Git、忽略文件、版本控制 |
| `.qoderignore` | Qoder 忽略文件配置 | Qoder、忽略文件 |
| `.traerc` | Trae 配置文件 | Trae、配置文件、开发工具 |
| `.vercelignore` | Vercel 忽略文件配置 | Vercel、忽略文件 |
| `CNAME` | 域名配置文件 | 域名配置、CNAME、部署配置 |
| `package.json` | 项目依赖配置文件 | 依赖配置、package.json |

### 11. 其他工具和脚本

| 文件路径 | 功能描述 | 关键词 |
|---------|---------|--------|
| `csv_to_json.py` | CSV 转 JSON 的脚本 | CSV 转换、JSON、脚本工具 |
| `generate-sprite.py` | 生成 sprite 图片的脚本 | Sprite 生成、脚本工具、图片处理 |
| `git-push.ps1` | Git 推送脚本，用于代码推送 | Git、推送脚本、版本控制 |
| `run-deploy.ps1` | 部署运行脚本 | 部署脚本、PowerShell |
| `run-dev.ps1` | 开发运行脚本 | 开发脚本、PowerShell |
| `run-static.ps1` | 静态运行脚本 | 静态脚本、PowerShell |
| `start_server.py` | 启动本地服务器的脚本 | 服务器启动、本地开发、脚本工具 |

## 使用说明

1. **按关键词查找**：通过关键词列可以快速定位相关功能
2. **按模块查找**：根据模块分类查找相关功能
3. **按文件路径查找**：直接通过文件路径定位具体文件

## 维护指南

- 新增功能时，请在对应模块下添加索引条目
- 修改功能时，请及时更新索引描述
- 删除功能时，请同步删除对应的索引条目

## 版本信息

- 索引版本：1.1.2
- 最后更新：[2026-02-02 14:30:00]
- 适用项目版本：v1.0.0
