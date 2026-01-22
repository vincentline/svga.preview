/**
 * ==================== Konva 舞台管理模块 (Konva Stage Manager) ====================
 * 
 * 模块索引：
 * 1. 【核心功能】 - 舞台初始化、图层管理、尺寸调整
 * 2. 【事件处理】 - 舞台事件监听和分发
 * 3. 【状态管理】 - 舞台状态和配置管理
 * 
 * 功能说明：
 * 负责 Konva 舞台和图层的创建、管理和维护，提供舞台相关的核心功能，包括：
 * 1. 舞台初始化和配置
 * 2. 多层级图层管理
 * 3. 舞台尺寸调整和响应式处理
 * 4. 舞台事件监听和分发
 * 5. 舞台状态管理
 * 
 * 命名空间：MeeWoo.Core.KonvaStage
 */

(function (window) {
    'use strict';

    // 确保命名空间存在
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Core = window.MeeWoo.Core || {};

    /**
     * Konva 舞台管理模块
     */
    var KonvaStage = {
        /**
         * 初始化 Konva 舞台
         * @param {string|HTMLElement} container - 容器元素或容器ID
         * @param {Object} options - 舞台配置选项
         * @returns {Object} 舞台实例对象
         */
        initStage: function (container, options) {
            // 确保 Konva 库已加载
            if (typeof Konva === 'undefined') {
                throw new Error('Konva library not loaded');
            }

            // 默认配置
            var defaultOptions = {
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: null
            };

            // 合并配置
            var config = Object.assign({}, defaultOptions, options);

            // 创建舞台
            var stage = new Konva.Stage({
                container: container,
                width: config.width,
                height: config.height
            });

            // 创建默认图层
            var layers = this.createDefaultLayers(stage);

            // 存储舞台状态
            var stageInstance = {
                stage: stage,
                layers: layers,
                config: config,
                isInitialized: true
            };

            // 初始化舞台事件
            this.initStageEvents(stageInstance);

            return stageInstance;
        },

        /**
         * 创建默认图层
         * @param {Konva.Stage} stage - 舞台实例
         * @returns {Object} 图层集合
         */
        createDefaultLayers: function (stage) {
            // 背景层 - 用于显示底图、网格等固定元素
            var backgroundLayer = new Konva.Layer({
                name: 'backgroundLayer'
            });

            // 编辑层 - 用于放置可编辑的素材元素
            var editLayer = new Konva.Layer({
                name: 'editLayer'
            });

            // 辅助层 - 用于显示选择框、控制点、辅助线等临时元素
            var helperLayer = new Konva.Layer({
                name: 'helperLayer'
            });

            // UI层 - 用于显示工具栏、属性面板等UI组件
            var uiLayer = new Konva.Layer({
                name: 'uiLayer'
            });

            // 添加到舞台
            stage.add(backgroundLayer, editLayer, helperLayer, uiLayer);

            return {
                backgroundLayer: backgroundLayer,
                editLayer: editLayer,
                helperLayer: helperLayer,
                uiLayer: uiLayer
            };
        },

        /**
         * 初始化舞台事件
         * @param {Object} stageInstance - 舞台实例对象
         */
        initStageEvents: function (stageInstance) {
            var stage = stageInstance.stage;

            // 存储事件监听器引用，便于后续清理
            stageInstance.eventListeners = {
                resize: this.handleStageResize.bind(this, stageInstance)
            };

            // 添加窗口大小变化事件监听
            window.addEventListener('resize', stageInstance.eventListeners.resize);
        },

        /**
         * 处理舞台尺寸调整
         * @param {Object} stageInstance - 舞台实例对象
         */
        handleStageResize: function (stageInstance) {
            var stage = stageInstance.stage;
            var container = stage.container();
            
            // 根据容器尺寸调整舞台大小
            if (container) {
                var rect = container.getBoundingClientRect();
                stage.width(rect.width);
                stage.height(rect.height);
            }
        },

        /**
         * 更新舞台尺寸
         * @param {Object} stageInstance - 舞台实例对象
         * @param {number} width - 新宽度
         * @param {number} height - 新高度
         */
        updateStageSize: function (stageInstance, width, height) {
            var stage = stageInstance.stage;
            stage.width(width);
            stage.height(height);
        },

        /**
         * 获取指定图层
         * @param {Object} stageInstance - 舞台实例对象
         * @param {string} layerName - 图层名称
         * @returns {Konva.Layer|null} 图层实例或null
         */
        getLayer: function (stageInstance, layerName) {
            return stageInstance.layers[layerName] || null;
        },

        /**
         * 重绘指定图层
         * @param {Object} stageInstance - 舞台实例对象
         * @param {string|Array} layerNames - 图层名称或名称数组
         */
        redrawLayers: function (stageInstance, layerNames) {
            if (typeof layerNames === 'string') {
                layerNames = [layerNames];
            }

            layerNames.forEach(function (layerName) {
                var layer = stageInstance.layers[layerName];
                if (layer) {
                    layer.draw();
                }
            });
        },

        /**
         * 重绘所有图层
         * @param {Object} stageInstance - 舞台实例对象
         */
        redrawAll: function (stageInstance) {
            var stage = stageInstance.stage;
            stage.draw();
        },

        /**
         * 销毁舞台实例
         * @param {Object} stageInstance - 舞台实例对象
         */
        destroyStage: function (stageInstance) {
            // 清理事件监听器
            if (stageInstance.eventListeners) {
                if (stageInstance.eventListeners.resize) {
                    window.removeEventListener('resize', stageInstance.eventListeners.resize);
                }
            }

            // 销毁舞台
            if (stageInstance.stage) {
                stageInstance.stage.destroy();
            }

            // 清空引用
            stageInstance.isInitialized = false;
            stageInstance.stage = null;
            stageInstance.layers = null;
        }
    };

    // 导出模块
    window.MeeWoo.Core.KonvaStage = KonvaStage;
})(window);