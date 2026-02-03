/**
 * ==================== 素材编辑器交互模块 (Material Interactions) ====================
 * 
 * 模块索引：
 * 1. 【预览区交互】 - 预览区域的鼠标事件处理
 * 2. 【图片层交互】 - 图片图层的鼠标事件处理
 * 3. 【文字层交互】 - 文字图层的鼠标事件处理
 * 4. 【编辑器交互】 - 编辑器其他交互处理
 * 
 * 功能说明：
 * 提供素材编辑器的用户交互功能，包括：
 * 1. 预览区域的拖拽和缩放
 * 2. 图片图层的拖拽和缩放
 * 3. 文字图层的拖拽和缩放
 * 4. 图层的点击选中和双击切换
 * 5. 编辑器文件上传交互
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
         * ==================== 【预览区交互】 ====================
         * 预览区域的鼠标事件处理
         */

        /**
         * 预览区域鼠标按下事件处理
         * @param {Object} vueInstance - Vue实例
         * @param {Event} event - 鼠标事件对象
         */
        onPreviewAreaMouseDown: function (vueInstance, event) {
            var _this = this;

            // 确保activeElement有值，防止null导致的错误
            if (vueInstance.editor.activeElement === null) {
                vueInstance.editor.activeElement = 'none';
            }

            // 清除可能存在的旧监听器
            this.clearDragListeners(vueInstance.editor);

            // 检查是否点击在图层范围内
            var clickedOnLayer = this.checkClickOnLayer(vueInstance, event);

            // 记录鼠标按下的时间和位置
            var mouseDownTime = Date.now();
            var mouseDownX = event.clientX;
            var mouseDownY = event.clientY;

            // 重置拖动标记
            vueInstance.editor.isDragging = false;

            // 如果按下了Alt键，无论是否在图层上，都允许拖动画布
            if (event.altKey) {
                // 开始拖拽预览区域
                var startOffsetX = vueInstance.editor.offsetX;
                var startOffsetY = vueInstance.editor.offsetY;

                var onMouseMove = function (moveEvent) {
                    // 判断是否超过拖动阈值
                    var deltaX = moveEvent.clientX - mouseDownX;
                    var deltaY = moveEvent.clientY - mouseDownY;
                    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                    if (distance > 6) {
                        vueInstance.editor.isDragging = true;
                    }

                    if (vueInstance.editor.isDragging) {
                        var dx = moveEvent.clientX - mouseDownX;
                        var dy = moveEvent.clientY - mouseDownY;
                        // 使用requestAnimationFrame优化DOM更新
                        requestAnimationFrame(function () {
                            vueInstance.editor.offsetX = startOffsetX + dx;
                            vueInstance.editor.offsetY = startOffsetY + dy;
                        });
                    }
                };

                var onMouseUp = function () {
                    _this.clearDragListeners(vueInstance.editor);
                };

                // 保存监听器引用，以便后续清除
                vueInstance.editor.dragHandlers = {
                    mousemove: onMouseMove,
                    mouseup: onMouseUp
                };

                // 添加全局事件监听
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                return;
            }

            // 检查鼠标当前是否在激活的图层上
            var isMouseOnActiveLayer = false;
            if (vueInstance.editor.activeElement !== 'none') {
                isMouseOnActiveLayer = (clickedOnLayer === vueInstance.editor.activeElement);
            }

            // 开始处理拖动，根据激活状态和鼠标位置决定拖动内容
            if (vueInstance.editor.activeElement === 'none' || !isMouseOnActiveLayer) {
                // 没有激活图层，或者激活了图层但鼠标不在图层上，拖动画布
                var startOffsetX = vueInstance.editor.offsetX;
                var startOffsetY = vueInstance.editor.offsetY;

                var onMouseMove = function (moveEvent) {
                    // 判断是否超过拖动阈值
                    var deltaX = moveEvent.clientX - mouseDownX;
                    var deltaY = moveEvent.clientY - mouseDownY;
                    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                    if (distance > 6 && !vueInstance.editor.isDragging) {
                        vueInstance.editor.isDragging = true;
                    }

                    if (vueInstance.editor.isDragging) {
                        var dx = moveEvent.clientX - mouseDownX;
                        var dy = moveEvent.clientY - mouseDownY;
                        // 使用requestAnimationFrame优化DOM更新
                        requestAnimationFrame(function () {
                            vueInstance.editor.offsetX = startOffsetX + dx;
                            vueInstance.editor.offsetY = startOffsetY + dy;
                        });
                    }
                };

                var onMouseUp = function (upEvent) {
                    var mouseUpTime = Date.now();
                    var mouseUpX = upEvent.clientX;
                    var mouseUpY = upEvent.clientY;

                    // 计算按下到释放的时间和距离
                    var deltaTime = mouseUpTime - mouseDownTime;
                    var deltaX = mouseUpX - mouseDownX;
                    var deltaY = mouseUpY - mouseDownY;
                    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                    // 清除监听器
                    _this.clearDragListeners(vueInstance.editor);

                    // 判断是否是点击（不是拖动）
                    if (!vueInstance.editor.isDragging && distance <= 6 && deltaTime <= 500) {
                        // 如果点击在图层上，激活该图层
                        if (clickedOnLayer) {
                            // 处理点击事件
                            var now = Date.now();

                            // 检查是否是双击
                            var isDoubleClick = false;
                            if (vueInstance.editor.lastClickElement === clickedOnLayer &&
                                (now - vueInstance.editor.lastClickTime) < 300) {
                                // 计算两次点击的距离
                                var lastClickX = vueInstance.editor.lastClickX || 0;
                                var lastClickY = vueInstance.editor.lastClickY || 0;
                                var clickDistance = Math.sqrt(
                                    Math.pow(mouseUpX - lastClickX, 2) +
                                    Math.pow(mouseUpY - lastClickY, 2)
                                );

                                if (clickDistance <= 8) {
                                    isDoubleClick = true;
                                }
                            }

                            if (isDoubleClick) {
                                // 双击：实现图层循环切换
                                var layers = [];

                                // 构建图层数组，从上到下排序
                                if (vueInstance.editor.showText) {
                                    layers.push('text');
                                }
                                if (vueInstance.editor.showImage) {
                                    layers.push('image');
                                }

                                // 找到当前选中图层的索引
                                var currentIndex = layers.indexOf(vueInstance.editor.activeElement);

                                // 切换到下一个图层，如果是最后一个则循环到第一个
                                var nextIndex = (currentIndex + 1) % layers.length;
                                vueInstance.editor.activeElement = layers[nextIndex];
                                vueInstance.editor.lastClickElement = layers[nextIndex];
                            } else {
                                // 单击：激活该图层
                                vueInstance.editor.activeElement = clickedOnLayer;
                                vueInstance.editor.lastClickElement = clickedOnLayer;
                            }

                            // 更新点击记录
                            vueInstance.editor.lastClickTime = now;
                            vueInstance.editor.lastClickX = mouseUpX;
                            vueInstance.editor.lastClickY = mouseUpY;
                        } else {
                            // 点击在空白区域，取消激活状态
                            vueInstance.editor.activeElement = 'none';
                        }
                    }
                };

                // 保存监听器引用，以便后续清除
                vueInstance.editor.dragHandlers = {
                    mousemove: onMouseMove,
                    mouseup: onMouseUp
                };

                // 添加全局事件监听
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            } else {
                // 有激活图层，且鼠标在该图层上，处理该图层的交互
                // 开始处理图层交互
                var startImageOffsetX = vueInstance.editor.imageOffsetX;
                var startImageOffsetY = vueInstance.editor.imageOffsetY;
                var startTextPosX = vueInstance.editor.textPosX;
                var startTextPosY = vueInstance.editor.textPosY;

                var onMouseMove = function (moveEvent) {
                    // 判断是否超过拖动阈值
                    var deltaX = moveEvent.clientX - mouseDownX;
                    var deltaY = moveEvent.clientY - mouseDownY;
                    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                    if (distance > 6) {
                        vueInstance.editor.isDragging = true;
                    }

                    if (vueInstance.editor.isDragging) {
                        if (vueInstance.editor.activeElement === 'image') {
                            // 处理底图层拖动
                            var dx = moveEvent.clientX - mouseDownX;
                            var dy = moveEvent.clientY - mouseDownY;
                            // 使用requestAnimationFrame优化DOM更新
                            requestAnimationFrame(function () {
                                vueInstance.editor.imageOffsetX = startImageOffsetX + dx / vueInstance.editor.scale;
                                vueInstance.editor.imageOffsetY = startImageOffsetY + dy / vueInstance.editor.scale;
                            });
                        } else if (vueInstance.editor.activeElement === 'text') {
                            // 处理文字层拖动
                            var dx = moveEvent.clientX - mouseDownX;
                            var dy = moveEvent.clientY - mouseDownY;
                            var percentX = (dx / vueInstance.editor.scale / vueInstance.editor.baseImageWidth) * 100;
                            var percentY = (dy / vueInstance.editor.scale / vueInstance.editor.baseImageHeight) * 100;
                            // 使用requestAnimationFrame优化DOM更新
                            requestAnimationFrame(function () {
                                vueInstance.editor.textPosX = startTextPosX + percentX;
                                vueInstance.editor.textPosY = startTextPosY + percentY;
                                // 重新渲染文字
                                vueInstance.renderEditorPreview();
                            });
                        }
                    }
                };

                var onMouseUp = function (upEvent) {
                    var mouseUpTime = Date.now();
                    var mouseUpX = upEvent.clientX;
                    var mouseUpY = upEvent.clientY;

                    // 计算按下到释放的时间和距离
                    var deltaTime = mouseUpTime - mouseDownTime;
                    var deltaX = mouseUpX - mouseDownX;
                    var deltaY = mouseUpY - mouseDownY;
                    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                    // 清除监听器
                    _this.clearDragListeners(vueInstance.editor);

                    // 判断是否是点击（不是拖动）
                    if (!vueInstance.editor.isDragging && distance <= 6 && deltaTime <= 500) {
                        // 处理点击事件
                        var now = Date.now();

                        // 检查是否是双击
                        var isDoubleClick = false;
                        if (vueInstance.editor.lastClickElement === clickedOnLayer &&
                            (now - vueInstance.editor.lastClickTime) < 300) {
                            // 计算两次点击的距离
                            var lastClickX = vueInstance.editor.lastClickX || 0;
                            var lastClickY = vueInstance.editor.lastClickY || 0;
                            var clickDistance = Math.sqrt(
                                Math.pow(mouseUpX - lastClickX, 2) +
                                Math.pow(mouseUpY - lastClickY, 2)
                            );

                            if (clickDistance <= 8) {
                                isDoubleClick = true;
                            }
                        }

                        if (isDoubleClick) {
                            // 双击：实现图层循环切换
                            var layers = [];

                            // 构建图层数组，从上到下排序
                            if (vueInstance.editor.showText) {
                                layers.push('text');
                            }
                            if (vueInstance.editor.showImage) {
                                layers.push('image');
                            }

                            // 找到当前选中图层的索引
                            var currentIndex = layers.indexOf(vueInstance.editor.activeElement);

                            // 切换到下一个图层，如果是最后一个则循环到第一个
                            var nextIndex = (currentIndex + 1) % layers.length;
                            vueInstance.editor.activeElement = layers[nextIndex];
                            vueInstance.editor.lastClickElement = layers[nextIndex];
                        } else {
                            // 单击：如果点击的是不同图层，则激活该图层
                            if (vueInstance.editor.activeElement !== clickedOnLayer) {
                                // 激活当前点击的图层
                                vueInstance.editor.activeElement = clickedOnLayer;
                                vueInstance.editor.lastClickElement = clickedOnLayer;
                            }
                        }

                        // 更新点击记录
                        vueInstance.editor.lastClickTime = now;
                        vueInstance.editor.lastClickX = mouseUpX;
                        vueInstance.editor.lastClickY = mouseUpY;
                    }
                };

                // 保存监听器引用，以便后续清除
                vueInstance.editor.dragHandlers = {
                    mousemove: onMouseMove,
                    mouseup: onMouseUp
                };

                // 添加全局事件监听
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        },

        /**
         * 预览区域鼠标滚轮事件处理
         * @param {Object} vueInstance - Vue实例
         * @param {Event} event - 鼠标事件对象
         */
        onPreviewAreaWheel: function (vueInstance, event) {
            // 处理预览区域的鼠标滚轮事件
            event.preventDefault();

            // 确保activeElement有值，防止null导致的错误
            if (vueInstance.editor.activeElement === null) {
                vueInstance.editor.activeElement = 'none';
            }

            // 如果按下Ctrl键或Alt键，无论是否激活图层，都缩放预览区域
            if (event.ctrlKey || event.metaKey || event.altKey) {
                var delta = event.deltaY > 0 ? -0.02 : 0.02; // 画布缩放步进2%
                this.handleEditorZoom(vueInstance, delta);
                return;
            }

            // 检查当前鼠标位置所在的图层
            var currentLayer = this.checkClickOnLayer(vueInstance, event);

            // 根据激活的图层和鼠标位置处理滚轮事件
            if (vueInstance.editor.activeElement === 'none') {
                // 没有激活元素，缩放预览区域
                var delta = event.deltaY > 0 ? -0.02 : 0.02; // 画布缩放步进2%
                this.handleEditorZoom(vueInstance, delta);
            } else {
                // 有激活图层，检查鼠标是否在该图层上
                if (currentLayer === vueInstance.editor.activeElement) {
                    // 鼠标在激活图层上，缩放该图层
                    if (currentLayer === 'image') {
                        // 激活的是底图层，且鼠标在底图层上，处理底图缩放
                        var delta = event.deltaY > 0 ? -0.01 : 0.01; // 图层缩放步进1%
                        var newScale = vueInstance.editor.imageScale + delta;
                        if (newScale < 0.1) newScale = 0.1;
                        if (newScale > 10.0) newScale = 10.0;
                        vueInstance.editor.imageScale = parseFloat(newScale.toFixed(2));
                    } else if (currentLayer === 'text') {
                        // 激活的是文字层，且鼠标在文字层上，处理文字缩放
                        var delta = event.deltaY > 0 ? -0.01 : 0.01; // 图层缩放步进1%
                        var newScale = vueInstance.editor.textScale + delta;
                        if (newScale < 0.1) newScale = 0.1;
                        if (newScale > 10.0) newScale = 10.0;
                        vueInstance.editor.textScale = parseFloat(newScale.toFixed(2));
                        // 重新渲染文字
                        vueInstance.renderEditorPreview();
                    }
                } else {
                    // 鼠标不在激活图层上，缩放画布
                    var delta = event.deltaY > 0 ? -0.02 : 0.02; // 画布缩放步进2%
                    this.handleEditorZoom(vueInstance, delta);
                }
            }
        },

        /**
         * ==================== 【图片层交互】 ====================
         * 图片图层的鼠标事件处理
         */

        /**
         * 图片鼠标按下事件处理
         * @param {Object} vueInstance - Vue实例
         * @param {Event} event - 鼠标事件对象
         */
        onImageMouseDown: function (vueInstance, event) {
            // 不阻止事件冒泡，让事件冒泡到父级，由onPreviewAreaMouseDown统一处理
        },

        /**
         * 图片鼠标滚轮事件处理
         * @param {Object} vueInstance - Vue实例
         * @param {Event} event - 鼠标事件对象
         */
        onImageWheel: function (vueInstance, event) {
            // 不处理，让事件冒泡到父级，由onPreviewAreaWheel统一处理
        },

        /**
         * 切换编辑器视图模式（1:1显示 / 适应高度）
         * @param {Object} vueInstance - Vue实例
         */
        toggleEditorViewMode: function (vueInstance) {
            var previewArea = document.querySelector('.editor-preview-area');
            if (!previewArea || !vueInstance.editor.baseImageHeight) return;

            if (vueInstance.editor.viewMode === 'fit-height') {
                // 切换到1:1模式
                vueInstance.editor.viewMode = 'one-to-one';
                vueInstance.editor.scale = 1.0;
            } else {
                // 切换到适应高度模式（智能适应：优先按高度75%，如果宽度超出则按宽度100%）
                vueInstance.editor.viewMode = 'fit-height';

                var containerHeight = previewArea.clientHeight;
                var containerWidth = previewArea.clientWidth;

                // 1. 先按高度75%计算缩放比例
                var fitByHeightScale = (containerHeight * 0.75) / vueInstance.editor.baseImageHeight;

                // 2. 计算此时的宽度
                var widthAfterHeightFit = vueInstance.editor.baseImageWidth * fitByHeightScale;

                // 3. 判断宽度是否超出容器
                var fitScale;
                if (widthAfterHeightFit > containerWidth) {
                    // 宽度超出，改为按宽度100%缩放
                    fitScale = containerWidth / vueInstance.editor.baseImageWidth;
                } else {
                    // 宽度未超出，使用高度75%的缩放
                    fitScale = fitByHeightScale;
                }

                // 限制缩放范围
                if (fitScale > 5.0) fitScale = 5.0;
                if (fitScale < 0.1) fitScale = 0.1;
                vueInstance.editor.scale = parseFloat(fitScale.toFixed(2));
            }
        },

        /**
         * 检查点击是否在图层范围内
         * @param {Object} vueInstance - Vue实例
         * @param {Event} event - 鼠标事件对象
         * @returns {string|null} - 'image' 或 'text' 或 null
         */
        checkClickOnLayer: function (vueInstance, event) {
            // 获取预览区域和容器
            var previewArea = document.querySelector('.editor-preview-area');
            var previewWrapper = document.querySelector('.editor-preview-wrapper');
            if (!previewArea || !previewWrapper) return null;

            // 计算点击位置相对于预览区域的坐标
            var areaRect = previewArea.getBoundingClientRect();
            var clickX = event.clientX - areaRect.left;
            var clickY = event.clientY - areaRect.top;

            // 计算预览内容区域的实际边界（相对于previewArea）
            var contentLeft = (previewArea.clientWidth - previewWrapper.clientWidth) / 2;
            var contentTop = (previewArea.clientHeight - previewWrapper.clientHeight) / 2;
            var contentRight = contentLeft + previewWrapper.clientWidth;
            var contentBottom = contentTop + previewWrapper.clientHeight;

            // 快速检查：如果点击不在预览内容区域内，直接返回null
            if (clickX < contentLeft || clickX > contentRight ||
                clickY < contentTop || clickY > contentBottom) {
                return null;
            }

            // 如果当前正在拖动，保持之前的图层判断
            if (vueInstance.editor.isDragging) {
                return vueInstance.editor.activeElement;
            }

            // 计算点击位置相对于Canvas的坐标
            var canvasX = Math.round((clickX - contentLeft) / vueInstance.editor.scale);
            var canvasY = Math.round((clickY - contentTop) / vueInstance.editor.scale);

            // 按照图层堆叠顺序检查：文字层在上，底图层在下

            // 1. 检查文字层（最高优先级）
            if (vueInstance.editor.showText && vueInstance.editor.textContent) {
                var textCanvas = vueInstance.$refs.editorTextCanvas;
                if (textCanvas) {
                    // 快速检查：确保坐标在Canvas范围内
                    if (canvasX >= 0 && canvasX < textCanvas.width &&
                        canvasY >= 0 && canvasY < textCanvas.height) {
                        try {
                            var ctx = textCanvas.getContext('2d', { willReadFrequently: true });
                            // 使用getImageData获取像素数据
                            var imageData = ctx.getImageData(canvasX, canvasY, 1, 1);
                            var pixelData = imageData.data;
                            // 如果alpha通道值大于0，说明文字层有像素，返回'text'
                            if (pixelData[3] > 0) {
                                return 'text';
                            }
                        } catch (e) {
                            // 如果获取像素数据失败，继续检查底图层
                        }
                    }
                }
            }

            // 2. 检查底图层（次优先级）
            if (vueInstance.editor.showImage && vueInstance.editor.baseImage) {
                // 底图层始终填充整个画布，所以只要点击在预览内容区域内，就返回'image'
                return 'image';
            }

            return null;
        },

        /**
         * ==================== 【文字层交互】 ====================
         * 文字图层的鼠标事件处理
         */

        /**
         * 文字层鼠标按下事件处理
         * @param {Object} vueInstance - Vue实例
         * @param {Event} event - 鼠标事件对象
         */
        onTextMouseDown: function (vueInstance, event) {
            // 不阻止事件冒泡，让事件冒泡到父级，由onPreviewAreaMouseDown统一处理
        },

        /**
         * 文字层鼠标滚轮事件处理
         * @param {Object} vueInstance - Vue实例
         * @param {Event} event - 鼠标事件对象
         */
        onTextWheel: function (vueInstance, event) {
            // 不处理，让事件冒泡到父级，由onPreviewAreaWheel统一处理
        },

        /**
         * ==================== 【编辑器交互】 ====================
         * 编辑器其他交互处理
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
        },

        /**
         * 处理预览缩放
         * @param {Object} vueInstance - Vue实例
         * @param {number} delta - 缩放增量
         */
        handleEditorZoom: function (vueInstance, delta) {
            var newScale = vueInstance.editor.scale + delta;
            if (newScale < 0.1) newScale = 0.1;
            if (newScale > 5.0) newScale = 5.0;
            vueInstance.editor.scale = parseFloat(newScale.toFixed(2));
        },

        /**
         * 处理预览平移（按钮）
         * @param {Object} vueInstance - Vue实例
         * @param {number} dx - X方向平移量
         * @param {number} dy - Y方向平移量
         */
        moveEditorView: function (vueInstance, dx, dy) {
            vueInstance.editor.offsetX += dx;
            vueInstance.editor.offsetY += dy;
        },

        /**
         * 清理拖拽事件监听器
         * @param {Object} editor - 编辑器状态对象
         */
        clearDragListeners: function (editor) {
            if (editor.dragHandlers) {
                if (editor.dragHandlers.mousemove) {
                    document.removeEventListener('mousemove', editor.dragHandlers.mousemove);
                }
                if (editor.dragHandlers.mouseup) {
                    document.removeEventListener('mouseup', editor.dragHandlers.mouseup);
                }
                editor.dragHandlers = null;
            }
        }
    };

    // 导出模块
    window.MeeWoo.Core.MaterialInteractions = MaterialInteractions;
})(window);
