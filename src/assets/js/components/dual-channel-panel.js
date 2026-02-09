/**
 * @file dual-channel-panel.js
 * @description 双通道MP4转换配置面板组件
 * @author MeeWoo Team
 * @date 2026-02-08
 * 
 * 功能说明：
 * 1. 配置双通道MP4转换的宽度、高度、帧率
 * 2. 实时显示转换进度和状态
 * 3. 自动保持宽高比例
 * 
 * 使用方式：
 * ```html
 * <dual-channel-panel 
 *   :visible="activeRightPanel === 'dual-channel'"
 *   :source-info="dualChannelSourceInfo"
 *   :initial-config="dualChannelConfig"
 *   :is-converting="isConvertingToDualChannel"
 *   :progress="dualChannelProgress"
 *   :message="dualChannelMessage"
 *   :disabled="isGlobalTaskRunning"
 *   @close="closeRightPanel"
 *   @cancel="cancelDualChannelConversion"
 *   @convert="handleDualChannelConvert">
 * </dual-channel-panel>
 * ```
 */

(function (global) {
  'use strict';

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Components = global.MeeWoo.Components || {};

  /**
   * 双通道MP4转换配置面板组件
   */
  global.MeeWoo.Components.DualChannelPanel = {
    name: 'DualChannelPanel',
    template: '#tpl-dual-channel-panel',
    props: {
      // 面板可见性
      visible: { type: Boolean, default: false },
      // 源文件信息
      sourceInfo: { type: Object, default: function () { return {}; } },
      // 初始配置
      initialConfig: { type: Object, default: function () { return null; } },
      // 是否正在转换
      isConverting: { type: Boolean, default: false },
      // 转换进度
      progress: { type: Number, default: 0 },
      // 转换状态消息
      message: { type: String, default: '' },
      // 是否禁用
      disabled: { type: Boolean, default: false }
    },
    mounted: function () {
      console.log('DualChannelPanel组件已挂载', this.visible);
    },
    data: function () {
      return {
        // 内部配置对象
        config: {
          channelMode: 'color-left-alpha-right',
          width: 300,
          height: 300,
          fps: 30,
          quality: 80,
          muted: false
        },
        // 下拉菜单状态
        showChannelModeDropdown: false
      };
    },
    watch: {
      // 面板打开时初始化参数
      visible: function (newVal) {
        console.log('DualChannelPanel visible变化:', newVal);
        if (newVal) {
          this.initParams();
          console.log('DualChannelPanel初始化参数完成');
        }
      }
    },
    methods: {
      /**
       * 初始化转换参数
       */
      initParams: function () {
        var source = this.sourceInfo;

        // 1. 尺寸初始化
        if (this.initialConfig && this.initialConfig.width > 0) {
          this.config.width = this.initialConfig.width;
          if (this.initialConfig.height > 0) {
            var ratio = this.initialConfig.height / this.initialConfig.width;
            this.config.height = Math.floor(this.config.width * ratio);
          } else if (source.width && source.height) {
            var ratio = source.height / source.width;
            this.config.height = Math.floor(this.config.width * ratio);
          }
        } else if (source.width && source.height) {
          this.config.width = source.width;
          this.config.height = source.height;
        } else {
          this.config.width = 300;
          this.config.height = 300;
        }

        // 2. 帧率初始化
        if (this.initialConfig && this.initialConfig.fps) {
          this.config.fps = this.initialConfig.fps;
        } else if (source.fps) {
          this.config.fps = Math.min(60, Math.max(1, source.fps));
        } else {
          this.config.fps = 30;
        }

        // 3. 其他配置初始化
        if (this.initialConfig) {
          this.config.quality = this.initialConfig.quality || 80;
          this.config.muted = this.initialConfig.muted || false;
          this.config.channelMode = this.initialConfig.channelMode || 'color-left-alpha-right';
        }
      },

      /**
       * 关闭面板
       */
      close: function () {
        if (this.isConverting) {
          if (!confirm('正在转换中，确定要取消吗？')) {
            return;
          }
          this.$emit('cancel');
        }
        this.$emit('close');
      },

      /**
       * 宽度变化处理
       */
      onWidthChange: function () {
        var source = this.sourceInfo;
        if (!source.width || !source.height) return;

        var ratio = source.height / source.width;
        var newWidth = Math.max(1, Math.min(3000, parseInt(this.config.width) || 0));
        var newHeight = Math.floor(newWidth * ratio);

        this.config.width = newWidth;
        this.config.height = newHeight;
      },

      /**
       * 高度变化处理
       */
      onHeightChange: function () {
        var source = this.sourceInfo;
        if (!source.width || !source.height) return;

        var ratio = source.width / source.height;
        var newHeight = Math.max(1, Math.min(3000, parseInt(this.config.height) || 0));
        var newWidth = Math.floor(newHeight * ratio);

        this.config.width = newWidth;
        this.config.height = newHeight;
      },

      /**
       * 开始转换
       */
      startConvert: function () {
        this.$emit('convert', this.config);
      },

      /**
       * 开始转换（模板中使用）
       */
      start: function () {
        this.startConvert();
      },

      /**
       * 取消转换（模板中使用）
       */
      cancel: function () {
        this.$emit('cancel');
      },

      /**
       * 切换通道模式下拉菜单
       */
      toggleChannelModeDropdown: function () {
        this.showChannelModeDropdown = !this.showChannelModeDropdown;
      },

      /**
       * 选择通道模式
       */
      selectChannelMode: function (mode) {
        this.config.channelMode = mode;
        this.showChannelModeDropdown = false;
      }
    }
  };

})(window);