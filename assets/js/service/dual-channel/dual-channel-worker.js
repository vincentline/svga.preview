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
 */

// 处理消息
self.onmessage = function(e) {
    var task = e.data;
    
    try {
      switch(task.type) {
        case 'composeFrame':
          handleComposeFrame(task);
          break;
        case 'composeFrames':
          handleComposeFrames(task);
          break;
        default:
          throw new Error('Unknown task type: ' + task.type);
      }
    } catch(error) {
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
function handleComposeFrame(task) {
  var frameData = task.frame.data;
  var width = task.width;
  var height = task.height;
  var mode = task.mode;
  var isColorLeftAlphaRight = mode === 'color-left-alpha-right';
  
  // 清空并创建双通道数据
  var dualImageData = {
    width: width * 2,
    height: height,
    data: new Uint8ClampedArray(width * 2 * height * 4)
  };
  var dualData = dualImageData.data;
  
  // 逐像素处理
  for (var j = 0; j < frameData.length; j += 4) {
    var r = frameData[j + 0];
    var g = frameData[j + 1];
    var b = frameData[j + 2];
    var a = frameData[j + 3];

    // 反预乘Alpha
    var finalR = r, finalG = g, finalB = b;
    if (a > 0 && a < 255) {
      finalR = Math.min(255, Math.round(r * 255 / a));
      finalG = Math.min(255, Math.round(g * 255 / a));
      finalB = Math.min(255, Math.round(b * 255 / a));
    } else if (a === 0) {
      finalR = 0; finalG = 0; finalB = 0;
    }

    // 计算位置
    var pixelIndex = Math.floor(j / 4);
    var row = Math.floor(pixelIndex / width);
    var col = pixelIndex % width;
    var leftIdx = (row * width * 2 + col) * 4;
    var rightIdx = (row * width * 2 + col + width) * 4;

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
  }
  
  // 合成黑底
  var blackBgData = new Uint8ClampedArray(dualData.length);
  for (var k = 0; k < dualData.length; k += 4) {
    var pixelAlpha = dualData[k + 3];
    
    if (pixelAlpha === 255) {
      blackBgData[k + 0] = dualData[k + 0];
      blackBgData[k + 1] = dualData[k + 1];
      blackBgData[k + 2] = dualData[k + 2];
    } else if (pixelAlpha === 0) {
      blackBgData[k + 0] = 0;
      blackBgData[k + 1] = 0;
      blackBgData[k + 2] = 0;
    } else {
      // 半透明像素：与黑底混合
      blackBgData[k + 0] = Math.round(dualData[k + 0] * pixelAlpha / 255);
      blackBgData[k + 1] = Math.round(dualData[k + 1] * pixelAlpha / 255);
      blackBgData[k + 2] = Math.round(dualData[k + 2] * pixelAlpha / 255);
    }
    blackBgData[k + 3] = 255;
  }
  
  self.postMessage({
    id: task.id,
    type: 'result',
    result: {
      blackBgData: blackBgData,
      dualData: dualData,
      width: width * 2,
      height: height
    }
  });
}

/**
 * 处理多个帧的合成
 */
function handleComposeFrames(task) {
  var data = task.data;
  var frames = data.frames;
  var mode = data.mode;
  var frameCount = frames.length;
  
  if (frameCount === 0) {
    throw new Error('帧数组不能为空');
  }
  
  var results = [];
  var width = frames[0].width;
  var height = frames[0].height;
  var isColorLeftAlphaRight = mode === 'color-left-alpha-right';
  
  // 逐帧处理
  for (var i = 0; i < frameCount; i++) {
    var frameData = frames[i].data;
    
    // 清空并创建双通道数据
    var dualImageData = {
      width: width * 2,
      height: height,
      data: new Uint8ClampedArray(width * 2 * height * 4)
    };
    var dualData = dualImageData.data;
    
    // 逐像素处理
    for (var j = 0; j < frameData.length; j += 4) {
      var r = frameData[j + 0];
      var g = frameData[j + 1];
      var b = frameData[j + 2];
      var a = frameData[j + 3];

      // 反预乘Alpha
      var finalR = r, finalG = g, finalB = b;
      if (a > 0 && a < 255) {
        finalR = Math.min(255, Math.round(r * 255 / a));
        finalG = Math.min(255, Math.round(g * 255 / a));
        finalB = Math.min(255, Math.round(b * 255 / a));
      } else if (a === 0) {
        finalR = 0; finalG = 0; finalB = 0;
      }

      // 计算位置
      var pixelIndex = Math.floor(j / 4);
      var row = Math.floor(pixelIndex / width);
      var col = pixelIndex % width;
      var leftIdx = (row * width * 2 + col) * 4;
      var rightIdx = (row * width * 2 + col + width) * 4;

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
    }
    
    // 合成黑底
    var blackBgData = new Uint8ClampedArray(dualData.length);
    for (var k = 0; k < dualData.length; k += 4) {
      var pixelAlpha = dualData[k + 3];
      
      if (pixelAlpha === 255) {
        blackBgData[k + 0] = dualData[k + 0];
        blackBgData[k + 1] = dualData[k + 1];
        blackBgData[k + 2] = dualData[k + 2];
      } else if (pixelAlpha === 0) {
        blackBgData[k + 0] = 0;
        blackBgData[k + 1] = 0;
        blackBgData[k + 2] = 0;
      } else {
        // 半透明像素：与黑底混合
        blackBgData[k + 0] = Math.round(dualData[k + 0] * pixelAlpha / 255);
        blackBgData[k + 1] = Math.round(dualData[k + 1] * pixelAlpha / 255);
        blackBgData[k + 2] = Math.round(dualData[k + 2] * pixelAlpha / 255);
      }
      blackBgData[k + 3] = 255;
    }
    
    results.push({
      blackBgData: blackBgData,
      width: width * 2,
      height: height
    });
  }
  
  self.postMessage({
    id: task.id,
    type: 'result',
    result: results
  });
}