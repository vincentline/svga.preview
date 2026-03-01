---
name: yyeva
description: YYEVA 双通道 MP4 动效播放器技术指南。用于开发带 key 的双通道 MP4 播放功能、动态元素渲染、YYEVA 数据解析。触发条件：(1) 解析 YYEVA 格式的 MP4 文件；(2) 实现动态元素（文字/图片）替换渲染；(3) 了解 YYEVA 数据结构和 Metadata 解析方式；(4) 开发双通道 MP4 播放器相关功能；(5) 修改以下文件时自动触发：file-validator.js（YYEVA检测）、app.js（renderYyevaFrame/_renderYyevaEffects相关）、player-controller.js（YyevaPlayerAdapter）、yyeva-parser.js；(6) 涉及双通道MP4的key实现方式、动态元素渲染逻辑、YYEVA数据解析流程的代码变更。触发后需评估新技术/方法是否需要更新到skill文档中。
---

# YYEVA 双通道 MP4 技术指南

## 概述

YYEVA（YY Effect Video Animate）是 YYLive 推出的开源动效方案，支持在 MP4 中嵌入动态元素（文字、图片），通过 key 方式替换内容。本 skill 提供完整的技术实现指南。

**核心特性：**
- 透明 MP4 + 动态元素（mask_text / mask_image）
- 数据存储在 MP4 Metadata 中（zlib 压缩 + Base64 编码）
- 支持文本和图片两种动态元素类型

## 触发机制

### 用户请求触发
当用户请求以下任务时触发：
- 解析 YYEVA 格式的 MP4 文件
- 实现动态元素（文字/图片）替换渲染
- 了解 YYEVA 数据结构和 Metadata 解析方式
- 开发双通道 MP4 播放器相关功能
- 排查 YYEVA 相关问题

### 代码修改自动触发
当以下文件发生修改时自动触发：

| 文件 | 监控内容 |
|------|----------|
| `file-validator.js` | `detectYyevaType`、`_parseYyevaMetadata` 相关逻辑 |
| `app.js` | `renderYyevaFrame`、`_renderYyevaEffects`、`_renderYyevaText`、`_renderYyevaImage`、`setYyevaText`、`setYyevaImage` |
| `player-controller.js` | `YyevaPlayerAdapter` 及其方法 |
| `yyeva-parser.js` | 所有解析相关方法 |

### 触发后评估流程

代码修改触发后，执行以下评估：

```
1. 识别变更内容
   ↓
2. 判断是否涉及新技术/方法
   - 新的解析算法
   - 新的渲染方式
   - 新的 API
   - 性能优化方案
   - 兼容性处理
   ↓
3. 评估文档更新价值
   - 是否为通用解决方案？
   - 是否可复用于其他场景？
   - 是否解决常见问题？
   ↓
4. 更新对应文档
   - 数据结构变更 → references/data_structure.md
   - 实现方式变更 → references/implementation.md
   - 问题解决方案 → references/troubleshooting.md
```

## 快速参考

### 数据存储位置
```
MP4 文件结构：
├── moov
│   └── udta
│       └── meta  ← YYEVA 数据在这里
```

### 数据格式
```
标记: "yyeffectmp4json"
数据: [[Base64(zlib压缩的JSON)]]
```

### 解析流程
```javascript
// 1. 搜索标记
const markerIndex = buffer.indexOf('yyeffectmp4json');

// 2. 提取 Base64 数据
const base64Match = str.match(/\[\[([A-Za-z0-9+/=]+)\]\]/);

// 3. 解码和解压
const compressed = Uint8Array.from(atob(base64Match[1]), c => c.charCodeAt(0));
const decompressed = pako.inflate(compressed);

// 4. 解析 JSON
const jsonData = JSON.parse(new TextDecoder().decode(decompressed));
```

### 项目中的关键文件

```
src/assets/js/
├── utils/file-validator.js      # YYEVA 格式检测
│   └── detectYyevaType()        # 检测并解析 YYEVA 数据
├── core/app.js                  # 核心渲染逻辑
│   ├── renderYyevaFrame()       # 双通道渲染入口
│   ├── setYevaText()            # 设置文本 API
│   └── setYevaImage()           # 设置图片 API
├── controllers/player-controller.js
│   └── YyevaPlayerAdapter       # 播放器适配器
└── service/yyeva/
    ├── yyeva-parser.js          # 解析服务
    └── yyeva-renderer.js        # 渲染服务（核心）
        ├── renderEffects()      # 动态元素渲染调度
        ├── _renderText()        # 文本渲染（带透明度动画）
        ├── _renderImage()       # 图片渲染入口
        ├── _renderImageWithMask() # 蒙版提取与应用
        ├── _drawImageToCanvas() # cover模式绘制
        └── _applyMaskAlpha()    # 透明度应用
```

## 数据结构

详见 [references/data_structure.md](references/data_structure.md)

## 实现指南

详见 [references/implementation.md](references/implementation.md)

## 常见问题

详见 [references/troubleshooting.md](references/troubleshooting.md)

## 官方资源

- GitHub: https://github.com/yylive/YYEVA
- QQ 群: 981738110
- 注意：Web SDK 未开源，需自行实现或联系官方获取
