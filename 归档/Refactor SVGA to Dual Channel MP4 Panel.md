我将把 "SVGA 转双通道 MP4" 面板重构为一个 Vue 组件，以提高代码的模块化程度。

**计划步骤：**

1.  **创建新组件文件**：
    *   创建 `docs/assets/js/components/svga-to-mp4-panel.js`。
    *   将 `index.html` 中 (第 712-843 行) 的 HTML 模板提取到该文件中。
    *   在组件内部封装配置逻辑（如宽高联动、通道模式选择）。

2.  **注册组件**：
    *   更新 `docs/assets/js/components/index.js`，引入并注册 `svga-to-mp4-panel` 组件。

3.  **更新 `index.html`**：
    *   删除原有的面板 HTML 代码，替换为 `<svga-to-mp4-panel>` 组件标签。

4.  **更新 `app.js`**：
    *   修改 `startMP4Conversion` 方法，使其支持接收组件传递的配置参数。
    *   更新 `openMP4Panel` 方法，将初始配置传递给组件。
    *   删除 `app.js` 中不再需要的事件处理函数（如 `toggleChannelModeDropdown` 等）。

5.  **验证**：
    *   验证面板能否正常打开和关闭。
    *   验证宽高锁定等交互逻辑是否正常。
    *   验证转换功能是否能正常启动和完成。
