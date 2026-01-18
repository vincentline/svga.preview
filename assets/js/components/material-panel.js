/**
 * @file material-panel.js
 * @description 素材替换管理面板组件
 * @author MeeWoo Team
 * @date 2026-01-18
 * 
 * 功能说明：
 * 1. 展示当前SVGA文件包含的所有位图素材
 * 2. 提供素材替换、下载、编辑功能
 * 3. 支持素材名称搜索过滤
 * 4. 实时显示素材替换状态（原图/替换图）
 * 
 * 使用方式：
 * ```html
 * <material-panel 
 *   :visible="activeRightPanel === 'material' && currentModule === 'svga'" 
 *   :list="materialList"
 *   :replaced-images="replacedImages"
 *   :thumb-bg-color="materialThumbBgColor"
 *   :svga-file-info="svga.fileInfo"
 *   :is-compressing="isCompressingMaterials"
 *   :compress-progress="compressProgress"
 *   :has-compressed="hasCompressedMaterials"
 *   :material-edit-states="materialEditStates"
 *   @close="activeRightPanel = null"
 *   @replace="replaceMaterial"
 *   @restore="restoreMaterial"
 *   @download="downloadMaterial"
 *   @edit="openMaterialEditor"
 *   @compress="openCompressAndExportModal">
 * </material-panel>
 * ```
 * 
 * 与 panel-mixin.js 的关系：
 * - 接收 panel-mixin.js 管理的 activeRightPanel 状态来控制显示/隐藏
 * - 通过事件向父组件传递用户操作，由 panel-mixin.js 处理后续逻辑
 */

(function (global) {
  'use strict';

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Components = global.MeeWoo.Components || {};

  /**
   * 素材列表管理组件
   */
  global.MeeWoo.Components.MaterialPanel = {
    template: '#tpl-material-panel',
    props: {
      // 面板可见性
      visible: { type: Boolean, default: false },
      // 素材列表数据
      list: { type: Array, default: function () { return []; } },
      // 已替换的图片映射 { imageKey: url }
      replacedImages: { type: Object, default: function () { return {}; } },
      // 缩略图背景色
      thumbBgColor: { type: String, default: '#fcfcfc' },
      // SVGA文件信息（用于统计）
      svgaFileInfo: { type: Object, default: function () { return {}; } },
      // 压缩状态标志
      isCompressing: { type: Boolean, default: false },
      // 压缩进度 (0-100)
      compressProgress: { type: Number, default: 0 },
      // 是否已完成压缩
      hasCompressed: { type: Boolean, default: false },
      // 素材编辑状态映射
      materialEditStates: { type: Object, default: function () { return {}; } }
    },
    data: function () {
      return {
        // 搜索关键词
        searchQuery: ''
      };
    },
    computed: {
      /**
       * 根据搜索词过滤后的素材列表
       * @returns {Array} 过滤后的列表
       */
      filteredList: function () {
        if (!this.searchQuery) return this.list;
        var query = this.searchQuery.toLowerCase();
        return this.list.filter(function (item) {
          return item.imageKey.toLowerCase().indexOf(query) !== -1;
        });
      }
    },
    methods: {
      /**
       * 关闭面板
       */
      close: function () {
        this.$emit('close');
      },

      /**
       * 复制素材名称到剪贴板
       * @param {string} name - 素材名称
       */
      copyName: function (name) {
        // 按照项目规范，使用 MeeWoo 作为项目级命名空间
        var Utils = global.MeeWoo.Utils;
        if (Utils && Utils.copyToClipboard) {
          Utils.copyToClipboard(name).then(function () {
            if (Utils.showToast) Utils.showToast('已复制到剪贴板');
          }).catch(function (err) {
            alert('复制失败: ' + err.message);
          });
        }
      },

      /**
       * 触发替换素材
       * @param {Object} item - 素材项
       */
      triggerReplace: function (item) {
        var originalIndex = this.list.indexOf(item);
        if (originalIndex !== -1) {
          this.$emit('replace', originalIndex);
        }
      },

      /**
       * 触发恢复原图
       * @param {Object} item - 素材项
       */
      triggerRestore: function (item) {
        var originalIndex = this.list.indexOf(item);
        if (originalIndex !== -1) {
          this.$emit('restore', originalIndex);
        }
      },

      /**
       * 触发下载素材
       * @param {Object} item - 素材项
       */
      triggerDownload: function (item) {
        var originalIndex = this.list.indexOf(item);
        if (originalIndex !== -1) {
          this.$emit('download', originalIndex);
        }
      },

      /**
       * 触发编辑素材
       * @param {Object} item - 素材项
       */
      triggerEdit: function (item) {
        this.$emit('edit', item);
      },

      /**
       * 触发压缩全部素材
       */
      triggerCompress: function () {
        this.$emit('compress');
      }
    }
  };

})(window);
