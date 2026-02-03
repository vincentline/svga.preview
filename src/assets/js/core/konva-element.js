/**
 * ==================== Konva 素材元素管理模块 (Konva Element Manager) ====================
 * 
 * 模块索引：
 * 1. 【元素工厂】 - 创建不同类型的 Konva 元素
 * 2. 【属性管理】 - 管理元素属性和样式
 * 3. 【事件处理】 - 元素事件监听和处理
 * 4. 【生命周期】 - 元素的添加、更新、删除
 * 
 * 功能说明：
 * 负责 Konva 素材元素的创建、管理和维护，提供元素相关的核心功能，包括：
 * 1. 支持多种元素类型：图片、文本、形状等
 * 2. 元素属性管理和样式设置
 * 3. 元素事件监听和处理
 * 4. 元素生命周期管理
 * 5. 元素数据与 Konva 对象的映射
 * 
 * 命名空间：MeeWoo.Core.KonvaElement
 */

(function (window) {
    'use strict';

    // 确保命名空间存在
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Core = window.MeeWoo.Core || {};

    /**
     * Konva 素材元素管理模块
     */
    var KonvaElement = {
        // 元素类型映射
        elementTypes: {
            IMAGE: 'image',
            TEXT: 'text',
            RECT: 'rect',
            CIRCLE: 'circle',
            ELLIPSE: 'ellipse',
            LINE: 'line',
            SVG: 'svg'
        },

        /**
         * 元素工厂：创建指定类型的 Konva 元素
         * @param {string} type - 元素类型
         * @param {Object} config - 元素配置
         * @returns {Konva.Node|null} Konva 元素实例或 null
         */
        createElement: function (type, config) {
            // 确保 Konva 库已加载
            if (typeof Konva === 'undefined') {
                throw new Error('Konva library not loaded');
            }

            var element;
            var defaultConfig = {
                id: this.generateElementId(),
                draggable: true,
                name: 'element-' + type
            };

            // 合并配置
            var elementConfig = Object.assign({}, defaultConfig, config);

            // 根据类型创建元素
            switch (type) {
                case this.elementTypes.IMAGE:
                    element = this.createElementImage(elementConfig);
                    break;
                case this.elementTypes.TEXT:
                    element = this.createElementText(elementConfig);
                    break;
                case this.elementTypes.RECT:
                    element = this.createElementRect(elementConfig);
                    break;
                case this.elementTypes.CIRCLE:
                    element = this.createElementCircle(elementConfig);
                    break;
                case this.elementTypes.ELLIPSE:
                    element = this.createElementEllipse(elementConfig);
                    break;
                case this.elementTypes.LINE:
                    element = this.createElementLine(elementConfig);
                    break;
                case this.elementTypes.SVG:
                    element = this.createElementSvg(elementConfig);
                    break;
                default:
                    console.error('Unsupported element type:', type);
                    return null;
            }

            // 设置元素数据
            if (element) {
                element.setAttr('elementType', type);
                element.setAttr('elementData', elementConfig);
            }

            return element;
        },

        /**
         * 创建图片元素
         * @param {Object} config - 图片配置
         * @returns {Konva.Image} 图片元素实例
         */
        createElementImage: function (config) {
            var defaultImageConfig = {
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                image: null,
                scaleX: 1,
                scaleY: 1,
                opacity: 1
            };

            var imageConfig = Object.assign({}, defaultImageConfig, config);
            return new Konva.Image(imageConfig);
        },

        /**
         * 创建文本元素
         * @param {Object} config - 文本配置
         * @returns {Konva.Text} 文本元素实例
         */
        createElementText: function (config) {
            var defaultTextConfig = {
                x: 0,
                y: 0,
                text: '文本内容',
                fontSize: 24,
                fontFamily: 'Arial',
                fill: '#000000',
                align: 'center',
                verticalAlign: 'middle'
            };

            var textConfig = Object.assign({}, defaultTextConfig, config);
            return new Konva.Text(textConfig);
        },

        /**
         * 创建矩形元素
         * @param {Object} config - 矩形配置
         * @returns {Konva.Rect} 矩形元素实例
         */
        createElementRect: function (config) {
            var defaultRectConfig = {
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                fill: '#ffffff',
                stroke: '#000000',
                strokeWidth: 1,
                cornerRadius: 0
            };

            var rectConfig = Object.assign({}, defaultRectConfig, config);
            return new Konva.Rect(rectConfig);
        },

        /**
         * 创建圆形元素
         * @param {Object} config - 圆形配置
         * @returns {Konva.Circle} 圆形元素实例
         */
        createElementCircle: function (config) {
            var defaultCircleConfig = {
                x: 0,
                y: 0,
                radius: 50,
                fill: '#ffffff',
                stroke: '#000000',
                strokeWidth: 1
            };

            var circleConfig = Object.assign({}, defaultCircleConfig, config);
            return new Konva.Circle(circleConfig);
        },

        /**
         * 创建椭圆元素
         * @param {Object} config - 椭圆配置
         * @returns {Konva.Ellipse} 椭圆元素实例
         */
        createElementEllipse: function (config) {
            var defaultEllipseConfig = {
                x: 0,
                y: 0,
                radiusX: 50,
                radiusY: 30,
                fill: '#ffffff',
                stroke: '#000000',
                strokeWidth: 1
            };

            var ellipseConfig = Object.assign({}, defaultEllipseConfig, config);
            return new Konva.Ellipse(ellipseConfig);
        },

        /**
         * 创建线条元素
         * @param {Object} config - 线条配置
         * @returns {Konva.Line} 线条元素实例
         */
        createElementLine: function (config) {
            var defaultLineConfig = {
                points: [0, 0, 100, 100],
                stroke: '#000000',
                strokeWidth: 2,
                tension: 0,
                lineCap: 'butt',
                lineJoin: 'miter'
            };

            var lineConfig = Object.assign({}, defaultLineConfig, config);
            return new Konva.Line(lineConfig);
        },

        /**
         * 创建 SVG 元素
         * @param {Object} config - SVG 配置
         * @returns {Konva.Shape} SVG 元素实例
         */
        createElementSvg: function (config) {
            var defaultSvgConfig = {
                x: 0,
                y: 0,
                width: 100,
                height: 100
            };

            var svgConfig = Object.assign({}, defaultSvgConfig, config);
            
            // SVG 元素需要使用 Konva.Shape 绘制
            return new Konva.Shape({
                x: svgConfig.x,
                y: svgConfig.y,
                width: svgConfig.width,
                height: svgConfig.height,
                drawFunc: function (ctx) {
                    // 这里需要实现 SVG 绘制逻辑
                    // 可以使用 DOMParser 解析 SVG 字符串，然后绘制到 Canvas
                    ctx.fillStyle = '#cccccc';
                    ctx.fillRect(0, 0, svgConfig.width, svgConfig.height);
                }
            });
        },

        /**
         * 生成唯一元素 ID
         * @returns {string} 唯一 ID
         */
        generateElementId: function () {
            return 'element-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        },

        /**
         * 更新元素属性
         * @param {Konva.Node} element - Konva 元素实例
         * @param {Object} properties - 要更新的属性
         */
        updateElementProperties: function (element, properties) {
            if (!element || !(element instanceof Konva.Node)) {
                return;
            }

            // 更新元素属性
            element.setAttrs(properties);

            // 更新元素数据
            var elementData = element.getAttr('elementData') || {};
            element.setAttr('elementData', Object.assign({}, elementData, properties));
        },

        /**
         * 获取元素属性
         * @param {Konva.Node} element - Konva 元素实例
         * @param {string|null} property - 要获取的属性名，null 表示获取所有属性
         * @returns {*} 属性值或属性对象
         */
        getElementProperties: function (element, property) {
            if (!element || !(element instanceof Konva.Node)) {
                return null;
            }

            if (property) {
                return element.getAttr(property);
            }

            // 获取所有属性
            return element.getAttrs();
        },

        /**
         * 添加元素到图层
         * @param {Konva.Node} element - Konva 元素实例
         * @param {Konva.Layer} layer - Konva 图层实例
         */
        addElementToLayer: function (element, layer) {
            if (!element || !(element instanceof Konva.Node) || 
                !layer || !(layer instanceof Konva.Layer)) {
                return;
            }

            layer.add(element);
        },

        /**
         * 从图层中移除元素
         * @param {Konva.Node} element - Konva 元素实例
         */
        removeElementFromLayer: function (element) {
            if (!element || !(element instanceof Konva.Node)) {
                return;
            }

            element.remove();
        },

        /**
         * 销毁元素
         * @param {Konva.Node} element - Konva 元素实例
         */
        destroyElement: function (element) {
            if (!element || !(element instanceof Konva.Node)) {
                return;
            }

            // 移除事件监听器
            this.removeElementEventListeners(element);
            
            // 从图层中移除
            element.remove();
            
            // 销毁元素
            element.destroy();
        },

        /**
         * 添加元素事件监听器
         * @param {Konva.Node} element - Konva 元素实例
         * @param {string} eventName - 事件名称
         * @param {Function} callback - 事件回调函数
         */
        addElementEventListener: function (element, eventName, callback) {
            if (!element || !(element instanceof Konva.Node) || 
                typeof eventName !== 'string' || typeof callback !== 'function') {
                return;
            }

            element.on(eventName, callback);

            // 存储事件监听器引用，便于后续清理
            var eventListeners = element.getAttr('eventListeners') || {};
            if (!eventListeners[eventName]) {
                eventListeners[eventName] = [];
            }
            eventListeners[eventName].push(callback);
            element.setAttr('eventListeners', eventListeners);
        },

        /**
         * 移除元素事件监听器
         * @param {Konva.Node} element - Konva 元素实例
         * @param {string|null} eventName - 事件名称，null 表示移除所有事件监听器
         */
        removeElementEventListeners: function (element, eventName) {
            if (!element || !(element instanceof Konva.Node)) {
                return;
            }

            var eventListeners = element.getAttr('eventListeners') || {};

            if (eventName) {
                // 移除指定事件的所有监听器
                element.off(eventName);
                delete eventListeners[eventName];
            } else {
                // 移除所有事件监听器
                for (var name in eventListeners) {
                    if (eventListeners.hasOwnProperty(name)) {
                        element.off(name);
                    }
                }
                eventListeners = {};
            }

            element.setAttr('eventListeners', eventListeners);
        },

        /**
         * 设置元素层级
         * @param {Konva.Node} element - Konva 元素实例
         * @param {string} action - 层级操作：'top' | 'bottom' | 'up' | 'down'
         */
        setElementZIndex: function (element, action) {
            if (!element || !(element instanceof Konva.Node)) {
                return;
            }

            switch (action) {
                case 'top':
                    element.moveToTop();
                    break;
                case 'bottom':
                    element.moveToBottom();
                    break;
                case 'up':
                    element.moveUp();
                    break;
                case 'down':
                    element.moveDown();
                    break;
                default:
                    console.error('Unsupported z-index action:', action);
            }
        },

        /**
         * 克隆元素
         * @param {Konva.Node} element - Konva 元素实例
         * @returns {Konva.Node} 克隆的元素实例
         */
        cloneElement: function (element) {
            if (!element || !(element instanceof Konva.Node)) {
                return null;
            }

            var clone = element.clone();
            
            // 重新生成 ID
            clone.setAttr('id', this.generateElementId());
            
            // 清空事件监听器引用
            clone.setAttr('eventListeners', {});
            
            return clone;
        },

        /**
         * 获取元素数据
         * @param {Konva.Node} element - Konva 元素实例
         * @returns {Object} 元素数据
         */
        getElementData: function (element) {
            if (!element || !(element instanceof Konva.Node)) {
                return null;
            }

            return {
                id: element.getAttr('id'),
                type: element.getAttr('elementType'),
                properties: element.getAttrs(),
                data: element.getAttr('elementData') || {}
            };
        },

        /**
         * 从数据创建元素
         * @param {Object} elementData - 元素数据
         * @returns {Konva.Node|null} Konva 元素实例或 null
         */
        createElementFromData: function (elementData) {
            if (!elementData || !elementData.type) {
                return null;
            }

            return this.createElement(elementData.type, elementData.properties || {});
        }
    };

    // 导出模块
    window.MeeWoo.Core.KonvaElement = KonvaElement;
})(window);