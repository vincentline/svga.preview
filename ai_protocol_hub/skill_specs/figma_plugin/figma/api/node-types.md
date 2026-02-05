# API参考文档 - 节点类型和属性

## 节点基本概念

在 Figma 中，节点是我们表示文件内容的方式。Figma 设计或 FigJam 文件中的每一层都对应一个节点。

每个节点支持一系列属性。有些属性是通用的，有些是节点之间共享的，有些是特定于特定节点类型的。

## 节点层次结构

Figma 文档的节点层次结构如下：

- **DocumentNode** - 文档的根节点
  - **PageNode** - 页面节点
    - **SceneNode** - 场景节点（可在画布上看到的节点）
      - **FrameNode** - 框架节点
      - **GroupNode** - 组节点
      - **ComponentNode** - 组件节点
      - **ComponentSetNode** - 组件集节点
      - **InstanceNode** - 实例节点
      - **VectorNode** - 矢量节点
      - **RectangleNode** - 矩形节点
      - **EllipseNode** - 椭圆节点
      - **LineNode** - 线条节点
      - **PolygonNode** - 多边形节点
      - **StarNode** - 星形节点
      - **TextNode** - 文本节点
      - **TextPathNode** - 路径文本节点
      - **BooleanOperationNode** - 布尔运算节点
      - **SliceNode** - 切片节点
      - **StickyNode** - 便签节点（仅 FigJam）
      - **ShapeWithTextNode** - 带文本的形状节点（仅 FigJam）
      - **ConnectorNode** - 连接器节点（仅 FigJam）
      - **CodeBlockNode** - 代码块节点（仅 FigJam）
      - **TableNode** - 表格节点（仅 FigJam）
      - **EmbedNode** - 嵌入节点（仅 FigJam）
      - **LinkUnfurlNode** - 链接展开节点（仅 FigJam）
      - **MediaNode** - 媒体节点（仅 FigJam）
      - **SectionNode** - 部分节点
      - **TransformGroupNode** - 变换组节点
      - **SlideNode** - 幻灯片节点（仅 Slides）
      - **SlideRowNode** - 幻灯片行节点（仅 Slides）

## 通用节点属性

以下是所有节点类型都支持的通用属性：

### BaseNode 属性

#### id: string [只读]

节点的唯一标识符。在文档中是唯一的。

#### name: string

节点的名称，显示在图层面板中。

#### type: NodeType [只读]

节点的类型，如 "FRAME"、"TEXT" 等。

#### removed: boolean [只读]

如果节点已从文档中移除，则为 true。

#### parent: BaseNode | null

节点的父节点。如果节点是文档的直接子节点，则为 null。

#### visible: boolean

节点是否可见。仅适用于场景节点。

#### locked: boolean

节点是否被锁定。仅适用于场景节点。

#### expanded: boolean

节点在图层面板中是否展开。仅适用于容器节点（如框架、组等）。

#### blendMode: BlendMode

节点的混合模式。仅适用于场景节点。

#### opacity: number

节点的不透明度，范围从 0 到 1。仅适用于场景节点。

#### isMask: boolean

节点是否是遮罩。仅适用于场景节点。

#### effects: Effect[]

应用于节点的效果列表。仅适用于场景节点。

#### effectStyleId: string | null

应用于节点的效果样式 ID。仅适用于场景节点。

## 场景节点属性

SceneNode 是可在画布上看到的节点，它们具有以下额外属性：

### SceneNode 属性

#### x: number

节点相对于父节点的 X 坐标。

#### y: number

节点相对于父节点的 Y 坐标。

#### width: number

节点的宽度。

#### height: number

节点的高度。

#### rotation: number

节点的旋转角度（以度为单位）。

#### constraints: LayoutConstraint

节点的布局约束。仅适用于框架和组件内的节点。

#### layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL'

节点的布局模式。仅适用于框架和组件。

#### primaryAxisSizingMode: 'FIXED' | 'AUTO'

主轴的 sizing 模式。仅适用于框架和组件。

#### counterAxisSizingMode: 'FIXED' | 'AUTO'

交叉轴的 sizing 模式。仅适用于框架和组件。

#### primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'

主轴上的项目对齐方式。仅适用于框架和组件。

#### counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX'

交叉轴上的项目对齐方式。仅适用于框架和组件。

#### paddingLeft: number

左侧内边距。仅适用于框架和组件。

#### paddingRight: number

右侧内边距。仅适用于框架和组件。

#### paddingTop: number

顶部内边距。仅适用于框架和组件。

#### paddingBottom: number

底部内边距。仅适用于框架和组件。

#### itemSpacing: number

项目之间的间距。仅适用于框架和组件。

## 特定节点类型属性

### FrameNode

框架节点表示设计中的容器，可以包含其他节点。

#### background: Paint[]

框架的背景填充。

#### backgrounds: Paint[]

框架的背景填充列表。

#### clipsContent: boolean

框架是否裁剪其内容。

#### guides: Guide[]

框架内的参考线。

#### gridStyleId: string | null

应用于框架的网格样式 ID。

#### grid: Grid[]

框架内的网格。

#### layoutGrids: LayoutGrid[]

框架内的布局网格。

#### overflowDirection: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'BOTH'

框架的溢出方向。

#### preserveRatio: boolean

框架是否保持宽高比。

#### prototypeStart: boolean

框架是否是原型的起点。

### TextNode

文本节点表示设计中的文本。

#### characters: string

文本节点中的文本内容。

#### fontSize: number

文本的字体大小。

#### fontName: FontName

文本的字体名称。

#### textAutoResize: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT'

文本自动调整大小的方式。

#### textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'

文本的水平对齐方式。

#### textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM'

文本的垂直对齐方式。

#### letterSpacing: LetterSpacing

文本的字间距。

#### lineHeight: LineHeight

文本的行高。

#### textStyleId: string | null

应用于文本的文本样式 ID。

#### fills: Paint[]

文本的填充。

#### fillStyleId: string | null

应用于文本的填充样式 ID。

#### stroke: Paint[]

文本的描边。

#### strokeStyleId: string | null

应用于文本的描边样式 ID。

#### strokeWeight: number

文本的描边宽度。

#### strokeAlign: 'CENTER' | 'INSIDE' | 'OUTSIDE'

文本的描边对齐方式。

### VectorNode

矢量节点表示设计中的矢量图形。

#### vectorNetwork: VectorNetwork

矢量网络，定义了矢量图形的路径。

#### vectorPaths: VectorPath[]

矢量路径列表，定义了矢量图形的路径。

#### fills: Paint[]

矢量图形的填充。

#### fillStyleId: string | null

应用于矢量图形的填充样式 ID。

#### strokes: Paint[]

矢量图形的描边。

#### strokeStyleId: string | null

应用于矢量图形的描边样式 ID。

#### strokeWeight: number

矢量图形的描边宽度。

#### strokeAlign: 'CENTER' | 'INSIDE' | 'OUTSIDE'

矢量图形的描边对齐方式。

#### strokeJoin: StrokeJoin

矢量图形的描边连接方式。

#### strokeCap: StrokeCap

矢量图形的描边端点方式。

#### dashPattern: number[]

矢量图形的虚线模式。

### RectangleNode

矩形节点表示设计中的矩形。

#### cornerRadius: number | PluginAPI.Mixed

矩形的圆角半径。

#### cornerRadiusTopLeft: number

矩形左上角的圆角半径。

#### cornerRadiusTopRight: number

矩形右上角的圆角半径。

#### cornerRadiusBottomLeft: number

矩形左下角的圆角半径。

#### cornerRadiusBottomRight: number

矩形右下角的圆角半径。

#### fills: Paint[]

矩形的填充。

#### fillStyleId: string | null

应用于矩形的填充样式 ID。

#### strokes: Paint[]

矩形的描边。

#### strokeStyleId: string | null

应用于矩形的描边样式 ID。

#### strokeWeight: number

矩形的描边宽度。

#### strokeAlign: 'CENTER' | 'INSIDE' | 'OUTSIDE'

矩形的描边对齐方式。

### ComponentNode

组件节点表示设计中的组件。

#### isComponent: boolean [只读]

如果节点是组件，则为 true。

#### createInstance(): InstanceNode

创建组件的实例。

#### description: string

组件的描述。

#### documentationLinks: string[]

组件的文档链接。

#### key: string | null [只读]

组件的唯一键，用于在团队库中标识组件。

### InstanceNode

实例节点表示组件的实例。

#### masterComponent: ComponentNode [只读]

实例所基于的主组件。

#### mainComponent: ComponentNode [只读]

实例所基于的主组件（与 masterComponent 相同）。

#### componentProperties: Record<string, any>

实例的组件属性。

### BooleanOperationNode

布尔运算节点表示通过布尔运算（如联合、减去、交集、排除）创建的形状。

#### booleanOperation: 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'EXCLUDE'

布尔运算的类型。

#### fills: Paint[]

布尔运算结果的填充。

#### fillStyleId: string | null

应用于布尔运算结果的填充样式 ID。

#### strokes: Paint[]

布尔运算结果的描边。

#### strokeStyleId: string | null

应用于布尔运算结果的描边样式 ID。

#### strokeWeight: number

布尔运算结果的描边宽度。

#### strokeAlign: 'CENTER' | 'INSIDE' | 'OUTSIDE'

布尔运算结果的描边对齐方式。

## 节点操作方法

### 查找节点

#### findAll(callback?: (node: BaseNode) => boolean): BaseNode[]

查找符合条件的所有节点。如果不提供回调，则返回所有节点。

#### findOne(callback: (node: BaseNode) => boolean): BaseNode | null

查找第一个符合条件的节点。

#### findAllWithCriteria(criteria: FindCriteria): BaseNode[]

使用更复杂的条件查找节点。

### 节点层次操作

#### appendChild(child: BaseNode): void

将子节点添加到节点的子节点列表末尾。

#### insertChild(index: number, child: BaseNode): void

在指定位置插入子节点。

#### removeChild(child: BaseNode): void

从节点中移除子节点。

#### moveChild(index: number, toIndex: number): void

移动子节点到新位置。

#### children: ReadonlyArray<BaseNode>

节点的子节点列表。

### 节点变换

#### absoluteTransform: Transform [只读]

节点的绝对变换矩阵，相对于文档原点。

#### relativeTransform: Transform

节点的相对变换矩阵，相对于父节点。

#### resize(width: number, height: number): void

调整节点的大小。

#### resizeWithoutConstraints(width: number, height: number): void

调整节点的大小，忽略约束。

### 节点复制

#### clone(): BaseNode

创建节点的副本。

#### cloneChildren(): BaseNode[]

创建节点子节点的副本。

### 节点样式

#### setSharedStyleFillStyleId(styleId: string | null): void

设置节点的填充样式 ID。

#### setSharedStyleStrokeStyleId(styleId: string | null): void

设置节点的描边样式 ID。

#### setSharedStyleEffectStyleId(styleId: string | null): void

设置节点的效果样式 ID。

#### setSharedStyleTextStyleId(styleId: string | null): void

设置节点的文本样式 ID。

### 节点数据

#### setRelaunchData(data: { [command: string]: string }): void

设置节点的重新启动数据，用于在 Figma UI 中创建重新启动按钮。

#### getRelaunchData(): { [command: string]: string }

获取节点的重新启动数据。

#### setPluginData(key: string, value: string): void

为节点设置插件数据。

#### getPluginData(key: string): string

获取节点的插件数据。

#### setPluginDataKeys(keys: string[]): void

设置节点的插件数据键列表。

#### getPluginDataKeys(): string[]

获取节点的插件数据键列表。

#### setSharedPluginData(namespace: string, key: string, value: string): void

为节点设置共享插件数据。

#### getSharedPluginData(namespace: string, key: string): string

获取节点的共享插件数据。

#### getSharedPluginDataKeys(namespace: string): string[]

获取节点的共享插件数据键列表。

## 节点类型判断

### 类型检查方法

#### isSceneNode(): this is SceneNode

检查节点是否是场景节点。

#### isFrame(): this is FrameNode

检查节点是否是框架节点。

#### isGroup(): this is GroupNode

检查节点是否是组节点。

#### isComponent(): this is ComponentNode

检查节点是否是组件节点。

#### isComponentSet(): this is ComponentSetNode

检查节点是否是组件集节点。

#### isInstance(): this is InstanceNode

检查节点是否是实例节点。

#### isVector(): this is VectorNode

检查节点是否是矢量节点。

#### isRectangle(): this is RectangleNode

检查节点是否是矩形节点。

#### isEllipse(): this is EllipseNode

检查节点是否是椭圆节点。

#### isLine(): this is LineNode

检查节点是否是线条节点。

#### isPolygon(): this is PolygonNode

检查节点是否是多边形节点。

#### isStar(): this is StarNode

检查节点是否是星形节点。

#### isText(): this is TextNode

检查节点是否是文本节点。

#### isTextPath(): this is TextPathNode

检查节点是否是路径文本节点。

#### isBooleanOperation(): this is BooleanOperationNode

检查节点是否是布尔运算节点。

#### isSlice(): this is SliceNode

检查节点是否是切片节点。

#### isSticky(): this is StickyNode

检查节点是否是便签节点。

#### isShapeWithText(): this is ShapeWithTextNode

检查节点是否是带文本的形状节点。

#### isConnector(): this is ConnectorNode

检查节点是否是连接器节点。

#### isCodeBlock(): this is CodeBlockNode

检查节点是否是代码块节点。

#### isTable(): this is TableNode

检查节点是否是表格节点。

#### isEmbed(): this is EmbedNode

检查节点是否是嵌入节点。

#### isLinkUnfurl(): this is LinkUnfurlNode

检查节点是否是链接展开节点。

#### isMedia(): this is MediaNode

检查节点是否是媒体节点。

#### isSection(): this is SectionNode

检查节点是否是部分节点。

#### isTransformGroup(): this is TransformGroupNode

检查节点是否是变换组节点。

#### isSlide(): this is SlideNode

检查节点是否是幻灯片节点。

#### isSlideRow(): this is SlideRowNode

检查节点是否是幻灯片行节点。

## 节点层次结构操作

### 遍历节点层次结构

#### forEachChild(callback: (node: BaseNode) => void): void

遍历节点的所有子节点。

#### traverse(callback: (node: BaseNode) => void): void

遍历节点及其所有后代节点。

#### traverseAncestors(callback: (node: BaseNode) => void): void

遍历节点及其所有祖先节点。

### 节点路径

#### path: string [只读]

节点在文档中的路径，如 "PAGE1/FRAME1/TEXT1"。

## 节点约束和布局

### 布局约束

#### constraints: LayoutConstraint

节点的布局约束，定义了节点在父容器中的定位方式。

#### LayoutConstraint 类型

```typescript
interface LayoutConstraint {
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'STRETCH' | 'SCALE'
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'STRETCH' | 'SCALE'
}
```

### 自动布局

#### layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL'

节点的布局模式，仅适用于框架和组件。

#### primaryAxisSizingMode: 'FIXED' | 'AUTO'

主轴的 sizing 模式，仅适用于框架和组件。

#### counterAxisSizingMode: 'FIXED' | 'AUTO'

交叉轴的 sizing 模式，仅适用于框架和组件。

#### primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'

主轴上的项目对齐方式，仅适用于框架和组件。

#### counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX'

交叉轴上的项目对齐方式，仅适用于框架和组件。

## 节点样式和外观

### 填充

#### fills: Paint[]

节点的填充列表。

#### fillStyleId: string | null

应用于节点的填充样式 ID。

### 描边

#### strokes: Paint[]

节点的描边列表。

#### strokeStyleId: string | null

应用于节点的描边样式 ID。

#### strokeWeight: number

节点的描边宽度。

#### strokeAlign: 'CENTER' | 'INSIDE' | 'OUTSIDE'

节点的描边对齐方式。

#### strokeJoin: StrokeJoin

节点的描边连接方式。

#### strokeCap: StrokeCap

节点的描边端点方式。

#### dashPattern: number[]

节点的虚线模式。

### 效果

#### effects: Effect[]

应用于节点的效果列表。

#### effectStyleId: string | null

应用于节点的效果样式 ID。

### 混合模式和不透明度

#### blendMode: BlendMode

节点的混合模式。

#### opacity: number

节点的不透明度，范围从 0 到 1。

## 节点状态和交互

### 可见性和锁定

#### visible: boolean

节点是否可见。

#### locked: boolean

节点是否被锁定。

### 原型交互

#### prototypeStart: boolean

节点是否是原型的起点。

#### transitions: Transition[]

节点的原型过渡效果。

### 插件数据

#### setPluginData(key: string, value: string): void

为节点设置插件数据。

#### getPluginData(key: string): string

获取节点的插件数据。

#### setSharedPluginData(namespace: string, key: string, value: string): void

为节点设置共享插件数据。

#### getSharedPluginData(namespace: string, key: string): string

获取节点的共享插件数据。

## 节点类型特定操作

### 文本节点操作

#### getRangeFontSize(start: number, end: number): number | PluginAPI.Mixed

获取文本范围的字体大小。

#### setRangeFontSize(start: number, end: number, value: number): void

设置文本范围的字体大小。

#### getRangeFontName(start: number, end: number): FontName | PluginAPI.Mixed

获取文本范围的字体名称。

#### setRangeFontName(start: number, end: number, value: FontName): void

设置文本范围的字体名称。

#### getRangeTextCase(start: number, end: number): TextCase | PluginAPI.Mixed

获取文本范围的文本大小写。

#### setRangeTextCase(start: number, end: number, value: TextCase): void

设置文本范围的文本大小写。

#### getRangeTextDecoration(start: number, end: number): TextDecoration | PluginAPI.Mixed

获取文本范围的文本装饰。

#### setRangeTextDecoration(start: number, end: number, value: TextDecoration): void

设置文本范围的文本装饰。

### 矢量节点操作

#### setVectorNetwork(network: VectorNetwork): void

设置矢量节点的矢量网络。

#### setVectorPaths(paths: VectorPath[]): void

设置矢量节点的矢量路径。

### 组件操作

#### createInstance(): InstanceNode

创建组件的实例。

#### editComponent(): void

进入组件编辑模式。

### 实例操作

#### swapComponent(component: ComponentNode): void

将实例切换到另一个组件。

#### detachInstance(): SceneNode

将实例分离为普通节点。

## 节点数据类型

### 颜色类型

#### RGBA

```typescript
interface RGBA {
  r: number // 红色通道，范围 0-1
  g: number // 绿色通道，范围 0-1
  b: number // 蓝色通道，范围 0-1
  a: number //  alpha 通道，范围 0-1
}
```

### 变换类型

#### Transform

```typescript
type Transform = [
  [number, number, number], // 第一行: [a, c, tx]
  [number, number, number]  // 第二行: [b, d, ty]
]
```

###  paint 类型

#### Paint

```typescript
type Paint = SolidPaint | GradientPaint | ImagePaint | EmojiPaint
```

#### SolidPaint

```typescript
interface SolidPaint {
  type: 'SOLID'
  color: RGBA
  opacity?: number
  visible?: boolean
  blendMode?: BlendMode
}
```

#### GradientPaint

```typescript
interface GradientPaint {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND'
  gradientTransform: Transform
  gradientStops: GradientStop[]
  opacity?: number
  visible?: boolean
  blendMode?: BlendMode
}
```

#### ImagePaint

```typescript
interface ImagePaint {
  type: 'IMAGE'
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE'
  imageHash: string | null
  imageTransform?: Transform
  scalingFactor?: number
  opacity?: number
  visible?: boolean
  blendMode?: BlendMode
}
```

### 字体类型

#### FontName

```typescript
interface FontName {
  family: string
  style: string
}
```

### 效果类型

#### Effect

```typescript
type Effect = DropShadowEffect | InnerShadowEffect | BlurEffect | BackgroundBlurEffect
```

#### DropShadowEffect

```typescript
interface DropShadowEffect {
  type: 'DROP_SHADOW'
  color: RGBA
  offset: Vector
  radius: number
  visible: boolean
  blendMode: BlendMode
  spread: number
}
```

#### BlurEffect

```typescript
interface BlurEffect {
  type: 'BLUR'
  radius: number
  visible: boolean
  blendMode: BlendMode
}
```

## 总结

Figma 的节点系统是一个强大而灵活的层次结构，允许开发者精确控制和操作设计文件的各个方面。通过了解不同类型的节点及其属性，开发者可以创建功能强大的插件，实现各种复杂的设计自动化和增强功能。

本文档提供了 Figma 节点类型和属性的详细参考，涵盖了从基本概念到高级操作的各个方面。开发者可以根据自己的需求，参考相应的节点类型和属性，实现具体的插件功能。