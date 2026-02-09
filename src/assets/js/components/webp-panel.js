(function (global) {
  'use strict';

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Components = global.MeeWoo.Components || {};

  /**
   * webp导出面板组件
   */
  global.MeeWoo.Components.WebpPanel = {
    name: 'WebpPanel',
    template: '#tpl-webp-panel',
    props: {
      visible: {
        type: Boolean,
        default: false
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
          fps: 24
        },
        aspectRatio: 1
      }
    },
    watch: {
      visible(newVal) {
        console.log('[调试] webp-panel visible属性变化:', newVal);
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
        // 初始化配置
        this.config = {
          width: this.initialConfig.width || this.sourceInfo.width || 0,
          height: this.initialConfig.height || this.sourceInfo.height || 0,
          fps: this.initialConfig.fps || this.sourceInfo.fps || 24
        }
        
        // 计算宽高比
        if (this.config.width > 0 && this.config.height > 0) {
          this.aspectRatio = this.config.width / this.config.height
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
      
      startExport() {
        this.$emit('export', this.config)
      },
      
      close() {
        this.$emit('close')
      }
    },
    mounted() {
      console.log('[调试] webp-panel 组件已挂载，初始visible:', this.visible);
      console.log('[调试] webp-panel 组件DOM元素:', this.$el);
      if (this.visible) {
        this.initConfig()
      }
    }
  }

})(window);