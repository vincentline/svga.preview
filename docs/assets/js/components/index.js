/**
 * @file index.js
 * @description 组件库入口文件，用于统一加载所有组件
 * @author SvgaPreview Team
 * @date 2026-01-18
 */

// 注意：这里仅作为文件索引说明，实际加载是在 HTML 中通过 script 标签引入的。
// 由于项目未使用模块化构建工具（如 Webpack/Vite），因此无法使用 export/import。
// 组件会自动注册到 window.SvgaPreview.Components 命名空间下。

// 组件列表：
// 1. material-panel.js - 素材替换面板
// 2. gif-panel.js - GIF 导出面板
// 3. svga-to-mp4-panel.js - SVGA 转双通道 MP4 面板

// 确保命名空间存在
(function (global) {
  global.SvgaPreview = global.SvgaPreview || {};
  global.SvgaPreview.Components = global.SvgaPreview.Components || {};
})(window);
