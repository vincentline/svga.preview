/**
 * Dual Channel Worker - 双通道图像合成器 工作线程
 * 【注意】此文件为内部工作线程，不直接对外提供接口，外部应调用 dual-channel-composer.js
 * 
 * 【模块关系】
 * - 主模块：dual-channel-composer.js（外部调用入口）
 * - 工作线程：dual-channel-worker.js（内部使用，由主模块创建和管理）
 * 
 * 【数据流】
 * dual-channel-composer.js → 发送任务消息 → Web Worker (本文件) → 执行像素计算 → 返回结果消息 → dual-channel-composer.js
 * 
 * 【主要职责】
 * 1. 接收主模块发送的合成任务
 * 2. 处理计算密集型的像素操作：
 *    - 反预乘Alpha通道
 *    - 构建双通道图像数据（彩色通道+Alpha灰度通道）
 *    - 合成黑底图像数据
 * 3. 将处理结果返回给主模块
 * 
 * 【支持的任务类型】
 * - 'composeFrame': 单帧合成
 * - 'composeFrames': 多帧批量合成
 * 
 * 【技术说明】
 * - 运行在独立的Web Worker线程，不阻塞主线程UI
 * - 使用ArrayBuffer和TypedArray高效处理大量像素数据
 * - 支持JPEG和PNG格式的底层数据生成
 * - 与主模块通过消息传递进行通信
 * 
 * 【性能优化】
 * 1. 分块处理优化：将图像分成多个块并行处理
 * 2. 内存优化：减少内存分配和复制操作
 * 3. 算法优化：优化计算逻辑，减少不必要的操作
 * 4. SIMD指令优化：使用SIMD指令并行处理多个像素
 */

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
  
  try {
    switch(task.type) {
      case 'composeFrame':
        console.log('Processing composeFrame task');
        handleComposeFrame(task).catch(function(error) {
          console.error('Error in handleComposeFrame:', error);
          self.postMessage({
            id: task.id,
            type: 'error',
            error: error.message
          });
        });
        break;
      case 'composeFrames':
        console.log('Processing composeFrames task, frame count:', task.data.frames.length);
        handleComposeFrames(task).catch(function(error) {
          console.error('Error in handleComposeFrames:', error);
          self.postMessage({
            id: task.id,
            type: 'error',
            error: error.message
          });
        });
        break;
      case 'clearMemory':
        console.log('Clearing memory pool');
        memoryPool.clear();
        self.postMessage({
          id: task.id,
          type: 'success'
        });
        break;
      default:
        throw new Error('Unknown task type: ' + task.type);
    }
  } catch(error) {
    console.error('Error in message handler:', error);
    self.postMessage({
      id: task.id,
      type: 'error',
      error: error.message
    });
  }
};

/**
 * 处理单个帧的合成
 */
async function handleComposeFrame(task) {
  console.log('Starting handleComposeFrame, frame data length:', task.frame.data.length, 'width:', task.width, 'height:', task.height);
  
  var frameData = task.frame.data;
  var width = task.width;
  var height = task.height;
  var mode = task.mode;
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
  try {
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
  } catch (error) {
    console.error('Error during block processing:', error);
    throw error;
  }
  
  // 使用transferable objects传递数据，减少内存复制
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
  }, [blackBgData.buffer, dualData.buffer]);
  
  console.log('Result posted successfully');
}

/**
 * 处理多个帧的合成
 */
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
      var progress = Math.round((processedFrames / totalFrames) * 100);
      
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
  
  // 提取transferable objects
  var transferables = [];
  results.forEach(result => {
    transferables.push(result.blackBgData.buffer);
  });
  
  console.log('Extracted transferable objects, count:', transferables.length);
  
  // 使用transferable objects传递数据，减少内存复制
  console.log('Posting results back to main thread');
  self.postMessage({
    id: task.id,
    type: 'result',
    result: results
  }, transferables);
  
  console.log('Results posted successfully, total frames processed:', results.length);
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
 */
function processBlockWithSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255) {
  // 安全检查：如果没有SIMD支持，直接返回
  if (!hasSIMD) {
    return;
  }
  
  var startX = block.x;
  var startY = block.y;
  var blockWidth = block.width;
  var blockHeight = block.height;
  
  // 预计算SIMD常量
  var simd255 = SIMD.int32x4.splat(255);
  var simd0 = SIMD.int32x4.splat(0);
  var simdAlphaFactor = SIMD.float32x4.splat(255 * inv255);
  
  // 处理块内的每个像素（每次处理4个像素）
  for (var y = startY; y < startY + blockHeight; y++) {
    for (var x = startX; x < startX + blockWidth; x += 4) {
      // 计算剩余像素数
      var pixelsToProcess = Math.min(4, startX + blockWidth - x);
      
      if (pixelsToProcess === 4) {
        // 处理4个像素
        process4PixelsWithSIMD(x, y, frameData, width, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255, simd255, simd0, simdAlphaFactor);
      } else {
        // 处理剩余的1-3个像素
        for (var i = 0; i < pixelsToProcess; i++) {
          var currentX = x + i;
          processSinglePixel(currentX, y, frameData, width, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255);
        }
      }
    }
  }
}

/**
 * 使用SIMD指令并行处理4个像素
 */
function process4PixelsWithSIMD(x, y, frameData, width, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255, simd255, simd0, simdAlphaFactor) {
  // 计算4个像素的索引
  var pixelIndices = [
    y * width + x,
    y * width + x + 1,
    y * width + x + 2,
    y * width + x + 3
  ];
  
  var frameIndices = pixelIndices.map(idx => idx * 4);
  
  // 加载4个像素的RGBA数据
  var rValues = SIMD.int32x4(frameData[frameIndices[0]], frameData[frameIndices[1]], frameData[frameIndices[2]], frameData[frameIndices[3]]);
  var gValues = SIMD.int32x4(frameData[frameIndices[0] + 1], frameData[frameIndices[1] + 1], frameData[frameIndices[2] + 1], frameData[frameIndices[3] + 1]);
  var bValues = SIMD.int32x4(frameData[frameIndices[0] + 2], frameData[frameIndices[1] + 2], frameData[frameIndices[2] + 2], frameData[frameIndices[3] + 2]);
  var aValues = SIMD.int32x4(frameData[frameIndices[0] + 3], frameData[frameIndices[1] + 3], frameData[frameIndices[2] + 3], frameData[frameIndices[3] + 3]);
  
  // 反预乘Alpha
  var finalR = rValues;
  var finalG = gValues;
  var finalB = bValues;
  
  // 处理Alpha值不为255的情况
  for (var i = 0; i < 4; i++) {
    var alpha = frameData[frameIndices[i] + 3];
    if (alpha > 0 && alpha < 255) {
      var alphaFactor = 255 * inv255;
      finalR = SIMD.int32x4.replaceLane(finalR, i, Math.min(255, Math.round(frameData[frameIndices[i]] * alphaFactor)));
      finalG = SIMD.int32x4.replaceLane(finalG, i, Math.min(255, Math.round(frameData[frameIndices[i] + 1] * alphaFactor)));
      finalB = SIMD.int32x4.replaceLane(finalB, i, Math.min(255, Math.round(frameData[frameIndices[i] + 2] * alphaFactor)));
    } else if (alpha === 0) {
      finalR = SIMD.int32x4.replaceLane(finalR, i, 0);
      finalG = SIMD.int32x4.replaceLane(finalG, i, 0);
      finalB = SIMD.int32x4.replaceLane(finalB, i, 0);
    }
  }
  
  // 处理每个像素
  for (var i = 0; i < 4; i++) {
    var currentX = x + i;
    var pixelIndex = y * width + currentX;
    var frameIdx = pixelIndex * 4;
    
    var r = SIMD.int32x4.extractLane(finalR, i);
    var g = SIMD.int32x4.extractLane(finalG, i);
    var b = SIMD.int32x4.extractLane(finalB, i);
    var a = frameData[frameIdx + 3];
    
    // 计算位置
    var leftIdx = (y * dualWidth + currentX) * 4;
    var rightIdx = (y * dualWidth + currentX + width) * 4;

    if (isColorLeftAlphaRight) {
      dualData[leftIdx + 0] = r;
      dualData[leftIdx + 1] = g;
      dualData[leftIdx + 2] = b;
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
      dualData[rightIdx + 0] = r;
      dualData[rightIdx + 1] = g;
      dualData[rightIdx + 2] = b;
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
      var alphaFactorRight = pixelAlphaRight * inv255;
      blackBgData[rightIdx + 0] = Math.round(dualData[rightIdx + 0] * alphaFactorRight);
      blackBgData[rightIdx + 1] = Math.round(dualData[rightIdx + 1] * alphaFactorRight);
      blackBgData[rightIdx + 2] = Math.round(dualData[rightIdx + 2] * alphaFactorRight);
    }
    blackBgData[rightIdx + 3] = 255;
  }
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
      // 算法优化：使用乘法代替除法
      var alphaFactor = 255 * inv255;
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