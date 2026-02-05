# Figma 插件示例代码

## 基本插件示例

### Hello World 插件

最简单的 Figma 插件，显示一个 "Hello World" 消息。

**manifest.json**：
```json
{
  "name": "Hello World",
  "id": "1234567890",
  "api": "1.0.0",
  "main": "code.js",
  "menu": [
    {
      "name": "Run",
      "command": "run"
    }
  ]
}
```

**code.js**：
```javascript
// 显示通知
figma.notify('Hello World!');

// 关闭插件
figma.closePlugin();
```

### 选择信息插件

显示当前选择的节点信息。

**code.js**：
```javascript
// 获取当前选择
const selection = figma.currentPage.selection;

if (selection.length === 0) {
  figma.notify('请选择一个或多个节点');
} else {
  figma.notify(`已选择 ${selection.length} 个节点`);
  
  // 输出选择的节点信息
  selection.forEach((node, index) => {
    console.log(`节点 ${index + 1}:`, {
      name: node.name,
      type: node.type,
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height
    });
  });
}

// 关闭插件
figma.closePlugin();
```

## UI 插件示例

### 基本 UI 插件

带有简单用户界面的插件。

**manifest.json**：
```json
{
  "name": "Basic UI Plugin",
  "id": "1234567890",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "menu": [
    {
      "name": "Run",
      "command": "run"
    }
  ]
}
```

**code.js**：
```javascript
// 显示 UI
figma.showUI(__html__, {
  width: 300,
  height: 200
});

// 接收来自 UI 的消息
figma.ui.onmessage = (msg) => {
  if (msg.type === 'submit') {
    figma.notify(`你输入了: ${msg.value}`);
    figma.closePlugin();
  }
};
```

**ui.html**：
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Basic UI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      padding: 20px;
    }
    input, button {
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
      margin-bottom: 10px;
    }
    button {
      background-color: #18A0FB;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #007AFF;
    }
  </style>
</head>
<body>
  <h1>Basic UI Plugin</h1>
  <input type="text" id="input" placeholder="输入一些文本">
  <button id="submit">提交</button>
  
  <script>
    document.getElementById('submit').onclick = () => {
      const value = document.getElementById('input').value;
      parent.postMessage({ pluginMessage: { type: 'submit', value } }, '*');
    };
  </script>
</body>
</html>
```

### 高级 UI 插件

带有更复杂用户界面的插件，用于创建和配置矩形。

**code.js**：
```javascript
// 显示 UI
figma.showUI(__html__, {
  width: 400,
  height: 300
});

// 接收来自 UI 的消息
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-rectangle') {
    try {
      // 创建矩形
      const rect = figma.createRectangle();
      rect.x = msg.x;
      rect.y = msg.y;
      rect.width = msg.width;
      rect.height = msg.height;
      
      // 设置填充
      rect.fills = [{
        type: 'SOLID',
        color: msg.color
      }];
      
      // 设置描边
      if (msg.strokeWidth > 0) {
        rect.strokes = [{
          type: 'SOLID',
          color: msg.strokeColor
        }];
        rect.strokeWeight = msg.strokeWidth;
        rect.strokeAlign = msg.strokeAlign;
      }
      
      // 设置圆角
      if (msg.cornerRadius > 0) {
        rect.cornerRadius = msg.cornerRadius;
      }
      
      // 将矩形添加到当前页面
      figma.currentPage.appendChild(rect);
      
      // 选择新创建的矩形
      figma.currentPage.selection = [rect];
      figma.viewport.scrollAndZoomIntoView([rect]);
      
      // 显示成功消息
      figma.notify('矩形创建成功！');
    } catch (error) {
      figma.notify('创建矩形时出错: ' + error.message, { error: true });
      console.error(error);
    } finally {
      figma.closePlugin();
    }
  }
};
```

**ui.html**：
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>高级 UI 插件</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      padding: 20px;
      width: 360px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      font-size: 14px;
    }
    input[type="number"], select {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    input[type="color"] {
      width: 100%;
      height: 40px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button {
      background-color: #18A0FB;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
    }
    button:hover {
      background-color: #007AFF;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
  </style>
</head>
<body>
  <h1>创建矩形</h1>
  
  <div class="grid">
    <div class="form-group">
      <label for="x">X 位置:</label>
      <input type="number" id="x" value="100">
    </div>
    
    <div class="form-group">
      <label for="y">Y 位置:</label>
      <input type="number" id="y" value="100">
    </div>
    
    <div class="form-group">
      <label for="width">宽度:</label>
      <input type="number" id="width" value="200">
    </div>
    
    <div class="form-group">
      <label for="height">高度:</label>
      <input type="number" id="height" value="150">
    </div>
  </div>
  
  <div class="form-group">
    <label for="cornerRadius">圆角半径:</label>
    <input type="number" id="cornerRadius" value="0" min="0">
  </div>
  
  <div class="form-group">
    <label for="color">填充颜色:</label>
    <input type="color" id="color" value="#FF0000">
  </div>
  
  <div class="form-group">
    <label for="strokeWidth">描边宽度:</label>
    <input type="number" id="strokeWidth" value="0" min="0">
  </div>
  
  <div class="form-group">
    <label for="strokeColor">描边颜色:</label>
    <input type="color" id="strokeColor" value="#000000">
  </div>
  
  <div class="form-group">
    <label for="strokeAlign">描边对齐:</label>
    <select id="strokeAlign">
      <option value="CENTER">居中</option>
      <option value="INSIDE">内部</option>
      <option value="OUTSIDE">外部</option>
    </select>
  </div>
  
  <button id="create">创建矩形</button>
  
  <script>
    document.getElementById('create').onclick = () => {
      const x = parseFloat(document.getElementById('x').value);
      const y = parseFloat(document.getElementById('y').value);
      const width = parseFloat(document.getElementById('width').value);
      const height = parseFloat(document.getElementById('height').value);
      const cornerRadius = parseFloat(document.getElementById('cornerRadius').value);
      
      // 转换填充颜色
      const colorHex = document.getElementById('color').value;
      const color = {
        r: parseInt(colorHex.slice(1, 3), 16) / 255,
        g: parseInt(colorHex.slice(3, 5), 16) / 255,
        b: parseInt(colorHex.slice(5, 7), 16) / 255,
        a: 1
      };
      
      // 转换描边颜色
      const strokeColorHex = document.getElementById('strokeColor').value;
      const strokeColor = {
        r: parseInt(strokeColorHex.slice(1, 3), 16) / 255,
        g: parseInt(strokeColorHex.slice(3, 5), 16) / 255,
        b: parseInt(strokeColorHex.slice(5, 7), 16) / 255,
        a: 1
      };
      
      const strokeWidth = parseFloat(document.getElementById('strokeWidth').value);
      const strokeAlign = document.getElementById('strokeAlign').value;
      
      // 发送消息到插件逻辑
      parent.postMessage({
        pluginMessage: {
          type: 'create-rectangle',
          x, y, width, height, cornerRadius,
          color, strokeColor, strokeWidth, strokeAlign
        }
      }, '*');
    };
  </script>
</body>
</html>
```

## 节点操作示例

### 批量修改节点

批量修改选中节点的属性。

**code.js**：
```javascript
// 获取当前选择
const selection = figma.currentPage.selection;

if (selection.length === 0) {
  figma.notify('请选择一个或多个节点');
} else {
  // 批量修改节点属性
  selection.forEach(node => {
    // 仅修改场景节点
    if ('fills' in node) {
      // 设置填充
      node.fills = [{
        type: 'SOLID',
        color: {
          r: 0.2,
          g: 0.4,
          b: 0.8,
          a: 1
        }
      }];
      
      // 设置描边
      node.strokes = [{
        type: 'SOLID',
        color: {
          r: 0,
          g: 0,
          b: 0,
          a: 1
        }
      }];
      node.strokeWeight = 2;
      
      // 设置效果
      node.effects = [{
        type: 'DROP_SHADOW',
        color: {
          r: 0,
          g: 0,
          b: 0,
          a: 0.25
        },
        offset: { x: 0, y: 4 },
        radius: 4,
        visible: true,
        blendMode: 'NORMAL'
      }];
    }
  });
  
  figma.notify(`已修改 ${selection.length} 个节点`);
}

// 关闭插件
figma.closePlugin();
```

### 复制和排列节点

复制选中的节点并按网格排列。

**code.js**：
```javascript
// 获取当前选择
const selection = figma.currentPage.selection;

if (selection.length === 0) {
  figma.notify('请选择一个节点');
} else if (selection.length > 1) {
  figma.notify('请只选择一个节点');
} else {
  const originalNode = selection[0];
  const copies = 5;
  const spacing = 20;
  
  // 复制节点并排列
  for (let i = 1; i <= copies; i++) {
    const copy = originalNode.clone();
    copy.x = originalNode.x + (originalNode.width + spacing) * i;
    copy.y = originalNode.y;
    figma.currentPage.appendChild(copy);
  }
  
  figma.notify(`已创建 ${copies} 个副本`);
}

// 关闭插件
figma.closePlugin();
```

## 样式操作示例

### 创建和应用样式

创建新的颜色样式并应用到选中的节点。

**code.js**：
```javascript
// 创建新的颜色样式
const paintStyle = figma.createPaintStyle();
paintStyle.name = "插件创建的样式";
paintStyle.paints = [{
  type: 'SOLID',
  color: {
    r: 0.2,
    g: 0.6,
    b: 0.8,
    a: 1
  }
}];

// 获取当前选择
const selection = figma.currentPage.selection;

if (selection.length > 0) {
  // 应用样式到选中的节点
  selection.forEach(node => {
    if ('fillStyleId' in node) {
      node.fillStyleId = paintStyle.id;
    }
  });
  figma.notify(`已应用样式到 ${selection.length} 个节点`);
} else {
  figma.notify('样式已创建，但没有选择节点来应用');
}

// 关闭插件
figma.closePlugin();
```

### 导出样式

导出文档中的所有样式为 JSON 格式。

**code.js**：
```javascript
// 获取所有样式
const paintStyles = figma.getLocalPaintStyles();
const textStyles = figma.getLocalTextStyles();
const effectStyles = figma.getLocalEffectStyles();
const gridStyles = figma.getLocalGridStyles();

// 准备导出数据
const exportData = {
  paintStyles: paintStyles.map(style => ({
    id: style.id,
    name: style.name,
    paints: style.paints
  })),
  textStyles: textStyles.map(style => ({
    id: style.id,
    name: style.name,
    fontName: style.fontName,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    paragraphIndent: style.paragraphIndent,
    paragraphSpacing: style.paragraphSpacing,
    textCase: style.textCase,
    textDecoration: style.textDecoration
  })),
  effectStyles: effectStyles.map(style => ({
    id: style.id,
    name: style.name,
    effects: style.effects
  })),
  gridStyles: gridStyles.map(style => ({
    id: style.id,
    name: style.name,
    layoutGrids: style.layoutGrids
  }))
};

// 导出为 JSON
const jsonString = JSON.stringify(exportData, null, 2);
console.log('导出的样式:', jsonString);

figma.notify(`已导出 ${paintStyles.length} 个颜色样式, ${textStyles.length} 个文本样式, ${effectStyles.length} 个效果样式, ${gridStyles.length} 个网格样式`);

// 关闭插件
figma.closePlugin();
```

## 文本操作示例

### 文本替换

替换文档中所有文本节点的内容。

**code.js**：
```javascript
// 查找所有文本节点
const textNodes = figma.root.findAll(node => node.type === 'TEXT');

if (textNodes.length === 0) {
  figma.notify('文档中没有文本节点');
} else {
  // 替换文本内容
  let replacedCount = 0;
  
  for (const textNode of textNodes) {
    try {
      // 加载字体
      await figma.loadFontAsync(textNode.fontName);
      
      // 替换文本
      textNode.characters = `替换后的文本: ${textNode.characters}`;
      replacedCount++;
    } catch (error) {
      console.error('替换文本时出错:', error);
    }
  }
  
  figma.notify(`已替换 ${replacedCount} 个文本节点`);
}

// 关闭插件
figma.closePlugin();
```

### 文本统计

统计文档中的文本信息。

**code.js**：
```javascript
// 查找所有文本节点
const textNodes = figma.root.findAll(node => node.type === 'TEXT');

if (textNodes.length === 0) {
  figma.notify('文档中没有文本节点');
} else {
  let totalCharacters = 0;
  let totalWords = 0;
  
  for (const textNode of textNodes) {
    totalCharacters += textNode.characters.length;
    totalWords += textNode.characters.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  figma.notify(`文档包含 ${textNodes.length} 个文本节点, ${totalWords} 个单词, ${totalCharacters} 个字符`);
  console.log('文本统计:', {
    textNodes: textNodes.length,
    words: totalWords,
    characters: totalCharacters
  });
}

// 关闭插件
figma.closePlugin();
```

## 图像处理示例

### 导入图像

从 URL 导入图像并应用到选中的节点。

**code.js**：
```javascript
// 获取当前选择
const selection = figma.currentPage.selection;

if (selection.length === 0) {
  figma.notify('请选择一个或多个节点');
} else {
  try {
    // 从 URL 创建图像
    const image = await figma.createImageAsync('https://picsum.photos/200/300');
    
    // 应用图像到选中的节点
    selection.forEach(node => {
      if ('fills' in node) {
        node.fills = [{
          type: 'IMAGE',
          scaleMode: 'FILL',
          imageHash: image.hash
        }];
      }
    });
    
    figma.notify(`已为 ${selection.length} 个节点应用图像`);
  } catch (error) {
    figma.notify('导入图像时出错: ' + error.message, { error: true });
    console.error(error);
  }
}

// 关闭插件
figma.closePlugin();
```

## 团队库操作示例

### 导入组件

从团队库导入组件。

**code.js**：
```javascript
try {
  // 从团队库导入组件
  // 注意: 这里需要使用实际的组件键
  const component = await figma.importComponentByKeyAsync('COMPONENT_KEY');
  
  // 将组件添加到当前页面
  component.x = 100;
  component.y = 100;
  figma.currentPage.appendChild(component);
  
  // 选择导入的组件
  figma.currentPage.selection = [component];
  figma.viewport.scrollAndZoomIntoView([component]);
  
  figma.notify('组件导入成功');
} catch (error) {
  figma.notify('导入组件时出错: ' + error.message, { error: true });
  console.error(error);
}

// 关闭插件
figma.closePlugin();
```

### 导入样式

从团队库导入样式。

**code.js**：
```javascript
try {
  // 从团队库导入样式
  // 注意: 这里需要使用实际的样式键
  const style = await figma.importStyleByKeyAsync('STYLE_KEY');
  
  figma.notify(`已导入样式: ${style.name}`);
  console.log('导入的样式:', style);
} catch (error) {
  figma.notify('导入样式时出错: ' + error.message, { error: true });
  console.error(error);
}

// 关闭插件
figma.closePlugin();
```

## 开发模式示例

### 代码生成插件

为选中的节点生成 HTML/CSS 代码。

**code.js**：
```javascript
// 获取当前选择
const selection = figma.currentPage.selection;

if (selection.length === 0) {
  figma.notify('请选择一个或多个节点');
} else {
  // 生成代码
  let html = '';
  let css = '';
  
  selection.forEach((node, index) => {
    if (node.type === 'RECTANGLE') {
      const id = `rect-${index}`;
      html += `<div id="${id}"></div>\n`;
      css += `#${id} {\n`;
      css += `  position: absolute;\n`;
      css += `  left: ${node.x}px;\n`;
      css += `  top: ${node.y}px;\n`;
      css += `  width: ${node.width}px;\n`;
      css += `  height: ${node.height}px;\n`;
      
      // 添加填充样式
      if (node.fills && node.fills.length > 0 && node.fills[0].type === 'SOLID') {
        const fill = node.fills[0];
        css += `  background-color: rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a});\n`;
      }
      
      // 添加描边样式
      if (node.strokes && node.strokes.length > 0 && node.strokes[0].type === 'SOLID') {
        const stroke = node.strokes[0];
        css += `  border: ${node.strokeWeight}px solid rgba(${Math.round(stroke.color.r * 255)}, ${Math.round(stroke.color.g * 255)}, ${Math.round(stroke.color.b * 255)}, ${stroke.color.a});\n`;
      }
      
      // 添加圆角
      if (node.cornerRadius > 0) {
        css += `  border-radius: ${node.cornerRadius}px;\n`;
      }
      
      css += `}\n\n`;
    }
  });
  
  // 显示生成的代码
  figma.showUI(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>代码生成</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          padding: 20px;
          width: 600px;
          height: 400px;
        }
        .code-section {
          margin-bottom: 20px;
        }
        h2 {
          font-size: 16px;
          margin-bottom: 10px;
        }
        pre {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          height: 150px;
          overflow-y: auto;
        }
        button {
          background-color: #18A0FB;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
        }
        button:hover {
          background-color: #007AFF;
        }
      </style>
    </head>
    <body>
      <div class="code-section">
        <h2>HTML</h2>
        <pre id="html-code">${html || 'No HTML generated'}</pre>
      </div>
      <div class="code-section">
        <h2>CSS</h2>
        <pre id="css-code">${css || 'No CSS generated'}</pre>
      </div>
      <button id="copy">复制代码</button>
      <button id="close">关闭</button>
      <script>
        document.getElementById('copy').onclick = () => {
          const htmlCode = document.getElementById('html-code').textContent;
          const cssCode = document.getElementById('css-code').textContent;
          const allCode = `HTML:\n${htmlCode}\n\nCSS:\n${cssCode}`;
          navigator.clipboard.writeText(allCode).then(() => {
            alert('代码已复制到剪贴板');
          });
        };
        document.getElementById('close').onclick = () => {
          parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
        };
      </script>
    </body>
    </html>
  `, {
    width: 640,
    height: 480
  });
}

// 接收来自 UI 的消息
figma.ui.onmessage = (msg) => {
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
```

## 其他示例

### 插件数据存储

使用 clientStorage 存储和读取插件数据。

**code.js**：
```javascript
// 存储数据
figma.clientStorage.setAsync('pluginSettings', {
  lastUsed: new Date().toISOString(),
  favoriteColor: {
    r: 0.2,
    g: 0.4,
    b: 0.8,
    a: 1
  },
  preferences: {
    showPreview: true,
    autoSave: false,
    defaultWidth: 200,
    defaultHeight: 150
  }
});

// 读取数据
const settings = await figma.clientStorage.getAsync('pluginSettings');
console.log('存储的设置:', settings);

if (settings) {
  figma.notify('已加载存储的设置');
} else {
  figma.notify('没有找到存储的设置');
}

// 关闭插件
figma.closePlugin();
```

### 批量重命名节点

批量重命名选中的节点。

**code.js**：
```javascript
// 获取当前选择
const selection = figma.currentPage.selection;

if (selection.length === 0) {
  figma.notify('请选择一个或多个节点');
} else {
  // 批量重命名节点
  selection.forEach((node, index) => {
    const originalName = node.name;
    node.name = `重命名的节点 ${index + 1}`;
    console.log(`已将 "${originalName}" 重命名为 "${node.name}"`);
  });
  
  figma.notify(`已重命名 ${selection.length} 个节点`);
}

// 关闭插件
figma.closePlugin();
```

## 总结

本文档提供了各种 Figma 插件开发的示例代码，涵盖了从基本功能到高级功能的各种场景。这些示例代码可以作为您开发自己的 Figma 插件的起点和参考。

要使用这些示例：

1. **选择合适的示例**：根据您的需求选择最相关的示例代码
2. **复制代码**：将示例代码复制到您的插件项目中
3. **修改代码**：根据您的具体需求修改代码
4. **测试插件**：在 Figma 中测试您的插件
5. **优化和扩展**：根据需要优化和扩展插件功能

记住，Figma 插件开发是一个不断学习和实践的过程。通过研究这些示例代码并结合 Figma 的官方文档，您可以创建功能强大、用户友好的 Figma 插件。