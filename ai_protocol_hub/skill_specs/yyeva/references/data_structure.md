# YYEVA 数据结构详解

## 顶层结构

```javascript
{
  descript: { ... },  // 资源基本信息
  effect: { ... },    // 动态元素配置
  datas: [ ... ]      // 每帧位置数据
}
```

## descript - 资源基本信息

```javascript
{
  width: 720,           // 视频总宽度（双通道，实际显示宽度 = width/2）
  height: 720,          // 视频高度
  isEffect: 1,          // 是否为动态元素视频（1 = YYEVA格式）
  version: 1,           // 数据结构版本号
  rgbFrame: [0, 0, 360, 720],    // RGB 区域 [x, y, w, h]
  alphaFrame: [360, 0, 360, 720], // Alpha 区域 [x, y, w, h]
  fps: 30,              // 帧率
  hasAudio: false       // 是否包含音频
}
```

**关键字段说明：**
- `isEffect`: 必须为 1 才是 YYEVA 格式
- `rgbFrame` / `alphaFrame`: 定义双通道布局，用于合成透明视频
- `width / 2`: 得到实际显示宽度

## effect - 动态元素配置

effect 是一个对象，key 为元素索引（字符串 "0", "1", ...），value 为元素配置。

### 文本元素 (effectType: "txt")

```javascript
{
  "0": {
    effectId: 0,
    effectType: "txt",
    effectTag: "text_01",        // 元素标签（key），用于 API 调用
    effectWidth: 200,
    effectHeight: 50,
    fontColor: "#ffffff",        // 字体颜色
    fontSize: 36,                // 字体大小
    fontFamily: "Arial",         // 字体
    textAlign: "center",         // 对齐方式: left/center/right
    text: "默认文本"             // 默认文本内容
  }
}
```

### 图片元素 (effectType: "img")

```javascript
{
  "1": {
    effectId: 1,
    effectType: "img",
    effectTag: "avatar_01",      // 元素标签（key），用于 API 调用
    effectWidth: 100,
    effectHeight: 100,
    scaleMode: "scaleAspectFit"  // 缩放模式: scaleFill/scaleAspectFit/scaleAspectFill
  }
}
```

**关键字段说明：**
- `effectTag`: 用户 API 调用时使用的 key
- `effectType`: "txt" 或 "img"
- `effectWidth` / `effectHeight`: 元素的设计尺寸

## datas - 每帧位置数据

datas 是一个数组，每个元素代表一帧的动态元素位置信息。

```javascript
[
  {
    frameIndex: 0,    // 帧索引
    data: [           // 该帧所有动态元素的位置数据
      {
        effectId: 1,
        renderFrame: [272.5, 1144.8, 206, 196],  // 元素在画面上的实际渲染位置
        outputFrame: [1130, 1702, 206, 196]      // 蒙版在视频帧中的位置（底部区域）
      }
    ]
  },
  // ... 更多帧
]
```

**关键字段说明：**
- `frameIndex`: 帧索引，从 0 开始
- `renderFrame`: [x, y, w, h] **元素在画面上的实际渲染位置**
- `outputFrame`: [x, y, w, h] **蒙版形状在视频帧中的位置**（通常在视频帧底部超出显示区域的部分）

> **重要**：`outputFrame` 不是元素的显示位置！它指向视频帧底部存放蒙版形状的区域。
> 蒙版的灰度值（R通道）控制元素的透明度动画。

## 坐标系统

YYEVA 视频帧结构（以 1504×1904 视频为例，显示区域 750×1700）：

```
┌─────────────────┬─────────────────┐ ← y=0
│   RGB 区域      │   Alpha 区域    │
│   (750×1700)    │   (750×1700)    │
│   colorX=0      │   alphaX=750    │
│                 │                 │
│  [renderFrame   │                 │
│   元素渲染在    │                 │
│   这个区域]     │                 │
│                 │                 │
├─────────────────┴─────────────────┤ ← y=1700 (displayHeight)
│                                   │
│        蒙版数据存储区域             │
│   outputFrame 指向这里！           │
│   如: [1130, 1702, 206, 196]       │
│                                   │
└───────────────────────────────────┘ ← y=1904 (videoHeight)
        ↑ x=0                x=1504 ↑
```

**要点：**
- `renderFrame` 坐标相对于 RGB 区域左上角 (0, 0)
- `outputFrame` 坐标相对于整个视频帧左上角，指向底部的蒙版区域
- 蒙版区域存储在视频帧底部（y > displayHeight 的部分）

## 完整示例

```json
{
  "descript": {
    "width": 720,
    "height": 720,
    "isEffect": 1,
    "version": 1,
    "rgbFrame": [0, 0, 360, 720],
    "alphaFrame": [360, 0, 360, 720],
    "fps": 30,
    "hasAudio": false
  },
  "effect": {
    "0": {
      "effectId": 0,
      "effectType": "txt",
      "effectTag": "text_01",
      "effectWidth": 200,
      "effectHeight": 50,
      "fontColor": "#ffffff",
      "fontSize": 36,
      "textAlign": "center"
    },
    "1": {
      "effectId": 1,
      "effectType": "img",
      "effectTag": "avatar_01",
      "effectWidth": 100,
      "effectHeight": 100,
      "scaleMode": "scaleAspectFit"
    }
  },
  "datas": [
    {
      "frameIndex": 0,
      "data": [
        {
          "effectId": 0,
          "renderFrame": [80, 300, 200, 50],
          "outputFrame": [80, 300, 200, 50]
        },
        {
          "effectId": 1,
          "renderFrame": [130, 150, 100, 100],
          "outputFrame": [130, 150, 100, 100]
        }
      ]
    }
  ]
}
```
