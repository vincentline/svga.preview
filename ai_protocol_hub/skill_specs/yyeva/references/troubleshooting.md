# YYEVA 常见问题与解决方案

## 解析问题

### 问题 1: pako 库未加载

**现象：**
```
YYEVA 解析需要 pako 库，请确保已加载
```

**原因：** pako 库是动态加载的，在解析时可能还未加载完成。

**解决方案：**
```javascript
// 在解析前检查并加载 pako
if (typeof pako === 'undefined') {
  await window.MeeWoo.Core.libraryLoader.load('pako', true);
}
```

### 问题 2: 找不到 YYEVA 标记

**现象：**
```
未找到 YYEVA 数据标记
```

**原因：**
1. 文件不是 YYEVA 格式
2. 文件损坏或格式不正确

**排查步骤：**
1. 确认文件是双通道 MP4
2. 用十六进制编辑器检查是否包含 `yyeffectmp4json` 标记
3. 检查 `udta` -> `meta` box 是否存在

### 问题 3: Base64 解码失败

**现象：**
```
Base64 解码失败
```

**原因：** 数据格式不正确或数据被截断

**解决方案：**
```javascript
// 增加数据提取长度
var maxLen = Math.min(buffer.length - dataStart, 100000); // 增加到 100KB
```

### 问题 4: zlib 解压失败

**现象：**
```
zlib 解压失败
```

**原因：**
1. 数据不是 zlib 压缩格式
2. 数据损坏

**排查步骤：**
```javascript
// 检查压缩数据的前两个字节（zlib header）
// zlib 格式: 0x78 0x9C (默认压缩) 或 0x78 0x01 (最快压缩)
console.log('zlib header:', compressed[0].toString(16), compressed[1].toString(16));
```

## 渲染问题

### 问题 5: 图片key蒙版不生效

**现象：** 替换图片后显示为完整方形，没有蒙版形状

**原因：**
1. 未传递完整视频帧上下文（maskContext）
2. 蒙版提取位置错误（outputFrame指向视频帧底部，不是显示位置）
3. 只截取了显示区域，未包含蒙版存储区域

**解决方案：**
```javascript
// 必须传递完整视频帧的上下文，而不是只传显示区域的ImageData
var maskContext = {
  ctx: tempCtx,                  // 完整视频帧的上下文
  videoWidth: video.videoWidth,  // 视频宽度
  videoHeight: video.videoHeight,// 视频高度（包含蒙版区域）
  displayWidth: displayWidth,    // 有效显示宽度
  displayHeight: displayHeight   // 有效显示高度
};
this.yyevaRenderer.renderEffects(ctx, this.currentFrame, yyevaData, maskContext);
```

**关键点：**
- `outputFrame` 坐标指向视频帧底部的蒙版区域（y > displayHeight）
- `renderFrame` 才是元素在画面上的实际渲染位置
- 蒙版的灰度值（R通道）控制透明度

### 问题 6: currentFrame is not defined

**现象：**
```
Uncaught ReferenceError: currentFrame is not defined
```

**原因：** 在渲染函数中使用了局部变量 `currentFrame`，应该使用 `this.currentFrame`

**解决方案：**
```javascript
// 错误
this._renderYyevaEffects(ctx, currentFrame);

// 正确
this._renderYyevaEffects(ctx, this.currentFrame);
```

### 问题 6: 动态元素位置不正确

**现象：** 动态元素渲染位置偏移或错位

**原因：** 坐标系统理解错误

**解决方案：**
- `outputFrame` 坐标是相对于 RGB 区域的左上角 (0, 0)
- 不是相对于整个双通道视频

```javascript
// 正确理解坐标
// RGB 区域: [0, 0, halfWidth, height]
// outputFrame: [x, y, w, h] 相对于 RGB 区域
```

### 问题 7: 图片不显示

**现象：** 设置了替换图片但不显示

**原因：**
1. 图片未加载完成
2. 图片源格式不支持

**解决方案：**
```javascript
// 确保图片加载完成后再渲染
var img = new Image();
img.onload = function() {
  // 触发重新渲染
  renderYyevaFrame();
};
img.src = imageSource;

// 或使用缓存机制
function getCachedImage(effectTag, src) {
  if (!imageCache[effectTag] || imageCache[effectTag].src !== src) {
    var img = new Image();
    img.src = src;
    imageCache[effectTag] = img;
  }
  return imageCache[effectTag];
}
```

### 问题 8: 文本渲染模糊

**现象：** 文本边缘模糊或有锯齿

**原因：** Canvas 缩放或 DPI 问题

**解决方案：**
```javascript
// 考虑设备像素比
var dpr = window.devicePixelRatio || 1;
ctx.font = (fontSize * dpr) + 'px Arial';
```

## 性能问题

### 问题 9: 播放卡顿

**现象：** YYEVA 视频播放卡顿

**原因：** 每帧都在解析数据或创建对象

**解决方案：**
```javascript
// 1. 预处理帧数据索引
var frameIndex = {};
yyevaData.datas.forEach(function(frame) {
  frameIndex[frame.frameIndex] = frame.data;
});

// 2. 缓存图片对象
var imageCache = {};

// 3. 避免在渲染循环中创建对象
```

### 问题 10: 内存泄漏

**现象：** 长时间播放后内存持续增长

**原因：** 图片缓存未清理

**解决方案：**
```javascript
// 切换文件时清理缓存
function cleanupYyeva() {
  imageCache = {};
  frameIndex = null;
}
```

## 文件检测问题

### 问题 11: 普通双通道被误识别为 YYEVA

**现象：** 普通双通道 MP4 显示为"带key"

**原因：** 检测逻辑错误

**解决方案：**
```javascript
// 必须检查 isEffect 字段
if (jsonData.descript && jsonData.descript.isEffect === 1) {
  return jsonData; // 确认是 YYEVA
}
return null; // 不是 YYEVA
```

### 问题 12: YYEVA 文件未被识别

**现象：** YYEVA 文件显示为普通双通道

**原因：**
1. pako 未加载
2. 解析过程中出错但被静默处理

**解决方案：**
```javascript
// 添加详细日志
try {
  var yyevaData = parseYyevaMetadata(buffer);
  console.log('[YYEVA] 解析结果:', yyevaData ? '成功' : '非YYEVA格式');
} catch (e) {
  console.error('[YYEVA] 解析异常:', e);
}
```

## 调试技巧

### 检查文件结构

```javascript
// 打印 MP4 box 结构
function printMp4Structure(buffer) {
  var offset = 0;
  while (offset < buffer.length - 8) {
    var size = buffer.getUint32(offset);
    var type = String.fromCharCode(...buffer.slice(offset + 4, offset + 8));
    console.log(type, '[' + size + 'bytes]', '@' + offset);
    offset += size;
  }
}
```

### 检查 YYEVA 数据

```javascript
// 打印解析后的数据结构
console.log('descript:', JSON.stringify(yyevaData.descript, null, 2));
console.log('effect keys:', Object.keys(yyevaData.effect));
console.log('frame count:', yyevaData.datas.length);
```

### 检查帧数据

```javascript
// 打印特定帧的数据
function printFrameData(yyevaData, frameIndex) {
  var frame = yyevaData.datas.find(f => f.frameIndex === frameIndex);
  if (frame) {
    frame.data.forEach(function(item) {
      var effect = yyevaData.effect[item.effectId];
      console.log(effect.effectTag, effect.effectType, item.outputFrame);
    });
  }
}
```
