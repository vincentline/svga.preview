# 重构普通 MP4 转换弹窗

## 目标
将 `index.html` 中硬编码的“转换为普通MP4格式”弹窗 UI 提取为独立的 Vue 组件，并与 `gif-panel.js`、`material-panel.js` 等保持一致的封装风格。

## 涉及文件
1.  `docs/assets/js/components/standard-mp4-panel.js` (已存在，确认无需修改)
2.  `docs/index.html`
3.  `docs/assets/js/app.js`

## 实施步骤

### 1. 修改 `index.html`
- **引入组件脚本**：在 `app.js` 之前引入 `assets/js/components/standard-mp4-panel.js`。
- **替换 HTML**：删除原有的 `<div class="mp4-panel" ...>` 代码块（约 100 行），替换为 `<standard-mp4-panel>` 组件标签。
- **绑定属性**：
  - `visible`: 绑定到 `showStandardMp4Panel`
  - `source-info`: 绑定到新属性 `standardMp4SourceInfo`
  - `initial-config`: 绑定到 `standardMp4Config`
  - `is-converting`: 绑定到 `isConvertingStandardMp4`
  - `progress`: 绑定到 `standardMp4Progress`
  - `message`: 绑定到 `standardMp4Message`
  - `disabled`: 绑定到 `isGlobalTaskRunning`
  - `current-module`: 绑定到 `currentModule`
- **绑定事件**：
  - `@close`: 调用 `closeStandardMp4Panel`
  - `@cancel`: 调用 `cancelStandardMp4Conversion`
  - `@convert`: 调用 `startStandardMp4Conversion`

### 2. 修改 `app.js`
- **注册组件**：在 `components` 选项中注册 `'standard-mp4-panel': SP.Components.StandardMp4Panel`。
- **新增数据属性**：添加 `standardMp4SourceInfo` 用于传递源文件信息给组件。
- **更新 `openStandardMp4Panel` 方法**：
  - 保留原有的宽高、帧率获取逻辑。
  - 在设置 `standardMp4Config` 的同时，构造并设置 `standardMp4SourceInfo`（包含 `sizeWH`, `duration`, `typeLabel` 等）。
- **更新 `startStandardMp4Conversion` 方法**：
  - 修改函数签名，接收组件传递的 `config` 参数。
  - 使用传入的 `config` 替代原本对 `this.standardMp4Config` 的依赖。
- **清理冗余代码**：
  - 删除 `onStandardMp4WidthChange` 和 `onStandardMp4HeightChange` 方法（已由组件内部处理）。

## 预期效果
- 弹窗逻辑与主业务逻辑解耦。
- 所有弹窗组件（GIF、双通道MP4、普通MP4、素材面板）风格统一。
- 代码更简洁，易于维护。
