# 剩余弹窗组件化重构计划

## 目标

将 `index.html` 中剩余的普通弹窗（转双通道MP4、转SVGA、绿幕抠图）重构为通用的 Vue 组件，保持与之前重构的 `standard-mp4-panel` 风格一致。

## 涉及文件

1. **新建** `docs/assets/js/components/dual-channel-panel.js` (通用双通道转换面板)
2. **新建** `docs/assets/js/components/to-svga-panel.js` (通用 SVGA 转换面板)
3. **新建** `docs/assets/js/components/chroma-key-panel.js` (绿幕抠图面板)
4. `docs/index.html` (修改)
5. `docs/assets/js/app.js` (修改)

## 实施步骤

### 1. 创建通用组件

#### `dual-channel-panel.js`

* **功能**：用于 MP4、Lottie、序列帧 转 双通道MP4。

* **Props**：

  * `visible`: Boolean

  * `source-info`: Object (包含 `sizeWH`, `duration` 等)

  * `initial-config`: Object (包含 `width`, `height`, `quality`, `fps`, `channelMode` 等)

  * `is-converting`: Boolean

  * `progress`: Number

  * `message`: String

  * `disabled`: Boolean

* **Events**: `close`, `cancel`, `convert`

#### `to-svga-panel.js`

* **功能**：用于 MP4、Lottie、序列帧 转 SVGA。

* **Props**：

  * `visible`: Boolean

  * `source-info`: Object

  * `initial-config`: Object

  * `estimate`: Object (预估大小/内存)

  * `is-converting`: Boolean

  * `progress`: Number

  * `message`: String

  * `disabled`: Boolean

* **Events**: `close`, `cancel`, `convert`

#### `chroma-key-panel.js`

* **功能**：MP4 绿幕抠图设置。

* **Props**：

  * `visible`: Boolean

  * `source-info`: Object

  * `enabled`: Boolean

  * `similarity`: Number

  * `smoothness`: Number

* **Events**: `close`, `apply`, `update:enabled`, `update:similarity`, `update:smoothness`

### 2. 修改 `index.html`

* 引入上述新组件的脚本文件。

* **替换 HTML 结构**：

  * 将 `showMp4ToDualChannelPanel` 对应的 `.mp4-panel` 替换为 `<dual-channel-panel>`。

  * 将 `showLottieToDualChannelPanel` 对应的 `.mp4-panel` 替换为 `<dual-channel-panel>`。

  * 将 `showFramesToDualChannelPanel` 对应的 `.mp4-panel` 替换为 `<dual-channel-panel>`。

  * 将 `showSVGAPanel` (MP4转SVGA) 对应的 `.svga-panel` 替换为 `<to-svga-panel>`。

  * 将 `showMp4ToSvgaPanel` 对应的 `.svga-panel` 替换为 `<to-svga-panel>`。

  * 将 `showLottieToSvgaPanel` 对应的 `.svga-panel` 替换为 `<to-svga-panel>`。

  * 将 `showFramesToSvgaPanel` 对应的 `.svga-panel` 替换为 `<to-svga-panel>`。

  * 将 `showChromaKeyPanel` 对应的 `.chromakey-panel` 替换为 `<chroma-key-panel>`。

### 3. 修改 `app.js`

* 在 `components` 中注册新组件。

* 确保各模式下的 `fileInfo` 对象结构满足组件显示需求（主要是 `sizeWH` 和 `duration` 字段）。

* 对于 `chroma-key-panel`，处理 `enabled`、`similarity` 等属性的双向绑定。

## 预期效果

* 代码量显著减少，HTML 结构更清晰。

* 所有弹窗 UI 逻辑统一维护。

* 保持现有业务逻辑不变，仅重构视图层。

