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
```html
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

## 阶段3：双通道MP4 与 Lottie 模块
**目标：完成多格式支持，实现格式互转**

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

*最后更新：2024-12-13*
*阶段2完成日期：2024-12-13*
