/*
 * ==================== SVGA Preview 应用主文件 ====================
 * 
 * 模块索引（按代码中顺序排列）：
 * 
 * 1. 【全局状态管理】 - data() - 所有状态变量定义
 * 
 * 2. 【模式切换与任务管理】
 *    - getOngoingTasks() - 获取进行中任务列表
 *    - cancelOngoingTasks() - 取消所有任务
 *    - confirmIfHasOngoingTasks() - 任务确认提示
 *    - switchMode() - 统一模式切换
 * 
 * 3. 【侧边弹窗管理】
 *    - closeAllPanels() - 关闭所有弹窗
 *    - openRightPanel() - 打开/关闭右侧弹窗
 *    - openMaterialPanel() - 素材替换弹窗
 *    - openMP4Panel() - SVGA转MP4弹窗
 *    - openSVGAPanel() - MP4转SVGA弹窗
 * 
 * 4. 【居中弹窗管理】
 *    - onFrameLabelDblClick() - K帧编辑弹窗（双击K帧标签）
 *    - confirmEditFrame() - 确认编辑K帧
 *    - cancelEditFrame() - 取消编辑K帧
 *    - （序列帧拖入后自动显示） - 帧率设置弹窗
 *    - confirmFramesFps() - 确认帧率设置
 *    - cancelFramesFpsDialog() - 取消帧率设置
 *    - openChangeFpsDialog() - 打开改变帧率弹窗
 *    注：所有居中弹窗使用统一样式 .center-modal-*
 * 
 * 5. 【库加载管理器】
 *    - loadLibrary() - 加载库（统一入口）
 *    - preloadLibraries() - 预加载非关键库
 * 
 * 6. 【文件加载与拖拽上传】
 *    - handleFile() - 文件分发器
 *    - onDragOver/onDrop - 拖拽上传
 *    - triggerFileUpload() - 触发文件选择
 * 
 * 7. 【资源清理】
 *    - clearAll() - 清空画布
 *    - cleanupSvga() - 清理SVGA资源
 *    - cleanupYyeva() - 清理MP4资源
 * 
 * 8. 【工具函数】
 *    - showToast() - 提示消息
 *    - loadHelpContent() - 加载帮助文档
 * 
 * 9. 【SVGA加载与播放】
 *    - initSvgaPlayer() - 初始化SVGA播放器
 *    - loadSvgaFile() - 加载SVGA文件
 *    - cleanupSvga() - 清理SVGA资源
 * 
 * 10. 【播放控制】
 *     - togglePlay() - 播放/暂停
 *     - seekTo() - 跳转进度
 *     - updateProgress() - 更新进度
 * 
 * 11. 【双通道MP4加载与播放】
 *     - loadYyeva() - 加载双通道MP4
 *     - renderYyevaFrame() - 渲染帧
 *     - cleanupYyeva() - 清理MP4资源
 * 
 * 12. 【UI交互】
 *     - toggleTheme() - 切换主题
 *     - applyCanvasBackground() - 应用背景
 *     - zoomIn/zoomOut - 缩放控制
 * 
 * 13. 【素材替换功能】
 *     - openMaterialPanel() - 打开素材弹窗
 *     - replaceMaterial() - 替换素材
 *     - resetMaterial() - 重置素材
 * 
 * 14. 【导出GIF功能】
 *     - openGifPanel() - 打开GIF导出弹窗（统一入口）
 *     - runGifExport() - 执行GIF导出（使用GIFExporter模块）
 * 
 * 15. 【格式转换：MP4转SVGA】
 *     - startSVGAConversion() - 开始转换
 *     - extractYyevaFrames() - 提取帧
 *     - (使用独立模块 svga-builder.js 构建)
 * 
 * 16. 【格式转换：SVGA转MP4】
 *     - startMP4Conversion() - 开始转换
 *     - extractFrames() - 提取帧
 *     - composeDualChannelFrames() - 合成双通道
 * 
 * ====================================================================
 */

// 启动应用：先加载Vue和SVGA播放器，再创建Vue实例
function initApp() {
  // 捕获全局错误
  Vue.config.errorHandler = function (err, vm, info) {
    console.error('[Vue Error] ' + err.toString(), info);
    console.error(err);
  };

  var vueInstance = new Vue({
    el: '#app',
    data: function () {
      return {
        currentModule: 'svga', // 'svga' | 'yyeva' | 'mp4' | 'lottie' | 'frames'
        dropHover: false,

        // 底部浮层过渡状态
        footerTransitioning: false, // 正在过渡中
        footerContentVisible: false, // 内容是否可见

        // 视图操作（缩放 + 平移）
        viewerScale: 1,
        viewerOffsetX: 0,
        viewerOffsetY: 0,
        // 视图模式状态：'fit-height' 适应屏幕高度 | '1:1' 原始尺寸
        // 初始加载文件时默认为'fit-height'，显示1:1按钮
        // 点击1:1按钮后变为'1:1'模式，按钮变成contain图标
        viewMode: 'fit-height',

        // 沉浸模式：隐藏标题栏，底部浮层变为mini浮层
        // 给用户更大的展示动画空间
        isImmersiveMode: false,
        modeNameFadeOut: false, // 模式名称是否淡出
        modeNameFadeTimer: null, // 模式名称淡出定时器
        dragging: false,

        // 主题模式
        isDarkMode: false,

        // Help 内容
        helpContent: '',

        // 库加载进度（响应式）
        loadingLibraryInfo: null, // { name, progress }

        // 底色
        bgColorKey: 'pattern', // 'black' | 'white' | 'pattern' | 'green' | 'red' | 'yellow' | 'blue'

        // 播放状态
        isPlaying: false,
        progress: 0, // 0-100，基于时间
        currentFrame: 0,
        totalFrames: 0,
        currentTime: 0, // 当前播放时间（秒）
        totalDuration: 0, // 总时长（秒）

        // 播放控制器实例（非响应式，在created中初始化）
        // playerController: null,

        // SVGA 状态
        svga: {
          hasFile: false,
          file: null,
          fileInfo: {
            name: '',
            size: 0,
            sizeText: '',
            fps: null,
            sizeWH: '',
            duration: '',
            memoryText: ''
          }
        },

        // 双通道MP4 状态
        yyeva: {
          hasFile: false,
          file: null,
          fileInfo: {
            name: '',
            size: 0,
            sizeText: '',
            fps: null,
            sizeWH: '',
            duration: ''
          },
          alphaPosition: 'right', // 'left' | 'right' - alpha通道在左边还是右边
          originalWidth: 0,  // 视频原始宽度
          originalHeight: 0, // 视频原始高度
          displayWidth: 0,   // 显示宽度（原始宽度/2）
          displayHeight: 0   // 显示高度
        },

        // 双通道MP4 播放器实例（非响应式，在created中初始化）
        // yyevaVideo: null,
        // yyevaCanvas: null,
        // yyevaCtx: null,
        // yyevaAnimationId: null,
        // yyevaObjectUrl: null,

        // Lottie 状态
        lottie: {
          hasFile: false,
          file: null,
          frameRate: 30, // 原始帧率数值
          fileInfo: {
            name: '',
            size: 0,
            sizeText: '',
            fps: null,
            sizeWH: '',
            duration: ''
          },
          originalWidth: 0,
          originalHeight: 0,
          animationData: null
        },

        // Lottie 播放器实例（非响应式，在created中初始化）
        // lottiePlayer: null,
        // lottieCanvas: null,
        // lottieCtx: null,
        // lottieAnimationId: null,

        // 普通MP4 状态
        mp4: {
          hasFile: false,
          file: null,
          fileInfo: {
            name: '',
            size: 0,
            sizeText: '',
            fps: null,
            sizeWH: '',
            duration: ''
          },
          originalWidth: 0,
          originalHeight: 0
        },

        // 普通MP4 播放器实例（非响应式，在created中初始化）
        // mp4Video: null,
        // mp4ObjectUrl: null,
        mp4HasAudio: false,

        // 播放器实例（非响应式，在created中初始化）
        // svgaPlayer: null,
        // svgaParser: null,
        // svgaObjectUrl: null,

        // 空状态SVGA播放器（非响应式，在created中初始化）
        // emptyStateSvgaPlayer: null,
        // emptyStateSvgaParser: null,

        // 素材替换
        showMaterialPanel: false,
        materialList: [],
        materialSearchQuery: '',
        // originalVideoItem: null, // 非响应式
        replacedImages: {},            // 用于预览的图片（放大后）
        // 压缩素材的缩放信息（导出时用于替换图片数据）
        // 结构: {imageKey: {scaledWidth, scaledHeight, originalWidth, originalHeight, compressedDataUrl}}
        compressedScaleInfo: {},

        // 素材压缩相关状态
        showCompressModal: false,           // 是否显示压缩弹窗
        isCompressingMaterials: false,      // 是否正在压缩
        compressProgress: 0,                // 压缩进度 0-100
        compressConfig: {
          scalePercent: 70,                 // 缩小比例 10-100%
          level: 3                          // PNG压缩级别 1-6，3平衡
        },
        hasCompressedMaterials: false,      // 是否压缩过素材
        preCompressMaterials: null,         // 压缩前的素材状态（用于撤销）
        preCompressReplacedImages: null,    // 压缩前的replacedImages（用于撤销）
        preCompressScaleInfo: null,         // 压缩前的compressedScaleInfo（用于撤销）

        // 音频数据（从原始SVGA文件提取）
        svgaAudioData: null, // { audioKey: Uint8Array }
        svgaMovieData: null, // protobuf解析后的MovieEntity

        // GIF 导出状态和配置
        showGifPanel: false,
        gifConfig: {
          width: 0,
          height: 0,
          fps: 30,           // 1-60
          quality: 10,       // 1-30，数字越小质量越高（文件越大）
          transparent: false, // 透明底
          dither: false,      // 杂色边
          ditherColor: '#ffffff' // 杂色边颜色
        },
        isExportingGIF: false,
        gifExportProgress: 0,
        gifExportStage: '',   // 'loading' | 'capturing' | 'encoding' | 'done'
        gifExportMessage: '',
        gifExportCancelled: false,

        // Lottie 导出状态
        isExportingLottie: false,
        lottieExportProgress: 0,

        // MP4 转换配置
        showMP4Panel: false,
        showChannelModeDropdown: false,
        mp4Config: {
          channelMode: 'color-left-alpha-right', // 'color-left-alpha-right' | 'alpha-left-color-right'
          width: 0,
          height: 0,
          quality: 80, // 0-100
          fps: 30, // 1-120
          muted: false
        },
        isConvertingMP4: false,
        mp4ConvertProgress: 0,
        mp4ConvertStage: '', // 'loading' | 'extracting' | 'composing' | 'encoding' | 'done'
        mp4ConvertMessage: '',
        mp4ConvertCancelled: false,
        // ffmpeg: null, // 非响应式
        ffmpegLoaded: false,
        ffmpegLoading: false,

        // SVGA 转换配置（双通道MP4转SVGA）
        showSVGAPanel: false,
        svgaConfig: {
          width: 0,
          height: 0,
          quality: 80, // 1-100 压缩质量
          fps: 30, // 1-60 帧率
          muted: false
        },
        isConvertingSVGA: false,
        svgaConvertProgress: 0,
        svgaConvertStage: '', // 'loading' | 'extracting' | 'building' | 'encoding' | 'done'
        svgaConvertMessage: '',
        svgaConvertCancelled: false,

        // 普通MP4转双通道MP4配置
        showMp4ToDualChannelPanel: false,
        showMp4DualChannelModeDropdown: false,
        mp4DualChannelConfig: {
          channelMode: 'color-left-alpha-right',
          width: 0,
          height: 0,
          quality: 80,
          fps: 30,
          muted: false,
          aspectRatio: 1
        },

        // Lottie转双通道MP4配置
        showLottieToDualChannelPanel: false,
        showLottieDualChannelModeDropdown: false,
        lottieDualChannelConfig: {
          channelMode: 'color-left-alpha-right',
          width: 0,
          height: 0,
          quality: 80,
          fps: 30,
          muted: true, // Lottie默认静音
          aspectRatio: 1
        },

        // 绿幕抠图配置（普通MP4）
        showChromaKeyPanel: false,
        chromaKeyEnabled: false,
        chromaKeySimilarity: 40,
        chromaKeySmoothness: 20,
        chromaKeyApplied: false,
        // chromaKeyRenderLoop: null, // 非响应式

        // 普通MP4转SVGA配置
        showMp4ToSvgaPanel: false,
        mp4ToSvgaConfig: {
          width: 0,
          height: 0,
          quality: 80,
          fps: 30,
          muted: false
        },
        isConvertingMp4ToSvga: false,
        mp4ToSvgaProgress: 0,
        mp4ToSvgaStage: '',
        mp4ToSvgaMessage: '',
        mp4ToSvgaCancelled: false,

        // 普通MP4变速配置
        showSpeedRemapEditor: false,    // 显示时间轴编辑器
        selectedKeyframeIndex: -1,      // 当前选中的K帧索引
        timelineHoverX: -1,             // hover预览线位置
        showEditFrameDialog: false,     // 显示编辑帧数弹窗
        editingKeyframeIndex: -1,       // 正在编辑的K帧索引
        editFrameInput: '',             // 编辑帧数输入值

        // 视频转换弹窗
        showVideoConvertModal: false,   // 显示视频转换弹窗
        isConverting: false,            // 是否正在转换
        videoConvertProgress: 0,        // 转换进度 0-100
        speedRemapConfig: {
          enabled: false,               // 是否启用变速
          keyframes: [],                // 关键帧数组: [{originalFrame, position, isEndpoint}]
          originalTotalFrames: 0,       // 原始总帧数
          originalDuration: 0,          // 原始时长(秒)
          fps: 30                        // 帧率
        },

        // Lottie转SVGA配置
        showLottieToSvgaPanel: false,
        lottieToSvgaConfig: {
          width: 0,
          height: 0,
          quality: 80,
          fps: 30
        },
        isConvertingLottieToSvga: false,
        lottieToSvgaProgress: 0,
        lottieToSvgaStage: '',
        lottieToSvgaMessage: '',
        lottieToSvgaCancelled: false,

        // 序列帧转SVGA配置
        showFramesToSvgaPanel: false,
        framesToSvgaConfig: {
          width: 0,
          height: 0,
          quality: 80,
          fps: 25
        },
        isConvertingFramesToSvga: false,
        framesToSvgaProgress: 0,
        framesToSvgaStage: '',
        framesToSvgaMessage: '',
        framesToSvgaCancelled: false,

        // 序列帧转双通道MP4配置
        showFramesToDualChannelPanel: false,
        framesToDualChannelConfig: {
          width: 0,
          height: 0,
          quality: 80,
          fps: 25,
          channelMode: 'color-left-alpha-right'
        },
        isConvertingFramesToDualChannel: false,
        framesToDualChannelProgress: 0,
        framesToDualChannelStage: '',
        framesToDualChannelMessage: '',
        framesToDualChannelCancelled: false,
        showFramesDualChannelModeDropdown: false,

        // Toast提示
        toastVisible: false,
        toastMessage: '',
        toastTimer: null,

        // 静音控制
        isMuted: false,
        yyevaHasAudio: false, // 双通道MP4视频是否包含音频轨道

        // 序列帧模式状态
        frames: {
          hasFile: false,
          files: [],       // 原始File对象数组
          fileInfo: {
            name: '',      // 显示名称（如：frame_0001.png 等 30 帧）
            size: 0,
            sizeText: '',
            fps: 25,       // 用户设置的帧率
            sizeWH: '',
            duration: ''
          },
          originalWidth: 0,
          originalHeight: 0
        },

        // 序列帧播放器实例（非响应式）
        // framesCanvas: null,
        // framesCtx: null,
        // framesAnimationId: null,
        // framesImages: [],        // 预加载的Image对象数组
        framesStartTime: 0,      // 播放开始时间戳
        framesPausedAt: 0,       // 暂停时的帧索引

        // 序列帧帧率设置弹窗
        showFramesFpsDialog: false,
        framesFpsInput: 25,      // 弹窗中的帧率输入值
        framesWasPlayingBeforeDialog: undefined // 打开帧率弹窗前的播放状态
      };
    },
    methods: {
      /* ==================== 模式切换与任务管理 ==================== */

      /**
       * 获取当前正在进行的任务列表
       * @returns {Array<{name: string, key: string, mode: string}>} 任务列表
       */
      getOngoingTasks: function () {
        var tasks = [];

        // GIF导出（SVGA和双通道MP4模式都支持）
        if (this.isExportingGIF) {
          tasks.push({
            name: 'GIF导出',
            key: 'gif',
            mode: this.currentModule
          });
        }

        // SVGA转MP4（SVGA模式）
        if (this.isConvertingMP4) {
          tasks.push({
            name: 'SVGA转MP4',
            key: 'mp4',
            mode: 'svga'
          });
        }

        // 双通道MP4转SVGA（双通道MP4模式）
        if (this.isConvertingSVGA) {
          tasks.push({
            name: '转SVGA',
            key: 'svga',
            mode: 'yyeva'
          });
        }

        // 普通MP4转SVGA（普通MP4模式）
        if (this.isConvertingMp4ToSvga) {
          tasks.push({
            name: 'MP4转SVGA',
            key: 'mp4tosvga',
            mode: 'mp4'
          });
        }

        // Lottie转SVGA（Lottie模式）
        if (this.isConvertingLottieToSvga) {
          tasks.push({
            name: 'Lottie转SVGA',
            key: 'lottietosvga',
            mode: 'lottie'
          });
        }

        // 序列帧转SVGA（序列帧模式）
        if (this.isConvertingFramesToSvga) {
          tasks.push({
            name: '序列帧转SVGA',
            key: 'framestosvga',
            mode: 'frames'
          });
        }

        return tasks;
      },

      /**
       * 取消所有正在进行的任务
       * @param {boolean} silent - 是否静默取消（不显示toast）
       * @returns {Array<string>} 被取消的任务名称列表
       */
      cancelOngoingTasks: function (silent) {
        var cancelledTasks = [];

        // 取消GIF导出
        if (this.isExportingGIF) {
          this.isExportingGIF = false;
          this.gifExportProgress = 0;
          cancelledTasks.push('GIF导出');
        }

        // 取消MP4转换
        if (this.isConvertingMP4) {
          this.isConvertingMP4 = false;
          this.mp4ConvertProgress = 0;
          this.mp4ConvertCancelled = true;
          cancelledTasks.push('SVGA转MP4');
        }

        // 取消SVGA转换
        if (this.isConvertingSVGA) {
          this.isConvertingSVGA = false;
          this.svgaConvertProgress = 0;
          this.svgaConvertCancelled = true;
          cancelledTasks.push('转SVGA');
        }

        // 取消普通MP4转SVGA
        if (this.isConvertingMp4ToSvga) {
          this.isConvertingMp4ToSvga = false;
          this.mp4ToSvgaProgress = 0;
          this.mp4ToSvgaCancelled = true;
          cancelledTasks.push('MP4转SVGA');
        }

        // 取消Lottie转SVGA
        if (this.isConvertingLottieToSvga) {
          this.isConvertingLottieToSvga = false;
          this.lottieToSvgaProgress = 0;
          this.lottieToSvgaCancelled = true;
          cancelledTasks.push('Lottie转SVGA');
        }

        // 取消序列帧转SVGA
        if (this.isConvertingFramesToSvga) {
          this.isConvertingFramesToSvga = false;
          this.framesToSvgaProgress = 0;
          this.framesToSvgaCancelled = true;
          cancelledTasks.push('序列帧转SVGA');
        }

        // 显示取消提示
        if (!silent && cancelledTasks.length > 0) {
          this.showToast('已取消：' + cancelledTasks.join('、'));
        }

        return cancelledTasks;
      },

      /**
       * 检查是否有正在进行的任务，并弹窗确认
       * @param {string} action - 操作名称（如："播放新文件"、"清空画布"、"导出GIF"）
       * @param {string} actionType - 操作类型（'load' | 'clear' | 'task'）
       * @returns {boolean} 用户是否确认继续
       */
      confirmIfHasOngoingTasks: function (action, actionType) {
        var tasks = this.getOngoingTasks();
        if (tasks.length === 0) return true;

        var taskNames = tasks.map(function (t) { return t.name; }).join('、');
        var message = '';

        // 根据操作类型生成不同的提示文案
        if (actionType === 'load') {
          // 加载文件
          message = '您的' + taskNames + '还在进行中，立即播放将退出' + taskNames + '。\n\n确定继续吗？';
        } else if (actionType === 'clear') {
          // 清空画布
          message = '您的' + taskNames + '还在进行中，清空画布将退出' + taskNames + '。\n\n确定继续吗？';
        } else if (actionType === 'task') {
          // 开始新任务
          message = '您的' + taskNames + '还在进行中，立即' + action + '可能造成卡顿。\n\n确定继续吗？';
        }

        return confirm(message);
      },

      /* ==================== 侧边弹窗管理 ==================== */

      /**
       * 关闭所有侧边弹窗
       */
      closeAllPanels: function () {
        // 右侧弹窗
        this.showMaterialPanel = false;
        this.showMP4Panel = false;
        this.showSVGAPanel = false;
        this.showMp4ToSvgaPanel = false;
        this.showGifPanel = false;
        this.showLottieToSvgaPanel = false;
        this.showFramesToSvgaPanel = false;
        this.showFramesToDualChannelPanel = false;

        // 左侧弹窗
        this.showChromaKeyPanel = false;
      },

      /**
       * 打开/关闭右侧弹窗（互斥，同时只能打开一个）
       * @param {string} panelName - 弹窗变量名
       */
      openRightPanel: function (panelName) {
        // 如果目标弹窗已打开，则关闭它
        if (this[panelName] === true) {
          this[panelName] = false;
          return;
        }

        // 否则关闭所有右侧弹窗，然后打开目标弹窗
        this.showMaterialPanel = false;
        this.showMP4Panel = false;
        this.showSVGAPanel = false;
        this.showMp4ToSvgaPanel = false;
        this.showMp4ToDualChannelPanel = false;
        this.showLottieToDualChannelPanel = false;
        this.showLottieToSvgaPanel = false;
        this.showFramesToSvgaPanel = false;
        this.showFramesToDualChannelPanel = false;
        this.showGifPanel = false;
        this[panelName] = true;
      },

      /**
       * 统一的模式切换函数
       * @param {string} targetMode - 目标模式（'svga' | 'yyeva' | 'lottie'）
       * @param {Object} options - 选项 { skipCleanup: boolean }
       */
      switchMode: function (targetMode, options) {
        options = options || {};
        var fromMode = this.currentModule;

        // 如果已经是目标模式，且不需要清理，则直接返回
        if (fromMode === targetMode && options.skipCleanup) {
          return;
        }

        // 1. 取消正在进行的任务（静默取消）
        this.cancelOngoingTasks(true);

        // 2. 清理资源（根据模式决定清理哪些）
        if (!options.skipCleanup) {
          // 同模式切换：只清理当前模式资源
          if (fromMode === targetMode) {
            if (targetMode === 'svga') {
              this.cleanupSvga();
            } else if (targetMode === 'yyeva') {
              this.cleanupYyeva();
            } else if (targetMode === 'mp4') {
              this.cleanupMp4();
            } else if (targetMode === 'lottie') {
              this.cleanupLottie();
            } else if (targetMode === 'frames') {
              this.cleanupFrames();
            }
          } else {
            // 跨模式切换：清理旧模式资源
            if (fromMode === 'svga') {
              this.cleanupSvga();
            } else if (fromMode === 'yyeva') {
              this.cleanupYyeva();
            } else if (fromMode === 'mp4') {
              this.cleanupMp4();
            } else if (fromMode === 'lottie') {
              this.cleanupLottie();
            } else if (fromMode === 'frames') {
              this.cleanupFrames();
            }
          }
        }

        // 3. 关闭所有弹窗
        this.closeAllPanels();

        // 4. 切换模式
        this.currentModule = targetMode;

        // 5. 重置视图状态
        if (this.viewportController) {
          this.viewportController.setScale(1, true);
          this.viewportController.setOffset(0, 0, true);
        } else {
          this.viewerScale = 1;
          this.viewerOffsetX = 0;
          this.viewerOffsetY = 0;
        }
      },

      /* ==================== 库加载管理器 ==================== */

      // 获取库配置
      /* ==================== 库加载管理（包装全局 libraryLoader） ==================== */

      /**
       * 加载库（统一入口）
       * @param {string|Array<string>} libKeys - 库的键名或键名数组
       * @param {boolean} highPriority - 是否高优先级
       * @returns {Promise}
       */
      loadLibrary: function (libKeys, highPriority) {
        return window.libraryLoader.load(libKeys, highPriority);
      },

      /**
       * 预加载非关键库
       */
      preloadLibraries: function () {
        window.libraryLoader.preload();
      },

      /* ==================== 文件加载与拖拽上传 ==================== */

      onDragOver: function () {
        this.dropHover = true;
      },
      onDragLeave: function () {
        this.dropHover = false;
      },
      onDrop: function (event) {
        this.dropHover = false;
        var files = event.dataTransfer && event.dataTransfer.files;
        if (!files || !files.length) return;
        this.handleFiles(files);
      },

      triggerFileUpload: function () {
        this.$refs.fileInput.click();
      },

      /**
       * 重新上传SVGA文件（用于替换当前文件）
       * 对应 index.html 中的 handleReuploadSVGA
       */
      handleReuploadSVGA: function (event) {
        var files = event.target.files;
        if (!files || files.length === 0) return;

        var file = files[0];
        // 复用现有的文件处理逻辑，但强制认为是SVGA
        if (file.name.toLowerCase().endsWith('.svga')) {
          this.handleFile(file);
        } else {
          alert('请选择有效的 SVGA 文件');
        }

        // 清空 input 值，允许重复选择同一文件
        event.target.value = '';
      },

      onFileSelect: function (event) {
        var files = event.target.files;
        if (!files || !files.length) return;
        this.handleFiles(files);
        // 清空input，允许重复选择同一文件
        event.target.value = '';
      },

      /**
       * 处理文件（支持单文件或多图片序列帧）
       * @param {FileList} files
       */
      handleFiles: function (files) {
        var filesArray = Array.prototype.slice.call(files);

        // 筛选图片文件
        var imageFiles = filesArray.filter(function (f) {
          var name = f.name.toLowerCase();
          return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg');
        });

        // 如果有多个图片文件，检查是否是序列帧格式
        if (imageFiles.length > 1 && this.isSequenceFrames(imageFiles)) {
          this.loadFrameSequence(imageFiles);
          return;
        }

        // 否则走原来的单文件处理逻辑
        if (filesArray.length >= 1) {
          this.handleFile(filesArray[0]);
        }
      },

      /**
       * 判断是否是序列帧格式
       * 注：已迁移至 file-validator.js 模块
       * @param {Array<File>} imageFiles
       * @returns {boolean}
       */
      isSequenceFrames: function (imageFiles) {
        // 调用模块化的文件验证器
        return this.fileValidator.isSequenceFrames(imageFiles);
      },

      /**
       * 统一的文件验证器（在切换模式之前预验证，避免错误文件影响当前播放）
       * 注：已迁移至 file-validator.js 模块
       * @param {File} file - 文件对象
       * @param {String} fileType - 文件类型：'svga' | 'lottie' | 'yyeva' | 'mp4'
       * @returns {Promise} - resolve(validatedData) 或 reject(errorMessage)
       */
      validateFile: function (file, fileType) {
        // 调用模块化的文件验证器
        return this.fileValidator.validateFile(file, fileType);
      },

      handleFile: function (file) {
        var _this = this;
        var name = (file.name || '').toLowerCase();
        var fileType = null;

        // 判断文件类型
        if (name.endsWith('.svga')) {
          fileType = 'svga';
        } else if (name.endsWith('.json') || name.endsWith('.lottie')) {
          fileType = 'lottie';
        } else if (name.endsWith('.mp4')) {
          // MP4需要先检测是否为双通
          this.detectMp4Type(file, function (isDualChannel) {
            var mp4Type = isDualChannel ? 'yyeva' : 'mp4';
            // 验证文件
            _this.validateFile(file, mp4Type)
              .then(function (validatedData) {
                // 验证通过，检查任务冲突
                if (!_this.confirmIfHasOngoingTasks('播放新文件', 'load')) {
                  return;
                }
                // 加载文件
                if (mp4Type === 'yyeva') {
                  _this.loadYyeva(validatedData);
                } else {
                  _this.loadMp4File(validatedData);
                }
              })
              .catch(function (errorMsg) {
                // 错误只弹提示，不影响当前播放
                alert(errorMsg);
              });
          });
          return;
        } else {
          alert('不支持的文件类型，只支持 .svga / .json / .lottie / .mp4');
          return;
        }

        // 验证文件（SVGA/Lottie）
        this.validateFile(file, fileType)
          .then(function (validatedData) {
            // 验证通过，检查任务冲突
            if (!_this.confirmIfHasOngoingTasks('播放新文件', 'load')) {
              return;
            }
            // 加载文件
            if (fileType === 'svga') {
              _this.loadSvgaFile(validatedData);
            } else if (fileType === 'lottie') {
              _this.loadLottieFile(validatedData);
            }
          })
          .catch(function (errorMsg) {
            // 错误只弹提示，不影响当前播放
            alert(errorMsg);
          });
      },

      /**
       * 检测MP4是双通道还是普通视频
       * 注：已迁移至 file-validator.js 模块
       * @param {File} file - MP4文件
       * @param {Function} callback - 回调函数，参数为isDualChannel(boolean)
       */
      detectMp4Type: function (file, callback) {
        // 调用模块化的文件验证器
        this.fileValidator.detectMp4Type(file, callback);
      },



      // 触发更换预览文件（支持SVGA、Lottie、MP4、序列帧）
      triggerChangePreviewFile: function () {
        if (this.$refs.changePreviewFileInput) {
          this.$refs.changePreviewFileInput.click();
        }
      },

      // 处理更换预览文件
      handleChangePreviewFile: function (event) {
        var file = event.target.files[0];
        if (!file) return;

        // 使用统一的文件处理流程
        this.handleFile(file);

        // 清空输入，允许重复选择同一文件
        event.target.value = '';
      },

      /* ==================== 资源清理 ==================== */

      /**
       * 清空画布，返回首页
       */
      clearAll: function () {
        var _this = this;

        // 检查是否有正在进行的任务
        if (!this.confirmIfHasOngoingTasks('清空画布', 'clear')) {
          return; // 用户取消
        }

        // 退出沉浸模式（如果当前在沉浸模式中）
        if (this.isImmersiveMode) {
          this.isImmersiveMode = false;
          // 恢复正常的headerHeight和footerHeight
          if (this.viewportController) {
            this.viewportController.setHeaderHeight(36);
            this.viewportController.setFooterHeight(154);
          }
        }

        // 0ms：先隐藏内容（启动淡出动画，200ms）
        this.footerContentVisible = false;
        this.footerTransitioning = true;

        // 200ms：内容完全淡出后，清空数据并显示空状态（启动浮层动画，300ms）
        setTimeout(function () {
          // 使用统一的模式切换函数（此时数据被清空，isEmpty变为true）
          _this.switchMode('svga');

          // 重置Lottie状态
          _this.lottie = {
            hasFile: false,
            file: null,
            fileInfo: {
              name: '',
              size: 0,
              sizeText: ''
            }
          };

          _this.bgColorKey = 'pattern';

          // 500ms：空状态动画完成，初始化空状态播放器（200+300=500ms）
          setTimeout(function () {
            _this.footerTransitioning = false;
            _this.$nextTick(function () {
              _this.initEmptyStateSvgaPlayer();
            });
          }, 300);
        }, 200);
      },

      /**
       * 恢复播放：回到刚打开文件时的初始状态
       * 
       * 功能：
       *   - 重置所有编辑操作（素材替换、绿幕抠图、变速等）
       *   - 恢复背景色到默认状态（pattern）
       *   - 重新加载原始文件
       *   - 恢复到初始视图状态
       */
      /**
       * 恢复播放：将播放器恢复到刚打开文件时的初始状态
       * 包括重置所有编辑效果（背景、素材、绿幕、变速）和播放进度
       */
      restorePlayback: function () {
        var _this = this;

        /* ==================== 1. 任务确认 ==================== */
        // 检查是否有正在进行的任务（如正在导出），避免操作冲突
        if (!this.confirmIfHasOngoingTasks('恢复播放', 'restore')) {
          return; // 用户取消
        }

        // 退出沉浸模式（如果当前在沉浸模式中）
        if (this.isImmersiveMode) {
          this.isImmersiveMode = false;
          if (this.viewportController) {
            this.viewportController.setHeaderHeight(36);
            this.viewportController.setFooterHeight(154);
          }
        }

        /* ==================== 2. 获取当前文件 ==================== */
        var currentMode = this.currentModule;
        var currentFile = null;
        var originalVideoItem = this.originalVideoItem;

        // 根据当前模式获取原始文件（支持5种模式）
        if (currentMode === 'svga' && this.svga.hasFile) {
          currentFile = this.svga.file;
        } else if (currentMode === 'yyeva' && this.yyeva.hasFile) {
          currentFile = this.yyeva.file;
        } else if (currentMode === 'mp4' && this.mp4.hasFile) {
          currentFile = this.mp4.file;
        } else if (currentMode === 'lottie' && this.lottie.hasFile) {
          currentFile = this.lottie.file;
        } else if (currentMode === 'frames' && this.frames.hasFile) {
          currentFile = this.frames.file;
        }

        if (!currentFile) {
          this.showToast('没有文件可以恢复');
          return;
        }

        /* ==================== 3. 重置所有编辑状态 ==================== */

        // 3.1 重置背景色到默认状态（pattern）
        this.bgColorKey = 'pattern';

        // 3.2 重置素材替换和压缩状态
        this.replacedImages = {};
        this.showCompressModal = false;
        this.isCompressingMaterials = false;
        this.compressProgress = 0;
        this.hasCompressedMaterials = false;
        this.preCompressMaterials = null;
        this.preCompressReplacedImages = null;

        // 3.3 重置绿幕抠图配置
        this.chromaKeyEnabled = false;
        this.chromaKeyApplied = false;
        this.chromaKeySimilarity = 40;
        this.chromaKeySmoothness = 20;
        if (this.chromaKeyRenderLoop) {
          cancelAnimationFrame(this.chromaKeyRenderLoop);
          this.chromaKeyRenderLoop = null;
        }

        // 3.4 重置变速配置（关闭编辑器并清空关键帧）
        this.showSpeedRemapEditor = false;
        this.speedRemapConfig = {
          enabled: false,
          keyframes: [],
          originalTotalFrames: 0,
          originalDuration: 0,
          fps: 30
        };
        this.selectedKeyframeIndex = -1;
        this.timelineHoverX = -1;

        /* ==================== 4. 暂停播放并重置进度 ==================== */
        // 暂停当前播放
        if (this.isPlaying) {
          this.togglePlay();
        }

        // 显式重置播放进度（确保所有模式都生效）
        // 这样即使load方法的回调没有触发（如浏览器缓存），也能保证进度被重置
        this.currentFrame = 0;
        this.currentTime = 0;
        this.progress = 0;

        /* ==================== 5. 重新加载文件 ==================== */
        // 调用各模式的load方法，重新初始化播放器
        if (currentMode === 'svga') {
          this.loadSvgaFile({
            file: currentFile,
            videoItem: originalVideoItem
          });
        } else if (currentMode === 'yyeva') {
          this.loadYyeva({
            file: currentFile
          });
        } else if (currentMode === 'mp4') {
          this.loadMp4File({ file: currentFile });
        } else if (currentMode === 'lottie') {
          this.loadLottie({ file: currentFile });
        } else if (currentMode === 'frames') {
          this.loadFrames({ file: currentFile });
        }

        this.showToast('已恢复到初始状态');
      },

      /* ==================== 工具函数 ==================== */

      /**
       * 显示Toast提示消息
       * @param {string} message - 提示消息
       */
      showToast: function (message) {
        var _this = this;
        // 清除之前的定时器
        if (this.toastTimer) {
          clearTimeout(this.toastTimer);
          this.toastTimer = null;
        }

        this.toastMessage = message;
        this.toastVisible = true;

        // 3秒后自动隐藏
        this.toastTimer = setTimeout(function () {
          _this.toastVisible = false;
          _this.toastTimer = null;
        }, 3000);
      },

      loadHelpContent: function () {
        var _this = this;
        // 先加载Marked库（低优先级，后台加载），再加载帮助文档
        this.loadLibrary('marked', false).then(function () {
          return fetch('./help.md');
        }).then(function (response) {
          return response.text();
        }).then(function (markdown) {
          _this.helpContent = marked.parse(markdown);
        }).catch(function (error) {
          _this.helpContent = '<p>无法加载帮助文档</p>';
        });
      },

      /* ==================== SVGA加载与播放 ==================== */

      /**
       * 初始化SVGA播放器
       */
      initSvgaPlayer: function () {
        var _this = this;
        var container = this.$refs.svgaContainer;
        if (!container) return;
        this.svgaPlayer = new SVGA.Player(container);
        this.svgaParser = new SVGA.Parser();

        // 设置 onFrame 回调（正确用法：调用方法，而非直接赋值）
        this.svgaPlayer.onFrame(function (frame) {
          if (_this.currentModule === 'svga' && _this.totalFrames > 0) {
            _this.currentFrame = frame;
            _this.progress = Math.round((frame / _this.totalFrames) * 100);
            _this.currentTime = frame / (_this.svgaFps || 30);
          }
        });
      },

      initEmptyStateSvgaPlayer: function (retryCount) {
        if (typeof retryCount === 'undefined') retryCount = 0;
        var _this = this;
        var container = this.$refs.emptyStateSvgaContainer;
        if (!container) {
          if (retryCount > 50) {
            return;
          }
          // 如果容器还没有渲染，等待DOM更新后重试
          setTimeout(function () {
            _this.initEmptyStateSvgaPlayer(retryCount + 1);
          }, 100);
          return;
        }

        // 创建空状态SVGA播放器
        this.emptyStateSvgaPlayer = new SVGA.Player(container);
        this.emptyStateSvgaParser = new SVGA.Parser();

        // 动态读取SVGA文件列表
        fetch('assets/svga/file-list.json')
          .then(function (response) {
            if (!response.ok) {
              throw new Error('无法加载文件列表');
            }
            return response.json();
          })
          .then(function (fileList) {
            if (!fileList || fileList.length === 0) {
              return;
            }

            // 随机选择一个文件
            var randomIndex = Math.floor(Math.random() * fileList.length);
            var fileName = fileList[randomIndex];
            var svgaUrl = 'assets/svga/' + fileName;

            // 加载并播放SVGA
            _this.emptyStateSvgaParser.load(svgaUrl, function (videoItem) {
              _this.emptyStateSvgaPlayer.setVideoItem(videoItem);
              _this.emptyStateSvgaPlayer.startAnimation();
            }, function (error) {
              alert('加载空状态SVGA失败');
            });
          })
          .catch(function (error) {
            alert('读取SVGA文件列表失败');
          });
      },

      /**
       * 加载SVGA文件（验证已完成，直接加载）
       * @param {Object} validatedData - 验证后的数据：{ videoItem, file }
       */
      loadSvgaFile: function (validatedData) {
        var _this = this;
        var file = validatedData.file;
        var videoItem = validatedData.videoItem;

        // 切换模式
        this.switchMode('svga');

        // 设置文件信息
        this.svga.hasFile = true;
        // 性能优化：File 对象为只读数据，冻结后避免 Vue 响应式监听开销
        this.svga.file = Object.freeze(file);
        this.svga.fileInfo.name = file.name;
        this.svga.fileInfo.size = file.size;
        this.svga.fileInfo.sizeText = this.formatBytes(file.size);
        this.originalVideoItem = videoItem;

        // 提取素材列表
        this.extractMaterialList(videoItem);

        // 提取音频数据（异步）
        file.arrayBuffer().then(function (arrayBuffer) {
          _this.parseSvgaAudioData(arrayBuffer);
        }).catch(function (err) {
          alert('读取SVGA文件失败');
        });

        // 设置视频信息
        try {
          if (videoItem.videoSize) {
            var w = videoItem.videoSize.width || 0;
            var h = videoItem.videoSize.height || 0;
            _this.svga.fileInfo.sizeWH = w + ' × ' + h;
            _this.svga.originalWidth = w;
            _this.svga.originalHeight = h;
          }
          _this.svga.fileInfo.fps = videoItem.FPS || videoItem.fps || null;
          var frames = videoItem.frames || videoItem.framesCount || videoItem.framesLength || 0;
          _this.totalFrames = frames;
          _this.svgaFps = _this.svga.fileInfo.fps || 30;
          _this.totalDuration = frames / _this.svgaFps;
          // 设置SVGA时长显示
          _this.svga.fileInfo.duration = _this.totalDuration.toFixed(2) + 's';
          _this.currentTime = 0;
        } catch (err) {
          // 静默失败，不影响主流程
        }

        // 启动过渡
        this.footerTransitioning = true;
        this.footerContentVisible = false;

        setTimeout(function () {
          _this.footerTransitioning = false;
          _this.footerContentVisible = true;

          // 初始化播放器
          if (!_this.svgaPlayer) {
            _this.initSvgaPlayer();
          }

          // 加载动画
          _this.svgaPlayer.setVideoItem(videoItem);

          // 重要：setVideoItem 后重新设置 onFrame 回调（防止被重置）
          _this.svgaPlayer.onFrame(function (frame) {
            if (_this.currentModule === 'svga' && _this.totalFrames > 0) {
              _this.currentFrame = frame;
              _this.progress = Math.round((frame / _this.totalFrames) * 100);
              _this.currentTime = frame / (_this.svgaFps || 30);
            }
          });

          _this.svgaPlayer.startAnimation();
          _this.isPlaying = true;
          _this.currentFrame = 0;
          _this.progress = 0;

          _this.applyCanvasBackground();

          // 计算初始缩放比例并居中（委托给 ViewportController）
          if (videoItem.videoSize && _this.viewportController) {
            _this.viewportController.resetView();
          }
        }, 400);
      },

      /**
       * 加载Lottie文件（验证已完成，直接加载）
       * @param {Object} validatedData - 验证后的数据：{ animationData, file }
       */
      loadLottieFile: function (validatedData) {
        var _this = this;
        var file = validatedData.file;
        var animationData = validatedData.animationData;

        // 切换模式
        this.switchMode('lottie');

        // 提取Lottie信息
        var width = animationData.w || animationData.width || 0;
        var height = animationData.h || animationData.height || 0;
        var frameRate = animationData.fr || 30;
        var inFrame = animationData.ip || 0;
        var outFrame = animationData.op || 0;
        var totalFramesCount = outFrame - inFrame;
        var duration = totalFramesCount / frameRate;

        // 设置文件信息
        this.lottie.hasFile = true;
        // 性能优化：File 对象为只读数据，冻结后避免 Vue 响应式监听开销
        this.lottie.file = Object.freeze(file);
        // 性能优化：Lottie 动画数据为静态JSON，冻结后减少内存占用
        this.lottie.animationData = Object.freeze(animationData);
        this.lottie.originalWidth = width;
        this.lottie.originalHeight = height;
        this.lottie.frameRate = frameRate;
        this.lottie.fileInfo.name = file.name;
        this.lottie.fileInfo.size = file.size;
        this.lottie.fileInfo.sizeText = this.formatBytes(file.size);
        this.lottie.fileInfo.fps = frameRate + ' FPS';
        this.lottie.fileInfo.sizeWH = width + 'x' + height;
        this.lottie.fileInfo.duration = duration.toFixed(2) + 's';

        this.totalFrames = totalFramesCount;
        this.currentFrame = 0;
        this.progress = 0;
        this.isPlaying = false;
        this.totalDuration = duration;
        this.currentTime = 0;

        // 启动过渡
        this.footerTransitioning = true;
        this.footerContentVisible = false;

        // 加载lottie-web库
        this.loadLibrary('lottie', true).then(function () {
          _this.initLottiePlayer();
        }).catch(function (err) {
          alert('Lottie库加载失败，请刷新页面重试');
        });
      },

      /**
       * 加载双通MP4文件（验证已完成，直接加载）
       * @param {Object} validatedData - 验证后的数据：{ file }
       */
      loadYyeva: function (validatedData) {
        var _this = this;
        var file = validatedData.file;

        // 切换模式
        this.switchMode('yyeva');

        this.yyeva.hasFile = true;
        // 性能优化：File 对象为只读数据，冻结后避免 Vue 响应式监听开销
        this.yyeva.file = Object.freeze(file);
        this.yyeva.fileInfo.name = file.name;
        this.yyeva.fileInfo.size = file.size;
        this.yyeva.fileInfo.sizeText = this.formatBytes(file.size);

        // 启动过渡
        this.footerTransitioning = true;
        this.footerContentVisible = false;

        var objectUrl = URL.createObjectURL(file);
        var video = document.createElement('video');
        video.src = objectUrl;
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;

        video.onloadedmetadata = function () {
          var videoWidth = video.videoWidth;
          var videoHeight = video.videoHeight;
          var duration = video.duration;
          var fps = 30;
          var totalFrames = Math.round(duration * fps);

          _this.yyeva.displayWidth = Math.floor(videoWidth / 2);
          _this.yyeva.displayHeight = videoHeight;
          _this.yyeva.fileInfo.sizeWH = _this.yyeva.displayWidth + ' × ' + _this.yyeva.displayHeight;
          _this.yyeva.fileInfo.fps = fps + ' FPS';
          _this.yyeva.fileInfo.duration = duration.toFixed(2) + 's';
          _this.totalFrames = totalFrames;
          _this.totalDuration = duration;
          _this.currentFrame = 0;
          _this.currentTime = 0;
          _this.progress = 0;
          _this.isPlaying = false;
          _this.yyevaVideo = video;
          _this.yyevaAlphaPosition = 'left';

          // 检测是否包含音频
          _this.yyevaHasAudio = _this.detectVideoHasAudio(video);

          setTimeout(function () {
            _this.footerTransitioning = false;
            _this.footerContentVisible = true;
            _this.initYyevaCanvas();

            // 计算初始缩放比例并居中（委托给 ViewportController）
            if (_this.viewportController) {
              _this.viewportController.resetView();
            }

            // 检测 alpha 位置并渲染第一帧
            video.onseeked = function () {
              video.onseeked = null;
              _this.detectAlphaPosition(video);
              _this.renderYyevaFrame();

              // 自动播放
              setTimeout(function () {
                video.play().then(function () {
                  _this.isPlaying = true;
                  _this.startYyevaRenderLoop();

                  // 恢复声音状态（如果在初始化时被强制静音了）
                  if (!_this.isMuted) {
                    video.muted = false;
                  }

                  // 播放后再次检测音频（针对Chrome的webkitAudioDecodedByteCount）
                  setTimeout(function () {
                    var hasAudio = _this.detectVideoHasAudio(video);
                    if (hasAudio !== _this.yyevaHasAudio) {
                      _this.yyevaHasAudio = hasAudio;
                    }
                  }, 500);
                }).catch(function (err) {
                  alert('播放失败');
                });
              }, 100);
            };
            video.currentTime = 0.1;
          }, 400);
        };

        video.onerror = function () {
          URL.revokeObjectURL(objectUrl);
          alert('视频加载失败');
        };
      },

      /**
       * 加载普通MP4文件（验证已完成，直接加载）
       * @param {Object} validatedData - 验证后的数据：{ file }
       */
      loadMp4File: function (validatedData) {
        var _this = this;
        var file = validatedData.file;

        // 切换模式
        this.switchMode('mp4');

        // 关闭变速编辑器并清空变速信息
        this.showSpeedRemapEditor = false;
        this.speedRemapConfig = {
          enabled: false,
          keyframes: [],
          originalTotalFrames: 0,
          originalDuration: 0,
          fps: 30
        };
        this.selectedKeyframeIndex = -1;

        this.mp4.hasFile = true;
        // 性能优化：File 对象为只读数据，冻结后避免 Vue 响应式监听开销
        this.mp4.file = Object.freeze(file);
        this.mp4.fileInfo.name = file.name;
        this.mp4.fileInfo.size = file.size;
        this.mp4.fileInfo.sizeText = this.formatBytes(file.size);

        // 创建objectUrl
        this.mp4ObjectUrl = URL.createObjectURL(file);

        // 创建视频元素
        var video = document.createElement('video');
        video.src = this.mp4ObjectUrl;
        video.crossOrigin = 'anonymous';
        video.muted = this.isMuted;
        video.loop = true;
        video.playsInline = true;
        // 不设置 max-width/max-height，让容器的 transform scale 生效
        video.style.cssText = 'display: block;';
        this.mp4Video = video;

        video.onloadedmetadata = function () {
          var videoWidth = video.videoWidth;
          var videoHeight = video.videoHeight;
          var duration = video.duration;
          var fps = 30;
          var totalFrames = Math.round(duration * fps);

          _this.mp4.originalWidth = videoWidth;
          _this.mp4.originalHeight = videoHeight;
          _this.mp4.fileInfo.sizeWH = videoWidth + 'x' + videoHeight;
          _this.mp4.fileInfo.fps = fps + ' FPS';
          _this.mp4.fileInfo.duration = duration.toFixed(2) + 's';
          _this.totalFrames = totalFrames;
          _this.totalDuration = duration;
          _this.currentFrame = 0;
          _this.currentTime = 0;
          _this.progress = 0;
          _this.isPlaying = false;

          // 检测是否包含音频
          _this.mp4HasAudio = _this.detectVideoHasAudio(video);

          // 将视频添加到容器
          var container = _this.$refs.svgaContainer;
          if (container) {
            container.innerHTML = '';
            container.appendChild(video);
          }

          // 计算初始缩放比例并居中（委托给 ViewportController）
          if (_this.viewportController) {
            _this.viewportController.resetView();
          }

          // 启动过渡
          _this.footerTransitioning = true;
          _this.footerContentVisible = false;

          setTimeout(function () {
            _this.footerTransitioning = false;
            _this.footerContentVisible = true;

            // 自动播放
            setTimeout(function () {
              video.play().then(function () {
                _this.isPlaying = true;
                _this.startMp4ProgressLoop();

                // 播放后再次检测音频（针对Chrome的webkitAudioDecodedByteCount）
                setTimeout(function () {
                  var hasAudio = _this.detectVideoHasAudio(video);
                  if (hasAudio !== _this.mp4HasAudio) {
                    _this.mp4HasAudio = hasAudio;
                  }
                }, 500);
              }).catch(function (err) {
                alert('播放失败');
              });
            }, 100);
          }, 400);
        };

        video.onerror = function () {
          URL.revokeObjectURL(_this.mp4ObjectUrl);
          alert('视频加载失败');
        };
      },

      /* ==================== 播放控制 ==================== */

      /**
       * 初始化播放控制器
       */
      initPlayerController: function () {
        var _this = this;

        // 如果已经初始化过，先销毁
        if (this.playerController) {
          this.playerController.destroy();
          this.playerController = null;
        }

        // 使用 $nextTick 确保 DOM 已渲染
        this.$nextTick(function () {
          var progressBar = _this.$refs.progressBar;
          var progressThumb = _this.$refs.progressThumb;

          if (progressBar && progressThumb) {
            _this.playerController = new PlayerController({
              progressBar: progressBar,
              progressThumb: progressThumb,
              onProgressChange: function (progress, currentFrame) {
                _this.progress = progress;
                _this.currentFrame = currentFrame;
              },
              onPlayStateChange: function (isPlaying) {
                _this.isPlaying = isPlaying;
              },
              getPlayerState: function () {
                return {
                  mode: _this.currentModule,
                  isPlaying: _this.isPlaying,
                  progress: _this.progress,
                  totalFrames: _this.totalFrames,
                  hasFile: _this.svga.hasFile || _this.yyeva.hasFile || _this.mp4.hasFile || _this.lottie.hasFile || _this.frames.hasFile,
                  svgaPlayer: _this.svgaPlayer,
                  lottiePlayer: _this.lottiePlayer,
                  yyevaVideo: _this.yyevaVideo,
                  yyevaAnimationId: _this.yyevaAnimationId,
                  mp4Video: _this.mp4Video,
                  speedRemapConfig: _this.speedRemapConfig,
                  startYyevaRenderLoop: function () { _this.startYyevaRenderLoop(); },
                  startMp4ProgressLoop: function () { _this.startMp4ProgressLoop(); },
                  stopFramesPlayLoop: function () { _this.stopFramesPlayLoop(); },
                  startFramesPlayLoop: function () { _this.startFramesPlayLoop(); },
                  renderYyevaFrame: function () { _this.renderYyevaFrame(); },
                  seekFramesTo: function (frame) { _this.seekFramesTo(frame); }
                };
              }
            });

            // SVGA 播放器的 onFrame 回调已在 initSvgaPlayer 中设置
          }
        });
      },

      /**
       * 初始化视图控制器
       */
      initViewportController: function () {
        var _this = this;

        // 如果已经初始化过，先销毁
        if (this.viewportController) {
          this.viewportController.destroy();
          this.viewportController = null;
        }

        this.viewportController = new ViewportController({
          getContentSize: function () {
            return _this.getContentOriginalSize();
          },
          onViewportChange: function (scale, offsetX, offsetY, isDragging) {
            _this.viewerScale = scale;
            _this.viewerOffsetX = offsetX;
            _this.viewerOffsetY = offsetY;
            if (typeof isDragging !== 'undefined') {
              _this.dragging = isDragging;
            }
            // 同步视图模式状态，用于更新按钮CLASS和TITLE
            _this.viewMode = _this.viewportController.getViewMode();
          },
          footerHeight: 154,
          screenHeightRatio: 0.75,
          minScale: 0.1,
          maxScale: 5,
          zoomStep: 0.1
        });
      },

      /**
       * 切换播放/暂停状态（使用PlayerController）
       */
      togglePlay: function () {
        if (this.playerController) {
          this.playerController.togglePlay();
        }
      },

      // 切换静音状态（已重构：统一使用PlayerController）
      toggleMute: function () {
        // 如果没有音频，不响应点击
        if (!this.hasAudio) return;

        this.isMuted = !this.isMuted;

        // 使用PlayerController统一接口
        if (this.playerController) {
          this.playerController.setMuted(this.isMuted);
        }
      },

      // 检测视频是否包含音频轨道
      detectVideoHasAudio: function (video) {
        // 方法1: 使用 audioTracks (Safari/Chrome)
        if (typeof video.audioTracks !== 'undefined' && video.audioTracks !== null) {
          return video.audioTracks.length > 0;
        }
        // 方法2: 使用 mozHasAudio (Firefox)
        if (typeof video.mozHasAudio !== 'undefined') {
          return video.mozHasAudio;
        }
        // 方法3: 尝试检查 webkitAudioDecodedByteCount（仅在视频加载后）
        if (typeof video.webkitAudioDecodedByteCount !== 'undefined') {
          // 如果视频已经加载一段时间，检查是否有音频解码
          if (video.webkitAudioDecodedByteCount > 0) {
            return true;
          }
          // 如果视频已经播放了一段时间(>0.2s)但byteCount仍为0，则认为无音频
          if (video.currentTime > 0.2) {
            return false;
          }
          // 注意：如果视频刚开始播放，这个值可能是0，但这不代表没有音频
          // 所以这里不能断定为 false，除非视频已经播放了一段时间
        }

        // 默认策略修改：如果无法确定（例如Chrome没有audioTracks且webkitAudioDecodedByteCount为0），
        // 默认为 true，以免错误地禁用静音按钮。
        // 用户如果听到没声音自然不会去点，但如果有声音却不能点就是bug。
        return true;
      },

      /* ==================== Lottie加载与播放 ==================== */

      /**
       * 初始化Lottie播放器
       */
      initLottiePlayer: function () {
        var _this = this;
        var container = this.$refs.svgaContainer;

        if (!container) return;

        // 清空容器
        container.innerHTML = '';

        // 直接让lottie-web创建canvas，不手动创建
        this.lottiePlayer = lottie.loadAnimation({
          container: container,
          renderer: 'canvas',
          loop: true,
          autoplay: false,
          animationData: this.lottie.animationData
        });

        // 监听帧更新
        this.lottiePlayer.addEventListener('enterFrame', function (e) {
          _this.currentFrame = Math.floor(e.currentTime);
          // 计算当前时间（使用保存的原始帧率）
          var fps = _this.lottie.frameRate || 30;
          _this.currentTime = e.currentTime / fps;
          // progress基于时间
          if (_this.totalDuration > 0) {
            _this.progress = Math.round((_this.currentTime / _this.totalDuration) * 100);
          } else {
            _this.progress = Math.round((e.currentTime / _this.totalFrames) * 100);
          }
        });

        // 监听循环完成
        this.lottiePlayer.addEventListener('loopComplete', function () {
          // 循环播放，重置帧数
          _this.currentFrame = 0;
          _this.progress = 0;
        });

        // 结束过渡，显示底部浮层
        setTimeout(function () {
          _this.footerTransitioning = false;
          _this.footerContentVisible = true;

          // 应用背景色
          _this.$nextTick(function () {
            _this.applyCanvasBackground();

            // 计算初始缩放比例并居中（委托给 ViewportController）
            if (_this.viewportController) {
              _this.viewportController.resetView();
            }

            // 自动播放
            setTimeout(function () {
              if (_this.lottiePlayer) {
                _this.lottiePlayer.play();
                _this.isPlaying = true;
              }
            }, 100);
          });
        }, 400);
      },

      /**
       * 清理Lottie资源
       */
      cleanupLottie: function () {
        if (this.lottiePlayer) {
          this.lottiePlayer.destroy();
          this.lottiePlayer = null;
        }

        this.lottieCanvas = null;
        this.lottieCtx = null;

        // 销毁播放控制器（清理进度条事件监听器）
        // 重要：必须在清理时销毁，否则清空画布后重新加载文件时进度条会失效
        // 原因：PlayerController.destroy() 会移除绑定在 progressBar/progressThumb 上的事件监听器
        // 如果不销毁，旧的事件监听器仍然绑定在已失效的 DOM 引用上，导致无法响应点击和拖动
        if (this.playerController) {
          this.playerController.destroy();
          this.playerController = null;
        }

        // 清空容器内容
        var container = this.$refs.svgaContainer;
        if (container) {
          container.innerHTML = '';
        }

        this.lottie = {
          hasFile: false,
          file: null,
          fileInfo: {
            name: '',
            size: 0,
            sizeText: '',
            fps: null,
            sizeWH: '',
            duration: ''
          },
          originalWidth: 0,
          originalHeight: 0,
          animationData: null
        };

        // 重置播放状态
        this.isPlaying = false;
        this.progress = 0;
        this.currentFrame = 0;
        this.totalFrames = 0;
      },

      /* ==================== 序列帧加载与播放 ==================== */

      /**
       * 排序序列帧文件（按文件名中的数字升序）
       * @param {Array<File>} files - 文件数组
       * @returns {Array<File>} 排序后的文件数组
       */
      sortFrameFiles: function (files) {
        return files.sort(function (a, b) {
          // 提取文件名中的数字
          var numA = parseInt((a.name.match(/\d+/) || ['0'])[0]);
          var numB = parseInt((b.name.match(/\d+/) || ['0'])[0]);
          return numA - numB;
        });
      },

      /**
       * 加载序列帧文件
       * @param {Array<File>} files - 图片文件数组
       */
      loadFrameSequence: function (files) {
        var _this = this;

        // 检查是否有正在进行的任务
        if (!this.confirmIfHasOngoingTasks('播放新文件', 'load')) {
          return;
        }

        // 排序文件
        var sortedFiles = this.sortFrameFiles(files);

        // 加载第一帧获取尺寸信息
        var firstFile = sortedFiles[0];
        var reader = new FileReader();

        reader.onload = function (e) {
          var img = new Image();
          img.onload = function () {
            // 切换到序列帧模式
            _this.switchMode('frames');

            // 计算总大小
            var totalSize = sortedFiles.reduce(function (sum, f) {
              return sum + f.size;
            }, 0);

            // 更新状态
            _this.frames = {
              hasFile: true,
              files: sortedFiles,
              fileInfo: {
                name: firstFile.name + ' 等 ' + sortedFiles.length + ' 帧',
                size: totalSize,
                sizeText: _this.formatBytes(totalSize),
                fps: 25,
                sizeWH: img.width + ' x ' + img.height,
                duration: (sortedFiles.length / 25).toFixed(2) + 's'
              },
              originalWidth: img.width,
              originalHeight: img.height
            };

            _this.totalFrames = sortedFiles.length;
            _this.currentFrame = 0;
            _this.progress = 0;
            _this.isPlaying = false;

            // 显示帧率设置弹窗
            _this.framesFpsInput = 25;
            _this.showFramesFpsDialog = true;

            // 预加载所有帧
            _this.preloadFrameImages();
          };
          img.src = e.target.result;
        };

        reader.readAsDataURL(firstFile);
      },

      /**
       * 预加载所有帧图片
       */
      preloadFrameImages: async function () {
        var _this = this;
        var files = this.frames.files;
        this.framesImages = [];

        for (var i = 0; i < files.length; i++) {
          var img = await this.loadImageFromFile(files[i]);
          this.framesImages.push(img);
        }

        // 加载完成，初始化播放器
        this.initFramesPlayer();
      },

      /**
       * 从文件加载图片
       * 注：已迁移至 utils.js 模块
       * @param {File} file
       * @returns {Promise<Image>}
       */
      loadImageFromFile: function (file) {
        // 使用工具库的 loadImageFromFile 方法
        // 自动管理 Blob URL 并记录到 framesBlobUrls 数组
        if (!this.framesBlobUrls) {
          this.framesBlobUrls = [];
        }
        return this.utils.loadImageFromFile(file, this.framesBlobUrls);
      },

      /**
       * 初始化序列帧播放器
       */
      initFramesPlayer: function () {
        var _this = this;
        var container = this.$refs.svgaContainer;
        if (!container) return;

        // 清空容器
        container.innerHTML = '';

        // 创建Canvas
        var canvas = document.createElement('canvas');
        canvas.width = this.frames.originalWidth;
        canvas.height = this.frames.originalHeight;
        canvas.style.width = this.frames.originalWidth + 'px';
        canvas.style.height = this.frames.originalHeight + 'px';
        container.appendChild(canvas);

        this.framesCanvas = canvas;
        this.framesCtx = canvas.getContext('2d', { alpha: true });

        // 应用背景色
        this.applyCanvasBackground();

        // 渲染第一帧
        this.renderFramesFrame(0);

        // 注意：不在这里启动过渡和缩放居中，等待用户确认帧率后再执行
      },

      /**
       * 渲染指定帧
       * @param {number} frameIndex
       */
      renderFramesFrame: function (frameIndex) {
        if (!this.framesCtx || !this.framesImages.length) return;

        var img = this.framesImages[frameIndex];
        if (!img) return;

        var ctx = this.framesCtx;
        ctx.clearRect(0, 0, this.framesCanvas.width, this.framesCanvas.height);
        ctx.drawImage(img, 0, 0);

        this.currentFrame = frameIndex;
        // 计算当前时间
        var fps = this.frames.fileInfo.fps || 25;
        this.currentTime = frameIndex / fps;
        // progress基于时间
        if (this.totalDuration > 0) {
          this.progress = (this.currentTime / this.totalDuration) * 100 || 0;
        } else {
          this.progress = (frameIndex / (this.totalFrames - 1)) * 100 || 0;
        }
      },

      /**
       * 开始序列帧播放循环
       */
      startFramesPlayLoop: function () {
        var _this = this;
        var fps = this.frames.fileInfo.fps || 25;
        var frameDuration = 1000 / fps;

        this.framesStartTime = performance.now() - (this.currentFrame * frameDuration);

        var loop = function (timestamp) {
          if (!_this.isPlaying || _this.currentModule !== 'frames') return;

          var elapsed = timestamp - _this.framesStartTime;
          var frameIndex = Math.floor(elapsed / frameDuration) % _this.totalFrames;

          _this.renderFramesFrame(frameIndex);
          _this.framesAnimationId = requestAnimationFrame(loop);
        };

        this.framesAnimationId = requestAnimationFrame(loop);
      },

      /**
       * 停止序列帧播放
       */
      stopFramesPlayLoop: function () {
        if (this.framesAnimationId) {
          cancelAnimationFrame(this.framesAnimationId);
          this.framesAnimationId = null;
        }
      },

      /**
       * 序列帧跳转到指定帧
       * @param {number} frameIndex
       */
      seekFramesTo: function (frameIndex) {
        if (frameIndex < 0) frameIndex = 0;
        if (frameIndex >= this.totalFrames) frameIndex = this.totalFrames - 1;

        this.renderFramesFrame(frameIndex);

        // 如果正在播放，重置开始时间
        if (this.isPlaying) {
          var fps = this.frames.fileInfo.fps || 25;
          var frameDuration = 1000 / fps;
          this.framesStartTime = performance.now() - (frameIndex * frameDuration);
        }
      },

      /**
       * 确认帧率设置
       */
      confirmFramesFps: function () {
        var _this = this;
        var fps = parseInt(this.framesFpsInput) || 25;
        if (fps < 1) fps = 1;
        if (fps > 120) fps = 120;

        this.frames.fileInfo.fps = fps;
        this.frames.fileInfo.duration = (this.totalFrames / fps).toFixed(2) + 's';
        this.showFramesFpsDialog = false;

        // 设置总时长
        this.totalDuration = this.totalFrames / fps;
        this.currentTime = 0;

        // 如果是首次设置（预加载后），启动过渡动画并开始播放
        // 如果是改变帧率，则恢复之前的播放状态
        if (typeof this.framesWasPlayingBeforeDialog === 'undefined') {
          // 首次设置，启动过渡动画和缩放居中
          this.footerTransitioning = true;
          this.footerContentVisible = false;

          setTimeout(function () {
            // 过渡完成，显示内容
            _this.footerTransitioning = false;
            _this.footerContentVisible = true;

            // 使用$nextTick确保DOM更新后再计算位置
            _this.$nextTick(function () {
              // 计算初始缩放比例并居中（委托给 ViewportController）
              if (_this.viewportController) {
                _this.viewportController.resetView();
              }

              // 再等待50ms让内容渲染，然后开始播放
              setTimeout(function () {
                _this.isPlaying = true;
                _this.startFramesPlayLoop();
              }, 50);
            });
          }, 400);
        } else {
          // 改变帧率，恢复之前的播放状态
          if (this.framesWasPlayingBeforeDialog) {
            this.isPlaying = true;
            this.startFramesPlayLoop();
          }
          // 清除标记
          this.framesWasPlayingBeforeDialog = undefined;
        }
      },



      /**
       * 打开改变帧率弹窗
       */
      openChangeFpsDialog: function () {
        this.framesFpsInput = this.frames.fileInfo.fps || 25;
        this.showFramesFpsDialog = true;

        // 记录当前播放状态，但暂停播放
        this.framesWasPlayingBeforeDialog = this.isPlaying;
        if (this.isPlaying) {
          this.isPlaying = false;
          this.stopFramesPlayLoop();
        }
      },

      /**
       * 清理序列帧资源
       */
      cleanupFrames: function () {
        this.stopFramesPlayLoop();

        // 释放所有 Blob URL（性能优化：防止内存泄漏）
        if (this.framesBlobUrls && this.framesBlobUrls.length > 0) {
          this.utils.revokeObjectURLs(this.framesBlobUrls);
          this.framesBlobUrls = [];
        }

        this.framesCanvas = null;
        this.framesCtx = null;
        this.framesImages = [];

        // 销毁播放控制器（清理进度条事件监听器）
        // 重要：必须在清理时销毁，否则清空画布后重新加载文件时进度条会失效
        if (this.playerController) {
          this.playerController.destroy();
          this.playerController = null;
        }

        // 清空容器内容
        var container = this.$refs.svgaContainer;
        if (container) {
          container.innerHTML = '';
        }

        this.frames = {
          hasFile: false,
          files: [],
          fileInfo: {
            name: '',
            size: 0,
            sizeText: '',
            fps: 25,
            sizeWH: '',
            duration: ''
          },
          originalWidth: 0,
          originalHeight: 0
        };

        // 重置播放状态
        this.isPlaying = false;
        this.progress = 0;
        this.currentFrame = 0;
        this.totalFrames = 0;
      },

      /* ==================== 双通道MP4加载与播放 ==================== */

      // 检测 alpha 通道位置
      detectAlphaPosition: function (video) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        var halfWidth = Math.floor(video.videoWidth / 2);
        var height = video.videoHeight;

        canvas.width = video.videoWidth;
        canvas.height = height;
        ctx.drawImage(video, 0, 0);

        // 取左侧中心区域的像素
        var leftData = ctx.getImageData(halfWidth / 4, height / 4, 10, 10);
        // 取右侧中心区域的像素
        var rightData = ctx.getImageData(halfWidth + halfWidth / 4, height / 4, 10, 10);

        // 计算色彩方差（灰度图的RGB将非常接近）
        var leftVariance = this.calculateColorVariance(leftData.data);
        var rightVariance = this.calculateColorVariance(rightData.data);

        // 方差小的一侧更可能是灰度图（Alpha通道）
        if (leftVariance < rightVariance) {
          this.yyeva.alphaPosition = 'left';
        } else {
          this.yyeva.alphaPosition = 'right';
        }
      },

      // 计算色彩方差
      calculateColorVariance: function (data) {
        var variance = 0;
        for (var i = 0; i < data.length; i += 4) {
          var r = data[i];
          var g = data[i + 1];
          var b = data[i + 2];
          // 计算RGB差异
          var diff = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
          variance += diff;
        }
        return variance;
      },

      // 初始化 双通道MP4 Canvas
      initYyevaCanvas: function () {
        var container = this.$refs.svgaContainer;
        if (!container) return;

        // 清空容器
        container.innerHTML = '';

        // 创建显示Canvas
        var canvas = document.createElement('canvas');
        canvas.width = this.yyeva.displayWidth;
        canvas.height = this.yyeva.displayHeight;
        canvas.style.width = this.yyeva.displayWidth + 'px';
        canvas.style.height = this.yyeva.displayHeight + 'px';
        container.appendChild(canvas);

        this.yyevaCanvas = canvas;
        this.yyevaCtx = canvas.getContext('2d', { willReadFrequently: true });

        // 创建复用的临时Canvas（用于提取视频帧数据，避免每帧创建新Canvas）
        // 性能优化：复用临时Canvas减少GC压力，提升渲染帧率稳定性
        this.yyevaTempCanvas = document.createElement('canvas');
        this.yyevaTempCtx = this.yyevaTempCanvas.getContext('2d', { willReadFrequently: true });
      },

      // 双通道MP4 渲染循环
      startYyevaRenderLoop: function () {
        var _this = this;

        function render() {
          if (!_this.yyevaVideo || !_this.yyevaCanvas || !_this.yyevaCtx) {
            return;
          }

          _this.renderYyevaFrame();
          _this.updateYyevaProgress();

          _this.yyevaAnimationId = requestAnimationFrame(render);
        }

        render();
      },

      // 渲染 双通道MP4 帧
      renderYyevaFrame: function () {
        var video = this.yyevaVideo;
        var canvas = this.yyevaCanvas;
        var ctx = this.yyevaCtx;

        if (!video || !canvas || !ctx) return;

        var halfWidth = Math.floor(video.videoWidth / 2);
        var height = video.videoHeight;

        // 确定彩色和Alpha的位置
        var colorX = this.yyeva.alphaPosition === 'right' ? 0 : halfWidth;
        var alphaX = this.yyeva.alphaPosition === 'right' ? halfWidth : 0;

        // 复用临时Canvas（性能优化：避免每帧创建新Canvas，减少GC和内存分配）
        var tempCanvas = this.yyevaTempCanvas;
        var tempCtx = this.yyevaTempCtx;

        // 仅在尺寸变化时调整Canvas大小
        if (tempCanvas.width !== video.videoWidth || tempCanvas.height !== height) {
          tempCanvas.width = video.videoWidth;
          tempCanvas.height = height;
        }

        tempCtx.drawImage(video, 0, 0);

        // 提取彩色和Alpha数据
        var colorData = tempCtx.getImageData(colorX, 0, halfWidth, height);
        var alphaData = tempCtx.getImageData(alphaX, 0, halfWidth, height);

        // 合成透明通道（处理预乘Alpha）
        for (var i = 0; i < colorData.data.length; i += 4) {
          var alpha = alphaData.data[i]; // 使用Alpha通道的R值作为透明度

          if (alpha > 0) {
            // 反预乘：将预乘的RGB值还原
            colorData.data[i] = Math.min(255, (colorData.data[i] * 255) / alpha);
            colorData.data[i + 1] = Math.min(255, (colorData.data[i + 1] * 255) / alpha);
            colorData.data[i + 2] = Math.min(255, (colorData.data[i + 2] * 255) / alpha);
          }

          colorData.data[i + 3] = alpha;
        }

        // 清除画布（避免黑边）
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制到显示Canvas
        ctx.putImageData(colorData, 0, 0);
      },

      // 更新 双通道MP4 进度
      updateYyevaProgress: function () {
        if (!this.yyevaVideo) return;

        var video = this.yyevaVideo;
        var currentTime = video.currentTime;
        var duration = video.duration || 1;

        this.currentTime = currentTime;
        this.totalDuration = duration;
        this.progress = (currentTime / duration) * 100;
        this.currentFrame = Math.round(currentTime * 30); // 假设30fps
      },

      /**
       * 清理SVGA资源
       */
      cleanupSvga: function () {
        // 停止并清理SVGA播放器
        if (this.svgaPlayer) {
          try {
            this.svgaPlayer.stopAnimation();
            this.svgaPlayer.clear();
          } catch (e) {
            // 静默失败
          }
          this.svgaPlayer = null;
        }

        // 清理SVGA音频
        if (this.svgaAudioPlayer) {
          try {
            this.svgaAudioPlayer.stop();
            this.svgaAudioPlayer.unload();
          } catch (e) {
            // 静默失败
          }
          this.svgaAudioPlayer = null;
        }

        // 清理objectUrl
        if (this.svgaObjectUrl) {
          URL.revokeObjectURL(this.svgaObjectUrl);
          this.svgaObjectUrl = null;
        }

        // 销毁播放控制器（清理进度条事件监听器）
        // 重要：必须在清理时销毁，否则清空画布后重新加载文件时进度条会失效
        if (this.playerController) {
          this.playerController.destroy();
          this.playerController = null;
        }

        // 清空容器内容
        var container = this.$refs.svgaContainer;
        if (container) {
          container.innerHTML = '';
        }

        // 重置SVGA状态
        this.svga = {
          hasFile: false,
          file: null,
          fileInfo: {
            name: '',
            size: 0,
            sizeText: '',
            fps: null,
            sizeWH: ''
          }
        };

        // 重置SVGA音频数据
        this.svgaAudioData = null;
        this.svgaMovieData = null;

        // 重置播放状态
        this.isPlaying = false;
        this.progress = 0;
        this.currentFrame = 0;
        this.totalFrames = 0;
      },

      /**
       * 清理双通道MP4资源
       */
      cleanupYyeva: function () {
        if (this.yyevaAnimationId) {
          cancelAnimationFrame(this.yyevaAnimationId);
          this.yyevaAnimationId = null;
        }

        if (this.yyevaVideo) {
          // 先移除事件监听，避免设置src=''时触发onerror
          this.yyevaVideo.onerror = null;
          this.yyevaVideo.onloadedmetadata = null;
          this.yyevaVideo.pause();
          this.yyevaVideo.src = '';
          this.yyevaVideo = null;
        }

        if (this.yyevaObjectUrl) {
          URL.revokeObjectURL(this.yyevaObjectUrl);
          this.yyevaObjectUrl = null;
        }

        this.yyevaCanvas = null;
        this.yyevaCtx = null;

        // 清理复用的临时Canvas（性能优化相关资源）
        this.yyevaTempCanvas = null;
        this.yyevaTempCtx = null;

        // 销毁播放控制器（清理进度条事件监听器）
        // 重要：必须在清理时销毁，否则清空画布后重新加载文件时进度条会失效
        if (this.playerController) {
          this.playerController.destroy();
          this.playerController = null;
        }

        // 清空容器内容（移除双通道MP4的Canvas）
        var container = this.$refs.svgaContainer;
        if (container) {
          container.innerHTML = '';
        }

        this.yyeva = {
          hasFile: false,
          file: null,
          fileInfo: {
            name: '',
            size: 0,
            sizeText: '',
            fps: null,
            sizeWH: '',
            duration: ''
          },
          alphaPosition: 'right',
          originalWidth: 0,
          originalHeight: 0,
          displayWidth: 0,
          displayHeight: 0
        };

        // 重置双通道MP4音频状态
        this.yyevaHasAudio = false;
      },

      /* ==================== 普通MP4加载与播放 ==================== */

      /**
       * 普通MP4进度更新循环（支持变速）
       */
      startMp4ProgressLoop: function () {
        var _this = this;
        var video = this.mp4Video;
        if (!video) return;

        // 缓存当前区间的速度，避免每帧重复计算
        var currentSpeed = 1.0;
        var currentSegmentIndex = -1;
        var lastTime = -1;
        var stuckCount = 0;
        var maxStuckFrames = 120; // 2秒无进度视为卡死（60fps * 2）
        var hasWarned = false; // 防止重复警告

        function updateProgress() {
          if (!_this.mp4Video || _this.currentModule !== 'mp4') return;

          // 检测视频是否卡住
          if (lastTime === video.currentTime && !video.paused && !video.ended) {
            stuckCount++;
            if (stuckCount >= maxStuckFrames && !hasWarned) {
              hasWarned = true;
              video.pause();
              _this.isPlaying = false;

              // 显示转换确认弹窗
              _this.showVideoConvertModal = true;
              _this.videoConvertProgress = 0;
              _this.isConverting = false;
              return;
            }
          } else {
            stuckCount = 0;
          }
          lastTime = video.currentTime;

          if (video.duration > 0) {
            var fps = parseFloat(_this.mp4.fileInfo.fps) || 30;
            var currentFrame = Math.floor(video.currentTime * fps);

            // 变速时，进度基于变速后时间轴的position（匀速）
            if (_this.speedRemapConfig.enabled && _this.speedRemapConfig.keyframes.length >= 2) {
              var keyframes = _this.speedRemapConfig.keyframes;
              var totalFrames = _this.speedRemapConfig.originalTotalFrames || 1;

              // 优化：合并两个循环，一次遍历同时完成位置计算和区间查找
              var remappedPosition = 0;
              var segmentIndex = -1;

              for (var i = 0; i < keyframes.length - 1; i++) {
                var k1 = keyframes[i];
                var k2 = keyframes[i + 1];

                if (currentFrame >= k1.originalFrame && currentFrame <= k2.originalFrame) {
                  // 找到了当前帧所在的区间
                  segmentIndex = i;

                  // 同时计算remappedPosition
                  var frameDelta = k2.originalFrame - k1.originalFrame;
                  if (frameDelta > 0) {
                    var frameProgress = (currentFrame - k1.originalFrame) / frameDelta;
                    remappedPosition = k1.position + frameProgress * (k2.position - k1.position);
                  } else {
                    remappedPosition = k1.position;
                  }

                  break; // 找到区间后立即退出循环
                }
              }

              // 更新进度显示
              var lastKeyframe = keyframes[keyframes.length - 1];
              var remappedDuration = video.duration * lastKeyframe.position;
              _this.progress = (remappedPosition / lastKeyframe.position) * 100;
              _this.currentTime = remappedPosition * video.duration;
              _this.totalDuration = remappedDuration;

              // 只在区间变化时重新计算并更新播放速度
              if (segmentIndex !== currentSegmentIndex && segmentIndex !== -1) {
                currentSegmentIndex = segmentIndex;
                var k1 = keyframes[segmentIndex];
                var k2 = keyframes[segmentIndex + 1];
                var frameDelta = k2.originalFrame - k1.originalFrame;
                var positionDelta = k2.position - k1.position;

                if (positionDelta > 0 && frameDelta > 0) {
                  currentSpeed = frameDelta / (positionDelta * totalFrames);
                  currentSpeed = Math.max(0.1, Math.min(12, currentSpeed));

                  // 区间变化时直接更新playbackRate
                  video.playbackRate = currentSpeed;
                }
              }
            } else {
              _this.currentTime = video.currentTime;
              _this.totalDuration = video.duration;
              _this.progress = (video.currentTime / video.duration) * 100;

              // 未启用变速时恢复正常速度
              if (video.playbackRate !== 1) {
                video.playbackRate = 1;
              }
            }
            _this.currentFrame = currentFrame;
          }

          if (_this.isPlaying) {
            requestAnimationFrame(updateProgress);
          }
        }

        requestAnimationFrame(updateProgress);
      },

      /**
       * 清理普通MP4资源
       */
      cleanupMp4: function () {
        // 停止绿幕抠图渲染循环
        if (this.chromaKeyRenderLoop) {
          cancelAnimationFrame(this.chromaKeyRenderLoop);
          this.chromaKeyRenderLoop = null;
        }

        if (this.mp4Video) {
          this.mp4Video.onerror = null;
          this.mp4Video.onloadedmetadata = null;
          this.mp4Video.pause();
          this.mp4Video.src = '';
          this.mp4Video = null;
        }

        if (this.mp4ObjectUrl) {
          URL.revokeObjectURL(this.mp4ObjectUrl);
          this.mp4ObjectUrl = null;
        }

        // 销毁播放控制器（清理进度条事件监听器）
        // 重要：必须在清理时销毁，否则清空画布后重新加载文件时进度条会失效
        if (this.playerController) {
          this.playerController.destroy();
          this.playerController = null;
        }

        // 清空容器内容
        var container = this.$refs.svgaContainer;
        if (container) {
          container.innerHTML = '';
        }

        this.mp4 = {
          hasFile: false,
          file: null,
          fileInfo: {
            name: '',
            size: 0,
            sizeText: '',
            fps: null,
            sizeWH: '',
            duration: ''
          },
          originalWidth: 0,
          originalHeight: 0
        };

        // 重置普通MP4音频状态
        this.mp4HasAudio = false;

        // 重置绿幕抠图状态
        this.chromaKeyEnabled = false;
        this.chromaKeyApplied = false;
      },

      /**
       * 确认转换视频
       */
      confirmConvertVideo: async function () {
        var _this = this;

        if (this.isConverting) {
          // 正在转换，确认是否退出
          if (confirm('当前正在转换视频格式，是否退出转换？')) {
            this.isConverting = false;
            this.showVideoConvertModal = false;
          }
          return;
        }

        this.isConverting = true;
        this.videoConvertProgress = 0;

        try {
          // 1. 加载FFmpeg
          await this.loadFFmpeg();
          this.videoConvertProgress = 10;

          if (!this.isConverting) throw new Error('用户取消');

          // 2. 读取原始视频文件
          var file = this.mp4.file;
          if (!file) throw new Error('视频文件不存在');

          var fileData = await file.arrayBuffer();
          this.ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(fileData));
          this.videoConvertProgress = 20;

          if (!this.isConverting) throw new Error('用户取消');

          // 3. 转换为兼容格式
          this.ffmpeg.setProgress(function (p) {
            // 进度 20-90%
            _this.videoConvertProgress = 20 + Math.round(p.ratio * 70);
          });

          // 检查视频尺寸，如果太大则缩小到1280p
          var maxWidth = 1280;
          var scaleFilter = '';

          // 由于无法直接获取视频尺寸，使用-vf scale限制最大宽度
          scaleFilter = 'scale=\'min(' + maxWidth + ',iw)\':-2';

          await this.ffmpeg.run(
            '-i', 'input.mp4',
            '-vf', scaleFilter,
            '-c:v', 'libx264',
            '-profile:v', 'baseline',
            '-level', '3.0',
            '-crf', '28',  // 提高CRF降低码率
            '-preset', 'ultrafast',  // 使用最快预设
            '-c:a', 'aac',
            '-b:a', '96k',  // 降低音频码率
            '-max_muxing_queue_size', '1024',
            'output.mp4'
          );

          if (!this.isConverting) throw new Error('用户取消');

          this.videoConvertProgress = 90;

          // 4. 读取转换后的文件
          var outputData = this.ffmpeg.FS('readFile', 'output.mp4');
          var blob = new Blob([outputData.buffer], { type: 'video/mp4' });

          // 清理FFmpeg文件系统
          this.ffmpeg.FS('unlink', 'input.mp4');
          this.ffmpeg.FS('unlink', 'output.mp4');

          this.videoConvertProgress = 95;

          // 5. 重新加载视频
          var convertedFile = new File([blob], file.name.replace(/\.mp4$/, '_converted.mp4'), { type: 'video/mp4' });

          // 清理旧视频
          this.cleanupMp4();

          // 重新加载视频（直接使用blob）
          this.currentModule = 'mp4';
          this.mp4.hasFile = true;
          // 性能优化：File 对象为只读数据，冻结后避免 Vue 响应式监听开销
          this.mp4.file = Object.freeze(convertedFile);
          this.mp4.fileInfo.name = convertedFile.name;
          this.mp4.fileInfo.size = convertedFile.size;
          this.mp4.fileInfo.sizeText = this.formatBytes(convertedFile.size);

          // 创建objectUrl
          this.mp4ObjectUrl = URL.createObjectURL(blob);

          // 创建视频元素
          var newVideo = document.createElement('video');
          newVideo.src = this.mp4ObjectUrl;
          newVideo.loop = true;
          newVideo.playsInline = true;
          // 不设置 max-width/max-height，让容器的 transform scale 生效
          newVideo.style.cssText = 'display: block;';
          this.mp4Video = newVideo;

          // 加载视频元数据
          newVideo.onloadedmetadata = function () {
            var videoWidth = newVideo.videoWidth;
            var videoHeight = newVideo.videoHeight;

            _this.mp4.originalWidth = videoWidth;
            _this.mp4.originalHeight = videoHeight;
            _this.mp4.fileInfo.sizeWH = videoWidth + 'x' + videoHeight;

            var duration = newVideo.duration;
            _this.mp4.fileInfo.duration = duration.toFixed(2) + 's';
            _this.mp4.fileInfo.fps = '30 FPS';
            _this.totalFrames = Math.round(duration * 30);

            _this.mp4HasAudio = _this.detectVideoHasAudio(newVideo);

            // 将视频元素添加到容器
            var container = _this.$refs.svgaContainer;
            if (container) {
              container.innerHTML = '';
              container.appendChild(newVideo);
            }

            // 计算初始缩放比例
            if (_this.viewportController) {
              _this.viewportController.resetView();
            }

            // 启动过渡
            _this.footerTransitioning = true;
            _this.footerContentVisible = false;

            setTimeout(function () {
              _this.footerTransitioning = false;
              _this.footerContentVisible = true;

              setTimeout(function () {
                newVideo.play().then(function () {
                  _this.isPlaying = true;
                  _this.startMp4ProgressLoop();
                }).catch(function (err) {
                  alert('普通MP4播放失败');
                });
              }, 50);
            }, 400);
          };

          this.videoConvertProgress = 100;

          // 延迟关闭弹窗
          setTimeout(function () {
            _this.showVideoConvertModal = false;
            _this.isConverting = false;
          }, 500);

        } catch (error) {
          if (error.message !== '用户取消') {
            alert('视频转换失败：' + error.message);
          }

          this.showVideoConvertModal = false;
          this.isConverting = false;
        }
      },

      /**
       * 取消转换视频
       */
      cancelConvertVideo: function () {
        if (this.isConverting) {
          if (confirm('当前正在转换视频格式，是否退出转换？')) {
            this.isConverting = false;
            this.showVideoConvertModal = false;
          }
        } else {
          this.showVideoConvertModal = false;
        }
      },

      /* ==================== UI交互 ==================== */

      /**
       * 切换主题模式
       */
      toggleTheme: function () {
        this.isDarkMode = !this.isDarkMode;
        if (this.isDarkMode) {
          document.body.classList.add('dark-mode');
          localStorage.setItem('theme', 'dark');
        } else {
          document.body.classList.remove('dark-mode');
          localStorage.setItem('theme', 'light');
        }
      },

      /* 缩放 + 平移 */

      /**
       * 滚轮事件处理 (onWheel)
       * 功能：
       *   - Ctrl+滚轮：缩放（改变 scale，保持当前位置）
       *   - 普通滚轮：缩放（改变 scale，保持当前位置）
       * 注意：所有缩放操作都不会移动播放器位置
       */
      onWheel: function (event) {
        if (!this.viewportController) return;
        this.viewportController.handleWheel(event);
      },

      onMouseDown: function (event) {
        if (!this.viewportController) return;
        this.viewportController.handleMouseDown(event);
      },

      onMouseMove: function (event) {
        if (!this.viewportController) return;
        this.viewportController.handleMouseMove(event);
      },

      onMouseUp: function (event) {
        if (!this.viewportController) return;
        this.viewportController.handleMouseUp(event);
      },



      // 计算初始缩放比例，使播放器高度为屏幕高度的75%
      /**
       * 获取当前播放器内容的原始尺寸 (getContentOriginalSize)
       * 返回值：{width, height} 或 null
       * 用途：统一获取各模式（SVGA/Lottie/YYEVA/MP4）的内容原始尺寸
       */
      getContentOriginalSize: function () {
        if (this.currentModule === 'svga' && this.svga.hasFile) {
          var sizeWH = this.svga.fileInfo.sizeWH;
          if (sizeWH) {
            var parts = sizeWH.split(' × ');
            if (parts.length === 2) {
              return { width: parseInt(parts[0]), height: parseInt(parts[1]) };
            }
          }
        } else if (this.currentModule === 'lottie' && this.lottie.hasFile) {
          return { width: this.lottie.originalWidth, height: this.lottie.originalHeight };
        } else if (this.currentModule === 'yyeva' && this.yyeva.hasFile) {
          return { width: this.yyeva.displayWidth, height: this.yyeva.displayHeight };
        } else if (this.currentModule === 'mp4' && this.mp4.hasFile) {
          return { width: this.mp4.originalWidth, height: this.mp4.originalHeight };
        } else if (this.currentModule === 'frames' && this.frames.hasFile) {
          return { width: this.frames.originalWidth, height: this.frames.originalHeight };
        }
        return null;
      },

      /**
       * 居中播放器 (centerViewer)
       * 调用时机：拖入文件、点击 1:1 按钮时
       * 功能：计算 offsetY 让播放器在可用区域内垂直居中
       * 布局基础：
       *   - .viewer-area 使用 align-items: flex-start，内容从 y=0 开始
       *   - .viewer-area 的 padding-bottom: 154px 为底部浮层留空
       *   - .viewer-container 使用 transform-origin: top center，缩放从顶部开始
       * 计算逻辑：
       *   1. 可用高度 = 窗口高度 - 底部浮层高度(154px)
       *   2. 内容高度 = 原始高度 * viewerScale
       *   3. 如果内容 < 可用高度：offsetY = (可用高度 - 内容高度) / 2
       *   4. 如果内容 >= 可用高度：offsetY = 0（顶部对齐）
       */
      /**
       * 居中视图（委托给 ViewportController）
       */
      centerViewer: function () {
        if (!this.viewportController) return;
        this.viewportController.centerView();
      },

      /**
       * 放大 (zoomIn)
       * 功能：每次增加 10% 缩放，围绕播放器中心点缩放
       * 实现：调整 offsetY 补偿 transform-origin: top center 的效果
       */
      /**
       * 放大（委托给 ViewportController）
       */
      zoomIn: function () {
        if (!this.viewportController) return;
        this.viewportController.zoomIn();
      },

      /**
       * 缩小（委托给 ViewportController）
       */
      zoomOut: function () {
        if (!this.viewportController) return;
        this.viewportController.zoomOut();
      },

      /**
       * 切换视图模式（1:1 ↔ 适应屏幕高度）
       * 
       * 功能：
       *   - 当前是适应屏幕高度 → 切换到1:1，按钮变成contain图标
       *   - 当前是1:1 → 切换到适应屏幕高度，按钮变成1:1图标
       *   - 无论用户过程中怎么缩放，都只简单切换状态
       * 
       * 实现逻辑：
       *   1. 调用 viewportController.toggleViewMode() 切换视图
       *   2. viewportController 内部会更新 viewMode 状态
       *   3. 通过 onViewportChange 回调同步到 Vue 的 viewMode 数据
       *   4. Vue 响应式更新按钮的 class 和 title
       */
      resetScale: function () {
        if (!this.viewportController) return;
        this.viewportController.toggleViewMode();
        // 同步视图模式状态
        this.viewMode = this.viewportController.getViewMode();
      },

      /**
       * 切换沉浸模式
       * 沉浸模式：隐藏标题栏，底部浮层变为mini浮层
       * 给用户更大的展示动画空间
       */
      toggleImmersiveMode: function () {
        var _this = this;
        this.isImmersiveMode = !this.isImmersiveMode;

        // 清除之前的定时器
        if (this.modeNameFadeTimer) {
          clearTimeout(this.modeNameFadeTimer);
          this.modeNameFadeTimer = null;
        }

        if (this.isImmersiveMode) {
          // 进入沉浸模式：显示模式名称，5s后淡出
          this.modeNameFadeOut = false;
          this.modeNameFadeTimer = setTimeout(function () {
            _this.modeNameFadeOut = true;
          }, 5000);
        } else {
          // 退出沉浸模式：立即显示模式名称
          this.modeNameFadeOut = false;
        }

        // 更新viewport-controller的headerHeight和footerHeight
        if (this.viewportController) {
          // 沉浸模式：headerHeight=0（标题栏隐藏），footerHeight=80px（mini浮层）
          // 正常模式：headerHeight=36px，footerHeight=154px
          var newHeaderHeight = this.isImmersiveMode ? 0 : 36;
          var newFooterHeight = this.isImmersiveMode ? 80 : 154;
          this.viewportController.setHeaderHeight(newHeaderHeight);
          this.viewportController.setFooterHeight(newFooterHeight);
          // 重新居中视图，因为可用高度变了
          this.viewportController.centerView();
        }
      },

      applyCanvasBackground: function () {
        var container = this.$refs.svgaContainer;
        if (!container) return;
        var canvas = container.querySelector('canvas');
        if (canvas) {
          if (this.bgColorKey === 'pattern') {
            // pattern模式：完全清除canvas背景，显示画布颜色
            canvas.style.backgroundColor = '';
            canvas.style.backgroundImage = '';
            canvas.style.backgroundRepeat = '';
            canvas.style.backgroundSize = '';
          } else {
            canvas.style.backgroundColor = this.currentBgColor;
            canvas.style.backgroundImage = 'none';
          }
        }
      },

      /* ==================== 素材替换功能 ==================== */

      /**
       * 打开素材替换弹窗（SVGA模式右侧弹窗）
       */
      openMaterialPanel: function () {
        if (!this.svga.hasFile || !this.originalVideoItem) return;

        // 使用统一的右侧弹窗管理
        this.openRightPanel('showMaterialPanel');
      },

      /**
       * 关闭素材替换弹窗
       */
      closeMaterialPanel: function () {
        this.showMaterialPanel = false;
      },

      copyMaterialName: function (name) {
        this.utils.copyToClipboard(name, function (success, message) {
          this.showToast(message);
        }.bind(this));
      },

      /* 解析SVGA二进制数据以提取音频 */
      parseSvgaAudioData: async function (arrayBuffer) {
        var _this = this;

        // 动态加载 protobuf 和 pako
        try {
          await this.loadLibrary(['protobuf', 'pako'], true)
        } catch (err) {
          // 加载失败时静默跳过音频提取
          return;
        }

        try {
          var uint8Array = new Uint8Array(arrayBuffer);
          var inflatedData = pako.inflate(uint8Array);

          protobuf.load('./svga.proto', function (err, root) {
            if (err) return;

            try {
              var MovieEntity = root.lookupType('com.opensource.svga.MovieEntity');
              var movieData = MovieEntity.decode(inflatedData);
              _this.svgaMovieData = movieData;

              // 提取音频数据
              if (movieData.audios && movieData.audios.length > 0 && movieData.images) {
                var audioData = {};
                movieData.audios.forEach(function (audio) {
                  var audioKey = audio.audioKey;

                  // 尝试多种可能的key格式
                  var possibleKeys = [
                    audioKey,
                    audioKey + '.mp3',
                    audioKey + '.wav',
                    'audio_' + audioKey,
                    audioKey.replace(/\.[^.]+$/, '')
                  ];

                  possibleKeys.forEach(function (key) {
                    if (movieData.images[key]) {
                      audioData[audioKey] = movieData.images[key];
                    }
                  });
                });

                if (Object.keys(audioData).length > 0) {
                  _this.svgaAudioData = audioData;
                }
              }
            } catch (decodeErr) {
              // 静默失败
            }
          });
        } catch (err) {
          alert('音频提取失败');
        }
      },

      /**
       * 提取素材列表并计算内存占用
       * 
       * 【重要说明 - 内存计算算法】
       * 必须使用图片的实际解码尺寸（Image对象的width/height），而不是sprite.layout尺寸！
       * 
       * 原因：
       * 1. sprite.layout 是图片在画布上的显示区域，不是图片的实际尺寸
       * 2. SVGA官网计算内存时使用的是图片解码后的实际尺寸
       * 3. 图片实际尺寸可能大于layout尺寸（例如某些优化过的SVGA）
       * 
       * 计算公式：width × height × 4 字节（RGBA四通道）
       * 
       * 验证方式：与SVGA官网 https://svga.io/svga-preview.html 的计算结果对比
       * 
       * 错误示例（已修复）：
       *   ❌ 使用 sprite.frames[i].layout.width/height 计算
       *   结果：某文件计算为193KB，但官网显示0.695MB（相差3.6倍）
       * 
       * 正确方式：
       *   ✓ 通过 new Image() 加载图片数据，使用 img.width/height 计算
       *   结果：与官网完全一致
       */
      extractMaterialList: function (videoItem) {
        var _this = this;
        this.materialList = [];
        this.replacedImages = {};

        if (!videoItem || !videoItem.images) return;

        // 初始化内存占用显示为"计算中..."
        this.svga.fileInfo.memoryText = '计算中...';

        var imageKeys = Object.keys(videoItem.images);
        var imageCount = imageKeys.length;
        var processedCount = 0;
        var totalBytes = 0;


        imageKeys.forEach(function (imageKey) {
          var imgData = videoItem.images[imageKey];
          var previewUrl = '';

          // 处理图片数据，生成预览 URL
          if (imgData && typeof imgData === 'string') {
            previewUrl = imgData.startsWith('data:') ? imgData : ('data:image/png;base64,' + imgData);
          }

          // 获取图片尺寸（异步）
          var img = new Image();
          var materialItem = {
            imageKey: imageKey,
            previewUrl: previewUrl,
            sizeText: '计算中...',
            fileSizeText: '计算中...',
            isReplaced: false,
            originalData: imgData,
            fileSize: 0
          };

          _this.materialList.push(materialItem);

          // 【关键】必须通过Image对象获取图片的实际解码尺寸，与SVGA官网算法一致
          // 不能使用 sprite.layout 尺寸，那是显示区域而非实际图片尺寸
          var img = new Image();

          img.onload = function () {
            // 内存计算公式：实际宽度 × 实际高度 × 4字节（RGBA）
            var bytes = this.width * this.height * 4;
            materialItem.fileSize = bytes;
            materialItem.fileSizeText = _this.formatBytes(bytes);
            materialItem.sizeText = this.width + ' × ' + this.height;
            materialItem.originalWidth = this.width;
            materialItem.originalHeight = this.height;

            totalBytes += bytes;
            processedCount++;

            // 所有图片处理完成后更新总内存
            if (processedCount === imageCount) {
              _this.svga.fileInfo.memoryText = _this.formatBytes(totalBytes);
            }
          };

          img.onerror = function () {
            materialItem.sizeText = '-';
            materialItem.fileSizeText = '-';

            processedCount++;

            // 所有图片处理完成后更新总内存
            if (processedCount === imageCount) {
              _this.svga.fileInfo.memoryText = totalBytes > 0 ? _this.formatBytes(totalBytes) : '-';
            }
          };

          if (previewUrl) {
            img.src = previewUrl;
          }
        });

        // 如果所有图片都同步处理完成，立即更新显示
        if (processedCount === imageCount) {
          this.svga.fileInfo.memoryText = totalBytes > 0 ? this.formatBytes(totalBytes) : '-';
        }
      },

      /* 图片缩放处理：最短边缩放并居中裁剪 */
      scaleImageToFill: function (sourceImg, targetWidth, targetHeight) {
        var canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });

        var sourceWidth = sourceImg.width;
        var sourceHeight = sourceImg.height;

        // 计算缩放比例（最短边缩放）
        var scaleX = targetWidth / sourceWidth;
        var scaleY = targetHeight / sourceHeight;
        var scale = Math.max(scaleX, scaleY);

        // 缩放后的尺寸
        var scaledWidth = sourceWidth * scale;
        var scaledHeight = sourceHeight * scale;

        // 居中偏移
        var offsetX = (targetWidth - scaledWidth) / 2;
        var offsetY = (targetHeight - scaledHeight) / 2;

        // 清空画布（透明背景）
        ctx.clearRect(0, 0, targetWidth, targetHeight);

        // 绘制缩放后的图片
        ctx.drawImage(sourceImg, offsetX, offsetY, scaledWidth, scaledHeight);

        return canvas;
      },

      /* 获取原始图片的目标尺寸 */
      getOriginalImageSize: function (imageKey) {
        if (!this.originalVideoItem || !this.originalVideoItem.images) {
          return null;
        }

        // 从原始videoItem中获取图片数据
        var imageData = this.originalVideoItem.images[imageKey];
        if (!imageData) return null;

        // 返回图片尺寸（已经缓存在materialList中）
        var material = this.materialList.find(function (m) {
          return m.imageKey === imageKey;
        });

        if (material && material.originalWidth && material.originalHeight) {
          return {
            width: material.originalWidth,
            height: material.originalHeight
          };
        }

        return null;
      },

      replaceMaterial: function (index) {
        var _this = this;
        var material = this.materialList[index];
        if (!material) return;

        // 创建文件选择器
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/jpg';

        input.onchange = function (e) {
          var file = e.target.files[0];
          if (!file) return;

          // 读取文件为 base64
          var reader = new FileReader();
          reader.onload = function (evt) {
            var uploadedDataUrl = evt.target.result;

            // 加载上传的图片
            var uploadedImg = new Image();
            uploadedImg.onload = function () {
              var resizedDataUrl;

              // 获取原始图片的目标尺寸
              if (material.originalWidth && material.originalHeight) {
                // 应用“最短边缩放并居中填充”策略
                var scaledCanvas = _this.scaleImageToFill(
                  uploadedImg,
                  material.originalWidth,
                  material.originalHeight
                );
                resizedDataUrl = scaledCanvas.toDataURL('image/png');
              } else {
                // 如果没有原始尺寸信息，直接使用上传的图片
                resizedDataUrl = uploadedDataUrl;
              }

              // 更新预览
              material.previewUrl = resizedDataUrl;
              material.isReplaced = true;

              // 保存替换的图片 - 使用新对象触发响应式更新
              var newReplacedImages = Object.assign({}, _this.replacedImages);
              newReplacedImages[material.imageKey] = resizedDataUrl;
              _this.replacedImages = newReplacedImages;

              // 更新文件大小信息（使用缩放后图片的尺寸）
              var finalWidth = material.originalWidth || uploadedImg.width;
              var finalHeight = material.originalHeight || uploadedImg.height;
              var bytes = finalWidth * finalHeight * 4;
              material.fileSize = bytes;
              material.fileSizeText = _this.formatBytes(bytes);
              material.sizeText = finalWidth + 'px*' + finalHeight + 'px';

              // 延迟后应用到 SVGA
              setTimeout(function () {
                _this.applyReplacedMaterials();
              }, 300);
            };
            uploadedImg.onerror = function () {
              alert('图片加载失败，请确保图片格式正确');
            };
            uploadedImg.src = uploadedDataUrl;
          };

          reader.readAsDataURL(file);
        };

        input.click();
      },

      restoreMaterial: function (index) {
        var material = this.materialList[index];
        if (!material || !material.isReplaced) return;

        // 恢复原始图片
        var originalData = material.originalData;
        material.previewUrl = originalData.startsWith('data:') ? originalData : ('data:image/png;base64,' + originalData);
        material.isReplaced = false;

        // 移除替换记录 - 使用新对象触发响应式更新
        var newReplacedImages = Object.assign({}, this.replacedImages);
        delete newReplacedImages[material.imageKey];
        this.replacedImages = newReplacedImages;

        // 重新渲染 SVGA
        this.applyReplacedMaterials();

        // 重新计算尺寸
        var _this = this;
        var img = new Image();
        img.onload = function () {
          var bytes = this.width * this.height * 4;
          material.fileSize = bytes;
          material.fileSizeText = _this.formatBytes(bytes);
          material.sizeText = this.width + 'px*' + this.height + 'px';
        };
        img.src = material.previewUrl;
      },

      downloadMaterial: function (index) {
        // 下载素材图片
        var material = this.materialList[index];
        if (!material) return;

        // 获取图片URL
        var imageUrl = material.previewUrl;
        if (!imageUrl) {
          alert('图片数据不存在');
          return;
        }

        // 生成文件名：使用imageKey或索引
        var fileName = (material.imageKey || 'material_' + index) + '.png';

        // 创建临时链接下载
        var link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },

      applyReplacedMaterials: function () {
        if (!this.svgaPlayer || !this.originalVideoItem) return;

        var _this = this;

        // 清除之前的动态替换
        this.svgaPlayer.clearDynamicObjects();

        // 预加载所有图片，然后一起应用
        var imageKeys = Object.keys(this.replacedImages);
        var loadedImages = {};
        var loadedCount = 0;
        var totalCount = imageKeys.length;

        if (totalCount === 0) {
          // 没有替换的图片，直接重启播放
          if (_this.isPlaying) {
            _this.svgaPlayer.startAnimation();
          } else {
            _this.svgaPlayer.stepToFrame(_this.currentFrame);
          }
          return;
        }

        // 加载所有图片
        imageKeys.forEach(function (imageKey) {
          var imageUrl = _this.replacedImages[imageKey];
          var img = new Image();

          img.onload = function () {
            loadedImages[imageKey] = img;
            loadedCount++;

            // 所有图片都加载完成
            if (loadedCount === totalCount) {
              // 应用所有替换的图片
              Object.keys(loadedImages).forEach(function (key) {
                _this.svgaPlayer.setImage(loadedImages[key], key);
              });

              // 重启播放
              if (_this.isPlaying) {
                _this.svgaPlayer.startAnimation();
              } else {
                _this.svgaPlayer.stepToFrame(_this.currentFrame);
              }
            }
          };

          img.onerror = function () {
            loadedCount++;

            // 即使有错误也继续
            if (loadedCount === totalCount) {
              Object.keys(loadedImages).forEach(function (key) {
                _this.svgaPlayer.setImage(loadedImages[key], key);
              });

              if (_this.isPlaying) {
                _this.svgaPlayer.startAnimation();
              } else {
                _this.svgaPlayer.stepToFrame(_this.currentFrame);
              }
            }
          };

          img.src = imageUrl;
        });
      },



      /* ==================== 素材压缩功能 ==================== */

      /**
       * 打开压缩并导出弹窗
       */
      openCompressAndExportModal: function () {
        this.showCompressModal = true;
      },

      /**
       * 关闭压缩弹窗
       */
      closeCompressModal: function () {
        this.showCompressModal = false;
      },

      /**
       * 压缩并导出
       */
      startCompressAndExport: async function () {
        // 先执行压缩
        await this.startCompressMaterials();

        // 压缩完成后导出
        if (this.hasCompressedMaterials) {
          await this.exportNewSVGA();
        }
      },

      /**
       * 开始压缩素材图
       * 
       * 压缩流程：
       * 1. 将图片缩小到指定比例（scalePercent）
       * 2. 使用 Canvas 原生 PNG 编码（toDataURL）
       * 3. 生成两份图片：
       *    - 小图（compressedDataUrl）：用于导出，减小SVGA文件体积
       *    - 放大图（previewDataUrl）：用于预览，因为SVGA播放器不会自动放大
       * 4. 保存缩放信息到 compressedScaleInfo
       * 
       * 导出时处理（在 exportNewSVGA 中）：
       * - 使用小图替换SVGA中的原图
       * - 不修改layout和transform，SVGA播放器会自动拉伸小图到layout指定的尺寸
       */
      startCompressMaterials: async function () {
        var _this = this;

        if (this.materialList.length === 0) {
          alert('没有可压缩的素材');
          return;
        }



        // 关闭弹窗，开始压缩
        this.showCompressModal = false;
        this.isCompressingMaterials = true;
        this.compressProgress = 0;

        // 保存压缩前的状态（用于撤销）
        this.preCompressMaterials = JSON.parse(JSON.stringify(this.materialList));
        this.preCompressReplacedImages = Object.assign({}, this.replacedImages);
        this.preCompressScaleInfo = Object.assign({}, this.compressedScaleInfo);

        var total = this.materialList.length;
        var processed = 0;
        var scalePercent = this.compressConfig.scalePercent / 100;

        try {
          for (var i = 0; i < this.materialList.length; i++) {
            var material = this.materialList[i];

            // 使用当前显示的图片（可能是替换过的）
            var sourceUrl = material.previewUrl;
            if (!sourceUrl) {
              processed++;
              this.compressProgress = Math.round((processed / total) * 100);
              continue;
            }

            // 加载图片
            var img = await this._loadImage(sourceUrl);

            // 计算缩小后的尺寸
            var newWidth = Math.round(img.width * scalePercent);
            var newHeight = Math.round(img.height * scalePercent);

            // 确保最小尺寸为1
            newWidth = Math.max(1, newWidth);
            newHeight = Math.max(1, newHeight);

            // 缩小图片
            var canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            var compressedDataUrl;

            // 获取Canvas原生输出（缩小后的PNG）
            var compressedDataUrl = canvas.toDataURL('image/png');

            // 放大到原尺寸用于预览（SVGA播放器不会自动放大）
            var compressedImg;
            try {
              compressedImg = await this._loadImage(compressedDataUrl);
            } catch (err) {
              throw err;
            }

            var scaledCanvas = this.scaleImageToFill(compressedImg, material.originalWidth, material.originalHeight);
            var previewDataUrl = scaledCanvas.toDataURL('image/png');

            // 更新素材列表预览
            material.previewUrl = previewDataUrl;
            material.isReplaced = true;
            // 尺寸显示为压缩后的尺寸
            material.sizeText = newWidth + 'px*' + newHeight + 'px';

            // 内存占用显示为缩小后的尺寸
            var bytes = newWidth * newHeight * 4;
            material.fileSize = bytes;
            material.fileSizeText = this.formatBytes(bytes) + ' (压缩后)';

            // 更新 replacedImages（用于预览，放大后的图）
            var newReplacedImages = Object.assign({}, this.replacedImages);
            newReplacedImages[material.imageKey] = previewDataUrl;
            this.replacedImages = newReplacedImages;

            // 保存缩放信息和小图数据（用于导出）
            var newCompressedScaleInfo = Object.assign({}, this.compressedScaleInfo);
            newCompressedScaleInfo[material.imageKey] = {
              scaledWidth: newWidth,
              scaledHeight: newHeight,
              originalWidth: material.originalWidth,
              originalHeight: material.originalHeight,
              compressedDataUrl: compressedDataUrl  // 小图数据用于导出
            };
            this.compressedScaleInfo = newCompressedScaleInfo;

            processed++;
            this.compressProgress = Math.round((processed / total) * 100);
          }

          // 压缩完成
          this.hasCompressedMaterials = true;
          this.isCompressingMaterials = false;

          // 重新计算总内存占用
          this._recalculateTotalMemory();

          // 应用到播放器预览
          this.applyReplacedMaterials();

          this.showToast('压缩完成，共压缩 ' + total + ' 个素材');

        } catch (err) {
          console.error('压缩失败:', err);
          alert('压缩失败: ' + err.message);
          this.isCompressingMaterials = false;
        }
      },

      /**
       * 撤销压缩（恢复压缩前的状态）
       */
      undoCompressMaterials: function () {
        if (!this.preCompressMaterials || !this.preCompressReplacedImages) {
          alert('没有可撤销的压缩记录');
          return;
        }

        // 恢复压缩前的状态
        this.materialList = JSON.parse(JSON.stringify(this.preCompressMaterials));
        this.replacedImages = Object.assign({}, this.preCompressReplacedImages);
        this.compressedScaleInfo = Object.assign({}, this.preCompressScaleInfo || {});

        // 清除撤销记录
        this.preCompressMaterials = null;
        this.preCompressReplacedImages = null;
        this.preCompressScaleInfo = null;
        this.hasCompressedMaterials = false;

        // 关闭弹窗
        this.showCompressModal = false;

        // 重新计算总内存占用
        this._recalculateTotalMemory();

        // 应用到播放器预览
        this.applyReplacedMaterials();

        this.showToast('已撤销压缩');
      },

      /**
       * 加载图片（Promise封装）
       * @private
       */
      _loadImage: function (src) {
        return new Promise(function (resolve, reject) {
          var img = new Image();
          // 设置 crossOrigin 属性以允许加载跨域图片
          // 注意：如果服务器未正确配置 CORS 头，这可能会导致加载失败
          // 对于 data URI，此设置无影响
          img.crossOrigin = 'Anonymous';
          img.onload = function () { resolve(img); };
          img.onerror = function (e) {
            // 详细错误日志，帮助排查问题
            console.error('图片加载失败，src:', src.substring(0, 100) + '...');
            reject(new Error('图片加载失败'));
          };
          img.src = src;
        });
      },



      /**
       * 重新计算总内存占用
       * @private
       */
      _recalculateTotalMemory: function () {
        var totalBytes = 0;
        for (var i = 0; i < this.materialList.length; i++) {
          if (this.materialList[i].fileSize) {
            totalBytes += this.materialList[i].fileSize;
          }
        }
        this.svga.fileInfo.memoryText = this.formatBytes(totalBytes);
      },

      exportNewSVGA: async function () {
        var _this = this;

        if (!this.svga.hasFile || !this.originalVideoItem || !this.svga.file) {
          alert('请先加载 SVGA 文件');
          return;
        }

        if (Object.keys(this.replacedImages).length === 0) {
          alert('请先替换至少一个素材');
          return;
        }

        // 动态加载 protobuf 和 pako
        try {
          await this.loadLibrary(['protobuf', 'pako'], true)
        } catch (err) {
          alert('库加载失败，请检查网络');
          return;
        }

        try {
          // 读取原始 SVGA 文件
          var reader = new FileReader();
          reader.onload = function (e) {
            try {
              var arrayBuffer = e.target.result;
              var uint8Array = new Uint8Array(arrayBuffer);

              // 解压缩
              var inflatedData = pako.inflate(uint8Array);

              // 使用 protobuf.js 动态加载 proto 并解码
              protobuf.load('./svga.proto', async function (err, root) {
                if (err) {
                  console.error('Proto加载错误:', err);
                  alert('加载 proto 定义失败: ' + err.message);
                  return;
                }

                // 检查root是否有效
                if (!root) {
                  alert('Proto根对象为空');
                  return;
                }

                try {
                  // 获取 MovieEntity 类型
                  var MovieEntity = root.lookupType('com.opensource.svga.MovieEntity');

                  if (!MovieEntity) {
                    alert('MovieEntity类型未找到，请检查proto文件');
                    return;
                  }

                  // 解码（直接操作 protobuf 消息对象）
                  var movieData = MovieEntity.decode(inflatedData);

                  // 替换图片数据
                  var replacedCount = 0;
                  var imagesToProcess = [];

                  // 收集需要替换的图片
                  for (var imageKey in _this.replacedImages) {
                    if (_this.replacedImages.hasOwnProperty(imageKey)) {
                      // 检查 images 字典中是否存在该 key
                      if (movieData.images && movieData.images[imageKey]) {
                        imagesToProcess.push({
                          imageKey: imageKey,
                          base64Data: _this.replacedImages[imageKey]
                        });
                      }
                    }
                  }

                  if (imagesToProcess.length === 0) {
                    alert('未找到需要替换的图片');
                    return;
                  }

                  // 处理所有图片
                  imagesToProcess.forEach(function (item) {
                    var scaleInfo = _this.compressedScaleInfo[item.imageKey];
                    var base64Data;

                    // 如果有压缩信息，直接使用保存的小图DataURL（Canvas原生PNG）
                    if (scaleInfo && scaleInfo.compressedDataUrl) {
                      base64Data = scaleInfo.compressedDataUrl;
                    } else {
                      // 没有压缩，使用原图
                      base64Data = item.base64Data;
                    }

                    // 移除 data:image/xxx;base64, 前缀
                    var base64String = base64Data.split(',')[1] || base64Data;
                    // 转换为 Uint8Array
                    var binaryString = atob(base64String);
                    var bytes = new Uint8Array(binaryString.length);
                    for (var i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    // 直接替换 protobuf 消息中的 bytes 字段
                    movieData.images[item.imageKey] = bytes;
                    replacedCount++;
                  });

                  // ========== 处理压缩素材的transform（核心算法！） ==========
                  // 算法原理：
                  // 1. 压缩时：图片从原始尺寸（如324x321）缩小到指定比例（如50% = 162x161）
                  // 2. 导出时：替换images中的图片数据为小图（162x161的PNG）
                  // 3. 通过transform矩阵放大显示：
                  //    - a/b/c/d 乘以scaleUp（控制缩放、旋转、斜切）
                  //    - tx/ty 保持不变（相对于layout坐标系的绝对位置）
                  // 4. layout完全不变（位置和尺寸保持原始值）
                  //
                  // 关键发现：
                  // - transform的a/b/c/d控制图片的变换矩阵，必须同步缩放以保持旋转角度
                  // - transform的tx/ty是画布坐标系下的绝对偏移，不受图片尺寸影响
                  // - 错误做法：只缩放a/d会导致旋转角度错误（相差约15°）
                  // - 错误做法：缩放tx/ty会导致位置大幅偏移
                  //
                  if (Object.keys(_this.compressedScaleInfo).length > 0 && movieData.sprites) {
                    movieData.sprites.forEach(function (sprite) {
                      var scaleInfo = _this.compressedScaleInfo[sprite.imageKey];
                      if (scaleInfo && sprite.frames) {
                        var scaleUp = scaleInfo.originalWidth / scaleInfo.scaledWidth;

                        sprite.frames.forEach(function (frame) {
                          if (!frame.transform) {
                            frame.transform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
                          }

                          // 获取原有transform值
                          var origA = frame.transform.a !== undefined ? frame.transform.a : 1;
                          var origB = frame.transform.b !== undefined ? frame.transform.b : 0;
                          var origC = frame.transform.c !== undefined ? frame.transform.c : 0;
                          var origD = frame.transform.d !== undefined ? frame.transform.d : 1;
                          var origTx = frame.transform.tx !== undefined ? frame.transform.tx : 0;
                          var origTy = frame.transform.ty !== undefined ? frame.transform.ty : 0;

                          // 核心：a/b/c/d乘以scaleUp，tx/ty保持不变
                          frame.transform.a = origA * scaleUp;
                          frame.transform.b = origB * scaleUp;
                          frame.transform.c = origC * scaleUp;
                          frame.transform.d = origD * scaleUp;
                          frame.transform.tx = origTx;
                          frame.transform.ty = origTy;
                        });
                      }
                    });
                  }

                  // 直接编码 protobuf 消息
                  var buffer = MovieEntity.encode(movieData).finish();

                  // 压缩
                  var deflatedData = pako.deflate(buffer);

                  // 创建 Blob 并下载
                  var blob = new Blob([deflatedData], { type: 'application/octet-stream' });
                  var url = URL.createObjectURL(blob);
                  var a = document.createElement('a');
                  a.href = url;
                  var originalName = _this.svga.fileInfo.name.replace(/\.svga$/i, '');
                  a.download = originalName + '_modified.svga';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);

                  setTimeout(function () {
                    URL.revokeObjectURL(url);
                  }, 100);

                  _this.showToast('导出成功！已替换 ' + replacedCount + ' 个素材。');

                } catch (decodeErr) {
                  console.error('编解码失败:', decodeErr);
                  alert('编解码失败: ' + decodeErr.message);
                }
              });

            } catch (err) {
              alert('处理 SVGA 失败: ' + err.message);
            }
          };
          reader.readAsArrayBuffer(_this.svga.file);

        } catch (err) {
          alert('导出 SVGA 失败: ' + err.message);
        }
      },

      /* ==================== 导出GIF功能 ==================== */

      /**
       * 打开GIF导出弹窗（所有模式通用）
       */
      openGifPanel: function () {
        // 检查当前模式是否有文件
        var hasFile = false;
        if (this.currentModule === 'svga') hasFile = this.svga.hasFile;
        else if (this.currentModule === 'yyeva') hasFile = this.yyeva.hasFile;
        else if (this.currentModule === 'mp4') hasFile = this.mp4.hasFile;
        else if (this.currentModule === 'lottie') hasFile = this.lottie.hasFile;
        else if (this.currentModule === 'frames') hasFile = this.frames.hasFile;

        if (!hasFile) {
          alert('请先加载文件');
          return;
        }

        // 初始化配置：使用当前模式的原始尺寸和帧率
        var sourceInfo = this.getGifSourceInfo();
        this.gifConfig.width = sourceInfo.width || 300;
        this.gifConfig.height = sourceInfo.height || 300;
        this.gifConfig.fps = Math.min(60, Math.max(1, sourceInfo.fps || 30));

        // 使用统一的弹窗管理
        this.openRightPanel('showGifPanel');

        // 预加载GIF.js库
        this.loadLibrary('gif', true).catch(function () {
          // 静默失败，将在需要时重新加载
        });
      },

      /**
       * 关闭GIF导出弹窗
       */
      closeGifPanel: function () {
        if (this.isExportingGIF) {
          if (!confirm('正在导出中，确定要取消吗？')) {
            return;
          }
          this.cancelGifExport();
        }
        this.showGifPanel = false;
      },

      /**
       * 取消GIF导出
       */
      cancelGifExport: function () {
        this.gifExportCancelled = true;
        this.isExportingGIF = false;
        this.gifExportProgress = 0;
        this.gifExportStage = '';
        this.gifExportMessage = '';
      },

      /**
       * GIF宽度变化（保持比例）
       */
      onGifWidthChange: function () {
        var sourceInfo = this.getGifSourceInfo();
        if (!sourceInfo.width || !sourceInfo.height) return;

        var ratio = sourceInfo.height / sourceInfo.width;
        var newWidth = Math.max(1, Math.min(1920, parseInt(this.gifConfig.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.gifConfig.width = newWidth;
        this.gifConfig.height = newHeight;
      },

      /**
       * GIF高度变化（保持比例）
       */
      onGifHeightChange: function () {
        var sourceInfo = this.getGifSourceInfo();
        if (!sourceInfo.width || !sourceInfo.height) return;

        var ratio = sourceInfo.width / sourceInfo.height;
        var newHeight = Math.max(1, Math.min(1920, parseInt(this.gifConfig.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.gifConfig.width = newWidth;
        this.gifConfig.height = newHeight;
      },

      /**
       * 获取当前模式的帧源信息
       */
      getGifSourceInfo: function () {
        var width = 0, height = 0, fps = 30, duration = 0, totalFrames = 0;

        if (this.currentModule === 'svga' && this.svga.hasFile) {
          var sizeWH = this.svga.fileInfo.sizeWH;
          if (sizeWH) {
            var parts = sizeWH.split(' × ');
            if (parts.length === 2) {
              width = parseInt(parts[0]);
              height = parseInt(parts[1]);
            }
          }
          fps = this.svga.fileInfo.fps || 20;
          totalFrames = this.totalFrames || 0;
          duration = totalFrames / fps;
        } else if (this.currentModule === 'yyeva' && this.yyeva.hasFile) {
          width = this.yyeva.displayWidth || Math.floor(this.yyeva.originalWidth / 2);
          height = this.yyeva.displayHeight || this.yyeva.originalHeight;
          fps = parseFloat(this.yyeva.fileInfo.fps) || 30;
          duration = this.yyevaVideo ? this.yyevaVideo.duration : 0;
          totalFrames = Math.ceil(duration * fps);
        } else if (this.currentModule === 'mp4' && this.mp4.hasFile) {
          width = this.mp4.originalWidth;
          height = this.mp4.originalHeight;
          fps = parseFloat(this.mp4.fileInfo.fps) || 30;
          duration = this.mp4Video ? this.mp4Video.duration : 0;

          // 支持变速：如果启用了变速，使用变速后的时长
          if (this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
            var frameMap = this.buildFrameMap();
            if (frameMap && frameMap.length > 0) {
              totalFrames = frameMap.length;
              duration = totalFrames / fps;
            } else {
              totalFrames = Math.ceil(duration * fps);
            }
          } else {
            totalFrames = Math.ceil(duration * fps);
          }
        } else if (this.currentModule === 'lottie' && this.lottie.hasFile) {
          width = this.lottie.originalWidth;
          height = this.lottie.originalHeight;
          fps = this.lottie.frameRate || 30;
          totalFrames = this.totalFrames || 0;
          duration = totalFrames / fps;
        } else if (this.currentModule === 'frames' && this.frames.hasFile) {
          width = this.frames.originalWidth;
          height = this.frames.originalHeight;
          fps = this.frames.fileInfo.fps || 25;
          totalFrames = this.totalFrames || 0;
          duration = totalFrames / fps;
        }

        return {
          width: width,
          height: height,
          fps: fps,
          duration: duration,
          totalFrames: totalFrames,
          sizeWH: width + ' × ' + height
        };
      },

      /**
       * 开始导出GIF（统一入口）
       */
      startGifExport: async function () {
        var _this = this;

        // 检查是否有其他正在进行的任务
        if (!this.confirmIfHasOngoingTasks('导出GIF', 'task')) {
          return;
        }

        // 综合提醒：文件大小超10M或时长超60秒
        var warnings = [];
        var estimate = this.gifEstimate;
        var sourceInfo = this.getGifSourceInfo();

        if (estimate.fileSizeBytes > 10 * 1024 * 1024) {
          warnings.push('预估文件大小超10M（' + estimate.fileSize + '），可能加载较慢');
        }
        if (sourceInfo.duration > 60) {
          warnings.push('动画时长超60秒（' + sourceInfo.duration.toFixed(1) + '秒），导出时间可能较长');
        }

        if (warnings.length > 0) {
          var confirmMsg = '注意：\n\n' + warnings.join('\n') + '\n\n确定要继续导出吗？';
          if (!confirm(confirmMsg)) {
            return;
          }
        }

        try {
          // 加载GIF.js库
          await this.loadLibrary('gif', true);
        } catch (err) {
          alert('GIF导出库加载失败，请检查网络');
          return;
        }

        this.isExportingGIF = true;
        this.gifExportProgress = 0;
        this.gifExportCancelled = false;
        this.gifExportStage = 'capturing';
        this.gifExportMessage = '捕获帧...';

        try {
          // 根据当前模式调用对应的导出函数
          await this.runGifExport();
        } catch (err) {
          if (err.message !== '用户取消') {
            alert('GIF导出失败: ' + err.message);
          }
        } finally {
          this.isExportingGIF = false;
          this.gifExportProgress = 0;
          this.gifExportStage = '';
          this.gifExportMessage = '';
        }
      },

      /**
       * 通用GIF导出内核（使用GIFExporter模块）
       */
      runGifExport: async function () {
        var _this = this;
        var config = this.gifConfig;
        var sourceInfo = this.getGifSourceInfo();
        var fps = config.fps;
        var totalFrames = Math.ceil(sourceInfo.duration * fps);

        // 变速支持：如果MP4模式且启用变速，使用帧映射表
        var frameMap = null;
        if (this.currentModule === 'mp4' && this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
          frameMap = this.buildFrameMap();
          if (frameMap && frameMap.length > 0) {
            totalFrames = frameMap.length;
          }
        }

        // 暂停播放
        var wasPlaying = this.isPlaying;
        await this.pauseForExport();

        try {
          // 使用GIFExporter模块导出
          var blob = await GIFExporter.export({
            width: config.width,
            height: config.height,
            fps: fps,
            // 传入用户原始输入值(1-30)，在GIFExporter内部进行反转映射
            quality: parseInt(config.quality) || 10,
            repeat: 0, // 0 = 无限循环
            totalFrames: totalFrames,
            transparent: config.transparent,
            dither: config.dither,
            ditherColor: config.ditherColor,
            backgroundColor: this.bgColorKey === 'pattern' ? '#ffffff' : this.currentBgColor,

            // 获取指定帧的canvas
            getFrame: async function (frameIndex) {
              // 变速支持：使用帧映射表获取原始帧号
              var actualFrameIndex = frameIndex;
              var seekFps = fps; // 默认为导出帧率

              if (frameMap) {
                if (frameMap[frameIndex] !== undefined) {
                  actualFrameIndex = frameMap[frameIndex];
                  // 修复：使用帧映射时，actualFrameIndex是原始视频的帧索引
                  // 所以必须使用原始视频的FPS来计算时间点，而不是导出FPS
                  if (_this.currentModule === 'mp4' && _this.mp4 && _this.mp4.fileInfo && _this.mp4.fileInfo.fps) {
                    seekFps = parseFloat(_this.mp4.fileInfo.fps) || 30;
                  }
                } else if (frameMap.length > 0) {
                  // 越界保护：使用最后一帧
                  actualFrameIndex = frameMap[frameMap.length - 1];
                  if (_this.currentModule === 'mp4' && _this.mp4 && _this.mp4.fileInfo && _this.mp4.fileInfo.fps) {
                    seekFps = parseFloat(_this.mp4.fileInfo.fps) || 30;
                  }
                }
              }

              await _this.seekToFrame(actualFrameIndex, seekFps, sourceInfo);
              await new Promise(function (r) { setTimeout(r, 50); });
              return _this.getCurrentFrameCanvas();
            },

            // 进度回调
            onProgress: function (progress, stage, message) {
              _this.gifExportProgress = progress;
              _this.gifExportStage = stage;
              _this.gifExportMessage = message;
            },

            // 检查是否取消
            shouldCancel: function () {
              return _this.gifExportCancelled;
            }
          });

          // 下载文件
          var fileName = this.getGifFileName();
          GIFExporter.download(blob, fileName);

          alert('GIF 导出成功！大小: ' + GIFExporter.formatBytes(blob.size));

        } finally {
          // 恢复播放状态
          if (wasPlaying) {
            this.resumeAfterExport();
          }
        }
      },

      /**
       * 获取当前帧的Canvas
       */
      getCurrentFrameCanvas: function () {
        var container = this.$refs.svgaContainer;
        if (!container) return null;

        if (this.currentModule === 'svga') {
          return container.querySelector('canvas');
        } else if (this.currentModule === 'yyeva') {
          return this.yyevaCanvas;
        } else if (this.currentModule === 'mp4') {
          // 普通MP4需要绘制到canvas
          if (!this.mp4Video) return null;

          // 如果启用了绿幕抠图，使用抠图后的canvas
          if (this.chromaKeyEnabled) {
            var chromaCanvas = container.querySelector('canvas.chromakey-canvas');
            if (chromaCanvas) return chromaCanvas;
          }

          // 否则从视频创建新canvas
          var canvas = document.createElement('canvas');
          canvas.width = this.mp4.originalWidth;
          canvas.height = this.mp4.originalHeight;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(this.mp4Video, 0, 0);
          return canvas;
        } else if (this.currentModule === 'lottie') {
          return container.querySelector('canvas');
        } else if (this.currentModule === 'frames') {
          return this.framesCanvas;
        }
        return null;
      },

      /**
       * 跳转到指定帧
       */
      seekToFrame: async function (frameIndex, fps, sourceInfo) {
        var _this = this;

        if (this.currentModule === 'svga') {
          // SVGA: 使用stepToFrame
          this.svgaPlayer.stepToFrame(frameIndex, false);
        } else if (this.currentModule === 'yyeva') {
          // 双通道MP4: seek到指定时间
          var time = frameIndex / fps;
          this.yyevaVideo.currentTime = time;
          await new Promise(function (resolve) {
            _this.yyevaVideo.onseeked = resolve;
          });
          // 渲染帧
          this.renderYyevaFrame();
        } else if (this.currentModule === 'mp4') {
          // 普通MP4: seek到指定时间
          var time = frameIndex / fps;
          this.mp4Video.currentTime = time;
          await new Promise(function (resolve) {
            _this.mp4Video.onseeked = resolve;
          });
        } else if (this.currentModule === 'lottie') {
          // Lottie: 使用goToAndStop
          this.lottiePlayer.goToAndStop(frameIndex, true);
        } else if (this.currentModule === 'frames') {
          // 序列帧: 直接渲染指定帧
          this.renderFramesFrame(frameIndex);
        }
      },

      /**
       * 暂停播放（导出前）
       */
      pauseForExport: async function () {
        if (this.currentModule === 'svga' && this.svgaPlayer) {
          this.svgaPlayer.pauseAnimation();
        } else if (this.currentModule === 'yyeva') {
          if (this.yyevaAnimationId) {
            cancelAnimationFrame(this.yyevaAnimationId);
            this.yyevaAnimationId = null;
          }
          if (this.yyevaVideo) this.yyevaVideo.pause();
        } else if (this.currentModule === 'mp4') {
          if (this.mp4Video) this.mp4Video.pause();
        } else if (this.currentModule === 'lottie' && this.lottiePlayer) {
          this.lottiePlayer.pause();
        } else if (this.currentModule === 'frames') {
          this.stopFramesPlayLoop();
        }
        this.isPlaying = false;
      },

      /**
       * 恢复播放（导出后）
       */
      resumeAfterExport: function () {
        if (this.currentModule === 'svga' && this.svgaPlayer) {
          this.svgaPlayer.startAnimation();
        } else if (this.currentModule === 'yyeva') {
          if (this.yyevaVideo) this.yyevaVideo.play();
          this.startYyevaRenderLoop();
        } else if (this.currentModule === 'mp4') {
          if (this.mp4Video) {
            this.mp4Video.play();
            // 重要：重新启动进度更新循环
            this.startMp4ProgressLoop();
          }
        } else if (this.currentModule === 'lottie' && this.lottiePlayer) {
          this.lottiePlayer.play();
        } else if (this.currentModule === 'frames') {
          this.startFramesPlayLoop();
        }
        this.isPlaying = true;
      },

      /**
       * 获取GIF文件名
       */
      getGifFileName: function () {
        var baseName = 'animation';
        if (this.currentModule === 'svga' && this.svga.fileInfo.name) {
          baseName = this.svga.fileInfo.name.replace(/\.svga$/i, '');
        } else if (this.currentModule === 'yyeva' && this.yyeva.fileInfo.name) {
          baseName = this.yyeva.fileInfo.name.replace(/\.mp4$/i, '');
        } else if (this.currentModule === 'mp4' && this.mp4.fileInfo.name) {
          baseName = this.mp4.fileInfo.name.replace(/\.mp4$/i, '');
        } else if (this.currentModule === 'lottie' && this.lottie.fileInfo.name) {
          baseName = this.lottie.fileInfo.name.replace(/\.json$/i, '');
        } else if (this.currentModule === 'frames' && this.frames.files.length > 0) {
          // 序列帧: 使用第一帧文件名的前缀
          baseName = this.frames.files[0].name.replace(/\d+\.(png|jpg|jpeg)$/i, '').replace(/[_-]$/, '') || 'frames';
        }
        return baseName + '.gif';
      },

      /**
       * 导出Lottie（逐帧关键帧版本）
       * 注意：这是实验性功能，生成的Lottie文件每帧都是静态关键帧
       */
      exportLottie: async function () {
        var _this = this;

        if (!this.svgaPlayer || !this.svga.hasFile || !this.originalVideoItem) {
          alert('请先加载 SVGA 文件');
          return;
        }

        // 检查是否有其他正在进行的任务
        if (!this.confirmIfHasOngoingTasks('导出Lottie', 'task')) {
          return;
        }

        // 警告用户这是实验性功能
        if (!confirm('警告：这是实验性功能。\n\n生成的Lottie文件将每帧都作为静态关键帧导出，类似“定格动画”效果。\n原动画不会有平滑的运动曲线。\n\n生成的JSON文件可能很大（数MB），但能导入After Effects进行编辑。\n\n是否继续？')) {
          return;
        }

        this.isExportingLottie = true;
        this.lottieExportProgress = 0;

        try {
          // 获取 canvas 元素
          var container = this.$refs.svgaContainer;
          if (!container) {
            throw new Error('无法获取画布元素');
          }
          var canvas = container.querySelector('canvas');
          if (!canvas) {
            throw new Error('无法获取 canvas 元素');
          }

          // 获取 SVGA 信息
          var videoItem = this.originalVideoItem;
          var totalFrames = this.totalFrames;
          var fps = parseFloat(this.svga.fileInfo.fps) || 20;
          var width = this.svga.originalWidth;
          var height = this.svga.originalHeight;

          // 检查尺寸信息
          if (!width || !height) {
            throw new Error('无法获取 SVGA 尺寸信息 (width: ' + width + ', height: ' + height + ')');
          }

          // 保存播放状态
          var wasPlaying = this.isPlaying;
          if (wasPlaying) {
            this.svgaPlayer.pauseAnimation();
          }

          // 提取每帧数据
          var frames = [];

          // 创建独立的渲染 Canvas
          var renderCanvas = document.createElement('canvas');
          renderCanvas.width = width;
          renderCanvas.height = height;
          var renderCtx = renderCanvas.getContext('2d', { alpha: true });

          for (var i = 0; i < totalFrames; i++) {
            // 清空画布
            renderCtx.clearRect(0, 0, width, height);

            // 直接渲染指定帧到独立 Canvas
            this.svgaPlayer.stepToFrame(i, false);

            // 等待渲染完成
            await new Promise(function (resolve) { setTimeout(resolve, 100); });

            // 从播放器 Canvas 复制到渲染 Canvas
            renderCtx.drawImage(canvas, 0, 0);

            // 转为 base64 图像
            var frameDataUrl = renderCanvas.toDataURL('image/png');

            frames.push({
              index: i,
              dataUrl: frameDataUrl
            });

            // 更新进度（0-50%）
            this.lottieExportProgress = Math.floor((i + 1) / totalFrames * 50);

            // 让出线程
            if (i % 5 === 0) {
              await new Promise(function (resolve) { setTimeout(resolve, 0); });
            }
          }

          // 构建Lottie JSON
          this.lottieExportProgress = 55;
          var lottieData = this.buildLottieFromFrames(frames, width, height, fps, totalFrames);

          this.lottieExportProgress = 90;

          // 导出 JSON 文件
          var jsonString = JSON.stringify(lottieData, null, 2);
          var blob = new Blob([jsonString], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = (this.svga.fileInfo.name.replace(/\.svga$/i, '') || 'animation') + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setTimeout(function () {
            URL.revokeObjectURL(url);
          }, 100);

          this.lottieExportProgress = 100;

          setTimeout(function () {
            _this.isExportingLottie = false;
            _this.lottieExportProgress = 0;
            alert('Lottie 导出成功！\n\n文件大小: ' + _this.formatBytes(blob.size) + '\n\n请将JSON文件导入After Effects进行编辑。');
          }, 300);

          // 恢复播放状态
          if (wasPlaying && this.svgaPlayer && this.currentModule === 'svga') {
            this.svgaPlayer.startAnimation();
          }

        } catch (err) {
          this.isExportingLottie = false;
          this.lottieExportProgress = 0;
          alert('Lottie导出失败: ' + err.message);
        }
      },

      /**
       * 构建Lottie JSON结构（逐帧关键帧版本）
       */
      buildLottieFromFrames: function (frames, width, height, fps, totalFrames) {
        // 计算时长（秒）
        var durationInSeconds = totalFrames / fps;

        // Lottie基本结构
        var lottieData = {
          v: '5.7.0',  // Bodymovin版本
          fr: fps,     // 帧率
          ip: 0,       // inPoint
          op: totalFrames, // outPoint
          w: width,
          h: height,
          nm: 'SVGA to Lottie Export', // 名称
          ddd: 0,      // 3D支持（0=二维）
          assets: [],  // 资产列表
          layers: []   // 图层列表
        };

        // 将每帧作为单独的图像资产
        frames.forEach(function (frame, index) {
          var assetId = 'image_' + index;

          // 添加到assets
          lottieData.assets.push({
            id: assetId,
            w: width,
            h: height,
            u: '',  // 路径
            p: frame.dataUrl,  // base64图像
            e: 0    // 是否嵌入
          });
        });

        // 为每帧创建一个图层
        frames.forEach(function (frame, index) {
          var assetId = 'image_' + index;
          var startTime = index;      // 当前帧开始时间
          var endTime = index + 1;    // 下一帧开始时间

          lottieData.layers.push({
            ddd: 0,
            ind: index + 1,  // 图层索引
            ty: 2,           // 图层类型（2=图像）
            nm: 'Frame ' + index,  // 图层名称
            refId: assetId,  // 引用的资产ID
            sr: 1,           // 时间拉伸
            ks: {            // 变换属性
              o: {           // 透明度
                a: 1,        // 动画化
                k: [
                  {
                    i: { x: [1], y: [1] },
                    o: { x: [0], y: [0] },
                    t: startTime,
                    s: [100]   // 当前帧显示（100%不透明）
                  },
                  {
                    t: endTime,
                    s: [0]     // 下一帧隐藏（0%不透明=完全透明）
                  }
                ]
              },
              r: { a: 0, k: 0 },      // 旋转
              p: { a: 0, k: [width / 2, height / 2, 0] },  // 位置（居中）
              a: { a: 0, k: [width / 2, height / 2, 0] },  // 锚点
              s: { a: 0, k: [100, 100, 100] }          // 缩放
            },
            ao: 0,
            ip: startTime,   // 入点
            op: endTime,     // 出点
            st: startTime,   // 开始时间
            bm: 0            // 混合模式
          });
        });

        return lottieData;
      },

      /* 工具方法 */

      /**
       * 格式化字节大小
       * 注：已迁移至 utils.js 模块
       */
      formatBytes: function (bytes) {
        return this.utils.formatBytes(bytes);
      },

      /* ==================== 绿幕抠图功能 ==================== */

      /**
       * 打开绿幕抠图弹窗
       */
      /**
       * 打开/关闭绿幕抠图弹窗 (openChromaKeyPanel)
       * 功能：切换绿幕抠图弹窗显示状态
       */
      openChromaKeyPanel: function () {
        if (!this.mp4Video || !this.mp4.hasFile) {
          alert('请先加载 MP4 文件');
          return;
        }

        // 切换弹窗显示状态
        this.showChromaKeyPanel = !this.showChromaKeyPanel;
      },

      /**
       * 关闭绿幕抠图弹窗
       */
      closeChromaKeyPanel: function () {
        this.showChromaKeyPanel = false;
      },

      /**
       * 切换绿幕抠图开关
       */
      toggleChromaKey: function () {
        this.chromaKeyEnabled = !this.chromaKeyEnabled;
        if (this.chromaKeyEnabled) {
          this.updateChromaKeyEffect();
        } else {
          // 关闭抠图，恢复原始画面
          this.removeChromaKeyEffect();
        }
      },

      /**
       * 更新绿幕抠图效果
       */
      updateChromaKeyEffect: function () {
        if (!this.chromaKeyEnabled || !this.mp4Video) return;

        var _this = this;
        var video = this.mp4Video;

        // 创建临时canvas用于抠图渲染
        var container = this.$refs.svgaContainer;
        if (!container) return;

        // 移除旧的canvas和渲染循环
        if (this.chromaKeyRenderLoop) {
          cancelAnimationFrame(this.chromaKeyRenderLoop);
          this.chromaKeyRenderLoop = null;
        }

        var existingCanvas = container.querySelector('canvas.chromakey-canvas');
        if (existingCanvas) {
          container.removeChild(existingCanvas);
        }

        // 创建新canvas（必须启用alpha通道以支持透明抠图）
        var canvas = document.createElement('canvas');
        canvas.className = 'chromakey-canvas';
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // 不设置 max-width/max-height，让容器的 transform scale 生效
        canvas.style.cssText = 'display: block;';

        var ctx = canvas.getContext('2d', {
          willReadFrequently: true,
          alpha: true
        });

        // 隐藏video，显示canvas
        video.style.display = 'none';
        container.appendChild(canvas);

        // 绿幕抠图参数
        var similarity = this.chromaKeySimilarity / 100;
        var smoothness = this.chromaKeySmoothness / 100;

        // 渲染循环（优化：降低帧率，减少CPU占用）
        var lastRenderTime = 0;
        var renderInterval = 1000 / 30; // 限制为30fps

        var renderChromaKey = function (currentTime) {
          if (!_this.chromaKeyEnabled || !_this.mp4Video || _this.currentModule !== 'mp4') {
            return;
          }

          // 帧率限制
          var elapsed = currentTime - lastRenderTime;
          if (elapsed < renderInterval) {
            _this.chromaKeyRenderLoop = requestAnimationFrame(renderChromaKey);
            return;
          }
          lastRenderTime = currentTime;

          // 绘制视频帧
          ctx.drawImage(video, 0, 0);

          // 获取像素数据
          var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var data = imageData.data;

          // 更新参数（实时获取）
          similarity = _this.chromaKeySimilarity / 100;
          smoothness = _this.chromaKeySmoothness / 100;

          // 遍历每个像素（绿幕抠图）
          for (var i = 0; i < data.length; i += 4) {
            var r = data[i];
            var g = data[i + 1];
            var b = data[i + 2];

            // 检测绿色：绿色通道明显高于红色和蓝色
            var isGreen = (g > r * (1 + similarity) && g > b * (1 + similarity));

            if (isGreen) {
              // 计算透明度（根据平滑度）
              var greenStrength = (g - Math.max(r, b)) / 255;
              var alpha = Math.max(0, 1 - greenStrength / (1 - smoothness + 0.01));
              data[i + 3] = Math.floor(alpha * 255);
            }
          }

          ctx.putImageData(imageData, 0, 0);

          // 继续下一帧
          _this.chromaKeyRenderLoop = requestAnimationFrame(renderChromaKey);
        };

        // 开始渲染
        renderChromaKey();
      },

      /**
       * 移除绿幕抠图效果
       */
      removeChromaKeyEffect: function () {
        // 停止渲染循环
        if (this.chromaKeyRenderLoop) {
          cancelAnimationFrame(this.chromaKeyRenderLoop);
          this.chromaKeyRenderLoop = null;
        }

        var container = this.$refs.svgaContainer;
        if (!container || !this.mp4Video) return;

        // 移除chromakey canvas
        var chromakeyCanvas = container.querySelector('canvas.chromakey-canvas');
        if (chromakeyCanvas) {
          container.removeChild(chromakeyCanvas);
        }

        // 显示video
        this.mp4Video.style.display = '';
      },

      /**
       * 应用绿幕抠图效果
       */
      applyChromaKey: function () {
        this.chromaKeyApplied = this.chromaKeyEnabled;
        this.closeChromaKeyPanel();
      },

      /* ==================== 变速功能 ==================== */

      /**
       * 打开/关闭变速编辑器（切换）
       */
      openSpeedRemapEditor: function () {
        if (!this.mp4Video || !this.mp4.hasFile) {
          alert('请先加载 MP4 文件');
          return;
        }

        // 切换显示/隐藏
        if (this.showSpeedRemapEditor) {
          this.showSpeedRemapEditor = false;
          this.selectedKeyframeIndex = -1;
          this.timelineHoverX = -1;
          return;
        }

        // 初始化变速配置
        var video = this.mp4Video;
        var fps = parseFloat(this.mp4.fileInfo.fps) || 30;
        var duration = video.duration || 0;
        var totalFrames = Math.ceil(duration * fps);

        this.speedRemapConfig.fps = fps;
        this.speedRemapConfig.originalDuration = duration;
        this.speedRemapConfig.originalTotalFrames = totalFrames;

        // 初始化起点和终点K帧（位置和原始帧成比例）
        if (!this.speedRemapConfig.keyframes || this.speedRemapConfig.keyframes.length < 2) {
          this.speedRemapConfig.keyframes = [
            { originalFrame: 0, position: 0, isEndpoint: true },
            { originalFrame: totalFrames, position: 1, isEndpoint: true }
          ];
        } else {
          // 更新终点帧号
          var lastKf = this.speedRemapConfig.keyframes[this.speedRemapConfig.keyframes.length - 1];
          lastKf.originalFrame = totalFrames;
        }

        this.showSpeedRemapEditor = true;
        this.selectedKeyframeIndex = -1;
        this.timelineHoverX = -1;
      },

      /**
       * 取消变速编辑
       */
      cancelSpeedRemap: function () {
        this.showSpeedRemapEditor = false;
        this.selectedKeyframeIndex = -1;
        this.timelineHoverX = -1;
      },

      /**
       * 恢复（清除变速信息）
       */
      resetSpeedRemap: function () {
        var totalFrames = this.speedRemapConfig.originalTotalFrames;
        // 重置K帧为初始状态（只有两个端点）
        this.speedRemapConfig.keyframes = [
          { originalFrame: 0, position: 0, isEndpoint: true },
          { originalFrame: totalFrames, position: 1, isEndpoint: true }
        ];
        this.speedRemapConfig.enabled = false;
        this.selectedKeyframeIndex = -1;
      },

      /**
       * 双击K帧帧数标签，打开编辑弹窗
       */
      onFrameLabelDblClick: function (index) {
        var kf = this.speedRemapConfig.keyframes[index];
        if (!kf) return;

        this.editingKeyframeIndex = index;
        this.editFrameInput = kf.originalFrame.toString();
        this.showEditFrameDialog = true;
      },

      /**
       * 确认编辑K帧帧数
       */
      confirmEditFrame: function () {
        var frameNum = parseInt(this.editFrameInput, 10);
        var totalFrames = this.speedRemapConfig.originalTotalFrames;

        // 验证输入
        if (isNaN(frameNum)) {
          this.showToast('请输入有效的帧数');
          return;
        }
        if (frameNum < 0 || frameNum > totalFrames) {
          this.showToast('帧数范围: 0-' + totalFrames);
          return;
        }

        var keyframes = this.speedRemapConfig.keyframes;
        var index = this.editingKeyframeIndex;

        // 检查是否与其他K帧重复
        for (var i = 0; i < keyframes.length; i++) {
          if (i !== index && keyframes[i].originalFrame === frameNum) {
            this.showToast('该帧数已存在K帧');
            return;
          }
        }

        // 更新originalFrame
        keyframes[index].originalFrame = frameNum;

        // 重新排序关键帧（按originalFrame排序）
        keyframes.sort(function (a, b) {
          return a.originalFrame - b.originalFrame;
        });

        // 关闭弹窗
        this.showEditFrameDialog = false;
        this.editingKeyframeIndex = -1;
        this.editFrameInput = '';
      },

      /**
       * 取消编辑K帧帧数
       */
      cancelEditFrame: function () {
        this.showEditFrameDialog = false;
        this.editingKeyframeIndex = -1;
        this.editFrameInput = '';
      },

      /**
       * 确认变速配置
       */
      confirmSpeedRemap: function () {
        var _this = this;

        // 检查是否有位置变化（非线性映射）
        var keyframes = this.speedRemapConfig.keyframes;
        var hasSpeedChange = keyframes.length > 2; // 有中间K帧

        // 检查端点是否移动
        if (!hasSpeedChange && keyframes.length >= 2) {
          var start = keyframes[0];
          var end = keyframes[keyframes.length - 1];
          hasSpeedChange = (start.position !== 0 || end.position !== 1);
        }

        // 检查速度范围，如果超出范围则自动调整
        var hasOutOfRange = false;
        var MIN_SPEED = 0.1;
        var MAX_SPEED = 12;
        var totalFrames = this.speedRemapConfig.originalTotalFrames || 1;

        if (hasSpeedChange && keyframes.length >= 2) {
          // 检查每个区间的速度
          for (var i = 0; i < keyframes.length - 1; i++) {
            var k1 = keyframes[i];
            var k2 = keyframes[i + 1];
            var frameDelta = k2.originalFrame - k1.originalFrame;
            var positionDelta = k2.position - k1.position;

            if (positionDelta > 0 && frameDelta > 0) {
              var speed = frameDelta / (positionDelta * totalFrames);

              if (speed < MIN_SPEED || speed > MAX_SPEED) {
                hasOutOfRange = true;

                // 调整K帧位置以使速度在范围内
                var targetSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
                var newPositionDelta = frameDelta / (targetSpeed * totalFrames);

                // 调整k2及后续所有K帧的position
                var positionShift = newPositionDelta - positionDelta;
                for (var j = i + 1; j < keyframes.length; j++) {
                  keyframes[j].position += positionShift;
                }
              }
            }
          }
        }

        this.speedRemapConfig.enabled = hasSpeedChange;
        this.showSpeedRemapEditor = false;
        this.selectedKeyframeIndex = -1;

        // 显示提示
        if (hasOutOfRange) {
          this.showToast('超出变速范围' + MIN_SPEED + '-' + MAX_SPEED + '，已自动调整为范围内速度');
        } else if (hasSpeedChange) {
          this.showToast('变速配置已应用');
        }

        if (hasSpeedChange) {
          // 用户编辑了变速：从头开始播放

          // 暂停当前播放
          if (this.isPlaying) {
            this.togglePlay();
          }

          // 跳转到0位置
          if (this.playerController) {
            this.playerController.seekTo(0);
          }

          // 延迟后开始播放
          setTimeout(function () {
            if (!_this.isPlaying) {
              _this.togglePlay();
            }
          }, 100);
        }
        // 如果没有变速，只是关闭浮层（已经执行了 this.showSpeedRemapEditor = false）
      },

      /**
       * 时间轴鼠标移动（hover预览线）
       */
      onTimelineMouseMove: function (event) {
        var timeline = this.$refs.speedRemapTimeline;
        if (!timeline) return;

        var rect = timeline.getBoundingClientRect();
        var x = event.clientX - rect.left;
        x = Math.max(0, Math.min(500, x));
        var position = x / 500;

        var keyframes = this.speedRemapConfig.keyframes;

        // 检查是否在端点范围内（只能在黑色线之间K帧）
        var startPos = keyframes[0] ? keyframes[0].position : 0;
        var endPos = keyframes[keyframes.length - 1] ? keyframes[keyframes.length - 1].position : 1;
        if (position <= startPos || position >= endPos) {
          this.timelineHoverX = -1;
          return;
        }

        // 检查是否接近已有K帧（不显示预览线）
        for (var i = 0; i < keyframes.length; i++) {
          var kfX = keyframes[i].position * 500;
          if (Math.abs(x - kfX) < 8) {
            this.timelineHoverX = -1;
            return;
          }
        }

        this.timelineHoverX = x;
      },

      /**
       * 时间轴鼠标离开
       */
      onTimelineMouseLeave: function () {
        this.timelineHoverX = -1;
      },

      /**
       * 点击时间轴添加K帧
       */
      onTimelineClick: function (event) {
        var timeline = this.$refs.speedRemapTimeline;
        if (!timeline) return;

        var rect = timeline.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var position = Math.max(0, Math.min(1, x / 500));

        var keyframes = this.speedRemapConfig.keyframes;

        // 检查是否在端点范围内（只能在黑色线之间K帧）
        var startPos = keyframes[0] ? keyframes[0].position : 0;
        var endPos = keyframes[keyframes.length - 1] ? keyframes[keyframes.length - 1].position : 1;
        if (position <= startPos || position >= endPos) {
          return; // 在端点范围外，不能添加K帧
        }

        // 检查是否点击在已有节点上
        for (var i = 0; i < keyframes.length; i++) {
          var kfX = keyframes[i].position * 500;
          if (Math.abs(x - kfX) < 8) {
            return; // 点击在已有节点上
          }
        }

        // 添加新K帧（不弹窗）
        this.addKeyframe(position);
      },

      /**
       * 添加关键帧
       * @param position 在时间轴上的位置 (0-1)
       */
      addKeyframe: function (position) {
        var keyframes = this.speedRemapConfig.keyframes;

        // 限制最多10个K帧
        if (keyframes.length >= 10) {
          this.showToast('最多支持10个关键帧');
          return;
        }

        // 重要：originalFrame通过当前时间轴状态插值计算（创建时固定）
        var originalFrame = this.getOriginalFrameAtPosition(position);

        // 插入新K帧（按位置排序）
        var newKf = { originalFrame: originalFrame, position: position, isEndpoint: false };
        keyframes.push(newKf);
        keyframes.sort(function (a, b) { return a.position - b.position; });

        this.timelineHoverX = -1;
      },

      /**
       * 根据位置获取原始帧号（线性插值）
       */
      getOriginalFrameAtPosition: function (position) {
        var keyframes = this.speedRemapConfig.keyframes;
        if (!keyframes || keyframes.length < 2) {
          return Math.round(position * this.speedRemapConfig.originalTotalFrames);
        }

        // 找到position所在的两个关键帧区间
        for (var i = 0; i < keyframes.length - 1; i++) {
          var k1 = keyframes[i];
          var k2 = keyframes[i + 1];

          if (position >= k1.position && position <= k2.position) {
            if (k2.position === k1.position) return k1.originalFrame;
            var ratio = (position - k1.position) / (k2.position - k1.position);
            return Math.round(k1.originalFrame + (k2.originalFrame - k1.originalFrame) * ratio);
          }
        }

        return Math.round(position * this.speedRemapConfig.originalTotalFrames);
      },

      /**
       * 根据位置获取当前区间的播放速率
       */
      getSpeedAtPosition: function (position) {
        var keyframes = this.speedRemapConfig.keyframes;
        if (!keyframes || keyframes.length < 2) {
          return 1.0;
        }

        var totalFrames = this.speedRemapConfig.originalTotalFrames;
        if (!totalFrames) return 1.0;

        // 找到position所在的两个关键帧区间
        for (var i = 0; i < keyframes.length - 1; i++) {
          var k1 = keyframes[i];
          var k2 = keyframes[i + 1];

          if (position >= k1.position && position <= k2.position) {
            var frameDelta = k2.originalFrame - k1.originalFrame;
            var positionDelta = k2.position - k1.position;

            if (positionDelta <= 0) return 1.0;
            if (frameDelta <= 0) return 1.0;

            // frameDelta帧 在 positionDelta*totalFrames帧 时间内播放
            var speed = frameDelta / (positionDelta * totalFrames);
            return speed;
          }
        }

        return 1.0;
      },

      /**
       * K帧线点击（删除中间K帧）
       */
      onKeyframeLineClick: function (index) {
        var kf = this.speedRemapConfig.keyframes[index];
        if (!kf) return;

        // 端点不可删除
        if (kf.isEndpoint) {
          return;
        }

        // 删除中间K帧
        this.speedRemapConfig.keyframes.splice(index, 1);
      },

      /**
       * K帧节点鼠标按下（拖拽）
       */
      onKeyframeMouseDown: function (event, index) {
        var _this = this;
        var kf = this.speedRemapConfig.keyframes[index];
        if (!kf) return;

        var timeline = this.$refs.speedRemapTimeline;
        if (!timeline) return;

        this.selectedKeyframeIndex = index;
        this.timelineHoverX = -1;

        var rect = timeline.getBoundingClientRect();
        var startX = event.clientX;
        var startPosition = kf.position;

        var onMouseMove = function (e) {
          var dx = e.clientX - startX;
          var dPosition = dx / 500;
          var newPosition = startPosition + dPosition;

          // 边界约束
          var keyframes = _this.speedRemapConfig.keyframes;
          var minPos = keyframes[index - 1] ? keyframes[index - 1].position + 0.01 : 0;
          var maxPos = keyframes[index + 1] ? keyframes[index + 1].position - 0.01 : 1;

          newPosition = Math.max(minPos, Math.min(maxPos, newPosition));
          kf.position = newPosition;
        };

        var onMouseUp = function () {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          _this.selectedKeyframeIndex = -1;
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        event.preventDefault();
      },



      /**
       * 构建帧映射表
       * 输出帧号 -> 原始帧号
       */
      /**
       * 构建速度重映射的帧映射表
       * @returns {Array<number>} 输出帧到原始帧的索引映射
       */
      buildFrameMap: function () {
        var config = this.speedRemapConfig;
        if (!config.enabled || !config.keyframes || config.keyframes.length < 2) {
          return null;
        }

        var totalFrames = config.originalTotalFrames;
        var keyframes = config.keyframes;

        // 获取端点位置
        var startPos = keyframes[0].position;
        var endPos = keyframes[keyframes.length - 1].position;
        var outputRatio = endPos - startPos;

        // 修复：GIF导出时长计算错误导致尾部重复
        // 变速后的总帧数不应该简单按比例计算，而是应该由变速曲线决定
        // 但这里我们保持输出时长不变（即 0-1 映射到 0-duration），
        // 只是改变中间的播放速率。所以输出总帧数应该等于原始总帧数（如果保持fps不变）。
        // 之前的逻辑 `outputTotalFrames = Math.ceil(outputRatio * totalFrames)` 
        // 只有在裁剪了时间范围（startPos > 0 或 endPos < 1）时才成立。
        // 如果是全时长变速（0 -> 1），outputTotalFrames 应该等于 totalFrames。

        // 修正逻辑：根据输出时间范围比例计算输出帧数
        var outputTotalFrames = Math.ceil(outputRatio * totalFrames);

        // 如果输出帧数过少（比如被压缩到很短），至少保留1帧
        if (outputTotalFrames < 1) outputTotalFrames = 1;

        var frameMap = [];

        for (var outFrame = 0; outFrame < outputTotalFrames; outFrame++) {
          // 输出位置 (0-1) 映射到 startPos-endPos
          // 注意：最后一帧应该映射到 endPos，但为了防止越界，使用 outputTotalFrames - 1 作为分母
          // 但在循环中，outFrame 是从 0 到 outputTotalFrames - 1
          // 所以 outPosition 计算应该是 outFrame / outputTotalFrames * outputRatio
          // 这样最后一帧的位置会略小于 endPos，这是正确的（采样点在帧的开始时间）

          var progress = outFrame / outputTotalFrames;
          var outPosition = startPos + progress * outputRatio;

          // 根据输出位置查找原始帧
          var originalFrame = this.getOriginalFrameAtPosition(outPosition);
          originalFrame = Math.max(0, Math.min(totalFrames - 1, originalFrame));

          frameMap.push(originalFrame);
        }

        return frameMap;
      },

      /* MP4 转换功能 */

      /**
       * 打开转MP4弹窗（SVGA模式右侧弹窗）
       */
      openMP4Panel: function () {
        if (!this.svgaPlayer || !this.svga.hasFile || !this.originalVideoItem) {
          alert('请先加载 SVGA 文件');
          return;
        }

        // 初始化配置
        var videoItem = this.originalVideoItem;
        this.mp4Config.width = videoItem.videoSize.width;
        this.mp4Config.height = videoItem.videoSize.height;

        // 默认使用SVGA原始帧率
        var originalFps = videoItem.FPS || videoItem.fps || 30;
        this.mp4Config.fps = originalFps;

        // 读取localStorage中保存的配置（包括帧率和压缩质量）
        try {
          var savedFps = localStorage.getItem('mp4_fps');
          if (savedFps !== null) {
            this.mp4Config.fps = parseInt(savedFps);
          }

          var savedQuality = localStorage.getItem('mp4_quality');
          if (savedQuality !== null) {
            this.mp4Config.quality = parseInt(savedQuality);
          }
        } catch (e) {
          // 静默失败，使用默认配置
        }

        // 使用统一的右侧弹窗管理
        this.openRightPanel('showMP4Panel');

        // 预加载FFmpeg库（高优先级插队）
        if (!this.libraryLoader.loadedLibs['ffmpeg']) {
          this.loadLibrary('ffmpeg', true).catch(function () {
            // 静默失败，将在需要时重新加载
          });
        }
      },

      /**
       * 关闭转MP4弹窗
       */
      closeMP4Panel: function () {
        if (this.isConvertingMP4) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingMP4 = false;
          this.mp4ConvertProgress = 0;
        }
        this.showMP4Panel = false;
      },

      /* 普通MP4转双通道MP4功能 */

      /**
       * 打开普通MP4转双通道MP4弹窗
       */
      openMp4ToDualChannelPanel: function () {
        if (!this.mp4Video || !this.mp4.hasFile) {
          alert('请先加载 MP4 文件');
          return;
        }

        // 初始化配置
        this.mp4DualChannelConfig.width = this.mp4.originalWidth;
        this.mp4DualChannelConfig.height = this.mp4.originalHeight;
        this.mp4DualChannelConfig.aspectRatio = this.mp4.originalWidth / this.mp4.originalHeight;

        // 使用视频帧率
        var videoFps = this.mp4.fileInfo.fps || 30;
        this.mp4DualChannelConfig.fps = Math.min(120, Math.max(1, Math.round(parseFloat(videoFps))));

        // 读取保存的配置
        try {
          var savedQuality = localStorage.getItem('mp4_quality');
          if (savedQuality !== null) {
            this.mp4DualChannelConfig.quality = parseInt(savedQuality);
          }
        } catch (e) {
          // 静默失败，使用默认配置
        }

        this.openRightPanel('showMp4ToDualChannelPanel');

        // 预加载FFmpeg
        if (!this.libraryLoader.loadedLibs['ffmpeg']) {
          this.loadLibrary('ffmpeg', true);
        }
      },

      closeMp4ToDualChannelPanel: function () {
        if (this.isConvertingMP4) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingMP4 = false;
          this.mp4ConvertProgress = 0;
        }
        this.showMp4ToDualChannelPanel = false;
      },

      toggleMp4DualChannelModeDropdown: function () {
        this.showMp4DualChannelModeDropdown = !this.showMp4DualChannelModeDropdown;
      },

      selectMp4DualChannelMode: function (mode) {
        this.mp4DualChannelConfig.channelMode = mode;
        this.showMp4DualChannelModeDropdown = false;
      },

      onMp4DualChannelWidthChange: function () {
        var w = this.mp4DualChannelConfig.width;
        if (w > 0 && this.mp4DualChannelConfig.aspectRatio > 0) {
          this.mp4DualChannelConfig.height = Math.round(w / this.mp4DualChannelConfig.aspectRatio);
        }
      },

      onMp4DualChannelHeightChange: function () {
        var h = this.mp4DualChannelConfig.height;
        if (h > 0 && this.mp4DualChannelConfig.aspectRatio > 0) {
          this.mp4DualChannelConfig.width = Math.round(h * this.mp4DualChannelConfig.aspectRatio);
        }
      },

      cancelMp4ToDualChannelConversion: function () {
        if (confirm('确定要取消转换吗？')) {
          this.mp4ConvertCancelled = true;
        }
      },

      /**
       * 开始普通MP4转双通道MP4
       */
      startMp4ToDualChannelConversion: async function () {
        var _this = this;

        if (!this.mp4Video || !this.mp4.hasFile) {
          alert('请先加载 MP4 文件');
          return;
        }

        if (!this.confirmIfHasOngoingTasks('MP4转双通道', 'task')) {
          return;
        }

        // 参数验证
        var config = this.mp4DualChannelConfig;
        if (config.width < 1 || config.width > 9999) {
          alert('宽度超出范围！\n\n合法范围：1-9999 像素');
          return;
        }
        if (config.height < 1 || config.height > 9999) {
          alert('高度超出范围！\n\n合法范围：1-9999 像素');
          return;
        }
        if (config.quality < 1 || config.quality > 100) {
          alert('压缩质量超出范围！\n\n合法范围：1-100');
          return;
        }
        if (config.fps < 1 || config.fps > 120) {
          alert('帧率超出范围！\n\n合法范围：1-120 fps');
          return;
        }

        // 保存配置
        try {
          localStorage.setItem('mp4_quality', config.quality);
        } catch (e) { }

        this.isConvertingMP4 = true;
        this.mp4ConvertProgress = 0;
        this.mp4ConvertCancelled = false;
        this.mp4ConvertStage = 'loading';
        this.mp4ConvertMessage = '正在加载转换器...';

        try {
          // 1. 加载FFmpeg
          await this.loadFFmpeg();
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          // 2. 提取序列帧
          this.mp4ConvertStage = 'extracting';
          this.mp4ConvertMessage = '正在提取序列帧...';
          var frames = await this.extractMp4FramesForDualChannel();
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          // 3. 合成双通道
          this.mp4ConvertStage = 'composing';
          this.mp4ConvertMessage = '正在合成双通道...';
          var dualFrames = await this.composeDualChannelFrames(frames);
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          // 4. 编码为MP4
          this.mp4ConvertStage = 'encoding';
          this.mp4ConvertMessage = '正在编码为MP4...';

          // 准备音频参数（如果有音频）
          var audioOptions = null;
          if (this.mp4HasAudio && this.mp4.file) {
            var audioSpeedRatio = 1.0;
            if (this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
              audioSpeedRatio = this.mp4Video.duration / (frames.length / config.fps);
            }
            audioOptions = {
              file: this.mp4.file,
              originalDuration: this.mp4Video.duration,
              speedRatio: audioSpeedRatio
            };
          }

          var mp4Blob = await this.encodeMp4DualChannel(dualFrames, config, audioOptions);
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          // 5. 下载
          this.mp4ConvertStage = 'done';
          this.mp4ConvertMessage = '转换完成！';
          this.mp4ConvertProgress = 100;
          this.downloadDualChannelMP4(mp4Blob, 'mp4');

          setTimeout(function () {
            alert('✅ 转换完成！');
          }, 500);

        } catch (error) {
          if (error.message !== '用户取消转换') {
            console.error('MP4转双通道失败:', error);
            alert('转换失败：' + error.message);
          }
        } finally {
          this.isConvertingMP4 = false;
          this.mp4ConvertProgress = 0;
          this.mp4ConvertStage = '';
          this.mp4ConvertMessage = '';
        }
      },

      /**
       * 提取普通MP4的序列帧（用于双通道转换）
       */
      extractMp4FramesForDualChannel: async function () {
        var _this = this;
        var video = this.mp4Video;
        var config = this.mp4DualChannelConfig;
        var fps = config.fps;
        var duration = video.duration;
        var totalFrames = Math.ceil(duration * fps);
        var frames = [];

        // 变速支持：如果启用变速，使用帧映射表
        var frameMap = null;
        if (this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
          frameMap = this.buildFrameMap();
          if (frameMap && frameMap.length > 0) {
            totalFrames = frameMap.length;
          }
        }

        // 创建canvas
        var canvas = document.createElement('canvas');
        canvas.width = config.width;
        canvas.height = config.height;
        var ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });

        // 是否使用绿幕抠图
        var useChromaKey = this.chromaKeyEnabled;
        var chromaCanvas = null;
        var chromaCtx = null;

        if (useChromaKey) {
          // 绿幕抠图模式：从抠图后的canvas获取
          chromaCanvas = this.$refs.svgaContainer.querySelector('canvas.chromakey-canvas');
        }

        // 暂停视频
        var wasPlaying = !video.paused;
        video.pause();

        for (var i = 0; i < totalFrames; i++) {
          if (this.mp4ConvertCancelled) break;

          // 变速支持：使用帧映射表获取原始帧号
          var originalFrame = i;
          if (frameMap && frameMap[i] !== undefined) {
            originalFrame = frameMap[i];
          }

          var time = originalFrame / fps;
          video.currentTime = time;

          // 等待seek完成
          await new Promise(function (resolve) {
            video.onseeked = resolve;
          });

          // 清空并绘制
          ctx.clearRect(0, 0, config.width, config.height);

          if (useChromaKey && chromaCanvas) {
            // 从绿幕抠图 canvas获取（需要先渲染一帧）
            this.applyChromaKeyFrame();
            await new Promise(function (r) { setTimeout(r, 30); });
            ctx.drawImage(chromaCanvas, 0, 0, config.width, config.height);
          } else {
            // 普通模式：直接从视频绘制（不透明）
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, config.width, config.height);
            ctx.drawImage(video, 0, 0, config.width, config.height);
          }

          // 获取像素数据
          var imageData = ctx.getImageData(0, 0, config.width, config.height);
          frames.push(imageData);

          this.mp4ConvertProgress = Math.floor((i / totalFrames) * 30);
        }

        // 恢复播放
        if (wasPlaying) {
          video.play();
        }

        return frames;
      },

      /**
       * 应用绿幕抠图到当前帧
       */
      applyChromaKeyFrame: function () {
        var video = this.mp4Video;
        var container = this.$refs.svgaContainer;
        var canvas = container.querySelector('canvas.chromakey-canvas');
        if (!canvas || !video) return;

        var ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
        ctx.drawImage(video, 0, 0);

        // 应用绿幕抠图效果
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        var similarity = this.chromaKeySimilarity / 100;
        var smoothness = this.chromaKeySmoothness / 100;

        for (var i = 0; i < data.length; i += 4) {
          var r = data[i];
          var g = data[i + 1];
          var b = data[i + 2];

          var greenDiff = g - Math.max(r, b);
          var threshold = similarity * 255;

          if (greenDiff > threshold * 0.5) {
            var alpha = 1 - Math.min(1, (greenDiff - threshold * 0.5) / (threshold * smoothness + 1));
            data[i + 3] = Math.round(alpha * 255);
          }
        }

        ctx.putImageData(imageData, 0, 0);
      },

      /**
       * 合成双通道帧（普通MP4用）
       */
      /**
       * 编码双通道MP4（统一编码函数，支持多入口复用）
       * @param {Array<Uint8Array>} jpegFrames - JPEG帧数组
       * @param {Object} config - 配置参数
       * @param {Number} config.width - 单通道宽度
       * @param {Number} config.height - 高度
       * @param {Number} config.fps - 帧率
       * @param {Number} config.quality - 质量(1-100)
       * @param {Boolean} config.muted - 是否静音
       * @param {Object} audioOptions - 音频选项（可选）
       * @param {File} audioOptions.file - 音频源文件
       * @param {Number} audioOptions.originalDuration - 原始时长（秒）
       * @param {Number} audioOptions.speedRatio - 变速比例（可选，自动计算）
       * @returns {Promise<Blob>} - MP4 Blob
       */
      encodeMp4DualChannel: async function (jpegFrames, config, audioOptions) {
        var _this = this;
        var ffmpeg = this.ffmpeg;

        // 写入帧数据（使用v0.11.6 API）
        for (var i = 0; i < jpegFrames.length; i++) {
          var frameName = 'frame' + String(i).padStart(6, '0') + '.jpg';
          ffmpeg.FS('writeFile', frameName, jpegFrames[i]);
        }

        // 检查是否需要添加音频
        var hasAudio = false;
        var audioSpeedRatio = 1.0;

        if (!config.muted && audioOptions && audioOptions.file) {
          try {
            // 读取音频源文件
            var originalMp4Data = new Uint8Array(await audioOptions.file.arrayBuffer());
            ffmpeg.FS('writeFile', 'original.mp4', originalMp4Data);

            // 计算或使用音频变速比例
            if (audioOptions.speedRatio !== undefined) {
              audioSpeedRatio = audioOptions.speedRatio;
            } else if (audioOptions.originalDuration) {
              var outputDuration = jpegFrames.length / config.fps;
              audioSpeedRatio = audioOptions.originalDuration / outputDuration;
            }

            hasAudio = true;
          } catch (e) {
            // 失败也不阻塞
          }
        }

        // FFmpeg编码参数
        var crf = Math.round(51 - (config.quality / 100) * 33);
        var dualWidth = config.width * 2;

        var ffmpegArgs = [];

        if (hasAudio) {
          // 有音频：从原始文件提取音频，从序列帧生成视频，然后合并
          ffmpegArgs = [
            '-thread_queue_size', '512',  // 缓解消息队列阻塞（输入选项）
            '-framerate', String(config.fps),
            '-i', 'frame%06d.jpg',       // 视频输入（序列帧）
            '-thread_queue_size', '512',  // 第二个输入的缓冲区
            '-i', 'original.mp4',         // 音频输入（原始MP4）
            '-map', '0:v',                // 使用第一个输入的视频流
            '-map', '1:a',                // 使用第二个输入的音频流
            '-c:v', 'libx264',
            '-preset', 'fast',            // 编码速度优先（fast/faster避免卡顿）
            '-tune', 'animation',         // 优化动画压缩
            '-crf', String(crf),
            '-pix_fmt', 'yuv420p',
            '-s', dualWidth + 'x' + config.height,
            '-c:a', 'aac',                // 音频编码为AAC
            '-b:a', '128k'                // 音频比特率
          ];

          // 如果有变速，对音频应用atempo滤镜
          if (Math.abs(audioSpeedRatio - 1.0) > 0.01) {
            // atempo范围是0.5-2.0，如果超出需要链式处理
            var tempoFilter = this.buildAudioTempoFilter(audioSpeedRatio);
            ffmpegArgs.push('-af', tempoFilter);
          }

          ffmpegArgs.push('-shortest');  // 使用最短流的长度
          ffmpegArgs.push('-y', 'output.mp4');
        } else {
          // 无音频：只编码视频
          ffmpegArgs = [
            '-framerate', String(config.fps),
            '-i', 'frame%06d.jpg',
            '-c:v', 'libx264',
            '-preset', 'fast',            // 编码速度优先
            '-tune', 'animation',         // 优化动画压缩
            '-crf', String(crf),
            '-pix_fmt', 'yuv420p',
            '-s', dualWidth + 'x' + config.height,
            '-y', 'output.mp4'
          ];
        }

        ffmpeg.setProgress(function (p) {
          _this.mp4ConvertProgress = 60 + Math.floor(p.ratio * 40);
        });

        await ffmpeg.run.apply(ffmpeg, ffmpegArgs);

        // 读取输出（使用v0.11.6 API）
        var data = ffmpeg.FS('readFile', 'output.mp4');

        // 清理文件
        for (var i = 0; i < jpegFrames.length; i++) {
          var frameName = 'frame' + String(i).padStart(6, '0') + '.jpg';
          try { ffmpeg.FS('unlink', frameName); } catch (e) {
            // 静默失败
          }
        }
        try { ffmpeg.FS('unlink', 'output.mp4'); } catch (e) {
          // 静默失败
        }
        if (hasAudio) {
          try { ffmpeg.FS('unlink', 'original.mp4'); } catch (e) {
            // 静默失败
          }
        }

        return new Blob([data.buffer], { type: 'video/mp4' });
      },

      /**
       * 构建音频变速滤镜（atempo）
       * atempo参数范围是0.5-2.0，如果超出需要链式处理
       */
      buildAudioTempoFilter: function (speedRatio) {
        if (speedRatio >= 0.5 && speedRatio <= 2.0) {
          // 在范围内，直接使用
          return 'atempo=' + speedRatio.toFixed(4);
        }

        // 超出范围，需要链式处理
        var filters = [];
        var remaining = speedRatio;

        while (remaining > 2.0) {
          filters.push('atempo=2.0');
          remaining /= 2.0;
        }

        while (remaining < 0.5) {
          filters.push('atempo=0.5');
          remaining /= 0.5;
        }

        if (Math.abs(remaining - 1.0) > 0.01) {
          filters.push('atempo=' + remaining.toFixed(4));
        }

        return filters.join(',');
      },

      /**
       * 下载双通道MP4
       */
      downloadDualChannelMP4: function (blob, sourceType) {
        var baseName = 'dual-channel';
        if (sourceType === 'mp4' && this.mp4.fileInfo.name) {
          baseName = this.mp4.fileInfo.name.replace(/\.mp4$/i, '');
        } else if (sourceType === 'lottie' && this.lottie.fileInfo.name) {
          baseName = this.lottie.fileInfo.name.replace(/\.json$/i, '');
        }

        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = baseName + '_dual.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 100);
      },

      /* Lottie转双通道MP4功能 */

      /**
       * 打开Lottie转双通道MP4弹窗
       */
      openLottieToDualChannelPanel: function () {
        if (!this.lottiePlayer || !this.lottie.hasFile) {
          alert('请先加载 Lottie 文件');
          return;
        }

        // 初始化配置
        var animData = this.lottie.animationData;
        this.lottieDualChannelConfig.width = animData.w || 300;
        this.lottieDualChannelConfig.height = animData.h || 300;
        this.lottieDualChannelConfig.aspectRatio = this.lottieDualChannelConfig.width / this.lottieDualChannelConfig.height;

        var fr = animData.fr || 30;
        this.lottieDualChannelConfig.fps = Math.min(120, Math.max(1, Math.round(fr)));

        try {
          var savedQuality = localStorage.getItem('mp4_quality');
          if (savedQuality !== null) {
            this.lottieDualChannelConfig.quality = parseInt(savedQuality);
          }
        } catch (e) { }

        this.openRightPanel('showLottieToDualChannelPanel');

        if (!this.libraryLoader.loadedLibs['ffmpeg']) {
          this.loadLibrary('ffmpeg', true);
        }
      },

      closeLottieToDualChannelPanel: function () {
        if (this.isConvertingMP4) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingMP4 = false;
          this.mp4ConvertProgress = 0;
        }
        this.showLottieToDualChannelPanel = false;
      },

      toggleLottieDualChannelModeDropdown: function () {
        this.showLottieDualChannelModeDropdown = !this.showLottieDualChannelModeDropdown;
      },

      selectLottieDualChannelMode: function (mode) {
        this.lottieDualChannelConfig.channelMode = mode;
        this.showLottieDualChannelModeDropdown = false;
      },

      onLottieDualChannelWidthChange: function () {
        var w = this.lottieDualChannelConfig.width;
        if (w > 0 && this.lottieDualChannelConfig.aspectRatio > 0) {
          this.lottieDualChannelConfig.height = Math.round(w / this.lottieDualChannelConfig.aspectRatio);
        }
      },

      onLottieDualChannelHeightChange: function () {
        var h = this.lottieDualChannelConfig.height;
        if (h > 0 && this.lottieDualChannelConfig.aspectRatio > 0) {
          this.lottieDualChannelConfig.width = Math.round(h * this.lottieDualChannelConfig.aspectRatio);
        }
      },

      cancelLottieToDualChannelConversion: function () {
        if (confirm('确定要取消转换吗？')) {
          this.mp4ConvertCancelled = true;
        }
      },

      /**
       * 开始Lottie转双通道MP4
       */
      startLottieToDualChannelConversion: async function () {
        var _this = this;

        if (!this.lottiePlayer || !this.lottie.hasFile) {
          alert('请先加载 Lottie 文件');
          return;
        }

        if (!this.confirmIfHasOngoingTasks('Lottie转双通道', 'task')) {
          return;
        }

        var config = this.lottieDualChannelConfig;
        if (config.width < 1 || config.width > 9999) {
          alert('宽度超出范围！');
          return;
        }
        if (config.height < 1 || config.height > 9999) {
          alert('高度超出范围！');
          return;
        }
        if (config.quality < 1 || config.quality > 100) {
          alert('压缩质量超出范围！');
          return;
        }
        if (config.fps < 1 || config.fps > 120) {
          alert('帧率超出范围！');
          return;
        }

        try {
          localStorage.setItem('mp4_quality', config.quality);
        } catch (e) { }

        this.isConvertingMP4 = true;
        this.mp4ConvertProgress = 0;
        this.mp4ConvertCancelled = false;
        this.mp4ConvertStage = 'loading';
        this.mp4ConvertMessage = '正在加载转换器...';

        try {
          await this.loadFFmpeg();
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          this.mp4ConvertStage = 'extracting';
          this.mp4ConvertMessage = '正在提取序列帧...';
          var frames = await this.extractLottieFrames();
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          this.mp4ConvertStage = 'composing';
          this.mp4ConvertMessage = '正在合成双通道...';
          var dualFrames = await this.composeDualChannelFrames(frames);
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          this.mp4ConvertStage = 'encoding';
          this.mp4ConvertMessage = '正在编码为MP4...';
          // Lottie没有音频，传null
          var mp4Blob = await this.encodeMp4DualChannel(dualFrames, config, null);
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          this.mp4ConvertStage = 'done';
          this.mp4ConvertMessage = '转换完成！';
          this.mp4ConvertProgress = 100;
          this.downloadDualChannelMP4(mp4Blob, 'lottie');

          setTimeout(function () {
            alert('✅ 转换完成！');
          }, 500);

        } catch (error) {
          if (error.message !== '用户取消转换') {
            console.error('Lottie转双通道失败:', error);
            alert('转换失败：' + error.message);
          }
        } finally {
          this.isConvertingMP4 = false;
          this.mp4ConvertProgress = 0;
          this.mp4ConvertStage = '';
          this.mp4ConvertMessage = '';
        }
      },

      /**
       * 提取Lottie序列帧
       */
      extractLottieFrames: async function () {
        var _this = this;
        var player = this.lottiePlayer;
        var config = this.lottieDualChannelConfig;
        var animData = this.lottie.animationData;

        var totalFrames = animData.op - animData.ip; // Lottie总帧数
        var frames = [];

        // 获取canvas
        var container = this.$refs.svgaContainer;
        var sourceCanvas = container.querySelector('canvas');
        if (!sourceCanvas) {
          throw new Error('无法获取Lottie渲染canvas');
        }

        // 创建输出canvas
        var canvas = document.createElement('canvas');
        canvas.width = config.width;
        canvas.height = config.height;
        var ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });

        // 暂停播放
        var wasPlaying = !player.isPaused;
        player.pause();

        for (var i = 0; i < totalFrames; i++) {
          if (this.mp4ConvertCancelled) break;

          // 跳转到指定帧
          player.goToAndStop(i, true);

          // 等待渲染
          await new Promise(function (r) { setTimeout(r, 30); });

          // 清空并绘制
          ctx.clearRect(0, 0, config.width, config.height);
          ctx.drawImage(sourceCanvas, 0, 0, config.width, config.height);

          // 获取像素数据
          var imageData = ctx.getImageData(0, 0, config.width, config.height);
          frames.push(imageData);

          this.mp4ConvertProgress = Math.floor((i / totalFrames) * 30);
        }

        // 恢复播放
        if (wasPlaying) {
          player.play();
        }

        return frames;
      },

      /**
       * 合成双通道帧（Lottie用，复用MP4的逻辑）
       */
      /* SVGA 转换功能（双通道MP4转SVGA） */

      /**
       * 打开转SVGA弹窗（双通道MP4模式右侧弹窗）
       */
      openSVGAPanel: function () {
        if (!this.yyevaVideo || !this.yyeva.hasFile) {
          alert('请先加载双通道 MP4 文件');
          return;
        }

        // 初始化配置：使用双通道MP4视频的原始尺寸（显示尺寸，即宽度/2）
        this.svgaConfig.width = this.yyeva.displayWidth || Math.floor(this.yyeva.originalWidth / 2);
        this.svgaConfig.height = this.yyeva.displayHeight || this.yyeva.originalHeight;

        // 使用视频帧率，限制在1-60范围
        var videoFps = this.yyeva.fileInfo.fps || 30;
        this.svgaConfig.fps = Math.min(60, Math.max(1, Math.round(parseFloat(videoFps))));

        // 读取localStorage中保存的配置
        try {
          var savedQuality = localStorage.getItem('svga_quality');
          if (savedQuality !== null) {
            this.svgaConfig.quality = parseInt(savedQuality);
          }
        } catch (e) { }

        // 使用统一的右侧弹窗管理
        this.openRightPanel('showSVGAPanel');

        // 预加载protobuf和pako库
        this.loadLibrary(['protobuf', 'pako'], true).catch(function () {
          // 静默失败，将在需要时重新加载
        });
      },

      /**
       * 关闭转SVGA弹窗
       */
      closeSVGAPanel: function () {
        if (this.isConvertingSVGA) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingSVGA = false;
          this.svgaConvertProgress = 0;
          this.svgaConvertCancelled = true;
        }
        this.showSVGAPanel = false;
      },

      cancelSVGAConversion: function () {
        this.svgaConvertCancelled = true;
        this.isConvertingSVGA = false;
        this.svgaConvertProgress = 0;
        this.svgaConvertStage = '';
        this.svgaConvertMessage = '';
      },

      /* ==================== 普通MP4转SVGA ==================== */

      /**
       * 打开/关闭普通MP4转SVGA弹窗
       */
      openMp4ToSvgaPanel: function () {
        if (!this.mp4Video || !this.mp4.hasFile) {
          alert('请先加载 MP4 文件');
          return;
        }

        // 初始化配置：使用MP4视频的原始尺寸
        this.mp4ToSvgaConfig.width = this.mp4.originalWidth || 0;
        this.mp4ToSvgaConfig.height = this.mp4.originalHeight || 0;

        // 使用视频帧率，限制在1-60范围
        var videoFps = this.mp4.fileInfo.fps || 30;
        this.mp4ToSvgaConfig.fps = Math.min(60, Math.max(1, Math.round(parseFloat(videoFps))));

        // 读取localStorage中保存的配置
        try {
          var savedConfig = localStorage.getItem('mp4ToSvgaConfig');
          if (savedConfig) {
            var parsed = JSON.parse(savedConfig);
            if (parsed.quality) this.mp4ToSvgaConfig.quality = parsed.quality;
          }
        } catch (e) { /* 忽略 */ }

        // 使用统一的弹窗管理
        this.openRightPanel('showMp4ToSvgaPanel');

        // 预加载protobuf和pako库
        this.loadLibrary(['protobuf', 'pako'], true).catch(function () {
          // 静默失败，将在需要时重新加载
        });
      },

      /**
       * 关闭普通MP4转SVGA弹窗
       */
      closeMp4ToSvgaPanel: function () {
        if (this.isConvertingMp4ToSvga) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingMp4ToSvga = false;
          this.mp4ToSvgaProgress = 0;
          this.mp4ToSvgaCancelled = true;
        }
        this.showMp4ToSvgaPanel = false;
      },

      /**
       * 取消普通MP4转SVGA转换
       */
      cancelMp4ToSvgaConversion: function () {
        this.mp4ToSvgaCancelled = true;
        this.isConvertingMp4ToSvga = false;
        this.mp4ToSvgaProgress = 0;
        this.mp4ToSvgaStage = '';
        this.mp4ToSvgaMessage = '';
      },

      /**
       * 普通MP4转SVGA宽度变化（保持比例）
       */
      onMp4ToSvgaWidthChange: function () {
        var originalWidth = this.mp4.originalWidth || 0;
        var originalHeight = this.mp4.originalHeight || 0;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalHeight / originalWidth;
        var newWidth = Math.max(1, Math.min(3000, parseInt(this.mp4ToSvgaConfig.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.mp4ToSvgaConfig.width = newWidth;
        this.mp4ToSvgaConfig.height = newHeight;
      },

      /**
       * 普通MP4转SVGA高度变化（保持比例）
       */
      onMp4ToSvgaHeightChange: function () {
        var originalWidth = this.mp4.originalWidth || 0;
        var originalHeight = this.mp4.originalHeight || 0;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalWidth / originalHeight;
        var newHeight = Math.max(1, Math.min(3000, parseInt(this.mp4ToSvgaConfig.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.mp4ToSvgaConfig.width = newWidth;
        this.mp4ToSvgaConfig.height = newHeight;
      },

      /**
       * 开始普通MP4转SVGA转换
       * 流程：MP4提取序列帧 -> 生成SVGA
       * 如果开启了绿幕抠图，则提取抠图后的半透明序列帧
       */
      startMp4ToSvgaConversion: async function () {
        var _this = this;

        // 前置检查
        if (!this.mp4Video || !this.mp4.hasFile) {
          alert('请先加载 MP4 文件');
          return;
        }

        // 检查是否有其他正在进行的任务
        if (!this.confirmIfHasOngoingTasks('转SVGA', 'task')) {
          return;
        }

        try {
          this.isConvertingMp4ToSvga = true;
          this.mp4ToSvgaProgress = 0;
          this.mp4ToSvgaCancelled = false;
          this.mp4ToSvgaStage = 'loading';
          this.mp4ToSvgaMessage = '加载库...';

          // 加载必要的库
          await this.loadLibrary(['protobuf', 'pako'], false);

          if (this.mp4ToSvgaCancelled) return;

          this.mp4ToSvgaStage = 'extracting';
          this.mp4ToSvgaMessage = '提取帧...';

          // 提取帧 - 如果开启了绿幕抠图，则提取抠图后的帧
          var frames = await this.extractMp4Frames();

          if (this.mp4ToSvgaCancelled) {
            frames = null;
            return;
          }

          // 提取音频（如果未静音）
          var audios = null;
          if (!this.mp4ToSvgaConfig.muted && this.mp4.file) {
            this.mp4ToSvgaMessage = '提取音频...';
            try {
              await this.loadFFmpeg();
              audios = await this.extractAudioFromMp4(this.mp4.file, frames.length, this.mp4ToSvgaConfig.fps);
            } catch (e) {
              // 静默失败，将导出无音频的SVGA
            }
            if (this.mp4ToSvgaCancelled) return;
          }

          this.mp4ToSvgaStage = 'building';

          // 使用通用SVGA构建方法
          var svgaBlob = await this.buildSVGAFromConfig('mp4', {
            frames: frames,
            width: this.mp4ToSvgaConfig.width,
            height: this.mp4ToSvgaConfig.height,
            fps: this.mp4ToSvgaConfig.fps,
            quality: this.mp4ToSvgaConfig.quality,
            audios: audios,
            muted: this.mp4ToSvgaConfig.muted,
            dependencies: {
              protobuf: protobuf,
              pako: pako
            }
          }, {
            progressField: 'mp4ToSvgaProgress',
            messageField: 'mp4ToSvgaMessage',
            cancelledField: 'mp4ToSvgaCancelled'
          });

          if (this.mp4ToSvgaCancelled) return;

          // 下载文件
          var originalName = (this.mp4.fileInfo.name || 'video').replace(/\.[^.]+$/, '');
          this.downloadSVGA(svgaBlob, originalName + '.svga');

          alert('✅ 转换完成！\n\n已成功生成SVGA文件。');

          // 保存配置到localStorage
          try {
            localStorage.setItem('mp4ToSvgaConfig', JSON.stringify({
              quality: this.mp4ToSvgaConfig.quality
            }));
          } catch (e) { /* 忽略 */ }

          // 重置状态
          setTimeout(function () {
            _this.isConvertingMp4ToSvga = false;
            _this.mp4ToSvgaProgress = 0;
            _this.mp4ToSvgaStage = '';
            _this.mp4ToSvgaMessage = '';
          }, 1000);

        } catch (error) {
          console.error('MP4转SVGA失败:', error);
          alert('转换失败: ' + error.message);
          this.isConvertingMp4ToSvga = false;
          this.mp4ToSvgaProgress = 0;
          this.mp4ToSvgaStage = '';
          this.mp4ToSvgaMessage = '';
        }
      },

      /**
       * 从MP4提取序列帧
       * 如果开启了绿幕抠图，则提取抠图后的半透明帧
       */
      extractMp4Frames: async function () {
        var _this = this;
        var video = this.mp4Video;
        var fps = this.mp4ToSvgaConfig.fps;
        var duration = video.duration;
        var totalFrames = Math.ceil(duration * fps);
        var frames = [];

        // 变速支持：如果启用变速，使用帧映射表
        var frameMap = null;
        if (this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
          frameMap = this.buildFrameMap();
          if (frameMap && frameMap.length > 0) {
            totalFrames = frameMap.length;
          }
        }

        // 创建canvas用于提取帧
        var canvas = document.createElement('canvas');
        canvas.width = this.mp4.originalWidth;
        canvas.height = this.mp4.originalHeight;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });

        // 是否开启了绿幕抠图
        var useChromaKey = this.chromaKeyEnabled;

        for (var i = 0; i < totalFrames; i++) {
          if (this.mp4ToSvgaCancelled) break;

          // 变速支持：使用帧映射表获取原始帧号
          var originalFrame = i;
          if (frameMap && frameMap[i] !== undefined) {
            originalFrame = frameMap[i];
          }

          var time = originalFrame / fps;
          if (time > duration) time = duration;

          // seek到指定时间
          video.currentTime = time;
          await new Promise(function (resolve) {
            video.onseeked = resolve;
          });

          // 绘制帧
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (useChromaKey) {
            // 应用绿幕抠图
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            this.applyChromaKeyToImageData(imageData);
            ctx.putImageData(imageData, 0, 0);
          }

          // 转为PNG blob
          var blob = await new Promise(function (resolve) {
            canvas.toBlob(resolve, 'image/png');
          });

          frames.push({
            index: i,
            blob: blob
          });

          // 更新进度
          _this.mp4ToSvgaProgress = Math.round((i / totalFrames) * 50);
        }

        return frames;
      },

      /**
       * 对ImageData应用绿幕抠图
       * 算法与实时预览(renderChromaKey)保持一致
       */
      applyChromaKeyToImageData: function (imageData) {
        var data = imageData.data;
        var similarity = this.chromaKeySimilarity / 100;
        var smoothness = this.chromaKeySmoothness / 100;

        for (var i = 0; i < data.length; i += 4) {
          var r = data[i];
          var g = data[i + 1];
          var b = data[i + 2];

          // 检测绿色：绿色通道明显高于红色和蓝色
          // 与实时预览算法一致
          var isGreen = (g > r * (1 + similarity) && g > b * (1 + similarity));

          if (isGreen) {
            // 计算透明度（根据平滑度）
            var greenStrength = (g - Math.max(r, b)) / 255;
            var alpha = Math.max(0, 1 - greenStrength / (1 - smoothness + 0.01));
            data[i + 3] = Math.floor(alpha * 255);
          }
        }
      },

      /* ==================== Lottie转SVGA ==================== */

      /**
       * 打开Lottie转SVGA弹窗
       */
      openLottieToSvgaPanel: function () {
        if (!this.lottiePlayer || !this.lottie.hasFile) {
          alert('请先加载 Lottie 文件');
          return;
        }

        // 初始化配置
        this.lottieToSvgaConfig.width = this.lottie.originalWidth || 0;
        this.lottieToSvgaConfig.height = this.lottie.originalHeight || 0;

        var fps = this.lottie.frameRate || 30;
        this.lottieToSvgaConfig.fps = Math.min(60, Math.max(1, Math.round(fps)));

        // 读取localStorage中保存的配置
        try {
          var savedConfig = localStorage.getItem('lottieToSvgaConfig');
          if (savedConfig) {
            var parsed = JSON.parse(savedConfig);
            if (parsed.quality) this.lottieToSvgaConfig.quality = parsed.quality;
          }
        } catch (e) { }

        this.openRightPanel('showLottieToSvgaPanel');

        // 预加载protobuf和pako库
        this.loadLibrary(['protobuf', 'pako'], true).catch(function () {
          // 静默失败，将在需要时重新加载
        });
      },

      closeLottieToSvgaPanel: function () {
        if (this.isConvertingLottieToSvga) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingLottieToSvga = false;
          this.lottieToSvgaProgress = 0;
          this.lottieToSvgaCancelled = true;
        }
        this.showLottieToSvgaPanel = false;
      },

      onLottieToSvgaWidthChange: function () {
        var originalWidth = this.lottie.originalWidth;
        var originalHeight = this.lottie.originalHeight;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalHeight / originalWidth;
        var newWidth = Math.max(1, Math.min(3000, parseInt(this.lottieToSvgaConfig.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.lottieToSvgaConfig.width = newWidth;
        this.lottieToSvgaConfig.height = newHeight;
      },

      onLottieToSvgaHeightChange: function () {
        var originalWidth = this.lottie.originalWidth;
        var originalHeight = this.lottie.originalHeight;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalWidth / originalHeight;
        var newHeight = Math.max(1, Math.min(3000, parseInt(this.lottieToSvgaConfig.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.lottieToSvgaConfig.width = newWidth;
        this.lottieToSvgaConfig.height = newHeight;
      },

      /**
       * Lottie转SVGA - 提取帧并构建SVGA
       */
      startLottieToSvgaConversion: async function () {
        var _this = this;

        if (!this.lottiePlayer || !this.lottie.hasFile) {
          alert('请先加载 Lottie 文件');
          return;
        }

        if (!this.confirmIfHasOngoingTasks('Lottie转SVGA', 'task')) {
          return;
        }

        // 参数验证
        var width = this.lottieToSvgaConfig.width;
        var height = this.lottieToSvgaConfig.height;
        var quality = this.lottieToSvgaConfig.quality;
        var fps = this.lottieToSvgaConfig.fps;

        if (width < 1 || width > 3000 || height < 1 || height > 3000) {
          alert('尺寸超出范围！合法范围：1-3000 像素');
          return;
        }

        this.isConvertingLottieToSvga = true;
        this.lottieToSvgaProgress = 0;
        this.lottieToSvgaCancelled = false;
        this.lottieToSvgaStage = 'loading';
        this.lottieToSvgaMessage = '加载库...';

        try {
          await this.loadLibrary(['protobuf', 'pako'], false);
          if (this.lottieToSvgaCancelled) return;

          this.lottieToSvgaStage = 'extracting';
          this.lottieToSvgaMessage = '提取帧...';

          // 提取帧
          var frames = await this.extractLottieFramesForSvga();
          if (this.lottieToSvgaCancelled) return;

          this.lottieToSvgaStage = 'building';
          this.lottieToSvgaMessage = '生成SVGA...';

          // 使用通用SVGA构建方法
          var svgaBlob = await this.buildSVGAFromConfig('lottie', {
            frames: frames,
            width: width,
            height: height,
            fps: fps,
            quality: quality,
            dependencies: {
              protobuf: protobuf,
              pako: pako
            }
          }, {
            progressField: 'lottieToSvgaProgress',
            messageField: 'lottieToSvgaMessage',
            cancelledField: 'lottieToSvgaCancelled'
          });

          if (this.lottieToSvgaCancelled) return;

          // 下载文件
          var originalName = (this.lottie.file.name || 'animation').replace(/\.[^.]+$/, '');
          this.downloadSVGA(svgaBlob, originalName + '.svga');

          alert('✅ 转换完成！\n\n已成功生成SVGA文件。');

          try {
            localStorage.setItem('lottieToSvgaConfig', JSON.stringify({ quality: quality }));
          } catch (e) {
            // 静默失败
          }

          setTimeout(function () {
            _this.isConvertingLottieToSvga = false;
            _this.lottieToSvgaProgress = 0;
            _this.lottieToSvgaStage = '';
            _this.lottieToSvgaMessage = '';
          }, 1000);

        } catch (error) {
          console.error('Lottie转SVGA失败:', error);
          alert('转换失败: ' + error.message);
          this.isConvertingLottieToSvga = false;
          this.lottieToSvgaProgress = 0;
          this.lottieToSvgaStage = '';
          this.lottieToSvgaMessage = '';
        }
      },

      /**
       * 从Lottie提取序列帧
       */
      extractLottieFramesForSvga: async function () {
        var _this = this;
        var player = this.lottiePlayer;
        var fps = this.lottieToSvgaConfig.fps;
        var width = this.lottieToSvgaConfig.width;
        var height = this.lottieToSvgaConfig.height;
        var totalFrames = player.totalFrames || this.totalFrames;
        var frames = [];

        // 创建离屏canvas
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');

        // 保存当前播放状态
        var wasPlaying = this.isPlaying;
        if (wasPlaying) {
          player.pause();
          this.isPlaying = false;
        }

        // 获取Lottie的容器元素（SVG或Canvas）
        var lottieEl = this.$refs.svgaContainer.querySelector('svg, canvas');

        for (var i = 0; i < totalFrames; i++) {
          if (this.lottieToSvgaCancelled) break;

          player.goToAndStop(i, true);
          await new Promise(function (r) { setTimeout(r, 20); });

          ctx.clearRect(0, 0, width, height);

          if (lottieEl && lottieEl.tagName === 'SVG') {
            // SVG渲染器
            var svgData = new XMLSerializer().serializeToString(lottieEl);
            var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            var svgUrl = URL.createObjectURL(svgBlob);

            var img = new Image();
            img.width = width;
            img.height = height;
            await new Promise(function (resolve, reject) {
              img.onload = resolve;
              img.onerror = reject;
              img.src = svgUrl;
            });

            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(svgUrl);
          } else if (lottieEl && lottieEl.tagName === 'CANVAS') {
            // Canvas渲染器
            ctx.drawImage(lottieEl, 0, 0, width, height);
          }

          var blob = await new Promise(function (resolve) {
            canvas.toBlob(resolve, 'image/png');
          });

          frames.push({ index: i, blob: blob });
          _this.lottieToSvgaProgress = Math.round((i / totalFrames) * 50);
        }

        return frames;
      },

      /* ==================== 序列帧转SVGA ==================== */

      /**
       * 打开序列帧转SVGA弹窗
       */
      openFramesToSvgaPanel: function () {
        if (!this.frames.hasFile || !this.frames.files.length) {
          alert('请先加载序列帧文件');
          return;
        }

        // 初始化配置
        this.framesToSvgaConfig.width = this.frames.originalWidth || 0;
        this.framesToSvgaConfig.height = this.frames.originalHeight || 0;
        this.framesToSvgaConfig.fps = this.frames.fileInfo.fps || 25;

        // 读取localStorage中保存的配置
        try {
          var savedConfig = localStorage.getItem('framesToSvgaConfig');
          if (savedConfig) {
            var parsed = JSON.parse(savedConfig);
            if (parsed.quality) this.framesToSvgaConfig.quality = parsed.quality;
          }
        } catch (e) { }

        this.openRightPanel('showFramesToSvgaPanel');

        // 预加载protobuf和pako库
        this.loadLibrary(['protobuf', 'pako'], true).catch(function () {
          // 静默失败，将在需要时重新加载
        });
      },

      closeFramesToSvgaPanel: function () {
        if (this.isConvertingFramesToSvga) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingFramesToSvga = false;
          this.framesToSvgaProgress = 0;
          this.framesToSvgaCancelled = true;
        }
        this.showFramesToSvgaPanel = false;
      },

      onFramesToSvgaWidthChange: function () {
        var originalWidth = this.frames.originalWidth;
        var originalHeight = this.frames.originalHeight;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalHeight / originalWidth;
        var newWidth = Math.max(1, Math.min(3000, parseInt(this.framesToSvgaConfig.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.framesToSvgaConfig.width = newWidth;
        this.framesToSvgaConfig.height = newHeight;
      },

      onFramesToSvgaHeightChange: function () {
        var originalWidth = this.frames.originalWidth;
        var originalHeight = this.frames.originalHeight;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalWidth / originalHeight;
        var newHeight = Math.max(1, Math.min(3000, parseInt(this.framesToSvgaConfig.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.framesToSvgaConfig.width = newWidth;
        this.framesToSvgaConfig.height = newHeight;
      },

      /**
       * 序列帧转SVGA
       */
      startFramesToSvgaConversion: async function () {
        var _this = this;

        if (!this.frames.hasFile || !this.frames.files.length) {
          alert('请先加载序列帧文件');
          return;
        }

        if (!this.confirmIfHasOngoingTasks('序列帧转SVGA', 'task')) {
          return;
        }

        var width = this.framesToSvgaConfig.width;
        var height = this.framesToSvgaConfig.height;
        var quality = this.framesToSvgaConfig.quality;
        var fps = this.framesToSvgaConfig.fps;

        if (width < 1 || width > 3000 || height < 1 || height > 3000) {
          alert('尺寸超出范围！合法范围：1-3000 像素');
          return;
        }

        this.isConvertingFramesToSvga = true;
        this.framesToSvgaProgress = 0;
        this.framesToSvgaCancelled = false;
        this.framesToSvgaStage = 'loading';
        this.framesToSvgaMessage = '加载库...';

        try {
          await this.loadLibrary(['protobuf', 'pako'], false);
          if (this.framesToSvgaCancelled) return;

          this.framesToSvgaStage = 'extracting';
          this.framesToSvgaMessage = '处理帧...';

          // 将File对象转为SVGABuilder需要的格式
          var frames = [];
          var files = this.frames.files;
          for (var i = 0; i < files.length; i++) {
            if (this.framesToSvgaCancelled) break;
            frames.push({ index: i, blob: files[i] });
            _this.framesToSvgaProgress = Math.round((i / files.length) * 50);
          }

          if (this.framesToSvgaCancelled) return;

          this.framesToSvgaStage = 'building';

          // 使用通用SVGA构建方法
          var svgaBlob = await this.buildSVGAFromConfig('frames', {
            frames: frames,
            width: width,
            height: height,
            fps: fps,
            quality: quality,
            dependencies: {
              protobuf: protobuf,
              pako: pako
            }
          }, {
            progressField: 'framesToSvgaProgress',
            messageField: 'framesToSvgaMessage',
            cancelledField: 'framesToSvgaCancelled'
          });

          if (this.framesToSvgaCancelled) return;

          // 下载文件
          this.downloadSVGA(svgaBlob, 'sequence.svga');

          alert('✅ 转换完成！\n\n已成功生成SVGA文件。');

          try {
            localStorage.setItem('framesToSvgaConfig', JSON.stringify({ quality: quality }));
          } catch (e) { }

          setTimeout(function () {
            _this.isConvertingFramesToSvga = false;
            _this.framesToSvgaProgress = 0;
            _this.framesToSvgaStage = '';
            _this.framesToSvgaMessage = '';
          }, 1000);

        } catch (error) {
          console.error('序列帧转SVGA失败:', error);
          alert('转换失败: ' + error.message);
          this.isConvertingFramesToSvga = false;
          this.framesToSvgaProgress = 0;
          this.framesToSvgaStage = '';
          this.framesToSvgaMessage = '';
        }
      },

      /* 序列帧转双通道MP4功能 */

      /**
       * 打开序列帧转双通道MP4弹窗
       */
      openFramesToDualChannelPanel: function () {
        if (!this.frames.hasFile || !this.frames.files.length) {
          alert('请先加载序列帧文件');
          return;
        }

        // 初始化配置
        this.framesToDualChannelConfig.width = this.frames.originalWidth;
        this.framesToDualChannelConfig.height = this.frames.originalHeight;
        this.framesToDualChannelConfig.fps = this.frames.fileInfo.fps || 25;

        // 读取保存的配置
        try {
          var savedQuality = localStorage.getItem('mp4_quality');
          if (savedQuality !== null) {
            this.framesToDualChannelConfig.quality = parseInt(savedQuality);
          }
        } catch (e) { }

        this.openRightPanel('showFramesToDualChannelPanel');

        // 预加载FFmpeg
        if (!this.libraryLoader.loadedLibs['ffmpeg']) {
          this.loadLibrary('ffmpeg', true);
        }
      },

      closeFramesToDualChannelPanel: function () {
        if (this.isConvertingFramesToDualChannel) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingFramesToDualChannel = false;
          this.framesToDualChannelProgress = 0;
          this.framesToDualChannelCancelled = true;
        }
        this.showFramesToDualChannelPanel = false;
      },

      onFramesToDualChannelWidthChange: function () {
        var originalWidth = this.frames.originalWidth;
        var originalHeight = this.frames.originalHeight;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalHeight / originalWidth;
        var newWidth = Math.max(1, Math.min(3000, parseInt(this.framesToDualChannelConfig.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.framesToDualChannelConfig.width = newWidth;
        this.framesToDualChannelConfig.height = newHeight;
      },

      onFramesToDualChannelHeightChange: function () {
        var originalWidth = this.frames.originalWidth;
        var originalHeight = this.frames.originalHeight;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalWidth / originalHeight;
        var newHeight = Math.max(1, Math.min(3000, parseInt(this.framesToDualChannelConfig.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.framesToDualChannelConfig.width = newWidth;
        this.framesToDualChannelConfig.height = newHeight;
      },

      /**
       * 开始序列帧转双通道MP4
       */
      startFramesToDualChannelConversion: async function () {
        var _this = this;

        if (!this.frames.hasFile || !this.frames.files.length) {
          alert('请先加载序列帧文件');
          return;
        }

        if (!this.confirmIfHasOngoingTasks('序列帧转MP4', 'task')) {
          return;
        }

        var config = this.framesToDualChannelConfig;

        // 参数验证
        if (config.width < 1 || config.width > 9999) {
          alert('宽度超出范围！\n\n合法范围：1-9999 像素');
          return;
        }
        if (config.height < 1 || config.height > 9999) {
          alert('高度超出范围！\n\n合法范围：1-9999 像素');
          return;
        }
        if (config.quality < 1 || config.quality > 100) {
          alert('压缩质量超出范围！\n\n合法范围：1-100');
          return;
        }
        if (config.fps < 1 || config.fps > 120) {
          alert('帧率超出范围！\n\n合法范围：1-120 fps');
          return;
        }

        // 保存配置
        try {
          localStorage.setItem('mp4_quality', config.quality);
        } catch (e) { }

        this.isConvertingFramesToDualChannel = true;
        this.framesToDualChannelProgress = 0;
        this.framesToDualChannelCancelled = false;
        this.framesToDualChannelStage = 'loading';
        this.framesToDualChannelMessage = '正在加载转换器...';

        try {
          // 1. 加载FFmpeg
          await this.loadFFmpeg();
          if (this.framesToDualChannelCancelled) throw new Error('用户取消转换');

          // 2. 提取序列帧
          this.framesToDualChannelStage = 'extracting';
          this.framesToDualChannelMessage = '正在提取序列帧...';
          var frames = await this.extractFramesForDualChannel();
          if (this.framesToDualChannelCancelled) throw new Error('用户取消转换');

          // 3. 合成双通道
          this.framesToDualChannelStage = 'composing';
          this.framesToDualChannelMessage = '正在合成双通道...';
          var dualFrames = await this.composeFramesDualChannel(frames);
          if (this.framesToDualChannelCancelled) throw new Error('用户取消转换');

          // 4. 编码为MP4
          this.framesToDualChannelStage = 'encoding';
          this.framesToDualChannelMessage = '正在编码为MP4...';
          // 序列帧没有音频，传null
          var mp4Blob = await this.encodeMp4DualChannel(dualFrames, config, null);
          if (this.framesToDualChannelCancelled) throw new Error('用户取消转换');

          // 5. 下载
          this.framesToDualChannelStage = 'done';
          this.framesToDualChannelMessage = '转换完成！';
          this.framesToDualChannelProgress = 100;
          this.downloadDualChannelMP4(mp4Blob, 'frames');

          setTimeout(function () {
            alert('✅ 转换完成！');
          }, 500);

        } catch (error) {
          if (error.message !== '用户取消转换') {
            console.error('序列帧转双通道MP4失败:', error);
            alert('转换失败：' + error.message);
          }
        } finally {
          this.isConvertingFramesToDualChannel = false;
          this.framesToDualChannelProgress = 0;
          this.framesToDualChannelStage = '';
          this.framesToDualChannelMessage = '';
        }
      },

      /**
       * 提取序列帧为ImageData数组（用于双通道转换）
       */
      extractFramesForDualChannel: async function () {
        var _this = this;
        var config = this.framesToDualChannelConfig;
        var images = this.framesImages;
        var totalFrames = images.length;
        var frames = [];

        // 创建canvas
        var canvas = document.createElement('canvas');
        canvas.width = config.width;
        canvas.height = config.height;
        var ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });

        for (var i = 0; i < totalFrames; i++) {
          if (this.framesToDualChannelCancelled) break;

          var img = images[i];

          // 清空并绘制
          ctx.clearRect(0, 0, config.width, config.height);
          ctx.drawImage(img, 0, 0, config.width, config.height);

          // 获取像素数据
          var imageData = ctx.getImageData(0, 0, config.width, config.height);
          frames.push(imageData);

          this.framesToDualChannelProgress = Math.floor((i / totalFrames) * 30);
        }

        return frames;
      },

      /**
       * 合成双通道帧（序列帧用）
       */
      composeFramesDualChannel: async function (frames) {
        var _this = this;

        return DualChannelComposer.composeToJPEG(frames, {
          mode: this.framesToDualChannelConfig.channelMode,
          onProgress: function (progress) {
            _this.framesToDualChannelProgress = 30 + Math.round(progress * 30);
            _this.framesToDualChannelMessage = '合成双通道帧 ' + Math.round(progress * frames.length) + '/' + frames.length;
          },
          onCancel: function () {
            return _this.framesToDualChannelCancelled;
          }
        });
      },

      onSVGAWidthChange: function () {
        // 保持比例，修改高度
        var originalWidth = this.yyeva.displayWidth || Math.floor(this.yyeva.originalWidth / 2);
        var originalHeight = this.yyeva.displayHeight || this.yyeva.originalHeight;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalHeight / originalWidth;
        var newWidth = Math.max(1, Math.min(3000, parseInt(this.svgaConfig.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.svgaConfig.width = newWidth;
        this.svgaConfig.height = newHeight;
      },

      onSVGAHeightChange: function () {
        // 保持比例，修改宽度
        var originalWidth = this.yyeva.displayWidth || Math.floor(this.yyeva.originalWidth / 2);
        var originalHeight = this.yyeva.displayHeight || this.yyeva.originalHeight;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalWidth / originalHeight;
        var newHeight = Math.max(1, Math.min(3000, parseInt(this.svgaConfig.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.svgaConfig.width = newWidth;
        this.svgaConfig.height = newHeight;
      },

      /* ==================== 格式转换：MP4转SVGA ==================== */

      /**
       * 开始双通道MP4转SVGA转换
       */
      startSVGAConversion: async function () {
        var _this = this;

        // 前置检查
        if (!this.yyevaVideo || !this.yyeva.hasFile) {
          alert('请先加载双通道 MP4 文件');
          return;
        }

        // 检查是否有其他正在进行的任务
        if (!this.confirmIfHasOngoingTasks('转SVGA', 'task')) {
          return; // 用户取消
        }

        // 参数验证
        var width = this.svgaConfig.width;
        var height = this.svgaConfig.height;
        var quality = this.svgaConfig.quality;
        var fps = this.svgaConfig.fps;

        if (width < 1 || width > 3000) {
          alert('宽度超出范围！\n\n合法范围：1-3000 像素\n当前值：' + width);
          return;
        }

        if (height < 1 || height > 3000) {
          alert('高度超出范围！\n\n合法范围：1-3000 像素\n当前值：' + height);
          return;
        }

        if (quality < 1 || quality > 100) {
          alert('压缩质量超出范围！\n\n合法范围：1-100\n当前值：' + quality);
          return;
        }

        if (fps < 1 || fps > 60) {
          alert('帧率超出范围！\n\n合法范围：1-60 fps\n当前值：' + fps);
          return;
        }

        // 保存配置到localStorage
        try {
          localStorage.setItem('svga_quality', this.svgaConfig.quality);
        } catch (e) { }

        this.isConvertingSVGA = true;
        this.svgaConvertProgress = 0;
        this.svgaConvertCancelled = false;
        this.svgaConvertStage = 'loading';
        this.svgaConvertMessage = '正在加载库...';

        try {
          // 1. 加载 protobuf 和 pako
          await this.loadLibrary(['protobuf', 'pako'], true);
          if (this.svgaConvertCancelled) throw new Error('用户取消转换');

          // 2. 提取序列帧
          this.svgaConvertStage = 'extracting';
          this.svgaConvertMessage = '正在提取序列帧...';
          var frameData = await this.extractYyevaFrames();
          if (this.svgaConvertCancelled) throw new Error('用户取消转换');

          // 2.5 提取音频（如果未静音）
          var audios = null;
          if (!this.svgaConfig.muted && this.yyeva.file) {
            this.svgaConvertMessage = '正在提取音频...';
            try {
              await this.loadFFmpeg();
              audios = await this.extractAudioFromMp4(this.yyeva.file, frameData.frames.length, this.svgaConfig.fps);
            } catch (e) {
              // 静默失败，将导出无音频的SVGA
            }
            if (this.svgaConvertCancelled) throw new Error('用户取消转换');
          }

          // 3. 构建SVGA文件
          this.svgaConvertStage = 'building';

          // 使用通用SVGA构建方法（buildFromPNG模式）
          var svgaBlob = await this.buildSVGAFromConfig('yyeva', {
            buildType: 'fromPNG',
            frames: frameData.frames,
            scaledWidth: frameData.scaledWidth,
            scaledHeight: frameData.scaledHeight,
            displayWidth: frameData.displayWidth,
            displayHeight: frameData.displayHeight,
            scaleFactor: frameData.scaleFactor,
            fps: this.svgaConfig.fps,
            audios: audios,
            muted: this.svgaConfig.muted,
            dependencies: {
              protobuf: protobuf,
              pako: pako
            }
          }, {
            progressField: 'svgaConvertProgress',
            messageField: 'svgaConvertMessage',
            cancelledField: 'svgaConvertCancelled'
          });

          if (this.svgaConvertCancelled) throw new Error('用户取消转换');

          // 4. 下载文件
          this.svgaConvertStage = 'done';
          var originalName = this.yyeva.fileInfo.name.replace(/\.mp4$/i, '');
          this.downloadSVGA(svgaBlob, originalName + '.svga');

          alert('✅ 转换完成！\n\n已成功生成SVGA文件。');

        } catch (error) {
          if (error.message !== '用户取消转换') {
            console.error('SVGA转换失败:', error);
            alert('转换失败：' + error.message);
          }
        } finally {
          this.isConvertingSVGA = false;
          this.svgaConvertProgress = 0;
          this.svgaConvertStage = '';
          this.svgaConvertMessage = '';
        }
      },

      // 从双通道MP4提取序列帧
      extractYyevaFrames: async function () {
        var _this = this;
        var video = this.yyevaVideo;
        var fps = this.svgaConfig.fps;
        var targetWidth = this.svgaConfig.width;
        var targetHeight = this.svgaConfig.height;
        var quality = this.svgaConfig.quality || 100;

        // 根据质量参数计算缩小后的尺寸
        var scaleFactor = quality / 100;
        var scaledWidth = Math.round(targetWidth * scaleFactor);
        var scaledHeight = Math.round(targetHeight * scaleFactor);

        // 确保尺寸至少为1
        scaledWidth = Math.max(1, scaledWidth);
        scaledHeight = Math.max(1, scaledHeight);

        var duration = video.duration;
        var totalFrames = Math.ceil(duration * fps);

        // 暫停视频以便提取帧
        video.pause();

        // 获取视频尺寸
        var videoWidth = video.videoWidth;
        var videoHeight = video.videoHeight;
        var halfWidth = Math.floor(videoWidth / 2);
        var alphaPosition = this.yyeva.alphaPosition;

        // 创建工作画布
        var srcCanvas = document.createElement('canvas');
        srcCanvas.width = videoWidth;
        srcCanvas.height = videoHeight;
        var srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });

        // 创建结果画布（缩小后的尺寸）
        var dstCanvas = document.createElement('canvas');
        dstCanvas.width = scaledWidth;
        dstCanvas.height = scaledHeight;
        var dstCtx = dstCanvas.getContext('2d', { willReadFrequently: true });

        var frames = [];

        for (var i = 0; i < totalFrames; i++) {
          if (_this.svgaConvertCancelled) break;

          // 跳转到指定时间
          var time = i / fps;
          video.currentTime = time;

          // 等待视频寻址完成
          await new Promise(function (resolve) {
            var onSeeked = function () {
              video.removeEventListener('seeked', onSeeked);
              resolve();
            };
            video.addEventListener('seeked', onSeeked);
            // 超时处理
            setTimeout(resolve, 500);
          });

          // 绘制视频帧到源画布
          srcCtx.drawImage(video, 0, 0);

          // 提取左右通道数据
          var colorX = alphaPosition === 'right' ? 0 : halfWidth;
          var alphaX = alphaPosition === 'right' ? halfWidth : 0;

          // 获取彩色和Alpha数据
          var colorData = srcCtx.getImageData(colorX, 0, halfWidth, videoHeight);
          var alphaData = srcCtx.getImageData(alphaX, 0, halfWidth, videoHeight);

          // 合成带透明度的图像（处理预乘Alpha）
          for (var j = 0; j < colorData.data.length; j += 4) {
            var alpha = alphaData.data[j]; // 使用Alpha通道的R值作为透明度

            if (alpha > 0) {
              // 反预乘：将预乘的RGB值还原
              colorData.data[j] = Math.min(255, (colorData.data[j] * 255) / alpha);
              colorData.data[j + 1] = Math.min(255, (colorData.data[j + 1] * 255) / alpha);
              colorData.data[j + 2] = Math.min(255, (colorData.data[j + 2] * 255) / alpha);
            }

            // 设置透明度
            colorData.data[j + 3] = alpha;
          }

          // 绘制到目标尺寸画布
          var tempCanvas = document.createElement('canvas');
          tempCanvas.width = halfWidth;
          tempCanvas.height = videoHeight;
          var tempCtx = tempCanvas.getContext('2d');
          tempCtx.putImageData(colorData, 0, 0);

          dstCtx.clearRect(0, 0, scaledWidth, scaledHeight);
          dstCtx.drawImage(tempCanvas, 0, 0, halfWidth, videoHeight, 0, 0, scaledWidth, scaledHeight);

          // 转换为PNG Blob
          var pngBlob = await new Promise(function (resolve) {
            dstCanvas.toBlob(function (blob) {
              resolve(blob);
            }, 'image/png');
          });

          // 读取为ArrayBuffer
          var arrayBuffer = await pngBlob.arrayBuffer();
          frames.push(new Uint8Array(arrayBuffer));

          // 更新进度
          _this.svgaConvertProgress = Math.round((i + 1) / totalFrames * 50); // 占50%进度

          // 让出UI线程
          await new Promise(function (resolve) { setTimeout(resolve, 0); });
        }

        // 返回帧数据和缩放信息
        return {
          frames: frames,
          scaledWidth: scaledWidth,
          scaledHeight: scaledHeight,
          displayWidth: targetWidth,
          displayHeight: targetHeight,
          scaleFactor: scaleFactor
        };
      },

      toggleChannelModeDropdown: function () {
        // 切换下拉菜单显示状态
        this.showChannelModeDropdown = !this.showChannelModeDropdown;
      },

      selectChannelMode: function (mode) {
        // 选择遮罩位置
        this.mp4Config.channelMode = mode;
        this.showChannelModeDropdown = false;
      },

      toggleChannelMode: function () {
        // 切换遮罩位置（旧方法，保留以免其他地方引用）
        if (this.mp4Config.channelMode === 'color-left-alpha-right') {
          this.mp4Config.channelMode = 'alpha-left-color-right';
        } else {
          this.mp4Config.channelMode = 'color-left-alpha-right';
        }
      },

      onMP4WidthChange: function () {
        // 保持比例，修改高度
        var videoItem = this.originalVideoItem;
        if (!videoItem) return;

        var originalWidth = videoItem.videoSize.width;
        var originalHeight = videoItem.videoSize.height;
        var ratio = originalHeight / originalWidth;

        var newWidth = Math.max(0, Math.min(3000, parseInt(this.mp4Config.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.mp4Config.width = newWidth;
        this.mp4Config.height = newHeight;
      },

      onMP4HeightChange: function () {
        // 保持比例，修改宽度
        var videoItem = this.originalVideoItem;
        if (!videoItem) return;

        var originalWidth = videoItem.videoSize.width;
        var originalHeight = videoItem.videoSize.height;
        var ratio = originalWidth / originalHeight;

        var newHeight = Math.max(0, Math.min(3000, parseInt(this.mp4Config.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.mp4Config.width = newWidth;
        this.mp4Config.height = newHeight;
      },

      /* ==================== 格式转换：SVGA转MP4 ==================== */

      /**
       * 开始 SVGA 转 MP4 转换
       */
      startMP4Conversion: async function () {
        var _this = this;

        // 前置检查
        if (!this.svgaPlayer || !this.svga.hasFile || !this.originalVideoItem) {
          alert('请先加载 SVGA 文件');
          return;
        }

        // 检查是否有其他正在进行的任务
        if (!this.confirmIfHasOngoingTasks('SVGA转MP4', 'task')) {
          return; // 用户取消
        }

        // 参数验证
        var width = this.mp4Config.width;
        var height = this.mp4Config.height;
        var quality = this.mp4Config.quality;
        var fps = this.mp4Config.fps;

        // 验证宽度
        if (width < 1 || width > 9999) {
          alert('宽度超出范围！\n\n合法范围：1-9999 像素\n当前值：' + width);
          return;
        }

        // 验证高度
        if (height < 1 || height > 9999) {
          alert('高度超出范围！\n\n合法范围：1-9999 像素\n当前值：' + height);
          return;
        }

        // 验证压缩质量
        if (quality < 1 || quality > 100) {
          alert('压缩质量超出范围！\n\n合法范围：1-100\n当前值：' + quality);
          return;
        }

        // 验证帧率
        if (fps < 1 || fps > 120) {
          alert('帧率超出范围！\n\n合法范围：1-120 fps\n当前值：' + fps);
          return;
        }

        // 保存配置到localStorage
        try {
          localStorage.setItem('mp4_quality', this.mp4Config.quality);
          localStorage.setItem('mp4_fps', this.mp4Config.fps);
        } catch (e) {
          // 静默失败
        }

        this.isConvertingMP4 = true;
        this.mp4ConvertProgress = 0;
        this.mp4ConvertCancelled = false;
        this.mp4ConvertStage = 'loading';
        this.mp4ConvertMessage = '正在加载转换器...';

        try {
          // 1. 加载 ffmpeg.wasm
          await this.loadFFmpeg();
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          // 2. 提取序列帧
          this.mp4ConvertStage = 'extracting';
          this.mp4ConvertMessage = '正在提取序列帧...';
          var frames = await this.extractFrames();
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          // 3. 合成双通道
          this.mp4ConvertStage = 'composing';
          this.mp4ConvertMessage = '正在合成双通道...';
          var dualFrames = await this.composeDualChannelFrames(frames);
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          // 4. 编码为 MP4
          this.mp4ConvertStage = 'encoding';
          this.mp4ConvertMessage = '正在编码为MP4...';
          var mp4Blob = await this.encodeToMP4(dualFrames);
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          // 5. 下载文件
          this.mp4ConvertStage = 'done';
          this.mp4ConvertMessage = '转换完成！';
          this.mp4ConvertProgress = 100;
          this.downloadMP4(mp4Blob);

          // 提示音频状态
          setTimeout(function () {
            var hasAudioData = _this.svgaAudioData && Object.keys(_this.svgaAudioData).length > 0;
            var isMuted = _this.mp4Config.muted;
            var msg = '';

            if (isMuted) {
              // 用户选择静音
              msg = '✅ 转换完成！\n\n已按您的要求生成静音MP4文件。';
            } else if (!hasAudioData) {
              // 无音频数据
              msg = '✅ 转换完成！\n\nSVGA文件不包含音频，已生成静音MP4文件。';
            } else if (audioWritten) {
              // 成功合成音频
              msg = '✅ 转换完成！\n\n已成功将SVGA中的音频合成到MP4文件中。\n\n请播放检查音频效果，如有问题请反馈。';
            } else if (audioError) {
              // 音频处理失败
              msg = '⚠️ 转换完成，但音频处理失败\n\n错误原因：' + audioError + '\n\n已生成不带声音的MP4文件。';
            } else {
              // 其他情况
              msg = '✅ 转换完成！';
            }

            if (msg) {
              alert(msg);
            }
          }, 500);

        } catch (error) {
          if (error.message !== '用户取消转换') {
            console.error('MP4转换失败:', error);
            alert('转换失败：' + error.message);
          }
        } finally {
          this.isConvertingMP4 = false;
          this.mp4ConvertProgress = 0;
          this.mp4ConvertStage = '';
          this.mp4ConvertMessage = '';
        }
      },

      // 加载 ffmpeg.wasm (0.11版本)
      loadFFmpeg: async function () {
        // 检查 SharedArrayBuffer 支持
        // FFmpeg.wasm 需要 SharedArrayBuffer，这要求页面必须处于"跨域隔离"(Cross-Origin Isolation)状态
        // 即必须有 Cross-Origin-Opener-Policy: same-origin 和 Cross-Origin-Embedder-Policy: credentialless 响应头
        if (typeof SharedArrayBuffer === 'undefined') {
          // 检查 Service Worker 是否已激活
          if ('serviceWorker' in navigator) {
            var registration = await navigator.serviceWorker.getRegistration();
            if (registration && registration.active) {
              // Service Worker 已激活，但 SharedArrayBuffer 仍未可用
              // 这通常意味着需要刷新页面让 Service Worker 的响应头生效
              var errorMsg = 'SharedArrayBuffer 未启用，需要刷新页面。\n\n' +
                'Service Worker 已就绪，但需要刷新页面才能启用跨域隔离。\n' +
                '点击"确定"将自动刷新页面。';

              if (confirm(errorMsg)) {
                window.location.reload();
              }
              throw new Error('需要刷新页面启用 SharedArrayBuffer');
            } else {
              // Service Worker 未激活
              var errorMsg = '您的浏览器环境不支持 SharedArrayBuffer，无法加载 FFmpeg。\n\n' +
                '这通常是因为网站未开启"跨域隔离"(Cross-Origin Isolation)。\n' +
                '如果是线上部署，请检查：\n' +
                '1. 必须使用 HTTPS 访问（localhost 除外）\n' +
                '2. Service Worker (coi-serviceworker.js) 必须正确加载并运行\n' +
                '3. 请打开控制台(Console)查看是否有 Service Worker 相关报错';

              alert(errorMsg);
              throw new Error(errorMsg);
            }
          } else {
            var errorMsg = '您的浏览器不支持 Service Worker，无法启用 SharedArrayBuffer。\n\n' +
              '请使用现代浏览器（Chrome 67+、Firefox 79+、Safari 15.2+）。';

            alert(errorMsg);
            throw new Error(errorMsg);
          }
        }

        if (this.ffmpegLoaded) return;
        if (this.ffmpegLoading) {
          // 等待加载完成
          while (this.ffmpegLoading) {
            await new Promise(function (r) { setTimeout(r, 100); });
          }
          return;
        }

        this.ffmpegLoading = true;

        try {
          // 动态加载 FFmpeg 库（如果尚未加载）
          if (typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') {
            this.mp4ConvertMessage = '正在加载FFmpeg库...';

            await new Promise(function (resolve, reject) {
              var script = document.createElement('script');
              script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
              script.onload = resolve;
              script.onerror = function () {
                reject(new Error('FFmpeg库加载失败，请检查网络'));
              };
              document.head.appendChild(script);
            });

            // 等待FFmpeg对象可用
            var maxWait = 50; // 最多等待5秒
            while ((typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') && maxWait > 0) {
              await new Promise(function (r) { setTimeout(r, 100); });
              maxWait--;
            }

            if (typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') {
              throw new Error('FFmpeg库加载超时');
            }
          }

          // 创建ffmpeg实例（配置使用CDN加载核心文件）
          // 使用jsdelivr CDN，支持CORS
          this.ffmpeg = FFmpeg.createFFmpeg({
            log: true,
            corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
            progress: function (p) {
              // 静默处理进度
            }
          });

          // 加载 ffmpeg core
          this.mp4ConvertMessage = '正在加载编码器（约25MB，首次加载较慢）...';
          await this.ffmpeg.load();

          this.ffmpegLoaded = true;
        } catch (error) {
          console.error('FFmpeg 加载失败:', error);
          throw new Error('加载转换器失败：' + error.message);
        } finally {
          this.ffmpegLoading = false;
        }
      },

      /**
       * 从 MP4视频提取音频数据
       * @param {File} videoFile - 视频文件
       * @param {number} totalFrames - 总帧数（变速后的）
       * @param {number} fps - 帧率
       * @returns {Promise<Array|null>} - 音频数据数组，无音频时返回null
       */
      extractAudioFromMp4: async function (videoFile, totalFrames, fps) {
        if (!this.ffmpegLoaded || !this.ffmpeg) {
          return null;
        }

        try {
          var ffmpeg = this.ffmpeg;
          var inputName = 'input_audio.mp4';
          var outputName = 'audio.mp3';

          // 写入视频文件（使用v0.11.6 API）
          var videoData = await videoFile.arrayBuffer();
          ffmpeg.FS('writeFile', inputName, new Uint8Array(videoData));

          // 计算音频变速比例（如果启用了变速）
          var audioSpeedRatio = 1.0;
          var needSpeedAdjust = false;

          if (this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
            // 原始视频时长
            var originalDuration = this.mp4Video ? this.mp4Video.duration : 0;
            if (originalDuration > 0 && fps > 0) {
              // 变速后的时长
              var outputDuration = totalFrames / fps;
              audioSpeedRatio = originalDuration / outputDuration;
              needSpeedAdjust = Math.abs(audioSpeedRatio - 1.0) > 0.01;
            }
          }

          // 构建ffmpeg命令
          var ffmpegArgs = [
            '-i', inputName,
            '-vn',           // 不处理视频
            '-acodec', 'libmp3lame',
            '-q:a', '2'      // 高质量
          ];

          // 如果需要变速，添加atempo滤镜
          if (needSpeedAdjust) {
            var tempoFilter = this.buildAudioTempoFilter(audioSpeedRatio);
            ffmpegArgs.push('-af', tempoFilter);
          }

          ffmpegArgs.push('-y', outputName);

          // 执行提取（使用v0.11.6 API）
          await ffmpeg.run.apply(ffmpeg, ffmpegArgs);

          // 读取音频数据（使用v0.11.6 API）
          var audioData = ffmpeg.FS('readFile', outputName);

          // 清理临时文件（使用v0.11.6 API）
          try { ffmpeg.FS('unlink', inputName); } catch (e) { }
          try { ffmpeg.FS('unlink', outputName); } catch (e) { }

          if (!audioData || audioData.length === 0) {
            return null;
          }

          // 返回音频数据数组（SVGA格式）
          return [{
            audioKey: 'audio_0',
            audioData: new Uint8Array(audioData.buffer || audioData),
            startFrame: 0,
            endFrame: totalFrames,
            startTime: 0,
            totalTime: 0
          }];

        } catch (error) {
          return null;
        }
      },

      // 提取序列帧（优化版：Canvas复用 + 动态等待 + 官方API）
      extractFrames: async function () {
        var _this = this;
        var videoItem = this.originalVideoItem;
        if (!videoItem) {
          throw new Error('请先加载SVGA文件');
        }
        var totalFrames = videoItem.frames;
        var originalWidth = videoItem.videoSize.width;
        var originalHeight = videoItem.videoSize.height;
        var fps = videoItem.FPS || 24;

        // 使用用户配置的尺寸
        var targetWidth = this.mp4Config.width || originalWidth;
        var targetHeight = this.mp4Config.height || originalHeight;

        var frames = [];

        // 保存当前播放状态
        var wasPlaying = this.isPlaying;
        if (wasPlaying) {
          this.svgaPlayer.pauseAnimation();
        }

        // 优先使用官方Canvas属性（兼容降级）
        var playerCanvas = this.svgaPlayer.$canvas || this.$refs.svgaContainer.querySelector('canvas');
        if (!playerCanvas) {
          throw new Error('无法获取播放器Canvas');
        }

        // 计算等待时间（帧率自适应，最小16ms）
        var frameWaitTime = Math.max(16, Math.ceil(1000 / fps * 1.5)); // 1.5帧时长更稳定

        // 创建复用Canvas（避免重复创建）
        var tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        var tempCtx = tempCanvas.getContext('2d', {
          alpha: true,
          willReadFrequently: true
        });

        // 禁用图像平滑
        tempCtx.imageSmoothingEnabled = false;

        try {
          // 逐帧提取
          for (var i = 0; i < totalFrames; i++) {
            if (this.mp4ConvertCancelled) {
              throw new Error('用户取消转换');
            }

            // 更新进度
            this.mp4ConvertProgress = Math.round((i + 1) / totalFrames * 100);
            this.mp4ConvertMessage = '提取序列帧 ' + (i + 1) + '/' + totalFrames;

            // 跳转到指定帧
            this.svgaPlayer.stepToFrame(i, false);

            // WebGL渲染器兼容（部分版本需要）
            if (playerCanvas.requestPaint) {
              playerCanvas.requestPaint();
            }

            // 等待渲染完成（RAF + 动态延迟）
            await new Promise(function (resolve) {
              requestAnimationFrame(function () {
                setTimeout(resolve, frameWaitTime);
              });
            });

            // 清空并绘制到复用Canvas
            tempCtx.clearRect(0, 0, targetWidth, targetHeight);
            tempCtx.drawImage(playerCanvas, 0, 0, playerCanvas.width, playerCanvas.height, 0, 0, targetWidth, targetHeight);

            // 获取ImageData
            var imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
            frames.push(imageData);

            // 让出线程，避免阻塞UI
            if (i % 5 === 0) {
              await new Promise(function (r) { setTimeout(r, 0); });
            }
          }
        } finally {
          // 恢复播放状态（检查播放器是否还存在）
          if (wasPlaying && this.svgaPlayer && this.currentModule === 'svga') {
            this.svgaPlayer.startAnimation();
          }
        }

        return frames;
      },

      // 合成双通道帧并直接转换为JPEG（使用独立模块）
      composeDualChannelFrames: async function (frames) {
        var _this = this;

        return DualChannelComposer.composeToJPEG(frames, {
          mode: this.mp4Config.channelMode,
          onProgress: function (progress) {
            _this.mp4ConvertProgress = Math.round(progress * 100);
            _this.mp4ConvertMessage = '合成双通道帧 ' + Math.round(progress * frames.length) + '/' + frames.length;
          },
          onCancel: function () {
            return _this.mp4ConvertCancelled;
          }
        });
      },

      // 编码为MP4 (0.11版本API，优化：接收已转换的JPEG数据)
      encodeToMP4: async function (jpegFrames) {
        var _this = this;
        var ffmpeg = this.ffmpeg;
        var outputFps = this.mp4Config.fps || 30;  // 用户设置的输出帧率
        var quality = this.mp4Config.quality || 80;
        var muted = this.mp4Config.muted;
        var frameCount = jpegFrames.length;

        // 获取SVGA原始帧率作为输入帧率
        var videoItem = this.originalVideoItem;
        var inputFps = videoItem.FPS || videoItem.fps || 30;

        // CRF值：quality 100 对应 CRF 18（最高质量），quality 0 对应 CRF 51（最低质量）
        var crf = Math.round(51 - (quality / 100) * 33);

        try {
          // 将已转换的JPEG帧写入ffmpeg虚拟文件系统
          for (var i = 0; i < frameCount; i++) {
            if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

            var filename = 'frame_' + String(i).padStart(4, '0') + '.jpg';
            ffmpeg.FS('writeFile', filename, jpegFrames[i]);

            // 更新进度（写入阶段卐50%）
            this.mp4ConvertProgress = Math.round((i + 1) / frameCount * 50);
            this.mp4ConvertMessage = '写入帧数据 ' + (i + 1) + '/' + frameCount;
          }

          // 执行编码
          if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

          this.mp4ConvertMessage = '正在编码视频...';
          this.mp4ConvertProgress = 50;

          // 检查是否有音频数据
          var hasAudioData = this.svgaAudioData && Object.keys(this.svgaAudioData).length > 0;
          var audioWritten = false;
          var audioError = null;

          // 仅在有音频数据且未静音时处理音频
          if (hasAudioData && !muted) {
            try {
              var audioKeys = Object.keys(this.svgaAudioData);
              var audioKey = audioKeys[0];
              var audioData = this.svgaAudioData[audioKey];

              if (!audioData || audioData.length === 0) {
                throw new Error('音频数据为空');
              }

              ffmpeg.FS('writeFile', 'audio.mp3', audioData);
              audioWritten = true;

            } catch (audioErr) {
              audioError = audioErr.message || '未知错误';

              var continueMsg = '音频处理失败：' + audioError + '\n\n是否继续转换（生成的MP4将没有声音）？';
              if (!confirm(continueMsg)) {
                throw new Error('用户取消转换');
              }
            }
          }

          var ffmpegArgs = [
            '-thread_queue_size', '512',  // 增大线程队列，避免阻塞（必须在-i前面）
            '-framerate', String(inputFps),  // 输入帧率：SVGA原始帧率
            '-i', 'frame_%04d.jpg'
          ];

          // 如果有音频，添加音频输入
          if (audioWritten) {
            ffmpegArgs.push('-i', 'audio.mp3');
          }

          ffmpegArgs.push(
            // 已在JPG生成时加了黑底，无需滚镜处理
            '-r', String(outputFps),  // 输出帧率：用户设置的帧率
            '-c:v', 'libx264',
            '-profile:v', 'high',
            '-level', '4.0',
            '-pix_fmt', 'yuv420p',  // Windows兼容性
            '-crf', String(crf),
            '-preset', 'fast',      // 修复卡死：veryfast在wasm中可能卡顿，改用fast
            '-tune', 'animation',   // 针对动画内容优化
            '-movflags', '+faststart'
          );

          // 处理音频轨道
          if (muted || !audioWritten) {
            ffmpegArgs.push('-an');
          } else {
            ffmpegArgs.push(
              '-c:a', 'aac',
              '-b:a', '128k',
              '-shortest'
            );
          }

          ffmpegArgs.push('output.mp4');

          // 添加FFmpeg进度监听（避免卡死）
          var _this = this;
          var encodeStartTime = Date.now();

          ffmpeg.setProgress(function (progress) {
            // FFmpeg进度回调：progress.ratio 可能为 0~1 或 undefined
            // progress.time 和 progress.duration 是微秒单位
            var ratio = 0;

            if (progress.ratio !== undefined && progress.ratio > 0) {
              ratio = progress.ratio;
            } else if (progress.time && progress.duration && progress.duration > 0) {
              // 使用时间计算进度
              ratio = Math.min(1, progress.time / progress.duration);
            }

            // 更新UI进度（编码阶段占后50%）
            _this.mp4ConvertProgress = Math.round(50 + ratio * 50);
            _this.mp4ConvertMessage = '正在编码视频... ' + Math.round(ratio * 100) + '%';
          });

          // 执行FFmpeg编码（异步执行）
          try {
            await ffmpeg.run.apply(ffmpeg, ffmpegArgs);
          } catch (ffmpegErr) {
            // 检查是否是音频相关错误
            var errorMsg = String(ffmpegErr.message || ffmpegErr);
            if (audioWritten && (errorMsg.includes('audio') || errorMsg.includes('aac'))) {
              var retryMsg = '音频编码失败：' + errorMsg + '\n\n是否尝试不带音频重新编码？';
              if (confirm(retryMsg)) {
                // 移除音频相关参数，添加-an
                var retryArgs = ffmpegArgs.filter(function (arg, idx) {
                  if (arg === 'audio.mp3') return false;
                  if (arg === '-i' && ffmpegArgs[idx + 1] === 'audio.mp3') return false;
                  if (arg === '-c:a' || arg === '-b:a' || arg === '-shortest') return false;
                  if (ffmpegArgs[idx - 1] === '-c:a' || ffmpegArgs[idx - 1] === '-b:a') return false;
                  return true;
                });

                var outputIdx = retryArgs.indexOf('output.mp4');
                retryArgs.splice(outputIdx, 0, '-an');

                await ffmpeg.run.apply(ffmpeg, retryArgs);
                audioWritten = false;
              } else {
                throw ffmpegErr;
              }
            } else {
              throw ffmpegErr;
            }
          } finally {
            // 清理进度监听器
            ffmpeg.setProgress(function () { });
          }

          this.mp4ConvertProgress = 90;
          this.mp4ConvertMessage = '正在读取输出文件...';

          // 读取输出文件 (0.11版本API)
          var data = ffmpeg.FS('readFile', 'output.mp4');
          var mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });

          // 清理虚拟文件系统
          for (var j = 0; j < frameCount; j++) {
            var fname = 'frame_' + String(j).padStart(4, '0') + '.jpg';  // 从.png改为.jpg
            try {
              ffmpeg.FS('unlink', fname);
            } catch (e) { }
          }
          try {
            ffmpeg.FS('unlink', 'output.mp4');
          } catch (e) { }
          if (audioWritten) {
            try {
              ffmpeg.FS('unlink', 'audio.mp3');
            } catch (e) { }
          }

          return mp4Blob;

        } catch (error) {
          console.error('[FFmpeg编码] 错误:', error);
          // 清理可能残留的文件
          for (var k = 0; k < frameCount; k++) {
            try {
              ffmpeg.FS('unlink', 'frame_' + String(k).padStart(4, '0') + '.png');
            } catch (e) { }
          }
          try {
            ffmpeg.FS('unlink', 'output.mp4');
          } catch (e) { }
          throw error;
        }
      },

      // 下载MP4文件
      downloadMP4: function (blob) {
        var filename = this.svga.fileInfo.name || 'svga';
        // 移除扩展名
        filename = filename.replace(/\.svga$/i, '');
        // 添加后缀
        var suffix = this.mp4Config.channelMode === 'color-left-alpha-right' ? '_yyeva_LR' : '_yyeva_RL';
        filename = filename + suffix + '.mp4';

        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      /* ==================== SVGA通用方法 ==================== */

      /**
       * 通用SVGA构建方法
       * @param {String} mode - 模式：'mp4' | 'yyeva' | 'lottie' | 'frames'
       * @param {Object} buildParams - SVGABuilder构建参数
       * @param {Object} controlParams - 控制参数 {progressField, messageField, cancelledField}
       * @returns {Promise<Blob>} - SVGA Blob
       */
      buildSVGAFromConfig: async function (mode, buildParams, controlParams) {
        var _this = this;

        // 默认控制参数
        var progressField = controlParams.progressField;
        var messageField = controlParams.messageField;
        var cancelledField = controlParams.cancelledField;

        // 设置初始状态
        this[messageField] = '生成SVGA...';

        // 添加进度回调，映射到50-100%
        var originalOnProgress = buildParams.onProgress;
        buildParams.onProgress = function (p) {
          // 内部进度 0-1 映射到 50-100%
          _this[progressField] = Math.round(50 + p * 50);
          if (originalOnProgress) {
            originalOnProgress(p);
          }
        };

        // 构建 SVGA
        var blob;
        if (buildParams.buildType === 'fromPNG') {
          blob = await SVGABuilder.buildFromPNG(buildParams);
        } else {
          blob = await SVGABuilder.build(buildParams);
        }

        // 检查是否取消
        if (this[cancelledField]) {
          throw new Error('用户取消转换');
        }

        // 完成
        this[progressField] = 100;
        this[messageField] = '转换完成！';

        return blob;
      },

      /**
       * 通用SVGA下载方法
       * @param {Blob} blob - SVGA Blob
       * @param {String} fileName - 文件名（包含.svga后缀）
       */
      downloadSVGA: function (blob, fileName) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 100);
      },

      // 取消MP4转换
      cancelMP4Conversion: function () {
        this.mp4ConvertCancelled = true;
        this.mp4ConvertMessage = '正在取消...';
      }
    },
    computed: {
      hasReplacedMaterials: function () {
        return Object.keys(this.replacedImages).length > 0;
      },

      isEmpty: function () {
        return !this.svga.hasFile && !this.yyeva.hasFile && !this.mp4.hasFile && !this.lottie.hasFile && !this.frames.hasFile;
      },

      currentFileInfo: function () {
        if (this.currentModule === 'svga' && this.svga.hasFile) {
          return this.svga.fileInfo;
        } else if (this.currentModule === 'yyeva' && this.yyeva.hasFile) {
          return this.yyeva.fileInfo;
        } else if (this.currentModule === 'mp4' && this.mp4.hasFile) {
          return this.mp4.fileInfo;
        } else if (this.currentModule === 'lottie' && this.lottie.hasFile) {
          return this.lottie.fileInfo;
        } else if (this.currentModule === 'frames' && this.frames.hasFile) {
          return this.frames.fileInfo;
        }
        return {};
      },

      currentBgColor: function () {
        if (this.bgColorKey === 'white') return '#ffffff';
        if (this.bgColorKey === 'green') return '#00ff00';
        if (this.bgColorKey === 'red') return '#df3321';
        if (this.bgColorKey === 'yellow') return '#f1c40d';
        if (this.bgColorKey === 'blue') return '#00b4ff';
        if (this.bgColorKey === 'pattern') {
          return 'transparent';
        }
        return '#000000';
      },

      // 检测当前动画是否包含音频
      hasAudio: function () {
        if (this.currentModule === 'svga') {
          // SVGA: 检查是否有音频数据
          return this.svgaAudioData !== null ||
            (this.svgaMovieData && this.svgaMovieData.audios && this.svgaMovieData.audios.length > 0);
        } else if (this.currentModule === 'yyeva') {
          // 双通道MP4: 检查视频是否有音频轨道
          return this.yyevaHasAudio;
        } else if (this.currentModule === 'mp4') {
          // 普通MP4: 检查视频是否有音频轨道
          return this.mp4HasAudio;
        } else if (this.currentModule === 'lottie') {
          // Lottie: 通常不包含音频
          return false;
        }
        return false;
      },

      materialThumbBgColor: function () {
        // 如果有设置背景色且不是透明格子，使用当前背景色
        if (this.bgColorKey && this.bgColorKey !== 'pattern') {
          return this.currentBgColor;
        }
        // 否则使用默认颜色：浅色模式 #fcfcfc，暗黑模式 #2a2a2a
        return this.isDarkMode ? '#2a2a2a' : '#fcfcfc';
      },

      // 素材列表过滤（性能优化：Vue computed 会缓存结果）
      filteredMaterialList: function () {
        // 无搜索关键词时直接返回原数组，避免创建新数组
        if (!this.materialSearchQuery) {
          return this.materialList;
        }
        // 预先转小写，避免在循环中重复调用
        var query = this.materialSearchQuery.toLowerCase();
        return this.materialList.filter(function (item) {
          return item.imageKey.toLowerCase().indexOf(query) !== -1;
        });
      },

      // 变速时间轴每段区间的速率和颜色信息
      // 性能优化：computed 属性会自动缓存，仅在依赖变化时重新计算
      speedRemapSegments: function () {
        var keyframes = this.speedRemapConfig.keyframes;
        if (!keyframes || keyframes.length < 2) {
          return [];
        }

        var totalFrames = this.speedRemapConfig.originalTotalFrames || 1;
        var segments = [];

        for (var i = 0; i < keyframes.length - 1; i++) {
          var k1 = keyframes[i];
          var k2 = keyframes[i + 1];

          // 计算速率
          var frameDelta = k2.originalFrame - k1.originalFrame;
          var positionDelta = k2.position - k1.position;
          var speed = 1.0;

          if (positionDelta > 0 && frameDelta > 0) {
            speed = frameDelta / (positionDelta * totalFrames);
          }

          // 计算透明度
          var opacity = 0;
          if (speed > 1) {
            // 加速：倍率每增加0.5，透明度增加10%，倍率5时100%
            // (speed - 1) / 0.5 * 0.1 = (speed - 1) * 0.2
            opacity = Math.min(1, (speed - 1) * 0.2);
          } else if (speed < 1) {
            // 减速：倍率每减少0.05，透明度增加10%，倍率0.5时100%
            // (1 - speed) / 0.05 * 0.1 = (1 - speed) * 2
            opacity = Math.min(1, (1 - speed) * 2);
          }

          segments.push({
            startPos: k1.position,
            endPos: k2.position,
            speed: speed,
            opacity: opacity
          });
        }

        return segments;
      },

      // SVGA转换预估计算
      svgaEstimate: function () {
        // 获取配置参数
        var width = this.svgaConfig.width || 0;
        var height = this.svgaConfig.height || 0;
        var fps = this.svgaConfig.fps || 30;
        var quality = this.svgaConfig.quality || 80;
        var muted = this.svgaConfig.muted;

        // 根据质量参数计算缩小后的尺寸
        var scaleFactor = quality / 100;
        var scaledWidth = Math.round(width * scaleFactor);
        var scaledHeight = Math.round(height * scaleFactor);

        // 获取视频时长（秒）
        var duration = 0;
        if (this.yyevaVideo) {
          duration = this.yyevaVideo.duration || 0;
        }

        // 计算帧数
        var frames = Math.ceil(duration * fps);

        // 计算内存占用（转换前：MP4视频内存，转换后：SVGA帧数据）
        // 转换前：MP4视频文件大小的约3-5倍作为解码内存
        var beforeMemoryMB = 0;
        if (this.yyeva.fileInfo && this.yyeva.fileInfo.size) {
          beforeMemoryMB = (this.yyeva.fileInfo.size * 4 / 1024 / 1024).toFixed(1);
        }

        // 转换后内存占用：缩小后的宽×高×帧数×4字节(RGBA) / 1024 / 1024
        var afterMemoryMB = (scaledWidth * scaledHeight * frames * 4 / 1024 / 1024).toFixed(1);

        // 计算文件大小预估
        // 转换前：MP4文件大小
        var beforeFileSizeKB = 0;
        var beforeFileSizeText = '0kb';
        if (this.yyeva.fileInfo && this.yyeva.fileInfo.size) {
          beforeFileSizeKB = this.yyeva.fileInfo.size / 1024;
          if (beforeFileSizeKB >= 1024) {
            beforeFileSizeText = (beforeFileSizeKB / 1024).toFixed(2) + 'M';
          } else {
            beforeFileSizeText = beforeFileSizeKB.toFixed(0) + 'kb';
          }
        }

        // 转换后文件大小预估：
        // 使用缩小后的尺寸计算，SVGA使用PNG压缩，预估每帧大小 = 缩小宽×缩小高×0.5
        // 然后再经过pako压缩，大约压缩到70%
        var estimatedFrameSizeBytes = scaledWidth * scaledHeight * 0.5;
        var estimatedTotalBytes = estimatedFrameSizeBytes * frames * 0.7; // pako压缩后

        // 如果有音频，加上音频大小预估
        if (!muted && this.yyevaHasAudio) {
          // 音频约占视频时长 * 16kbps
          var audioSizeBytes = duration * 16 * 1024 / 8;
          estimatedTotalBytes += audioSizeBytes;
        }

        var afterFileSizeKB = estimatedTotalBytes / 1024;
        var afterFileSizeText = '？';
        if (frames > 0) {
          if (afterFileSizeKB >= 1024) {
            afterFileSizeText = (afterFileSizeKB / 1024).toFixed(2) + 'M';
          } else {
            afterFileSizeText = afterFileSizeKB.toFixed(0) + 'kb';
          }
        }

        return {
          frames: frames,
          duration: duration,
          beforeMemory: beforeMemoryMB + 'M',
          afterMemory: afterMemoryMB + 'M',
          beforeFileSize: beforeFileSizeText,
          afterFileSize: afterFileSizeText
        };
      },

      // 普通MP4转SVGA预估计算
      mp4ToSvgaEstimate: function () {
        // 获取配置参数
        var width = this.mp4ToSvgaConfig.width || 0;
        var height = this.mp4ToSvgaConfig.height || 0;
        var fps = this.mp4ToSvgaConfig.fps || 30;
        var quality = this.mp4ToSvgaConfig.quality || 80;

        // 根据质量参数计算缩小后的尺寸
        var scaleFactor = quality / 100;
        var scaledWidth = Math.round(width * scaleFactor);
        var scaledHeight = Math.round(height * scaleFactor);

        // 获取视频时长（秒）
        var duration = 0;
        if (this.mp4Video) {
          duration = this.mp4Video.duration || 0;
        }

        // 计算帧数
        var frames = Math.ceil(duration * fps);

        // 转换后内存占用：缩小后的宽×高×帧数×4字节(RGBA) / 1024 / 1024
        var afterMemoryMB = (scaledWidth * scaledHeight * frames * 4 / 1024 / 1024).toFixed(1);

        // 计算文件大小预估
        // 转换前：MP4文件大小
        var beforeFileSizeKB = 0;
        var beforeFileSizeText = '0kb';
        if (this.mp4.fileInfo && this.mp4.fileInfo.size) {
          beforeFileSizeKB = this.mp4.fileInfo.size / 1024;
          if (beforeFileSizeKB >= 1024) {
            beforeFileSizeText = (beforeFileSizeKB / 1024).toFixed(2) + 'M';
          } else {
            beforeFileSizeText = beforeFileSizeKB.toFixed(0) + 'kb';
          }
        }

        // 转换后文件大小预估：
        // 使用缩小后的尺寸计算，SVGA使用PNG压缩，预估每帧大小 = 缩小宽×缩小高×0.5
        // 然后再经过pako压缩，大约压缩到70%
        var estimatedFrameSizeBytes = scaledWidth * scaledHeight * 0.5;
        var estimatedTotalBytes = estimatedFrameSizeBytes * frames * 0.7; // pako压缩后

        var afterFileSizeKB = estimatedTotalBytes / 1024;
        var afterFileSizeText = '？';
        if (frames > 0) {
          if (afterFileSizeKB >= 1024) {
            afterFileSizeText = (afterFileSizeKB / 1024).toFixed(2) + 'M';
          } else {
            afterFileSizeText = afterFileSizeKB.toFixed(0) + 'kb';
          }
        }

        return {
          frames: frames,
          duration: duration,
          afterMemory: afterMemoryMB + 'M',
          beforeFileSize: beforeFileSizeText,
          afterFileSize: afterFileSizeText
        };
      },

      // Lottie转SVGA预估计算
      lottieToSvgaEstimate: function () {
        // 获取配置参数
        var width = this.lottieToSvgaConfig.width || 0;
        var height = this.lottieToSvgaConfig.height || 0;
        var fps = this.lottieToSvgaConfig.fps || 30;
        var quality = this.lottieToSvgaConfig.quality || 80;

        // 根据质量参数计算缩小后的尺寸
        var scaleFactor = quality / 100;
        var scaledWidth = Math.round(width * scaleFactor);
        var scaledHeight = Math.round(height * scaleFactor);

        // 获取Lottie动画时长
        var duration = 0;
        if (this.lottie && this.lottie.fileInfo && this.lottie.fileInfo.duration) {
          duration = this.lottie.fileInfo.duration;
        }

        // 计算帧数
        var frames = Math.ceil(duration * fps);

        // 转换后内存占用：缩小后的宽×高×帧数×4字节(RGBA) / 1024 / 1024
        var afterMemoryMB = (scaledWidth * scaledHeight * frames * 4 / 1024 / 1024).toFixed(1);

        // 转换后文件大小预估：
        // 使用缩小后的尺寸计算，SVGA使用PNG压缩，预估每帧大小 = 缩小宽×缩小高×0.5
        // 然后再经过pako压缩，大约压缩到70%
        var estimatedFrameSizeBytes = scaledWidth * scaledHeight * 0.5;
        var estimatedTotalBytes = estimatedFrameSizeBytes * frames * 0.7; // pako压缩后

        var afterFileSizeKB = estimatedTotalBytes / 1024;
        var afterFileSizeText = '？';
        if (frames > 0) {
          if (afterFileSizeKB >= 1024) {
            afterFileSizeText = (afterFileSizeKB / 1024).toFixed(2) + 'M';
          } else {
            afterFileSizeText = afterFileSizeKB.toFixed(0) + 'kb';
          }
        }

        return {
          frames: frames,
          duration: duration,
          afterMemory: afterMemoryMB + 'M',
          afterFileSize: afterFileSizeText
        };
      },

      // 序列帧转SVGA预估计算
      framesToSvgaEstimate: function () {
        // 获取配置参数
        var width = this.framesToSvgaConfig.width || 0;
        var height = this.framesToSvgaConfig.height || 0;
        var fps = this.framesToSvgaConfig.fps || 25;
        var quality = this.framesToSvgaConfig.quality || 80;

        // 根据质量参数计算缩小后的尺寸
        var scaleFactor = quality / 100;
        var scaledWidth = Math.round(width * scaleFactor);
        var scaledHeight = Math.round(height * scaleFactor);

        // 序列帧数量
        var frames = this.frames.files ? this.frames.files.length : 0;

        // 转换后内存占用：缩小后的宽×高×帧数×4字节(RGBA) / 1024 / 1024
        var afterMemoryMB = (scaledWidth * scaledHeight * frames * 4 / 1024 / 1024).toFixed(1);

        // 转换后文件大小预估：
        // 使用缩小后的尺寸计算，SVGA使用PNG压缩，预估每帧大小 = 缩小宽×缩小高×0.5
        // 然后再经过pako压缩，大约压缩到70%
        var estimatedFrameSizeBytes = scaledWidth * scaledHeight * 0.5;
        var estimatedTotalBytes = estimatedFrameSizeBytes * frames * 0.7; // pako压缩后

        var afterFileSizeKB = estimatedTotalBytes / 1024;
        var afterFileSizeText = '？';
        if (frames > 0) {
          if (afterFileSizeKB >= 1024) {
            afterFileSizeText = (afterFileSizeKB / 1024).toFixed(2) + 'M';
          } else {
            afterFileSizeText = afterFileSizeKB.toFixed(0) + 'kb';
          }
        }

        return {
          frames: frames,
          afterMemory: afterMemoryMB + 'M',
          afterFileSize: afterFileSizeText
        };
      },

      // GIF导出源信息（供弹窗显示）
      gifSourceInfo: function () {
        return this.getGifSourceInfo();
      },

      // GIF导出预估计算
      gifEstimate: function () {
        var config = this.gifConfig;
        var sourceInfo = this.getGifSourceInfo();

        var width = config.width || sourceInfo.width || 100;
        var height = config.height || sourceInfo.height || 100;
        var fps = config.fps || 30;
        // 使用 sourceInfo.duration，已经支持变速
        var duration = sourceInfo.duration || 0;
        var totalFrames = Math.ceil(duration * fps);

        // GIF文件大小预估
        // GIF每帧大约是：宽 × 高 × 压缩系数（LZW压缩后）
        // 透明底会增加文件大小，杂色边也会稍微增加
        // 系数根据实际测试调整：透明0.16，不透明0.13
        var compressionFactor = config.transparent ? 0.16 : 0.13;
        if (config.transparent && config.dither) {
          compressionFactor = 0.18; // 透明+杂色边略高
        }
        var bytesPerFrame = width * height * compressionFactor;
        var totalBytes = bytesPerFrame * totalFrames;

        var fileSizeText = '？';
        if (totalFrames > 0) {
          if (totalBytes >= 1024 * 1024) {
            fileSizeText = (totalBytes / 1024 / 1024).toFixed(2) + 'M';
          } else {
            fileSizeText = Math.round(totalBytes / 1024) + 'kb';
          }
        }

        return {
          frames: totalFrames,
          duration: duration,
          fileSize: fileSizeText,
          fileSizeBytes: totalBytes
        };
      },

      // 时间刻度计算（智能间隔）
      timeScaleTicks: function () {
        var config = this.speedRemapConfig;
        var duration = config.originalDuration || 0;
        var ticks = [];

        if (duration <= 0) return ticks;

        // 智能计算间隔：保持刻度数量在8-15个之间
        var targetTickCount = 10; // 期望刻度数
        var roughInterval = duration / targetTickCount;

        // 可选间隔值（秒）
        var intervals = [0.5, 1, 2, 5, 10, 20, 30, 60, 120, 300, 600];

        // 向上取整到最近的“好看”间隔
        var interval = 0.5;
        for (var i = 0; i < intervals.length; i++) {
          if (intervals[i] >= roughInterval) {
            interval = intervals[i];
            break;
          }
        }
        // 如果所有间隔都太小，使用最大的
        if (roughInterval > intervals[intervals.length - 1]) {
          interval = intervals[intervals.length - 1];
        }

        var timelineWidth = 500; // 时间轴宽度

        for (var time = 0; time <= duration; time += interval) {
          var position = (time / duration) * timelineWidth;
          var label = '';

          // 根据间隔大小决定显示格式
          if (interval < 1) {
            // 0.5s间隔：显示小数
            label = time.toFixed(1) + 's';
            if (time % 1 === 0) {
              label = Math.round(time) + 's';
            }
          } else if (interval < 60) {
            // 秒级间隔：显示整数秒
            label = Math.round(time) + 's';
          } else {
            // 分钟级间隔：显示分钟
            var minutes = Math.floor(time / 60);
            var seconds = Math.round(time % 60);
            if (seconds === 0) {
              label = minutes + 'm';
            } else {
              label = minutes + 'm' + seconds + 's';
            }
          }

          ticks.push({
            time: time,
            position: position,
            label: label
          });
        }

        return ticks;
      },

      // 变速预估计算
      speedRemapEstimate: function () {
        var config = this.speedRemapConfig;
        var originalDuration = config.originalDuration || 0;
        var keyframes = config.keyframes;

        if (!keyframes || keyframes.length < 2) {
          return {
            outputDuration: originalDuration.toFixed(2),
            outputTotalFrames: config.originalTotalFrames || 0,
            durationChange: 0,
            durationChangePercent: '0%'
          };
        }

        // 输出时长 = (右端点position - 左端点position) * 原始时长
        var startPos = keyframes[0].position;
        var endPos = keyframes[keyframes.length - 1].position;
        var outputRatio = endPos - startPos;
        var outputDuration = outputRatio * originalDuration;
        var outputTotalFrames = Math.ceil(outputRatio * (config.originalTotalFrames || 0));

        var durationChange = outputDuration - originalDuration;
        var durationChangePercent = originalDuration > 0
          ? Math.round((durationChange / originalDuration) * 100)
          : 0;

        return {
          outputDuration: outputDuration.toFixed(2),
          outputTotalFrames: outputTotalFrames,
          durationChange: durationChange.toFixed(2),
          durationChangePercent: (durationChangePercent >= 0 ? '+' : '') + durationChangePercent + '%'
        };
      },

      /**
       * 播放器容器样式 (viewerContainerStyle)
       * 返回值：绑定到 .viewer-container 的 :style 属性
       * 内容：
       *   - width/height: 原始尺寸（如 1080x1920），通过 getContentOriginalSize() 获取
       *   - transform: translate(offsetX, offsetY) scale(viewerScale)
       *       - translate: 控制播放器位置（拖拽偏移 + 垂直居中偏移）
       *       - scale: 控制缩放比例
       *   - cursor: 拖拽时显示 grabbing，其他时候显示 grab
       */
      viewerContainerStyle: function () {
        var style = {
          transform: 'translate(' + this.viewerOffsetX + 'px, ' + this.viewerOffsetY + 'px) scale(' + this.viewerScale + ')',
          cursor: this.dragging ? 'grabbing' : 'grab'
        };

        var size = this.getContentOriginalSize();
        if (size) {
          style.width = size.width + 'px';
          style.height = size.height + 'px';
        }

        return style;
      },

      /**
       * 文件名样式 (viewerFilenameStyle)
       * 返回值：绑定到 .viewer-filename 的 :style 属性
       * 功能：父容器 .viewer-container 缩放时，文件名需要保持字体大小不变
       * 实现：
       *   - transform: scale(1/viewerScale) → 反向缩放抵消父容器的 scale
       *   - marginBottom: 8 * viewerScale → 补偿缩放后的边距，保持视觉距离 8px
       *   - maxWidth: 播放器宽度 * viewerScale → 跟随播放器宽度，超出显示省略号
       */
      viewerFilenameStyle: function () {
        var scale = this.viewerScale;
        var inverseScale = 1 / scale;

        var style = {
          transform: 'scale(' + inverseScale + ')',
          transformOrigin: 'left bottom',
          marginBottom: (8 * scale) + 'px'
        };

        var size = this.getContentOriginalSize();
        if (size) {
          style.maxWidth = (size.width * scale) + 'px';
        }

        return style;
      }
    },
    created: function () {
      // 初始化非响应式属性（避免Vue深度代理导致的性能问题）
      this.libraryLoader = window.libraryLoader;
      this.playerController = null;

      // 初始化文件验证器和工具库
      this.fileValidator = new FileValidator(this.libraryLoader);
      this.utils = window.SvgaUtils;

      // SVGA
      this.svgaPlayer = null;
      this.svgaParser = null;
      this.svgaObjectUrl = null;
      this.svgaAudioData = null;
      this.svgaMovieData = null;

      // Empty State SVGA
      this.emptyStateSvgaPlayer = null;
      this.emptyStateSvgaParser = null;

      // YYEVA
      this.yyevaVideo = null;
      this.yyevaCanvas = null;
      this.yyevaCtx = null;
      this.yyevaAnimationId = null;
      this.yyevaObjectUrl = null;
      // 性能优化：复用的临时Canvas（用于双通道合成，避免每帧创建）
      this.yyevaTempCanvas = null;
      this.yyevaTempCtx = null;

      // Lottie
      this.lottiePlayer = null;
      this.lottieCanvas = null;
      this.lottieCtx = null;
      this.lottieAnimationId = null;

      // MP4
      this.mp4Video = null;
      this.mp4ObjectUrl = null;

      // Tools
      this.ffmpeg = null;
      this.chromaKeyRenderLoop = null;

      // Frames
      this.framesCanvas = null;
      this.framesCtx = null;
      this.framesAnimationId = null;
      this.framesImages = [];
      this.framesBlobUrls = [];  // 存储 Blob URL 以便清理时释放内存

      // Material Replacement
      this.originalVideoItem = null;

      // 用节流优化高频事件，提升性能
      // this.onMouseMove = this.utils.throttle(this.onMouseMove, 16); // ~60fps
      // this.onWheel = this.utils.throttle(this.onWheel, 50);
      // this.seekToFrame = this.utils.throttle(this.seekToFrame, 100);
    },
    watch: {
      bgColorKey: function () {
        var _this = this;
        this.$nextTick(function () {
          _this.applyCanvasBackground();
        });
      },
      // 监听footer内容显示状态，初始化播放控制器
      footerContentVisible: function (newVal) {
        if (newVal && !this.playerController) {
          this.initPlayerController();
        }
      }
    },
    mounted: function () {
      var _this = this;

      // 强制重置弹窗状态，防止意外显示
      this.showEditFrameDialog = false;
      this.editingKeyframeIndex = -1;
      this.editFrameInput = '';
      this.showFramesFpsDialog = false;

      this.initSvgaPlayer();
      this.initEmptyStateSvgaPlayer();
      this.initViewportController();

      var savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        this.isDarkMode = true;
        document.body.classList.add('dark-mode');
      }

      // 点击外部关闭下拉菜单
      document.addEventListener('click', function (e) {
        if (_this.showChannelModeDropdown) {
          var selectWrapper = document.querySelector('.mp4-select-wrapper');
          if (selectWrapper && !selectWrapper.contains(e.target)) {
            _this.showChannelModeDropdown = false;
          }
        }
      });

      // 全局监听拖拽事件，用于显示覆盖层
      var dragCounter = 0;
      document.body.addEventListener('dragenter', function (e) {
        dragCounter++;
        _this.dropHover = true;
      });
      document.body.addEventListener('dragleave', function (e) {
        dragCounter--;
        if (dragCounter === 0) {
          _this.dropHover = false;
        }
      });
      document.body.addEventListener('drop', function () {
        dragCounter = 0;
      });
      // 加载 help.md
      this.loadHelpContent();

      // 注册库加载进度回调（更新响应式数据）
      if (window.libraryLoader) {
        window.libraryLoader.onProgress(function (currentLib) {
          if (currentLib) {
            _this.loadingLibraryInfo = { name: currentLib.name, progress: currentLib.progress };
          } else {
            _this.loadingLibraryInfo = null;
          }
        });
      } else {
        console.warn('libraryLoader not found');
      }

      // 空格键控制播放/暂停
      document.addEventListener('keydown', function (e) {
        // 空格键（keyCode 32 或 key === ' '）
        if (e.keyCode === 32 || e.key === ' ') {
          // 检查焦点是否在输入框或文本域
          var activeElement = document.activeElement;
          var isInputFocused = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
          );

          // 只有在非输入状态且有文件加载时才触发播放/暂停
          if (!isInputFocused && !_this.isEmpty) {
            e.preventDefault(); // 阻止页面滚动
            _this.togglePlay();
          }
        }
      });

      // 预加载非关键库
      this.preloadLibraries();
    }
  });
}

// 页面加载完成后立即启动
(function () {
  // 检查库是否已加载
  function checkLibraries() {
    return typeof Vue !== 'undefined' && typeof SVGA !== 'undefined';
  }

  function start() {
    // 隐藏骨架屏
    var skeleton = document.getElementById('loading-skeleton');
    if (skeleton) {
      skeleton.style.display = 'none';
    }

    // 启动应用
    initApp();
  }

  // 如果已加载，直接启动
  if (checkLibraries()) {
    start();
  } else {
    // 否则等待加载完成
    var maxWait = 100; // 10秒超时
    var interval = setInterval(function () {
      if (checkLibraries()) {
        clearInterval(interval);
        start();
      } else if (--maxWait <= 0) {
        clearInterval(interval);
        var skeleton = document.getElementById('loading-skeleton');
        if (skeleton) {
          skeleton.innerHTML = '<div style="text-align: center; color: red;">加载失败，请刷新页面重试</div>';
        }
      }
    }, 100);
  }
})();