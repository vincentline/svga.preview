## 集成本地 pngquant.wasm 到图像压缩服务

### 问题分析
1. 用户找到了 `pngquant.wasm` 文件，但没有找到对应的 JavaScript 包装器
2. 当前图像压缩服务已实现三级降级机制，但 libimagequant 部分被跳过
3. 需要直接加载和使用本地 wasm 文件，无需外部 CDN

### 解决方案
1. **下载 pngquant.wasm 到本地**：将用户找到的 wasm 文件保存到服务文件夹
2. **实现直接加载 WASM 模块**：修改图像压缩服务，使用 WebAssembly.instantiate() 直接加载 wasm
3. **更新库加载配置**：调整 library-loader.js 中的配置，支持本地 wasm 加载
4. **恢复三级降级机制**：确保 libimagequant → Pako → 浏览器默认的完整降级流程

### 实施步骤

#### 1. 下载 pngquant.wasm 到本地
```bash
# 创建服务文件夹（如果不存在）
mkdir -p docs/assets/js/service/lib
# 下载 pngquant.wasm 到本地
curl -o docs/assets/js/service/lib/pngquant.wasm https://github.com/wapm-packages/pngquant/blob/master/pngquant.wasm?raw=true
```

#### 2. 修改 image-compression-service.js
- 更新 `init()` 方法，实现直接加载本地 wasm 文件
- 修改 `compressWithLibimagequant()` 方法，适配直接调用 wasm 模块
- 恢复三级降级机制，将 libimagequant 作为首选压缩方式

#### 3. 更新 library-loader.js
- 修改 libimagequant 配置，使用本地文件路径
- 移除 disabled 标志，启用 libimagequant 加载
- 更新 checkFn，检查 wasm 模块是否成功加载

#### 4. 测试和验证
- 确保 libimagequant 能够成功加载和使用
- 验证三级降级机制正常工作
- 确保 SVGA 构建过程中正确调用图像压缩服务

### 预期结果
- 图像压缩服务能够成功加载本地 `pngquant.wasm`
- 恢复完整的三级降级压缩机制
- SVGA 构建过程中优先使用 libimagequant 压缩 PNG
- 压缩失败时正确降级到 Pako 或浏览器默认压缩
- 生成 SVGA 时，仅在压缩失败时弹窗通知用户

### 技术要点
- 使用 WebAssembly.instantiate() 直接加载 wasm 模块
- 处理 wasm 模块的内存管理和函数调用
- 确保跨浏览器兼容性
- 实现优雅的错误处理和降级机制