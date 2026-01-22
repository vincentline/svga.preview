/**
 * ==================== Konva 导出功能模块 (Konva Export Manager) ====================
 * 
 * 模块索引：
 * 1. 【导出格式】 - 支持多种导出格式
 * 2. 【导出配置】 - 导出选项和参数配置
 * 3. 【导出方法】 - 不同格式的导出实现
 * 4. 【下载功能】 - 导出文件下载功能
 * 5. 【导出事件】 - 导出相关事件处理
 * 
 * 功能说明：
 * 负责 Konva 画布内容的导出功能，支持多种导出格式和配置选项，包括：
 * 1. 支持多种导出格式：PNG、JPG、SVG 等
 * 2. 灵活的导出配置：质量、缩放、区域选择等
 * 3. 支持导出整个舞台或特定图层
 * 4. 提供文件下载功能
 * 5. 导出事件分发
 * 
 * 命名空间：MeeWoo.Core.KonvaExport
 */

(function (window) {
    'use strict';

    // 确保命名空间存在
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Core = window.MeeWoo.Core || {};

    /**
     * Konva 导出功能模块
     */
    var KonvaExport = {
        // 导出格式
        exportFormats: {
            PNG: 'png',
            JPG: 'jpg',
            JPEG: 'jpeg',
            SVG: 'svg',
            CANVAS: 'canvas'
        },

        /**
         * 初始化导出管理器
         * @param {Object} stageInstance - 舞台实例对象
         * @param {Object} options - 导出管理器配置选项
         * @returns {Object} 导出管理器实例
         */
        initExportManager: function (stageInstance, options) {
            // 默认配置
            var defaultOptions = {
                defaultFormat: this.exportFormats.PNG,
                defaultQuality: 1.0,
                defaultScale: 1.0
            };

            // 合并配置
            var config = Object.assign({}, defaultOptions, options);

            // 导出状态
            var exportState = {
                stageInstance: stageInstance,
                config: config
            };

            return exportState;
        },

        /**
         * 导出舞台内容
         * @param {Object} exportState - 导出状态对象
         * @param {Object} options - 导出选项
         * @returns {Promise<*>} 导出结果 Promise
         */
        exportStage: function (exportState, options) {
            // 默认导出选项
            var defaultExportOptions = {
                format: exportState.config.defaultFormat,
                quality: exportState.config.defaultQuality,
                scale: exportState.config.defaultScale,
                layers: null, // null 表示导出所有图层
                area: null, // null 表示导出整个舞台区域
                download: false,
                filename: 'export'
            };

            // 合并选项
            var exportOptions = Object.assign({}, defaultExportOptions, options);

            // 根据格式选择导出方法
            var exportMethod;
            switch (exportOptions.format.toLowerCase()) {
                case this.exportFormats.PNG:
                    exportMethod = this.exportToPNG;
                    break;
                case this.exportFormats.JPG:
                case this.exportFormats.JPEG:
                    exportMethod = this.exportToJPG;
                    break;
                case this.exportFormats.SVG:
                    exportMethod = this.exportToSVG;
                    break;
                case this.exportFormats.CANVAS:
                    exportMethod = this.exportToCanvas;
                    break;
                default:
                    return Promise.reject(new Error('Unsupported export format: ' + exportOptions.format));
            }

            // 触发导出开始事件
            this.triggerExportEvent(exportState, 'start', exportOptions);

            // 执行导出
            return exportMethod.call(this, exportState, exportOptions)
                .then(function (result) {
                    // 触发导出成功事件
                    this.triggerExportEvent(exportState, 'success', exportOptions, result);
                    
                    // 如果需要自动下载
                    if (exportOptions.download) {
                        this.downloadExport(result, exportOptions);
                    }
                    
                    return result;
                }.bind(this))
                .catch(function (error) {
                    // 触发导出失败事件
                    this.triggerExportEvent(exportState, 'error', exportOptions, error);
                    throw error;
                }.bind(this));
        },

        /**
         * 导出为 PNG 格式
         * @param {Object} exportState - 导出状态对象
         * @param {Object} options - 导出选项
         * @returns {Promise<string>} PNG 数据 URL
         */
        exportToPNG: function (exportState, options) {
            return new Promise(function (resolve, reject) {
                try {
                    var stage = exportState.stageInstance.stage;
                    var dataURL;

                    // 根据选项导出特定图层或整个舞台
                    if (options.layers) {
                        // 导出特定图层
                        if (!Array.isArray(options.layers)) {
                            options.layers = [options.layers];
                        }

                        // 创建临时舞台
                        var tempStage = new Konva.Stage({
                            width: stage.width(),
                            height: stage.height()
                        });

                        // 添加指定图层到临时舞台
                        options.layers.forEach(function (layerName) {
                            var layer = exportState.stageInstance.layers[layerName];
                            if (layer) {
                                tempStage.add(layer.clone());
                            }
                        });

                        // 导出临时舞台
                        dataURL = tempStage.toDataURL({
                            pixelRatio: options.scale,
                            mimeType: 'image/png',
                            quality: options.quality
                        });

                        // 销毁临时舞台
                        tempStage.destroy();
                    } else {
                        // 导出整个舞台
                        dataURL = stage.toDataURL({
                            pixelRatio: options.scale,
                            mimeType: 'image/png',
                            quality: options.quality,
                            x: options.area ? options.area.x : 0,
                            y: options.area ? options.area.y : 0,
                            width: options.area ? options.area.width : stage.width(),
                            height: options.area ? options.area.height : stage.height()
                        });
                    }

                    resolve(dataURL);
                } catch (error) {
                    reject(error);
                }
            });
        },

        /**
         * 导出为 JPG/JPEG 格式
         * @param {Object} exportState - 导出状态对象
         * @param {Object} options - 导出选项
         * @returns {Promise<string>} JPG 数据 URL
         */
        exportToJPG: function (exportState, options) {
            return new Promise(function (resolve, reject) {
                try {
                    var stage = exportState.stageInstance.stage;
                    var dataURL;

                    // 根据选项导出特定图层或整个舞台
                    if (options.layers) {
                        // 导出特定图层
                        if (!Array.isArray(options.layers)) {
                            options.layers = [options.layers];
                        }

                        // 创建临时舞台
                        var tempStage = new Konva.Stage({
                            width: stage.width(),
                            height: stage.height()
                        });

                        // 添加指定图层到临时舞台
                        options.layers.forEach(function (layerName) {
                            var layer = exportState.stageInstance.layers[layerName];
                            if (layer) {
                                tempStage.add(layer.clone());
                            }
                        });

                        // 导出临时舞台
                        dataURL = tempStage.toDataURL({
                            pixelRatio: options.scale,
                            mimeType: 'image/jpeg',
                            quality: options.quality
                        });

                        // 销毁临时舞台
                        tempStage.destroy();
                    } else {
                        // 导出整个舞台
                        dataURL = stage.toDataURL({
                            pixelRatio: options.scale,
                            mimeType: 'image/jpeg',
                            quality: options.quality,
                            x: options.area ? options.area.x : 0,
                            y: options.area ? options.area.y : 0,
                            width: options.area ? options.area.width : stage.width(),
                            height: options.area ? options.area.height : stage.height()
                        });
                    }

                    resolve(dataURL);
                } catch (error) {
                    reject(error);
                }
            });
        },

        /**
         * 导出为 SVG 格式
         * @param {Object} exportState - 导出状态对象
         * @param {Object} options - 导出选项
         * @returns {Promise<string>} SVG 字符串
         */
        exportToSVG: function (exportState, options) {
            return new Promise(function (resolve, reject) {
                try {
                    var stage = exportState.stageInstance.stage;
                    var svgString;

                    // 导出整个舞台为 SVG
                    svgString = stage.toSVG({
                        x: options.area ? options.area.x : 0,
                        y: options.area ? options.area.y : 0,
                        width: options.area ? options.area.width : stage.width(),
                        height: options.area ? options.area.height : stage.height()
                    });

                    resolve(svgString);
                } catch (error) {
                    reject(error);
                }
            });
        },

        /**
         * 导出为 Canvas 对象
         * @param {Object} exportState - 导出状态对象
         * @param {Object} options - 导出选项
         * @returns {Promise<HTMLCanvasElement>} Canvas 对象
         */
        exportToCanvas: function (exportState, options) {
            return new Promise(function (resolve, reject) {
                try {
                    var stage = exportState.stageInstance.stage;
                    var canvas;

                    // 根据选项导出特定图层或整个舞台
                    if (options.layers) {
                        // 导出特定图层
                        if (!Array.isArray(options.layers)) {
                            options.layers = [options.layers];
                        }

                        // 创建临时舞台
                        var tempStage = new Konva.Stage({
                            width: stage.width(),
                            height: stage.height()
                        });

                        // 添加指定图层到临时舞台
                        options.layers.forEach(function (layerName) {
                            var layer = exportState.stageInstance.layers[layerName];
                            if (layer) {
                                tempStage.add(layer.clone());
                            }
                        });

                        // 导出到 Canvas
                        canvas = tempStage.toCanvas({
                            pixelRatio: options.scale
                        });

                        // 销毁临时舞台
                        tempStage.destroy();
                    } else {
                        // 导出整个舞台到 Canvas
                        canvas = stage.toCanvas({
                            pixelRatio: options.scale,
                            x: options.area ? options.area.x : 0,
                            y: options.area ? options.area.y : 0,
                            width: options.area ? options.area.width : stage.width(),
                            height: options.area ? options.area.height : stage.height()
                        });
                    }

                    resolve(canvas);
                } catch (error) {
                    reject(error);
                }
            });
        },

        /**
         * 下载导出文件
         * @param {string|HTMLCanvasElement} data - 导出数据（DataURL 或 Canvas 对象）
         * @param {Object} options - 导出选项
         */
        downloadExport: function (data, options) {
            var filename = options.filename || 'export';
            var format = options.format || this.exportFormats.PNG;
            var dataURL = data;

            // 如果是 Canvas 对象，转换为 DataURL
            if (data instanceof HTMLCanvasElement) {
                var mimeType = this.getMimeType(format);
                dataURL = data.toDataURL(mimeType, options.quality);
            }

            // 创建下载链接
            var link = document.createElement('a');
            link.download = filename + '.' + format;
            link.href = dataURL;
            link.style.display = 'none';

            // 添加到文档并触发下载
            document.body.appendChild(link);
            link.click();

            // 清理
            setTimeout(function () {
                document.body.removeChild(link);
            }, 100);
        },

        /**
         * 获取文件 MIME 类型
         * @param {string} format - 文件格式
         * @returns {string} MIME 类型
         */
        getMimeType: function (format) {
            switch (format.toLowerCase()) {
                case this.exportFormats.PNG:
                    return 'image/png';
                case this.exportFormats.JPG:
                case this.exportFormats.JPEG:
                    return 'image/jpeg';
                case this.exportFormats.SVG:
                    return 'image/svg+xml';
                default:
                    return 'image/png';
            }
        },

        /**
         * 触发导出事件
         * @param {Object} exportState - 导出状态对象
         * @param {string} eventName - 事件名称
         * @param {Object} exportOptions - 导出选项
         * @param {*} data - 事件数据
         */
        triggerExportEvent: function (exportState, eventName, exportOptions, data) {
            var stage = exportState.stageInstance.stage;
            
            // 触发自定义事件
            stage.fire('export:' + eventName, {
                exportState: exportState,
                exportOptions: exportOptions,
                data: data
            });
        },

        /**
         * 批量导出多个图层
         * @param {Object} exportState - 导出状态对象
         * @param {Array} exportTasks - 导出任务数组
         * @returns {Promise<Array>} 批量导出结果 Promise
         */
        batchExport: function (exportState, exportTasks) {
            if (!Array.isArray(exportTasks)) {
                return Promise.reject(new Error('exportTasks must be an array'));
            }

            // 批量执行导出任务
            var exportPromises = exportTasks.map(function (task) {
                return this.exportStage(exportState, task);
            }, this);

            return Promise.all(exportPromises);
        },

        /**
         * 获取导出配置
         * @param {Object} exportState - 导出状态对象
         * @returns {Object} 导出配置
         */
        getExportConfig: function (exportState) {
            return exportState.config;
        },

        /**
         * 更新导出配置
         * @param {Object} exportState - 导出状态对象
         * @param {Object} config - 要更新的配置
         */
        updateExportConfig: function (exportState, config) {
            Object.assign(exportState.config, config);
        }
    };

    // 导出模块
    window.MeeWoo.Core.KonvaExport = KonvaExport;
})(window);