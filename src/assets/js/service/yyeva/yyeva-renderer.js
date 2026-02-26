/**
 * ==================== YYEVA 渲染器模块 (YYEVA Renderer) ====================
 * 
 * 功能说明：
 * 负责渲染 YYEVA 格式的双通道 MP4 文件中的动态元素（文本和图片）
 * 
 * 主要功能：
 * - 渲染 YYEVA 动态元素
 * - 处理文本渲染
 * - 处理图片渲染
 * - 管理图片缓存
 * - 提供设置文本和图片的API
 * 
 * @author MeeWoo Team
 * @version 1.0.0
 * ====================================================================
 */

(function (window) {
  'use strict';

  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Services = window.MeeWoo.Services || {};

  function YyevaRenderer() {
    this.effectConfig = {};
    this.imageCache = {};
  }

  YyevaRenderer.prototype = {
    constructor: YyevaRenderer,

    /**
     * 渲染 YYEVA 动态元素
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} frameIndex - 当前帧索引
     * @param {Object} yyevaData - YYEVA 数据
     * @param {ImageData} maskData - 蒙版数据（可选）
     */
    renderEffects: function (ctx, frameIndex, yyevaData, maskContext) {
      if (!yyevaData || !yyevaData.datas) return;

      var datas = yyevaData.datas;
      var effect = yyevaData.effect;

      // 找到当前帧的数据
      var frameData = this._findFrameData(datas, frameIndex);
      if (!frameData) return;

      // 遍历该帧的所有动态元素
      for (var j = 0; j < frameData.length; j++) {
        var item = frameData[j];
        var effectId = item.effectId;
        
        // 遍历 effect 对象，根据 effectId 字段找到正确的 effect
        var effectInfo = null;
        for (var key in effect) {
          if (effect[key].effectId == effectId) {
            effectInfo = effect[key];
            break;
          }
        }
        
        // 如果找不到，尝试使用键值匹配
        if (!effectInfo) {
          effectInfo = effect[effectId] || effect[String(effectId)];
        }

        // 智能匹配：根据元素尺寸比例匹配 effect
        if (!effectInfo) {
          var outputFrame = item.outputFrame || item.renderFrame;
          if (!outputFrame) continue;
          
          var aspectRatio = outputFrame[2] / outputFrame[3];
          var effectsArray = [];
          for (var key in effect) {
            effectsArray.push(effect[key]);
          }
          
          // 宽高比大于1.5的匹配文本，小于1.5的匹配图片
          var targetType = aspectRatio >= 1.5 ? 'txt' : 'img';
          for (var i = 0; i < effectsArray.length; i++) {
            if (effectsArray[i].effectType === targetType) {
              effectInfo = effectsArray[i];
              break;
            }
          }
          
          // 如果仍然找不到，使用第一个效果
          if (!effectInfo && effectsArray.length > 0) {
            effectInfo = effectsArray[0];
          }
          
          if (!effectInfo) continue;
        }

        // 渲染对应类型的元素
        if (effectInfo.effectType === 'txt') {
          this._renderText(ctx, effectInfo, item, this.effectConfig[effectInfo.effectTag] || {});
        } else if (effectInfo.effectType === 'img') {
          var userConfig = this.effectConfig[effectInfo.effectTag] || {};
          if (userConfig.imageSource) {
            this._renderImage(ctx, effectInfo, item, userConfig, maskContext);
          }
        }
      }
    },

    /**
     * 查找指定帧的数据
     * @param {Array} datas - 所有帧数据
     * @param {number} frameIndex - 帧索引
     * @returns {Array|null} - 帧数据
     */
    _findFrameData: function (datas, frameIndex) {
      for (var i = 0; i < datas.length; i++) {
        if (datas[i].frameIndex === frameIndex) {
          return datas[i].data;
        }
      }
      return null;
    },

    /**
     * 渲染文本元素
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} effectInfo - 效果信息
     * @param {Object} frameData - 帧数据
     * @param {Object} userConfig - 用户配置
     */
    _renderText: function (ctx, effectInfo, frameData, userConfig) {
      // 使用 renderFrame 而不是 outputFrame，这是实际显示位置
      var renderFrame = frameData.renderFrame || frameData.outputFrame;
      var x = renderFrame[0];
      var y = renderFrame[1];
      var w = renderFrame[2];
      var h = renderFrame[3];

      // 获取文本内容
      var text = userConfig && userConfig.text ? userConfig.text : effectInfo.effectTag || '';

      // 获取样式
      var fontSize = (userConfig && userConfig.fontSize) || effectInfo.fontSize || 36;
      var fontColor = (userConfig && userConfig.fontColor) || effectInfo.fontColor || '#ffffff';
      var textAlign = (userConfig && userConfig.textAlign) || effectInfo.textAlign || 'center';

      // 保存当前状态
      ctx.save();
      
      // 应用蒙版：使用渲染区域作为蒙版，确保文本在指定区域内显示
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      // 设置字体样式
      ctx.font = fontSize + 'px ' + (effectInfo.fontFamily || 'Arial, sans-serif');
      ctx.fillStyle = fontColor;
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'middle';

      // 计算文本垂直位置，确保在渲染区域内居中
      var textY = y + h / 2;
      
      // 绘制文本
      ctx.fillText(text, x + w / 2, textY);
      
      // 恢复状态
      ctx.restore();
    },

    /**
     * 渲染图片元素
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} effectInfo - 效果信息
     * @param {Object} frameData - 帧数据
     * @param {Object} userConfig - 用户配置
     * @param {Object} maskContext - 蒙版上下文（包含完整视频帧数据）
     */
    _renderImage: function (ctx, effectInfo, frameData, userConfig, maskContext) {
      // 使用 renderFrame 作为实际显示位置
      var renderFrame = frameData.renderFrame;
      // 使用 outputFrame 作为蒙版位置和尺寸
      var outputFrame = frameData.outputFrame;
      
      if (!renderFrame) return;
      
      var x = renderFrame[0];
      var y = renderFrame[1];
      var w = renderFrame[2];
      var h = renderFrame[3];

      var imageSource = userConfig && userConfig.imageSource;
      if (imageSource === null || imageSource === undefined) {
        return;
      }

      var cachedKey = '_yyevaImg_' + effectInfo.effectTag;
      var img = this.imageCache[cachedKey];

      if (!img) {
        img = new Image();
        img.src = imageSource;
        this.imageCache[cachedKey] = img;
      }

      if (img.complete && img.naturalWidth > 0) {
        // 保存当前状态
        ctx.save();
        
        // 应用基础裁剪区域
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        
        // 强制使用 scaleFill 模式，确保图片填充显示
        var scaleMode = 'scaleFill';
        
        // 应用蒙版数据：从视频帧的outputFrame位置提取蒙版形状
        if (outputFrame && maskContext && maskContext.ctx) {
          this._renderImageWithMask(ctx, img, x, y, w, h, scaleMode, outputFrame, maskContext);
        } else {
          // 没有蒙版数据时，直接绘制图片
          this._drawImageToCanvas(ctx, img, x, y, w, h, scaleMode);
        }
        
        // 恢复状态
        ctx.restore();
      }
    },

    /**
     * 使用蒙版渲染图片
     * YYEVA格式将蒙版形状存放在视频帧底部的额外区域
     * @param {CanvasRenderingContext2D} ctx - 目标画布上下文
     * @param {HTMLImageElement} img - 图片元素
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} w - 宽度
     * @param {number} h - 高度
     * @param {string} scaleMode - 缩放模式
     * @param {Array} outputFrame - 蒙版位置 [x, y, w, h]
     * @param {Object} maskContext - 蒙版上下文
     */
    _renderImageWithMask: function (ctx, img, x, y, w, h, scaleMode, outputFrame, maskContext) {
      var maskX = Math.floor(outputFrame[0]);
      var maskY = Math.floor(outputFrame[1]);
      var maskW = Math.floor(outputFrame[2]);
      var maskH = Math.floor(outputFrame[3]);
      
      // 创建临时画布用于合成
      var tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.floor(w);
      tempCanvas.height = Math.floor(h);
      var tempCtx = tempCanvas.getContext('2d');
      
      // 绘制图片到临时画布
      this._drawImageToCanvas(tempCtx, img, 0, 0, w, h, scaleMode);
      
      // 从完整视频帧的outputFrame位置提取蒙版形状
      try {
        // 确保坐标在有效范围内
        var srcCtx = maskContext.ctx;
        var videoWidth = maskContext.videoWidth;
        var videoHeight = maskContext.videoHeight;
        
        // 检查outputFrame是否在视频帧范围内
        if (maskX >= 0 && maskY >= 0 && 
            maskX + maskW <= videoWidth && 
            maskY + maskH <= videoHeight) {
          
          // 从alpha通道区域提取蒙版数据
          var maskImageData = srcCtx.getImageData(maskX, maskY, maskW, maskH);
          
          // 创建蒙版画布
          var maskCanvas = document.createElement('canvas');
          maskCanvas.width = Math.floor(w);
          maskCanvas.height = Math.floor(h);
          var maskCtx = maskCanvas.getContext('2d');
          
          // 将蒙版缩放到目标尺寸
          var scaledMaskCanvas = document.createElement('canvas');
          scaledMaskCanvas.width = maskW;
          scaledMaskCanvas.height = maskH;
          var scaledMaskCtx = scaledMaskCanvas.getContext('2d');
          scaledMaskCtx.putImageData(maskImageData, 0, 0);
          
          // 绘制缩放后的蒙版到目标尺寸
          maskCtx.drawImage(scaledMaskCanvas, 0, 0, maskW, maskH, 0, 0, w, h);
          
          // 获取缩放后的蒙版数据
          var finalMaskData = maskCtx.getImageData(0, 0, Math.floor(w), Math.floor(h));
          
          // 获取图片像素数据
          var imageData = tempCtx.getImageData(0, 0, Math.floor(w), Math.floor(h));
          var pixels = imageData.data;
          var maskPixels = finalMaskData.data;
          
          // 应用蒙版：使用蒙版的R通道（灰度值）作为图片的alpha通道
          for (var i = 0; i < pixels.length; i += 4) {
            // 蒙版的R通道值代表透明度（白色=不透明，黑色=完全透明）
            var maskAlpha = maskPixels[i]; // R通道
            // 将蒙版alpha与图片原有alpha相乘
            pixels[i + 3] = Math.floor((pixels[i + 3] * maskAlpha) / 255);
          }
          
          // 将处理后的图片放回临时画布
          tempCtx.putImageData(imageData, 0, 0);
          
          // 清理中间画布
          scaledMaskCanvas.width = 0;
          scaledMaskCanvas.height = 0;
          maskCanvas.width = 0;
          maskCanvas.height = 0;
        } else {
          console.warn('[YYEVA] 蒙版位置超出视频范围:', maskX, maskY, maskW, maskH, '视频尺寸:', videoWidth, videoHeight);
        }
      } catch (e) {
        console.error('[YYEVA] 提取蒙版失败:', e);
      }
      
      // 将处理后的图片绘制到目标画布
      ctx.drawImage(tempCanvas, x, y);
      
      // 清理临时画布
      tempCanvas.width = 0;
      tempCanvas.height = 0;
    },

    /**
     * 绘制图片到画布
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {HTMLImageElement} img - 图片元素
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} w - 宽度
     * @param {number} h - 高度
     * @param {string} scaleMode - 缩放模式
     */
    _drawImageToCanvas: function (ctx, img, x, y, w, h, scaleMode) {
      var imgW = img.width;
      var imgH = img.height;
      var targetW = w;
      var targetH = h;

      var imgRatio = imgW / imgH;
      var targetRatio = targetW / targetH;
      var drawW, drawH, offsetX, offsetY;

      if (scaleMode === 'scaleFill') {
        drawW = targetW;
        drawH = targetH;
        offsetX = x;
        offsetY = y;
      } else {
        if (imgRatio > targetRatio) {
          drawW = targetW;
          drawH = targetW / imgRatio;
        } else {
          drawH = targetH;
          drawW = targetH * imgRatio;
        }
        offsetX = x + (targetW - drawW) / 2;
        offsetY = y + (targetH - drawH) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    },

    /**
     * 设置文本配置
     * @param {string} effectTag - 效果标签
     * @param {Object} config - 配置对象
     */
    setText: function (effectTag, config) {
      if (!this.effectConfig[effectTag]) {
        this.effectConfig[effectTag] = {};
      }
      Object.assign(this.effectConfig[effectTag], config);
    },

    /**
     * 设置图片配置
     * @param {string} effectTag - 效果标签
     * @param {string} imageSource - 图片源
     */
    setImage: function (effectTag, imageSource) {
      if (!this.effectConfig[effectTag]) {
        this.effectConfig[effectTag] = {};
      }
      this.effectConfig[effectTag].imageSource = imageSource;
    },

    /**
     * 获取YYEVA效果列表
     * @param {Object} yyevaData - YYEVA数据
     * @returns {Array} - 效果列表
     */
    getEffects: function (yyevaData) {
      if (!yyevaData || !yyevaData.effect) return [];
      var effects = [];
      for (var key in yyevaData.effect) {
        var effect = yyevaData.effect[key];
        effects.push({
          effectId: key,
          effectTag: effect.effectTag,
          effectType: effect.effectType,
          name: effect.name || effect.effectTag
        });
      }
      return effects;
    },

    /**
     * 清除图片缓存
     */
    clearImageCache: function () {
      this.imageCache = {};
    },

    /**
     * 重置渲染器
     */
    reset: function () {
      this.effectConfig = {};
      this.clearImageCache();
    },

    /**
     * 获取指定帧的数据
     * @param {Array} datas - 所有帧数据
     * @param {number} frameIndex - 帧索引
     * @returns {Array|null} - 帧数据
     */
    getFrameData: function (datas, frameIndex) {
      return this._findFrameData(datas, frameIndex);
    }
  };

  window.MeeWoo.Services.YyevaRenderer = YyevaRenderer;

})(window);