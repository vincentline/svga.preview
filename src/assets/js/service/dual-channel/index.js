/**
 * 双通道服务索引文件
 * 统一导出所有双通道相关服务模块
 */

// 确保命名空间存在
window.MeeWoo = window.MeeWoo || {};
window.MeeWoo.Services = window.MeeWoo.Services || {};
window.MeeWoo.Services.DualChannel = window.MeeWoo.Services.DualChannel || {};

export { default as DualChannelComposer } from './dual-channel-composer.js';
export { default as MemoryPool } from './memory-pool.js';
export { default as WasmLoader } from './wasm/wasm-loader.js';

if (typeof window !== 'undefined') {
  if (window.DualChannelComposer) {
    window.MeeWoo.Services.DualChannel.Composer = window.DualChannelComposer;
  }
  
  if (window.MeeWoo.Services.MemoryPool) {
    window.MeeWoo.Services.DualChannel.MemoryPool = window.MeeWoo.Services.MemoryPool;
  }
  
  if (window.MeeWoo.Services.WasmLoader) {
    window.MeeWoo.Services.DualChannel.WasmLoader = window.MeeWoo.Services.WasmLoader;
  }
}
