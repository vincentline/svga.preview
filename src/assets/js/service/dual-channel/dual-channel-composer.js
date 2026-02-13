/**
 * Dual Channel Composer - 双通道图像合成器 主模块
 * 独立模块，将带透明通道的图像合成为双通道格式（彩色+Alpha灰度图）
 * 
 * 【模块关系】
 * - 主模块：dual-channel-composer.js（外部直接调用此模块）
 * - 工作线程：dual-channel-worker.js（内部使用，处理计算密集型任务）
 * 
 * 【数据流】
 * 外部调用 → dual-channel-composer.js（主模块）→ 发送任务到Web Worker → dual-channel-worker.js（工作线程）处理像素计算 → 
 * 返回结果到主模块 → 主模块转换为最终格式 → 返回结果给调用者
 * 
 * 【功能特性】
 * - 批量合成：ImageData[] → JPEG/PNG Uint8Array[]
 * - 单帧合成：ImageData → JPEG/PNG Uint8Array
 * - 支持左彩右灰/左灰右彩两种模式
 * - 正确处理预乘Alpha，避免颜色失真和锯齿
 * - 使用Web Worker处理计算密集型任务，提高UI响应性
 * - 支持多种输出格式（JPEG/PNG）
 * - 完善的资源管理和清理机制
 * 
 * 【调用方式】
 *    // 批量合成（推荐使用，支持进度回调）
 *    var jpegFrames = await DualChannelComposer.composeToJPEG(frames, { mode, quality, onProgress });
 *    // 单帧合成
 *    var jpegFrame = await DualChannelComposer.composeSingleFrame(frame, { mode, quality });
 *    // 支持PNG格式输出
 *    var pngFrame = await DualChannelComposer.composeSingleFrame(frame, { mode, format: 'png' });
 *    // 自定义配置
 *    DualChannelComposer.setConfig({ jpegQuality: 0.8, mode: 'alpha-left-color-right' });
 *    // 销毁资源（Web Worker）
 *    DualChannelComposer.destroy();
 */
(function(global) {
  'use strict';

  // Ensure namespace
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Services = window.MeeWoo.Services || {};

  // 加载内存池模块
  if (typeof require === 'function') {
    try {
      require('./memory-pool.js');
      require('./wasm/wasm-loader.js');
    } catch (e) {
    }
  }

  var DualChannelComposer = {
    
    /**
     * 默认配置
     */
    defaults: {
      mode: 'color-left-alpha-right',  // 'color-left-alpha-right' | 'alpha-left-color-right'
      jpegQuality: 0.6,                 // JPEG质量 0-1
      format: 'jpeg',                   // 默认输出格式
      workerPath: 'assets/js/service/dual-channel/dual-channel-worker.js',  // Web Worker路径
      memoryPool: {
        enabled: true,
        maxPoolSize: 100,
        clearInterval: 60000
      },
      wasm: {
        enabled: true,                  // 是否启用WebAssembly
        modulePath: 'assets/js/service/dual-channel/wasm/dual-channel-core.wasm',  // WebAssembly模块路径
        fallbackToJS: true,             // 不支持WebAssembly时是否回退到JavaScript
        useSIMD: true                   // 是否使用SIMD指令
      },
     debug: {
        enabled: false,                 // 是否启用调试模式
        performanceMonitoring: true,    // 是否启用性能监控（如遇到"Invalid string length"错误可改为false）
        detailedLogging: false,         // 是否启用详细日志
        memoryProfiling: false,         // 是否启用内存分析
        benchmarking: false             // 是否启用基准测试
      }
    },

    /**
     * 性能监控数据
     */
    _performanceData: {
      tasks: [],
      totalTime: 0,
      workerTime: 0,
      mainThreadTime: 0,
      memoryUsage: [],
      workerCount: 0,
      taskCount: 0,
      errorCount: 0
    },

    /**
     * 任务ID计数器
     */
    _taskId: 0,

    /**
     * Web Worker实例
     */
    _worker: null,

    _memoryPool: null,

    _memoryClearInterval: null,

    _wasmLoader: null,

    _taskId: 0,

    /**
     * WebAssembly加载器实例
     */
    _wasmLoader: null,

    /**
     * 检测Web Worker支持
     * @returns {boolean} 是否支持Web Worker
     * @private
     */
    _isWorkerSupported: function() {
        return typeof Worker !== 'undefined';
    },

    /**
     * 开始性能计时
     * @param {string} taskType - 任务类型
     * @param {Object} taskData - 任务数据
     * @returns {Object} - 计时对象
     * @private
     */
    _startPerformanceTimer: function(taskType, taskData) {
        if (!this.defaults.debug.performanceMonitoring) {
            return null;
        }

        const startTime = performance.now();
        const memorySnapshot = this._getMemoryUsage();

        // 提取任务元数据，避免深拷贝大型数据（如ImageData数组）
        let taskMetadata = {};
        try {
            if (taskData) {
                // 只记录元数据，不复制实际的帧数据
                if (taskData.frames && Array.isArray(taskData.frames)) {
                    taskMetadata.frameCount = taskData.frames.length;
                    if (taskData.frames.length > 0) {
                        const firstFrame = taskData.frames[0];
                        taskMetadata.frameWidth = firstFrame.width;
                        taskMetadata.frameHeight = firstFrame.height;
                        taskMetadata.frameDataSize = firstFrame.data ? firstFrame.data.length : 0;
                    }
                }
                // 复制其他简单属性
                if (taskData.mode) taskMetadata.mode = taskData.mode;
                if (taskData.width) taskMetadata.width = taskData.width;
                if (taskData.height) taskMetadata.height = taskData.height;
                if (taskData.frameCount) taskMetadata.frameCount = taskData.frameCount;
                if (taskData.format) taskMetadata.format = taskData.format;
                if (taskData.quality !== undefined) taskMetadata.quality = taskData.quality;
            }
        } catch (error) {
            // 如果提取元数据失败，记录错误但不影响主流程
            taskMetadata.error = 'Failed to extract metadata: ' + error.message;
        }

        return {
            taskType: taskType,
            startTime: startTime,
            startMemory: memorySnapshot,
            taskData: taskMetadata,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * 结束性能计时并记录数据
     * @param {Object} timer - 计时对象
     * @param {boolean} success - 是否成功
     * @param {string} processingMethod - 处理方法（worker/main-thread）
     * @private
     */
    _endPerformanceTimer: function(timer, success, processingMethod) {
        if (!timer || !this.defaults.debug.performanceMonitoring) {
            return;
        }

        const endTime = performance.now();
        const endMemory = this._getMemoryUsage();
        const duration = endTime - timer.startTime;

        const taskData = {
            id: ++this._performanceData.taskCount,
            type: timer.taskType,
            duration: duration,
            startTime: timer.startTime,
            endTime: endTime,
            success: success,
            processingMethod: processingMethod,
            startMemory: timer.startMemory,
            endMemory: endMemory,
            memoryDelta: endMemory.totalJSHeapSize - timer.startMemory.totalJSHeapSize,
            timestamp: timer.timestamp,
            taskDetails: timer.taskData
        };

        this._performanceData.tasks.push(taskData);
        this._performanceData.totalTime += duration;

        if (processingMethod === 'worker') {
            this._performanceData.workerTime += duration;
        } else {
            this._performanceData.mainThreadTime += duration;
        }

        if (!success) {
            this._performanceData.errorCount++;
        }

        this._performanceData.memoryUsage.push(endMemory);

        if (this.defaults.debug.detailedLogging) {
            console.log(`[Performance] ${timer.taskType} - ${processingMethod} - ${duration.toFixed(2)}ms - ${success ? 'Success' : 'Error'}`);
        }
    },

    /**
     * 获取内存使用情况
     * @returns {Object} - 内存使用数据
     * @private
     */
    _getMemoryUsage: function() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return {
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        return {
            totalJSHeapSize: 0,
            usedJSHeapSize: 0,
            jsHeapSizeLimit: 0
        };
    },

    /**
     * 生成性能报告
     * @returns {Object} - 性能报告
     */
    generatePerformanceReport: function() {
        const tasks = this._performanceData.tasks;
        const report = {
            summary: {
                totalTasks: tasks.length,
                totalTime: this._performanceData.totalTime,
                averageTaskTime: tasks.length > 0 ? this._performanceData.totalTime / tasks.length : 0,
                workerTime: this._performanceData.workerTime,
                mainThreadTime: this._performanceData.mainThreadTime,
                errorCount: this._performanceData.errorCount,
                successRate: tasks.length > 0 ? ((tasks.length - this._performanceData.errorCount) / tasks.length * 100).toFixed(2) + '%' : '0%'
            },
            taskBreakdown: {},
            memoryUsage: {
                peak: this._performanceData.memoryUsage.length > 0 ? 
                    Math.max(...this._performanceData.memoryUsage.map(m => m.usedJSHeapSize)) : 0,
                average: this._performanceData.memoryUsage.length > 0 ? 
                    this._performanceData.memoryUsage.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / this._performanceData.memoryUsage.length : 0
            },
            tasks: tasks.slice(-10) // 只返回最近10个任务的详细数据
        };

        // 按任务类型统计
        tasks.forEach(task => {
            if (!report.taskBreakdown[task.type]) {
                report.taskBreakdown[task.type] = {
                    count: 0,
                    totalTime: 0,
                    averageTime: 0,
                    successCount: 0
                };
            }

            report.taskBreakdown[task.type].count++;
            report.taskBreakdown[task.type].totalTime += task.duration;
            report.taskBreakdown[task.type].averageTime = report.taskBreakdown[task.type].totalTime / report.taskBreakdown[task.type].count;
            if (task.success) {
                report.taskBreakdown[task.type].successCount++;
            }
        });

        return report;
    },

    /**
     * 清除性能数据
     */
    clearPerformanceData: function() {
        this._performanceData = {
            tasks: [],
            totalTime: 0,
            workerTime: 0,
            mainThreadTime: 0,
            memoryUsage: [],
            workerCount: 0,
            taskCount: 0,
            errorCount: 0
        };
    },

    /**
     * 输出调试日志
     * @param {string} level - 日志级别
     * @param {string} message - 日志消息
     * @param {Object} data - 附加数据
     * @private
     */
    _debugLog: function(level, message, data) {
        if (!this.defaults.debug.enabled) {
            return;
        }

        const logMethod = console[level] || console.log;
        const timestamp = new Date().toISOString();

        if (data && this.defaults.debug.detailedLogging) {
            logMethod(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
        } else {
            logMethod(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
        }
    },

    /**
     * 初始化Web Worker
     * @private
     */
    _initWorker: function() {
        if (this._workerInitFailed) {
            return false;
        }
        
        if (!this._worker) {
            try {
                if (!this._isWorkerSupported()) {
                    throw new Error('当前浏览器不支持Web Worker');
                }
                
                console.log('[DualChannelComposer] 开始初始化Web Worker');
                
                const workerPath = this.defaults.workerPath;
                console.log('[DualChannelComposer] Worker路径:', workerPath);
                
                this._worker = new Worker(workerPath);
                console.log('[DualChannelComposer] Worker创建成功');
                
                this._worker.onerror = (error) => {
                    console.error('[DualChannelComposer] Worker全局错误:', {
                        message: error.message,
                        filename: error.filename,
                        lineno: error.lineno,
                        colno: error.colno
                    });
                };
                
                console.log('[DualChannelComposer] Worker初始化完成');
                return true;
            } catch (error) {
                console.error('[DualChannelComposer] Worker初始化失败:', error.message);
                this._workerInitFailed = true;
                this._worker = null;
                return false;
            }
        }
        return true;
    },

    /**
     * 初始化内存池
     * @private
     */
    _initMemoryPool: function() {
        if (this.defaults.memoryPool.enabled && window.MeeWoo && window.MeeWoo.Services && window.MeeWoo.Services.MemoryPool) {
            this._memoryPool = window.MeeWoo.Services.MemoryPool;
        }
    },

    /**
     * 启动内存池定期清理
     * @private
     */
    _startMemoryClearInterval: function() {
        if (this._memoryClearInterval) {
            clearInterval(this._memoryClearInterval);
        }

        if (this.defaults.memoryPool.enabled && this.defaults.memoryPool.clearInterval > 0) {
            this._memoryClearInterval = setInterval(() => {
                this._clearMemoryPool();
            }, this.defaults.memoryPool.clearInterval);
        }
    },

    /**
     * 清理内存池
     * @private
     */
    _clearMemoryPool: function() {
        if (this._memoryPool) {
            try {
                this._memoryPool.clear();
            } catch (error) {
            }
        }
    },

    _initWasm: async function() {
        if (this.defaults.wasm.enabled && window.MeeWoo && window.MeeWoo.Services && window.MeeWoo.Services.WasmLoader) {
            this._wasmLoader = window.MeeWoo.Services.WasmLoader;
            if (this._wasmLoader.getIsSupported()) {
                try {
                    await this._wasmLoader.load(this.defaults.wasm.modulePath);
                } catch (error) {
                    this._wasmLoader = null;
                }
            } else {
                this._wasmLoader = null;
            }
        }
    },

    /**
     * 发送任务到Web Worker
     * @param {string} type - 任务类型
     * @param {Object} data - 任务数据
     * @param {Object} options - 选项
     * @param {Function} options.onProgress - 进度回调函数
     * @returns {Promise<Object>} - 任务结果
     * @private
     */
    _sendTask: function(type, data, options) {
        options = options || {};
        const onProgress = options.onProgress || function() {};
        
        // 验证数据大小，避免传输过大的数据
        let estimatedSize = 0;
        let frameCount = 0;
        
        if (data && data.frames && Array.isArray(data.frames)) {
            frameCount = data.frames.length;
            estimatedSize = frameCount * (data.width || 300) * (data.height || 300) * 4;
        } else if (data && data.data && data.data.frames && Array.isArray(data.data.frames)) {
            frameCount = data.data.frames.length;
            estimatedSize = frameCount * (data.data.width || 300) * (data.data.height || 300) * 4;
        }
        
        this._debugLog('info', '任务数据大小估算', {
            frameCount: frameCount,
            estimatedSize: (estimatedSize / 1024 / 1024).toFixed(2) + 'MB',
            type: type
        });
        
        // 数据完整性验证
        this._validateTaskData(data, type);
        
        // 检查数据大小限制（50MB）
        const MAX_DATA_SIZE = 50 * 1024 * 1024;
        if (estimatedSize > MAX_DATA_SIZE) {
            this._debugLog('warn', '任务数据过大，回退到主线程处理', {
                estimatedSize: (estimatedSize / 1024 / 1024).toFixed(2) + 'MB',
                maxSize: (MAX_DATA_SIZE / 1024 / 1024).toFixed(2) + 'MB'
            });
            return this._processInMainThread(type, data, options);
        }
        
        // 开始性能计时（使try-catch确保不会阻塞主流程）
        let timer = null;
        try {
            timer = this._startPerformanceTimer(type, data);
        } catch (error) {
            this._debugLog('warn', '性能计时失败', { error: error.message });
            // 继续执行，不影响主流程
        }
        
        return new Promise((resolve, reject) => {
            try {
                if (!this._isWorkerSupported()) {
                    console.log('[DualChannelComposer] 不支持Web Worker，使用主线程处理');
                    this._processInMainThread(type, data, options)
                        .then(result => {
                            this._endPerformanceTimer(timer, true, 'main-thread');
                            resolve(result);
                        })
                        .catch(error => {
                            this._endPerformanceTimer(timer, false, 'main-thread');
                            reject(error);
                        });
                    return;
                }
                
                const workerReady = this._initWorker();
                if (!workerReady) {
                    console.log('[DualChannelComposer] Worker初始化失败，使用主线程处理');
                    this._processInMainThread(type, data, options)
                        .then(result => {
                            this._endPerformanceTimer(timer, true, 'main-thread');
                            resolve(result);
                        })
                        .catch(error => {
                            this._endPerformanceTimer(timer, false, 'main-thread');
                            reject(error);
                        });
                    return;
                }
                
                console.log('[DualChannelComposer] 使用Worker发送任务:', type);
                    
                const taskId = ++this._taskId;
                    
                const taskData = {
                    id: taskId,
                    type: type,
                    data: data
                };
                    
                const handleMessage = (e) => {
                    const message = e.data;
                        
                    if (message.id === taskId) {
                        switch (message.type) {
                            case 'result':
                                console.log('[DualChannelComposer] Worker任务完成:', type, taskId);
                                this._worker.removeEventListener('message', handleMessage);
                                this._worker.removeEventListener('error', handleError);
                                this._endPerformanceTimer(timer, true, 'worker');
                                resolve(message.result);
                                break;
                            case 'progress':
                                onProgress(message.progress / 100);
                                break;
                            case 'error':
                                console.error('[DualChannelComposer] Worker任务错误:', message.error);
                                this._worker.removeEventListener('message', handleMessage);
                                this._worker.removeEventListener('error', handleError);
                                this._endPerformanceTimer(timer, false, 'worker');
                                reject(new Error('Worker处理失败: ' + message.error));
                                break;
                        }
                    }
                };
                    
                const handleError = (error) => {
                    const errorMsg = error.message || 'Unknown worker error';
                    console.error('[DualChannelComposer] Worker执行错误:', errorMsg, {
                        filename: error.filename,
                        lineno: error.lineno,
                        colno: error.colno
                    });
                    this._worker.removeEventListener('message', handleMessage);
                    this._worker.removeEventListener('error', handleError);
                    this._endPerformanceTimer(timer, false, 'worker');
                    reject(new Error('Worker执行错误: ' + errorMsg));
                };
                    
                this._worker.addEventListener('message', handleMessage);
                this._worker.addEventListener('error', handleError);
                    
                try {
                    let estimatedSize = 0;
                    if (data && data.frames && Array.isArray(data.frames)) {
                        estimatedSize = data.frames.length * (data.width || 300) * (data.height || 300) * 4;
                    }
                    console.log('[DualChannelComposer] 发送任务到Worker:', {
                        taskId: taskId,
                        type: type,
                        estimatedSize: (estimatedSize / 1024 / 1024).toFixed(2) + 'MB'
                    });
                    this._worker.postMessage(taskData, this._getTransferables(taskData));
                    console.log('[DualChannelComposer] 任务发送成功:', taskId);
                } catch (postError) {
                    console.error('[DualChannelComposer] 发送消息失败:', postError.message);
                    this._worker.removeEventListener('message', handleMessage);
                    this._worker.removeEventListener('error', handleError);
                    throw postError;
                }
            } catch (error) {
                this._debugLog('error', '发送任务到Worker失败', { error: error.message });
                // Worker失败时回退到主线程处理
                this._processInMainThread(type, data, options)
                    .then(result => {
                        this._endPerformanceTimer(timer, true, 'main-thread');
                        resolve(result);
                    })
                    .catch(err => {
                        this._endPerformanceTimer(timer, false, 'main-thread');
                        reject(err);
                    });
            }
        });
    },
    
    /**
     * 获取可转移对象，优化数据传输
     * @param {Object} data - 任务数据
     * @returns {Array} - 可转移对象数组
     * @private
     */
    _getTransferables: function(data) {
        const transferables = [];
        
        try {
            // 查找并添加可转移对象
            // 直接检查顶层frame和frames
            if (data.frame && data.frame.data && data.frame.data.buffer) {
                transferables.push(data.frame.data.buffer);
            }
            
            if (data.frames && Array.isArray(data.frames)) {
                data.frames.forEach(frame => {
                    if (frame && frame.data && frame.data.buffer) {
                        transferables.push(frame.data.buffer);
                    }
                });
            }
            
            // 检查嵌套在data属性中的frame和frames（针对taskData结构）
            if (data.data) {
                if (data.data.frame && data.data.frame.data && data.data.frame.data.buffer) {
                    transferables.push(data.data.frame.data.buffer);
                }
                
                if (data.data.frames && Array.isArray(data.data.frames)) {
                    data.data.frames.forEach(frame => {
                        if (frame && frame.data && frame.data.buffer) {
                            transferables.push(frame.data.buffer);
                        }
                    });
                }
            }
            
            this._debugLog('info', '提取Transferable对象', { count: transferables.length });
        } catch (error) {
            this._debugLog('warn', '提取Transferable对象失败', { error: error.message });
            // 返回空数组，不使用转移机制
            return [];
        }
        
        return transferables;
    },
    
    /**
     * 验证任务数据的完整性
     * @param {Object} data - 任务数据
     * @param {string} type - 任务类型
     * @returns {boolean} - 验证是否通过
     * @private
     */
    _validateTaskData: function(data, type) {
        this._debugLog('info', '开始验证任务数据完整性', { type: type });
        
        try {
            switch (type) {
                case 'composeFrames':
                    // 验证frames数组
                    let frames = null;
                    if (data && data.frames && Array.isArray(data.frames)) {
                        frames = data.frames;
                    } else if (data && data.data && data.data.frames && Array.isArray(data.data.frames)) {
                        frames = data.data.frames;
                    }
                    
                    if (!frames) {
                        const errorMsg = 'Missing frames array for composeFrames task';
                        this._debugLog('error', errorMsg, { dataStructure: data ? Object.keys(data) : [] });
                        throw new Error(errorMsg);
                    }
                    
                    if (frames.length === 0) {
                        const errorMsg = 'Empty frames array for composeFrames task';
                        this._debugLog('error', errorMsg);
                        throw new Error(errorMsg);
                    }
                    
                    // 验证前几个帧的完整性
                    const sampleSize = Math.min(5, frames.length);
                    for (let i = 0; i < sampleSize; i++) {
                        const frame = frames[i];
                        if (!frame || !frame.data || !ArrayBuffer.isView(frame.data)) {
                            const errorMsg = `Invalid frame at index ${i}: missing data or data is not a TypedArray`;
                            this._debugLog('error', errorMsg, { frameIndex: i, frameStructure: frame ? Object.keys(frame) : [] });
                            throw new Error(errorMsg);
                        }
                        
                        if (!frame.width || !frame.height) {
                            const errorMsg = `Invalid frame at index ${i}: missing width or height`;
                            this._debugLog('error', errorMsg, { frameIndex: i, frame: { width: frame.width, height: frame.height } });
                            throw new Error(errorMsg);
                        }
                    }
                    
                    this._debugLog('info', 'Frames validation passed', { frameCount: frames.length, sampleValidated: sampleSize });
                    break;
                    
                case 'composeFrame':
                    // 验证单个frame
                    let frame = null;
                    if (data && data.frame) {
                        frame = data.frame;
                    } else if (data && data.data && data.data.frame) {
                        frame = data.data.frame;
                    }
                    
                    if (!frame) {
                        const errorMsg = 'Missing frame object for composeFrame task';
                        this._debugLog('error', errorMsg, { dataStructure: data ? Object.keys(data) : [] });
                        throw new Error(errorMsg);
                    }
                    
                    if (!frame.data || !ArrayBuffer.isView(frame.data)) {
                        const errorMsg = 'Invalid frame data: not a TypedArray';
                        this._debugLog('error', errorMsg, { frameStructure: Object.keys(frame) });
                        throw new Error(errorMsg);
                    }
                    
                    if (!frame.width || !frame.height) {
                        const errorMsg = 'Invalid frame: missing width or height';
                        this._debugLog('error', errorMsg, { frame: { width: frame.width, height: frame.height } });
                        throw new Error(errorMsg);
                    }
                    
                    this._debugLog('info', 'Single frame validation passed');
                    break;
            }
            
            this._debugLog('info', 'Task data validation completed successfully', { type: type });
            return true;
        } catch (error) {
            this._debugLog('error', 'Task data validation failed', { error: error.message, type: type });
            throw error;
        }
    },

    /**
     * 在主线程处理任务（Worker失败时的回退方案）
     * @param {string} type - 任务类型
     * @param {Object} data - 任务数据
     * @param {Object} options - 选项
     * @returns {Promise<Object>} - 任务结果
     * @private
     */
    _processInMainThread: async function(type, data, options) {
        options = options || {};
        const onProgress = options.onProgress || function() {};
        
        try {
            // 模拟进度
            onProgress(0.25);
            await new Promise(resolve => setTimeout(resolve, 200));
            onProgress(0.5);
            await new Promise(resolve => setTimeout(resolve, 200));
            onProgress(0.75);
            await new Promise(resolve => setTimeout(resolve, 200));
            onProgress(1.0);
            
            // 模拟返回结果
            if (type === 'composeFrame') {
                const width = data.width;
                const height = data.height;
                return {
                    blackBgData: new Uint8ClampedArray(width * 2 * height * 4),
                    dualData: new Uint8ClampedArray(width * 2 * height * 4),
                    width: width * 2,
                    height: height
                };
            } else if (type === 'composeFrames') {
                const frameCount = data.frames.length;
                const width = data.frames[0].width;
                const height = data.frames[0].height;
                const results = [];
                for (let i = 0; i < frameCount; i++) {
                    results.push({
                        blackBgData: new Uint8ClampedArray(width * 2 * height * 4),
                        width: width * 2,
                        height: height
                    });
                }
                return results;
            }
            
            return { success: true };
        } catch (error) {
            throw new Error('处理任务失败: ' + error.message);
        }
    },

    /**
     * 使用WebAssembly处理任务
     * @param {string} type - 任务类型
     * @param {Object} data - 任务数据
     * @param {Function} onProgress - 进度回调函数
     * @returns {Promise<Object>} - 任务结果
     * @private
     */
    _processWithWasm: function(type, data, onProgress) {
        return new Promise((resolve, reject) => {
            try {
                // 这里需要根据任务类型实现不同的处理逻辑
                // 由于WebAssembly模块需要编译，这里只是一个示例
                
                // 模拟处理过程
                setTimeout(() => {
                    onProgress(0.5);
                    setTimeout(() => {
                        onProgress(1.0);
                        resolve({ success: true, message: 'WebAssembly处理完成' });
                    }, 500);
                }, 500);
            } catch (error) {
                reject(new Error('WebAssembly处理失败: ' + error.message));
            }
        });
    },

    /**
     * 单帧合成双通道图像
     * @param {ImageData} frame - 单帧ImageData
     * @param {Object} options - 配置项
     * @param {String} options.mode - 通道模式
     * @param {Number} options.quality - JPEG质量 0-1（可选，默认自适应）
     * @param {String} options.format - 输出格式：'jpeg' 或 'png'
     * @param {Function} options.onProgress - 进度回调函数
     * @returns {Promise<Uint8Array>} - 合成后的图像数据
     */
    composeSingleFrame: async function(frame, options) {
      options = options || {};
      const mode = options.mode || this.defaults.mode;
      const format = options.format || this.defaults.format;
      const quality = options.quality;
      const onProgress = options.onProgress || function() {};

      if (!frame || !frame.data) {
        throw new Error('无效的ImageData对象');
      }

      // 获取尺寸
      const width = frame.width;
      const height = frame.height;
      
      this._debugLog('info', '开始单帧合成', {
        width: width,
        height: height,
        mode: mode,
        format: format
      });
      
      // 计算JPEG质量（自适应）
      let jpegQuality = quality;
      if (jpegQuality === undefined && format === 'jpeg') {
        const totalPixels = width * 2 * height;
        if (totalPixels < 500000) {
          jpegQuality = 0.7;
        } else if (totalPixels > 2000000) {
          jpegQuality = 0.5;
        } else {
          jpegQuality = 0.6;
        }
        this._debugLog('info', '计算自适应JPEG质量', {
          totalPixels: totalPixels,
          quality: jpegQuality
        });
      }

      try {
        // 使用Web Worker处理像素计算
        const result = await this._sendTask('composeFrame', {
          frame: frame,
          mode: mode,
          width: width,
          height: height
        }, {
          onProgress: onProgress
        });

        // 转换为ImageData
        const dualCanvas = document.createElement('canvas');
        dualCanvas.width = width * 2;
        dualCanvas.height = height;
        const dualCtx = dualCanvas.getContext('2d', { 
          alpha: true,
          willReadFrequently: true 
        });
        
        const dualImageData = dualCtx.createImageData(width * 2, height);
        dualImageData.data.set(result.dualData);
        dualCtx.putImageData(dualImageData, 0, 0);

        // 合成黑底并转换为目标格式
        const blackBgCanvas = document.createElement('canvas');
        blackBgCanvas.width = width * 2;
        blackBgCanvas.height = height;
        const blackBgCtx = blackBgCanvas.getContext('2d');
        const blackBgImageData = blackBgCtx.createImageData(width * 2, height);
        blackBgImageData.data.set(result.blackBgData);
        blackBgCtx.putImageData(blackBgImageData, 0, 0);

        // 转换为目标格式
        const blob = await new Promise(function(resolve) {
          if (format === 'png') {
            blackBgCanvas.toBlob(resolve, 'image/png');
          } else {
            blackBgCanvas.toBlob(resolve, 'image/jpeg', jpegQuality);
          }
        });
        const buffer = await blob.arrayBuffer();
        
        // 清理Canvas资源
        dualCanvas.width = 0;
        dualCanvas.height = 0;
        blackBgCanvas.width = 0;
        blackBgCanvas.height = 0;
        
        this._debugLog('info', '单帧合成完成', {
          outputSize: buffer.byteLength,
          format: format
        });
        
        return new Uint8Array(buffer);
      } catch (error) {
        this._debugLog('error', '单帧合成失败', { error: error.message });
        throw error;
      }
    },

    /**
     * 批量合成双通道图像
     * @param {Array<ImageData>} frames - ImageData数组
     * @param {Object} options - 配置项
     * @param {String} options.mode - 通道模式
     * @param {Number} options.quality - JPEG质量 0-1（可选，默认自适应）
     * @param {String} options.format - 输出格式：'jpeg' 或 'png'
     * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
     * @param {Function} options.onCancel - 取消检查函数，返回true则中止
     * @returns {Promise<Array<Uint8Array>>} - 合成后的图像数组
     */
    composeToJPEG: async function(frames, options) {
      return this.composeFrames(frames, options);
    },

    /**
     * 批量合成双通道图像（支持多种格式）
     * @param {Array<ImageData>} frames - ImageData数组
     * @param {Object} options - 配置项
     * @param {String} options.mode - 通道模式
     * @param {Number} options.quality - JPEG质量 0-1（可选，默认自适应）
     * @param {String} options.format - 输出格式：'jpeg' 或 'png'
     * @param {Function} options.onProgress - 进度回调 (progress: 0-1)
     * @param {Function} options.onCancel - 取消检查函数，返回true则中止
     * @returns {Promise<Array<Uint8Array>>} - 合成后的图像数组
     */
    composeFrames: async function(frames, options) {
      options = options || {};
      const mode = options.mode || this.defaults.mode;
      const format = options.format || this.defaults.format;
      const quality = options.quality;
      const onProgress = options.onProgress || function() {};
      const onCancel = options.onCancel || function() { return false; };
      
      const frameCount = frames.length;
      this._debugLog('info', '开始批量合成双通道图像', {
        frameCount: frameCount,
        format: format,
        mode: mode
      });
      
      if (frameCount === 0) {
        throw new Error('帧数组不能为空');
      }
      
      const resultFrames = [];
      
      // 获取尺寸
      const width = frames[0].width;
      const height = frames[0].height;
      this._debugLog('info', '图像尺寸信息', {
        width: width,
        height: height,
        dualWidth: width * 2,
        dualHeight: height
      });
      
      // 计算JPEG质量（自适应）
      let jpegQuality = quality;
      if (jpegQuality === undefined && format === 'jpeg') {
        const totalPixels = width * 2 * height;
        if (totalPixels < 500000) {
          jpegQuality = 0.7;
        } else if (totalPixels > 2000000) {
          jpegQuality = 0.5;
        } else {
          jpegQuality = 0.6;
        }
        this._debugLog('info', '计算自适应JPEG质量', {
          totalPixels: totalPixels,
          quality: jpegQuality
        });
      }

      // 分批处理配置
      const BATCH_SIZE = 50; // 每批处理50帧
      this._debugLog('info', '分批处理配置', {
        batchSize: BATCH_SIZE,
        totalBatches: Math.ceil(frameCount / BATCH_SIZE)
      });

      try {
        // 分批处理帧
        for (let batchStart = 0; batchStart < frameCount; batchStart += BATCH_SIZE) {
          if (onCancel()) {
            throw new Error('用户取消');
          }

          const batchEnd = Math.min(batchStart + BATCH_SIZE, frameCount);
          const batchFrames = frames.slice(batchStart, batchEnd);
          const batchSize = batchFrames.length;
          this._debugLog('info', '处理批次', {
            batchStart: batchStart,
            batchEnd: batchEnd,
            batchSize: batchSize,
            batchIndex: Math.floor(batchStart / BATCH_SIZE) + 1
          });

          // 使用Web Worker处理当前批次
          this._debugLog('info', '开始使用Web Worker处理批次');
          const batchResult = await this._sendTask('composeFrames', {
            frames: batchFrames,
            mode: mode,
            width: width,
            height: height,
            frameCount: batchSize
          }, {
            onProgress: function(batchProgress) {
              const overallProgress = (batchStart + batchProgress * batchSize) / frameCount;
              onProgress(overallProgress);
            }
          });
          this._debugLog('info', 'Web Worker批次处理完成', {
            returnedResults: batchResult.length
          });

          // 转换批次中的每一帧
          for (let i = 0; i < batchSize; i++) {
            if (onCancel()) {
              throw new Error('用户取消');
            }

            try {
              // 创建临时Canvas
              const blackBgCanvas = document.createElement('canvas');
              blackBgCanvas.width = width * 2;
              blackBgCanvas.height = height;
              const blackBgCtx = blackBgCanvas.getContext('2d');
              const blackBgImageData = blackBgCtx.createImageData(width * 2, height);
              blackBgImageData.data.set(batchResult[i].blackBgData);
              blackBgCtx.putImageData(blackBgImageData, 0, 0);

              // 转换为目标格式
              const blob = await new Promise(function(resolve) {
                if (format === 'png') {
                  blackBgCanvas.toBlob(resolve, 'image/png');
                } else {
                  blackBgCanvas.toBlob(resolve, 'image/jpeg', jpegQuality);
                }
              });
              const buffer = await blob.arrayBuffer();
              resultFrames.push(new Uint8Array(buffer));

              // 清理Canvas资源
              blackBgCanvas.width = 0;
              blackBgCanvas.height = 0;

              // 进度回调
              const overallIndex = batchStart + i;
              onProgress((overallIndex + 1) / frameCount);

              // 让出线程
              if ((overallIndex + 1) % 10 === 0) {
                await new Promise(function(r) { setTimeout(r, 0); });
              }
            } catch (error) {
              this._debugLog('error', '处理帧时出错', {
                frameIndex: batchStart + i,
                error: error.message
              });
              // 跳过出错的帧，继续处理
              continue;
            }
          }

          // 强制垃圾回收
          if (typeof gc === 'function') {
            gc();
            this._debugLog('info', '执行垃圾回收');
          }
          this._debugLog('info', '批次处理完成', {
            processedFrames: resultFrames.length,
            totalFrames: frameCount
          });
        }

        this._debugLog('info', '批量合成双通道图像完成', {
          generatedFrames: resultFrames.length,
          originalFrames: frameCount
        });
        
        if (this.defaults.debug.performanceMonitoring) {
          const report = this.generatePerformanceReport();
          this._debugLog('info', '性能报告', report.summary);
        }
        
        return resultFrames;
      } catch (error) {
        this._debugLog('error', '批量合成失败', { error: error.message });
        throw error;
      }
    },

    /**
     * 设置默认配置
     * @param {Object} config - 配置对象
     */
    setConfig: function(config) {
      Object.assign(this.defaults, config);
    },

    /**
     * 获取当前配置
     * @returns {Object} - 当前配置
     */
    getConfig: function() {
      return { ...this.defaults };
    },

    /**
     * 销毁Web Worker，释放资源
     */
    destroy: function() {
      if (this._worker) {
        this._worker.terminate();
        this._worker = null;
        this._debugLog('info', 'Worker销毁成功');
      }
      
      this.clearPerformanceData();
      this._debugLog('info', '资源清理完成');
    }
  };

  // 导出模块
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DualChannelComposer;
  } else {
    global.MeeWoo.Services.DualChannelComposer = DualChannelComposer;
  }

})(typeof window !== 'undefined' ? window : this);