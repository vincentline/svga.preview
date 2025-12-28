/**
 * Dual Channel Composer - 双通道图像合成器
 * 独立模块，将带透明通道的图像合成为双通道格式（彩色+Alpha灰度图）
 * 
 * 功能：
 * - 批量合成：ImageData[] → JPEG Uint8Array[]
 * - 支持左彩右灰/左灰右彩两种模式
 * - 正确处理预乘Alpha，避免颜色失真和锯齿
 * 
 * 调用方式：
 *    var jpegFrames = await DualChannelComposer.composeToJPEG(frames, { mode, quality, onProgress })
 */
(function(global) {
  'use strict';

  var DualChannelComposer = {
    
    /**
     * 默认配置
     */
    defaults: {
      mode: 'color-left-alpha-right',  // 'color-left-alpha-right' | 'alpha-left-color-right'
      jpegQuality: 0.6                  // JPEG质量 0-1
    },

    /**
     * 批量合成双通道图像并转换为JPEG
     * @param {Array<ImageData>} frames - ImageData数组
     * @param {Object} options - 配置项
     * @param {String} options.mode - 通道模式
     * @param {Number} options.quality - JPEG质量 0-1（可选，默认自适应）
     * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
     * @param {Function} options.onCancel - 取消检查函数，返回true则中止
     * @returns {Promise<Array<Uint8Array>>} - JPEG Uint8Array数组
     */
    composeToJPEG: async function(frames, options) {
      var _this = this;
      options = options || {};
      var mode = options.mode || this.defaults.mode;
      var isColorLeftAlphaRight = mode === 'color-left-alpha-right';
      var onProgress = options.onProgress || function() {};
      var onCancel = options.onCancel || function() { return false; };
      
      var frameCount = frames.length;
      if (frameCount === 0) {
        throw new Error('帧数组不能为空');
      }
      
      var jpegFrames = [];
      
      // 获取尺寸
      var width = frames[0].width;
      var height = frames[0].height;
      
      // 计算JPEG质量（自适应）
      var jpegQuality = options.quality;
      if (jpegQuality === undefined) {
        var totalPixels = width * 2 * height;
        if (totalPixels < 500000) {
          jpegQuality = 0.7;
        } else if (totalPixels > 2000000) {
          jpegQuality = 0.5;
        } else {
          jpegQuality = 0.6;
        }
      }
      
      // 复用Canvas
      var dualCanvas = document.createElement('canvas');
      dualCanvas.width = width * 2;
      dualCanvas.height = height;
      var dualCtx = dualCanvas.getContext('2d', { 
        alpha: true,
        willReadFrequently: true 
      });
      dualCtx.imageSmoothingEnabled = false;
      
      // 黑底Canvas（用于JPEG转换）
      var blackBgCanvas = document.createElement('canvas');
      blackBgCanvas.width = width * 2;
      blackBgCanvas.height = height;
      var blackBgCtx = blackBgCanvas.getContext('2d');
      var blackBgImageData = blackBgCtx.createImageData(width * 2, height);
      var blackBgData = blackBgImageData.data;

      for (var i = 0; i < frameCount; i++) {
        // 检查是否取消
        if (onCancel()) {
          throw new Error('用户取消');
        }

        var srcData = frames[i].data;
        
        // 清空并创建双通道数据
        dualCtx.clearRect(0, 0, width * 2, height);
        var dualImageData = dualCtx.createImageData(width * 2, height);
        var dualData = dualImageData.data;
        
        // 逐像素处理
        for (var j = 0; j < srcData.length; j += 4) {
          var r = srcData[j + 0];
          var g = srcData[j + 1];
          var b = srcData[j + 2];
          var a = srcData[j + 3];

          // 反预乘Alpha
          var finalR = r, finalG = g, finalB = b;
          if (a > 0 && a < 255) {
            finalR = Math.min(255, Math.round(r * 255 / a));
            finalG = Math.min(255, Math.round(g * 255 / a));
            finalB = Math.min(255, Math.round(b * 255 / a));
          } else if (a === 0) {
            finalR = 0; finalG = 0; finalB = 0;
          }

          // 计算位置
          var pixelIndex = Math.floor(j / 4);
          var row = Math.floor(pixelIndex / width);
          var col = pixelIndex % width;
          var leftIdx = (row * width * 2 + col) * 4;
          var rightIdx = (row * width * 2 + col + width) * 4;

          if (isColorLeftAlphaRight) {
            dualData[leftIdx + 0] = finalR;
            dualData[leftIdx + 1] = finalG;
            dualData[leftIdx + 2] = finalB;
            dualData[leftIdx + 3] = a;
            dualData[rightIdx + 0] = a;
            dualData[rightIdx + 1] = a;
            dualData[rightIdx + 2] = a;
            dualData[rightIdx + 3] = 255;
          } else {
            dualData[leftIdx + 0] = a;
            dualData[leftIdx + 1] = a;
            dualData[leftIdx + 2] = a;
            dualData[leftIdx + 3] = 255;
            dualData[rightIdx + 0] = finalR;
            dualData[rightIdx + 1] = finalG;
            dualData[rightIdx + 2] = finalB;
            dualData[rightIdx + 3] = a;
          }
        }
        
        dualCtx.putImageData(dualImageData, 0, 0);
        
        // 合成黑底并转换为JPEG
        // 修复锯齿：彩色通道需要用alpha与黑底混合
        for (var k = 0; k < dualData.length; k += 4) {
          var pixelAlpha = dualData[k + 3];
          
          if (pixelAlpha === 255) {
            blackBgData[k + 0] = dualData[k + 0];
            blackBgData[k + 1] = dualData[k + 1];
            blackBgData[k + 2] = dualData[k + 2];
          } else if (pixelAlpha === 0) {
            blackBgData[k + 0] = 0;
            blackBgData[k + 1] = 0;
            blackBgData[k + 2] = 0;
          } else {
            // 半透明像素：与黑底混合
            blackBgData[k + 0] = Math.round(dualData[k + 0] * pixelAlpha / 255);
            blackBgData[k + 1] = Math.round(dualData[k + 1] * pixelAlpha / 255);
            blackBgData[k + 2] = Math.round(dualData[k + 2] * pixelAlpha / 255);
          }
          blackBgData[k + 3] = 255;
        }
        blackBgCtx.putImageData(blackBgImageData, 0, 0);
        
        // 转换为JPEG
        var blob = await new Promise(function(resolve) {
          blackBgCanvas.toBlob(resolve, 'image/jpeg', jpegQuality);
        });
        var buffer = await blob.arrayBuffer();
        jpegFrames.push(new Uint8Array(buffer));

        // 进度回调
        onProgress((i + 1) / frameCount);

        // 让出线程
        if (i % 5 === 0) {
          await new Promise(function(r) { setTimeout(r, 0); });
        }
      }

      return jpegFrames;
    }
  };

  // 导出模块
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DualChannelComposer;
  } else {
    global.DualChannelComposer = DualChannelComposer;
  }

})(typeof window !== 'undefined' ? window : this);
