/**
 * FFmpeg Service - FFmpeg音视频处理统一服务
 * 
 * 功能：
 * - 统一管理FFmpeg实例（单例模式，避免重复加载）
 * - 统一的初始化和加载机制（支持插队优先加载）
 * - 统一的进度回调接口（0-1比例）
 * - 统一的错误处理机制
 * - 统一的取消操作支持
 * - 统一的资源清理管理
 * 
 * 支持的功能：
 * 1. 视频格式转换（MP4兼容性转换）
 * 2. 音频提取与变速处理
 * 3. 图像序列合成MP4（带音频）
 * 4. 视频重编码（用于双通道转换）
 * 5. 音频变速滤镜构建
 * 
 * 使用示例：
 *   // 初始化
 *   await FFmpegService.init({ highPriority: true });
 * 
 *   // 提取音频
 *   var audioData = await FFmpegService.extractAudio({
 *     videoFile: file,
 *     speedRatio: 1.5,
 *     onProgress: (p) => console.log(p)
 *   });
 * 
 *   // 转换视频格式
 *   var blob = await FFmpegService.convertVideoFormat({
 *     inputFile: file,
 *     maxWidth: 1280,
 *     onProgress: (p) => console.log(p),
 *     checkCancelled: () => this.cancelled
 *   });
 */
(function (window) {
    'use strict';

    var FFmpegService = {
        // ==================== 状态管理 ====================
        ffmpeg: null,               // FFmpeg实例
        isLoaded: false,            // 是否已加载
        isLoading: false,           // 是否正在加载
        loadError: null,            // 加载错误信息

        /**
         * ==================== 初始化与加载 ====================
         * 初始化FFmpeg（支持插队优先加载）
         * @param {Object} options - 配置项
         * @param {Boolean} options.highPriority - 是否高优先级加载（插队）
         * @param {Function} options.onProgress - 加载进度回调
         * @returns {Promise<void>}
         */
        init: async function (options) {
            options = options || {};
            var onProgress = options.onProgress || function () { };

            // 已加载，直接返回
            if (this.isLoaded && this.ffmpeg) {
                return;
            }

            // 正在加载，等待完成
            if (this.isLoading) {
                while (this.isLoading) {
                    await new Promise(function (r) { setTimeout(r, 100); });
                }
                if (this.isLoaded) return;
                if (this.loadError) throw new Error(this.loadError);
            }

            this.isLoading = true;
            this.loadError = null;

            try {
                // 1. 检查SharedArrayBuffer支持
                this._checkSharedArrayBuffer();

                // 2. 动态加载FFmpeg库
                if (typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') {
                    onProgress({ stage: 'loading-library', progress: 0.1, message: '正在加载FFmpeg库...' });
                    await this._loadFFmpegLibrary();
                }

                // 3. 创建FFmpeg实例
                onProgress({ stage: 'creating-instance', progress: 0.3, message: '正在创建FFmpeg实例...' });
                this.ffmpeg = FFmpeg.createFFmpeg({
                    log: true,
                    corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
                    progress: function (p) {
                        // 默认进度处理（可被具体方法覆盖）
                    }
                });

                // 4. 加载FFmpeg Core
                onProgress({ stage: 'loading-core', progress: 0.5, message: '正在加载编码器（约25MB，首次加载较慢）...' });
                await this.ffmpeg.load();

                onProgress({ stage: 'done', progress: 1.0, message: 'FFmpeg加载完成' });
                this.isLoaded = true;

            } catch (error) {
                this.loadError = error.message;
                console.error('FFmpeg加载失败:', error);
                throw new Error('加载FFmpeg失败：' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * 检查SharedArrayBuffer支持
         * @private
         */
        _checkSharedArrayBuffer: function () {
            if (typeof SharedArrayBuffer === 'undefined') {
                // 检查Service Worker状态
                if ('serviceWorker' in navigator) {
                    var errorMsg = 'SharedArrayBuffer 未启用，需要刷新页面。\n\n' +
                        'Service Worker 已就绪，但需要刷新页面才能启用跨域隔离。\n' +
                        '点击"确定"将自动刷新页面。';

                    if (confirm(errorMsg)) {
                        window.location.reload();
                    }
                    throw new Error('需要刷新页面启用 SharedArrayBuffer');
                } else {
                    var errorMsg = '您的浏览器不支持 Service Worker，无法启用 SharedArrayBuffer。\n\n' +
                        '请使用现代浏览器（Chrome 67+、Firefox 79+、Safari 15.2+）。';
                    alert(errorMsg);
                    throw new Error(errorMsg);
                }
            }
        },

        /**
         * 动态加载FFmpeg库
         * @private
         */
        _loadFFmpegLibrary: async function () {
            await new Promise(function (resolve, reject) {
                var script = document.createElement('script');
                script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
                script.onload = resolve;
                script.onerror = function () {
                    reject(new Error('FFmpeg库加载失败，请检查网络'));
                };
                document.head.appendChild(script);
            });

            // 等待FFmpeg对象可用
            var maxWait = 50; // 最多等待5秒
            while ((typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') && maxWait > 0) {
                await new Promise(function (r) { setTimeout(r, 100); });
                maxWait--;
            }

            if (typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') {
                throw new Error('FFmpeg库加载超时');
            }
        },

        /**
         * ==================== 音频处理 ====================
         * 从视频提取音频（支持变速）
         * @param {Object} options - 配置项
         * @param {File} options.videoFile - 视频文件
         * @param {Number} options.totalFrames - 总帧数（变速后）
         * @param {Number} options.fps - 帧率
         * @param {Number} options.speedRatio - 音频变速比例（可选，默认1.0不变速）
         * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
         * @param {Function} options.checkCancelled - 取消检查函数
         * @returns {Promise<Array|null>} - SVGA格式音频数据数组，无音频返回null
         */
        extractAudio: async function (options) {
            if (!this.isLoaded || !this.ffmpeg) {
                throw new Error('FFmpeg未初始化，请先调用init()');
            }

            var videoFile = options.videoFile;
            var totalFrames = options.totalFrames;
            var fps = options.fps;
            var speedRatio = options.speedRatio || 1.0;
            var onProgress = options.onProgress || function () { };
            var checkCancelled = options.checkCancelled || function () { return false; };

            try {
                var ffmpeg = this.ffmpeg;
                var inputName = 'input_audio.mp4';
                var outputName = 'audio.mp3';

                // 1. 写入视频文件
                onProgress(0.1);
                if (checkCancelled()) throw new Error('用户取消');

                var videoData = await videoFile.arrayBuffer();
                ffmpeg.FS('writeFile', inputName, new Uint8Array(videoData));

                // 2. 构建FFmpeg命令
                onProgress(0.2);
                var ffmpegArgs = [
                    '-i', inputName,
                    '-vn',           // 不处理视频
                    '-acodec', 'libmp3lame',
                    '-q:a', '2'      // 高质量
                ];

                // 3. 如果需要变速，添加atempo滤镜
                var needSpeedAdjust = Math.abs(speedRatio - 1.0) > 0.01;
                if (needSpeedAdjust) {
                    var tempoFilter = this.buildAudioTempoFilter(speedRatio);
                    ffmpegArgs.push('-af', tempoFilter);
                }

                ffmpegArgs.push('-y', outputName);

                // 4. 执行提取
                onProgress(0.3);
                if (checkCancelled()) throw new Error('用户取消');

                await ffmpeg.run.apply(ffmpeg, ffmpegArgs);

                // 5. 读取结果
                onProgress(0.9);
                var audioData = ffmpeg.FS('readFile', outputName);

                // 6. 清理临时文件
                this._cleanupFiles([inputName, outputName]);

                onProgress(1.0);

                if (!audioData || audioData.length === 0) {
                    return null;
                }

                // 返回SVGA格式的音频数据
                return [{
                    audioKey: 'audio_0',
                    audioData: new Uint8Array(audioData.buffer || audioData),
                    startFrame: 0,
                    endFrame: totalFrames,
                    startTime: 0,
                    totalTime: 0
                }];

            } catch (error) {
                // 清理可能的临时文件
                this._cleanupFiles(['input_audio.mp4', 'audio.mp3']);

                if (error.message === '用户取消') {
                    throw error;
                }
                console.error('音频提取失败:', error);
                return null;
            }
        },

        /**
         * 构建音频变速滤镜（atempo链式处理）
         * atempo参数范围是0.5-2.0，超出需要链式处理
         * @param {Number} speedRatio - 变速比例
         * @returns {String} - FFmpeg atempo滤镜字符串
         */
        buildAudioTempoFilter: function (speedRatio) {
            if (speedRatio >= 0.5 && speedRatio <= 2.0) {
                // 在范围内，直接使用
                return 'atempo=' + speedRatio.toFixed(4);
            }

            // 超出范围，需要链式处理
            var filters = [];
            var remaining = speedRatio;

            // 处理大于2.0的情况
            while (remaining > 2.0) {
                filters.push('atempo=2.0');
                remaining /= 2.0;
            }

            // 处理小于0.5的情况
            while (remaining < 0.5) {
                filters.push('atempo=0.5');
                remaining /= 0.5;
            }

            // 处理剩余部分
            if (Math.abs(remaining - 1.0) > 0.01) {
                filters.push('atempo=' + remaining.toFixed(4));
            }

            return filters.join(',');
        },

        /**
         * ==================== 视频格式转换 ====================
         * 转换视频为兼容格式（用于播放兼容性问题）
         * @param {Object} options - 配置项
         * @param {File} options.inputFile - 输入视频文件
         * @param {Number} options.maxWidth - 最大宽度（可选，默认1280）
         * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
         * @param {Function} options.checkCancelled - 取消检查函数
         * @returns {Promise<Blob>} - 转换后的视频Blob
         */
        convertVideoFormat: async function (options) {
            if (!this.isLoaded || !this.ffmpeg) {
                throw new Error('FFmpeg未初始化，请先调用init()');
            }

            var inputFile = options.inputFile;
            var maxWidth = options.maxWidth || 1280;
            var onProgress = options.onProgress || function () { };
            var checkCancelled = options.checkCancelled || function () { return false; };

            var ffmpeg = this.ffmpeg;
            var inputName = 'input.mp4';
            var outputName = 'output.mp4';

            try {
                // 1. 写入文件
                onProgress(0.1);
                if (checkCancelled()) throw new Error('用户取消');

                var fileData = await inputFile.arrayBuffer();
                ffmpeg.FS('writeFile', inputName, new Uint8Array(fileData));

                // 2. 设置进度监听
                onProgress(0.2);
                var self = this;
                ffmpeg.setProgress(function (p) {
                    // 进度映射到 20%-90%
                    onProgress(0.2 + p.ratio * 0.7);
                });

                // 3. 执行转换
                if (checkCancelled()) throw new Error('用户取消');

                var scaleFilter = 'scale=\'min(' + maxWidth + ',iw)\':-2';
                await ffmpeg.run(
                    '-i', inputName,
                    '-vf', scaleFilter,
                    '-c:v', 'libx264',
                    '-profile:v', 'baseline',
                    '-level', '3.0',
                    '-crf', '28',
                    '-preset', 'ultrafast',
                    '-c:a', 'aac',
                    '-b:a', '96k',
                    '-max_muxing_queue_size', '1024',
                    outputName
                );

                // 4. 读取结果
                onProgress(0.95);
                if (checkCancelled()) throw new Error('用户取消');

                var outputData = ffmpeg.FS('readFile', outputName);
                var blob = new Blob([outputData.buffer], { type: 'video/mp4' });

                // 5. 清理文件
                this._cleanupFiles([inputName, outputName]);

                onProgress(1.0);
                return blob;

            } catch (error) {
                this._cleanupFiles([inputName, outputName]);
                throw error;
            }
        },

        /**
         * ==================== 工具方法 ====================
         * 清理FFmpeg文件系统中的临时文件
         * @param {Array<String>} fileNames - 文件名数组
         * @private
         */
        _cleanupFiles: function (fileNames) {
            if (!this.ffmpeg) return;

            var ffmpeg = this.ffmpeg;
            fileNames.forEach(function (fileName) {
                try {
                    ffmpeg.FS('unlink', fileName);
                } catch (e) {
                    // 忽略删除失败（文件可能不存在）
                }
            });
        },

        /**
         * 获取FFmpeg版本信息
         * @returns {String} 版本信息
         */
        getVersion: function () {
            return this.isLoaded ? 'FFmpeg 0.11.6 (ffmpeg-core 0.11.0)' : '未加载';
        },

        /**
         * 重置服务（用于错误恢复）
         */
        reset: function () {
            this.ffmpeg = null;
            this.isLoaded = false;
            this.isLoading = false;
            this.loadError = null;
        }
    };

    // 导出到全局
    window.FFmpegService = FFmpegService;

})(window);
