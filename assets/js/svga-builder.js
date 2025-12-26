/**
 * SVGA Builder - SVGA文件构建器
 * 独立模块，将序列帧构建为SVGA文件
 * 
 * 功能：
 * - 将PNG/Blob序列帧构建为SVGA文件
 * - 支持质量压缩（图片缩放 + transform放大）
 * - 支持进度回调
 * 
 * 依赖：
 * - protobuf.js（通过dependencies传入）
 * - pako（通过dependencies传入）
 * - svga.proto（固定路径或通过protoPath配置）
 * 
 * 调用方式：
 * 1. 从Blob构建（普通MP4、序列帧等）：
 *    SVGABuilder.build({ frames: [{blob}], width, height, fps, quality, audios, muted, ... })
 * 
 * 2. 从已编码PNG构建（双通道MP4等）：
 *    SVGABuilder.buildFromPNG({ frames: [Uint8Array], scaledWidth, displayWidth, audios, muted, ... })
 */
(function(global) {
  'use strict';

  var SVGABuilder = {
    
    /**
     * 默认配置
     */
    defaults: {
      protoPath: './svga.proto',
      quality: 80,
      fps: 30
    },

    /**
     * 从Blob帧数组构建SVGA文件
     * @param {Object} options - 配置参数
     * @param {Array} options.frames - 帧数组 [{blob: Blob, index: number}]
     * @param {Number} options.width - 显示宽度
     * @param {Number} options.height - 显示高度
     * @param {Number} options.fps - 帧率（默认30）
     * @param {Number} options.quality - 质量 10-100（默认80）
     * @param {Array} options.audios - 音频数据数组（可选）[{audioKey, audioData, startFrame, endFrame, ...}]
     * @param {Boolean} options.muted - 是否静音（可选，默认false）
     * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
     * @param {Object} options.dependencies - 依赖库 {protobuf, pako}
     * @param {String} options.protoPath - proto文件路径（可选）
     * @returns {Promise<Blob>} - SVGA文件Blob
     */
    build: async function(options) {
      var _this = this;
      
      // 验证依赖
      this._validateDependencies(options.dependencies);
      
      // 参数处理
      var frames = options.frames || [];
      var width = options.width || 100;
      var height = options.height || 100;
      var fps = options.fps || this.defaults.fps;
      var quality = Math.max(10, Math.min(100, options.quality || this.defaults.quality));
      var audios = options.audios || [];
      var muted = options.muted || false;
      var onProgress = options.onProgress || function() {};
      var protoPath = options.protoPath || this.defaults.protoPath;
      var protobuf = options.dependencies.protobuf;
      var pako = options.dependencies.pako;
      
      var totalFrames = frames.length;
      if (totalFrames === 0) {
        throw new Error('帧数组不能为空');
      }
      
      // 根据质量计算缩放因子
      var scaleFactor = quality / 100;
      var scaledWidth = Math.round(width * scaleFactor);
      var scaledHeight = Math.round(height * scaleFactor);
      var scaleUp = 1 / scaleFactor;
      
      // 阶段1：处理帧 - 缩放并转为PNG Uint8Array（0-50%）
      var pngFrames = [];
      var canvas = document.createElement('canvas');
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      var ctx = canvas.getContext('2d');
      
      for (var i = 0; i < totalFrames; i++) {
        var frame = frames[i];
        
        // 从blob创建图片
        var img = await _this._loadImageFromBlob(frame.blob);
        
        // 绘制缩放后的帧
        ctx.clearRect(0, 0, scaledWidth, scaledHeight);
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
        
        // 清理blob URL
        URL.revokeObjectURL(img.src);
        
        // 转为PNG Uint8Array
        var pngData = await _this._canvasToPNG(canvas);
        pngFrames.push(pngData);
        
        // 进度回调（0-50%）
        onProgress((i + 1) / totalFrames * 0.5);
      }
      
      // 阶段2：编码SVGA（50-100%）
      return _this._encodeSVGA({
        pngFrames: pngFrames,
        scaledWidth: scaledWidth,
        scaledHeight: scaledHeight,
        displayWidth: width,
        displayHeight: height,
        scaleUp: scaleUp,
        fps: fps,
        audios: audios,
        muted: muted,
        protoPath: protoPath,
        protobuf: protobuf,
        pako: pako,
        onProgress: function(progress) {
          // 映射到50-100%
          onProgress(0.5 + progress * 0.5);
        }
      });
    },

    /**
     * 从已编码PNG数据构建SVGA文件
     * 适用于双通道MP4转SVGA等场景（帧已预处理为PNG Uint8Array）
     * @param {Object} options - 配置参数
     * @param {Array} options.frames - PNG Uint8Array数组
     * @param {Number} options.scaledWidth - 缩放后宽度（图片实际宽度）
     * @param {Number} options.scaledHeight - 缩放后高度（图片实际高度）
     * @param {Number} options.displayWidth - 显示宽度（viewBox宽度）
     * @param {Number} options.displayHeight - 显示高度（viewBox高度）
     * @param {Number} options.scaleFactor - 缩放因子
     * @param {Number} options.fps - 帧率
     * @param {Array} options.audios - 音频数据数组（可选）[{audioKey, audioData, startFrame, endFrame, ...}]
     * @param {Boolean} options.muted - 是否静音（可选，默认false）
     * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
     * @param {Object} options.dependencies - 依赖库 {protobuf, pako}
     * @param {String} options.protoPath - proto文件路径（可选）
     * @returns {Promise<Blob>} - SVGA文件Blob
     */
    buildFromPNG: async function(options) {
      // 验证依赖
      this._validateDependencies(options.dependencies);
      
      // 参数处理
      var pngFrames = options.frames || [];
      var scaledWidth = options.scaledWidth;
      var scaledHeight = options.scaledHeight;
      var displayWidth = options.displayWidth;
      var displayHeight = options.displayHeight;
      var scaleFactor = options.scaleFactor || 1;
      var scaleUp = 1 / scaleFactor;
      var fps = options.fps || this.defaults.fps;
      var audios = options.audios || [];
      var muted = options.muted || false;
      var onProgress = options.onProgress || function() {};
      var protoPath = options.protoPath || this.defaults.protoPath;
      var protobuf = options.dependencies.protobuf;
      var pako = options.dependencies.pako;
      
      if (pngFrames.length === 0) {
        throw new Error('帧数组不能为空');
      }
      
      // 直接进入编码阶段（0-100%）
      return this._encodeSVGA({
        pngFrames: pngFrames,
        scaledWidth: scaledWidth,
        scaledHeight: scaledHeight,
        displayWidth: displayWidth,
        displayHeight: displayHeight,
        scaleUp: scaleUp,
        fps: fps,
        audios: audios,
        muted: muted,
        protoPath: protoPath,
        protobuf: protobuf,
        pako: pako,
        onProgress: onProgress
      });
    },

    /**
     * 核心编码逻辑 - 将PNG帧编码为SVGA
     * @private
     */
    _encodeSVGA: function(params) {
      var pngFrames = params.pngFrames;
      var scaledWidth = params.scaledWidth;
      var scaledHeight = params.scaledHeight;
      var displayWidth = params.displayWidth;
      var displayHeight = params.displayHeight;
      var scaleUp = params.scaleUp;
      var fps = params.fps;
      var audios = params.audios || [];
      var muted = params.muted || false;
      var protoPath = params.protoPath;
      var protobuf = params.protobuf;
      var pako = params.pako;
      var onProgress = params.onProgress;
      
      var totalFrames = pngFrames.length;
      
      return new Promise(function(resolve, reject) {
        protobuf.load(protoPath, function(err, root) {
          if (err) {
            reject(new Error('Proto加载失败: ' + err.message));
            return;
          }
          
          try {
            var MovieEntity = root.lookupType('com.opensource.svga.MovieEntity');
            if (!MovieEntity) {
              reject(new Error('Proto文件中未找到MovieEntity定义'));
              return;
            }
            
            // 构建images字典（0-40%）
            var images = {};
            for (var i = 0; i < totalFrames; i++) {
              var imageKey = 'img_' + i;
              images[imageKey] = pngFrames[i];
              onProgress((i + 1) / totalFrames * 0.4);
            }
            
            // 构建sprites数组（40-80%）
            var sprites = [];
            for (var i = 0; i < totalFrames; i++) {
              var imageKey = 'img_' + i;
              
              // 每个sprite只在对应帧显示
              var spriteFrames = [];
              for (var f = 0; f < totalFrames; f++) {
                if (f === i) {
                  // 当前帧显示，使用缩小后的图片尺寸，通过transform放大到显示尺寸
                  spriteFrames.push({
                    alpha: 1.0,
                    layout: {
                      x: 0,
                      y: 0,
                      width: scaledWidth,
                      height: scaledHeight
                    },
                    transform: {
                      a: scaleUp, b: 0, c: 0, d: scaleUp, tx: 0, ty: 0
                    }
                  });
                } else {
                  // 其他帧隐藏（alpha=0）
                  spriteFrames.push({
                    alpha: 0
                  });
                }
              }
              
              sprites.push({
                imageKey: imageKey,
                frames: spriteFrames
              });
              
              onProgress(0.4 + (i + 1) / totalFrames * 0.4);
            }
            
            // 构建音频数据
            var audioEntries = [];
            if (!muted && audios && audios.length > 0) {
              audios.forEach(function(audio, idx) {
                var audioKey = audio.audioKey || ('audio_' + idx);
                // 将音频数据添加到images字典
                if (audio.audioData) {
                  images[audioKey] = audio.audioData;
                }
                // 构建音频条目
                audioEntries.push({
                  audioKey: audioKey,
                  startFrame: audio.startFrame || 0,
                  endFrame: audio.endFrame || totalFrames,
                  startTime: audio.startTime || 0,
                  totalTime: audio.totalTime || 0
                });
              });
            }
            
            // 构建MovieEntity（80%）
            var movieData = {
              version: '2.0',
              params: {
                viewBoxWidth: displayWidth,
                viewBoxHeight: displayHeight,
                fps: fps,
                frames: totalFrames
              },
              images: images,
              sprites: sprites,
              audios: audioEntries
            };
            
            onProgress(0.8);
            
            // 编码protobuf
            var errMsg = MovieEntity.verify(movieData);
            if (errMsg) {
              reject(new Error('MovieEntity验证失败: ' + errMsg));
              return;
            }
            
            var message = MovieEntity.create(movieData);
            var buffer = MovieEntity.encode(message).finish();
            
            // 使用pako压缩（90%）
            onProgress(0.9);
            var deflatedData = pako.deflate(buffer);
            
            // 创建Blob（100%）
            var blob = new Blob([deflatedData], { type: 'application/octet-stream' });
            onProgress(1.0);
            
            resolve(blob);
            
          } catch (buildErr) {
            reject(new Error('SVGA构建失败: ' + buildErr.message));
          }
        });
      });
    },

    /**
     * 验证依赖库
     * @private
     */
    _validateDependencies: function(deps) {
      if (!deps) {
        throw new Error('缺少依赖配置');
      }
      if (!deps.protobuf) {
        throw new Error('缺少依赖：protobuf.js');
      }
      if (!deps.pako) {
        throw new Error('缺少依赖：pako');
      }
    },

    /**
     * 从Blob加载图片
     * @private
     */
    _loadImageFromBlob: function(blob) {
      return new Promise(function(resolve, reject) {
        var image = new Image();
        image.onload = function() { resolve(image); };
        image.onerror = function() { reject(new Error('图片加载失败')); };
        image.src = URL.createObjectURL(blob);
      });
    },

    /**
     * Canvas转PNG Uint8Array
     * @private
     */
    _canvasToPNG: async function(canvas) {
      var blob = await new Promise(function(resolve) {
        canvas.toBlob(resolve, 'image/png');
      });
      var arrayBuffer = await blob.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
  };

  // 导出模块
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGABuilder;
  } else {
    global.SVGABuilder = SVGABuilder;
  }

})(typeof window !== 'undefined' ? window : this);
