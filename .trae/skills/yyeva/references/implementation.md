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

### 文本元素渲染

```javascript
function renderYyevaText(ctx, effectInfo, frameData, userConfig) {
  var outputFrame = frameData.outputFrame;
  var x = outputFrame[0];
  var y = outputFrame[1];
  var w = outputFrame[2];
  var h = outputFrame[3];
  
  // 获取配置（用户配置优先）
  var text = userConfig.text || effectInfo.effectTag || '';
  var fontSize = userConfig.fontSize || effectInfo.fontSize || 36;
  var fontColor = userConfig.fontColor || effectInfo.fontColor || '#ffffff';
  var textAlign = userConfig.textAlign || effectInfo.textAlign || 'center';
  
  // 设置样式
  ctx.font = fontSize + 'px ' + (effectInfo.fontFamily || 'Arial');
  ctx.fillStyle = fontColor;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'top';
  
  // 绘制文本
  ctx.fillText(text, x + w / 2, y + h);
}
```

### 图片元素渲染

```javascript
function renderYyevaImage(ctx, effectInfo, frameData, userConfig) {
  var outputFrame = frameData.outputFrame;
  var x = outputFrame[0];
  var y = outputFrame[1];
  var w = outputFrame[2];
  var h = outputFrame[3];
  
  var imageSource = userConfig.imageSource;
  if (!imageSource) return;
  
  // 创建/获取缓存的图片对象
  var img = getCachedImage(effectInfo.effectTag, imageSource);
  
  if (img.complete && img.naturalWidth > 0) {
    drawImageWithScale(ctx, img, x, y, w, h, effectInfo.scaleMode);
  }
}

function drawImageWithScale(ctx, img, x, y, w, h, scaleMode) {
  var imgRatio = img.width / img.height;
  var targetRatio = w / h;
  var drawW, drawH, offsetX, offsetY;
  
  if (scaleMode === 'scaleFill') {
    // 填充模式：拉伸填满
    drawW = w;
    drawH = h;
    offsetX = x;
    offsetY = y;
  } else {
    // 适应模式：保持比例居中
    if (imgRatio > targetRatio) {
      drawW = w;
      drawH = w / imgRatio;
    } else {
      drawH = h;
      drawW = h * imgRatio;
    }
    offsetX = x + (w - drawW) / 2;
    offsetY = y + (h - drawH) / 2;
  }
  
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
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
