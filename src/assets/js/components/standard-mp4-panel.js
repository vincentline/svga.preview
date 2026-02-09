/**
 * @file standard-mp4-panel.js
 * @description 标准MP4转换配置面板组件
 * @author MeeWoo Team
 * @date 2026-02-08
 * 
 * 功能说明：
 * 1. 配置 MP4 转换的宽度、高度、帧率
 * 2. 实时显示转换进度和状态
 * 3. 自动保持宽高比例
 * 
 * 使用方式：
 * ```html
 * <standard-mp4-panel 
 *   :visible="showStandardMp4Panel" 
 *   :source-info="standardMp4SourceInfo"
 *   :initial-config="standardMp4Config"
 *   :is-converting="isConvertingStandardMp4"
 *   :progress="standardMp4Progress"
 *   :message="standardMp4Message"
 *   :disabled="isGlobalTaskRunning"
 *   :current-module="currentModule"
 *   @close="closeStandardMp4Panel"
 *   @cancel="cancelStandardMp4Conversion"
 *   @convert="startStandardMp4Conversion">
 * </standard-mp4-panel>
 * ```
 */

(function (global) {
  'use strict';

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Components = global.MeeWoo.Components || {};

  /**
   * 标准MP4转换配置面板组件
   */
  global.MeeWoo.Components.StandardMp4Panel = {
    name: 'StandardMp4Panel',
    template: '#tpl-standard-mp4-panel',
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
      disabled: { type: Boolean, default: false },
      // 当前模块
      currentModule: { type: String, default: 'mp4' }
    },
    mounted: function () {
      console.log('StandardMp4Panel组件已挂载', this.visible);
    },
    watch: {
      // 面板打开时初始化参数
      visible: function (newVal) {
        console.log('StandardMp4Panel visible变化:', newVal);
      }
    },
    data: function () {
      return {
        // 内部配置对象
        config: {
          width: 300,
          height: 300,
          fps: 30
        }
      };
    },
    watch: {
      // 面板打开时初始化参数
      visible: function (newVal) {
        if (newVal) {
          this.initParams();
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
          if (source.width && source.height) {
            var ratio = source.height / source.width;
            this.config.height = Math.floor(this.config.width * ratio);
          }
        } else {
          this.config.width = source.width || 300;
          this.config.height = source.height || 300;
        }

        // 2. 帧率初始化
        if (this.initialConfig && this.initialConfig.fps) {
          this.config.fps = this.initialConfig.fps;
        } else {
          this.config.fps = Math.min(60, Math.max(1, source.fps || 30));
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
      }
    }
  };

})(window);