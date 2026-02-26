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
          this._renderText(ctx, effectInfo, item, this.effectConfig[effectInfo.effectTag] || {}, maskContext);
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
     * @param {Object} maskContext - 蒙版上下文（用于透明度动画）
     */
    _renderText: function (ctx, effectInfo, frameData, userConfig, maskContext) {
      // 使用 renderFrame 作为实际显示位置
      var renderFrame = frameData.renderFrame || frameData.outputFrame;
      // 使用 outputFrame 作为蒙版位置（用于提取透明度）
      var outputFrame = frameData.outputFrame;
      
      var x = renderFrame[0];
      var y = renderFrame[1];
      var w = renderFrame[2];
      var h = renderFrame[3];

      // 获取文本内容（默认为空字符串，不显示 key ID）
      var text = userConfig && userConfig.text ? userConfig.text : '';

      // 获取样式
      var fontSize = (userConfig && userConfig.fontSize) || effectInfo.fontSize || 36;
      var fontColor = (userConfig && userConfig.fontColor) || effectInfo.fontColor || '#ffffff';
      var textAlign = (userConfig && userConfig.textAlign) || effectInfo.textAlign || 'center';

      // 创建临时画布绘制文本
      var tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.floor(w);
      tempCanvas.height = Math.floor(h);
      var tempCtx = tempCanvas.getContext('2d');

      // 设置字体样式并绘制文本
      tempCtx.font = fontSize + 'px ' + (effectInfo.fontFamily || 'Arial, sans-serif');
      tempCtx.fillStyle = fontColor;
      tempCtx.textAlign = textAlign;
      tempCtx.textBaseline = 'middle';
      tempCtx.fillText(text, w / 2, h / 2);

      // 应用蒙版透明度（如果有）
      if (outputFrame && maskContext && maskContext.ctx) {
        this._applyMaskAlpha(tempCtx, Math.floor(w), Math.floor(h), outputFrame, maskContext);
      }

      // 绘制到目标画布
      ctx.drawImage(tempCanvas, x, y);
      
      // 清理
      tempCanvas.width = 0;
      tempCanvas.height = 0;
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
        var srcCtx = maskContext.ctx;
        var videoWidth = maskContext.videoWidth;
        var videoHeight = maskContext.videoHeight;
        
        // 检查outputFrame是否在视频帧范围内
        if (maskX >= 0 && maskY >= 0 && 
            maskX + maskW <= videoWidth && 
            maskY + maskH <= videoHeight) {
          
          // 从alpha通道区域提取蒙版数据
          var maskImageData = srcCtx.getImageData(maskX, maskY, maskW, maskH);
          
          // 创建蒙版画布并缩放到目标尺寸
          var scaledMaskCanvas = document.createElement('canvas');
          scaledMaskCanvas.width = maskW;
          scaledMaskCanvas.height = maskH;
          var scaledMaskCtx = scaledMaskCanvas.getContext('2d');
          scaledMaskCtx.putImageData(maskImageData, 0, 0);
          
          var maskCanvas = document.createElement('canvas');
          maskCanvas.width = Math.floor(w);
          maskCanvas.height = Math.floor(h);
          var maskCtx = maskCanvas.getContext('2d');
          maskCtx.drawImage(scaledMaskCanvas, 0, 0, maskW, maskH, 0, 0, w, h);
          
          // 获取缩放后的蒙版数据
          var finalMaskData = maskCtx.getImageData(0, 0, Math.floor(w), Math.floor(h));
          
          // 获取图片像素数据
          var imageData = tempCtx.getImageData(0, 0, Math.floor(w), Math.floor(h));
          var pixels = imageData.data;
          var maskPixels = finalMaskData.data;
          
          // 应用蒙版：使用蒙版的R通道（灰度值）作为图片的alpha通道
          for (var i = 0; i < pixels.length; i += 4) {
            var maskAlpha = maskPixels[i]; // R通道代表透明度
            pixels[i + 3] = Math.floor((pixels[i + 3] * maskAlpha) / 255);
          }
          
          // 将处理后的图片放回临时画布
          tempCtx.putImageData(imageData, 0, 0);
          
          // 清理中间画布
          scaledMaskCanvas.width = 0;
          maskCanvas.width = 0;
        }
      } catch (e) {
        // 蒙版提取失败时静默处理
      }
      
      // 将处理后的图片绘制到目标画布
      ctx.drawImage(tempCanvas, x, y);
      
      // 清理临时画布
      tempCanvas.width = 0;
    },

    /**
     * 绘制图片到画布（cover模式：保持比例，短边填满，长边裁剪居中）
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {HTMLImageElement} img - 图片元素
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} w - 宽度
     * @param {number} h - 高度
     * @param {string} scaleMode - 缩放模式（未使用，统一使用cover）
     */
    _drawImageToCanvas: function (ctx, img, x, y, w, h, scaleMode) {
      var imgW = img.width;
      var imgH = img.height;
      var targetW = w;
      var targetH = h;

      var imgRatio = imgW / imgH;
      var targetRatio = targetW / targetH;
      
      // cover模式：保持比例，短边填满，长边超出裁剪
      var srcX = 0, srcY = 0, srcW = imgW, srcH = imgH;
      
      if (imgRatio > targetRatio) {
        // 图片更宽，裁剪左右
        srcW = imgH * targetRatio;
        srcX = (imgW - srcW) / 2;
      } else {
        // 图片更高，裁剪上下
        srcH = imgW / targetRatio;
        srcY = (imgH - srcH) / 2;
      }

      ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, targetW, targetH);
    },

    /**
     * 设置文本配置
     * @param {string} effectTag - 效果标签
     * @param {Object} config - 配置对象，传入空对象表示恢复默认
     */
    setText: function (effectTag, config) {
      if (!this.effectConfig[effectTag]) {
        this.effectConfig[effectTag] = {};
      }
      // 如果传入空对象，表示恢复默认，删除 text 属性
      if (!config || Object.keys(config).length === 0) {
        delete this.effectConfig[effectTag].text;
      } else {
        Object.assign(this.effectConfig[effectTag], config);
      }
    },

    /**
     * 设置图片配置
     * @param {string} effectTag - 效果标签
     * @param {string} imageSource - 图片源，传入 null 表示恢复默认
     */
    setImage: function (effectTag, imageSource) {
      if (!this.effectConfig[effectTag]) {
        this.effectConfig[effectTag] = {};
      }
      // 清除图片缓存，确保替换后重新加载
      var cachedKey = '_yyevaImg_' + effectTag;
      if (this.imageCache[cachedKey]) {
        delete this.imageCache[cachedKey];
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
     * 从蒙版提取透明度并应用到画布
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} w - 宽度
     * @param {number} h - 高度
     * @param {Array} outputFrame - 蒙版位置 [x, y, w, h]
     * @param {Object} maskContext - 蒙版上下文
     */
    _applyMaskAlpha: function (ctx, w, h, outputFrame, maskContext) {
      var maskX = Math.floor(outputFrame[0]);
      var maskY = Math.floor(outputFrame[1]);
      var maskW = Math.floor(outputFrame[2]);
      var maskH = Math.floor(outputFrame[3]);
      
      var srcCtx = maskContext.ctx;
      var videoWidth = maskContext.videoWidth;
      var videoHeight = maskContext.videoHeight;
      
      // 检查outputFrame是否在视频帧范围内
      if (maskX < 0 || maskY < 0 || maskX + maskW > videoWidth || maskY + maskH > videoHeight) {
        return;
      }
      
      try {
        // 从视频帧提取蒙版数据
        var maskImageData = srcCtx.getImageData(maskX, maskY, maskW, maskH);
        
        // 缩放蒙版到目标尺寸
        var scaledMaskCanvas = document.createElement('canvas');
        scaledMaskCanvas.width = maskW;
        scaledMaskCanvas.height = maskH;
        var scaledMaskCtx = scaledMaskCanvas.getContext('2d');
        scaledMaskCtx.putImageData(maskImageData, 0, 0);
        
        var maskCanvas = document.createElement('canvas');
        maskCanvas.width = w;
        maskCanvas.height = h;
        var maskCtx = maskCanvas.getContext('2d');
        maskCtx.drawImage(scaledMaskCanvas, 0, 0, maskW, maskH, 0, 0, w, h);
        
        var finalMaskData = maskCtx.getImageData(0, 0, w, h);
        var maskPixels = finalMaskData.data;
        
        // 获取画布内容并应用透明度
        var imageData = ctx.getImageData(0, 0, w, h);
        var pixels = imageData.data;
        
        for (var i = 0; i < pixels.length; i += 4) {
          var maskAlpha = maskPixels[i]; // R通道代表透明度
          pixels[i + 3] = Math.floor((pixels[i + 3] * maskAlpha) / 255);
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // 清理
        scaledMaskCanvas.width = 0;
        maskCanvas.width = 0;
      } catch (e) {
        console.error('[YYEVA] 应用蒙版透明度失败:', e);
      }
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