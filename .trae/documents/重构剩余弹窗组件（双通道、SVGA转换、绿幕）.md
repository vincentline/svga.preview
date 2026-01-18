# 重构剩余弹窗为 Vue 组件

## 目标
将 `index.html` 中剩余的硬编码弹窗（双通道转换、SVGA 转换、绿幕抠图）全部重构为通用的 Vue 组件，统一代码风格并提升可维护性。

## 涉及文件
1.  **新增** `docs/assets/js/components/dual-channel-panel.js`：通用“转双通道 MP4”面板（替代 `svga-to-mp4-panel.js`）。
2.  **新增** `docs/assets/js/components/to-svga-panel.js`：通用“转 SVGA”面板。
3.  **新增** `docs/assets/js/components/chromakey-panel.js`：绿幕抠图面板。
4.  **删除** `docs/assets/js/components/svga-to-mp4-panel.js`：已被 `dual-channel-panel.js` 取代。
5.  **修改** `docs/index.html`：替换所有相关 HTML 为组件标签。
6.  **修改** `docs/assets/js/app.js`：注册新组件，更新数据传递逻辑。

## 实施步骤

### 1. 创建通用组件
-   **`dual-channel-panel.js`**:
    -   功能：提供转双通道 MP4 的配置（遮罩位置、尺寸、质量、帧率、静音）。
    -   复用：用于 Lottie、序列帧、普通 MP4 转双通道，以及 SVGA 转双通道。
-   **`to-svga-panel.js`**:
    -   功能：提供转 SVGA 的配置（尺寸、质量、帧率、静音）。
    -   包含：预估内存/文件大小的展示区域。
    -   复用：用于 MP4、双通道 MP4、Lottie、序列帧 转 SVGA。
-   **`chromakey-panel.js`**:
    -   功能：绿幕抠图设置（开关、相似度、平滑度）。

### 2. 更新 `app.js`
-   注册组件：`dual-channel-panel`, `to-svga-panel`, `chromakey-panel`。
-   数据标准化：
    -   新增 `dualChannelSourceInfo` 和 `toSvgaSourceInfo` 数据对象，用于向通用组件传递源文件信息。
    -   新增 `toSvgaEstimateInfo` 用于传递预估数据。
-   逻辑适配：
    -   更新 `open...Panel` 方法，填充上述标准数据对象。
    -   删除冗余的 `on...Change` 方法（尺寸联动逻辑移至组件内部）。

### 3. 更新 `index.html`
-   引入新脚本，移除旧脚本。
-   使用 `<dual-channel-panel>` 替换原来的 4 个类似的 HTML 块。
-   使用 `<to-svga-panel>` 替换原来的 4 个类似的 HTML 块。
-   使用 `<chromakey-panel>` 替换绿幕面板 HTML。

## 预期效果
-   `index.html` 将减少约 600 行代码。
-   所有转换类弹窗逻辑统一，UI 风格一致。
-   消除重复代码，降低维护成本。
