# WebP导出功能独立模块优化计划

## 一、使用WebP导出功能的地方分析

### 1. UI界面使用
- **src/index.html** (608, 648, 702, 742行): 多个工具栏按钮显示导出状态
- **src/index.html** (892-895行): webp-panel组件调用，传递导出状态和配置

### 2. 核心逻辑使用
- **src/assets/js/core/app.js**:
  - 状态管理: webpConfig, isExportingWebp, webpExportProgress, webpExportMessage, webpExportCancelled
  - 方法调用: handleWebpExport, startWebpExport, runWebpExport, captureFrames, cancelWebpExport

### 3. 面板管理使用
- **src/assets/js/mixins/panel-mixin.js** (113-115行): 面板切换时的取消逻辑

## 二、独立模块设计方案

### 1. 创建独立模块文件
- **src/assets/js/service/webp/webp-exporter.js**

### 2. 模块接口设计
```javascript
MeeWoo.Exporters.WebPExporter = {
  /**
   * 导出WebP
   * @param {Object} config 配置对象
   * @param {Number} config.width 宽度
   * @param {Number} config.height 高度
   * @param {Number} config.fps 帧率
   * @param {Function} config.getFrame 获取帧的回调函数
   * @param {Function} config.onProgress 进度回调
   * @param {Function} config.onError 错误回调
   * @param {Function} config.shouldCancel 取消检查回调
   * @returns {Promise} 导出结果
   */
  export: async function(config) {}
};
```

### 3. 核心功能迁移
- 将captureFrames逻辑迁移到模块中
- 将runWebpExport的核心逻辑迁移到模块中
- 保持导出状态管理在app.js中

### 4. 调用方式优化
- 修改app.js中的startWebpExport方法，使用新的WebPExporter模块
- 保持对外接口不变，确保所有调用点正常工作

## 三、具体实现步骤

### 1. 创建webp-exporter.js模块
- 实现核心导出逻辑
- 提供清晰的配置接口
- 支持进度和错误回调

### 2. 修改app.js中的相关方法
- 更新startWebpExport方法，使用新模块
- 保持handleWebpExport和cancelWebpExport接口不变
- 确保状态管理逻辑正确

### 3. 更新依赖和引用
- 在index.html中添加webp-exporter.js的引用
- 确保模块加载顺序正确

### 4. 测试验证
- 验证所有使用WebP导出的地方都能正常工作
- 测试导出功能的完整性
- 确保错误处理和取消功能正常

## 四、优化效果

1. **代码结构更清晰**: WebP导出逻辑独立管理，app.js更简洁
2. **可维护性提高**: 模块化设计便于后续扩展和修复
3. **可复用性增强**: 其他地方需要WebP导出时可直接使用该模块
4. **性能优化**: 核心逻辑集中处理，减少重复代码

## 五、注意事项

1. **保持向后兼容**: 确保所有现有调用方式正常工作
2. **状态管理同步**: 确保导出状态在app.js和模块间正确同步
3. **错误处理完整**: 确保所有错误情况都能正确处理
4. **性能考虑**: 避免不必要的计算和DOM操作