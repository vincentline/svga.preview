我已确认您恢复了 `index.html` 和 `app.js` 的状态，但保留了新创建的组件文件。

根据您的指示，我制定了详细的**GIF 面板重构计划 (修正版)**。每一步都将稳健执行，并确保模板放置在安全位置。

### 第一阶段：确认组件文件

**操作**：检查 `docs/assets/js/components/gif-panel.js` 是否存在且正确。
**预期结果**：文件已存在（我已确认），无需重新创建。如果文件内容有误，我将进行修正。

第一阶段执行结果：

### 第二阶段：修改 HTML (关键修正)

这是之前出错的地方。我们将确保组件模板放置在 Vue 挂载点之外，或者放置在正确的位置以避免解析错误。

**操作 A：引入组件脚本**
在 `docs/index.html` 底部引入 JS 文件：

```html
<script src="assets/js/components/gif-panel.js"></script>
```

**操作 B：定义组件模板 (放在文件底部)**
我们将把 `<script type="text/x-template" id="tpl-gif-panel">` 块添加到 `index.html` 的**最底部**（与其他模板并列），而不是插入到 `#app` 内部。

* **代码内容**：包含完整的 GIF 面板 DOM 结构（从原位置剪切）。

**操作 C：替换 DOM 结构**
在 `index.html` 的原位置（`div.svga-panel.gif-panel` 所在处），替换为简洁的组件标签：

<br />

```html
<!-- GIF导出弹窗 -->
<div class="svga-panel-overlay" :class="{'show': activeRightPanel === 'gif'}" @click="closeGifPanel"></div>
<gif-panel
  :visible="activeRightPanel === 'gif'"
  :source-info="getGifSourceInfo()"
  :initial-config="gifConfig"
  :bg-color-key="bgColorKey"
  :current-bg-color="currentBgColor"
  :is-exporting="isExportingGIF"
  :export-progress="gifExportProgress"
  :export-stage="gifExportStage"
  :export-message="gifExportMessage"
  @close="closeGifPanel"
  @cancel="cancelGifExport"
  @export="handleGifExport"
  @config-change="handleGifConfigChange"
></gif-panel>
```

第二阶段执行结果：

### 第三阶段：修改 App.js

**操作**：

1. **注册组件**：在 `components` 选项中添加 `'gif-panel': SP.Components.GifPanel`。
2. **状态管理**：将 `showGifPanel` 替换为 `activeRightPanel` 逻辑。
3. **方法更新**：

   * `openGifPanel`：只负责打开面板，不再处理尺寸初始化。

   * `closeGifPanel`：只负责设置 `activeRightPanel = null`。

   * 新增 `handleGifConfigChange` 和 `handleGifExport` 处理组件事件。
4. **清理冗余**：删除 `onGifWidthChange`, `onGifHeightChange` 和旧的 `gifConfig` watcher。

***

**验证点：**

* 重构后刷新页面，控制台不应报错 `sourceInfo is not defined`。

* 点击“转成 GIF”按钮，面板应正常滑出。

* 面板内的尺寸、帧率等参数应能正常显示和交互。

您是否同意按此修正后的计划执行？同意后我将开始操作。
