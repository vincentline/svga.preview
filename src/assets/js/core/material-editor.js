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
 * 4. 使用 Konva.js 作为唯一的渲染引擎
 * 
 * 依赖模块：
 * - MeeWoo.Core.MaterialState (状态管理)
 * - MeeWoo.Core.MaterialOperations (操作逻辑)
 * 
 * 使用方式：
 * 在 app.js 中引入此文件及相关依赖，并将 MaterialEditor 作为 mixin 混入 Vue 实例
 */

(function (window) {
    'use strict';

    // 确保命名空间存在
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Mixins = window.MeeWoo.Mixins || {};

    var MaterialEditor = {
        data: function () {
            return {
                // 编辑器状态（当前编辑的底图、文字、位置、缩放等）
                editor: window.MeeWoo.Core.MaterialState.getDefaultEditorState(),
                // 所有素材的编辑状态缓存（用于保存每个素材的编辑信息）
                materialEditStates: window.MeeWoo.Core.MaterialState.getDefaultMaterialEditStates(),
                
                // ==================== Konva 实例引用 ====================
                stageInstance: null,          // Konva Stage 实例
                baseLayerInstance: null,      // 底图 Group 实例
                textLayerInstance: null,      // 文字 Image 实例
                transformerInstance: null,    // Transformer 实例（选中框/缩放手柄）
                exportAreaGuide: null,        // 导出区域引导框（虚线矩形）
                
                // Konva Layer 集合（分层管理）
                konvaLayers: {
                    backgroundLayer: null,    // 背景图层（放底图）
                    textLayer: null,          // 文字图层（放文案）
                    transformerLayer: null    // 变换器图层（放在最上层避免被遮挡）
                },
                
                // 文字渲染的 Canvas 缓存
                textCanvas: null,             // 文字渲染的 Canvas 元素
                textCanvasCtx: null           // Canvas 2D 上下文
            };
        },

        computed: {
            /**
             * 过滤后的文字样式对象
             * 移除无效的样式属性，保留有效的 CSS 样式
             */
            editorTextStyleFiltered: function () {
                return window.MeeWoo.Core.MaterialOperations.filterTextStyle(this.editor.textStyle);
            },

            /**
             * 将过滤后的样式对象转换为 CSS 字符串
             * 用于在 Canvas 渲染时应用样式
             */
            editorTextStyleString: function () {
                var styles = this.editorTextStyleFiltered;
                return window.MeeWoo.Core.MaterialOperations.convertStylesToCssString(styles);
            },

            /**
             * 是否有编辑信息（用于显示恢复按钮）
             * 当用户修改了素材后，显示「恢复原图」按钮
             */
            hasEditInfo: function () {
                return this.editor.showRestoreBtn;
            }
        },

        watch: {
            // ==================== 底图相关监听 ====================
            
            /**
             * 监听底图 URL 变化
             * 当用户上传新图片或切换素材时触发，更新 Konva 底图
             */
            'editor.baseImage': function () {
                this.updateRestoreBtnState();
                this.$nextTick(function () {
                    this.updateKonvaBaseImage();
                }.bind(this));
            },
            
            /**
             * 监听底图显示/隐藏状态
             * 控制 Konva 底图层的可见性
             */
            'editor.showImage': function (visible) {
                this.updateRestoreBtnState();
                if (this.baseLayerInstance && this.stageInstance) {
                    this.baseLayerInstance.visible(visible);
                    this.stageInstance.draw();
                }
            },
            
            /**
             * 监听底图位置偏移 X
             * 用户拖拽底图或通过滑块调整时触发
             */
            'editor.imageOffsetX': function () {
                this.updateRestoreBtnState();
                this.syncKonvaBaseImageTransform();
            },
            
            /**
             * 监听底图位置偏移 Y
             */
            'editor.imageOffsetY': function () {
                this.updateRestoreBtnState();
                this.syncKonvaBaseImageTransform();
            },
            
            /**
             * 监听底图缩放比例
             * 用户通过 Transformer 缩放或滑块调整时触发
             */
            'editor.imageScale': function () {
                this.updateRestoreBtnState();
                this.syncKonvaBaseImageTransform();
            },

            // ==================== 文字相关监听 ====================
            
            /**
             * 监听文字显示/隐藏状态
             * 控制 Konva 文字层的可见性，显示时重新渲染文字 Canvas
             */
            'editor.showText': function (visible) {
                this.updateRestoreBtnState();
                if (this.textLayerInstance && this.stageInstance) {
                    this.textLayerInstance.visible(visible);
                    // 当显示文字时，需要重新渲染文字 canvas
                    if (visible) {
                        this.renderTextCanvas();
                    }
                    this.stageInstance.draw();
                }
            },

            /**
             * 监听文字内容变化
             * 用户修改文案内容时触发，重新渲染文字 Canvas
             */
            'editor.textContent': function () {
                this.renderTextCanvas();
                if (this.stageInstance) {
                    this.stageInstance.draw();
                }
            },
            
            /**
             * 监听文字样式变化
             * 用户修改字体、颜色、阴影等样式时触发
             */
            'editor.textStyle': function () {
                this.renderTextCanvas();
                if (this.stageInstance) {
                    this.stageInstance.draw();
                }
            },
            
            /**
             * 监听文字位置 X（百分比坐标，50 为中心）
             */
            'editor.textPosX': function () {
                this.syncKonvaTextPosition();
            },
            
            /**
             * 监听文字位置 Y（百分比坐标，50 为中心）
             */
            'editor.textPosY': function () {
                this.syncKonvaTextPosition();
            },
            
            /**
             * 监听文字缩放比例
             */
            'editor.textScale': function () {
                if (this.textLayerInstance && this.stageInstance) {
                    this.textLayerInstance.scaleX(this.editor.textScale);
                    this.textLayerInstance.scaleY(this.editor.textScale);
                    this.stageInstance.draw();
                }
            },
            
            /**
             * 监听文字对齐方式（left/center/right）
             */
            'editor.textAlign': function () {
                this.renderTextCanvas();
                if (this.stageInstance) {
                    this.stageInstance.draw();
                }
            }
        },

        methods: {
            // ==================== 基础操作方法 ====================
            
            /**
             * 设置文字对齐方式
             * @param {string} align - 对齐方式：'left' | 'center' | 'right'
             */
            setTextAlign: function (align) {
                this.editor.textAlign = align;
            },

            /**
             * 更新「恢复原图」按钮的显示状态
             * 当用户修改了底图位置、缩放或文字内容后，显示恢复按钮
             */
            updateRestoreBtnState: function () {
                window.MeeWoo.Core.MaterialState.updateRestoreButtonState(this.editor);
            },

            /**
             * 清除拖拽监听器（已废弃，保留接口兼容性）
             */
            clearDragListeners: function () {},

            /**
             * 恢复原始素材
             * 将底图和文字恢复到初始状态，清除用户的所有编辑
             */
            restoreOriginalMaterial: function () {
                window.MeeWoo.Core.MaterialOperations.restoreOriginalMaterial(this);
                this.$nextTick(function () {
                    this.updateKonvaBaseImage();
                    this.renderTextCanvas();
                    this.stageInstance.draw();
                }.bind(this));
            },
            
            /**
             * 清除所有素材编辑状态
             * 用于切换 SVGA 文件或重置编辑器时
             */
            clearAllMaterialEditStates: function () {
                this.materialEditStates = window.MeeWoo.Core.MaterialState.getDefaultMaterialEditStates();
            },

            /**
             * 初始化 Konva 舞台
             * 注意：需要在容器尺寸确定后调用，否则会导致渲染异常
             * 如果容器尺寸为0，会自动延迟重试
             */
            initKonvaStage: function () {
                var _this = this;
                var container = this.$refs.editorPreviewContent;
                if (!container) {
                    console.error('[Konva] Container not found: $refs.editorPreviewContent is undefined');
                    return;
                }

                try {
                    if (typeof Konva === 'undefined') {
                        console.error('[Konva] Konva library not loaded');
                        return;
                    }

                    // 获取容器父元素（editor-preview-area）的尺寸
                    var parentElement = container.parentElement;
                    if (!parentElement) {
                        console.error('[Konva] Parent element not found');
                        return;
                    }

                    var containerWidth = parentElement.clientWidth;
                    var containerHeight = parentElement.clientHeight;

                    // 检查容器尺寸是否有效，如果为0则延迟重试
                    // 这是因为弹窗CSS过渡动画未完成时，容器尺寸可能为0
                    if (containerWidth === 0 || containerHeight === 0) {
                        setTimeout(function() {
                            _this.initKonvaStage();
                        }, 100);
                        return;
                    }

                    // 如果舞台已存在，先清除内容并更新尺寸
                    if (this.stageInstance) {
                        this.clearKonvaContent();

                        this.stageInstance.width(containerWidth);
                        this.stageInstance.height(containerHeight);

                        this.textCanvas = null;
                        this.textCanvasCtx = null;

                        this.initExportAreaGuide();
                        this.initKonvaTransformer();

                        this.initKonvaBaseImage();
                        this.initKonvaTextLayer();
                        this.stageInstance.draw();
                        return;
                    }

                    // 创建新的 Konva 舞台
                    this.stageInstance = new Konva.Stage({
                        container: container,
                        width: containerWidth,
                        height: containerHeight
                    });

                    // 创建背景图层（用于显示素材图）
                    this.konvaLayers.backgroundLayer = new Konva.Layer({
                        name: 'backgroundLayer'
                    });
                    this.stageInstance.add(this.konvaLayers.backgroundLayer);

                    // 创建文字图层（用于显示文案）
                    this.konvaLayers.textLayer = new Konva.Layer({
                        name: 'textLayer'
                    });
                    this.stageInstance.add(this.konvaLayers.textLayer);

                    // 创建变换器图层（用于显示选中框）
                    this.konvaLayers.transformerLayer = new Konva.Layer({
                        name: 'transformerLayer'
                    });
                    this.stageInstance.add(this.konvaLayers.transformerLayer);

                    // 初始化导出区域引导框
                    this.initExportAreaGuide();
                    // 初始化变换器
                    this.initKonvaTransformer();

                    // 初始化底图和文字层
                    this.initKonvaBaseImage();
                    this.initKonvaTextLayer();
                    this.stageInstance.draw();
                    // 初始化舞台事件
                    this.initKonvaStageEvents();

                } catch (error) {
                    console.error('Failed to initialize Konva stage:', error);
                }
            },

            /**
             * 初始化导出区域引导框
             * 在舞台中心绘制虚线矩形，标识实际导出的区域
             * 导出区域尺寸 = 原始素材尺寸，位置居中显示
             */
            initExportAreaGuide: function () {
                if (!this.stageInstance) return;

                // 获取舞台尺寸和导出区域尺寸
                var stageWidth = this.stageInstance.width();
                var stageHeight = this.stageInstance.height();
                var exportWidth = this.editor.baseImageWidth || stageWidth;
                var exportHeight = this.editor.baseImageHeight || stageHeight;

                // 计算导出区域的左上角坐标（居中显示）
                var exportX = (stageWidth - exportWidth) / 2;
                var exportY = (stageHeight - exportHeight) / 2;

                // 保存导出区域坐标，供其他方法使用
                this.editor.exportAreaX = exportX;
                this.editor.exportAreaY = exportY;

                // 销毁旧的引导框
                if (this.exportAreaGuide) {
                    this.exportAreaGuide.destroy();
                }

                // 创建虚线矩形作为导出区域引导
                this.exportAreaGuide = new Konva.Rect({
                    x: exportX,
                    y: exportY,
                    width: exportWidth,
                    height: exportHeight,
                    stroke: '#00a8ff',
                    strokeWidth: 1,
                    dash: [5, 5],      // 虚线样式
                    listening: false   // 不响应事件
                });

                this.konvaLayers.backgroundLayer.add(this.exportAreaGuide);
            },

            /**
             * 清除 Konva 舞台内容
             * 销毁所有 Konva 对象并重置引用，用于重新初始化或关闭编辑器
             */
            clearKonvaContent: function () {
                // 销毁变换器
                if (this.transformerInstance) {
                    this.transformerInstance.destroy();
                    this.transformerInstance = null;
                }
                
                // 销毁导出区域引导框
                if (this.exportAreaGuide) {
                    this.exportAreaGuide.destroy();
                    this.exportAreaGuide = null;
                }
                
                // 销毁底图 Group
                if (this.baseLayerInstance) {
                    this.baseLayerInstance.destroy();
                    this.baseLayerInstance = null;
                }
                
                // 销毁文字 Image
                if (this.textLayerInstance) {
                    this.textLayerInstance.destroy();
                    this.textLayerInstance = null;
                }
                
                // 清除文字渲染的 Canvas 缓存
                this.textCanvas = null;
                this.textCanvasCtx = null;
                
                // 重置当前激活元素状态
                this.editor.activeElement = 'none';
            },

            /**
             * 初始化 Konva 变换器（Transformer）
             * Transformer 用于显示选中框和缩放手柄，允许用户拖拽缩放元素
             */
            initKonvaTransformer: function () {
                if (!this.stageInstance) return;

                this.transformerInstance = new Konva.Transformer({
                    rotateEnabled: false,  // 禁用旋转功能
                    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],  // 只启用四角缩放
                    // 限制最小尺寸，防止缩放过小
                    boundBoxFunc: function (oldBox, newBox) {
                        if (newBox.width < 20 || newBox.height < 20) {
                            return oldBox;
                        }
                        return newBox;
                    }
                });
                // 将变换器添加到独立的顶层图层，避免被其他元素遮挡
                this.konvaLayers.transformerLayer.add(this.transformerInstance);
            },

            /**
             * 更新变换器的绑定目标
             * 根据当前激活的元素（底图/文字），将变换器绑定到对应的 Konva 节点
             */
            updateTransformer: function () {
                if (!this.transformerInstance || !this.stageInstance) return;

                // 根据激活状态确定目标节点
                var targetNode = null;
                if (this.editor.activeElement === 'image' && this.baseLayerInstance) {
                    targetNode = this.baseLayerInstance;
                } else if (this.editor.activeElement === 'text' && this.textLayerInstance) {
                    targetNode = this.textLayerInstance;
                }

                // 绑定目标节点或清空绑定
                if (targetNode) {
                    this.transformerInstance.nodes([targetNode]);
                } else {
                    this.transformerInstance.nodes([]);
                }
                this.stageInstance.draw();
            },

            /**
             * 初始化 Konva 底图
             * 创建 Group 并加载图片，图片会根据目标尺寸进行缩放
             */
            initKonvaBaseImage: function () {
                if (!this.stageInstance || this.baseLayerInstance) return;

                var _this = this;
                var targetWidth = this.editor.baseImageWidth;
                var targetHeight = this.editor.baseImageHeight;

                var exportCenterX = this.editor.exportAreaX + (targetWidth / 2);
                var exportCenterY = this.editor.exportAreaY + (targetHeight / 2);

                this.baseLayerInstance = new Konva.Group({
                    name: 'baseImageGroup',
                    draggable: false,
                    visible: this.editor.showImage,
                    x: exportCenterX + this.editor.imageOffsetX,
                    y: exportCenterY + this.editor.imageOffsetY,
                    scaleX: this.editor.imageScale,
                    scaleY: this.editor.imageScale
                });

                if (this.editor.baseImage) {
                    var img = new Image();
                    img.onload = function () {
                        var imgWidth = img.width;
                        var imgHeight = img.height;

                        // 根据目标尺寸计算显示尺寸（保持宽高比，填充模式）
                        var displayWidth, displayHeight;
                        if (targetWidth && targetHeight) {
                            var scaleX = targetWidth / imgWidth;
                            var scaleY = targetHeight / imgHeight;
                            var scale = Math.max(scaleX, scaleY);
                            displayWidth = imgWidth * scale;
                            displayHeight = imgHeight * scale;
                        } else {
                            displayWidth = imgWidth;
                            displayHeight = imgHeight;
                        }

                        var baseImage = new Konva.Image({
                            name: 'baseImage',
                            image: img,
                            width: displayWidth,
                            height: displayHeight,
                            offsetX: displayWidth / 2,
                            offsetY: displayHeight / 2,
                            x: 0,
                            y: 0
                        });

                        _this.baseLayerInstance.add(baseImage);
                        _this.konvaLayers.backgroundLayer.add(_this.baseLayerInstance);
                        _this.stageInstance.draw();
                        _this.bindBaseImageEvents();
                    };
                    img.onerror = function(err) {
                        console.error('[Konva] Image load error:', err);
                    };
                    img.crossOrigin = 'Anonymous';
                    img.src = this.editor.baseImage;
                } else {
                    this.konvaLayers.backgroundLayer.add(this.baseLayerInstance);
                }
            },

            /**
             * 绑定底图的交互事件
             * 包括：点击选中、拖拽移动、变换器缩放
             */
            bindBaseImageEvents: function () {
                var _this = this;
                
                if (!this.baseLayerInstance) return;

                // 计算导出区域中心点，用于计算拖拽偏移量
                var exportCenterX = this.editor.exportAreaX + (this.editor.baseImageWidth / 2);
                var exportCenterY = this.editor.exportAreaY + (this.editor.baseImageHeight / 2);

                // 点击/触摸选中底图
                this.baseLayerInstance.on('click tap', function (e) {
                    e.cancelBubble = true;  // 阻止事件冒泡到舞台
                    _this.editor.activeElement = 'image';
                    _this.baseLayerInstance.draggable(true);
                    // 取消文字层的拖拽状态，防止选中底图后文字层仍可拖动
                    if (_this.textLayerInstance) {
                        _this.textLayerInstance.draggable(false);
                    }
                    _this.stageInstance.draggable(false);
                    _this.updateTransformer();
                });

                // 拖拽开始：标记拖拽状态
                this.baseLayerInstance.on('dragstart', function () {
                    _this.editor.isImageDragging = true;
                });

                // 拖拽中：实时同步位置偏移到 Vue 数据
                this.baseLayerInstance.on('dragmove', function () {
                    _this.editor.imageOffsetX = _this.baseLayerInstance.x() - exportCenterX;
                    _this.editor.imageOffsetY = _this.baseLayerInstance.y() - exportCenterY;
                });

                // 拖拽结束：取消拖拽状态，更新恢复按钮
                this.baseLayerInstance.on('dragend', function () {
                    _this.editor.isImageDragging = false;
                    _this.updateRestoreBtnState();
                });

                // 变换开始（通过 Transformer 缩放）
                this.baseLayerInstance.on('transformstart', function () {
                    _this.editor.isImageDragging = true;
                });

                // 变换中：同步位置和缩放比例到 Vue 数据
                this.baseLayerInstance.on('transform', function () {
                    _this.editor.imageOffsetX = _this.baseLayerInstance.x() - exportCenterX;
                    _this.editor.imageOffsetY = _this.baseLayerInstance.y() - exportCenterY;
                    _this.editor.imageScale = _this.baseLayerInstance.scaleX();
                });

                // 变换结束：保留两位小数，更新恢复按钮
                this.baseLayerInstance.on('transformend', function () {
                    _this.editor.isImageDragging = false;
                    _this.editor.imageScale = parseFloat(_this.baseLayerInstance.scaleX().toFixed(2));
                    _this.updateRestoreBtnState();
                });
            },

            /**
             * 初始化 Konva 文字层
             * 文字渲染到 Canvas，然后作为 Konva.Image 显示
             * 这种方式可以支持复杂的文字样式（渐变、阴影、描边等）
             */
            initKonvaTextLayer: function () {
                if (!this.stageInstance || this.textLayerInstance) return;

                // 获取导出区域尺寸和中心点
                var exportWidth = this.editor.baseImageWidth || 500;
                var exportHeight = this.editor.baseImageHeight || 500;
                var exportCenterX = this.editor.exportAreaX + (exportWidth / 2);
                var exportCenterY = this.editor.exportAreaY + (exportHeight / 2);

                // 清除旧的 Canvas 缓存
                this.textCanvas = null;
                this.textCanvasCtx = null;

                // 根据百分比坐标计算文字的绝对位置
                // textPosX/Y: 50 表示中心，0-100 范围
                var textX = exportCenterX + ((this.editor.textPosX - 50) / 100) * exportWidth;
                var textY = exportCenterY + ((this.editor.textPosY - 50) / 100) * exportHeight;

                // 创建 Konva.Image 作为文字层（image 属性后续由 renderTextCanvas 设置）
                this.textLayerInstance = new Konva.Image({
                    name: 'textContent',
                    image: null,          // 初始为空，renderTextCanvas 后设置
                    visible: this.editor.showText,
                    draggable: false,     // 默认不可拖动，点击选中后才启用
                    x: textX,
                    y: textY,
                    offsetX: 0,           // 后续根据 Canvas 尺寸动态设置
                    offsetY: 0,
                    scaleX: this.editor.textScale,
                    scaleY: this.editor.textScale
                });

                this.konvaLayers.textLayer.add(this.textLayerInstance);
                this.bindTextEvents();
                this.renderTextCanvas();
            },

             /**
             * 渲染文字到 Canvas
             * 将文字内容按照样式（字体、颜色、渐变、阴影、描边等）绘制到 Canvas
             * 然后将 Canvas 设置为 Konva.Image 的 image 源
             */
            renderTextCanvas: function () {
                var style = this.editorTextStyleFiltered;
                var text = this.editor.textContent;

                // 如果没有文字或文字层隐藏，清除 Canvas 并返回
                if (!text || !this.editor.showText) {
                    if (this.textCanvas && this.textCanvasCtx) {
                        this.textCanvasCtx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
                    }
                    if (this.textLayerInstance && this.stageInstance) {
                        this.stageInstance.draw();
                    }
                    return;
                }

                // 解析字体样式
                var fontSize = parseFloat(style['font-size']) || 24;
                var fontFamily = style['font-family'] || 'sans-serif';
                var fontWeight = style['font-weight'] || 'normal';
                var fontStyle = style['font-style'] || 'normal';

                // 移除字体名称中的引号
                fontFamily = fontFamily.replace(/['"]/, '');

                var ctx;
                if (this.textCanvasCtx) {
                    ctx = this.textCanvasCtx;
                    ctx.font = fontStyle + ' ' + fontWeight + ' ' + fontSize + 'px "' + fontFamily + '"';
                } else {
                    var tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 1;
                    tempCanvas.height = 1;
                    ctx = tempCanvas.getContext('2d');
                    ctx.font = fontStyle + ' ' + fontWeight + ' ' + fontSize + 'px "' + fontFamily + '"';
                }

                var lines = text.split('\n');
                var lineHeight = fontSize * 1.2;
                var totalHeight = lines.length * lineHeight;

                var maxWidth = 0;
                for (var i = 0; i < lines.length; i++) {
                    var w = ctx.measureText(lines[i]).width;
                    if (w > maxWidth) maxWidth = w;
                }

                var padding = Math.max(maxWidth, totalHeight) * 0.25;
                var canvasWidth = Math.ceil(maxWidth + padding * 2);
                var canvasHeight = Math.ceil(totalHeight + padding * 2);

                if (!this.textCanvas || this.textCanvas.width !== canvasWidth || this.textCanvas.height !== canvasHeight) {
                    this.textCanvas = document.createElement('canvas');
                    this.textCanvas.width = canvasWidth;
                    this.textCanvas.height = canvasHeight;
                    this.textCanvasCtx = this.textCanvas.getContext('2d');
                    ctx = this.textCanvasCtx;
                    ctx.font = fontStyle + ' ' + fontWeight + ' ' + fontSize + 'px "' + fontFamily + '"';

                    if (this.textLayerInstance) {
                        this.textLayerInstance.image(this.textCanvas);
                        this.textLayerInstance.offsetX(canvasWidth / 2);
                        this.textLayerInstance.offsetY(canvasHeight / 2);
                    }
                }

                ctx.clearRect(0, 0, canvasWidth, canvasHeight);

                ctx.save();

                var textAlign = this.editor.textAlign;
                var textX;
                if (textAlign === 'left') {
                    textX = padding;
                } else if (textAlign === 'right') {
                    textX = canvasWidth - padding;
                } else {
                    textX = canvasWidth / 2;
                }

                var startY = padding + (lineHeight / 2);

                ctx.textAlign = textAlign;
                ctx.textBaseline = 'middle';

                var fillStyle = style['color'] || '#000000';
                var bgStr = style['background'] || style['background-image'];
                var hasBackgroundClip = style['-webkit-background-clip'] === 'text' || style['background-clip'] === 'text';

                if (bgStr && bgStr.indexOf('gradient') !== -1 && hasBackgroundClip) {
                    var angleMatch = bgStr.match(/linear-gradient\((\d+)deg/);
                    var angle = angleMatch ? parseInt(angleMatch[1]) : 180;

                    var colors = [];
                    var colorRegex = /(#[0-9a-fA-F]+|rgba?\([^)]+\))\s*(\d+(?:\.\d+)?%?)/g;
                    var m;
                    while ((m = colorRegex.exec(bgStr)) !== null) {
                        var stop = m[2];
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
                        if (colors[0].stop === null || isNaN(colors[0].stop)) colors[0].stop = 0;
                        if (colors[colors.length - 1].stop === null || isNaN(colors[colors.length - 1].stop)) {
                            colors[colors.length - 1].stop = 1;
                        }

                        var x0, y0, x1, y1;

                        if (angle === 0) {
                            x0 = textX; y0 = startY + totalHeight / 2; x1 = textX; y1 = startY - totalHeight / 2;
                        } else if (angle === 90) {
                            x0 = textX - maxWidth / 2; y0 = canvasHeight / 2; x1 = textX + maxWidth / 2; y1 = canvasHeight / 2;
                        } else if (angle === 270) {
                            x0 = textX + maxWidth / 2; y0 = canvasHeight / 2; x1 = textX - maxWidth / 2; y1 = canvasHeight / 2;
                        } else {
                            x0 = textX; y0 = startY - totalHeight / 2; x1 = textX; y1 = startY + totalHeight / 2;
                        }

                        var grad = ctx.createLinearGradient(x0, y0, x1, y1);

                        for (var k = 0; k < colors.length; k++) {
                            var s = Math.max(0, Math.min(1, colors[k].stop));
                            grad.addColorStop(s, colors[k].color);
                        }
                        fillStyle = grad;
                    }
                }

                if (style['text-shadow']) {
                    var shadowsStr = style['text-shadow'];

                    var tempStr = shadowsStr.replace(/rgba?\([^)]+\)/gi, function (match) {
                        return match.replace(/,/g, '|');
                    });

                    var shadowsArr = tempStr.split(',').map(function (s) {
                        return s.replace(/\|/g, ',').trim();
                    });

                    for (var i = 0; i < shadowsArr.length; i++) {
                        var shadow = shadowsArr[i];
                        var shadowMatch = shadow.match(/(-?[\d.]+(?:px)?|0)\s+(-?[\d.]+(?:px)?|0)(?:\s+(-?[\d.]+(?:px)?|0))?\s+(#[0-9a-fA-F]+|rgba?\([^)]+\))/i);

                        if (shadowMatch) {
                            ctx.save();
                            ctx.shadowOffsetX = parseFloat(shadowMatch[1]);
                            ctx.shadowOffsetY = parseFloat(shadowMatch[2]);
                            ctx.shadowBlur = shadowMatch[3] ? parseFloat(shadowMatch[3]) : 0;
                            ctx.shadowColor = shadowMatch[4];

                            ctx.fillStyle = fillStyle;
                            for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                                var lineY = startY + (lineIdx * lineHeight);
                                ctx.fillText(lines[lineIdx], textX, lineY);
                            }
                            ctx.restore();
                        }
                    }

                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.shadowBlur = 0;
                }

                var strokeStr = style['-webkit-text-stroke'] || style['border'];
                if (strokeStr) {
                    var stroke = this.parseStroke(strokeStr);
                    if (stroke) {
                        ctx.lineWidth = stroke.width;

                        ctx.strokeStyle = (stroke.color === 'transparent' && fillStyle instanceof CanvasGradient)
                            ? fillStyle
                            : stroke.color;

                        ctx.lineJoin = 'round';
                        for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                            var lineY = startY + (lineIdx * lineHeight);
                            ctx.strokeText(lines[lineIdx], textX, lineY);
                        }
                    }
                }

                ctx.fillStyle = fillStyle;
                for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                    var lineY = startY + (lineIdx * lineHeight);
                    ctx.fillText(lines[lineIdx], textX, lineY);
                }

                ctx.restore();

                if (this.textLayerInstance && this.stageInstance) {
                    this.stageInstance.draw();
                }
            },

            /**
             * 解析描边样式字符串
             * @param {string} strokeStr - 描边样式，如 '2px #ffffff' 或 '1px transparent'
             * @returns {Object|null} 返回 {width, color} 或 null
             */
            parseStroke: function (strokeStr) {
                if (!strokeStr) return null;

                // 匹配格式：宽度 + 颜色
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
             * 绑定文字层的交互事件
             * 包括：点击选中、拖拽移动、变换器缩放
             */
            bindTextEvents: function () {
                var _this = this;

                if (!this.textLayerInstance) return;

                // 获取导出区域尺寸和中心点坐标
                var exportWidth = this.editor.baseImageWidth || 500;
                var exportHeight = this.editor.baseImageHeight || 500;
                var exportCenterX = this.editor.exportAreaX + (exportWidth / 2);
                var exportCenterY = this.editor.exportAreaY + (exportHeight / 2);

                // 点击/触摸选中文字层
                this.textLayerInstance.on('click tap', function (e) {
                    e.cancelBubble = true;  // 阻止事件冒泡到舞台
                    _this.editor.activeElement = 'text';
                    _this.textLayerInstance.draggable(true);
                    // 取消底图的拖拽状态，防止选中文字后底图仍可拖动
                    if (_this.baseLayerInstance) {
                        _this.baseLayerInstance.draggable(false);
                    }
                    _this.stageInstance.draggable(false);
                    _this.updateTransformer();
                });

                // 拖拽开始
                this.textLayerInstance.on('dragstart', function () {
                    _this.editor.isTextDragging = true;
                });

                // 拖拽中：将绝对位置转换为百分比坐标并同步到 Vue 数据
                this.textLayerInstance.on('dragmove', function () {
                    var offsetX = _this.textLayerInstance.x() - exportCenterX;
                    var offsetY = _this.textLayerInstance.y() - exportCenterY;
                    _this.editor.textPosX = 50 + (offsetX / exportWidth) * 100;
                    _this.editor.textPosY = 50 + (offsetY / exportHeight) * 100;
                });

                // 拖拽结束
                this.textLayerInstance.on('dragend', function () {
                    _this.editor.isTextDragging = false;
                    _this.updateRestoreBtnState();
                });

                // 变换开始
                this.textLayerInstance.on('transformstart', function () {
                    _this.editor.isTextDragging = true;
                });

                // 变换中：同步位置和缩放比例
                this.textLayerInstance.on('transform', function () {
                    var offsetX = _this.textLayerInstance.x() - exportCenterX;
                    var offsetY = _this.textLayerInstance.y() - exportCenterY;
                    _this.editor.textPosX = 50 + (offsetX / exportWidth) * 100;
                    _this.editor.textPosY = 50 + (offsetY / exportHeight) * 100;
                    _this.editor.textScale = _this.textLayerInstance.scaleX();
                });

                // 变换结束：保留两位小数
                this.textLayerInstance.on('transformend', function () {
                    _this.editor.isTextDragging = false;
                    _this.editor.textScale = parseFloat(_this.textLayerInstance.scaleX().toFixed(2));
                    _this.updateRestoreBtnState();
                });
            },

            /**
             * 初始化舞台级别的事件
             * 包括：点击空白区域取消选中、鼠标滚轮缩放
             */
            initKonvaStageEvents: function () {
                var _this = this;

                // 点击舞台空白区域时取消所有元素的选中状态
                this.stageInstance.on('click tap', function (e) {
                    // 检查是否点击的是舞台背景（而非其他元素）
                    if (e.target === _this.stageInstance) {
                        _this.editor.activeElement = 'none';
                        // 禁用所有元素的拖拽
                        if (_this.baseLayerInstance) {
                            _this.baseLayerInstance.draggable(false);
                        }
                        if (_this.textLayerInstance) {
                            _this.textLayerInstance.draggable(false);
                        }
                        // 启用舞台拖拽（用于平移画布）
                        _this.stageInstance.draggable(true);
                        _this.updateTransformer();
                    } else {
                        // 点击了其他元素，禁用舞台拖拽
                        _this.stageInstance.draggable(false);
                    }
                });

                // 鼠标滚轮缩放舞台
                this.stageInstance.on('wheel', function (e) {
                    e.evt.preventDefault();  // 阻止页面滚动
                    
                    // 获取当前缩放比例和鼠标位置
                    var oldScale = _this.stageInstance.scaleX();
                    var pointer = _this.stageInstance.getPointerPosition();
                    
                    // 计算鼠标在当前缩放下的相对位置
                    var mousePointTo = {
                        x: (pointer.x - _this.stageInstance.x()) / oldScale,
                        y: (pointer.y - _this.stageInstance.y()) / oldScale
                    };
                    
                    // 计算新的缩放比例（上滚放大，下滚缩小）
                    var direction = e.evt.deltaY > 0 ? -1 : 1;
                    var newScale = direction > 0 ? oldScale * 1.05 : oldScale / 1.05;
                    // 限制缩放范围：0.1x - 5.0x
                    newScale = Math.max(0.1, Math.min(5.0, newScale));
                    
                    // 应用新的缩放比例
                    _this.stageInstance.scale({ x: newScale, y: newScale });
                    
                    // 计算新的位置，保持鼠标指向的点不变
                    var newPos = {
                        x: pointer.x - mousePointTo.x * newScale,
                        y: pointer.y - mousePointTo.y * newScale
                    };
                    _this.stageInstance.position(newPos);
                    _this.stageInstance.batchDraw();
                    
                    // 同步缩放比例到 Vue 数据
                    _this.editor.scale = parseFloat(newScale.toFixed(2));
                });
            },

            /**
             * 更新 Konva 底图
             * 当用户上传新图片或切换素材时调用
             */
            updateKonvaBaseImage: function () {
                var _this = this;

                if (!this.baseLayerInstance || !this.editor.baseImage) return;

                var targetWidth = this.editor.baseImageWidth;
                var targetHeight = this.editor.baseImageHeight;

                var baseImage = this.baseLayerInstance.findOne('.baseImage');

                var img = new Image();
                img.onload = function () {
                    var imgWidth = img.width;
                    var imgHeight = img.height;

                    var displayWidth, displayHeight;

                    if (targetWidth && targetHeight) {
                        var scaleX = targetWidth / imgWidth;
                        var scaleY = targetHeight / imgHeight;
                        var scale = Math.max(scaleX, scaleY);

                        displayWidth = imgWidth * scale;
                        displayHeight = imgHeight * scale;
                    } else {
                        displayWidth = imgWidth;
                        displayHeight = imgHeight;
                        _this.editor.baseImageWidth = imgWidth;
                        _this.editor.baseImageHeight = imgHeight;
                    }

                    if (baseImage) {
                        // 更新现有图片
                        baseImage.image(img);
                        baseImage.width(displayWidth);
                        baseImage.height(displayHeight);
                        // 设置偏移使图片中心与Group原点对齐（与initKonvaBaseImage保持一致）
                        baseImage.offsetX(displayWidth / 2);
                        baseImage.offsetY(displayHeight / 2);
                        // 重置位置为0，因为Group的位置已经控制了整体位置
                        baseImage.x(0);
                        baseImage.y(0);
                    } else {
                        // 创建新图片，与initKonvaBaseImage中的逻辑一致
                        var newBaseImage = new Konva.Image({
                            name: 'baseImage',
                            image: img,
                            width: displayWidth,
                            height: displayHeight,
                            offsetX: displayWidth / 2,
                            offsetY: displayHeight / 2,
                            x: 0,
                            y: 0
                        });
                        _this.baseLayerInstance.add(newBaseImage);
                    }

                    _this.stageInstance.draw();
                };
                img.crossOrigin = 'Anonymous';
                img.src = this.editor.baseImage;
            },

            /**
             * 同步 Konva 底图的变换（位置和缩放）
             * 当 Vue 数据变化时，同步到 Konva Group
             */
            syncKonvaBaseImageTransform: function () {
                if (!this.baseLayerInstance) return;
                
                // 计算导出区域中心点
                var exportCenterX = this.editor.exportAreaX + (this.editor.baseImageWidth / 2);
                var exportCenterY = this.editor.exportAreaY + (this.editor.baseImageHeight / 2);
                
                // 应用位置偏移和缩放
                this.baseLayerInstance.x(exportCenterX + this.editor.imageOffsetX);
                this.baseLayerInstance.y(exportCenterY + this.editor.imageOffsetY);
                this.baseLayerInstance.scaleX(this.editor.imageScale);
                this.baseLayerInstance.scaleY(this.editor.imageScale);
                
                this.stageInstance.draw();
            },

            /**
             * 同步 Konva 文字位置
             * 将 Vue 数据中的百分比坐标转换为绝对位置，应用到 Konva Image
             */
            syncKonvaTextPosition: function () {
                if (!this.textLayerInstance || !this.stageInstance) return;
                
                // 获取导出区域尺寸和中心点
                var exportWidth = this.editor.baseImageWidth || 500;
                var exportHeight = this.editor.baseImageHeight || 500;
                var exportCenterX = this.editor.exportAreaX + (exportWidth / 2);
                var exportCenterY = this.editor.exportAreaY + (exportHeight / 2);
                
                // 将百分比坐标转换为绝对位置
                var textX = exportCenterX + ((this.editor.textPosX - 50) / 100) * exportWidth;
                var textY = exportCenterY + ((this.editor.textPosY - 50) / 100) * exportHeight;
                
                this.textLayerInstance.x(textX);
                this.textLayerInstance.y(textY);
                
                this.stageInstance.draw();
            },

            /**
             * 打开素材编辑器
             * @param {Object} item - 素材项
             */
            openMaterialEditor: function (item) {
                var _this = this;
                window.MeeWoo.Core.MaterialOperations.openMaterialEditor(this, item);

                // 延迟初始化 Konva stage，确保：
                // 1. Vue 完成 DOM 更新（$nextTick）
                // 2. CSS 过渡动画完成（弹窗显示动画约300ms）
                // 3. 图片尺寸已加载
                var checkAndInit = function() {
                    _this.$nextTick(function() {
                        // 检查图片尺寸是否已加载
                        if (_this.editor.baseImageWidth && _this.editor.baseImageHeight) {
                            // 额外延迟100ms，确保CSS过渡动画完成，容器尺寸稳定
                            setTimeout(function() {
                                _this.initKonvaStage();
                            }, 100);
                        } else {
                            // 如果尺寸未加载，等待 baseImage 变化
                            // 使用 immediate: true 确保即使 baseImage 已经被设置也能触发
                            var initCalled = false;
                            var unwatch = _this.$watch('editor.baseImage', function(newVal) {
                                if (!initCalled && newVal && _this.editor.baseImageWidth && _this.editor.baseImageHeight) {
                                    initCalled = true;
                                    unwatch();
                                    _this.$nextTick(function() {
                                        // 额外延迟100ms，确保CSS过渡动画完成
                                        setTimeout(function() {
                                            _this.initKonvaStage();
                                        }, 100);
                                    });
                                }
                            }, { immediate: true });
                        }
                    });
                };
                checkAndInit();
            },

            /**
             * 加载图片并设置尺寸
             * @param {string} imgUrl - 图片 URL 或 base64
             */
            loadAndSetImageDimensions: function (imgUrl) {
                window.MeeWoo.Core.MaterialOperations.loadAndSetImageDimensions(this, imgUrl);
                this.$nextTick(function () {
                    this.updateKonvaBaseImage();
                }.bind(this));
            },

            /**
             * 生成编辑后的素材图片
             * 创建临时的导出 Stage，将底图和文字按原始尺寸合成并导出为 DataURL
             * @returns {Promise<string>} 返回 PNG 格式的 DataURL
             */
            generateEditedMaterial: function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    if (!_this.stageInstance) {
                        reject(new Error('Konva stage not initialized'));
                        return;
                    }

                    try {
                        // 获取导出尺寸（原始素材尺寸）
                        var exportWidth = _this.editor.baseImageWidth;
                        var exportHeight = _this.editor.baseImageHeight;

                        // 创建临时的导出 Stage（不显示，仅用于导出）
                        var exportStage = new Konva.Stage({
                            container: document.createElement('div'),
                            width: exportWidth,
                            height: exportHeight
                        });

                        var exportLayer = new Konva.Layer();
                        exportStage.add(exportLayer);

                        // 复制底图到导出层
                        if (_this.baseLayerInstance && _this.editor.showImage) {
                            var exportCenterX = exportWidth / 2;
                            var exportCenterY = exportHeight / 2;

                            var baseImage = _this.baseLayerInstance.findOne('.baseImage');
                            if (baseImage) {
                                var img = baseImage.image();
                                var newBaseImage = new Konva.Image({
                                    image: img,
                                    width: baseImage.width(),
                                    height: baseImage.height(),
                                    offsetX: baseImage.offsetX(),
                                    offsetY: baseImage.offsetY(),
                                    x: exportCenterX + _this.editor.imageOffsetX,
                                    y: exportCenterY + _this.editor.imageOffsetY,
                                    scaleX: _this.editor.imageScale,
                                    scaleY: _this.editor.imageScale
                                });
                                exportLayer.add(newBaseImage);
                            }
                        }

                        // 复制文字到导出层
                        if (_this.textLayerInstance && _this.editor.showText && _this.textCanvas) {
                            var textCenterX = exportWidth / 2 + ((_this.editor.textPosX - 50) / 100) * exportWidth;
                            var textCenterY = exportHeight / 2 + ((_this.editor.textPosY - 50) / 100) * exportHeight;

                            var newTextImage = new Konva.Image({
                                image: _this.textCanvas,
                                x: textCenterX,
                                y: textCenterY,
                                offsetX: _this.textCanvas.width / 2,
                                offsetY: _this.textCanvas.height / 2,
                                scaleX: _this.editor.textScale,
                                scaleY: _this.editor.textScale
                            });
                            exportLayer.add(newTextImage);
                        }

                        exportStage.draw();

                        // 导出为 PNG DataURL
                        var dataURL = exportStage.toDataURL({
                            x: 0,
                            y: 0,
                            width: exportWidth,
                            height: exportHeight,
                            pixelRatio: 1,        // 1:1 像素比
                            mimeType: 'image/png',
                            quality: 1.0
                        });

                        // 销毁临时 Stage 避免内存泄漏
                        exportStage.destroy();

                        resolve(dataURL);
                    } catch (error) {
                        reject(error);
                    }
                });
            },

            // ==================== 废弃的事件处理方法（保留接口兼容性） ====================
            
            /** @deprecated 已迁移到 Konva 事件处理 */
            onPreviewAreaMouseDown: function (event) {},

            /** @deprecated 已迁移到 Konva 事件处理 */
            onImageMouseDown: function (event) {},

            /** @deprecated 已迁移到 Konva 事件处理 */
            onImageWheel: function (event) {},

            /**
             * 切换编辑器视图模式
             */
            toggleEditorViewMode: function () {
                window.MeeWoo.Core.MaterialInteractions.toggleEditorViewMode(this);
            },

            /** @deprecated 已迁移到 Konva 事件处理 */
            onTextMouseDown: function (event) {},

            /** @deprecated 已迁移到 Konva 事件处理 */
            onTextWheel: function (event) {},

            /**
             * 处理文件上传事件
             * 当用户选择新图片上传时触发
             */
            onEditorFileChange: function (event) {
                window.MeeWoo.Core.MaterialInteractions.onEditorFileChange(this, event);
                this.$nextTick(function () {
                    this.updateKonvaBaseImage();
                }.bind(this));
            },

            /**
             * 触发文件上传对话框
             */
            triggerEditorUpload: function () {
                window.MeeWoo.Core.MaterialInteractions.triggerEditorUpload(this);
            },

            /**
             * 关闭素材编辑器
             * 销毁所有 Konva 对象，释放内存
             */
            closeMaterialEditor: function () {
                window.MeeWoo.Core.MaterialOperations.closeMaterialEditor(this);
                
                // 销毁 Transformer
                if (this.transformerInstance) {
                    this.transformerInstance.destroy();
                    this.transformerInstance = null;
                }
                // 销毁导出区域引导框
                if (this.exportAreaGuide) {
                    this.exportAreaGuide.destroy();
                    this.exportAreaGuide = null;
                }
                // 销毁文字层
                if (this.textLayerInstance) {
                    this.textLayerInstance.destroy();
                    this.textLayerInstance = null;
                }
                // 销毁底图层
                if (this.baseLayerInstance) {
                    this.baseLayerInstance.destroy();
                    this.baseLayerInstance = null;
                }
                // 销毁各 Layer
                if (this.konvaLayers.backgroundLayer) {
                    this.konvaLayers.backgroundLayer.destroy();
                    this.konvaLayers.backgroundLayer = null;
                }
                if (this.konvaLayers.textLayer) {
                    this.konvaLayers.textLayer.destroy();
                    this.konvaLayers.textLayer = null;
                }
                if (this.konvaLayers.transformerLayer) {
                    this.konvaLayers.transformerLayer.destroy();
                    this.konvaLayers.transformerLayer = null;
                }
                // 销毁 Stage
                if (this.stageInstance) {
                    this.stageInstance.destroy();
                    this.stageInstance = null;
                }
                // 清除 Canvas 缓存
                this.textCanvas = null;
                this.textCanvasCtx = null;
            },

            /**
             * 保存素材编辑
             * 将当前编辑状态应用到 SVGA 帧
             */
            saveMaterialEdit: function () {
                window.MeeWoo.Core.MaterialOperations.saveMaterialEdit(this);
            }
        }
    };

    window.MeeWoo.Mixins.MaterialEditor = MaterialEditor;
})(window);
