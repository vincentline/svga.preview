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
(function (global) {
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
    build: async function (options) {
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
      var onProgress = options.onProgress || function () { };
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
        onProgress: function (progress) {
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
    buildFromPNG: async function (options) {
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
      var onProgress = options.onProgress || function () { };
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
    _encodeSVGA: function (params) {
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

      return new Promise(function (resolve, reject) {
        protobuf.load(protoPath, function (err, root) {
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
              audios.forEach(function (audio, idx) {
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
    _validateDependencies: function (deps) {
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
    _loadImageFromBlob: function (blob) {
      return new Promise(function (resolve, reject) {
        var image = new Image();
        image.onload = function () { resolve(image); };
        image.onerror = function () { reject(new Error('图片加载失败')); };
        image.src = URL.createObjectURL(blob);
      });
    },

    /**
     * Canvas转PNG Uint8Array（使用pako压缩）
     * @private
     */
    _canvasToPNG: async function (canvas) {
      // 如果有pako库，使用 pako 压缩 PNG
      if (typeof pako !== 'undefined') {
        try {
          // 获取像素数据
          var ctx = canvas.getContext('2d');
          var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var pixels = imageData.data;

          // 准备未压缩的像素数据（每行前加filter byte 0）
          var width = canvas.width;
          var height = canvas.height;
          var rawData = new Uint8Array(height * (1 + width * 4));
          for (var y = 0; y < height; y++) {
            rawData[y * (1 + width * 4)] = 0;  // filter type 0
            for (var x = 0; x < width; x++) {
              var idx = (y * width + x) * 4;
              var pos = y * (1 + width * 4) + 1 + x * 4;
              rawData[pos] = pixels[idx];
              rawData[pos + 1] = pixels[idx + 1];
              rawData[pos + 2] = pixels[idx + 2];
              rawData[pos + 3] = pixels[idx + 3];
            }
          }

          // 使用 pako 压缩（level 6 平衡）
          var compressed = pako.deflate(rawData, { level: 6 });

          // 构建完整的 PNG 文件
          var png = this._buildSimplePNG(width, height, compressed);
          return png;
        } catch (e) {
          console.warn('PNG压缩失败，使用原始数据:', e);
        }
      }

      // 没有压缩库或压缩失败，返回原始数据
      var blob = await new Promise(function (resolve) {
        canvas.toBlob(resolve, 'image/png');
      });
      var arrayBuffer = await blob.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },

    /**
     * 构建简单的 PNG 文件
     * @private
     */
    _buildSimplePNG: function (width, height, idatData) {
      // PNG 签名
      var signature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

      // IHDR 块 (13 bytes)
      var ihdr = new Uint8Array(13);
      var view = new DataView(ihdr.buffer);
      view.setUint32(0, width);
      view.setUint32(4, height);
      ihdr[8] = 8;   // bit depth
      ihdr[9] = 6;   // color type: RGBA
      ihdr[10] = 0;  // compression
      ihdr[11] = 0;  // filter
      ihdr[12] = 0;  // interlace

      var ihdrChunk = this._createPNGChunk('IHDR', ihdr);
      var idatChunk = this._createPNGChunk('IDAT', idatData);
      var iendChunk = this._createPNGChunk('IEND', new Uint8Array(0));

      // 组合所有部分
      var totalLength = signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
      var png = new Uint8Array(totalLength);
      var offset = 0;

      png.set(signature, offset); offset += signature.length;
      png.set(ihdrChunk, offset); offset += ihdrChunk.length;
      png.set(idatChunk, offset); offset += idatChunk.length;
      png.set(iendChunk, offset);

      return png;
    },

    /**
     * 创建 PNG chunk
     * @private
     */
    _createPNGChunk: function (type, data) {
      var length = data.length;
      var chunk = new Uint8Array(12 + length);
      var view = new DataView(chunk.buffer);

      // 长度
      view.setUint32(0, length);

      // 类型
      for (var i = 0; i < 4; i++) {
        chunk[4 + i] = type.charCodeAt(i);
      }

      // 数据
      chunk.set(data, 8);

      // CRC
      var crc = this._crc32(chunk.subarray(4, 8 + length));
      view.setUint32(8 + length, crc);

      return chunk;
    },

    /**
     * 计算 CRC32
     * @private
     */
    _crc32: function (data) {
      // 懒初始化 CRC 表
      if (!this._crc32Table) {
        this._crc32Table = new Uint32Array(256);
        for (var i = 0; i < 256; i++) {
          var c = i;
          for (var k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
          }
          this._crc32Table[i] = c;
        }
      }

      var crc = -1;
      for (var i = 0; i < data.length; i++) {
        crc = this._crc32Table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
      }
      return (crc ^ -1) >>> 0;
    },

    _crc32Table: null
  };

  // 导出模块
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGABuilder;
  } else {
    global.SVGABuilder = SVGABuilder;
  }

})(typeof window !== 'undefined' ? window : this);
