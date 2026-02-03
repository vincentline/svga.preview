/**
 * @file chromakey-panel.js
 * @description 绿幕抠图面板组件
 * @author MeeWoo Team
 * @date 2026-01-18
 * 
 * 功能说明：
 * 1. 提供绿幕抠图开关和相似度调节
 * 2. 支持平滑度调节
 * 3. 显示MP4文件信息和性能提示
 * 4. 实时更新抠图效果
 * 
 * 使用方式：
 * ```html
 * <chromakey-panel 
 *   :visible="showChromaKeyPanel" 
 *   :source-info="chromakeySourceInfo"
 *   :enabled="chromakeyEnabled"
 *   :similarity="chromakeySimilarity"
 *   :smoothness="chromakeySmoothness"
 *   @toggle="toggleChromaKey"
 *   @update:similarity="updateChromaKeySimilarity"
 *   @update:smoothness="updateChromaKeySmoothness"
 *   @update-effect="updateChromaKeyEffect"
 *   @apply="applyChromaKey">
 * </chromakey-panel>
 * ```
 * 
 * 与 panel-mixin.js 的关系：
 * - 接收主应用管理的状态来控制显示/隐藏
 * - 通过事件向父组件传递用户操作，由主应用处理后续逻辑
 */

(function () {
  var template = `

    <div class="side-panel side-panel--left chromakey-panel" :class="{'show': visible}">
      <div class="side-panel-container">
        <!-- 标题区 -->
        <div class="side-panel-header">
          <h3 class="side-panel-title">扣掉画面绿幕成透明</h3>
          <div class="side-panel-divider"></div>
        </div>

        <!-- 信息区 -->
        <div class="chromakey-info-section">
          <div class="chromakey-info-row">MP4尺寸：{{ sourceInfo.sizeWH }} 时长：{{ sourceInfo.duration }}</div>
          <div class="chromakey-performance-hint">打开绿幕抠图，播放会比较卡，因为是实时渲染抠图效果</div>
        </div>

        <!-- 设置区域 -->
        <div class="chromakey-config-section">
          <!-- 打开扮绿幕开关 -->
          <div class="chromakey-config-item">
            <div class="chromakey-config-label">打开绿幕抠图：</div>
            <div class="chromakey-switch-wrapper" @click="toggleEnabled">
              <div class="chromakey-switch" :class="{active: enabled}">
                <div class="chromakey-switch-handle"></div>
              </div>
            </div>
          </div>

          <!-- 相似度滑块 -->
          <div class="chromakey-config-item" v-if="enabled">
            <div class="chromakey-config-label">相似度：{{ similarity }}</div>
            <div class="chromakey-slider-wrapper">
              <input type="range" class="chromakey-slider" :value="similarity" min="0" max="100"
                step="1" @input="updateSimilarity" />
            </div>
          </div>

          <!-- 平滑度滑块 -->
          <div class="chromakey-config-item" v-if="enabled">
            <div class="chromakey-config-label">平滑度：{{ smoothness }}</div>
            <div class="chromakey-slider-wrapper">
              <input type="range" class="chromakey-slider" :value="smoothness" min="0" max="100"
                step="1" @input="updateSmoothness" />
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="side-panel-footer">
          <!-- 确定按钮 -->
          <button class="btn-large-secondary" @click="apply">
            确定
          </button>
        </div>
      </div>
    </div>
  `;

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Components = window.MeeWoo.Components || {};

  /**
   * 绿幕抠图面板组件
   */
  window.MeeWoo.Components.ChromaKeyPanel = {
    template: template,
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      sourceInfo: {
        type: Object,
        default: function () {
          return { sizeWH: '', duration: '' };
        }
      },
      enabled: {
        type: Boolean,
        default: false
      },
      similarity: {
        type: Number,
        default: 40
      },
      smoothness: {
        type: Number,
        default: 10
      }
    },
    methods: {
      toggleEnabled: function () {
        this.$emit('toggle');
      },
      updateSimilarity: function (e) {
        this.$emit('update:similarity', parseInt(e.target.value));
        this.$emit('update-effect');
      },
      updateSmoothness: function (e) {
        this.$emit('update:smoothness', parseInt(e.target.value));
        this.$emit('update-effect');
      },
      apply: function () {
        this.$emit('apply');
      }
    }
  };
})();
