# SVGA素材替换与导出

<cite>
**本文档引用文件**   
- [index.html](file://docs/index.html)
- [ROADMAP.md](file://ROADMAP.md)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md)
- [svga.proto](file://docs/svga.proto)
- [demo-gif-export.html](file://demo-gif-export.html)
- [demo-yyeva-format.html](file://demo-yyeva-format.html)
- [package.json](file://package.json)
</cite>

## 更新摘要
**变更内容**   
- 更新了“SVGA素材替换与导出”章节，新增侧边栏搜索功能和素材名称复制功能的说明
- 更新了“开发路线图”章节，反映已完成功能状态
- 新增了相关代码实现的引用来源

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心功能](#核心功能)
4. [SVGA素材替换与导出](#svga素材替换与导出)
5. [GIF导出功能](#gif导出功能)
6. [技术架构](#技术架构)
7. [依赖库与技术栈](#依赖库与技术栈)
8. [开发路线图](#开发路线图)
9. [结论](#结论)

## 简介

本项目是一个支持SVGA、YYEVA-MP4和Lottie三种动画格式的在线预览与转换工具。其主要功能包括SVGA文件的预览、播放控制、主题切换、背景色切换、画布缩放与拖拽、拖拽上传文件、播放进度条与帧数显示等。项目特别关注SVGA格式的高级功能，如素材替换和导出为GIF或MP4格式。

**Section sources**
- [ROADMAP.md](file://ROADMAP.md#L1-L370)

## 项目结构

项目根目录包含以下主要文件和目录：
- `docs/`：存放文档和静态资源
- `node_modules/`：存放项目依赖
- `.gitignore`：Git忽略文件配置
- `404.html`：404页面
- `CNAME`：自定义域名配置
- `ROADMAP.md`：项目开发路线图
- `TECH-RESEARCH.md`：技术调研报告
- `demo-gif-export.html`：GIF导出功能演示
- `demo-yyeva-format.html`：YYEVA格式解析演示
- `env-check.ps1`：环境检查脚本
- `figma-mcp-example.md`：Figma MCP示例
- `package-lock.json`：npm包锁定文件
- `package.json`：项目配置文件
- `run-deploy.ps1`：部署脚本
- `run-static.ps1`：静态资源运行脚本

**Section sources**
- [project_structure](file://project_structure)

## 核心功能

项目已实现的基础预览功能包括：
- SVGA文件预览与播放控制
- 基础UI框架（顶部播放区 + 底部浮层）
- 暗黑/白天主题切换
- 背景色切换（6种颜色 + 透明网格）
- 画布缩放与拖拽
- 1:1显示、居中显示
- 拖拽上传文件
- 播放进度条与帧数显示
- 模块切换（SVGA/YYEVA/Lottie）

**Section sources**
- [ROADMAP.md](file://ROADMAP.md#L8-L21)

## SVGA素材替换与导出

### 素材替换功能

SVGA素材替换功能允许用户替换SVGA动画中的图片素材，预览替换后的效果，并重新导出替换后的SVGA文件。最新版本扩展了该功能，新增了侧边栏搜索功能和素材名称复制功能。

#### 功能流程
1. 用户拖拽上传SVGA文件
2. 系统解析SVGA文件，提取可替换的图片素材
3. 用户在素材面板中选择要替换的图片
4. 用户上传新的图片素材
5. 系统实时预览替换效果
6. 用户可选择恢复原图或导出新的SVGA文件

#### 新增功能特性
- **侧边栏搜索功能**：用户可通过搜索框快速过滤素材列表，提高查找效率
- **素材名称复制功能**：每个素材名称旁新增复制按钮，可一键复制素材名称
- **用户体验优化**：搜索框和复制按钮的添加显著提升了用户操作效率

**Updated** 新增了侧边栏搜索和素材名称复制功能的说明

**Section sources**
- [index.html](file://docs/index.html#L1927-L1935)
- [index.html](file://docs/index.html#L1954-L1959)
- [index.html](file://docs/index.html#L2608-L2633)
- [ROADMAP.md](file://ROADMAP.md#L30-L35)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L10-L31)

### 导出新SVGA文件

导出新SVGA文件功能允许用户将替换素材后的动画重新打包为SVGA文件。

#### 技术要点
- 读取原始SVGA文件的二进制数据
- 使用pako库解压缩数据
- 使用protobuf.js加载SVGA协议定义
- 解码protobuf消息
- 替换指定图片的二进制数据
- 重新编码protobuf消息
- 使用pako库压缩数据
- 创建Blob并触发下载

```mermaid
sequenceDiagram
participant 用户
participant 前端
participant SVGA文件
participant Protobuf
participant 下载
用户->>前端 : 点击"导出新SVGA"
前端->>SVGA文件 : 读取原始SVGA文件
SVGA文件-->>前端 : 返回ArrayBuffer
前端->>前端 : 使用pako解压缩
前端->>Protobuf : 加载svga.proto定义
Protobuf-->>前端 : 返回解析器
前端->>前端 : 解码MovieEntity
前端->>前端 : 替换图片数据
前端->>前端 : 重新编码MovieEntity
前端->>前端 : 使用pako压缩
前端->>下载 : 创建Blob并下载
下载-->>用户 : 下载新SVGA文件
```

**Diagram sources**
- [index.html](file://docs/index.html#L2453-L2544)
- [svga.proto](file://docs/svga.proto#L1-L132)

**Section sources**
- [index.html](file://docs/index.html#L2453-L2544)
- [ROADMAP.md](file://ROADMAP.md#L30-L39)

## GIF导出功能

### 功能描述

GIF导出功能将SVGA动画导出为GIF格式，支持自定义帧率、尺寸、质量，并显示导出进度。

#### 技术方案
```
SVGA → Canvas 逐帧渲染 → GIF 编码器 → 下载
```

#### 实现步骤
1. 遍历SVGA每一帧，使用Canvas渲染
2. 将每帧Canvas数据传递给GIF编码器
3. 合成GIF并触发下载

### 技术实现

```mermaid
flowchart TD
A[开始导出GIF] --> B{是否有SVGA文件}
B --> |否| C[提示先加载SVGA文件]
B --> |是| D{gif.js是否加载}
D --> |否| E[提示库未加载]
D --> |是| F[创建GIF编码器]
F --> G[暂停当前播放]
G --> H[逐帧渲染]
H --> I[添加帧到GIF]
I --> J{是否完成所有帧}
J --> |否| H
J --> |是| K[开始渲染GIF]
K --> L[监听进度]
L --> M{完成}
M --> |是| N[创建下载链接]
N --> O[触发下载]
O --> P[清理资源]
P --> Q[完成]
```

**Diagram sources**
- [index.html](file://docs/index.html#L2563-L2710)
- [demo-gif-export.html](file://demo-gif-export.html#L1-L308)

**Section sources**
- [index.html](file://docs/index.html#L2563-L2710)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L187-L287)

## 技术架构

### 整体架构

```mermaid
graph TB
subgraph "前端界面"
UI[用户界面]
Theme[主题切换]
Upload[文件上传]
end
subgraph "核心功能"
SVGA[SVGA播放器]
Material[素材替换]
Export[文件导出]
end
subgraph "技术栈"
Vue[Vue.js]
SVGAP[SVGAPlayer-Web]
GIF[gif.js]
Proto[protobuf.js]
Pako[pako]
end
UI --> SVGA
Upload --> SVGA
Theme --> UI
SVGA --> Material
SVGA --> Export
Material --> Proto
Material --> Pako
Export --> GIF
Export --> Proto
Export --> Pako
```

**Diagram sources**
- [index.html](file://docs/index.html#L1694-L2793)
- [package.json](file://package.json#L1-L19)

### 数据流

```mermaid
flowchart LR
A[用户上传SVGA文件] --> B[FileReader读取ArrayBuffer]
B --> C[pako解压缩]
C --> D[protobuf解码]
D --> E[SVGAPlayer渲染]
E --> F[Canvas显示]
F --> G[用户交互]
G --> H[素材替换]
H --> I[更新播放器]
I --> F
G --> J[GIF导出]
J --> K[逐帧渲染]
K --> L[GIF编码]
L --> M[下载]
```

**Diagram sources**
- [index.html](file://docs/index.html#L1869-L1912)
- [index.html](file://docs/index.html#L2563-L2710)

**Section sources**
- [index.html](file://docs/index.html#L1694-L2793)

## 依赖库与技术栈

### 核心依赖

| 库名 | 版本 | 用途 |
|------|------|------|
| vuepress | ^1.8.2 | 静态网站生成器 |
| element-ui | ^2.15.1 | UI组件库 |

### CDN引入库

| 库名 | 用途 |
|------|------|
| svgaplayerweb | SVGA播放 |
| lottie-web | Lottie播放 |
| gif.js | GIF导出 |
| protobuf.js | SVGA文件解析 |
| pako | zlib压缩/解压缩 |

### 技术选型

```mermaid
graph TD
A[前端框架] --> B[Vue.js]
A --> C[VuePress]
D[动画播放] --> E[SVGAPlayer-Web]
D --> F[lottie-web]
G[文件处理] --> H[protobuf.js]
G --> I[pako]
H --> J[SVGA格式解析]
I --> K[压缩/解压缩]
L[导出功能] --> M[gif.js]
M --> N[GIF编码]
```

**Diagram sources**
- [package.json](file://package.json#L1-L19)
- [index.html](file://docs/index.html#L9-L18)

**Section sources**
- [package.json](file://package.json#L1-L19)
- [index.html](file://docs/index.html#L9-L18)

## 开发路线图

### 阶段1：基础预览功能 ✅
**状态：已完成**

#### 已实现功能
- ✅ SVGA 文件预览与播放控制
- ✅ 基础UI框架（顶部播放区 + 底部浮层）
- ✅ 暗黑/白天主题切换
- ✅ 背景色切换（6种颜色 + 透明网格）
- ✅ 画布缩放与拖拽
- ✅ 1:1 显示、居中显示
- ✅ 拖拽上传文件
- ✅ 播放进度条与帧数显示
- ✅ 模块切换（SVGA/YYEVA/Lottie）

### 阶段2：SVGA 高级功能 ✅
**目标：完善 SVGA 模块的导出与转换能力**
**状态：已完成**

#### 已完成功能
- ✅ **素材替换功能**（侧边栏展示、搜索、复制名称、替换上传）
- ✅ **导出GIF功能**（使用gif.js，支持背景色、进度显示）
- ✅ **缩放控制优化**（zoom in/out图标、hover状态、暗黑模式）
- ✅ **UI体验完善**（重传SVGA、文件信息展示、帮助说明）

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

**Section sources**
- [ROADMAP.md](file://ROADMAP.md#L1-L370)
- [ROADMAP.md](file://ROADMAP.md#L24-L64)

## 结论

本项目成功实现了SVGA文件的在线预览、素材替换和导出功能。通过使用Vue.js作为前端框架，结合SVGAPlayer-Web、protobuf.js、pako和gif.js等库，实现了完整的SVGA文件处理流程。素材替换功能通过解析SVGA文件的protobuf结构，允许用户替换其中的图片素材，并重新打包为新的SVGA文件。GIF导出功能通过逐帧渲染SVGA动画到Canvas，然后使用gif.js编码为GIF格式。项目架构清晰，功能完整，为用户提供了一个强大的SVGA动画处理工具。

**Section sources**
- [ROADMAP.md](file://ROADMAP.md#L1-L370)
- [TECH-RESEARCH.md](file://TECH-RESEARCH.md#L1-L454)
- [index.html](file://docs/index.html#L1-L2796)