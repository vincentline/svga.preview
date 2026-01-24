# GIF导出功能技术文档

> **文档版本**: v1.0  
> **创建日期**: 2025-12-26  
> **文档状态**: ✅ 已完成

---

## 📋 目录

1. [功能概述](#1-功能概述)
2. [核心技术](#2-核心技术)
3. [透明通道处理](#3-透明通道处理)
4. [杂色边处理](#4-杂色边处理)
5. [实现流程](#5-实现流程)
6. [关键代码](#6-关键代码)
7. [常见问题](#7-常见问题)

---

## 1. 功能概述

### 1.1 功能定义

支持将SVGA、Lottie、双通道MP4、普通MP4（含绿幕抠图）等多种格式动画导出为GIF图片，支持透明底和杂色边处理。

### 1.2 核心特性

- ✅ **多模式支持**: SVGA / Lottie / 双通道MP4 / 普通MP4（绿幕抠图）
- ✅ **透明底导出**: 支持透明GIF，保留alpha通道
- ✅ **杂色边处理**: 支持半透明像素与指定颜色混合，消除杂边
- ✅ **尺寸自定义**: 支持自定义输出尺寸
- ✅ **帧率控制**: 可调节GIF播放帧率
- ✅ **文件大小预估**: 实时预估GIF文件大小
- ✅ **进度显示**: 实时显示捕获和编码进度
- ✅ **可取消**: 支持随时取消导出操作

---

## 2. 核心技术

### 2.1 技术栈

- **GIF编码库**: [gif.js](https://github.com/jnordberg/gif.js) - 客户端GIF编码
- **Web Worker**: 后台线程GIF编码，避免阻塞UI
- **Canvas API**: 帧捕获和图像处理
- **Alpha混合算法**: 处理半透明像素

### 2.2 Canvas Alpha通道配置

**关键要点**: 所有用于透明GIF导出的canvas必须启用alpha通道

```javascript
// ✅ 正确：启用alpha通道
var ctx = canvas.getContext('2d', { 
  willReadFrequently: true,
  alpha: true  // 必须设置为true
});

// ❌ 错误：未启用alpha通道会导致透明区域变黑
var ctx = canvas.getContext('2d', { willReadFrequently: true });
```

**需要启用alpha的canvas**:
1. **输出canvas** (用于GIF帧缩放) - `runGifExport`方法
2. **绿幕抠图canvas** (用于MP4绿幕抠图) - `setupChromaKeyCanvas`方法
3. **源canvas** (SVGA/Lottie库自动创建，默认支持alpha)

---

## 3. 透明通道处理

### 3.1 GIF.js透明配置

```javascript
// GIF编码器配置
var gifOptions = {
  workers: 2,
  quality: 10,
  width: config.width,
  height: config.height,
  workerScript: 'assets/js/gif.worker.js'
};

// 透明模式：设置透明色索引
if (config.transparent) {
  gifOptions.transparent = 0x00000000;
}

var gif = new GIF(gifOptions);
```

### 3.2 添加帧时启用透明

```javascript
// 添加帧到GIF
var frameOptions = { copy: true, delay: frameDelay };
if (config.transparent) {
  frameOptions.transparent = true;  // 必须设置
}
gif.addFrame(outputCanvas, frameOptions);
```

### 3.3 透明区域处理流程

```
源Canvas (带alpha通道)
    ↓
清空输出Canvas (clearRect保持透明)
    ↓
不填充背景色 (保持透明)
    ↓
drawImage绘制源帧 (globalCompositeOperation = 'source-over')
    ↓
GIF编码器处理 (transparent: 0x00000000)
    ↓
透明GIF输出
```

---

## 4. 杂色边处理

### 4.1 问题背景

动画导出时，半透明像素（0 < alpha < 1）在GIF中可能产生杂边效果，因为：
- GIF只支持完全透明或完全不透明
- 半透明像素需要与背景色混合

### 4.2 Alpha混合算法

使用标准Alpha混合公式处理半透明像素：

```
newColor = sourceColor * alpha + ditherColor * (1 - alpha)
```

**实现代码**:

```javascript
// 透明底+杂色边：处理半透明像素
if (config.transparent && config.dither && config.ditherColor) {
  var imageData = outputCtx.getImageData(0, 0, config.width, config.height);
  var data = imageData.data;
  
  // 解析杂色边颜色
  var hexColor = config.ditherColor.replace('#', '');
  var ditherR = parseInt(hexColor.substr(0, 2), 16);
  var ditherG = parseInt(hexColor.substr(2, 2), 16);
  var ditherB = parseInt(hexColor.substr(4, 2), 16);
  
  // Alpha混合：半透明像素与杂色边颜色混合
  for (var j = 0; j < data.length; j += 4) {
    var alpha = data[j + 3] / 255;
    if (alpha > 0 && alpha < 1) {
      data[j] = Math.round(data[j] * alpha + ditherR * (1 - alpha));
      data[j + 1] = Math.round(data[j + 1] * alpha + ditherG * (1 - alpha));
      data[j + 2] = Math.round(data[j + 2] * alpha + ditherB * (1 - alpha));
      data[j + 3] = 255;  // 设为完全不透明
    }
  }
  
  outputCtx.putImageData(imageData, 0, 0);
}
```

### 4.3 处理逻辑

| alpha值 | 处理方式 |
|---------|---------|
| alpha = 0 | 保持透明 |
| 0 < alpha < 1 | 与杂色边颜色混合，设为不透明 |
| alpha = 1 | 保持不变 |

---

## 5. 实现流程

### 5.1 完整流程图

```
用户点击导出
    ↓
打开GIF导出弹窗 (openGifPanel)
    ↓
用户配置参数
  - 透明底 (transparent)
  - 杂色边 (dither + ditherColor)
  - 尺寸、帧率等
    ↓
开始导出 (startGifExport)
    ↓
创建输出Canvas (启用alpha通道)
    ↓
创建GIF编码器 (设置transparent选项)
    ↓
暂停播放
    ↓
循环捕获帧 (runGifExport)
  - 跳转到第i帧
  - 等待渲染 (50ms)
  - 获取源Canvas
  - 处理背景 (透明/不透明)
  - 绘制到输出Canvas
  - 处理杂色边 (可选)
  - 添加到GIF
    ↓
开始GIF编码 (Web Worker)
    ↓
生成Blob并下载
    ↓
恢复播放
    ↓
完成
```

### 5.2 关键时序

1. **帧渲染等待**: 50ms (确保帧渲染完成)
2. **GIF编码**: 后台Worker异步处理，不阻塞UI
3. **进度更新**: 捕获阶段0-50%，编码阶段50-100%

---

## 6. 关键代码

### 6.1 核心方法

#### `runGifExport` - GIF导出核心逻辑

位置: `app.js` 约3200-3380行

**功能**: 捕获动画帧并编码为GIF

**关键步骤**:
1. 创建输出canvas (启用alpha)
2. 配置GIF编码器
3. 循环捕获帧
4. 处理透明底和杂色边
5. 编码和下载

#### `getCurrentFrameCanvas` - 获取当前帧Canvas

位置: `app.js` 约3376-3405行

**功能**: 根据当前模式获取源canvas

**支持模式**:
- SVGA: 查询容器内的canvas
- Lottie: 查询容器内的canvas
- 双通道MP4: 返回yyevaCanvas
- 普通MP4: 返回绿幕抠图canvas或创建临时canvas

#### `setupChromaKeyCanvas` - 绿幕抠图Canvas设置

位置: `app.js` 约4330-4420行

**功能**: 创建绿幕抠图canvas并启用实时渲染

**关键配置**:
```javascript
var ctx = canvas.getContext('2d', { 
  willReadFrequently: true,
  alpha: true  // 必须启用以支持透明抠图
});
```

---

## 7. 常见问题

### 7.1 导出的GIF是黑底而不是透明

**原因**: Canvas未启用alpha通道

**解决方案**:
```javascript
// 确保所有相关canvas都启用alpha
var ctx = canvas.getContext('2d', { 
  willReadFrequently: true,
  alpha: true  // ✅ 必须设置
});
```

**检查点**:
1. ✅ 输出canvas (runGifExport)
2. ✅ 绿幕抠图canvas (setupChromaKeyCanvas)
3. ✅ GIF编码器配置 (transparent: 0x00000000)
4. ✅ addFrame配置 (transparent: true)

### 7.2 杂色边颜色不正确

**原因**: 未正确解析或应用用户选择的颜色

**解决方案**:
- 确保从`config.ditherColor`正确解析RGB值
- 使用Alpha混合算法处理半透明像素
- 验证混合公式: `newColor = srcColor * alpha + ditherColor * (1 - alpha)`

### 7.3 第一帧渲染不完整

**原因**: 帧跳转后渲染需要时间

**解决方案**:
```javascript
// 等待渲染完成
await new Promise(function(r) { setTimeout(r, 50); });
```

当前所有帧统一等待50ms，足够保证渲染完成。

### 7.4 GIF文件过大

**优化建议**:
1. 降低输出尺寸
2. 降低帧率 (如15fps)
3. 减少总帧数 (缩短动画时长)
4. 使用`quality: 10`保持较好压缩

---

## 附录

### A. 相关文件

- `docs/assets/js/app.js` - GIF导出核心逻辑
- `docs/assets/js/gif.worker.js` - GIF编码Worker
- `docs/assets/css/styles.css` - GIF导出弹窗样式

### B. 相关库

- [gif.js](https://github.com/jnordberg/gif.js) - GIF编码库
- Canvas API - 帧捕获和图像处理

### C. 技术参考

- [GIF透明处理](https://en.wikipedia.org/wiki/GIF#Transparency)
- [Alpha合成](https://en.wikipedia.org/wiki/Alpha_compositing)
- [Canvas API文档](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

**文档更新日志**:
- 2025-12-26: v1.0 创建文档，记录透明GIF导出和杂色边处理关键技术
