/**
 * ==================== 素材编辑器主控模块 (Material Editor Main Controller) ====================
 * 
 * 模块索引：
 * 1. 【数据定义】 - data() - 编辑器状态和素材编辑状态定义
 * 2. 【计算属性】 - computed() - 样式处理和状态判断相关计算属性
 * 3. 【监听器】 - watch() - 监听编辑状态变化
 * 4. 【方法代理】 - methods() - 代理到各功能模块的方法
 * 
 * 功能说明：
 * 素材编辑器的主控制器，负责：
 * 1. 组织和协调各个子模块（状态管理、操作逻辑）
 * 2. 提供Vue Mixin接口
 * 3. 作为各功能模块的协调中心
 * 
 * 依赖模块：
 * - MeeWoo.Core.MaterialState (状态管理)
 * - MeeWoo.Core.MaterialOperations (操作逻辑)
 * 
 * 使用方式：
 * 在 app.js 中引入此文件及相关依赖，并将 MaterialEditor 作为 mixin 混入 Vue 实例
 */

(function(window) {
    'use strict';

    // 确保命名空间存在
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Mixins = window.MeeWoo.Mixins || {};

    var MaterialEditor = {
        data: function() {
            return {
                // 从状态管理模块获取初始状态
                editor: window.MeeWoo.Core.MaterialState.getDefaultEditorState(),
                materialEditStates: window.MeeWoo.Core.MaterialState.getDefaultMaterialEditStates()
            };
        },

        computed: {
            /**
             * 过滤后的文字样式，只保留允许的属性，过滤掉布局相关属性
             * 避免用户粘贴的CSS包含 position/width/height 等破坏布局
             */
            editorTextStyleFiltered: function() {
                return window.MeeWoo.Core.MaterialOperations.filterTextStyle(this.editor.textStyle);
            },

            /**
             * 将过滤后的样式对象转换为CSS字符串
             */
            editorTextStyleString: function() {
                var styles = this.editorTextStyleFiltered;
                return window.MeeWoo.Core.MaterialOperations.convertStylesToCssString(styles);
            },

            /**
             * 判断是否有编辑信息（已废弃，改用 editor.showRestoreBtn）
             */
            hasEditInfo: function() {
                return this.editor.showRestoreBtn;
            }
        },

        watch: {
            // 监听所有可能改变编辑状态的属性
            'editor.baseImage': function() { this.updateRestoreBtnState(); },
            'editor.showImage': function() { this.updateRestoreBtnState(); },
            'editor.showText': function() {
                var _this = this;
                this.updateRestoreBtnState();
                this.$nextTick(function() {
                    _this.renderEditorPreview();
                });
            },
            'editor.imageOffsetX': function() { this.updateRestoreBtnState(); },
            'editor.imageOffsetY': function() { this.updateRestoreBtnState(); },
            'editor.imageScale': function() { this.updateRestoreBtnState(); },

            // 监听文字内容变化，实时更新 Canvas 预览
            'editor.textContent': function() {
                var _this = this;
                this.$nextTick(function() {
                    _this.renderEditorPreview();
                });
            },
            // 监听文字样式变化
            'editor.textStyle': function() {
                var _this = this;
                this.$nextTick(function() {
                    _this.renderEditorPreview();
                });
            },
            // 监听文字位置变化
            'editor.textPosX': function() {
                this.renderEditorPreview();
            },
            'editor.textPosY': function() {
                this.renderEditorPreview();
            },
            // 监听文字缩放变化
            'editor.textScale': function() {
                this.renderEditorPreview();
            }
            // 注意：上面的批量监听已经覆盖了 showText 的 renderEditorPreview 逻辑
        },

        methods: {
            /**
             * 设置文字对齐方式
             * @param {string} align - 对齐方式: 'left' | 'center' | 'right'
             */
            setTextAlign: function(align) {
                window.MeeWoo.Core.MaterialOperations.setTextAlign(this, align);
            },

            /**
             * 更新恢复按钮的显示状态
             * 手动计算，避免 computed 响应式问题
             */
            updateRestoreBtnState: function() {
                window.MeeWoo.Core.MaterialState.updateRestoreButtonState(this.editor);
            },

            /**
             * 渲染编辑器预览 Canvas
             */
            renderEditorPreview: function() {
                window.MeeWoo.Core.MaterialOperations.renderEditorPreview(this);
            },

            /**
             * 清理拖拽事件监听器
             */
            clearDragListeners: function() {
                window.MeeWoo.Core.MaterialOperations.clearDragListeners(this.editor);
            },

            /**
             * 恢复原图
             * 点击后文字样式输入框里内容恢复默认、关闭显示文案按钮、素材图恢复为原始素材图
             */
            restoreOriginalMaterial: function() {
                window.MeeWoo.Core.MaterialOperations.restoreOriginalMaterial(this);
            },

            /**
             * 打开素材编辑器
             * @param {Object} item - 素材对象
             */
            openMaterialEditor: function(item) {
                window.MeeWoo.Core.MaterialOperations.openMaterialEditor(this, item);
            },

            /**
             * 加载图片并设置尺寸
             * @param {string} imgUrl
             */
            loadAndSetImageDimensions: function(imgUrl) {
                window.MeeWoo.Core.MaterialOperations.loadAndSetImageDimensions(this, imgUrl);
            },

            /**
             * 绘制富文本（带样式的文字）
             * @param {CanvasRenderingContext2D} ctx - Canvas上下文
             * @param {number} canvasWidth - 画布宽度
             * @param {number} canvasHeight - 画布高度
             */
            drawRichText: function(ctx, canvasWidth, canvasHeight) {
                window.MeeWoo.Core.MaterialOperations.drawRichText(this, ctx, canvasWidth, canvasHeight);
            },

            /**
             * 将CSS属性名转换为Canvas上下文属性名
             * @param {string} cssProp - CSS属性名
             * @returns {string} Canvas属性名或null
             */
            cssToCanvasProperty: function(cssProp) {
                return window.MeeWoo.Core.MaterialOperations.cssToCanvasProperty(cssProp);
            },

            /**
             * 生成编辑后的素材图
             * @returns {Promise<string>} 生成的图片DataURL
             */
            generateEditedMaterial: function() {
                return window.MeeWoo.Core.MaterialOperations.generateEditedMaterial(this);
            }
        }
    };

    // 导出模块
    window.MeeWoo.Mixins.MaterialEditor = MaterialEditor;
})(window);