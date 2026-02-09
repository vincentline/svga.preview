/**
 * @file index.js
 * @description 组件库入口文件，用于统一加载所有组件
 * @author SvgaPreview Team
 * @date 2026-01-18
 */

// 注意：这里仅作为文件索引说明，实际加载是在 HTML 中通过 script 标签引入的。
// 由于项目未使用模块化构建工具（如 Webpack/Vite），因此无法使用 export/import。
// 组件会自动注册到 window.MeeWoo.Components 命名空间下。

// 组件列表：
// 1. material-panel.js - 素材替换面板
// 2. gif-panel.js - GIF 导出面板
// 3. frames-panel.js - 序列帧导出面板
// 4. webp-panel.js - WebP 导出面板
// 5. standard-mp4-panel.js - 标准 MP4 转换面板
// 6. dual-channel-panel.js - 双通道 MP4 转换面板
// 7. to-svga-panel.js - 转 SVGA 面板
// 8. chromakey-panel.js - 绿幕抠图面板

// 确保命名空间存在
// 按照项目规范，使用 MeeWoo 作为项目级命名空间
(function (global) {
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Components = global.MeeWoo.Components || {};
})(window);
