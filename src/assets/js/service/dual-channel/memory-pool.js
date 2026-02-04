/**
 * 内存池管理器 - 优化TypedArray对象的分配和复用
 * 【功能特性】
 * - TypedArray对象池管理
 * - 内存预分配和复用
 * - 自动内存回收
 * - 内存使用监控
 * - 自适应内存管理
 */

(function(global) {
  'use strict';

  // Ensure namespace
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Services = window.MeeWoo.Services || {};

  class MemoryPool {
    constructor() {
      this.pools = new Map(); // 按类型和大小存储对象池
      this.stats = {
        allocated: 0,
        reused: 0,
        peak: 0,
        active: 0
      };
      this.maxPoolSize = 100; // 每个池的最大对象数
      this.minBufferSize = 1024; // 最小缓冲区大小
      this.maxBufferSize = 1024 * 1024 * 100; // 最大缓冲区大小 (100MB)
    }

    /**
     * 获取或创建缓冲区
     * @param {string} type - 类型：'Uint8ClampedArray' | 'Uint8Array'
     * @param {number} size - 所需大小
     * @returns {TypedArray} 缓冲区
     */
    getBuffer(type, size) {
      if (size <= 0 || size > this.maxBufferSize) {
        // 超出限制，直接创建
        return this._createBuffer(type, size);
      }

      // 向上取整到最近的2的幂，减少池的大小
      const roundedSize = this._roundUpToPowerOfTwo(size);
      const key = `${type}_${roundedSize}`;

      // 检查池是否存在且有可用对象
      if (this.pools.has(key) && this.pools.get(key).length > 0) {
        const pool = this.pools.get(key);
        const buffer = pool.pop();
        this.stats.reused++;
        this.stats.active++;
        return buffer;
      }

      // 池为空，创建新缓冲区
      return this._createBuffer(type, roundedSize);
    }

    /**
     * 回收缓冲区到池
     * @param {TypedArray} buffer - 要回收的缓冲区
     */
    recycleBuffer(buffer) {
      if (!buffer || !buffer.buffer) {
        return;
      }

      const type = buffer.constructor.name;
      const size = buffer.length;

      if (size <= 0 || size > this.maxBufferSize) {
        // 超出限制，直接丢弃
        this._updateStats(false, size);
        return;
      }

      const roundedSize = this._roundUpToPowerOfTwo(size);
      const key = `${type}_${roundedSize}`;

      // 确保池存在
      if (!this.pools.has(key)) {
        this.pools.set(key, []);
      }

      const pool = this.pools.get(key);
      
      // 检查池是否已满
      if (pool.length < this.maxPoolSize) {
        // 重置缓冲区内容
        this._resetBuffer(buffer);
        pool.push(buffer);
        this.stats.active--;
      } else {
        // 池已满，丢弃
        this._updateStats(false, size);
      }
    }

    /**
     * 批量获取缓冲区
     * @param {Array<{type: string, size: number}>} requests - 请求数组
     * @returns {Array<TypedArray>} 缓冲区数组
     */
    getBuffers(requests) {
      return requests.map(req => this.getBuffer(req.type, req.size));
    }

    /**
     * 批量回收缓冲区
     * @param {Array<TypedArray>} buffers - 要回收的缓冲区数组
     */
    recycleBuffers(buffers) {
      buffers.forEach(buffer => this.recycleBuffer(buffer));
    }

    /**
     * 清理所有池
     */
    clear() {
      this.pools.forEach((pool, key) => {
        pool.forEach(buffer => {
          this._updateStats(false, buffer.length);
        });
        pool.length = 0;
      });
      this.pools.clear();
      this.stats.active = 0;
    }

    /**
     * 获取内存使用统计
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
        allocated: 0,
        reused: 0,
        peak: 0,
        active: 0
      };
    }

    /**
     * 创建新缓冲区
     * @private
     */
    _createBuffer(type, size) {
      let buffer;
      try {
        switch (type) {
          case 'Uint8ClampedArray':
            buffer = new Uint8ClampedArray(size);
            break;
          case 'Uint8Array':
            buffer = new Uint8Array(size);
            break;
          default:
            throw new Error(`Unsupported buffer type: ${type}`);
        }
        this._updateStats(true, size);
        this.stats.active++;
      } catch (error) {
        console.error('Buffer creation failed:', error);
        throw error;
      }
      return buffer;
    }

    /**
     * 重置缓冲区内容
     * @private
     */
    _resetBuffer(buffer) {
      try {
        // 快速清空缓冲区
        if (buffer.fill) {
          buffer.fill(0);
        } else {
          // 兼容旧浏览器
          for (let i = 0; i < buffer.length; i++) {
            buffer[i] = 0;
          }
        }
      } catch (error) {
        console.error('Buffer reset failed:', error);
      }
    }

    /**
     * 更新内存统计
     * @private
     */
    _updateStats(allocated, size) {
      if (allocated) {
        this.stats.allocated += size;
        this.stats.peak = Math.max(this.stats.peak, this.stats.active * size);
      }
    }

    /**
     * 向上取整到最近的2的幂
     * @private
     */
    _roundUpToPowerOfTwo(size) {
      if (size <= this.minBufferSize) {
        return this.minBufferSize;
      }
      // 向上取整到最近的2的幂
      size--;
      size |= size >> 1;
      size |= size >> 2;
      size |= size >> 4;
      size |= size >> 8;
      size |= size >> 16;
      size++;
      return size;
    }
  }

  // 导出单例
  const memoryPool = new MemoryPool();
  window.MeeWoo.Services.MemoryPool = memoryPool;

  // 全局访问
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = memoryPool;
  } else {
    global.MemoryPool = memoryPool;
  }

})(typeof window !== 'undefined' ? window : this);
