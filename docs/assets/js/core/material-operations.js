/**
 * ==================== 素材编辑器操作模块 (Material Operations) ====================
 * 
 * 模块索引：
 * 1. 【样式处理】 - CSS样式过滤和处理相关方法
 * 2. 【渲染模块】 - Canvas渲染相关方法（预留未来拆分）
 * 3. 【导出模块】 - 图片导出相关方法（预留未来拆分）
 * 4. 【编辑器控制】 - 素材编辑器控制相关方法
 * 
 * 功能说明：
 * 提供素材编辑器的操作功能，包括：
 * 1. CSS样式处理和过滤
 * 2. Canvas渲染功能（当前实现，未来可拆分到 renderer 模块）
 * 3. 图片导出功能（当前实现，未来可拆分到 exporter 模块）
 * 4. 素材编辑器控制操作
 * 
 * 使用方式：
 * 在 material-editor.js 中引入此文件，并使用 MeeWoo.Core.MaterialOperations 模块
 */

(function (window) {
    'use strict';

    // 确保命名空间
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Core = window.MeeWoo.Core || {};

    /**
     * 素材编辑器操作模块
     */
    var MaterialOperations = {
        /**
         * ==================== 【样式处理】 ====================
         * CSS样式过滤和处理相关方法
         */

        /**
         * 过滤CSS样式，只保留允许的属性，过滤掉布局相关属性
         * 避免用户粘贴的CSS包含 position/width/height 等破坏布局
         * @param {string} styleStr - 原始样式字符串
         * @returns {Object} 过滤后的样式对象
         */
        filterTextStyle: function (styleStr) {
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
        convertStylesToCssString: function (styles) {
            var str = '';
            for (var key in styles) {
                if (styles.hasOwnProperty(key)) {
                    str += key + ':' + styles[key] + ';';
                }
            }
            return str;
        },

        /**
         * ==================== 【渲染模块】 ====================
         * Canvas渲染相关方法（预留未来拆分）
         */

        /**
         * 渲染编辑器预览 Canvas
         * @param {Object} vueInstance - Vue实例
         */
        renderEditorPreview: function (vueInstance) {
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

                var ctx = canvas.getContext('2d', { willReadFrequently: true });
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
         * 解析描边样式
         * @param {string} strokeStr - 描边样式字符串
         * @returns {Object|null} 描边对象 {width, color} 或 null
         */
        parseStroke: function (strokeStr) {
            if (!strokeStr) return null;

            // 匹配格式: width color
            var match = strokeStr.match(/(-?[\d.]+(?:px|em)?)\s+(#[0-9a-fA-F]+|rgba?\([^)]+\)|transparent)/i);
            if (match) {
                return {
                    width: parseFloat(match[1]),
                    color: match[2]
                };
            }
            return null;
        },

        /**
         * 使用 Canvas API 绘制富文本（支持渐变、描边、投影）
         * @param {Object} vueInstance - Vue实例
         * @param {CanvasRenderingContext2D} ctx - Canvas上下文
         * @param {number} canvasWidth - 画布宽度
         * @param {number} canvasHeight - 画布高度
         */
        drawRichText: function (vueInstance, ctx, canvasWidth, canvasHeight) {
            var style = vueInstance.editorTextStyleFiltered;
            var text = vueInstance.editor.textContent;
            if (!text) return;

            var fontSize = parseFloat(style['font-size']) || 24;
            var fontFamily = style['font-family'] || 'sans-serif';
            var fontWeight = style['font-weight'] || 'normal';
            var fontStyle = style['font-style'] || 'normal';

            // 清除引号
            fontFamily = fontFamily.replace(/['"]/g, '');

            ctx.save();

            // 1. 字体设置
            ctx.font = fontStyle + ' ' + fontWeight + ' ' + fontSize + 'px "' + fontFamily + '"';
            ctx.textAlign = vueInstance.editor.textAlign;
            ctx.textBaseline = 'middle';

            // 2. 解析渐变（如果有）
            var fillStyle = style['color'] || '#000000';
            var bgStr = style['background'] || style['background-image'];
            var hasBackgroundClip = style['-webkit-background-clip'] === 'text' || style['background-clip'] === 'text';

            // 将文本按换行符分割成多行（提前计算，用于渐变计算）
            var lines = text.split('\n');
            var lineHeight = fontSize * 1.2; // 行高为字体大小的1.2倍
            var totalHeight = lines.length * lineHeight;

            if (bgStr && bgStr.indexOf('gradient') !== -1 && hasBackgroundClip) {
                // 解析渐变方向
                var angleMatch = bgStr.match(/linear-gradient\((\d+)deg/);
                var angle = angleMatch ? parseInt(angleMatch[1]) : 180; // 默认 180deg

                // 解析颜色停靠点
                var colors = [];
                var colorRegex = /(#[0-9a-fA-F]+|rgba?\([^)]+\))\s*(\d+(?:\.\d+)?%?)/g;
                var m;
                while ((m = colorRegex.exec(bgStr)) !== null) {
                    var stop = m[2];
                    // 处理百分比
                    if (stop.indexOf('%') !== -1) {
                        stop = parseFloat(stop) / 100;
                    } else {
                        stop = parseFloat(stop) / 100;
                    }
                    colors.push({
                        color: m[1],
                        stop: stop
                    });
                }

                if (colors.length >= 2) {
                    // 确保第一个和最后一个停靠点
                    if (colors[0].stop === null || isNaN(colors[0].stop)) colors[0].stop = 0;
                    if (colors[colors.length - 1].stop === null || isNaN(colors[colors.length - 1].stop)) {
                        colors[colors.length - 1].stop = 1;
                    }

                    // 根据角度设置渐变方向（使用总高度）
                    var x0, y0, x1, y1;

                    if (angle === 0) {
                        // 0deg: 从下到上
                        x0 = 0; y0 = totalHeight / 2; x1 = 0; y1 = -totalHeight / 2;
                    } else if (angle === 90) {
                        // 90deg: 从左到右
                        // 使用最长一行的宽度
                        var maxWidth = 0;
                        for (var i = 0; i < lines.length; i++) {
                            var w = ctx.measureText(lines[i]).width;
                            if (w > maxWidth) maxWidth = w;
                        }
                        x0 = -maxWidth / 2; y0 = 0; x1 = maxWidth / 2; y1 = 0;
                    } else if (angle === 270) {
                        // 270deg: 从右到左
                        var maxWidth = 0;
                        for (var i = 0; i < lines.length; i++) {
                            var w = ctx.measureText(lines[i]).width;
                            if (w > maxWidth) maxWidth = w;
                        }
                        x0 = maxWidth / 2; y0 = 0; x1 = -maxWidth / 2; y1 = 0;
                    } else {
                        // 180deg 或默认: 从上到下
                        x0 = 0; y0 = -totalHeight / 2; x1 = 0; y1 = totalHeight / 2;
                    }

                    var grad = ctx.createLinearGradient(x0, y0, x1, y1);

                    for (var k = 0; k < colors.length; k++) {
                        var s = Math.max(0, Math.min(1, colors[k].stop));
                        grad.addColorStop(s, colors[k].color);
                    }
                    fillStyle = grad;
                }
            }

            // 3. 绘制投影 (text-shadow) - 多层阴影
            // 计算居中起始位置
            var startY = -(totalHeight / 2) + (lineHeight / 2); // 居中起始Y坐标

            if (style['text-shadow']) {
                var shadowsStr = style['text-shadow'];

                // 处理 rgba 中的逗号，避免分割错误
                var tempStr = shadowsStr.replace(/rgba?\([^)]+\)/gi, function (match) {
                    return match.replace(/,/g, '|');
                });

                var shadowsArr = tempStr.split(',').map(function (s) {
                    return s.replace(/\|/g, ',').trim();
                });

                // 绘制每层阴影（逐行绘制）
                for (var i = 0; i < shadowsArr.length; i++) {
                    var shadow = shadowsArr[i];
                    // 解析: offsetX offsetY [blur] color
                    var shadowMatch = shadow.match(/(-?[\d.]+(?:px)?|0)\s+(-?[\d.]+(?:px)?|0)(?:\s+(-?[\d.]+(?:px)?|0))?\s+(#[0-9a-fA-F]+|rgba?\([^)]+\))/i);

                    if (shadowMatch) {
                        ctx.save();
                        ctx.shadowOffsetX = parseFloat(shadowMatch[1]);
                        ctx.shadowOffsetY = parseFloat(shadowMatch[2]);
                        ctx.shadowBlur = shadowMatch[3] ? parseFloat(shadowMatch[3]) : 0;
                        ctx.shadowColor = shadowMatch[4];

                        // 绘制每一行的阴影（使用渐变或纯色作为 fillStyle）
                        ctx.fillStyle = fillStyle;
                        for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                            var lineY = startY + (lineIdx * lineHeight);
                            ctx.fillText(lines[lineIdx], 0, lineY);
                        }
                        ctx.restore();
                    }
                }

                // 清除阴影设置
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.shadowBlur = 0;
            }

            // 4. 绘制描边 (Stroke)（逐行绘制）
            var strokeStr = style['-webkit-text-stroke'] || style['border'];
            if (strokeStr) {
                var stroke = this.parseStroke(strokeStr);
                if (stroke) {
                    ctx.lineWidth = stroke.width;

                    // 特殊处理：如果描边颜色是 transparent 且有渐变填充，则使用渐变作为描边色
                    // 这样可以实现文字描边渐变的效果（需配合 background-clip: text 和 transparent 描边色）
                    ctx.strokeStyle = (stroke.color === 'transparent' && fillStyle instanceof CanvasGradient)
                        ? fillStyle
                        : stroke.color;

                    ctx.lineJoin = 'round';
                    for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                        var lineY = startY + (lineIdx * lineHeight);
                        ctx.strokeText(lines[lineIdx], 0, lineY);
                    }
                }
            }

            // 5. 绘制填充 (Fill)（逐行绘制）
            ctx.fillStyle = fillStyle;
            for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                var lineY = startY + (lineIdx * lineHeight);
                ctx.fillText(lines[lineIdx], 0, lineY);
            }

            ctx.restore();
        },

        /**
         * ==================== 【导出模块】 ====================
         * 图片导出相关方法（预留未来拆分）
         */

        /**
         * 生成编辑后的素材图
         * @param {Object} vueInstance - Vue实例
         * @returns {Promise<string>} 生成的图片DataURL
         */
        generateEditedMaterial: function (vueInstance) {
            return new Promise(function (resolve, reject) {
                // 使用 html2canvas 生成图片
                if (typeof html2canvas !== 'undefined') {
                    var container = vueInstance.$refs.editorPreviewContent;
                    if (!container) {
                        reject(new Error('Editor preview container not found'));
                        return;
                    }

                    // 性能优化：渲染前移除不必要的元素
                    var editorControls = container.querySelector('.editor-controls');
                    var originalControls = null;
                    if (editorControls) {
                        originalControls = editorControls;
                        editorControls.parentNode.removeChild(editorControls);
                    }

                    html2canvas(container, {
                        backgroundColor: null, // 透明背景
                        scale: 1, // 使用原始比例
                        logging: false, // 关闭日志输出
                        timeout: 10000, // 增加超时时间
                        useCORS: true, // 允许跨域图片
                        allowTaint: true, // 允许污染画布
                        ignoreElements: function (element) {
                            // 忽略不需要渲染的元素，如编辑器控件
                            return element.classList &&
                                (element.classList.contains('editor-controls') ||
                                    element.classList.contains('editor-toolbar') ||
                                    element.classList.contains('editor-buttons') ||
                                    element.classList.contains('editor-layer-tag'));
                        },
                        // 性能优化配置
                        cacheBust: false, // 禁用缓存破坏，提高性能
                        imageTimeout: 3000, // 缩短图片加载超时时间
                        removeContainer: false, // 禁用移除容器，提高性能
                        skipFonts: false, // 不禁用字体，确保文字渲染正确
                        useWebGL: false, // 禁用WebGL，提高兼容性
                        onclone: function (document) {
                            // 克隆前的优化处理
                            var clonedContent = document.querySelector('.editor-preview-content');
                            if (clonedContent) {
                                // 移除所有子元素的事件监听器
                                var newContent = clonedContent.cloneNode(true);
                                clonedContent.parentNode.replaceChild(newContent, clonedContent);
                            }
                        },
                        // 只渲染必要的内容
                        width: container.clientWidth,
                        height: container.clientHeight
                    }).then(function (canvas) {
                        // 恢复移除的元素
                        if (originalControls) {
                            container.appendChild(originalControls);
                        }

                        var dataURL = canvas.toDataURL('image/png', 1.0);
                        resolve(dataURL);
                    }).catch(function (error) {
                        // 恢复移除的元素
                        if (originalControls) {
                            container.appendChild(originalControls);
                        }

                        console.error('Error generating material:', error);
                        reject(error);
                    });
                } else {
                    reject(new Error('html2canvas is not loaded'));
                }
            });
        },

        /**
         * ==================== 【编辑器控制】 ====================
         * 素材编辑器控制相关方法
         */

        /**
         * 设置文字对齐方式
         * @param {Object} vueInstance - Vue实例
         * @param {string} align - 对齐方式: 'left' | 'center' | 'right'
         */
        setTextAlign: function (vueInstance, align) {
            vueInstance.editor.textAlign = align;
            this.renderEditorPreview(vueInstance);
        },

        /**
         * 恢复原始素材图
         * @param {Object} vueInstance - Vue实例
         * @param {string|number} indexOrKey - 索引或素材键值（可选）
         */
        restoreOriginalMaterial: function (vueInstance, indexOrKey) {
            var targetKey;
            var material;

            // 如果提供了索引或键值，直接使用
            if (indexOrKey !== undefined) {
                if (typeof indexOrKey === 'number') {
                    material = vueInstance.materialList[indexOrKey];
                    if (material) {
                        targetKey = material.imageKey;
                    }
                } else {
                    targetKey = indexOrKey;
                    material = vueInstance.materialList.find(function (item) {
                        return item.imageKey === targetKey;
                    });
                }
            } else {
                // 否则使用编辑器当前的targetKey
                targetKey = vueInstance.editor.targetKey;
                if (targetKey) {
                    material = vueInstance.materialList.find(function (item) {
                        return item.imageKey === targetKey;
                    });
                }
            }

            if (!targetKey || !material) return;

            // 1. 清除编辑状态记录
            window.MeeWoo.Core.MaterialState.clearMaterialEditState(vueInstance.materialEditStates, targetKey);

            // 2. 恢复素材列表中的预览图为原图
            // 恢复 previewUrl 为 originalUrl 或 originalData
            if (material.originalUrl) {
                material.previewUrl = material.originalUrl;
            } else if (material.originalData) {
                material.previewUrl = material.originalData.startsWith('data:') ? material.originalData : ('data:image/png;base64,' + material.originalData);
            }

            material.isReplaced = false;

            // 3. 移除替换记录 - 使用新对象触发响应式更新
            if (vueInstance.replacedImages) {
                var newReplacedImages = Object.assign({}, vueInstance.replacedImages);
                delete newReplacedImages[targetKey];
                vueInstance.replacedImages = newReplacedImages;
            }

            // 4. 如果编辑器正在打开且当前编辑的是该素材，重置编辑器内部状态为默认值
            if (vueInstance.editor && vueInstance.editor.targetKey === targetKey) {
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

                // 恢复视图状态为居中100%显示
                vueInstance.editor.scale = 1.0; // 重置缩放比例为100%
                vueInstance.editor.offsetX = 0; // 重置水平偏移为0
                vueInstance.editor.offsetY = 0; // 重置垂直偏移为0
                vueInstance.editor.viewMode = 'fit-height'; // 重置视图模式为适应高度

                // 5. 恢复底图为原始图
                vueInstance.editor.baseImage = material.originalUrl || material.previewUrl;

                // 重新渲染预览
                this.renderEditorPreview(vueInstance);
            }

            // 6. 重新渲染 SVGA
            if (vueInstance.applyReplacedMaterials) {
                vueInstance.applyReplacedMaterials();
            }

            // 提示用户
            if (vueInstance.showToast) {
                vueInstance.showToast('已恢复原图');
            }
        },

        /**
         * 打开素材编辑器
         * @param {Object} vueInstance - Vue实例
         * @param {Object} item - 素材对象
         */
        openMaterialEditor: function (vueInstance, item) {
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

            // 获取当前显示的图片 - 重要！只使用原始图，不使用合成图
            // 1. 首先尝试使用原始图（originalUrl）
            // 2. 如果不存在，尝试使用原始数据（originalData）
            // 3. 注意：永远不使用material.previewUrl，因为它是最终合成的图片（底图+文字）
            var imgUrl;
            if (material.originalUrl) {
                // 优先使用原始图URL
                imgUrl = material.originalUrl;
            } else if (material.originalData) {
                // 如果没有originalUrl，使用originalData（通常是base64格式）
                imgUrl = material.originalData.startsWith('data:') ? material.originalData : ('data:image/png;base64,' + material.originalData);
            } else {
                // 作为最后的备选，才使用material.previewUrl（避免无法显示）
                // 但这不是理想情况，因为previewUrl是合成图
                imgUrl = material.previewUrl;
            }

            // 设置默认底图，用于 hasEditInfo 比较
            vueInstance.editor.defaultBaseImage = imgUrl;
            // 初始化按钮状态
            if (vueInstance.updateRestoreBtnState) {
                vueInstance.updateRestoreBtnState();
            }

            // 编辑器底图逻辑（重要！）：
            // 1. 如果有保存的编辑状态中的customBaseImage，使用它（用户上传的自定义底图）
            // 2. 否则使用上面获取的原始图
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
        loadAndSetImageDimensions: function (vueInstance, imgUrl) {
            var img = new Image();
            img.onload = function () {
                vueInstance.editor.baseImageWidth = img.width;
                vueInstance.editor.baseImageHeight = img.height;
                vueInstance.editor.baseImage = imgUrl;

                // 图片加载完成后，重新渲染预览
                if (vueInstance.editor.showText) {
                    vueInstance.$nextTick(function () {
                        vueInstance.renderEditorPreview();
                    });
                }
            };
            img.onerror = function () {
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
        generateEditedMaterial: function (vueInstance) {
            return new Promise(function (resolve, reject) {
                // 使用 html2canvas 生成图片
                if (typeof html2canvas !== 'undefined') {
                    var container = vueInstance.$refs.editorPreviewContent;
                    if (!container) {
                        reject(new Error('Editor preview container not found'));
                        return;
                    }

                    // 性能优化：渲染前移除不必要的元素
                    var editorControls = container.querySelector('.editor-controls');
                    var originalControls = null;
                    if (editorControls) {
                        originalControls = editorControls;
                        editorControls.parentNode.removeChild(editorControls);
                    }

                    html2canvas(container, {
                        backgroundColor: null, // 透明背景
                        scale: 1, // 使用原始比例
                        logging: false, // 关闭日志输出
                        timeout: 10000, // 增加超时时间
                        useCORS: true, // 允许跨域图片
                        allowTaint: true, // 允许污染画布
                        ignoreElements: function (element) {
                            // 忽略不需要渲染的元素，如编辑器控件
                            return element.classList &&
                                (element.classList.contains('editor-controls') ||
                                    element.classList.contains('editor-toolbar') ||
                                    element.classList.contains('editor-buttons') ||
                                    element.classList.contains('editor-layer-tag'));
                        },
                        // 性能优化配置
                        cacheBust: false, // 禁用缓存破坏，提高性能
                        imageTimeout: 3000, // 缩短图片加载超时时间
                        removeContainer: false, // 禁用移除容器，提高性能
                        skipFonts: false, // 不禁用字体，确保文字渲染正确
                        useWebGL: false, // 禁用WebGL，提高兼容性
                        onclone: function (document) {
                            // 克隆前的优化处理
                            var clonedContent = document.querySelector('.editor-preview-content');
                            if (clonedContent) {
                                // 移除所有子元素的事件监听器
                                var newContent = clonedContent.cloneNode(true);
                                clonedContent.parentNode.replaceChild(newContent, clonedContent);
                            }
                        },
                        // 只渲染必要的内容
                        width: container.clientWidth,
                        height: container.clientHeight
                    }).then(function (canvas) {
                        // 恢复移除的元素
                        if (originalControls) {
                            container.appendChild(originalControls);
                        }

                        var dataURL = canvas.toDataURL('image/png', 1.0);
                        resolve(dataURL);
                    }).catch(function (error) {
                        // 恢复移除的元素
                        if (originalControls) {
                            container.appendChild(originalControls);
                        }

                        console.error('Error generating material:', error);
                        reject(error);
                    });
                } else {
                    reject(new Error('html2canvas is not loaded'));
                }
            });
        },

















        /**
         * 关闭素材编辑器
         * @param {Object} vueInstance - Vue实例
         */
        closeMaterialEditor: function (vueInstance) {
            vueInstance.editor.show = false;
        },

        /**
         * 保存素材编辑
         * @param {Object} vueInstance - Vue实例
         */
        saveMaterialEdit: function (vueInstance) {
            vueInstance.editor.loading = true;

            // 生成编辑后的素材图
            vueInstance.generateEditedMaterial().then(function (dataURL) {
                // 更新素材列表中的预览图
                var targetKey = vueInstance.editor.targetKey;
                if (targetKey) {
                    var material = vueInstance.materialList.find(function (item) {
                        return item.imageKey === targetKey;
                    });

                    if (material) {
                        // 保存编辑状态
                        window.MeeWoo.Core.MaterialState.saveMaterialEditState(
                            vueInstance.materialEditStates,
                            targetKey,
                            vueInstance.editor
                        );

                        // 更新素材预览图
                        material.previewUrl = dataURL;
                        // 更新替换图片映射
                        vueInstance.replacedImages[targetKey] = dataURL;
                        // 设置isReplaced为true，显示恢复原图按钮
                        material.isReplaced = true;

                        // 关闭编辑器
                        vueInstance.editor.show = false;
                        vueInstance.editor.loading = false;

                        // 显示成功提示
                        if (vueInstance.showToast) {
                            vueInstance.showToast('素材编辑已保存');
                        }
                    }
                }
            }).catch(function (error) {
                console.error('Failed to save material edit:', error);
                vueInstance.editor.loading = false;
                if (vueInstance.showToast) {
                    vueInstance.showToast('保存失败，请重试');
                }
            });
        }
    };

    // 导出模块
    window.MeeWoo.Core.MaterialOperations = MaterialOperations;
})(window);