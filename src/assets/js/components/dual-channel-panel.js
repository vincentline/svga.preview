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
    template: '<div class="side-panel side-panel--right dual-channel-panel dual-channel-panel-root" :class="{\'show\': visible}"  style="transition: transform 0.3s ease;">\n      <div class="side-panel-container">\n        <!-- 标题区 -->\n        <div class="side-panel-header">\n          <h3 class="side-panel-title">转换为双通道MP4格式</h3>\n          <div class="side-panel-divider"></div>\n        </div>\n\n        <!-- 信息区 -->\n        <div class="mp4-info-section">\n          <div class="mp4-info-row">{{ sourceInfo.typeLabel }}尺寸：{{ sourceInfo.sizeWH }} 时长：{{ sourceInfo.duration }}</div>\n          <div class="mp4-compress-hint">注意：第一次转换需要加载FFmpeg（25M），请耐心等待<br>压缩质量调越低，文件就越小，画面越糊。</div>\n        </div>\n\n        <!-- 配置区域 -->\n        <div class="mp4-config-section" :class="{disabled: isConverting}">\n          <!-- 遮罩位置 -->\n          <div class="mp4-config-item">\n            <div class="mp4-config-label">遮罩位置：</div>\n            <div class="mp4-select-wrapper" :class="{open: showChannelModeDropdown, disabled: isConverting}"\n              @click="!isConverting && toggleChannelModeDropdown()">\n              <div class="mp4-select-text">\n                {{ config.channelMode === \'color-left-alpha-right\' ? \'左彩右灰\' : \'左灰右彩\' }}\n              </div>\n              <div class="mp4-select-icon">\n                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n                  <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"\n                    stroke-linejoin="round" />\n                </svg>\n              </div>\n              <!-- 下拉菜单 -->\n              <div class="mp4-select-dropdown">\n                <div class="mp4-select-option" :class="{selected: config.channelMode === \'color-left-alpha-right\'}"\n                  @click.stop="selectChannelMode(\'color-left-alpha-right\')">\n                  左彩右灰（左侧彩色通道，右侧Alpha通道）\n                </div>\n                <div class="mp4-select-option" :class="{selected: config.channelMode === \'alpha-left-color-right\'}"\n                  @click.stop="selectChannelMode(\'alpha-left-color-right\')">\n                  左灰右彩（左侧Alpha通道，右侧彩色通道）\n                </div>\n              </div>\n            </div>\n          </div>\n\n          <!-- 尺寸 -->\n          <div class="mp4-config-item">\n            <div class="mp4-config-label">尺寸：</div>\n            <div class="mp4-size-container">\n              <div class="input-wrapper input-wrapper--lg mp4-size-input-wrapper">\n                <input type="number" class="base-input" v-model.number="config.width" @input="onWidthChange"\n                  :disabled="isConverting" min="0" max="3000" />\n              </div>\n              <div class="mp4-size-lock">\n                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n                  <path\n                    d="M4.66667 7.33333V5.33333C4.66667 3.86057 5.86057 2.66667 7.33333 2.66667H8.66667C10.1394 2.66667 11.3333 3.86057 11.3333 5.33333V7.33333M5.33333 7.33333H10.6667C11.403 7.33333 12 7.93029 12 8.66667V12C12 12.7364 11.403 13.3333 10.6667 13.3333H5.33333C4.59695 13.3333 4 12.7364 4 12V8.66667C4 7.93029 4.59695 7.33333 5.33333 7.33333Z"\n                    stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />\n                </svg>\n              </div>\n              <div class="input-wrapper input-wrapper--lg mp4-size-input-wrapper">\n                <input type="number" class="base-input" v-model.number="config.height" @input="onHeightChange"\n                  :disabled="isConverting" min="0" max="3000" />\n              </div>\n            </div>\n          </div>\n\n          <!-- 压缩到质量 -->\n          <div class="mp4-config-item">\n            <div class="mp4-config-label">压缩到质量：</div>\n            <div class="mp4-value-container">\n              <div class="input-wrapper input-wrapper--lg mp4-value-input-wrapper">\n                <input type="number" class="base-input" v-model.number="config.quality" :disabled="isConverting"\n                  min="1" max="100" />\n              </div>\n              <div class="input-unit">%</div>\n            </div>\n          </div>\n\n          <!-- 帧率修改 -->\n          <div class="mp4-config-item">\n            <div class="mp4-config-label">帧率修改：</div>\n            <div class="mp4-value-container">\n              <div class="input-wrapper input-wrapper--lg mp4-value-input-wrapper">\n                <input type="number" class="base-input" v-model.number="config.fps" :disabled="isConverting"\n                  min="1" max="120" />\n              </div>\n              <div class="input-unit">FPS</div>\n            </div>\n          </div>\n\n          <!-- 静音 -->\n          <div class="mp4-config-item">\n            <div class="mp4-config-label">静音</div>\n            <div class="mp4-mute-toggle" :class="{active: config.muted, disabled: isConverting}"\n              @click="!isConverting && (config.muted = !config.muted)">\n              <div class="mp4-mute-toggle-handle"></div>\n            </div>\n          </div>\n        </div>\n\n        <!-- 底部按钮 -->\n        <div class="side-panel-footer">\n          <!-- 返回按钮（转换中变为取消按钮） -->\n          <button v-if="!isConverting" class="material-btn-back" @click="close" title="返回">\n            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">\n              <path d="M12 16L6 10L12 4" stroke="#333333" stroke-width="2" stroke-linecap="round"\n                stroke-linejoin="round" />\n            </svg>\n            <span>取消</span>\n          </button>\n          <button v-else class="material-btn-back mp4-btn-cancel" @click="cancel" title="取消转换">\n            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">\n              <path d="M5 5L15 15M15 5L5 15" stroke="#ff4444" stroke-width="2" stroke-linecap="round"\n                stroke-linejoin="round" />\n            </svg>\n            <span>取消</span>\n          </button>\n\n          <!-- 转换按钮 -->\n          <button class="btn-large-secondary" :class="{mp4-btn-converting: isConverting}"\n            :data-progress="progress" :disabled="disabled" @click="start">\n            <template v-if="isConverting">\n              <span class="mp4-progress-text">{{ progress }}%</span>\n              <span class="mp4-stage-text">{{ message }}</span>\n            </template>\n            <template v-else>\n              开始转换双通道MP4\n            </template>\n          </button>\n        </div>\n      </div>\n    </div>','props': {
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
      visible: {
        immediate: true, // 初始时也检查visible状态
        handler: function (newVal) {
          if (newVal) {
            this.initParams();
          }
        }
      }
    },
    methods: {
      /**
       * 强制显示面板（Vue版本）
       */
      forceShowPanel: function () {
        // Vue版本：依赖Vue的响应式渲染，不再手动操作DOM
        // 面板的显示/隐藏由Vue的:class="{'show': visible}"绑定控制
        // 移除所有手动DOM操作，避免与Vue渲染冲突
      },
      
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

  // 组件已在app.js中通过Vue实例的components选项注册
  // 移除独立注册逻辑，与其他组件保持一致的注册方式

  /*
  // 添加全局方法，用于手动创建和显示双通道面板（作为Vue渲染失败的fallback）
  global.MeeWoo.Utils = global.MeeWoo.Utils || {};
  global.MeeWoo.Utils.showDualChannelPanel = function(sourceInfo, config) {
    console.log('DOM实现：showDualChannelPanel被调用');
    // 尝试查找或创建面板元素
    var panelElement = document.querySelector('.dual-channel-panel') || 
                      document.querySelector('.dual-channel-panel-root');
    
    if (!panelElement) {
      // 如果面板元素不存在，创建一个
      panelElement = document.createElement('div');
      panelElement.className = 'side-panel side-panel--right dual-channel-panel dual-channel-panel-root show';
      
      // 保存配置到元素的dataset中，以便在点击事件中使用
      panelElement.dataset.config = JSON.stringify(config);
      
      // 添加面板内容，使用与模板一致的结构
      panelElement.innerHTML = `
        <div class="side-panel-container">
          <div class="side-panel-header">
            <h3 class="side-panel-title">转换为双通道MP4格式</h3>
            <div class="side-panel-divider"></div>
          </div>
          <div class="mp4-info-section">
            <div class="mp4-info-row">${sourceInfo.typeLabel || 'SVGA'}尺寸：${sourceInfo.sizeWH || '未知'} 时长：${sourceInfo.duration || '未知'}</div>
            <div class="mp4-compress-hint">注意：第一次转换需要加载FFmpeg（25M），请耐心等待<br>压缩质量调越低，文件就越小，画面越糊。</div>
          </div>
          <div class="mp4-config-section">
            <div class="mp4-config-item">
              <div class="mp4-config-label">遮罩位置：</div>
              <div class="mp4-select-wrapper">
                <div class="mp4-select-text">左彩右灰</div>
                <div class="mp4-select-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="mp4-config-item">
              <div class="mp4-config-label">尺寸：</div>
              <div class="mp4-size-container">
                <div class="input-wrapper input-wrapper--lg mp4-size-input-wrapper">
                  <input type="number" class="base-input" id="dual-channel-width" value="${config.width || 300}" placeholder="宽">
                </div>
                <div class="mp4-size-lock">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.66667 7.33333V5.33333C4.66667 3.86057 5.86057 2.66667 7.33333 2.66667H8.66667C10.1394 2.66667 11.3333 3.86057 11.3333 5.33333V7.33333M5.33333 7.33333H10.6667C11.403 7.33333 12 7.93029 12 8.66667V12C12 12.7364 11.403 13.3333 10.6667 13.3333H5.33333C4.59695 13.3333 4 12.7364 4 12V8.66667C4 7.93029 4.59695 7.33333 5.33333 7.33333Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <div class="input-wrapper input-wrapper--lg mp4-size-input-wrapper">
                  <input type="number" class="base-input" id="dual-channel-height" value="${config.height || 300}" placeholder="高">
                </div>
              </div>
            </div>
            <div class="mp4-config-item">
              <div class="mp4-config-label">压缩到质量：</div>
              <div class="mp4-value-container">
                <div class="input-wrapper input-wrapper--lg mp4-value-input-wrapper">
                  <input type="number" class="base-input" id="dual-channel-quality" value="${config.quality || 80}" min="1" max="100">
                </div>
                <div class="input-unit">%</div>
              </div>
            </div>
            <div class="mp4-config-item">
              <div class="mp4-config-label">帧率修改：</div>
              <div class="mp4-value-container">
                <div class="input-wrapper input-wrapper--lg mp4-value-input-wrapper">
                  <input type="number" class="base-input" id="dual-channel-fps" value="${config.fps || 30}" min="1" max="120">
                </div>
                <div class="input-unit">FPS</div>
              </div>
            </div>
            <div class="mp4-config-item">
              <div class="mp4-config-label">静音</div>
              <div class="mp4-mute-toggle ${config.muted ? 'active' : ''}" id="dual-channel-muted" onclick="toggleDualChannelMuted(this)">
                <div class="mp4-mute-toggle-handle"></div>
              </div>
            </div>
          </div>
          <div class="side-panel-footer">
            <button class="material-btn-back" onclick="handleDualChannelCloseClick(this)">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 16L6 10L12 4" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>取消</span>
            </button>
            <button class="btn-large-secondary" onclick="handleDualChannelConvertClick(this)">
              开始转换双通道MP4
            </button>
          </div>
        </div>
      `;
      
      // 添加到body
      document.body.appendChild(panelElement);
    } else {
      // 如果面板元素存在，确保它是可见的
      panelElement.classList.add('show');
      // 移除内联样式，使用CSS定义的样式
      panelElement.style.cssText = '';
    }
  };
  
  // 添加全局点击处理函数，用于处理开始转换按钮的点击事件
  function handleDualChannelConvertClick(button) {
    console.log('DOM实现：handleDualChannelConvertClick被调用');
    if (window.MeeWoo && window.MeeWoo.app) {
      // 查找面板元素
      var panelElement = button.closest('.dual-channel-panel') || 
                        button.closest('.dual-channel-panel-root');
      
      if (panelElement) {
        // 从dataset中获取配置
        var config = JSON.parse(panelElement.dataset.config || '{}');
        
        // 从输入框中获取最新的值
        var widthInput = document.getElementById('dual-channel-width');
        var heightInput = document.getElementById('dual-channel-height');
        var qualityInput = document.getElementById('dual-channel-quality');
        var fpsInput = document.getElementById('dual-channel-fps');
        var mutedToggle = document.getElementById('dual-channel-muted');
        
        if (widthInput) config.width = parseInt(widthInput.value) || config.width;
        if (heightInput) config.height = parseInt(heightInput.value) || config.height;
        if (qualityInput) config.quality = parseInt(qualityInput.value) || config.quality;
        if (fpsInput) config.fps = parseInt(fpsInput.value) || config.fps;
        if (mutedToggle) config.muted = mutedToggle.classList.contains('active');
        
        // 调用转换方法
        window.MeeWoo.app.handleDualChannelConvert(config);
      }
    }
  }
  
  // 将处理函数添加到全局作用域
  window.handleDualChannelConvertClick = handleDualChannelConvertClick;
  
  // 添加静音切换处理函数
  function toggleDualChannelMuted(element) {
    console.log('DOM实现：toggleDualChannelMuted被调用');
    element.classList.toggle('active');
  }
  
  // 将静音切换函数添加到全局作用域
  window.toggleDualChannelMuted = toggleDualChannelMuted;
  
  // 添加关闭处理函数
  function handleDualChannelCloseClick(button) {
    console.log('DOM实现：handleDualChannelCloseClick被调用');
    if (window.MeeWoo && window.MeeWoo.app) {
      // 调用统一的关闭方法
      window.MeeWoo.app.closeRightPanel();
    } else {
      // 备选方案：直接操作DOM
      var panelElement = button.closest('.dual-channel-panel') || 
                        button.closest('.dual-channel-panel-root');
      if (panelElement) {
        panelElement.classList.remove('show');
        // 300ms后完全移除元素
        setTimeout(function() {
          if (panelElement.parentNode) {
            panelElement.parentNode.removeChild(panelElement);
          }
        }, 300);
      }
    }
  }
  
  // 将关闭处理函数添加到全局作用域
  window.handleDualChannelCloseClick = handleDualChannelCloseClick;
  
  // 新增：全局方法，用于隐藏双通道面板
  global.MeeWoo.Utils.hideDualChannelPanel = function() {
    console.log('DOM实现：hideDualChannelPanel被调用');
    if (window.MeeWoo && window.MeeWoo.app) {
      // 使用统一的关闭方法
      window.MeeWoo.app.closeRightPanel();
    } else {
      // 备选方案：直接操作DOM
      var panelElement = document.querySelector('.dual-channel-panel') || 
                        document.querySelector('.dual-channel-panel-root');
      if (panelElement) {
        panelElement.classList.remove('show');
      }
    }
  };
  */
  


})(window);