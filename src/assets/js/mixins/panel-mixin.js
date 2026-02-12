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

        // ==================== 其他面板状态 (补充默认值，避免undefined) ====================
        showStandardMp4Panel: false,
        isExportingGIF: false,
        isExportingFrames: false,
        isExportingWebp: false,
        isConvertingStandardMp4: false
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
        } else if (this.activeRightPanel === 'frames' && this.isExportingFrames) {
          if (!confirm('正在导出序列帧中，确定要取消吗？')) return;
          this.cancelFramesExport();
        } else if (this.activeRightPanel === 'webp' && this.isExportingWebp) {
          if (!confirm('正在导出WebP中，确定要取消吗？')) return;
          this.cancelWebpExport();
        } else if (this.showStandardMp4Panel && this.isConvertingStandardMp4) {
          if (!confirm('正在转换中，确定要取消吗？')) return;
          this.cancelStandardMp4Conversion();
        }

        // 关闭所有类型的右侧面板
        this.activeRightPanel = null;
        this.showStandardMp4Panel = false;
        
        /*
        // 移除手动创建的双通道面板元素
        setTimeout(function() {
          var panelElements = document.querySelectorAll('.dual-channel-panel, .dual-channel-panel-root');
          panelElements.forEach(function(element) {
            element.classList.remove('show');
            // 300ms后完全移除元素
            setTimeout(function() {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            }, 300);
          });
        }, 0);
        */
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
        } else if (panelName === 'frames') {
          targetPanel = 'frames';
        } else if (panelName === 'webp') {
          targetPanel = 'webp';
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
        } else if (panelName === 'showFramesPanel') {
          targetPanel = 'frames';
        } else if (panelName === 'showWebpPanel') {
          targetPanel = 'webp';
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
          sourceInfo.name = this.mp4.fileInfo.name || '';
          sourceInfo.sizeWH = this.mp4.fileInfo.sizeWH || '';
          sourceInfo.duration = this.mp4.fileInfo.duration || '';
          sourceInfo.fileSize = this.utils ? this.utils.formatBytes(this.mp4.fileInfo.size) : '';
          sourceInfo.fps = 30; // MP4默认
          sourceInfo.typeLabel = 'MP4';

          config.width = this.mp4.originalWidth || 300;
          config.height = this.mp4.originalHeight || 300;
          config.aspectRatio = (this.mp4.originalWidth / this.mp4.originalHeight) || 1;
        } else if (this.currentModule === 'lottie') {
          sourceInfo.name = this.lottie.fileInfo.name || '';
          sourceInfo.sizeWH = this.lottie.fileInfo.sizeWH || '';
          sourceInfo.duration = this.lottie.fileInfo.duration || '';
          sourceInfo.fileSize = this.utils ? this.utils.formatBytes(this.lottie.fileInfo.size) : '';
          sourceInfo.fps = this.lottie.fileInfo.fps || 30;
          sourceInfo.typeLabel = 'Lottie';

          config.width = this.lottie.originalWidth || 300;
          config.height = this.lottie.originalHeight || 300;
          config.fps = this.lottie.fileInfo.fps || 30;
          config.aspectRatio = (this.lottie.originalWidth / this.lottie.originalHeight) || 1;
        } else if (this.currentModule === 'frames') {
          sourceInfo.name = this.frames.fileInfo.name || '';
          sourceInfo.sizeWH = this.frames.fileInfo.sizeWH || '';
          sourceInfo.duration = this.frames.fileInfo.duration || '';
          sourceInfo.fileSize = this.utils ? this.utils.formatBytes(this.frames.fileInfo.size) : '';
          sourceInfo.fps = this.frames.fileInfo.fps || 25;
          sourceInfo.typeLabel = '序列帧';

          config.width = this.frames.originalWidth || 300;
          config.height = this.frames.originalHeight || 300;
          config.fps = this.frames.fileInfo.fps || 25;
          config.aspectRatio = (this.frames.originalWidth / this.frames.originalHeight) || 1;
        } else if (this.currentModule === 'yyeva') {
          // 双通道转SVGA也合并进来
          sourceInfo.name = this.yyeva.fileInfo.name || '';
          sourceInfo.sizeWH = this.yyeva.fileInfo.sizeWH || '';
          sourceInfo.duration = this.yyeva.fileInfo.duration || '';
          sourceInfo.fileSize = this.utils ? this.utils.formatBytes(this.yyeva.fileInfo.size) : '';
          sourceInfo.fps = this.yyeva.fileInfo.fps || 30;
          sourceInfo.typeLabel = '双通道MP4';

          config.width = this.yyeva.displayWidth || 300;
          config.height = this.yyeva.displayHeight || 300;
          config.fps = this.yyeva.fileInfo.fps || 30;
          config.aspectRatio = (this.yyeva.displayWidth / this.yyeva.displayHeight) || 1;
        }

        this.toSvgaSourceInfo = sourceInfo;
        this.toSvgaConfig = config;
        this.activeRightPanel = 'to-svga';
        
        // 插队加载ffmpeg
        if (this.loadLibrary) {
          this.loadLibrary(['ffmpeg'], true).then(function() {
          }).catch(function(error) {
            console.error('ffmpeg加载失败:', error);
          });
        }
      },

      /**
       * 统一处理 转SVGA 逻辑
       */
      handleToSvgaConvert: function (config) {
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
          this.yyevaToSvgaConfig = Object.assign({}, this.yyevaToSvgaConfig || {}, config);
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
       * 打开转双通道面板 (统一入口) - 最终修复版
       */
      openDualChannelPanel: function () {
        console.log('=== 打开双通道MP4面板：开始 ===');
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

        // 根据当前模块设置源信息（增加更强大的容错处理）
        if (this.currentModule === 'svga') {
          // 安全获取svga相关属性
          var svga = this.svga || {};
          var fileInfo = svga.fileInfo || {};
          sourceInfo.name = fileInfo.name || '';
          sourceInfo.sizeWH = fileInfo.sizeWH || '';
          sourceInfo.duration = fileInfo.duration || '';
          sourceInfo.fileSize = this.utils && fileInfo.size ? this.utils.formatBytes(fileInfo.size) : '';
          sourceInfo.fps = fileInfo.fps || 30;
          sourceInfo.typeLabel = 'SVGA';

          config.width = svga.originalWidth || 300;
          config.height = svga.originalHeight || 300;
          config.fps = fileInfo.fps || 30;
          config.aspectRatio = svga.originalWidth && svga.originalHeight ? (svga.originalWidth / svga.originalHeight) : 1;
        } else if (this.currentModule === 'mp4') {
          // 安全获取mp4相关属性
          var mp4 = this.mp4 || {};
          var fileInfo = mp4.fileInfo || {};
          sourceInfo.name = fileInfo.name || '';
          sourceInfo.sizeWH = fileInfo.sizeWH || '';
          sourceInfo.duration = fileInfo.duration || '';
          sourceInfo.fileSize = this.utils && fileInfo.size ? this.utils.formatBytes(fileInfo.size) : '';
          sourceInfo.fps = 30;
          sourceInfo.typeLabel = 'MP4';

          config.width = mp4.originalWidth || 300;
          config.height = mp4.originalHeight || 300;
          config.aspectRatio = mp4.originalWidth && mp4.originalHeight ? (mp4.originalWidth / mp4.originalHeight) : 1;
        } else if (this.currentModule === 'lottie') {
          // 安全获取lottie相关属性
          var lottie = this.lottie || {};
          var fileInfo = lottie.fileInfo || {};
          sourceInfo.name = fileInfo.name || '';
          sourceInfo.sizeWH = fileInfo.sizeWH || '';
          sourceInfo.duration = fileInfo.duration || '';
          sourceInfo.fileSize = this.utils && fileInfo.size ? this.utils.formatBytes(fileInfo.size) : '';
          sourceInfo.fps = fileInfo.fps || 30;
          sourceInfo.typeLabel = 'Lottie';

          config.width = lottie.originalWidth || 300;
          config.height = lottie.originalHeight || 300;
          config.fps = fileInfo.fps || 30;
          config.aspectRatio = lottie.originalWidth && lottie.originalHeight ? (lottie.originalWidth / lottie.originalHeight) : 1;
          config.muted = true; // Lottie无声
        } else if (this.currentModule === 'frames') {
          // 安全获取frames相关属性
          var frames = this.frames || {};
          var fileInfo = frames.fileInfo || {};
          sourceInfo.name = fileInfo.name || '';
          sourceInfo.sizeWH = fileInfo.sizeWH || '';
          sourceInfo.duration = fileInfo.duration || '';
          sourceInfo.fileSize = this.utils && fileInfo.size ? this.utils.formatBytes(fileInfo.size) : '';
          sourceInfo.fps = fileInfo.fps || 25;
          sourceInfo.typeLabel = '序列帧';

          config.width = frames.originalWidth || 300;
          config.height = frames.originalHeight || 300;
          config.fps = fileInfo.fps || 25;
          config.aspectRatio = frames.originalWidth && frames.originalHeight ? (frames.originalWidth / frames.originalHeight) : 1;
          config.muted = true; // 序列帧无声
        }

        // 强制设置默认值，确保不会是undefined
        sourceInfo.name = sourceInfo.name || '';
        sourceInfo.sizeWH = sourceInfo.sizeWH || '';
        sourceInfo.duration = sourceInfo.duration || '';
        sourceInfo.fileSize = sourceInfo.fileSize || '';
        sourceInfo.fps = sourceInfo.fps || 30;
        sourceInfo.typeLabel = sourceInfo.typeLabel || '未知';

        config.channelMode = config.channelMode || 'color-left-alpha-right';
        config.width = config.width || 300;
        config.height = config.height || 300;
        config.quality = config.quality || 80;
        config.fps = config.fps || 30;
        config.muted = config.muted || false;
        config.aspectRatio = config.aspectRatio || 1;

        console.log('设置双通道MP4源信息和配置:', sourceInfo, config);
        this.dualChannelSourceInfo = sourceInfo;
        this.dualChannelConfig = config;
        
        // 关闭其他面板
        console.log('关闭其他面板并打开双通道MP4面板');
        this.showStandardMp4Panel = false;
        
        // 核心修复：直接设置activeRightPanel
        console.log('直接设置activeRightPanel为dual-channel，当前值:', this.activeRightPanel);
        this.activeRightPanel = 'dual-channel';
        console.log('设置后activeRightPanel:', this.activeRightPanel);

        // 加载ffmpeg（和转SVGA面板保持一致）
        console.log('加载ffmpeg库');
        if (this.loadLibrary) {
          this.loadLibrary(['ffmpeg'], true).catch(function(error) {
            console.error('ffmpeg加载失败:', error);
          });
        }
        
        // 增强版：确保面板渲染完成并强制更新
        var self = this;
        
        /*
        // 直接在DOM中查找并操作面板元素（不依赖Vue更新）
        function findAndShowPanel() {
          // 尝试多种选择器查找面板元素
          var selectors = [
            'dual-channel-panel',
            '.dual-channel-panel',
            '.dual-channel-panel-root',
            'body > .dual-channel-panel',
            'body > .dual-channel-panel-root'
          ];
          
          var panelElement = null;
          for (var i = 0; i < selectors.length; i++) {
            var selector = selectors[i];
            panelElement = document.querySelector(selector);
            if (panelElement && panelElement.nodeType !== 8) {
              console.log('找到双通道MP4面板元素（使用选择器）:', selector, panelElement);
              break;
            }
          }
          
          if (panelElement) {
            // 确保show类被添加
            if (panelElement.classList && !panelElement.classList.contains('show')) {
              panelElement.classList.add('show');
              console.log('添加show类到双通道MP4面板元素');
            }
            
            // 移除内联样式，使用CSS定义的样式
            try {
              if (panelElement.style) {
                panelElement.style.cssText = '';
                console.log('移除内联样式，使用CSS定义的样式');
              }
            } catch (error) {
              console.error('移除内联样式时出错:', error);
            }
          } else {
            console.error('未找到双通道MP4面板元素');
          }
        }
        
        // 立即尝试显示面板
        findAndShowPanel();
        */
        
        // 第一次nextTick：确保Vue响应状态变化
        console.log('Vue.nextTick执行，强制更新组件');
        this.$nextTick(function() {
          // 强制Vue更新
          if (self.$forceUpdate) {
            console.log('调用$forceUpdate强制更新组件');
            self.$forceUpdate();
          }
          
          /*
          // 再次尝试显示面板
          findAndShowPanel();
          
          // 第二次nextTick：确保DOM更新完成
          self.$nextTick(function() {
            // 等待300ms让模板渲染
            console.log('再次执行Vue.nextTick，等待300ms让模板渲染');
            setTimeout(() => {
              // 最后尝试显示面板
              findAndShowPanel();
              
              // 新增：如果Vue渲染失败，使用全局方法手动创建和显示面板
              setTimeout(() => {
                var panelElement = document.querySelector('.dual-channel-panel') || 
                                  document.querySelector('.dual-channel-panel-root');
                if (!panelElement || panelElement.style.display === 'none' || panelElement.style.visibility === 'hidden') {
                  console.error('Vue渲染失败，尝试使用全局方法手动创建和显示面板');
                  // 使用全局方法手动显示面板
                  if (window.MeeWoo && window.MeeWoo.Utils && window.MeeWoo.Utils.showDualChannelPanel) {
                    console.log('使用全局方法手动显示面板');
                    window.MeeWoo.Utils.showDualChannelPanel(self.dualChannelSourceInfo, self.dualChannelConfig);
                  }
                } else {
                  console.log('Vue渲染成功，双通道MP4面板已显示');
                }
              }, 500);
            }, 300);
          });
          */
        });
        
        console.log('=== 打开双通道MP4面板：完成 ===');
      },

      /**
       * 统一处理 转双通道 逻辑
       */
      handleDualChannelConvert: function (config) {
        this.dualChannelConfig = config;

        // 标记转换状态
        this.isConvertingToDualChannel = true;
        this.dualChannelProgress = 0;
        this.dualChannelMessage = '准备转换...';
        this.dualChannelCancelled = false;

        // 根据模块分发（增加容错，避免undefined）
        if (this.currentModule === 'svga') {
          // 兼容旧逻辑：startMP4Conversion 使用 svgaToDualChannelConfig
          this.svgaToDualChannelConfig = Object.assign({}, this.svgaToDualChannelConfig || {}, config);
          this.startMP4Conversion(config);
        } else if (this.currentModule === 'mp4') {
          this.mp4ToDualChannelConfig = Object.assign({}, this.mp4ToDualChannelConfig || {}, config);
          this.startMp4ToDualChannelConversion(config);
        } else if (this.currentModule === 'lottie') {
          this.lottieToDualChannelConfig = Object.assign({}, this.lottieToDualChannelConfig || {}, config);
          this.startLottieToDualChannelConversion(config);
        } else if (this.currentModule === 'frames') {
          this.imagesToDualChannelConfig = Object.assign({}, this.imagesToDualChannelConfig || {}, config);
          this.startFramesToDualChannelConversion(config);
        }
      },

      /**
       * 取消 转双通道
       */
      cancelDualChannelConversion: function () {
        this.dualChannelCancelled = true;
        this.dualChannelMessage = '正在取消...';
        this.isConvertingToDualChannel = false;

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

      // 注意：openMP4Panel 原来是打开"SVGA转双通道"，现在统一到 dual-channel-panel
      openMP4Panel: function () { this.openDualChannelPanel(); },
      
      // 添加SVGA转双通道MP4的方法重定向
      openSvgaToDualChannelPanel: function () { this.openDualChannelPanel(); },
      openYyevaToSvgaPanel: function () { this.openToSvgaPanel(); },
      openLottieToDualChannelPanel: function () { this.openDualChannelPanel(); },
      openFramesToDualChannelPanel: function () { this.openDualChannelPanel(); },
      openStandardMp4Panel: function () { this.showStandardMp4Panel = true; this.activeRightPanel = null; },
      closeStandardMp4Panel: function () { this.showStandardMp4Panel = false; },
      openMaterialPanel: function () { this.activeRightPanel = 'material'; },
      openFramesPanel: function () { this.activeRightPanel = 'frames'; },
      openWebpPanel: function () { this.activeRightPanel = 'webp'; },
      openChromaKeyPanel: function () { this.activeRightPanel = 'chromakey'; }
    }
  };
})(window);