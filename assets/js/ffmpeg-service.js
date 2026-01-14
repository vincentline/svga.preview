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
 * 6. 通用命令执行接口 (runCommand)
 * 
 * 使用示例：
 *   // 初始化
 *   await FFmpegService.init({ 
 *     corePath: 'path/to/ffmpeg-core.js', // 可选，自定义core路径
 *     log: true // 可选，开启日志
 *   });
 * 
 *   // 提取音频
 *   var audioData = await FFmpegService.extractAudio({
 *     videoFile: file,
 *     speedRatio: 1.5,
 *     onProgress: (p) => console.log(p)
 *   });
 * 
 *   // 通用命令执行 (例如：视频剪辑)
 *   var result = await FFmpegService.runCommand({
 *     inputFiles: [{ name: 'input.mp4', data: arrayBuffer }],
 *     args: ['-i', 'input.mp4', '-ss', '00:00:01', '-t', '5', '-c', 'copy', 'output.mp4'],
 *     outputFiles: ['output.mp4']
 *   });
 *   var outputData = result['output.mp4']; // Uint8Array
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
        isBusy: false,              // 是否正在执行任务

        /**
         * 获取最佳的 Core Path (CDN 测速)
         * @private
         * @returns {Promise<string>}
         */
        _getBestCorePath: async function () {
            var candidates = [
                'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
                'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
            ];

            // 并发检测 HEAD 请求
            try {
                var promises = candidates.map(function (url) {
                    return fetch(url, { method: 'HEAD', mode: 'cors' })
                        .then(function (res) {
                            if (res.ok) return url;
                            throw new Error('Network response was not ok');
                        })
                        .catch(function () {
                            // 忽略单个请求的失败，防止控制台报红
                            return new Promise(function () { }); // 返回永远pending的promise
                        });
                });
                // 返回最快成功的那个
                return await Promise.any(promises);
            } catch (e) {
                console.warn('CDN测速失败，使用默认Core Path');
                return candidates[0];
            }
        },

        /**
         * ==================== 初始化与加载 ====================
         * 初始化FFmpeg（支持插队优先加载）
         * @param {Object} options - 配置项
         * @param {Boolean} options.highPriority - 是否高优先级加载（插队）
         * @param {String} options.corePath - ffmpeg-core.js 的路径 (可选)
         * @param {Boolean} options.log - 是否开启日志 (可选，默认false)
         * @param {Function} options.onProgress - 加载进度回调
         * @returns {Promise<void>}
         */
        init: async function (options) {
            options = options || {};
            var onProgress = options.onProgress || function () { };
            var highPriority = options.highPriority || false;
            var log = options.log !== undefined ? options.log : false;

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

                // 2. 加载FFmpeg库 (优先使用 LibraryLoader 以支持插队)
                if (typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') {
                    onProgress({ stage: 'loading-library', progress: 0.1, message: '正在加载FFmpeg库...' });

                    if (window.libraryLoader) {
                        // 使用 library-loader 加载，支持优先级
                        await window.libraryLoader.load(['ffmpeg'], highPriority);
                    } else {
                        // 降级：手动加载
                        await this._loadFFmpegLibrary();
                    }
                }

                // 3. 确定 Core Path
                var corePath = options.corePath;
                if (!corePath) {
                    onProgress({ stage: 'checking-cdn', progress: 0.2, message: '正在优选最佳线路...' });
                    corePath = await this._getBestCorePath();
                    console.log('Selected FFmpeg Core Path:', corePath);
                }

                // 4. 创建FFmpeg实例
                onProgress({ stage: 'creating-instance', progress: 0.3, message: '正在创建FFmpeg实例...' });
                this.ffmpeg = FFmpeg.createFFmpeg({
                    log: log,
                    corePath: corePath,
                    progress: function (p) {
                        // 默认进度处理（可被具体方法覆盖）
                    }
                });

                // 5. 加载FFmpeg Core
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
    // 30秒超时，增加备用源支持
    _loadFFmpegLibrary: async function () {
      var loadScript = function (url) {
        return new Promise(function (resolve, reject) {
          var timer = setTimeout(function () {
            reject(new Error('加载超时(30s): ' + url));
          }, 30000);

          var script = document.createElement('script');
          script.src = url;
          script.onload = function () {
            clearTimeout(timer);
            resolve();
          };
          script.onerror = function () {
            clearTimeout(timer);
            reject(new Error('加载失败: ' + url));
          };
          document.head.appendChild(script);
        });
      };

      var primary = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
      var backup = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';

      try {
        await loadScript(primary);
      } catch (e) {
        console.warn('FFmpeg主线路加载失败，尝试备用线路:', e.message);
        await loadScript(backup);
      }

      // 再次确认对象是否存在
      if (typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') {
        throw new Error('FFmpeg库加载成功但对象未找到');
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

            if (this.isBusy) {
                throw new Error('FFmpeg服务正忙，请稍后再试');
            }
            this.isBusy = true;

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
                var totalTimeMs = 0;
                if (fps > 0) {
                    totalTimeMs = Math.round((totalFrames / fps) * 1000);
                }
                if (!Number.isFinite(totalTimeMs)) totalTimeMs = 0;

                return [{
                    audioKey: 'audio_0',
                    audioData: new Uint8Array(audioData.buffer || audioData),
                    startFrame: 0,
                    endFrame: totalFrames,
                    startTime: 0,
                    totalTime: totalTimeMs
                }];

            } catch (error) {
                // 清理可能的临时文件
                this._cleanupFiles(['input_audio.mp4', 'audio.mp3']);

                if (error.message === '用户取消') {
                    throw error;
                }
                console.error('音频提取失败:', error);
                return null;
            } finally {
                this.isBusy = false;
            }
        },

        /**
         * 构建音频变速滤镜（atempo链式处理）
         * atempo参数范围是0.5-2.0，超出需要链式处理
         * @param {Number} speedRatio - 变速比例
         * @returns {String} - FFmpeg atempo滤镜字符串
         */
        buildAudioTempoFilter: function (speedRatio) {
          // 限制变速范围 0.2 - 12.0
          if (speedRatio < 0.2) {
            console.warn('音频变速比例 ' + speedRatio + ' 过小，强制限制为 0.2');
            speedRatio = 0.2;
          } else if (speedRatio > 12.0) {
            console.warn('音频变速比例 ' + speedRatio + ' 过大，强制限制为 12.0');
            speedRatio = 12.0;
          }

          if (speedRatio >= 0.5 && speedRatio <= 2.0) {
            // 在范围内，直接使用
            return 'atempo=' + speedRatio.toFixed(4);
          }

      // 超出范围，需要链式处理
      var filters = [];
      // 降级日志级别，因为这是正常支持的逻辑
      console.log('音频变速比例 ' + speedRatio.toFixed(4) + ' 超出 0.5-2.0 范围，正在构建链式滤镜');

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
         * 提取多段变速音频（支持非线性变速）
         * @param {Object} options - 配置项
         * @param {File} options.videoFile - 视频文件
         * @param {Array} options.keyframes - 变速关键帧数组 [{originalFrame, position}, ...]
         * @param {Number} options.totalFrames - 变速后总帧数
         * @param {Number} options.fps - 帧率（目标帧率）
         * @param {Number} options.originalTotalFrames - 原始总帧数
         * @param {Number} options.originalFps - 原始帧率（可选，用于帧率变化计算）
         * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
         * @param {Function} options.checkCancelled - 取消检查函数
         * @returns {Promise<Array|null>} - SVGA格式音频数据数组，无音频返回null
         */
        extractAudioWithSpeedRemap: async function (options) {
            if (!this.isLoaded || !this.ffmpeg) {
                throw new Error('FFmpeg未初始化，请先调用init()');
            }

            var videoFile = options.videoFile;
            var keyframes = options.keyframes;
            var totalFrames = options.totalFrames;

            // 🛡️ 参数校验与修正
            var fps = parseFloat(options.fps) || 30;
            if (fps <= 0) fps = 30;

            var originalTotalFrames = options.originalTotalFrames;
            var originalFps = options.originalFps || fps;
            if (!originalFps || originalFps <= 0) originalFps = 30;

            // console.log('DEBUG: extractAudioWithSpeedRemap', {
            //     keyframes: keyframes ? keyframes.length : 0,
            //     totalFrames: totalFrames,
            //     fps: fps,
            //     originalTotalFrames: originalTotalFrames,
            //     originalFps: originalFps
            // });

            var onProgress = options.onProgress || function () { };
            var checkCancelled = options.checkCancelled || function () { return false; };

            if (this.isBusy) {
                throw new Error('FFmpeg服务正忙，请稍后再试');
            }
            this.isBusy = true;

            try {
                var ffmpeg = this.ffmpeg;
                var inputFileName = 'input_video.mp4';

                // 1. 写入视频文件到虚拟文件系统
                var videoData = await videoFile.arrayBuffer();
                ffmpeg.FS('writeFile', inputFileName, new Uint8Array(videoData));

                onProgress(0.1);
                if (checkCancelled()) throw new Error('用户取消');

                // 2. 计算每段的时间范围和变速比例
                var originalDuration = originalTotalFrames / originalFps;
                var outputTotalDuration = totalFrames / fps;

                // 🛡️ 防止除零导致的Infinity
                if (!Number.isFinite(outputTotalDuration)) outputTotalDuration = 0;

                console.log('多段变速音频 - 原始:', originalDuration.toFixed(2) + 's', '目标:', outputTotalDuration.toFixed(2) + 's');
                // console.log('keyframes数量:', keyframes.length, '最后position:', keyframes[keyframes.length - 1].position);
                var segments = [];

                for (var i = 0; i < keyframes.length - 1; i++) {
                    var k1 = keyframes[i];
                    var k2 = keyframes[i + 1];

                    // 原始时间段（秒）
                    var startTime = (k1.originalFrame / originalTotalFrames) * originalDuration;
                    var endTime = (k2.originalFrame / originalTotalFrames) * originalDuration;
                    var segmentDuration = endTime - startTime;

                    if (segmentDuration <= 0) continue;

                    // 变速后时间段（秒）
                    var outputStartTime = k1.position * outputTotalDuration;
                    var outputEndTime = k2.position * outputTotalDuration;
                    var outputDuration = outputEndTime - outputStartTime;

                    // 变速比例 = 原始时长 / 输出时长
                    var speedRatio = segmentDuration / outputDuration;

                    // console.log('段' + i + ': ' + startTime.toFixed(2) + '-' + endTime.toFixed(2) + 's → ' + outputStartTime.toFixed(2) + '-' + outputEndTime.toFixed(2) + 's (' + speedRatio.toFixed(2) + 'x)');

                    segments.push({
                        startTime: startTime,
                        duration: segmentDuration,
                        speedRatio: speedRatio,
                        index: i
                    });
                }

                if (segments.length === 0) {
                    console.log('无有效音频段');
                    ffmpeg.FS('unlink', inputFileName);
                    return null;
                }

                onProgress(0.2);
                if (checkCancelled()) throw new Error('用户取消');

                // 3. 分段提取并变速
                var segmentFiles = [];
        var validSegments = segments.filter(seg => {
          var adjustedStartTime = Math.max(0, Math.min(seg.startTime, originalDuration));
          var adjustedDuration = Math.min(seg.duration, originalDuration - adjustedStartTime);
          return adjustedDuration > 0;
        });

        if (validSegments.length === 0) {
          console.warn('无有效音频段(调整后)');
          ffmpeg.FS('unlink', inputFileName);
          return null;
        }

        var progressPerSegment = 0.6 / validSegments.length;

                for (var i = 0; i < segments.length; i++) {
                    var seg = segments[i];

                    // 确保时间参数不超过视频总长度
                    var adjustedStartTime = Math.max(0, Math.min(seg.startTime, originalDuration));
                    var adjustedDuration = Math.min(seg.duration, originalDuration - adjustedStartTime);

                    // 确保持续时间大于0
                    if (adjustedDuration <= 0) {
                        console.warn('段' + i + '调整后持续时间为0，跳过');
                        continue;
                    }

                    var segmentFile = 'segment_' + i + '.wav';

                    var args = [
                        '-ss', adjustedStartTime.toFixed(3),
                        '-t', adjustedDuration.toFixed(3),
                        '-i', inputFileName,
                        '-vn',  // 不要视频
                        '-acodec', 'pcm_s16le',
                        '-ar', '44100',
                        '-ac', '1'
                    ];

                    // 添加变速滤镜
                    if (Math.abs(seg.speedRatio - 1.0) > 0.01) {
                        var tempoFilter = this.buildAudioTempoFilter(seg.speedRatio);
                        args.push('-af', tempoFilter);
                    }

                    args.push('-y', segmentFile);

                    // 执行提取
                    await ffmpeg.run.apply(ffmpeg, args);

                    // DEBUG: 检查生成的段文件大小
                    // try {
                    //     var stat = ffmpeg.FS('stat', segmentFile);
                    //     console.log('DEBUG: 生成 ' + segmentFile + ' size=' + stat.size);
                    // } catch (e) {
                    //     console.error('DEBUG: 无法获取 ' + segmentFile + ' 状态', e);
                    // }

                    segmentFiles.push(segmentFile);
                    onProgress(0.2 + (segmentFiles.length) * progressPerSegment);

                    if (checkCancelled()) {
                        // 清理已创建的文件
                        var filesToClean = [];
                        for (var j = 0; j <= i; j++) {
                            filesToClean.push('segment_' + j + '.wav');
                        }
                        this._cleanupFiles(filesToClean);
                        throw new Error('用户取消');
                    }
                }

                // 4. 拼接所有音频段
                var outputFile = 'output_audio.mp3';

                if (segmentFiles.length === 1) {
                    // 只有一段，直接转码为MP3
                    await ffmpeg.run(
                        '-i', segmentFiles[0],
                        '-acodec', 'libmp3lame',
                        '-ar', '44100',
                        '-ac', '1',
                        '-b:a', '128k',
                        '-y', outputFile
                    );
                    // 清理中间WAV
                    this._cleanupFiles([segmentFiles[0]]);
                } else {
                    // 多段需要拼接
                    // 创建concat列表文件
                    var concatList = segmentFiles.map(function (f) {
                        return "file '" + f + "'";
                    }).join('\n');

                    ffmpeg.FS('writeFile', 'concat_list.txt', new TextEncoder().encode(concatList));

                    // 使用concat协议拼接并直接转码为MP3
                    // 注意：输入是WAV(PCM)，使用concat demuxer拼接，然后编码为MP3
                    await ffmpeg.run(
                        '-f', 'concat',
                        '-safe', '0',
                        '-i', 'concat_list.txt',
                        '-acodec', 'libmp3lame',
                        '-ar', '44100',
                        '-ac', '1',
                        '-b:a', '128k',
                        '-y', outputFile
                    );

                    // 清理段文件
                    segmentFiles.push('concat_list.txt');
                    this._cleanupFiles(segmentFiles);
                }

                onProgress(0.9);
                if (checkCancelled()) throw new Error('用户取消');

                // 5. 读取并转换为SVGA格式
                var audioData = ffmpeg.FS('readFile', outputFile);
                var audioBlob = new Blob([audioData.buffer], { type: 'audio/mpeg' });
                var audioArrayBuffer = await audioBlob.arrayBuffer();

                // 转换为SVGA需要的格式
                var audioArray = Array.from(new Uint8Array(audioArrayBuffer));

                // 🛡️ 确保totalTimeMs是有效整数
                var totalTimeMs = 0;
                if (fps > 0) {
                    totalTimeMs = Math.round((totalFrames / fps) * 1000);
                }
                if (!Number.isFinite(totalTimeMs)) totalTimeMs = 0;

                var svgaAudioList = [{
                    audioKey: 'audio.mp3',
                    startFrame: 0,
                    endFrame: totalFrames,
                    startTime: 0,
                    totalTime: totalTimeMs,
                    audioData: audioArray
                }];

                // 6. 清理文件
                this._cleanupFiles([inputFileName, outputFile]);

                onProgress(1.0);
                return svgaAudioList;

            } catch (error) {
                console.error('多段变速音频提取失败:', error);
                // 尝试清理可能残留的文件
                this._cleanupFiles(['input_video.mp4', 'output_audio.mp3']);

                if (error.message === '用户取消') {
                    throw error;
                }
                return null;
            } finally {
                this.isBusy = false;
            }
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

            if (this.isBusy) {
                throw new Error('FFmpeg服务正忙，请稍后再试');
            }
            this.isBusy = true;

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
            } finally {
                this.isBusy = false;
            }
        },

        /**
         * ==================== 帧序列合成 ====================
         * 将图像序列合成MP4（支持音频合并和变速）
         * @param {Object} options - 配置项
         * @param {Array<Uint8Array>} options.frames - 图像帧数据数组 (JPEG/PNG)
         * @param {Number} options.fps - 输出帧率
         * @param {Number} options.inputFps - 输入帧率 (可选，默认为fps)
         * @param {Number} options.quality - 质量 (1-100)
         * @param {Uint8Array} options.audioData - 音频数据 (可选)
         * @param {Number} options.audioSpeedRatio - 音频变速比例 (可选，默认1.0)
         * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
         * @param {Function} options.checkCancelled - 取消检查函数
         * @returns {Promise<Blob>} - MP4 Blob
         */
        convertFramesToMp4: async function (options) {
            if (!this.isLoaded || !this.ffmpeg) {
                throw new Error('FFmpeg未初始化，请先调用init()');
            }

            var frames = options.frames;
            var fps = options.fps || 30;
            var inputFps = options.inputFps || fps;
            var quality = options.quality || 80;
            var audioData = options.audioData;
            var audioSpeedRatio = options.audioSpeedRatio || 1.0;
            var onProgress = options.onProgress || function () { };
            var checkCancelled = options.checkCancelled || function () { return false; };

            if (this.isBusy) {
                throw new Error('FFmpeg服务正忙，请稍后再试');
            }
            this.isBusy = true;

            var ffmpeg = this.ffmpeg;
            var frameCount = frames.length;
            var outputName = 'output.mp4';
            var audioName = 'audio.mp3'; // 假设输入音频是MP3或AAC，FFmpeg通常能自动识别

            try {
                // 1. 写入帧数据
                // 进度：0% - 40%
                for (var i = 0; i < frameCount; i++) {
                    if (checkCancelled()) throw new Error('用户取消');

                    // 使用 padStart 保证文件名排序正确
                    var frameName = 'frame_' + String(i).padStart(6, '0') + '.jpg';

                    var frameData = frames[i];
                    if (frameData instanceof Blob) {
                        frameData = new Uint8Array(await frameData.arrayBuffer());
                    }

          // 确保是 Uint8Array
          if (!(frameData instanceof Uint8Array)) {
            frameData = new Uint8Array(frameData);
          }

          ffmpeg.FS('writeFile', frameName, frameData);

                    if (i % 5 === 0) {
                        onProgress(0.4 * (i / frameCount));
                    }
                }

        // 2. 写入音频数据 (如果有)
        var hasAudio = false;
        if (audioData && audioData.length > 0) {
          // 确保是 Uint8Array
          var audioDataToWrite = audioData;
          if (!(audioData instanceof Uint8Array)) {
            audioDataToWrite = new Uint8Array(audioData);
          }
          ffmpeg.FS('writeFile', audioName, audioDataToWrite);
          hasAudio = true;
        }

                // 3. 构建FFmpeg命令
                onProgress(0.45);

                // CRF计算: 100->18 (高质量), 0->51 (低质量)
                var crf = Math.round(51 - (quality / 100) * 33);

                var args = [
                    '-thread_queue_size', '512',
                    '-framerate', String(inputFps),
                    '-i', 'frame_%06d.jpg'
                ];

                // 添加输入文件
                if (hasAudio) {
                    args.push('-thread_queue_size', '512');
                    // 添加 -vn 确保不从音频源（可能是视频文件）中读取视频流
                    args.push('-vn', '-i', audioName);
                }

                // 视频编码参数
                args.push(
                    '-c:v', 'libx264',
                    '-preset', 'fast',       // 平衡速度和压缩率
                    '-tune', 'animation',    // 优化动画内容
                    '-profile:v', 'high',    // 兼容性较好
                    '-level', '4.0',
                    '-pix_fmt', 'yuv420p',   // 确保兼容性
                    '-crf', String(crf),
                    '-movflags', '+faststart',
                    '-r', String(fps)        // 输出帧率
                );

                // 音频编码参数
                if (hasAudio) {
                    args.push('-c:a', 'aac', '-b:a', '128k');

                    // 音频变速
                    if (Math.abs(audioSpeedRatio - 1.0) > 0.01) {
                        var tempoFilter = this.buildAudioTempoFilter(audioSpeedRatio);
                        args.push('-af', tempoFilter);
                    }

                    args.push('-shortest'); // 以最短流为准
                }

                args.push('-y', outputName);

                // 4. 执行编码
                // 进度：45% - 95%
                var self = this;
                ffmpeg.setProgress(function (p) {
                    var ratio = 0;
                    if (p.ratio !== undefined) {
                        ratio = p.ratio;
                    } else if (p.time && p.duration) {
                        ratio = p.time / p.duration;
                    }
                    onProgress(0.45 + ratio * 0.5);
                });

                if (checkCancelled()) throw new Error('用户取消');

                await ffmpeg.run.apply(ffmpeg, args);

                // 5. 读取结果
                onProgress(0.95);
                var data = ffmpeg.FS('readFile', outputName);
                var blob = new Blob([data.buffer], { type: 'video/mp4' });

        // 6. 清理文件
        // 只清理已生成的文件
        var filesToClean = [outputName];
        if (hasAudio) filesToClean.push(audioName);

        // 批量清理帧文件 (只清理已处理的)
        for (var i = 0; i < frameCount; i++) {
          filesToClean.push('frame_' + String(i).padStart(6, '0') + '.jpg');
        }
        this._cleanupFiles(filesToClean);

        onProgress(1.0);
        return blob;

      } catch (error) {
        // 错误清理
        var cleanupList = [outputName, audioName];
        // 仅清理可能已创建的帧 (保守估计全部，因为无法精确知道哪一帧失败前已创建)
        // 但为了避免几千次 unlink 异常，这里可以只清理前 i 帧? 
        // 简单起见，还是清理所有可能的，但在 _cleanupFiles 里我们要保证不报错
        for (var i = 0; i < frameCount; i++) {
          cleanupList.push('frame_' + String(i).padStart(6, '0') + '.jpg');
        }
        this._cleanupFiles(cleanupList);

        if (error.message === '用户取消') throw error;
        throw error;
      } finally {
                // 清除进度回调
                if (this.ffmpeg) {
                    this.ffmpeg.setProgress(function () { });
                }
                this.isBusy = false;
            }
        },

        /**
         * ==================== 通用命令执行 ====================
         * 执行自定义FFmpeg命令（底层通用接口）
         * @param {Object} options - 配置项
         * @param {Array<String>} options.args - FFmpeg参数数组，例如 ['-i', 'input.mp4', 'output.mp4']
         * @param {Array<Object>} options.inputFiles - 输入文件数组 [{name: 'input.mp4', data: ArrayBuffer|Uint8Array}]
         * @param {Array<String>} options.outputFiles - 需要读取的输出文件名数组 ['output.mp4']
         * @param {Function} options.onProgress - 进度回调 (progress: 0-1) - 注意：通用命令的进度可能不准确
         * @returns {Promise<Object>} - 返回输出文件数据对象 { 'output.mp4': Uint8Array, ... }
         */
        runCommand: async function (options) {
            if (!this.isLoaded || !this.ffmpeg) {
                throw new Error('FFmpeg未初始化，请先调用init()');
            }

            var args = options.args || [];
            var inputFiles = options.inputFiles || [];
            var outputFiles = options.outputFiles || [];
            var onProgress = options.onProgress || function () { };

            if (this.isBusy) {
                throw new Error('FFmpeg服务正忙，请稍后再试');
            }
            this.isBusy = true;

            var ffmpeg = this.ffmpeg;
            var createdFiles = [];

            try {
                // 1. 写入输入文件
                for (var i = 0; i < inputFiles.length; i++) {
                    var file = inputFiles[i];
                    if (file.name && file.data) {
                        ffmpeg.FS('writeFile', file.name, new Uint8Array(file.data));
                        createdFiles.push(file.name);
                    }
                }

                // 2. 设置进度监听
                // 注意：通用命令很难精确计算进度，这里只是简单透传
                ffmpeg.setProgress(function (p) {
                    if (p.ratio !== undefined) {
                        onProgress(p.ratio);
                    }
                });

                // 3. 执行命令
                await ffmpeg.run.apply(ffmpeg, args);

                // 4. 读取输出文件
                var results = {};
                for (var i = 0; i < outputFiles.length; i++) {
                    var outName = outputFiles[i];
                    try {
                        var data = ffmpeg.FS('readFile', outName);
                        results[outName] = data;
                        createdFiles.push(outName);
                    } catch (e) {
                        console.warn('无法读取输出文件:', outName, e);
                    }
                }

                // 5. 清理文件
                this._cleanupFiles(createdFiles);

                return results;

            } catch (error) {
                this._cleanupFiles(createdFiles);
                throw error;
            } finally {
                // 清除进度监听
                if (this.ffmpeg) {
                    this.ffmpeg.setProgress(function () { });
                }
                this.isBusy = false;
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
            this.isBusy = false; // 强制释放锁
        }
    };

    // 导出到全局
    window.FFmpegService = FFmpegService;

})(window);
