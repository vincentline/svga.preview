/**
 * WebAssembly模块加载器 - 负责加载和管理双通道合成的WebAssembly模块
 * 【功能特性】
 * - WebAssembly模块加载和初始化
 * - 内存管理和优化
 * - JavaScript和WebAssembly的桥接
 * - 错误处理和降级机制
 * - 性能监控
 */

(function(global) {
  'use strict';

  // Ensure namespace
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Services = window.MeeWoo.Services || {};

  class WasmLoader {
    constructor() {
      this.module = null;
      this.instance = null;
      this.memory = null;
      this.imports = {
        env: {
          memoryBase: 0,
          tableBase: 0,
          memory: new WebAssembly.Memory({ initial: 256, maximum: 1024, shared: false }),
          table: new WebAssembly.Table({ initial: 0, maximum: 0, element: 'anyfunc' }),
          abort: function(msg, file, line, column) {
            console.error('WebAssembly abort:', msg, file, line, column);
          },
          // 内存分配函数
          malloc: function(size) {
            // 简单的内存分配实现
            // 实际项目中可能需要更复杂的内存管理
            return 0;
          },
          free: function(ptr) {
            // 简单的内存释放实现
          }
        }
      };
      this.isLoaded = false;
      this.isSupported = this._checkWasmSupport();
      this.stats = {
        loadTime: 0,
        initTime: 0,
        calls: 0,
        errors: 0
      };
    }

    /**
     * 检查WebAssembly支持
     * @returns {boolean} 是否支持WebAssembly
     * @private
     */
    _checkWasmSupport() {
      return typeof WebAssembly !== 'undefined';
    }

    /**
     * 加载WebAssembly模块
     * @param {string} url - WebAssembly模块URL
     * @returns {Promise<WebAssembly.Instance>} 模块实例
     */
    async load(url) {
      if (!this.isSupported) {
        throw new Error('WebAssembly is not supported in this browser');
      }

      if (this.isLoaded) {
        return this.instance;
      }

      try {
        const startTime = performance.now();
        
        // 加载WebAssembly模块
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        
        // 编译模块
        this.module = await WebAssembly.compile(buffer);
        
        // 实例化模块
        this.instance = await WebAssembly.instantiate(this.module, this.imports);
        
        // 获取内存
        this.memory = this.imports.env.memory;
        
        // 初始化模块
        if (this.instance.exports.init) {
          const initStartTime = performance.now();
          this.instance.exports.init();
          this.stats.initTime = performance.now() - initStartTime;
        }
        
        this.stats.loadTime = performance.now() - startTime;
        this.isLoaded = true;
        
        console.log('WebAssembly模块加载成功，加载时间:', this.stats.loadTime.toFixed(2), 'ms');
        console.log('WebAssembly初始化时间:', this.stats.initTime.toFixed(2), 'ms');
        
        return this.instance;
      } catch (error) {
        console.error('WebAssembly模块加载失败:', error);
        this.stats.errors++;
        throw new Error('Failed to load WebAssembly module: ' + error.message);
      }
    }

    /**
     * 处理单个像素
     * @param {number} x - 像素X坐标
     * @param {number} y - 像素Y坐标
     * @param {Uint8ClampedArray} frameData - 原始图像数据
     * @param {number} width - 原始图像宽度
     * @param {number} dualWidth - 双通道图像宽度
     * @param {Uint8ClampedArray} dualData - 双通道图像数据
     * @param {Uint8ClampedArray} blackBgData - 黑底图像数据
     * @param {boolean} isColorLeftAlphaRight - 是否左彩右灰模式
     */
    processSinglePixel(x, y, frameData, width, dualWidth, dualData, blackBgData, isColorLeftAlphaRight) {
      if (!this.isLoaded || !this.instance.exports.processSinglePixel) {
        throw new Error('WebAssembly module not loaded or function not exported');
      }

      try {
        this.stats.calls++;
        
        // 调用WebAssembly函数
        this.instance.exports.processSinglePixel(
          x, y,
          frameData.buffer, // 传递ArrayBuffer
          width,
          dualWidth,
          dualData.buffer,
          blackBgData.buffer,
          isColorLeftAlphaRight ? 1 : 0
        );
      } catch (error) {
        console.error('WebAssembly processSinglePixel error:', error);
        this.stats.errors++;
        throw error;
      }
    }

    /**
     * 处理图像块
     * @param {number} startX - 块起始X坐标
     * @param {number} startY - 块起始Y坐标
     * @param {number} blockWidth - 块宽度
     * @param {number} blockHeight - 块高度
     * @param {Uint8ClampedArray} frameData - 原始图像数据
     * @param {number} width - 原始图像宽度
     * @param {number} dualWidth - 双通道图像宽度
     * @param {Uint8ClampedArray} dualData - 双通道图像数据
     * @param {Uint8ClampedArray} blackBgData - 黑底图像数据
     * @param {boolean} isColorLeftAlphaRight - 是否左彩右灰模式
     */
    processBlock(startX, startY, blockWidth, blockHeight, frameData, width, dualWidth, dualData, blackBgData, isColorLeftAlphaRight) {
      if (!this.isLoaded || !this.instance.exports.processBlock) {
        throw new Error('WebAssembly module not loaded or function not exported');
      }

      try {
        this.stats.calls++;
        
        // 调用WebAssembly函数
        this.instance.exports.processBlock(
          startX, startY,
          blockWidth, blockHeight,
          frameData.buffer,
          width,
          dualWidth,
          dualData.buffer,
          blackBgData.buffer,
          isColorLeftAlphaRight ? 1 : 0
        );
      } catch (error) {
        console.error('WebAssembly processBlock error:', error);
        this.stats.errors++;
        throw error;
      }
    }

    /**
     * 获取内存视图
     * @param {number} offset - 内存偏移
     * @param {number} length - 长度
     * @returns {Uint8Array} 内存视图
     */
    getMemoryView(offset, length) {
      if (!this.memory) {
        throw new Error('WebAssembly memory not initialized');
      }
      return new Uint8Array(this.memory.buffer, offset, length);
    }

    /**
     * 增加内存大小
     * @param {number} pages - 要增加的页数（每页64KB）
     */
    growMemory(pages) {
      if (this.memory) {
        const result = this.memory.grow(pages);
        if (result === -1) {
          console.error('Failed to grow WebAssembly memory');
        } else {
          console.log('WebAssembly memory grown to', (result + pages) * 64, 'KB');
        }
      }
    }

    /**
     * 释放资源
     */
    dispose() {
      this.module = null;
      this.instance = null;
      this.memory = null;
      this.isLoaded = false;
      console.log('WebAssembly resources disposed');
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
      return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    resetStats() {
      this.stats = {
        loadTime: this.stats.loadTime,
        initTime: this.stats.initTime,
        calls: 0,
        errors: 0
      };
    }

    /**
     * 检查模块是否已加载
     * @returns {boolean} 是否已加载
     */
    getIsLoaded() {
      return this.isLoaded;
    }

    /**
     * 检查是否支持WebAssembly
     * @returns {boolean} 是否支持
     */
    getIsSupported() {
      return this.isSupported;
    }
  }

  // 导出单例
  const wasmLoader = new WasmLoader();
  window.MeeWoo.Services.WasmLoader = wasmLoader;

  // 全局访问
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WasmLoader;
  } else {
    global.WasmLoader = WasmLoader;
  }

})(typeof window !== 'undefined' ? window : this);
