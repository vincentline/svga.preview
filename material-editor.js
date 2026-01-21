/**
 * ==================== 素材编辑器模块 (Material Editor) ====================
 * 
 * 功能说明：
 * 提供素材图片的编辑功能，支持：
 * 1. 替换底图
 * 2. 添加文字覆盖层（支持CSS样式）
 * 3. 预览缩放和平移
 * 4. 素材图和文字层的独立拖拽、缩放和激活
 * 5. 重叠元素的层级切换
 * 6. 导出编辑后的图片为PNG
 * 
 * 依赖：
 * - html2canvas (用于生成图片)
 * - Vue (作为Mixin使用)
 * 
 * 使用方式：
 * 在 app.js 中引入此文件，并将 MaterialEditor 作为 mixin 混入 Vue 实例
 */

(function (window) {
    'use strict';

    // Ensure namespace
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Mixins = window.MeeWoo.Mixins || {};

    var MaterialEditor = {
        data: function () {
            return {
                // 编辑器状态
                editor: {
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

                    // 素材图交互状态
                    imageOffsetX: 0,     // 素材图X偏移(像素)
                    imageOffsetY: 0,     // 素材图Y偏移(像素)
                    imageScale: 1.0,     // 素材图缩放
                    imageDragging: false,
                    imageDragStartX: 0,
                    imageDragStartY: 0,
                    imageMouseMoved: false,  // 标记是否发生了拖拽移动

                    // 文字层交互状态
                    textDragging: false,
                    textDragStartX: 0,
                    textDragStartY: 0,
                    textPosX: 50,        // 文字X位置 (百分比 0-100)
                    textPosY: 50,        // 文字Y位置 (百分比 0-100)
                    textScale: 1.0,      // 文字缩放
                    textAlign: 'left',   // 文字对齐方式: 'left' | 'center' | 'right'
                    textMouseMoved: false  // 标记是否发生了拖拽移动
                },

                // 存储每个素材的编辑历史
                // key: imageKey, value: { textContent, textStyle, showImage, showText, textPosX, textPosY, textScale, imageOffsetX, imageOffsetY, imageScale, customBaseImage }
                materialEditStates: {}
            };
        },

        computed: {
            /**
             * 过滤后的文字样式，只保留允许的属性，过滤掉布局相关属性
             * 避免用户粘贴的CSS包含 position/width/height 等破坏布局
             */
            editorTextStyleFiltered: function () {
                if (!this.editor.textStyle) return {};

                var styleStr = this.editor.textStyle;
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
             * 将过滤后的样式对象转换为CSS字符串
             */
            editorTextStyleString: function () {
                var styles = this.editorTextStyleFiltered;
                var str = '';
                for (var key in styles) {
                    if (styles.hasOwnProperty(key)) {
                        str += key + ':' + styles[key] + ';';
                    }
                }
                return str;
            },

            /**
             * 判断是否有编辑信息（已废弃，改用 editor.showRestoreBtn）
             */
            hasEditInfo: function () {
                return this.editor.showRestoreBtn;
            }
        },

        watch: {
            // 监听所有可能改变编辑状态的属性
            'editor.baseImage': function () { this.updateRestoreBtnState(); },
            'editor.showImage': function () { this.updateRestoreBtnState(); },
            'editor.showText': function () {
                var _this = this;
                this.updateRestoreBtnState();
                this.$nextTick(function () {
                    _this.renderEditorPreview();
                });
            },
            'editor.imageOffsetX': function () { this.updateRestoreBtnState(); },
            'editor.imageOffsetY': function () { this.updateRestoreBtnState(); },
            'editor.imageScale': function () { this.updateRestoreBtnState(); },

            // 监听文字内容变化，实时更新 Canvas 预览
            'editor.textContent': function () {
                var _this = this;
                this.$nextTick(function () {
                    _this.renderEditorPreview();
                });
            },
            // 监听文字样式变化
            'editor.textStyle': function () {
                var _this = this;
                this.$nextTick(function () {
                    _this.renderEditorPreview();
                });
            },
            // 监听文字位置变化
            'editor.textPosX': function () {
                this.renderEditorPreview();
            },
            'editor.textPosY': function () {
                this.renderEditorPreview();
            },
            // 监听文字缩放变化
            'editor.textScale': function () {
                this.renderEditorPreview();
            },
            // 监听显示文字开关 (这个监听器之前已经存在，为了避免重复，我们合并到上面的批量监听中)
            // 'editor.showText': function () { ... } 
            // 注意：上面的批量监听已经覆盖了 showText 的 renderEditorPreview 逻辑

        },

        methods: {
            /**
             * 设置文字对齐方式
             * @param {string} align - 对齐方式: 'left' | 'center' | 'right'
             */
            setTextAlign: function (align) {
                this.editor.textAlign = align;
                this.renderEditorPreview();
            },

            /**
             * 更新恢复按钮的显示状态
             * 手动计算，避免 computed 响应式问题
             */
            updateRestoreBtnState: function () {
                var show = false;

                // 1. 检查底图是否变更
                var defaultImg = this.editor.defaultBaseImage;
                if (defaultImg && this.editor.baseImage !== defaultImg) show = true;

                // 2. 检查显示开关
                else if (!this.editor.showImage) show = true;
                else if (this.editor.showText) show = true;

                // 3. 检查底图变换
                else if (this.editor.imageOffsetX !== 0) show = true;
                else if (this.editor.imageOffsetY !== 0) show = true;
                else if (Math.abs(this.editor.imageScale - 1.0) > 0.001) show = true;

                this.editor.showRestoreBtn = show;
            },

            /**
             * 渲染编辑器预览 Canvas
             */
            renderEditorPreview: function () {
                var _this = this;
                if (!this.editor.show || !this.editor.showText) {
                    return;
                }

                // 等待 Canvas 元素渲染
                this.$nextTick(function () {
                    var canvas = _this.$refs.editorTextCanvas;
                    if (!canvas) {
                        return;
                    }

                    var ctx = canvas.getContext('2d');
                    var width = _this.editor.baseImageWidth;
                    var height = _this.editor.baseImageHeight;

                    // 清空 Canvas
                    ctx.clearRect(0, 0, width, height);

                    // 计算文字位置
                    var centerX = (width * _this.editor.textPosX) / 100;
                    var centerY = (height * _this.editor.textPosY) / 100;

                    // 保存状态
                    ctx.save();

                    // 移动到文字中心点
                    ctx.translate(centerX, centerY);

                    // 应用缩放
                    ctx.scale(_this.editor.textScale, _this.editor.textScale);

                    // 使用 drawRichText 绘制带样式的文字
                    _this.drawRichText(ctx, width, height);

                    // 恢复状态
                    ctx.restore();
                });
            },

            /**
             * 清理拖拽事件监听器
             */
            clearDragListeners: function () {
                if (this.editor.dragHandlers) {
                    if (this.editor.dragHandlers.mousemove) {
                        document.removeEventListener('mousemove', this.editor.dragHandlers.mousemove);
                    }
                    if (this.editor.dragHandlers.mouseup) {
                        document.removeEventListener('mouseup', this.editor.dragHandlers.mouseup);
                    }
                    this.editor.dragHandlers = null;
                }
            },

            /**
             * 恢复原图
             * 点击后文字样式输入框里内容恢复默认、关闭显示文案按钮、素材图恢复为原始素材图
             */
            restoreOriginalMaterial: function () {
                var targetKey = this.editor.targetKey;
                if (!targetKey) return;

                // 1. 清除编辑状态记录
                if (this.materialEditStates[targetKey]) {
                    this.$delete(this.materialEditStates, targetKey);
                }

                // 2. 恢复素材列表中的预览图为原图
                var material = this.materialList.find(function (item) {
                    return item.imageKey === targetKey;
                });

                if (material) {
                    // 恢复 previewUrl 为 originalUrl
                    if (material.originalUrl) {
                        material.previewUrl = material.originalUrl;
                    }

                    // 3. 重置编辑器内部状态为默认值
                    this.editor.showImage = true;
                    this.editor.showText = false; // 关闭显示文案按钮
                    this.editor.textContent = '示例文案'; // 内容恢复默认
                    this.editor.textStyle = 'color: white;\ntext-shadow: 1px 1px 2px #000000;\nfont-size: 24px;\nfont-weight: bold;';
                    this.editor.textPosX = 50;
                    this.editor.textPosY = 50;
                    this.editor.textScale = 1.0;
                    this.editor.textAlign = 'left'; // 重置对齐方式为左对齐
                    this.editor.imageOffsetX = 0;
                    this.editor.imageOffsetY = 0;
                    this.editor.imageScale = 1.0;
                    this.editor.showRestoreBtn = false; // 显式重置按钮状态

                    // 4. 恢复底图为原始图
                    this.editor.baseImage = material.originalUrl || material.previewUrl;

                    // 重新渲染预览
                    this.renderEditorPreview();

                    // 提示用户
                    if (this.showToast) {
                        this.showToast('已恢复原图');
                    }
                }
            },

            /**
             * 打开素材编辑器
             * @param {Object} item - 素材对象
             */
            openMaterialEditor: function (item) {
                console.log('openMaterialEditor called', item);
                var _this = this;
                var material = item;

                // 兼容旧的索引调用方式（防御性编程）
                if (typeof item === 'number') {
                    material = this.materialList[item];
                }

                if (!material) {
                    console.error('Material not found');
                    return;
                }

                // 加载html2canvas库
                if (this.loadLibrary) {
                    this.loadLibrary('html2canvas', true).catch(function (err) {
                        console.error('Failed to load html2canvas', err);
                    });
                } else {
                    console.warn('loadLibrary method missing');
                }

                // 初始化编辑器状态
                // 使用 imageKey 作为唯一标识，而不是 index
                this.editor.targetKey = material.imageKey;
                this.editor.show = true;
                this.editor.loading = false;
                this.editor.viewMode = 'fit-height'; // 默认适应高度模式
                this.editor.scale = 1.0;
                this.editor.offsetX = 0;
                this.editor.offsetY = 0;

                console.log('Editor state set to show=true', this.editor);

                // 恢复之前的编辑状态 或 初始化默认值
                var savedState = this.materialEditStates[material.imageKey];
                if (savedState) {
                    this.editor.showImage = savedState.showImage;
                    this.editor.showText = savedState.showText;
                    this.editor.textContent = savedState.textContent || '';
                    this.editor.textStyle = savedState.textStyle || '';
                    this.editor.textPosX = savedState.textPosX !== undefined ? savedState.textPosX : 50;
                    this.editor.textPosY = savedState.textPosY !== undefined ? savedState.textPosY : 50;
                    this.editor.textScale = savedState.textScale !== undefined ? savedState.textScale : 1.0;
                    this.editor.textAlign = savedState.textAlign !== undefined ? savedState.textAlign : 'left';
                    this.editor.imageOffsetX = savedState.imageOffsetX !== undefined ? savedState.imageOffsetX : 0;
                    this.editor.imageOffsetY = savedState.imageOffsetY !== undefined ? savedState.imageOffsetY : 0;
                    this.editor.imageScale = savedState.imageScale !== undefined ? savedState.imageScale : 1.0;
                } else {
                    this.editor.showImage = true;
                    this.editor.showText = false;
                    this.editor.textContent = '示例文案';
                    this.editor.textStyle = 'color: white;\ntext-shadow: 1px 1px 2px #000000;\nfont-size: 24px;\nfont-weight: bold;';
                    this.editor.textPosX = 50;
                    this.editor.textPosY = 50;
                    this.editor.textScale = 1.0;
                    this.editor.textAlign = 'left';
                    this.editor.imageOffsetX = 0;
                    this.editor.imageOffsetY = 0;
                    this.editor.imageScale = 1.0;
                }

                // 重置激活状态
                this.editor.activeElement = 'none';
                this.editor.lastClickElement = 'none';
                this.editor.lastClickTime = 0;

                // 获取当前显示的图片
                // 首先尝试使用原始图（originalUrl），如果不存在则使用previewUrl
                var imgUrl = material.originalUrl || material.previewUrl;

                // 设置默认底图，用于 hasEditInfo 比较
                this.editor.defaultBaseImage = imgUrl;
                // 初始化按钮状态
                this.updateRestoreBtnState();

                // 编辑器底图逻辑（重要！）：
                // 1. 如果有保存的编辑状态中的customBaseImage，使用它（用户上传的自定义底图）
                // 2. 否则使用material.originalUrl或material.previewUrl（SVGA原始图）
                // 
                // 注意：replacedImages和material.previewUrl是最终合成的图片（底图+文字），
                // 不应该用作编辑器的底图，否则会导致文字重复显示

                if (savedState && savedState.customBaseImage) {
                    // 使用保存的自定义底图（用户通过“更换底图”上传的图）
                    imgUrl = savedState.customBaseImage;
                }
                // 否则使用原始图（material.originalUrl或material.previewUrl）

                this.editor.baseImage = imgUrl;

                // 设置画布尺寸（重要！）：
                // 画布尺寸必须始终等于SVGA原始素材的尺寸，不受底图尺寸影响
                // 这样生成的图片才能与SVGA素材保持一致
                if (material.originalWidth && material.originalHeight) {
                    // 使用SVGA原始素材的尺寸
                    this.editor.baseImageWidth = material.originalWidth;
                    this.editor.baseImageHeight = material.originalHeight;
                } else {
                    // 备用方案：如果material没有原始尺寸，才使用图片尺寸
                    console.warn('Material缺少originalWidth/originalHeight，使用图片尺寸作为备用');
                    this.editor.baseImageWidth = 0; // 标记为需要从图片获取
                    this.editor.baseImageHeight = 0;
                }

                // 获取图片尺寸以便计算比例
                var img = new Image();
                img.onload = function () {
                    // 只有在备用方案时（画布尺寸为0）才从图片获取尺寸
                    if (_this.editor.baseImageWidth === 0 || _this.editor.baseImageHeight === 0) {
                        _this.editor.baseImageWidth = img.width;
                        _this.editor.baseImageHeight = img.height;
                        console.log('使用图片尺寸作为画布尺寸（备用）:', img.width, 'x', img.height);
                    }

                    // 图片加载完成后，计算默认缩放比例
                    // 适应高度模式：智能适应，优先按容器高度75%，如果宽度超出则按宽度100%
                    _this.$nextTick(function () {
                        var previewArea = document.querySelector('.editor-preview-area');
                        if (previewArea && _this.editor.baseImageHeight > 0) {
                            var containerHeight = previewArea.clientHeight;
                            var containerWidth = previewArea.clientWidth;

                            // 1. 先按高度75%计算缩放比例
                            var fitByHeightScale = (containerHeight * 0.75) / _this.editor.baseImageHeight;

                            // 2. 计算此时的宽度
                            var widthAfterHeightFit = _this.editor.baseImageWidth * fitByHeightScale;

                            // 3. 判断宽度是否超出容器
                            var defaultScale;
                            if (widthAfterHeightFit > containerWidth) {
                                // 宽度超出，改为按宽度100%缩放
                                defaultScale = containerWidth / _this.editor.baseImageWidth;
                            } else {
                                // 宽度未超出，使用高度75%的缩放
                                defaultScale = fitByHeightScale;
                            }

                            // 限制缩放范围
                            if (defaultScale > 5.0) defaultScale = 5.0;
                            if (defaultScale < 0.1) defaultScale = 0.1;
                            _this.editor.scale = parseFloat(defaultScale.toFixed(2));
                        }

                        _this.renderEditorPreview();
                    });
                };
                img.src = imgUrl;
            },

            /**
             * 关闭编辑器
             */
            closeMaterialEditor: function () {
                this.clearDragListeners();
                this.editor.show = false;
            },

            /**
             * 预览区域鼠标按下，处理整体拖拽和取消激活
             */
            onPreviewAreaMouseDown: function (e) {
                var _this = this;

                // 清理可能存在的旧监听器
                this.clearDragListeners();

                // 如果点击的是空白区域，取消激活状态
                if (e.target.classList.contains('editor-preview-area') ||
                    e.target.classList.contains('editor-preview-wrapper') ||
                    e.target.classList.contains('editor-preview-content')) {

                    // 检查是否点击在图层范围内（即使 pointer-events 为 none）
                    var clickedOnLayer = this.checkClickOnLayer(e);

                    if (clickedOnLayer) {
                        // 点击在图层范围内，需要判断是点击还是拖动
                        var startX = e.clientX;
                        var startY = e.clientY;
                        var hasMoved = false;
                        var startOffsetX = this.editor.offsetX;
                        var startOffsetY = this.editor.offsetY;

                        var onMouseMove = function (moveEvent) {
                            var dx = moveEvent.clientX - startX;
                            var dy = moveEvent.clientY - startY;

                            // 移动超过3像素认为是拖动
                            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                                hasMoved = true;
                                // 拖动时移动画布
                                _this.editor.offsetX = startOffsetX + dx;
                                _this.editor.offsetY = startOffsetY + dy;
                            }
                        };

                        var onMouseUp = function () {
                            _this.clearDragListeners();

                            // 只有没有移动时才激活图层
                            if (!hasMoved) {
                                _this.editor.activeElement = clickedOnLayer;
                                _this.editor.lastClickElement = clickedOnLayer;
                                _this.editor.lastClickTime = Date.now();
                            }
                        };

                        this.editor.dragHandlers = {
                            mousemove: onMouseMove,
                            mouseup: onMouseUp
                        };

                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                        return;
                    }

                    // 点击在空白区域，取消激活
                    this.editor.activeElement = 'none';

                    // 开始拖拽预览区域
                    var startX = e.clientX;
                    var startY = e.clientY;
                    var startOffsetX = this.editor.offsetX;
                    var startOffsetY = this.editor.offsetY;

                    var onMouseMove = function (moveEvent) {
                        var dx = moveEvent.clientX - startX;
                        var dy = moveEvent.clientY - startY;
                        _this.editor.offsetX = startOffsetX + dx;
                        _this.editor.offsetY = startOffsetY + dy;
                    };

                    var onMouseUp = function () {
                        _this.clearDragListeners();
                    };

                    this.editor.dragHandlers = {
                        mousemove: onMouseMove,
                        mouseup: onMouseUp
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                }
            },

            /**
             * 检查点击是否在图层范围内
             * @param {MouseEvent} e - 鼠标事件
             * @returns {string|null} - 'image' 或 'text' 或 null
             */
            checkClickOnLayer: function (e) {
                // 获取预览区域和内容容器
                var previewArea = document.querySelector('.editor-preview-area');
                var previewWrapper = document.querySelector('.editor-preview-wrapper');
                if (!previewArea || !previewWrapper) return null;

                // 计算点击位置相对于预览区域的坐标
                var areaRect = previewArea.getBoundingClientRect();
                var clickX = e.clientX - areaRect.left;
                var clickY = e.clientY - areaRect.top;

                // 计算 wrapper 的实际位置（考虑 scale 和 offset）
                var wrapperWidth = this.editor.baseImageWidth * this.editor.scale;
                var wrapperHeight = this.editor.baseImageHeight * this.editor.scale;
                var wrapperLeft = (areaRect.width - wrapperWidth) / 2 + this.editor.offsetX;
                var wrapperTop = (areaRect.height - wrapperHeight) / 2 + this.editor.offsetY;

                // 点击位置相对于 wrapper 的坐标
                var relativeX = (clickX - wrapperLeft) / this.editor.scale;
                var relativeY = (clickY - wrapperTop) / this.editor.scale;

                // 检查文字层（文字层在上层，优先检查）
                if (this.editor.showText && this.editor.textContent) {
                    // 文字层覆盖整个画布，检查是否在画布范围内
                    if (relativeX >= 0 && relativeX <= this.editor.baseImageWidth &&
                        relativeY >= 0 && relativeY <= this.editor.baseImageHeight) {
                        return 'text';
                    }
                }

                // 检查底图层（支持画框外点击）
                if (this.editor.showImage && this.editor.baseImage) {
                    // 计算底图层的实际位置（考虑 imageOffset 和 imageScale）
                    var imageLeft = wrapperLeft + this.editor.imageOffsetX * this.editor.scale;
                    var imageTop = wrapperTop + this.editor.imageOffsetY * this.editor.scale;
                    var imageWidth = this.editor.baseImageWidth * this.editor.scale * this.editor.imageScale;
                    var imageHeight = this.editor.baseImageHeight * this.editor.scale * this.editor.imageScale;

                    // 检查点击是否在底图层范围内
                    if (clickX >= imageLeft && clickX <= imageLeft + imageWidth &&
                        clickY >= imageTop && clickY <= imageTop + imageHeight) {
                        return 'image';
                    }
                }

                return null;
            },

            /**
             * 预览区域滚轮，缩放预览
             */
            onPreviewAreaWheel: function (e) {
                // 如果没有激活元素，缩放预览区域
                if (this.editor.activeElement === 'none') {
                    e.preventDefault();
                    var delta = e.deltaY > 0 ? -0.02 : 0.02;
                    this.handleEditorZoom(delta);
                }
            },

            /**
             * 素材图鼠标按下
             */
            onImageMouseDown: function (e) {
                e.stopPropagation();

                // 清理可能存在的旧监听器
                this.clearDragListeners();

                // 重置移动标记
                this.editor.imageMouseMoved = false;

                // 开始拖拽
                this.editor.imageDragging = true;
                this.editor.imageDragStartX = e.clientX;
                this.editor.imageDragStartY = e.clientY;

                var _this = this;
                var startOffsetX = this.editor.imageOffsetX;
                var startOffsetY = this.editor.imageOffsetY;

                var onMouseMove = function (moveEvent) {
                    if (!_this.editor.imageDragging) return;

                    // 标记已发生移动
                    _this.editor.imageMouseMoved = true;

                    var dx = moveEvent.clientX - _this.editor.imageDragStartX;
                    var dy = moveEvent.clientY - _this.editor.imageDragStartY;

                    // 只有当前元素激活时才移动
                    if (_this.editor.activeElement === 'image') {
                        // 除以 editor.scale 因为 wrapper 被缩放了，确保素材图跟随鼠标移动
                        _this.editor.imageOffsetX = startOffsetX + dx / _this.editor.scale;
                        _this.editor.imageOffsetY = startOffsetY + dy / _this.editor.scale;
                    }
                };

                var onMouseUp = function () {
                    _this.editor.imageDragging = false;
                    _this.clearDragListeners();

                    // 如果没有移动，认为是点击事件
                    if (!_this.editor.imageMouseMoved) {
                        var now = Date.now();

                        // 处理重叠区域切换逻辑
                        if (_this.editor.showText &&
                            _this.editor.activeElement === 'image' &&
                            _this.editor.lastClickElement === 'image' &&
                            (now - _this.editor.lastClickTime) < 500) {
                            // 快速点击同一元素，切换到文字层
                            _this.editor.activeElement = 'text';
                            _this.editor.lastClickElement = 'text';
                        } else {
                            // 激活素材图
                            _this.editor.activeElement = 'image';
                            _this.editor.lastClickElement = 'image';
                        }
                        _this.editor.lastClickTime = now;
                    }
                };

                this.editor.dragHandlers = {
                    mousemove: onMouseMove,
                    mouseup: onMouseUp
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            },

            /**
             * 素材图滚轮缩放
             */
            onImageWheel: function (e) {
                if (this.editor.activeElement === 'image') {
                    e.preventDefault();
                    e.stopPropagation();
                    var delta = e.deltaY > 0 ? -0.02 : 0.02;
                    var newScale = this.editor.imageScale + delta;
                    if (newScale < 0.1) newScale = 0.1;
                    if (newScale > 10.0) newScale = 10.0;
                    this.editor.imageScale = parseFloat(newScale.toFixed(2));
                }
            },

            /**
             * 文字层鼠标按下
             */
            onTextMouseDown: function (e) {
                e.stopPropagation();

                // 清理可能存在的旧监听器
                this.clearDragListeners();

                // 重置移动标记
                this.editor.textMouseMoved = false;

                // 开始拖拽
                this.editor.textDragging = true;
                this.editor.textDragStartX = e.clientX;
                this.editor.textDragStartY = e.clientY;

                var _this = this;

                var onMouseMove = function (moveEvent) {
                    if (!_this.editor.textDragging) return;

                    // 标记已发生移动
                    _this.editor.textMouseMoved = true;

                    // 只有当前元素激活时才移动
                    if (_this.editor.activeElement === 'text') {
                        var dx = moveEvent.clientX - _this.editor.textDragStartX;
                        var dy = moveEvent.clientY - _this.editor.textDragStartY;

                        // 将像素位移转换为百分比
                        // 需要除以 editor.scale 因为 wrapper 被缩放了，确保文字跟随鼠标移动
                        var percentX = (dx / _this.editor.scale / _this.editor.baseImageWidth) * 100;
                        var percentY = (dy / _this.editor.scale / _this.editor.baseImageHeight) * 100;

                        _this.editor.textPosX += percentX;
                        _this.editor.textPosY += percentY;

                        _this.editor.textDragStartX = moveEvent.clientX;
                        _this.editor.textDragStartY = moveEvent.clientY;
                    }
                };

                var onMouseUp = function () {
                    _this.editor.textDragging = false;
                    _this.clearDragListeners();

                    // 如果没有移动，认为是点击事件
                    if (!_this.editor.textMouseMoved) {
                        var now = Date.now();

                        // 处理重叠区域切换逻辑
                        if (_this.editor.showImage &&
                            _this.editor.activeElement === 'text' &&
                            _this.editor.lastClickElement === 'text' &&
                            (now - _this.editor.lastClickTime) < 500) {
                            // 快速点击同一元素，切换到素材图
                            _this.editor.activeElement = 'image';
                            _this.editor.lastClickElement = 'image';
                        } else {
                            // 激活文字层
                            _this.editor.activeElement = 'text';
                            _this.editor.lastClickElement = 'text';
                        }
                        _this.editor.lastClickTime = now;
                    }
                };

                this.editor.dragHandlers = {
                    mousemove: onMouseMove,
                    mouseup: onMouseUp
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            },

            /**
             * 上传替换底图
             */
            triggerEditorUpload: function () {
                this.$refs.editorFileInput.click();
            },

            /**
             * 切换视图模式（1:1 <-> 适应高度）
             */
            toggleEditorViewMode: function () {
                var _this = this;
                var previewArea = document.querySelector('.editor-preview-area');
                if (!previewArea || !this.editor.baseImageHeight) return;

                if (this.editor.viewMode === 'fit-height') {
                    // 切换到1:1模式
                    this.editor.viewMode = 'one-to-one';
                    this.editor.scale = 1.0;
                } else {
                    // 切换到适应高度模式（智能适应：优先按高度75%，如果宽度超出则按宽度100%）
                    this.editor.viewMode = 'fit-height';

                    var containerHeight = previewArea.clientHeight;
                    var containerWidth = previewArea.clientWidth;

                    // 1. 先按高度75%计算缩放比例
                    var fitByHeightScale = (containerHeight * 0.75) / this.editor.baseImageHeight;

                    // 2. 计算此时的宽度
                    var widthAfterHeightFit = this.editor.baseImageWidth * fitByHeightScale;

                    // 3. 判断宽度是否超出容器
                    var fitScale;
                    if (widthAfterHeightFit > containerWidth) {
                        // 宽度超出，改为按宽度100%缩放
                        fitScale = containerWidth / this.editor.baseImageWidth;
                    } else {
                        // 宽度未超出，使用高度75%的缩放
                        fitScale = fitByHeightScale;
                    }

                    // 限制缩放范围
                    if (fitScale > 5.0) fitScale = 5.0;
                    if (fitScale < 0.1) fitScale = 0.1;
                    this.editor.scale = parseFloat(fitScale.toFixed(2));
                }
            },

            onEditorFileChange: function (e) {
                var _this = this;
                var file = e.target.files[0];
                if (!file) return;

                var reader = new FileReader();
                reader.onload = function (event) {
                    _this.editor.baseImage = event.target.result;

                    // 上传新图片时，不改变画布尺寸，保持导出区域固定
                    // baseImageWidth 和 baseImageHeight 保持不变
                };
                reader.readAsDataURL(file);
                e.target.value = '';
            },

            /**
             * 文字层滚轮缩放
             */
            onTextWheel: function (e) {
                if (this.editor.activeElement === 'text') {
                    e.preventDefault();
                    e.stopPropagation();
                    var delta = e.deltaY > 0 ? -0.02 : 0.02;
                    var newScale = this.editor.textScale + delta;
                    if (newScale < 0.1) newScale = 0.1;
                    if (newScale > 10.0) newScale = 10.0;
                    this.editor.textScale = parseFloat(newScale.toFixed(2));
                }
            },

            /**
             * 处理预览缩放
             */
            handleEditorZoom: function (delta) {
                var newScale = this.editor.scale + delta;
                if (newScale < 0.1) newScale = 0.1;
                if (newScale > 5.0) newScale = 5.0;
                this.editor.scale = parseFloat(newScale.toFixed(2));
            },

            /**
             * 处理预览平移（按钮）
             */
            moveEditorView: function (dx, dy) {
                this.editor.offsetX += dx;
                this.editor.offsetY += dy;
            },

            /**
             * 保存编辑结果
             * 使用 Canvas + SVG foreignObject 方案，以支持高级 CSS 文字特效（如渐变、描边等）
             */
            saveMaterialEdit: function () {
                var _this = this;
                this.editor.loading = true;

                // 1. 准备画布
                var canvas = document.createElement('canvas');
                var width = this.editor.baseImageWidth || 100;
                var height = this.editor.baseImageHeight || 100;
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext('2d');

                // 辅助函数：加载图片
                var loadImage = function (src) {
                    return new Promise(function (resolve, reject) {
                        var img = new Image();
                        // 只有网络图片才启用 crossOrigin，本地 blob/data 不需要且可能导致 tainted 问题
                        if (src.indexOf('http') === 0) {
                            img.crossOrigin = 'Anonymous';
                        }
                        img.onload = function () { resolve(img); };
                        img.onerror = function (e) { reject(e); };
                        img.src = src;
                    });
                };

                // 2. 绘制流程
                var drawProcess = Promise.resolve();

                // 2.1 绘制底图（支持偏移和缩放）
                if (this.editor.showImage && this.editor.baseImage) {
                    drawProcess = drawProcess.then(function () {
                        return loadImage(_this.editor.baseImage).then(function (img) {
                            // ==================== 重要说明 ====================
                            // 此处的Canvas绘制逻辑必须与HTML预览保持完全一致！
                            // 
                            // HTML预览结构：
                            // <div class="editor-image-wrapper" 
                            //      style="transform: translate(imageOffsetX, imageOffsetY) scale(imageScale);
                            //             transform-origin: 50% 50%;">
                            //   <img style="object-fit: contain;" />
                            // </div>
                            // 
                            // CSS transform 特性：
                            // 1. transform-origin默认为center center（画布中心）
                            // 2. 变换顺序：先translate（平移）后scale（缩放）
                            // 3. 所有变换都围绕transform-origin进行
                            // 
                            // Canvas等价实现（关键步骤，顺序不可改）：
                            // 1. 图片先按object-fit:contain适配到画布尺寸
                            // 2. 移动坐标原点到画布中心（模拟transform-origin）
                            // 3. 应用translate平移
                            // 4. 应用scale缩放
                            // 5. 绘制图片（坐标相对于中心点）
                            // 
                            // ⚠️ 注意事项：
                            // - translate和scale的顺序不能颠倒！
                            // - 图片坐标必须相对于中心点计算（减去width/2和height/2）
                            // - 修改此处逻辑前请先验证HTML预览效果是否一致
                            // ==================================================

                            // 步骤1：计算图片如何适配到画布（object-fit: contain）
                            var imgRatio = img.width / img.height;
                            var canvasRatio = width / height;
                            var fitWidth, fitHeight, fitX, fitY;

                            if (imgRatio > canvasRatio) {
                                // 图片更宽，以画布宽度为准，高度按比例缩小，垂直居中
                                fitWidth = width;
                                fitHeight = width / imgRatio;
                                fitX = 0;
                                fitY = (height - fitHeight) / 2;
                            } else {
                                // 图片更高或同比，以画布高度为准，宽度按比例缩小，水平居中
                                fitHeight = height;
                                fitWidth = height * imgRatio;
                                fitX = (width - fitWidth) / 2;
                                fitY = 0;
                            }

                            // 步骤2：应用CSS transform等价变换
                            ctx.save();

                            // 2.1 移动坐标原点到画布中心（模拟transform-origin: center center）
                            ctx.translate(width / 2, height / 2);

                            // 2.2 应用用户的平移操作（对应CSS的translate）
                            // 注意：必须在scale之前，顺序不可颠倒！
                            ctx.translate(_this.editor.imageOffsetX, _this.editor.imageOffsetY);

                            // 2.3 应用用户的缩放操作（对应CSS的scale）
                            // 缩放围绕当前坐标原点（即画布中心+平移后的位置）
                            ctx.scale(_this.editor.imageScale, _this.editor.imageScale);

                            // 步骤3：绘制适配后的图片
                            // 坐标必须相对于中心点（因为原点已移到中心）
                            ctx.drawImage(img,
                                fitX - width / 2,  // X坐标 = 适配位置 - 画布中心X
                                fitY - height / 2,  // Y坐标 = 适配位置 - 画布中心Y
                                fitWidth,           // 适配后的宽度
                                fitHeight           // 适配后的高度
                            );

                            ctx.restore();
                        });
                    });
                }

                // 2.2 绘制文字 (使用 Canvas API 替代 SVG foreignObject 以避免 Tainted Canvas)
                if (this.editor.showText && this.editor.textContent) {
                    drawProcess = drawProcess.then(function () {
                        // 计算文字位置
                        var centerX = (width * _this.editor.textPosX) / 100;
                        var centerY = (height * _this.editor.textPosY) / 100;

                        // 保存状态
                        ctx.save();

                        // 移动到文字中心点
                        ctx.translate(centerX, centerY);

                        // 应用缩放
                        ctx.scale(_this.editor.textScale, _this.editor.textScale);

                        // 使用 drawRichText 绘制带样式的文字
                        _this.drawRichText(ctx, width, height);

                        // 恢复状态
                        ctx.restore();
                    });
                }

                // 3. 完成并导出
                drawProcess.then(function () {
                    canvas.toBlob(function (blob) {
                        if (blob) {
                            _this.handleEditedBlob(blob);
                        } else {
                            throw new Error('Canvas to Blob failed');
                        }
                    }, 'image/png');
                }).catch(function (err) {
                    console.error('生成图片失败:', err);
                    alert('生成图片失败，请重试\n' + (err.message || err));
                    _this.editor.loading = false;
                });
            },

            /**
             * 生成透明素材
             */
            generateTransparentMaterial: function () {
                var canvas = document.createElement('canvas');
                canvas.width = this.editor.baseImageWidth || 100;
                canvas.height = this.editor.baseImageHeight || 100;
                var _this = this;
                canvas.toBlob(function (blob) {
                    _this.handleEditedBlob(blob);
                });
            },

            /**
             * 处理生成的 Blob
             */
            handleEditedBlob: function (blob) {
                var _this = this;
                var key = this.editor.targetKey;

                // 根据 key 查找 material
                var material = null;
                for (var i = 0; i < this.materialList.length; i++) {
                    if (this.materialList[i].imageKey === key) {
                        material = this.materialList[i];
                        break;
                    }
                }

                if (!material) {
                    console.error('Material not found for key:', key);
                    return;
                }

                // 保存编辑状态
                // 使用 Vue.set 确保响应式更新
                this.$set(this.materialEditStates, key, {
                    showImage: this.editor.showImage,
                    showText: this.editor.showText,
                    textContent: this.editor.textContent,
                    textStyle: this.editor.textStyle,
                    textPosX: this.editor.textPosX,
                    textPosY: this.editor.textPosY,
                    textScale: this.editor.textScale,
                    textAlign: this.editor.textAlign,
                    imageOffsetX: this.editor.imageOffsetX,
                    imageOffsetY: this.editor.imageOffsetY,
                    imageScale: this.editor.imageScale,
                    // 保存当前的底图（原始图或用户上传的图）
                    customBaseImage: this.editor.baseImage
                });

                // 生成 blob URL 并替换素材
                var reader = new FileReader();
                reader.onload = function (e) {
                    var url = e.target.result;

                    // 1. 更新 replacedImages (用于 SVGA 渲染)
                    _this.$set(_this.replacedImages, material.imageKey, url);

                    // 2. 更新 material 对象 (用于列表缩略图显示)
                    // 保留原始图片的引用（首次保存时）
                    if (!material.originalUrl) {
                        material.originalUrl = material.previewUrl;
                    }
                    material.previewUrl = url;
                    material.isReplaced = true;

                    // 3. 更新文件大小信息
                    if (blob) {
                        material.fileSize = blob.size;
                        if (_this.formatBytes) {
                            material.fileSizeText = _this.formatBytes(blob.size);
                        }
                    }

                    // 4. 应用到播放器 (触发 SVGA 刷新)
                    if (_this.applyReplacedMaterials) {
                        _this.applyReplacedMaterials();
                    } else if (_this.svgaPlayer) {
                        _this.svgaPlayer.setImage(url, material.imageKey);
                    }

                    // 关闭编辑器
                    _this.editor.loading = false;
                    _this.editor.show = false;

                    if (_this.showToast) {
                        _this.showToast('素材编辑已保存');
                    }
                };
                reader.readAsDataURL(blob);
            },

            /**
             * 恢复原图时清除编辑状态
             * @param {number|string} indexOrKey - 索引或Key
             */
            clearMaterialEditState: function (indexOrKey) {
                // 兼容处理：如果是数字，尝试去 materialList 找 key
                var key = indexOrKey;
                if (typeof indexOrKey === 'number') {
                    if (this.materialList[indexOrKey]) {
                        key = this.materialList[indexOrKey].imageKey;
                    }
                }

                if (key && this.materialEditStates[key]) {
                    this.$delete(this.materialEditStates, key);
                }
            },

            /**
             * 解析 text-shadow 字符串
             */
            parseShadows: function (shadowStr) {
                var shadows = [];
                // 匹配模式: x y [blur] color (支持 hex 和 rgba)
                // 示例: 0px 1px 0px #EF9A4B 或 1px 1px #000
                var regex = /(-?[\d.]+(?:px)?)\s+(-?[\d.]+(?:px)?)(?:\s+(-?[\d.]+(?:px)?))?\s+(#[0-9a-fA-F]+|rgba?\([^)]+\))/g;
                var match;
                while ((match = regex.exec(shadowStr)) !== null) {
                    shadows.push({
                        x: parseFloat(match[1]),
                        y: parseFloat(match[2]),
                        blur: match[3] ? parseFloat(match[3]) : 0,
                        color: match[4]
                    });
                }
                return shadows;
            },

            /**
             * 解析 stroke/border 字符串
             */
            parseStroke: function (strokeStr) {
                // 匹配模式: width [style] color
                // 示例: 1px solid #FFF3B9 或 1px #FFF 或 1px transparent
                var regex = /(\d+(?:px)?)\s+(?:solid\s+)?(#[0-9a-fA-F]+|rgba?\([^)]+\)|transparent)/i;
                var match = strokeStr.match(regex);
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
             */
            drawRichText: function (ctx, width, height) {
                var style = this.editorTextStyleFiltered;
                var text = this.editor.textContent;
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
                ctx.textAlign = this.editor.textAlign;
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
                        var shadowMatch = shadow.match(/(-?[\d.]+(?:px)?)\s+(-?[\d.]+(?:px)?)(?:\s+(-?[\d.]+(?:px)?))?\s+(#[0-9a-fA-F]+|rgba?\([^)]+\))/i);

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
             * 清除所有编辑状态
             */
            clearAllMaterialEditStates: function () {
                this.materialEditStates = {};
            }
        }
    };

    // 暴露到全局命名空间
    // 按照项目规范，使用 MeeWoo 作为项目级命名空间
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Mixins = window.MeeWoo.Mixins || {};
    window.MeeWoo.Mixins.MaterialEditor = MaterialEditor;

})(window);