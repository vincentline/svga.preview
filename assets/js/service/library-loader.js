/**
 * 库加载管理器 - Library Loader
 * 统一管理所有外部库的动态加载，支持优先级队列和进度显示
 * 
 * ==================== 工作原理 ====================
 * 
 * 1. 【预加载阶段】页面启动时自动预加载所有库（低优先级，后台执行）
 *    - 在 app.js mounted() 中调用 preloadLibraries()
 *    - 按照 priority 值从小到大依次加载（vue=0 最先，ffmpeg=30 最后）
 *    - disabled:true 的库会被跳过（如 svgaweb）
 * 
 * 2. 【插队加载阶段】用户打开功能时按需加载（高优先级，立即执行）
 *    - 调用 load(libs, highPriority=true) 时会插队到队列最前面
 *    - 例如：打开转SVGA弹窗时，protobuf/pako 会立即插队加载
 *    - 插队任务会中断当前预加载，优先执行，完成后继续预加载
 * 
 * 3. 【加载队列机制】
 *    - queue: 所有待加载任务的队列 [{libs, priority, resolve, reject}]
 *    - highPriority=true → priority=0 → unshift() 插到队列最前面
 *    - highPriority=false → priority=10 → push() 追加到队列末尾
 *    - 每次 processQueue() 会对队列按 priority 排序，优先级高的先执行
 * 
 * 4. 【进度通知机制】
 *    - currentLib: 当前正在加载的库 {name, url, progress}
 *    - listeners: 进度监听器数组，通过 onProgress(callback) 注册
 *    - 加载过程中会实时更新 progress（0→50→100），触发所有监听器
 * 
 * 5. 【容错降级】
 *    - 如果库已加载（checkFn()=true），直接跳过
 *    - 加载失败不会阻塞其他库，继续处理队列
 *    - 实际使用时（如 svga-builder.js）会检测库是否存在，不存在则降级
 * 
 * ==================== 使用示例 ====================
 * 
 * // 页面启动：预加载所有库（低优先级）
 * window.libraryLoader.preloadLibraries();
 * 
 * // 用户操作：插队加载必需库（高优先级）
 * window.libraryLoader.load(['protobuf', 'pako'], true);
 * 
 * // 监听加载进度
 * window.libraryLoader.onProgress(function(currentLib) {
 *   if (currentLib) {
 *     console.log(currentLib.name, currentLib.progress);
 *   }
 * });
 */
(function (window) {
  'use strict';

  // Ensure namespace
  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Core = window.MeeWoo.Core || {};

  /**
   * 库配置表
   * 包含所有需要动态加载的外部库的配置信息
   * 
   * 配置说明：
   * - name: 库的显示名称（用于进度提示）
   * - url: CDN 地址
   * - checkFn: 检测库是否已加载的函数（返回 true 表示已加载）
   * - priority: 预加载优先级（数字越小越优先，0 最高）
   * - disabled: 是否禁用预加载（可选，true 则跳过）
   * - fallbackUrls: 备用 CDN 地址列表（可选）
   * 
   * 重要：添加或修改 CDN 地址时，必须同步更新 coi-serviceworker.js 中的 CDN 白名单！
   * 当前白名单包括：jsdelivr.net, unpkg.com, cdnjs.cloudflare.com
   */
  var LIBRARY_CONFIG = {
    'vue': {
      name: 'Vue.js',
      url: 'assets/js/lib/vue.min.js',
      fallbackUrls: [
        'https://cdn.jsdelivr.net/npm/vue@2.7.14/dist/vue.min.js',
        'https://unpkg.com/vue@2.7.14/dist/vue.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/vue/2.7.14/vue.min.js'
      ],
      checkFn: function () { return typeof Vue !== 'undefined'; },
      priority: 0 // 最高优先级
    },
    'oxipng': {
      name: 'oxipng',
      url: 'assets/js/service/oxipng/codec/pkg/squoosh_oxipng_bg.wasm',
      checkFn: function () {
        // 检查 ImageCompressionService 是否已初始化且 oxipng 模块可用
        return typeof window.MeeWoo !== 'undefined' &&
          typeof window.MeeWoo.Services !== 'undefined' &&
          typeof window.MeeWoo.Services.ImageCompressionService !== 'undefined' &&
          window.MeeWoo.Services.ImageCompressionService.isOxipngReady();
      },
      priority: 25,
      disabled: true // 禁用自动预加载，由 image-compression-service 手动处理
    },
    'svgaplayer': {
      name: 'SVGA Player',
      url: 'assets/js/lib/svga.min.js',
      fallbackUrls: [
        'https://cdn.jsdelivr.net/npm/svgaplayerweb@2.3.1/build/svga.min.js',
        'https://unpkg.com/svgaplayerweb@2.3.1/build/svga.min.js'
      ],
      checkFn: function () { return typeof SVGA !== 'undefined' && SVGA.Player; },
      priority: 1
    },
    'lottie': {
      name: 'Lottie',
      url: 'assets/js/lib/lottie.min.js',
      fallbackUrls: [
        'https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js',
        'https://unpkg.com/lottie-web@5.12.2/build/player/lottie.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'
      ],
      checkFn: function () { return typeof lottie !== 'undefined'; },
      priority: 5
    },
    'howler': {
      name: 'Howler.js',
      url: 'assets/js/lib/howler.min.js',
      fallbackUrls: [
        'https://cdn.jsdelivr.net/npm/howler@2.2.3/dist/howler.min.js'
      ],
      checkFn: function () { return typeof Howl !== 'undefined'; },
      priority: 6
    },
    'marked': {
      name: 'Marked',
      url: 'assets/js/lib/marked.min.js',
      fallbackUrls: [
        'https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js'
      ],
      checkFn: function () { return typeof marked !== 'undefined'; },
      priority: 20
    },
    'gif': {
      name: 'GIF.js',
      url: 'assets/js/lib/gif.js',
      fallbackUrls: [
        'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js'
      ],
      checkFn: function () { return typeof GIF !== 'undefined'; },
      priority: 15
    },
    'protobuf': {
      name: 'Protobuf.js',
      url: 'assets/js/lib/protobuf.min.js',
      fallbackUrls: [
        'https://cdn.jsdelivr.net/npm/protobufjs@7.2.5/dist/protobuf.min.js'
      ],
      checkFn: function () { return typeof protobuf !== 'undefined'; },
      priority: 25
    },
    'pako': {
      name: 'Pako',
      url: 'assets/js/lib/pako.min.js',
      fallbackUrls: [
        'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js'
      ],
      checkFn: function () { return typeof pako !== 'undefined'; },
      priority: 25
    },
    'jszip': {
      name: 'JSZip',
      url: 'assets/js/lib/jszip.min.js',
      fallbackUrls: [
        'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
      ],
      checkFn: function () { return typeof JSZip !== 'undefined'; },
      priority: 25
    },
    'pngquant': {
      name: 'PNG Compressor (Pako)',
      url: 'assets/js/lib/pako.min.js',
      fallbackUrls: [
        'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js',
        'https://unpkg.com/pako@2.1.0/dist/pako.min.js',
        'https://cdn.jsdelivr.net/npm/pako@2.0.4/dist/pako.min.js',
        'https://unpkg.com/pako@2.0.4/dist/pako.min.js'
      ],
      checkFn: function () {
        return typeof pako !== 'undefined';
      },
      priority: 26,
      disabled: true  // 2026-01-02: 不再用于PNG压缩，已由pako库替代
    },
    'svgaweb': {
      name: 'SVGA-Web',
      url: 'https://cdn.jsdelivr.net/npm/svga-web@2.4.2/svga-web.min.js',
      checkFn: function () { return typeof SVGA !== 'undefined' && SVGA.Downloader; },
      priority: 25,
      disabled: true  // 禁用这个库，不预加载
    },
    'ffmpeg': {
      name: 'FFmpeg',
      url: 'assets/js/lib/ffmpeg.min.js',
      fallbackUrls: [
        'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js',
        'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/ffmpeg/0.11.6/ffmpeg.min.js'
      ],
      checkFn: function () { return typeof FFmpeg !== 'undefined'; },
      priority: 30
    },
    'html2canvas': {
      name: 'html2canvas',
      url: 'assets/js/lib/html2canvas.min.js',
      fallbackUrls: [
        'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
      ],
      checkFn: function () { return typeof html2canvas !== 'undefined'; },
      priority: 25
    }
  };

  /**
   * LibraryLoader 类
   */
  function LibraryLoader() {
    this.queue = [];           // 加载队列
    this.loading = false;      // 是否正在加载
    this.currentLib = null;    // 当前加载的库 { name, url, progress }
    this.loadedLibs = {};      // 已加载的库 { libName: true }
    this.listeners = [];       // 进度监听器
  }

  /**
   * 添加进度监听器
   * @param {Function} callback - 回调函数 (currentLib) => void
   */
  LibraryLoader.prototype.onProgress = function (callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  };

  /**
   * 触发进度更新
   */
  LibraryLoader.prototype.notifyProgress = function () {
    var currentLib = this.currentLib;
    this.listeners.forEach(function (callback) {
      try {
        callback(currentLib);
      } catch (e) {
        console.error('进度监听器错误:', e);
      }
    });
  };

  /**
   * 加载单个库（支持备用URL自动重试）
   * @param {string} libKey - 库的键名
   * @param {boolean} highPriority - 是否高优先级
   * @returns {Promise}
   */
  LibraryLoader.prototype.loadSingleLibrary = function (libKey, highPriority) {
    var _this = this;
    var config = LIBRARY_CONFIG[libKey];

    if (!config) {
      return Promise.reject(new Error('未知的库: ' + libKey));
    }

    // 如果已加载，直接返回
    if (this.loadedLibs[libKey] || (config.checkFn && config.checkFn())) {
      this.loadedLibs[libKey] = true;
      return Promise.resolve();
    }

    // 构建URL列表：主URL + 备用URLs
    var urls = [config.url];
    if (config.fallbackUrls && config.fallbackUrls.length > 0) {
      urls = urls.concat(config.fallbackUrls);
    }

    // 尝试加载每个URL，直到成功
    var tryLoadUrl = function (urlIndex) {
      if (urlIndex >= urls.length) {
        // 所有URL都失败
        return Promise.reject(new Error('所有CDN都加载失败: ' + libKey));
      }

      var currentUrl = urls[urlIndex];

      // 支持动态 import 加载（用于 ES Module）
      if (config.loadMethod === 'import') {
        return new Promise(function (resolve, reject) {
          _this.currentLib = {
            name: config.name,
            url: currentUrl,
            progress: 0
          };
          _this.notifyProgress();

          import(currentUrl)
            .then(function (module) {
              // 将模块存储到 SvgaPreview 命名空间
              window.MeeWoo.Core.oxipngModule = module;

              _this.currentLib.progress = 50;
              _this.notifyProgress();

              // 等待检查
              var maxWait = 30;
              var check = function () {
                if (!config.checkFn || config.checkFn()) {
                  _this.currentLib.progress = 100;
                  _this.notifyProgress();

                  setTimeout(function () {
                    _this.currentLib = null;
                    _this.loadedLibs[libKey] = true;
                    _this.notifyProgress();
                    resolve();
                  }, 300);
                } else if (maxWait-- > 0) {
                  var progress = 50 + (30 - maxWait) * 1.5;
                  _this.currentLib.progress = Math.min(99, Math.round(progress));
                  _this.notifyProgress();
                  setTimeout(check, 100);
                } else {
                  _this.currentLib = null;
                  _this.notifyProgress();
                  reject(new Error('库加载超时: ' + libKey));
                }
              };
              check();
            })
            .catch(function (error) {
              _this.currentLib = null;
              _this.notifyProgress();
              console.warn('CDN加载失败: ' + currentUrl);
              reject(error);
            });
        }).catch(function (error) {
          console.log('尝试备用CDN (' + (urlIndex + 2) + '/' + urls.length + ')...');
          return tryLoadUrl(urlIndex + 1);
        });
      }

      // 传统 <script> 加载

      return new Promise(function (resolve, reject) {
        _this.currentLib = {
          name: config.name,
          url: currentUrl,
          progress: 0
        };
        _this.notifyProgress();

        var script = document.createElement('script');
        script.src = currentUrl;

        script.onload = function () {
          _this.currentLib.progress = 50;
          _this.notifyProgress();

          // 等待全局变量可用
          var maxWait = 30;
          var check = function () {
            if (!config.checkFn || config.checkFn()) {
              _this.currentLib.progress = 100;
              _this.notifyProgress();

              setTimeout(function () {
                _this.currentLib = null;
                _this.loadedLibs[libKey] = true;
                _this.notifyProgress();
                resolve();
              }, 300); // 显示100%后稍等
            } else if (maxWait-- > 0) {
              var progress = 50 + (30 - maxWait) * 1.5;
              _this.currentLib.progress = Math.min(99, Math.round(progress));
              _this.notifyProgress();
              setTimeout(check, 100);
            } else {
              _this.currentLib = null;
              _this.notifyProgress();
              reject(new Error('库加载超时: ' + libKey));
            }
          };
          check();
        };

        script.onerror = function () {
          _this.currentLib = null;
          _this.notifyProgress();
          console.warn('CDN加载失败: ' + currentUrl);
          reject(new Error('加载失败: ' + currentUrl));
        };

        document.head.appendChild(script);
      }).catch(function (error) {
        // 当前URL失败，尝试下一个
        console.log('尝试备用CDN (' + (urlIndex + 2) + '/' + urls.length + ')...');
        return tryLoadUrl(urlIndex + 1);
      });
    };

    return tryLoadUrl(0);
  };

  /**
   * 加载库（统一入口）
   * @param {string|Array<string>} libKeys - 库的键名或键名数组
   * @param {boolean} highPriority - 是否高优先级
   * @returns {Promise}
   * 
   * 工作机制：
   * 1. highPriority=true：插队加载（priority=0，unshift 插到队列最前面）
   *    - 用于用户主动触发的功能，需要立即加载库
   *    - 例：app.js 中打开转SVGA弹窗时调用 loadLibrary(['protobuf', 'pako'], true)
   * 
   * 2. highPriority=false：预加载（priority=10，push 追加到队列末尾）
   *    - 用于页面启动时的预加载，在后台慢慢加载
   *    - 例：app.js mounted() 中调用 preloadLibraries()
   * 
   * 3. 队列排序：每次 processQueue() 会按 priority 排序，插队任务一定优先
   */
  LibraryLoader.prototype.load = function (libKeys, highPriority) {
    var _this = this;
    if (typeof libKeys === 'string') {
      libKeys = [libKeys];
    }

    return new Promise(function (resolve, reject) {
      var loadTask = {
        libs: libKeys,
        priority: highPriority ? 0 : 10,
        resolve: resolve,
        reject: reject
      };

      // 高优先级插队到队列最前面
      if (highPriority) {
        _this.queue.unshift(loadTask);
      } else {
        _this.queue.push(loadTask);
      }

      _this.processQueue();
    });
  };

  /**
   * 处理加载队列
   */
  LibraryLoader.prototype.processQueue = function () {
    var _this = this;

    // 如果正在加载，不重复处理
    if (this.loading || this.queue.length === 0) {
      return;
    }

    this.loading = true;

    // 按优先级排序
    this.queue.sort(function (a, b) {
      return a.priority - b.priority;
    });

    var task = this.queue.shift();

    // 顺序加载所有库
    var loadChain = Promise.resolve();

    task.libs.forEach(function (libKey) {
      loadChain = loadChain.then(function () {
        return _this.loadSingleLibrary(libKey, task.priority === 0);
      });
    });

    loadChain
      .then(function () {
        task.resolve();
        _this.loading = false;
        _this.processQueue(); // 继续处理队列
      })
      .catch(function (error) {
        console.error('库加载失败:', error);
        task.reject(error);
        _this.loading = false;
        _this.processQueue(); // 继续处理队列
      });
  };

  /**
   * 预加载所有非关键库（空闲时按优先级排队加载）
   */
  LibraryLoader.prototype.preload = function () {
    var _this = this;

    // 获取所有库并按优先级排序
    var allLibs = Object.keys(LIBRARY_CONFIG)
      .map(function (key) {
        return { key: key, priority: LIBRARY_CONFIG[key].priority };
      })
      .sort(function (a, b) {
        return a.priority - b.priority;
      });

    // 排除已加载的库和禁用的库
    var toLoad = allLibs.filter(function (lib) {
      var config = LIBRARY_CONFIG[lib.key];
      return !_this.isLoaded(lib.key) && !config.disabled;
    }).map(function (lib) {
      return lib.key;
    });

    if (toLoad.length === 0) {
      return;
    }

    // 延迟1秒后开始预加载，避免影响首屏渲染
    setTimeout(function () {
      // 逐个加载（低优先级）
      toLoad.forEach(function (libKey) {
        _this.load(libKey, false).catch(function (error) {
          console.warn('库预加载失败:', libKey, error);
        });
      });
    }, 1000);
  };

  /**
   * 检查库是否已加载
   * @param {string} libKey - 库的键名
   * @returns {boolean}
   */
  LibraryLoader.prototype.isLoaded = function (libKey) {
    var config = LIBRARY_CONFIG[libKey];
    if (!config) return false;
    return this.loadedLibs[libKey] || (config.checkFn && config.checkFn());
  };

  /**
   * 获取库配置
   * @param {string} libKey - 库的键名（可选）
   * @returns {Object}
   */
  LibraryLoader.prototype.getConfig = function (libKey) {
    return libKey ? LIBRARY_CONFIG[libKey] : LIBRARY_CONFIG;
  };

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  // 暴露到全局命名空间
  window.MeeWoo.Core.LibraryLoader = LibraryLoader;

  // 创建全局单例
  window.MeeWoo.Core.libraryLoader = new LibraryLoader();

})(window);
