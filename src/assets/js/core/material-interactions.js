/**
 * ==================== 素材编辑器交互模块 (Material Interactions) ====================
 * 
 * 模块索引：
 * 1. 【视图控制】 - 视图模式切换和缩放控制
 * 2. 【文件交互】 - 文件上传交互
 * 
 * 功能说明：
 * 提供素材编辑器的用户交互功能，包括：
 * 1. 视图模式切换
 * 2. 文件上传交互
 * 
 * 注意：图层拖拽、缩放、选中交互已迁移到 Konva.js，由 material-editor.js 直接处理
 * 
 * 使用方式：
 * 在 material-editor.js 中引入此文件，并使用 MeeWoo.Core.MaterialInteractions 模块
 */

(function (window) {
    'use strict';

    // 确保命名空间
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Core = window.MeeWoo.Core || {};

    /**
     * 素材编辑器交互模块
     */
    var MaterialInteractions = {
        /**
         * ==================== 【视图控制】 ====================
         * 视图模式切换和缩放控制
         */

        /**
         * 切换编辑器视图模式（1:1显示 / 适应高度）
         * @param {Object} vueInstance - Vue实例
         */
        toggleEditorViewMode: function (vueInstance) {
            var previewArea = document.querySelector('.editor-preview-area');
            if (!previewArea || !vueInstance.editor.baseImageHeight) return;

            if (vueInstance.editor.viewMode === 'fit-height') {
                // 切换到 1:1 模式
                vueInstance.editor.viewMode = 'one-to-one';
                vueInstance.editor.scale = 1.0;
                                        
                // 同步更新 Konva 舞台缩放并居中（使用 getClientRect 实现）
                if (vueInstance.stageInstance && vueInstance.baseLayerInstance) {
                    var stageWidth = vueInstance.stageInstance.width();
                    var stageHeight = vueInstance.stageInstance.height();
                    
                    // 保存当前的舞台位置
                    var currentStagePos = vueInstance.stageInstance.position();
                    
                    // 临时设置舞台位置为 (0, 0)，以便正确计算 Group 的绝对位置
                    vueInstance.stageInstance.position({ x: 0, y: 0 });
                    
                    // 设置 1:1 缩放
                    vueInstance.stageInstance.scale({ x: 1.0, y: 1.0 });
                    
                    // 使用 getClientRect() 获取 1:1 缩放下 Group 的实际显示区域（相对于舞台原点）
                    var rect = vueInstance.baseLayerInstance.getClientRect();
                    
                    // 计算居中位置：让内容区域在舞台中心
                    var centerX = (stageWidth - rect.width) / 2 - rect.x;
                    var centerY = (stageHeight - rect.height) / 2 - rect.y;
                    
                    vueInstance.stageInstance.position({ x: centerX, y: centerY });
                    vueInstance.stageInstance.draw();
                }
            } else {
                // 切换到适应画布模式（智能适应：优先按高度 75%，如果宽度超出则按宽度 100%）
                vueInstance.editor.viewMode = 'fit-height';
            
                var containerHeight = previewArea.clientHeight;
                var containerWidth = previewArea.clientWidth;
            
                // 1. 先按高度 75% 计算缩放比例
                var fitByHeightScale = (containerHeight * 0.75) / vueInstance.editor.baseImageHeight;
            
                // 2. 计算此时的宽度
                var widthAfterHeightFit = vueInstance.editor.baseImageWidth * fitByHeightScale;
            
                // 3. 判断宽度是否超出容器
                var fitScale;
                if (widthAfterHeightFit > containerWidth) {
                    // 宽度超出，改为按宽度 100% 缩放
                    fitScale = containerWidth / vueInstance.editor.baseImageWidth;
                } else {
                    // 宽度未超出，使用高度 75% 的缩放
                    fitScale = fitByHeightScale;
                }
            
                // 限制缩放范围
                if (fitScale > 5.0) fitScale = 5.0;
                if (fitScale < 0.1) fitScale = 0.1;
                vueInstance.editor.scale = parseFloat(fitScale.toFixed(2));
                            
                // 同步更新 Konva 舞台缩放并居中（使用 getClientRect 实现）
                if (vueInstance.stageInstance && vueInstance.baseLayerInstance) {
                    var stageWidth = vueInstance.stageInstance.width();
                    var stageHeight = vueInstance.stageInstance.height();
                    
                    // 保存当前的舞台位置
                    var currentStagePos = vueInstance.stageInstance.position();
                    
                    // 临时设置舞台位置为 (0, 0)，以便正确计算 Group 的绝对位置
                    vueInstance.stageInstance.position({ x: 0, y: 0 });
                    
                    // 设置缩放
                    vueInstance.stageInstance.scale({ x: fitScale, y: fitScale });
                    
                    // 使用 getClientRect() 获取缩放后 Group 的实际显示区域（相对于舞台原点）
                    var rect = vueInstance.baseLayerInstance.getClientRect();
                    
                    // 计算居中位置：让内容区域在舞台中心
                    var centerX = (stageWidth - rect.width) / 2 - rect.x;
                    var centerY = (stageHeight - rect.height) / 2 - rect.y;
                    
                    vueInstance.stageInstance.position({ x: centerX, y: centerY });
                    vueInstance.stageInstance.draw();
                }
            }
        },

        /**
         * ==================== 【文件交互】 ====================
         * 文件上传交互
         */

        /**
         * 编辑器文件上传事件处理
         * @param {Object} vueInstance - Vue实例
         * @param {Event} event - 文件上传事件对象
         */
        onEditorFileChange: function (vueInstance, event) {
            var file = event.target.files[0];
            if (!file) return;

            // 验证文件类型
            if (!file.type.match('image/jpeg|image/png')) {
                if (vueInstance.showToast) {
                    vueInstance.showToast('请上传JPG或PNG格式的图片');
                }
                return;
            }

            // 读取文件
            var reader = new FileReader();
            reader.onload = function (e) {
                var imgData = e.target.result;
                // 设置为编辑器底图
                vueInstance.editor.baseImage = imgData;
                // 标记为自定义底图，以便保存状态
                var savedState = vueInstance.materialEditStates[vueInstance.editor.targetKey] || {};
                savedState.customBaseImage = imgData;
                vueInstance.materialEditStates[vueInstance.editor.targetKey] = savedState;
                // 更新恢复按钮状态
                if (vueInstance.updateRestoreBtnState) {
                    vueInstance.updateRestoreBtnState();
                }
            };
            reader.readAsDataURL(file);

            // 清空文件输入，允许重复上传同一文件
            event.target.value = '';
        },

        /**
         * 触发编辑器上传
         * @param {Object} vueInstance - Vue实例
         */
        triggerEditorUpload: function (vueInstance) {
            if (vueInstance.$refs.editorFileInput) {
                vueInstance.$refs.editorFileInput.click();
            }
        }
    };

    // 导出模块
    window.MeeWoo.Core.MaterialInteractions = MaterialInteractions;
})(window);
