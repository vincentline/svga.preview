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
 *    - switchMode() - 统一模式切换 (策略模式)
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
 *    - triggerFileUpload() - 触发文件选择
 *    - (InputController) - 全局拖拽事件监听（独立模块）
 * 
 * 7. 【资源清理】
 *    - clearAll() - 清空画布 (调用 ResourceManager 释放资源)
 *    - cleanupSvga() - 清理SVGA资源
 *    - cleanupYyeva() - 清理MP4资源
 *    - (ResourceManager) - ObjectURL 与音频统一管理（独立模块）
 * 
 * 8. 【工具函数】
 *    - (SvgaUtils.showToast) - 提示消息 (移至 utils.js)
 *    - loadHelpContent() - 加载帮助文档
 * 
 * 9. 【SVGA加载与播放】修改音频控制相关的，请先查阅SVGA_AUDIO_IMPL.md
 *    - initSvgaPlayer() - 初始化SVGA播放器 (含音频同步驱动)
 *    - loadSvgaFile() - 加载SVGA文件
 *    - cleanupSvga() - 清理SVGA资源
 * 
 * 10. 【播放控制】
 *     - togglePlay() - 播放/暂停
 *     - seekTo() - 跳转进度
 *     - updateProgress() - 更新进度
 *     - (PlayerController) - 统一播放控制逻辑（独立模块）
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
 *     - parseSvgaAudioData() - [CRITICAL] 解析SVGA音频数据 (protobuf)
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
 *     - openMP4Panel() - 打开弹窗
 *     - startMP4Conversion() - 开始转换（旧版/保留）
 * 
 * 17. 【格式转换：普通MP4转双通道MP4】
 *     - openMp4ToDualChannelPanel() - 打开弹窗
 *     - startMp4ToDualChannelConversion() - 开始转换
 * 
 * 18. 【格式转换：Lottie转双通道MP4】
 *     - openLottieToDualChannelPanel() - 打开弹窗
 * 
 * 19. 【格式转换：Lottie转SVGA】
 *     - openLottieToSvgaPanel() - 打开弹窗
 * 
 * 20. 【格式转换：序列帧转SVGA】
 *     - openFramesToSvgaPanel() - 打开弹窗
 * 
 * 21. 【格式转换：序列帧转双通道MP4】
 *     - openFramesToDualChannelPanel() - 打开弹窗
 * 
 * 22. 【格式转换：转换为普通MP4】
 *     - openStandardMp4Panel() - 打开弹窗（支持SVGA/双通道MP4）
 *     - startStandardMp4Conversion() - 开始转换
 * 
 * ====================================================================
 */

// 启动应用：先加载Vue和SVGA播放器，再创建Vue实例
function initApp() {
  // 引入命名空间 
  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  var SP = window.MeeWoo || {};
  var Utils = SP.Utils;
  var Core = SP.Core;
  var Controllers = SP.Controllers;
  var Services = SP.Services;
  var Mixins = SP.Mixins;
  var Exporters = SP.Exporters;

  // 捕获全局错误
  Vue.config.errorHandler = function (err, vm, info) {
    console.error('[Vue Error] ' + err.toString(), info);
    console.error(err);
  };

  var vueInstance = new Vue({
    el: '#app',
    components: {
      // 注册所有组件
      'material-panel': SP.Components.MaterialPanel,
      'gif-panel': SP.Components.GifPanel,
      'standard-mp4-panel': SP.Components.StandardMp4Panel,
      'dual-channel-panel': SP.Components.DualChannelPanel,
      'to-svga-panel': SP.Components.ToSvgaPanel,
      'chromakey-panel': SP.Components.ChromaKeyPanel
    },
    mixins: [Mixins.MaterialEditor, Mixins.PanelMixin],
    data: function () {
      return {
        // 全局加载状态
        isLoading: false,

        currentModule: 'svga', // 'svga' | 'yyeva' | 'lottie' | 'mp4' | 'frames'
        currentLoadTaskId: 0, // 加载任务ID，用于处理异步加载的竞态条件
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

        // 任务管理器
        taskManager: null, // 在 created 中初始化

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

        mp4HasAudio: false,

        // 素材替换

        materialList: [],

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
          pngQuality: 80,                   // PNG压缩质量 10-100%
          exportMuted: false                // 是否导出静音SVGA（不包含音频）
        },
        hasCompressedMaterials: false,      // 是否压缩过素材
        preCompressMaterials: null,         // 压缩前的素材状态（用于撤销）
        preCompressReplacedImages: null,    // 压缩前的replacedImages（用于撤销）
        preCompressScaleInfo: null,         // 压缩前的compressedScaleInfo（用于撤销）

        // 音频数据（从原始SVGA文件提取）
        svgaAudioData: null, // { audioKey: Uint8Array }
        svgaMovieData: null, // protobuf解析后的MovieEntity

        // GIF 导出状态和配置

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

        // 普通MP4转换配置
        showStandardMp4Panel: false,
        isConvertingStandardMp4: false,
        standardMp4Progress: 0,
        standardMp4Message: '',
        standardMp4Config: {
          width: 0,
          height: 0,
          quality: 80,
          fps: 30,
          muted: false
        },
        standardMp4SourceInfo: {
          sizeWH: '',
          duration: '',
          typeLabel: '文件'
        },

        // ==================== 更多侧边栏状态 ====================
        showMoreDrawer: false,

        // ==================== 绿幕抠图配置 ====================
        showChromaKeyPanel: false,
        chromaKeyEnabled: false,
        chromaKeySimilarity: 40,
        chromaKeySmoothness: 10,
        chromaKeyConfig: {
          enabled: false,
          similarity: 40,
          smoothness: 20,
          applied: false
        },

        // ==================== 普通MP4变速配置 ====================
        showSpeedRemapEditor: false,    // 显示时间轴编辑器
        selectedKeyframeIndex: -1,      // 当前选中的K帧索引
        timelineHoverX: -1,             // hover预览线位置
        showEditFrameDialog: false,     // 显示编辑帧数弹窗
        editingKeyframeIndex: -1,       // 正在编辑的K帧索引
        editFrameInput: '',             // 编辑帧数输入值

        // ==================== 视频转换弹窗 ====================
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

        dualChannelStage: '',

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
       * 
       * @returns {Array<{name: string}>} 任务列表
       */
      getOngoingTasks: function () {
        return this.taskManager.getRunningTasks();
      },

      /**
       * 取消所有正在进行的任务
       * @param {boolean} silent - 是否静默取消（不显示toast）
       * @returns {Array<string>} 被取消的任务名称列表
       */
      cancelOngoingTasks: function (silent) {
        var cancelledTasks = this.taskManager.cancelAll();

        // 显示取消提示
        if (!silent && cancelledTasks.length > 0) {
          this.utils.showToast('已取消：' + cancelledTasks.join('、'));
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
       * 加载用户配置
       */
      loadUserConfig: function () {
        if (!this.configManager) return;

        // 迁移旧数据 (localStorage -> ConfigManager)
        // 这是一个一次性的迁移逻辑，确保用户的老数据不会丢失
        this._migrateOldData();

        // 背景色
        var savedBg = this.configManager.get('bgColorKey');
        if (savedBg) this.bgColorKey = savedBg;

        // 恢复模式
        var lastMode = this.configManager.get('lastMode');
        var validModes = ['svga', 'lottie', 'mp4', 'frames', 'yyeva'];
        if (lastMode && validModes.indexOf(lastMode) !== -1) {
          this.currentModule = lastMode;
        }

        // GIF 配置
        var savedGifConfig = this.configManager.get('gifConfig');
        if (savedGifConfig) {
          if (savedGifConfig.fps) this.gifConfig.fps = savedGifConfig.fps;
          if (savedGifConfig.quality) this.gifConfig.quality = savedGifConfig.quality;
          if (savedGifConfig.transparent !== undefined) this.gifConfig.transparent = savedGifConfig.transparent;
          if (savedGifConfig.dither !== undefined) this.gifConfig.dither = savedGifConfig.dither;
          // 恢复尺寸偏好
          if (savedGifConfig.width) this.gifConfig.width = savedGifConfig.width;
          if (savedGifConfig.height) this.gifConfig.height = savedGifConfig.height;
        }
      },

      /**
       * 迁移旧版本数据到 ConfigManager
       * @private
       */
      _migrateOldData: function () {
        if (!this.configManager) return;

        // 1. 迁移主题 (theme)
        var oldTheme = localStorage.getItem('theme');
        if (oldTheme) {
          this.configManager.set('theme', oldTheme);
          localStorage.removeItem('theme');
        }

        // 2. 迁移背景色 (svga_preview_bg)
        var oldBg = localStorage.getItem('svga_preview_bg');
        if (oldBg) {
          this.configManager.set('bgColorKey', oldBg);
          localStorage.removeItem('svga_preview_bg');
        }

        // 3. 迁移 GIF 配置
        // 之前可能没有保存 GIF 配置，如果有散落的 key 也可以在这里迁移
      },

      /**
       * 保存用户配置
       */
      saveUserConfig: function (key, value) {
        if (this.configManager) {
          this.configManager.set(key, value);
        }
      },

      /**
       * 统一的模式切换函数
       * @param {string} targetMode - 目标模式（'svga' | 'yyeva' | 'lottie' | 'mp4' | 'frames'）
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

        // 2. 动态清理资源
        // 逻辑说明：无论是切换到新模式，还是重置当前模式，都需要清理"上一个状态"（fromMode）的资源
        if (!options.skipCleanup && fromMode) {
          var strategy = this.modeStrategies[fromMode];

          if (strategy && typeof strategy.cleanup === 'function') {
            // 使用 call(this) 确保方法内部的 this 指向 Vue 实例
            strategy.cleanup.call(this);
          } else {
            // 防御性编程：如果未找到策略，仅在控制台警告，不阻断流程
            console.warn('[switchMode] 未找到模式的清理策略:', fromMode);
          }

          // 统一释放该模式下的所有 ObjectURL 资源
          if (this.resourceManager) {
            this.resourceManager.releaseGroup(fromMode);
          }
        }

        // 3. 关闭所有弹窗
        this.closeRightPanel();

        // 4. 切换模式
        this.currentModule = targetMode;

        // 5. 重置视图状态
        if (this.viewportController) {
          this.viewportController.setScale(1, true);
          this.viewportController.setOffset(0, 0, true);
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
        return Core.libraryLoader.load(libKeys, highPriority);
      },

      /**
       * 预加载非关键库
       */
      preloadLibraries: function () {
        Core.libraryLoader.preload();
      },

      /* ==================== 文件加载与拖拽上传 ==================== */

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
       * @param {boolean} skipCheck - 是否跳过任务检查
       */
      handleFiles: function (files, skipCheck) {
        // 统一任务检查入口
        if (!skipCheck) {
          if (!this.confirmIfHasOngoingTasks('播放新文件', 'load')) {
            return;
          }
          this.cancelOngoingTasks(true);
        }

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
          // 已经检查过了，传递 skipCheck=true
          this.handleFile(filesArray[0], true);
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

      handleFile: function (file, skipCheck) {
        var _this = this;
        var name = (file.name || '').toLowerCase();
        var fileType = null;

        // 统一任务检查入口
        if (!skipCheck) {
          if (!this.confirmIfHasOngoingTasks('播放新文件', 'load')) {
            return;
          }
          this.cancelOngoingTasks(true);
        }

        // 判断文件类型
        if (name.endsWith('.svga')) {
          fileType = 'svga';
        } else if (name.endsWith('.json') || name.endsWith('.lottie')) {
          fileType = 'lottie';
        } else if (name.endsWith('.mp4')) {
          // MP4需要先检测是否为双通道
          // 注意：在检测前生成taskId，避免检测过程中taskId变化导致误判任务取消
          var detectionTaskId = ++this.currentLoadTaskId;

          this.detectMp4Type(file, function (isDualChannel, alphaPosition) {
            // 检查检测任务是否已过期
            if (detectionTaskId !== _this.currentLoadTaskId) {
              console.warn('MP4检测任务已取消 (TaskId mismatch)', detectionTaskId);
              return;
            }

            var mp4Type = isDualChannel ? 'yyeva' : 'mp4';
            // 验证文件
            _this.validateFile(file, mp4Type)
              .then(function (validatedData) {
                // 再次检查任务是否过期（用户可能在验证期间拖入了新文件）
                if (detectionTaskId !== _this.currentLoadTaskId) {
                  return;
                }

                // 验证通过
                // 加载文件
                if (mp4Type === 'yyeva') {
                  // 将检测到的alpha位置传递给loadYyeva
                  validatedData.alphaPosition = alphaPosition || 'right'; // 默认右侧为alpha通道
                  validatedData.detectionTaskId = detectionTaskId; // 传递检测任务ID
                  _this.loadYyeva(validatedData);
                } else {
                  _this.loadMp4File(validatedData);
                }
              })
              .catch(function (errorMsg) {
                // 检查任务是否过期
                if (detectionTaskId !== _this.currentLoadTaskId) {
                  return;
                }
                // 错误只弹提示，不影响当前播放
                alert(errorMsg);
              });
          });
          return; // 重要：MP4处理完毕，直接返回，不继续执行后面的代码
        } else {
          // 不支持的文件类型
          alert('不支持的文件类型，只支持 .svga / .json / .lottie / .mp4');
          return; // 直接返回，不继续执行
        }

        // 验证文件（SVGA/Lottie）
        this.validateFile(file, fileType)
          .then(function (validatedData) {
            // 验证通过
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

        // 确认后取消任务
        this.cancelOngoingTasks(true);

        // 清理音频 (修复：清空后声音可能残留问题)
        // 使用 ResourceManager 统一清理，避免直接调用 Howler 造成冲突
        if (this.resourceManager) {
          // 注意：releaseAll 会清理所有 ObjectURL 和音频，适合 clear 场景
          // 但这里我们只希望清理音频，或者也可以保留 ObjectURL？
          // 考虑到 clear 是彻底清空，releaseAll 是合适的。
          // 但为了不误伤其他可能还没重新生成的资源，我们可以针对性清理。
          // 由于 resourceManager.releaseAll() 已经集成了 GlobalAudioManager.unloadAll()
          // 我们可以直接调用 GlobalAudioManager（如果暴露了）或者通过 releaseAll

          // 简单起见，且 resourceManager 旨在管理所有资源，我们这里手动调用音频清理
          if (window.MeeWoo.Controllers && window.MeeWoo.Controllers.GlobalAudioManager) {
            window.MeeWoo.Controllers.GlobalAudioManager.unloadAll();
          }
        } else if (typeof Howler !== 'undefined') {
          // 降级处理
          Howler.unload();
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

        // 确认后取消任务
        this.cancelOngoingTasks(true);

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
        var savedAlphaPosition = null; // 保存yyeva的alpha位置

        // 根据当前模式获取原始文件（支持5种模式）
        if (currentMode === 'svga' && this.svga.hasFile) {
          currentFile = this.svga.file;
        } else if (currentMode === 'yyeva' && this.yyeva.hasFile) {
          currentFile = this.yyeva.file;
          savedAlphaPosition = this.yyeva.alphaPosition; // 保存alpha位置用于恢复
        } else if (currentMode === 'mp4' && this.mp4.hasFile) {
          currentFile = this.mp4.file;
        } else if (currentMode === 'lottie' && this.lottie.hasFile) {
          currentFile = this.lottie.file;
        } else if (currentMode === 'frames' && this.frames.hasFile) {
          currentFile = this.frames.file;
        }

        if (!currentFile) {
          this.utils.showToast('没有文件可以恢复');
          return;
        }

        /* ==================== 3. 重置所有编辑状态 ==================== */

        // 3.1 重置背景色到默认状态（pattern）
        this.bgColorKey = 'pattern';

        // 3.2 重置素材替换和压缩状态
        this.replacedImages = {};
        if (this.clearAllMaterialEditStates) {
          this.clearAllMaterialEditStates();
        }
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
            file: currentFile,
            alphaPosition: savedAlphaPosition // 传递保存的alpha位置
          });
        } else if (currentMode === 'mp4') {
          this.loadMp4File({ file: currentFile });
        } else if (currentMode === 'lottie') {
          this.loadLottie({ file: currentFile });
        } else if (currentMode === 'frames') {
          this.loadFrames({ file: currentFile });
        }

        this.utils.showToast('已恢复到初始状态');
      },

      /* ==================== 工具函数 ==================== */

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

            // 核心修复：手动驱动 PlayerController 进行音频同步
            // 增加 _this.isPlaying 检查，确保暂停后不再驱动音频
            // [CRITICAL] 音频同步必须由 onFrame 驱动，且必须检查播放状态。详见 SVGA_AUDIO_IMPL.md #2.2 B
            if (_this.playerController && _this.playerController.syncAudio && _this.isPlaying) {
              _this.playerController.syncAudio(frame);
            }
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

        // 生成加载任务ID
        var taskId = ++this.currentLoadTaskId;

        // 开始加载，显示loading
        this.isLoading = true;

        // 切换模式
        this.switchMode('svga');

        // 设置文件信息
        this.svga.hasFile = true;
        // 性能优化：File 对象为只读数据，冻结后避免 Vue 响应式监听开销
        this.svga.file = Object.freeze(file);
        this.svga.fileInfo.name = file.name;
        this.svga.fileInfo.size = file.size;
        this.svga.fileInfo.sizeText = this.utils.formatBytes(file.size);
        this.originalVideoItem = videoItem;

        // 提取素材列表
        this.extractMaterialList(videoItem);

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

        // 使用 Promise.all 处理所有异步任务（音频解析等）
        // 如果音频解析很快，就不会有明显的延迟
        var audioTask = file.arrayBuffer().then(function (arrayBuffer) {
          if (taskId !== _this.currentLoadTaskId) return Promise.reject('task_cancelled');
          return _this.parseSvgaAudioData(arrayBuffer);
        });

        // 最小过渡时间（避免闪烁），但大大缩短
        var minTransition = new Promise(function (resolve) {
          setTimeout(resolve, 50); // 从400ms减到50ms，仅用于让Vue有时间渲染DOM
        });

        Promise.all([audioTask, minTransition]).then(function (results) {
          // 无论成功还是被取消，都应该关闭 loading（但如果是被取消，可能后续会有新任务接管 loading）
          // 这里我们只在任务未被取消时处理
          if (taskId !== _this.currentLoadTaskId) return;

          _this.isLoading = false;
          _this.footerTransitioning = false;
          _this.footerContentVisible = true;

          // 初始化播放器
          if (!_this.svgaPlayer) {
            _this.initSvgaPlayer();
          }

          // 创建objectUrl
          if (file) {
            _this.svgaObjectUrl = _this.resourceManager.createObjectURL(file, 'svga');
          }

          // 加载动画
          // 优先使用手动解析的 protobuf 音频配置
          var sourceAudios = null;

          // results[0] 是 parseSvgaAudioData 的返回值 (movieData)
          var movieData = results[0];

          if (movieData && movieData.audios && movieData.audios.length > 0) {

            sourceAudios = movieData.audios;
          } else if (_this.svgaMovieData && _this.svgaMovieData.audios && _this.svgaMovieData.audios.length > 0) {
            // 兜底检查
            sourceAudios = _this.svgaMovieData.audios;
          } else {

            sourceAudios = videoItem.audios;
          }

          _this.svgaAudios = sourceAudios ? JSON.parse(JSON.stringify(sourceAudios)) : [];


          if (videoItem.audios) {
            videoItem.audios = []; // 清空内置音频，禁用 SVGA 自带播放逻辑
          }

          _this.svgaPlayer.setVideoItem(videoItem);

          // 重要：setVideoItem 后重新设置 onFrame 回调（防止被重置）
          _this.svgaPlayer.onFrame(function (frame) {
            if (_this.currentModule === 'svga' && _this.totalFrames > 0) {
              _this.currentFrame = frame;
              _this.progress = Math.round((frame / _this.totalFrames) * 100);
              _this.currentTime = frame / (_this.svgaFps || 30);

              // 新增：每一帧都尝试同步音频
              if (_this.playerController && _this.playerController.syncAudio) {
                _this.playerController.syncAudio(frame);
              }
            }
          });

          // 直接使用svgaPlayer开始播放，确保拖入后立即播放
          if (_this.svgaPlayer) {
            _this.svgaPlayer.startAnimation();
            _this.isPlaying = true;
          }
          // 确保playerController已初始化
          if (!_this.playerController) {
            _this.initPlayerController();
          }
          _this.currentFrame = 0;
          _this.progress = 0;

          _this.applyCanvasBackground();

          // 计算初始缩放比例并居中（委托给 ViewportController）
          if (videoItem.videoSize && _this.viewportController) {
            _this.viewportController.resetView();
          }
        }).catch(function (err) {
          if (err === 'task_cancelled') return;
          console.error('SVGA Load Error:', err);

          if (taskId === _this.currentLoadTaskId) {
            _this.isLoading = false;
            // 即使出错也尝试继续播放视频部分
            _this.footerTransitioning = false;
            _this.footerContentVisible = true;
            if (!_this.svgaPlayer) _this.initSvgaPlayer();
            _this.svgaPlayer.setVideoItem(videoItem);
            // 直接使用svgaPlayer开始播放，确保拖入后立即播放
            if (_this.svgaPlayer) {
              _this.svgaPlayer.startAnimation();
              _this.isPlaying = true;
            }
            // 确保playerController已初始化
            if (!_this.playerController) {
              _this.initPlayerController();
            }
          }
        });
      },

      /**
       * 加载Lottie文件（验证已完成，直接加载）
       * @param {Object} validatedData - 验证后的数据：{ animationData, file }
       */
      loadLottieFile: function (validatedData) {
        var _this = this;
        var file = validatedData.file;
        var animationData = validatedData.animationData;

        // 生成加载任务ID
        var taskId = ++this.currentLoadTaskId;

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
        // 性能优化：不放入 Vue data，避免响应式开销；也不冻结，因为 lottie-web 会修改它
        this._lottieAnimationData = animationData;
        this.lottie.animationData = null;
        this.lottie.originalWidth = width;
        this.lottie.originalHeight = height;
        this.lottie.frameRate = frameRate;
        this.lottie.fileInfo.name = file.name;
        this.lottie.fileInfo.size = file.size;
        this.lottie.fileInfo.sizeText = this.utils.formatBytes(file.size);
        this.lottie.fileInfo.fps = frameRate + ' FPS';
        this.lottie.fileInfo.sizeWH = width + 'x' + height;
        this.lottie.fileInfo.width = width;
        this.lottie.fileInfo.height = height;
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
          if (taskId !== _this.currentLoadTaskId) return;
          _this.initLottiePlayer();
        }).catch(function (err) {
          console.error('Lottie Load Error:', err);
          alert('Lottie库加载失败，请刷新页面重试');
          _this.switchMode('svga');
        });
      },

      /**
       * 加载双通MP4文件（验证已完成，直接加载）
       * @param {Object} validatedData - 验证后的数据：{ file, alphaPosition, detectionTaskId }
       */
      loadYyeva: function (validatedData) {
        var _this = this;
        var file = validatedData.file;
        var detectedAlphaPosition = validatedData.alphaPosition || 'right'; // 使用检测到的alpha位置

        // 生成加载任务ID，用于处理异步加载的竞态条件
        // 注意：如果有detectionTaskId，说明是从Mp4检测流程过来的，taskId已经生成过了
        var taskId;
        if (validatedData.detectionTaskId) {
          // 使用传入的taskId，保持一致性（不修改currentLoadTaskId）
          taskId = validatedData.detectionTaskId;
          // 验证taskId是否仍然有效
          if (taskId !== this.currentLoadTaskId) {
            console.warn('YYEVA加载任务已过期 (TaskId mismatch)', taskId, '当前:', this.currentLoadTaskId);
            return;
          }
        } else {
          // 直接调用loadYyeva（如恢复播放），需要生成新taskId
          taskId = ++this.currentLoadTaskId;
        }

        // 切换模式
        this.switchMode('yyeva');

        this.yyeva.hasFile = true;
        // 性能优化：File 对象为只读数据，冻结后避免 Vue 响应式监听开销
        this.yyeva.file = Object.freeze(file);
        this.yyeva.fileInfo.name = file.name;
        this.yyeva.fileInfo.size = file.size;
        this.yyeva.fileInfo.sizeText = this.utils.formatBytes(file.size);

        // 启动过渡
        this.footerTransitioning = true;
        this.footerContentVisible = false;

        var objectUrl = this.resourceManager.createObjectURL(file, 'yyeva');
        this.yyevaObjectUrl = objectUrl;
        var video = document.createElement('video');
        video.src = objectUrl;
        video.crossOrigin = 'anonymous';
        video.preload = 'auto'; // [Optimize] 显式开启预加载
        video.loop = true;
        video.muted = true;

        video.onloadedmetadata = function () {
          // 检查任务是否已过时
          if (taskId !== _this.currentLoadTaskId) {
            console.warn('YYEVA加载任务已取消 (TaskId mismatch)', taskId);
            video.onerror = null; // 防止src清空触发onError
            video.pause();
            video.src = '';
            // 资源将由 ResourceManager 统一释放，或在此处手动释放
            if (_this.resourceManager) {
              _this.resourceManager.revokeObjectURL(objectUrl, 'yyeva');
            }
            return;
          }

          var videoWidth = video.videoWidth;
          var videoHeight = video.videoHeight;
          var duration = video.duration;

          // 使用检测到的FPS，如果未检测到则尝试使用上次保存的FPS，否则默认为30
          var fps = validatedData.detectedFps || _this.yyeva.detectedFps || 30;
          // 保存检测到的FPS供后续使用（如恢复播放时）
          if (validatedData.detectedFps) {
            _this.yyeva.detectedFps = validatedData.detectedFps;
          }

          var totalFrames = Math.round(duration * fps);

          _this.yyeva.displayWidth = Math.floor(videoWidth / 2);
          _this.yyeva.displayHeight = videoHeight;
          _this.yyeva.fileInfo.sizeWH = _this.yyeva.displayWidth + ' × ' + _this.yyeva.displayHeight;
          _this.yyeva.fileInfo.width = _this.yyeva.displayWidth;
          _this.yyeva.fileInfo.height = _this.yyeva.displayHeight;
          _this.yyeva.fileInfo.fps = (validatedData.detectedFps || _this.yyeva.detectedFps ? (validatedData.detectedFps || _this.yyeva.detectedFps) : '30 (Default)') + ' FPS';
          _this.yyeva.fileInfo.duration = duration.toFixed(2) + 's';
          _this.totalFrames = totalFrames;
          _this.totalDuration = duration;
          _this.currentFrame = 0;
          _this.currentTime = 0;
          _this.progress = 0;
          _this.isPlaying = false;
          _this.yyevaVideo = video;
          _this.yyevaAlphaPosition = 'left';

          // 设置检测到的alpha位置（优先使用检测结果）
          _this.yyeva.alphaPosition = detectedAlphaPosition;

          // 检测是否包含音频
          _this.yyevaHasAudio = _this.detectVideoHasAudio(video);

          setTimeout(function () {
            if (taskId !== _this.currentLoadTaskId) return;

            _this.footerTransitioning = false;
            _this.footerContentVisible = true;
            _this.initYyevaCanvas();

            // 计算初始缩放比例并居中（委托给 ViewportController）
            if (_this.viewportController) {
              _this.viewportController.resetView();
            }

            // 检测 alpha 位置并渲染第一帧
            // 注意：detectAlphaPosition会重新检测并覆盖alphaPosition，但已经在上面设置了检测结果
            // 为了兼容性，保留这个调用，但如果已有检测结果就不再重复检测
            video.onseeked = function () {
              video.onseeked = null;
              if (taskId !== _this.currentLoadTaskId) return;

              // 只有在未检测到alpha位置时才重新检测
              if (!detectedAlphaPosition) {
                _this.detectAlphaPosition(video);
              }
              _this.renderYyevaFrame();

              // 自动播放
              setTimeout(function () {
                if (taskId !== _this.currentLoadTaskId) return;

                video.play().then(function () {
                  if (taskId !== _this.currentLoadTaskId) {
                    video.pause();
                    return;
                  }
                  _this.isPlaying = true;
                  _this.startYyevaRenderLoop();

                  // 恢复声音状态（如果在初始化时被强制静音了）
                  if (!_this.isMuted) {
                    video.muted = false;
                  }

                  // 播放后再次检测音频（针对Chrome的webkitAudioDecodedByteCount）
                  setTimeout(function () {
                    if (taskId !== _this.currentLoadTaskId) return;
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
          if (taskId !== _this.currentLoadTaskId) return; // 忽略已取消任务的错误
          if (_this.resourceManager) {
            _this.resourceManager.revokeObjectURL(objectUrl, 'mp4');
          }
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

        // 生成加载任务ID
        var taskId = ++this.currentLoadTaskId;

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
        this.mp4.fileInfo.sizeText = this.utils.formatBytes(file.size);

        // 创建objectUrl
        this.mp4ObjectUrl = this.resourceManager.createObjectURL(file, 'mp4');

        // 创建视频元素
        var video = document.createElement('video');
        video.src = this.mp4ObjectUrl;
        video.crossOrigin = 'anonymous';
        video.preload = 'auto'; // [Optimize] 显式开启预加载
        video.muted = this.isMuted;
        video.loop = true;
        video.playsInline = true;
        video.disableRemotePlayback = true; // 禁用远程播放，减少不必要的资源消耗
        video.controls = false; // 禁用默认控件，减少渲染负担
        video.autoplay = false; // 显式禁用自动播放，使用代码控制播放时机
        // 不设置 max-width/max-height，让容器的 transform scale 生效
        video.style.cssText = 'display: block; width: 100%; height: 100%; object-fit: contain;';
        this.mp4Video = video;

        video.onloadedmetadata = function () {
          // 检查任务是否已过时
          if (taskId !== _this.currentLoadTaskId) {
            console.warn('MP4加载任务已取消 (TaskId mismatch)', taskId);
            video.onerror = null; // 防止src清空触发onError
            video.pause();
            video.src = '';
            // objectUrl 在 cleanupMp4 中会被清理，或者这里手动清理也可以
            // 但因为 this.mp4Video 已经被赋值了，如果 switchMode 调用了 cleanupMp4，它会清理 this.mp4ObjectUrl
            // 但是如果 taskId 变了，说明有新的 mp4 加载，那么 this.mp4Video 已经被指向新的 video 了
            // 所以旧的 video 确实成了孤儿
            // 但这里 loadMp4File 是同步赋值 this.mp4Video = video 的
            // 所以 cleanupMp4 会清理它。
            // 只有当异步回调回来时，如果界面已经切换走了，才需要额外小心
            return;
          }

          var videoWidth = video.videoWidth;
          var videoHeight = video.videoHeight;
          var duration = video.duration;

          // 使用检测到的FPS，如果未检测到则尝试使用上次保存的FPS，否则默认为30
          var fps = validatedData.detectedFps || _this.mp4.detectedFps || 30;
          if (validatedData.detectedFps) {
            _this.mp4.detectedFps = validatedData.detectedFps;
          }

          var totalFrames = Math.round(duration * fps);

          _this.mp4.originalWidth = videoWidth;
          _this.mp4.originalHeight = videoHeight;
          _this.mp4.fileInfo.sizeWH = videoWidth + 'x' + videoHeight;
          _this.mp4.fileInfo.fps = (validatedData.detectedFps || _this.mp4.detectedFps ? (validatedData.detectedFps || _this.mp4.detectedFps) : '30 (Default)') + ' FPS';
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
            if (taskId !== _this.currentLoadTaskId) return;

            _this.footerTransitioning = false;
            _this.footerContentVisible = true;

            // 自动播放
            setTimeout(function () {
              if (taskId !== _this.currentLoadTaskId) return;

              video.play().then(function () {
                if (taskId !== _this.currentLoadTaskId) {
                  video.pause();
                  return;
                }
                _this.isPlaying = true;
                _this.startMp4ProgressLoop();

                // 播放后再次检测音频（针对Chrome的webkitAudioDecodedByteCount）
                setTimeout(function () {
                  if (taskId !== _this.currentLoadTaskId) return;
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
          if (taskId !== _this.currentLoadTaskId) return; // 忽略已取消任务的错误
          URL.revokeObjectURL(_this.mp4ObjectUrl);
          alert('视频加载失败');
        };
      },

      /* ==================== 工具函数 ==================== */

      /**
       * 解析尺寸字符串，支持 '1920x1080' 和 '1920 × 1080' 格式
       * @param {string} sizeWH - 尺寸字符串
       * @returns {Object} - 包含width和height的对象
       */
      parseSizeWH: function (sizeWH) {
        var width = 0, height = 0;
        if (sizeWH) {
          var parts = sizeWH.split('x');
          if (parts.length === 2) {
            width = parseInt(parts[0]);
            height = parseInt(parts[1]);
          } else {
            parts = sizeWH.split(' × ');
            if (parts.length === 2) {
              width = parseInt(parts[0]);
              height = parseInt(parts[1]);
            }
          }
        }
        return { width, height };
      },

      /* ==================== 普通MP4转换功能 ==================== */

      openStandardMp4Panel: function (type) {
        var info = type === 'svga' ? this.svga.fileInfo :
          type === 'lottie' ? this.lottie.fileInfo :
            this.yyeva.fileInfo;
        if (!info) return;

        // 解析尺寸
        var width = 0, height = 0;
        if (type === 'svga') {
          width = this.svga.originalWidth;
          height = this.svga.originalHeight;
        } else if (type === 'lottie') {
          // 解析 Lottie 尺寸
          var lottieSize = this.parseSizeWH(info.sizeWH);
          width = lottieSize.width;
          height = lottieSize.height;
        } else if (type === 'yyeva') {
          width = this.yyeva.displayWidth;
          height = this.yyeva.displayHeight;
        }

        if (!width || !height) {
          // 如果仍未获取到尺寸，尝试再次解析
          var fallbackSize = this.parseSizeWH(info.sizeWH);
          width = fallbackSize.width;
          height = fallbackSize.height;
        }

        // 解析帧率
        var fps = 30;
        if (info.fps) {
          fps = parseInt(info.fps) || 30;
        }

        // 设置源信息
        this.standardMp4SourceInfo = {
          sizeWH: info.sizeWH || (width + ' × ' + height),
          duration: info.duration || '',
          typeLabel: type === 'svga' ? 'SVGA' : type === 'yyeva' ? 'MP4' : 'Lottie'
        };

        this.standardMp4Config = {
          width: width,
          height: height,
          quality: 80,
          fps: fps,
          muted: false,
          aspectRatio: width / height
        };

        this.openRightPanel('showStandardMp4Panel');

        // 预加载FFmpeg库 (高优先级插队)
        Services.FFmpegService.init({ highPriority: true }).catch(function (e) {
          console.warn('FFmpeg预加载失败:', e);
        });
      },

      closeStandardMp4Panel: function () {
        this.showStandardMp4Panel = false;
      },

      cancelStandardMp4Conversion: function () {
        this.isConvertingStandardMp4 = false;
      },

      startStandardMp4Conversion: async function (panelConfig) {
        if (this.isConvertingStandardMp4) return;
        var _this = this;

        // 检查是否有其他正在进行的任务
        if (!this.confirmIfHasOngoingTasks('转换为普通MP4', 'task')) {
          return;
        }

        this.isConvertingStandardMp4 = true;
        this.standardMp4Progress = 0;
        this.standardMp4Message = '准备中...';

        var config = panelConfig || this.standardMp4Config;
        if (!config.width || !config.height) {
          alert('请输入有效的尺寸');
          this.isConvertingStandardMp4 = false;
          return;
        }

        // 初始化FFmpeg
        try {
          await Services.FFmpegService.init();
        } catch (e) {
          alert('FFmpeg加载失败：' + e.message);
          this.isConvertingStandardMp4 = false;
          return;
        }

        try {
          var taskId = null;
          if (this.taskManager) {
            taskId = this.taskManager.register('转换为普通MP4', function () {
              _this.isConvertingStandardMp4 = false;
              _this.standardMp4Progress = 0;
            });
          }

          // 准备源信息
          var sourceInfo = this.currentModule === 'svga' ? this.svga.fileInfo :
            this.currentModule === 'lottie' ? this.lottie.fileInfo :
              this.yyeva.fileInfo;

          // 暂停播放
          var wasPlaying = this.isPlaying;
          await this.pauseForExport();

          // 提取帧
          var frames = [];
          var exportFps = config.fps;

          // 计算总导出帧数
          var duration = this.totalDuration || 0;
          if (duration <= 0) duration = 1;

          var exportTotalFrames = Math.ceil(duration * exportFps);
          var sourceFps = parseFloat(sourceInfo.fps) || 30;

          var cancelCheck = function () {
            if (!_this.isConvertingStandardMp4) throw new Error('User Cancelled');
          };

          for (var i = 0; i < exportTotalFrames; i++) {
            cancelCheck();

            // 计算当前时间点对应的源帧索引
            var currentTime = i / exportFps;
            var sourceFrameIndex = Math.round(currentTime * sourceFps);

            // 跳转
            await this.seekToFrame(sourceFrameIndex, sourceFps, sourceInfo);

            if (_this.currentModule === 'yyeva') {
              // YYEVA 特殊等待：确保视频帧已更新
              await new Promise(function (resolve) {
                var checkCount = 0;
                var check = function () {
                  // 检查 readyState
                  if (_this.yyevaVideo.readyState >= 2) {
                    resolve();
                  } else {
                    checkCount++;
                    if (checkCount > 25) resolve(); // 超时 500ms
                    else setTimeout(check, 20);
                  }
                };
                check();
              });
              // 额外给一点渲染时间
              await new Promise(function (r) { setTimeout(r, 30); });
            } else {
              await new Promise(function (r) { setTimeout(r, 50); });
            }

            var canvas = null;

            // 特殊处理YYEVA模式，确保获取到的是处理后的画面（带透明通道的渲染结果）
            if (_this.currentModule === 'yyeva') {
              // 强制渲染当前帧
              _this.renderYyevaFrame();

              canvas = _this.yyevaCanvas;

              // 再次确认canvas存在
              if (!canvas) {
                console.error('YYEVA Canvas not found');
                continue;
              }

              // 再次确认尺寸（防错）
              if (canvas.width !== config.width || canvas.height !== config.height) {
                // 如果尺寸不匹配，可能是初始化问题，尝试使用正确的尺寸
                // 但通常不会发生，除非config.width被修改
              }
            } else {
              canvas = this.getCurrentFrameCanvas();
            }

            if (!canvas) continue;

            // 创建导出画布
            var exportCanvas = document.createElement('canvas');
            exportCanvas.width = config.width;
            exportCanvas.height = config.height;
            var ctx = exportCanvas.getContext('2d');

            // 1. 填充背景色
            // 用户要求：带透明信息，然后底色用背景色去合成视频，如果背景色是空白，就用默认黑色作为底色
            var bgColor = _this.currentBgColor;
            if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0,0,0,0)' || _this.bgColorKey === 'pattern') {
              bgColor = '#000000'; // 默认黑色
            }
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, config.width, config.height);

            // 2. 绘制画面（合成在背景之上）
            // 注意：canvas可能包含透明像素，drawImage会进行alpha混合
            ctx.drawImage(canvas, 0, 0, config.width, config.height);

            // 转换为JPEG并存入frames
            var dataUrl = exportCanvas.toDataURL('image/jpeg', config.quality);
            var bstr = atob(dataUrl.split(',')[1]);
            var n = bstr.length;
            var u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            frames.push(u8arr);

            // 进度日志
            if ((i + 1) % 10 === 0 || i === exportTotalFrames - 1) {

            }
          }

          // 准备音频
          var audioData = null;

          // YYeva模式音频
          if (!config.muted && this.currentModule === 'yyeva' && this.yyeva.file) {
            try {
              audioData = new Uint8Array(await this.yyeva.file.arrayBuffer());
            } catch (e) {
              console.warn('读取音频数据失败:', e);
            }
          }
          // SVGA模式音频
          else if (!config.muted && this.currentModule === 'svga' && this.svgaAudioData) {
            var audioKeys = Object.keys(this.svgaAudioData);
            if (audioKeys.length > 0) {
              audioData = this.svgaAudioData[audioKeys[0]]; // 暂时只支持第一个音频
            }
          }

          // 开始转换
          this.standardMp4Message = 'FFmpeg转换中...';
          var mp4Blob = await Services.FFmpegService.convertFramesToMp4({
            frames: frames,
            fps: exportFps,
            quality: config.quality,
            audioData: audioData,
            muted: config.muted,
            onProgress: function (p) {
              _this.standardMp4Progress = 30 + Math.round(p * 70);
              if (p < 0.3) _this.standardMp4Message = '写入文件...';
              else if (p < 0.9) _this.standardMp4Message = '编码中...';
              else _this.standardMp4Message = '生成文件中...';
            },
            checkCancelled: function () {
              return !_this.isConvertingStandardMp4;
            }
          });

          // 下载
          var currentName = (this.currentModule === 'svga' ? this.svga.fileInfo.name :
            this.currentModule === 'lottie' ? this.lottie.fileInfo.name :
              this.yyeva.fileInfo.name) || 'output';
          var fileName = currentName.replace(/\.[^/.]+$/, "") + '.mp4';

          this.utils.downloadFile(mp4Blob, fileName);

          alert('转换成功！');
          this.closeStandardMp4Panel();

        } catch (e) {
          if (e.message === 'User Cancelled') {
            // ignore
          } else if (e.message === 'FFmpeg服务正忙，请稍后再试') {
            alert('FFmpeg服务正忙，请稍后再试');
          } else {
            console.error(e);
            alert('转换失败: ' + e.message);
          }
        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
          this.isConvertingStandardMp4 = false;
          if (wasPlaying) this.resumeAfterExport();
        }
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
            _this.playerController = new Controllers.PlayerController({
              progressBar: progressBar,
              progressThumb: progressThumb,
              onProgressChange: function (progress, currentFrame) {
                _this.progress = progress;
                _this.currentFrame = currentFrame;
                // 修复：拖拽进度条时，同步更新 currentTime，确保快进快退基于最新时间计算
                if (_this.totalDuration > 0) {
                  _this.currentTime = (progress / 100) * _this.totalDuration;
                }
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
                  totalDuration: _this.totalDuration, // 补充时长
                  currentTime: _this.currentTime,     // 补充当前时间
                  isMuted: _this.isMuted,             // 补充静音状态（修复静音按钮无效问题）
                  hasFile: _this.svga.hasFile || _this.yyeva.hasFile || _this.mp4.hasFile || _this.lottie.hasFile || _this.frames.hasFile,
                  svgaPlayer: _this.svgaPlayer,
                  lottiePlayer: _this.lottiePlayer,
                  yyevaVideo: _this.yyevaVideo,
                  yyevaAnimationId: _this.yyevaAnimationId,
                  mp4Video: _this.mp4Video,
                  speedRemapConfig: _this.speedRemapConfig,
                  // 新增：传递音频配置和包含音频数据的 videoItem
                  svgaAudios: _this.svgaAudios,
                  svgaAudioData: _this.svgaAudioData, // 显式传递解析后的音频数据
                  videoItem: _this.originalVideoItem,
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

        this.viewportController = new Controllers.ViewportController({
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
          animationData: this._lottieAnimationData
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

            // 自动播放（使用PlayerController统一接口）
            setTimeout(function () {
              if (_this.playerController && !_this.isPlaying) {
                _this.playerController.togglePlay();
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
        this._lottieAnimationData = null;

        // 重置播放状态
        this.isPlaying = false;
        this.progress = 0;
        this.currentFrame = 0;
        this.totalFrames = 0;
      },

      /* ==================== 序列帧加载与播放 ==================== */

      /**
       * 加载序列帧文件
       * @param {Array<File>} files - 图片文件数组
       */
      loadFrameSequence: function (files) {
        var _this = this;

        // 排序文件
        var sortedFiles = this.utils.sortFilesByName(files);

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
                sizeText: _this.utils.formatBytes(totalSize),
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
       * 恢复播放时加载序列帧（用于 restorePlayback）
       * @param {Object} options - 配置参数 { file: File 或 Array<File> }
       */
      loadFrames: function (options) {
        var _this = this;

        // 如果传入的是文件数组，直接加载
        var files = options.file;
        if (!Array.isArray(files)) {
          // 如果是单个文件，尝试从 frames.files 获取所有文件
          if (this.frames.files && this.frames.files.length > 0) {
            files = this.frames.files;
          } else {
            console.error('没有可以加载的序列帧文件');
            return;
          }
        }

        // 排序文件
        var sortedFiles = this.utils.sortFilesByName(files);

        // 加载第一帧获取尺寸信息
        var firstFile = sortedFiles[0];
        var reader = new FileReader();

        reader.onload = function (e) {
          var img = new Image();
          img.onload = function () {
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
                sizeText: _this.utils.formatBytes(totalSize),
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

            // 预加载所有帧
            _this.preloadFrameImages();

            // 直接启动过渡动画和缩放居中，不显示帧率对话框
            _this.footerTransitioning = true;
            _this.footerContentVisible = false;

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
              });
            }, 300);
          };
          img.src = e.target.result;
        };

        reader.readAsDataURL(firstFile);
      },

      /**
       * 预加载所有帧图片
       * 使用并发限制池，防止一次性加载过多图片导致卡顿
       */
      preloadFrameImages: async function () {
        var _this = this;
        var files = this.frames.files;
        // 初始化数组，按索引填充 null，确保顺序
        this.framesImages = new Array(files.length).fill(null);

        // 并发限制
        var CONCURRENCY_LIMIT = 5;
        var queue = [];

        // 构建任务队列
        for (var i = 0; i < files.length; i++) {
          queue.push({ index: i, file: files[i] });
        }

        // 递归执行任务
        var processNext = async function () {
          if (queue.length === 0) return;

          var task = queue.shift();
          try {
            // 使用 ResourceManager 创建并托管 ObjectURL
            var objectUrl = _this.resourceManager.createObjectURL(task.file, 'frames');

            // 加载图片
            var img = await new Promise(function (resolve, reject) {
              var image = new Image();
              image.onload = function () { resolve(image); };
              image.onerror = reject;
              image.src = objectUrl;
            });

            _this.framesImages[task.index] = img;
          } catch (e) {
            console.error('Failed to load frame ' + task.index, e);
          }

          // 继续处理下一个
          await processNext();
        };

        // 启动初始并发批次
        var workers = [];
        for (var j = 0; j < Math.min(CONCURRENCY_LIMIT, files.length); j++) {
          workers.push(processNext());
        }

        // 等待所有 workers 完成
        await Promise.all(workers);

        // 过滤掉加载失败的帧（虽然上面预填充了null，但如果加载失败保持null可能导致渲染报错）
        this.framesImages = this.framesImages.filter(function (img) { return img !== null; });

        // 加载完成，初始化播放器
        this.initFramesPlayer();
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

        // ObjectURL 由 ResourceManager 在 switchMode 中统一释放，这里无需手动 revoke
        if (this.framesBlobUrls) {
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
        var lastUIUpdate = 0; // [Optimize] UI更新节流

        function render(timestamp) {
          if (!_this.yyevaVideo || !_this.yyevaCanvas || !_this.yyevaCtx) {
            return;
          }
          if (!timestamp) timestamp = performance.now();

          _this.renderYyevaFrame();

          // [Optimize] 节流更新 UI (30ms)
          if (timestamp - lastUIUpdate > 30) {
            _this.updateYyevaProgress();
            lastUIUpdate = timestamp;
          }

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

        // 确保视频已就绪
        if (video.readyState < 2) return;

        var halfWidth = Math.floor(video.videoWidth / 2);
        var height = video.videoHeight;

        // 确定彩色和Alpha的位置
        // 默认认为Alpha在右侧（左彩右黑），除非明确标记为'left'
        var isAlphaRight = this.yyeva.alphaPosition !== 'left';
        var colorX = isAlphaRight ? 0 : halfWidth;
        var alphaX = isAlphaRight ? halfWidth : 0;

        // 复用临时Canvas（性能优化：避免每帧创建新Canvas，减少GC和内存分配）
        var tempCanvas = this.yyevaTempCanvas;
        var tempCtx = this.yyevaTempCtx;

        // 仅在尺寸变化时调整Canvas大小
        if (tempCanvas.width !== video.videoWidth || tempCanvas.height !== height) {
          tempCanvas.width = video.videoWidth;
          tempCanvas.height = height;
        }

        // 清空临时画布，防止残留
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(video, 0, 0);

        // 获取彩色部分和Alpha部分的数据
        var colorData = tempCtx.getImageData(colorX, 0, halfWidth, height);
        var alphaData = tempCtx.getImageData(alphaX, 0, halfWidth, height);

        // 合成最终图像
        for (var i = 0; i < colorData.data.length; i += 4) {
          var alpha = alphaData.data[i]; // 使用R通道作为Alpha值

          // 反预乘：将预乘的RGB值还原
          if (alpha > 0) {
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
        var fps = this.yyeva.detectedFps || 30;

        this.currentTime = currentTime;
        this.totalDuration = duration;
        this.progress = (currentTime / duration) * 100;
        this.currentFrame = Math.round(currentTime * fps);
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
            console.warn('Stop SVGA animation failed:', e);
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
          if (this.resourceManager) {
            this.resourceManager.revokeObjectURL(this.svgaObjectUrl, 'svga');
          }
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
          this.yyevaVideo.removeAttribute('src');
          this.yyevaVideo.load();
          this.yyevaVideo = null;
        }

        if (this.yyevaObjectUrl) {
          if (this.resourceManager) {
            this.resourceManager.revokeObjectURL(this.yyevaObjectUrl, 'yyeva');
          }
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
        var lastUIUpdate = 0; // [Optimize] UI更新节流

        function updateProgress(timestamp) {
          if (!_this.mp4Video || _this.currentModule !== 'mp4') return;
          if (!timestamp) timestamp = performance.now();

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
            var fps = _this.mp4.detectedFps || 30;
            var currentFrame = Math.floor(video.currentTime * fps);

            // 变速时，进度基于变速后时间轴的position（匀速）
            if (_this.speedRemapConfig.enabled && _this.speedRemapConfig.keyframes.length >= 2) {
              var keyframes = _this.speedRemapConfig.keyframes;
              var totalFrames = _this.speedRemapConfig.originalTotalFrames || 1;

              // 优化：合并两个循环，一次遍历同时完成位置计算和区间查找
              var remappedPosition = 0;
              var segmentIndex = -1;

              // 优化：从当前区间开始搜索，提高找到匹配区间的效率
              var startIndex = Math.max(0, currentSegmentIndex);
              var keyframesLength = keyframes.length;
              for (var i = startIndex; i < keyframesLength - 1; i++) {
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

              // [Optimize] 节流更新 UI (30ms)
              if (timestamp - lastUIUpdate > 30) {
                _this.progress = (remappedPosition / lastKeyframe.position) * 100;
                _this.currentTime = remappedPosition * video.duration;
                _this.totalDuration = remappedDuration;
                lastUIUpdate = timestamp;
              }

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
              // [Optimize] 节流更新 UI
              if (timestamp - lastUIUpdate > 30) {
                _this.currentTime = video.currentTime;
                _this.totalDuration = video.duration;
                _this.progress = (video.currentTime / video.duration) * 100;
                lastUIUpdate = timestamp;
              }

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
          this.mp4Video.removeAttribute('src'); // 显式移除src
          this.mp4Video.load(); // 强制刷新状态
          this.mp4Video = null;
        }

        if (this.mp4ObjectUrl) {
          if (this.resourceManager) {
            // 延迟释放 ObjectURL，避免浏览器在视频元素卸载前报 net::ERR_ABORTED 错误
            var url = this.mp4ObjectUrl;
            var rm = this.resourceManager;
            setTimeout(function () {
              rm.revokeObjectURL(url, 'mp4');
            }, 100);
          }
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
          // 1. 初始化FFmpeg服务
          await Services.FFmpegService.init({
            onProgress: function (info) {
              // 初始化进度 0-10%
              _this.videoConvertProgress = Math.round(info.progress * 10);
            }
          });

          if (!this.isConverting) throw new Error('用户取消');

          // 2. 使用FFmpegService转换视频格式
          var file = this.mp4.file;
          if (!file) throw new Error('视频文件不存在');

          var blob = await Services.FFmpegService.convertVideoFormat({
            inputFile: file,
            maxWidth: 1280,
            onProgress: function (progress) {
              // 转换进度 10-95%
              _this.videoConvertProgress = 10 + Math.round(progress * 85);
            },
            checkCancelled: function () {
              return !_this.isConverting;
            }
          });

          this.videoConvertProgress = 95;

          // 3. 重新加载视频
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
          this.mp4.fileInfo.sizeText = this.utils.formatBytes(convertedFile.size);

          // 创建objectUrl
          this.mp4ObjectUrl = this.resourceManager.createObjectURL(blob, 'mp4');

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
          if (this.configManager) this.configManager.set('theme', 'dark');
        } else {
          document.body.classList.remove('dark-mode');
          if (this.configManager) this.configManager.set('theme', 'light');
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

        // 由于DOM结构发生变化，需要在下一个tick重新初始化播放器控制器
        // 以确保进度条拖拽事件监听器正确绑定
        this.$nextTick(function () {
          _this.initPlayerController();
        });
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
        this.openRightPanel('material');
      },

      /* 解析SVGA二进制数据以提取音频 */
      parseSvgaAudioData: function (arrayBuffer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
          // 动态加载 protobuf 和 pako
          _this.loadLibrary(['protobuf', 'pako'], true).then(function () {
            try {
              var uint8Array = new Uint8Array(arrayBuffer);
              var inflatedData = pako.inflate(uint8Array);

              protobuf.load('./svga.proto', function (err, root) {
                if (err) {
                  console.error('Protobuf load failed:', err);
                  resolve(null); // 解析失败不阻断流程，返回null
                  return;
                }

                try {
                  var MovieEntity = root.lookupType('com.opensource.svga.MovieEntity');
                  if (!MovieEntity) {
                    console.error('Proto文件中未找到MovieEntity定义');
                    resolve(null);
                    return;
                  }
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

                  resolve(movieData);
                } catch (decodeErr) {
                  console.error('SVGA Parser: Decode error', decodeErr);
                  resolve(null);
                }
              });
            } catch (err) {
              console.error('Data processing error:', err);
              resolve(null);
            }
          }).catch(function (err) {
            console.error('Failed to load libraries for audio parsing:', err);
            resolve(null);
          });
        });
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

        // 初始化内存占用显示为“计算中...”
        this.svga.fileInfo.memoryText = '计算中...';

        var imageKeys = Object.keys(videoItem.images);
        var imageCount = imageKeys.length;
        var processedCount = 0;
        var totalBytes = 0;

        // 收集所有音频key（用于排除）
        var audioKeys = new Set();
        if (videoItem.audios && videoItem.audios.length > 0) {
          videoItem.audios.forEach(function (audio) {
            if (audio.audioKey) {
              // 添加所有可能的音频key格式
              audioKeys.add(audio.audioKey);
              audioKeys.add(audio.audioKey + '.mp3');
              audioKeys.add(audio.audioKey + '.wav');
              audioKeys.add('audio_' + audio.audioKey);
              var keyWithoutExt = audio.audioKey.replace(/\.[^.]+$/, '');
              if (keyWithoutExt !== audio.audioKey) {
                audioKeys.add(keyWithoutExt);
              }
            }
          });
        }

        imageKeys.forEach(function (imageKey) {
          // 跳过音频key（音频数据存储在images字典中，但不是图片）
          if (audioKeys.has(imageKey)) {
            processedCount++;
            return;
          }

          var imgData = videoItem.images[imageKey];

          // 额外检查：如果数据是Uint8Array且以ID3标签开头，则是音频数据
          if (imgData && imgData.constructor === Uint8Array) {
            // 检查是否以 "ID3" 开头（MP3标签）
            if (imgData.length >= 3 &&
              imgData[0] === 0x49 && imgData[1] === 0x44 && imgData[2] === 0x33) {
              processedCount++;
              return;
            }
          }

          // 额外检查：如果是base64格式的字符串，解码后检查是否为MP3
          if (imgData && typeof imgData === 'string') {
            var base64Data = imgData.startsWith('data:') ? imgData.split(',')[1] : imgData;
            try {
              // 解码base64的前3个字节
              var decoded = atob(base64Data.substring(0, 8)); // 解码前8个字符（足够得到3字节）
              if (decoded.length >= 3 && decoded.charCodeAt(0) === 0x49 &&
                decoded.charCodeAt(1) === 0x44 && decoded.charCodeAt(2) === 0x33) {
                processedCount++;
                return;
              }
            } catch (e) {
              // 解码失败，继续处理
            }
          }

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
            materialItem.fileSizeText = _this.utils.formatBytes(bytes);
            materialItem.sizeText = this.width + ' × ' + this.height;
            materialItem.originalWidth = this.width;
            materialItem.originalHeight = this.height;

            totalBytes += bytes;
            processedCount++;

            // 所有图片处理完成后更新总内存
            if (processedCount === imageCount) {
              _this.svga.fileInfo.memoryText = _this.utils.formatBytes(totalBytes);
            }
          };

          img.onerror = function () {
            materialItem.sizeText = '-';
            materialItem.fileSizeText = '-';

            processedCount++;

            // 所有图片处理完成后更新总内存
            if (processedCount === imageCount) {
              _this.svga.fileInfo.memoryText = totalBytes > 0 ? _this.utils.formatBytes(totalBytes) : '-';
            }
          };

          if (previewUrl) {
            img.src = previewUrl;
          }
        });

        // 如果所有图片都同步处理完成，立即更新显示
        if (processedCount === imageCount) {
          this.svga.fileInfo.memoryText = totalBytes > 0 ? this.utils.formatBytes(totalBytes) : '-';
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
              material.fileSizeText = _this.utils.formatBytes(bytes);
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
        // 调用统一的恢复原图方法
        window.MeeWoo.Core.MaterialOperations.restoreOriginalMaterial(this, index);
        return;
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

        // 清除编辑状态
        this.clearMaterialEditState(index);

        // 重新渲染 SVGA
        this.applyReplacedMaterials();

        // 重新计算尺寸
        var _this = this;
        var img = new Image();
        img.onload = function () {
          var bytes = this.width * this.height * 4;
          material.fileSize = bytes;
          material.fileSizeText = _this.utils.formatBytes(bytes);
          material.sizeText = this.width + 'px*' + this.height + 'px';
        };
        img.src = material.previewUrl;
      },

      downloadMaterial: function (index) {
        // 下载素材图片
        var material = this.materialList[index];
        if (!material) return;

        // 获取图片URL
        var imageUrl = this.replacedImages[material.imageKey] || material.previewUrl;
        if (!imageUrl) {
          alert('图片数据不存在');
          return;
        }

        // 生成文件名：使用imageKey或索引
        var fileName = (material.imageKey || 'material_' + index) + '.png';

        // 使用 utils 下载
        this.utils.downloadFromDataURL(imageUrl, fileName);
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
          // 重置压缩失败标志
          if (window.MeeWoo && window.MeeWoo.Services && window.MeeWoo.Services.ImageCompressionService) {
            window.MeeWoo.Services.ImageCompressionService.resetCompressionFailed();
          }

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
            if (window.MeeWoo && window.MeeWoo.Services && window.MeeWoo.Services.ImageCompressionService) {
              try {
                // 使用ImageCompressionService压缩Canvas
                var pngData = await window.MeeWoo.Services.ImageCompressionService.compressCanvas(canvas, this.compressConfig.pngQuality);
                // 将Uint8Array转换为DataURL
                var blob = new Blob([pngData], { type: 'image/png' });
                // 使用FileReader将blob转换为DataURL，以便后续atob解码
                compressedDataUrl = await new Promise(function (resolve, reject) {
                  var reader = new FileReader();
                  reader.onloadend = function () {
                    resolve(reader.result);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
              } catch (e) {
                console.error('PNG压缩失败，使用Canvas原生输出:', e);
                compressedDataUrl = canvas.toDataURL('image/png');
              }
            } else {
              // 降级：使用Canvas原生输出
              compressedDataUrl = canvas.toDataURL('image/png');
            }

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
            material.fileSizeText = this.utils.formatBytes(bytes) + ' (压缩后)';

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

          // 检查是否有压缩失败
          var compressionFailed = false;
          if (window.MeeWoo && window.MeeWoo.Services && window.MeeWoo.Services.ImageCompressionService) {
            compressionFailed = window.MeeWoo.Services.ImageCompressionService.hasCompressionFailed();
          }

          if (compressionFailed) {
            this.utils.showToast('压缩完成，但部分图片使用了降级压缩方案');
          } else {
            this.utils.showToast('压缩完成，共压缩 ' + total + ' 个素材');
          }

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

        this.utils.showToast('已撤销压缩');
      },

      /**
       * 加载图片（Promise封装）
       * @private
       */
      _loadImage: function (src) {
        return new Promise(function (resolve, reject) {
          var img = new Image();

          // 重要：只对 blob URL 设置 crossOrigin，对 data URI 不设置
          // 原因：对 data URI 设置 crossOrigin 会在某些浏览器中导致加载失败
          // 特别是编辑素材图后生成的 data URI 图片
          if (src.startsWith('blob:')) {
            img.crossOrigin = 'Anonymous';
          }
          // data URI 不需要设置 crossOrigin

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
        this.svga.fileInfo.memoryText = this.utils.formatBytes(totalBytes);
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

              // 使用 SVGABuilder 解码
              Services.SvgaBuilder.decode(arrayBuffer, {
                protobuf: protobuf,
                pako: pako
              }).then(function (movieData) {
                try {

                  // 处理静音导出（如果开启了exportMuted选项）
                  if (_this.compressConfig.exportMuted) {
                    // 收集所有音频key
                    var audioKeysToRemove = [];
                    if (movieData.audios && movieData.audios.length > 0) {
                      movieData.audios.forEach(function (audio) {
                        if (audio.audioKey) {
                          // 添加所有可能的音频key格式
                          audioKeysToRemove.push(audio.audioKey);
                          audioKeysToRemove.push(audio.audioKey + '.mp3');
                          audioKeysToRemove.push(audio.audioKey + '.wav');
                          audioKeysToRemove.push('audio_' + audio.audioKey);
                          var keyWithoutExt = audio.audioKey.replace(/\.[^.]+$/, '');
                          if (keyWithoutExt !== audio.audioKey) {
                            audioKeysToRemove.push(keyWithoutExt);
                          }
                        }
                      });
                    }

                    // 清空音频列表
                    movieData.audios = [];

                    // 从movieData.images中删除音频数据
                    if (movieData.images && audioKeysToRemove.length > 0) {
                      audioKeysToRemove.forEach(function (key) {
                        if (movieData.images[key]) {
                          delete movieData.images[key];
                          // console.log('删除音频数据:', key);
                        }
                      });
                    }
                  }

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

                  // 使用 SVGABuilder 编码
                  Services.SvgaBuilder.encode(movieData, {
                    protobuf: protobuf,
                    pako: pako
                  }).then(function (blob) {
                    var originalName = _this.svga.fileInfo.name.replace(/\.svga$/i, '');
                    _this.utils.downloadFile(blob, originalName + '_modified.svga');
                    _this.utils.showToast('导出成功！已替换 ' + replacedCount + ' 个素材。');
                  }).catch(function (err) {
                    console.error('编码失败:', err);
                    alert('编码失败: ' + err.message);
                  });

                } catch (decodeErr) {
                  console.error('逻辑处理失败:', decodeErr);
                  alert('逻辑处理失败: ' + decodeErr.message);
                }
              }).catch(function (err) {
                console.error('SVGA解码失败:', err);
                alert('SVGA解码失败: ' + err.message);
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

        // 使用统一的弹窗管理
        this.openRightPanel('gif');

        // 预加载GIF.js库
        this.loadLibrary('gif', true).catch(function (e) {
          console.warn('Library preload failed:', e);
          // 静默失败，将在需要时重新加载
        });
      },

      /**
       * 关闭GIF导出弹窗
       */
      closeGifPanel: function () {
        this.activeRightPanel = null;
      },

      /**
       * 处理GIF配置变化（从组件接收）
       */
      handleGifConfigChange: function (newConfig) {
        // 更新本地配置
        this.gifConfig = Object.assign({}, this.gifConfig, newConfig);
      },

      /**
       * 处理GIF导出请求（从组件接收）
       */
      handleGifExport: function (config) {
        // 更新配置
        this.gifConfig = Object.assign({}, this.gifConfig, config);
        // 开始导出
        this.startGifExport();
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
       * 统一的导出限制确认函数
       * @param {object} sourceInfo - 包含 duration 和 fileSizeBytes 的对象
       * @param {string} type - 导出类型描述 (例如 'GIF', 'MP4')
       * @returns {boolean} - 用户是否确认继续
       */
      confirmExportLimits: function (sourceInfo, type) {
        var warnings = [];
        var duration = sourceInfo.duration || 0;
        var fileSize = sourceInfo.fileSizeBytes || 0;

        if (fileSize > 10 * 1024 * 1024) {
          warnings.push('文件大小超过10MB (' + this.utils.formatBytes(fileSize) + ')，处理和导出可能需要较长时间');
        }
        if (duration > 60) {
          warnings.push('动画时长超过60秒 (' + duration.toFixed(1) + '秒)，处理和导出可能需要较长时间');
        }

        if (warnings.length > 0) {
          var confirmMsg = '注意 (导出' + type + ')：\n\n' + warnings.join('\n') + '\n\n确定要继续吗？';
          return confirm(confirmMsg);
        }

        return true; // 没有警告，直接继续
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

        // 使用新的统一确认函数
        var sourceInfo = this.getGifSourceInfo();
        if (!this.confirmExportLimits(sourceInfo, 'GIF')) {
          return;
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

        var taskId = null;
        if (this.taskManager) {
          taskId = this.taskManager.register('导出GIF', function () {
            _this.isExportingGIF = false;
            _this.gifExportProgress = 0;
            _this.gifExportCancelled = true;
          });
        }

        try {
          // 根据当前模式调用对应的导出函数
          await this.runGifExport();
        } catch (err) {
          if (err.message !== '用户取消') {
            alert('GIF导出失败: ' + err.message);
          }
        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
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
          frameMap = this.buildFrameMap(fps);
          if (frameMap && frameMap.length > 0) {
            totalFrames = frameMap.length;
          }
        }

        // 暂停播放
        var wasPlaying = this.isPlaying;
        await this.pauseForExport();

        try {
          // 使用GIFExporter模块导出
          var blob = await Exporters.GifExporter.export({
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
          Exporters.GifExporter.download(blob, fileName);

          alert('GIF 导出成功！大小: ' + Exporters.GifExporter.formatBytes(blob.size));

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

          // 优化：缓存canvas元素，避免频繁创建
          var width = this.mp4.originalWidth;
          var height = this.mp4.originalHeight;

          // 检查缓存是否存在且尺寸匹配
          if (!this._cachedMp4Canvas ||
            this._cachedMp4Canvas.width !== width ||
            this._cachedMp4Canvas.height !== height) {
            // 创建新canvas并缓存
            this._cachedMp4Canvas = document.createElement('canvas');
            this._cachedMp4Canvas.width = width;
            this._cachedMp4Canvas.height = height;
            // 添加willReadFrequently: true属性，提高getImageData操作性能
            this._cachedMp4Ctx = this._cachedMp4Canvas.getContext('2d', { willReadFrequently: true });
          }

          // 使用缓存的canvas和context
          this._cachedMp4Ctx.drawImage(this.mp4Video, 0, 0);
          return this._cachedMp4Canvas;
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
        // 使用PlayerController统一接口暂停播放
        if (this.playerController && this.isPlaying) {
          this.playerController.togglePlay();
        }
        this.isPlaying = false;
      },

      /**
       * 恢复播放（导出后）
       */
      resumeAfterExport: function () {
        // 使用PlayerController统一接口恢复播放
        if (this.playerController && !this.isPlaying) {
          this.playerController.togglePlay();
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

        var taskId = null;
        if (this.taskManager) {
          taskId = this.taskManager.register('导出Lottie', function () {
            _this.isExportingLottie = false;
            _this.lottieExportProgress = 0;
          });
        }

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
            // 检查取消
            if (!this.isExportingLottie) {
              throw new Error('User Cancelled');
            }

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

          this.utils.downloadFile(blob, (this.svga.fileInfo.name.replace(/\.svga$/i, '') || 'animation') + '.json');

          this.lottieExportProgress = 100;

          setTimeout(function () {
            _this.isExportingLottie = false;
            _this.lottieExportProgress = 0;
            alert('Lottie 导出成功！\n\n文件大小: ' + _this.utils.formatBytes(blob.size) + '\n\n请将JSON文件导入After Effects进行编辑。');
          }, 300);

          // 恢复播放状态
          if (wasPlaying && this.svgaPlayer && this.currentModule === 'svga') {
            this.svgaPlayer.startAnimation();
          }

        } catch (err) {
          if (err.message === 'User Cancelled') {
            // ignore
          } else {
            alert('Lottie导出失败: ' + err.message);
          }
        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
          this.isExportingLottie = false;
          this.lottieExportProgress = 0;
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

        // Sync current state to config
        this.chromaKeyConfig = {
          enabled: this.chromaKeyEnabled,
          similarity: this.chromaKeySimilarity,
          smoothness: this.chromaKeySmoothness,
          applied: this.chromaKeyApplied
        };

        // 切换弹窗显示状态
        this.showChromaKeyPanel = !this.showChromaKeyPanel;
      },

      applyChromaKey: function (config) {
        this.chromaKeyEnabled = config.enabled;
        this.chromaKeySimilarity = config.similarity;
        this.chromaKeySmoothness = config.smoothness;
        this.chromaKeyApplied = config.applied;

        if (this.chromaKeyEnabled) {
          this.updateChromaKeyEffect();
        } else {
          this.removeChromaKeyEffect();
        }

        this.showChromaKeyPanel = false;
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

        // 优化：缓存绿幕抠图canvas，避免频繁创建和销毁
        if (!this._chromaKeyCanvas) {
          this._chromaKeyCanvas = document.createElement('canvas');
          this._chromaKeyCanvas.className = 'chromakey-canvas';
          // 不设置 max-width/max-height，让容器的 transform scale 生效
          this._chromaKeyCanvas.style.cssText = 'display: block;';
        }

        // 更新canvas尺寸
        this._chromaKeyCanvas.width = video.videoWidth;
        this._chromaKeyCanvas.height = video.videoHeight;

        // 优化：缓存context，避免频繁获取
        if (!this._chromaKeyCtx) {
          this._chromaKeyCtx = this._chromaKeyCanvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true
          });
        }

        var canvas = this._chromaKeyCanvas;
        var ctx = this._chromaKeyCtx;

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
        // 使用检测到的FPS，如果不可用则回退到30
        var fps = this.mp4.detectedFps || 30;
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

        // 开头和结尾的K帧不允许编辑帧数
        if (kf.isEndpoint) return;

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
          this.utils.showToast('请输入有效的帧数');
          return;
        }
        if (frameNum < 0 || frameNum > totalFrames) {
          this.utils.showToast('帧数范围: 0-' + totalFrames);
          return;
        }

        var keyframes = this.speedRemapConfig.keyframes;
        var index = this.editingKeyframeIndex;

        // 检查是否与其他K帧重复
        for (var i = 0; i < keyframes.length; i++) {
          if (i !== index && keyframes[i].originalFrame === frameNum) {
            this.utils.showToast('该帧数已存在K帧');
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
          this.utils.showToast('超出变速范围' + MIN_SPEED + '-' + MAX_SPEED + '，已自动调整为范围内速度');
        } else if (hasSpeedChange) {
          this.utils.showToast('变速配置已应用');
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
          this.utils.showToast('最多支持10个关键帧');
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
      buildFrameMap: function (targetFps) {
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
        // 如果指定了 targetFps，则根据目标帧率和持续时间计算帧数
        var outputTotalFrames;

        // 确保 targetFps 是数字
        if (targetFps) targetFps = Number(targetFps);

        if (targetFps && targetFps > 0 && this.mp4Video && this.mp4Video.duration) {
          // 计算输出时长（秒）
          var outputDuration = outputRatio * this.mp4Video.duration;
          // 根据目标帧率计算总帧数
          outputTotalFrames = Math.ceil(outputDuration * targetFps);
        } else {
          // 回退到基于原始帧数的估算
          outputTotalFrames = Math.ceil(outputRatio * totalFrames);
        }

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
      openSvgaToDualChannelPanel: function () {
        if (!this.svgaPlayer || !this.svga.hasFile || !this.originalVideoItem) {
          alert('请先加载 SVGA 文件');
          return;
        }

        // 添加统一的导出限制确认
        var sourceInfo = this.getGifSourceInfo(); // 复用此函数获取信息
        if (!this.confirmExportLimits(sourceInfo, 'SVGA 转 MP4')) {
          return;
        }

        // 初始化配置
        var videoItem = this.originalVideoItem;
        this.dualChannelConfig.width = videoItem.videoSize.width;
        this.dualChannelConfig.height = videoItem.videoSize.height;
        this.dualChannelConfig.aspectRatio = videoItem.videoSize.width / videoItem.videoSize.height;

        // 默认使用SVGA原始帧率
        var originalFps = videoItem.FPS || videoItem.fps || 30;
        this.dualChannelConfig.fps = originalFps;

        // Source Info
        this.dualChannelSourceInfo = {
          name: this.svga.fileInfo.name,
          sizeWH: videoItem.videoSize.width + ' x ' + videoItem.videoSize.height,
          duration: sourceInfo.duration.toFixed(1) + 's',
          fileSize: this.svga.fileInfo.sizeText,
          fps: originalFps
        };

        // 读取配置管理器中保存的配置（包括帧率和压缩质量）
        if (this.configManager) {
          var savedFps = this.configManager.get('mp4_fps');
          if (savedFps !== undefined) {
            this.dualChannelConfig.fps = parseInt(savedFps);
          }

          var savedQuality = this.configManager.get('mp4_quality');
          if (savedQuality !== undefined) {
            this.dualChannelConfig.quality = parseInt(savedQuality);
          }
        }

        // 使用统一的右侧弹窗管理
        this.openRightPanel('showSvgaToDualChannelPanel');

        // 预加载FFmpeg库（高优先级插队）
        Services.FFmpegService.init({ highPriority: true }).catch(function (e) {
          console.warn('FFmpeg预加载失败:', e);
        });
      },

      /**
       * 关闭转MP4弹窗
       */
      closeSvgaToDualChannelPanel: function () {
        if (this.isConvertingToDualChannel) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingToDualChannel = false;
          this.dualChannelProgress = 0;
        }
        this.showSvgaToDualChannelPanel = false;
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

        // Source Info
        var fps = this.mp4.fileInfo.fps || 30;
        this.dualChannelSourceInfo = {
          name: this.mp4.fileInfo.name,
          sizeWH: this.mp4.originalWidth + ' x ' + this.mp4.originalHeight,
          duration: this.mp4Video.duration.toFixed(1) + 's',
          fileSize: this.mp4.fileInfo.sizeText,
          fps: fps
        };

        // 初始化配置
        this.dualChannelConfig.width = this.mp4.originalWidth;
        this.dualChannelConfig.height = this.mp4.originalHeight;
        this.dualChannelConfig.aspectRatio = this.mp4.originalWidth / this.mp4.originalHeight;

        // 使用视频帧率
        var videoFps = this.mp4.fileInfo.fps || 30;
        this.dualChannelConfig.fps = Math.min(120, Math.max(1, Math.round(parseFloat(videoFps))));

        // 读取保存的配置
        try {
          if (this.configManager) {
            var savedQuality = this.configManager.get('mp4_quality');
            if (savedQuality !== undefined) {
              this.dualChannelConfig.quality = parseInt(savedQuality);
            }
          }
        } catch (e) {
          // 静默失败，使用默认配置
        }

        this.openRightPanel('showMp4ToDualChannelPanel');

        // 预加载FFmpeg (高优先级插队)
        Services.FFmpegService.init({ highPriority: true }).catch(function (e) {
          console.warn('FFmpeg预加载失败:', e);
        });
      },

      closeMp4ToDualChannelPanel: function () {
        if (this.isConvertingToDualChannel) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingToDualChannel = false;
          this.dualChannelProgress = 0;
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
          this.dualChannelCancelled = true;
        }
      },

      /**
       * 开始普通MP4转双通道MP4
       */
      startMp4ToDualChannelConversion: async function (config) {
        var _this = this;

        // 如果传入了配置（来自组件），则更新本地配置
        if (config) {
          this.dualChannelConfig = Object.assign({}, this.dualChannelConfig, config);
        }

        // 严格检查：防止与 MP4转SVGA 任务冲突
        // if (this.isConvertingToSvga) {
        //   alert('无法同时进行多个转换任务：\n\n“MP4转SVGA”任务正在占用视频资源。\n请等待该任务完成后再试。');
        //   return;
        // }

        if (!this.mp4Video || !this.mp4.hasFile) {
          alert('请先加载 MP4 文件');
          return;
        }

        // if (!this.confirmIfHasOngoingTasks('MP4转双通道', 'task')) {
        //   return;
        // }

        // 添加统一的导出限制确认
        var sourceInfo = this.getGifSourceInfo(); // 复用此函数获取信息
        if (!this.confirmExportLimits(sourceInfo, 'MP4 转双通道')) {
          return;
        }

        // 参数验证
        var config = this.dualChannelConfig;
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
          if (this.configManager) {
            this.configManager.set('mp4_quality', config.quality);
          }
        } catch (e) { console.error('Config save failed:', e); }

        this.isConvertingToDualChannel = true;
        this.dualChannelProgress = 0;
        this.dualChannelCancelled = false;
        this.dualChannelStage = 'loading';
        this.dualChannelMessage = '正在加载转换器...';

        var taskId = null;
        if (this.taskManager) {
          taskId = this.taskManager.register('MP4转双通道', function () {
            _this.cancelMp4ToDualChannelConversion();
          });
        }

        try {
          // 1. 加载FFmpeg (使用统一服务)
          await Services.FFmpegService.init();
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 2. 提取序列帧
          this.dualChannelStage = 'extracting';
          this.dualChannelMessage = '正在提取序列帧...';
          var frames = await this.extractMp4FramesForDualChannel();
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 3. 合成双通道
          this.dualChannelStage = 'composing';
          this.dualChannelMessage = '正在合成双通道...';
          var dualFrames = await this.composeDualChannelFrames(frames);
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 4. 编码为MP4
          this.dualChannelStage = 'encoding';
          this.dualChannelMessage = '正在编码为MP4...';

          // 准备音频参数
          var audioData = null;
          var audioSpeedRatio = 1.0;

          if (this.mp4HasAudio && this.mp4.file) {
            var originalDuration = this.mp4Video.duration;

            // 变速支持：如果是复杂变速，先预处理音频
            if (this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
              try {
                this.dualChannelMessage = '正在处理音频...';

                // 使用 extractAudioFromMp4 处理复杂变速
                var originalTotalFrames = Math.ceil(originalDuration * (this.mp4.fileInfo.fps || 30));

                var audios = await this.extractAudioFromMp4(
                  this.mp4.file,
                  frames.length,
                  config.fps,
                  originalTotalFrames,
                  this.mp4.fileInfo.fps || 30
                );

                if (audios && audios.length > 0 && audios[0].audioData) {
                  audioData = audios[0].audioData;
                  // 音频已在 extractAudioFromMp4 中完成了变速处理
                  audioSpeedRatio = 1.0;
                }
              } catch (e) {
                console.error('音频变速处理失败，回退到平均变速模式', e);
                // 回退逻辑：读取原文件，使用平均变速
                audioData = new Uint8Array(await this.mp4.file.arrayBuffer());
                audioSpeedRatio = originalDuration / (frames.length / config.fps);
              }
            } else {
              // 简单模式：直接使用原文件 + 变速比例
              try {
                audioData = new Uint8Array(await this.mp4.file.arrayBuffer());
                var outputDuration = frames.length / config.fps;
                if (outputDuration > 0) {
                  audioSpeedRatio = originalDuration / outputDuration;
                }
              } catch (e) {
                console.error('读取音频失败', e);
              }
            }
          }

          var mp4Blob = await Services.FFmpegService.convertFramesToMp4({
            frames: dualFrames,
            fps: config.fps,
            quality: config.quality,
            audioData: audioData,
            audioSpeedRatio: audioSpeedRatio,
            onProgress: function (p) {
              _this.dualChannelProgress = Math.round(p * 100);
              if (p < 0.4) {
                _this.dualChannelMessage = '正在写入帧数据... ' + Math.round(p / 0.4 * 100) + '%';
              } else if (p < 0.45) {
                _this.dualChannelMessage = '正在处理音频...';
              } else if (p < 0.95) {
                _this.dualChannelMessage = '正在编码视频... ' + Math.round((p - 0.45) / 0.5 * 100) + '%';
              } else {
                _this.dualChannelMessage = '正在生成文件...';
              }
            },
            checkCancelled: function () {
              return _this.dualChannelCancelled;
            }
          });
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 5. 下载
          this.dualChannelStage = 'done';
          this.dualChannelMessage = '转换完成！';
          this.dualChannelProgress = 100;
          this.downloadDualChannelMP4(mp4Blob, 'mp4');

          setTimeout(function () {
            alert('✅ 转换完成！');
          }, 500);

          // 保存配置
          if (this.configManager) {
            this.configManager.set('mp4_quality', config.quality);
          }

        } catch (error) {
          if (error.message === '用户取消转换') {
            // ignore
          } else if (error.message === 'FFmpeg服务正忙，请稍后再试') {
            alert('FFmpeg服务正忙，请稍后再试');
          } else {
            console.error('MP4转双通道失败:', error);
            alert('转换失败：' + error.message);
          }
        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
          this.isConvertingToDualChannel = false;
          this.dualChannelProgress = 0;
          this.dualChannelStage = '';
          this.dualChannelMessage = '';
        }
      },

      /**
       * 提取普通MP4的序列帧（用于双通道转换）
       */
      extractMp4FramesForDualChannel: async function () {
        var _this = this;
        var video = this.mp4Video;
        var config = this.dualChannelConfig;
        var fps = config.fps;
        var duration = video.duration;
        var totalFrames = Math.ceil(duration * fps);
        var frames = [];

        // 变速支持：如果启用变速，使用帧映射表
        var frameMap = null;
        if (this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
          frameMap = this.buildFrameMap(fps);
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
          if (this.dualChannelCancelled) break;

          // 变速支持：使用帧映射表获取原始帧号
          var originalFrame = i;
          if (frameMap && frameMap[i] !== undefined) {
            originalFrame = frameMap[i];
          }

          var time;
          // 使用原始视频的总帧数来计算时间点，而不是目标FPS
          var sourceTotalFrames = this.speedRemapConfig.originalTotalFrames || (duration * 30);
          time = (originalFrame / sourceTotalFrames) * duration;

          video.currentTime = time;

          // 等待seek完成
          try {
            await new Promise(function (resolve, reject) {
              var onSeeked = function () {
                video.removeEventListener('seeked', onSeeked);
                resolve();
              };

              video.addEventListener('seeked', onSeeked);

              // 检查是否已经完成seek (防止事件已错过)
              if (!video.seeking && Math.abs(video.currentTime - time) < 0.1) {
                video.removeEventListener('seeked', onSeeked);
                resolve();
                return;
              }

              var timeout = setTimeout(function () {
                video.removeEventListener('seeked', onSeeked);
                reject(new Error('Seek timeout'));
              }, 2000);
            });
          } catch (e) {
            console.warn('Seek timeout or error, skipping frame ' + i);
            if (_this.dualChannelCancelled) break;
          }

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

          this.dualChannelProgress = Math.floor((i / totalFrames) * 30);
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
       * 构建音频变速滤镜（atempo）
       * atempo参数范围是0.5-2.0，如果超出需要链式处理
       */
      buildAudioTempoFilter: function (speedRatio) {
        // 直接调用FFmpegService的统一方法
        return Services.FFmpegService.buildAudioTempoFilter(speedRatio);
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

        this.utils.downloadFile(blob, baseName + '_dual.mp4');
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

        // Source Info
        var fr = this.lottie.frameRate || 30;
        var duration = 0;
        if (this.lottiePlayer && typeof this.lottiePlayer.getDuration === 'function') {
          duration = this.lottiePlayer.getDuration(false);
        }

        this.dualChannelSourceInfo = {
          name: this.lottie.fileInfo.name,
          sizeWH: (this.lottie.originalWidth || 0) + ' x ' + (this.lottie.originalHeight || 0),
          duration: duration.toFixed(1) + 's',
          fileSize: this.lottie.fileInfo.sizeText,
          fps: fr
        };

        // 初始化配置
        this.dualChannelConfig.width = this.lottie.originalWidth || 300;
        this.dualChannelConfig.height = this.lottie.originalHeight || 300;
        this.dualChannelConfig.aspectRatio = this.dualChannelConfig.width / this.dualChannelConfig.height;

        this.dualChannelConfig.fps = Math.min(120, Math.max(1, Math.round(fr)));

        try {
          if (this.configManager) {
            var savedQuality = this.configManager.get('mp4_quality');
            if (savedQuality !== undefined) {
              this.dualChannelConfig.quality = parseInt(savedQuality);
            }
          }
        } catch (e) { console.error('Config load failed:', e); }

        this.openRightPanel('showLottieToDualChannelPanel');

        Services.FFmpegService.init({ highPriority: true }).catch(function (e) {
          console.warn('FFmpeg预加载失败:', e);
        });
      },

      closeLottieToDualChannelPanel: function () {
        if (this.isConvertingToDualChannel) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingToDualChannel = false;
          this.dualChannelProgress = 0;
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
          this.dualChannelCancelled = true;
        }
      },

      /**
       * 开始Lottie转双通道MP4
       */
      startLottieToDualChannelConversion: async function (config) {
        var _this = this;

        // 如果传入了配置（来自组件），则更新本地配置
        if (config) {
          this.dualChannelConfig = Object.assign({}, this.dualChannelConfig, config);
        }

        if (!this.lottiePlayer || !this.lottie.hasFile) {
          alert('请先加载 Lottie 文件');
          return;
        }

        // if (!this.confirmIfHasOngoingTasks('Lottie转双通道', 'task')) {
        //   return;
        // }

        var config = this.dualChannelConfig;
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
          if (this.configManager) {
            this.configManager.set('mp4_quality', config.quality);
          }
        } catch (e) { console.error('Config save failed:', e); }

        this.isConvertingToDualChannel = true;
        this.dualChannelProgress = 0;
        this.dualChannelCancelled = false;
        this.dualChannelStage = 'loading';
        this.dualChannelMessage = '正在加载转换器...';

        var taskId = null;
        if (this.taskManager) {
          taskId = this.taskManager.register('Lottie转双通道', function () {
            _this.cancelLottieToDualChannelConversion();
          });
        }

        try {
          await Services.FFmpegService.init();
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          this.dualChannelStage = 'extracting';
          this.dualChannelMessage = '正在提取序列帧...';
          var frames = await this.extractLottieFrames();
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          this.dualChannelStage = 'composing';
          this.dualChannelMessage = '正在合成双通道...';
          var dualFrames = await this.composeDualChannelFrames(frames);
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          this.dualChannelStage = 'encoding';
          this.dualChannelMessage = '正在编码为MP4...';
          // Lottie没有音频，传null
          var mp4Blob = await Services.FFmpegService.convertFramesToMp4({
            frames: dualFrames,
            fps: config.fps,
            quality: config.quality,
            audioData: null,
            onProgress: function (p) {
              _this.dualChannelProgress = Math.round(p * 100);
              if (p < 0.4) {
                _this.dualChannelMessage = '正在写入帧数据... ' + Math.round(p / 0.4 * 100) + '%';
              } else if (p < 0.45) {
                _this.dualChannelMessage = '正在处理音频...';
              } else if (p < 0.95) {
                _this.dualChannelMessage = '正在编码视频... ' + Math.round((p - 0.45) / 0.5 * 100) + '%';
              } else {
                _this.dualChannelMessage = '正在生成文件...';
              }
            },
            checkCancelled: function () {
              return _this.dualChannelCancelled;
            }
          });
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          this.dualChannelStage = 'done';
          this.dualChannelMessage = '转换完成！';
          this.dualChannelProgress = 100;
          this.downloadDualChannelMP4(mp4Blob, 'lottie');

          setTimeout(function () {
            alert('✅ 转换完成！');
          }, 500);

          // 保存配置
          if (this.configManager) {
            this.configManager.set('mp4_quality', config.quality);
          }

        } catch (error) {
          if (error.message === '用户取消转换') {
            // ignore
          } else if (error.message === 'FFmpeg服务正忙，请稍后再试') {
            alert('FFmpeg服务正忙，请稍后再试');
          } else {
            console.error('Lottie转双通道失败:', error);
            alert('转换失败：' + error.message);
          }
        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
          this.isConvertingToDualChannel = false;
          this.dualChannelProgress = 0;
          this.dualChannelStage = '';
          this.dualChannelMessage = '';
        }
      },

      /**
       * 提取Lottie序列帧
       */
      extractLottieFrames: async function () {
        var _this = this;
        var player = this.lottiePlayer;
        var config = this.dualChannelConfig;
        var animData = this._lottieAnimationData;

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
          if (this.dualChannelCancelled) break;

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

          this.dualChannelProgress = Math.floor((i / totalFrames) * 30);
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
      openYyevaToSvgaPanel: function () {
        if (!this.yyevaVideo || !this.yyeva.hasFile) {
          alert('请先加载双通道 MP4 文件');
          return;
        }

        // Source Info
        var videoFps = this.yyeva.fileInfo.fps || 30;
        var width = this.yyeva.displayWidth || Math.floor(this.yyeva.originalWidth / 2);
        var height = this.yyeva.displayHeight || this.yyeva.originalHeight;

        this.toSvgaSourceInfo = {
          name: this.yyeva.fileInfo.name,
          sizeWH: width + ' x ' + height,
          duration: this.yyevaVideo.duration.toFixed(1) + 's',
          fileSize: this.yyeva.fileInfo.sizeText,
          fps: videoFps
        };

        // 初始化配置：使用双通道MP4视频的原始尺寸（显示尺寸，即宽度/2）
        this.toSvgaConfig.width = width;
        this.toSvgaConfig.height = height;

        // 使用视频帧率，限制在1-60范围
        this.toSvgaConfig.fps = Math.min(60, Math.max(1, Math.round(parseFloat(videoFps))));

        // 读取配置管理器中保存的配置
        if (this.configManager) {
          var savedQuality = this.configManager.get('svga_quality');
          if (savedQuality !== undefined) {
            this.toSvgaConfig.quality = parseInt(savedQuality);
          }
        }

        // 使用统一的右侧弹窗管理
        this.openRightPanel('showYyevaToSvgaPanel');

        // 预加载protobuf和pako库
        this.loadLibrary(['protobuf', 'pako'], true).catch(function (e) {
          console.warn('Library preload failed:', e);
          // 静默失败，将在需要时重新加载
        });

        // 预加载FFmpeg (高优先级插队)
        Services.FFmpegService.init({ highPriority: true }).catch(function (e) {
          console.warn('FFmpeg预加载失败:', e);
        });
      },

      /**
       * 关闭转SVGA弹窗
       */
      closeYyevaToSvgaPanel: function () {
        if (this.isConvertingToSvga) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingToSvga = false;
          this.toSvgaProgress = 0;
          this.toSvgaCancelled = true;
        }
        this.showYyevaToSvgaPanel = false;
      },

      cancelYyevaToSvgaConversion: function () {
        this.toSvgaCancelled = true;
        this.isConvertingToSvga = false;
        this.toSvgaProgress = 0;
        this.toSvgaStage = '';
        this.toSvgaMessage = '';
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

        // Source Info
        var videoFps = this.mp4.fileInfo.fps || 30;
        this.toSvgaSourceInfo = {
          name: this.mp4.fileInfo.name,
          sizeWH: this.mp4.originalWidth + ' x ' + this.mp4.originalHeight,
          duration: this.mp4Video.duration.toFixed(1) + 's',
          fileSize: this.mp4.fileInfo.sizeText,
          fps: videoFps
        };

        // 初始化配置
        this.toSvgaConfig.width = this.mp4.originalWidth || 0;
        this.toSvgaConfig.height = this.mp4.originalHeight || 0;

        // 使用视频帧率，限制在1-60范围
        this.toSvgaConfig.fps = Math.min(60, Math.max(1, Math.round(parseFloat(videoFps))));

        // 读取配置管理器中保存的配置
        if (this.configManager) {
          var savedConfig = this.configManager.get('toSvgaConfig');
          if (savedConfig) {
            if (savedConfig.quality) this.toSvgaConfig.quality = savedConfig.quality;
          }
        }

        // 使用统一的弹窗管理
        this.openRightPanel('showMp4ToSvgaPanel');

        // 预加载protobuf和pako库
        this.loadLibrary(['protobuf', 'pako'], true).catch(function (e) {
          console.warn('Library preload failed:', e);
          // 静默失败，将在需要时重新加载
        });
      },

      /**
       * 关闭普通MP4转SVGA弹窗
       */
      closeMp4ToSvgaPanel: function () {
        if (this.isConvertingToSvga) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingToSvga = false;
          this.toSvgaProgress = 0;
          this.toSvgaCancelled = true;
        }
        this.showMp4ToSvgaPanel = false;
      },

      /**
       * 取消普通MP4转SVGA转换
       */
      cancelMp4ToSvgaConversion: function () {
        this.toSvgaCancelled = true;
        this.isConvertingToSvga = false;
        this.toSvgaProgress = 0;
        this.toSvgaStage = '';
        this.toSvgaMessage = '';
      },

      /**
       * 普通MP4转SVGA宽度变化（保持比例）
       */
      onMp4ToSvgaWidthChange: function () {
        var originalWidth = this.mp4.originalWidth || 0;
        var originalHeight = this.mp4.originalHeight || 0;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalHeight / originalWidth;
        var newWidth = Math.max(1, Math.min(3000, parseInt(this.toSvgaConfig.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.toSvgaConfig.width = newWidth;
        this.toSvgaConfig.height = newHeight;
      },

      /**
       * 普通MP4转SVGA高度变化（保持比例）
       */
      onMp4ToSvgaHeightChange: function () {
        var originalWidth = this.mp4.originalWidth || 0;
        var originalHeight = this.mp4.originalHeight || 0;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalWidth / originalHeight;
        var newHeight = Math.max(1, Math.min(3000, parseInt(this.toSvgaConfig.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.toSvgaConfig.width = newWidth;
        this.toSvgaConfig.height = newHeight;
      },

      /**
       * 开始普通MP4转SVGA转换
       * 流程：MP4提取序列帧 -> 生成SVGA
       * 如果开启了绿幕抠图，则提取抠图后的半透明序列帧
       */
      startMp4ToSvgaConversion: async function (config) {
        var _this = this;

        // 如果传入了配置（来自组件），则更新本地配置
        if (config) {
          this.toSvgaConfig = Object.assign({}, this.toSvgaConfig, config);
        }

        // 防止重复点击
        if (this.isConvertingToSvga) {
          return;
        }

        // 防止资源冲突
        // if (this.isConvertingToDualChannel && this.currentModule === 'mp4') {
        //   alert('无法同时进行多个转换任务：\n\n“MP4转双通道”任务正在占用视频资源。\n请等待该任务完成后再试。');
        //   return;
        // }

        // 前置检查
        if (!this.mp4Video || !this.mp4.hasFile) {
          alert('请先加载 MP4 文件');
          return;
        }

        // 检查是否有其他正在进行的任务
        if (!this.confirmIfHasOngoingTasks('转SVGA', 'task')) {
          return;
        }

        // 添加统一的导出限制确认
        var sourceInfo = this.getGifSourceInfo(); // 复用此函数获取信息
        if (!this.confirmExportLimits(sourceInfo, 'MP4 转 SVGA')) {
          return;
        }

        try {
          var taskId = this.taskManager.register('MP4转SVGA', function () {
            _this.isConvertingToSvga = false;
            // _this.toSvgaProgress = 0; // 取消时不清空进度，让用户看到最后状态
            _this.toSvgaCancelled = true;
          });
          this.isConvertingToSvga = true;
          this.toSvgaProgress = 0;
          this.toSvgaCancelled = false;
          this.toSvgaStage = 'loading';
          this.toSvgaMessage = '加载库...';

          // 加载必要的库
          await this.loadLibrary(['protobuf', 'pako'], false);

          if (this.toSvgaCancelled) {
            this.taskManager.finish(taskId);
            return;
          }

          this.toSvgaStage = 'extracting';
          this.toSvgaMessage = '提取帧...';

          // 提取帧 - 如果开启了绿幕抠图，则提取抠图后的帧
          var frames = await this.extractMp4Frames();

          if (this.toSvgaCancelled) {
            frames = null;
            this.taskManager.finish(taskId);
            return;
          }

          // 提取音频（如果未静音）
          var audios = null;
          if (!this.toSvgaConfig.muted && this.mp4.file) {
            this.toSvgaMessage = '提取音频...';
            try {
              await Services.FFmpegService.init();

              // 音频处理需要使用原始视频的帧率和时长
              var originalFps = parseFloat(this.mp4.fileInfo.fps) || 30;
              var originalDuration = this.mp4Video ? this.mp4Video.duration : 0;
              var originalTotalFrames = Math.ceil(originalDuration * originalFps);
              var targetFps = parseFloat(this.toSvgaConfig.fps) || 30;

              // 使用统一的FFmpegService提取音频
              // 如果启用了多段变速，需要构建关键帧数据
              if (this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
                // 归一化关键帧逻辑已封装在 extractAudioFromMp4 (旧方法) 或 Services.FFmpegService.extractAudioWithSpeedRemap
                // 这里我们直接复用 extractAudioFromMp4，但需要修改它内部不调用 loadFFmpeg
                audios = await this.extractAudioFromMp4(
                  this.mp4.file,
                  frames.length,
                  targetFps,
                  originalTotalFrames,
                  originalFps
                );
              } else {
                // 简单变速或无变速
                var audioSpeedRatio = 1.0;
                if (originalDuration > 0 && frames.length > 0) {
                  var outputDuration = frames.length / targetFps;
                  audioSpeedRatio = originalDuration / outputDuration;
                }

                audios = await Services.FFmpegService.extractAudio({
                  videoFile: this.mp4.file,
                  totalFrames: frames.length,
                  fps: targetFps,
                  speedRatio: audioSpeedRatio
                });
              }
            } catch (e) {
              console.warn('音频提取失败:', e);
              if (e.message === 'FFmpeg服务正忙，请稍后再试') {
                alert('FFmpeg服务正忙，音频提取跳过');
              }
              // 静默失败，将导出无音频的SVGA
            }
            if (this.toSvgaCancelled) return;
          }

          this.toSvgaStage = 'building';

          // 使用通用SVGA构建方法
          var svgaBlob = await this.buildSVGAFromConfig('mp4', {
            frames: frames,
            width: this.toSvgaConfig.width,
            height: this.toSvgaConfig.height,
            fps: this.toSvgaConfig.fps,
            quality: this.toSvgaConfig.quality,
            audios: audios,
            muted: this.toSvgaConfig.muted,
            dependencies: {
              protobuf: protobuf,
              pako: pako
            }
          }, {
            progressField: 'toSvgaProgress',
            messageField: 'toSvgaMessage',
            cancelledField: 'toSvgaCancelled'
          });

          if (this.toSvgaCancelled) {
            this.taskManager.finish(taskId);
            return;
          }

          // 下载文件
          var originalName = (this.mp4.fileInfo.name || 'video').replace(/\.[^.]+$/, '');
          this.downloadSVGA(svgaBlob, originalName + '.svga');

          alert('✅ 转换完成！\n\n已成功生成SVGA文件。');

          // 保存配置到 configManager
          if (this.configManager) {
            this.configManager.set('toSvgaConfig', {
              quality: this.toSvgaConfig.quality
            });
          }

          // 转换成功，设置isConvertingToSvga为false
          this.isConvertingToSvga = false;

          // 重置状态
          setTimeout(function () {
            // 只有在没有新任务开始的情况下才重置状态
            // 避免用户开始新任务后，被这里的延迟逻辑重置
            if (!_this.isConvertingToSvga) {
              _this.toSvgaProgress = 0;
              _this.toSvgaStage = '';
              _this.toSvgaMessage = '';
            }
          }, 1000);

        } catch (error) {
          if (error.message === 'FFmpeg服务正忙，请稍后再试') {
            alert('FFmpeg服务正忙，请稍后再试');
          } else {
            console.error('MP4转SVGA失败:', error);
            alert('转换失败: ' + error.message);
          }
          this.isConvertingToSvga = false;
          this.toSvgaProgress = 0;
          this.toSvgaStage = '';
          this.toSvgaMessage = '';
        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
        }
      },

      /**
       * 从MP4提取序列帧
       * 如果开启了绿幕抠图，则提取抠图后的半透明帧
       */
      extractMp4Frames: async function () {
        var _this = this;
        var video = this.mp4Video;
        var fps = this.toSvgaConfig.fps;
        var duration = video.duration;
        var totalFrames = Math.ceil(duration * fps);
        var frames = [];

        // 变速支持：如果启用变速，使用帧映射表
        var frameMap = null;
        if (this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
          frameMap = this.buildFrameMap(fps);
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
          if (this.toSvgaCancelled) break;

          // 变速支持：使用帧映射表获取原始帧号
          var time;
          if (frameMap && frameMap[i] !== undefined) {
            var sourceFrameIndex = frameMap[i];
            // 使用原始视频的总帧数来计算时间点
            var sourceTotalFrames = this.speedRemapConfig.originalTotalFrames || (duration * 30);
            time = (sourceFrameIndex / sourceTotalFrames) * duration;
          } else {
            time = i / fps;
          }
          if (time > duration) time = duration;

          // seek到指定时间
          video.currentTime = time;
          try {
            await new Promise(function (resolve, reject) {
              var onSeeked = function () {
                video.removeEventListener('seeked', onSeeked);
                resolve();
              };

              video.addEventListener('seeked', onSeeked);

              // 检查是否已经完成seek (防止事件已错过)
              if (!video.seeking && Math.abs(video.currentTime - time) < 0.1) {
                video.removeEventListener('seeked', onSeeked);
                resolve();
                return;
              }

              var timeout = setTimeout(function () {
                video.removeEventListener('seeked', onSeeked);
                reject(new Error('Seek timeout'));
              }, 2000);
            });
          } catch (e) {
            console.warn('Seek timeout or error, skipping frame ' + i);
            // 即使seek超时，也继续尝试，或根据需要中断
            if (_this.toSvgaCancelled) break;
          }

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
          _this.toSvgaProgress = Math.round((i / totalFrames) * 50);
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

        // Source Info
        var fps = this.lottie.frameRate || 30;
        var duration = 0;
        if (this.lottiePlayer && typeof this.lottiePlayer.getDuration === 'function') {
          duration = this.lottiePlayer.getDuration(false);
        }

        this.toSvgaSourceInfo = {
          name: this.lottie.fileInfo.name,
          sizeWH: (this.lottie.originalWidth || 0) + ' x ' + (this.lottie.originalHeight || 0),
          duration: duration.toFixed(1) + 's',
          fileSize: this.lottie.fileInfo.sizeText,
          fps: fps
        };

        // 初始化配置
        this.toSvgaConfig.width = this.lottie.originalWidth || 0;
        this.toSvgaConfig.height = this.lottie.originalHeight || 0;

        this.toSvgaConfig.fps = Math.min(60, Math.max(1, Math.round(fps)));

        // 读取配置管理器中保存的配置
        if (this.configManager) {
          var savedConfig = this.configManager.get('toSvgaConfig');
          if (savedConfig) {
            if (savedConfig.quality) this.toSvgaConfig.quality = savedConfig.quality;
          }
        }

        this.openRightPanel('showLottieToSvgaPanel');

        // 预加载protobuf和pako库
        this.loadLibrary(['protobuf', 'pako'], true).catch(function (e) {
          console.warn('Library preload failed:', e);
          // 静默失败，将在需要时重新加载
        });
      },

      closeLottieToSvgaPanel: function () {
        if (this.isConvertingToSvga) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingToSvga = false;
          this.toSvgaProgress = 0;
          this.toSvgaCancelled = true;
        }
        this.showLottieToSvgaPanel = false;
      },

      onLottieToSvgaWidthChange: function () {
        var originalWidth = this.lottie.originalWidth;
        var originalHeight = this.lottie.originalHeight;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalHeight / originalWidth;
        var newWidth = Math.max(1, Math.min(3000, parseInt(this.toSvgaConfig.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.toSvgaConfig.width = newWidth;
        this.toSvgaConfig.height = newHeight;
      },

      onLottieToSvgaHeightChange: function () {
        var originalWidth = this.lottie.originalWidth;
        var originalHeight = this.lottie.originalHeight;
        if (!originalWidth || !originalHeight) return;

        var ratio = originalWidth / originalHeight;
        var newHeight = Math.max(1, Math.min(3000, parseInt(this.toSvgaConfig.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.toSvgaConfig.width = newWidth;
        this.toSvgaConfig.height = newHeight;
      },

      /**
       * Lottie转SVGA - 提取帧并构建SVGA
       */
      startLottieToSvgaConversion: async function (config) {
        var _this = this;

        // 如果传入了配置（来自组件），则更新本地配置
        if (config) {
          this.toSvgaConfig = Object.assign({}, this.toSvgaConfig, config);
        }

        if (!this.lottiePlayer || !this.lottie.hasFile) {
          alert('请先加载 Lottie 文件');
          return;
        }

        if (!this.confirmIfHasOngoingTasks('Lottie转SVGA', 'task')) {
          return;
        }

        // 参数验证
        var width = this.toSvgaConfig.width;
        var height = this.toSvgaConfig.height;
        var quality = this.toSvgaConfig.quality;
        var fps = this.toSvgaConfig.fps;

        if (width < 1 || width > 3000 || height < 1 || height > 3000) {
          alert('尺寸超出范围！合法范围：1-3000 像素');
          return;
        }

        this.isConvertingToSvga = true;
        this.toSvgaProgress = 0;
        this.toSvgaCancelled = false;
        this.toSvgaStage = 'loading';
        this.toSvgaMessage = '加载库...';

        var taskId = this.taskManager.register('Lottie转SVGA', function () {
          _this.isConvertingToSvga = false;
          _this.toSvgaProgress = 0;
          _this.toSvgaCancelled = true;
        });

        try {
          await this.loadLibrary(['protobuf', 'pako'], false);
          if (this.toSvgaCancelled) {
            this.taskManager.finish(taskId);
            return;
          }

          this.toSvgaStage = 'extracting';
          this.toSvgaMessage = '提取帧...';

          // 提取帧
          var frames = await this.extractLottieFramesForSvga();
          if (this.toSvgaCancelled) {
            this.taskManager.finish(taskId);
            return;
          }

          this.toSvgaStage = 'building';
          this.toSvgaMessage = '生成SVGA...';

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
            progressField: 'toSvgaProgress',
            messageField: 'toSvgaMessage',
            cancelledField: 'toSvgaCancelled'
          });

          if (this.toSvgaCancelled) {
            this.taskManager.finish(taskId);
            return;
          }

          // 下载文件
          var originalName = (this.lottie.file.name || 'animation').replace(/\.[^.]+$/, '');
          this.downloadSVGA(svgaBlob, originalName + '.svga');

          alert('✅ 转换完成！\n\n已成功生成SVGA文件。');

          if (this.configManager) {
            this.configManager.set('toSvgaConfig', { quality: quality });
          }

          setTimeout(function () {
            if (!_this.isConvertingToSvga) {
              _this.toSvgaProgress = 0;
              _this.toSvgaStage = '';
              _this.toSvgaMessage = '';
            }
          }, 1000);

        } catch (error) {
          if (error.message === 'FFmpeg服务正忙，请稍后再试') {
            alert('FFmpeg服务正忙，请稍后再试');
          } else {
            console.error('Lottie转SVGA失败:', error);
            alert('转换失败: ' + error.message);
          }
          this.isConvertingToSvga = false;
          this.toSvgaProgress = 0;
          this.toSvgaStage = '';
          this.toSvgaMessage = '';
        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
        }
      },

      /**
       * 从Lottie提取序列帧
       */
      extractLottieFramesForSvga: async function () {
        var _this = this;
        var player = this.lottiePlayer;
        var fps = this.toSvgaConfig.fps;
        var width = this.toSvgaConfig.width;
        var height = this.toSvgaConfig.height;
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
          if (this.toSvgaCancelled) break;

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
          _this.toSvgaProgress = Math.round((i / totalFrames) * 50);
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

        // Source Info
        var fps = this.frames.fileInfo.fps || 25;
        this.toSvgaSourceInfo = {
          name: this.frames.fileInfo.name,
          sizeWH: (this.frames.originalWidth || 0) + ' x ' + (this.frames.originalHeight || 0),
          duration: this.frames.fileInfo.duration,
          fileSize: this.frames.fileInfo.sizeText,
          fps: fps
        };

        // 初始化配置
        this.toSvgaConfig.width = this.frames.originalWidth || 0;
        this.toSvgaConfig.height = this.frames.originalHeight || 0;
        this.toSvgaConfig.fps = fps;

        // 读取配置管理器中保存的配置
        if (this.configManager) {
          var savedConfig = this.configManager.get('framesToSvgaConfig');
          if (savedConfig) {
            if (savedConfig.quality) this.toSvgaConfig.quality = savedConfig.quality;
          }
        }

        this.openRightPanel('showImagesToSvgaPanel');

        // 预加载protobuf和pako库
        this.loadLibrary(['protobuf', 'pako'], true).catch(function (e) {
          console.warn('Library preload failed:', e);
          // 静默失败，将在需要时重新加载
        });
      },

      closeImagesToSvgaPanel: function () {
        if (this.isConvertingToSvga) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingToSvga = false;
          this.toSvgaProgress = 0;
          this.toSvgaCancelled = true;
        }
        this.showImagesToSvgaPanel = false;
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
      startFramesToSvgaConversion: async function (config) {
        var _this = this;

        // 如果传入了配置（来自组件），则更新本地配置
        if (config) {
          this.toSvgaConfig = Object.assign({}, this.toSvgaConfig, config);
        }

        if (!this.frames.hasFile || !this.frames.files.length) {
          alert('请先加载序列帧文件');
          return;
        }

        if (!this.confirmIfHasOngoingTasks('序列帧转SVGA', 'task')) {
          return;
        }

        var width = this.toSvgaConfig.width;
        var height = this.toSvgaConfig.height;
        var quality = this.toSvgaConfig.quality;
        var fps = this.toSvgaConfig.fps;

        if (width < 1 || width > 3000 || height < 1 || height > 3000) {
          alert('尺寸超出范围！合法范围：1-3000 像素');
          return;
        }

        this.isConvertingToSvga = true;
        this.toSvgaProgress = 0;
        this.toSvgaCancelled = false;
        this.toSvgaStage = 'loading';
        this.toSvgaMessage = '加载库...';

        var taskId = this.taskManager.register('序列帧转SVGA', function () {
          _this.isConvertingToSvga = false;
          _this.toSvgaProgress = 0;
          _this.toSvgaCancelled = true;
        });

        try {
          await this.loadLibrary(['protobuf', 'pako'], false);
          if (this.toSvgaCancelled) {
            this.taskManager.finish(taskId);
            return;
          }

          this.toSvgaStage = 'extracting';
          this.toSvgaMessage = '处理帧...';

          // 将File对象转为SVGABuilder需要的格式
          var frames = [];
          var files = this.frames.files;
          for (var i = 0; i < files.length; i++) {
            if (this.toSvgaCancelled) {
              this.taskManager.finish(taskId);
              break;
            }
            frames.push({ index: i, blob: files[i] });
            _this.toSvgaProgress = Math.round((i / files.length) * 50);
          }

          if (this.toSvgaCancelled) {
            this.taskManager.finish(taskId);
            return;
          }

          this.toSvgaStage = 'building';

          // 使用通用SVGA构建方法
          var svgaBlob = await this.buildSVGAFromConfig('frames', {
            frames: frames,
            width: width,
            height: height,
            fps: fps,
            quality: quality,
            // 传入原始尺寸，用于优化判断
            originalSize: {
              width: this.frames.originalWidth,
              height: this.frames.originalHeight
            },
            dependencies: {
              protobuf: protobuf,
              pako: pako
            }
          }, {
            progressField: 'toSvgaProgress',
            messageField: 'toSvgaMessage',
            cancelledField: 'toSvgaCancelled'
          });

          if (this.toSvgaCancelled) {
            this.taskManager.finish(taskId);
            return;
          }

          // 下载文件
          this.downloadSVGA(svgaBlob, 'sequence.svga');

          alert('✅ 转换完成！\n\n已成功生成SVGA文件。');

          if (this.configManager) {
            this.configManager.set('framesToSvgaConfig', { quality: quality });
          }

          setTimeout(function () {
            _this.isConvertingToSvga = false;
            _this.toSvgaProgress = 0;
            _this.toSvgaStage = '';
            _this.toSvgaMessage = '';
          }, 1000);

          this.taskManager.finish(taskId);

        } catch (error) {
          this.taskManager.finish(taskId);
          if (error.message === 'FFmpeg服务正忙，请稍后再试') {
            alert('FFmpeg服务正忙，请稍后再试');
          } else {
            console.error('序列帧转SVGA失败:', error);
            alert('转换失败: ' + error.message);
          }
          this.isConvertingToSvga = false;
          this.toSvgaProgress = 0;
          this.toSvgaStage = '';
          this.toSvgaMessage = '';
        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
        }
      },

      // 取消序列帧转SVGA
      cancelFramesToSvgaConversion: function () {
        this.toSvgaCancelled = true;
        this.toSvgaMessage = '正在取消...';
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

        // Source Info
        var fps = this.frames.fileInfo.fps || 25;
        this.dualChannelSourceInfo = {
          name: this.frames.fileInfo.name,
          sizeWH: (this.frames.originalWidth || 0) + ' x ' + (this.frames.originalHeight || 0),
          duration: this.frames.fileInfo.duration,
          fileSize: this.frames.fileInfo.sizeText,
          fps: fps
        };

        // 初始化配置
        this.dualChannelConfig.width = this.frames.originalWidth;
        this.dualChannelConfig.height = this.frames.originalHeight;
        this.dualChannelConfig.fps = fps;
        if (this.dualChannelConfig.height > 0) {
          this.dualChannelConfig.aspectRatio = this.dualChannelConfig.width / this.dualChannelConfig.height;
        } else {
          this.dualChannelConfig.aspectRatio = 1;
        }

        // 读取保存的配置
        try {
          if (this.configManager) {
            var savedQuality = this.configManager.get('mp4_quality');
            if (savedQuality !== undefined) {
              this.dualChannelConfig.quality = parseInt(savedQuality);
            }
          }
        } catch (e) { console.error('Config load failed:', e); }

        this.openRightPanel('showImagesToDualChannelPanel');

        // 预加载FFmpeg
        Services.FFmpegService.init({ highPriority: true }).catch(function (e) {
          console.warn('FFmpeg预加载失败:', e);
        });
      },

      closeImagesToDualChannelPanel: function () {
        if (this.isConvertingToDualChannel) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.isConvertingToDualChannel = false;
          this.dualChannelProgress = 0;
          this.dualChannelCancelled = true;
        }
        this.showImagesToDualChannelPanel = false;
      },

      // 取消序列帧转双通道MP4
      cancelFramesToDualChannelConversion: function () {
        this.dualChannelCancelled = true;
        this.dualChannelMessage = '正在取消...';
      },

      /**
       * 开始序列帧转双通道MP4
       */
      startFramesToDualChannelConversion: async function (config) {
        var _this = this;

        // 如果传入了配置（来自组件），则更新本地配置
        if (config) {
          this.dualChannelConfig = Object.assign({}, this.dualChannelConfig, config);
        }

        if (!this.frames.hasFile || !this.frames.files.length) {
          alert('请先加载序列帧文件');
          return;
        }

        if (!this.confirmIfHasOngoingTasks('序列帧转MP4', 'task')) {
          return;
        }

        var config = this.dualChannelConfig;

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
          if (this.configManager) {
            this.configManager.set('mp4_quality', config.quality);
          }
        } catch (e) { console.error('Config save failed:', e); }

        this.isConvertingToDualChannel = true;
        this.dualChannelProgress = 0;
        this.dualChannelCancelled = false;
        this.dualChannelStage = 'loading';
        this.dualChannelMessage = '正在加载转换器...';

        var taskId = null;
        if (this.taskManager) {
          taskId = this.taskManager.register('序列帧转双通道', function () {
            _this.cancelFramesToDualChannelConversion();
          });
        }

        try {
          // 1. 加载FFmpeg (使用统一服务)
          await Services.FFmpegService.init();
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 2. 提取序列帧
          this.dualChannelStage = 'extracting';
          this.dualChannelMessage = '正在提取序列帧...';
          var frames = await this.extractFramesForDualChannel();
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 3. 合成双通道
          this.dualChannelStage = 'composing';
          this.dualChannelMessage = '正在合成双通道...';
          var dualFrames = await this.composeFramesDualChannel(frames);
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 4. 编码为MP4
          this.dualChannelStage = 'encoding';
          this.dualChannelMessage = '正在编码为MP4...';
          // 序列帧没有音频，传null
          var mp4Blob = await Services.FFmpegService.convertFramesToMp4({
            frames: dualFrames,
            fps: config.fps,
            quality: config.quality,
            audioData: null,
            onProgress: function (p) {
              _this.dualChannelProgress = Math.round(p * 100);
              if (p < 0.4) {
                _this.dualChannelMessage = '正在写入帧数据... ' + Math.round(p / 0.4 * 100) + '%';
              } else if (p < 0.45) {
                _this.dualChannelMessage = '正在处理音频...';
              } else if (p < 0.95) {
                _this.dualChannelMessage = '正在编码视频... ' + Math.round((p - 0.45) / 0.5 * 100) + '%';
              } else {
                _this.dualChannelMessage = '正在生成文件...';
              }
            },
            checkCancelled: function () {
              return _this.dualChannelCancelled;
            }
          });

          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 5. 下载
          this.dualChannelStage = 'done';
          this.dualChannelMessage = '转换完成！';
          this.dualChannelProgress = 100;
          this.downloadDualChannelMP4(mp4Blob, 'frames');

          setTimeout(function () {
            alert('✅ 转换完成！');
          }, 500);

          // 保存配置
          if (this.configManager) {
            this.configManager.set('mp4_quality', config.quality);
          }

        } catch (error) {
          if (error.message === '用户取消转换') {
            // ignore
          } else if (error.message === 'FFmpeg服务正忙，请稍后再试') {
            alert('FFmpeg服务正忙，请稍后再试');
          } else {
            console.error('序列帧转双通道MP4失败:', error);
            alert('转换失败：' + error.message);
          }
        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
          this.isConvertingToDualChannel = false;
          // 不要立即清空，给用户看一眼完成状态
          // this.dualChannelProgress = 0;
          // this.dualChannelStage = '';
          // this.dualChannelMessage = '';
        }
      },

      /**
       * 提取序列帧为ImageData数组（用于双通道转换）
       */
      extractFramesForDualChannel: async function () {
        var _this = this;
        var config = this.dualChannelConfig;
        var images = this.framesImages;
        var totalFrames = images.length;
        var frames = [];

        // 创建canvas
        var canvas = document.createElement('canvas');
        canvas.width = config.width;
        canvas.height = config.height;
        var ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });

        for (var i = 0; i < totalFrames; i++) {
          if (this.dualChannelCancelled) break;

          var img = images[i];

          // 清空并绘制
          ctx.clearRect(0, 0, config.width, config.height);
          ctx.drawImage(img, 0, 0, config.width, config.height);

          // 获取像素数据
          var imageData = ctx.getImageData(0, 0, config.width, config.height);
          frames.push(imageData);

          this.dualChannelProgress = Math.floor((i / totalFrames) * 30);
        }

        return frames;
      },

      /**
       * 合成双通道帧（序列帧用）
       */
      composeFramesDualChannel: async function (frames) {
        var _this = this;

        return Services.DualChannelComposer.composeToJPEG(frames, {
          mode: this.framesToDualChannelConfig.channelMode,
          onProgress: function (progress) {
            _this.dualChannelProgress = 30 + Math.round(progress * 30);
            _this.dualChannelMessage = '合成双通道帧 ' + Math.round(progress * frames.length) + '/' + frames.length;
          },
          onCancel: function () {
            return _this.dualChannelCancelled;
          }
        });
      },

      // onSVGAWidthChange 和 onSVGAHeightChange 已移除，逻辑移至 to-svga-panel 组件内

      // ==================== 侧边栏通用方法 ====================

      // ==================== 侧边栏通用方法 (已迁移至 PanelMixin) ====================
      // closeRightPanel, openRightPanel
      // 已迁移至 docs/assets/js/mixins/panel-mixin.js
      // ===========================================================================

      // ==================== 统一：To SVGA (MP4/Lottie/Frames) ====================
      // openToSvgaPanel, handleToSvgaConvert, cancelToSvgaConversion
      // 已迁移至 docs/assets/js/mixins/panel-mixin.js
      // ===========================================================================

      // ==================== 统一：To Dual Channel (SVGA/MP4/Lottie/Frames) ====================
      // openDualChannelPanel, handleDualChannelConvert, cancelDualChannelConversion 及兼容层
      // 已迁移至 docs/assets/js/mixins/panel-mixin.js
      // ====================================================================================

      /* ==================== 格式转换：MP4转SVGA (逻辑部分保持，但更新UI绑定) ==================== */

      /**
       * 开始双通道MP4转SVGA转换
       */
      startSVGAConversion: async function (config) {
        var _this = this;

        // 如果传入了配置（来自组件），则更新本地配置
        if (config) {
          this.toSvgaConfig = Object.assign({}, this.toSvgaConfig, config);
        }

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
        var width = this.toSvgaConfig.width;
        var height = this.toSvgaConfig.height;
        var quality = this.toSvgaConfig.quality;
        var fps = this.toSvgaConfig.fps;

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

        // 保存配置到 configManager
        if (this.configManager) {
          this.configManager.set('svga_quality', this.toSvgaConfig.quality);
        }

        this.isConvertingToSvga = true;
        this.toSvgaProgress = 0;
        this.toSvgaCancelled = false;
        this.toSvgaStage = 'loading';
        this.toSvgaMessage = '正在加载库...';

        var taskId = null;
        if (this.taskManager) {
          taskId = this.taskManager.register('双通道MP4转SVGA', function () {
            _this.cancelYyevaToSvgaConversion();
          });
        }

        try {
          // 1. 加载 protobuf 和 pako
          await this.loadLibrary(['protobuf', 'pako'], true);
          if (this.toSvgaCancelled) throw new Error('用户取消转换');

          // 2. 提取序列帧
          this.toSvgaStage = 'extracting';
          this.toSvgaMessage = '正在提取序列帧...';
          var frameData = await this.extractYyevaFrames();
          if (this.toSvgaCancelled) throw new Error('用户取消转换');

          // 2.5 提取音频（如果未静音）
          var audios = null;
          if (!this.toSvgaConfig.muted && this.yyeva.file) {
            this.toSvgaMessage = '正在提取音频...';
            try {
              await Services.FFmpegService.init();
              audios = await this.extractAudioFromMp4(this.yyeva.file, frameData.frames.length, this.toSvgaConfig.fps);
            } catch (e) {
              console.warn('Audio extraction failed, exporting silent SVGA:', e);
              // 静默失败，将导出无音频的SVGA
            }
            if (this.toSvgaCancelled) throw new Error('用户取消转换');
          }

          // 3. 构建SVGA文件
          this.toSvgaStage = 'building';

          // 使用通用SVGA构建方法（buildFromPNG模式）
          var svgaBlob = await this.buildSVGAFromConfig('yyeva', {
            buildType: 'fromPNG',
            frames: frameData.frames,
            scaledWidth: frameData.scaledWidth,
            scaledHeight: frameData.scaledHeight,
            displayWidth: frameData.displayWidth,
            displayHeight: frameData.displayHeight,
            scaleFactor: frameData.scaleFactor,
            fps: this.toSvgaConfig.fps,
            audios: audios,
            muted: this.toSvgaConfig.muted,
            dependencies: {
              protobuf: protobuf,
              pako: pako
            }
          }, {
            progressField: 'toSvgaProgress',
            messageField: 'toSvgaMessage',
            cancelledField: 'toSvgaCancelled'
          });

          if (this.toSvgaCancelled) throw new Error('用户取消转换');

          // 4. 下载文件
          this.toSvgaStage = 'done';
          var originalName = this.yyeva.fileInfo.name.replace(/\.mp4$/i, '');
          this.downloadSVGA(svgaBlob, originalName + '.svga');

          alert('✅ 转换完成！\n\n已成功生成SVGA文件。');

        } catch (error) {
          if (error.message !== '用户取消转换') {
            console.error('SVGA转换失败:', error);
            alert('转换失败：' + error.message);
          }
          // 重置状态
          setTimeout(function () {
            if (!_this.isConvertingToSvga) {
              _this.toSvgaProgress = 0;
              _this.toSvgaStage = '';
              _this.toSvgaMessage = '';
            }
          }, 1000);

        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
          this.isConvertingToSvga = false;
        }
      },

      // 从双通道MP4提取序列帧
      extractYyevaFrames: async function () {
        var _this = this;
        var video = this.yyevaVideo;
        var fps = this.toSvgaConfig.fps;
        var targetWidth = this.toSvgaConfig.width;
        var targetHeight = this.toSvgaConfig.height;
        var quality = this.toSvgaConfig.quality || 100;

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
          if (_this.toSvgaCancelled) break;

          // 跳转到指定时间
          var time = i / fps;
          video.currentTime = time;

          // 等待视频寻址完成
          await new Promise(function (resolve) {
            // 如果已经在目标时间，直接resolve（避免seeked不触发）
            if (video.currentTime === time && video.readyState >= 2) {
              resolve();
              return;
            }

            var onSeeked = function () {
              video.removeEventListener('seeked', onSeeked);
              resolve();
            };
            video.addEventListener('seeked', onSeeked);

            // 安全超时：即使seeked不触发，2秒后也强制继续，防止卡死
            // 但不再依赖它作为主要逻辑
            setTimeout(function () {
              video.removeEventListener('seeked', onSeeked);
              resolve();
            }, 2000);
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
          _this.toSvgaProgress = Math.round((i + 1) / totalFrames * 50); // 占50%进度

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

      /* ==================== 格式转换：SVGA转MP4 ==================== */

      /**
       * 开始 SVGA 转 MP4 转换
       */
      startMP4Conversion: async function (config) {
        var _this = this;

        // 如果传入了配置（来自组件），则更新本地配置
        if (config) {
          this.dualChannelConfig = Object.assign({}, this.dualChannelConfig, config);
        }

        // 前置检查
        if (!this.svgaPlayer || !this.svga.hasFile || !this.originalVideoItem) {
          alert('请先加载 SVGA 文件');
          return;
        }

        // 检查是否有其他正在进行的任务
        if (!this.confirmIfHasOngoingTasks('SVGA转双通道', 'task')) {
          return; // 用户取消
        }

        // 参数验证
        var width = this.dualChannelConfig.width;
        var height = this.dualChannelConfig.height;
        var quality = this.dualChannelConfig.quality;
        var fps = this.dualChannelConfig.fps;

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

        // 保存配置到 configManager
        try {
          if (this.configManager) {
            this.configManager.set('mp4_quality', this.dualChannelConfig.quality);
            this.configManager.set('mp4_fps', this.dualChannelConfig.fps);
          }
        } catch (e) {
          console.error('Failed to save MP4 config:', e);
        }

        this.isConvertingToDualChannel = true;
        this.dualChannelProgress = 0;
        this.dualChannelCancelled = false;
        this.dualChannelStage = 'loading';
        this.dualChannelMessage = '正在加载转换器...';

        var taskId = null;
        if (this.taskManager) {
          taskId = this.taskManager.register('SVGA转双通道', function () {
            _this.cancelSvgaToDualChannelConversion();
          });
        }

        try {
          // 1. 加载 FFmpeg (使用统一服务)
          await Services.FFmpegService.init();
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 2. 提取序列帧
          this.dualChannelStage = 'extracting';
          this.dualChannelMessage = '正在提取序列帧...';
          var frames = await this.extractFrames();
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 3. 合成双通道
          this.dualChannelStage = 'composing';
          this.dualChannelMessage = '正在合成双通道...';
          var dualFrames = await this.composeDualChannelFrames(frames);
          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 4. 编码为 MP4 (使用统一服务)
          this.dualChannelStage = 'encoding';
          this.dualChannelMessage = '正在编码为MP4...';

          // 准备音频数据
          var audioData = null;
          var hasAudioData = this.svgaAudioData && Object.keys(this.svgaAudioData).length > 0;
          if (!this.dualChannelConfig.muted && hasAudioData) {
            var audioKeys = Object.keys(this.svgaAudioData);
            audioData = this.svgaAudioData[audioKeys[0]];
          }

          var videoItem = this.originalVideoItem;
          var inputFps = videoItem.FPS || videoItem.fps || 30;

          var mp4Blob = await Services.FFmpegService.convertFramesToMp4({
            frames: dualFrames,
            fps: this.dualChannelConfig.fps,
            inputFps: inputFps,
            quality: this.dualChannelConfig.quality,
            audioData: audioData,
            onProgress: function (p) {
              _this.dualChannelProgress = Math.round(p * 100);
              if (p < 0.4) {
                _this.dualChannelMessage = '正在写入帧数据... ' + Math.round(p / 0.4 * 100) + '%';
              } else if (p < 0.45) {
                _this.dualChannelMessage = '正在处理音频...';
              } else if (p < 0.95) {
                _this.dualChannelMessage = '正在编码视频... ' + Math.round((p - 0.45) / 0.5 * 100) + '%';
              } else {
                _this.dualChannelMessage = '正在生成文件...';
              }
            },
            checkCancelled: function () {
              return _this.dualChannelCancelled;
            }
          });

          if (this.dualChannelCancelled) throw new Error('用户取消转换');

          // 5. 下载文件
          this.dualChannelStage = 'done';
          this.dualChannelMessage = '转换完成！';
          this.dualChannelProgress = 100;
          this.downloadMP4(mp4Blob);

          // 提示音频状态
          setTimeout(function () {
            var isMuted = _this.dualChannelConfig.muted;
            var msg = '';

            if (isMuted) {
              msg = '✅ 转换完成！\n\n已按您的要求生成静音MP4文件。';
            } else if (!hasAudioData) {
              msg = '✅ 转换完成！\n\nSVGA文件不包含音频，已生成静音MP4文件。';
            } else if (audioData) {
              msg = '✅ 转换完成！\n\n已成功将SVGA中的音频合成到MP4文件中。\n\n请播放检查音频效果，如有问题请反馈。';
            } else {
              msg = '✅ 转换完成！';
            }

            if (msg) {
              alert(msg);
            }
          }, 500);

          // 重置状态
          setTimeout(function () {
            if (!_this.isConvertingToDualChannel) {
              _this.dualChannelProgress = 0;
              _this.dualChannelStage = '';
              _this.dualChannelMessage = '';
            }
          }, 1000);

        } catch (error) {
          if (error.message !== '用户取消转换') {
            console.error('MP4转换失败:', error);
            alert('转换失败：' + error.message);
          }
        } finally {
          if (this.taskManager && taskId) {
            this.taskManager.finish(taskId);
          }
          this.isConvertingToDualChannel = false;
        }
      },

      /**
       * 从 MP4视频提取音频数据
       * @param {File} videoFile - 视频文件
       * @param {number} totalFrames - 总帧数（变速后的/目标帧数）
       * @param {number} fps - 帧率（目标帧率）
       * @param {number} originalTotalFrames - 原始帧数（可选，用于帧率变化计算）
       * @param {number} originalFps - 原始帧率（可选，用于帧率变化计算）
       * @returns {Promise<Array|null>} - 音频数据数组，无音频时返回null
       */
      extractAudioFromMp4: async function (videoFile, totalFrames, fps, originalTotalFrames, originalFps) {
        // 🛡️ 防御性编程：确保fps有效
        fps = parseFloat(fps) || 30;
        if (fps <= 0) fps = 30;

        // [FPS CHECK] 验证源视频帧率与导出帧率
        // 变速编辑器使用原始视频的duration作为基准，而音频提取依赖于准确的 originalFps
        if (originalFps && Math.abs(originalFps - fps) > 0.1) {
          console.warn('帧率变化检测: Source=' + originalFps + 'fps, Target=' + fps + 'fps');
          console.warn('注意：如果变速关键帧是基于Source帧率打点的，直接应用到Target帧率可能会导致时间轴偏移。');
        }

        // 确保FFmpeg已初始化
        if (!Services.FFmpegService.isLoaded) {
          try {
            await Services.FFmpegService.init();
          } catch (error) {
            console.error('FFmpeg初始化失败:', error);
            return null;
          }
        }

        try {
          // 检查是否启用了多段变速
          if (this.speedRemapConfig.enabled && this.speedRemapConfig.keyframes && this.speedRemapConfig.keyframes.length >= 2) {
            var keyframes = this.speedRemapConfig.keyframes;
            var originalTotalFrames = this.speedRemapConfig.originalTotalFrames;

            // 检查是否是非线性变速（多个K帧或端点移动）
            var isNonLinear = keyframes.length > 2;
            if (!isNonLinear && keyframes.length === 2) {
              isNonLinear = (keyframes[0].position !== 0 || keyframes[1].position !== 1);
            }

            if (isNonLinear) {
              // 多段变速：使用分段处理
              var videoDuration = this.mp4Video ? this.mp4Video.duration : 0;
              var videoOriginalFps = originalTotalFrames / videoDuration;

              // [CRITICAL FIX] 归一化关键帧位置 (Normalize Keyframes)
              // 问题根源：
              // buildFrameMap 根据 startPos 到 endPos 的范围计算了 outputTotalFrames (例如 11s -> 4s)。
              // 但 extractAudioWithSpeedRemap 使用 outputTotalFrames 作为 1.0 的基准。
              // 如果 keyframes 的 position 范围是 0-0.364 (即4s/11s)，而不归一化到 0-1，
              // extractAudioWithSpeedRemap 会认为只输出了 36.4% 的时长 (1.5s)，导致音频被压缩且时长不足。
              //
              // 解决方案：
              // 将 keyframes 的 position 归一化到 0-1 范围，使其填满整个 outputTotalFrames。

              var startPos = keyframes[0].position;
              var endPos = keyframes[keyframes.length - 1].position;
              var range = endPos - startPos;

              // 防止除以零
              if (range < 0.0001) range = 1.0;

              console.log('音频变速预处理: 归一化关键帧范围', startPos.toFixed(3) + '-' + endPos.toFixed(3), 'Range:', range.toFixed(3));

              keyframes = keyframes.map(function (k) {
                return {
                  frame: k.frame,
                  originalFrame: k.originalFrame,
                  // 归一化公式: (x - min) / (max - min)
                  position: (k.position - startPos) / range,
                  speed: k.speed
                };
              });

              // 强制首尾为 0.0 和 1.0 (消除浮点误差)
              if (keyframes.length > 0) {
                keyframes[0].position = 0.0;
                keyframes[keyframes.length - 1].position = 1.0;
              }

              return await Services.FFmpegService.extractAudioWithSpeedRemap({
                videoFile: videoFile,
                keyframes: keyframes,
                totalFrames: totalFrames,
                fps: fps,
                originalTotalFrames: originalTotalFrames,
                originalFps: videoOriginalFps
              });
            } else {
              // 均匀变速：计算一个平均变速比例
              var originalDuration = this.mp4Video ? this.mp4Video.duration : 0;
              if (originalDuration > 0 && fps > 0) {
                var outputDuration = totalFrames / fps;
                var audioSpeedRatio = originalDuration / outputDuration;

                // console.log('检测到均匀变速，使用统一变速比例:', audioSpeedRatio);
                return await Services.FFmpegService.extractAudio({
                  videoFile: videoFile,
                  totalFrames: totalFrames,
                  fps: fps,
                  speedRatio: audioSpeedRatio
                });
              }
            }
          }

          // 无变速，但可能有帧率变化
          // 如果提供了原始帧率和目标帧率，计算变速比例
          var audioSpeedRatio = 1.0;
          if (originalTotalFrames && originalFps && originalFps !== fps) {
            // 帧率变化：音频需要调整速度
            // 原始时长：originalTotalFrames / originalFps
            // 目标时长：totalFrames / fps
            // 变速比例 = 原始时长 / 目标时长
            var originalDuration = originalTotalFrames / originalFps;
            var outputDuration = totalFrames / fps;
            audioSpeedRatio = originalDuration / outputDuration;
            // console.log('检测到帧率变化：' + originalFps + 'fps -> ' + fps + 'fps，音频变速比例:', audioSpeedRatio);
          } else {
            // console.log('无变速且帧率未变，直接提取音频');
          }

          return await Services.FFmpegService.extractAudio({
            videoFile: videoFile,
            totalFrames: totalFrames,
            fps: fps,
            speedRatio: audioSpeedRatio
          });

        } catch (error) {
          console.error('音频提取失败:', error);
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
        var targetWidth = this.dualChannelConfig.width || originalWidth;
        var targetHeight = this.dualChannelConfig.height || originalHeight;

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
            if (this.dualChannelCancelled) {
              throw new Error('用户取消转换');
            }

            // 更新进度
            this.dualChannelProgress = Math.round((i + 1) / totalFrames * 100);
            this.dualChannelMessage = '提取序列帧 ' + (i + 1) + '/' + totalFrames;

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

        // Use new config object if available, fallback to old or default
        var mode = 'color-left-alpha-right';
        if (this.dualChannelConfig) mode = this.dualChannelConfig.channelMode;
        if (this.dualChannelConfig) mode = this.dualChannelConfig.channelMode;
        if (this.dualChannelConfig) mode = this.dualChannelConfig.channelMode;

        // Determine which config to use based on current conversion context
        if (this.isConvertingToDualChannel && this.currentModule === 'svga') {
          mode = this.dualChannelConfig.channelMode;
        } else if (this.isConvertingToDualChannel && this.currentModule === 'mp4') {
          mode = this.dualChannelConfig.channelMode;
        } else if (this.isConvertingToDualChannel && this.currentModule === 'lottie') {
          mode = this.dualChannelConfig.channelMode;
        }

        return Services.DualChannelComposer.composeToJPEG(frames, {
          mode: mode,
          onProgress: function (progress) {
            _this.dualChannelProgress = Math.round(progress * 100);
            _this.dualChannelMessage = '合成双通道帧 ' + Math.round(progress * frames.length) + '/' + frames.length;
          },
          onCancel: function () {
            return _this.dualChannelCancelled;
          }
        });
      },

      // 下载MP4文件
      downloadMP4: function (blob) {
        var filename = this.svga.fileInfo.name || 'svga';
        // 移除扩展名
        filename = filename.replace(/\.svga$/i, '');
        // 添加后缀
        var mode = this.dualChannelConfig ? this.dualChannelConfig.channelMode : 'color-left-alpha-right';
        var suffix = mode === 'color-left-alpha-right' ? '_yyeva_LR' : '_yyeva_RL';
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
          blob = await Services.SvgaBuilder.buildFromPNG(buildParams);
        } else {
          blob = await Services.SvgaBuilder.build(buildParams);
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
        this.utils.downloadFile(blob, fileName);
      },

      // 取消MP4转换
      cancelSvgaToDualChannelConversion: function () {
        this.dualChannelCancelled = true;
        this.dualChannelMessage = '正在取消...';
      }
    },
    computed: {
      /**
       * 检查是否有任何任务正在进行中（用于UI互斥）
       * 包括：GIF导出、各种格式转换
       */
      isGlobalTaskRunning: function () {
        return this.taskManager && this.taskManager.hasRunningTasks();
      },
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
          // SVGA: 必须同时满足有音频配置(svgaAudios)和音频数据(svgaAudioData)
          // 仅有数据但没有配置(audios数组)，说明不需要播放声音
          // 仅有配置但没有数据，说明音频丢失

          var hasConfig = (this.originalVideoItem && this.originalVideoItem.audios && this.originalVideoItem.audios.length > 0) ||
            (this.svgaMovieData && this.svgaMovieData.audios && this.svgaMovieData.audios.length > 0);

          var hasData = this.svgaAudioData && Object.keys(this.svgaAudioData).length > 0;

          // 严格模式：必须两者都有
          return hasConfig && hasData;
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
      yyevaToSvgaEstimate: function () {
        // 获取配置参数
        var width = this.toSvgaConfig.width || 0;
        var height = this.toSvgaConfig.height || 0;
        var fps = this.toSvgaConfig.fps || 30;
        var quality = this.toSvgaConfig.quality || 80;
        var muted = this.toSvgaConfig.muted;

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
        var beforeFileSizeText = '0kb';
        if (this.yyeva.fileInfo && this.yyeva.fileInfo.size) {
          beforeFileSizeText = this.utils.formatBytes(this.yyeva.fileInfo.size);
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

        var afterFileSizeText = frames > 0 ? this.utils.formatBytes(estimatedTotalBytes) : '？';

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
        var width = this.toSvgaConfig.width || 0;
        var height = this.toSvgaConfig.height || 0;
        var fps = this.toSvgaConfig.fps || 30;
        var quality = this.toSvgaConfig.quality || 80;

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
        var beforeFileSizeText = '0kb';
        if (this.mp4.fileInfo && this.mp4.fileInfo.size) {
          beforeFileSizeText = this.utils.formatBytes(this.mp4.fileInfo.size);
        }

        // 转换后文件大小预估：
        // 使用缩小后的尺寸计算，SVGA使用PNG压缩，预估每帧大小 = 缩小宽×缩小高×0.5
        // 然后再经过pako压缩，大约压缩到70%
        var estimatedFrameSizeBytes = scaledWidth * scaledHeight * 0.5;
        var estimatedTotalBytes = estimatedFrameSizeBytes * frames * 0.7; // pako压缩后

        var afterFileSizeText = frames > 0 ? this.utils.formatBytes(estimatedTotalBytes) : '？';

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
        var width = this.toSvgaConfig.width || 0;
        var height = this.toSvgaConfig.height || 0;
        var fps = this.toSvgaConfig.fps || 30;
        var quality = this.toSvgaConfig.quality || 80;

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

        var afterFileSizeText = '？';
        if (frames > 0) {
          afterFileSizeText = this.utils.formatBytes(estimatedTotalBytes);
        }

        return {
          frames: frames,
          duration: duration,
          afterMemory: afterMemoryMB + 'M',
          afterFileSize: afterFileSizeText
        };
      },

      // 序列帧转SVGA预估计算
      imagesToSvgaEstimate: function () {
        // 获取配置参数
        var width = this.toSvgaConfig.width || 0;
        var height = this.toSvgaConfig.height || 0;
        var fps = this.toSvgaConfig.fps || 25;
        var quality = this.toSvgaConfig.quality || 80;

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

        var afterFileSizeText = '？';
        if (frames > 0) {
          afterFileSizeText = this.utils.formatBytes(estimatedTotalBytes);
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
          fileSizeText = this.utils.formatBytes(totalBytes);
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
      this.libraryLoader = Core.libraryLoader;
      this.resourceManager = Core.resourceManager;
      this.playerController = null;

      // 初始化文件验证器和工具库
      this.fileValidator = new Services.FileValidator(this.libraryLoader);
      this.utils = SP.Utils;

      // 初始化配置管理器
      if (Core.ConfigManager) {
        this.configManager = new Core.ConfigManager();
        this.loadUserConfig();
      }

      /**
       * [模式策略配置表]
       * 用于定义不同模式下的清理逻辑。
       * 当 switchMode 发生时，会根据当前的 currentModule 查找对应的策略并执行 cleanup。
       * 
       * [开发指南]
       * 1. 新增模式：如果增加了新的文件类型支持（如 gif），请在此处添加对应的 key 和 cleanup 方法。
       * 2. 方法对应：确保 cleanup 指向的是 methods 中实际定义的清理函数。
       * 3. 上下文：执行时会自动绑定 this 到 Vue 实例，无需手动 bind。
       */
      this.modeStrategies = {
        'svga': { cleanup: this.cleanupSvga },
        'yyeva': { cleanup: this.cleanupYyeva }, // 双通道MP4模式
        'mp4': { cleanup: this.cleanupMp4 },     // 普通MP4模式
        'lottie': { cleanup: this.cleanupLottie },
        'frames': { cleanup: this.cleanupFrames }
      };

      // 从 URL 参数加载文件
      var urlParams = new URLSearchParams(window.location.search);
      var fileUrl = urlParams.get('src') || urlParams.get('file');

      if (fileUrl) {
        var _this = this;
        // 如果是相对路径，转换为绝对路径（解决跨域问题）
        if (fileUrl.indexOf('http') !== 0) {
          var a = document.createElement('a');
          a.href = fileUrl;
          fileUrl = a.href;
        }

        fetch(fileUrl)
          .then(function (res) { return res.blob(); })
          .then(function (blob) {
            var file = new File([blob], fileUrl.split('/').pop(), { type: blob.type });
            // 使用统一的文件处理逻辑
            _this.handleFile(file);
          })
          .catch(function (err) {
            console.error('加载URL文件失败:', err);
          });
      }

      // 任务管理器
      this.taskManager = Core.taskManager;

      // SVGA
      this.svgaPlayer = null;
      this.svgaParser = null;
      this.svgaObjectUrl = null;
      this.svgaAudioData = null;
      this.svgaMovieData = null;

      // Empty State SVGA
      this.emptyStateSvgaPlayer = null;
      this.emptyStateSvgaParser = null;

      // 双通道MP4 YYEVA
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

    },
    watch: {
      bgColorKey: function (val) {
        var _this = this;
        this.saveUserConfig('bgColorKey', val);
        this.$nextTick(function () {
          _this.applyCanvasBackground();
        });
      },
      currentModule: function (val) {
        this.saveUserConfig('lastMode', val);
      },
      // gifConfig watcher 已移入组件内部通过事件处理
      gifConfig: {
        handler: function (val) {
          var configToSave = {
            fps: val.fps,
            quality: val.quality,
            transparent: val.transparent,
            dither: val.dither,
            width: val.width,
            height: val.height
          };
          this.saveUserConfig('gifConfig', configToSave);
        },
        deep: true
      },
      // 监听footer内容显示状态，初始化播放控制器
      footerContentVisible: function (newVal) {
        if (newVal && !this.playerController) {
          this.initPlayerController();
        }
      },
      // 监听绿幕抠图配置变化，更新效果
      chromaKeyEnabled: function () {
        this.updateChromaKeyEffect();
      },
      chromaKeySimilarity: function () {
        if (this.chromaKeyEnabled) {
          this.updateChromaKeyEffect();
        }
      },
      chromaKeySmoothness: function () {
        if (this.chromaKeyEnabled) {
          this.updateChromaKeyEffect();
        }
      }
    },
    mounted: function () {
      var _this = this;

      // 注意：拖拽事件已在 Vue 模板中通过 @drop.prevent="onDrop" 绑定
      // 此处不再重复绑定，避免同一文件被处理两次

      // 强制重置弹窗状态，防止意外显示
      this.showEditFrameDialog = false;
      this.editingKeyframeIndex = -1;
      this.editFrameInput = '';
      this.showFramesFpsDialog = false;

      // 确保左侧面板默认关闭
      this.showMoreDrawer = false;

      this.initSvgaPlayer();
      this.initViewportController();

      var savedTheme = this.configManager ? this.configManager.get('theme') : null;
      if (savedTheme === 'dark') {
        this.isDarkMode = true;
        document.body.classList.add('dark-mode');
      }

      // 点击外部关闭下拉菜单
      document.addEventListener('click', function (e) {
        if (_this.showChannelModeDropdown) {
          var selectWrapper = _this.$refs.mp4SelectWrapper;
          if (selectWrapper && !selectWrapper.contains(e.target)) {
            _this.showChannelModeDropdown = false;
          }
        }
      });

      // 销毁旧的 InputController (防止双重监听)
      // 使用 window 全局变量来处理热重载情况下的残留实例
      if (window.MeeWoo_GlobalInputController) {
        if (window.MeeWoo_GlobalInputController.destroy) {
          window.MeeWoo_GlobalInputController.destroy();
        }
        window.MeeWoo_GlobalInputController = null;
      }

      if (this.inputController) {
        if (this.inputController.destroy) {
          this.inputController.destroy();
        }
        this.inputController = null;
      }

      // 初始化输入控制器（处理文件拖拽）
      var inputController = new Controllers.InputController({
        container: document.body,
        onHoverChange: function (isHover) {
          _this.dropHover = isHover;
        },
        onDrop: function (files) {
          // 传递 skipCheck=false，确保进行任务检查
          _this.handleFiles(files, false);
        }
      });

      this.inputController = inputController;
      window.MeeWoo_GlobalInputController = inputController;

      // 加载 help.md
      this.loadHelpContent();

      // 注册库加载进度回调（更新响应式数据）
      if (Core.libraryLoader) {
        Core.libraryLoader.onProgress(function (currentLib) {
          if (currentLib) {
            _this.loadingLibraryInfo = { name: currentLib.name, progress: currentLib.progress };
          } else {
            _this.loadingLibraryInfo = null;
          }
        });
      } else {
        console.warn('libraryLoader not found');
      }

      // 键盘快捷键监听
      document.addEventListener('keydown', function (e) {
        // 检查焦点是否在输入框或文本域
        var activeElement = document.activeElement;
        var isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );

        // 如果在输入状态或没有加载文件，不响应快捷键
        if (isInputFocused || _this.isEmpty) {
          return;
        }

        // 空格键：播放/暂停
        if (e.keyCode === 32 || e.key === ' ') {
          e.preventDefault(); // 阻止页面滚动
          _this.togglePlay();
        }
        // 左右方向键：快进/快退
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault(); // 阻止水平滚动

          if (_this.playerController) {
            var direction = e.key === 'ArrowLeft' ? -1 : 1;
            _this.playerController.step(direction);
          }
        }
      });

      // 预加载非关键库
      this.preloadLibraries();
    },
    beforeDestroy: function () {
      // 销毁输入控制器
      if (this.inputController) {
        this.inputController.destroy();
        this.inputController = null;
      }
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

  // 启动逻辑
  // 这里的轮询仅为了等待 Vue/SVGA 等异步库就绪，超时逻辑已移交给 index.html 处理
  var interval = setInterval(function () {
    if (checkLibraries()) {
      clearInterval(interval);
      start();
    }
  }, 100);
})();


