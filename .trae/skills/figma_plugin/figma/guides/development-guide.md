# Figma 插件开发指南

## 环境设置

### 前置要求

- **Figma 桌面应用**：插件开发需要在 Figma 桌面应用中进行，因为浏览器版本不支持插件开发功能。
- **Node.js**：推荐使用最新的 LTS 版本。
- **代码编辑器**：如 VS Code、Sublime Text 等。
- **TypeScript**：虽然不是必须的，但强烈推荐使用，因为它提供了类型检查和更好的开发体验。

### 创建插件项目

1. **打开 Figma 桌面应用**
2. **创建新插件**：
   - 点击菜单栏中的 `Plugins` → `Development` → `New Plugin...`
   - 在弹出的对话框中，填写插件名称和描述
   - 选择插件类型：
     - **Figma 设计插件**：在 Figma 设计文件中运行
     - **FigJam 插件**：在 FigJam 文件中运行
     - **两者兼顾**：在两种文件类型中都能运行
   - 选择模板：
     - **Empty**：空模板
     - **Hello World**：简单的示例插件
     - **With UI**：带有用户界面的示例插件
3. **选择保存位置**：选择一个文件夹来保存插件项目

### 项目结构

一个典型的 Figma 插件项目结构如下：

```
my-plugin/
├── manifest.json          # 插件配置文件
├── code.js                # 插件主逻辑
├── ui.html                # 插件用户界面（可选）
├── ui.js                  # 插件 UI 逻辑（可选）
├── package.json           # npm 配置文件（可选）
├── tsconfig.json          # TypeScript 配置文件（可选）
└── README.md              # 项目说明文档（可选）
```

### 配置文件

#### manifest.json

`manifest.json` 是插件的核心配置文件，定义了插件的基本信息、权限和行为。

```json
{
  "name": "My Plugin",
  "id": "1234567890",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "menu": [
    {
      "name": "Run",
      "command": "run"
    }
  ],
  "permissions": [
    "currentuser"
  ],
  "capabilities": [
    "textreview"
  ],
  "enablePrivatePluginApi": true
}
```

**关键属性说明**：
- `name`：插件名称
- `id`：插件唯一标识符
- `api`：使用的 Figma API 版本
- `main`：插件主逻辑文件
- `ui`：插件用户界面文件（可选）
- `menu`：插件菜单项配置
- `permissions`：插件需要的权限
- `capabilities`：插件的能力
- `enablePrivatePluginApi`：是否启用私有插件 API

#### package.json（可选）

如果使用 npm 管理依赖，可以创建 `package.json` 文件：

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My Figma plugin",
  "main": "code.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^4.9.5",
    "@figma/plugin-typings": "^1.59.0"
  }
}
```

#### tsconfig.json（可选）

如果使用 TypeScript，可以创建 `tsconfig.json` 文件：

```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": ".",
    "strict": true,
    "jsx": "react",
    "typeRoots": [
      "node_modules/@types",
      "node_modules/@figma"
    ]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

## 插件架构

### 插件运行机制

Figma 插件在一个安全的沙箱环境中运行，分为两个主要部分：

1. **插件逻辑**：在 `code.js` 中实现，运行在 Figma 的主线程中，有权限访问 Figma 的 API。
2. **用户界面**：在 `ui.html` 中实现，运行在一个 iframe 中，有权限访问浏览器 API。

### 通信机制

插件逻辑和用户界面之间通过消息传递进行通信：

- **从 UI 到插件逻辑**：使用 `parent.postMessage()`
- **从插件逻辑到 UI**：使用 `figma.ui.postMessage()`
- **接收消息**：
  - 在插件逻辑中：使用 `figma.ui.onmessage`
  - 在 UI 中：使用 `window.onmessage`

**示例**：

```javascript
// 在 UI 中发送消息
parent.postMessage({ pluginMessage: { type: 'submit', value: 'Hello' } }, '*');

// 在插件逻辑中接收消息
figma.ui.onmessage = (msg) => {
  if (msg.type === 'submit') {
    console.log('Received:', msg.value);
    figma.closePlugin();
  }
};

// 在插件逻辑中发送消息
figma.ui.postMessage({ type: 'update', data: { count: 5 } });

// 在 UI 中接收消息
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg.type === 'update') {
    console.log('Count:', msg.data.count);
  }
};
```

## 开发流程

### 1. 编写插件逻辑

插件的主要逻辑在 `code.js` 文件中实现。以下是一个简单的示例：

```javascript
// code.js

// 插件入口点
figma.showUI(__html__);

// 接收来自 UI 的消息
figma.ui.onmessage = (msg) => {
  if (msg.type === 'create-rectangle') {
    // 创建矩形
    const rect = figma.createRectangle();
    rect.x = msg.x;
    rect.y = msg.y;
    rect.width = msg.width;
    rect.height = msg.height;
    rect.fills = [{ type: 'SOLID', color: msg.color }];
    
    // 将矩形添加到当前页面
    figma.currentPage.appendChild(rect);
    
    // 选择新创建的矩形
    figma.currentPage.selection = [rect];
    figma.viewport.scrollAndZoomIntoView([rect]);
    
    // 关闭插件
    figma.closePlugin('Rectangle created!');
  }
};
```

### 2. 设计用户界面

如果插件需要用户界面，可以在 `ui.html` 文件中创建：

```html
<!-- ui.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Plugin</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      padding: 20px;
      width: 300px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    input, button {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
    }
    button {
      background-color: #18A0FB;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px;
      font-weight: 500;
      cursor: pointer;
    }
    button:hover {
      background-color: #007AFF;
    }
  </style>
</head>
<body>
  <h1>Create Rectangle</h1>
  
  <div class="form-group">
    <label for="x">X Position:</label>
    <input type="number" id="x" value="100">
  </div>
  
  <div class="form-group">
    <label for="y">Y Position:</label>
    <input type="number" id="y" value="100">
  </div>
  
  <div class="form-group">
    <label for="width">Width:</label>
    <input type="number" id="width" value="200">
  </div>
  
  <div class="form-group">
    <label for="height">Height:</label>
    <input type="number" id="height" value="150">
  </div>
  
  <div class="form-group">
    <label for="color">Color:</label>
    <input type="color" id="color" value="#FF0000">
  </div>
  
  <button id="create">Create</button>
  
  <script>
    document.getElementById('create').onclick = () => {
      const x = parseFloat(document.getElementById('x').value);
      const y = parseFloat(document.getElementById('y').value);
      const width = parseFloat(document.getElementById('width').value);
      const height = parseFloat(document.getElementById('height').value);
      const colorHex = document.getElementById('color').value;
      
      // 转换颜色格式
      const color = {
        r: parseInt(colorHex.slice(1, 3), 16) / 255,
        g: parseInt(colorHex.slice(3, 5), 16) / 255,
        b: parseInt(colorHex.slice(5, 7), 16) / 255,
        a: 1
      };
      
      // 发送消息到插件逻辑
      parent.postMessage({
        pluginMessage: {
          type: 'create-rectangle',
          x, y, width, height, color
        }
      }, '*');
    };
  </script>
</body>
</html>
```

### 3. 测试插件

#### 在 Figma 中运行插件

1. **打开 Figma 桌面应用**
2. **打开一个设计文件**
3. **运行插件**：
   - 点击菜单栏中的 `Plugins` → `Development` → `My Plugin`
   - 或者使用快捷键 `Ctrl+Shift+P` (Windows) 或 `Cmd+Shift+P` (Mac) 打开命令面板，然后搜索插件名称

#### 调试插件

1. **使用 console.log**：在插件代码中使用 `console.log()` 输出调试信息
2. **查看控制台**：
   - 在 Figma 中，点击 `Plugins` → `Development` → `Open Console`
   - 或者使用快捷键 `Ctrl+Shift+I` (Windows) 或 `Cmd+Option+I` (Mac)
3. **使用断点**：在 VS Code 中设置断点，然后使用 Figma 的调试功能

### 4. 构建和打包

对于复杂的插件项目，建议使用构建工具来管理依赖和优化代码：

#### 使用 Webpack

1. **安装依赖**：
   ```bash
   npm install --save-dev webpack webpack-cli ts-loader
   ```

2. **创建 webpack.config.js**：
   ```javascript
   const path = require('path');
   
   module.exports = {
     entry: {
       code: './src/code.ts',
       ui: './src/ui.ts'
     },
     output: {
       path: path.resolve(__dirname, './dist'),
       filename: '[name].js'
     },
     module: {
       rules: [
         {
           test: /\.tsx?$/,
           use: 'ts-loader',
           exclude: /node_modules/
         }
       ]
     },
     resolve: {
       extensions: ['.tsx', '.ts', '.js']
     }
   };
   ```

3. **修改 package.json**：
   ```json
   {
     "scripts": {
       "build": "webpack",
       "watch": "webpack --watch"
     }
   }
   ```

4. **构建插件**：
   ```bash
   npm run build
   ```

## 最佳实践

### 性能优化

1. **使用异步 API**：尽量使用异步 API 方法，如 `getNodeByIdAsync()` 而不是 `getNodeById()`
2. **避免频繁操作**：将多个操作合并为一个事务，减少 Figma 的重绘次数
3. **使用 commitUndo()**：合理使用 `figma.commitUndo()` 来分组操作，提高撤销/重做的性能
4. **优化大型操作**：对于大型操作，考虑使用分页或分批处理
5. **避免不必要的计算**：缓存计算结果，避免重复计算

### 用户体验

1. **提供清晰的反馈**：使用 `figma.notify()` 来显示操作结果
2. **处理错误**：捕获并处理错误，向用户显示友好的错误消息
3. **优化 UI 响应速度**：保持 UI 简洁，避免复杂的 DOM 操作
4. **提供默认值**：为用户输入提供合理的默认值
5. **支持快捷键**：在插件 manifest 中配置快捷键

### 代码质量

1. **使用 TypeScript**：TypeScript 可以帮助捕获类型错误，提高代码质量
2. **遵循编码规范**：使用 ESLint 等工具来保持代码风格一致
3. **编写注释**：为复杂的代码添加注释，提高可维护性
4. **模块化**：将代码分解为多个模块，提高可维护性
5. **测试**：编写测试用例，确保插件功能正常

### 安全

1. **验证用户输入**：始终验证用户输入，避免注入攻击
2. **限制权限**：只请求插件实际需要的权限
3. **保护敏感数据**：不要在插件中存储敏感数据
4. **使用 HTTPS**：如果插件需要与外部服务通信，使用 HTTPS
5. **遵循 Figma 的安全指南**：参考 Figma 的官方安全指南

## 常见问题

### 1. 插件无法访问某些 API 方法

**原因**：某些 API 方法需要特定的权限或仅在特定环境中可用。

**解决方案**：
- 在 `manifest.json` 中添加必要的权限
- 检查 API 文档，确认方法的可用性
- 使用 `try-catch` 块来处理可能的错误

### 2. 字体加载失败

**原因**：在修改文本节点之前，需要先加载相应的字体。

**解决方案**：
```javascript
// 加载字体
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

// 现在可以修改文本节点
textNode.fontName = { family: "Inter", style: "Regular" };
textNode.characters = "Hello World";
```

### 3. 插件 UI 不显示

**原因**：
- `figma.showUI()` 没有被调用
- UI 文件路径不正确
- UI HTML 中有错误

**解决方案**：
- 确保调用了 `figma.showUI(__html__)` 或 `figma.showUI(htmlString)`
- 检查 `manifest.json` 中的 `ui` 路径是否正确
- 检查 UI HTML 代码是否有语法错误

### 4. 消息传递失败

**原因**：
- 消息格式不正确
- 消息处理函数没有正确设置
- 插件逻辑和 UI 之间的通信被阻止

**解决方案**：
- 确保消息格式符合 `{ pluginMessage: {...} }` 的格式
- 确保设置了 `figma.ui.onmessage` 来接收来自 UI 的消息
- 确保在 UI 中使用 `parent.postMessage()` 发送消息

### 5. 插件在发布后不工作

**原因**：
- 依赖项没有正确打包
- 代码中使用了未授权的 API
- 插件权限不足

**解决方案**：
- 确保所有依赖项都被正确打包到最终的 `code.js` 文件中
- 检查插件是否使用了需要特定权限的 API
- 在 `manifest.json` 中添加必要的权限

## 发布插件

### 准备发布

1. **完善插件信息**：
   - 更新 `manifest.json` 中的插件名称、描述和版本
   - 创建一个吸引人的插件图标（128x128 像素）
   - 编写详细的 README.md 文件

2. **测试插件**：
   - 在不同的 Figma 文件中测试插件
   - 测试不同的使用场景
   - 确保插件在不同的操作系统中都能正常工作

3. **检查权限**：
   - 确保插件只请求必要的权限
   - 确保插件符合 Figma 的插件政策

### 提交审核

1. **登录 Figma 开发者账户**：
   - 访问 [Figma 开发者控制台](https://www.figma.com/developers)
   - 使用您的 Figma 账户登录

2. **创建新插件**：
   - 点击 `Create New Plugin`
   - 上传插件代码（ZIP 文件）
   - 上传插件图标
   - 填写插件详情：
     - 名称
     - 描述
     - 标签
     - 支持联系方式
     - 隐私政策链接（可选）

3. **提交审核**：
   - 点击 `Submit for Review`
   - 等待 Figma 团队审核（通常需要 1-3 个工作日）

### 发布后维护

1. **监控插件性能**：使用分析工具监控插件的使用情况和性能
2. **收集用户反馈**：通过支持渠道收集用户反馈
3. **更新插件**：
   - 修复 bug
   - 添加新功能
   - 优化性能
   - 保持与 Figma API 的兼容性

4. **更新插件**：
   - 在 Figma 开发者控制台中上传新版本
   - 填写版本变更日志
   - 点击 `Publish Update`

## 资源和学习材料

### 官方资源

- [Figma 插件 API 文档](https://www.figma.com/plugin-docs/)
- [Figma 开发者社区](https://spectrum.chat/figma/plugin-api)
- [Figma 插件示例](https://github.com/figma/plugin-samples)
- [Figma 插件提交指南](https://www.figma.com/plugin-docs/submitting-a-plugin/)

### 第三方资源

- [Figma 插件开发教程](https://figma-extensions.fun/)
- [Figma 插件开发视频教程](https://www.youtube.com/playlist?list=PLXDU_eVOJTx7QHLShNqIXL1Cgbxj7HlN4)
- [Figma 插件开发社区](https://discord.com/invite/figma-plugin-dev)
- [Figma 插件市场](https://www.figma.com/community/plugins)

### 工具和库

- [Figma Plugin Typings](https://github.com/figma/plugin-typings)：TypeScript 类型定义
- [Figma UI](https://github.com/thomas-lowry/figma-plugin-ds)：Figma 风格的 UI 组件库
- [Figma Plugin Helper](https://github.com/yuanqing/figma-plugins)：插件开发辅助工具
- [Figma Plugin React Template](https://github.com/nirsky/figma-plugin-react-template)：React 插件模板

## 总结

Figma 插件开发是一个强大的工具，可以帮助设计师和开发者创建更高效的工作流程。通过本指南，您应该已经了解了 Figma 插件开发的基本概念、工作原理和最佳实践。

要成为一名优秀的 Figma 插件开发者，需要不断学习和实践：

1. **学习 API**：熟悉 Figma Plugin API 的各种方法和属性
2. **分析优秀插件**：研究其他优秀插件的实现方式
3. **参与社区**：加入 Figma 插件开发社区，与其他开发者交流
4. **实践项目**：通过实际项目来提高开发技能
5. **保持更新**：关注 Figma API 的更新和变化

希望本指南能够帮助您开始 Figma 插件开发之旅！