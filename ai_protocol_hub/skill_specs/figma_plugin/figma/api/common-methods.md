# API参考文档 - 常用API方法

## 文档操作方法

### 获取文档信息

#### figma.root: DocumentNode [只读]

获取整个 Figma 文档的根节点。通过此节点可以访问文档的所有页面和内容。

**示例**：
```javascript
// 获取文档根节点
const root = figma.root;

// 获取所有页面
const pages = root.children;
```

#### figma.currentPage: PageNode

获取或设置用户当前查看的页面。

**示例**：
```javascript
// 获取当前页面
const currentPage = figma.currentPage;

// 切换到第一个页面
figma.currentPage = figma.root.children[0];
```

#### figma.setCurrentPageAsync(page: PageNode): Promise<void>

异步切换到指定的页面。当插件清单包含 "documentAccess": "dynamic-page" 时，必须使用此方法而不是直接设置 figma.currentPage。

**参数**：
- `page` - 要切换到的页面节点

**示例**：
```javascript
// 异步切换到指定页面
await figma.setCurrentPageAsync(somePage);
```

#### figma.loadAllPagesAsync(): Promise<void>

将文档的所有页面加载到内存中。这启用了以下功能：
- figma.on 的 documentchange 事件
- findAll
- findOne
- findAllWithCriteria
- findWidgetNodesByWidgetId

**示例**：
```javascript
// 加载所有页面
await figma.loadAllPagesAsync();

// 现在可以使用 findAll 查找所有节点
const allTextNodes = figma.root.findAll(node => node.type === 'TEXT');
```

### 版本控制

#### figma.saveVersionHistoryAsync(title: string, description?: string): Promise<VersionHistoryResult>

保存文件的新版本并将其添加到文件的版本历史记录中。

**参数**：
- `title` - 版本标题
- `description` - 版本描述（可选）

**返回值**：
- 包含新版本 ID 的对象

**示例**：
```javascript
// 保存新版本
const result = await figma.saveVersionHistoryAsync(
  "插件更新",
  "由插件自动创建的版本"
);
console.log("新版本 ID:", result.versionId);
```

## 节点操作方法

### 创建节点

#### figma.createRectangle(): RectangleNode

创建一个新的矩形节点。

**返回值**：
- 新创建的矩形节点

**示例**：
```javascript
// 创建矩形
const rect = figma.createRectangle();
rect.x = 100;
rect.y = 100;
rect.width = 200;
rect.height = 150;
rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }];

// 将矩形添加到当前页面
figma.currentPage.appendChild(rect);
```

#### figma.createText(): TextNode

创建一个新的文本节点。

**返回值**：
- 新创建的文本节点

**示例**：
```javascript
// 创建文本节点
const text = figma.createText();
text.x = 100;
text.y = 100;
text.characters = "Hello, Figma!";

// 加载字体
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
text.fontName = { family: "Inter", style: "Regular" };
text.fontSize = 24;

// 将文本添加到当前页面
figma.currentPage.appendChild(text);
```

#### figma.createFrame(): FrameNode

创建一个新的框架节点。

**返回值**：
- 新创建的框架节点

**示例**：
```javascript
// 创建框架
const frame = figma.createFrame();
frame.x = 100;
frame.y = 100;
frame.width = 300;
frame.height = 200;
frame.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9, a: 1 } }];

// 将框架添加到当前页面
figma.currentPage.appendChild(frame);
```

#### figma.createComponent(): ComponentNode

创建一个新的组件节点。

**返回值**：
- 新创建的组件节点

**示例**：
```javascript
// 创建组件
const component = figma.createComponent();
component.x = 100;
component.y = 100;
component.width = 200;
component.height = 100;

// 将组件添加到当前页面
figma.currentPage.appendChild(component);
```

#### figma.createComponentFromNode(node: SceneNode): ComponentNode

从现有节点创建组件，保留其所有属性和子节点。

**参数**：
- `node` - 要从中创建组件的节点

**返回值**：
- 新创建的组件节点

**示例**：
```javascript
// 从现有节点创建组件
const component = figma.createComponentFromNode(existingNode);
```

### 查找节点

#### figma.getNodeByIdAsync(id: string): Promise<BaseNode | null>

通过 ID 异步查找节点。

**参数**：
- `id` - 节点的 ID

**返回值**：
- 找到的节点，如果未找到则为 null

**示例**：
```javascript
// 通过 ID 查找节点
const node = await figma.getNodeByIdAsync("1234:5678");
if (node) {
  console.log("找到节点:", node.name);
}
```

#### node.findAll(callback?: (node: BaseNode) => boolean): BaseNode[]

查找当前节点及其所有后代节点中符合条件的节点。

**参数**：
- `callback` - 用于筛选节点的回调函数（可选）。如果不提供，则返回所有节点。

**返回值**：
- 符合条件的节点数组

**示例**：
```javascript
// 查找所有文本节点
const textNodes = figma.currentPage.findAll(node => node.type === 'TEXT');

// 查找所有矩形节点
const rectNodes = figma.currentPage.findAll(node => node.type === 'RECTANGLE');
```

#### node.findOne(callback: (node: BaseNode) => boolean): BaseNode | null

查找当前节点及其所有后代节点中第一个符合条件的节点。

**参数**：
- `callback` - 用于筛选节点的回调函数

**返回值**：
- 找到的第一个节点，如果未找到则为 null

**示例**：
```javascript
// 查找第一个文本节点
const firstTextNode = figma.currentPage.findOne(node => node.type === 'TEXT');
if (firstTextNode) {
  console.log("第一个文本节点:", firstTextNode.characters);
}
```

### 节点操作

#### node.appendChild(child: BaseNode): void

将子节点添加到当前节点的子节点列表末尾。

**参数**：
- `child` - 要添加的子节点

**示例**：
```javascript
// 创建矩形并添加到当前页面
const rect = figma.createRectangle();
figma.currentPage.appendChild(rect);
```

#### node.insertChild(index: number, child: BaseNode): void

在指定位置插入子节点。

**参数**：
- `index` - 插入位置的索引
- `child` - 要插入的子节点

**示例**：
```javascript
// 在第一个位置插入节点
figma.currentPage.insertChild(0, newNode);
```

#### node.removeChild(child: BaseNode): void

从当前节点中移除子节点。

**参数**：
- `child` - 要移除的子节点

**示例**：
```javascript
// 移除第一个子节点
const firstChild = figma.currentPage.children[0];
figma.currentPage.removeChild(firstChild);
```

#### node.clone(): BaseNode

创建当前节点的副本。

**返回值**：
- 节点的副本

**示例**：
```javascript
// 复制节点
const clonedNode = someNode.clone();
clonedNode.x += 100; // 移动副本
figma.currentPage.appendChild(clonedNode);
```

#### node.resize(width: number, height: number): void

调整节点的大小。

**参数**：
- `width` - 新的宽度
- `height` - 新的高度

**示例**：
```javascript
// 调整节点大小
rect.resize(300, 200);
```

#### node.resizeWithoutConstraints(width: number, height: number): void

调整节点的大小，忽略任何约束。

**参数**：
- `width` - 新的宽度
- `height` - 新的高度

**示例**：
```javascript
// 忽略约束调整节点大小
textNode.resizeWithoutConstraints(400, 100);
```

## 样式操作方法

### 样式管理

#### figma.createPaintStyle(): PaintStyle

创建一个新的 Paint 样式（颜色样式）。

**返回值**：
- 新创建的 Paint 样式

**示例**：
```javascript
// 创建新的颜色样式
const paintStyle = figma.createPaintStyle();
paintStyle.name = "Primary Color";
paintStyle.paints = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.8, a: 1 } }];
```

#### figma.createTextStyle(): TextStyle

创建一个新的文本样式。

**返回值**：
- 新创建的文本样式

**示例**：
```javascript
// 创建新的文本样式
const textStyle = figma.createTextStyle();
textStyle.name = "Heading";

// 设置文本样式属性
const textNode = figma.createText();
textNode.fontName = { family: "Inter", style: "Bold" };
textNode.fontSize = 24;

// 将文本节点的样式复制到样式对象
textStyle.fontName = textNode.fontName;
textStyle.fontSize = textNode.fontSize;
```

#### figma.createEffectStyle(): EffectStyle

创建一个新的效果样式。

**返回值**：
- 新创建的效果样式

**示例**：
```javascript
// 创建新的效果样式
const effectStyle = figma.createEffectStyle();
effectStyle.name = "Drop Shadow";
effectStyle.effects = [{
  type: 'DROP_SHADOW',
  color: { r: 0, g: 0, b: 0, a: 0.25 },
  offset: { x: 0, y: 4 },
  radius: 4,
  visible: true,
  blendMode: 'NORMAL'
}];
```

#### figma.createGridStyle(): GridStyle

创建一个新的网格样式。

**返回值**：
- 新创建的网格样式

**示例**：
```javascript
// 创建新的网格样式
const gridStyle = figma.createGridStyle();
gridStyle.name = "8px Grid";
gridStyle.layoutGrids = [{
  pattern: 'GRID',
  sectionSize: 8,
  color: { r: 0.8, g: 0.8, b: 0.8, a: 0.5 }
}];
```

### 获取样式

#### figma.getLocalPaintStylesAsync(): Promise<PaintStyle[]>

获取文档中的所有本地 Paint 样式。

**返回值**：
- Paint 样式数组

**示例**：
```javascript
// 获取所有本地颜色样式
const paintStyles = await figma.getLocalPaintStylesAsync();
paintStyles.forEach(style => {
  console.log("颜色样式:", style.name);
});
```

#### figma.getLocalTextStylesAsync(): Promise<TextStyle[]>

获取文档中的所有本地文本样式。

**返回值**：
- 文本样式数组

**示例**：
```javascript
// 获取所有本地文本样式
const textStyles = await figma.getLocalTextStylesAsync();
```

#### figma.getLocalEffectStylesAsync(): Promise<EffectStyle[]>

获取文档中的所有本地效果样式。

**返回值**：
- 效果样式数组

**示例**：
```javascript
// 获取所有本地效果样式
const effectStyles = await figma.getLocalEffectStylesAsync();
```

#### figma.getLocalGridStylesAsync(): Promise<GridStyle[]>

获取文档中的所有本地网格样式。

**返回值**：
- 网格样式数组

**示例**：
```javascript
// 获取所有本地网格样式
const gridStyles = await figma.getLocalGridStylesAsync();
```

## UI相关方法

### 显示UI

#### figma.showUI(html: string, options?: ShowUIOptions): void

显示插件的用户界面。

**参数**：
- `html` - UI 的 HTML 内容
- `options` - 配置选项（可选）
  - `width` - UI 宽度
  - `height` - UI 高度
  - `title` - UI 标题
  - `visible` - 是否可见
  - `position` - 位置
  - `resizable` - 是否可调整大小

**示例**：
```javascript
// 显示简单的 UI
figma.showUI(`
  <div>
    <h1>插件 UI</h1>
    <button id="submit">提交</button>
  </div>
  <script>
    document.getElementById('submit').onclick = () => {
      parent.postMessage({ pluginMessage: { type: 'submit' } }, '*');
    };
  </script>
`, { width: 300, height: 200 });
```

### UI通信

#### figma.ui.onmessage: (message: any, props: PluginWindowProps) => void

设置接收来自 UI 的消息的回调函数。

**示例**：
```javascript
// 接收来自 UI 的消息
figma.ui.onmessage = (msg) => {
  if (msg.type === 'submit') {
    console.log('收到提交消息');
    // 处理提交逻辑
    figma.closePlugin();
  }
};
```

#### figma.ui.postMessage(message: any): void

向 UI 发送消息。

**参数**：
- `message` - 要发送的消息

**示例**：
```javascript
// 向 UI 发送消息
figma.ui.postMessage({ type: 'data', value: 'Hello from plugin!' });
```

#### figma.ui.resize(width: number, height: number): void

调整 UI 的大小。

**参数**：
- `width` - 新的宽度
- `height` - 新的高度

**示例**：
```javascript
// 调整 UI 大小
figma.ui.resize(400, 300);
```

#### figma.ui.close(): void

关闭 UI。

**示例**：
```javascript
// 关闭 UI
figma.ui.close();
```

### 通知

#### figma.notify(message: string, options?: NotificationOptions): NotificationHandler

在屏幕底部显示通知。

**参数**：
- `message` - 通知消息
- `options` - 配置选项（可选）
  - `timeout` - 通知显示的时间（毫秒）
  - `error` - 是否显示为错误通知

**返回值**：
- 通知处理程序，可用于关闭通知

**示例**：
```javascript
// 显示成功通知
figma.notify('操作成功完成');

// 显示错误通知
figma.notify('操作失败', { error: true });

// 显示带超时的通知
const notification = figma.notify('处理中...', { timeout: 5000 });
// 稍后关闭通知
setTimeout(() => notification.close(), 2000);
```

## 字体和图像处理方法

### 字体管理

#### figma.listAvailableFontsAsync(): Promise<Font[]>

获取当前可用字体的列表。

**返回值**：
- 字体对象数组

**示例**：
```javascript
// 获取可用字体列表
const fonts = await figma.listAvailableFontsAsync();
fonts.forEach(font => {
  console.log("字体:", font.family, font.style);
});
```

#### figma.loadFontAsync(fontName: FontName): Promise<void>

使字体在插件中可用。在修改文本节点的属性之前，必须加载相应的字体。

**参数**：
- `fontName` - 字体名称对象，包含 family 和 style 属性

**示例**：
```javascript
// 加载字体
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

// 现在可以修改文本节点
const textNode = figma.createText();
textNode.fontName = { family: "Inter", style: "Regular" };
textNode.characters = "Hello World";
```

### 图像处理

#### figma.createImage(data: Uint8Array): Image

从原始字节创建图像对象。

**参数**：
- `data` - 图像的原始字节

**返回值**：
- 图像对象

**示例**：
```javascript
// 从字节数组创建图像
const image = figma.createImage(uint8Array);

// 将图像应用到矩形
const rect = figma.createRectangle();
rect.fills = [{
  type: 'IMAGE',
  imageHash: image.hash,
  scaleMode: 'FILL'
}];
```

#### figma.createImageAsync(src: string): Promise<Image>

从 URL 创建图像对象。

**参数**：
- `src` - 图像的 URL

**返回值**：
- 图像对象

**示例**：
```javascript
// 从 URL 创建图像
const image = await figma.createImageAsync('https://example.com/image.png');

// 将图像应用到矩形
const rect = figma.createRectangle();
rect.fills = [{
  type: 'IMAGE',
  imageHash: image.hash,
  scaleMode: 'FILL'
}];
```

#### figma.getImageByHash(hash: string): Image | null

通过哈希获取图像对象。

**参数**：
- `hash` - 图像的哈希值

**返回值**：
- 图像对象，如果未找到则为 null

**示例**：
```javascript
// 从节点的填充中获取图像哈希
const rect = figma.currentPage.findOne(node => node.type === 'RECTANGLE');
if (rect && rect.fills[0].type === 'IMAGE') {
  const imageHash = rect.fills[0].imageHash;
  const image = figma.getImageByHash(imageHash);
  if (image) {
    console.log("找到图像");
  }
}
```

## 事件处理方法

### 事件监听

#### figma.on(type: string, callback: (event: Event) => void): void

添加事件监听器。

**参数**：
- `type` - 事件类型
- `callback` - 事件回调函数

**支持的事件类型**：
- `selectionchange` - 选择更改
- `currentpagechange` - 当前页面更改
- `documentchange` - 文档更改
- `drop` - 拖放
- `run` - 插件运行
- `close` - 插件关闭
- `timerstart` - 计时器开始
- `timerpause` - 计时器暂停
- `timerstop` - 计时器停止
- `timercomplete` - 计时器完成
- `timerresume` - 计时器恢复

**示例**：
```javascript
// 监听选择更改事件
figma.on('selectionchange', () => {
  console.log('选择已更改:', figma.currentPage.selection);
});

// 监听文档更改事件
figma.on('documentchange', (event) => {
  console.log('文档已更改:', event.documentChanges);
});
```

#### figma.once(type: string, callback: (event: Event) => void): void

添加只触发一次的事件监听器。

**参数**：
- `type` - 事件类型
- `callback` - 事件回调函数

**示例**：
```javascript
// 只监听一次选择更改事件
figma.once('selectionchange', () => {
  console.log('选择已更改（只触发一次）');
});
```

#### figma.off(type: string, callback: (event: Event) => void): void

移除事件监听器。

**参数**：
- `type` - 事件类型
- `callback` - 要移除的回调函数

**示例**：
```javascript
// 定义回调函数
const onSelectionChange = () => {
  console.log('选择已更改');
};

// 添加事件监听器
figma.on('selectionchange', onSelectionChange);

// 移除事件监听器
figma.off('selectionchange', onSelectionChange);
```

## 其他常用方法

### 插件控制

#### figma.closePlugin(message?: string): void

关闭插件。

**参数**：
- `message` - 关闭消息（可选）

**示例**：
```javascript
// 关闭插件
figma.closePlugin();

// 关闭插件并显示消息
figma.closePlugin('操作已完成');
```

#### figma.command: string [readonly]

获取当前执行的命令。

**示例**：
```javascript
// 获取当前命令
console.log('当前命令:', figma.command);

// 根据命令执行不同的操作
if (figma.command === 'create') {
  // 创建操作
} else if (figma.command === 'edit') {
  // 编辑操作
}
```

### 外部链接

#### figma.openExternal(url: string): void

在新标签页中打开外部 URL。

**参数**：
- `url` - 要打开的 URL

**示例**：
```javascript
// 打开外部链接
figma.openExternal('https://www.figma.com');
```

### 撤销管理

#### figma.commitUndo(): void

将当前操作提交到撤销历史记录。

**示例**：
```javascript
// 执行一些操作
const rect = figma.createRectangle();
rect.x = 100;
rect.y = 100;

// 提交到撤销历史
figma.commitUndo();

// 执行更多操作
rect.width = 200;
rect.height = 150;

// 再次提交
figma.commitUndo();
```

#### figma.triggerUndo(): void

触发撤销操作，恢复到上一次 commitUndo() 的状态。

**示例**：
```javascript
// 执行操作并提交
const rect = figma.createRectangle();
figma.commitUndo();

// 修改矩形
rect.width = 500;

// 撤销修改
figma.triggerUndo();
// 现在矩形恢复到初始状态
```

### 编码工具

#### figma.base64Encode(data: Uint8Array): string

将字节数组编码为 Base64 字符串。

**参数**：
- `data` - 要编码的字节数组

**返回值**：
- Base64 编码的字符串

**示例**：
```javascript
// 编码字节数组
const base64String = figma.base64Encode(uint8Array);
console.log('Base64:', base64String);
```

#### figma.base64Decode(data: string): Uint8Array

将 Base64 字符串解码为字节数组。

**参数**：
- `data` - 要解码的 Base64 字符串

**返回值**：
- 解码后的字节数组

**示例**：
```javascript
// 解码 Base64 字符串
const uint8Array = figma.base64Decode(base64String);
```

### 团队库

#### figma.importComponentByKeyAsync(key: string): Promise<ComponentNode>

从团队库导入组件。

**参数**：
- `key` - 组件的键

**返回值**：
- 导入的组件节点

**示例**：
```javascript
// 从团队库导入组件
const component = await figma.importComponentByKeyAsync('COMPONENT_KEY');
figma.currentPage.appendChild(component);
```

#### figma.importStyleByKeyAsync(key: string): Promise<BaseStyle>

从团队库导入样式。

**参数**：
- `key` - 样式的键

**返回值**：
- 导入的样式对象

**示例**：
```javascript
// 从团队库导入样式
const style = await figma.importStyleByKeyAsync('STYLE_KEY');
console.log('导入的样式:', style.name);
```

## 开发模式API

### 代码生成

#### figma.codegen.on('generate', callback: (event: CodegenEvent) => void): void

监听代码生成事件。

**示例**：
```javascript
// 监听代码生成事件
figma.codegen.on('generate', (event) => {
  const { nodes, language } = event;
  
  // 生成代码
  const code = generateCode(nodes, language);
  
  // 返回代码
  return {
    code,
    language
  };
});
```

### 选择颜色

#### figma.getSelectionColors(): null | { paints: Paint[]; styles: PaintStyle[] }

获取当前选择中的所有颜色。

**返回值**：
- 包含 paints 和 styles 属性的对象，或者如果没有选择或选择中的颜色太多则为 null

**示例**：
```javascript
// 获取选择中的颜色
const colors = figma.getSelectionColors();
if (colors) {
  console.log('选择中的颜色:', colors.paints.length);
  console.log('选择中的样式:', colors.styles.length);
}
```

## 总结

本文档涵盖了 Figma 插件开发中最常用的 API 方法，按照功能类别进行了组织。这些方法构成了插件开发的核心工具集，允许开发者创建各种功能强大的插件。

在实际开发中，您可能需要参考 Figma 的官方 API 文档以获取更详细的信息和最新的 API 变更。官方文档提供了完整的 API 参考和更多的示例代码，可以帮助您更深入地了解 Figma 插件开发。