/**
 * ==================== 素材编辑器状态管理模块 (Material State Manager) ====================
 * 
 * 模块索引：
 * 1. 【状态定义】 - 素材编辑器状态定义
 * 2. 【状态管理】 - 素材编辑状态管理相关方法
 * 3. 【历史记录】 - 编辑历史管理相关方法
 * 
 * 功能说明：
 * 提供素材编辑器的状态管理功能，包括：
 * 1. 编辑器界面状态管理
 * 2. 素材编辑状态管理
 * 3. 编辑历史记录管理
 * 
 * 使用方式：
 * 在 material-editor.js 中引入此文件，并使用 MeeWoo.Core.MaterialState 模块
 */

(function (window) {
    'use strict';

    // 确保命名空间
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Core = window.MeeWoo.Core || {};

    /**
     * 素材编辑器状态管理模块
     */
    var MaterialState = {
        /**
         * ==================== 【状态定义】 ====================
         * 素材编辑器状态定义
         */

        /**
         * 获取默认的编辑器状态
         * @returns {Object} 默认编辑器状态
         */
        getDefaultEditorState: function () {
            return {
                // 编辑器状态
                show: false,
                targetIndex: -1,     // 当前编辑的素材索引
                loading: false,      // 生成中状态

                // 视图状态
                viewMode: 'fit-height',  // 视图模式：'fit-height'(适应高度) 或 'one-to-one'(1:1显示)
                scale: 1.0,          // 预览缩放
                offsetX: 0,          // 预览X位移
                offsetY: 0,          // 预览Y位移

                // 内容状态
                baseImage: null,     // 当前底图 (Image Object or DataURL)
                baseImageWidth: 0,   // 底图原始宽度
                baseImageHeight: 0,  // 底图原始高度
                defaultBaseImage: null, // 原始底图 (用于对比是否变更)
                showRestoreBtn: false,  // 显式控制恢复按钮的显示

                // 编辑状态
                showImage: true,     // 显示底图
                showText: false,     // 显示文字
                textContent: '',     // 文字内容
                textStyle: '',       // 文字CSS样式

                // 激活状态管理
                activeElement: 'none',  // 当前激活的元素: 'none'|'image'|'text'
                lastClickElement: 'none', // 上次点击的元素，用于重叠区域切换
                lastClickTime: 0,         // 上次点击时间

                // 预览区域拖拽状态
                isDragging: false,
                dragStartX: 0,
                dragStartY: 0,
                dragStartOffsetX: 0,
                dragStartOffsetY: 0,

                // 素材图交互状态
                imageOffsetX: 0,     // 素材图X偏移(像素)
                imageOffsetY: 0,     // 素材图Y偏移(像素)
                imageScale: 1.0,     // 素材图缩放
                isImageDragging: false,
                imageDragStartX: 0,
                imageDragStartY: 0,
                imageDragStartOffsetX: 0,
                imageDragStartOffsetY: 0,
                imageMouseMoved: false,  // 标记是否发生了拖拽移动

                // 文字层交互状态
                textPosX: 50,        // 文字X位置 (百分比 0-100)
                textPosY: 50,        // 文字Y位置 (百分比 0-100)
                textScale: 1.0,      // 文字缩放
                textAlign: 'left',   // 文字对齐方式: 'left' | 'center' | 'right'
                isTextDragging: false,
                textDragStartX: 0,
                textDragStartY: 0,
                textDragStartPosX: 50,
                textDragStartPosY: 50,
                textMouseMoved: false  // 标记是否发生了拖拽移动
            };
        },

        /**
         * 获取默认的素材编辑状态映射
         * @returns {Object} 默认素材编辑状态映射
         */
        getDefaultMaterialEditStates: function () {
            // 存储每个素材的编辑历史
            // key: imageKey, value: { textContent, textStyle, showImage, showText, textPosX, textPosY, textScale, imageOffsetX, imageOffsetY, imageScale, customBaseImage }
            return {};
        },

        /**
         * ==================== 【状态管理】 ====================
         * 素材编辑状态管理相关方法
         */

        /**
         * 重置编辑器状态为默认值
         * @param {Object} editorState - 编辑器状态对象
         */
        resetEditorState: function (editorState) {
            var defaultState = this.getDefaultEditorState();
            for (var key in defaultState) {
                if (defaultState.hasOwnProperty(key)) {
                    editorState[key] = defaultState[key];
                }
            }
        },

        /**
         * 更新恢复按钮的显示状态
         * @param {Object} editorState - 编辑器状态对象
         */
        updateRestoreButtonState: function (editorState) {
            var show = false;

            // 1. 检查底图是否变更
            var defaultImg = editorState.defaultBaseImage;
            if (defaultImg && editorState.baseImage !== defaultImg) show = true;

            // 2. 检查显示开关
            else if (!editorState.showImage) show = true;
            else if (editorState.showText) show = true;

            // 3. 检查底图变换
            else if (editorState.imageOffsetX !== 0) show = true;
            else if (editorState.imageOffsetY !== 0) show = true;
            else if (Math.abs(editorState.imageScale - 1.0) > 0.001) show = true;

            editorState.showRestoreBtn = show;
        },

        /**
         * ==================== 【历史记录】 ====================
         * 编辑历史管理相关方法
         */

        /**
         * 保存当前素材的编辑状态
         * @param {Object} materialEditStates - 素材编辑状态映射
         * @param {string} imageKey - 素材键值
         * @param {Object} editorState - 当前编辑器状态
         */
        saveMaterialEditState: function (materialEditStates, imageKey, editorState) {
            materialEditStates[imageKey] = {
                textContent: editorState.textContent,
                textStyle: editorState.textStyle,
                showImage: editorState.showImage,
                showText: editorState.showText,
                textPosX: editorState.textPosX,
                textPosY: editorState.textPosY,
                textScale: editorState.textScale,
                textAlign: editorState.textAlign,
                imageOffsetX: editorState.imageOffsetX,
                imageOffsetY: editorState.imageOffsetY,
                imageScale: editorState.imageScale,
                customBaseImage: editorState.baseImage !== editorState.defaultBaseImage ? editorState.baseImage : undefined
            };
        },

        /**
         * 恢复素材的编辑状态
         * @param {Object} materialEditStates - 素材编辑状态映射
         * @param {string} imageKey - 素材键值
         * @param {Object} editorState - 目标编辑器状态
         */
        restoreMaterialEditState: function (materialEditStates, imageKey, editorState) {
            var savedState = materialEditStates[imageKey];
            if (savedState) {
                editorState.showImage = savedState.showImage;
                editorState.showText = savedState.showText;
                editorState.textContent = savedState.textContent || '';
                editorState.textStyle = savedState.textStyle || '';
                editorState.textPosX = savedState.textPosX !== undefined ? savedState.textPosX : 50;
                editorState.textPosY = savedState.textPosY !== undefined ? savedState.textPosY : 50;
                editorState.textScale = savedState.textScale !== undefined ? savedState.textScale : 1.0;
                editorState.textAlign = savedState.textAlign !== undefined ? savedState.textAlign : 'left';
                editorState.imageOffsetX = savedState.imageOffsetX !== undefined ? savedState.imageOffsetX : 0;
                editorState.imageOffsetY = savedState.imageOffsetY !== undefined ? savedState.imageOffsetY : 0;
                editorState.imageScale = savedState.imageScale !== undefined ? savedState.imageScale : 1.0;

                // 如果保存了自定义底图，则使用它
                if (savedState.customBaseImage) {
                    editorState.baseImage = savedState.customBaseImage;
                }
            }
        },

        /**
         * 清除特定素材的编辑状态
         * @param {Object} materialEditStates - 素材编辑状态映射
         * @param {string} imageKey - 素材键值
         */
        clearMaterialEditState: function (materialEditStates, imageKey) {
            if (materialEditStates[imageKey]) {
                delete materialEditStates[imageKey];
            }
        }
    };

    // 导出模块
    window.MeeWoo.Core.MaterialState = MaterialState;
})(window);