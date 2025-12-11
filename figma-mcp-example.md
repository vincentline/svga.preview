# Framelink Figma MCP 使用示例

本文档演示如何使用 Framelink Figma MCP 工具来获取和处理 Figma 设计文件。

## 前置条件

1. **获取 Figma Access Token**
   - 访问 Figma 账户设置
   - 生成个人访问令牌（Personal Access Token）
   - 配置到 MCP 服务中

2. **获取 Figma 文件信息**
   - Figma 文件 URL 格式：`https://www.figma.com/file/<fileKey>/<fileName>`
   - 从 URL 中提取 `fileKey`

## 示例 1：获取 Figma 文件数据

### 基础用法

```javascript
// 调用示例
mcp_FramelinkFigmaMCP_get_figma_data({
  fileKey: "your-file-key-here"
})
```

### 参数说明

- `fileKey`（必需）：Figma 文件的唯一标识符
- `nodeId`（可选）：特定节点 ID，格式如 `1234:5678` 或 `I5666:180910`
- `depth`（可选）：遍历节点树的深度级别

### 实际调用示例

```javascript
// 获取整个 Figma 文件
{
  fileKey: "abc123def456"
}

// 获取特定节点
{
  fileKey: "abc123def456",
  nodeId: "123:456"
}

// 获取多个节点，限制深度
{
  fileKey: "abc123def456",
  nodeId: "123:456;789:012",
  depth: 3
}
```

## 示例 2：下载 Figma 图片资源

### 使用场景

当你需要将 Figma 设计中的图标、插图等导出为 SVG 或 PNG 格式时使用。

### 调用示例

```javascript
mcp_FramelinkFigmaMCP_download_figma_images({
  fileKey: "your-file-key",
  localPath: "f:/project/assets/images",
  nodes: [
    {
      nodeId: "123:456",
      fileName: "icon-home.svg",
      imageRef: "",
      needsCropping: false,
      requiresImageDimensions: false
    },
    {
      nodeId: "789:012",
      fileName: "logo.png",
      imageRef: "image-ref-id",
      needsCropping: true,
      cropTransform: [[1, 0, 0], [0, 1, 0]],
      filenameSuffix: "cropped",
      requiresImageDimensions: true
    }
  ],
  pngScale: 2
})
```

### 参数说明

- `fileKey`（必需）：Figma 文件 key
- `localPath`（必需）：本地保存路径（绝对路径）
- `nodes`（必需）：要下载的节点数组
  - `nodeId`：节点 ID
  - `fileName`：保存的文件名（含扩展名 .png 或 .svg）
  - `imageRef`：图片引用 ID（PNG 格式必需）
  - `needsCropping`：是否需要裁剪
  - `cropTransform`：裁剪矩阵
  - `filenameSuffix`：文件名后缀
  - `requiresImageDimensions`：是否需要尺寸信息
- `pngScale`（可选）：PNG 导出倍率，默认为 2

## 实际应用场景

### 场景 1：设计稿到代码工作流

1. **获取设计文件结构**
   ```javascript
   // 先获取整体结构
   get_figma_data({ fileKey: "xxx" })
   ```

2. **下载需要的图标资源**
   ```javascript
   // 批量下载 SVG 图标
   download_figma_images({
     fileKey: "xxx",
     localPath: "f:/project/src/assets/icons",
     nodes: [
       { nodeId: "1:10", fileName: "icon-menu.svg" },
       { nodeId: "1:11", fileName: "icon-close.svg" },
       { nodeId: "1:12", fileName: "icon-search.svg" }
     ]
   })
   ```

### 场景 2：组件库资源同步

用于同步设计系统中的组件图标和插图到项目中。

### 场景 3：动画资源准备

配合本项目的 SVGA/Lottie 预览功能，可以：
1. 从 Figma 获取动画帧图片
2. 使用本地工具转换为 SVGA 格式
3. 在预览器中查看效果

## 常见问题

### Q: 403 Forbidden 错误
**A:** 需要配置有效的 Figma Access Token

### Q: 如何找到 nodeId？
**A:** 
1. 在 Figma 中选中元素
2. 右键 → Copy/Paste as → Copy link
3. URL 参数 `node-id=123-456` 即为节点 ID（需转换为 `123:456` 格式）

### Q: SVG vs PNG 如何选择？
**A:** 
- SVG：适合图标、简单图形，矢量格式可缩放
- PNG：适合复杂图像、照片，可控制导出倍率

## 注意事项

1. ⚠️ 文件路径必须使用绝对路径
2. ⚠️ nodeId 格式严格要求 `数字:数字` 或带 `I` 前缀
3. ⚠️ PNG 图片必须提供 `imageRef` 参数
4. ✅ 工具会自动创建不存在的目录
5. ✅ 支持批量下载，一次调用可处理多个节点

## 与本项目集成建议

本项目是 SVGA/Lottie 动画预览工具，可以结合 Figma MCP：

1. **设计阶段**：在 Figma 中设计动画关键帧
2. **导出阶段**：使用 MCP 批量下载帧图片
3. **转换阶段**：使用转换工具生成 SVGA/Lottie 文件
4. **预览阶段**：使用本项目在线预览动画效果

这样可以形成完整的设计到开发工作流。
