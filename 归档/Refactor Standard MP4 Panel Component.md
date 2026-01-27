# 重构 "转换为普通MP4" 弹窗 (Standard MP4 Panel)

## 目标
将 `index.html` 中的 "转换为普通MP4" 弹窗（`showStandardMp4Panel`）提取为独立的 Vue 组件 `StandardMp4Panel`，以清理 `app.js` 中的冗余逻辑并实现组件化。

## 实现步骤

### 1. 创建组件文件
创建 `docs/assets/js/components/standard-mp4-panel.js`，封装以下功能：
- **模板**：提取原 `.mp4-panel` 的 HTML 结构。
- **数据**：管理内部配置（尺寸、质量、帧率、静音）。
- **逻辑**：
  - 自动计算宽高比并锁定。
  - 根据 `currentModule` 显示/隐藏特定选项（如 Lottie 模式下的静音选项）。
  - 处理关闭、取消、开始转换事件。

### 2. 更新主页面 (index.html)
- 引入新组件脚本：`<script src="assets/js/components/standard-mp4-panel.js"></script>`。
- 替换原有 HTML 代码块为组件标签：
  ```html
  <standard-mp4-panel
    :visible="showStandardMp4Panel"
    :source-info="standardMp4SourceInfo"
    :initial-config="standardMp4Config"
    :is-converting="isConvertingStandardMp4"
    :progress="standardMp4Progress"
    :message="standardMp4Message"
    :disabled="isGlobalTaskRunning"
    :current-module="currentModule"
    @close="closeStandardMp4Panel"
    @cancel="cancelStandardMp4Conversion"
    @convert="startStandardMp4Conversion"
  ></standard-mp4-panel>
  ```

### 3. 更新业务逻辑 (app.js)
- **注册组件**：在 `initApp` 中注册 `standard-mp4-panel`。
- **新增计算属性**：`standardMp4SourceInfo`，根据当前模式（SVGA/双通道MP4/Lottie/序列帧）动态返回对应的文件信息（尺寸、时长等），供组件显示。
- **清理代码**：删除 `onStandardMp4WidthChange` 和 `onStandardMp4HeightChange` 等已移至组件的逻辑。
- **更新方法**：修改 `startStandardMp4Conversion` 以接收组件传递的配置参数。

## 预期效果
- 界面功能保持不变。
- `app.js` 代码量减少，逻辑更清晰。
- 弹窗逻辑实现复用和解耦。
