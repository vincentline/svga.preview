(function (global) {
  'use strict';

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Components = global.MeeWoo.Components || {};

  /**
   * 序列帧导出面板组件
   */
  global.MeeWoo.Components.FramesPanel = {
    name: 'FramesPanel',
    template: '#tpl-frames-panel',
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      // 源格式名称（用于标题显示）
      sourceFormatName: {
        type: String,
        default: ''
      },
      sourceInfo: {
        type: Object,
        default: () => ({})
      },
      initialConfig: {
        type: Object,
        default: () => ({})
      },
      isExporting: {
        type: Boolean,
        default: false
      },
      exportProgress: {
        type: Number,
        default: 0
      },
      exportStage: {
        type: String,
        default: ''
      },
      exportMessage: {
        type: String,
        default: ''
      },
      disabled: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        config: {
          width: 0,
          height: 0,
          fps: 24,
          quality: 80,
          transparent: false
        },
        aspectRatio: 1
      }
    },
    watch: {
      visible(newVal) {
        if (newVal) {
          this.initConfig()
        }
      },
      initialConfig: {
        handler(newVal) {
          if (this.visible) {
            this.initConfig()
          }
        },
        deep: true
      }
    },
    methods: {
      initConfig() {
        // 尺寸始终使用当前文件的原始尺寸，不保存上次输入
        this.config = {
          width: this.sourceInfo.width || 0,
          height: this.sourceInfo.height || 0,
          fps: this.initialConfig.fps || this.sourceInfo.fps || 24,
          quality: this.initialConfig.quality || 80,
          transparent: this.initialConfig.transparent || false
        }
        
        // 计算宽高比（始终使用原始文件的比例）
        var originalWidth = this.sourceInfo.width || this.config.width
        var originalHeight = this.sourceInfo.height || this.config.height
        if (originalWidth > 0 && originalHeight > 0) {
          this.aspectRatio = originalWidth / originalHeight
        }
      },
      
      onWidthChange() {
        // 验证宽度范围
        this.config.width = Math.max(1, Math.min(3000, parseInt(this.config.width) || 0))
        // 保持宽高比
        if (this.config.width > 0) {
          this.config.height = Math.round(this.config.width / this.aspectRatio)
          // 验证高度范围
          this.config.height = Math.max(1, Math.min(3000, this.config.height))
          this.$emit('config-change', this.config)
        }
      },
      
      onHeightChange() {
        // 验证高度范围
        this.config.height = Math.max(1, Math.min(3000, parseInt(this.config.height) || 0))
        // 保持宽高比
        if (this.config.height > 0) {
          this.config.width = Math.round(this.config.height * this.aspectRatio)
          // 验证宽度范围
          this.config.width = Math.max(1, Math.min(3000, this.config.width))
          this.$emit('config-change', this.config)
        }
      },
      
      onFpsChange() {
        // 验证帧率范围
        this.config.fps = Math.max(1, Math.min(60, parseInt(this.config.fps) || 0))
        this.$emit('config-change', this.config)
      },
      
      onQualityChange() {
        // 验证质量范围
        this.config.quality = Math.max(10, Math.min(100, parseInt(this.config.quality) || 0))
        this.$emit('config-change', this.config)
      },
      
      startExport() {
        this.$emit('export', this.config)
      },
      
      close() {
        this.$emit('close')
      }
    },
    mounted() {
      if (this.visible) {
        this.initConfig()
      }
    }
  }

})(window);
