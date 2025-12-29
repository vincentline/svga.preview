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
    var targetFrame = Math.round(percentage * this.state.totalFrames);
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
    // 立即渲染一帧（暂停时也能更新画面）
    if (this.state.renderYyevaFrame) {
      var _this = this;
      setTimeout(function() {
        _this.state.renderYyevaFrame();
      }, 50);
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
   * SVGA 播放器适配器
   * 功能：统一 SVGA 播放控制接口，支持音频同步管理
   */
  function SvgaPlayerAdapter(state) {
    PlayerAdapter.call(this, state);
  }
  
  SvgaPlayerAdapter.prototype = Object.create(PlayerAdapter.prototype);
  SvgaPlayerAdapter.prototype.constructor = SvgaPlayerAdapter;
  
  SvgaPlayerAdapter.prototype.canHandle = function() {
    return this.state.hasFile && this.state.svgaPlayer;
  };
  
  /**
   * 播放控制：从当前位置继续播放
   * 关键技术：
   * 1. 记录现有的 Howler 音频实例
   * 2. 调用 SVGA 的 stepToPercentage 继续播放（会创建新的音频实例）
   * 3. 延迟停止新创建的音频实例，恢复旧实例
   * 4. 避免音频重复播放和从头开始的问题
   */
  SvgaPlayerAdapter.prototype.play = function() {
    var _this = this;
    try {
      // 记录当前的音频实例
      var existingHowls = [];
      if (typeof Howler !== 'undefined' && Howler._howls) {
        existingHowls = Howler._howls.slice(); // 复制数组
      }
      
      // 从当前位置继续播放（SVGA 可能会创建新的音频实例）
      var currentPercentage = (this.state.progress || 0) / 100;
      this.state.svgaPlayer.stepToPercentage(currentPercentage, true);
      
      // 立即处理音频：停止新创建的实例，恢复旧实例
      setTimeout(function() {
        if (typeof Howler !== 'undefined' && Howler._howls) {
          // 找出新创建的音频实例并停止
          Howler._howls.forEach(function(howl) {
            if (howl && existingHowls.indexOf(howl) === -1) {
              // 这是新创建的实例，停止它
              howl.stop();
            }
          });
          
          // 恢复旧的音频实例（如果不是静音）
          if (!_this.state.isMuted) {
            existingHowls.forEach(function(howl) {
              if (howl && !howl.playing()) {
                howl.play();
              }
            });
          }
        }
      }, 50);
    } catch (e) {
      console.error('播放失败:', e);
    }
  };
  
  /**
   * 暂停控制：暂停动画和音频
   * 直接暂停所有 Howler 音频实例，保留当前播放位置
   */
  SvgaPlayerAdapter.prototype.pause = function() {
    try {
      // 暂停动画
      this.state.svgaPlayer.pauseAnimation();
      
      // 暂停所有 Howler 音频（保留播放位置）
      if (typeof Howler !== 'undefined' && Howler._howls) {
        Howler._howls.forEach(function(howl) {
          if (howl && howl.playing()) {
            howl.pause();
          }
        });
      }
    } catch (e) {
      console.error('暂停失败:', e);
    }
  };
  
  /**
   * 进度跳转：跳转到指定位置
   * 停止所有音频防止叠加，然后跳转
   */
  SvgaPlayerAdapter.prototype.seekTo = function(percentage) {
    try {
      // 拖动进度条时先停止所有音频，防止多个音频实例叠加
      if (typeof Howler !== 'undefined') {
        Howler.stop();
      }
      
      // 跳转到指定位置
      this.state.svgaPlayer.stepToPercentage(percentage, this.state.isPlaying);
      
      // 如果是播放状态且未静音，恢复音频
      if (this.state.isPlaying && typeof Howler !== 'undefined' && !this.state.isMuted) {
        Howler.mute(false);
      }
    } catch (e) {
      console.error('跳转失败:', e);
    }
  };
  
  SvgaPlayerAdapter.prototype.setMuted = function(muted) {
    if (typeof Howler !== 'undefined') {
      Howler.mute(muted);
    }
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
   */
  PlayerController.prototype.seekTo = function(percentage) {
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
      adapter.seekTo(percentage);
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
      
      // 立即跳转到点击位置
      updateProgress(e);
      
      // 添加全局事件监听
      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend', onDragEnd);
    };
    
    // 拖拽中
    var onDragMove = function(e) {
      if (!_this.isDragging) return;
      e.preventDefault();
      updateProgress(e);
    };
    
    // 拖拽结束
    var onDragEnd = function() {
      _this.isDragging = false;
      
      // 移除全局事件监听
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('touchend', onDragEnd);
    };
    
    // 更新进度
    var updateProgress = function(e) {
      var clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
      if (!clientX) return;
      
      var rect = _this.progressBar.getBoundingClientRect();
      var x = clientX - rect.left;
      var percentage = x / rect.width;
      
      _this.seekTo(percentage);
    };
    
    // 绑定滑块事件
    progressThumb.addEventListener('mousedown', onDragStart);
    progressThumb.addEventListener('touchstart', onDragStart, { passive: false });
    
    // 点击进度条跳转
    progressBar.addEventListener('click', function(e) {
      // 如果点击的是滑块，不处理（由拖拽处理）
      if (e.target === progressThumb || progressThumb.contains(e.target)) {
        return;
      }
      updateProgress(e);
    });
    
    // 保存清理函数
    this._cleanupDrag = function() {
      progressThumb.removeEventListener('mousedown', onDragStart);
      progressThumb.removeEventListener('touchstart', onDragStart);
      onDragEnd(); // 确保清理全局监听
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
