/**
 * ==================== YYEVA Key素材管理面板组件 ====================
 * 
 * 功能说明：
 * 用于管理YYEVA格式双通道MP4的key素材，支持图片和文本的替换
 * 
 * 面板结构：
 * - 标题区：key素材替换
 * - 信息区：显示图片key和文本key数量
 * - 说明区：使用说明
 * - 搜索区：key名称搜索
 * - 图片key区：显示图片key列表，支持替换和恢复
 * - 文本key区：显示文本key列表，支持输入和恢复
 * - 底部按钮：取消和确定
 * 
 * @author MeeWoo Team
 * @version 1.0.0
 * ====================================================================
 */

(function () {
  var template = `
    <div class="side-panel side-panel--right yyeva-key-panel" :class="{'show': visible}">
      <div class="side-panel-container">
        <!-- 标题区 -->
        <div class="side-panel-header">
          <h3 class="side-panel-title">key素材替换</h3>
          <div class="side-panel-divider"></div>
        </div>

        <!-- 信息区 -->
        <div class="yyeva-key-info-section">
          <div class="yyeva-key-info-row">图片key数量：{{ imageKeyCount }}个</div>
          <div class="yyeva-key-info-row">文本key数量：{{ textKeyCount }}个</div>
          <div class="yyeva-key-hint">
            您可以上传图片或填写文本，替换播放器中的key内容。
            替换后点击确定按钮保存更改。
          </div>
        </div>

        <!-- 搜索区 -->
        <div class="yyeva-key-search">
          <input type="text" class="material-search-input" placeholder="搜索key名称..." v-model="searchQuery" />
        </div>

        <!-- 图片key区 -->
        <div class="yyeva-key-section" v-if="filteredImageKeys.length > 0">
          <div class="yyeva-key-section-title">图片key</div>
          <div class="yyeva-key-list">
            <div v-for="key in filteredImageKeys" :key="key.effectTag" class="yyeva-key-item">
              <div class="yyeva-key-thumb" :style="{ backgroundColor: '#f0f0f0' }">
                <img v-if="localReplacedImages[key.effectTag]" :src="localReplacedImages[key.effectTag]" class="yyeva-key-thumb-img" />
                <div v-else class="yyeva-key-thumb-placeholder">无预览</div>
              </div>
              <div class="yyeva-key-info">
                <div class="yyeva-key-name" :title="key.effectTag">{{ key.effectTag }}</div>
                <div class="yyeva-key-meta">尺寸：{{ key.effectWidth }} × {{ key.effectHeight }}</div>
              </div>
              <div class="yyeva-key-actions">
                <button class="yyeva-key-btn-replace" @click="triggerImageUpload(key)">
                  替换此图
                </button>
                <button v-if="localReplacedImages[key.effectTag]" class="material-btn-close" @click="restoreImage(key)" title="恢复原图"></button>
              </div>
            </div>
          </div>
        </div>

        <!-- 文本key区 -->
        <div class="yyeva-key-section" v-if="filteredTextKeys.length > 0">
          <div class="yyeva-key-section-title">文本key</div>
          <div class="yyeva-key-list">
            <div v-for="key in filteredTextKeys" :key="key.effectTag" class="yyeva-key-item">
              <div class="yyeva-key-info yyeva-key-info-full">
                <div class="yyeva-key-name" :title="key.effectTag">{{ key.effectTag }}</div>
                <div class="yyeva-key-text-input">
                  <input type="text" class="base-input yyeva-key-text-field" 
                    v-model="localReplacedTexts[key.effectTag]" 
                    @input="handleTextInput(key)"
                    placeholder="输入替换文本..." />
                  <button v-if="localReplacedTexts[key.effectTag]" class="material-btn-close" @click="restoreText(key)" title="恢复默认"></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredImageKeys.length === 0 && filteredTextKeys.length === 0" class="yyeva-key-empty">
          未找到key素材
        </div>

        <!-- 底部按钮 -->
        <div class="side-panel-footer">
          <button title="关闭" class="material-btn-back" @click="close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 16L6 10L12 4" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <span>取消</span>
          </button>
          <button class="btn-large-secondary" @click="confirm" title="确定">
            确定
          </button>
        </div>
      </div>
    </div>
  `;

  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Components = window.MeeWoo.Components || {};

  window.MeeWoo.Components.YyevaKeyPanel = {
    template: template,
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      imageKeys: {
        type: Array,
        default: function () { return []; }
      },
      textKeys: {
        type: Array,
        default: function () { return []; }
      },
      replacedImages: {
        type: Object,
        default: function () { return {}; }
      },
      replacedTexts: {
        type: Object,
        default: function () { return {}; }
      }
    },
    data: function () {
      return {
        searchQuery: '',
        localReplacedImages: {},
        localReplacedTexts: {}
      };
    },
    computed: {
      imageKeyCount: function () {
        return this.imageKeys.length;
      },
      textKeyCount: function () {
        return this.textKeys.length;
      },
      filteredImageKeys: function () {
        if (!this.searchQuery) {
          return this.imageKeys;
        }
        var query = this.searchQuery.toLowerCase();
        return this.imageKeys.filter(function (key) {
          return key.effectTag.toLowerCase().includes(query);
        });
      },
      filteredTextKeys: function () {
        if (!this.searchQuery) {
          return this.textKeys;
        }
        var query = this.searchQuery.toLowerCase();
        return this.textKeys.filter(function (key) {
          return key.effectTag.toLowerCase().includes(query);
        });
      }
    },
    watch: {
      visible: function (newVal) {
        if (newVal) {
          // 重置搜索
          this.searchQuery = '';
          // 复制外部状态到本地
          this.localReplacedImages = Object.assign({}, this.replacedImages);
          this.localReplacedTexts = Object.assign({}, this.replacedTexts);
        }
      },
      replacedImages: function (newVal) {
        this.localReplacedImages = Object.assign({}, newVal);
      },
      replacedTexts: function (newVal) {
        this.localReplacedTexts = Object.assign({}, newVal);
      }
    },
    methods: {
      close: function () {
        this.$emit('close');
      },
      confirm: function () {
        this.$emit('confirm', {
          replacedImages: this.localReplacedImages,
          replacedTexts: this.localReplacedTexts
        });
      },
      triggerImageUpload: function (key) {
        // 动态创建文件输入元素
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.onchange = function (event) {
          this.handleImageUpload(key, event);
          // 移除临时元素
          document.body.removeChild(fileInput);
        }.bind(this);
        document.body.appendChild(fileInput);
        fileInput.click();
      },
      handleImageUpload: function (key, event) {
        var file = event.target.files[0];
        if (!file) return;

        // 读取文件并转换为DataURL
        var reader = new FileReader();
        reader.onload = function (e) {
          this.localReplacedImages[key.effectTag] = e.target.result;
          this.$emit('image-replaced', {
            effectTag: key.effectTag,
            imageData: e.target.result
          });
        }.bind(this);
        reader.readAsDataURL(file);
      },
      restoreImage: function (key) {
        delete this.localReplacedImages[key.effectTag];
        this.$emit('image-restored', key.effectTag);
      },
      restoreText: function (key) {
        delete this.localReplacedTexts[key.effectTag];
        this.$emit('text-restored', key.effectTag);
      },
      handleTextInput: function (key) {
        this.$emit('text-input', {
          effectTag: key.effectTag,
          text: this.localReplacedTexts[key.effectTag]
        });
      }
    }
  };

  // 确保Vue加载完成后注册组件（适配Vue2）
  function registerComponent() {
    if (window.Vue) {
      // 注册组件，让Vue识别<yyeva-key-panel>标签
      Vue.component('yyeva-key-panel', window.MeeWoo.Components.YyevaKeyPanel);
    } else {
      // 如果Vue还没加载，延迟重试
      setTimeout(registerComponent, 600);
    }
  }

  // 执行注册
  registerComponent();

})(window);