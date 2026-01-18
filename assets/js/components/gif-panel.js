/**
 * @file gif-panel.js
 * @description GIF 导出配置面板组件
 * @author SvgaPreview Team
 * @date 2026-01-18
 */

(function (global) {
  'use strict';

  global.SvgaPreview = global.SvgaPreview || {};
  global.SvgaPreview.Components = global.SvgaPreview.Components || {};

  /**
   * GIF 导出配置面板组件
   * 功能：
   * 1. 配置 GIF 导出的宽度、高度、帧率、质量
   * 2. 支持透明背景和抖动算法配置
   * 3. 实时显示导出进度和状态
   * 4. 自动保持宽高比例
   */
  global.SvgaPreview.Components.GifPanel = {
    name: 'GifPanel',
    template: '#tpl-gif-panel',
    props: {
      // 面板可见性
      visible: { type: Boolean, default: false },
      // 帧源信息（宽、高、FPS、时长等）
      sourceInfo: { type: Object, default: function () { return {}; } },
      // 初始配置（用于回显用户上次保存的偏好）
      initialConfig: { type: Object, default: function () { return null; } },
      // 缩略图背景色Key
      bgColorKey: { type: String, default: 'transparent' },
      // 当前背景色值
      currentBgColor: { type: String, default: '#ffffff' },
      // 是否正在导出
      isExporting: { type: Boolean, default: false },
      // 导出进度 (0-1)
      exportProgress: { type: Number, default: 0 },
      // 导出阶段描述
      exportStage: { type: String, default: '' },
      // 导出状态消息
      exportMessage: { type: String, default: '' }
    },
    data: function () {
      return {
        // 内部配置对象
        config: {
          width: 300,
          height: 300,
          fps: 30,
          quality: 10,
          transparent: false,
          dither: false,
          ditherColor: '#ffffff'
        }
      };
    },
    watch: {
      // 面板打开时初始化参数
      visible: function (newVal) {
        if (newVal) {
          this.initParams();
        }
      },
      // 深度监听配置变化，向父组件抛出事件以便持久化
      config: {
        handler: function (val) {
          this.$emit('config-change', val);
        },
        deep: true
      }
    },
    methods: {
      /**
       * 初始化导出参数
       * 逻辑：
       * 1. 优先使用用户上次保存的偏好（initialConfig）
       * 2. 如果无偏好，则使用素材原始尺寸和帧率
       * 3. 保持宽高比
       */
      initParams: function () {
        var source = this.sourceInfo;

        // 1. 尺寸初始化
        if (this.initialConfig && this.initialConfig.width > 0) {
          // 有用户偏好：保持宽度，按当前素材比例重算高度
          this.config.width = this.initialConfig.width;
          if (source.width && source.height) {
            var ratio = source.height / source.width;
            this.config.height = Math.floor(this.config.width * ratio);
          }
        } else {
          // 无偏好：使用原始尺寸
          this.config.width = source.width || 300;
          this.config.height = source.height || 300;
        }

        // 2. 帧率初始化
        if (this.initialConfig && this.initialConfig.fps) {
          this.config.fps = this.initialConfig.fps;
        } else {
          this.config.fps = Math.min(60, Math.max(1, source.fps || 30));
        }

        // 3. 其他参数继承
        if (this.initialConfig) {
          if (this.initialConfig.quality) this.config.quality = this.initialConfig.quality;
          if (this.initialConfig.transparent !== undefined) this.config.transparent = this.initialConfig.transparent;
          if (this.initialConfig.dither !== undefined) this.config.dither = this.initialConfig.dither;
        }
      },

      /**
       * 关闭面板
       * 如果正在导出，会提示确认取消
       */
      close: function () {
        if (this.isExporting) {
          if (!confirm('正在导出中，确定要取消吗？')) {
            return;
          }
          this.$emit('cancel');
        }
        this.$emit('close');
      },

      /**
       * 宽度变化处理
       * 保持原始宽高比自动计算高度
       */
      onWidthChange: function () {
        var source = this.sourceInfo;
        if (!source.width || !source.height) return;

        var ratio = source.height / source.width;
        var newWidth = Math.max(1, Math.min(1920, parseInt(this.config.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.config.width = newWidth;
        this.config.height = newHeight;
      },

      /**
       * 高度变化处理
       * 保持原始宽高比自动计算宽度
       */
      onHeightChange: function () {
        var source = this.sourceInfo;
        if (!source.width || !source.height) return;

        var ratio = source.width / source.height;
        var newHeight = Math.max(1, Math.min(1920, parseInt(this.config.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.config.width = newWidth;
        this.config.height = newHeight;
      },

      /**
       * 开始导出
       * 将当前配置回传给父组件
       */
      startExport: function () {
        this.$emit('export', this.config);
      }
    }
  };

})(window);
