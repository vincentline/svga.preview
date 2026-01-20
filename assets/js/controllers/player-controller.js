/**
 * 播放控制器模块
 * 封装多模式统一的播放控制逻辑（播放/暂停、进度跳转、拖拽滑块、静音控制）
 * 使用适配器模式统一不同播放器的接口，避免重复的if-else判断
 * 
 * 模块索引：
 * 
 * 1. 【PlayerAdapter】 - 播放器适配器基类
 *    - 定义统一接口 (play, pause, seekTo, setMuted, canHandle)
 * 
 * 2. 【GlobalAudioManager】 - 全局音频管理器
 *    - 接管所有 Howl 实例的生命周期
 *    - 提供统一的 stopAll, pauseAll, muteAll, unloadAll 方法
 * 
 * 3. 【LottiePlayerAdapter】 - Lottie 播放器适配器
 *    - 适配 lottie-web 播放器
 * 
 * 4. 【VideoPlayerAdapter】 - 视频播放器适配器基类
 *    - 封装 HTMLVideoElement 的通用操作
 * 
 * 5. 【YyevaPlayerAdapter】 - YYEVA 双通道MP4适配器
 *    - 继承自 VideoPlayerAdapter
 *    - 处理 YYEVA 特有的渲染循环 (startYyevaRenderLoop)
 * 
 * 6. 【Mp4PlayerAdapter】 - MP4 播放器适配器
 *    - 继承自 VideoPlayerAdapter
 *    - 实现变速播放逻辑 (transformPercentage)
 * 
 * 7. 【FramesPlayerAdapter】 - 序列帧播放器适配器
 *    - 控制序列帧的播放循环
 * 
 * 8. 【SvgaPlayerAdapter】 - SVGA 播放器适配器 (核心)
 *    - 适配 svga-player 播放器
 *    - [CRITICAL] 核心音频同步逻辑 (syncAudio)(修改请先查阅SVGA_AUDIO_IMPL.md)
 *    - 音频实例管理 (getHowlInstance)
 * 
 * 9. 【PlayerController】 - 主控制器
 *    - 对外暴露统一的控制接口
 *    - 管理当前适配器实例
 *    - 处理进度条拖拽交互
 *    - 监听播放状态变更 (handlePlayStateChange)
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

(function (global) {
  'use strict';

  // Ensure namespace
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Controllers = global.MeeWoo.Controllers || {};

  // ==================== 播放器适配器基类 ====================

  /**
   * 播放器适配器基类 - 定义统一接口
   */
  function PlayerAdapter(state) {
    this.state = state;
  }

  PlayerAdapter.prototype = {
    // 播放
    play: function () { throw new Error('子类必须实现 play'); },
    // 暂停
    pause: function () { throw new Error('子类必须实现 pause'); },
    // 跳转到指定进度（0-1）
    seekTo: function (percentage) { throw new Error('子类必须实现 seekTo'); },
    // 设置静音
    setMuted: function (muted) { throw new Error('子类必须实现 setMuted'); },
    // 检查是否可用
    canHandle: function () { return this.state.hasFile; },
    // 进度转换（用于变速等特殊场景）
    transformPercentage: function (p) { return p; },
    // 更新状态（新增：支持适配器缓存复用）
    updateState: function (state) { this.state = state; }
  };

  // 自动检测并初始化 GlobalAudioManager
  // 1. 立即尝试初始化
  if (typeof Howl !== 'undefined') {
    GlobalAudioManager.init();
  } else {
    // 2. 如果未定义，轮询检测（保留作为兜底）
    var checkHowl = setInterval(function () {
      if (typeof Howl !== 'undefined') {
        GlobalAudioManager.init();
        clearInterval(checkHowl);
      }
    }, 100); // 缩短检测间隔
  }

  // ==================== Lottie 播放器适配器 ====================

  function LottiePlayerAdapter(state) {
    PlayerAdapter.call(this, state);
  }

  LottiePlayerAdapter.prototype = Object.create(PlayerAdapter.prototype);
  LottiePlayerAdapter.prototype.constructor = LottiePlayerAdapter;

  LottiePlayerAdapter.prototype.canHandle = function () {
    return this.state.hasFile && this.state.lottiePlayer;
  };

  LottiePlayerAdapter.prototype.play = function () {
    this.state.lottiePlayer.play();
  };

  LottiePlayerAdapter.prototype.pause = function () {
    this.state.lottiePlayer.pause();
  };

  LottiePlayerAdapter.prototype.seekTo = function (percentage) {
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

  LottiePlayerAdapter.prototype.setMuted = function (muted) {
    // Lottie 本身没有音频
  };

  // ==================== 视频播放器适配器基类 ====================

  function VideoPlayerAdapter(state, video) {
    PlayerAdapter.call(this, state);
    this.video = video;
  }

  VideoPlayerAdapter.prototype = Object.create(PlayerAdapter.prototype);
  VideoPlayerAdapter.prototype.constructor = VideoPlayerAdapter;

  VideoPlayerAdapter.prototype.canHandle = function () {
    return this.state.hasFile && this.video;
  };

  VideoPlayerAdapter.prototype.play = function () {
    var _this = this;
    return this.video.play().then(function () {
      _this.afterPlay(); // 钩子方法，子类可重写
    }).catch(function (err) {
      console.error('播放失败:', err);
    });
  };

  VideoPlayerAdapter.prototype.pause = function () {
    this.video.pause();
    this.afterPause(); // 钩子方法，子类可重写
  };

  VideoPlayerAdapter.prototype.seekTo = function (percentage) {
    var actualPercentage = this.transformPercentage(percentage);
    var duration = this.video.duration || 1;
    this.video.currentTime = actualPercentage * duration;
  };

  VideoPlayerAdapter.prototype.setMuted = function (muted) {
    this.video.muted = muted;
  };

  VideoPlayerAdapter.prototype.afterPlay = function () { };
  VideoPlayerAdapter.prototype.afterPause = function () { };

  // ==================== YYEVA 双通道MP4适配器 ====================

  function YyevaPlayerAdapter(state) {
    VideoPlayerAdapter.call(this, state, state.yyevaVideo);
  }

  YyevaPlayerAdapter.prototype = Object.create(VideoPlayerAdapter.prototype);
  YyevaPlayerAdapter.prototype.constructor = YyevaPlayerAdapter;

  YyevaPlayerAdapter.prototype.afterPlay = function () {
    if (this.state.startYyevaRenderLoop) {
      this.state.startYyevaRenderLoop();
    }
  };

  YyevaPlayerAdapter.prototype.afterPause = function () {
    if (this.state.yyevaAnimationId) {
      cancelAnimationFrame(this.state.yyevaAnimationId);
      this.state.yyevaAnimationId = null;
    }
  };

  YyevaPlayerAdapter.prototype.seekTo = function (percentage) {
    VideoPlayerAdapter.prototype.seekTo.call(this, percentage);
    // 确保在跳转完成后渲染一帧（暂停时也能更新画面）
    if (this.state.renderYyevaFrame) {
      var _this = this;
      // 监听 seeked 事件确保视频数据已就绪
      var onSeeked = function () {
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

  Mp4PlayerAdapter.prototype.afterPlay = function () {
    if (this.state.startMp4ProgressLoop) {
      this.state.startMp4ProgressLoop();
    }
  };

  Mp4PlayerAdapter.prototype.afterPause = function () {
    if (this.state.stopMp4ProgressLoop) {
      this.state.stopMp4ProgressLoop();
    }
  };

  // 变速映射逻辑
  Mp4PlayerAdapter.prototype.transformPercentage = function (percentage) {
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

  FramesPlayerAdapter.prototype.play = function () {
    if (this.state.startFramesPlayLoop) {
      this.state.startFramesPlayLoop();
    }
  };

  FramesPlayerAdapter.prototype.pause = function () {
    if (this.state.stopFramesPlayLoop) {
      this.state.stopFramesPlayLoop();
    }
  };

  FramesPlayerAdapter.prototype.seekTo = function (percentage) {
    var targetFrame = Math.round(percentage * (this.state.totalFrames - 1));
    if (this.state.seekFramesTo) {
      this.state.seekFramesTo(targetFrame);
    }
  };

  FramesPlayerAdapter.prototype.setMuted = function (muted) {
    // 序列帧没有音频
  };

  // ==================== SVGA 播放器适配器 ====================

  /**
   * 全局音频管理器
   * 负责接管所有 Howl 实例的生命周期
   */
  var GlobalAudioManager = {
    instances: [],
    initialized: false,

    init: function () {
      // 移除全局劫持逻辑，改为手动注册
      // 避免与 SVGA 内部或其他库的 Howl 初始化逻辑冲突
      this.initialized = true;
    },

    add: function (howl) {
      if (!howl) return;

      // 防御性初始化：确保 instances 存在
      if (!this.instances) this.instances = [];

      if (this.instances.indexOf(howl) === -1) {
        this.instances.push(howl);
        // 监听卸载事件，自动移除
        var _this = this;
        // 检查 on 方法是否存在（防御性编程）
        if (typeof howl.on === 'function') {
          try {
            // 更安全的事件绑定方式：检查 Howl 实例是否已初始化完成
            // 避免在 Howl 实例未完全初始化时绑定事件导致的内部数组访问错误
            if (typeof howl._events === 'object') {
              howl.on('unload', function () {
                _this.remove(howl);
              });
            }
          } catch (e) {
            // 静默处理，不再显示控制台警告
            // [CRITICAL] 不要在这里移除！
            // 即使绑定 unload 失败（常见于 Howler 兼容性问题），我们仍需在列表中持有该实例
            // 否则后续执行 pauseAll/stopAll 时将无法控制此音频，导致“关不掉”的声音。
            // 详情参考：SVGA_AUDIO_IMPL.md #3.4

            // this.instances.splice(this.instances.indexOf(howl), 1);
          }
        }
      }
    },

    remove: function (howl) {
      var index = this.instances.indexOf(howl);
      if (index !== -1) {
        this.instances.splice(index, 1);
      }
    },

    /**
     * 停止所有音频
     */
    stopAll: function () {
      this.instances.forEach(function (howl) {
        if (howl.playing()) howl.stop();
      });
    },

    /**
     * 暂停所有音频
     */
    pauseAll: function () {
      this.instances.forEach(function (howl) {
        if (howl.playing()) howl.pause();
      });
    },

    /**
     * 设置所有音频静音
     */
    muteAll: function (muted) {
      this.instances.forEach(function (howl) {
        howl.mute(muted);
      });
    },

    /**
     * 卸载并清空所有音频
     */
    unloadAll: function () {
      // 复制一份数组进行遍历，因为 unload 会触发 remove 修改数组
      var list = this.instances.slice();
      list.forEach(function (howl) {
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
    this.audioCache = {}; // 缓存音频实例
  }

  SvgaPlayerAdapter.prototype = Object.create(PlayerAdapter.prototype);
  SvgaPlayerAdapter.prototype.constructor = SvgaPlayerAdapter;

  SvgaPlayerAdapter.prototype.canHandle = function () {
    return this.state.hasFile && this.state.svgaPlayer;
  };

  SvgaPlayerAdapter.prototype.play = function () {
    try {
      var currentPercentage = (this.state.progress || 0) / 100;

      // 1. 停止当前所有正在播放的音频，防止重叠
      GlobalAudioManager.stopAll();

      // 2. 播放动画
      this.state.svgaPlayer.stepToPercentage(currentPercentage, true);

      // 3. 手动同步音频（核心修复）
      var currentFrame = currentPercentage * this.state.totalFrames;
      this.syncAudio(currentFrame);

      // 4. 同步静音状态
      GlobalAudioManager.muteAll(this.state.isMuted);

    } catch (e) {
      console.error('播放失败:', e);
    }
  };

  SvgaPlayerAdapter.prototype.pause = function () {
    try {
      this.state.svgaPlayer.pauseAnimation();
      // 停止所有音频
      GlobalAudioManager.stopAll();
    } catch (e) {
      console.error('暂停失败:', e);
    }
  };

  SvgaPlayerAdapter.prototype.seekTo = function (percentage, isScrubbing) {
    try {
      // 拖拽/跳转时，必须先停止所有音频
      GlobalAudioManager.stopAll();

      // 如果是拖拽中 (isScrubbing)，强制不播放；否则跟随当前播放状态
      var shouldPlay = this.state.isPlaying && !isScrubbing;

      this.state.svgaPlayer.stepToPercentage(percentage, shouldPlay);

      // 如果处于播放状态，立即同步音频
      if (shouldPlay) {
        var currentFrame = percentage * this.state.totalFrames;
        this.syncAudio(currentFrame);
        GlobalAudioManager.muteAll(this.state.isMuted);
      }
    } catch (e) {
      console.error('跳转失败:', e);
    }
  };

  // 核心音频同步逻辑
  // [CRITICAL] 这是音频同步的心脏，修改前请务必阅读 SVGA_AUDIO_IMPL.md
  SvgaPlayerAdapter.prototype.syncAudio = function (currentFrame) {
    if (!this.state.isPlaying) return;

    var audios = this.state.svgaAudios; // 从 state 中获取音频配置

    // 如果没有音频配置，直接返回，不报错
    if (!audios || !audios.length) {
      return;
    }

    // 有音频配置，重置警告标志
    this._hasWarnedNoAudio = false;

    var fps = this.state.videoItem.FPS || 30;
    var _this = this;

    audios.forEach(function (audio) {
      // 判断当前帧是否在音频的播放范围内 [startFrame, endFrame)
      // 注意：endFrame 可能为 0 或者未定义，如果为0且startFrame为0，可能表示全长播放？

      // 修复：如果 startFrame/endFrame 未定义，设置默认值
      // [FIX] 必须处理 undefined 情况，否则会因 return 而跳过播放
      var startFrame = typeof audio.startFrame === 'number' ? audio.startFrame : 0;
      var endFrame = typeof audio.endFrame === 'number' ? audio.endFrame : 0;

      // 如果 endFrame 为 0，则尝试使用 totalFrames 或默认为无穷大（全长播放）
      // SVGA 协议中，如果 endFrame 为 0，通常意味着直到动画结束
      if (endFrame === 0) {
        endFrame = _this.state.totalFrames || 999999;
      }

      // 暂时按照标准逻辑：必须有明确的区间
      // if (typeof audio.startFrame !== 'number' || typeof audio.endFrame !== 'number') return;

      if (currentFrame >= startFrame && currentFrame < endFrame) {
        var howl = _this.getHowlInstance(audio.audioKey);
        if (howl) {
          // 如果音频未播放，则进行 Seek 并播放
          if (!howl.playing()) {
            // 计算偏移时间 (秒)
            var offset = (currentFrame - startFrame) / fps;
            var startTime = (audio.startTime || 0) / 1000; // ms 转 s
            var seekPos = Math.max(0, startTime + offset);

            console.log('Sync Audio Playing:', audio.audioKey, 'Frame:', currentFrame, 'Seek:', seekPos);

            // 核心修复：Howler 2.x 的 seek 必须在 play 之后或者 load 之后生效
            // 且为了保证移动端兼容性，必须先 mute 再 play 再 seek 再 unmute (如果未静音)

            // 1. 设置静音状态
            // howl.mute(true); 

            // 2. 播放
            // var id = howl.play();

            // 3. 跳转
            // howl.seek(seekPos, id);

            // 4. 恢复静音状态
            // 注意：howl.play() 是异步的吗？通常是同步返回 id，但音频上下文可能需要时间 resume
            // 这里加一个小延时或者直接设置，通常没问题
            // setTimeout(function () { 
            //   howl.mute(_this.state.isMuted, id);
            // }, 10);

            // 简化版：直接播放，不搞复杂操作，先验证能不能出声
            // [FIX] 简化播放逻辑，避免复杂的 mute/unmute 时序问题
            howl.seek(seekPos);
            howl.play();
            howl.mute(_this.state.isMuted);

          }
        } else {
          console.warn('Howl instance not found for:', audio.audioKey);
        }
      } else {
        // 如果不在播放范围内但正在播放，则停止
        if (_this.audioCache[audio.audioKey]) {
          var h = _this.audioCache[audio.audioKey];
          if (h.playing()) h.stop();
        }
      }
    });
  };

  // 获取或创建 Howl 实例
  SvgaPlayerAdapter.prototype.getHowlInstance = function (audioKey) {
    if (this.audioCache[audioKey]) return this.audioCache[audioKey];

    // 优先从 svgaAudioData (app.js 手动解析的数据) 中获取
    var audioDataMap = this.state.svgaAudioData || {};
    var videoItem = this.state.videoItem;
    var images = videoItem && videoItem.images ? videoItem.images : {};

    // 尝试获取音频数据（兼容不同的 key 后缀，参考 app.js 的逻辑）
    var possibleKeys = [
      audioKey,
      audioKey + '.mp3',
      audioKey + '.wav',
      'audio_' + audioKey,
      audioKey.replace(/\.[^.]+$/, ''),
      'audio_' + audioKey.replace(/\.[^.]+$/, '')
    ];

    // 新增：如果 key 包含 .mp3 后缀，尝试去掉后缀的 key
    if (audioKey.endsWith('.mp3')) {
      possibleKeys.push(audioKey.replace('.mp3', ''));
    }

    var data = null;

    // 1. 先查 svgaAudioData (protobuf 解析出的原始数据)
    for (var i = 0; i < possibleKeys.length; i++) {
      if (audioDataMap[possibleKeys[i]]) {
        data = audioDataMap[possibleKeys[i]];
        break;
      }
    }

    // 2. 如果没找到，再查 videoItem.images (SVGA Parser 解析出的数据，可能不包含音频)
    if (!data) {
      // 先检查 images 是否存在
      if (images) {
        for (var i = 0; i < possibleKeys.length; i++) {
          if (images[possibleKeys[i]]) {
            data = images[possibleKeys[i]];
            break;
          }
        }
      }
    }

    if (!data) {
      // 最终尝试：遍历 audioDataMap 的所有 key，看是否有包含关系的（模糊匹配）
      // [FIX] 模糊匹配策略：解决 Key 不一致问题（audio_296 vs 296），详见 SVGA_AUDIO_IMPL.md #3.2
      // 很多时候 key 是 "audio_296" 但 audioKey 是 "296" 或者 "audio_296.mp3"
      var allAudioKeys = Object.keys(audioDataMap);
      for (var j = 0; j < allAudioKeys.length; j++) {
        var k = allAudioKeys[j];
        // 只有当长度足够（>3）才进行包含匹配，避免 "1" 匹配到 "10" 这种误伤
        if (k.length > 3 && audioKey.length > 3) {
          if (k.indexOf(audioKey) !== -1 || audioKey.indexOf(k) !== -1) {
            data = audioDataMap[k];
            console.log('Fuzzy match found:', k, 'for', audioKey);
            break;
          }
        }
      }
    }

    if (!data) {
      // console.warn('Audio data not found for key:', audioKey);
      return null;
    }

    var src = null;
    if (typeof data === 'string') {
      src = data.startsWith('data:') ? data : 'data:audio/mp3;base64,' + data;
    } else if (data instanceof Uint8Array) {
      var blob = new Blob([data], { type: 'audio/mp3' });
      src = URL.createObjectURL(blob);
    }

    if (!src) return null;

    console.log('Creating Howl instance for:', audioKey, 'Src length:', src.length);

    var howl = new Howl({
      src: [src],
      format: ['mp3', 'wav'],
      html5: false, // 使用 Web Audio API 以获得更精准的 Seek 控制
      loop: false,
      autoplay: false,
      onload: function () {
        // 音频加载完成后，如果当前处于播放状态，尝试同步
        // 这可以解决音频加载延迟导致的首次播放无声问题
        console.log('Audio Loaded:', audioKey);
      },
      onloaderror: function (id, err) {
        console.error('Howl Load Error:', err, 'for key:', audioKey);
      },
      onplayerror: function (id, err) {
        console.error('Howl Play Error:', err, 'for key:', audioKey);
        // 尝试解锁音频上下文
        if (typeof Howler !== 'undefined' && Howler.ctx && Howler.ctx.state === 'suspended') {
          Howler.ctx.resume();
        }
      }
    });

    // 手动注册到全局管理器
    GlobalAudioManager.add(howl);

    this.audioCache[audioKey] = howl;
    return howl;
  };

  SvgaPlayerAdapter.prototype.setMuted = function (muted) {
    GlobalAudioManager.muteAll(muted);
  };

  // 销毁时清理音频
  SvgaPlayerAdapter.prototype.destroy = function () {
    GlobalAudioManager.unloadAll();
    this.audioCache = {};
  };

  // ==================== 播放控制器 ====================

  /**
   * 播放控制器
   * @param {Object} options 配置选项
   */
  function PlayerController(options) {
    this.options = options || {};
    this.onProgressChange = options.onProgressChange || function () { };
    // 拦截外部传入的 onPlayStateChange，注入内部处理逻辑
    var externalOnPlayStateChange = options.onPlayStateChange || function () { };
    var _this = this;
    this.onPlayStateChange = function (isPlaying) {
      // 先调用内部逻辑
      _this.handlePlayStateChange(isPlaying);
      // 再调用外部回调
      externalOnPlayStateChange(isPlaying);
    };
    this.getPlayerState = options.getPlayerState || function () { return {}; };

    // 进度条拖拽状态
    this.isDragging = false;
    this.progressBar = null;
    this.progressThumb = null;

    // 适配器缓存（新增：避免每帧重新创建）
    this.currentAdapter = null;
    this.currentMode = null;
    // 强制绑定上下文，确保在事件回调中 this 指向正确
    this.getAdapter = this.getAdapter.bind(this);
    this.handlePlayStateChange = this.handlePlayStateChange.bind(this); // 新增绑定

    // 初始化进度条拖拽
    if (options.progressBar && options.progressThumb) {
      this.initProgressDrag(options.progressBar, options.progressThumb);
    }
  }

  /**
   * 获取当前模式对应的播放器适配器
   */
  PlayerController.prototype.getAdapter = function () {
    var state = this.getPlayerState();
    var mode = state.mode;

    // 如果当前已有适配器且模式相同，直接复用（核心修复：保持适配器单例）
    if (this.currentAdapter && this.currentMode === mode) {
      this.currentAdapter.updateState(state);
      return this.currentAdapter;
    }

    // 模式改变，销毁旧适配器
    if (this.currentAdapter) {
      if (this.currentAdapter.destroy) {
        this.currentAdapter.destroy();
      }
      this.currentAdapter = null;
    }

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
      this.currentAdapter = adapter;
      this.currentMode = mode;
      return adapter;
    }

    return null;
  };

  /**
   * 切换播放/暂停（重构后：统一接口，无if-else分支）
   */
  PlayerController.prototype.togglePlay = function () {
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
  PlayerController.prototype.seekTo = function (percentage, isScrubbing) {
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
  PlayerController.prototype.setMuted = function (muted) {
    var adapter = this.getAdapter();

    if (!adapter) return;

    try {
      adapter.setMuted(muted);
    } catch (e) {
      console.error('设置静音失败:', e);
    }
  };

  /**
   * 步进控制（快进/快退）
   * @param {number} direction 方向：1为快进，-1为快退
   */
  PlayerController.prototype.step = function (direction) {
    var state = this.getPlayerState();
    var duration = state.totalDuration || 0;
    var currentTime = state.currentTime || 0;

    if (duration < 2) return; // 视频时长 < 2s: 不响应

    // 智能步长计算
    var stepSize = 1;
    if (duration < 10) {
      stepSize = 1; // 2s - 9s: ±1s
    } else if (duration <= 60) {
      stepSize = 2; // 10s - 60s: ±2s
    } else {
      stepSize = 5; // > 60s: ±5s
    }

    var newTime = currentTime + stepSize * direction;

    // 边界检查
    if (newTime < 0) newTime = 0;
    if (newTime > duration) newTime = duration;

    // 计算新的百分比并跳转
    if (duration > 0) {
      var percentage = newTime / duration;
      this.seekTo(percentage);
    }
  };

  /**
   * 暴露给外部驱动的音频同步方法
   * 必须由 app.js 在 onFrame 回调中显式调用
   */
  PlayerController.prototype.syncAudio = function (currentFrame) {
    // 这里使用 this.getAdapter()，需要确保 this 上下文正确
    var adapter = this.getAdapter();
    if (adapter && adapter instanceof SvgaPlayerAdapter && adapter.syncAudio) {
      adapter.syncAudio(currentFrame);
    }
  };

  /**
   * 监听播放状态变更（内部使用）
   * 用于在外部暂停（如SVGA播放完一次loop）时同步暂停音频
   */
  PlayerController.prototype.handlePlayStateChange = function (isPlaying) {
    var adapter = this.currentAdapter; // 直接获取当前适配器，不重新获取
    if (adapter && adapter instanceof SvgaPlayerAdapter) {
      // 如果是 SVGA 且暂停了，通知 adapter 暂停音频
      if (!isPlaying) {
        console.log('PlayerController: Detected Pause, syncing audio stop.');
        // [CRITICAL] 必须强制停止所有音频，防止“余音绕梁”。详见 SVGA_AUDIO_IMPL.md #3.5
        adapter.pause();
      }
    }
  };

  /**
   * 初始化进度条拖拽
   * @param {HTMLElement} progressBar 进度条容器
   * @param {HTMLElement} progressThumb 滑块元素
   */
  PlayerController.prototype.initProgressDrag = function (progressBar, progressThumb) {
    var _this = this;
    this.progressBar = progressBar;
    this.progressThumb = progressThumb;

    // 鼠标/触摸开始
    var onDragStart = function (e) {
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
    var throttle = function (func, limit) {
      var inThrottle;
      return function () {
        var args = arguments;
        var context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(function () {
            inThrottle = false;
          }, limit);
        }
      }
    };

    // 拖拽中（增加节流防止高频触发 seek）
    var updateProgressThrottled = throttle(function (e) {
      updateProgress(e, true); // 标记为 scrubbing
    }, 50); // 50ms 节流 (20fps)

    var onDragMove = function (e) {
      if (!_this.isDragging) return;
      e.preventDefault();
      updateProgressThrottled(e);
    };

    // 拖拽结束
    var onDragEnd = function () {
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
    var updateProgress = function (e, isScrubbing) {
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
    var onProgressBarClick = function (e) {
      // 如果点击的是滑块，不处理（由拖拽处理）
      if (e.target === progressThumb || progressThumb.contains(e.target)) {
        return;
      }
      updateProgress(e, false); // 点击是直接跳转，不是 scrubbing
    };
    progressBar.addEventListener('click', onProgressBarClick);

    // 保存清理函数
    this._cleanupDrag = function () {
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
  PlayerController.prototype.destroy = function () {
    if (this.currentAdapter) {
      if (this.currentAdapter.destroy) {
        this.currentAdapter.destroy();
      }
      this.currentAdapter = null;
    }
    this.currentMode = null;

    if (this._cleanupDrag) {
      this._cleanupDrag();
      this._cleanupDrag = null;
    }
    this.progressBar = null;
    this.progressThumb = null;
  };

  // 导出到全局命名空间
  global.MeeWoo.Controllers.PlayerController = PlayerController;

  // 将 GlobalAudioManager 暴露给外部 (例如 ResourceManager) 使用
  global.MeeWoo.Controllers.GlobalAudioManager = GlobalAudioManager;

})(typeof window !== 'undefined' ? window : this);
