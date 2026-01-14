/**
 * ==================== 文件验证器模块 (File Validator) ====================
 * 
 * 功能说明：
 * 提供统一的文件格式验证功能，支持 SVGA、Lottie、双通道MP4、普通MP4 等格式
 * 在文件加载前进行验证，避免错误文件影响当前播放状态
 * 
 * 主要方法：
 * 1. validateFile(file, fileType) - 统一文件验证入口
 * 2. detectMp4Type(file, callback) - MP4类型检测（双通道/普通）
 * 3. isSequenceFrames(imageFiles) - 序列帧格式判断
 * 
 * 依赖：
 * - SVGA.Parser (全局变量，用于SVGA文件验证)
 * - JSZip (全局变量，用于.lottie文件解压)
 * - libraryLoader.load() (用于动态加载JSZip)
 * 
 * 使用示例：
 * ```javascript
 * var validator = new FileValidator(libraryLoader);
 * validator.validateFile(file, 'svga')
 *   .then(function(validatedData) {
 *     console.log('验证通过', validatedData);
 *   })
 *   .catch(function(errorMsg) {
 *     alert(errorMsg);
 *   });
 * ```
 * 
 * @author SVGA Preview Team
 * @version 1.0.0
 * ====================================================================
 */

(function (window) {
    'use strict';

    /**
     * 文件验证器构造函数
     * @param {Object} libraryLoader - 库加载器实例
     */
    function FileValidator(libraryLoader) {
        this.libraryLoader = libraryLoader;
    }

    /**
     * 统一的文件验证器
     * 在切换模式之前预验证，避免错误文件影响当前播放
     * 
     * @param {File} file - 文件对象
     * @param {String} fileType - 文件类型：'svga' | 'lottie' | 'yyeva' | 'mp4'
     * @returns {Promise} - resolve(validatedData) 或 reject(errorMessage)
     */
    FileValidator.prototype.validateFile = function (file, fileType) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            if (fileType === 'svga') {
                // SVGA 验证：尝试解析 protobuf
                _this._validateSvga(file, resolve, reject);

            } else if (fileType === 'lottie') {
                // Lottie 验证：检查 JSON 格式和必要字段
                _this._validateLottie(file, resolve, reject);

            } else if (fileType === 'yyeva') {
                // 双通道MP4 验证：检查视频尺寸比例
                _this._validateYyeva(file, resolve, reject);

            } else if (fileType === 'mp4') {
                // 普通MP4 验证：基本格式检查
                _this._validateMp4(file, resolve, reject);

            } else {
                reject('不支持的文件类型');
            }
        });
    };

    /**
     * 验证SVGA文件
     * @private
     */
    FileValidator.prototype._validateSvga = function (file, resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var arrayBuffer = e.target.result;
            var blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
            var objectUrl = URL.createObjectURL(blob);
            var parser = new SVGA.Parser();

            parser.load(
                objectUrl,
                function (videoItem) {
                    URL.revokeObjectURL(objectUrl);
                    resolve({ videoItem: videoItem, file: file });
                },
                function (error) {
                    URL.revokeObjectURL(objectUrl);
                    reject('SVGA文件解析失败：' + (error.message || error));
                }
            );
        };
        reader.onerror = function () {
            reject('文件读取失败');
        };
        reader.readAsArrayBuffer(file);
    };

    /**
     * 验证Lottie文件（支持.json和.lottie格式）
     * @private
     */
    FileValidator.prototype._validateLottie = function (file, resolve, reject) {
        var _this = this;
        var fileName = (file.name || '').toLowerCase();

        if (fileName.endsWith('.lottie')) {
            // .lottie 文件（ZIP格式）
            this._validateLottieZip(file, resolve, reject);
        } else {
            // .json 文件
            this._validateLottieJson(file, resolve, reject);
        }
    };

    /**
     * 验证.lottie格式（ZIP压缩包）
     * @private
     */
    FileValidator.prototype._validateLottieZip = function (file, resolve, reject) {
        var _this = this;

        this.libraryLoader.load('jszip', true).then(function () {
            var reader = new FileReader();
            reader.onload = function (e) {
                JSZip.loadAsync(e.target.result).then(function (zip) {
                    // 1. 优先尝试读取 manifest.json (标准 .lottie 格式)
                    var manifestFile = zip.file('manifest.json');
                    if (manifestFile) {
                        manifestFile.async('text').then(function(manifestText) {
                            try {
                                var manifest = JSON.parse(manifestText);
                                var animPath = '';
                                
                                // 获取主动画路径
                                if (manifest.animations && manifest.animations.length > 0) {
                                    var activeId = manifest.activeAnimationId;
                                    var targetAnim = manifest.animations[0]; // 默认取第一个
                                    
                                    // 如果有指定激活的动画ID，则查找对应动画
                                    if (activeId) {
                                        for (var k = 0; k < manifest.animations.length; k++) {
                                            if (manifest.animations[k].id === activeId) {
                                                targetAnim = manifest.animations[k];
                                                break;
                                            }
                                        }
                                    }
                                    
                                    // 拼接路径：.lottie 规范中通常在 animations/ 目录下
                                    animPath = 'animations/' + targetAnim.id + '.json';
                                    
                                    // 尝试直接读取（有些非标准包可能直接放在根目录或路径不同）
                                    if (!zip.file(animPath)) {
                                        // 尝试直接用 id 作为文件名
                                        if (zip.file(targetAnim.id + '.json')) {
                                            animPath = targetAnim.id + '.json';
                                        } else if (zip.file(targetAnim.id)) {
                                            animPath = targetAnim.id;
                                        }
                                    }
                                }
                                
                                if (animPath && zip.file(animPath)) {
                                    _this._readZipJsonFile(zip, animPath, file, resolve, reject);
                                } else {
                                    // Manifest 存在但找不到对应的动画文件，回退到遍历查找
                                    _this._findAndReadAnyJson(zip, file, resolve, reject);
                                }
                            } catch (err) {
                                // Manifest 解析失败，回退到遍历查找
                                _this._findAndReadAnyJson(zip, file, resolve, reject);
                            }
                        }).catch(function() {
                            _this._findAndReadAnyJson(zip, file, resolve, reject);
                        });
                    } else {
                        // 2. 没有 manifest.json，回退到遍历查找 .json 文件
                        _this._findAndReadAnyJson(zip, file, resolve, reject);
                    }
                }).catch(function (err) {
                    reject('.lottie文件解压失败：' + err.message);
                });
            };
            reader.onerror = function () {
                reject('文件读取失败');
            };
            reader.readAsArrayBuffer(file);
        }).catch(function (err) {
            reject('JSZip库加载失败');
        });
    };

    /**
     * 辅助方法：遍历查找并读取任意 JSON 文件
     * @private
     */
    FileValidator.prototype._findAndReadAnyJson = function(zip, file, resolve, reject) {
        var _this = this;
        var jsonFiles = [];
        zip.forEach(function (relativePath, file) {
            if (relativePath.endsWith('.json') && !relativePath.startsWith('__MACOSX')) {
                jsonFiles.push(relativePath);
            }
        });

        if (jsonFiles.length === 0) {
            reject('.lottie文件中未找到JSON数据');
            return;
        }

        // 简单的启发式规则：优先找 'data.json' 或包含 'animation' 的文件
        var targetFile = jsonFiles[0];
        for (var i = 0; i < jsonFiles.length; i++) {
            if (jsonFiles[i].toLowerCase().indexOf('data.json') !== -1) {
                targetFile = jsonFiles[i];
                break;
            }
        }
        
        _this._readZipJsonFile(zip, targetFile, file, resolve, reject);
    };

    /**
     * 辅助方法：读取 ZIP 中的 JSON 文件并验证
     * @private
     */
    FileValidator.prototype._readZipJsonFile = function(zip, filePath, file, resolve, reject) {
        var _this = this;
        zip.file(filePath).async('text').then(function (jsonText) {
            try {
                var data = JSON.parse(jsonText);
                var animationData = data;
                
                // 兼容旧的包装格式
                if (data.animations && Array.isArray(data.animations) && data.animations.length > 0) {
                    if (data.animations[0].data) {
                        animationData = data.animations[0].data;
                    } else if (data.animations[0].animation) {
                        animationData = data.animations[0].animation;
                    }
                }
                
                _this._validateLottieAnimationData(animationData, file, resolve, reject);
            } catch (err) {
                reject('JSON解析失败：' + err.message);
            }
        }).catch(function (err) {
            reject('读取JSON文件失败：' + err.message);
        });
    };

    /**
     * 验证.json格式的Lottie文件
     * @private
     */
    FileValidator.prototype._validateLottieJson = function (file, resolve, reject) {
        var _this = this;
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var data = JSON.parse(e.target.result);
                var animationData = data;

                // 检查是否是包装格式
                if (data.animation && typeof data.animation === 'object') {
                    animationData = data.animation;
                }

                _this._validateLottieAnimationData(animationData, file, resolve, reject);
            } catch (err) {
                reject('JSON解析失败：' + err.message);
            }
        };
        reader.onerror = function () {
            reject('文件读取失败');
        };
        reader.readAsText(file);
    };

    /**
     * 验证Lottie动画数据（检查必要字段）
     * @private
     */
    FileValidator.prototype._validateLottieAnimationData = function (animData, file, resolve, reject) {
        var width = animData.w || animData.width || 0;
        var height = animData.h || animData.height || 0;

        if (!width || !height) {
            reject('Lottie文件缺少尺寸信息，可能文件格式不正确');
        } else {
            resolve({ animationData: animData, file: file });
        }
    };

    /**
     * 验证双通道MP4文件（复用detectMp4Type进行内容检测）
     * @private
     */
    FileValidator.prototype._validateYyeva = function (file, resolve, reject) {
        var _this = this;
        
        // 使用 detectMp4Type 进行严格检测
        this.detectMp4Type(file, function(isDualChannel, alphaPosition) {
            if (isDualChannel) {
                resolve({ 
                    file: file,
                    isDualChannel: true,
                    alphaDirection: alphaPosition
                });
            } else {
                reject('检测未发现透明通道特征，请确认是双通道MP4文件');
            }
        });
    };

    /**
     * 验证普通MP4文件（基本格式检查）
     * @private
     */
    FileValidator.prototype._validateMp4 = function (file, resolve, reject) {
        var objectUrl = URL.createObjectURL(file);
        var video = document.createElement('video');
        video.src = objectUrl;
        video.muted = true;

        video.onloadedmetadata = function () {
            URL.revokeObjectURL(objectUrl);
            resolve({ file: file });
        };
        video.onerror = function () {
            URL.revokeObjectURL(objectUrl);
            reject('视频文件加载失败');
        };
    };

    /**
     * 检测MP4是双通道还是普通视频
     * 通过分析30%和70%位置的帧，检测左右两半的饱和度和亮度差异
     * 
     * @param {File} file - MP4文件
     * @param {Function} callback - 回调函数，参数为 callback(isDualChannel, alphaPosition)
     *                               isDualChannel: boolean - 是否为双通道
     *                               alphaPosition: 'left' | 'right' | null - alpha通道位置（仅双通道时有效）
     */
    FileValidator.prototype.detectMp4Type = function (file, callback) {
        var objectUrl = URL.createObjectURL(file);
        var video = document.createElement('video');
        video.src = objectUrl;
        video.muted = true;

        // 配置参数
        var CONFIG = {
            pureBlackThreshold: 0.015,     // 饱和度<0.015判定为纯黑（alpha通道），降低阈值更严格
            saturationDiffThreshold: 0.02, // 饱和度差异>0.02判定为双通道，提高阈值避免误判
            brightnessDiffThreshold: 0.03, // 亮度差异>0.03判定为双通道，提高阈值避免误判
            checkFramePositions: [0.3, 0.7] // 检测30%和70%位置的帧
        };

        // 清理资源的辅助函数
        function cleanup() {
            if (video) {
                video.onloadedmetadata = null;
                video.onseeked = null;
                video.onerror = null;
                video.removeAttribute('src');
                try {
                    video.load(); // 强制停止加载
                } catch (e) { /* 忽略清理时的错误 */ }
            }
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
        }

        video.onloadedmetadata = function () {
            var videoWidth = video.videoWidth;
            var videoHeight = video.videoHeight;
            var duration = video.duration;

            // 创建临时canvas用于分析
            var canvas = document.createElement('canvas');
            
            // 性能优化：限制分析分辨率
            // 将分析宽度限制在 320px 以内，大幅提升大分辨率视频的检测速度
            var MAX_ANALYZE_WIDTH = 320;
            var scale = Math.min(1, MAX_ANALYZE_WIDTH / videoWidth);
            
            // 确保尺寸至少为 1
            var analyzeWidth = Math.max(1, Math.floor(videoWidth * scale));
            var analyzeHeight = Math.max(1, Math.floor(videoHeight * scale));
            
            canvas.width = analyzeWidth;
            canvas.height = analyzeHeight;
            
            var ctx = canvas.getContext('2d', { willReadFrequently: true });

            var frameIndex = 0;
            var isDualChannel = false;
            var alphaPosition = null; // 'left' | 'right' - 记录alpha通道位置

            // 计算区域平均饱和度和亮度
            function calculateMetrics(imageData) {
                var data = imageData.data;
                var totalSaturation = 0;
                var totalBrightness = 0;
                var count = 0;

                // 抖样计算（步长根据尺寸动态调整，保证性能）
                // 缩小后的图片像素已经很少，可以减小步长或不跳过
                var step = 4; // 每次跳过一个像素（RGBA是4字节，所以+4是下一个像素）
                
                for (var i = 0; i < data.length; i += step) {
                    var r = data[i] / 255;
                    var g = data[i + 1] / 255;
                    var b = data[i + 2] / 255;
                    var max = Math.max(r, g, b);
                    var min = Math.min(r, g, b);

                    // 饱和度
                    var saturation = max === 0 ? 0 : (max - min) / max;
                    totalSaturation += saturation;

                    // 亮度（使用相对亮度公式）
                    var brightness = 0.299 * r + 0.587 * g + 0.114 * b;
                    totalBrightness += brightness;

                    count++;
                }
                return {
                    saturation: count === 0 ? 0 : totalSaturation / count,
                    brightness: count === 0 ? 0 : totalBrightness / count
                };
            }

            // 分析单帧是否为双通道
            function analyzeFrame() {
                // 将视频帧绘制到缩小后的 canvas 上
                ctx.drawImage(video, 0, 0, analyzeWidth, analyzeHeight);

                var halfWidth = Math.floor(analyzeWidth / 2);

                // 防止视频尺寸为0导致的错误
                if (halfWidth <= 0 || analyzeHeight <= 0) {
                    return false;
                }

                var leftData = ctx.getImageData(0, 0, halfWidth, analyzeHeight);
                var rightData = ctx.getImageData(halfWidth, 0, halfWidth, analyzeHeight);

                var leftMetrics = calculateMetrics(leftData);
                var rightMetrics = calculateMetrics(rightData);

                var satDiff = Math.abs(leftMetrics.saturation - rightMetrics.saturation);
                var brightDiff = Math.abs(leftMetrics.brightness - rightMetrics.brightness);

                // 判断逻辑：
                // 1. 一边是纯黑（alpha通道，饱和度极低）
                // 2. 另一边饱和度明显更高（有彩色内容）
                // 3. 或者亮度差异明显（一边全黑，一边有内容）
                var hasBlackSide = leftMetrics.saturation < CONFIG.pureBlackThreshold ||
                    rightMetrics.saturation < CONFIG.pureBlackThreshold;
                var hasSaturationDiff = satDiff > CONFIG.saturationDiffThreshold;
                var hasBrightnessDiff = brightDiff > CONFIG.brightnessDiffThreshold;

                // 特殊处理：当两边都极暗时（两者都<0.015），放宽差异阈值
                var bothVeryDark = leftMetrics.saturation < CONFIG.pureBlackThreshold &&
                    rightMetrics.saturation < CONFIG.pureBlackThreshold;
                if (bothVeryDark) {
                    // 极暗场景：只要有微小差异就判定为双通道
                    hasSaturationDiff = satDiff > 0.003;
                    hasBrightnessDiff = brightDiff > 0.003;
                }

                var result = hasBlackSide && (hasSaturationDiff || hasBrightnessDiff);

                // 判断alpha通道在哪一侧：饱和度低的一侧是灰度图（alpha通道）
                if (result) {
                    return leftMetrics.saturation < rightMetrics.saturation ? 'left' : 'right';
                }

                return null;
            }

            // 检查下一帧
            function checkNextFrame() {
                if (frameIndex >= CONFIG.checkFramePositions.length) {
                    // 所有帧检查完成
                    cleanup();
                    callback(isDualChannel, alphaPosition);
                    return;
                }

                var position = CONFIG.checkFramePositions[frameIndex];
                // 确保 seek 位置有效
                if (!isFinite(duration) || duration <= 0) {
                     // 无法获取时长，仅检测第一帧（当前位置）
                     if (frameIndex === 0) {
                         var frameAlphaPosition = analyzeFrame();
                         if (frameAlphaPosition) {
                             isDualChannel = true;
                             alphaPosition = frameAlphaPosition;
                         }
                         cleanup();
                         callback(isDualChannel, alphaPosition);
                     } else {
                         cleanup();
                         callback(isDualChannel, alphaPosition);
                     }
                     return;
                }
                
                video.currentTime = duration * position;
            }

            video.onseeked = function () {
                var frameAlphaPosition = analyzeFrame();
                if (frameAlphaPosition) {
                    isDualChannel = true;
                    // 记录alpha位置（如果多帧检测结果一致，保留第一次的结果）
                    if (!alphaPosition) {
                        alphaPosition = frameAlphaPosition;
                    }
                }
                frameIndex++;
                checkNextFrame();
            };

            video.onerror = function () {
                cleanup();
                callback(false, null); // 出错默认为普通视频
            };

            // 开始检测第一帧
            checkNextFrame();
        };

        video.onerror = function () {
            cleanup();
            callback(false, null); // 出错默认为普通视频
        };
    };

    /**
     * 判断是否是序列帧格式
     * 序列帧文件名应该包含连续的数字编号，如: frame001.png, frame002.png
     * 
     * @param {Array<File>} imageFiles - 图片文件数组
     * @returns {boolean} - 是否为序列帧格式
     */
    FileValidator.prototype.isSequenceFrames = function (imageFiles) {
        if (imageFiles.length < 2) return false;

        // 提取文件名中的数字部分
        var numberPattern = /\d+/g;
        var fileInfos = [];

        for (var i = 0; i < imageFiles.length; i++) {
            var name = imageFiles[i].name;
            var baseName = name.replace(/\.[^.]+$/, ''); // 去掉扩展名
            var matches = baseName.match(numberPattern);

            if (!matches || matches.length === 0) {
                // 文件名中没有数字，不是序列帧
                return false;
            }

            // 取最后一个数字作为序号
            var seqNum = parseInt(matches[matches.length - 1], 10);
            // 提取前缀（数字前的部分）
            var lastNumIndex = baseName.lastIndexOf(matches[matches.length - 1]);
            var prefix = baseName.substring(0, lastNumIndex);

            fileInfos.push({ file: imageFiles[i], seqNum: seqNum, prefix: prefix });
        }

        // 检查前缀是否一致
        var firstPrefix = fileInfos[0].prefix;
        for (var j = 1; j < fileInfos.length; j++) {
            if (fileInfos[j].prefix !== firstPrefix) {
                return false; // 前缀不一致
            }
        }

        // 检查序号是否连续（允许乱序，但数字范围要连续）
        var seqNums = fileInfos.map(function (info) { return info.seqNum; });
        var minSeq = Math.min.apply(null, seqNums);
        var maxSeq = Math.max.apply(null, seqNums);

        // 序号范围应该等于文件数量（允许有缺失，但整体是连续的）
        // 例如：1,2,3,4,5 是连续的，1,2,5,6,7 也算连续（中间缺失但整体范围覆盖）
        return (maxSeq - minSeq + 1) <= imageFiles.length * 1.5; // 允许50%的缺失容忍度
    };

    // 导出到全局
    window.FileValidator = FileValidator;

})(window);
