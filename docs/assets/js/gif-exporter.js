/**
 * GIF导出器模块
 * 封装GIF编码、帧添加、进度管理、下载等核心逻辑
 * 
 * 使用方式：
 * GIFExporter.export({
 *   width: 300,
 *   height: 300,
 *   fps: 30,
 *   totalFrames: 60,
 *   transparent: false,
 *   dither: false,
 *   ditherColor: '#ffffff',
 *   getFrame: async (frameIndex) => canvas,  // 返回当前帧的canvas
 *   onProgress: (progress, stage, message) => {},
 *   onComplete: (blob, size) => {},
 *   onError: (error) => {},
 *   shouldCancel: () => false  // 返回true时取消导出
 * });
 */

(function(global) {
  'use strict';

  var GIFExporter = {
    // Worker脚本路径
    workerScript: 'assets/js/gif.worker.js',

    /**
     * 导出GIF
     * @param {Object} config 配置对象
     * @returns {Promise<Blob>} GIF blob
     */
    export: async function(config) {
      var _this = this;

      // 参数校验
      if (!config.getFrame) throw new Error('缺少 getFrame 回调');
      if (!config.totalFrames || config.totalFrames <= 0) throw new Error('帧数无效');

      var width = config.width || 300;
      var height = config.height || 300;
      var fps = Math.max(1, Math.min(60, config.fps || 30));
      var totalFrames = config.totalFrames;
      var frameDelay = Math.round(1000 / fps);
      var transparent = config.transparent || false;
      var dither = config.dither || false;
      var ditherColor = config.ditherColor || '#ffffff';

      // 回调函数
      var onProgress = config.onProgress || function() {};
      var onComplete = config.onComplete || function() {};
      var onError = config.onError || function() {};
      var shouldCancel = config.shouldCancel || function() { return false; };

      // 创建输出canvas
      var outputCanvas = document.createElement('canvas');
      outputCanvas.width = width;
      outputCanvas.height = height;
      var outputCtx = outputCanvas.getContext('2d', {
        willReadFrequently: true,
        alpha: true
      });

      // 创建GIF编码器
      var gifOptions = {
        workers: 2,
        quality: 10,
        width: width,
        height: height,
        workerScript: this.workerScript
      };

      if (transparent) {
        gifOptions.transparent = 0x00000000;
      }

      var gif = new GIF(gifOptions);

      // 编码完成Promise
      var encodingPromise = new Promise(function(resolve, reject) {
        gif.on('progress', function(p) {
          // 编码阶段：50%-100%
          onProgress(50 + Math.floor(p * 50), 'encoding', '编码中...');
        });

        gif.on('finished', function(blob) {
          resolve(blob);
        });

        gif.on('abort', function() {
          reject(new Error('用户取消'));
        });

        gif.on('error', function(error) {
          reject(new Error('GIF编码失败: ' + (error.message || error)));
        });
      });

      try {
        // 帧捕获阶段
        for (var i = 0; i < totalFrames; i++) {
          // 检查取消
          if (shouldCancel()) {
            gif.abort();
            throw new Error('用户取消');
          }

          // 获取当前帧
          var sourceCanvas = await config.getFrame(i);
          if (!sourceCanvas) throw new Error('无法获取帧 ' + i);

          // 清空输出画布
          outputCtx.clearRect(0, 0, width, height);

          // 不透明模式：填充背景色
          if (!transparent) {
            var bgColor = config.backgroundColor || '#ffffff';
            if (bgColor === 'transparent') bgColor = '#ffffff';
            outputCtx.fillStyle = bgColor;
            outputCtx.fillRect(0, 0, width, height);
          }

          // 绘制源帧
          if (transparent) {
            outputCtx.globalCompositeOperation = 'source-over';
          }
          outputCtx.drawImage(sourceCanvas, 0, 0, width, height);

          // 透明底+杂色边：处理半透明像素
          if (transparent && dither && ditherColor) {
            this._processDither(outputCtx, width, height, ditherColor);
          }

          // 添加帧
          var frameOptions = { copy: true, delay: frameDelay };
          if (transparent) {
            frameOptions.transparent = true;
          }
          gif.addFrame(outputCanvas, frameOptions);

          // 更新进度：捕获阶段0%-50%
          var progress = Math.floor((i / totalFrames) * 50);
          onProgress(progress, 'capturing', '捕获帧 ' + (i + 1) + '/' + totalFrames);
        }

        // 开始编码
        onProgress(50, 'encoding', '编码中...');
        gif.render();

        // 等待编码完成
        var blob = await encodingPromise;

        // 触发完成回调
        onComplete(blob, blob.size);

        return blob;

      } catch (err) {
        onError(err);
        throw err;
      }
    },

    /**
     * 处理杂色边（半透明像素与背景色混合）
     */
    _processDither: function(ctx, width, height, ditherColor) {
      var imageData = ctx.getImageData(0, 0, width, height);
      var data = imageData.data;

      // 解析杂色边颜色
      var hexColor = ditherColor.replace('#', '');
      var ditherR = parseInt(hexColor.substr(0, 2), 16);
      var ditherG = parseInt(hexColor.substr(2, 2), 16);
      var ditherB = parseInt(hexColor.substr(4, 2), 16);

      // Alpha混合：半透明像素与杂色边颜色混合
      for (var j = 0; j < data.length; j += 4) {
        var alpha = data[j + 3] / 255;
        if (alpha > 0 && alpha < 1) {
          data[j] = Math.round(data[j] * alpha + ditherR * (1 - alpha));
          data[j + 1] = Math.round(data[j + 1] * alpha + ditherG * (1 - alpha));
          data[j + 2] = Math.round(data[j + 2] * alpha + ditherB * (1 - alpha));
          data[j + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    },

    /**
     * 下载GIF文件
     * @param {Blob} blob GIF blob
     * @param {string} fileName 文件名
     */
    download: function(blob, fileName) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'animation.gif';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 100);
    },

    /**
     * 预估GIF文件大小
     * @param {Object} config 配置对象
     * @returns {Object} { frames, duration, fileSize, fileSizeBytes }
     */
    estimate: function(config) {
      var width = config.width || 100;
      var height = config.height || 100;
      var fps = config.fps || 30;
      var duration = config.duration || 0;
      var totalFrames = Math.ceil(duration * fps);
      var transparent = config.transparent || false;
      var dither = config.dither || false;

      // 压缩系数（根据实际测试调整）
      var compressionFactor = transparent ? 0.16 : 0.13;
      if (transparent && dither) {
        compressionFactor = 0.18;
      }

      var bytesPerFrame = width * height * compressionFactor;
      var totalBytes = bytesPerFrame * totalFrames;

      var fileSizeText = '？';
      if (totalFrames > 0) {
        if (totalBytes >= 1024 * 1024) {
          fileSizeText = (totalBytes / 1024 / 1024).toFixed(2) + 'M';
        } else {
          fileSizeText = Math.round(totalBytes / 1024) + 'kb';
        }
      }

      return {
        frames: totalFrames,
        duration: duration,
        fileSize: fileSizeText,
        fileSizeBytes: totalBytes
      };
    },

    /**
     * 格式化字节数
     */
    formatBytes: function(bytes) {
      if (bytes >= 1024 * 1024) {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
      } else if (bytes >= 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
      }
      return bytes + ' B';
    }
  };

  // 导出到全局
  global.GIFExporter = GIFExporter;

})(typeof window !== 'undefined' ? window : this);
