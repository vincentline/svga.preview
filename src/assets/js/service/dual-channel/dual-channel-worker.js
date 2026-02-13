/**
 * Dual Channel Worker - 双通道图像合成器 工作线程
 */

console.log('[DualChannelWorker] Worker脚本开始加载...');

try {
  console.log('[DualChannelWorker] Worker脚本加载成功');
} catch (e) {
  console.error('[DualChannelWorker] Worker脚本加载错误:', e);
}

// 内存池管理（Worker内部）
class MemoryPool {
  constructor() {
    this.pools = new Map();
    this.maxPoolSize = 50;
    this.minBufferSize = 1024;
    this.maxBufferSize = 1024 * 1024 * 50; // 50MB
  }

  getBuffer(size) {
    if (size <= 0 || size > this.maxBufferSize) {
      return new Uint8ClampedArray(size);
    }

    const roundedSize = this._roundUpToPowerOfTwo(size);
    const key = `Uint8ClampedArray_${roundedSize}`;

    if (this.pools.has(key) && this.pools.get(key).length > 0) {
      const pool = this.pools.get(key);
      return pool.pop();
    }

    return new Uint8ClampedArray(roundedSize);
  }

  recycleBuffer(buffer) {
    if (!buffer || !buffer.buffer) {
      return;
    }

    const size = buffer.length;
    if (size <= 0 || size > this.maxBufferSize) {
      return;
    }

    const roundedSize = this._roundUpToPowerOfTwo(size);
    const key = `Uint8ClampedArray_${roundedSize}`;

    if (!this.pools.has(key)) {
      this.pools.set(key, []);
    }

    const pool = this.pools.get(key);
    if (pool.length < this.maxPoolSize) {
      // 重置缓冲区
      buffer.fill(0);
      pool.push(buffer);
    }
  }

  clear() {
    this.pools.forEach(pool => {
      pool.length = 0;
    });
    this.pools.clear();
  }

  _roundUpToPowerOfTwo(size) {
    if (size <= this.minBufferSize) {
      return this.minBufferSize;
    }
    size--;
    size |= size >> 1;
    size |= size >> 2;
    size |= size >> 4;
    size |= size >> 8;
    size |= size >> 16;
    size++;
    return size;
  }
}

// 全局内存池实例
const memoryPool = new MemoryPool();

// 分块大小配置
const BLOCK_SIZE = 128; // 128x128像素的块

// 检测SIMD支持 - 注意：JavaScript SIMD API已被废弃，这里仅作为预留
const hasSIMD = false; // 暂时禁用SIMD，因为JavaScript SIMD API已被废弃
// 可以考虑在未来使用WebAssembly SIMD替代

// 处理消息
self.onmessage = function(e) {
  var task = e.data;
  
  console.log('Worker received task:', task.type, 'Task ID:', task.id);
  console.log('Task data structure:', {
    hasId: !!task.id,
    hasType: !!task.type,
    hasData: !!task.data,
    hasFrames: !!(task.frames || (task.data && task.data.frames)),
    hasDirectFrames: !!task.frames,
    hasNestedFrames: !!(task.data && task.data.frames)
  });
  
  // 内存使用监控
  if (performance && performance.memory) {
    console.log('Worker memory usage:', {
      usedJSHeapSize: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
      totalJSHeapSize: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
      jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB'
    });
  }
  
  try {
    // 验证任务数据结构
    if (!task || !task.id || !task.type) {
      var errorMsg = 'Invalid task structure: missing ' + 
        (!task ? 'task object' : !task.id ? 'id' : 'type');
      console.error(errorMsg);
      self.postMessage({
        id: task ? task.id : null,
        type: 'error',
        error: errorMsg,
        details: {
          taskStructure: task ? Object.keys(task) : [],
          timestamp: Date.now()
        }
      });
      return;
    }
    
    switch(task.type) {
      case 'composeFrame':
        console.log('Processing composeFrame task');
        handleComposeFrame(task).catch(function(error) {
          console.error('Error in handleComposeFrame:', error);
          console.error('Error stack:', error.stack);
          self.postMessage({
            id: task.id,
            type: 'error',
            error: error.message,
            details: {
              stack: error.stack,
              timestamp: Date.now()
            }
          });
        });
        break;
      case 'composeFrames':
        console.log('Processing composeFrames task');
        handleComposeFrames(task).catch(function(error) {
          console.error('Error in handleComposeFrames:', error);
          console.error('Error stack:', error.stack);
          self.postMessage({
            id: task.id,
            type: 'error',
            error: error.message,
            details: {
              stack: error.stack,
              timestamp: Date.now()
            }
          });
        });
        break;
      case 'clearMemory':
        console.log('Clearing memory pool');
        memoryPool.clear();
        self.postMessage({
          id: task.id,
          type: 'success',
          details: {
            timestamp: Date.now()
          }
        });
        break;
      default:
        var unknownTypeError = new Error('Unknown task type: ' + task.type);
        console.error('Unknown task type:', task.type);
        console.error('Error stack:', unknownTypeError.stack);
        self.postMessage({
          id: task.id,
          type: 'error',
          error: unknownTypeError.message,
          details: {
            stack: unknownTypeError.stack,
            timestamp: Date.now()
          }
        });
        break;
    }
  } catch(error) {
    console.error('Error in message handler:', error);
    console.error('Error stack:', error.stack);
    self.postMessage({
      id: task ? task.id : null,
      type: 'error',
      error: error.message,
      details: {
        stack: error.stack,
        taskStructure: task ? Object.keys(task) : [],
        timestamp: Date.now()
      }
    });
  }
};

/**
 * 处理单个帧的合成
 */
async function handleComposeFrame(task) {
  try {
    // 统一数据结构：先尝试 task.data，再尝试直接属性
    var taskData = task.data || task;
    var frame = taskData.frame;
    var width = taskData.width;
    var height = taskData.height;
    var mode = taskData.mode;
    
    // 验证数据
    if (!frame || !frame.data) {
      console.error('Missing frame data. Task structure:', {
        hasData: !!task.data,
        hasFrame: !!task.frame,
        hasDataFrame: !!(task.data && task.data.frame),
        taskKeys: Object.keys(task)
      });
      throw new Error('Missing frame data');
    }
    if (!width || !height) {
      console.error('Missing width or height:', { width, height });
      throw new Error('Missing width or height');
    }
    if (!mode) {
      console.error('Missing mode. Task structure:', {
        hasData: !!task.data,
        hasMode: !!task.mode,
        hasDataMode: !!(task.data && task.data.mode)
      });
      throw new Error('Missing mode');
    }
    
    console.log('Starting handleComposeFrame, frame data length:', frame.data.length, 'width:', width, 'height:', height, 'mode:', mode);
    
    var frameData = frame.data;
    var isColorLeftAlphaRight = mode === 'color-left-alpha-right';
    
    // 计算双通道图像大小
    var dualWidth = width * 2;
    var dualHeight = height;
    var dualDataSize = dualWidth * dualHeight * 4;
    
    console.log('Dual channel image size:', dualWidth, 'x', dualHeight, 'data size:', dualDataSize);
    
    // 内存优化：使用内存池分配缓冲区
    var dualData = memoryPool.getBuffer(dualDataSize);
    var blackBgData = memoryPool.getBuffer(dualDataSize);
    
    console.log('Memory allocated successfully');
    
    // 分块处理优化：将图像分成多个块并行处理
    var blocks = [];
    console.log('Generating blocks...');
    for (var y = 0; y < height; y += BLOCK_SIZE) {
      for (var x = 0; x < width; x += BLOCK_SIZE) {
        blocks.push({
          x: x,
          y: y,
          width: Math.min(BLOCK_SIZE, width - x),
          height: Math.min(BLOCK_SIZE, height - y)
        });
      }
    }
    
    console.log('Generated', blocks.length, 'blocks');
    
    // 并行处理所有块
    console.log('Starting parallel processing of blocks...');
    var processedBlocks = 0;
    var totalBlocks = blocks.length;
    
    await Promise.all(blocks.map(async block => {
      await processBlock(
        block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight
      );
      
      // 报告进度
      processedBlocks++;
      var progress = Math.round((processedBlocks / totalBlocks) * 100);
      
      // 每5%的进度报告一次，避免过多的消息传递
      if (progress % 5 === 0) {
        self.postMessage({
          id: task.id,
          type: 'progress',
          progress: progress
        });
      }
    }));
    console.log('Block processing completed');
    
    console.log('Posting result back to main thread');
    self.postMessage({
      id: task.id,
      type: 'result',
      result: {
        blackBgData: blackBgData,
        dualData: dualData,
        width: dualWidth,
        height: dualHeight
      }
    });
    
    console.log('Result posted successfully');
  } catch (error) {
    console.error('Error in handleComposeFrame:', error);
    throw error;
  }
}

/**
 * 处理多个帧的合成
 */
async function handleComposeFrames(task) {
  try {
    console.log('=== handleComposeFrames START ===');
    console.log('Task ID:', task.id);
    console.log('Task type:', task.type);
    console.log('Task structure:', {
      hasData: !!task.data,
      hasFrames: !!task.frames,
      hasDataFrames: !!(task.data && task.data.frames),
      dataKeys: task.data ? Object.keys(task.data) : [],
      taskKeys: Object.keys(task)
    });
    
    // 统一数据结构：先尝试 task.data，再尝试直接属性
    var taskData = task.data || task;
    var frames = taskData.frames;
    var mode = taskData.mode;
    
    console.log('Extracted data:', {
      framesType: typeof frames,
      framesIsArray: Array.isArray(frames),
      framesLength: frames ? frames.length : 0,
      mode: mode
    });
    
    // 验证数据
    if (!frames) {
      var errorDetails = {
        hasData: !!task.data,
        hasFrames: !!task.frames,
        hasDataFrames: !!(task.data && task.data.frames),
        taskKeys: Object.keys(task),
        dataKeys: task.data ? Object.keys(task.data) : []
      };
      console.error('Missing frames data. Task structure:', errorDetails);
      var errorMsg = 'Missing frames data. Structure: ' + JSON.stringify(errorDetails);
      throw new Error(errorMsg);
    }
    if (!Array.isArray(frames)) {
      var errorMsg = 'Frames is not an array, type: ' + typeof frames;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    if (!mode) {
      var errorDetails = {
        hasData: !!task.data,
        hasMode: !!task.mode,
        hasDataMode: !!(task.data && task.data.mode),
        dataKeys: task.data ? Object.keys(task.data) : []
      };
      console.error('Missing mode. Task structure:', errorDetails);
      var errorMsg = 'Missing mode. Structure: ' + JSON.stringify(errorDetails);
      throw new Error(errorMsg);
    }
    
    var frameCount = frames.length;
    if (frameCount === 0) {
      throw new Error('Empty frames array');
    }
    
    console.log('Starting handleComposeFrames, frame count:', frameCount, 'mode:', mode);
    
    // 验证第一帧数据
    if (!frames[0]) {
      throw new Error('First frame is null or undefined');
    }
    
    var width = frames[0].width;
    var height = frames[0].height;
    
    // 如果第一帧没有 width/height，尝试从 taskData 获取
    if (!width || !height) {
      width = taskData.width;
      height = taskData.height;
      console.log('Using width/height from taskData:', width, 'x', height);
    }
    
    if (!width || !height) {
      throw new Error('Cannot determine frame dimensions: width=' + width + ', height=' + height);
    }
    
    console.log('Frame dimensions:', width, 'x', height);
    
    var results = [];
    var isColorLeftAlphaRight = mode === 'color-left-alpha-right';
    var dualWidth = width * 2;
    var dualDataSize = dualWidth * height * 4;
    
    console.log('Dual channel image size per frame:', dualWidth, 'x', height, 'data size:', dualDataSize);
    
    // 分批处理配置
    const BATCH_SIZE = 20; // 每批处理20帧
    console.log('Worker使用分批处理，每批', BATCH_SIZE, '帧');
    
    // 分批处理帧
    for (let batchStart = 0; batchStart < frameCount; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, frameCount);
      const batchFrames = frames.slice(batchStart, batchEnd);
      const batchSize = batchFrames.length;
      console.log('Worker处理批次:', batchStart, '-', batchEnd, '共', batchSize, '帧');
      
      // 并行处理当前批次
      var framePromises = batchFrames.map(async function(frameData, index) {
        const frameIndex = batchStart + index;
        console.log('Processing frame', frameIndex + 1, 'of', frameCount);
        
        // 验证帧数据
        if (!frameData) {
          console.error('Frame data is null at index:', frameIndex);
          return null;
        }
        
        // 检查帧数据结构
        if (!frameData.data) {
          console.error('Frame data.data is missing at index:', frameIndex, 'frameData keys:', Object.keys(frameData));
          return null;
        }
        
        // 检查帧数据是否是 TypedArray
        if (!ArrayBuffer.isView(frameData.data)) {
          console.error('Frame data.data is not a TypedArray at index:', frameIndex, 'type:', typeof frameData.data);
          return null;
        }
        
        // 检查帧数据长度
        var expectedLength = width * height * 4;
        if (frameData.data.length !== expectedLength) {
          console.error('Frame data length mismatch at index:', frameIndex, 'expected:', expectedLength, 'actual:', frameData.data.length);
          return null;
        }
        
        console.log('Frame', frameIndex, 'data validated, size:', frameData.data.length);
        
        // 内存优化：使用内存池分配缓冲区
        var dualData = memoryPool.getBuffer(dualDataSize);
        var blackBgData = memoryPool.getBuffer(dualDataSize);
        
        console.log('Memory allocated for frame', frameIndex);
        
        // 分块处理优化：将图像分成多个块并行处理
        var blocks = [];
        for (var y = 0; y < height; y += BLOCK_SIZE) {
          for (var x = 0; x < width; x += BLOCK_SIZE) {
            blocks.push({
              x: x,
              y: y,
              width: Math.min(BLOCK_SIZE, width - x),
              height: Math.min(BLOCK_SIZE, height - y)
            });
          }
        }
        
        console.log('Generated', blocks.length, 'blocks for frame', frameIndex);
        
        // 并行处理所有块
        try {
          await Promise.all(blocks.map(block => processBlock(
            block, frameData.data, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight
          )));
          console.log('Frame', frameIndex, 'processing completed');
        } catch (error) {
          console.error('Error processing frame', frameIndex, ':', error);
          // 返回空结果，让主线程处理
          return null;
        }
        
        return {
          blackBgData: blackBgData,
          width: dualWidth,
          height: height
        };
      });
      
      // 等待当前批次处理完成
      console.log('Waiting for batch frames to complete...');
      try {
        const batchResults = await Promise.all(framePromises);
        
        // 过滤掉空结果
        const validResults = batchResults.filter(result => result !== null);
        results.push(...validResults);
        
        console.log('Batch processed successfully, valid results:', validResults.length);
        
        // 报告批次进度
        const processedFrames = Math.min(batchEnd, frameCount);
        var progress = Math.round((processedFrames / frameCount) * 100);
        
        // 每5%的进度报告一次
        if (progress % 5 === 0) {
          self.postMessage({
            id: task.id,
            type: 'progress',
            progress: progress
          });
        }
        
        // 强制垃圾回收
        if (typeof gc === 'function') {
          gc();
        }
        console.log('Batch completed, total results so far:', results.length);
      } catch (error) {
        console.error('Error in batch processing:', error);
        // 继续处理下一批
        continue;
      }
    }
    
    console.log('All batches completed, total results:', results.length);
    
    console.log('Posting results back to main thread');
    self.postMessage({
      id: task.id,
      type: 'result',
      result: results
    });
    
    console.log('Results posted successfully, total frames processed:', results.length);
  } catch (error) {
    console.error('Error in handleComposeFrames:', error);
    throw error;
  }
}

/**
 * 处理单个图像块
 */
function processBlock(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight) {
  return new Promise(function(resolve) {
    var startX = block.x;
    var startY = block.y;
    var blockWidth = block.width;
    var blockHeight = block.height;
    
    // console.log('Processing block:', startX, ',', startY, 'size:', blockWidth, 'x', blockHeight);
    
    // 算法优化：减少循环内的计算
    var inv255 = 1 / 255;
    
    try {
      // 使用SIMD优化处理像素
      if (hasSIMD) {
        // console.log('Using SIMD to process block');
        processBlockWithSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255);
      } else {
        // console.log('Using regular processing for block');
        // 回退到普通处理方式
        processBlockWithoutSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255);
      }
      
      // console.log('Block processing completed:', startX, ',', startY);
      resolve();
    } catch (error) {
      console.error('Error processing block:', error, 'at position:', startX, ',', startY);
      resolve(); // 即使出错也继续处理
    }
  });
}

/**
 * 使用SIMD指令处理图像块
 * 注意：SIMD API已被废弃，此函数仅作为占位符
 */
function processBlockWithSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255) {
  // SIMD API已被废弃，直接使用普通处理方式
  processBlockWithoutSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255);
}

/**
 * 不使用SIMD指令处理图像块
 */
function processBlockWithoutSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255) {
  var startX = block.x;
  var startY = block.y;
  var blockWidth = block.width;
  var blockHeight = block.height;
  
  // console.log('Processing block without SIMD:', startX, ',', startY, 'size:', blockWidth, 'x', blockHeight);
  
  // 处理块内的每个像素
  var pixelCount = 0;
  for (var y = startY; y < startY + blockHeight; y++) {
    for (var x = startX; x < startX + blockWidth; x++) {
      try {
        processSinglePixel(x, y, frameData, width, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255);
        pixelCount++;
        
        // 每处理1000个像素打印一次日志
        // if (pixelCount % 1000 === 0) {
        //   console.log('Processed', pixelCount, 'pixels in block');
        // }
      } catch (error) {
        console.error('Error processing pixel at', x, ',', y, ':', error);
      }
    }
  }
  
  // console.log('Block processing completed, total pixels:', pixelCount);
}

/**
 * 处理单个像素
 */
function processSinglePixel(x, y, frameData, width, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255) {
  // 算法优化：使用位运算和数学优化计算索引
  var pixelIndex = y * width + x;
  var frameIdx = pixelIndex * 4;
  
  // 检查索引是否有效
  if (frameIdx + 3 >= frameData.length) {
    console.error('Invalid frame index:', frameIdx, 'for frame data length:', frameData.length);
    return;
  }
  
  var r = frameData[frameIdx + 0];
  var g = frameData[frameIdx + 1];
  var b = frameData[frameIdx + 2];
  var a = frameData[frameIdx + 3];

  // 反预乘Alpha
  var finalR = r, finalG = g, finalB = b;
  if (a > 0) {
    if (a < 255) {
      var alphaFactor = 255 / a;
      finalR = Math.min(255, Math.round(r * alphaFactor));
      finalG = Math.min(255, Math.round(g * alphaFactor));
      finalB = Math.min(255, Math.round(b * alphaFactor));
    }
  } else {
    finalR = 0; finalG = 0; finalB = 0;
  }

  // 计算位置
  var leftIdx = (y * dualWidth + x) * 4;
  var rightIdx = (y * dualWidth + x + width) * 4;

  // 检查索引是否有效
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

  // 合成黑底
  // 左侧通道
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
    // 半透明像素：与黑底混合
    var alphaFactorLeft = pixelAlphaLeft * inv255;
    blackBgData[leftIdx + 0] = Math.round(dualData[leftIdx + 0] * alphaFactorLeft);
    blackBgData[leftIdx + 1] = Math.round(dualData[leftIdx + 1] * alphaFactorLeft);
    blackBgData[leftIdx + 2] = Math.round(dualData[leftIdx + 2] * alphaFactorLeft);
  }
  blackBgData[leftIdx + 3] = 255;

  // 右侧通道
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
    // 半透明像素：与黑底混合
    var alphaFactorRight = pixelAlphaRight * inv255;
    blackBgData[rightIdx + 0] = Math.round(dualData[rightIdx + 0] * alphaFactorRight);
    blackBgData[rightIdx + 1] = Math.round(dualData[rightIdx + 1] * alphaFactorRight);
    blackBgData[rightIdx + 2] = Math.round(dualData[rightIdx + 2] * alphaFactorRight);
  }
  blackBgData[rightIdx + 3] = 255;
}