# SVGA动画预览

<cite>
**本文引用的文件**  
- [docs/index.html](file://docs/index.html)
- [ROADMAP.md](file://ROADMAP.md)
</cite>

## 更新摘要
**变更内容**  
- 新增对GIF导出功能的详细说明，包括使用gif.js库和Web Worker进行编码
- 增加SVGA素材替换功能的实现机制，支持动态图像替换与实时预览
- 补充SVGA文件导出功能，利用protobuf.js解析并修改原始SVGA二进制数据
- 更新用户界面交互流程，反映新增的“导出GIF”、“替换素材”等操作按钮
- 引入protobuf解析机制，说明如何通过Protocol Buffers定义文件（svga.proto）进行结构化数据处理
- **新增点击上传功能**：在空状态容器中添加点击事件(triggerFileUpload)，连接到隐藏的文件输入元素(@change="onFileSelect")，实现点击上传。同时在onFileSelect方法中重置input值，允许重新上传同一文件，解决重复上传的用户体验问题。

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考量](#性能考量)
8. [故障排查指南](#故障排查指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介
本项目提供一个基于 Vue 的在线预览工具，用于加载与播放 SVGA 动画、带Alpha通道的MP4动画（YYEVA）以及 Lottie 动画。页面通过 CDN 引入 Vue 与 SVGAPlayerWeb 库，并在前端使用 Vue 组件完成拖拽上传、解析与播放控制。用户可直接上传本地 .svga 或 .json 文件，页面会根据文件类型选择对应的播放器进行渲染与播放；同时支持通过 URL 拖拽或上传的方式进行加载。系统已升级为现代化单页应用布局，包含固定高度的底部控制面板（154px），支持实时帧数更新、暗色模式切换、改进的拖拽交互状态以及新增的工具提示系统。新增功能包括：GIF 导出、SVGA 素材替换、SVGA 文件重新导出、protobuf 解析等高级特性。**特别更新了文件上传交互机制，支持点击上传功能。在空状态容器中添加了点击事件(triggerFileUpload)，并连接到隐藏的文件输入元素(@change="onFileSelect")，实现了点击上传功能。同时在onFileSelect方法中重置input值，允许重新上传同一文件，解决了重复上传的用户体验问题。**

**Section sources**  
- [docs/index.html](file://docs/index.html#L1-L1566)

## 项目结构
- 文档与静态资源位于 docs 目录：  
  - HTML 入口：docs/index.html、docs/404.html  
  - 前端构建产物：docs/assets/js/*.js、docs/assets/css/*.css  
- 构建工具与依赖：  
  - package.json 中包含 VuePress 与 Element-UI 等依赖  
  - README.md 提供项目简述  
  - CNAME 指定域名  
- 技术调研与演示文件：  
  - [TECH-RESEARCH.md](file://TECH-RESEARCH.md)：技术选型与方案对比  
  - [demo-gif-export.html](file://demo-gif-export.html)：GIF 导出功能演示  
  - [demo-yyeva-format.html](file://demo-yyeva-format.html)：YYEVA 双通道视频解析演示  
  - [docs/svga.proto](file://docs/svga.proto)：SVGA 格式的 Protocol Buffers 定义文件  

```mermaid
graph TB
A["docs/index.html"] --> B["docs/assets/js/12.94aedb2b.js"]
A --> C["docs/assets/js/23.1fa39b37.js"]
D["docs/404.html"] --> B
E["package.json"] --> F["VuePress 构建产物"]
G["README.md"] --> A
H["CNAME"] --> A
I["TECH-RESEARCH.md"] --> J["技术方案决策"]
K["demo-gif-export.html"] --> L["GIF导出演示"]
M["demo-yyeva-format.html"] --> N["YYEVA格式解析"]
O["docs/svga.proto"] --> P["protobuf解析"]
```

**Diagram sources**  
- [docs/index.html](file://docs/index.html#L1-L21)
- [docs/404.html](file://docs/404.html#L1-L13)
- [package.json](file://package.json#L1-L19)
- [README.md](file://README.md#L1-L3)
- [CNAME](file://CNAME#L1-L1)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L1-L454)
- [demo-gif-export.html](file://demo-gif-export.html#L1-L308)
- [demo-yyeva-format.html](file://demo-yyeva-format.html#L1-L350)
- [docs/svga.proto](file://docs/svga.proto#L1-L132)

**Section sources**  
- [docs/index.html](file://docs/index.html#L1-L21)
- [docs/404.html](file://docs/404.html#L1-L13)
- [package.json](file://package.json#L1-L19)
- [README.md](file://README.md#L1-L3)
- [CNAME](file://CNAME#L1-L1)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L1-L454)
- [demo-gif-export.html](file://demo-gif-export.html#L1-L308)
- [demo-yyeva-format.html](file://demo-yyeva-format.html#L1-L350)
- [docs/svga.proto](file://docs/svga.proto#L1-L132)

## 核心组件
- 页面入口与依赖注入  
  - index.html 与 404.html 通过 CDN 引入 Vue、SVGAPlayerWeb、Lottie Web、gif.js、protobuf.js、pako 等库，确保运行时具备播放与导出能力。  
- Vue 组件与播放器封装  
  - docs/assets/js/12.94aedb2b.js 中定义了 Aview 组件，负责：  
    - 接收拖拽/上传的文件  
    - 判断文件类型（.svga 或 .json）  
    - 初始化对应播放器（SVGA Player 或 Lottie）  
    - 设置容器尺寸与背景色  
    - 播放控制与销毁逻辑  
    - 支持 GIF 导出、素材替换、SVGA 重新导出等新功能  
- 内容占位组件  
  - docs/assets/js/23.1fa39b37.js 提供基础内容组件，用于页面内容渲染。  

**Section sources**  
- [docs/index.html](file://docs/index.html#L1-L21)
- [docs/assets/js/12.94aedb2b.js](file://docs/assets/js/12.94aedb2b.js#L1-L1)
- [docs/assets/js/23.1fa39b37.js](file://docs/assets/js/23.1fa39b37.js#L1-L1)

## 架构总览
整体运行流程如下：  
- 用户在页面中拖拽或点击上传 .svga 或 .json 文件  
- 前端根据文件扩展名选择对应播放器：  
  - .svga 使用 SVGAPlayerWeb 的 SVGA.Parser 与 SVGA.Player 进行动画解析与播放  
  - .json 使用 Lottie Web 的 lottie.loadAnimation 进行播放  
- 播放器创建后，设置容器尺寸与背景色，自动开始播放  
- 若再次上传新文件，会先销毁旧播放器再创建新的  
- 新增功能流程：  
  - **GIF导出**：使用 gif.js 库，通过 Web Worker 逐帧捕获 canvas 内容并编码为 GIF  
  - **素材替换**：提取 SVGA 中的 images 字典，允许用户上传新图片并动态替换  
  - **SVGA导出**：读取原始 SVGA 文件，使用 pako 解压，protobuf.js 解码，修改 images 数据后重新编码并压缩导出  

```mermaid
sequenceDiagram
participant U as "用户"
participant V as "Vue组件(Aview)"
participant S as "SVGAPlayerWeb"
participant L as "Lottie Web"
participant G as "gif.js"
participant P as "protobuf.js"
participant C as "容器(div)"
U->>V : "拖拽/上传文件(.svga/.json)"
V->>V : "判断文件扩展名"
alt ".svga"
V->>S : "创建 SVGA.Parser 解析"
S-->>V : "返回视频元数据(videoSize,FPS)"
V->>C : "设置容器宽高"
V->>S : "创建 SVGA.Player 并 setVideoItem"
V->>S : "startAnimation()"
else ".json"
V->>L : "lottie.loadAnimation(配置)"
L-->>V : "返回播放器实例"
V->>C : "设置容器宽高"
V->>L : "自动播放"
end
note over V,C : "若再次上传，先 destroy 旧播放器"
U->>V : "点击导出GIF"
V->>G : "创建GIF编码器(workers=2)"
loop 逐帧捕获
V->>S : "stepToFrame(i)"
S->>C : "渲染当前帧"
C->>G : "addFrame(canvas)"
end
G->>V : "render() 编码"
G-->>U : "下载GIF文件"
U->>V : "替换素材"
V->>V : "提取materialList"
V->>V : "用户上传新图片"
V->>S : "setImage(img, key)"
V->>S : "applyReplacedMaterials"
U->>V : "导出修改后的SVGA"
V->>V : "读取原始文件ArrayBuffer"
V->>pako : "inflate 解压"
V->>P : "protobuf.load('svga.proto')"
P-->>V : "MovieEntity.decode()"
V->>V : "替换images[key] = newImageData"
V->>P : "MovieEntity.encode()"
V->>pako : "deflate 压缩"
V-->>U : "下载修改后的.svga文件"
```

**Diagram sources**  
- [docs/assets/js/12.94aedb2b.js](file://docs/assets/js/12.94aedb2b.js#L1-L1)
- [docs/index.html](file://docs/index.html#L1-L21)
- [demo-gif-export.html](file://demo-gif-export.html#L1-L308)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L1-L454)
- [docs/svga.proto](file://docs/svga.proto#L1-L132)

## 详细组件分析

### 组件：Aview（播放器容器与控制）
- 职责  
  - 监听拖拽与 drop 事件，接收文件  
  - 根据文件扩展名选择播放器（SVGA 或 Lottie）  
  - 更新文件信息（名称、大小、FPS、尺寸）  
  - 控制播放器生命周期（创建、销毁、尺寸变更）  
  - 支持 GIF 导出、素材替换、SVGA 重新导出等高级功能  
- 关键交互  
  - mounted 阶段绑定 dragover/drop 事件  
  - handleBeforeUpload 处理上传逻辑  
  - updateSvgaMeta 更新 SVGA 元数据  
  - beforeDestroy 清理事件监听  
- 新增功能方法  
  - exportGIF：使用 gif.js 和 Web Worker 导出动画为 GIF  
  - replaceMaterial：替换 SVGA 中的指定图像素材  
  - applyReplacedMaterials：应用已替换的素材到播放器  
  - exportNewSVGA：使用 protobuf.js 修改并导出新的 SVGA 文件  
- 播放器封装类  
  - SVGA 播放器封装类：负责解析 .svga 文件、设置 videoItem、启动播放、销毁与尺寸调整  
  - Lottie 播放器封装类：负责解析 .json 数据、设置容器与参数、启动播放、销毁与尺寸调整  

```mermaid
classDiagram
class Aview {
+data()
+mounted()
+beforeDestroy()
+handleBeforeUpload(file)
+updateSvgaMeta(meta)
+setColor(color)
+fileSize
+exportGIF()
+replaceMaterial(index)
+applyReplacedMaterials()
+exportNewSVGA()
}
class SVGAPlayerWrapper {
-data
-container
-player
-url
+load(file)
+init(file)
+create()
+destroy()
+changeSize()
}
class LottiePlayerWrapper {
-data
-container
-player
+load(file)
+init(file)
+create()
+destroy()
+changeSize()
}
class GIFExporter {
-workers
-quality
-width
-height
+addFrame(canvas, delay)
+render()
+on('progress')
+on('finished')
}
class ProtobufParser {
-load(protoFile, callback)
-lookupType(typeName)
-decode(buffer)
-encode(message)
}
Aview --> SVGAPlayerWrapper : "当文件为 .svga"
Aview --> LottiePlayerWrapper : "当文件为 .json"
Aview --> GIFExporter : "导出GIF"
Aview --> ProtobufParser : "解析/导出SVGA"
```

**Diagram sources**  
- [docs/assets/js/12.94aedb2b.js](file://docs/assets/js/12.94aedb2b.js#L1-L1)
- [demo-gif-export.html](file://demo-gif-export.html#L1-L308)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L1-L454)
- [docs/svga.proto](file://docs/svga.proto#L1-L132)

### JavaScript 调用流程（SVGA）
- 步骤  
  - 读取文件为 ArrayBuffer 或 Blob URL  
  - 创建 SVGA.Parser 并加载数据  
  - 解析完成后，设置 SVGA.Player 的 VideoItem  
  - 获取视频元数据（FPS、videoSize），按比例设置容器宽高  
  - 启动播放  
  - 销毁时停止动画并清理 DOM  

```mermaid
flowchart TD
Start["开始"] --> Load["读取文件<br/>FileReader/URL.createObjectURL"]
Load --> Parser["创建 SVGA.Parser 并 load"]
Parser --> ParseDone{"解析成功？"}
ParseDone --> |否| Error["错误处理"]
ParseDone --> |是| SetPlayer["创建 SVGA.Player 并 setVideoItem"]
SetPlayer --> Meta["读取 FPS 与 videoSize"]
Meta --> Resize["按比例设置容器宽高"]
Resize --> Play["startAnimation()"]
Play --> End["结束"]
Error --> End
```

**Diagram sources**  
- [docs/assets/js/12.94aedb2b.js](file://docs/assets/js/12.94aedb2b.js#L1-L1)

### JavaScript 调用流程（Lottie）
- 步骤  
  - 读取 .json 文本并解析为对象  
  - 使用 lottie.loadAnimation 创建播放器  
  - 设置容器宽高与渲染参数  
  - 自动播放  
  - 销毁时 stop 并 destroy  

```mermaid
flowchart TD
Start["开始"] --> Read["读取 .json 文本并 JSON.parse"]
Read --> Create["lottie.loadAnimation(配置)"]
Create --> Resize["设置容器宽高"]
Resize --> Play["自动播放"]
Play --> End["结束"]
```

**Diagram sources**  
- [docs/assets/js/12.94aedb2b.js](file://docs/assets/js/12.94aedb2b.js#L1-L1)

### 播放控制方法与事件监听
- 播放控制  
  - SVGA：startAnimation()、stopAnimation()、pauseAnimation()、stepToFrame(frame)  
  - Lottie：loadAnimation 返回实例后可调用 stop() 与 destroy()  
- 事件监听  
  - 拖拽与 drop：在 mounted 中绑定 dragover 与 drop 事件  
  - 文件元数据回调：SVGA 解析成功后回调更新 FPS 与尺寸  
  - 帧更新事件：onFrame(frame) 监听当前帧数  
  - 播放完成事件：onFinished()  
- 生命周期  
  - beforeDestroy：移除事件监听，避免内存泄漏  

**Section sources**  
- [docs/assets/js/12.94aedb2b.js](file://docs/assets/js/12.94aedb2b.js#L1-L1)

### GIF导出实现机制
- 依赖库：`gif.js`（通过 CDN 引入）
- 核心流程：
  1. 创建 `GIF` 编码器实例，配置 `workers=2` 启用 Web Worker
  2. 遍历动画每一帧，使用 `stepToFrame(i)` 跳转到指定帧
  3. 调用 `addFrame(canvas, {copy: true, delay: frameDelay})` 捕获帧
  4. 所有帧添加完毕后调用 `render()` 开始编码
  5. 监听 `progress` 事件更新进度条（0-50%为捕获阶段，50-100%为编码阶段）
  6. `finished` 事件触发后生成 Blob 并提供下载
- 优势：使用 Web Worker 避免阻塞主线程，支持大动画导出

```mermaid
flowchart TD
Start["开始导出GIF"] --> Check["检查gif.js是否加载"]
Check --> |否| Alert["提示库未加载"]
Check --> |是| Create["创建GIF编码器(workers=2)"]
Create --> Loop["循环: i=0 to totalFrames-1"]
Loop --> Step["stepToFrame(i)"]
Step --> Add["addFrame(canvas, delay)"]
Add --> Inc["i++"]
Inc --> Cond{"i < totalFrames?"}
Cond --> |是| Loop
Cond --> |否| Render["render() 开始编码"]
Render --> Progress["监听progress事件"]
Progress --> Finish["finished事件触发"]
Finish --> Download["生成Blob并下载"]
Download --> End["结束"]
```

**Diagram sources**  
- [docs/index.html](file://docs/index.html#L11)
- [demo-gif-export.html](file://demo-gif-export.html#L7)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L191-L216)

### SVGA素材替换与导出机制
- 素材替换流程：
  1. 解析 SVGA 文件后提取 `videoItem.images` 字典
  2. 显示素材列表（imageKey、尺寸、内存占用）
  3. 用户选择新图片上传
  4. 使用 `player.setImage(img, imageKey)` 动态替换
  5. 调用 `applyReplacedMaterials()` 实时预览
- SVGA文件导出流程：
  1. 读取原始 SVGA 文件为 ArrayBuffer
  2. 使用 `pako.inflate()` 解压缩
  3. 使用 `protobuf.load('svga.proto')` 加载协议定义
  4. `MovieEntity.decode()` 解码二进制数据
  5. 遍历 `replacedImages` 替换 `movieData.images[imageKey]`
  6. `MovieEntity.encode().finish()` 重新编码
  7. `pako.deflate()` 压缩并生成新 SVGA 文件下载

```mermaid
flowchart TD
Start["开始替换素材"] --> Extract["提取videoItem.images"]
Extract --> List["显示素材列表"]
List --> Upload["用户上传新图片"]
Upload --> Set["player.setImage(img, key)"]
Set --> Apply["applyReplacedMaterials()"]
Apply --> Preview["实时预览"]
Start2["开始导出SVGA"] --> Read["读取原始.svga文件"]
Read --> Inflate["pako.inflate()解压"]
Inflate --> LoadProto["protobuf.load('svga.proto')"]
LoadProto --> Decode["MovieEntity.decode()"]
Decode --> Replace["替换images[key]"]
Replace --> Encode["MovieEntity.encode()"]
Encode --> Deflate["pako.deflate()压缩"]
Deflate --> Blob["生成Blob"]
Blob --> Download["下载新.svga文件"]
```

**Diagram sources**  
- [docs/index.html](file://docs/index.html#L15-L16)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L389-L395)
- [docs/svga.proto](file://docs/svga.proto#L1-L132)

## 依赖关系分析
- 运行时依赖  
  - Vue：用于组件化与事件绑定  
  - SVGAPlayerWeb 2.3.1：用于解析与播放 .svga  
  - Lottie Web：用于解析与播放 .json  
  - gif.js 0.2.0：用于 GIF 导出  
  - protobuf.js 7.2.5：用于 SVGA 文件解析与重新编码  
  - pako 2.1.0：用于 SVGA 文件的 zlib 压缩与解压缩  
- 构建与开发依赖  
  - VuePress：文档站点构建  
  - Element-UI：UI 组件库（用于上传按钮等）  

```mermaid
graph LR
Vue["Vue"] --> Aview["Aview 组件"]
Aview --> SVGA["SVGAPlayerWeb 2.3.1"]
Aview --> Lottie["Lottie Web"]
Aview --> GIFJS["gif.js 0.2.0"]
Aview --> Protobuf["protobuf.js 7.2.5"]
Aview --> Pako["pako 2.1.0"]
Build["VuePress"] --> Assets["docs/assets/*"]
UI["Element-UI"] --> Upload["上传控件"]
```

**Diagram sources**  
- [docs/index.html](file://docs/index.html#L8-L18)
- [package.json](file://package.json#L1-L19)

**Section sources**  
- [docs/index.html](file://docs/index.html#L8-L18)
- [package.json](file://package.json#L1-L19)

## 性能考量
- 容器尺寸自适应  
  - 根据视频宽高比计算容器高度，避免拉伸失真  
- 文件读取  
  - .svga 使用 FileReader 读取 ArrayBuffer 或 Blob URL，减少内存占用  
- 播放器复用  
  - 上传新文件前销毁旧播放器，释放资源  
- 预加载与懒加载  
  - HTML 中对样式与脚本使用 preload/prefetch，提升首屏加载速度  
- GIF导出优化  
  - 使用 Web Worker 避免阻塞 UI  
  - 分阶段显示进度（捕获 0-50%，编码 50-100%）  
  - 限制最大尺寸与帧数以控制文件大小  
- SVGA导出优化  
  - 使用 protobuf.js 动态加载 proto 定义，减少初始加载体积  
  - 使用 pako 进行高效压缩  

**Section sources**  
- [docs/assets/js/12.94aedb2b.js](file://docs/assets/js/12.94aedb2b.js#L1-L1)
- [docs/index.html](file://docs/index.html#L1-L21)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L256-L275)

## 故障排查指南
- 跨域问题  
  - 现象：无法从远程 URL 加载 .svga 或 .json  
  - 建议：确保服务器返回正确的 CORS 头，允许来自当前域名的请求  
- 加载超时  
  - 现象：大文件加载缓慢或失败  
  - 建议：优化网络环境，或分块传输；前端可增加超时与重试策略（需在业务层扩展）  
- 格式不支持  
  - 现象：解析失败或无画面  
  - 建议：确认文件扩展名与内容匹配；.svga 对应 SVGAPlayerWeb，.json 对应 Lottie  
- 播放器未销毁导致内存泄漏  
  - 现象：频繁切换文件后内存增长  
  - 建议：每次上传前调用 destroy，确保 stopAnimation()/stop()/destroy() 执行  
- 浏览器兼容性  
  - 建议：优先使用现代浏览器；如需兼容旧版浏览器，可在页面引入 polyfill 并测试播放效果  
- GIF导出失败  
  - 现象：导出过程中卡住或报错  
  - 建议：检查 `gif.js` 和 `gif.worker.js` 是否正确加载；确保 canvas 内容可访问  
- 素材替换失败  
  - 现象：替换后画面未更新  
  - 建议：检查 imageKey 是否匹配；确保图片 URL 可访问  
- SVGA导出失败  
  - 现象：导出文件无法播放  
  - 建议：检查 protobuf 编解码是否正确；确保 zlib 压缩/解压缩无误  

**Section sources**  
- [docs/assets/js/12.94aedb2b.js](file://docs/assets/js/12.94aedb2b.js#L1-L1)
- [demo-gif-export.html](file://demo-gif-export.html#L217-L264)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L412-L418)

## 结论
本项目通过 CDN 引入 Vue 与 SVGAPlayerWeb，结合 Vue 组件实现了对 .svga 与 .json 动画的在线预览。其核心在于：  
- 通过拖拽/上传接收文件  
- 根据扩展名选择播放器  
- 解析元数据并设置容器尺寸  
- 自动播放与生命周期管理  
在实际部署中，建议关注跨域、超时与格式校验等常见问题，以获得更稳定的用户体验。系统已升级为现代化UI设计，支持暗色模式、实时帧数更新、改进的拖拽交互和工具提示，提升了整体用户体验。新增功能包括：GIF导出（使用gif.js+Web Worker）、SVGA素材替换（动态setImage）、SVGA文件重新导出（protobuf+pako解析），显著增强了工具的实用性与灵活性。**特别更新了文件上传交互机制，支持点击上传功能。在空状态容器中添加了点击事件(triggerFileUpload)，并连接到隐藏的文件输入元素(@change="onFileSelect")，实现了点击上传功能。同时在onFileSelect方法中重置input值，允许重新上传同一文件，解决了重复上传的用户体验问题。**

## 附录
- 嵌入播放器的基本用法（路径参考）  
  - 引入依赖：参见 [docs/index.html](file://docs/index.html#L1-L21)  
  - 播放器初始化与控制：参见 [docs/assets/js/12.94aedb2b.js](file://docs/assets/js/12.94aedb2b.js#L1-L1)  
  - 页面内容组件：参见 [docs/assets/js/23.1fa39b37.js](file://docs/assets/js/23.1fa39b37.js#L1-L1)  
- 项目信息  
  - 项目名称与描述：参见 [README.md](file://README.md#L1-L3)  
  - 构建与依赖：参见 [package.json](file://package.json#L1-L19)  
  - 域名配置：参见 [CNAME](file://CNAME#L1-L1)  
- 与 Figma 工具集成建议  
  - 参见 [figma-mcp-example.md](file://figma-mcp-example.md#L1-L172) 中的设计到开发工作流说明
- 技术调研文档  
  - GIF导出方案：参见 [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L187-L296)  
  - YYEVA格式解析：参见 [demo-yyeva-format.html](file://demo-yyeva-format.html#L1-L350)  
  - SVGA协议定义：参见 [docs/svga.proto](file://docs/svga.proto#L1-L132)