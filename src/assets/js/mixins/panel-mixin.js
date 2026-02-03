(function (global) {
  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Mixins = global.MeeWoo.Mixins || {};

  /**
   * @file panel-mixin.js
   * @description 右侧面板管理 Mixin
   * @author MeeWoo Team
   * @date 2026-01-18
   * 
   * 模块索引：
   * 1. 侧边栏状态管理
   * 2. 统一转双通道 MP4 配置与逻辑
   * 3. 统一转 SVGA 配置与逻辑
   * 4. 侧边栏通用方法
   * 5. 统一 To SVGA 方法（MP4/Lottie/Frames）
   * 6. 统一 To Dual Channel 方法（SVGA/MP4/Lottie/Frames）
   * 7. 旧方法兼容层
   * 
   * 职责分工：
   * - 此 Mixin 负责管理右侧面板的状态和业务逻辑
   * - components 目录下的组件负责面板的 UI 渲染和用户交互
   * - 两者通过 activeRightPanel 状态和事件机制进行通信
   * 
   * 使用方式：
   * ```javascript
   * // 在 Vue 组件中引入并使用
   * var app = new Vue({
   *   mixins: [MeeWoo.Mixins.PanelMixin],
   *   // ...
   * });
   * ```
   */
  global.MeeWoo.Mixins.PanelMixin = {
    data: function () {
      return {
        // ==================== 侧边栏状态 ====================
        activeRightPanel: null, // 当前激活的右侧面板: 'to-svga', 'dual-channel', 'gif', 'material'

        // ==================== 统一 转双通道 MP4 (新) ====================
        dualChannelConfig: {
          channelMode: 'color-left-alpha-right',
          width: 0,
          height: 0,
          quality: 80,
          fps: 30,
          muted: false,
          aspectRatio: 1
        },
        dualChannelSourceInfo: {
          name: '',
          sizeWH: '',
          duration: '',
          fileSize: '',
          fps: 30,
          typeLabel: '' // 'SVGA' | 'MP4' | 'Lottie' | '序列帧'
        },
        isConvertingToDualChannel: false,
        dualChannelProgress: 0,
        dualChannelMessage: '',
        dualChannelCancelled: false,



        // ==================== 统一 转 SVGA (新) ====================
        toSvgaConfig: {
          width: 0,
          height: 0,
          quality: 80,
          fps: 30,
          muted: false,
          aspectRatio: 1
        },
        toSvgaSourceInfo: {
          name: '',
          sizeWH: '',
          duration: '',
          fileSize: '',
          fps: 30,
          typeLabel: '' // 'MP4' | 'Lottie' | '序列帧' | '双通道MP4'
        },
        isConvertingToSvga: false,
        toSvgaProgress: 0,
        toSvgaStage: '',
        toSvgaMessage: '',
        toSvgaCancelled: false,


      };
    },

    methods: {
      // ==================== 侧边栏通用方法 ====================

      /**
       * 关闭右侧面板（统一入口）
       */
      closeRightPanel: function () {
        // 如果正在转换，需要确认
        if (this.activeRightPanel === 'to-svga' && this.isConvertingToSvga) {
          if (!confirm('正在转换中，确定要取消吗？')) return;
          this.cancelToSvgaConversion();
        } else if (this.activeRightPanel === 'dual-channel' && this.isConvertingToDualChannel) {
          if (!confirm('正在转换中，确定要取消吗？')) return;
          this.cancelDualChannelConversion();
        } else if (this.activeRightPanel === 'gif' && this.isExportingGIF) {
          if (!confirm('正在导出GIF中，确定要取消吗？')) return;
          this.cancelGifExport();
        } else if (this.showStandardMp4Panel && this.isConvertingStandardMp4) {
          if (!confirm('正在转换中，确定要取消吗？')) return;
          this.cancelStandardMp4Conversion();
        }

        // 关闭所有类型的右侧面板
        this.activeRightPanel = null;
        this.showStandardMp4Panel = false;
      },

      /**
       * 关闭所有弹窗
       */
      closeAllPanels: function () {
        // 关闭右侧面板
        this.closeRightPanel();
      },

      /**
       * 打开/切换右侧面板（通用方法，兼容旧代码）
       * @param {String} panelName - 面板名称或旧的状态变量名
       */
      openRightPanel: function (panelName) {
        let targetPanel = null;
        let isStandardMp4 = false;

        // 确定目标面板类型
        if (panelName === 'showStandardMp4Panel') {
          isStandardMp4 = true;
        } else if (panelName === 'gif') {
          targetPanel = 'gif';
        } else if (panelName === 'to-svga') {
          targetPanel = 'to-svga';
        } else if (panelName === 'dual-channel') {
          targetPanel = 'dual-channel';
        } else if (panelName === 'material') {
          targetPanel = 'material';
        } else if (panelName === 'showMp4ToSvgaPanel' || panelName === 'showLottieToSvgaPanel' || panelName === 'showFramesToSvgaPanel' || panelName === 'showImagesToSvgaPanel' || panelName === 'showYyevaToSvgaPanel') {
          targetPanel = 'to-svga';
        } else if (panelName === 'showMp4ToDualChannelPanel' || panelName === 'showLottieToDualChannelPanel' || panelName === 'showFramesToDualChannelPanel' || panelName === 'showImagesToDualChannelPanel' || panelName === 'showSvgaToDualChannelPanel') {
          targetPanel = 'dual-channel';
        } else if (panelName === 'showGifPanel') {
          targetPanel = 'gif';
        } else {
          // 默认行为
          console.warn('Unknown panel name:', panelName);
          return;
        }

        // 切换逻辑
        if (isStandardMp4) {
          // 处理标准MP4面板
          if (this.showStandardMp4Panel) {
            // 如果当前就是标准MP4面板且处于显示状态，则关闭
            this.showStandardMp4Panel = false;
            this.activeRightPanel = null;
          } else {
            // 否则关闭其他所有面板，打开标准MP4面板
            this.activeRightPanel = null;
            this.showStandardMp4Panel = true;
          }
        } else {
          // 处理其他面板
          if (this.activeRightPanel === targetPanel) {
            // 如果当前就是目标面板且处于显示状态，则关闭所有面板
            this.activeRightPanel = null;
            this.showStandardMp4Panel = false;
          } else {
            // 否则关闭其他所有面板，打开目标面板
            this.showStandardMp4Panel = false;
            this.activeRightPanel = targetPanel;
          }
        }
      },

      // ==================== 统一：To SVGA (MP4/Lottie/Frames) ====================

      /**
       * 打开转 SVGA 面板 (统一入口)
       */
      openToSvgaPanel: function () {
        var sourceInfo = {
          name: '',
          sizeWH: '',
          duration: '',
          fileSize: '',
          fps: 30,
          typeLabel: ''
        };
        var config = {
          width: 0,
          height: 0,
          quality: 80,
          fps: 30,
          muted: false,
          aspectRatio: 1
        };

        // 根据当前模块设置源信息
        if (this.currentModule === 'mp4') {
          sourceInfo.name = this.mp4.fileInfo.name;
          sourceInfo.sizeWH = this.mp4.fileInfo.width + 'x' + this.mp4.fileInfo.height;
          sourceInfo.duration = this.utils.formatTime(this.mp4.fileInfo.duration);
          sourceInfo.fileSize = this.utils.formatSize(this.mp4.fileInfo.size);
          sourceInfo.fps = 30; // MP4默认
          sourceInfo.typeLabel = 'MP4';

          config.width = this.mp4.fileInfo.width;
          config.height = this.mp4.fileInfo.height;
          config.aspectRatio = this.mp4.fileInfo.width / this.mp4.fileInfo.height;
        } else if (this.currentModule === 'lottie') {
          sourceInfo.name = this.lottie.fileInfo.name;
          sourceInfo.sizeWH = this.lottie.fileInfo.width + 'x' + this.lottie.fileInfo.height;
          sourceInfo.duration = this.utils.formatTime(this.lottie.fileInfo.duration);
          sourceInfo.fileSize = this.utils.formatSize(this.lottie.fileInfo.size);
          sourceInfo.fps = this.lottie.fileInfo.fps || 30;
          sourceInfo.typeLabel = 'Lottie';

          config.width = this.lottie.fileInfo.width;
          config.height = this.lottie.fileInfo.height;
          config.fps = this.lottie.fileInfo.fps || 30;
          config.aspectRatio = this.lottie.fileInfo.width / this.lottie.fileInfo.height;
        } else if (this.currentModule === 'frames') {
          sourceInfo.name = this.frames.fileInfo.name;
          sourceInfo.sizeWH = this.frames.fileInfo.width + 'x' + this.frames.fileInfo.height;
          sourceInfo.duration = this.utils.formatTime(this.frames.fileInfo.duration);
          sourceInfo.fileSize = this.utils.formatSize(this.frames.fileInfo.size);
          sourceInfo.fps = this.frames.fileInfo.fps || 25;
          sourceInfo.typeLabel = '序列帧';

          config.width = this.frames.fileInfo.width;
          config.height = this.frames.fileInfo.height;
          config.fps = this.frames.fileInfo.fps || 25;
          config.aspectRatio = this.frames.fileInfo.width / this.frames.fileInfo.height;
        } else if (this.currentModule === 'yyeva') {
          // 双通道转SVGA也合并进来
          sourceInfo.name = this.yyeva.fileInfo.name;
          sourceInfo.sizeWH = this.yyeva.fileInfo.width + 'x' + this.yyeva.fileInfo.height;
          sourceInfo.duration = this.utils.formatTime(this.yyeva.fileInfo.duration);
          sourceInfo.fileSize = this.utils.formatSize(this.yyeva.fileInfo.size);
          sourceInfo.fps = this.yyeva.fileInfo.fps || 30;
          sourceInfo.typeLabel = '双通道MP4';

          config.width = this.yyeva.fileInfo.width;
          config.height = this.yyeva.fileInfo.height;
          config.fps = this.yyeva.fileInfo.fps || 30;
          config.aspectRatio = this.yyeva.fileInfo.width / this.yyeva.fileInfo.height;
        }

        this.toSvgaSourceInfo = sourceInfo;
        this.toSvgaConfig = config;
        this.activeRightPanel = 'to-svga';
      },

      /**
       * 统一处理 转SVGA 逻辑
       */
      handleToSvgaConvert: function (config) {
        // 更新配置
        this.toSvgaConfig = config;

        // 根据模块分发
        if (this.currentModule === 'mp4') {
          this.startMp4ToSvgaConversion(config);
        } else if (this.currentModule === 'lottie') {
          this.startLottieToSvgaConversion(config);
        } else if (this.currentModule === 'frames') {
          this.startFramesToSvgaConversion(config);
        } else if (this.currentModule === 'yyeva') {
          // 注意：双通道转SVGA原有逻辑叫 startSVGAConversion
          // 这里我们为了统一，需要适配一下
          // 临时兼容：更新旧配置对象，以便 startSVGAConversion 能读到
          this.yyevaToSvgaConfig = Object.assign({}, this.yyevaToSvgaConfig, config);
          this.startSVGAConversion(config);
        }
      },

      /**
       * 取消 转SVGA
       */
      cancelToSvgaConversion: function () {
        this.toSvgaCancelled = true;
        this.toSvgaMessage = '正在取消...';

        // 兼容旧标志位
        this.mp4ToSvgaCancelled = true;
        this.lottieToSvgaCancelled = true;
        this.framesToSvgaCancelled = true;
        this.svgaConvertCancelled = true; // 双通道转SVGA
      },

      // ==================== 统一：To Dual Channel (SVGA/MP4/Lottie/Frames) ====================

      /**
       * 打开转双通道面板 (统一入口)
       */
      openDualChannelPanel: function () {
        var sourceInfo = {
          name: '',
          sizeWH: '',
          duration: '',
          fileSize: '',
          fps: 30,
          typeLabel: ''
        };
        var config = {
          channelMode: 'color-left-alpha-right',
          width: 0,
          height: 0,
          quality: 80,
          fps: 30,
          muted: false,
          aspectRatio: 1
        };

        if (this.currentModule === 'svga') {
          sourceInfo.name = this.svga.fileInfo.name;
          sourceInfo.sizeWH = this.svga.fileInfo.width + 'x' + this.svga.fileInfo.height;
          sourceInfo.duration = this.utils.formatTime(this.svga.fileInfo.duration);
          sourceInfo.fileSize = this.utils.formatSize(this.svga.fileInfo.size);
          sourceInfo.fps = this.svga.fileInfo.fps || 30;
          sourceInfo.typeLabel = 'SVGA';

          config.width = this.svga.fileInfo.width;
          config.height = this.svga.fileInfo.height;
          config.fps = this.svga.fileInfo.fps || 30;
          config.aspectRatio = this.svga.fileInfo.width / this.svga.fileInfo.height;
        } else if (this.currentModule === 'mp4') {
          sourceInfo.name = this.mp4.fileInfo.name;
          sourceInfo.sizeWH = this.mp4.fileInfo.width + 'x' + this.mp4.fileInfo.height;
          sourceInfo.duration = this.utils.formatTime(this.mp4.fileInfo.duration);
          sourceInfo.fileSize = this.utils.formatSize(this.mp4.fileInfo.size);
          sourceInfo.fps = 30;
          sourceInfo.typeLabel = 'MP4';

          config.width = this.mp4.fileInfo.width;
          config.height = this.mp4.fileInfo.height;
          config.aspectRatio = this.mp4.fileInfo.width / this.mp4.fileInfo.height;
        } else if (this.currentModule === 'lottie') {
          sourceInfo.name = this.lottie.fileInfo.name;
          sourceInfo.sizeWH = this.lottie.fileInfo.width + 'x' + this.lottie.fileInfo.height;
          sourceInfo.duration = this.utils.formatTime(this.lottie.fileInfo.duration);
          sourceInfo.fileSize = this.utils.formatSize(this.lottie.fileInfo.size);
          sourceInfo.fps = this.lottie.fileInfo.fps || 30;
          sourceInfo.typeLabel = 'Lottie';

          config.width = this.lottie.fileInfo.width;
          config.height = this.lottie.fileInfo.height;
          config.fps = this.lottie.fileInfo.fps || 30;
          config.aspectRatio = this.lottie.fileInfo.width / this.lottie.fileInfo.height;
          config.muted = true; // Lottie无声
        } else if (this.currentModule === 'frames') {
          sourceInfo.name = this.frames.fileInfo.name;
          sourceInfo.sizeWH = this.frames.fileInfo.width + 'x' + this.frames.fileInfo.height;
          sourceInfo.duration = this.utils.formatTime(this.frames.fileInfo.duration);
          sourceInfo.fileSize = this.utils.formatSize(this.frames.fileInfo.size);
          sourceInfo.fps = this.frames.fileInfo.fps || 25;
          sourceInfo.typeLabel = '序列帧';

          config.width = this.frames.fileInfo.width;
          config.height = this.frames.fileInfo.height;
          config.fps = this.frames.fileInfo.fps || 25;
          config.aspectRatio = this.frames.fileInfo.width / this.frames.fileInfo.height;
          config.muted = true; // 序列帧无声
        }

        this.dualChannelSourceInfo = sourceInfo;
        this.dualChannelConfig = config;
        this.activeRightPanel = 'dual-channel';
      },

      /**
       * 统一处理 转双通道 逻辑
       */
      handleDualChannelConvert: function (config) {
        this.dualChannelConfig = config;

        if (this.currentModule === 'svga') {
          // 兼容旧逻辑：startMP4Conversion 使用 svgaToDualChannelConfig
          this.svgaToDualChannelConfig = Object.assign({}, this.svgaToDualChannelConfig, config);
          this.startMP4Conversion(config);
        } else if (this.currentModule === 'mp4') {
          this.mp4ToDualChannelConfig = Object.assign({}, this.mp4ToDualChannelConfig, config);
          this.startMp4ToDualChannelConversion(config);
        } else if (this.currentModule === 'lottie') {
          this.lottieToDualChannelConfig = Object.assign({}, this.lottieToDualChannelConfig, config);
          this.startLottieToDualChannelConversion(config);
        } else if (this.currentModule === 'frames') {
          this.imagesToDualChannelConfig = Object.assign({}, this.imagesToDualChannelConfig, config);
          this.startFramesToDualChannelConversion(config);
        }
      },

      /**
       * 取消 转双通道
       */
      cancelDualChannelConversion: function () {
        this.dualChannelCancelled = true;
        this.dualChannelMessage = '正在取消...';

        // 兼容旧标志位
        this.mp4ConvertCancelled = true; // SVGA/MP4/Lottie 都用这个
        this.framesToDualChannelCancelled = true; // 序列帧单独用这个
      },

      /**
       * 打开GIF导出面板
       */
      openGifPanel: function () {
        this.activeRightPanel = 'gif';
      },

      // ==================== 旧方法兼容层 (重定向到新方法) ====================
      openMp4ToSvgaPanel: function () { this.openToSvgaPanel(); },
      openLottieToSvgaPanel: function () { this.openToSvgaPanel(); },
      openFramesToSvgaPanel: function () { this.openToSvgaPanel(); },
      openMp4ToDualChannelPanel: function () { this.openDualChannelPanel(); },
      openLottieToDualChannelPanel: function () { this.openDualChannelPanel(); },
      openFramesToDualChannelPanel: function () { this.openDualChannelPanel(); },

      // 注意：openSVGAPanel 原来是打开“双通道转SVGA”，现在也统一到 to-svga-panel
      openSVGAPanel: function () { this.openToSvgaPanel(); },

      // 注意：openMP4Panel 原来是打开“SVGA转双通道”，现在统一到 dual-channel-panel
      openMP4Panel: function () { this.openDualChannelPanel(); },
    }
  };
})(window);