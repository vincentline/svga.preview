/**
 * ==================== Konva 选择管理模块 (Konva Selection Manager) ====================
 * 
 * 模块索引：
 * 1. 【选择管理】 - 单选、多选、框选功能
 * 2. 【选择状态】 - 选择状态管理和维护
 * 3. 【选择事件】 - 选择相关事件处理
 * 4. 【选择框】 - 自定义选择框绘制和管理
 * 
 * 功能说明：
 * 负责 Konva 元素的选择管理，提供多种选择方式和选择状态管理，包括：
 * 1. 单选功能
 * 2. 多选功能（按住 Shift/Ctrl 键）
 * 3. 框选功能（拖拽选择）
 * 4. 选择状态管理
 * 5. 选择事件分发
 * 6. 自定义选择框绘制
 * 
 * 命名空间：MeeWoo.Core.KonvaSelection
 */

(function (window) {
    'use strict';

    // 确保命名空间存在
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Core = window.MeeWoo.Core || {};

    /**
     * Konva 选择管理模块
     */
    var KonvaSelection = {
        /**
         * 初始化选择管理器
         * @param {Object} stageInstance - 舞台实例对象
         * @param {Object} options - 选择配置选项
         * @returns {Object} 选择管理器实例
         */
        initSelectionManager: function (stageInstance, options) {
            // 确保 Konva 库已加载
            if (typeof Konva === 'undefined') {
                throw new Error('Konva library not loaded');
            }

            // 默认配置
            var defaultOptions = {
                selectable: true,
                draggable: true,
                multiselect: true,
                boxSelect: true,
                shiftMultiselect: true,
                ctrlMultiselect: true,
                selectionStroke: '#0099ff',
                selectionStrokeWidth: 1,
                selectionDash: [5, 5],
                selectionFill: 'rgba(0, 153, 255, 0.1)',
                hitStrokeWidth: 10
            };

            // 合并配置
            var config = Object.assign({}, defaultOptions, options);

            // 选择状态
            var selectionState = {
                selectedElements: [],
                isDragging: false,
                isBoxSelecting: false,
                startPoint: null,
                selectionBox: null,
                stageInstance: stageInstance,
                config: config
            };

            // 初始化选择框
            this.initSelectionBox(selectionState);

            // 初始化选择事件
            this.initSelectionEvents(selectionState);

            return selectionState;
        },

        /**
         * 初始化选择框
         * @param {Object} selectionState - 选择状态对象
         */
        initSelectionBox: function (selectionState) {
            // 创建选择框矩形
            var selectionBox = new Konva.Rect({
                name: 'selection-box',
                stroke: selectionState.config.selectionStroke,
                strokeWidth: selectionState.config.selectionStrokeWidth,
                dash: selectionState.config.selectionDash,
                fill: selectionState.config.selectionFill,
                visible: false
            });

            // 添加到辅助图层
            if (selectionState.stageInstance.layers.helperLayer) {
                selectionState.stageInstance.layers.helperLayer.add(selectionBox);
            }

            selectionState.selectionBox = selectionBox;
        },

        /**
         * 初始化选择事件
         * @param {Object} selectionState - 选择状态对象
         */
        initSelectionEvents: function (selectionState) {
            var stage = selectionState.stageInstance.stage;
            var editLayer = selectionState.stageInstance.layers.editLayer;

            // 鼠标按下事件
            stage.on('mousedown', this.handleMouseDown.bind(this, selectionState));

            // 鼠标移动事件
            stage.on('mousemove', this.handleMouseMove.bind(this, selectionState));

            // 鼠标释放事件
            stage.on('mouseup', this.handleMouseUp.bind(this, selectionState));

            // 鼠标离开舞台事件
            stage.on('mouseleave', this.handleMouseLeave.bind(this, selectionState));

            // 元素点击事件
            editLayer.on('click tap', '.element-*', this.handleElementClick.bind(this, selectionState));
        },

        /**
         * 处理鼠标按下事件
         * @param {Object} selectionState - 选择状态对象
         * @param {Konva.Event} e - 事件对象
         */
        handleMouseDown: function (selectionState, e) {
            // 如果点击的是舞台背景，开始框选
            if (e.target === selectionState.stageInstance.stage) {
                selectionState.isBoxSelecting = true;
                selectionState.startPoint = {
                    x: e.evt.clientX,
                    y: e.evt.clientY
                };
                
                // 显示选择框
                selectionState.selectionBox.visible(true);
                selectionState.selectionBox.width(0);
                selectionState.selectionBox.height(0);
                selectionState.selectionBox.x(e.evt.layerX);
                selectionState.selectionBox.y(e.evt.layerY);
                selectionState.selectionBox.getLayer().draw();
            }
        },

        /**
         * 处理鼠标移动事件
         * @param {Object} selectionState - 选择状态对象
         * @param {Konva.Event} e - 事件对象
         */
        handleMouseMove: function (selectionState, e) {
            if (selectionState.isBoxSelecting && selectionState.startPoint) {
                // 更新选择框
                var currentPoint = {
                    x: e.evt.clientX,
                    y: e.evt.clientY
                };

                var x = Math.min(selectionState.startPoint.x, currentPoint.x);
                var y = Math.min(selectionState.startPoint.y, currentPoint.y);
                var width = Math.abs(currentPoint.x - selectionState.startPoint.x);
                var height = Math.abs(currentPoint.y - selectionState.startPoint.y);

                // 转换为舞台坐标
                var stage = selectionState.stageInstance.stage;
                var stagePos = stage.getPointerPosition();
                var stageRect = stage.container().getBoundingClientRect();

                x = x - stageRect.left;
                y = y - stageRect.top;

                // 更新选择框位置和大小
                selectionState.selectionBox.x(x);
                selectionState.selectionBox.y(y);
                selectionState.selectionBox.width(width);
                selectionState.selectionBox.height(height);

                selectionState.selectionBox.getLayer().draw();
            }
        },

        /**
         * 处理鼠标释放事件
         * @param {Object} selectionState - 选择状态对象
         * @param {Konva.Event} e - 事件对象
         */
        handleMouseUp: function (selectionState, e) {
            if (selectionState.isBoxSelecting) {
                // 结束框选
                this.finishBoxSelection(selectionState);
            }
        },

        /**
         * 处理鼠标离开舞台事件
         * @param {Object} selectionState - 选择状态对象
         */
        handleMouseLeave: function (selectionState) {
            if (selectionState.isBoxSelecting) {
                // 结束框选
                this.finishBoxSelection(selectionState);
            }
        },

        /**
         * 结束框选
         * @param {Object} selectionState - 选择状态对象
         */
        finishBoxSelection: function (selectionState) {
            // 隐藏选择框
            selectionState.selectionBox.visible(false);
            selectionState.selectionBox.getLayer().draw();

            // 获取选择框区域
            var box = selectionState.selectionBox;
            var boxRect = {
                x: box.x(),
                y: box.y(),
                width: box.width(),
                height: box.height()
            };

            // 如果选择框太小，不进行框选
            if (boxRect.width < 5 || boxRect.height < 5) {
                selectionState.isBoxSelecting = false;
                selectionState.startPoint = null;
                return;
            }

            // 选择框内的元素
            var editLayer = selectionState.stageInstance.layers.editLayer;
            var elements = editLayer.find('.element-*');
            var selectedElements = [];

            // 检查每个元素是否在选择框内
            elements.forEach(function (element) {
                var elementRect = element.getClientRect();
                if (this.isRectIntersect(elementRect, boxRect)) {
                    selectedElements.push(element);
                }
            }, this);

            // 更新选择
            if (selectedElements.length > 0) {
                this.setSelectedElements(selectionState, selectedElements);
            }

            // 重置状态
            selectionState.isBoxSelecting = false;
            selectionState.startPoint = null;
        },

        /**
         * 处理元素点击事件
         * @param {Object} selectionState - 选择状态对象
         * @param {Konva.Event} e - 事件对象
         */
        handleElementClick: function (selectionState, e) {
            var element = e.target;
            var evt = e.evt;

            // 检查是否是多选操作
            var isMultiselect = false;
            if (selectionState.config.shiftMultiselect && evt.shiftKey) {
                isMultiselect = true;
            } else if (selectionState.config.ctrlMultiselect && (evt.ctrlKey || evt.metaKey)) {
                isMultiselect = true;
            }

            if (isMultiselect) {
                // 多选模式
                this.toggleElementSelection(selectionState, element);
            } else {
                // 单选模式
                this.setSelectedElement(selectionState, element);
            }
        },

        /**
         * 设置单个选中元素
         * @param {Object} selectionState - 选择状态对象
         * @param {Konva.Node} element - 要选中的元素
         */
        setSelectedElement: function (selectionState, element) {
            // 清除之前的选择
            this.clearSelection(selectionState);
            
            // 添加当前元素到选择列表
            selectionState.selectedElements.push(element);
            
            // 更新元素状态
            this.updateElementSelectionState(element, true);
            
            // 触发选择事件
            this.triggerSelectionEvent(selectionState, 'select', element);
        },

        /**
         * 设置多个选中元素
         * @param {Object} selectionState - 选择状态对象
         * @param {Array} elements - 要选中的元素数组
         */
        setSelectedElements: function (selectionState, elements) {
            // 清除之前的选择
            this.clearSelection(selectionState);
            
            // 添加元素到选择列表
            selectionState.selectedElements = elements;
            
            // 更新元素状态
            elements.forEach(function (element) {
                this.updateElementSelectionState(element, true);
            }, this);
            
            // 触发选择事件
            this.triggerSelectionEvent(selectionState, 'select', elements);
        },

        /**
         * 切换元素选择状态
         * @param {Object} selectionState - 选择状态对象
         * @param {Konva.Node} element - 要切换选择状态的元素
         */
        toggleElementSelection: function (selectionState, element) {
            var index = selectionState.selectedElements.indexOf(element);
            
            if (index > -1) {
                // 取消选择
                selectionState.selectedElements.splice(index, 1);
                this.updateElementSelectionState(element, false);
                this.triggerSelectionEvent(selectionState, 'deselect', element);
            } else {
                // 选择元素
                selectionState.selectedElements.push(element);
                this.updateElementSelectionState(element, true);
                this.triggerSelectionEvent(selectionState, 'select', element);
            }
        },

        /**
         * 清除选择
         * @param {Object} selectionState - 选择状态对象
         */
        clearSelection: function (selectionState) {
            // 更新元素状态
            selectionState.selectedElements.forEach(function (element) {
                this.updateElementSelectionState(element, false);
            }, this);
            
            // 触发取消选择事件
            if (selectionState.selectedElements.length > 0) {
                this.triggerSelectionEvent(selectionState, 'deselectAll', selectionState.selectedElements);
            }
            
            // 清空选择列表
            selectionState.selectedElements = [];
        },

        /**
         * 更新元素选择状态
         * @param {Konva.Node} element - 要更新状态的元素
         * @param {boolean} isSelected - 是否被选中
         */
        updateElementSelectionState: function (element, isSelected) {
            if (!element || !(element instanceof Konva.Node)) {
                return;
            }

            // 添加/移除选中样式
            if (isSelected) {
                element.setAttr('selected', true);
                // 可以在这里添加选中样式，如边框、阴影等
                // element.setAttr('stroke', '#0099ff');
                // element.setAttr('strokeWidth', 2);
            } else {
                element.setAttr('selected', false);
                // 移除选中样式
                // element.setAttr('stroke', null);
                // element.setAttr('strokeWidth', 0);
            }

            // 更新元素
            element.getLayer().draw();
        },

        /**
         * 触发选择事件
         * @param {Object} selectionState - 选择状态对象
         * @param {string} eventName - 事件名称
         * @param {*} data - 事件数据
         */
        triggerSelectionEvent: function (selectionState, eventName, data) {
            // 触发自定义事件
            var stage = selectionState.stageInstance.stage;
            stage.fire('selection:' + eventName, {
                selectionState: selectionState,
                data: data
            });
        },

        /**
         * 检查两个矩形是否相交
         * @param {Object} rect1 - 第一个矩形 {x, y, width, height}
         * @param {Object} rect2 - 第二个矩形 {x, y, width, height}
         * @returns {boolean} 是否相交
         */
        isRectIntersect: function (rect1, rect2) {
            return !(
                rect1.x > rect2.x + rect2.width ||
                rect1.x + rect1.width < rect2.x ||
                rect1.y > rect2.y + rect2.height ||
                rect1.y + rect1.height < rect2.y
            );
        },

        /**
         * 获取选中的元素
         * @param {Object} selectionState - 选择状态对象
         * @returns {Array} 选中的元素数组
         */
        getSelectedElements: function (selectionState) {
            return selectionState.selectedElements;
        },

        /**
         * 获取选中的第一个元素
         * @param {Object} selectionState - 选择状态对象
         * @returns {Konva.Node|null} 选中的第一个元素或 null
         */
        getFirstSelectedElement: function (selectionState) {
            return selectionState.selectedElements[0] || null;
        },

        /**
         * 检查元素是否被选中
         * @param {Object} selectionState - 选择状态对象
         * @param {Konva.Node} element - 要检查的元素
         * @returns {boolean} 是否被选中
         */
        isElementSelected: function (selectionState, element) {
            return selectionState.selectedElements.indexOf(element) > -1;
        },

        /**
         * 获取选中元素的数量
         * @param {Object} selectionState - 选择状态对象
         * @returns {number} 选中元素的数量
         */
        getSelectedCount: function (selectionState) {
            return selectionState.selectedElements.length;
        },

        /**
         * 销毁选择管理器
         * @param {Object} selectionState - 选择状态对象
         */
        destroySelectionManager: function (selectionState) {
            // 清除选择
            this.clearSelection(selectionState);
            
            // 移除选择框
            if (selectionState.selectionBox) {
                selectionState.selectionBox.destroy();
                selectionState.selectionBox = null;
            }
            
            // 这里可以添加事件清除逻辑
        }
    };

    // 导出模块
    window.MeeWoo.Core.KonvaSelection = KonvaSelection;
})(window);