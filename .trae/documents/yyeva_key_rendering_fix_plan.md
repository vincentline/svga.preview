# MeeWoo - YYEVA Key 渲染修复计划

## 问题分析
当前 YYEVA key 素材管理面板可以正常上传图片和输入文本，但替换的内容没有在播放器中显示。这表明渲染器没有正确使用替换的数据。

## 任务分解

### [ ] 任务 1: 检查 YyevaRenderer 渲染逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 检查 `yyeva-renderer.js` 中的 `renderEffects` 方法
  - 验证是否正确使用了 `effectConfig` 中的用户配置数据
  - 检查文本和图片渲染的实现
- **Success Criteria**:
  - 确认 `renderEffects` 方法能正确读取用户配置
  - 确认文本和图片渲染逻辑正确
- **Test Requirements**:
  - `programmatic` TR-1.1: 检查 `renderEffects` 方法是否正确使用 `userConfig`
  - `programmatic` TR-1.2: 检查 `_renderText` 和 `_renderImage` 方法是否正确实现

### [ ] 任务 2: 检查 app.js 中的数据传递
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 检查 `app.js` 中 `handleYyevaKeyConfirm`、`handleYyevaImageReplaced` 和 `handleYyevaTextInput` 方法
  - 验证是否正确调用了 `yyevaRenderer` 的 `setText` 和 `setImage` 方法
  - 检查 `renderYyevaFrame` 方法是否正确传递数据给渲染器
- **Success Criteria**:
  - 确认所有数据传递方法都正确调用渲染器的 API
  - 确认 `renderYyevaFrame` 方法正确传递 `yyevaData`
- **Test Requirements**:
  - `programmatic` TR-2.1: 验证 `setText` 和 `setImage` 方法被正确调用
  - `programmatic` TR-2.2: 验证 `renderYyevaFrame` 方法传递正确的参数

### [ ] 任务 3: 检查 YYEVA 数据结构
- **Priority**: P1
- **Depends On**: Task 1
- **Description**:
  - 检查 YYEVA 数据的结构，特别是 `effect` 和 `datas` 字段
  - 验证 `effectId` 与 `effect` 数组的对应关系
  - 检查 `outputFrame` 数据是否正确
- **Success Criteria**:
  - 确认 YYEVA 数据结构正确解析
  - 确认 `effectId` 能正确映射到 `effect` 数组
- **Test Requirements**:
  - `programmatic` TR-3.1: 检查 YYEVA 数据结构的解析
  - `human-judgement` TR-3.2: 验证控制台日志中的 YYEVA 数据

### [ ] 任务 4: 测试图片和文本替换功能
- **Priority**: P0
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  - 测试图片 key 替换功能
  - 测试文本 key 替换功能
  - 验证替换后的内容在播放器中正确显示
- **Success Criteria**:
  - 图片 key 替换后能在播放器中显示
  - 文本 key 替换后能在播放器中显示
  - 恢复功能正常工作
- **Test Requirements**:
  - `human-judgement` TR-4.1: 测试图片替换功能
  - `human-judgement` TR-4.2: 测试文本替换功能
  - `human-judgement` TR-4.3: 测试恢复功能

### [ ] 任务 5: 优化渲染性能
- **Priority**: P2
- **Depends On**: Task 4
- **Description**:
  - 检查渲染性能，特别是图片加载和缓存
  - 优化 `_renderImage` 方法的图片加载逻辑
  - 确保图片缓存正确工作
- **Success Criteria**:
  - 图片加载性能良好
  - 缓存机制正常工作
  - 渲染流畅无卡顿
- **Test Requirements**:
  - `human-judgement` TR-5.1: 检查渲染性能
  - `human-judgement` TR-5.2: 验证图片缓存效果

## 实现步骤
1. 首先检查 YyevaRenderer 的渲染逻辑
2. 然后检查 app.js 中的数据传递
3. 接着验证 YYEVA 数据结构
4. 最后进行功能测试和性能优化

## 预期结果
- YYEVA key 图片替换功能正常工作
- YYEVA key 文本替换功能正常工作
- 替换的内容在播放器中正确显示
- 渲染性能良好