# YYEVA 双通道 MP4 播放器 Spec

## Why

当前 MeeWoo 项目支持双通道 MP4 播放（RGB + Alpha 合成），但不支持带 key 的 YYEVA 格式。YYEVA 格式允许在 MP4 中嵌入动态元素（文字、图片），通过 key 方式替换内容。需要扩展播放器以支持此格式，提升产品的动效预览能力。

## What Changes

- 新增 YYEVA Metadata 解析模块，从 MP4 中提取动态元素配置
- 扩展文件验证器，支持识别 YYEVA 格式（区分普通双通道 MP4）
- 扩展 YyevaPlayerAdapter，支持动态元素渲染
- 新增动态元素配置 API，允许用户设置替换内容

## Impact

- Affected specs: 双通道 MP4 播放能力
- Affected code:
  - `src/assets/js/utils/file-validator.js` - 文件格式检测
  - `src/assets/js/controllers/player-controller.js` - 播放器适配器
  - `src/assets/js/core/app.js` - 核心渲染逻辑
  - `src/assets/js/service/` - 新增 YYEVA 解析服务

---

## ADDED Requirements

### Requirement: YYEVA Metadata 解析

系统 SHALL 提供从 MP4 文件中解析 YYEVA Metadata 的能力。

#### 数据结构定义

YYEVA 数据存储在 MP4 的 `udta` -> `meta` box 中，格式为：
```
标记: "yyeffectmp4json"
数据: [[Base64(zlib压缩的JSON)]]
```

解析后的 JSON 结构：
```javascript
{
  descript: {
    width: number,        // 视频总宽度
    height: number,       // 视频总高度
    isEffect: 1,          // 是否为动态元素视频
    version: number,      // 版本号
    rgbFrame: [x, y, w, h],    // RGB 区域位置
    alphaFrame: [x, y, w, h],  // Alpha 区域位置
    fps: number,          // 帧率
    hasAudio: boolean     // 是否包含音频
  },
  effect: {
    "0": {
      effectId: number,
      effectType: "txt" | "img",
      effectTag: string,      // 元素标签（key）
      effectWidth: number,
      effectHeight: number,
      // 文本特有属性
      fontColor?: string,
      fontSize?: number,
      textAlign?: string,
      // 图片特有属性
      scaleMode?: string
    }
  },
  datas: [
    {
      frameIndex: number,
      data: [
        {
          effectId: number,
          renderFrame: [x, y, w, h],   // 渲染区域（相对于原始设计）
          outputFrame: [x, y, w, h]    // 输出区域（相对于最终画面）
        }
      ]
    }
  ]
}
```

#### Scenario: 解析 YYEVA 文件成功
- **WHEN** 用户加载一个 YYEVA 格式的双通道 MP4 文件
- **THEN** 系统自动检测并解析 Metadata
- **AND** 提取 descript、effect、datas 数据
- **AND** 标记文件类型为 `yyeva`

#### Scenario: 解析失败降级
- **WHEN** 文件不包含 YYEVA Metadata
- **THEN** 系统将其识别为普通双通道 MP4
- **AND** 正常播放 RGB + Alpha 合成画面

---

### Requirement: 文件类型检测

系统 SHALL 区分普通双通道 MP4 和 YYEVA 格式。

#### 检测流程
1. 先执行现有双通道检测逻辑
2. 如果是双通道，进一步搜索 `yyeffectmp4json` 标记
3. 找到标记则解析 Metadata，确认 `isEffect === 1`
4. 返回类型：`'dualChannel'` | `'yyeva'`

#### Scenario: 识别 YYEVA 格式
- **WHEN** 文件包含 `yyeffectmp4json` 标记
- **AND** `descript.isEffect === 1`
- **THEN** 返回 `{ type: 'yyeva', effect: [...], datas: [...] }`

#### Scenario: 识别普通双通道
- **WHEN** 文件是双通道但不包含 YYEVA 标记
- **THEN** 返回 `{ type: 'dualChannel' }`

---

### Requirement: 动态元素渲染

系统 SHALL 在播放 YYEVA 视频时渲染动态元素。

#### 渲染流程
1. 执行现有 RGB + Alpha 合成（基础双通道渲染）
2. 根据当前帧号查找 `datas[frameIndex]`
3. 遍历该帧的动态元素数据
4. 在 `outputFrame` 位置绘制动态元素

#### 文本元素渲染
- 使用 Canvas 2D `fillText` API
- 支持自定义：文本内容、字体颜色、字体大小、对齐方式
- 默认文本内容为 `effectTag`

#### 图片元素渲染
- 使用 Canvas 2D `drawImage` API
- 支持用户提供的替换图片
- 支持 `scaleFill` 缩放模式

#### Scenario: 渲染文本元素
- **WHEN** 当前帧包含文本类型动态元素
- **THEN** 在 outputFrame 位置绘制文本
- **AND** 应用 fontColor、fontSize、textAlign 样式

#### Scenario: 渲染图片元素
- **WHEN** 当前帧包含图片类型动态元素
- **AND** 用户已设置替换图片
- **THEN** 在 outputFrame 位置绘制图片
- **AND** 按 scaleMode 缩放

---

### Requirement: 动态元素配置 API

系统 SHALL 提供设置动态元素内容的 API。

#### API 设计
```javascript
// 设置文本内容
app.setYyevaText(effectTag, {
  text: "替换文本",
  fontColor: "#ff0000",  // 可选
  fontSize: 48           // 可选
});

// 设置替换图片
app.setYyevaImage(effectTag, imageElement | imageUrl | base64);

// 获取所有动态元素配置
app.getYyevaEffects(); // 返回 effect 列表
```

#### Scenario: 设置文本内容
- **WHEN** 用户调用 `setYyevaText("text_01", { text: "新文本" })`
- **THEN** 后续渲染使用新文本内容

#### Scenario: 设置替换图片
- **WHEN** 用户调用 `setYyevaImage("avatar_01", imageElement)`
- **THEN** 后续渲染使用该图片替换原始占位区域

---

## MODIFIED Requirements

### Requirement: 双通道 MP4 播放（扩展）

原有双通道播放功能保持不变，YYEVA 渲染作为增量逻辑叠加。

**修改点：**
- `renderYyevaFrame` 方法增加动态元素渲染步骤
- 仅当 `yyevaData` 存在时执行动态元素渲染

---

## REMOVED Requirements

无移除的需求。
