# Konva.js 开发经验总结

本文档记录实际开发中遇到的 Konva.js 问题及解决方案。

## 1. Transformer 被其他元素遮挡

**Problem:** Transformer 放在与内容相同的 Layer 时，会被后添加的元素遮挡，导致手柄无法操作。

**Solution:** 为 Transformer 创建独立的顶层 Layer：

```javascript
// 错误做法 - Transformer 和内容在同一层
const contentLayer = new Konva.Layer();
stage.add(contentLayer);
contentLayer.add(transformer);  // 可能被遮挡

// 正确做法 - Transformer 在独立顶层
const contentLayer = new Konva.Layer();
const transformerLayer = new Konva.Layer();  // 最后添加，在最上层
stage.add(contentLayer);
stage.add(transformerLayer);
transformerLayer.add(transformer);
```

---

## 2. 显示区域与导出区域分离

**Problem:** 编辑器需要更大的操作空间，但导出尺寸固定（如原始图片尺寸）。

**Solution:** Stage 尺寸设为容器尺寸，导出时创建临时 Stage：

```javascript
// 显示用 Stage - 尺寸等于容器
const displayStage = new Konva.Stage({
  container: container,
  width: containerWidth,
  height: containerHeight
});

// 导出时创建临时 Stage
function exportImage() {
  const exportStage = new Konva.Stage({
    container: document.createElement('div'),  // 不需要显示
    width: originalWidth,
    height: originalHeight
  });
  
  const exportLayer = new Konva.Layer();
  exportStage.add(exportLayer);
  
  // 将内容按相对位置复制到导出 Stage
  // ... 复制逻辑
  
  const dataURL = exportStage.toDataURL({
    width: originalWidth,
    height: originalHeight
  });
  
  exportStage.destroy();  // 导出后销毁
  return dataURL;
}
```

**关键点：**
- 显示 Stage 尺寸 = 容器尺寸（提供更大操作空间）
- 导出 Stage 尺寸 = 原始素材尺寸（保证输出正确）
- 使用参考线（虚线矩形）标识导出区域
- 导出后销毁临时 Stage 避免内存泄漏

---

## 3. 使用 offset 实现中心锚点

**Problem:** 默认情况下，Konva 元素以左上角为锚点，不便于居中定位和旋转缩放。

**Solution:** 设置 offsetX/offsetY 为尺寸的一半：

```javascript
const image = new Konva.Image({
  image: img,
  width: img.width,
  height: img.height,
  offsetX: img.width / 2,   // 以中心为锚点
  offsetY: img.height / 2,
  x: centerX,  // 直接使用中心坐标
  y: centerY
});

// Group 也可以设置位置和缩放
const group = new Konva.Group({
  x: centerX,
  y: centerY,
  scaleX: scale,
  scaleY: scale
});
```

**适用场景：**
- 元素需要以中心点旋转
- 元素需要以中心点缩放
- 元素位置以中心点为基准计算

---

## 4. Vue 响应式与 Konva 的配合

**Problem:** Vue 的 watch 监听器在值相同时不会触发，导致重新打开编辑器时 Konva 不渲染。

**Solution:** 在赋值前先重置为 null：

```javascript
// 错误做法 - 相同 URL 不会触发 watch
this.editor.baseImage = imgUrl;  // 如果 imgUrl 相同，watch 不触发

// 正确做法 - 先重置再赋值
this.editor.baseImage = null;
this.editor.baseImage = imgUrl;  // null → URL，watch 必定触发
```

**原理：** Vue 的 watch 只在值变化时触发，`null → URL` 是确定的变化。

---

## 5. 动态 Canvas 尺寸（用于 Konva.Image 的 canvas 内容）

**Problem:** 使用 canvas 渲染文字后作为 Konva.Image 的 image 源时，固定尺寸会导致内容超出或空白。

**Solution:** 根据内容动态计算 canvas 尺寸：

```javascript
function renderTextCanvas(text, style) {
  // 先测量内容尺寸
  const tempCtx = document.createElement('canvas').getContext('2d');
  tempCtx.font = `${fontSize}px ${fontFamily}`;
  
  const lines = text.split('\n');
  let maxWidth = 0;
  for (const line of lines) {
    maxWidth = Math.max(maxWidth, tempCtx.measureText(line).width);
  }
  
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  const padding = Math.max(maxWidth, totalHeight) * 0.25;
  
  // 创建合适尺寸的 canvas
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(maxWidth + padding * 2);
  canvas.height = Math.ceil(totalHeight + padding * 2);
  
  // 渲染内容...
  
  return canvas;
}
```

**关键点：**
- 使用临时 canvas 测量文字尺寸
- 添加 padding 确保内容不超出
- 尺寸变化时需要更新 Konva.Image 的 image 属性和 offset

---

## 6. 位置数据的相对坐标设计

**Problem:** 当显示区域与导出区域分离时，绝对坐标会导致位置计算混乱。

**Solution:** 使用相对坐标存储，渲染时转换为绝对坐标：

```javascript
// 存储格式 - 相对于导出区域中心的偏移
// textPosX/Y: 50 表示中心，0-100 范围
// imageOffsetX/Y: 相对于中心的像素偏移

// 渲染时转换
const exportCenterX = exportAreaX + exportWidth / 2;
const exportCenterY = exportAreaY + exportHeight / 2;

// 文案位置
const textX = exportCenterX + ((textPosX - 50) / 100) * exportWidth;
const textY = exportCenterY + ((textPosY - 50) / 100) * exportHeight;

// 底图位置
const imageX = exportCenterX + imageOffsetX;
const imageY = exportCenterY + imageOffsetY;
```

**优点：**
- 数据与显示区域无关，便于切换不同尺寸
- 导出时直接使用原始尺寸计算
- 便于保存和恢复编辑状态

---

## 7. 舞台拖拽无感激活

**Problem:** 第一次拖动画布无响应，需要先点击一次才能拖动。

**Solution:** 使用 `mouseenter` 事件监听器，在鼠标移入时自动激活舞台拖拽，同时初始化时就启用拖拽作为双重保障。

```javascript
// 初始化时启用舞台拖拽
this.stageInstance.draggable(true);

// 鼠标移入时再次确认激活（无感激活）
this.stageInstance.on('mouseenter', function () {
    // 只有在没有选中任何元素时才允许舞台拖拽
    if (editor.activeElement === 'none') {
        stage.draggable(true);
    }
});
```

**关键点：**
- 初始化时就设置 `draggable(true)` 作为第一重保障
- `mouseenter` 事件处理函数作为第二重保障
- 检查 `activeElement` 状态，确保只在未选中元素时激活
- 用户完全感知不到"激活"过程，体验流畅

---

## 8. getClientRect() 实现居中缩放

**Problem:** Konva 缩放以左上角为原点，直接修改 scale 会导致内容偏移；getClientRect() 返回的坐标受舞台位置影响，多次切换后计算错误。

**Solution:** 调用 getClientRect() 前先将舞台位置临时设为 (0,0)，获取相对于原点的绝对坐标后再计算居中位置。

```javascript
// 正确的居中缩放流程
function zoomAndCenter(stage, group, newScale) {
    var stageWidth = stage.width();
    var stageHeight = stage.height();
    
    // 1. 临时设置舞台位置为 (0, 0)
    stage.position({ x: 0, y: 0 });
    
    // 2. 设置新的缩放比例
    stage.scale({ x: newScale, y: newScale });
    
    // 3. 获取 Group 相对于舞台原点的实际显示区域
    var rect = group.getClientRect();
    // rect 包含：{ x, y, width, height }
    
    // 4. 计算居中位置：让内容区域在舞台中心
    var centerX = (stageWidth - rect.width) / 2 - rect.x;
    var centerY = (stageHeight - rect.height) / 2 - rect.y;
    
    // 5. 设置新的舞台位置并重绘
    stage.position({ x: centerX, y: centerY });
    stage.draw();
}
```

**居中公式：**
```
stagePosition = (stageSize - rectSize) / 2 - rectPosition
```

**关键点：**
- 必须先设置 `position({x:0, y:0})` 再调用 `getClientRect()`
- 这样获取到的坐标是绝对的，不会受历史状态影响
- 每次点击按钮都会重新计算，保证始终正确
- 适用于 1:1 缩放和适应画布缩放两种场景
