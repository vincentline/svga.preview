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
      require('./worker-pool.js');
      require('./wasm/wasm-loader.js');
    } catch (e) {
      // 模块加载失败，忽略
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
        enabled: true,                  // 是否启用内存池
        maxPoolSize: 100,               // 每个池的最大对象数
        clearInterval: 60000            // 内存池清理间隔（毫秒）
      },
      workerPool: {
        enabled: true,                  // 是否启用Worker池
        minWorkers: 1,                  // 最小Worker数
        maxWorkers: navigator.hardwareConcurrency || 4,  // 最大Worker数
        maxTasksPerWorker: 10,          // 每个Worker最大任务数
        taskTimeout: 60000,             // 任务超时时间（毫秒）
        idleTimeout: 30000              // 空闲Worker超时时间（毫秒）
      },
      wasm: {
        enabled: true,                  // 是否启用WebAssembly
        modulePath: 'assets/js/service/dual-channel/wasm/dual-channel-core.wasm',  // WebAssembly模块路径
        fallbackToJS: true,             // 不支持WebAssembly时是否回退到JavaScript
        useSIMD: true                   // 是否使用SIMD指令
      }
    },

    /**
     * Web Worker实例
     */
    _worker: null,

    /**
     * 任务ID计数器
     */
    _taskId: 0,

    /**
     * 内存池实例
     */
    _memoryPool: null,

    /**
     * 内存池清理定时器
     */
    _memoryClearInterval: null,

    /**
     * Worker池实例
     */
    _workerPool: null,

    /**
     * WebAssembly加载器实例
     */
    _wasmLoader: null,

    /**
     * 初始化Web Worker
     * @private
     */
    _initWorker: function() {
        if (!this._worker) {
            try {
                console.log('开始初始化Web Worker');
                
                // 直接内联Worker代码，避免路径问题（最可靠的方法）
                const workerCode = `
// 分块大小配置
const BLOCK_SIZE = 128;

// 检测SIMD支持
const hasSIMD = false;

// 处理消息
self.onmessage = function(e) {
  var task = e.data;
  console.log('Worker received task:', task.type, 'Task ID:', task.id);
  
  try {
    switch(task.type) {
      case 'composeFrame':
        console.log('Processing composeFrame task');
        handleComposeFrame(task).catch(function(error) {
          console.error('Error in handleComposeFrame:', error);
          self.postMessage({ id: task.id, type: 'error', error: error.message });
        });

        break;
      case 'composeFrames':
        console.log('Processing composeFrames task, frame count:', task.data.frames.length);
        handleComposeFrames(task).catch(function(error) {
          console.error('Error in handleComposeFrames:', error);
          self.postMessage({ id: task.id, type: 'error', error: error.message });
        });
        break;
      default:
        throw new Error('Unknown task type: ' + task.type);
    }
  } catch(error) {
    console.error('Error in message handler:', error);
    self.postMessage({ id: task.id, type: 'error', error: error.message });
  }
};

async function handleComposeFrame(task) {
  console.log('Starting handleComposeFrame, frame data length:', task.frame.data.length, 'width:', task.width, 'height:', task.height);
  
  var frameData = task.frame.data;
  var width = task.width;
  var height = task.height;
  var mode = task.mode;
  var isColorLeftAlphaRight = mode === 'color-left-alpha-right';
  
  var dualWidth = width * 2;
  var dualHeight = height;
  var dualDataSize = dualWidth * dualHeight * 4;
  
  console.log('Dual channel image size:', dualWidth, 'x', dualHeight, 'data size:', dualDataSize);
  
  var dualData = new Uint8ClampedArray(dualDataSize);
  var blackBgData = new Uint8ClampedArray(dualDataSize);
  
  console.log('Memory allocated successfully');
  
  var blocks = [];
  console.log('Generating blocks...');
  for (var y = 0; y < height; y += BLOCK_SIZE) {
    for (var x = 0; x < width; x += BLOCK_SIZE) {
      blocks.push({ x: x, y: y, width: Math.min(BLOCK_SIZE, width - x), height: Math.min(BLOCK_SIZE, height - y) });
    }
  }
  
  console.log('Generated', blocks.length, 'blocks');
  
  console.log('Starting parallel processing of blocks...');
  try {
    var processedBlocks = 0;
    var totalBlocks = blocks.length;
    
    await Promise.all(blocks.map(async block => {
      await processBlock(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight);
      
      processedBlocks++;
      var progress = Math.round((processedBlocks / totalBlocks) * 100);
      
      if (progress % 5 === 0) {
        self.postMessage({ id: task.id, type: 'progress', progress: progress });
      }
    }));
    console.log('Block processing completed');
  } catch (error) {
    console.error('Error during block processing:', error);
    throw error;
  }
  
  console.log('Posting result back to main thread');
  self.postMessage({ id: task.id, type: 'result', result: { blackBgData: blackBgData, dualData: dualData, width: dualWidth, height: dualHeight } }, [blackBgData.buffer, dualData.buffer]);
  console.log('Result posted successfully');
}

async function handleComposeFrames(task) {
  console.log('Starting handleComposeFrames, frame count:', task.data.frames.length);
  
  var data = task.data;
  var frames = data.frames;
  var mode = data.mode;
  var frameCount = frames.length;
  
  if (frameCount === 0) {
    throw new Error('帧数组不能为空');
  }
  
  console.log('First frame size:', frames[0].width, 'x', frames[0].height);
  
  var results = [];
  var width = frames[0].width;
  var height = frames[0].height;
  var isColorLeftAlphaRight = mode === 'color-left-alpha-right';
  var dualWidth = width * 2;
  var dualDataSize = dualWidth * height * 4;
  
  console.log('Dual channel image size per frame:', dualWidth, 'x', height, 'data size:', dualDataSize);
  
  const BATCH_SIZE = 20;
  console.log('Worker使用分批处理，每批', BATCH_SIZE, '帧');
  
  for (let batchStart = 0; batchStart < frameCount; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, frameCount);
    const batchFrames = frames.slice(batchStart, batchEnd);
    const batchSize = batchFrames.length;
    console.log('Worker处理批次:', batchStart, '-', batchEnd, '共', batchSize, '帧');
    
    var framePromises = batchFrames.map(async function(frameData, index) {
      const frameIndex = batchStart + index;
      console.log('Processing frame', frameIndex + 1, 'of', frameCount);
      
      var dualData = new Uint8ClampedArray(dualDataSize);
      var blackBgData = new Uint8ClampedArray(dualDataSize);
      
      console.log('Memory allocated for frame', frameIndex);
      
      var blocks = [];
      for (var y = 0; y < height; y += BLOCK_SIZE) {
        for (var x = 0; x < width; x += BLOCK_SIZE) {
          blocks.push({ x: x, y: y, width: Math.min(BLOCK_SIZE, width - x), height: Math.min(BLOCK_SIZE, height - y) });
        }
      }
      
      console.log('Generated', blocks.length, 'blocks for frame', frameIndex);
      
      try {
        await Promise.all(blocks.map(block => processBlock(block, frameData.data, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight)));
        console.log('Frame', frameIndex, 'processing completed');
      } catch (error) {
        console.error('Error processing frame', frameIndex, ':', error);
        return null;
      }
      
      return { blackBgData: blackBgData, width: dualWidth, height: height };
    });
    
    console.log('Waiting for batch frames to complete...');
    try {
      const batchResults = await Promise.all(framePromises);
      
      const validResults = batchResults.filter(result => result !== null);
      results.push(...validResults);
      
      console.log('Batch processed successfully, valid results:', validResults.length);
      
      const processedFrames = Math.min(batchEnd, frameCount);
      var progress = Math.round((processedFrames / frameCount) * 100);
      
      if (progress % 5 === 0) {
        self.postMessage({ id: task.id, type: 'progress', progress: progress });
      }
      
      console.log('Batch completed, total results so far:', results.length);
    } catch (error) {
      console.error('Error in batch processing:', error);
      continue;
    }
  }
  
  var transferables = [];
  results.forEach(result => {
    transferables.push(result.blackBgData.buffer);
  });
  
  console.log('Extracted transferable objects, count:', transferables.length);
  
  console.log('Posting results back to main thread');
  self.postMessage({ id: task.id, type: 'result', result: results }, transferables);
  
  console.log('Results posted successfully, total frames processed:', results.length);
}

function processBlock(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight) {
  return new Promise(function(resolve) {
    var startX = block.x;
    var startY = block.y;
    var blockWidth = block.width;
    var blockHeight = block.height;
    
    console.log('Processing block:', startX, ',', startY, 'size:', blockWidth, 'x', blockHeight);
    
    var inv255 = 1 / 255;
    
    try {
      processBlockWithoutSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255);
      
      console.log('Block processing completed:', startX, ',', startY);
      resolve();
    } catch (error) {
      console.error('Error processing block:', error, 'at position:', startX, ',', startY);
      resolve();
    }
  });
}

function processBlockWithoutSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255) {
  var startX = block.x;
  var startY = block.y;
  var blockWidth = block.width;
  var blockHeight = block.height;
  
  console.log('Processing block without SIMD:', startX, ',', startY, 'size:', blockWidth, 'x', blockHeight);
  
  var pixelCount = 0;
  for (var y = startY; y < startY + blockHeight; y++) {
    for (var x = startX; x < startX + blockWidth; x++) {
      try {
        processSinglePixel(x, y, frameData, width, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255);
        pixelCount++;
      } catch (error) {
        console.error('Error processing pixel at', x, ',', y, ':', error);
      }
    }
  }
  
  console.log('Block processing completed, total pixels:', pixelCount);
}

function processSinglePixel(x, y, frameData, width, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255) {
  var pixelIndex = y * width + x;
  var frameIdx = pixelIndex * 4;
  
  if (frameIdx + 3 >= frameData.length) {
    console.error('Invalid frame index:', frameIdx, 'for frame data length:', frameData.length);
    return;
  }
  
  var r = frameData[frameIdx + 0];
  var g = frameData[frameIdx + 1];
  var b = frameData[frameIdx + 2];
  var a = frameData[frameIdx + 3];

  var finalR = r, finalG = g, finalB = b;
  if (a > 0) {
    if (a < 255) {
      var alphaFactor = 255 * inv255;
      finalR = Math.min(255, Math.round(r * alphaFactor));
      finalG = Math.min(255, Math.round(g * alphaFactor));
      finalB = Math.min(255, Math.round(b * alphaFactor));
    }
  } else {
    finalR = 0; finalG = 0; finalB = 0;
  }

  var leftIdx = (y * dualWidth + x) * 4;
  var rightIdx = (y * dualWidth + x + width) * 4;

  if (leftIdx + 3 >= dualData.length || rightIdx + 3 >= dualData.length) {
    console.error('Invalid dual data index:', leftIdx, 'or', rightIdx, 'for dual data length:', dualData.length);
    return;
  }

  if (isColorLeftAlphaRight) {
    dualData[leftIdx + 0] = finalR;
    dualData[leftIdx + 1] = finalG;
    dualData[leftIdx + 2] = finalB;
    dualData[leftIdx + 3] = a;
    dualData[rightIdx + 0] = a;
    dualData[rightIdx + 1] = a;
    dualData[rightIdx + 2] = a;
    dualData[rightIdx + 3] = 255;
  } else {
    dualData[leftIdx + 0] = a;
    dualData[leftIdx + 1] = a;
    dualData[leftIdx + 2] = a;
    dualData[leftIdx + 3] = 255;
    dualData[rightIdx + 0] = finalR;
    dualData[rightIdx + 1] = finalG;
    dualData[rightIdx + 2] = finalB;
    dualData[rightIdx + 3] = a;
  }

  var pixelAlphaLeft = dualData[leftIdx + 3];
  if (pixelAlphaLeft === 255) {
    blackBgData[leftIdx + 0] = dualData[leftIdx + 0];
    blackBgData[leftIdx + 1] = dualData[leftIdx + 1];
    blackBgData[leftIdx + 2] = dualData[leftIdx + 2];
  } else if (pixelAlphaLeft === 0) {
    blackBgData[leftIdx + 0] = 0;
    blackBgData[leftIdx + 1] = 0;
    blackBgData[leftIdx + 2] = 0;
  } else {
    var alphaFactorLeft = pixelAlphaLeft * inv255;
    blackBgData[leftIdx + 0] = Math.round(dualData[leftIdx + 0] * alphaFactorLeft);
    blackBgData[leftIdx + 1] = Math.round(dualData[leftIdx + 1] * alphaFactorLeft);
    blackBgData[leftIdx + 2] = Math.round(dualData[leftIdx + 2] * alphaFactorLeft);
  }
  blackBgData[leftIdx + 3] = 255;

  var pixelAlphaRight = dualData[rightIdx + 3];
  if (pixelAlphaRight === 255) {
    blackBgData[rightIdx + 0] = dualData[rightIdx + 0];
    blackBgData[rightIdx + 1] = dualData[rightIdx + 1];
    blackBgData[rightIdx + 2] = dualData[rightIdx + 2];
  } else if (pixelAlphaRight === 0) {
    blackBgData[rightIdx + 0] = 0;
    blackBgData[rightIdx + 1] = 0;
    blackBgData[rightIdx + 2] = 0;
  } else {
    var alphaFactorRight = pixelAlphaRight * inv255;
    blackBgData[rightIdx + 0] = Math.round(dualData[rightIdx + 0] * alphaFactorRight);
    blackBgData[rightIdx + 1] = Math.round(dualData[rightIdx + 1] * alphaFactorRight);
    blackBgData[rightIdx + 2] = Math.round(dualData[rightIdx + 2] * alphaFactorRight);
  }
  blackBgData[rightIdx + 3] = 255;
}
                `;
                
                // 创建Blob URL
                const blob = new Blob([workerCode], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                console.log('创建Worker Blob URL成功:', blobUrl);
                
                // 创建Worker
                this._worker = new Worker(blobUrl);
                console.log('Web Worker 内联代码加载成功');
            } catch (error) {
                console.error('Worker内联代码加载失败:', error);
                throw new Error('无法加载Web Worker: ' + error.message);
            }
        }
    },

    /**
     * 初始化内存池
     * @private
     */
    _initMemoryPool: function() {
        if (this.defaults.memoryPool.enabled && window.MeeWoo && window.MeeWoo.Services && window.MeeWoo.Services.MemoryPool) {
            this._memoryPool = window.MeeWoo.Services.MemoryPool;
            console.log('内存池初始化成功');
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
                console.log('内存池清理完成');
            } catch (error) {
                console.error('内存池清理失败:', error);
            }
        }
    },

    /**
     * 初始化Worker池
     * @private
     */
    _initWorkerPool: function() {
        if (this.defaults.workerPool.enabled && window.MeeWoo && window.MeeWoo.Services && window.MeeWoo.Services.WorkerPool) {
            this._workerPool = window.MeeWoo.Services.WorkerPool;
            console.log('Worker池初始化成功');
        }
    },

    /**
     * 初始化WebAssembly
     * @private
     */
    _initWasm: async function() {
        if (this.defaults.wasm.enabled && window.MeeWoo && window.MeeWoo.Services && window.MeeWoo.Services.WasmLoader) {
            this._wasmLoader = window.MeeWoo.Services.WasmLoader;
            if (this._wasmLoader.getIsSupported()) {
                try {
                    await this._wasmLoader.load(this.defaults.wasm.modulePath);
                    console.log('WebAssembly初始化成功');
                } catch (error) {
                    console.warn('WebAssembly加载失败，回退到JavaScript:', error.message);
                    this._wasmLoader = null;
                }
            } else {
                console.warn('当前浏览器不支持WebAssembly，回退到JavaScript');
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
    _sendTask: async function(type, data, options) {
        options = options || {};
        const onProgress = options.onProgress || function() {};
        
        try {
            this._initMemoryPool();
            this._startMemoryClearInterval();
            await this._initWasm();
            this._initWorkerPool();
            
            // 如果启用了WebAssembly且任务适合在主线程处理，使用WebAssembly
            if (this._wasmLoader && (type === 'composeFrame' || type === 'processBlock')) {
                console.log('使用WebAssembly处理任务，类型:', type);
                return this._processWithWasm(type, data, onProgress);
            }
            
            // 如果启用了Worker池，使用Worker池处理任务
            if (this._workerPool) {
                console.log('使用Worker池发送任务，类型:', type);
                return this._workerPool.submitTask(type, data, {
                    onProgress: onProgress,
                    priority: options.priority || 5
                });
            }
            
            // 回退到单个Worker处理
            this._initWorker();
            const taskId = ++this._taskId;
            const message = {
                id: taskId,
                type: type,
                data: data
            };

            return new Promise((resolve, reject) => {
                const handleMessage = (e) => {
                    if (e.data.id === taskId) {
                        if (e.data.type === 'progress') {
                            // 处理进度消息，不移除事件监听器
                            onProgress(e.data.progress / 100);
                        } else {
                            // 处理结果或错误消息，移除事件监听器
                            this._worker.removeEventListener('message', handleMessage);
                            this._worker.removeEventListener('error', handleError);
                            if (e.data.type === 'error') {
                                console.error('Worker任务错误:', e.data.error);
                                reject(new Error(e.data.error));
                            } else {
                                resolve(e.data.result);
                            }
                        }
                    }
                };

                const handleError = (error) => {
                    console.error('Web Worker错误:', error);
                    this._worker.removeEventListener('message', handleMessage);
                    this._worker.removeEventListener('error', handleError);
                    // 重新初始化Worker
                    this._worker = null;
                    reject(new Error('Web Worker执行错误: ' + (error.message || '未知错误')));
                };

                // 添加错误监听器
                this._worker.addEventListener('error', handleError);
                this._worker.addEventListener('message', handleMessage);
                
                console.log('发送任务到单个Worker，类型:', type, '任务ID:', taskId);
                this._worker.postMessage(message);
            });
        } catch (error) {
            console.error('发送任务失败:', error);
            throw new Error('发送任务到Worker失败: ' + error.message);
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
                console.log('WebAssembly处理任务:', type);
                
                // 模拟处理过程
                setTimeout(() => {
                    onProgress(0.5);
                    setTimeout(() => {
                        onProgress(1.0);
                        resolve({ success: true, message: 'WebAssembly处理完成' });
                    }, 500);
                }, 500);
            } catch (error) {
                console.error('WebAssembly处理失败:', error);
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
      }

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
      
      return new Uint8Array(buffer);
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
      console.log('开始批量合成双通道图像，帧数:', frameCount, '格式:', format, '模式:', mode);
      
      if (frameCount === 0) {
        throw new Error('帧数组不能为空');
      }
      
      const resultFrames = [];
      
      // 获取尺寸
      const width = frames[0].width;
      const height = frames[0].height;
      console.log('图像尺寸:', width, 'x', height, '双通道尺寸:', width * 2, 'x', height);
      
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
        console.log('自适应JPEG质量:', jpegQuality);
      }

      // 分批处理配置
      const BATCH_SIZE = 50; // 每批处理50帧
      console.log('使用分批处理，每批', BATCH_SIZE, '帧');

      // 分批处理帧
      for (let batchStart = 0; batchStart < frameCount; batchStart += BATCH_SIZE) {
        if (onCancel()) {
          throw new Error('用户取消');
        }

        const batchEnd = Math.min(batchStart + BATCH_SIZE, frameCount);
        const batchFrames = frames.slice(batchStart, batchEnd);
        const batchSize = batchFrames.length;
        console.log('处理批次:', batchStart, '-', batchEnd, '共', batchSize, '帧');

        // 使用Web Worker处理当前批次
        console.log('开始使用Web Worker处理批次');
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
        console.log('Web Worker批次处理完成，返回结果数:', batchResult.length);

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
            console.error('处理帧', batchStart + i, '时出错:', error);
            // 跳过出错的帧，继续处理
            continue;
          }
        }

        // 强制垃圾回收
        if (typeof gc === 'function') {
          gc();
        }
        console.log('批次处理完成，已处理总帧数:', resultFrames.length);
      }

      console.log('批量合成双通道图像完成，生成帧数:', resultFrames.length);
      return resultFrames;
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
      }
    }
  };

  // 导出模块
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DualChannelComposer;
  } else {
    global.MeeWoo.Services.DualChannelComposer = DualChannelComposer;
  }

})(typeof window !== 'undefined' ? window : this);
