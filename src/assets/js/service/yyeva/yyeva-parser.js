/**
 * ==================== YYEVA 解析器模块 (YYEVA Parser) ====================
 * 
 * 功能说明：
 * 解析 YYEVA 格式的双通道 MP4 文件，提取动态元素配置数据
 * 
 * YYEVA 数据存储位置：MP4 的 udta -> meta box
 * 数据格式：yyeffectmp4json[[Base64(zlib压缩的JSON)]]
 * 
 * 解析后的数据结构：
 * {
 *   descript: { width, height, isEffect, version, rgbFrame, alphaFrame, fps, hasAudio },
 *   effect: { "0": { effectId, effectType, effectTag, ... }, ... },
 *   datas: [{ frameIndex, data: [...] }, ...]
 * }
 * 
 * @author MeeWoo Team
 * @version 1.0.0
 * ====================================================================
 */

(function (window) {
  'use strict';

  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Services = window.MeeWoo.Services || {};

  var YYEVA_MARKER = 'yyeffectmp4json';

  function YyevaParser() {}

  YyevaParser.prototype = {
    constructor: YyevaParser,

    parse: function (file) {
      var _this = this;
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (e) {
          try {
            var buffer = new Uint8Array(e.target.result);
            var result = _this._parseBuffer(buffer);
            if (result) {
              resolve(result);
            } else {
              resolve(null);
            }
          } catch (err) {
            console.warn('YYEVA 解析失败:', err);
            resolve(null);
          }
        };
        reader.onerror = function () {
          resolve(null);
        };
        reader.readAsArrayBuffer(file);
      });
    },

    parseFromArrayBuffer: function (arrayBuffer) {
      try {
        var buffer = new Uint8Array(arrayBuffer);
        return this._parseBuffer(buffer);
      } catch (err) {
        console.warn('YYEVA 解析失败:', err);
        return null;
      }
    },

    _parseBuffer: function (buffer) {
      var markerIndex = this._findMarker(buffer);
      if (markerIndex === -1) {
        return null;
      }

      var base64Data = this._extractBase64Data(buffer, markerIndex);
      if (!base64Data) {
        return null;
      }

      var compressedData = this._base64Decode(base64Data);
      if (!compressedData) {
        return null;
      }

      var decompressedData = this._zlibDecompress(compressedData);
      if (!decompressedData) {
        return null;
      }

      var jsonStr = new TextDecoder('utf-8').decode(decompressedData);
      var jsonData = JSON.parse(jsonStr);

      if (!jsonData.descript || jsonData.descript.isEffect !== 1) {
        return null;
      }

      return {
        descript: jsonData.descript,
        effect: jsonData.effect || {},
        datas: jsonData.datas || []
      };
    },

    _findMarker: function (buffer) {
      var markerBytes = new TextEncoder().encode(YYEVA_MARKER);
      for (var i = 0; i <= buffer.length - markerBytes.length; i++) {
        var found = true;
        for (var j = 0; j < markerBytes.length; j++) {
          if (buffer[i + j] !== markerBytes[j]) {
            found = false;
            break;
          }
        }
        if (found) {
          return i;
        }
      }
      return -1;
    },

    _extractBase64Data: function (buffer, markerIndex) {
      var dataStart = markerIndex + YYEVA_MARKER.length;
      var maxLen = Math.min(buffer.length - dataStart, 50000);
      
      var str = '';
      for (var i = dataStart; i < dataStart + maxLen; i++) {
        str += String.fromCharCode(buffer[i]);
      }

      var match = str.match(/\[\[([A-Za-z0-9+/=]+)\]\]/);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    },

    _base64Decode: function (base64Str) {
      try {
        var binaryStr = atob(base64Str);
        var bytes = new Uint8Array(binaryStr.length);
        for (var i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return bytes;
      } catch (e) {
        console.warn('Base64 解码失败:', e);
        return null;
      }
    },

    _zlibDecompress: function (compressedData) {
      if (typeof pako !== 'undefined' && pako.inflate) {
        try {
          return pako.inflate(compressedData);
        } catch (e) {
          console.warn('pako zlib 解压失败:', e);
        }
      }

      if (typeof DecompressionStream !== 'undefined') {
        return this._decompressWithStream(compressedData);
      }

      console.warn('未找到 zlib 解压库 (pako)，请确保已加载');
      return null;
    },

    _decompressWithStream: async function (compressedData) {
      try {
        var ds = new DecompressionStream('deflate');
        var writer = ds.writable.getWriter();
        writer.write(compressedData);
        writer.close();

        var reader = ds.readable.getReader();
        var chunks = [];
        var totalLength = 0;

        while (true) {
          var _await$reader$read = await reader.read();
          var done = _await$reader$read.done;
          var value = _await$reader$read.value;

          if (done) break;
          chunks.push(value);
          totalLength += value.length;
        }

        var result = new Uint8Array(totalLength);
        var offset = 0;
        for (var i = 0; i < chunks.length; i++) {
          result.set(chunks[i], offset);
          offset += chunks[i].length;
        }
        return result;
      } catch (e) {
        console.warn('DecompressionStream 解压失败:', e);
        return null;
      }
    },

    getEffectByTag: function (yyevaData, effectTag) {
      if (!yyevaData || !yyevaData.effect) return null;
      for (var key in yyevaData.effect) {
        if (yyevaData.effect[key].effectTag === effectTag) {
          return {
            key: key,
            config: yyevaData.effect[key]
          };
        }
      }
      return null;
    },

    getFrameData: function (yyevaData, frameIndex) {
      if (!yyevaData || !yyevaData.datas) return null;
      for (var i = 0; i < yyevaData.datas.length; i++) {
        if (yyevaData.datas[i].frameIndex === frameIndex) {
          return yyevaData.datas[i].data;
        }
      }
      return null;
    },

    getTotalFrames: function (yyevaData) {
      if (!yyevaData || !yyevaData.datas || yyevaData.datas.length === 0) return 0;
      return yyevaData.datas[yyevaData.datas.length - 1].frameIndex + 1;
    }
  };

  window.MeeWoo.Services.YyevaParser = YyevaParser;

})(window);
