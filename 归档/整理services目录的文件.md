# 整理services目录的文件计划

## 1. 分析现有文件结构
当前`docs/assets/js/`目录下有以下服务相关文件：
- 已在service目录：`oxipng/`目录、`image-compression-service.js`
- 待整理的服务文件：`dual-channel-composer.js`、`dual-channel-worker.js`、`ffmpeg-service.js`、`gif-exporter.js`、`gif.worker.js`、`resource-manager.js`、`site-config-loader.js`、`task-manager.js`

## 2. 设计新的服务目录结构
根据功能组织服务目录：
```
service/
  ├── dual-channel/          # 双通道相关服务
  │   ├── dual-channel-composer.js
  │   └── dual-channel-worker.js
  ├── ffmpeg/                # FFmpeg相关服务
  │   └── ffmpeg-service.js
  ├── gif/                   # GIF导出相关服务
  │   ├── gif-exporter.js
  │   └── gif.worker.js
  ├── oxipng/                # 已存在，压缩服务
  ├── image-compression-service.js
  ├── resource-manager.js
  ├── site-config-loader.js
  └── task-manager.js
```

## 3. 整理步骤
1. 创建服务子目录：`dual-channel/`、`ffmpeg/`、`gif/`
2. 将对应的服务文件移动到相应的子目录
3. 更新`index.html`中对这些服务文件的引用路径
4. 检查并更新其他文件中对这些服务的引用

## 4. 需要更新的引用文件
- `index.html`：更新所有服务文件的script标签src路径
- 其他可能引用这些服务的JavaScript文件

## 5. 预期结果
- 服务文件按照功能合理归类，目录结构清晰
- 所有引用路径正确更新，项目可以正常运行
- 符合项目中"新功能尽量考虑文件架构，适合拆分模块独立js"的规范

## 6. 注意事项
- 确保Web Worker文件的引用路径正确，因为Worker的路径是相对于HTML文件的
- 保持服务文件的命名规范，使用驼峰命名法
- 确保所有服务文件都有适当的中文注释，描述其功能