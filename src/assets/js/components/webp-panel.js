(function (global) {
  'use strict';

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Components = global.MeeWoo.Components || {};

  /**
   * webp导出面板组件
   * 支持动画WebP导出，显示预估文件大小
   */
  global.MeeWoo.Components.WebpPanel = {
    name: 'WebpPanel',
    template: '#tpl-webp-panel',
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
        default: function () { return {}; }
      },
      initialConfig: {
        type: Object,
        default: function () { return {}; }
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
    data: function () {
      return {
        config: {
          width: 0,
          height: 0,
          fps: 24
        },
        aspectRatio: 1
      };
    },
    
    /**
     * 计算属性：预估文件大小信息
     */
    computed: {
      /**
       * 预估信息（帧数、文件大小）
       */
      estimatedInfo: function () {
        var duration = this.sourceInfo.duration || 0;
        var fps = this.config.fps || 24;
        var width = this.config.width || 0;
        var height = this.config.height || 0;
        
        // 计算总帧数：优先使用 sourceInfo.totalFrames
        var totalFrames = this.sourceInfo.totalFrames || Math.ceil(duration * fps);
        
        // WebP 压缩系数约 0.05（比 GIF 的 0.13 更小）
        var compressionFactor = 0.05;
        var bytesPerFrame = width * height * compressionFactor;
        var totalBytes = bytesPerFrame * totalFrames;
        
        return {
          totalFrames: totalFrames,
          totalBytes: totalBytes,
          fileSizeText: this.formatBytes(totalBytes)
        };
      }
    },
    
    watch: {
      visible: function (newVal) {
        if (newVal) {
          this.initConfig();
        }
      }
      // 注意：不监听 initialConfig，因为 config-change 会更新父组件的配置，
      // 会触发 initialConfig watcher，导致尺寸被重置
    },
    methods: {
      /**
       * 初始化配置
       */
      initConfig: function () {
        // 尺寸逻辑：优先使用用户上次修改的尺寸，否则使用文件原始尺寸
        var useInitialSize = this.initialConfig && this.initialConfig.width > 0 && this.initialConfig.height > 0;
        this.config = {
          width: useInitialSize ? this.initialConfig.width : (this.sourceInfo.width || 0),
          height: useInitialSize ? this.initialConfig.height : (this.sourceInfo.height || 0),
          fps: this.initialConfig.fps || this.sourceInfo.fps || 24
        };
        
        // 计算宽高比（始终使用原始文件的比例，确保缩放时比例正确）
        var originalWidth = this.sourceInfo.width || this.config.width;
        var originalHeight = this.sourceInfo.height || this.config.height;
        if (originalWidth > 0 && originalHeight > 0) {
          this.aspectRatio = originalWidth / originalHeight;
        }
      },
      
      /**
       * 宽度变化处理，保持宽高比
       */
      onWidthChange: function () {
        // 验证宽度范围
        this.config.width = Math.max(1, Math.min(3000, parseInt(this.config.width) || 0));
        // 保持宽高比（需要有效的 aspectRatio）
        if (this.config.width > 0 && this.aspectRatio > 0) {
          this.config.height = Math.round(this.config.width / this.aspectRatio);
          // 验证高度范围
          this.config.height = Math.max(1, Math.min(3000, this.config.height));
        }
        this.$emit('config-change', this.config);
      },
      
      /**
       * 高度变化处理，保持宽高比
       */
      onHeightChange: function () {
        // 验证高度范围
        this.config.height = Math.max(1, Math.min(3000, parseInt(this.config.height) || 0));
        // 保持宽高比（需要有效的 aspectRatio）
        if (this.config.height > 0 && this.aspectRatio > 0) {
          this.config.width = Math.round(this.config.height * this.aspectRatio);
          // 验证宽度范围
          this.config.width = Math.max(1, Math.min(3000, this.config.width));
        }
        this.$emit('config-change', this.config);
      },
      
      /**
       * 帧率变化处理
       */
      onFpsChange: function () {
        // 验证帧率范围
        this.config.fps = Math.max(1, Math.min(60, parseInt(this.config.fps) || 0));
        this.$emit('config-change', this.config);
      },
      
      /**
       * 开始导出
       */
      startExport: function () {
        this.$emit('export', this.config);
      },
      
      /**
       * 关闭面板
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
       * 格式化字节数
       * @param {Number} bytes 字节数
       * @returns {String} 格式化后的字符串
       */
      formatBytes: function (bytes) {
        if (!bytes || bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
      }
    },
    mounted: function () {
      if (this.visible) {
        this.initConfig();
      }
    }
  };

})(window);