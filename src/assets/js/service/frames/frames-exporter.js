/**
 * 序列帧导出服务
 * 功能：将动画转换为序列帧并打包为ZIP下载
 */

// 按照项目规范，使用 MeeWoo 作为项目级命名空间
(function (global) {
  'use strict';

  // 确保命名空间存在
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Service = global.MeeWoo.Service || {};

  /**
   * 序列帧导出器
   */
  class FramesExporter {
    constructor() {
      this.zip = null;
      this.currentFrame = 0;
      this.totalFrames = 0;
      this.callbacks = {
        progress: null,
        error: null,
        complete: null
      };
    }

    /**
     * 初始化JSZip
     * @returns {Promise}
     */
    async initJSZip() {
      if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded');
      }
      this.zip = new JSZip();
    }

    /**
     * 导出序列帧
     * @param {Object} options 导出选项
     * @param {HTMLCanvasElement} canvas 画布元素
     * @param {number} duration 动画时长（秒）
     * @param {Function} progressCallback 进度回调
     * @param {Function} errorCallback 错误回调
     * @param {Function} completeCallback 完成回调
     */
    async exportFrames(options, canvas, duration, progressCallback, errorCallback, completeCallback) {
      try {
        // 初始化回调
        this.callbacks.progress = progressCallback;
        this.callbacks.error = errorCallback;
        this.callbacks.complete = completeCallback;

        // 初始化JSZip
        await this.initJSZip();

        // 计算总帧数
        this.totalFrames = Math.ceil(duration * options.fps);
        this.currentFrame = 0;

        // 创建frames文件夹
        const framesFolder = this.zip.folder('frames');

        // 导出每一帧
        await this.captureFrames(framesFolder, canvas, options);

        // 生成ZIP文件
        await this.generateZip();

      } catch (error) {
        console.error('导出序列帧失败:', error);
        if (this.callbacks.error) {
          this.callbacks.error(error.message);
        }
      }
    }

    /**
     * 捕获每一帧
     * @param {Object} framesFolder ZIP文件夹
     * @param {HTMLCanvasElement} canvas 画布元素
     * @param {Object} options 导出选项
     * @returns {Promise}
     */
    async captureFrames(framesFolder, canvas, options) {
      return new Promise((resolve, reject) => {
        const captureFrame = async () => {
          if (this.currentFrame >= this.totalFrames) {
            resolve();
            return;
          }

          try {
            // 计算进度
            const progress = this.currentFrame / this.totalFrames;
            if (this.callbacks.progress) {
              this.callbacks.progress(progress, `正在捕获第 ${this.currentFrame + 1} 帧`);
            }

            // 调整画布尺寸
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = options.width;
            tempCanvas.height = options.height;
            const tempCtx = tempCanvas.getContext('2d');

            // 绘制到临时画布
            tempCtx.drawImage(canvas, 0, 0, options.width, options.height);

            // 转换为PNG
            const pngData = await this.canvasToPNG(tempCanvas, options.quality);

            // 添加到ZIP
            const frameName = `frame_${String(this.currentFrame).padStart(4, '0')}.png`;
            framesFolder.file(frameName, pngData, { binary: true });

            // 下一帧
            this.currentFrame++;
            requestAnimationFrame(captureFrame);

          } catch (error) {
            reject(error);
          }
        };

        captureFrame();
      });
    }

    /**
     * 将画布转换为PNG
     * @param {HTMLCanvasElement} canvas 画布元素
     * @param {number} quality 压缩质量
     * @returns {Promise<Blob>}
     */
    async canvasToPNG(canvas, quality) {
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      });
    }

    /**
     * 生成ZIP文件
     * @returns {Promise}
     */
    async generateZip() {
      return new Promise((resolve, reject) => {
        if (this.callbacks.progress) {
          this.callbacks.progress(0.9, '正在生成ZIP文件');
        }

        this.zip.generateAsync({ type: 'blob' }, (metadata) => {
          const progress = 0.9 + (metadata.percent / 100) * 0.1;
          if (this.callbacks.progress) {
            this.callbacks.progress(progress, '正在生成ZIP文件');
          }
        }).then((blob) => {
          // 下载ZIP文件
          this.downloadZip(blob);
          
          if (this.callbacks.progress) {
            this.callbacks.progress(1, '导出完成');
          }
          
          if (this.callbacks.complete) {
            this.callbacks.complete();
          }
          
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    }

    /**
     * 下载ZIP文件
     * @param {Blob} blob ZIP文件Blob
     */
    downloadZip(blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frames_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    /**
     * 取消导出
     */
    cancel() {
      this.zip = null;
      this.currentFrame = 0;
      this.totalFrames = 0;
    }
  }

  // 暴露到命名空间
  global.MeeWoo.Service.FramesExporter = FramesExporter;

  // 同时添加到全局便捷访问
  global.FramesExporter = FramesExporter;

})(window);
