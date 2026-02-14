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

    // Ensure namespace
// 初始化命名空间
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Exporters = window.MeeWoo.Exporters || {};

    const GIFExporter = {
        // GIF编码器实例
        encoder: null,

    /**
     * 导出GIF
     * @param {Object} config 配置对象
     * @param {Number} config.quality GIF质量 (1-30，数字越小质量越高，文件越大)
     * @returns {Promise<Blob>} GIF blob
     */
    export: async function (config) {
      var _this = this;

      // 参数校验
      if (!config.getFrame) throw new Error('缺少 getFrame 回调');
      if (!config.totalFrames || config.totalFrames <= 0) throw new Error('帧数无效');

      // 确保GIF.js库已加载
      if (typeof GIF === 'undefined') {
        if (window.MeeWoo && window.MeeWoo.Core && window.MeeWoo.Core.libraryLoader) {
          try {
            await window.MeeWoo.Core.libraryLoader.load('gif', true);
          } catch (error) {
            throw new Error('GIF.js库加载失败: ' + error.message);
          }
        } else {
          throw new Error('库加载器不可用');
        }
      }

      // 使用弹窗设置的尺寸、帧率和帧数
      var width = config.width || 300;
      var height = config.height || 300;
      var fps = config.fps || 30;
      var totalFrames = config.totalFrames;
      var frameDelay = Math.round(1000 / fps);
      var transparent = config.transparent || false;
      var dither = config.dither || false;
      var ditherColor = config.ditherColor || '#ffffff';
      // quality: 1-30，数字越小质量越高（文件越大），默认10
      // 修复：用户输入1-30（通常认为1是低质量/小文件，30是高质量/大文件）
      // 但gif.js内部实现是：1是最佳质量（不降采样），30是最差质量（最大降采样）
      // 为了符合用户直觉（数值越大质量越好），我们需要反转这个值
      // 映射关系：用户输入 1(低) -> gif.js 30(差)；用户输入 30(高) -> gif.js 1(好)
      var userQuality = Math.max(1, Math.min(30, config.quality || 10)); // 使用默认值10，限制在1-30之间
      var quality = 31 - userQuality;

      // 回调函数
      var onProgress = config.onProgress || function () { };
      var onComplete = config.onComplete || function () { };
      var onError = config.onError || function () { };
      var shouldCancel = config.shouldCancel || function () { return false; };

      // 创建输出canvas
      var outputCanvas = document.createElement('canvas');
      outputCanvas.width = width;
      outputCanvas.height = height;
      var outputCtx = outputCanvas.getContext('2d', {
        willReadFrequently: true,
        alpha: true
      });

      // 检查浏览器是否支持Web Worker
      var useWorker = typeof Worker !== 'undefined';
      
      // 测试Worker是否可正常加载
      if (useWorker) {
        try {
          // 尝试创建一个临时Worker来测试
          var testWorker = new Worker('/assets/js/service/gif/gif.worker.js');
          testWorker.terminate();
          console.log('[GIF Exporter] Web Worker测试成功');
        } catch (e) {
          console.warn('[GIF Exporter] Web Worker测试失败，将使用单线程编码:', e.message);
          useWorker = false;
        }
      }
      
      if (!useWorker) {
        // 降级方案：使用单线程编码
        console.warn('浏览器不支持Web Worker或Worker加载失败，将使用单线程编码，可能会较慢');
        var gifOptions = {
          workers: 0,  // 禁用Worker
          quality: Math.min(quality, 15),  // 降低质量以提高单线程编码速度
          width: width,
          height: height,
          repeat: 0,  // 0 = 无限循环
          background: '#ffffff'  // 默认背景色
        };
      } else {
        // 支持Web Worker：使用多线程编码
        // 动态计算合适的Worker数量
        // 考虑到系统资源和其他任务，只使用可用核心的一半
        var availableCores = navigator.hardwareConcurrency || 2;
        var workerCount = Math.max(1, Math.min(Math.floor(availableCores / 2), 4));
        console.log('[GIF Exporter] 检测到', availableCores, '个CPU核心，将使用', workerCount, '个Worker');
        
        // Worker脚本路径 - Vite开发模式必须使用绝对路径（以/开头）
        var workerScriptPath = '/assets/js/service/gif/gif.worker.js';
        console.log('[GIF Exporter] Worker路径:', workerScriptPath);
        
        var gifOptions = {
          workers: workerCount,
          workerScript: workerScriptPath,
          quality: Math.min(quality, 20),
          width: width,
          height: height,
          repeat: 0,
          background: '#ffffff',
          debug: true  // 启用调试日志
        };
        
        // 调试：打印Worker路径
        console.log('[GIF Exporter] Worker路径:', workerScriptPath);
      }

      if (transparent) {
        gifOptions.transparent = 0x000000; // 使用RGB格式的透明颜色，GIF只支持RGB格式
      } else {
        // 不透明模式：使用背景色
        var bgColor = config.backgroundColor || '#ffffff';
        if (bgColor === 'transparent') bgColor = '#ffffff';
        gifOptions.background = bgColor;
      }

      var gif = new GIF(gifOptions);

      // 编码完成Promise
      var encodingPromise = new Promise(function (resolve, reject) {
        console.log('[GIF Exporter] 注册事件监听器...');
        
        gif.on('progress', function (p) {
          console.log('[GIF Exporter] 编码进度:', p);
          // 编码阶段：50%-100%
          onProgress(50 + Math.floor(p * 50), 'encoding', '编码中...');
        });

        gif.on('finished', function (blob) {
          console.log('[GIF Exporter] 编码完成，blob:', blob);
          if (!blob || typeof blob !== 'object' || !blob.size) {
            reject(new Error('GIF编码器生成的blob无效'));
          } else {
            resolve(blob);
          }
        });

        gif.on('abort', function () {
          console.log('[GIF Exporter] 编码被取消');
          reject(new Error('用户取消'));
        });

        gif.on('error', function (error) {
          console.error('[GIF Exporter] 编码错误:', error);
          // 检查是否是Worker相关的错误
          if (error.message && (error.message.includes('Worker') || error.message.includes('worker'))) {
            console.warn('[GIF Exporter] Worker相关错误，建议禁用Worker重试');
            // 直接拒绝，让调用者知道需要禁用Worker
            reject(new Error('Worker相关错误: ' + (error.message || error) + '，请尝试禁用Worker重试'));
          } else {
            reject(new Error('GIF编码失败: ' + (error.message || error)));
          }
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
          if (!sourceCanvas) {
            throw new Error('无法获取帧 ' + i);
          }

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
          outputCtx.globalCompositeOperation = 'source-over';
          outputCtx.drawImage(sourceCanvas, 0, 0, width, height);

          // 透明模式：处理半透明像素
          if (transparent) {
            if (dither && ditherColor) {
              // 杂色边模式：半透明像素与背景色混合
              _this._processDither(outputCtx, width, height, ditherColor);
            } else {
              // 非杂色边模式：半透明像素设为完全透明（避免黑色杂边）
              _this._processAlphaThreshold(outputCtx, width, height);
            }
          }

          // 处理完透明后，手动获取处理后的 ImageData
          var processedImageData = outputCtx.getImageData(0, 0, width, height);

          // 验证图像数据是否有效
          if (!processedImageData || !processedImageData.data || processedImageData.data.length === 0) {
            throw new Error('处理后的图像数据无效');
          }

          // 直接使用 ImageData 而不是 canvas，确保传递处理后的数据
          var frameOptions = { delay: frameDelay };
          if (transparent) {
            frameOptions.transparent = true;
          }
          gif.addFrame(processedImageData, frameOptions);

          // 更新进度：捕获阶段0%-50%
          var progress = Math.floor((i / totalFrames) * 50);
          onProgress(progress, 'capturing', '捕获帧 ' + (i + 1) + '/' + totalFrames);
        }

        // 开始编码
        onProgress(50, 'encoding', '编码中...');
        
        try {
          console.log('[GIF Exporter] 开始编码...');
          console.log('[GIF Exporter] GIF实例:', gif);
          console.log('[GIF Exporter] GIF选项:', gif.options);
          console.log('[GIF Exporter] 帧数:', gif.frames.length);
          
          // 调试：检查第一帧数据结构
          if (gif.frames.length > 0) {
            var firstFrame = gif.frames[0];
            console.log('[GIF Exporter] 第一帧结构:', {
              hasData: !!firstFrame.data,
              dataType: firstFrame.data ? firstFrame.data.constructor.name : 'null',
              dataLength: firstFrame.data ? firstFrame.data.length : 0,
              delay: firstFrame.delay,
              transparent: firstFrame.transparent
            });
            // 检查数据是否全零
            if (firstFrame.data) {
              var nonZeroCount = 0;
              for (var j = 0; j < Math.min(1000, firstFrame.data.length); j++) {
                if (firstFrame.data[j] !== 0) nonZeroCount++;
              }
              console.log('[GIF Exporter] 第一帧前1000字节非零数:', nonZeroCount);
            }
          }
          
          // 启动编码
          gif.render();
          
          console.log('[GIF Exporter] 编码启动成功');
        } catch (renderError) {
          console.error('[GIF Exporter] 编码启动失败:', renderError);
          
          // 尝试降级到单线程模式
          console.log('[GIF Exporter] 尝试降级到单线程模式...');
          
          // 创建单线程GIF实例
          var singleThreadGif = new GIF({
            workers: 0,  // 禁用Worker
            quality: Math.min(quality, 15),  // 降低质量以提高单线程编码速度
            width: width,
            height: height,
            repeat: 0,  // 0 = 无限循环
            background: '#ffffff'  // 默认背景色
          });
          
          // 重新添加所有帧
          for (var i = 0; i < gif.frames.length; i++) {
            var frame = gif.frames[i];
            singleThreadGif.addFrame(frame.data, { delay: frame.delay, transparent: frame.transparent });
          }
          
          // 重新创建编码Promise
          encodingPromise = new Promise(function (resolve, reject) {
            singleThreadGif.on('progress', function (p) {
              console.log('[GIF Exporter] 单线程编码进度:', p);
              onProgress(50 + Math.floor(p * 50), 'encoding', '编码中...');
            });
            
            singleThreadGif.on('finished', function (blob) {
              console.log('[GIF Exporter] 单线程编码完成，blob:', blob);
              if (!blob || typeof blob !== 'object' || !blob.size) {
                reject(new Error('单线程GIF编码器生成的blob无效'));
              } else {
                resolve(blob);
              }
            });
            
            singleThreadGif.on('abort', function () {
              console.log('[GIF Exporter] 单线程编码被取消');
              reject(new Error('用户取消'));
            });
            
            singleThreadGif.on('error', function (error) {
              console.error('[GIF Exporter] 单线程编码错误:', error);
              reject(new Error('单线程GIF编码失败: ' + (error.message || error)));
            });
          });
          
          // 启动单线程编码
          singleThreadGif.render();
          console.log('[GIF Exporter] 单线程编码启动成功');
        }

        // 添加超时机制，避免编码过程无限卡住
        var timeoutPromise = new Promise(function (resolve, reject) {
          setTimeout(function () {
            console.error('[GIF Exporter] 编码超时，尝试取消...');
            // 尝试取消编码
            if (gif) {
              try {
                gif.abort();
              } catch (e) {
                console.warn('[GIF Exporter] 取消编码时出错:', e);
              }
            }
            reject(new Error('GIF编码超时，可能是由于GIF.js库问题或文件过大导致'));
          }, 120000); // 120秒超时
        });
        
        // 等待编码完成或超时
        var blob = await Promise.race([encodingPromise, timeoutPromise]);
        
        // 检查blob是否有效
        if (!blob || typeof blob !== 'object' || !blob.size) {
          throw new Error('生成的GIF blob无效');
        }
        
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
    _processDither: function (ctx, width, height, ditherColor) {
      var imageData = ctx.getImageData(0, 0, width, height);
      var data = imageData.data;

      // 解析杂色边颜色
      var hexColor = ditherColor.replace('#', '');
      var ditherR = parseInt(hexColor.substr(0, 2), 16);
      var ditherG = parseInt(hexColor.substr(2, 2), 16);
      var ditherB = parseInt(hexColor.substr(4, 2), 16);

      // Alpha混合：半透明像素与背景色混合
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
     * 处理Alpha通道：半透明像素设为完全透明（避免黑色杂边）
     * GIF格式不支持半透明，只支持完全透明或完全不透明
     * 将alpha < 128的像素设为完全透明，alpha >= 128的像素设为完全不透明
     */
    _processAlphaThreshold: function (ctx, width, height) {
      var imageData = ctx.getImageData(0, 0, width, height);
      var data = imageData.data;

      for (var j = 0; j < data.length; j += 4) {
        var alpha = data[j + 3];
        if (alpha > 0 && alpha < 255) {
          // 半透明像素：alpha阈值处理
          data[j + 3] = alpha < 128 ? 0 : 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    },

    /**
     * 下载GIF文件
     * @param {Blob} blob GIF blob
     * @param {string} fileName 文件名
     */
    download: function (blob, fileName) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'animation.gif';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 100);
    },

    /**
     * 预估GIF文件大小
     * @param {Object} config 配置对象
     * @returns {Object} { frames, duration, fileSize, fileSizeBytes }
     */
    estimate: function (config) {
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
    formatBytes: function (bytes) {
      if (bytes >= 1024 * 1024) {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
      } else if (bytes >= 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
      }
      return bytes + ' B';
    }
  };

  // 导出到全局命名空间
  global.MeeWoo.Exporters.GifExporter = GIFExporter;

})(typeof window !== 'undefined' ? window : this);