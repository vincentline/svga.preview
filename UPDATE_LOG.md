## 更新日志规则
- 除忽略项外，所有文件/文件夹的新增、删除、修改、重命名、移动均需记录
- 记录项：操作类型、路径、改动要点（功能/修复/优化等）
- 忽略项：
  - .gitignore过滤的文件和文件夹
  - 本文件（UPDATE_LOG.md）
- 更新日志后，必须自我验证：
  - 时间戳是否为正确的北京时间
  - 格式是否符合规范
  - 记录是否完整（包含所有必需字段）
- 更新记录默认保留60天，超过60天的记录可以根据需要删除

## 记录格式
时间戳 【操作类型】 : 路径信息 - 更新简述
- 时间戳：必须使用北京时间，格式为 [YYYY-MM-DD HH:MM:SS]，精确到秒
- 操作类型：新增文件、新增文件夹、删除文件、删除文件夹、修改文件、重命名文件、重命名文件夹、移动文件、移动文件夹
- 路径信息：使用相对路径
- 更新简述：如新增功能、修复问题、优化性能等，简单描述

## 更新记录
[2026-02-06 17:14:37] 【修改文件】 : INDEX.md - 更新功能索引，添加webp-panel和frames-panel组件的索引，并更新版本信息
[2026-02-06 17:14:37] 【修改文件】 : README.md - 更新功能概览，添加WebP导出功能的说明，包括SVGA模块和双通道MP4模块的WebP导出支持
[2026-02-06 17:14:37] 【新增文件】 : .trae/documents/弹窗开发问题分析与总结.md - 新增弹窗开发问题分析与总结文档，记录webp面板开发过程中遇到的问题和解决方案
[2026-02-06 17:14:37] 【修改文件】 : .trae/documents/侧边弹窗开发经验文档.md - 更新侧边弹窗开发经验文档，添加webp面板开发案例和相关最佳实践
[2026-02-06 02:58:58] 【新增文件】 : .trae/documents/项目文件管理规范.md - 新增项目文件管理规范文档，规范项目文件组织和命名，为AI生成文件和管理文件提供参考标准
[2026-02-05 16:00:00] 【修改文件】 : src/assets/js/mixins/panel-mixin.js - 添加插队加载ffmpeg的逻辑，当用户打开转SVGA弹窗时立即优先加载ffmpeg库
[2026-02-05 16:00:00] 【修改文件】 : src/assets/js/service/ffmpeg/ffmpeg-service.js - 移除备用线路的逻辑，确保固定使用主线路，不使用备用方案
[2026-02-05 16:00:00] 【修改文件】 : src/assets/js/core/app.js - 添加extractYyevaFramesOptimized方法，使用FFmpeg批量提取帧，移除降级到原始方法的逻辑，确保FFmpeg加载失败时直接报错
[2026-02-05 16:00:00] 【修改文件】 : src/assets/js/service/library-loader.js - 修改ffmpeg的配置，移除fallbackUrls，并修改loadSingleLibrary方法，确保当库没有fallbackUrls时，加载失败会直接报错而不是尝试其他URL
[2026-02-05 16:00:00] 【修改文件】 : README.md - 添加性能优化的相关内容，包括双通道MP4转SVGA的性能优化措施
[2026-02-05 16:00:00] 【修改文件】 : INDEX.md - 更新功能索引，添加extractYyevaFramesOptimized方法的索引，并更新版本信息
[2026-02-05 17:00:00] 【修改文件】 : src/assets/js/mixins/panel-mixin.js - 添加调试日志，优化插队加载ffmpeg的逻辑
[2026-02-05 17:00:00] 【修改文件】 : src/assets/js/service/ffmpeg/ffmpeg-service.js - 添加调试日志，确保固定使用ffmpeg的逻辑正确
[2026-02-05 17:00:00] 【修改文件】 : src/assets/js/core/app.js - 添加调试日志，修复extractYyevaFramesOptimized方法中的变量引用错误
[2026-02-05 17:00:00] 【修改文件】 : INDEX.md - 更新版本信息，从1.1.4更新到1.1.5
[2026-02-04 19:42:49] 【修改文件】 : src/assets/js/service/site-config-loader.js - 修改本地开发模式配置加载逻辑，尝试加载本地 site-config.json 文件，确保未登录用户侧边栏按钮被正确隐藏
[2026-02-04 19:17:41] 【修改文件】 : src/assets/js/controllers/user-type-controller.js - 实现响应式登录状态管理，添加观察者模式和登录状态轮询检测机制，扩展元素控制 API
[2026-02-04 19:17:41] 【修改文件】 : src/assets/js/core/app.js - 移除手动调用 UserTypeController.refresh() 的代码，使用自动登录状态轮询检测
[2026-02-04 09:10:45] 【修改文件】 : src/assets/js/service/dual-channel/dual-channel-composer.js - 修复双通道合成器Web Worker加载问题，实现内联代码方式加载Worker，解决内存配额问题，添加分批处理机制
[2026-02-04 03:40:21] 【新增文件】 : copy-static.py - 新增 Python 版静态资源复制和压缩脚本
[2026-02-04 03:40:21] 【修改文件】 : package.json - 更新 copy-static 脚本为 Python 版本
[2026-02-04 02:50:24] 【新增文件】 : vite.config.js - 新增 Vite 构建配置文件
[2026-02-04 02:50:24] 【新增文件】 : copy-static.ps1 - 新增静态资源复制和压缩脚本
[2026-02-04 02:50:24] 【修改文件】 : package.json - 更新构建脚本和依赖，添加 Vite 相关配置
[2026-02-04 02:50:24] 【修改文件】 : src/assets/js/service/library-loader.js - 修复 ES 模块语法错误，替换 import() 为传统脚本加载
[2026-02-04 02:50:24] 【修改文件】 : README.md - 更新项目文档，添加 Vite 构建化相关信息
[2026-02-04 02:50:24] 【修改文件】 : INDEX.md - 更新文件路径索引，从 docs/ 改为 src/
[2026-01-01 09:30:00] 【新增文件】 : UPDATE_LOG.md - 新增文件