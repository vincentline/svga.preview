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

  // 模板字符串（与 to-svga-panel.js 保持一致的方式，避免依赖运行时模板编译器）
  var template = `
    <div class="side-panel side-panel--right standard-mp4-panel" :class="{'show': visible}">
      <div class="side-panel-container">
        <!-- 标题区 -->
        <div class="side-panel-header">
          <h3 class="side-panel-title">{{ sourceFormatName }} →→ MP4</h3>
          <div class="side-panel-divider"></div>
        </div>

        <!-- 信息区 -->
        <div class="mp4-info-section">
          <div class="mp4-info-row">{{ sourceInfo.typeLabel }}尺寸：{{ sourceInfo.sizeWH }} 时长：{{ sourceInfo.duration }}</div>
          <div class="mp4-compress-hint">注意：第一次转换需要加载FFmpeg（25M），请耐心等待<br>压缩质量调越低，文件就越小，画面越糊。</div>
        </div>

        <!-- 配置区域 -->
        <div class="mp4-config-section" :class="{disabled: isConverting}">
          <!-- 尺寸 -->
          <div class="mp4-config-item">
            <div class="mp4-config-label">尺寸：</div>
            <div class="mp4-size-container">
              <div class="input-wrapper input-wrapper--lg mp4-size-input-wrapper">
                <input type="number" class="base-input" v-model.number="config.width" @input="onWidthChange"
                  :disabled="isConverting" min="1" max="3000" />
              </div>
              <div class="mp4-size-lock">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4.66667 7.33333V5.33333C4.66667 3.86057 5.86057 2.66667 7.33333 2.66667H8.66667C10.1394 2.66667 11.3333 3.86057 11.3333 5.33333V7.33333M5.33333 7.33333H10.6667C11.403 7.33333 12 7.93029 12 8.66667V12C12 12.7364 11.403 13.3333 10.6667 13.3333H5.33333C4.59695 13.3333 4 12.7364 4 12V8.66667C4 7.93029 4.59695 7.33333 5.33333 7.33333Z"
                    stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="input-wrapper input-wrapper--lg mp4-size-input-wrapper">
                <input type="number" class="base-input" v-model.number="config.height" @input="onHeightChange"
                  :disabled="isConverting" min="1" max="3000" />
              </div>
            </div>
          </div>

          <!-- 帧率修改 -->
          <div class="mp4-config-item">
            <div class="mp4-config-label">帧率修改：</div>
            <div class="mp4-value-container">
              <div class="input-wrapper input-wrapper--lg mp4-value-input-wrapper">
                <input type="number" class="base-input" v-model.number="config.fps" @input="onFpsChange"
                  :disabled="isConverting" min="1" max="120" />
              </div>
              <div class="input-unit">FPS</div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="side-panel-footer">
          <!-- 返回按钮（转换中变为取消按钮） -->
          <button v-if="!isConverting" class="material-btn-back" @click="close" title="返回">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 16L6 10L12 4" stroke="#333333" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <span>取消</span>
          </button>
          <button v-else class="material-btn-back mp4-btn-cancel" @click="close" title="取消转换">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="#ff4444" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <span>取消</span>
          </button>

          <!-- 转换按钮 -->
          <button class="btn-large-secondary" :class="{'mp4-btn-converting': isConverting}"
            :data-progress="progress" :disabled="disabled" @click="startConvert">
            <template v-if="isConverting">
              <span class="mp4-progress-text">{{ progress }}%</span>
              <span class="mp4-stage-text">{{ message }}</span>
            </template>
            <template v-else>
              开始转换标准MP4
            </template>
          </button>
        </div>
      </div>
    </div>
  `;

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Components = global.MeeWoo.Components || {};

  /**
   * 标准MP4转换配置面板组件
   */
  global.MeeWoo.Components.StandardMp4Panel = {
    name: 'StandardMp4Panel',
    template: template,
    props: {
      // 面板可见性
      visible: { type: Boolean, default: false },
      // 源格式名称（用于标题显示）
      sourceFormatName: { type: String, default: '' },
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
    },
    data: function () {
      return {
        // 内部配置对象
        config: {
          width: 300,
          height: 300,
          fps: 30,
          quality: 80,
          muted: false
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

        // 1. 尺寸初始化：优先使用用户上次修改的尺寸
        var useInitialSize = this.initialConfig && this.initialConfig.width > 0 && this.initialConfig.height > 0;
        this.config.width = useInitialSize ? this.initialConfig.width : (source.width || 300);
        this.config.height = useInitialSize ? this.initialConfig.height : (source.height || 300);

        // 2. 帧率初始化（范围1-120）
        if (this.initialConfig && this.initialConfig.fps) {
          this.config.fps = Math.min(120, Math.max(1, this.initialConfig.fps));
        } else {
          this.config.fps = Math.min(120, Math.max(1, source.fps || 30));
        }

        // 3. 压缩质量初始化（范围1-100）
        if (this.initialConfig && this.initialConfig.quality) {
          this.config.quality = Math.min(100, Math.max(1, this.initialConfig.quality));
        } else {
          this.config.quality = 80;
        }

        // 4. 静音初始化
        if (this.initialConfig) {
          this.config.muted = this.initialConfig.muted || false;
        } else {
          this.config.muted = false;
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
       * 帧率变化处理（范围1-120）
       */
      onFpsChange: function () {
        // 限制帧率范围 1-120
        var newFps = Math.max(1, Math.min(120, parseInt(this.config.fps) || 1));
        this.config.fps = newFps;
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