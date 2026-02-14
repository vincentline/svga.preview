# app.js核心功能详解文档

## 1. 文档概述

### 1.1 文件基本信息
- **文件路径**：`src/assets/js/core/app.js`
- **总行数**：8645行
- **文件类型**：JavaScript应用主文件
- **功能定位**：MeeWoo应用的核心文件，包含所有主要功能实现

### 1.2 文档目的
- 全面梳理app.js文件的所有核心功能
- 详细记录各功能的实现位置（行号）
- 提供清晰的功能索引和代码参考
- 为后续代码维护和重构提供基础

### 1.3 整体架构
app.js文件采用Vue.js框架实现，主要包含以下部分：
- **全局状态管理**：data()函数定义的状态变量
- **核心功能方法**：各种业务逻辑实现
- **组件注册**：Vue组件的注册和使用
- **事件处理**：用户交互和系统事件处理
- **第三方库集成**：各种工具库和服务的集成

## 2. 全局状态管理

### 2.1 全局状态变量列表

| 变量名 | 类型 | 默认值 | 作用 | 定义位置 |
|-------|------|-------|------|----------|
| isLoading | Boolean | false | 全局加载状态 | 146行 |
| currentModule | String | 'svga' | 当前模块类型 | 148行 |
| currentLoadTaskId | Number | 0 | 加载任务ID，用于处理异步加载的竞态条件 | 149行 |
| dropHover | Boolean | false | 文件拖拽悬停状态 | 150行 |
| footerTransitioning | Boolean | false | 底部浮层过渡状态 | 153行 |
| footerContentVisible | Boolean | false | 底部浮层内容可见状态 | 154行 |
| viewerScale | Number | 1 | 视图缩放比例 | 157行 |
| viewerOffsetX | Number | 0 | 视图X轴偏移 | 158行 |
| viewerOffsetY | Number | 0 | 视图Y轴偏移 | 159行 |
| viewMode | String | 'fit-height' | 视图模式 | 163行 |
| isImmersiveMode | Boolean | false | 沉浸模式状态 | 167行 |
| modeNameFadeOut | Boolean | false | 模式名称淡出状态 | 168行 |
| modeNameFadeTimer | Object | null | 模式名称淡出定时器 | 169行 |
| dragging | Boolean | false | 拖拽状态 | 170行 |
| isDarkMode | Boolean | false | 深色模式状态 | 173行 |
| isThemeManuallySet | Boolean | false | 主题是否由用户手动设置 | 175行 |
| helpContent | String | '' | 帮助文档内容 | 178行 |
| loadingLibraryInfo | Object | null | 库加载进度（响应式） | 181行 |
| bgColorKey | String | 'pattern' | 背景颜色键值 | 184行 |
| isPlaying | Boolean | false | 播放状态 | 187行 |
| progress | Number | 0 | 播放进度（0-100，基于时间） | 188行 |
| currentFrame | Number | 0 | 当前帧 | 189行 |
| totalFrames | Number | 0 | 总帧数 | 190行 |
| currentTime | Number | 0 | 当前播放时间（秒） | 191行 |
| totalDuration | Number | 0 | 总时长（秒） | 192行 |
| mp4HasAudio | Boolean | false | 普通MP4是否包含音频 | 265行 |
| materialList | Array | [] | 素材列表 | 269行 |
| replacedImages | Object | {} | 用于预览的图片（放大后） | 271行 |
| compressedScaleInfo | Object | {} | 压缩素材的缩放信息 | 274行 |
| showCompressModal | Boolean | false | 是否显示压缩弹窗 | 277行 |
| isCompressingMaterials | Boolean | false | 是否正在压缩 | 278行 |
| compressProgress | Number | 0 | 压缩进度（0-100） | 279行 |
| compressConfig | Object | {} | 压缩配置 | 280行 |
| hasCompressedMaterials | Boolean | false | 是否压缩过素材 | 285行 |
| preCompressMaterials | Object | null | 压缩前的素材状态 | 286行 |
| preCompressReplacedImages | Object | null | 压缩前的replacedImages | 287行 |
| preCompressScaleInfo | Object | null | 压缩前的compressedScaleInfo | 288行 |
| svgaAudioData | Object | null | 从原始SVGA文件提取的音频数据 | 291行 |
| svgaMovieData | Object | null | protobuf解析后的MovieEntity | 292行 |
| isExportingGIF | Boolean | false | 是否正在导出GIF | 305行 |
| gifExportProgress | Number | 0 | GIF导出进度 | 306行 |
| gifExportStage | String | '' | GIF导出阶段 | 307行 |
| gifExportMessage | String | '' | GIF导出消息 | 308行 |
| gifExportCancelled | Boolean | false | GIF导出是否被取消 | 309行 |
| isExportingLottie | Boolean | false | 是否正在导出Lottie | 312行 |
| lottieExportProgress | Number | 0 | Lottie导出进度 | 313行 |
| showStandardMp4Panel | Boolean | false | 是否显示普通MP4转换面板 | 316行 |
| isConvertingStandardMp4 | Boolean | false | 是否正在转换普通MP4 | 317行 |
| standardMp4Progress | Number | 0 | 普通MP4转换进度 | 318行 |
| standardMp4Message | String | '' | 普通MP4转换消息 | 319行 |
| showSpeedRemapEditor | Boolean | false | 是否显示时间轴编辑器 | 349行 |
| selectedKeyframeIndex | Number | -1 | 当前选中的K帧索引 | 350行 |
| timelineHoverX | Number | -1 | hover预览线位置 | 351行 |
| showEditFrameDialog | Boolean | false | 是否显示编辑帧数弹窗 | 352行 |
| editingKeyframeIndex | Number | -1 | 正在编辑的K帧索引 | 353行 |
| editFrameInput | String | '' | 编辑帧数输入值 | 354行 |
| showVideoConvertModal | Boolean | false | 是否显示视频转换弹窗 | 357行 |
| isConverting | Boolean | false | 是否正在转换 | 358行 |
| videoConvertProgress | Number | 0 | 转换进度（0-100） | 359行 |
| dualChannelStage | String | '' | 双通道处理阶段 | 368行 |
| toastVisible | Boolean | false | Toast是否可见 | 371行 |
| toastMessage | String | '' | Toast消息内容 | 372行 |
| toastTimer | Object | null | Toast定时器 | 373行 |
| isMuted | Boolean | false | 是否静音 | 376行 |
| volume | Number | 1 | 音量值（0-1） | 377行 |
| isDraggingVolume | Boolean | false | 音量滑块拖动状态 | 378行 |
| yyevaHasAudio | Boolean | false | 双通道MP4是否包含音频轨道 | 379行 |
| framesStartTime | Number | 0 | 序列帧播放开始时间戳 | 399行 |
| framesPausedAt | Number | 0 | 序列帧暂停时的帧索引 | 400行 |
| showFramesFpsDialog | Boolean | false | 是否显示序列帧帧率设置弹窗 | 403行 |
| framesFpsInput | Number | 25 | 序列帧帧率输入值 | 404行 |
| framesWasPlayingBeforeDialog | Boolean | undefined | 打开帧率弹窗前的播放状态 | 405行 |
| isLoggedIn | Boolean | false | 登录状态 | 408行 |
| userInfo | Object | null | 用户信息 | 409行 |

### 2.2 SVGA状态

| 变量名 | 类型 | 默认值 | 作用 | 定义位置 |
|-------|------|-------|------|----------|
| svga.hasFile | Boolean | false | 是否有SVGA文件 | 196行 |
| svga.file | Object | null | SVGA文件对象 | 197行 |
| svga.fileInfo.name | String | '' | SVGA文件名 | 199行 |
| svga.fileInfo.size | Number | 0 | SVGA文件大小 | 200行 |
| svga.fileInfo.sizeText | String | '' | SVGA文件大小文本 | 201行 |
| svga.fileInfo.fps | Number | null | SVGA帧率 | 202行 |
| svga.fileInfo.sizeWH | String | '' | SVGA尺寸文本 | 203行 |
| svga.fileInfo.duration | String | '' | SVGA时长文本 | 204行 |
| svga.fileInfo.memoryText | String | '' | SVGA内存占用文本 | 205行 |

### 2.3 双通道MP4状态

| 变量名 | 类型 | 默认值 | 作用 | 定义位置 |
|-------|------|-------|------|----------|
| yyeva.hasFile | Boolean | false | 是否有双通道MP4文件 | 211行 |
| yyeva.file | Object | null | 双通道MP4文件对象 | 212行 |
| yyeva.fileInfo.name | String | '' | 双通道MP4文件名 | 214行 |
| yyeva.fileInfo.size | Number | 0 | 双通道MP4文件大小 | 215行 |
| yyeva.fileInfo.sizeText | String | '' | 双通道MP4文件大小文本 | 216行 |
| yyeva.fileInfo.fps | Number | null | 双通道MP4帧率 | 217行 |
| yyeva.fileInfo.sizeWH | String | '' | 双通道MP4尺寸文本 | 218行 |
| yyeva.fileInfo.duration | String | '' | 双通道MP4时长文本 | 219行 |
| yyeva.alphaPosition | String | 'right' | alpha通道位置 | 221行 |
| yyeva.originalWidth | Number | 0 | 视频原始宽度 | 222行 |
| yyeva.originalHeight | Number | 0 | 视频原始高度 | 223行 |
| yyeva.displayWidth | Number | 0 | 显示宽度（原始宽度/2） | 224行 |
| yyeva.displayHeight | Number | 0 | 显示高度 | 225行 |

### 2.4 Lottie状态

| 变量名 | 类型 | 默认值 | 作用 | 定义位置 |
|-------|------|-------|------|----------|
| lottie.hasFile | Boolean | false | 是否有Lottie文件 | 230行 |
| lottie.file | Object | null | Lottie文件对象 | 231行 |
| lottie.frameRate | Number | 30 | Lottie原始帧率 | 232行 |
| lottie.fileInfo.name | String | '' | Lottie文件名 | 234行 |
| lottie.fileInfo.size | Number | 0 | Lottie文件大小 | 235行 |
| lottie.fileInfo.sizeText | String | '' | Lottie文件大小文本 | 236行 |
| lottie.fileInfo.fps | Number | null | Lottie帧率 | 237行 |
| lottie.fileInfo.sizeWH | String | '' | Lottie尺寸文本 | 238行 |
| lottie.fileInfo.duration | String | '' | Lottie时长文本 | 239行 |
| lottie.originalWidth | Number | 0 | Lottie原始宽度 | 241行 |
| lottie.originalHeight | Number | 0 | Lottie原始高度 | 242行 |
| lottie.animationData | Object | null | Lottie动画数据 | 243行 |

### 2.5 普通MP4状态

| 变量名 | 类型 | 默认值 | 作用 | 定义位置 |
|-------|------|-------|------|----------|
| mp4.hasFile | Boolean | false | 是否有普通MP4文件 | 251行 |
| mp4.file | Object | null | 普通MP4文件对象 | 252行 |
| mp4.fileInfo.name | String | '' | 普通MP4文件名 | 254行 |
| mp4.fileInfo.size | Number | 0 | 普通MP4文件大小 | 255行 |
| mp4.fileInfo.sizeText | String | '' | 普通MP4文件大小文本 | 256行 |
| mp4.fileInfo.fps | Number | null | 普通MP4帧率 | 257行 |
| mp4.fileInfo.sizeWH | String | '' | 普通MP4尺寸文本 | 258行 |
| mp4.fileInfo.duration | String | '' | 普通MP4时长文本 | 259行 |
| mp4.originalWidth | Number | 0 | 普通MP4原始宽度 | 261行 |
| mp4.originalHeight | Number | 0 | 普通MP4原始高度 | 262行 |

### 2.6 序列帧状态

| 变量名 | 类型 | 默认值 | 作用 | 定义位置 |
|-------|------|-------|------|----------|
| frames.hasFile | Boolean | false | 是否有序列帧文件 | 383行 |
| frames.files | Array | [] | 序列帧原始File对象数组 | 384行 |
| frames.fileInfo.name | String | '' | 序列帧显示名称 | 386行 |
| frames.fileInfo.size | Number | 0 | 序列帧文件大小 | 387行 |
| frames.fileInfo.sizeText | String | '' | 序列帧文件大小文本 | 388行 |
| frames.fileInfo.fps | Number | 25 | 序列帧用户设置的帧率 | 389行 |
| frames.fileInfo.sizeWH | String | '' | 序列帧尺寸文本 | 390行 |
| frames.fileInfo.duration | String | '' | 序列帧时长文本 | 391行 |
| frames.originalWidth | Number | 0 | 序列帧原始宽度 | 393行 |
| frames.originalHeight | Number | 0 | 序列帧原始高度 | 394行 |

### 2.7 配置对象

| 变量名 | 类型 | 默认值 | 作用 | 定义位置 |
|-------|------|-------|------|----------|
| compressConfig | Object | {scalePercent: 70, pngQuality: 80, exportMuted: false} | 素材压缩配置 | 280行 |
| gifConfig | Object | {width: 0, height: 0, fps: 30, quality: 10, transparent: false, dither: false, ditherColor: '#ffffff'} | GIF导出配置 | 296行 |
| standardMp4Config | Object | {width: 0, height: 0, quality: 80, fps: 30, muted: false} | 普通MP4转换配置 | 320行 |
| standardMp4SourceInfo | Object | {sizeWH: '', duration: '', typeLabel: '文件'} | 普通MP4转换源信息 | 327行 |
| chromaKeyConfig | Object | {enabled: false, similarity: 40, smoothness: 20, applied: false} | 绿幕抠图配置 | 341行 |
| speedRemapConfig | Object | {enabled: false, keyframes: [], originalTotalFrames: 0, originalDuration: 0, fps: 30} | 视频变速配置 | 360行 |
| taskManager | Object | null | 任务管理器实例 | 247行 |

## 3. 模式切换与任务管理

### 3.1 核心方法

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| getOngoingTasks() | 获取进行中任务列表 | 420行 | 调用taskManager.getRunningTasks()获取任务列表 |
| cancelOngoingTasks() | 取消所有任务 | 429行 | 1. 调用taskManager.cancelAll()取消所有任务<br>2. 如果不是静默取消，显示取消提示 |
| confirmIfHasOngoingTasks() | 任务确认提示 | 446行 | 1. 获取进行中任务列表<br>2. 根据操作类型生成不同的提示文案<br>3. 显示确认对话框，返回用户选择 |
| switchMode() | 统一模式切换 | 604行 | 1. 取消正在进行的任务（静默取消）<br>2. 清理上一个模式的资源<br>3. 关闭所有弹窗<br>4. 切换到目标模式<br>5. 重置视图状态 |

### 3.2 任务管理流程
1. **任务注册**：通过taskManager.register()注册新任务
2. **任务检查**：通过confirmIfHasOngoingTasks()检查是否有进行中任务
3. **任务取消**：通过cancelOngoingTasks()取消进行中任务
4. **任务完成**：通过taskManager.finish()标记任务完成

### 3.3 模式切换流程
1. **取消任务**：取消当前正在进行的所有任务
2. **清理资源**：清理当前模式的资源
3. **关闭弹窗**：关闭所有打开的弹窗
4. **切换模式**：更新currentModule为目标模式
5. **重置视图**：重置视图缩放和偏移

## 4. 弹窗管理

### 4.1 侧边弹窗管理

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| closeAllPanels() | 关闭所有弹窗 | panel-mixin.js:123行 | 调用closeRightPanel()关闭右侧弹窗 |
| openRightPanel() | 打开/切换右侧弹窗 | panel-mixin.js:132行 | 1. 确定目标面板类型<br>2. 如果当前就是目标面板且处于显示状态，则关闭<br>3. 否则关闭其他所有面板，打开目标面板 |
| openMaterialPanel() | 打开素材替换弹窗 | 3728行 | 调用openRightPanel('material')打开素材面板 |
| openMP4Panel() | 打开SVGA转MP4弹窗 | - | - |
| openSVGAPanel() | 打开MP4转SVGA弹窗 | - | - |
| openToSvgaPanel() | 打开转SVGA面板 | panel-mixin.js:190行 | 根据当前模块设置源信息，打开转SVGA面板 |

### 4.2 居中弹窗管理

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| onFrameLabelDblClick() | 打开K帧编辑弹窗 | 5647行 | 显示K帧编辑弹窗，设置编辑状态 |
| confirmEditFrame() | 确认编辑K帧 | 5662行 | 确认并保存K帧编辑结果 |
| cancelEditFrame() | 取消编辑K帧 | 5704行 | 取消K帧编辑，恢复原始状态 |
| confirmFramesFps() | 确认帧率设置 | 2706行 | 确认并保存帧率设置 |
| cancelFramesFpsDialog() | 取消帧率设置 | - | - |
| openChangeFpsDialog() | 打开改变帧率弹窗 | 2760行 | 打开帧率设置弹窗 |

### 4.3 弹窗类型

| 弹窗类型 | 面板名称 | 描述 |
|---------|---------|------|
| 侧边弹窗 | material | 素材替换面板 |
| 侧边弹窗 | gif | GIF导出面板 |
| 侧边弹窗 | to-svga | 转SVGA面板 |
| 侧边弹窗 | dual-channel | 双通道转换面板 |
| 侧边弹窗 | showStandardMp4Panel | 标准MP4转换面板 |
| 居中弹窗 | 帧率设置弹窗 | 序列帧帧率设置 |
| 居中弹窗 | K帧编辑弹窗 | 视频变速K帧编辑 |

## 5. 库加载管理器

### 5.1 核心方法

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| loadLibrary() | 加载库（统一入口） | 659行 | 调用Core.libraryLoader.load()加载指定库，支持高优先级加载 |
| preloadLibraries() | 预加载非关键库 | 666行 | 调用Core.libraryLoader.preload()预加载非关键库 |

### 5.2 库加载流程
1. **库加载请求**：通过loadLibrary()方法发起库加载请求
2. **优先级处理**：根据highPriority参数决定加载优先级
3. **库加载执行**：libraryLoader负责具体的库加载逻辑
4. **加载状态更新**：通过loadingLibraryInfo状态变量更新加载状态

### 5.3 支持的库
- protobuf：用于SVGA文件的protobuf解析
- pako：用于SVGA文件的解压
- ffmpeg：用于视频处理和帧提取
- gif：用于GIF导出
- lottie：用于Lottie文件的处理

## 6. 文件加载与拖拽上传

### 6.1 核心方法

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| handleFile() | 文件分发器 | 763行 | 1. 检查是否有进行中任务<br>2. 根据文件扩展名判断文件类型<br>3. 对于MP4文件，检测是否为双通道视频<br>4. 验证文件有效性<br>5. 根据文件类型调用相应的加载方法 |
| handleFiles() | 处理文件列表 | 710行 | 处理多文件上传，支持序列帧文件 |
| triggerFileUpload() | 触发文件选择 | 672行 | 触发文件输入框点击事件，打开文件选择对话框 |
| detectMp4Type() | 检测MP4类型 | 852行 | 调用fileValidator.detectMp4Type()检测MP4是否为双通道视频 |
| handleReuploadSVGA() | 重新上传SVGA文件 | 680行 | 处理SVGA文件的重新上传 |
| onFileSelect() | 文件选择事件处理 | 696行 | 处理文件输入框的文件选择事件 |

### 6.2 拖拽上传流程
1. **文件拖拽**：用户将文件拖拽到应用区域
2. **事件监听**：InputController监听全局拖拽事件
3. **文件处理**：调用handleFiles()处理拖拽的文件
4. **类型检测**：根据文件类型进行相应处理
5. **文件加载**：调用相应的加载方法加载文件

### 6.3 支持的文件类型
- **SVGA**：.svga文件
- **Lottie**：.json、.lottie文件
- **MP4**：.mp4文件（支持普通MP4和双通道MP4）

## 7. 资源清理

### 7.1 核心方法

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| clearAll() | 清空画布 | 881行 | 1. 检查是否有进行中任务<br>2. 取消所有进行中任务<br>3. 清理音频资源<br>4. 退出沉浸模式<br>5. 隐藏底部浮层<br>6. 切换到SVGA模式，重置所有状态 |
| cleanupSvga() | 清理SVGA资源 | 2993行 | 1. 停止并清理SVGA播放器<br>2. 清理SVGA音频<br>3. 清理objectUrl<br>4. 销毁播放控制器<br>5. 清空容器内容<br>6. 重置SVGA状态<br>7. 重置播放状态 |
| cleanupYyeva() | 清理MP4资源 | 3064行 | 1. 取消动画帧<br>2. 清理视频元素<br>3. 清理objectUrl<br>4. 清理画布和上下文<br>5. 清理临时Canvas |

### 7.2 资源管理流程
1. **资源注册**：通过resourceManager注册资源（如ObjectURL）
2. **资源使用**：在相应模块中使用注册的资源
3. **资源清理**：在模块切换或应用清空时清理资源
4. **统一管理**：通过ResourceManager统一管理和释放资源

### 7.3 资源类型
- **ObjectURL**：用于视频、音频等资源的URL
- **音频资源**：通过GlobalAudioManager管理
- **播放器实例**：SVGA播放器、视频播放器等
- **画布资源**：Canvas元素和上下文
- **播放控制器**：播放器控制器实例

### 7.4 清理策略
| 模式 | 清理策略 | 实现方法 |
|------|----------|----------|
| SVGA | 清理SVGA播放器、音频、objectUrl等 | cleanupSvga() |
| 双通道MP4 | 清理视频元素、画布、objectUrl等 | cleanupYyeva() |
| 其他模式 | 根据具体模式执行相应的清理 | 模式切换时自动执行 |

## 8. 播放控制

### 8.1 核心方法

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| togglePlay() | 播放/暂停 | 2171行 | 调用playerController.togglePlay()控制播放状态 |
| toggleMute() | 切换静音状态 | 2178行 | 1. 检查是否有音频<br>2. 切换isMuted状态<br>3. 调用playerController.setMuted()设置静音状态 |
| startVolumeDrag() | 开始拖动音量滑块 | 2193行 | 1. 阻止默认事件<br>2. 设置isDraggingVolume为true<br>3. 添加全局鼠标/触摸事件监听 |
| updateVolume() | 更新音量 | 2208行 | 根据鼠标/触摸位置计算音量百分比，更新音量值 |
| seekToFrame() | 跳转到指定帧 | 5040行 | 跳转到指定帧位置，支持不同源的帧索引转换 |

### 8.2 PlayerController集成
1. **初始化**：在加载文件时初始化PlayerController
2. **统一控制**：通过PlayerController统一管理播放状态
3. **事件监听**：监听播放事件，更新UI状态
4. **方法调用**：通过PlayerController调用播放控制方法

### 8.3 播放控制流程
1. **用户交互**：用户点击播放/暂停按钮或拖动进度条
2. **事件处理**：应用捕获用户交互事件
3. **控制器调用**：调用PlayerController的相应方法
4. **状态更新**：PlayerController更新播放状态
5. **UI同步**：更新应用UI显示，反映当前播放状态

### 8.4 音频控制
- **静音控制**：通过toggleMute()方法控制静音状态
- **音量调节**：通过startVolumeDrag()和updateVolume()方法调节音量
- **音频检测**：检测文件是否包含音频，决定是否显示音频控制UI

## 9. 格式转换功能

### 9.1 MP4转SVGA

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| startSVGAConversion() | 开始MP4转SVGA转换 | 8209行 | 1. 加载protobuf和pako库<br>2. 调用extractYyevaFramesOptimized()提取帧<br>3. 提取音频（如果未静音）<br>4. 调用buildSVGAFromConfig()构建SVGA文件<br>5. 下载生成的SVGA文件 |
| extractYyevaFrames() | 从双通道MP4提取序列帧（原始版） | 8372行 | 使用Canvas逐帧提取和处理视频帧 |
| extractYyevaFramesOptimized() | 从双通道MP4提取序列帧（优化版） | 8525行 | 1. 使用FFmpeg批量提取帧<br>2. 支持变速功能（使用帧映射表）<br>3. 处理提取的帧，分离双通道<br>4. 合成带透明度的图像<br>5. 批处理策略，每10帧让出一次UI线程 |

### 9.2 SVGA转MP4

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| openMP4Panel() | 打开SVGA转MP4弹窗 | - | - |
| startMP4Conversion() | 开始SVGA转MP4转换 | - | - |

### 9.3 其他转换功能
- **普通MP4转双通道MP4**
- **Lottie转双通道MP4**
- **Lottie转SVGA**
- **序列帧转SVGA**
- **序列帧转双通道MP4**
- **转换为普通MP4**

## 10. UI交互

### 10.1 主题切换

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| toggleTheme() | 切换主题 | - | - |
| applyCanvasBackground() | 应用背景 | - | - |

### 10.2 视图控制

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| zoomIn() | 放大视图 | - | - |
| zoomOut() | 缩小视图 | - | - |

## 11. 素材替换功能

### 11.1 核心方法

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| openMaterialPanel() | 打开素材弹窗 | - | - |
| replaceMaterial() | 替换素材 | - | - |
| resetMaterial() | 重置素材 | - | - |
| parseSvgaAudioData() | 解析SVGA音频数据 | - | - |

## 12. 导出GIF功能

### 12.1 核心方法

| 方法名 | 作用 | 实现位置 | 核心逻辑 |
|-------|------|----------|----------|
| openGifPanel() | 打开GIF导出弹窗 | - | - |
| runGifExport() | 执行GIF导出 | - | - |

## 13. 工具函数与辅助方法

### 13.1 通用工具函数

### 13.2 辅助方法

### 13.3 第三方库集成

## 14. 代码依赖关系

### 14.1 模块间依赖关系

### 14.2 外部服务依赖

### 14.3 事件流分析

## 15. 性能关键点

### 15.1 性能瓶颈分析

### 15.2 优化建议

## 16. 功能索引

### 16.1 按功能名称索引

### 16.2 按代码位置索引

| 行号范围 | 功能描述 | 相关方法 |
|----------|----------|----------|
| 114-141 | 应用初始化 | initApp() |
| 143-300 | 状态变量定义 | data() |

### 16.3 交叉参考表

## 17. 附录

### 17.1 代码结构总览

### 17.2 命名规范

### 17.3 版本历史
