/**
 * Dual Channel Worker - 双通道图像合成器 工作线程
 */

// Worker启动确认
console.log('[DualChannelWorker] 已加载');

// 全局错误捕获
self.onerror = function(message, source, lineno, colno, error) {
  console.error('🟡 [DualChannelWorker] 全局错误:', {
    message: message,
    source: source,
    lineno: lineno,
    colno: colno,
    error: error ? error.stack : 'no stack'
  });
  return true;
};

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
  
  try {
    // 验证任务数据结构
    if (!task || !task.id || !task.type) {
      self.postMessage({
        id: task ? task.id : null,
        type: 'error',
        error: 'Invalid task structure'
      });
      return;
    }
    
    switch(task.type) {
      case 'composeFrame':
        handleComposeFrame(task).catch(function(error) {
          self.postMessage({ id: task.id, type: 'error', error: error.message });
        });
        break;
      case 'composeFrames':
        handleComposeFrames(task).catch(function(error) {
          self.postMessage({ id: task.id, type: 'error', error: error.message });
        });
        break;
      case 'clearMemory':
        memoryPool.clear();
        self.postMessage({ id: task.id, type: 'success' });
        break;
      default:
        self.postMessage({ id: task.id, type: 'error', error: 'Unknown task type: ' + task.type });
        break;
    }
  } catch(error) {
    self.postMessage({ id: task ? task.id : null, type: 'error', error: error.message });
  }
};

/**
 * 处理单个帧的合成
 */
async function handleComposeFrame(task) {
  try {
    var taskData = task.data || task;
    var frame = taskData.frame;
    var width = taskData.width;
    var height = taskData.height;
    var mode = taskData.mode;
    
    if (!frame || !frame.data) throw new Error('Missing frame data');
    if (!width || !height) throw new Error('Missing width or height');
    if (!mode) throw new Error('Missing mode');
    
    var frameData = frame.data;
    var isColorLeftAlphaRight = mode === 'color-left-alpha-right';
    var dualWidth = width * 2;
    var dualHeight = height;
    var dualDataSize = dualWidth * dualHeight * 4;
    
    var dualData = memoryPool.getBuffer(dualDataSize);
    var blackBgData = memoryPool.getBuffer(dualDataSize);
    
    // 分块处理
    var blocks = [];
    for (var y = 0; y < height; y += BLOCK_SIZE) {
      for (var x = 0; x < width; x += BLOCK_SIZE) {
        blocks.push({ x: x, y: y, width: Math.min(BLOCK_SIZE, width - x), height: Math.min(BLOCK_SIZE, height - y) });
      }
    }
    
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
    
    self.postMessage({
      id: task.id,
      type: 'result',
      result: { blackBgData: blackBgData.subarray(0, dualDataSize), dualData: dualData.subarray(0, dualDataSize), width: dualWidth, height: dualHeight }
    });
  } catch (error) {
    throw error;
  }
}

// ===================== 多帧批量处理 =====================

/**
 * 批量处理多个帧的双通道合成
 * 
 * 【性能优化】
 * - 分批处理：每批 BATCH_SIZE(20) 帧，避免内存压力过大
 * - 批内并行：每批内的帧并行处理
 * - 分块处理：每帧内部再分块并行
 * 
 * @param {Object} task - 任务对象
 * @returns {Promise<void>}
 */
async function handleComposeFrames(task) {
  try {
    var taskData = task.data || task;
    var frames = taskData.frames;
    var mode = taskData.mode;
    
    if (!frames || !Array.isArray(frames)) throw new Error('Invalid frames data');
    if (!mode) throw new Error('Missing mode');
    
    var frameCount = frames.length;
    if (frameCount === 0) throw new Error('Empty frames array');
    
    var width = frames[0].width || taskData.width;
    var height = frames[0].height || taskData.height;
    if (!width || !height) throw new Error('Cannot determine frame dimensions');
    
    console.log('[Worker] 处理', frameCount, '帧,', width, 'x', height);
    
    var results = [];
    var isColorLeftAlphaRight = mode === 'color-left-alpha-right';
    var dualWidth = width * 2;
    var dualDataSize = dualWidth * height * 4;
    
    const BATCH_SIZE = 20;
    
    for (let batchStart = 0; batchStart < frameCount; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, frameCount);
      const batchFrames = frames.slice(batchStart, batchEnd);
      
      var framePromises = batchFrames.map(async function(frameData, index) {
        const frameIndex = batchStart + index;
        
        if (!frameData || !frameData.data || !ArrayBuffer.isView(frameData.data)) return null;
        if (frameData.data.length !== width * height * 4) return null;
        
        var dualData = memoryPool.getBuffer(dualDataSize);
        var blackBgData = memoryPool.getBuffer(dualDataSize);
        
        var blocks = [];
        for (var y = 0; y < height; y += BLOCK_SIZE) {
          for (var x = 0; x < width; x += BLOCK_SIZE) {
            blocks.push({ x: x, y: y, width: Math.min(BLOCK_SIZE, width - x), height: Math.min(BLOCK_SIZE, height - y) });
          }
        }
        
        try {
          await Promise.all(blocks.map(block => processBlock(
            block, frameData.data, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight
          )));
        } catch (error) {
          return null;
        }
        
        return { blackBgData: blackBgData.subarray(0, dualDataSize), width: dualWidth, height: height };
      });
      
      try {
        const batchResults = await Promise.all(framePromises);
        const validResults = batchResults.filter(result => result !== null);
        results.push(...validResults);
        
        var progress = Math.round((batchEnd / frameCount) * 100);
        if (progress % 10 === 0) {
          self.postMessage({ id: task.id, type: 'progress', progress: progress });
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('[Worker] 完成, 输出', results.length, '帧');
    self.postMessage({ id: task.id, type: 'result', result: results });
  } catch (error) {
    throw error;
  }
}

/**
 * 处理单个图像块
 * 将图像分成 BLOCK_SIZE x BLOCK_SIZE 的小块处理，提高缓存命中率
 * 
 * @param {Object} block - 块信息 {x, y, width, height}
 * @param {Uint8ClampedArray} frameData - 原始帧数据
 * @param {number} width - 原始图像宽度
 * @param {number} height - 原始图像高度
 * @param {number} dualWidth - 双通道图像宽度（原始宽度*2）
 * @param {Uint8ClampedArray} dualData - 双通道输出缓冲区
 * @param {Uint8ClampedArray} blackBgData - 黑底合成输出缓冲区
 * @param {boolean} isColorLeftAlphaRight - 通道模式（true=左彩右灰）
 * @returns {Promise<void>}
 */
function processBlock(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight) {
  return new Promise(function(resolve) {
    var startX = block.x;
    var startY = block.y;
    var blockWidth = block.width;
    var blockHeight = block.height;
    
    // 算法优化：减少循环内的计算
    var inv255 = 1 / 255;
    
    try {
      // 使用SIMD优化处理像素
      if (hasSIMD) {
        processBlockWithSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255);
      } else {
        // 回退到普通处理方式
        processBlockWithoutSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255);
      }
      
      resolve();
    } catch (error) {
      console.error('Error processing block:', error, 'at position:', startX, ',', startY);
      resolve(); // 即使出错也继续处理
    }
  });
}

/**
 * 使用 SIMD 指令处理图像块
 * 注意：JavaScript SIMD API 已被废弃，此函数仅作为未来 WebAssembly SIMD 的占位符
 * 目前直接调用普通处理方式
 */
function processBlockWithSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255) {
  // SIMD API已被废弃，直接使用普通处理方式
  processBlockWithoutSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255);
}

/**
 * 不使用 SIMD 指令处理图像块（当前实际使用的处理方式）
 * 遍历块内的每个像素，调用 processSinglePixel 处理
 */
function processBlockWithoutSIMD(block, frameData, width, height, dualWidth, dualData, blackBgData, isColorLeftAlphaRight, inv255) {
  var startX = block.x;
  var startY = block.y;
  var blockWidth = block.width;
  var blockHeight = block.height;
  
  // 处理块内的每个像素
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
}

// ===================== 像素处理核心算法 =====================

/**
 * 处理单个像素的双通道转换
 * 
 * 【算法说明】
 * 1. 从原始帧读取 RGBA 像素
 * 2. 反预乘 Alpha：因为 Canvas 的 ImageData 是预乘 Alpha 的，
 *    即 R' = R * A/255，需要还原为原始颜色 R = R' * 255/A
 * 3. 根据通道模式分配像素：
 *    - color-left-alpha-right: 左侧放彩色(RGB)，右侧放灰度(Alpha)
 *    - alpha-left-color-right: 左侧放灰度(Alpha)，右侧放彩色(RGB)
 * 4. 生成黑底合成版本：将半透明像素与黑色背景混合
 * 
 * @param {number} x - 像素 X 坐标
 * @param {number} y - 像素 Y 坐标
 * @param {Uint8ClampedArray} frameData - 原始帧数据
 * @param {number} width - 原始图像宽度
 * @param {number} dualWidth - 双通道图像宽度
 * @param {Uint8ClampedArray} dualData - 双通道输出
 * @param {Uint8ClampedArray} blackBgData - 黑底合成输出
 * @param {boolean} isColorLeftAlphaRight - 通道模式
 * @param {number} inv255 - 1/255 预计算值，用于优化除法运算
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
