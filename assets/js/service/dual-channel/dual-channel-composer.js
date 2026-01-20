/**
 * Dual Channel Composer - 双通道图像合成器 主模块
 * 独立模块，将带透明通道的图像合成为双通道格式（彩色+Alpha灰度图）
 * 
 * 【模块关系】
 * - 主模块：dual-channel-composer.js（外部直接调用此模块）
 * - 工作线程：dual-channel-worker.js（内部使用，处理计算密集型任务）
 * 
 * 【数据流】
 * 外部调用 → dual-channel-composer.js（主模块）→ 发送任务到Web Worker → dual-channel-worker.js（工作线程）处理像素计算 → 
 * 返回结果到主模块 → 主模块转换为最终格式 → 返回结果给调用者
 * 
 * 【功能特性】
 * - 批量合成：ImageData[] → JPEG/PNG Uint8Array[]
 * - 单帧合成：ImageData → JPEG/PNG Uint8Array
 * - 支持左彩右灰/左灰右彩两种模式
 * - 正确处理预乘Alpha，避免颜色失真和锯齿
 * - 使用Web Worker处理计算密集型任务，提高UI响应性
 * - 支持多种输出格式（JPEG/PNG）
 * - 完善的资源管理和清理机制
 * 
 * 【调用方式】
 *    // 批量合成（推荐使用，支持进度回调）
 *    var jpegFrames = await DualChannelComposer.composeToJPEG(frames, { mode, quality, onProgress });
 *    // 单帧合成
 *    var jpegFrame = await DualChannelComposer.composeSingleFrame(frame, { mode, quality });
 *    // 支持PNG格式输出
 *    var pngFrame = await DualChannelComposer.composeSingleFrame(frame, { mode, format: 'png' });
 *    // 自定义配置
 *    DualChannelComposer.setConfig({ jpegQuality: 0.8, mode: 'alpha-left-color-right' });
 *    // 销毁资源（Web Worker）
 *    DualChannelComposer.destroy();
 */
(function(global) {
  'use strict';

  // Ensure namespace
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Services = window.MeeWoo.Services || {};

  var DualChannelComposer = {
    
    /**
     * 默认配置
     */
    defaults: {
      mode: 'color-left-alpha-right',  // 'color-left-alpha-right' | 'alpha-left-color-right'
      jpegQuality: 0.6,                 // JPEG质量 0-1
      format: 'jpeg',                   // 默认输出格式
      workerPath: 'assets/js/service/dual-channel/dual-channel-worker.js'  // Web Worker路径
    },

    /**
     * Web Worker实例
     */
    _worker: null,

    /**
     * 任务ID计数器
     */
    _taskId: 0,

    /**
     * 初始化Web Worker
     * @private
     */
    _initWorker: function() {
      if (!this._worker) {
        this._worker = new Worker(this.defaults.workerPath);
      }
    },

    /**
     * 发送任务到Web Worker
     * @param {string} type - 任务类型
     * @param {Object} data - 任务数据
     * @returns {Promise<Object>} - 任务结果
     * @private
     */
    _sendTask: function(type, data) {
      return new Promise((resolve, reject) => {
        this._initWorker();
        
        const taskId = ++this._taskId;
        const message = {
          id: taskId,
          type: type,
          data: data
        };

        const handleMessage = (e) => {
          if (e.data.id === taskId) {
            this._worker.removeEventListener('message', handleMessage);
            if (e.data.type === 'error') {
              reject(new Error(e.data.error));
            } else {
              resolve(e.data.result);
            }
          }
        };

        this._worker.addEventListener('message', handleMessage);
        this._worker.postMessage(message);
      });
    },

    /**
     * 单帧合成双通道图像
     * @param {ImageData} frame - 单帧ImageData
     * @param {Object} options - 配置项
     * @param {String} options.mode - 通道模式
     * @param {Number} options.quality - JPEG质量 0-1（可选，默认自适应）
     * @param {String} options.format - 输出格式：'jpeg' 或 'png'
     * @returns {Promise<Uint8Array>} - 合成后的图像数据
     */
    composeSingleFrame: async function(frame, options) {
      options = options || {};
      const mode = options.mode || this.defaults.mode;
      const format = options.format || this.defaults.format;
      const quality = options.quality;

      if (!frame || !frame.data) {
        throw new Error('无效的ImageData对象');
      }

      // 获取尺寸
      const width = frame.width;
      const height = frame.height;
      
      // 计算JPEG质量（自适应）
      let jpegQuality = quality;
      if (jpegQuality === undefined && format === 'jpeg') {
        const totalPixels = width * 2 * height;
        if (totalPixels < 500000) {
          jpegQuality = 0.7;
        } else if (totalPixels > 2000000) {
          jpegQuality = 0.5;
        } else {
          jpegQuality = 0.6;
        }
      }

      // 使用Web Worker处理像素计算
      const result = await this._sendTask('composeFrame', {
        frame: frame,
        mode: mode,
        width: width,
        height: height
      });

      // 转换为ImageData
      const dualCanvas = document.createElement('canvas');
      dualCanvas.width = width * 2;
      dualCanvas.height = height;
      const dualCtx = dualCanvas.getContext('2d', { 
        alpha: true,
        willReadFrequently: true 
      });
      
      const dualImageData = dualCtx.createImageData(width * 2, height);
      dualImageData.data.set(result.dualData);
      dualCtx.putImageData(dualImageData, 0, 0);

      // 合成黑底并转换为目标格式
      const blackBgCanvas = document.createElement('canvas');
      blackBgCanvas.width = width * 2;
      blackBgCanvas.height = height;
      const blackBgCtx = blackBgCanvas.getContext('2d');
      const blackBgImageData = blackBgCtx.createImageData(width * 2, height);
      blackBgImageData.data.set(result.blackBgData);
      blackBgCtx.putImageData(blackBgImageData, 0, 0);

      // 转换为目标格式
      const blob = await new Promise(function(resolve) {
        if (format === 'png') {
          blackBgCanvas.toBlob(resolve, 'image/png');
        } else {
          blackBgCanvas.toBlob(resolve, 'image/jpeg', jpegQuality);
        }
      });
      const buffer = await blob.arrayBuffer();
      
      // 清理Canvas资源
      dualCanvas.width = 0;
      dualCanvas.height = 0;
      blackBgCanvas.width = 0;
      blackBgCanvas.height = 0;
      
      return new Uint8Array(buffer);
    },

    /**
     * 批量合成双通道图像
     * @param {Array<ImageData>} frames - ImageData数组
     * @param {Object} options - 配置项
     * @param {String} options.mode - 通道模式
     * @param {Number} options.quality - JPEG质量 0-1（可选，默认自适应）
     * @param {String} options.format - 输出格式：'jpeg' 或 'png'
     * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
     * @param {Function} options.onCancel - 取消检查函数，返回true则中止
     * @returns {Promise<Array<Uint8Array>>} - 合成后的图像数组
     */
    composeToJPEG: async function(frames, options) {
      return this.composeFrames(frames, options);
    },

    /**
     * 批量合成双通道图像（支持多种格式）
     * @param {Array<ImageData>} frames - ImageData数组
     * @param {Object} options - 配置项
     * @param {String} options.mode - 通道模式
     * @param {Number} options.quality - JPEG质量 0-1（可选，默认自适应）
     * @param {String} options.format - 输出格式：'jpeg' 或 'png'
     * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
     * @param {Function} options.onCancel - 取消检查函数，返回true则中止
     * @returns {Promise<Array<Uint8Array>>} - 合成后的图像数组
     */
    composeFrames: async function(frames, options) {
      options = options || {};
      const mode = options.mode || this.defaults.mode;
      const format = options.format || this.defaults.format;
      const quality = options.quality;
      const onProgress = options.onProgress || function() {};
      const onCancel = options.onCancel || function() { return false; };
      
      const frameCount = frames.length;
      if (frameCount === 0) {
        throw new Error('帧数组不能为空');
      }
      
      const resultFrames = [];
      
      // 获取尺寸
      const width = frames[0].width;
      const height = frames[0].height;
      
      // 计算JPEG质量（自适应）
      let jpegQuality = quality;
      if (jpegQuality === undefined && format === 'jpeg') {
        const totalPixels = width * 2 * height;
        if (totalPixels < 500000) {
          jpegQuality = 0.7;
        } else if (totalPixels > 2000000) {
          jpegQuality = 0.5;
        } else {
          jpegQuality = 0.6;
        }
      }

      // 使用Web Worker处理多帧合成
      const result = await this._sendTask('composeFrames', {
        frames: frames,
        mode: mode,
        width: width,
        height: height,
        frameCount: frameCount
      });

      // 转换每一帧
      for (let i = 0; i < frameCount; i++) {
        // 检查是否取消
        if (onCancel()) {
          throw new Error('用户取消');
        }

        // 创建临时Canvas
        const blackBgCanvas = document.createElement('canvas');
        blackBgCanvas.width = width * 2;
        blackBgCanvas.height = height;
        const blackBgCtx = blackBgCanvas.getContext('2d');
        const blackBgImageData = blackBgCtx.createImageData(width * 2, height);
        blackBgImageData.data.set(result[i].blackBgData);
        blackBgCtx.putImageData(blackBgImageData, 0, 0);

        // 转换为目标格式
        const blob = await new Promise(function(resolve) {
          if (format === 'png') {
            blackBgCanvas.toBlob(resolve, 'image/png');
          } else {
            blackBgCanvas.toBlob(resolve, 'image/jpeg', jpegQuality);
          }
        });
        const buffer = await blob.arrayBuffer();
        resultFrames.push(new Uint8Array(buffer));

        // 清理Canvas资源
        blackBgCanvas.width = 0;
        blackBgCanvas.height = 0;

        // 进度回调
        onProgress((i + 1) / frameCount);

        // 让出线程
        if (i % 5 === 0) {
          await new Promise(function(r) { setTimeout(r, 0); });
        }
      }

      return resultFrames;
    },

    /**
     * 设置默认配置
     * @param {Object} config - 配置对象
     */
    setConfig: function(config) {
      Object.assign(this.defaults, config);
    },

    /**
     * 获取当前配置
     * @returns {Object} - 当前配置
     */
    getConfig: function() {
      return { ...this.defaults };
    },

    /**
     * 销毁Web Worker，释放资源
     */
    destroy: function() {
      if (this._worker) {
        this._worker.terminate();
        this._worker = null;
      }
    }
  };

  // 导出模块
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DualChannelComposer;
  } else {
    global.MeeWoo.Services.DualChannelComposer = DualChannelComposer;
  }

})(typeof window !== 'undefined' ? window : this);
