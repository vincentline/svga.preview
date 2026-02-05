# API参考文档 - 全局对象和变量

## 概述

您可以通过 `figma` 全局对象及其子对象访问大部分 Plugin API。您会发现允许您查看、创建和更新文件内容的属性和函数。

插件 API 中还有全局变量可用：`__html__` 和 `__uiFiles__`。您可以使用这些变量来访问 UI 文件的内容。

## figma 全局对象

### 基本属性

#### apiVersion: '1.0.0' [只读]

插件运行的 Figma API 版本，在 manifest.json 中的 "api" 字段中定义。

#### fileKey: string | undefined [只读]

当前插件运行所在文件的文件密钥。

只有私有插件和 Figma 拥有的资源（如 Jira 和 Asana 小部件）可以访问此功能。

要启用此行为，您需要在 manifest.json 中指定 `enablePrivatePluginApi`。

#### command: string [只读]

来自 manifest.json 文件的当前执行命令。它是 ManifestMenuItem 中的命令字符串（更多详情请参阅清单指南）。如果插件没有任何菜单项，则此属性为 undefined。

#### pluginId?: string [只读]

manifest.json "id" 字段中指定的值。这仅适用于插件。

#### widgetId?: string [只读]

类似于 figma.pluginId，但适用于小部件。manifest.json "id" 字段中指定的值。这仅适用于小部件。

#### editorType: 'figma' | 'figjam' | 'dev' | 'slides' | 'buzz' [只读]

当前插件运行的编辑器类型。另请参阅设置编辑器类型。

#### mode: 'default' | 'textreview' | 'inspect' | 'codegen' | 'linkpreview' | 'auth' [只读]

返回插件当前运行的上下文。

- `default` - 插件作为普通插件运行。
- `textreview` - 插件运行以提供文本审查功能。
- `inspect` - 插件在开发模式的检查面板中运行。
- `codegen` - 插件在开发模式的检查面板的代码部分运行。
- `linkpreview` - 插件正在为开发模式中的开发资源生成链接预览。
- `auth` - 插件运行以在开发模式中对用户进行身份验证。

> 注意：linkpreview 和 auth 模式仅对合作伙伴和 Figma 拥有的插件可用。

#### skipInvisibleInstanceChildren: boolean

启用时，导致所有节点属性和方法跳过实例内部的不可见节点（及其后代）。

这使得文档遍历等操作更快。

> 默认为 Figma 开发模式中的 true，以及 Figma 和 FigJam 中的 false

#### currentPage: PageNode

用户当前查看的页面。您可以将此值设置为 PageNode 以切换页面。

如果清单包含 "documentAccess": "dynamic-page"，则此属性为只读。使用 figma.setCurrentPageAsync 更新值。

#### root: DocumentNode [只读]

整个 Figma 文档的根。此节点用于访问其他页面。每个子节点都是 PageNode。

### UI 相关

#### showUI(html: string, options?: ShowUIOptions): void

允许您渲染 UI 以与用户交互，或简单地访问浏览器 API。此函数创建一个模态对话框，其中包含带有 html 参数中 HTML 标记的 <iframe>。

#### ui: UIAPI [只读]

此属性包含用于修改和与通过 figma.showUI(...) 创建的 UI 通信的方法。

### 实用工具

#### util: UtilAPI [只读]

此属性包含用于常见操作的便捷函数。

#### constants: ConstantsAPI [只读]

此属性包含可通过插件 API 访问的常量。

#### timer?: TimerAPI [只读]

> 此 API 仅在 FigJam 中可用

此属性包含用于读取、设置和修改内置 FigJam 计时器的方法。

#### viewport: ViewportAPI [只读]

此属性包含用于读取和设置视口（当前页面的用户可见区域）的方法。

#### clientStorage: ClientStorageAPI [只读]

此属性包含用于在用户本地计算机上存储持久数据的方法。

#### parameters: ParametersAPI [只读]

此属性包含用于处理插件在查询模式下启动时的用户输入的方法。

#### payments?: PaymentsAPI [只读]

> 必须在 manifest.json 的 permissions 数组中指定 payments 才能访问此属性。

此属性包含需要付款的插件的方法。

#### currentUser: User | null [只读]

> 必须在 manifest.json 的 permissions 数组中指定 currentuser 才能访问此属性。

此属性包含有关当前用户的详细信息。

#### activeUsers: ActiveUser[] [只读]

> 此 API 仅在 FigJam 中可用。必须在 manifest.json 的 permissions 数组中指定 activeusers 才能访问此属性。

此属性包含有关文件中活动用户的详细信息。figma.activeUsers[0] 将与 figma.currentUser 的 id、name、photoUrl、color 和 sessionId 属性匹配。

#### textreview?: TextReviewAPI [只读]

> 必须在 manifest.json 的 capabilities 数组中指定 textreview 才能访问此属性。

此属性包含启用插件中文本审查功能的方法。

#### variables: VariablesAPI [只读]

此属性包含用于处理 Figma 中变量和变量集合的方法。

#### teamLibrary: TeamLibraryAPI [只读]

此属性包含用于处理团队库中资产的方法。

#### annotations: AnnotationsAPI [只读]

此属性包含用于处理注释的方法。

#### buzz: BuzzAPI [只读]

此 API 仅在 Buzz 中可用。

此属性包含在 Buzz 中工作的方法。

### 核心方法

#### closePlugin(message?: string): void

关闭插件。一旦插件完成运行，您应该始终调用此函数。调用时，任何打开的 UI 都会关闭，任何 setTimeout 或 setInterval 计时器都会被取消。

#### on(type: ArgFreeEventType, callback: () => void): void

注册一个回调，当编辑器中发生事件时将被调用。当前支持的事件有：

- 当前页面上的选择已更改。
- 当前页面已更改。
- 文档已更改。
- 从 Figma 外部拖放对象到画布上。
- 插件已开始运行。
- 插件已关闭。
- 插件已开始运行。
- 计时器已开始运行。
- 计时器已暂停。
- 计时器已停止。
- 计时器已完成。
- 计时器已恢复。

#### once(type: ArgFreeEventType, callback: () => void): void

与 figma.on 相同，但回调只会在指定事件第一次发生时被调用一次。

#### off(type: ArgFreeEventType, callback: () => void): void

移除使用 figma.on 或 figma.once 添加的回调。

#### notify(message: string, options?: NotificationOptions): NotificationHandler

在屏幕底部显示通知。

#### commitUndo(): void

将操作提交到撤销历史记录。这不会触发撤销。

#### triggerUndo(): void

触发撤销操作。恢复到最后一次 commitUndo() 状态。

#### saveVersionHistoryAsync(title: string, description?: string): Promise<VersionHistoryResult>

保存文件的新版本并将其添加到文件的版本历史记录中。返回新版本 ID。

#### openExternal(url: string): void

在新标签页中打开 URL。

## 节点操作方法

### 获取和创建节点

#### getNodeByIdAsync(id: string): Promise<BaseNode | null>

通过其 ID 在当前文档中查找节点。每个节点都有一个 id 属性，该属性在文档中是唯一的。如果 ID 无效，或无法找到节点（例如已删除），则返回包含 null 的 promise。

#### getNodeById(id: string): BaseNode | null

> 已弃用：使用 figma.getNodeByIdAsync 代替。如果插件清单包含 "documentAccess": "dynamic-page"，此函数将抛出异常。

通过其 ID 在当前文档中查找节点。每个节点都有一个 id 属性，该属性在文档中是唯一的。如果 ID 无效，或无法找到节点（例如已删除），则返回 null。

#### createRectangle(): RectangleNode

创建一个新的矩形。行为类似于使用 R 快捷键后跟点击。

#### createLine(): LineNode

创建一个新的线条。

#### createEllipse(): EllipseNode

创建一个新的椭圆。行为类似于使用 O 快捷键后跟点击。

#### createPolygon(): PolygonNode

创建一个新的多边形（默认为三角形）。

#### createStar(): StarNode

创建一个新的星形。

#### createVector(): VectorNode

创建一个新的、空的矢量网络，没有顶点。

#### createText(): TextNode

创建一个新的、空的文本节点。

#### createTextPath(node: VectorNode, startSegment: number, startPosition: number): TextPathNode

从现有矢量节点创建一个新的路径文本节点。

#### createFrame(): FrameNode

创建一个新的框架。行为类似于使用 F 快捷键后跟点击。

#### createComponent(): ComponentNode

> 此 API 仅在 Figma Design 中可用

创建一个新的、空的组件。

#### createComponentFromNode(node: SceneNode): ComponentNode

> 此 API 仅在 Figma Design 中可用

从现有节点创建组件，保留其所有属性和子节点。行为类似于使用工具栏中的创建组件按钮。

#### createBooleanOperation(): BooleanOperationNode

> 已弃用：使用 figma.union、figma.subtract、figma.intersect、figma.exclude 代替。

#### createPage(): PageNode

> 此 API 仅在 Figma Design 中可用

创建一个新页面，附加到文档的子列表中。

#### createPageDivider(dividerName?: string): PageNode

创建一个新的页面分隔符，附加到文档的子列表中。页面分隔符是一个 isPageDivider 为 true 的 PageNode。

#### createSlice(): SliceNode

创建一个新的切片对象。

#### createSlide(row?: number, col?: number): SlideNode

> 此 API 仅在 Figma Slides 中可用

#### createSlideRow(row?: number): SlideRowNode

> 此 API 仅在 Figma Slides 中可用

创建一个新的幻灯片行，自动附加到幻灯片网格。

#### createSticky(): StickyNode

> 此 API 仅在 FigJam 中可用

创建一个新的便签。行为类似于使用 S 快捷键后跟点击。

#### createShapeWithText(): ShapeWithTextNode

> 此 API 仅在 FigJam 中可用

创建一个新的带文本的形状。

#### createConnector(): ConnectorNode

> 此 API 仅在 FigJam 中可用

创建一个新的连接器。行为类似于使用 Shift-C 快捷键后跟点击。

#### createCodeBlock(): CodeBlockNode

> 此 API 仅在 FigJam 中可用

创建一个新的代码块。

#### createSection(): SectionNode

创建一个新的部分。

#### createTable(numRows?: number, numColumns?: number): TableNode

> 此 API 仅在 FigJam 中可用

创建一个新的表格。

#### createLinkPreviewAsync(url: string): Promise<EmbedNode | LinkUnfurlNode>

> 此 API 仅在 FigJam 中可用

从 URL 解析链接元数据，并将链接的嵌入或展开预览插入到文档中

如果 URL 是有效的 OEmbed 提供商（具有 <link type="application/json+oembed" ... /> 标签），则会插入嵌入。返回的 <iframe> 源将被转换为 EmbedNode。

否则，标题、描述、缩略图和网站图标将使用标准的 og 或 twitter 元标签从 URL 的 HTML 标记中解析。此信息将被转换为 LinkUnfurlNode。

#### createGif(hash: string): MediaNode

> 此 API 仅在 FigJam 中可用

使用给定的图像哈希创建一个新的 GIF。

#### createNodeFromSvg(svg: string): FrameNode

从 SVG 字符串创建一个新节点。这相当于编辑器中的 SVG 导入功能。

#### createNodeFromJSXAsync(jsx: any): Promise<SceneNode>

此 API 使用小部件使用的 JSX API 创建一个新节点。

### 节点操作

#### combineAsVariants(nodes: ReadonlyArray<ComponentNode>, parent: BaseNode & ChildrenMixin, index?: number): ComponentSetNode

> 此 API 仅在 Figma Design 中可用

通过组合 nodes 中的所有节点创建一个新的 ComponentSetNode，这些节点都应该具有 ComponentNode 类型。

#### group(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?: number): GroupNode

创建一个包含 nodes 中所有节点的新组。没有 createGroup 函数 - 请改用此函数。组节点有许多怪癖，如自动调整大小，您可以在 FrameNode 部分中阅读。

#### union(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?: number): BooleanOperationNode

使用 nodes 内容创建一个使用 UNION 操作的新 BooleanOperationNode。union 的参数与 figma.group 中的参数相同。

#### subtract(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?: number): BooleanOperationNode

使用 nodes 内容创建一个使用 SUBTRACT 操作的新 BooleanOperationNode。union 的参数与 figma.subtract 中的参数相同。

#### intersect(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?: number): BooleanOperationNode

使用 nodes 内容创建一个使用 INTERSECT 操作的新 BooleanOperationNode。union 的参数与 figma.intersect 中的参数相同。

#### exclude(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?: number): BooleanOperationNode

使用 nodes 内容创建一个使用 EXCLUDE 操作的新 BooleanOperationNode。union 的参数与 figma.exclude 中的参数相同。

#### flatten(nodes: ReadonlyArray<BaseNode>, parent?: BaseNode & ChildrenMixin, index?: number): VectorNode

将 nodes 中的每个节点扁平化为一个新的矢量网络。

#### ungroup(node: SceneNode & ChildrenMixin): Array<SceneNode>

取消组合给定节点，将 node 的所有子节点移动到 node 的父节点中并移除 node。返回作为 node 的子节点的节点数组。

#### transformGroup(nodes: ReadonlyArray<SceneNode>, parent: BaseNode & ChildrenMixin, index: number, modifiers: TransformModifier[]): TransformGroupNode

创建一个包含 nodes 中所有节点的新 TransformGroupNode，将 modifiers 中指定的变换应用于每个子节点。

## 开发模式 API

### 代码生成

#### codegen: CodegenAPI [只读]

此属性包含用于与开发模式代码生成功能集成的方法。

#### vscode?: VSCodeAPI [只读]

此属性包含用于与 Figma for VS Code 扩展集成的方法。如果未定义，则插件未在 VS Code 中运行。

#### devResources?: DevResourcesAPI [只读]

### 选择颜色

#### getSelectionColors(): null | { paints: Paint[]; styles: PaintStyle[] }

返回用户当前选择中的所有颜色。这
返回与 Figma 原生选择颜色功能中显示的值相同的值。这对于获取当前选择中的颜色和样式列表并将它们转换为不同的代码格式（如用户代码库的 CSS 变量）非常有用。

如果选择中有颜色，它将返回一个对象，其中包含一个 paints 属性（一个 Paint[] 数组）和一个 styles 属性（一个 PaintStyle[] 数组）。

> getSelectionColors() 如果没有选择，或者选择中的颜色太多（>1000），则返回 null。

## Slides 相关

#### getSlideGrid(): Array<Array<SlideNode>>

> 已弃用：使用 figma.getCanvasGrid 代替。
> 此 API 仅在 Figma Slides 中可用

#### setSlideGrid(slideGrid: Array<Array<SlideNode>>): void

> 已弃用：使用 figma.setCanvasGrid 代替。
> 此 API 仅在 Figma Slides 中可用

## 画布网格

#### getCanvasGrid(): Array<Array<SceneNode>>

获取当前画布网格布局作为节点的二维数组。

> 此 API 仅在 Figma Slides 和 Figma Buzz 中可用

#### setCanvasGrid(canvasGrid: Array<Array<SceneNode>>): void

设置画布网格布局，重新组织画布中的节点。

> 此 API 仅在 Figma Slides 和 Figma Buzz 中可用

#### createCanvasRow(rowIndex?: number): SceneNode

在指定索引处的画布网格中创建一个新行。

> 此 API 仅在 Figma Slides 和 Figma Buzz 中可用

#### moveNodesToCoord(nodeIds: string[], rowIndex?: number, columnIndex?: number): void

将指定的节点移动到画布网格中的特定坐标。

> 此 API 仅在 Figma Slides 和 Figma Buzz 中可用

此函数允许在 Slides 和 Buzz 中使用的画布网格系统中精确定位多个节点。

## 样式相关

### 获取和创建样式

#### getStyleByIdAsync(id: string): Promise<BaseStyle | null>

通过其 ID 在当前文档中查找样式。如果未找到，则返回包含 null 的 promise。

#### getStyleById(id: string): BaseStyle | null

> 已弃用：使用 figma.getStyleByIdAsync 代替。如果插件清单包含 "documentAccess": "dynamic-page"，此函数将抛出异常。

通过其 ID 在当前文档中查找样式。如果未找到，则返回 null。

#### createPaintStyle(): PaintStyle

> 此 API 仅在 Figma Design 中可用

创建一个新的 Paint 样式。这在口语中可能被称为颜色样式或填充样式。但是，由于这种类型的样式可能包含图像，并且可能用于背景、描边和填充，因此它被称为 Paint。

#### createTextStyle(): TextStyle

> 此 API 仅在 Figma Design 中可用

创建一个新的文本样式。默认情况下，文本样式具有 Figma 默认文本属性（字体系列 Inter Regular，字体大小 12）。

#### createEffectStyle(): EffectStyle

> 此 API 仅在 Figma Design 中可用

创建一个新的效果样式。

#### createGridStyle(): GridStyle

> 此 API 仅在 Figma Design 中可用

创建一个新的网格样式。

### 本地样式操作

#### getLocalPaintStylesAsync(): Promise<PaintStyle[]>

返回本地 paint 样式列表。

#### getLocalPaintStyles(): PaintStyle[]

> 已弃用：使用 figma.getLocalPaintStylesAsync 代替。如果插件清单包含 "documentAccess": "dynamic-page"，此函数将抛出异常。

返回本地 paint 样式列表。

#### getLocalTextStylesAsync(): Promise<TextStyle[]>

返回本地文本样式列表。

#### getLocalTextStyles(): TextStyle[]

> 已弃用：使用 figma.getLocalTextStylesAsync 代替。如果插件清单包含 "documentAccess": "dynamic-page"，此函数将抛出异常。

返回本地文本样式列表。

#### getLocalEffectStylesAsync(): Promise<EffectStyle[]>

返回本地效果样式列表。

#### getLocalEffectStyles(): EffectStyle[]

> 已弃用：使用 figma.getLocalEffectStylesAsync 代替。如果插件清单包含 "documentAccess": "dynamic-page"，此函数将抛出异常。

返回本地效果样式列表。

#### getLocalGridStylesAsync(): Promise<GridStyle[]>

返回本地网格样式列表。

#### getLocalGridStyles(): GridStyle[]

> 已弃用：使用 figma.getLocalGridStylesAsync 代替。如果插件清单包含 "documentAccess": "dynamic-page"，此函数将抛出异常。

返回本地网格样式列表。

### 样式和文件夹排序

#### moveLocalPaintStyleAfter(targetNode: PaintStyle, reference: PaintStyle | null): void

> 此 API 仅在 Figma Design 中可用

将目标节点重新排序到指定参考节点之后（如果提供），或者如果 reference 为 null，则排在第一位。目标和参考节点必须位于同一文件夹中。目标和参考节点必须是本地 paint 样式。

#### moveLocalTextStyleAfter(targetNode: TextStyle, reference: TextStyle | null): void

> 此 API 仅在 Figma Design 中可用

将目标节点重新排序到指定参考节点之后（如果提供），或者如果 reference 为 null，则排在第一位。目标和参考节点必须位于同一文件夹中。目标和参考节点必须是本地文本样式。

#### moveLocalEffectStyleAfter(targetNode: EffectStyle, reference: EffectStyle | null): void

> 此 API 仅在 Figma Design 中可用

将目标节点重新排序到指定参考节点之后（如果提供），或者如果 reference 为 null，则排在第一位。目标和参考节点必须位于同一文件夹中。目标和参考节点必须是本地效果样式。

#### moveLocalGridStyleAfter(targetNode: GridStyle, reference: GridStyle | null): void

> 此 API 仅在 Figma Design 中可用

将目标节点重新排序到指定参考节点之后（如果提供），或者如果 reference 为 null，则排在第一位。目标和参考节点必须位于同一文件夹中。目标和参考节点必须是本地网格样式。

#### moveLocalPaintFolderAfter(targetFolder: string, reference: string | null): void

> 此 API 仅在 Figma Design 中可用

将目标文件夹重新排序到指定参考文件夹之后（如果提供），或者如果 reference 为 null，则排在父文件夹的第一位。目标和参考文件夹必须具有相同的父文件夹。目标和参考文件夹必须包含 paint 样式。引用嵌套文件夹时，必须使用完整的分隔文件夹名称。

#### moveLocalTextFolderAfter(targetFolder: string, reference: string | null): void

> 此 API 仅在 Figma Design 中可用

将目标文件夹重新排序到指定参考文件夹之后（如果提供），或者如果 reference 为 null，则排在父文件夹的第一位。目标和参考文件夹必须具有相同的父文件夹。目标和参考文件夹必须包含文本样式。引用嵌套文件夹时，必须使用完整的分隔文件夹名称。

#### moveLocalEffectFolderAfter(targetFolder: string, reference: string | null): void

> 此 API 仅在 Figma Design 中可用

将目标文件夹重新排序到指定参考文件夹之后（如果提供），或者如果 reference 为 null，则排在父文件夹的第一位。目标和参考文件夹必须具有相同的父文件夹。目标和参考文件夹必须包含效果样式。引用嵌套文件夹时，必须使用完整的分隔文件夹名称。

#### moveLocalGridFolderAfter(targetFolder: string, reference: string | null): void

> 此 API 仅在 Figma Design 中可用

将目标文件夹重新排序到指定参考文件夹之后（如果提供），或者如果 reference 为 null，则排在父文件夹的第一位。目标和参考文件夹必须具有相同的父文件夹。目标和参考文件夹必须包含网格样式。引用嵌套文件夹时，必须使用完整的分隔文件夹名称。

## 团队库 API

### 导入资产

#### importComponentByKeyAsync(key: string): Promise<ComponentNode>

从团队库加载组件节点。如果没有具有该键的已发布组件，或者请求失败，则 Promise 被拒绝。

#### importComponentSetByKeyAsync(key: string): Promise<ComponentSetNode>

从团队库加载组件集节点。如果没有具有该键的已发布组件集，或者请求失败，则 Promise 被拒绝。

#### importStyleByKeyAsync(key: string): Promise<BaseStyle>

从团队库加载样式。如果没有具有该键的样式，或者请求失败，则 Promise 被拒绝。

#### importVariableByKeyAsync(key: string): Promise<Variable>

从团队库加载变量。如果没有具有该键的已发布变量，或者请求失败，则 Promise 被拒绝。

## 其他方法

### 字体相关

#### listAvailableFontsAsync(): Promise<Font[]>

返回当前可用字体的列表。这应该与您手动使用字体选择器时看到的列表相同。

#### loadFontAsync(fontName: FontName): Promise<void>

使字体在插件中可用于创建和修改文本。调用此函数对于修改文本节点的任何可能导致渲染文本更改的属性是必要的，包括 .characters、.fontSize、.fontName 等。

您可以传入硬编码的字体、通过 listAvailableFontsAsync 加载的字体，或存储在现有文本节点上的字体。

#### hasMissingFont: boolean [readonly]

如果文档包含带有缺失字体的文本，则返回 true。

### 图像处理

#### createImage(data: Uint8Array): Image

从文件内容的原始字节创建 Image 对象。请注意，Image 对象不是节点。它们是 Figma 存储的图像的句柄。框架背景或形状（例如矩形）的填充可能包含图像。

#### createImageAsync(src: string): Promise<Image>

从 src URL 创建 Image 对象。请注意，Image 对象不是节点。它们是 Figma 存储的图像的句柄。框架背景或形状（例如矩形）的填充可能包含图像。

#### getImageByHash(hash: string): Image | null

获取给定图像哈希的相应 Image 对象，然后可用于获取图像的字节。此哈希在节点的 fill 属性中作为 ImagePaint 对象的一部分找到。如果没有具有此哈希的图像，则返回 null。

#### createVideoAsync(data: Uint8Array): Promise<Video>

从文件内容的原始字节创建 Video 对象。与 Image 对象一样，Video 对象不是节点。它们是 Figma 存储的图像的句柄。框架背景或形状（例如矩形）的填充可能包含视频。

### 特殊值

#### mixed: unique symbol [readonly]

这是一些节点属性在它们是多个值的混合时返回的常量值。例如字体大小：单个文本节点可以对不同的字符范围使用多个不同的字体大小。对于这些属性，您应该始终与 figma.mixed 进行比较。

### 编码工具

#### base64Encode(data: Uint8Array): string

从 Uint8Array 数据返回 base64 编码的字符串。

#### base64Decode(data: string): Uint8Array

解码并从 base64 编码的字符串数据返回 Uint8Array。

### 文件缩略图

#### getFileThumbnailNodeAsync(): Promise<FrameNode | ComponentNode | ComponentSetNode | SectionNode | null>

获取当前用于文件缩略图的节点，如果使用默认缩略图，则返回 null。

#### getFileThumbnailNode(): FrameNode | ComponentNode | ComponentSetNode | SectionNode | null

> 已弃用：使用 figma.getFileThumbnailNodeAsync 代替。如果插件清单包含 "documentAccess": "dynamic-page"，此函数将抛出异常。

获取当前用于文件缩略图的节点，如果使用默认缩略图，则返回 null。

#### setFileThumbnailNodeAsync(node: FrameNode | ComponentNode | ComponentSetNode | SectionNode | null): Promise<void>

设置节点作为文件的缩略图。如果 node 为 null，则使用默认缩略图。

### 页面加载

#### loadAllPagesAsync(): Promise<void>

将文档的所有页面加载到内存中。这启用以下功能：

- figma.on 的 documentchange 事件
- findAll
- findOne
- findAllWithCriteria
- findWidgetNodesByWidgetId

调用此方法对于大型文档可能很慢，除非绝对必要，否则应避免。

此方法仅在插件清单包含 "documentAccess": "dynamic-page" 时才必要。没有此清单设置，完整文档在插件或小部件运行时会自动加载。

### 画笔

#### loadBrushesAsync(brushType: 'STRETCH' | 'SCATTER'): Promise<void>

使指定类型的所有内置画笔可在插件中使用。在
将节点的描边设置为指定类型的画笔之前，必须调用此函数。

有两种类型的画笔：'STRETCH' 画笔，沿着描边长度拉伸，以及 'SCATTER' 画笔，沿着描边分散画笔形状的实例。