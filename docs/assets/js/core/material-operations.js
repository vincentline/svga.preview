/**
 * ==================== 素材编辑器操作模块 (Material Operations) ====================
 * 
 * 模块索引：
 * 1. 【样式处理】 - CSS样式过滤和处理相关方法
 * 2. 【渲染模块】 - Canvas渲染相关方法（预留未来拆分）
 * 3. 【导出模块】 - 图片导出相关方法（预留未来拆分）
 * 4. 【交互操作】 - 素材编辑交互相关方法
 * 
 * 功能说明：
 * 提供素材编辑器的操作功能，包括：
 * 1. CSS样式处理和过滤
 * 2. Canvas渲染功能（当前实现，未来可拆分到 renderer 模块）
 * 3. 图片导出功能（当前实现，未来可拆分到 exporter 模块）
 * 4. 素材编辑交互操作
 * 
 * 使用方式：
 * 在 material-editor.js 中引入此文件，并使用 MeeWoo.Core.MaterialOperations 模块
 */

(function(window) {
    'use strict';

    // 确保命名空间
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Core = window.MeeWoo.Core || {};

    /**
     * 素材编辑器操作模块
     */
    var MaterialOperations = {
        /**
         * 过滤CSS样式，只保留允许的属性，过滤掉布局相关属性
         * 避免用户粘贴的CSS包含 position/width/height 等破坏布局
         * @param {string} styleStr - 原始样式字符串
         * @returns {Object} 过滤后的样式对象
         */
        filterTextStyle: function(styleStr) {
            if (!styleStr) return {};

            var styles = {};

            // 去除注释
            styleStr = styleStr.replace(/\/\*[\s\S]*?\*\//g, '');

            // 分割属性
            var rules = styleStr.split(';');

            // 黑名单：布局、尺寸、定位相关的属性
            var blockedProperties = [
                'position',
                'top', 'bottom', 'left', 'right',
                'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
                // 'display', // 允许 display 以支持某些文字特效
                'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-direction', 'flex-wrap', 'flex-flow',
                'justify-content', 'justify-items', 'justify-self',
                'align-content', 'align-items', 'align-self',
                'place-content', 'place-items', 'place-self',
                'order', 'gap',
                'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                'z-index',
                'transform', 'transform-origin',
                'float', 'clear',
                'white-space',
                'overflow', 'overflow-x', 'overflow-y',
                'line-height',
                'text-decoration', 'text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-decoration-thickness'
            ];

            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i].trim();
                if (!rule) continue;

                var colonIndex = rule.indexOf(':');
                if (colonIndex === -1) continue;

                var prop = rule.substring(0, colonIndex).trim().toLowerCase();
                var value = rule.substring(colonIndex + 1).trim();

                if (!prop || !value) continue;

                // 检查是否在黑名单中
                if (blockedProperties.indexOf(prop) !== -1) {
                    continue;
                }

                styles[prop] = value;
            }

            // 自动修复：如果使用了 background-clip: text，必须确保文字颜色透明
            // 仅当背景是渐变时才自动修复（因为我们只支持渐变背景，不支持图片背景）
            var hasBackgroundClip = styles['-webkit-background-clip'] === 'text' || styles['background-clip'] === 'text';
            var hasTransparentColor = styles['color'] === 'transparent' || styles['-webkit-text-fill-color'] === 'transparent' || styles['text-fill-color'] === 'transparent';
            var bg = styles['background'] || styles['background-image'] || '';
            var isGradient = bg.indexOf('gradient') !== -1;

            if (hasBackgroundClip && !hasTransparentColor && isGradient) {
                styles['color'] = 'transparent';
                // 某些浏览器可能需要这个
                if (!styles['-webkit-text-fill-color']) {
                    styles['-webkit-text-fill-color'] = 'transparent';
                }
            }

            return styles;
        },

        /**
         * 将样式对象转换为CSS字符串
         * @param {Object} styles - 样式对象
         * @returns {string} CSS字符串
         */
        convertStylesToCssString: function(styles) {
            var str = '';
            for (var key in styles) {
                if (styles.hasOwnProperty(key)) {
                    str += key + ':' + styles[key] + ';';
                }
            }
            return str;
        },

        /**
         * 渲染编辑器预览 Canvas
         * @param {Object} vueInstance - Vue实例
         */
        renderEditorPreview: function(vueInstance) {
            var self = this;
            if (!vueInstance.editor.show || !vueInstance.editor.showText) {
                return;
            }

            // 等待 Canvas 元素渲染
            vueInstance.$nextTick(function () {
                var canvas = vueInstance.$refs.editorTextCanvas;
                if (!canvas) {
                    return;
                }

                var ctx = canvas.getContext('2d');
                var width = vueInstance.editor.baseImageWidth;
                var height = vueInstance.editor.baseImageHeight;

                // 清空 Canvas
                ctx.clearRect(0, 0, width, height);

                // 计算文字位置
                var centerX = (width * vueInstance.editor.textPosX) / 100;
                var centerY = (height * vueInstance.editor.textPosY) / 100;

                // 保存状态
                ctx.save();

                // 移动到文字中心点
                ctx.translate(centerX, centerY);

                // 应用缩放
                ctx.scale(vueInstance.editor.textScale, vueInstance.editor.textScale);

                // 使用 drawRichText 绘制带样式的文字
                self.drawRichText(vueInstance, ctx, width, height);

                // 恢复状态
                ctx.restore();
            });
        },

        /**
         * 绘制富文本（带样式的文字）
         * @param {Object} vueInstance - Vue实例
         * @param {CanvasRenderingContext2D} ctx - Canvas上下文
         * @param {number} canvasWidth - 画布宽度
         * @param {number} canvasHeight - 画布高度
         */
        drawRichText: function(vueInstance, ctx, canvasWidth, canvasHeight) {
            var text = vueInstance.editor.textContent;
            var filteredStyles = vueInstance.editorTextStyleFiltered;

            // 设置文字对齐
            ctx.textAlign = vueInstance.editor.textAlign;
            
            // 根据对齐方式调整基准点
            var alignmentOffset = 0;
            if (vueInstance.editor.textAlign === 'center') {
                alignmentOffset = 0;
            } else if (vueInstance.editor.textAlign === 'right') {
                alignmentOffset = canvasWidth * 0.5;
            } else { // left
                alignmentOffset = -canvasWidth * 0.5;
            }

            // 应用样式
            for (var prop in filteredStyles) {
                if (filteredStyles.hasOwnProperty(prop)) {
                    // 将CSS属性转换为Canvas属性
                    var canvasProp = this.cssToCanvasProperty(prop);
                    if (canvasProp) {
                        ctx[canvasProp] = filteredStyles[prop];
                    }
                }
            }

            // 绘制文字
            ctx.fillText(text, alignmentOffset, 0);
        },

        /**
         * 将CSS属性名转换为Canvas上下文属性名
         * @param {string} cssProp - CSS属性名
         * @returns {string} Canvas属性名或null
         */
        cssToCanvasProperty: function(cssProp) {
            var mapping = {
                'color': 'fillStyle',
                'font-family': 'fontFamily',
                'font-size': 'fontSize',
                'font-weight': 'fontWeight',
                'font-style': 'fontStyle',
                'text-align': 'textAlign',
                'line-height': 'lineHeight'
            };

            // 处理常见的字体相关属性组合
            if (cssProp === 'font') {
                return 'font';
            }

            // 简单处理一些常见映射
            if (mapping[cssProp]) {
                return mapping[cssProp];
            }

            // 将连字符命名转换为驼峰命名
            return cssProp.replace(/-([a-z])/g, function(match, letter) {
                return letter.toUpperCase();
            });
        },

        /**
         * 清理拖拽事件监听器
         * @param {Object} editor - 编辑器状态对象
         */
        clearDragListeners: function(editor) {
            if (editor.dragHandlers) {
                if (editor.dragHandlers.mousemove) {
                    document.removeEventListener('mousemove', editor.dragHandlers.mousemove);
                }
                if (editor.dragHandlers.mouseup) {
                    document.removeEventListener('mouseup', editor.dragHandlers.mouseup);
                }
                editor.dragHandlers = null;
            }
        },

        /**
         * 设置文字对齐方式
         * @param {Object} vueInstance - Vue实例
         * @param {string} align - 对齐方式: 'left' | 'center' | 'right'
         */
        setTextAlign: function(vueInstance, align) {
            vueInstance.editor.textAlign = align;
            this.renderEditorPreview(vueInstance);
        },

        /**
         * 恢复原始素材图
         * @param {Object} vueInstance - Vue实例
         */
        restoreOriginalMaterial: function(vueInstance) {
            var targetKey = vueInstance.editor.targetKey;
            if (!targetKey) return;

            // 1. 清除编辑状态记录
            vueInstance.$delete(vueInstance.materialEditStates, targetKey);

            // 2. 恢复素材列表中的预览图为原图
            var material = vueInstance.materialList.find(function (item) {
                return item.imageKey === targetKey;
            });

            if (material) {
                // 恢复 previewUrl 为 originalUrl
                if (material.originalUrl) {
                    material.previewUrl = material.originalUrl;
                }

                // 3. 重置编辑器内部状态为默认值
                vueInstance.editor.showImage = true;
                vueInstance.editor.showText = false; // 关闭显示文案按钮
                vueInstance.editor.textContent = '示例文案'; // 内容恢复默认
                vueInstance.editor.textStyle = 'color: white;\ntext-shadow: 1px 1px 2px #000000;\nfont-size: 24px;\nfont-weight: bold;';
                vueInstance.editor.textPosX = 50;
                vueInstance.editor.textPosY = 50;
                vueInstance.editor.textScale = 1.0;
                vueInstance.editor.textAlign = 'left'; // 重置对齐方式为左对齐
                vueInstance.editor.imageOffsetX = 0;
                vueInstance.editor.imageOffsetY = 0;
                vueInstance.editor.imageScale = 1.0;
                vueInstance.editor.showRestoreBtn = false; // 显式重置按钮状态

                // 4. 恢复底图为原始图
                vueInstance.editor.baseImage = material.originalUrl || material.previewUrl;

                // 重新渲染预览
                this.renderEditorPreview(vueInstance);

                // 提示用户
                if (vueInstance.showToast) {
                    vueInstance.showToast('已恢复原图');
                }
            }
        },

        /**
         * 打开素材编辑器
         * @param {Object} vueInstance - Vue实例
         * @param {Object} item - 素材对象
         */
        openMaterialEditor: function(vueInstance, item) {
            console.log('openMaterialEditor called', item);
            var material = item;

            // 兼容旧的索引调用方式（防御性编程）
            if (typeof item === 'number') {
                material = vueInstance.materialList[item];
            }

            if (!material) {
                console.error('Material not found');
                return;
            }

            // 加载html2canvas库
            if (vueInstance.loadLibrary) {
                vueInstance.loadLibrary('html2canvas', true).catch(function (err) {
                    console.error('Failed to load html2canvas', err);
                });
            } else {
                console.warn('loadLibrary method missing');
            }

            // 初始化编辑器状态
            // 使用 imageKey 作为唯一标识，而不是 index
            vueInstance.editor.targetKey = material.imageKey;
            vueInstance.editor.show = true;
            vueInstance.editor.loading = false;
            vueInstance.editor.viewMode = 'fit-height'; // 默认适应高度模式
            vueInstance.editor.scale = 1.0;
            vueInstance.editor.offsetX = 0;
            vueInstance.editor.offsetY = 0;

            console.log('Editor state set to show=true', vueInstance.editor);

            // 恢复之前的编辑状态 或 初始化默认值
            var savedState = vueInstance.materialEditStates[material.imageKey];
            if (savedState) {
                vueInstance.editor.showImage = savedState.showImage;
                vueInstance.editor.showText = savedState.showText;
                vueInstance.editor.textContent = savedState.textContent || '';
                vueInstance.editor.textStyle = savedState.textStyle || '';
                vueInstance.editor.textPosX = savedState.textPosX !== undefined ? savedState.textPosX : 50;
                vueInstance.editor.textPosY = savedState.textPosY !== undefined ? savedState.textPosY : 50;
                vueInstance.editor.textScale = savedState.textScale !== undefined ? savedState.textScale : 1.0;
                vueInstance.editor.textAlign = savedState.textAlign !== undefined ? savedState.textAlign : 'left';
                vueInstance.editor.imageOffsetX = savedState.imageOffsetX !== undefined ? savedState.imageOffsetX : 0;
                vueInstance.editor.imageOffsetY = savedState.imageOffsetY !== undefined ? savedState.imageOffsetY : 0;
                vueInstance.editor.imageScale = savedState.imageScale !== undefined ? savedState.imageScale : 1.0;
            } else {
                vueInstance.editor.showImage = true;
                vueInstance.editor.showText = false;
                vueInstance.editor.textContent = '示例文案';
                vueInstance.editor.textStyle = 'color: white;\ntext-shadow: 1px 1px 2px #000000;\nfont-size: 24px;\nfont-weight: bold;';
                vueInstance.editor.textPosX = 50;
                vueInstance.editor.textPosY = 50;
                vueInstance.editor.textScale = 1.0;
                vueInstance.editor.textAlign = 'left';
                vueInstance.editor.imageOffsetX = 0;
                vueInstance.editor.imageOffsetY = 0;
                vueInstance.editor.imageScale = 1.0;
            }

            // 重置激活状态
            vueInstance.editor.activeElement = 'none';
            vueInstance.editor.lastClickElement = 'none';
            vueInstance.editor.lastClickTime = 0;

            // 获取当前显示的图片
            // 首先尝试使用原始图（originalUrl），如果不存在则使用previewUrl
            var imgUrl = material.originalUrl || material.previewUrl;

            // 设置默认底图，用于 hasEditInfo 比较
            vueInstance.editor.defaultBaseImage = imgUrl;
            // 初始化按钮状态
            if (vueInstance.updateRestoreBtnState) {
                vueInstance.updateRestoreBtnState();
            }

            // 编辑器底图逻辑（重要！）：
            // 1. 如果有保存的编辑状态中的customBaseImage，使用它（用户上传的自定义底图）
            // 2. 否则使用material.originalUrl或material.previewUrl（SVGA原始图）
            // 
            // 注意：replacedImages和material.previewUrl是最终合成的图片（底图+文字），
            // 不应该用作编辑器的底图，否则会导致文字重复显示

            if (savedState && savedState.customBaseImage) {
                // 使用保存的自定义底图（用户通过"更换底图"上传的图）
                imgUrl = savedState.customBaseImage;
            }

            // 确保图片加载完成后设置尺寸
            this.loadAndSetImageDimensions(vueInstance, imgUrl);
        },

        /**
         * 加载图片并设置尺寸
         * @param {Object} vueInstance - Vue实例
         * @param {string} imgUrl - 图片URL
         */
        loadAndSetImageDimensions: function(vueInstance, imgUrl) {
            var img = new Image();
            img.onload = function() {
                vueInstance.editor.baseImageWidth = img.width;
                vueInstance.editor.baseImageHeight = img.height;
                vueInstance.editor.baseImage = imgUrl;
                
                // 图片加载完成后，重新渲染预览
                if (vueInstance.editor.showText) {
                    vueInstance.$nextTick(function() {
                        vueInstance.renderEditorPreview();
                    });
                }
            };
            img.onerror = function() {
                console.error('Failed to load image:', imgUrl);
            };
            // 允许跨域
            img.crossOrigin = 'Anonymous';
            img.src = imgUrl;
        },

        /**
         * 生成编辑后的素材图
         * @param {Object} vueInstance - Vue实例
         * @returns {Promise<string>} 生成的图片DataURL
         */
        generateEditedMaterial: function(vueInstance) {
            return new Promise(function(resolve, reject) {
                // 使用 html2canvas 生成图片
                if (typeof html2canvas !== 'undefined') {
                    var container = vueInstance.$refs.editorPreviewContainer;
                    if (!container) {
                        reject(new Error('Editor preview container not found'));
                        return;
                    }

                    html2canvas(container, {
                        backgroundColor: null, // 透明背景
                        scale: 1 // 使用原始比例
                    }).then(function(canvas) {
                        var dataURL = canvas.toDataURL('image/png');
                        resolve(dataURL);
                    }).catch(function(error) {
                        console.error('Error generating material:', error);
                        reject(error);
                    });
                } else {
                    reject(new Error('html2canvas is not loaded'));
                }
            });
        }
    };

    // 导出模块
    window.MeeWoo.Core.MaterialOperations = MaterialOperations;
})(window);