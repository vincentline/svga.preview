(function () {
  var template = `
    <div class="side-panel side-panel--right dual-channel-panel" :class="{'show': visible}">
      <div class="side-panel-container">
        <!-- 标题区 -->
        <div class="side-panel-header">
          <h3 class="side-panel-title">转换为双通道MP4格式</h3>
          <div class="side-panel-divider"></div>
        </div>

        <!-- 信息区 -->
        <div class="mp4-info-section">
          <div class="mp4-info-row">{{ sourceInfo.typeLabel }}尺寸：{{ sourceInfo.sizeWH }} 时长：{{ sourceInfo.duration }}</div>
          <div class="mp4-compress-hint">注意：第一次转换需要加载FFmpeg（25M），请耐心等待<br>压缩质量调越低，文件就越小，画面越糊。</div>
        </div>

        <!-- 配置区域 -->
        <div class="mp4-config-section" :class="{disabled: isConverting}">
          <!-- 遮罩位置 -->
          <div class="mp4-config-item">
            <div class="mp4-config-label">遮罩位置：</div>
            <div class="mp4-select-wrapper" :class="{open: showChannelModeDropdown, disabled: isConverting}"
              @click="!isConverting && toggleChannelModeDropdown()">
              <div class="mp4-select-text">
                {{ config.channelMode === 'color-left-alpha-right' ? '左彩右灰' : '左灰右彩' }}
              </div>
              <div class="mp4-select-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>
              <!-- 下拉菜单 -->
              <div class="mp4-select-dropdown">
                <div class="mp4-select-option" :class="{selected: config.channelMode === 'color-left-alpha-right'}"
                  @click.stop="selectChannelMode('color-left-alpha-right')">
                  左彩右灰（左侧彩色通道，右侧Alpha通道）
                </div>
                <div class="mp4-select-option" :class="{selected: config.channelMode === 'alpha-left-color-right'}"
                  @click.stop="selectChannelMode('alpha-left-color-right')">
                  左灰右彩（左侧Alpha通道，右侧彩色通道）
                </div>
              </div>
            </div>
          </div>

          <!-- 尺寸 -->
          <div class="mp4-config-item">
            <div class="mp4-config-label">尺寸：</div>
            <div class="mp4-size-container">
              <div class="input-wrapper input-wrapper--lg mp4-size-input-wrapper">
                <input type="number" class="base-input" v-model.number="config.width" @input="onWidthChange"
                  :disabled="isConverting" min="0" max="3000" />
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
                  :disabled="isConverting" min="0" max="3000" />
              </div>
            </div>
          </div>

          <!-- 压缩到质量 -->
          <div class="mp4-config-item">
            <div class="mp4-config-label">压缩到质量：</div>
            <div class="mp4-value-container">
              <div class="input-wrapper input-wrapper--lg mp4-value-input-wrapper">
                <input type="number" class="base-input" v-model.number="config.quality" :disabled="isConverting"
                  min="1" max="100" />
              </div>
              <div class="input-unit">%</div>
            </div>
          </div>

          <!-- 帧率修改 -->
          <div class="mp4-config-item">
            <div class="mp4-config-label">帧率修改：</div>
            <div class="mp4-value-container">
              <div class="input-wrapper input-wrapper--lg mp4-value-input-wrapper">
                <input type="number" class="base-input" v-model.number="config.fps" :disabled="isConverting"
                  min="1" max="120" />
              </div>
              <div class="input-unit">FPS</div>
            </div>
          </div>

          <!-- 静音 -->
          <div class="mp4-config-item">
            <div class="mp4-config-label">静音</div>
            <div class="mp4-mute-toggle" :class="{active: config.muted, disabled: isConverting}"
              @click="!isConverting && (config.muted = !config.muted)">
              <div class="mp4-mute-toggle-handle"></div>
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
          <button v-else class="material-btn-back mp4-btn-cancel" @click="cancel" title="取消转换">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="#ff4444" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <span>取消</span>
          </button>

          <!-- 转换按钮 -->
          <button class="btn-large-secondary" :class="{'mp4-btn-converting': isConverting}"
            :data-progress="progress" :disabled="disabled" @click="start">
            <template v-if="isConverting">
              <span class="mp4-progress-text">{{ progress }}%</span>
              <span class="mp4-stage-text">{{ message }}</span>
            </template>
            <template v-else>
              开始转换双通道MP4
            </template>
          </button>
        </div>
      </div>
    </div>
  `;

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Components = window.MeeWoo.Components || {};

  /**
   * 通用转双通道 MP4 面板组件
   * 适用于: SVGA, Lottie, Frames, MP4 转 Dual Channel MP4
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
   * 
   * 与 panel-mixin.js 的关系：
   * - 接收 panel-mixin.js 管理的 activeRightPanel 状态来控制显示/隐藏
   * - 通过事件向父组件传递用户操作，由 panel-mixin.js 处理后续逻辑
   */
  window.MeeWoo.Components.DualChannelPanel = {
    template: template,
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      sourceInfo: {
        type: Object,
        default: function () {
          return { sizeWH: '', duration: '', typeLabel: '' };
        }
      },
      initialConfig: {
        type: Object,
        default: null
      },
      isConverting: {
        type: Boolean,
        default: false
      },
      progress: {
        type: Number,
        default: 0
      },
      message: {
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
          channelMode: 'color-left-alpha-right',
          width: 0,
          height: 0,
          quality: 80,
          fps: 30,
          muted: false,
          aspectRatio: 1
        },
        showChannelModeDropdown: false
      };
    },
    watch: {
      visible: function (newVal) {
        if (newVal && this.initialConfig) {
          // 深拷贝初始配置到本地配置
          this.config = JSON.parse(JSON.stringify(this.initialConfig));
          // 计算宽高比
          if (this.config.width && this.config.height) {
            this.config.aspectRatio = this.config.width / this.config.height;
          }
        }
      }
    },
    methods: {
      close: function () {
        this.$emit('close');
      },
      cancel: function () {
        this.$emit('cancel');
      },
      start: function () {
        this.$emit('convert', this.config);
      },
      toggleChannelModeDropdown: function () {
        this.showChannelModeDropdown = !this.showChannelModeDropdown;
      },
      selectChannelMode: function (mode) {
        this.config.channelMode = mode;
        this.showChannelModeDropdown = false;
      },
      onWidthChange: function () {
        var w = this.config.width;
        if (w > 0 && this.config.aspectRatio > 0) {
          this.config.height = Math.round(w / this.config.aspectRatio);
        }
      },
      onHeightChange: function () {
        var h = this.config.height;
        if (h > 0 && this.config.aspectRatio > 0) {
          this.config.width = Math.round(h * this.config.aspectRatio);
        }
      }
    }
  };
})();
