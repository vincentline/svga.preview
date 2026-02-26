# Tasks

## Task 1: 创建 YYEVA 解析服务模块
- [x] 创建 `src/assets/js/service/yyeva/yyeva-parser.js` - YYEVA Metadata 解析器
  - [x] 实现 `parseYyevaMetadata(file)` 方法，从 MP4 中提取 JSON 数据
  - [x] 实现 Base64 解码 + zlib 解压
  - [x] 返回解析后的 YYEVA 数据结构

## Task 2: 扩展文件验证器
- [x] 修改 `src/assets/js/utils/file-validator.js`
  - [x] 新增 `detectYyevaType(file, callback)` 方法
  - [x] 复用双通道检测逻辑，额外检测 YYEVA 标记
  - [x] 返回 `{ type: 'yyeva' | 'dualChannel', yyevaData?: {...} }`

## Task 3: 扩展 YyevaPlayerAdapter
- [x] 修改 `src/assets/js/controllers/player-controller.js`
  - [x] 在 `YyevaPlayerAdapter` 中添加 `yyevaData` 猔态
  - [x] 新增 `renderDynamicElements(frameIndex)` 方法
  - [x] 新增 `setYyevaText(effectTag, config)` 方法
  - [x] 新增 `setYyevaImage(effectTag, imageSource)` 方法

## Task 4: 扩展核心渲染逻辑
- [x] 修改 `src/assets/js/core/app.js`
  - [x] 在 `loadYyeva` 中集成 YYEVA 数据解析
  - [x] 扩展 `renderYyevaFrame` 方法，添加动态元素渲染
  - [x] 新增 `yyevaEffectConfig` 状态，存储动态元素配置
  - [x] 新增 `setYyevaText` 和 `setYyevaImage` 方法

## Task 5: 添加动态元素渲染实现
- [x] 在 `yyeva-parser.js` 或新建模块中实现：
  - [x] `renderYyevaText(ctx, effect, data, config)` - 渲染文本元素
  - [x] `renderYyevaImage(ctx, effect, data, config)` - 渲染图片元素
  - [x] 处理 `renderFrame` 和 `outputFrame` 坐标转换

## Task 6: 更新帮助文档
- [x] 修改 `src/help.md`
  - [x] 更新格式支持表格，标注 YYEVA 双通道 MP4 支持播放

---

# Task Dependencies
- Task 2 依赖 Task 1（需要解析器)
- Task 3 依赖 Task 1(需要数据结构)
- Task 4 依赖 Task 2 和 Task 3
- Task 5 依赖 Task 1
- Task 6 依赖 Task 4 完成验证
