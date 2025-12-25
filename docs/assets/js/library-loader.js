/**
 * 库加载管理器 - Library Loader
 * 统一管理所有外部库的动态加载，支持优先级队列和进度显示
 */
(function(window) {
  'use strict';

  /**
   * 库配置表
   * 包含所有需要动态加载的外部库的配置信息
   */
  var LIBRARY_CONFIG = {
    'vue': {
      name: 'Vue.js',
      url: 'https://cdn.jsdelivr.net/npm/vue@2.7.14/dist/vue.min.js',
      checkFn: function() { return typeof Vue !== 'undefined'; },
      priority: 0 // 最高优先级
    },
    'svgaplayer': {
      name: 'SVGA Player',
      url: 'https://cdn.jsdelivr.net/npm/svgaplayerweb@2.3.1/build/svga.min.js',
      checkFn: function() { return typeof SVGA !== 'undefined' && SVGA.Player; },
      priority: 1
    },
    'lottie': {
      name: 'Lottie',
      url: 'https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js',
      checkFn: function() { return typeof lottie !== 'undefined'; },
      priority: 5
    },
    'howler': {
      name: 'Howler.js',
      url: 'https://cdn.jsdelivr.net/npm/howler@2.2.3/dist/howler.min.js',
      checkFn: function() { return typeof Howl !== 'undefined'; },
      priority: 6
    },
    'marked': {
      name: 'Marked',
      url: 'https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js',
      checkFn: function() { return typeof marked !== 'undefined'; },
      priority: 20
    },
    'gif': {
      name: 'GIF.js',
      url: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js',
      checkFn: function() { return typeof GIF !== 'undefined'; },
      priority: 15
    },
    'protobuf': {
      name: 'Protobuf.js',
      url: 'https://cdn.jsdelivr.net/npm/protobufjs@7.2.5/dist/protobuf.min.js',
      checkFn: function() { return typeof protobuf !== 'undefined'; },
      priority: 25
    },
    'pako': {
      name: 'Pako',
      url: 'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js',
      checkFn: function() { return typeof pako !== 'undefined'; },
      priority: 25
    },
    'svgaweb': {
      name: 'SVGA-Web',
      url: 'https://cdn.jsdelivr.net/npm/svga-web@2.4.2/svga-web.min.js',
      checkFn: function() { return typeof SVGA !== 'undefined' && SVGA.Downloader; },
      priority: 25
    },
    'ffmpeg': {
      name: 'FFmpeg',
      url: 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js',
      checkFn: function() { return typeof FFmpeg !== 'undefined'; },
      priority: 30
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
  LibraryLoader.prototype.onProgress = function(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  };

  /**
   * 触发进度更新
   */
  LibraryLoader.prototype.notifyProgress = function() {
    var currentLib = this.currentLib;
    this.listeners.forEach(function(callback) {
      try {
        callback(currentLib);
      } catch (e) {
        console.error('进度监听器错误:', e);
      }
    });
  };

  /**
   * 加载单个库
   * @param {string} libKey - 库的键名
   * @param {boolean} highPriority - 是否高优先级
   * @returns {Promise}
   */
  LibraryLoader.prototype.loadSingleLibrary = function(libKey, highPriority) {
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
    
    return new Promise(function(resolve, reject) {
      _this.currentLib = {
        name: config.name,
        url: config.url,
        progress: 0
      };
      _this.notifyProgress();
      
      var script = document.createElement('script');
      script.src = config.url;
      
      script.onload = function() {
        _this.currentLib.progress = 50;
        _this.notifyProgress();
        
        // 等待全局变量可用
        var maxWait = 30;
        var check = function() {
          if (!config.checkFn || config.checkFn()) {
            _this.currentLib.progress = 100;
            _this.notifyProgress();
            
            setTimeout(function() {
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
      
      script.onerror = function() {
        _this.currentLib = null;
        _this.notifyProgress();
        reject(new Error('加载失败: ' + config.url));
      };
      
      document.head.appendChild(script);
    });
  };

  /**
   * 加载库（统一入口）
   * @param {string|Array<string>} libKeys - 库的键名或键名数组
   * @param {boolean} highPriority - 是否高优先级
   * @returns {Promise}
   */
  LibraryLoader.prototype.load = function(libKeys, highPriority) {
    var _this = this;
    if (typeof libKeys === 'string') {
      libKeys = [libKeys];
    }
    
    return new Promise(function(resolve, reject) {
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
  LibraryLoader.prototype.processQueue = function() {
    var _this = this;
    
    // 如果正在加载，不重复处理
    if (this.loading || this.queue.length === 0) {
      return;
    }
    
    this.loading = true;
    
    // 按优先级排序
    this.queue.sort(function(a, b) {
      return a.priority - b.priority;
    });
    
    var task = this.queue.shift();
    
    // 顺序加载所有库
    var loadChain = Promise.resolve();
    
    task.libs.forEach(function(libKey) {
      loadChain = loadChain.then(function() {
        return _this.loadSingleLibrary(libKey, task.priority === 0);
      });
    });
    
    loadChain
      .then(function() {
        task.resolve();
        _this.loading = false;
        _this.processQueue(); // 继续处理队列
      })
      .catch(function(error) {
        console.error('库加载失败:', error);
        task.reject(error);
        _this.loading = false;
        _this.processQueue(); // 继续处理队列
      });
  };

  /**
   * 预加载非关键库
   */
  LibraryLoader.prototype.preload = function() {
    // Lottie 和 Howler 是次要功能，优先级较低
    this.load(['lottie', 'howler'], false)
      .then(function() {
        console.log('Lottie 和 Howler 加载完成');
      })
      .catch(function(error) {
        console.warn('部分库加载失败:', error);
      });
  };

  /**
   * 检查库是否已加载
   * @param {string} libKey - 库的键名
   * @returns {boolean}
   */
  LibraryLoader.prototype.isLoaded = function(libKey) {
    var config = LIBRARY_CONFIG[libKey];
    if (!config) return false;
    return this.loadedLibs[libKey] || (config.checkFn && config.checkFn());
  };

  /**
   * 获取库配置
   * @param {string} libKey - 库的键名（可选）
   * @returns {Object}
   */
  LibraryLoader.prototype.getConfig = function(libKey) {
    return libKey ? LIBRARY_CONFIG[libKey] : LIBRARY_CONFIG;
  };

  // 暴露到全局
  window.LibraryLoader = LibraryLoader;

  // 创建全局单例
  window.libraryLoader = new LibraryLoader();

})(window);
