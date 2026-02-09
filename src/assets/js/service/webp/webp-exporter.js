/**
 * WebP导出器模块
 * 封装WebP编码、帧捕获、进度管理、下载等核心逻辑
 * 
 * 使用方式：
 * WebPExporter.export({
 *   width: 300,
 *   height: 300,
 *   fps: 30,
 *   getFrame: async (frameIndex) => canvas,  // 返回当前帧的canvas
 *   onProgress: (progress, stage, message) => {},
 *   onError: (error) => {},
 *   shouldCancel: () => false  // 返回true时取消导出
 * });
 */
(function(global) {
    'use strict';

    // Ensure namespace
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Exporters = window.MeeWoo.Exporters || {};

    const WebPExporter = {
        /**
         * 导出WebP
         * @param {Object} config 配置对象
         * @param {Number} config.width 宽度
         * @param {Number} config.height 高度
         * @param {Number} config.fps 帧率
         * @param {Function} config.getFrame 获取帧的回调函数
         * @param {Function} config.onProgress 进度回调
         * @param {Function} config.onError 错误回调
         * @param {Function} config.shouldCancel 取消检查回调
         * @returns {Promise} 导出结果
         */
        export: async function (config) {
            var _this = this;

            // 参数校验
            if (!config.getFrame) throw new Error('缺少 getFrame 回调');

            // 使用配置的尺寸和帧率
            var width = config.width || 300;
            var height = config.height || 300;
            var fps = config.fps || 30;

            // 回调函数
            var onProgress = config.onProgress || function () { };
            var onError = config.onError || function () { };
            var shouldCancel = config.shouldCancel || function () { return false; };

            try {
                onProgress(0, 'capturing', '捕获帧数据...');

                // 创建输出canvas
                var outputCanvas = document.createElement('canvas');
                outputCanvas.width = width;
                outputCanvas.height = height;
                var outputCtx = outputCanvas.getContext('2d', {
                    willReadFrequently: true,
                    alpha: true
                });

                // 获取当前帧（而不是固定获取第0帧）
                var currentFrame = null;
                var maxAttempts = 3;
                var attempt = 0;
                
                while (!currentFrame && attempt < maxAttempts) {
                    attempt++;
                    try {
                        // 不使用固定的0，而是使用一个合理的帧索引
                        // 对于动画，我们可以尝试获取当前播放的帧
                        currentFrame = await config.getFrame(0);
                        if (!currentFrame) {
                            console.warn('[WebP导出] 第' + attempt + '次尝试获取帧数据失败，重试...');
                            // 等待一段时间后重试
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    } catch (error) {
                        console.warn('[WebP导出] 第' + attempt + '次尝试获取帧数据出错:', error);
                        // 等待一段时间后重试
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
                
                if (!currentFrame) {
                    throw new Error('无法获取帧数据');
                }
                
                // 验证画布尺寸
                if (currentFrame.width === 0 || currentFrame.height === 0) {
                    throw new Error('获取的帧画布尺寸无效');
                }
                
                console.log('[WebP导出] 获取到帧数据:', {
                    width: currentFrame.width,
                    height: currentFrame.height,
                    type: currentFrame.constructor.name
                });

                // 检查是否取消
                if (shouldCancel()) {
                    throw new Error('导出已取消');
                }

                onProgress(0.3, 'converting', '转换为WebP格式...');

                // 绘制当前帧
                outputCtx.clearRect(0, 0, width, height);
                outputCtx.drawImage(currentFrame, 0, 0, width, height);

                // 转换为WebP
                var webpDataUrl = outputCanvas.toDataURL('image/webp', 0.9);

                onProgress(0.8, 'downloading', '生成下载文件...');

                // 创建下载链接
                var link = document.createElement('a');
                link.href = webpDataUrl;
                link.download = 'export.webp';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                onProgress(1, 'completed', '导出完成');

                return webpDataUrl;

            } catch (error) {
                onError(error);
                throw error;
            }
        },

        /**
         * 捕获帧数据
         * @param {Object} config 配置对象
         * @param {Number} config.width 宽度
         * @param {Number} config.height 高度
         * @param {Number} config.fps 帧率
         * @param {Function} config.seekToFrame 跳转帧的方法
         * @param {Function} config.getCurrentFrameCanvas 获取当前帧画布的方法
         * @param {Function} config.onProgress 进度回调
         * @param {Function} config.shouldCancel 取消检查回调
         * @returns {Promise<Array>} 帧数据数组
         */
        captureFrames: async function (config) {
            var width = config.width || 300;
            var height = config.height || 300;
            var fps = config.fps || 30;
            var duration = config.duration || 1;
            var totalFrames = Math.ceil(duration * fps);
            var frames = [];

            var seekToFrame = config.seekToFrame;
            var getCurrentFrameCanvas = config.getCurrentFrameCanvas;
            var onProgress = config.onProgress || function () { };
            var shouldCancel = config.shouldCancel || function () { return false; };

            if (!seekToFrame || !getCurrentFrameCanvas) {
                throw new Error('缺少必要的帧操作方法');
            }

            for (var i = 0; i < totalFrames; i++) {
                // 检查是否取消
                if (shouldCancel()) {
                    throw new Error('导出已取消');
                }

                // 跳转到对应帧
                var frameIndex = Math.floor((i / fps) * fps);
                await seekToFrame(frameIndex, fps);

                // 获取当前帧的画布
                var canvas = getCurrentFrameCanvas();
                if (!canvas) {
                    throw new Error('无法获取帧画布');
                }

                // 创建新的canvas并调整尺寸
                var resizedCanvas = document.createElement('canvas');
                resizedCanvas.width = width;
                resizedCanvas.height = height;
                var ctx = resizedCanvas.getContext('2d');

                // 绘制并调整尺寸
                ctx.drawImage(canvas, 0, 0, width, height);

                // 转换为Image对象
                var img = new Image();
                img.src = resizedCanvas.toDataURL('image/png');

                // 等待图片加载完成
                await new Promise(function (resolve) {
                    img.onload = resolve;
                });

                frames.push(img);

                // 更新进度
                onProgress(0.3 * (i / totalFrames), 'capturing', '捕获帧数据...');
            }

            return frames;
        }
    };

    // Export
    window.MeeWoo.Exporters.WebPExporter = WebPExporter;

})(window);
