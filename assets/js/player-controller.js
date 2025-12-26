/**
 * 播放控制器模块
 * 封装多模式统一的播放控制逻辑（播放/暂停、进度跳转、拖拽滑块）
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
 * controller.destroy();
 */

(function(global) {
  'use strict';

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
   * 切换播放/暂停
   */
  PlayerController.prototype.togglePlay = function() {
    var state = this.getPlayerState();
    var mode = state.mode;
    var isPlaying = state.isPlaying;
    
    // Lottie 模式
    if (mode === 'lottie' && state.hasFile && state.lottiePlayer) {
      if (isPlaying) {
        state.lottiePlayer.pause();
        this.onPlayStateChange(false);
      } else {
        state.lottiePlayer.play();
        this.onPlayStateChange(true);
      }
      return;
    }
    
    // 双通道MP4 模式
    if (mode === 'yyeva' && state.hasFile && state.yyevaVideo) {
      if (isPlaying) {
        state.yyevaVideo.pause();
        if (state.yyevaAnimationId) {
          cancelAnimationFrame(state.yyevaAnimationId);
          state.yyevaAnimationId = null;
        }
        this.onPlayStateChange(false);
      } else {
        var _this = this;
        state.yyevaVideo.play().then(function() {
          _this.onPlayStateChange(true);
          if (state.startYyevaRenderLoop) {
            state.startYyevaRenderLoop();
          }
        }).catch(function(err) {
          console.error('播放失败:', err);
        });
      }
      return;
    }
    
    // 普通MP4 模式
    if (mode === 'mp4' && state.hasFile && state.mp4Video) {
      if (isPlaying) {
        state.mp4Video.pause();
        this.onPlayStateChange(false);
      } else {
        var _this = this;
        state.mp4Video.play().then(function() {
          _this.onPlayStateChange(true);
          if (state.startMp4ProgressLoop) {
            state.startMp4ProgressLoop();
          }
        }).catch(function(err) {
          console.error('播放失败:', err);
        });
      }
      return;
    }
    
    // 序列帧模式
    if (mode === 'frames' && state.hasFile) {
      if (isPlaying) {
        if (state.stopFramesPlayLoop) {
          state.stopFramesPlayLoop();
        }
        this.onPlayStateChange(false);
      } else {
        this.onPlayStateChange(true);
        if (state.startFramesPlayLoop) {
          state.startFramesPlayLoop();
        }
      }
      return;
    }
    
    // SVGA 模式
    if (mode === 'svga' && state.svgaPlayer && state.hasFile) {
      if (isPlaying) {
        try {
          state.svgaPlayer.pauseAnimation();
        } catch (e) {
          console.error('暂停失败:', e);
        }
        this.onPlayStateChange(false);
      } else {
        try {
          var currentPercentage = (state.progress || 0) / 100;
          state.svgaPlayer.stepToPercentage(currentPercentage, true);
        } catch (e) {
          console.error('播放失败:', e);
        }
        this.onPlayStateChange(true);
      }
    }
  };

  /**
   * 跳转到指定进度
   * @param {number} percentage 进度百分比 0-1
   */
  PlayerController.prototype.seekTo = function(percentage) {
    percentage = Math.max(0, Math.min(1, percentage));
    var state = this.getPlayerState();
    var mode = state.mode;
    var progress = Math.round(percentage * 100);
    
    // Lottie 模式
    if (mode === 'lottie' && state.hasFile && state.lottiePlayer) {
      var targetFrame = Math.round(percentage * state.totalFrames);
      this.onProgressChange(progress, targetFrame);
      state.lottiePlayer.goToAndStop(targetFrame, true);
      return;
    }
    
    // 双通道MP4 模式
    if (mode === 'yyeva' && state.hasFile && state.yyevaVideo) {
      var duration = state.yyevaVideo.duration || 1;
      state.yyevaVideo.currentTime = percentage * duration;
      var currentFrame = Math.round(percentage * state.totalFrames);
      this.onProgressChange(progress, currentFrame);
      
      // 立即渲染一帧（暂停时也能更新画面）
      if (state.renderYyevaFrame) {
        setTimeout(function() {
          state.renderYyevaFrame();
        }, 50);
      }
      return;
    }
    
    // 普通MP4 模式
    if (mode === 'mp4' && state.hasFile && state.mp4Video) {
      var duration = state.mp4Video.duration || 1;
      state.mp4Video.currentTime = percentage * duration;
      var currentFrame = Math.round(percentage * state.totalFrames);
      this.onProgressChange(progress, currentFrame);
      return;
    }
    
    // 序列帧模式
    if (mode === 'frames' && state.hasFile) {
      var targetFrame = Math.round(percentage * (state.totalFrames - 1));
      this.onProgressChange(progress, targetFrame);
      if (state.seekFramesTo) {
        state.seekFramesTo(targetFrame);
      }
      return;
    }
    
    // SVGA 模式
    if (mode === 'svga' && state.svgaPlayer && state.hasFile) {
      var currentFrame = Math.round(percentage * (state.totalFrames - 1));
      this.onProgressChange(progress, currentFrame);
      try {
        state.svgaPlayer.stepToPercentage(percentage, state.isPlaying);
      } catch (e) {
        console.error('跳转失败:', e);
      }
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
    
    console.log('[PlayerController] 初始化进度条拖拽', { progressBar: progressBar, progressThumb: progressThumb });
    
    // 鼠标/触摸开始
    var onDragStart = function(e) {
      console.log('[PlayerController] 开始拖拽', e.type);
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
      console.log('[PlayerController] 结束拖拽');
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
      
      console.log('[PlayerController] 更新进度:', percentage);
      _this.seekTo(percentage);
    };
    
    // 绑定滑块事件
    progressThumb.addEventListener('mousedown', onDragStart);
    progressThumb.addEventListener('touchstart', onDragStart, { passive: false });
    console.log('[PlayerController] 已绑定滑块事件');
    
    // 点击进度条跳转
    progressBar.addEventListener('click', function(e) {
      console.log('[PlayerController] 点击进度条', e.target);
      // 如果点击的是滑块，不处理（由拖拽处理）
      if (e.target === progressThumb || progressThumb.contains(e.target)) {
        return;
      }
      updateProgress(e);
    });
    console.log('[PlayerController] 已绑定进度条点击事件');
    
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
