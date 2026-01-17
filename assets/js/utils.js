/**
 * ==================== 工具函数库 (Utils) ====================
 * 
 * 提供通用的工具函数，供整个应用使用
 * 所有函数都是纯函数或轻量级工具，无复杂依赖
 * 
 * 📦 包含工具清单：
 * 
 * 【文件处理】
 * - formatBytes(bytes)                  // 字节大小格式化（KB/MB）
 * - loadImageFromFile(file)             // 从File对象加载图片（Blob URL优化）
 * - revokeObjectURLs(urls)              // 批量释放Blob URL
 * 
 * 【字符串处理】
 * - extractNumberFromString(str)        // 从字符串提取数字
 * - padZero(num, length)                // 数字补零（如：1 → 001）
 * 
 * 【剪贴板操作】
 * - copyToClipboard(text)               // 复制文本到剪贴板
 * 
 * 【数组/对象处理】
 * - deepClone(obj)                      // 深度克隆对象
 * - sortFilesByName(files)              // 文件名排序
 * 
 * 【时间处理】
 * - formatDuration(seconds)             // 秒数格式化为 mm:ss
 * - getCurrentTimestamp()               // 获取当前时间戳
 * 
 * 【颜色处理】
 * - rgbToHex(r, g, b)                   // RGB转HEX
 * - hexToRgb(hex)                       // HEX转RGB
 * 
 * 【下载功能】
 * - downloadFile(blob, filename)        // 触发文件下载
 * - downloadFromDataURL(dataURL, filename) // 从DataURL下载
 * 
 * 使用示例：
 * ```javascript
 * var utils = window.SvgaUtils;
 * 
 * // 格式化文件大小
 * console.log(utils.formatBytes(1048576)); // "1.0000 MB"
 * 
 * // 加载图片
 * utils.loadImageFromFile(file).then(function(img) {
 *   console.log('图片加载完成', img);
 * });
 * 
 * // 复制到剪贴板
 * utils.copyToClipboard('复制的文本');
 * ```
 * 
 * @author SVGA Preview Team
 * @version 1.0.0
 * ====================================================================
 */

(function (window) {
    'use strict';

    // Define root namespace
    window.SvgaPreview = window.SvgaPreview || {};

    var SvgaUtils = {};

    /* ==================== 文件处理 ==================== */

    /**
     * 格式化字节大小
     * 将字节数转换为可读的 KB 或 MB 格式
     * 
     * @param {number} bytes - 字节数
     * @returns {string} - 格式化后的字符串（如 "1.5 KB" 或 "2.3456 MB"）
     * 
     * @example
     * formatBytes(1024)      // "1.00 KB"
     * formatBytes(1048576)   // "1.0000 MB"
     * formatBytes(0)         // "0.00 KB"
     */
    SvgaUtils.formatBytes = function (bytes) {
        if (!bytes && bytes !== 0) return '';
        var kb = bytes / 1024;
        if (kb < 1024) return kb.toFixed(2) + ' KB';
        var mb = kb / 1024;
        return mb.toFixed(4) + ' MB';
    };

    /**
     * 从File对象加载图片
     * 性能优化：使用 Blob URL 替代 Base64 Data URL
     *   - Base64 会增加约 33% 内存占用，且需要 CPU 编码/解码
     *   - Blob URL 直接引用文件数据，速度快 2-3 倍，内存省 33%
     * 
     * @param {File} file - 图片文件对象
     * @param {Array} blobUrlsArray - （可选）存储Blob URL的数组，用于后续释放
     * @returns {Promise<Image>} - 返回加载完成的Image对象
     * 
     * @example
     * var blobUrls = [];
     * loadImageFromFile(file, blobUrls).then(function(img) {
     *   console.log('图片加载完成', img.width, img.height);
     * });
     * // 使用完毕后释放
     * revokeObjectURLs(blobUrls);
     */
    SvgaUtils.loadImageFromFile = function (file, blobUrlsArray) {
        return new Promise(function (resolve, reject) {
            // 创建 Blob URL（轻量级，不占用额外内存）
            var blobUrl = URL.createObjectURL(file);

            // 记录 Blob URL 以便后续释放内存
            if (blobUrlsArray && Array.isArray(blobUrlsArray)) {
                blobUrlsArray.push(blobUrl);
            }

            var img = new Image();
            img.onload = function () {
                resolve(img);
            };
            img.onerror = function () {
                // 加载失败时释放 Blob URL
                URL.revokeObjectURL(blobUrl);
                reject(new Error('图片加载失败'));
            };
            img.src = blobUrl;
        });
    };

    /**
     * 批量释放Blob URL
     * 防止内存泄漏，使用完Blob URL后必须调用此方法
     * 
     * @param {Array<string>} urls - Blob URL数组
     * 
     * @example
     * var blobUrls = ['blob:http://...', 'blob:http://...'];
     * revokeObjectURLs(blobUrls);
     */
    SvgaUtils.revokeObjectURLs = function (urls) {
        if (!urls || !Array.isArray(urls)) return;

        for (var i = 0; i < urls.length; i++) {
            if (urls[i]) {
                URL.revokeObjectURL(urls[i]);
            }
        }
    };

    /* ==================== 字符串处理 ==================== */

    /**
     * 从字符串中提取数字
     * 
     * @param {string} str - 输入字符串
     * @returns {number|null} - 提取的数字，失败返回null
     * 
     * @example
     * extractNumberFromString('frame123')  // 123
     * extractNumberFromString('test')      // null
     */
    SvgaUtils.extractNumberFromString = function (str) {
        if (!str) return null;
        var match = str.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
    };

    /**
     * 数字补零
     * 
     * @param {number} num - 数字
     * @param {number} length - 补零后的长度
     * @returns {string} - 补零后的字符串
     * 
     * @example
     * padZero(1, 3)    // "001"
     * padZero(42, 5)   // "00042"
     */
    SvgaUtils.padZero = function (num, length) {
        var str = num.toString();
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    };

    /* ==================== 剪贴板操作 ==================== */

    /**
     * 复制文本到剪贴板
     * 优先使用现代 Clipboard API，降级到 execCommand
     * 
     * @param {string} text - 要复制的文本
     * @returns {Promise<void>}
     * 
     * @example
     * copyToClipboard('复制的内容').then(function() {
     *   console.log('复制成功');
     * });
     */
    SvgaUtils.copyToClipboard = function (text) {
        return new Promise(function (resolve, reject) {
            // 使用 Clipboard API 复制文本
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(resolve)
                    .catch(reject);
            } else {
                // 降级方案：使用 textarea + execCommand
                var textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();

                try {
                    var success = document.execCommand('copy');
                    document.body.removeChild(textarea);
                    if (success) {
                        resolve();
                    } else {
                        reject(new Error('复制失败'));
                    }
                } catch (err) {
                    document.body.removeChild(textarea);
                    reject(err);
                }
            }
        });
    };

    /* ==================== 数组/对象处理 ==================== */

    /**
     * 深度克隆对象（简单实现，不支持循环引用）
     * 
     * @param {*} obj - 要克隆的对象
     * @returns {*} - 克隆后的对象
     * 
     * @example
     * var cloned = deepClone({a: 1, b: {c: 2}});
     */
    SvgaUtils.deepClone = function (obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            var arrCopy = [];
            for (var i = 0; i < obj.length; i++) {
                arrCopy[i] = SvgaUtils.deepClone(obj[i]);
            }
            return arrCopy;
        }

        if (obj instanceof Object) {
            var objCopy = {};
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    objCopy[key] = SvgaUtils.deepClone(obj[key]);
                }
            }
            return objCopy;
        }

        throw new Error('Unable to copy obj! Its type isn\'t supported.');
    };

    /**
     * 文件名排序（按文件名中的数字排序）
     * 
     * @param {Array<File>} files - 文件数组
     * @returns {Array<File>} - 排序后的文件数组
     * 
     * @example
     * sortFilesByName([frame10.png, frame2.png, frame1.png])
     * // [frame1.png, frame2.png, frame10.png]
     */
    SvgaUtils.sortFilesByName = function (files) {
        return files.slice().sort(function (a, b) {
            var aNum = SvgaUtils.extractNumberFromString(a.name) || 0;
            var bNum = SvgaUtils.extractNumberFromString(b.name) || 0;

            if (aNum !== bNum) {
                return aNum - bNum;
            }

            // 数字相同时按文件名字母顺序
            return a.name.localeCompare(b.name);
        });
    };

    /* ==================== 时间处理 ==================== */

    /**
     * 格式化时长（秒 → mm:ss 或 hh:mm:ss）
     * 
     * @param {number} seconds - 秒数
     * @param {boolean} showHours - 是否显示小时（可选，默认自动判断）
     * @returns {string} - 格式化后的时间字符串
     * 
     * @example
     * formatDuration(65)     // "01:05"
     * formatDuration(3661)   // "01:01:01"
     */
    SvgaUtils.formatDuration = function (seconds, showHours) {
        if (!seconds && seconds !== 0) return '00:00';

        var h = Math.floor(seconds / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor(seconds % 60);

        var needsHours = showHours || h > 0;

        if (needsHours) {
            return SvgaUtils.padZero(h, 2) + ':' +
                SvgaUtils.padZero(m, 2) + ':' +
                SvgaUtils.padZero(s, 2);
        } else {
            return SvgaUtils.padZero(m, 2) + ':' +
                SvgaUtils.padZero(s, 2);
        }
    };

    /**
     * 获取当前时间戳（毫秒）
     * 
     * @returns {number} - 时间戳
     * 
     * @example
     * var timestamp = getCurrentTimestamp();
     */
    SvgaUtils.getCurrentTimestamp = function () {
        return Date.now();
    };

    /* ==================== 颜色处理 ==================== */

    /**
     * RGB转HEX颜色
     * 
     * @param {number} r - 红色值 (0-255)
     * @param {number} g - 绿色值 (0-255)
     * @param {number} b - 蓝色值 (0-255)
     * @returns {string} - HEX颜色（如 "#FF0000"）
     * 
     * @example
     * rgbToHex(255, 0, 0)  // "#FF0000"
     */
    SvgaUtils.rgbToHex = function (r, g, b) {
        var toHex = function (c) {
            var hex = c.toString(16).toUpperCase();
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    };

    /**
     * HEX转RGB颜色
     * 
     * @param {string} hex - HEX颜色（如 "#FF0000" 或 "FF0000"）
     * @returns {Object|null} - RGB对象 {r, g, b} 或 null
     * 
     * @example
     * hexToRgb("#FF0000")  // {r: 255, g: 0, b: 0}
     */
    SvgaUtils.hexToRgb = function (hex) {
        // 移除 # 符号
        hex = hex.replace(/^#/, '');

        // 支持简写形式 (#F00 → #FF0000)
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        if (hex.length !== 6) {
            return null;
        }

        var r = parseInt(hex.substr(0, 2), 16);
        var g = parseInt(hex.substr(2, 2), 16);
        var b = parseInt(hex.substr(4, 2), 16);

        return { r: r, g: g, b: b };
    };

    /* ==================== 下载功能 ==================== */

    /**
     * 触发文件下载
     * 
     * @param {Blob} blob - 文件Blob对象
     * @param {string} filename - 文件名
     * 
     * @example
     * downloadFile(blob, 'animation.gif');
     */
    SvgaUtils.downloadFile = function (blob, filename) {
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 延迟释放URL，确保下载开始
        setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 100);
    };

    /**
     * 从DataURL下载文件
     * 
     * @param {string} dataURL - Data URL
     * @param {string} filename - 文件名
     * 
     * @example
     * downloadFromDataURL('data:image/png;base64,...', 'image.png');
     */
    SvgaUtils.downloadFromDataURL = function (dataURL, filename) {
        var link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /* ==================== 其他工具 ==================== */

    /**
     * 防抖函数
     * 
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} - 防抖后的函数
     * 
     * @example
     * var debouncedFn = debounce(function() {
     *   console.log('执行');
     * }, 300);
     */
    SvgaUtils.debounce = function (func, wait) {
        var timeout;
        return function () {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    };

    /**
     * 节流函数
     * 
     * @param {Function} func - 要节流的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} - 节流后的函数
     * 
     * @example
     * var throttledFn = throttle(function() {
     *   console.log('执行');
     * }, 300);
     */
    SvgaUtils.throttle = function (func, wait) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    var later = function () {
        previous = Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
    };
    return function () {
        var now = Date.now();
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        } else if (!timeout) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
};

    /**
     * 判断是否为移动设备
     * 
     * @returns {boolean}
     */
    SvgaUtils.isMobile = function () {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    /**
     * 生成随机ID
     * 
     * @param {number} length - ID长度（默认8）
     * @returns {string} - 随机ID
     * 
     * @example
     * generateId()     // "a3f9d2e1"
     * generateId(16)   // "a3f9d2e1b4c8a7f6"
     */
    SvgaUtils.generateId = function (length) {
        length = length || 8;
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var id = '';
        for (var i = 0; i < length; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    };

    /* ==================== UI 工具 ==================== */

    /**
     * 显示全局 Toast 提示
     * @param {string} message 提示内容
     * @param {number} duration 显示时长(ms)，默认3000
     */
    SvgaUtils.showToast = function (message, duration) {
        duration = duration || 3000;
        
        // 查找或创建容器
        var container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            var msgDiv = document.createElement('div');
            msgDiv.className = 'toast-message';
            container.appendChild(msgDiv);
            document.body.appendChild(container);
        }
        
        var msgElement = container.querySelector('.toast-message');
        if (msgElement) {
            msgElement.textContent = message;
        }
        
        // 清除之前的定时器
        if (container.hideTimer) {
            clearTimeout(container.hideTimer);
        }
        
        // 显示 (使用 requestAnimationFrame 确保 transition 生效)
        requestAnimationFrame(function() {
            container.classList.add('visible');
        });

        // 设置隐藏定时器
        container.hideTimer = setTimeout(function () {
            container.classList.remove('visible');
        }, duration);
    };

    // 导出到全局命名空间
    window.SvgaPreview.Utils = SvgaUtils;

})(window);
