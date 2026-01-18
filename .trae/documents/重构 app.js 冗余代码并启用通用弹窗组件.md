# 重构冗余代码：统一右侧弹窗组件

我发现 `app.js` 中保留了大量针对不同输入源（MP4/Lottie/序列帧）的重复弹窗逻辑（如 `showMp4ToSvgaPanel`、`showLottieToSvgaPanel` 等），且 `index.html` 中尚未引入已创建的通用组件 `<to-svga-panel>` 和 `<dual-channel-panel>`。

我将执行以下步骤来清理冗余代码并启用新组件：

## 1. 修改 `index.html`：引入通用组件
- 在 `#app` 容器内添加 `<to-svga-panel>` 组件，用于处理所有“转 SVGA”的需求。
- 在 `#app` 容器内添加 `<dual-channel-panel>` 组件，用于处理所有“转双通道 MP4”的需求。
- 绑定统一的状态变量（如 `toSvgaConfig`、`isConvertingToSvga` 等）。

## 2. 重构 `app.js`：清理冗余数据与方法
### A. “转 SVGA”功能重构
- **删除**：
  - 冗余状态：`showMp4ToSvgaPanel`, `showLottieToSvgaPanel`, `showImagesToSvgaPanel`
  - 冗余配置：`mp4ToSvgaConfig`, `lottieToSvgaConfig`, `imagesToSvgaConfig` (合并为 `toSvgaConfig`)
  - 冗余进度：`mp4ToSvgaProgress` 等 (合并为 `toSvgaProgress`)
- **新增/修改**：
  - 统一状态：`toSvgaConfig`, `toSvgaSourceInfo`, `isConvertingToSvga`, `toSvgaProgress`, `toSvgaMessage`
  - 统一方法：`handleToSvgaConvert(config)` —— 根据 `currentModule` 自动分发到对应的转换逻辑。
  - 更新入口：`openMp4ToSvgaPanel` 等方法仅负责设置 `activeRightPanel = 'to-svga'` 并初始化统一配置。

### B. “转双通道 MP4”功能重构
- **删除**：
  - 冗余状态：`showMp4ToDualChannelPanel`, `showLottieToDualChannelPanel` 等
  - 冗余配置：`mp4ToDualChannelConfig` 等 (合并为 `dualChannelConfig`)
- **新增/修改**：
  - 统一状态：`dualChannelConfig`, `dualChannelSourceInfo`, `isConvertingToDualChannel` 等
  - 统一方法：`handleDualChannelConvert(config)`。

## 3. 验证与清理
- 确保所有原有功能（MP4转SVGA、Lottie转SVGA等）在新架构下正常工作。
- 确保配置持久化（`ConfigManager`）逻辑适配新的配置对象名称。

这将大幅减少 `app.js` 的代码行数并提升可维护性。