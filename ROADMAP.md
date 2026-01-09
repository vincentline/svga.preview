# 开发路线图

## 项目概述
构建支持 SVGA、双通道MP4、Lottie 三种动画格式的在线预览与转换工具。

--- 

## 阶段1：基础预览功能 ✅
**状态：已完成**

### 已实现功能
- ✅ SVGA 文件预览与播放控制
- ✅ 基础UI框架（顶部播放区 + 底部浮层）
- ✅ 暗黑/白天主题切换
- ✅ 背景色切换（6种颜色 + 透明网格）
- ✅ 画布缩放与拖拽
- ✅ 1:1 显示、居中显示
- ✅ 拖拽上传文件
- ✅ 播放进度条与帧数显示
- ✅ 模块切换（SVGA/双通道MP4/Lottie）

---

## 阶段2：SVGA 高级功能 ✅
**目标：完善 SVGA 模块的导出与转换能力**
**状态：已完成**

### 开发总结

#### 已完成功能
- ✅ **素材替换功能**（侧边栏展示、搜索、复制名称、替换上传）
- ✅ **导出GIF功能**（使用gif.js，支持背景色、进度显示）
- ✅ **缩放控制优化**（zoom in/out图标、hover状态、暗黑模式）
- ✅ **UI体验完善**（重传SVGA、文件信息展示、帮助说明）
- ✅ **转换为MP4**（使用ffmpeg.wasm，支持双通道、质量调整、帧率设置、静音选项）

#### 技术亮点
1. **GIF导出背景色处理**
   - 使用临时Canvas合成背景色
   - 透明部分使用当前背景色或默认白色
   - 过滤掉transparent和#000000避免黑色底

2. **素材替换流程**
   - 解析SVGA获取所有图片素材（imageKey）
   - 侧边栏展示缩略图（背景色同步播放器）
   - 支持搜索过滤、一键复制名称
   - 替换后自动重新渲染

3. **交互优化**
   - 图标hover状态（使用::after伪元素+CSS变量）
   - 暗黑模式图标切换（_dark后缀）
   - 侧边栏自动关闭（点击素材图/清空画布）

#### 用户体验改进
- 文件信息展示重构（去掉总标题，每项加独立标签）
- 搜索框+复制按钮（提升素材查找效率）
- 重传SVGA按钮（无需刷新页面重新上传）
- 缩放图标（zoom_in/zoom_out + 1:1按钮）

#### 关键代码位置
- GIF导出：`docs/index.html` - `exportGIF()` 方法
- 素材替换：`docs/index.html` - `showMaterialPanel()`, `replaceMaterial()` 方法
- 缩放控制：`docs/index.html` - `zoomIn()`, `zoomOut()` 方法
- 侧边栏UI：`docs/index.html` - `.material-panel` 相关样式

---

### 2.1 素材替换功能 ✅
**优先级：高**
**状态：已完成**

#### 功能描述
- 允许用户替换 SVGA 动画中的图片素材
- 预览替换后的效果
- 支持重新导出替换后的 SVGA 文件

#### 技术要点
- 使用 `SVGAParser` 解析 SVGA 文件结构
- 识别可替换的图片元素（`imageKey`）
- 提供图片上传界面
- 重新打包 SVGA 文件（需研究 SVGA 文件格式规范）

#### 待调研
- [ ] SVGA 文件内部结构（Protobuf 格式）
- [ ] 素材映射关系
- [ ] 是否有现成的编辑库

---

### 2.2 导出 GIF 功能 ✅
**优先级：高**
**状态：已完成**

#### 功能描述
- 将 SVGA 动画导出为 GIF 格式
- 支持自定义帧率、尺寸、质量
- 显示导出进度

#### 技术方案
```
SVGA → Canvas 逐帧渲染 → GIF 编码器 → 下载
```

#### 推荐库
- **gif.js**: 纯前端 GIF 编码器，使用 Web Worker
- **gifshot**: 更简单的 API，但体积较大

#### 实现步骤
1. 遍历 SVGA 每一帧，使用 Canvas 渲染
2. 将每帧 Canvas 数据传递给 GIF 编码器
3. 合成 GIF 并触发下载

#### 技术挑战
- 性能优化（使用 Web Worker）
- 内存管理（大尺寸动画可能占用大量内存）
- 进度反馈

---

### 2.3 转 双通道MP4 功能 ✅
**优先级：中**
**状态：已完成**

#### 功能描述
- 将 SVGA 转换为 双通道MP4 格式的 MP4 视频
- 双通道MP4 格式：彩色通道 + Alpha 通道并排的视频
- 支持进度显示、取消转换、错误处理

#### 详细实现方案

##### 1. 技术架构
```
SVGA文件 
  → 逐帧渲染到Canvas
  → 提取每帧的RGB数据和Alpha数据
  → 合成双通道画布（左彩色+右Alpha灰度图）
  → ffmpeg.wasm编码为MP4
  → 下载双通道MP4-MP4文件
```

##### 2. 核心模块

**模块1：ffmpeg.wasm加载器**
```javascript
loadFFmpeg: async function() {
  // 懒加载ffmpeg.wasm（约25MB）
  // CDN: https://unpkg.com/@ffmpeg/ffmpeg@0.12.x
  // 显示加载进度
  // 加载后缓存，避免重复加载
}
```

**模块2：序列帧提取**
```javascript
extractFrames: async function() {
  // 遍历SVGA所有帧（videoItem.frames）
  // 使用player.stepToFrame(i)跳转
  // 渲染到临时Canvas
  // 返回ImageData数组
}
```

**模块3：双通道合成**
```javascript
composeDualChannel: function(imageData) {
  // 创建宽度×2的Canvas
  // 左侧：RGB数据（Alpha=255）
  // 右侧：Alpha灰度图（R=G=B=Alpha值）
  // 返回合成后的Canvas
}
```

**模块4：MP4编码**
```javascript
encodeToMP4: async function(frames) {
  // 将序列帧写入ffmpeg虚拟文件系统
  // 使用libx264编码器
  // 参数：-framerate {fps} -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p output.mp4
  // 实时更新编码进度
  // 读取输出文件并返回Blob
}
```

**模块5：主流程**
```javascript
convertToYYEVAMP4: async function() {
  // 1. 检查是否已加载SVGA
  // 2. 加载ffmpeg（如果未加载）
  // 3. 显示进度弹窗
  // 4. 提取序列帧
  // 5. 合成双通道
  // 6. 编码为MP4
  // 7. 下载文件
  // 8. 错误处理和清理
}
```

##### 3. 数据结构
```javascript
// Vue data 新增属性
{
  ffmpegLoaded: false,        // ffmpeg是否已加载
  ffmpegLoading: false,       // ffmpeg是否正在加载
  isConvertingToMP4: false,   // 是否正在转换
  conversionProgress: {
    stage: '',                // 'loading'/'extracting'/'encoding'/'done'
    current: 0,               // 当前进度
    total: 0,                 // 总进度
    message: ''               // 进度消息
  }
}
```

##### 4. UI设计

**按钮位置**：底部浮层，"导出GIF"按钮右侧

**进度弹窗**：
```
<div class="conversion-modal" v-if="isConvertingToMP4">
  <div class="modal-content">
    <h3>转换为YYEVA-MP4</h3>
    <div class="progress-info">
      <p>{{ conversionProgress.message }}</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{width: progressPercent + '%'}"></div>
      </div>
      <p>{{ conversionProgress.current }} / {{ conversionProgress.total }}</p>
    </div>
    <button @click="cancelConversion">取消</button>
  </div>
</div>
```

##### 5. 性能优化

**懒加载策略**
- 首次转换时才加载ffmpeg.wasm
- 显示加载进度条（"正在加载转换器..."）
- 使用CDN加速：unpkg.com 或 jsdelivr.com

**尺寸限制**
- 最大宽度：2048px（双通道后4096px）
- 最大高度：2048px
- 超出则等比缩小，显示警告

**内存管理**
- 及时释放临时Canvas对象
- 分批处理序列帧（避免一次性加载所有帧）
- 编码完成后清理ffmpeg虚拟文件系统

**Web Worker（可选）**
- 将序列帧提取放入Worker
- 避免阻塞主线程
- 需要重构现有代码结构

##### 6. 错误处理

**前置检查**
- 未加载SVGA → 提示"请先上传SVGA文件"
- 浏览器不支持WASM → 提示"浏览器不支持，请使用Chrome/Edge"
- 文件尺寸过大 → 提示"文件尺寸超过限制"

**运行时错误**
- ffmpeg加载失败 → "加载转换器失败，请检查网络"
- 内存不足 → "内存不足，转换失败"
- 编码失败 → "编码失败，请重试或联系开发者"

**取消转换**
- 用户点击取消 → 终止ffmpeg进程
- 清理临时数据和虚拟文件系统
- 恢复UI状态

##### 7. 开发计划

| 步骤 | 任务 | 预计耗时 |
|------|------|----------|
| 1 | 引入ffmpeg.wasm库和初始化逻辑 | 30分钟 |
| 2 | 实现序列帧提取函数 | 20分钟 |
| 3 | 实现双通道合成函数 | 30分钟 |
| 4 | 实现MP4编码函数 | 40分钟 |
| 5 | 添加UI按钮和进度显示 | 30分钟 |
| 6 | 整合流程和错误处理 | 20分钟 |
| 7 | 测试和优化 | 30分钟 |

**预计总耗时**：3-4小时

##### 8. 技术风险和应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| ffmpeg.wasm体积大（25MB） | 首次加载慢 | CDN加速+懒加载+进度显示 |
| 编码速度慢 | 用户等待时间长 | 详细进度提示+支持取消 |
| 内存占用高 | 可能崩溃 | 限制最大尺寸+错误提示 |
| 浏览器兼容性 | 部分浏览器不支持 | 前置检查+降级提示 |

##### 9. 测试用例

**基础功能测试**
- [ ] 小尺寸SVGA（< 500x500）转换成功
- [ ] 中等尺寸SVGA（500-1000）转换成功
- [ ] 大尺寸SVGA（> 1000）显示缩放警告
- [ ] 进度显示正确更新
- [ ] 下载的MP4文件可正常播放

**边界测试**
- [ ] 未加载SVGA时点击转换 → 提示错误
- [ ] 转换过程中刷新页面 → 清理资源
- [ ] 转换过程中点击取消 → 正确终止
- [ ] 网络断开时加载ffmpeg → 提示错误

**兼容性测试**
- [ ] Chrome浏览器
- [ ] Edge浏览器
- [ ] Firefox浏览器
- [ ] Safari浏览器（可能不支持）

#### 推荐库
- **ffmpeg.wasm**: 在浏览器中运行的 FFmpeg（需要加载较大 WASM 文件）
  - 版本：@0.12.x
  - CDN：https://unpkg.com/@ffmpeg/ffmpeg@0.12.x

#### 实现步骤（简化版）
1. 渲染每帧 SVGA 到 Canvas
2. 提取彩色数据和 Alpha 数据
3. 合成双通道画布（左右并排布局）
4. 使用 ffmpeg.wasm 编码为 MP4
5. 下载文件

#### 技术挑战
- ffmpeg.wasm 体积大（约 25MB），需要 CDN 加速
- 编码速度较慢，需要进度提示
- 内存占用高，需要限制尺寸

---

## 阶段3：双通道MP4 与 Lottie 模块 🔄
**目标：完成多格式支持，实现格式互转**
**状态：部分完成**
**完成时间：2025-12-20**

### 已完成功能

#### 1. 双通道MP4模块 ✅
- ✅ 文件加载与预览
- ✅ 播放控制（播放/暂停/进度条/帧数显示）
- ✅ Alpha通道位置自动检测（左右/上下并排）
- ✅ **Alpha通道位置智能识别**（检测时返回alpha位置，支持左灰右彩和左彩右灰）
- ✅ 音频播放支持
- ✅ 透明通道正确渲染
- ✅ 模式切换优化（自动资源清理）
- ✅ 导出GIF功能
- ✅ 转换为SVGA功能
- ✅ **MP4双通道自动检测**（拖入MP4自动识别普通/双通道）
- ✅ **TaskId管理优化**（修复重复事件绑定导致的任务冲突问题）

#### 2. SVGA转双通道MP4 ✅
- ✅ 逐帧渲染到Canvas
- ✅ 提取RGB数据和Alpha数据
- ✅ 合成双通道画布（左彩色+右Alpha灰度图）
- ✅ 使用ffmpeg.wasm编码为MP4
- ✅ 进度显示、取消转换、错误处理
- ✅ 懒加载ffmpeg.wasm（首次转换时加载）

#### 3. Lottie模块 🔶
- 🔶 占位功能（拖入.json文件切换到Lottie模块）
- ❌ 实际播放功能待实现
- ❌ 导出功能待实现
- ❌ 转换功能待实现

### 技术亮点

1. **双通道自动检测**：智能识别Alpha通道在左右还是上下
2. **MP4类型自动识别**：拖入MP4自动判断普通/双通道，切换对应模式
3. **ffmpeg.wasm集成**：在浏览器中编码MP4，支持进度显示
4. **资源管理**：模式切换时自动清理video/canvas资源
5. **格式互转**：SVGA↔MP4双向转换
6. **音频支持**：双通道MP4保留音轨
7. **Alpha通道智能识别（2026-01-09）**：
   - 检测时通过分析左右两侧的饱和度差异自动判断哪侧是alpha通道
   - 支持左灰右彩和左彩右灰两种布局
   - 修复file-validator.js的detectMp4Type方法，返回alphaPosition参数
   - 优化app.js的loadYyeva方法，使用检测结果而非默认值
8. **TaskId管理优化（2026-01-09）**：
   - 修复重复绑定drop事件导致的同一文件被处理两次问题
   - 移除mounted中重复的window.addEventListener绑定
   - 保留Vue模板中的@drop.prevent绑定，符合Vue最佳实践
   - 修复detectionTaskId的生成时机，确保整个检测流程使用同一个taskId
   - 修复loadYyeva中的taskId验证逻辑，避免覆盖currentLoadTaskId

### 待完成

#### Lottie模块完善
- 实现lottie.loadAnimation()加载JSON
- 播放控制（播放/暂停/进度条）
- 帧数显示
- 导出GIF功能
- 转换为SVGA/MP4功能

---

### 3.1 双通道MP4 模块

#### 3.1.1 文件解析与预览
**功能描述**
- 加载带 Alpha 通道的 MP4 文件
- 解析双通道视频（左彩色/右Alpha 或 上彩色/下Alpha）
- 在 Canvas 上合成显示

**技术方案**
```
MP4 视频 → <video> 元素加载
         ↓
每帧绘制到 Canvas
         ↓
分离左右（或上下）通道
         ↓
彩色 + Alpha 合成最终图像
         ↓
显示到预览区
```

**推荐库**
- 原生 `<video>` 元素 + Canvas
- 或使用 **YYEVA** 官方库（如果有）

---

#### 3.1.2 播放控制
✅ **已完成**
- 播放/暂停
- 拖拽进度条
- 帧数显示
- 循环播放
- 音频播放支持
- 透明通道正确渲染
- 模式切换优化（MP4↔SVGA自动清理资源）

**技术要点**
- 监听 `<video>` 的 `timeupdate` 事件
- 通过 `requestAnimationFrame` 同步 Canvas 渲染
- 实现Alpha通道位置自动检测
- 支持左右并排和上下并排布局

---

---

#### 3.1.3 转 SVGA 功能
**功能描述**
- 将 双通道MP4 转换为 SVGA 格式

**技术方案**
```
MP4 视频 → 逐帧提取彩色 + Alpha
         ↓
生成序列帧（PNG 带透明）
         ↓
重新打包为 SVGA 文件
         ↓
下载
```

**技术挑战**
- SVGA 文件格式需要深度研究
- 可能需要后端支持（或使用现成库）

---

### 3.2 Lottie 模块

#### 3.2.1 Lottie JSON 解析与预览
**当前状态**
- 已引入 `lottie-web` 库
- 拖入 `.json` 文件会切换到 Lottie 模块，但只是占位

**待实现**
- 使用 `lottie.loadAnimation()` 加载 JSON
- 在预览区渲染 Lottie 动画
- 支持播放控制

**技术参考**
```javascript
const animation = lottie.loadAnimation({
  container: element,
  renderer: 'canvas', // 或 'svg'
  loop: true,
  autoplay: true,
  animationData: jsonData
});
```

---

#### 3.2.2 播放控制与功能完善
- 播放/暂停
- 进度条拖拽
- 帧数显示
- 导出功能（可选）

---

## 技术准备清单

### 1. YYEVA-MP4 格式规范
**调研内容**
- YYEVA 格式定义（YY开源？）
- 双通道布局方式（左右并排 vs 上下并排）
- 是否有官方解析库

**参考资源**
- GitHub 搜索 "YYEVA"
- 查看腾讯开源项目

---

### 2. 序列帧提取方案
**方案对比**

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| Canvas API | 原生支持，无依赖 | 需手动编码 | 简单场景 |
| ffmpeg.wasm | 功能强大，支持多种格式 | 体积大（25MB+） | 复杂转换 |

**推荐**：优先使用 Canvas API，复杂场景再引入 ffmpeg.wasm

---

### 3. GIF 导出方案
**库对比**

| 库名 | 大小 | 特点 | GitHub Stars |
|------|------|------|--------------|
| gif.js | ~50KB | Web Worker 支持 | 4.8k+ |
| gifshot | ~200KB | API 简单 | 3.9k+ |

**推荐**：gif.js（体积小，性能好）

**CDN 引入**
```html
<script src="https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js"></script>
```

---

### 4. MP4 合成方案
**方案对比**

| 方案 | 优点 | 缺点 |
|------|------|------|
| ffmpeg.wasm | 功能完整，格式支持全 | 体积大，速度慢 |
| MediaRecorder API | 浏览器原生，无依赖 | 兼容性差，格式受限 |

**推荐**：ffmpeg.wasm（兼容性更好）

**引入方式**
```javascript
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
const ffmpeg = createFFmpeg({ log: true });
await ffmpeg.load();
```

---

## 开发优先级建议

### 第一批（高优先级）
1. ✅ 技术调研（YYEVA、GIF、序列帧、MP4 合成）
2. ✅ SVGA 素材替换功能
3. ✅ SVGA 导出 GIF 功能
4. 🔄 SVGA 转 双通道MP4 功能（设计完成）
5. ⏳ Lottie 预览功能

### 第二批（中优先级）
1. ✅ 双通道MP4 预览与播放控制
2. ⏳ Lottie 播放控制与功能完善

### 第三批（低优先级）
1. 双通道MP4 转 SVGA
2. 性能优化和体验提升

---

## 依赖包规划

### 当前依赖
```json
{
  "dependencies": {
    "element-ui": "^2.15.1"
  },
  "devDependencies": {
    "vuepress": "^1.8.2"
  }
}
```

### 计划新增（CDN 方式引入，无需安装）
- `gif.js` - GIF 导出
- `@ffmpeg/ffmpeg` - MP4 合成
- `lottie-web` - 已引入

---

## 风险评估

### 技术风险
1. **ffmpeg.wasm 性能问题**
   - 影响：编码速度慢，用户等待时间长
   - 缓解：显示详细进度条，考虑后端支持

2. **内存占用**
   - 影响：大尺寸动画可能导致页面崩溃
   - 缓解：限制最大尺寸，分块处理

3. **SVGA 格式解析复杂性**
   - 影响：素材替换和转换功能难以实现
   - 缓解：深入研究 Protobuf 格式，或寻求社区支持

### 兼容性风险
- Web Worker 支持（GIF 导出）
- WASM 支持（ffmpeg.wasm）
- Canvas API 性能（低端设备）

---

## 下一步行动

### 立即开始
1. 调研 YYEVA-MP4 格式规范
2. 验证 gif.js 库的可行性（创建 Demo）
3. 验证 ffmpeg.wasm 的性能（测试编码速度）

### 本周目标
- 完成所有技术调研
- 产出技术方案文档
- 实现 GIF 导出原型

---

## 参考资源

### SVGA 相关
- [SVGAPlayer-Web](https://github.com/svga/SVGAPlayer-Web)
- [SVGA 格式规范](https://github.com/svga/SVGA-Format)

### GIF 导出
- [gif.js](https://github.com/jnordberg/gif.js)
- [gifshot](https://github.com/yahoo/gifshot)

### MP4 合成
- [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)

### Lottie
- [lottie-web](https://github.com/airbnb/lottie-web)
- [Lottie 官方文档](https://airbnb.io/lottie/)

---

*最后更新：2026-01-08*
*阶段2完成日期：2024-12-13*
*阶段3完成日期：2025-12-20*
*代码优化完成日期：2025-12-21*
*阶段6完成日期：2025-12-29*
*SVGA音频同步修复：2025-12-30*
*沉浸模式完成日期：2026-01-01*
*素材压缩功能完成日期：2026-01-02*
*变速编辑器完成日期：2026-01-04*
*代码模块化第二阶段完成日期：2026-01-04*

---

## 阶段11：代码模块化第二阶段 ✅
**状态：已完成**
**完成时间：2026-01-04**

### 功能概述
继续代码模块化重构，将更多功能从app.js中抽离为独立模块，进一步提升代码可维护性。

### 已完成功能

#### 1. 文件验证器模块 ✅
**文件**：`file-validator.js` (20.2KB)

**功能**：
- 统一文件类型验证入口
- 自动识别文件格式（SVGA/双通道MP4/普通MP4/Lottie/序列帧）
- 支持批量文件验证
- 文件大小限制检查

**代码位置**：`docs/assets/js/file-validator.js`

#### 2. 工具函数库 ✅
**文件**：`utils.js` (16.3KB)

**功能**：
- 通用工具函数集合
- 字符串处理、数组操作
- 颜色转换、格式化
- 防抖、节流函数

**代码位置**：`docs/assets/js/utils.js`

#### 3. 素材编辑器模块 ✅
**文件**：`material-editor.js` (23.7KB)

**功能**：
- 素材图片编辑功能
- 替换底图
- 添加文字覆盖层（支持CSS样式）
- 预览缩放和平移
- 视图模式切换（1:1 / 适应高度）
- 导出编辑后图片为PNG

**技术亮点**：
- 作为Vue Mixin混入主应用
- 样式过滤（阻止布局相关CSS属性）
- 支持文字拖拽定位
- 智能缩放算法：优先按高度75%适应，宽度超出则改为按宽度100%
- 图标按钮使用雪碧图，通过动态class切换状态

**代码位置**：`docs/assets/js/material-editor.js`

#### 4. MP4转换器模块 ✅
**文件**：`mp4-converter.js` (5.7KB)

**功能**：
- 普通MP4转双通道MP4
- 普通MP4转SVGA
- ffmpeg.wasm集成

**代码位置**：`docs/assets/js/mp4-converter.js`

### 成果统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 新增模块 | 4个 | file-validator/utils/material-editor/mp4-converter |
| 抽离代码 | ~66KB | 从app.js抽离 |
| Mixin模式 | 1个 | MaterialEditor作为Vue Mixin |

---

## 阶段10：变速编辑器（K帧时间轴重映射）✅
**状态：已完成**
**完成时间：2026-01-04**

### 功能概述
为普通MP4模式增加时间轴重映射（变速）能力，通过K帧节点控制视频播放速度，实现帧级精度的速度变化。

**核心使用场景**：AI生成的短视频速度调整困难，需要帧级别的精确速度控制。

### 已完成功能

#### 1. K帧时间轴编辑器 ✅
**交互设计**：
- 底部浮层新增「变速」按钮
- 点击后浮层外左侧显示时间轴编辑器
- 时间轴固定宽度400px，高度16px
- 起点/终点节点固定（黑色），中间K帧可拖拽（蓝色）

**节点操作**：
- 添加K帧：点击时间轴空白处，弹出速度选择器
- 调整位置：拖拽蓝色手柄（11px宽），吸附到帧位置
- 调整速度：点击节点弹出速度滑块（0.5x - 5.0x）
- 删除K帧：速度面板中的删除按钮

#### 2. 速度插值算法 ✅
**线性插值**：
```javascript
function getSpeedAtFrame(frame, keyframes) {
  // 找到frame所在的两个关键帧区间
  const ratio = (frame - k1.frame) / (k2.frame - k1.frame);
  return k1.speed + (k2.speed - k1.speed) * ratio;
}
```

#### 3. 数据结构 ✅
```javascript
speedRemapConfig: {
  enabled: false,              // 是否启用变速
  keyframes: [                 // 关键帧数组
    { frame: 0, speed: 1.0, draggable: false },
    { frame: 60, speed: 2.0, draggable: true },
    { frame: 150, speed: 1.0, draggable: false }
  ],
  outputDuration: 3.2,         // 预计输出时长
  outputTotalFrames: 96        // 预计输出帧数
}
```

#### 4. 导出时应用变速 ✅
- 计算帧映射表
- 三种格式支持（MP4/SVGA/GIF）

### 技术亮点

1. **帧级精度**：2.67px/帧的精度（400px / 150帧）
2. **实时预览**：拖拽时实时计算输出时长
3. **平滑插值**：支持线性和Ease-In-Out两种模式
4. **统一导出**：变速配置自动应用到所有导出格式

### 文件变更

- `docs/index.html` - 变速UI布局和交互
- `docs/assets/css/styles.css` - 时间轴和K帧样式
- `docs/assets/js/app.js` - 变速数据和方法
- `video_edit.md` - 详细设计文档

---

## 阶段9：SVGA素材压缩与导出流程优化 ✅
**状态：已完成**
**完成时间：2026-01-02**

### 功能概述
素材压缩功能允许用户缩小SVGA中的图片尺寸，减少内存占用和文件体积。

**核心特性**：
- 图片尺寸缩小（scalePercent: 10-100%）
- 与导出SVGA功能合并，一键「压缩并导出」
- 导出时自动修改sprite的transform实现放大显示
- 支持撤销压缩

### 技术结论
- ✅ 尺寸缩小是最有效的压缩方式（内存减少 = 像素减少）
- ❌ 前端PNG质量压缩效果有限，无法达到专业工具水平
- ℹ️ 进一步优化需后端集成TinyPNG/pngquant等专业工具

### 已完成功能

#### 1. 压缩流程 ✅
```
原始图片 (250x250)
    ↓
尺寸缩小 (scalePercent=70% → 175x175)
    ↓
Canvas原生PNG编码
    ↓
导出SVGA时使用小图 + 修改transform
```

#### 2. Transform处理核心算法 ✅
**关键发现**：
- transform矩阵的a/b/c/d必须同步缩放
- tx/ty不能缩放（画布坐标系下的绝对偏移量）
- layout完全不变

```javascript
var scaleUp = originalWidth / scaledWidth;
frame.transform.a = origA * scaleUp;
frame.transform.b = origB * scaleUp;
frame.transform.c = origC * scaleUp;
frame.transform.d = origD * scaleUp;
frame.transform.tx = origTx;  // 保持不变
frame.transform.ty = origTy;  // 保持不变
```

#### 3. UI/UX优化 ✅
- 「压缩并导出新SVGA」按钮（合并操作）
- 已压缩时显示绿色✓标记
- 弹窗内有「撤销」按钮
- 导出成功使用toast提示

### 数据对比
- 原始文件：975KB
- 尺寸缩小70%：内存占用 13.8MB → 6.8MB（减小51%）

### 文件变更
- `docs/assets/js/app.js` - 压缩相关方法和数据
- `docs/index.html` - 压缩弹窗UI

---

## 阶段8：沉浸模式（Immersive Mode）✅
**状态：已完成**
**完成时间：2026-01-01**

### 功能概述
沉浸模式为用户提供更大的动画展示空间，通过隐藏非核心UI元素，让用户专注于内容本身。

**核心特性**：
- 标题栏向上退出消失（300ms动画）
- 底部完整浮层切换为mini浮层（154px → 80px）
- 视图自动向上移动，充分利用空间
- 隐藏恢复播放、清空画布、帮助按钮
- 模式名称居中显示

### 已完成功能

#### 1. 状态管理 ✅
```javascript
data: {
  isImmersiveMode: false  // 沉浸模式状态
}
```

#### 2. 视图控制器调整 ✅
- 新增 `setHeaderHeight()` 和 `setFooterHeight()` 方法
- 动态计算可用高度
- 自动调用 `centerView()` 重新居中

**可用高度对比**：
| 模式 | headerHeight | footerHeight | 可用高度（1080p） |
|------|--------------|--------------|------------------|
| 普通 | 36px | 154px | 890px |
| 沉浸 | 0px | 80px | 1000px |

沉浸模式增加110px显示空间。

#### 3. Mini浮层 ✅
**保留功能**：
- ✅ 播放/暂停
- ✅ 静音控制
- ✅ 1:1/适应屏幕切换
- ✅ 退出沉浸模式
- ✅ 模式名称显示

**禁用功能**：
- ❌ 恢复播放
- ❌ 清空画布
- ❌ 帮助按钮
- ❌ 进度条显示

#### 4. 视觉居中优化 ✅
```javascript
// 统一向上偏移20px获得更好的视觉效果
this.offsetY = this.headerHeight + (availableHeight - contentHeight) / 2 - 20;
```

### 技术亮点

1. **动态视图计算**：切换模式时自动重新居中
2. **视觉居中调整**：数学居中往往视觉偏下，统一向上偏移20px
3. **雪碧图更新**：从6行扩展到8行，新增Mini图标
4. **Toast防闪现**：页面加载时不闪现toast容器

### 文件变更
- `docs/assets/js/app.js` - 沉浸模式状态和方法
- `docs/assets/js/viewport-controller.js` - 动态高度计算
- `docs/assets/css/styles.css` - Mini浮层样式
- `docs/index.html` - Mini浮层HTML结构

---

## 阶段7：SVGA播放器重构与音频同步修复 ✅
**状态：已完成**
**完成时间：2025-12-30**

### 已完成功能

#### 1. 播放器适配器模式重构 ✅
**问题**：多种播放器（SVGA/Lottie/双通MP4）接口不统一，代码重复

**解决**：
- ✅ 实现适配器模式（Adapter Pattern）
- ✅ 统一播放控制接口：`play()`, `pause()`, `seekTo()`, `setMuted()`
- ✅ 封装 `LottiePlayerAdapter`, `SvgaPlayerAdapter`, `YyevaPlayerAdapter`
- ✅ `PlayerController` 统一调度，自动选择合适的适配器

**技术亮点**：
- 适配器链模式：自动匹配当前模式
- 状态集中管理：`state` 对象共享
- 接口隔离：业务代码不直接访问播放器

**代码位置**：`docs/assets/js/player-controller.js`

---

#### 2. SVGA音频同步修复 ✅
**问题**：
1. Lottie拖动进度条会强制暂停
2. SVGA进度条不更新
3. SVGA静音功能失效
4. SVGA暂停后音频继续播放
5. SVGA暂停/播放出现音频叠加
6. SVGA暂停后播放声音从头开始

**解决方案**：

**问题1&2：Lottie拖动暂停 + SVGA进度不更新**
- Lottie: `seekTo()` 根据 `isPlaying` 状态选择 `goToAndPlay()` 或 `goToAndStop()`
- SVGA: 修复 `onFrame` 调用方式，从 `player.onFrame = callback` 改为 `player.onFrame(callback)`

**问题3：SVGA静音功能失效**
- 在 `loadSvgaFile()` 中添加音频提取逻辑：`file.arrayBuffer().then(parseSvgaAudioData)`

**问题4-6：音频同步问题（核心修复）**

尝试方案：
1. ✗ `Howler.mute(true/false)` - 只是静音，音频还在后台播放
2. ✗ `Howler.stop()` - 完全停止，播放时从头开始
3. ✗ 保存/恢复音频位置 - 时序不稳定，容易混乱

**最终方案：阻止SVGA重创建音频实例**

```javascript
SvgaPlayerAdapter.prototype.play = function() {
  var existingHowls = [];
  if (typeof Howler !== 'undefined' && Howler._howls) {
    existingHowls = Howler._howls.slice(); // 记录旧实例
  }
  
  // SVGA 从当前位置继续播放（会创建新的音频实例）
  var currentPercentage = (this.state.progress || 0) / 100;
  this.state.svgaPlayer.stepToPercentage(currentPercentage, true);
  
  // 延迟 50ms，停止新实例，恢复旧实例
  setTimeout(function() {
    if (typeof Howler !== 'undefined' && Howler._howls) {
      Howler._howls.forEach(function(howl) {
        if (howl && existingHowls.indexOf(howl) === -1) {
          howl.stop(); // 新实例，停止
        }
      });
      
      if (!_this.state.isMuted) {
        existingHowls.forEach(function(howl) {
          if (howl && !howl.playing()) {
            howl.play(); // 旧实例，恢复
          }
        });
      }
    }
  }, 50);
};

SvgaPlayerAdapter.prototype.pause = function() {
  this.state.svgaPlayer.pauseAnimation();
  
  // 暂停所有 Howler 音频（保留播放位置）
  if (typeof Howler !== 'undefined' && Howler._howls) {
    Howler._howls.forEach(function(howl) {
      if (howl && howl.playing()) {
        howl.pause();
      }
    });
  }
};
```

**关键技术点**：
1. **识别新旧实例**：通过对比 `Howler._howls` 数组
2. **阻止重复创建**：停止 SVGA 新创建的音频实例
3. **保持位置**：Howler 的 `pause()/play()` 原生支持
4. **延迟处理**：等待 SVGA 创建完新实例后再处理

**效果**：
- ✅ 动画从暂停位置继续
- ✅ 音频从暂停位置继续
- ✅ 无音频叠加问题
- ✅ 音画完全同步

**文件位置**：
- `docs/assets/js/player-controller.js` - 播放控制器
- `docs/assets/js/app.js` - SVGA 加载逻辑

---

### 技术亮点

1. **适配器模式**：统一多种播放器接口，提升可维护性
2. **SVGA onFrame API**：修复官方 API 调用方式，解决进度条不更新
3. **Howler.js 音频管理**：通过 `Howler._howls` 内部数组管理音频实例
4. **实例识别算法**：利用数组对比识别新旧实例，防止叠加
5. **异步时序控制**：使用 `setTimeout` 等待 SVGA 创建实例

---

### 成果统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 修复Bug | 6个 | Lottie拖动/SVGA进度/静音/音频同步 |
| 重构模块 | 1个 | PlayerController 适配器模式 |
| 新增适配器 | 3个 | Lottie/SVGA/YYEVA |
| 代码优化 | 200+行 | 注释、简化、规范 |

---

## 阶段6：代码模块化与广告系统 ✅
**状态：已完成**
**完成时间：2025-12-29**

### 已完成功能

#### 1. 代码模块化重构 ✅
**问题**：app.js 326KB，代码集中，难维护，影响IDE性能

**解决**：
- ✅ 抽离8个独立模块，总计68KB
- ✅ PlayerController - 播放控制器 (11KB)
- ✅ SVGABuilder - SVGA构建器 (13.2KB)
- ✅ DualChannelComposer - 双通道合成器 (6.8KB)
- ✅ LibraryLoader - 库加载管理器 (8.5KB)
- ✅ GIFExporter - GIF导出器 (8.0KB)
- ✅ AdController - 广告控制器 (6.8KB)
- ✅ SiteConfigLoader - 配置加载器 (7.8KB)

**效果**：
- 代码结构更清晰
- 单一职责原则
- 易于单元测试
- 提升IDE性能

**模块设计原则**：
```javascript
// 单一职责、接口清晰、避免耦合
(function(global) {
  'use strict';
  
  function ModuleName(options) {
    // 初始化
  }
  
  ModuleName.prototype.method = function() {
    // 方法
  };
  
  global.ModuleName = ModuleName;
})(window);
```

#### 2. Google AdSense广告集成 ✅
**问题**：需要集成广告系统，支持远程控制

**解决**：
- ✅ 集成Google AdSense广告代码
- ✅ 实现广告位控制器
- ✅ 实现配置加载器
- ✅ 支持远程配置（腾讯云COS）
- ✅ 响应式布局（<1200px隐藏）
- ✅ 自动初始化AdSense广告单元

**文件结构**：
```
site-config.json (远程配置)
  ↓
SiteConfigLoader (加载配置)
  ↓
AdController (控制广告位)
  ↓
index.html ([data-ad-position] 容器)
```

**配置结构**：
```json
{
  "version": "1.0.0",
  "timestamp": 1735315567000,
  "features": {
    "advertisement": {
      "enabled": true,
      "position": "right-float"
    }
  }
}
```

**技术亮点**：
1. 配置与逻辑分离
2. 远程配置热更新
3. 降级处理机制
4. 防止重复初始化
5. 自动检测初始化状态

#### 3. 技术文档完善 ✅

**新增文档**：
- `GIF-EXPORT-TECHNICAL-DOCUMENTATION.md` - GIF导出技术详解
- `AD-CONFIG-README.md` - 广告配置说明

**更新文档**：
- `ROADMAP.md` - 增加阶段6内容
- `TECH-RESEARCH.md` - 新增模块化和广告系统技术记录

### 成果统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 抽离模块 | 8个 | 总计68KB代码 |
| 新增文档 | 2个 | 技术文档 |
| 更新文档 | 2个 | 项目文档 |
| 广告位 | 1个 | 右侧浮层 |
| 配置文件 | 1个 | 远程控制 |

### 技术亮点

1. **模块化设计**：单一职责、接口清晰、避免耦合
2. **透明GIF导出**：Canvas alpha通道 + GIF transparent配置
3. **去预乘Alpha**：避免双通道合成时颜色失真
4. **配置分离**：广告配置与代码逻辑分离
5. **降级处理**：外部服务失败不影响主功能

---

## 阶段4：代码质量与结构优化 ✅
**状态：已完成**
**完成时间：2025-12-21**

### 已完成功能

#### 1. 代码模块化整理 ✅
**问题**：app.js超过4400行，缺少索引，功能分散

**解决**：
- ✅ 添加66行模块索引注释
- ✅ 添加15个分区标记
- ✅ 相关功能聚合在一起
- ✅ 统一注释风格

**效果**：
- 快速定位任意功能
- 新功能有明确的所属分区
- 可维护性大幅提升

#### 2. 清理VuePress遗留文件 ✅
**问题**：1.5MB无用VuePress资源占用空间

**删除文件**：
- ✅ 23个VuePress JS文件（含961KB的app.js）
- ✅ 1个VuePress CSS文件（253KB）
- ✅ 2个Element UI字体文件

**效果**：
- 节省空间约1.5MB
- 清空3个无用目录
- 项目更轻量

#### 3. 404页面重构 ✅
**问题**：点击"Take me home"跳转到旧VuePress页面

**解决**：
- ✅ 完全重写404.html
- ✅ 移除VuePress路由
- ✅ 直接跳转到index.html
- ✅ 支持暗黑模式
- ✅ 简洁现代设计

#### 4. 文件结构优化 ✅
**问题**：CSS/JS文件分散在根目录

**优化**：
- ✅ `styles.css` → `assets/css/styles.css`
- ✅ `app.js` → `assets/js/app.js`
- ✅ `gif.worker.js` → `assets/js/gif.worker.js`
- ✅ `svga-web.js` → `assets/js/svga-web.js`
- ✅ 更新5处引用路径

**效果**：
- 静态资源统一管理
- 目录结构更清晰
- 符合规范

#### 5. 样式整合 ✅
**问题**：index.html内有内联样式

**解决**：
- ✅ 将spin动画移到styles.css
- ✅ 删除内联`<style>`标签
- ✅ 所有样式集中管理

#### 6. Protobuf路径修复 ✅
**问题**：导出新SVGA报错"no such type: com.opensource.svga.MovieEntity"

**原因**：protobuf加载路径错误

**修复**：
- ✅ 3处`'svga.proto'` → `'./svga.proto'`
- ✅ 增强错误检查（root、MovieEntity验证）
- ✅ 添加详细错误日志

### 技术亮点

1. **模块化索引**：66行注释，15个分区，快速定位
2. **资源优化**：删除26个无用文件，节甁1.5MB
3. **统一管理**：静态资源集中到assets
4. **防御性编程**：protobuf多层检查
5. **用户体验**：404页面支持暗黑模式

### 成果统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 模块索引 | 66行 | 完整的功能导航 |
| 分区标记 | 15个 | 清晰的代码分区 |
| 删除文件 | 26个 | VuePress遗留文件 |
| 节省空间 | 1.5MB | 无用资源 |
| 移动文件 | 4个 | CSS/JS资源 |
| 更新引用 | 5处 | 路径更新 |
| Bug修复 | 3个 | 404/protobuf/worker |

---

## 未来规划

### 短期目标
- ✅ 代码模块化整理
- ✅ 文件结构优化
- ✅ 清理无用资源

### 中期目标（如需要）
- 抽取库加载管理器为`library-loader.js`
- 抽取格式转换功能为`converters.js`
- 抽取导出功能为`exporters.js`

### 长期目标
- Lottie模块完善（播放、导出、转换）
- 性能优化（大文件处理、内存优化）
- 批量处理功能
- 使用Vue CLI构建工具
- TypeScript迁移

---

## 阶段5：普通MP4模式与导出功能增强 🔄
**目标：完善普通MP4处理能力，衔接AIGC工作流**
**状态：进行中**
**开始时间：2025-12-24**

### 核心定位
本阶段聚焦于**普通MP4模式**的完善，使项目成为AIGC到客户端动画格式的转换枢纽：
```
AI生成视频（普通MP4）
    │
    ├─→ 绿幕视频 ──→ 扣绿幕 ──→ 透明序列帧 ──→ 双通道MP4 / SVGA / GIF
    │
    └─→ 已有透明通道 ──→ 直接转换 ──→ 双通道MP4 / SVGA / GIF
```

### 5.1 导出GIF模块化改造
**优先级：高**
**状态：待开始**

#### 功能描述
- 将GIF导出功能抽取为独立模块
- 所有模式（SVGA/双通道MP4/普通MP4/Lottie）统一调用
- 增加导出弹窗，支持参数配置

#### 导出参数
| 参数 | 说明 | 默认值 | 范围 |
|-----|------|-------|------|
| width | 输出宽度 | 原始宽度 | 50-1920 |
| height | 输出高度 | 原始高度 | 50-1920 |
| fps | 帧率 | 15 | 5-30 |
| quality | 质量 | 80 | 1-100 |
| frameRange | 帧范围 | 全部 | 起始帧-结束帧 |

#### 技术方案
```javascript
// 模块化调用方式
GIFExporter.open({
  source: canvas,
  totalFrames: 100,
  defaultConfig: { width: 750, fps: 15 },
  onExport: (blob) => { /* 下载 */ }
});
```

---

### 5.2 普通MP4模式完善
**优先级：极高**
**状态：待开始**

#### 5.2.1 普通MP4 → 双通道MP4
**优先级：极高**

**功能描述**：
- 将扣除绿幕后的透明视频合成为双通道MP4
- 左侧彩色通道 + 右侧Alpha灰度通道

**技术方案**：
```
普通MP4 → 扣绿幕 → 提取每帧RGB+Alpha → 合成双通道画布 → ffmpeg编码 → 下载
```

**复用代码**：
- ffmpeg.wasm加载逻辑（已有）
- 双通道合成逻辑（已有，composeDualChannel）
- MP4编码逻辑（已有，encodeToMP4）

---

#### 5.2.2 普通MP4 → SVGA
**优先级：极高**

**功能描述**：
- 将扣除绿幕后的透明视频转换为SVGA格式
- 使用序列帧方式生成SVGA

**技术方案**：
```
普通MP4 → 扣绿幕 → 提取序列帧PNG → protobuf编码 → pako压缩 → 下载.svga
```

**复用代码**：
- 双通道MP4→SVGA的全部逻辑（extractYyevaFrames、buildSVGAFile）
- protobuf编码和pako压缩（已有）

---

#### 5.2.3 普通MP4 → GIF
**优先级：高**

**功能描述**：
- 将普通MP4导出为GIF动画
- 支持原视频导出或扣绿幕后导出

**技术方案**：
- 复用导出GIF模块（5.1）
- 逐帧提取 → gif.js编码 → 下载

---

### 5.3 普通MP4扣绿幕功能
**优先级：高**
**状态：待开始**

#### 功能描述
- 在普通MP4模式底部浮层添加"扣绿幕"按钮
- 实时预览扣除效果
- 支持参数调整优化效果

#### 扣绿幕参数
| 参数 | 说明 | 默认值 | 范围 |
|-----|------|-------|------|
| threshold | 绿色阈值 | 0.4 | 0-1 |
| smoothness | 边缘平滑 | 0.1 | 0-0.3 |

#### 技术方案
```javascript
// 色度键控（Chroma Key）算法
function removeGreenScreen(imageData, threshold, smoothness) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const greenness = (g - Math.max(r, b)) / 255;
    if (greenness > threshold) {
      const alpha = Math.max(0, 1 - (greenness - threshold) / smoothness);
      data[i + 3] = alpha * 255;
    }
  }
}
```

---

### 5.4 Lottie预览功能
**优先级：高**
**状态：待开始**

#### 功能描述
- 实现Lottie JSON文件的加载和预览
- 支持播放控制（播放/暂停/进度条/帧数显示）

#### 技术方案
```javascript
const animation = lottie.loadAnimation({
  container: this.$refs.lottieContainer,
  renderer: 'canvas',
  loop: false,
  autoplay: false,
  animationData: jsonData
});

// 统一播放控制接口
animation.play();
animation.pause();
animation.goToAndStop(frame, true);
```

#### 暂不实现
- Lottie → SVGA（技术复杂度高）
- Lottie → MP4（需求不明确）

---

### 5.5 移动端基础适配
**优先级：低**
**状态：待开始**

#### 功能描述
- 基础响应式布局适配
- 触摸设备可用（不做深度优化）

#### 技术方案
- 媒体查询调整布局
- 隐藏部分高级功能（如素材替换侧边栏）
- 禁止横向滚动

```
@media (max-width: 768px) {
  .material-panel { display: none; }
  .footer-bar { flex-wrap: wrap; }
}
```

### 5.6 序列帧模式
**优先级：高**
**状态：待开始**

#### 功能描述
- 新增序列帧作为独立输入模式，与SVGA/双通道MP4/普通MP4/Lottie并列
- 支持拖入或打开多个图片文件（PNG/JPG）
- 自动识别序列帧：按文件名中的数字排序（如 frame_0001.png）
- 播放前弹窗询问序列帧帧率（1-120 fps），默认25fps
- 底部浮层左下增加"改变帧率"按钮，支持运行时调整
- 序列帧可导出为：SVGA、双通道MP4、GIF、普通MP4

#### 技术方案

**文件识别与排序**：
```javascript
// 从文件名提取数字，按升序排序
function sortFrameFiles(files) {
  return files.sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
    return numA - numB;
  });
}
```

**数据结构**：
```javascript
frameSequence: {
  frames: [                    // 帧列表
    { file: File, index: 0, url: string },
    ...
  ],
  meta: {
    width: number,             // 从第一帧获取
    height: number,
    totalFrames: number,
    fps: 25,                   // 用户设置的帧率
    hasAlpha: boolean          // 是否透明PNG
  },
  currentFrame: 0,
  isPlaying: false
}
```

**播放控制**：
- 使用 `requestAnimationFrame` + 时间戳控制帧率
- 计算公式：`frameIndex = Math.floor(elapsed * fps / 1000)`
- 渲染：每帧从 File 对象创建临时 Image，绘制到 Canvas

**导出复用**：
- 导出SVGA：复用 `buildSVGAFile()`，输入改为序列帧数组
- 导出双通道MP4：复用 `composeDualChannelFrames()` + ffmpeg
- 导出GIF：复用 GIF导出模块（5.1）

**内存优化**：
- 不一次性加载所有帧的像素数据
- 按需加载：播放/导出时才读取 File → Image → Canvas
- 及时释放 ObjectURL

---

### 5.7 交互与UI优化
**优先级：中**
**状态：待开始**

#### 功能描述
- 首页标题栏移除，改为顶部左右图标入口
- 左上角图标：点击展开全局侧边栏（功能/模式入口）
- 右上角图标：hover 展开菜单（设置、帮助等，内容后续补充）
- 所有模式顶部区域交互保持一致
- 播放进度条增加可拖动滑块，支持精确到单帧的跳转

#### 技术要点
- 保持第一行"左：播放控制+进度条，中：背景色切换"的布局规范
- 顶部左右图标与现有布局协同，不挤压进度条和背景按钮
- 播放进度滑块仅增强UI，底层时间/帧同步逻辑保持不变
- 拖动结束时统一调用"跳转到指定帧"的渲染函数，确保帧与画面同步

---

### 开发计划

#### 第一阶段（1周）- 核心能力
| 任务 | 工作量 | 优先级 |
|-----|-------|-------|
| 导出GIF模块化改造 | 1-2天 | 高 |
| 普通MP4→双通道MP4 | 2天 | 极高 |
| 普通MP4→SVGA | 1-2天 | 极高 |
| 普通MP4→GIF | 0.5天 | 高 |
| 序列帧模式基础实现 | 1-2天 | 高 |

#### 第二阶段（3-4天）- 功能完善
| 任务 | 工作量 | 优先级 |
|-----|-------|-------|
| 普通MP4扣绿幕 | 1-2天 | 高 |
| Lottie预览播放 | 1天 | 高 |
| 序列帧导出功能完善 | 1天 | 高 |
| 移动端基础适配 | 1天 | 低 |

---

### 已搁置功能

| 功能 | 原因 |
|-----|------|
| AI扣视频（非绿幕） | 技术复杂度极高，前端性能无法支撑 |
| Lottie转换功能 | 需求不明确，技术复杂 |
| 深度移动端优化 | ROI低，非核心场景 |

---

## 未来规划

### 短期目标
- ✅ 代码模块化整理
- ✅ 文件结构优化
- ✅ 清理无用资源
- ✅ 沉浸模式
- ✅ 素材压缩功能
- ✅ 变速编辑器
- ✅ 代码模块化第二阶段

### 中期目标
- 序列帧高级功能：支持ZIP包导入、再导出为序列帧
- Lottie模块完善（播放、导出、转换）
- 素材自助页面优化

### 长期目标
- 性能优化（大文件处理、内存优化）
- 批量处理功能
- 后端集成TinyPNG/pngquant进一步优化压缩
- 使用Vue CLI构建工具
- TypeScript迁移

---

*最后更新：2026-01-08*
