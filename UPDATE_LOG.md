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
[2026-02-07 13:37:09] 【修改文件】 : site-config.json - 更新配置结构为新的用户层级结构，支持 anonymous、loggedIn、admin 三个层级的继承关系
[2026-02-07 13:37:09] 【修改文件】 : src/assets/js/controllers/user-type-controller.js - 实现新的用户类型检测和配置应用逻辑，支持层级继承和新的配置结构
[2026-02-07 13:37:09] 【修改文件】 : src/assets/js/service/site-config-loader.js - 移除旧的 userType 相关方法，添加 getUserLevelsConfig 方法
[2026-02-07 13:37:09] 【修改文件】 : src/assets/js/controllers/ad-controller.js - 更新为使用新的 userLevels 配置结构和层级继承逻辑
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