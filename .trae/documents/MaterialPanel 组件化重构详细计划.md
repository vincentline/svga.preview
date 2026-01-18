我已完成详细分析，为您制定的**以 `MaterialPanel` 为试点的分步重构计划**如下。这个计划将风险降到最低，确保每一步都是可验证的。

### 第一阶段：准备工作（已完成分析）
*   **确认边界**：`MaterialPanel`（右侧列表）与 `MaterialEditor`（居中编辑弹窗）是分离的。本次重构只针对**右侧列表面板**。
*   **数据梳理**：已识别出组件所需的 8 个 Props（如 `materialList`, `replacedImages`）和 5 个 Events（如 `edit`, `replace`, `close`）。

### 第二阶段：创建组件文件
**操作**：新建 `docs/assets/js/components/material-panel.js`
**内容**：
1.  定义 `SvgaPreview.Components.MaterialPanel` 对象。
2.  **迁移逻辑**：
    *   将 `materialSearchQuery` (Data) 移入组件。
    *   将 `filteredMaterialList` (Computed) 移入组件。
    *   将 `copyMaterialName`, `downloadMaterial` (Methods) 移入组件。
3.  **定义接口**：
    *   `props`: `visible`, `list` (素材列表), `replacedImages` (替换图字典), `isCompressing` 等。
    *   `events`: `@close`, `@edit`, `@replace`, `@restore`, `@export`。

### 第三阶段：分离 HTML 模板
**操作**：修改 `docs/index.html`
1.  在 `<body>` 底部添加 `<script type="text/x-template" id="tpl-material-panel">`。
2.  将原有的 `<div class="material-panel">...</div>` 代码块剪切并放入模板中。
3.  引入新建的 JS 文件：`<script src="assets/js/components/material-panel.js"></script>`。
4.  在原位置使用新组件标签：
    ```html
    <material-panel
        :visible="activeRightPanel === 'material'"
        :list="materialList"
        ...
        @edit="openMaterialEditor"
        @close="activeRightPanel = null"
    ></material-panel>
    ```

### 第四阶段：清理与接入 App.js
**操作**：修改 `docs/assets/js/app.js`
1.  **注册组件**：在 `components` 选项中注册 `material-panel`。
2.  **状态升级**：将 `data.showMaterialPanel` (布尔值) 替换为 `data.activeRightPanel` (字符串)，实现统一管理。
3.  **代码瘦身**：删除 `app.js` 中已移入组件的搜索逻辑、过滤逻辑和辅助方法。

---

### 验证点
*   重构后，点击“素材替换”按钮，右侧面板应正常滑出。
*   搜索功能应正常工作（逻辑已移入组件）。
*   点击“编辑”按钮，应正常唤起居中的编辑器（通过 Event 通知父组件调用 Mixin 方法）。

您是否同意按此计划执行？同意后我将开始**第二阶段**的工作。