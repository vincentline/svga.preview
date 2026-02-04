/**
 * 双通道服务索引文件
 * 统一导出所有双通道相关服务模块
 */

// 确保命名空间存在
window.MeeWoo = window.MeeWoo || {};
window.MeeWoo.Services = window.MeeWoo.Services || {};
window.MeeWoo.Services.DualChannel = window.MeeWoo.Services.DualChannel || {};

// 导出核心模块
export { default as DualChannelComposer } from './dual-channel-composer.js';
export { default as MemoryPool } from './memory-pool.js';
export { default as WorkerPool } from './worker-pool.js';
export { default as WasmLoader } from './wasm/wasm-loader.js';

// 导出到全局命名空间
if (typeof window !== 'undefined') {
  // 双通道合成器
  if (window.DualChannelComposer) {
    window.MeeWoo.Services.DualChannel.Composer = window.DualChannelComposer;
  }
  
  // 内存池
  if (window.MeeWoo.Services.MemoryPool) {
    window.MeeWoo.Services.DualChannel.MemoryPool = window.MeeWoo.Services.MemoryPool;
  }
  
  // Worker池
  if (window.MeeWoo.Services.WorkerPool) {
    window.MeeWoo.Services.DualChannel.WorkerPool = window.MeeWoo.Services.WorkerPool;
  }
  
  // WebAssembly加载器
  if (window.MeeWoo.Services.WasmLoader) {
    window.MeeWoo.Services.DualChannel.WasmLoader = window.MeeWoo.Services.WasmLoader;
  }
}
