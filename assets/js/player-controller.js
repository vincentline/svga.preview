/**
 * 播放控制器模块
 * 封装多模式统一的播放控制逻辑（播放/暂停、进度跳转、拖拽滑块、静音控制）
 * 使用适配器模式统一不同播放器的接口，避免重复的if-else判断
 * 
 * 使用方式：
 * var controller = new PlayerController({
 *   onProgressChange: function(progress, currentFrame) {},
 *   onPlayStateChange: function(isPlaying) {},
 *   getPlayerState: function() { return { mode, hasFile, player, video, totalFrames, ... } }
 * });
 * 
 * controller.togglePlay();
 * controller.seekTo(0.5); // 0-1
 * controller.setMuted(true);
 * controller.destroy();
 */

(function(global) {
  'use strict';

  // ==================== 播放器适配器基类 ====================
  
  /**
   * 播放器适配器基类 - 定义统一接口
   */
  function PlayerAdapter(state) {
    this.state = state;
  }
  
  PlayerAdapter.prototype = {
    // 播放
    play: function() { throw new Error('子类必须实现 play'); },
    // 暂停
    pause: function() { throw new Error('子类必须实现 pause'); },
    // 跳转到指定进度（0-1）
    seekTo: function(percentage) { throw new Error('子类必须实现 seekTo'); },
    // 设置静音
    setMuted: function(muted) { throw new Error('子类必须实现 setMuted'); },
    // 检查是否可用
    canHandle: function() { return this.state.hasFile; },
    // 进度转换（用于变速等特殊场景）
    transformPercentage: function(p) { return p; }
  };

  // 自动检测并初始化 GlobalAudioManager
  var checkHowl = setInterval(function() {
    if (typeof Howl !== 'undefined') {
      GlobalAudioManager.init();
      clearInterval(checkHowl);
    }
  }, 200);
  
  // ==================== Lottie 播放器适配器 ====================
  
  function LottiePlayerAdapter(state) {
    PlayerAdapter.call(this, state);
  }
  
  LottiePlayerAdapter.prototype = Object.create(PlayerAdapter.prototype);
  LottiePlayerAdapter.prototype.constructor = LottiePlayerAdapter;
  
  LottiePlayerAdapter.prototype.canHandle = function() {
    return this.state.hasFile && this.state.lottiePlayer;
  };
  
  LottiePlayerAdapter.prototype.play = function() {
    this.state.lottiePlayer.play();
  };
  
  LottiePlayerAdapter.prototype.pause = function() {
    this.state.lottiePlayer.pause();
  };
  
  LottiePlayerAdapter.prototype.seekTo = function(percentage) {
    // 考虑起始帧偏移 (ip)，确保跳转位置准确
    var firstFrame = (this.state.lottiePlayer && this.state.lottiePlayer.firstFrame) || 0;
    var targetFrame = firstFrame + Math.round(percentage * this.state.totalFrames);
    
    // 根据播放状态选择是否继续播放
    if (this.state.isPlaying) {
      this.state.lottiePlayer.goToAndPlay(targetFrame, true);
    } else {
      this.state.lottiePlayer.goToAndStop(targetFrame, true);
    }
  };
  
  LottiePlayerAdapter.prototype.setMuted = function(muted) {
    // Lottie 本身没有音频
  };
  
  // ==================== 视频播放器适配器基类 ====================
  
  function VideoPlayerAdapter(state, video) {
    PlayerAdapter.call(this, state);
    this.video = video;
  }
  
  VideoPlayerAdapter.prototype = Object.create(PlayerAdapter.prototype);
  VideoPlayerAdapter.prototype.constructor = VideoPlayerAdapter;
  
  VideoPlayerAdapter.prototype.canHandle = function() {
    return this.state.hasFile && this.video;
  };
  
  VideoPlayerAdapter.prototype.play = function() {
    var _this = this;
    return this.video.play().then(function() {
      _this.afterPlay(); // 钩子方法，子类可重写
    }).catch(function(err) {
      console.error('播放失败:', err);
    });
  };
  
  VideoPlayerAdapter.prototype.pause = function() {
    this.video.pause();
    this.afterPause(); // 钩子方法，子类可重写
  };
  
  VideoPlayerAdapter.prototype.seekTo = function(percentage) {
    var actualPercentage = this.transformPercentage(percentage);
    var duration = this.video.duration || 1;
    this.video.currentTime = actualPercentage * duration;
  };
  
  VideoPlayerAdapter.prototype.setMuted = function(muted) {
    this.video.muted = muted;
  };
  
  VideoPlayerAdapter.prototype.afterPlay = function() {};
  VideoPlayerAdapter.prototype.afterPause = function() {};
  
  // ==================== YYEVA 双通道MP4适配器 ====================
  
  function YyevaPlayerAdapter(state) {
    VideoPlayerAdapter.call(this, state, state.yyevaVideo);
  }
  
  YyevaPlayerAdapter.prototype = Object.create(VideoPlayerAdapter.prototype);
  YyevaPlayerAdapter.prototype.constructor = YyevaPlayerAdapter;
  
  YyevaPlayerAdapter.prototype.afterPlay = function() {
    if (this.state.startYyevaRenderLoop) {
      this.state.startYyevaRenderLoop();
    }
  };
  
  YyevaPlayerAdapter.prototype.afterPause = function() {
    if (this.state.yyevaAnimationId) {
      cancelAnimationFrame(this.state.yyevaAnimationId);
      this.state.yyevaAnimationId = null;
    }
  };
  
  YyevaPlayerAdapter.prototype.seekTo = function(percentage) {
    VideoPlayerAdapter.prototype.seekTo.call(this, percentage);
    // 确保在跳转完成后渲染一帧（暂停时也能更新画面）
    if (this.state.renderYyevaFrame) {
      var _this = this;
      // 监听 seeked 事件确保视频数据已就绪
      var onSeeked = function() {
        _this.state.renderYyevaFrame();
        _this.video.removeEventListener('seeked', onSeeked);
      };
      
      // 如果正在跳转中，等待 seeked；否则直接渲染
      if (this.video.seeking) {
        this.video.addEventListener('seeked', onSeeked);
      } else {
        this.state.renderYyevaFrame();
      }
    }
  };
  
  // ==================== MP4 播放器适配器（含变速逻辑）====================
  
  function Mp4PlayerAdapter(state) {
    VideoPlayerAdapter.call(this, state, state.mp4Video);
  }
  
  Mp4PlayerAdapter.prototype = Object.create(VideoPlayerAdapter.prototype);
  Mp4PlayerAdapter.prototype.constructor = Mp4PlayerAdapter;
  
  Mp4PlayerAdapter.prototype.afterPlay = function() {
    if (this.state.startMp4ProgressLoop) {
      this.state.startMp4ProgressLoop();
    }
  };

  Mp4PlayerAdapter.prototype.afterPause = function() {
    if (this.state.stopMp4ProgressLoop) {
      this.state.stopMp4ProgressLoop();
    }
  };
  
  // 变速映射逻辑
  Mp4PlayerAdapter.prototype.transformPercentage = function(percentage) {
    if (!this.state.speedRemapConfig || 
        !this.state.speedRemapConfig.enabled || 
        !this.state.speedRemapConfig.keyframes || 
        this.state.speedRemapConfig.keyframes.length < 2) {
      return percentage;
    }
    
    var keyframes = this.state.speedRemapConfig.keyframes;
    var totalFrames = this.state.speedRemapConfig.originalTotalFrames || this.state.totalFrames;
    var lastKeyframe = keyframes[keyframes.length - 1];
    
    // percentage是相对于变速后总时长的百分比，转换为position
    var targetPosition = percentage * lastKeyframe.position;
    
    // 根据position计算原始帧号
    var originalFrame = 0;
    for (var i = 0; i < keyframes.length - 1; i++) {
      var k1 = keyframes[i];
      var k2 = keyframes[i + 1];
      if (targetPosition >= k1.position && targetPosition <= k2.position) {
        var posDelta = k2.position - k1.position;
        if (posDelta > 0) {
          var posProgress = (targetPosition - k1.position) / posDelta;
          originalFrame = k1.originalFrame + posProgress * (k2.originalFrame - k1.originalFrame);
        } else {
          originalFrame = k1.originalFrame;
        }
        break;
      }
    }
    
    // 计算原始视频的实际位置
    return originalFrame / totalFrames;
  };
  
  // ==================== 序列帧播放器适配器 ====================
  
  function FramesPlayerAdapter(state) {
    PlayerAdapter.call(this, state);
  }
  
  FramesPlayerAdapter.prototype = Object.create(PlayerAdapter.prototype);
  FramesPlayerAdapter.prototype.constructor = FramesPlayerAdapter;
  
  FramesPlayerAdapter.prototype.play = function() {
    if (this.state.startFramesPlayLoop) {
      this.state.startFramesPlayLoop();
    }
  };
  
  FramesPlayerAdapter.prototype.pause = function() {
    if (this.state.stopFramesPlayLoop) {
      this.state.stopFramesPlayLoop();
    }
  };
  
  FramesPlayerAdapter.prototype.seekTo = function(percentage) {
    var targetFrame = Math.round(percentage * (this.state.totalFrames - 1));
    if (this.state.seekFramesTo) {
      this.state.seekFramesTo(targetFrame);
    }
  };
  
  FramesPlayerAdapter.prototype.setMuted = function(muted) {
    // 序列帧没有音频
  };
  
  // ==================== SVGA 播放器适配器 ====================
  
  /**
   * 全局音频管理器
   * 负责接管所有 Howl 实例的生命周期
   * 原理：通过劫持 Howl.prototype.init，自动注册所有新创建的音频实例
   */
  var GlobalAudioManager = {
    instances: [],
    initialized: false,

    init: function() {
      if (this.initialized || typeof Howl === 'undefined') return;
      
      var _this = this;
      var originalInit = Howl.prototype.init;
      
      // 劫持初始化方法
      Howl.prototype.init = function(o) {
        // 执行原始初始化
        var result = originalInit.call(this, o);
        
        // 注册到管理器 (使用 setTimeout 确保实例已完全初始化)
        var self = this;
        setTimeout(function() {
          _this.add(self);
        }, 0);
        
        return result;
      };

      this.initialized = true;
    },

    add: function(howl) {
      if (this.instances.indexOf(howl) === -1) {
        this.instances.push(howl);
        // 监听卸载事件，自动移除
        var _this = this;
        howl.on('unload', function() {
          _this.remove(howl);
        });
      }
    },

    remove: function(howl) {
      var index = this.instances.indexOf(howl);
      if (index !== -1) {
        this.instances.splice(index, 1);
      }
    },

    /**
     * 停止所有音频
     */
    stopAll: function() {
      this.instances.forEach(function(howl) {
        if (howl.playing()) howl.stop();
      });
    },

    /**
     * 暂停所有音频
     */
    pauseAll: function() {
      this.instances.forEach(function(howl) {
        if (howl.playing()) howl.pause();
      });
    },

    /**
     * 设置所有音频静音
     */
    muteAll: function(muted) {
      this.instances.forEach(function(howl) {
        howl.mute(muted);
      });
    },

    /**
     * 卸载并清空所有音频
     */
    unloadAll: function() {
      // 复制一份数组进行遍历，因为 unload 会触发 remove 修改数组
      var list = this.instances.slice();
      list.forEach(function(howl) {
        try {
          howl.unload();
        } catch (e) {
          console.warn('Unload error:', e);
        }
      });
      this.instances = [];
    }
  };

  /**
   * SVGA 播放器适配器
   * 功能：统一 SVGA 播放控制接口，支持音频同步管理
   */
  function SvgaPlayerAdapter(state) {
    PlayerAdapter.call(this, state);
    // 确保音频管理器已初始化
    GlobalAudioManager.init();
  }

  SvgaPlayerAdapter.prototype = Object.create(PlayerAdapter.prototype);
  SvgaPlayerAdapter.prototype.constructor = SvgaPlayerAdapter;

  SvgaPlayerAdapter.prototype.canHandle = function() {
    return this.state.hasFile && this.state.svgaPlayer;
  };

  SvgaPlayerAdapter.prototype.play = function() {
    try {
      var currentPercentage = (this.state.progress || 0) / 100;
      
      // 1. 停止当前所有正在播放的音频，防止重叠
      GlobalAudioManager.stopAll();
      
      // 2. 播放动画 (SVGA 内部会根据 percentage 触发音频播放)
      this.state.svgaPlayer.stepToPercentage(currentPercentage, true);
      
      // 3. 同步静音状态
      GlobalAudioManager.muteAll(this.state.isMuted);
      
    } catch (e) {
      console.error('播放失败:', e);
    }
  };

  SvgaPlayerAdapter.prototype.pause = function() {
    try {
      this.state.svgaPlayer.pauseAnimation();
      // 暂停所有音频
      GlobalAudioManager.pauseAll();
    } catch (e) {
      console.error('暂停失败:', e);
    }
  };

  SvgaPlayerAdapter.prototype.seekTo = function(percentage, isScrubbing) {
    try {
      // 拖拽/跳转时，必须先停止所有音频
      GlobalAudioManager.stopAll();
      
      // 如果是拖拽中 (isScrubbing)，强制不播放；否则跟随当前播放状态
      var shouldPlay = this.state.isPlaying && !isScrubbing;
      
      this.state.svgaPlayer.stepToPercentage(percentage, shouldPlay);
      
      // 如果处于播放状态，SVGA stepToPercentage 可能会触发音频播放
      // 我们再次确保静音状态正确
      if (shouldPlay) {
        GlobalAudioManager.muteAll(this.state.isMuted);
      }
    } catch (e) {
      console.error('跳转失败:', e);
    }
  };

  SvgaPlayerAdapter.prototype.setMuted = function(muted) {
    GlobalAudioManager.muteAll(muted);
  };
  
  // 销毁时清理音频
  SvgaPlayerAdapter.prototype.destroy = function() {
    GlobalAudioManager.unloadAll();
  };
  
  // ==================== 播放控制器 ====================
  
  /**
   * 播放控制器
   * @param {Object} options 配置选项
   */
  function PlayerController(options) {
    this.options = options || {};
    this.onProgressChange = options.onProgressChange || function() {};
    this.onPlayStateChange = options.onPlayStateChange || function() {};
    this.getPlayerState = options.getPlayerState || function() { return {}; };
    
    // 进度条拖拽状态
    this.isDragging = false;
    this.progressBar = null;
    this.progressThumb = null;
    
    // 初始化进度条拖拽
    if (options.progressBar && options.progressThumb) {
      this.initProgressDrag(options.progressBar, options.progressThumb);
    }
  }

  /**
   * 获取当前模式对应的播放器适配器
   */
  PlayerController.prototype.getAdapter = function() {
    var state = this.getPlayerState();
    var mode = state.mode;
    
    // 根据模式返回对应的适配器
    var adapter = null;
    switch (mode) {
      case 'lottie':
        adapter = new LottiePlayerAdapter(state);
        break;
      case 'yyeva':
        adapter = new YyevaPlayerAdapter(state);
        break;
      case 'mp4':
        adapter = new Mp4PlayerAdapter(state);
        break;
      case 'frames':
        adapter = new FramesPlayerAdapter(state);
        break;
      case 'svga':
        adapter = new SvgaPlayerAdapter(state);
        break;
    }
    
    // 检查适配器是否可用
    if (adapter && adapter.canHandle()) {
      return adapter;
    }
    return null;
  };
  
  /**
   * 切换播放/暂停（重构后：统一接口，无if-else分支）
   */
  PlayerController.prototype.togglePlay = function() {
    var state = this.getPlayerState();
    var adapter = this.getAdapter();
    
    if (!adapter) return;
    
    try {
      if (state.isPlaying) {
        adapter.pause();
        this.onPlayStateChange(false);
      } else {
        adapter.play();
        this.onPlayStateChange(true);
      }
    } catch (e) {
      console.error('播放控制失败:', e);
    }
  };

  /**
   * 跳转到指定进度（重构后：统一接口，无if-else分支）
   * @param {number} percentage 进度百分比 0-1
   * @param {boolean} isScrubbing 是否正在拖拽（scrubbing）
   */
  PlayerController.prototype.seekTo = function(percentage, isScrubbing) {
    percentage = Math.max(0, Math.min(1, percentage));
    var state = this.getPlayerState();
    var adapter = this.getAdapter();
    
    if (!adapter) return;
    
    try {
      // 计算进度和帧号
      var progress = Math.round(percentage * 100);
      var actualPercentage = adapter.transformPercentage(percentage);
      var currentFrame = Math.round(actualPercentage * state.totalFrames);
      
      // 更新进度显示
      this.onProgressChange(progress, currentFrame);
      
      // 跳转到指定位置
      // 检查适配器是否支持 isScrubbing 参数 (SvgaPlayerAdapter 支持)
      if (adapter instanceof SvgaPlayerAdapter) {
        adapter.seekTo(percentage, isScrubbing);
      } else {
        adapter.seekTo(percentage);
      }
    } catch (e) {
      console.error('跳转失败:', e);
    }
  };
  
  /**
   * 设置静音状态（新增：统一接口）
   * @param {boolean} muted 是否静音
   */
  PlayerController.prototype.setMuted = function(muted) {
    var adapter = this.getAdapter();
    
    if (!adapter) return;
    
    try {
      adapter.setMuted(muted);
    } catch (e) {
      console.error('设置静音失败:', e);
    }
  };

  /**
   * 初始化进度条拖拽
   * @param {HTMLElement} progressBar 进度条容器
   * @param {HTMLElement} progressThumb 滑块元素
   */
  PlayerController.prototype.initProgressDrag = function(progressBar, progressThumb) {
    var _this = this;
    this.progressBar = progressBar;
    this.progressThumb = progressThumb;
    
    // 鼠标/触摸开始
    var onDragStart = function(e) {
      e.preventDefault();
      _this.isDragging = true;
      _this.wasPlaying = _this.getPlayerState().isPlaying; // 记录拖拽前的播放状态
      
      // 立即跳转到点击位置（标记为 scrubbing）
      updateProgress(e, true);
      
      // 添加全局事件监听
      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend', onDragEnd);
    };
    
    // 节流工具函数
    var throttle = function(func, limit) {
      var inThrottle;
      return function() {
        var args = arguments;
        var context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(function() {
            inThrottle = false;
          }, limit);
        }
      }
    };

    // 拖拽中（增加节流防止高频触发 seek）
    var updateProgressThrottled = throttle(function(e) {
      updateProgress(e, true); // 标记为 scrubbing
    }, 50); // 50ms 节流 (20fps)

    var onDragMove = function(e) {
      if (!_this.isDragging) return;
      e.preventDefault();
      updateProgressThrottled(e);
    };
    
    // 拖拽结束
    var onDragEnd = function() {
      _this.isDragging = false;
      
      // 移除全局事件监听
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('touchend', onDragEnd);

      // 如果拖拽前是播放状态，恢复播放（因为 scrubbing 导致暂停了）
      if (_this.wasPlaying) {
        var adapter = _this.getAdapter();
        if (adapter) adapter.play();
      }
    };
    
    // 更新进度
    var updateProgress = function(e, isScrubbing) {
      var clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
      if (!clientX) return;
      
      var rect = _this.progressBar.getBoundingClientRect();
      var x = clientX - rect.left;
      var percentage = x / rect.width;
      
      _this.seekTo(percentage, isScrubbing);
    };
    
    // 绑定滑块事件
    progressThumb.addEventListener('mousedown', onDragStart);
    progressThumb.addEventListener('touchstart', onDragStart, { passive: false });
    
    // 点击进度条跳转（保存函数引用以便清理）
    var onProgressBarClick = function(e) {
      // 如果点击的是滑块，不处理（由拖拽处理）
      if (e.target === progressThumb || progressThumb.contains(e.target)) {
        return;
      }
      updateProgress(e, false); // 点击是直接跳转，不是 scrubbing
    };
    progressBar.addEventListener('click', onProgressBarClick);
    
    // 保存清理函数
    this._cleanupDrag = function() {
      // 清理滑块事件
      progressThumb.removeEventListener('mousedown', onDragStart);
      progressThumb.removeEventListener('touchstart', onDragStart);
      // 清理进度条点击事件
      progressBar.removeEventListener('click', onProgressBarClick);
      // 确保清理全局监听
      onDragEnd();
    };
  };

  /**
   * 销毁控制器
   */
  PlayerController.prototype.destroy = function() {
    if (this._cleanupDrag) {
      this._cleanupDrag();
      this._cleanupDrag = null;
    }
    this.progressBar = null;
    this.progressThumb = null;
  };

  // 导出到全局
  global.PlayerController = PlayerController;

})(typeof window !== 'undefined' ? window : this);
