# YYEVA 实现指南

## 解析实现

### 1. 检测 YYEVA 格式

```javascript
function detectYyevaType(file) {
  return new Promise(function (resolve) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var buffer = new Uint8Array(e.target.result);
      var yyevaData = parseYyevaMetadata(buffer);
      if (yyevaData && yyevaData.descript.isEffect === 1) {
        resolve({ isYyeva: true, data: yyevaData });
      } else {
        resolve({ isYyeva: false, data: null });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
```

### 2. 解析 Metadata

```javascript
function parseYyevaMetadata(buffer) {
  var YYEVA_MARKER = 'yyeffectmp4json';
  var markerBytes = new TextEncoder().encode(YYEVA_MARKER);
  
  // 1. 搜索标记位置
  var markerIndex = findMarker(buffer, markerBytes);
  if (markerIndex === -1) return null;
  
  // 2. 提取 Base64 数据
  var dataStart = markerIndex + YYEVA_MARKER.length;
  var str = bufferToString(buffer, dataStart, 50000);
  var base64Match = str.match(/\[\[([A-Za-z0-9+/=]+)\]\]/);
  if (!base64Match) return null;
  
  // 3. Base64 解码
  var compressed = base64Decode(base64Match[1]);
  
  // 4. zlib 解压（需要 pako 库）
  var decompressed = pako.inflate(compressed);
  
  // 5. 解析 JSON
  var jsonData = JSON.parse(new TextDecoder('utf-8').decode(decompressed));
  
  return jsonData;
}
```

### 3. 依赖库加载

YYEVA 解析依赖 `pako` 库进行 zlib 解压：

```javascript
// 确保 pako 已加载
if (typeof pako === 'undefined') {
  // 动态加载 pako
  await loadScript('assets/js/lib/pako.min.js');
}
```

## 渲染实现

### 渲染流程

```
1. 基础双通道渲染（RGB + Alpha 合成）
   ↓
2. 根据 currentFrame 查找 datas[frameIndex]
   ↓
3. 遍历该帧的动态元素数据
   ↓
4. 在 outputFrame 位置绘制动态元素
```

### 文本元素渲染（带透明度动画）

文本key同样需要应用蒙版透明度。

```javascript
function renderYyevaText(ctx, effectInfo, frameData, userConfig, maskContext) {
  var renderFrame = frameData.renderFrame || frameData.outputFrame;
  var outputFrame = frameData.outputFrame;
  
  var x = renderFrame[0];
  var y = renderFrame[1];
  var w = renderFrame[2];
  var h = renderFrame[3];
  
  // 获取配置（用户配置优先）
  var text = userConfig.text || effectInfo.effectTag || '';
  var fontSize = userConfig.fontSize || effectInfo.fontSize || 36;
  var fontColor = userConfig.fontColor || effectInfo.fontColor || '#ffffff';
  var textAlign = userConfig.textAlign || effectInfo.textAlign || 'center';
  
  // 创建临时画布绘制文本
  var tempCanvas = document.createElement('canvas');
  tempCanvas.width = Math.floor(w);
  tempCanvas.height = Math.floor(h);
  var tempCtx = tempCanvas.getContext('2d');
  
  // 绘制文本
  tempCtx.font = fontSize + 'px ' + (effectInfo.fontFamily || 'Arial, sans-serif');
  tempCtx.fillStyle = fontColor;
  tempCtx.textAlign = textAlign;
  tempCtx.textBaseline = 'middle';
  tempCtx.fillText(text, w / 2, h / 2);
  
  // 应用蒙版透明度
  if (outputFrame && maskContext && maskContext.ctx) {
    applyMaskAlpha(tempCtx, Math.floor(w), Math.floor(h), outputFrame, maskContext);
  }
  
  ctx.drawImage(tempCanvas, x, y);
}
```

### 图片元素渲染（带蒙版）

图片key的渲染需要从视频帧底部提取蒙版，并应用透明度动画。

```javascript
function renderYyevaImage(ctx, effectInfo, frameData, userConfig, maskContext) {
  // renderFrame 是元素在画面上的实际渲染位置
  var renderFrame = frameData.renderFrame;
  // outputFrame 是蒙版在视频帧中的位置（底部区域）
  var outputFrame = frameData.outputFrame;
  
  var x = renderFrame[0];
  var y = renderFrame[1];
  var w = renderFrame[2];
  var h = renderFrame[3];
  
  var imageSource = userConfig.imageSource;
  if (!imageSource) return;
  
  var img = getCachedImage(effectInfo.effectTag, imageSource);
  
  if (img.complete && img.naturalWidth > 0) {
    // 应用蒙版：从视频帧的outputFrame位置提取蒙版形状
    if (outputFrame && maskContext && maskContext.ctx) {
      renderImageWithMask(ctx, img, x, y, w, h, outputFrame, maskContext);
    } else {
      drawImageCover(ctx, img, x, y, w, h);
    }
  }
}
```

### 蒙版提取与应用

```javascript
function renderImageWithMask(ctx, img, x, y, w, h, outputFrame, maskContext) {
  var maskX = Math.floor(outputFrame[0]);
  var maskY = Math.floor(outputFrame[1]);
  var maskW = Math.floor(outputFrame[2]);
  var maskH = Math.floor(outputFrame[3]);
  
  // 创建临时画布
  var tempCanvas = document.createElement('canvas');
  tempCanvas.width = Math.floor(w);
  tempCanvas.height = Math.floor(h);
  var tempCtx = tempCanvas.getContext('2d');
  
  // 绘制图片（cover模式）
  drawImageCover(tempCtx, img, 0, 0, w, h);
  
  // 从视频帧的outputFrame位置提取蒙版
  var srcCtx = maskContext.ctx;
  var maskImageData = srcCtx.getImageData(maskX, maskY, maskW, maskH);
  
  // 缩放蒙版到目标尺寸
  var scaledMaskCanvas = document.createElement('canvas');
  scaledMaskCanvas.width = maskW;
  scaledMaskCanvas.height = maskH;
  scaledMaskCanvas.getContext('2d').putImageData(maskImageData, 0, 0);
  
  var maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  var maskCtx = maskCanvas.getContext('2d');
  maskCtx.drawImage(scaledMaskCanvas, 0, 0, maskW, maskH, 0, 0, w, h);
  
  // 获取像素数据
  var imageData = tempCtx.getImageData(0, 0, w, h);
  var finalMaskData = maskCtx.getImageData(0, 0, w, h);
  var pixels = imageData.data;
  var maskPixels = finalMaskData.data;
  
  // 应用蒙版：R通道灰度值控制透明度
  for (var i = 0; i < pixels.length; i += 4) {
    var maskAlpha = maskPixels[i]; // R通道代表透明度
    pixels[i + 3] = Math.floor((pixels[i + 3] * maskAlpha) / 255);
  }
  
  tempCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(tempCanvas, x, y);
}
```

### 图片缩放（cover模式）

图片使用cover模式：保持比例，短边填满，长边居中裁剪。

```javascript
function drawImageCover(ctx, img, x, y, w, h) {
  var imgW = img.width;
  var imgH = img.height;
  var imgRatio = imgW / imgH;
  var targetRatio = w / h;
  
  var srcX = 0, srcY = 0, srcW = imgW, srcH = imgH;
  
  if (imgRatio > targetRatio) {
    // 图片更宽，裁剪左右
    srcW = imgH * targetRatio;
    srcX = (imgW - srcW) / 2;
  } else {
    // 图片更高，裁剪上下
    srcH = imgW / targetRatio;
    srcY = (imgH - srcH) / 2;
  }
  
  ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, w, h);
}
```

## API 设计

### 设置文本内容

```javascript
app.setYyevaText(effectTag, {
  text: "替换文本",
  fontColor: "#ff0000",  // 可选
  fontSize: 48           // 可选
});
```

### 设置替换图片

```javascript
// 支持多种图片源格式
app.setYyevaImage(effectTag, imageElement);
app.setYyevaImage(effectTag, imageUrl);
app.setYyevaImage(effectTag, base64String);
```

### 获取动态元素列表

```javascript
var effects = app.getYyevaEffects();
// 返回: [{ key: "0", config: {...} }, { key: "1", config: {...} }]
```

## 性能优化

### 1. 图片缓存

```javascript
// 缓存已加载的图片，避免重复创建
var imageCache = {};

function getCachedImage(effectTag, src) {
  if (!imageCache[effectTag]) {
    var img = new Image();
    img.src = src;
    imageCache[effectTag] = img;
  }
  return imageCache[effectTag];
}
```

### 2. 帧数据索引

```javascript
// 预处理帧数据，建立索引
function buildFrameIndex(datas) {
  var index = {};
  datas.forEach(function(frame) {
    index[frame.frameIndex] = frame.data;
  });
  return index;
}

// O(1) 查找
var frameData = frameIndex[currentFrame];
```

### 3. 条件渲染

```javascript
// 仅在 YYEVA 格式时执行动态元素渲染
if (yyeva.isYyeva && yyeva.yyevaData) {
  renderYyevaEffects(ctx, currentFrame);
}
```

## 兼容性处理

### 降级策略

```javascript
// 解析失败时降级为普通双通道播放
try {
  var yyevaData = parseYyevaMetadata(buffer);
  if (yyevaData && yyevaData.descript.isEffect === 1) {
    state.isYyeva = true;
    state.yyevaData = yyevaData;
  } else {
    state.isYyeva = false;
  }
} catch (e) {
  console.warn('YYEVA 解析失败，降级为普通双通道');
  state.isYyeva = false;
}
```

### 库依赖处理

```javascript
// 检查 pako 是否可用
if (typeof pako === 'undefined') {
  console.warn('YYEVA 解析需要 pako 库');
  return null;
}
```
