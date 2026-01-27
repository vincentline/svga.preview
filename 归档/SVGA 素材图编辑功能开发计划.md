# SVGA 素材图编辑功能开发计划

## 1. 库文件依赖更新

* **文件**: `docs/assets/js/library-loader.js`

* **任务**: 添加 `html2canvas` 库的配置。

  * CDN地址: `https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js`

  * 目的: 用于将编辑后的 DOM（图片+文字）渲染为 PNG 图片。

## 2. UI 结构修改 (`docs/index.html`)

### 2.1 素材列表项更新

* **位置**: 在 `<!-- 素材替换弹窗 -->` 的列表渲染部分 (`v-for="(item, index) in materialList"`)。

* **改动**:

  * 在“替换此图”和“恢复”按钮之间，添加一个“编辑”按钮。

  * 样式: 使用 `btn-icon` 类，图标使用 emoji `✏️` 或类似的简单图标（保持无文字）。

  * 事件: 点击触发 `openMaterialEditor(index)`。

### 2.2 新增素材编辑弹窗

* **位置**: 在 `body` 底部或与其他 modal 并列。

* **结构**:

  * **容器**: `.center-modal-overlay` + `.center-modal` (最大宽度 1000px)。

  * **Header**: 标题“编辑素材图”。

  * **Body**: Flex 布局，分为左右两栏。

    * **左栏 (预览区)**:

      * 容器: 固定宽高比（或自适应），`overflow: hidden`。

      * 内容层: 包含图片和文字层的 wrapper，支持 `transform: scale/translate`。

      * 操作栏 (悬浮或置底): 放大 `+`、缩小 `-`、显示的百分比。

      * 底部按钮组: “上传图片”（替换底图）、“AI生图”（hover提示开发中）。

    * **右栏 (控制区)**:

      * 开关组: “显示素材图” (toggle)、“显示文案” (toggle)。

      * 文案输入区 (当“显示文案”开启时显示):

        * 普通输入框 (`input`): 输入文案内容。

        * 样式输入框 (`textarea`): 输入 CSS 样式。

      * 提示: “默认样式白字黑边”。

  * **Footer**:

    * “保存”按钮 (primary): 触发生成 PNG 并保存。

    * “取消”按钮: 关闭弹窗。

## 3. 样式文件更新 (`docs/assets/css/style.css`)

* **任务**:

  * 添加素材编辑弹窗的特定样式。

  * 定义预览区的布局、网格背景（表示透明）。

  * 定义文字层在预览区的默认样式（绝对定位、可拖拽光标等）。

  * 定义右侧控制面板的表单样式（复用现有输入框样式）。

## 4. 业务逻辑开发

建议新建独立文件 `docs/assets/js/material-editor.js`，然后在 `app.js` 中引入并使用。

### 4.1 `material-editor.js` (新文件)

* **职责**: 封装素材编辑器的核心逻辑。

* **State**:

  * `show`: 弹窗显示状态。

  * `targetIndex`: 当前编辑的素材索引。

  * `scale`: 预览缩放比例 (默认 1.0)。

  * `offsetX`, `offsetY`: 预览位移。

  * `showImage`: 图片显示开关。

  * `showText`: 文字显示开关。

  * `textContent`: 文案内容。

  * `textStyle`: CSS 样式字符串。

  * `textPosX`, `textPosY`: 文字层位置。

  * `textScale`: 文字层缩放。

  * `baseImage`: 当前底图（Image对象或URL）。

* **Methods**:

  * `init(index, currentImage, savedState)`: 初始化编辑器，载入当前素材和之前的编辑状态。

  * `handleZoom(delta)`: 处理缩放。

  * `handlePan(dx, dy)`: 处理预览拖拽。

  * `handleTextDrag(dx, dy)`: 处理文字拖拽。

  * `handleTextWheel(delta)`: 处理文字缩放。

  * `uploadImage(file)`: 处理图片上传。

  * `generateResult()`: 使用 `html2canvas` 生成最终 PNG Blob。

### 4.2 `app.js` 集成

* **Data**:

  * 引入 `MaterialEditor` 混合对象 (mixin) 或直接挂载实例。

  * `materialEditStates`: 对象/数组，用于存储每个素材的编辑状态（文案、样式、开关状态等），以便再次打开时恢复。

* **Methods**:

  * `openMaterialEditor(index)`:

    * 获取当前素材图（可能是已被替换的图，也可能是原图）。

    * 获取已保存的编辑状态（如果有）。

    * 调用 `MaterialEditor.open(...)`。

  * `onMaterialEditorSave(blob, editState)`:

    * 接收生成的图片 Blob 和最新的编辑状态。

    * 保存编辑状态到 `materialEditStates[index]`。

    * 调用现有的素材替换逻辑（类似 `replaceMaterial` 中的处理），将 Blob 替换到 SVGA Player。

  * `restoreMaterial(index)` (修改现有逻辑):

    * 除了恢复 SVGA 原图，还需要清除 `materialEditStates[index]`。

  * `clearAll` / `restorePlayback`:

    * 清空 `materialEditStates`。 

## 5. 开发步骤

1. **添加依赖**: 修改 `library-loader.js` 添加 `html2canvas`。
2. **创建 JS**: 创建 `material-editor.js` 并实现基础状态管理和逻辑。
3. **修改 HTML**: 引入新 JS，添加弹窗 DOM 结构。
4. **修改 CSS**: 添加对应样式。
5. **集成逻辑**: 在 `app.js` 中添加打开入口、保存回调和状态清理逻辑。
6. **调试验证**:

   * 验证图片替换、文字编辑、样式应用。

   * 验证缩放、拖拽交互。

   * 验证生成图片是否正确（包含透明背景情况）。

   * 验证“恢复”功能是否彻底清除编辑状态。

## 6. 注意事项

* **html2canvas**: 需要确保图片跨域设置 (`useCORS: true`)，且素材图本身支持跨域（现有逻辑中已处理 `crossOrigin`）。

* **性能**: 生成大图时可能会有轻微卡顿，建议添加 "生成中..." 的 Loading 状态。

* **兼容性**: 文字样式的 CSS 输入需要注意安全过滤（虽然是本地工具，风险较低，但最好避免执行 JS）。

