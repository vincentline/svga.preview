/**
 * @file standard-mp4-panel.js
 * @description 普通MP4转换面板组件
 * @author MeeWoo Team
 * @date 2026-01-18
 * 
 * 功能说明：
 * 1. 提供将各种格式（SVGA、Lottie、MP4等）转换为普通MP4的配置选项
 * 2. 支持自定义尺寸、压缩质量和帧率
 * 3. 显示转换进度和状态
 * 4. 支持取消转换操作
 * 
 * 使用方式：
 * ```html
 * <standard-mp4-panel 
 *   :visible="activeRightPanel === 'standard-mp4'" 
 *   :source-info="standardMp4SourceInfo"
 *   :initial-config="standardMp4Config"
 *   :is-converting="isConvertingToStandardMp4"
 *   :progress="standardMp4Progress"
 *   :message="standardMp4Message"
 *   :disabled="isGlobalTaskRunning"
 *   :current-module="currentModule"
 *   @close="closeRightPanel"
 *   @cancel="cancelStandardMp4Conversion"
 *   @convert="handleStandardMp4Convert">
 * </standard-mp4-panel>
 * ```
 * 
 * 与 panel-mixin.js 的关系：
 * - 接收 panel-mixin.js 管理的 activeRightPanel 状态来控制显示/隐藏
 * - 通过事件向父组件传递用户操作，由 panel-mixin.js 处理后续逻辑
 */

(function () {
  var template = `

    <div class="side-panel side-panel--right standard-mp4-panel" :class="{'show': visible}">
      <div class="side-panel-container">
        <div class="side-panel-header">
          <h3 class="side-panel-title">转换为普通MP4格式</h3>
          <div class="side-panel-divider"></div>
        </div>
        <div class="mp4-info-section">
          <div class="mp4-info-row">
            {{ sourceInfo.typeLabel }}尺寸：{{ sourceInfo.sizeWH }} 时长：{{ sourceInfo.duration }}
          </div>
          <div class="mp4-compress-hint">注意：第一次转换需要加载FFmpeg（25M），请耐心等待<br>压缩质量调越低，文件就越小，画面越糊。</div>
        </div>
        <div class="mp4-config-section" :class="{disabled: isConverting}">
          <div class="mp4-config-item">
            <div class="mp4-config-label">尺寸：</div>
            <div class="mp4-size-container">
              <div class="input-wrapper input-wrapper--lg mp4-size-input-wrapper">
                <input type="number" class="base-input" v-model.number="config.width"
                  @input="onWidthChange" :disabled="isConverting" min="1" max="3000" />
              </div>
              <div class="mp4-size-lock">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4.66667 7.33333V5.33333C4.66667 3.86057 5.86057 2.66667 7.33333 2.66667H8.66667C10.1394 2.66667 11.3333 3.86057 11.3333 5.33333V7.33333M5.33333 7.33333H10.6667C11.403 7.33333 12 7.93029 12 8.66667V12C12 12.7364 11.403 13.3333 10.6667 13.3333H5.33333C4.59695 13.3333 4 12.7364 4 12V8.66667C4 7.93029 4.59695 7.33333 5.33333 7.33333Z"
                    stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="input-wrapper input-wrapper--lg mp4-size-input-wrapper">
                <input type="number" class="base-input" v-model.number="config.height"
                  @input="onHeightChange" :disabled="isConverting" min="1" max="3000" />
              </div>
            </div>
          </div>
          <div class="mp4-config-item">
            <div class="mp4-config-label">压缩到质量：</div>
            <div class="mp4-value-container">
              <div class="input-wrapper input-wrapper--lg mp4-value-input-wrapper">
                <input type="number" class="base-input" v-model.number="config.quality"
                  :disabled="isConverting" min="1" max="100" />
              </div>
              <div class="input-unit">%</div>
            </div>
          </div>
          <div class="mp4-config-item">
            <div class="mp4-config-label">帧率修改：</div>
            <div class="mp4-value-container">
              <div class="input-wrapper input-wrapper--lg mp4-value-input-wrapper">
                <input type="number" class="base-input" v-model.number="config.fps"
                  :disabled="isConverting" min="1" max="120" />
              </div>
              <div class="input-unit">FPS</div>
            </div>
          </div>
          <div class="mp4-config-item" v-if="currentModule !== 'lottie'">
            <div class="mp4-config-label">静音</div>
            <div class="mp4-mute-toggle" :class="{active: config.muted, disabled: isConverting}"
              @click="!isConverting && (config.muted = !config.muted)">
              <div class="mp4-mute-toggle-handle"></div>
            </div>
          </div>
        </div>
        <div class="side-panel-footer">
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
          <button class="btn-large-secondary" :class="{'mp4-btn-converting': isConverting}"
            :data-progress="progress" :disabled="disabled" @click="start">
            <template v-if="isConverting">
              <span class="mp4-progress-text">{{ progress }}%</span>
              <span class="mp4-stage-text">{{ message }}</span>
            </template>
            <template v-else>开始转换MP4</template>
          </button>
        </div>
      </div>
    </div>
  `;

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Components = window.MeeWoo.Components || {};

  /**
   * 普通 MP4 转换面板组件
   */
  window.MeeWoo.Components.StandardMp4Panel = {
    template: template,
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      sourceInfo: {
        type: Object,
        default: function () {
          return { sizeWH: '', duration: '', typeLabel: '文件' };
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
      },
      currentModule: {
        type: String,
        default: 'svga'
      }
    },
    data: function () {
      return {
        config: {
          width: 0,
          height: 0,
          quality: 80,
          fps: 30,
          muted: false,
          aspectRatio: 1
        }
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
