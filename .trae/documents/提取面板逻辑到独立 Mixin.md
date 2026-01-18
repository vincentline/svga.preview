# 重构计划：提取面板逻辑到独立模块

您说得非常对。`app.js` 确实承担了太多职责，导致代码臃肿且难以维护。刚才的修复虽然解决了功能问题，但仍然是在往这个已经很庞大的文件里堆砌代码。

为了改善架构，我计划将刚才在 `app.js` 中新增/修改的面板相关逻辑，提取到一个独立的 Mixin（混入）或模块中。鉴于当前 `app.js` 是一个 Vue 实例，使用 **Mixin** 是最自然且改动风险最小的方式。

## 计划步骤

1.  **创建 `docs/assets/js/mixins/panel-mixin.js`**
    *   将 `app.js` 中所有与右侧面板（ToSvga, DualChannel, Gif 等）相关的 **Data（状态）**、**Methods（打开/关闭/处理逻辑）** 提取到这个文件中。
    *   包括：`toSvgaConfig` 等状态变量，以及 `openToSvgaPanel`, `closeRightPanel`, `handleToSvgaConvert` 等方法。

2.  **清理 `app.js`**
    *   引入 `panel-mixin.js`。
    *   在 Vue 实例中注册该 Mixin。
    *   删除 `app.js` 中已提取到 Mixin 的代码。

3.  **验证**
    *   确保重构后，所有面板功能（打开、关闭、转换）依然正常工作。

这样做的好处是 `app.js` 将回归其“主控”职责，而具体的面板交互逻辑将被隔离在 `panel-mixin.js` 中，大大提高可读性。

请确认是否执行此重构计划？