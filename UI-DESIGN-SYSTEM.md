# UI 设计系统规范

> 本文档基于项目现有代码梳理而成，定义了统一的设计令牌（Design Tokens）和组件规范，确保各页面视觉风格一致。
> 
> **文件路径**：`docs/assets/css/styles.css`

---

## 1. 设计令牌（Design Tokens）

### 1.1 颜色系统

#### 主色调
```css
--primary-blue: #409eff;      /* 主要操作、链接、进度条、滑块 */
--primary-gray: #5b5b5b;      /* 次要按钮、强调文字、进度条 */
--primary-red: #ff4444;       /* 危险操作（清空、删除、取消转换） */
--primary-red-hover: #FF8888; /* 危险操作hover */
--primary-red-active: #FF5252;/* 危险操作active */
```

#### 文字颜色
```css
/* 浅色模式 */
--text-primary: #333333;      /* 主要文字、标题 */
--text-secondary: #818181;    /* 次要文字、标签 */
--text-tertiary: #999999;     /* 辅助文字、占位符 */
--text-muted: #AAAAAA;        /* 帮助说明文字 */
--text-disabled: #D3D3D3;     /* 禁用状态 */
--text-title: #2c3e50;        /* 导航标题 */

/* 暗黑模式 */
--text-primary-dark: #e0e0e0;
--text-secondary-dark: #999999;
--text-tertiary-dark: #808080;
--text-muted-dark: #666666;
--text-disabled-dark: #666666;
```

#### 背景颜色
```css
/* 浅色模式 */
--bg-base: #fcfcfc;           /* 页面基础背景（带点阵图案） */
--bg-elevated: #ffffff;       /* 卡片/弹窗/导航栏背景 */
--bg-input: #F3F3F3;          /* 输入框背景 */
--bg-hover: #F5F5F7;          /* Hover状态背景 */
--bg-active: #E8E8ED;         /* Active状态背景 */
--bg-overlay: rgba(255, 255, 255, 0.7); /* 拖拽覆盖层背景 */

/* 暗黑模式 */
--bg-base-dark: #1a1a1a;      /* 页面基础背景（带点阵图案） */
--bg-elevated-dark: #2a2a2a;  /* 卡片/弹窗背景 */
--bg-input-dark: #3a3a3a;     /* 输入框背景 */
--bg-hover-dark: #333333;     /* Hover状态背景 */
--bg-active-dark: #404040;    /* Active状态背景 */
--bg-overlay-dark: rgba(0, 0, 0, 0.7); /* 暗黑模式拖拽覆盖层背景 */
```

#### 边框颜色
```css
/* 浅色模式 */
--border-light: #F3F3F3;      /* 浅边框（输入框、分隔线） */
--border-base: #e3e3e3;       /* 基础边框（卡片、按钮） */
--border-medium: #CCCCCC;     /* 中等边框（hover状态） */
--border-strong: #5b5b5b;     /* 强调边框（active状态） */

/* 暗黑模式 */
--border-light-dark: #404040;
--border-base-dark: #404040;
--border-medium-dark: #505050;
--border-strong-dark: #666666;
```

#### 功能性颜色
```css
--success: #67c23a;           /* 成功状态 */
--warning: #e6a23c;           /* 警告状态 */
--danger: #ff4444;            /* 危险状态（清空/取消） */
--info: #909399;              /* 信息提示 */
--link: #409eff;              /* 链接颜色 */
--link-dark: #66b1ff;         /* 暗黑模式链接 */
```

### 1.2 字体系统

#### 字体家族
```css
--font-family-base: 'Segoe UI', 'Noto Sans SC', -apple-system, 
                    BlinkMacSystemFont, sans-serif;
```

#### 字号规范
```css
--font-size-xs: 10px;         /* 阶段/进度说明 */
--font-size-sm: 12px;         /* 标题标签、帮助说明、统计信息 */
--font-size-base: 13px;       /* 按钮文字、搜索框 */
--font-size-md: 14px;         /* 信息文字、输入框、素材名称 */
--font-size-lg: 16px;         /* 配置标签、选择器文字、空状态标题 */
--font-size-xl: 20px;         /* 空状态提示、大标题 */
--font-size-xxl: 120px;       /* 404错误码 */
```

#### 字重规范
```css
--font-weight-normal: 400;    /* 正常字重 */
--font-weight-medium: 500;    /* 中等字重 */
--font-weight-semibold: 600;  /* 半粗体（输入框、信息值） */
--font-weight-bold: 700;      /* 粗体（大标题） */
```

#### 行高规范
```css
--line-height-tight: 1.2;     /* 紧凑行高（导航标题） */
--line-height-base: 1.5;      /* 基础行高（按钮、输入框） */
--line-height-loose: 1.8;     /* 宽松行高（帮助文本） */
```

### 1.3 间距系统

基于 **4px 基准单位**（4px Grid System）：

```css
--space-1: 4px;               /* 0.25rem - 小间距、按钮内边距 */
--space-2: 8px;               /* 0.5rem - 组件内部间距、图标间距 */
--space-3: 12px;              /* 0.75rem - 组件之间间距、工具栏间距 */
--space-4: 16px;              /* 1rem - 区块间距、弹窗内边距 */
--space-5: 20px;              /* 1.25rem - 大组件间距、页面边距 */
--space-6: 24px;              /* 1.5rem - 大区块间距、配置项间距 */
--space-8: 32px;              /* 2rem - 大区域间距、空状态间距 */
--space-10: 40px;             /* 2.5rem - 页面边距、Help按钮大小 */
--space-12: 48px;             /* 3rem - 大页面边距 */
```

**常用场景**：
- 组件内部间距：8px、12px
- 组件之间间距：16px、20px
- 区块间距：24px、32px
- 页面边距：40px、48px
- 工具栏间距：6px、10px、12px
- 弹窗内边距：16px、20px

### 1.4 圆角系统

```css
--radius-none: 0;             /* 无圆角：进度条 */
--radius-sm: 8px;             /* 小组件：按钮、输入框、标签、Tooltip、文件名容器 */
--radius-md: 12px;            /* 中等组件：选择器、输入包裹器、大按钮 */
--radius-lg: 16px;            /* 大组件：弹窗、底部控制栏、Mini浮层 */
--radius-xl: 20px;            /* 超大组件：进度条滑块 */
--radius-full: 9999px;        /* 圆形：头像、颜色按钮、开关 */
```

### 1.5 阴影系统

```css
/* 浅色模式 */
--shadow-tooltip: 0px 6px 10px rgba(51, 51, 51, 0.2);      /* Tooltip阴影 */
--shadow-popup: 0px 2px 8px rgba(51, 51, 51, 0.2);         /* Help弹窗阴影 */
--shadow-panel: 0px 10px 32px rgba(51, 51, 51, 0.2);       /* 底部控制栏/侧边弹窗 */
--shadow-toast: 0px 4px 12px rgba(0, 0, 0, 0.15);          /* Toast提示 */
--shadow-dropdown: 0px 2px 8px rgba(0, 0, 0, 0.15);        /* 下拉菜单 */
--shadow-mini: 0px 10px 32px rgba(51, 51, 51, 0.2);        /* Mini浮层阴影 */

/* 暗黑模式 */
--shadow-tooltip-dark: 0px 6px 10px rgba(0, 0, 0, 0.5);
--shadow-popup-dark: 0px 2px 8px rgba(0, 0, 0, 0.5);
--shadow-panel-dark: 0px 10px 32px rgba(0, 0, 0, 0.5);
--shadow-toast-dark: 0px 4px 12px rgba(0, 0, 0, 0.5);
--shadow-dropdown-dark: 0px 4px 12px rgba(0, 0, 0, 0.5);
--shadow-mini-dark: 0px 10px 32px rgba(0, 0, 0, 0.4);      /* 暗黑模式Mini浮层阴影 */
```

### 1.6 过渡动画

```css
--transition-fast: 0.15s ease;       /* 快速响应：按钮点击、素材操作 */
--transition-base: 0.2s ease;        /* 基础过渡：hover状态、标签切换 */
--transition-slow: 0.3s ease;        /* 缓慢过渡：弹窗展开、主题切换、背景色 */
--transition-panel: 0.3s cubic-bezier(0.4, 0, 0.2, 1);  /* 侧边弹窗滑动 */
--transition-footer: 0.4s cubic-bezier(0.4, 0, 0.2, 1); /* 底部控制栏切换 */
```

### 1.7 动画关键帧

```css
/* 骨架屏加载旋转 */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 库加载指示器滑入 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
```

---

## 2. 组件规范

### 2.1 按钮组件（Button）

#### 主要按钮（Primary Button）
```html
<button class="btn-primary">主要操作</button>
```

```css
.btn-primary {
  height: 28px;
  padding: 0 16px;
  background: #ffffff;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  color: #333333;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.btn-primary:active {
  background: #eeeeee;
}

/* 暗黑模式 */
body.dark-mode .btn-primary {
  background: #2a2a2a;
  border-color: #404040;
  color: #e0e0e0;
}

body.dark-mode .btn-primary:hover {
  background: #333333;
  border-color: #505050;
}
```

#### 次要按钮（Secondary Button）
```html
<button class="btn-secondary">次要操作</button>
```

```css
.btn-secondary {
  height: 28px;
  padding: 0 16px;
  background: #5b5b5b;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #6b6b6b;
}

.btn-secondary:active {
  background: #4b4b4b;
}
```

#### 大号主要按钮（Large Primary Button）
```html
<button class="btn-large-primary">开始转换</button>
```

```css
.btn-large-primary {
  height: 44px;
  padding: 0 20px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e6e6e6;
  color: #333333;
  font-size: 14px;
  cursor: pointer;
  min-width: 110px;
}

.btn-large-primary:hover {
  background: #f3f3f3;
  border-color: #d3d3d3;
}

/* 暗黑模式 */
body.dark-mode .btn-large-primary {
  background: #1a1a1a;
  border-color: #404040;
  color: #e0e0e0;
}
```

#### 大号次要按钮（Large Secondary Button）
```html
<button class="btn-large-secondary">确定</button>
```

```css
.btn-large-secondary {
  height: 44px;
  padding: 0 20px;
  border-radius: 12px;
  background: #5b5b5b;
  border: 1px solid #5b5b5b;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  min-width: 110px;
}

.btn-large-secondary:hover {
  background: #555555;
  border-color: #000000;
}
```

#### 撤销按钮（Undo Button）
```html
<button class="btn-undo">撤销</button>
```

```css
.btn-undo {
  height: 44px;
  min-width: 80px;
  padding: 0 16px;
  border-radius: 12px;
  background: #ff9500; /* 橙色 */
  color: #ffffff;
  border: none;
  font-size: 14px;
}

.btn-undo:hover {
  background: #e68600;
}

.btn-undo:disabled {
  background: rgba(255, 149, 0, 0.5);
}
```

#### Tab 按钮（模块切换）
```html
<button class="tab-btn is-active">SVGA</button>
<button class="tab-btn">双通道MP4</button>
<button class="tab-btn">Lottie</button>
```

```css
.tab-btn {
  height: 28px;
  padding: 0 8px;
  background: #ffffff;
  border: 1px solid #f3f3f3;
  border-radius: 8px;
  color: #333333;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #fcfcfc;
  border-color: #e3e3e3;
}

.tab-btn.is-active {
  background: #5b5b5b;
  border-color: #5b5b5b;
  color: #ffffff;
}

.tab-btn.is-active:hover {
  border-color: #333333;
}

.tab-btn.is-active:active {
  background: #333333;
}

/* 暗黑模式 */
body.dark-mode .tab-btn {
  background: #1a1a1a;
  border-color: #404040;
  color: #e0e0e0;
}

body.dark-mode .tab-btn:hover {
  background: #333333;
  border-color: #555555;
}

body.dark-mode .tab-btn.is-active {
  background: #666666;
  border-color: #666666;
}
```

#### 清空画布按钮（带危险警告样式）
```html
<button class="clear-canvas-btn" title="清空画布">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M17 7L7 17" stroke="#333333" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M7 7L17 17" stroke="#333333" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</button>
```

```css
.clear-canvas-btn {
  width: 32px;
  height: 28px;
  background: #E6E6E6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s;
}

.clear-canvas-btn:hover {
  background: #FF8888;  /* 危险警告色 */
}

.clear-canvas-btn:active {
  background: #FF5252;
}

/* 暗黑模式 */
body.dark-mode .clear-canvas-btn {
  background: #404040;
}

body.dark-mode .clear-canvas-btn svg path {
  stroke: #e0e0e0;
}

body.dark-mode .clear-canvas-btn:hover {
  background: #FF8888;
}

body.dark-mode .clear-canvas-btn:hover svg path {
  stroke: #333333;
}
```

#### 图标按钮（Icon Button）
```html
<button class="zoom-btn" title="放大">
  <img class="zoom-icon" src="assets/img/zoom_in.png">
</button>
```

```css
.zoom-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.zoom-btn .zoom-icon {
  width: 28px;
  height: 28px;
  transition: opacity 0.2s;
}

.zoom-btn:hover .zoom-icon {
  opacity: 0;
}

.zoom-btn::after {
  content: '';
  position: absolute;
  width: 28px;
  height: 28px;
  opacity: 0;
  transition: opacity 0.2s;
  background-image: var(--zoom-hover-icon);
  background-size: contain;
}

.zoom-btn:hover::after {
  opacity: 1;
}
```

#### 播放/暂停按钮
```html
<button class="play-btn"></button>
<button class="play-btn is-playing"></button>
```

```css
.play-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background-color: transparent;
  background-image: url('assets/img/play_Default.png');
  background-size: 20px 20px;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  transition: all 0.2s;
}

.play-btn:hover {
  background-image: url('assets/img/play_hover.png');
}

.play-btn:active {
  background-image: url('assets/img/play_press.png');
}

/* 播放中状态（暂停按钮） */
.play-btn.is-playing {
  background-image: url('assets/img/stop_Default.png');
}

.play-btn.is-playing:hover {
  background-image: url('assets/img/stop_hover.png');
}

.play-btn.is-playing:active {
  background-image: url('assets/img/stop_press.png');
}

/* 暗黑模式 */
body.dark-mode .play-btn {
  background-image: url('assets/img/play_Default_dark.png');
}

body.dark-mode .play-btn:hover {
  background-image: url('assets/img/play_hover_dark.png');
}

body.dark-mode .play-btn.is-playing {
  background-image: url('assets/img/stop_Default_dark.png');
}
```

#### 静音按钮
```html
<button class="mute-btn"></button>
<button class="mute-btn is-muted"></button>
<button class="mute-btn is-disabled"></button>
```

```css
.mute-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background-color: transparent;
  background-image: url('assets/img/mute_Default.png');
  background-size: 20px 20px;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 4px;
}

/* 静音状态（已开启静音） */
.mute-btn.is-muted {
  background-image: url('assets/img/mute_on_Default.png');
}

/* 禁用状态（无音频） */
.mute-btn.is-disabled {
  background-image: url('assets/img/mute_disabled.png');
  cursor: not-allowed;
  opacity: 0.6;
}
```

#### Help按钮（固定位置 + 悬浮弹窗）
```html
<div class="help-button">
  <div class="help-popup">帮助内容...</div>
</div>
```

```css
.help-button {
  width: 40px;
  height: 40px;
  position: fixed;
  right: 8px;
  top: 44px;
  z-index: 1000;
  background: none;
  background-image: url('../img/help.png');
  background-size: 40px 40px;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}

.help-button:hover {
  background-image: url('../img/help_hover.png');
}

body.dark-mode .help-button {
  background-image: url('../img/help_dark.png');
}

body.dark-mode .help-button:hover {
  background-image: url('../img/help_hover_dark.png');
}

.help-button:hover .help-popup {
  visibility: visible;
  opacity: 1;
}

.help-popup {
  visibility: hidden;
  opacity: 0;
  position: fixed;
  top: 92px;
  right: 8px;
  width: 360px;
  max-height: 70vh;
  background: #FFFFFF;
  border: 1px solid #E3E3E3;
  box-shadow: 0px 2px 8px rgba(51, 51, 51, 0.2);
  border-radius: 16px;
  padding: 24px;
  overflow-y: auto;
  z-index: 2000;
  transition: opacity 0.2s, visibility 0.2s;
  font-size: 13px;
  line-height: 2;
  color: #5b5b5b;
}

body.dark-mode .help-popup {
  background: #2a2a2a;
  border-color: #404040;
  color: #999999;
}
```

### 2.2 输入框组件（Input）

#### 通用输入框系统

##### 基础输入框（Base Input）
```html
<input type="text" class="base-input" placeholder="请输入内容">
```

```css
.base-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  font-family: 'Segoe UI', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: #333333;
  text-align: center;
  outline: none;
}

/* 隐藏数字输入框箭头 */
.base-input::-webkit-outer-spin-button,
.base-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  margin: 0;
}

.base-input[type="number"] {
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
  appearance: textfield;
}

.base-input:disabled {
  color: #D3D3D3;
}

/* 暗黑模式 */
body.dark-mode .base-input {
  color: #cccccc;
}

body.dark-mode .base-input:disabled {
  color: #666666;
}
```

##### 输入框容器（Input Wrapper）
```html
<div class="input-wrapper input-wrapper--lg">
  <input type="text" class="base-input" placeholder="请输入内容">
  <span class="input-unit">px</span>
</div>
```

```css
.input-wrapper {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  gap: 4px;
  min-width: 50px;
  background: #F3F3F3;
  border: 2px solid #F3F3F3;
  border-radius: 12px;
  flex: none;
  flex-grow: 0;
}

.input-wrapper:hover {
  background: #FCFCFC;
  border: 2px solid #333333;
}

.input-wrapper:focus-within {
  background: #FFFFFF;
  border: 2px solid #333333;
}

/* 尺寸修饰符 */
.input-wrapper--sm {
  height: 32px;
  border-radius: 8px;
}

.input-wrapper--md {
  height: 40px;
}

.input-wrapper--lg {
  height: 44px;
}

/* 边框修饰符 */
.input-wrapper--thin {
  border-width: 1px;
}

.input-wrapper--thin:hover,
.input-wrapper--thin:focus-within {
  border-width: 1px;
}

/* 单位标签样式 */
.input-unit {
  font-family: 'Segoe UI', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: #333333;
  margin: 0;
  flex-shrink: 0;
}

/* 单位标签 - 提示文字样式 */
.input-unit--hint {
  font-size: 11px;
  font-weight: 400;
  color: #999999;
}

/* 暗黑模式 */
body.dark-mode .input-wrapper {
  background: #3a3a3a;
  border: 2px solid #3a3a3a;
}

body.dark-mode .input-wrapper:hover {
  background: #454545;
  border: 2px solid #999999;
}

body.dark-mode .input-wrapper:focus-within {
  background: #3a3a3a;
  border: 2px solid #999999;
}

body.dark-mode .input-unit {
  color: #cccccc;
}
```

##### 多行输入框（Textarea）
```html
<div class="input-wrapper input-wrapper--textarea input-wrapper--lg">
  <textarea class="base-input textarea-input textarea-input--lg" placeholder="请输入内容"></textarea>
</div>
```

```css
/* 多行输入框容器 */
.input-wrapper--textarea {
  width: 100%;
  height: auto;
  padding: 8px 12px;
  align-items: flex-start;
}

.input-wrapper--textarea-lg {
  min-height: 160px;
}

/* 多行输入框元素 */
.textarea-input {
  text-align: left;
  resize: none;
}

.textarea-input--sm {
  height: 60px;
}

.textarea-input--lg {
  height: 144px;
  overflow-y: auto;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE 10+ */
}

.textarea-input--lg::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari, Edge */
}
```

#### 选择器包裹器（用于下拉选择）
```html
<div class="mp4-select-wrapper" :class="{open: isOpen, disabled: isDisabled}">
  <span class="mp4-select-text">1920</span>
  <div class="mp4-select-icon"><svg>...</svg></div>
  <div class="mp4-select-dropdown">
    <div class="mp4-select-option">1920</div>
    <div class="mp4-select-option selected">1280</div>
  </div>
</div>
```

```css
.mp4-select-wrapper {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  gap: 4px;
  width: 218px;
  min-width: 200px;
  height: 44px;
  background: #F3F3F3;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.mp4-select-wrapper:hover {
  background: #FCFCFC;
  border: 1px solid #333333;
}

.mp4-select-wrapper:active {
  background: #FFFFFF;
  border: 2px solid #333333;
  padding: 0 14px;
}

.mp4-select-text {
  font-weight: 600;
  font-size: 16px;
  color: #333333;
}

/* 暗黑模式 */
body.dark-mode .mp4-select-wrapper {
  background: #3a3a3a;
  border: none;
}

body.dark-mode .mp4-select-text {
  color: #cccccc;
}

/* 禁用状态 */
.mp4-select-wrapper.disabled {
  background: #F3F3F3;
  border: 1px solid #E6E6E6;
  cursor: not-allowed;
  pointer-events: none;
}

.mp4-select-wrapper.disabled .mp4-select-text {
  color: #D3D3D3;
}
```

#### 数字输入框
```html
<div class="mp4-size-input-wrapper">
  <input type="number" class="mp4-input" :value="width" :disabled="isDisabled">
</div>
```

```css
.mp4-size-input-wrapper {
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  width: 73px;
  min-width: 50px;
  height: 44px;
  background: #F3F3F3;
  border: none;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.mp4-size-input-wrapper:hover {
  background: #FCFCFC;
  border: 1px solid #333333;
  padding: 0 15px;
}

.mp4-size-input-wrapper:focus-within {
  background: #FFFFFF;
  border: 2px solid #5B5B5B;
  padding: 0 14px;
}

.mp4-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  font-weight: 600;
  font-size: 16px;
  color: #333333;
  text-align: center;
  outline: none;
}

/* 隐藏数字输入框的上下箭头 */
.mp4-input::-webkit-outer-spin-button,
.mp4-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 禁用状态 */
.mp4-input:disabled {
  color: #D3D3D3;
  cursor: not-allowed;
}

/* 暗黑模式 */
body.dark-mode .mp4-size-input-wrapper {
  background: #3a3a3a;
}

body.dark-mode .mp4-input {
  color: #cccccc;
}

body.dark-mode .mp4-input:disabled {
  color: #666666;
}
```

#### 搜索输入框
```html
<div class="material-search">
  <input type="text" class="material-search-input" placeholder="搜索素材...">
</div>
```

```css
.material-search {
  width: 100%;
  margin-top: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  gap: 4px;
  min-width: 50px;
  height: 36px;
  background: #F3F3F3;
  border: 2px solid #F3F3F3;
  border-radius: 8px;
  flex: none;
  flex-grow: 0;
  transition: all 0.3s;
}

.material-search:hover {
  background: #FCFCFC;
  border: 2px solid #333333;
}

.material-search:focus-within {
  background: #FFFFFF;
  border: 2px solid #333333;
}

.material-search-input {
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  border-radius: 0;
  font-family: 'Segoe UI';
  font-size: 14px;
  color: #333333;
  background: transparent;
  outline: none;
  transition: all 0.3s;
}

.material-search-input::placeholder {
  color: #999999;
}

.material-search-input:focus {
  outline: none;
}

/* 暗黑模式 */
body.dark-mode .material-search {
  background: #3a3a3a;
  border: 2px solid #3a3a3a;
}

body.dark-mode .material-search:hover {
  background: #454545;
  border: 2px solid #999999;
}

body.dark-mode .material-search:focus-within {
  background: #3a3a3a;
  border: 2px solid #999999;
}

body.dark-mode .material-search-input {
  color: #e0e0e0;
  background: transparent;
  border-color: transparent;
}

body.dark-mode .material-search-input::placeholder {
  color: #666666;
}

body.dark-mode .material-search-input:focus {
  border-color: #00b4ff;
}
```

### 2.3 开关组件（Toggle Switch）

```html
<div class="mp4-mute-toggle" :class="{active: isActive, disabled: isDisabled}" @click="toggle">
  <div class="mp4-mute-toggle-handle"></div>
</div>
```

```css
.mp4-mute-toggle {
  width: 46px;
  height: 26px;
  background: #5B5B5B;       /* 关闭状态 */
  border-radius: 100px;
  cursor: pointer;
  position: relative;
  transition: background 0.3s;
}

.mp4-mute-toggle.active {
  background: #409EFF;       /* 开启状态 */
}

.mp4-mute-toggle.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.mp4-mute-toggle-handle {
  width: 24px;
  height: 24px;
  background: #FFFFFF;
  border-radius: 50%;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: transform 0.3s;
}

.mp4-mute-toggle.active .mp4-mute-toggle-handle {
  transform: translateX(20px);
}

/* 暗黑模式 */
body.dark-mode .mp4-mute-toggle {
  background: #5B5B5B;
}

body.dark-mode .mp4-mute-toggle.active {
  background: #409EFF;
}
```

### 2.4 文件名容器（File Name Box）

```html
<div class="file-name-box">
  <span class="file-name-label">示例文件.svga</span>
</div>
```

```css
.file-name-box {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid #F3F3F3;
  border-radius: 8px;
}

.file-name-label {
  font-size: 13px;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* 暗黑模式 */
body.dark-mode .file-name-box {
  background: #2a2a2a;
  border-color: #404040;
}

body.dark-mode .file-name-label {
  color: #e0e0e0;
}
```

### 2.5 播放进度条组件

```html
<div class="progress-bar" @click="onProgressBarClick">
  <div class="progress-fill" :style="{width: progress + '%'}"></div>
  <div class="progress-thumb" :style="{left: progress + '%'}"></div>
</div>
<span class="progress-text">
  <span class="progress-time">12:00</span>
  <span>/</span>
  <span class="progress-time">60:00</span>
  <span class="progress-frames">120/600</span>
</span>
```

```css
.progress-bar {
  width: 260px;
  height: 16px;
  background-color: #f3f3f3;
  border-radius: 20px;           /* 圆角 */
  position: relative;
  cursor: pointer;
}

.progress-bar:hover {
  border-color: #E6E6E6;
}

.progress-fill {
  height: 100%;
  background-color: #5B5B5B;
  border-radius: 10px 0 0 10px;
  transition: width 0.1s;
  pointer-events: none;
}

.progress-fill:hover {
  background-color: #333333;
}

/* 进度条滑块 */
.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background-color: #5B5B5B;
  border-radius: 50%;
  cursor: grab;
  transition: left 0.1s, transform 0.1s, box-shadow 0.1s;
  z-index: 2;
  pointer-events: auto;
}

.progress-thumb:hover {
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
  background-color: #409eff;
}

.progress-thumb:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 0 0 6px rgba(64, 158, 255, 0.3);
  background-color: #409eff;
}

.progress-text {
  margin-left: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Segoe UI', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.33;
  color: #818181;
  white-space: nowrap;
}

.progress-time {
  min-width: 45px;
}

.progress-frames {
  min-width: 60px;
}

/* 暗黑模式 */
body.dark-mode .progress-bar {
  background-color: #5B5B5B;
}

body.dark-mode .progress-fill {
  background-color: #EBEBEB;
}

body.dark-mode .progress-fill:hover {
  background-color: #f5f5f5;
}

body.dark-mode .progress-thumb {
  background-color: #EBEBEB;
}

body.dark-mode .progress-thumb:hover {
  background-color: #409eff;
}

body.dark-mode .progress-text {
  color: #999999;
}
```

### 2.6 Tooltip 提示框

```html
<div class="tooltip">
  <button class="theme-toggle">
    <svg>...</svg>
    <span class="tooltip-text">切换主题</span>
  </button>
</div>
```

```css
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltip-text {
  visibility: hidden;
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffffff;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
  line-height: 1.33;
  color: #818181;
  white-space: nowrap;
  box-shadow: 0px 6px 10px rgba(51, 51, 51, 0.2);
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.2s, visibility 0.2s;
}

/* 箭头 */
.tooltip .tooltip-text::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #ffffff transparent transparent transparent;
}

/* 显示状态 */
.tooltip:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

/* 主题切换按钮的tooltip在下方 */
.theme-toggle .tooltip-text {
  bottom: auto;
  top: 125%;
}

.theme-toggle .tooltip-text::after {
  top: auto;
  bottom: 100%;
  border-color: transparent transparent #ffffff transparent;
}

/* 暗黑模式 */
body.dark-mode .tooltip .tooltip-text {
  background-color: #2a2a2a;
  border-color: #404040;
  color: #999999;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.5);
}

body.dark-mode .tooltip .tooltip-text::after {
  border-color: #2a2a2a transparent transparent transparent;
}

body.dark-mode .theme-toggle .tooltip-text::after {
  border-color: transparent transparent #2a2a2a transparent;
}
```

### 2.7 侧边弹窗组件（Side Panel）

本项目使用右侧滑出式弹窗，包括：素材替换弹窗、SVGA转MP4弹窗、MP4转SVGA弹窗

```html
<div class="material-panel" :class="{show: showMaterialPanel}">
  <div class="material-panel-container">
    <!-- 弹窗内容 -->
  </div>
</div>
```

```css
/* 侧边弹窗基础样式 */
.material-panel {
  position: fixed;
  top: 0;
  right: -400px;              /* 隐藏在右侧 */
  width: 400px;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}

.material-panel.show {
  right: 0;                   /* 滑入显示 */
}

.material-panel-container {
  display: flex;
  flex-direction: column;
  width: 380px;
  height: 100%;
  padding: 20px;
  gap: 16px;
  background: #FFFFFF;
  border: 1px solid #E3E3E3;
  box-shadow: 0px 10px 32px rgba(51, 51, 51, 0.2);
  border-radius: 16px;
  overflow-y: auto;
}

body.dark-mode .material-panel-container {
  background: #1a1a1a;
  border-color: #404040;
  box-shadow: 0px 10px 32px rgba(0, 0, 0, 0.5);
}

/* 弹窗内部结构 */
.material-panel-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-header {
  font-size: 12px;
  line-height: 16px;
  color: #818181;
}

.stats-divider {
  width: 100%;
  height: 1px;
  background: #F3F3F3;
}

body.dark-mode .stats-divider {
  background: #404040;
}

.stats-title {
  font-size: 14px;
  line-height: 19px;
  color: #333333;
}

body.dark-mode .stats-title {
  color: #e0e0e0;
}

.stats-help {
  font-size: 12px;
  line-height: 16px;
  color: #AAAAAA;
}

body.dark-mode .stats-help {
  color: #666666;
}
```

### 2.8 音量控制组件（Volume Control）

```html
<div class="volume-control">
  <button class="mute-btn" :class="{is-muted: isMuted, is-disabled: isDisabled}"></button>
  <input type="range" class="volume-slider" min="0" max="100" v-model="volume">
</div>
```

```css
/* 音量按钮 */
.mute-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background-color: transparent;
  background-image: url('../img/controls-sprite.png');
  background-size: 400px 360px;
  background-position: -240px -40px;
  background-repeat: no-repeat;
  cursor: pointer;
  outline: none;
  margin-left: 4px;
}

.mute-btn:hover {
  background-position: -280px -40px;
}

.mute-btn:active {
  background-position: -320px -40px;
}

/* 静音状态 */
.mute-btn.is-muted {
  background-position: -360px -40px;
}

.mute-btn.is-muted:hover {
  background-position: 0px -80px;
}

.mute-btn.is-muted:active {
  background-position: -40px -80px;
}

/* 禁用状态（无音频） */
.mute-btn.is-disabled {
  background-position: -80px -80px;
  cursor: not-allowed;
  pointer-events: none;
}

/* 暗黑模式 */
body.dark-mode .mute-btn {
  background-position: -120px -80px;
}

body.dark-mode .mute-btn:hover {
  background-position: -160px -80px;
}

body.dark-mode .mute-btn:active {
  background-position: -200px -80px;
}

body.dark-mode .mute-btn.is-muted {
  background-position: -240px -80px;
}

body.dark-mode .mute-btn.is-muted:hover {
  background-position: -280px -80px;
}

body.dark-mode .mute-btn.is-muted:active {
  background-position: -320px -80px;
}

body.dark-mode .mute-btn.is-disabled {
  background-position: -360px -80px;
}

/* 音量滑块 */
.volume-slider {
  width: 80px;
  height: 4px;
  background: #f3f3f3;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  margin-left: 8px;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #5b5b5b;
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #5b5b5b;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

body.dark-mode .volume-slider {
  background: #5b5b5b;
}

body.dark-mode .volume-slider::-webkit-slider-thumb {
  background: #e0e0e0;
}

body.dark-mode .volume-slider::-moz-range-thumb {
  background: #e0e0e0;
}
```

### 2.9 Toast提示组件

```html
<div class="toast-container">
  <div class="toast-message">已复制到剪贴板</div>
</div>
```

```css
.toast-container {
  position: fixed;
  top: 48px;               /* 在header-navbar下方24px */
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}

.toast-message {
  background: #ffffff;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  color: #333333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  max-width: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
}

body.dark-mode .toast-message {
  background: #2a2a2a;
  border-color: #404040;
  color: #cccccc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
```

### 2.9 库加载进度指示器

```html
<div class="library-loading-indicator">
  <div class="loading-content">
    <span class="loading-text">正在加载ffmpeg.wasm...</span>
    <span class="loading-percentage">45%</span>
  </div>
  <div class="loading-bar">
    <div class="loading-progress" style="width: 45%;"></div>
  </div>
</div>
```

```css
.library-loading-indicator {
  position: fixed;
  top: 16px;
  width: 400px;
  max-width: 50%;
  background: #ffffff;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 999;
  animation: slideDown 0.3s ease;
}

.library-loading-indicator .loading-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.library-loading-indicator .loading-text {
  font-size: 13px;
  color: #818181;
  font-weight: 400;
}

.library-loading-indicator .loading-percentage {
  font-size: 12px;
  color: #999999;
  font-weight: 500;
}

.library-loading-indicator .loading-bar {
  width: 100%;
  height: 4px;
  background: #f3f3f3;
  border-radius: 2px;
  overflow: hidden;
}

.library-loading-indicator .loading-progress {
  height: 100%;
  background: #409eff;        /* 主色调 */
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 暗黑模式 */
body.dark-mode .library-loading-indicator {
  background: #2a2a2a;
  border-color: #404040;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

body.dark-mode .library-loading-indicator .loading-text {
  color: #a0a0a0;
}

body.dark-mode .library-loading-indicator .loading-bar {
  background: #404040;
}
```

### 2.10 音量控制组件（Volume Control）

```html
<div class="mute-control-container">
  <button class="mute-btn"></button>
  <div class="volume-slider-container">
    <div class="volume-slider-track">
      <div class="volume-slider-fill" :style="{height: volume + '%'}"></div>
      <div class="volume-slider-handle" :style="{bottom: volume + '%'}"></div>
    </div>
  </div>
</div>
```

```css
/* 静音控制容器 */
.mute-control-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 迷你模式下的静音控制容器 */
.mute-control-container.mini-mute-control {
  gap: 6px;
}

/* 音量滑块容器 */
.volume-slider-container {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  padding-bottom: 8px;
  width: 24px;
  height: 80px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
  z-index: 100;
}

/* 迷你模式下的音量滑块 */
.volume-slider-container.mini-volume-slider {
  height: 60px;
  margin-bottom: 6px;
}

/* 鼠标悬停时显示音量滑块 */
.mute-control-container:hover .volume-slider-container {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}

/* 音量滑块轨道 */
.volume-slider-track {
  position: relative;
  width: 8px;
  height: 100%;
  background-color: #f3f3f3;
  border-radius: 8px;
  margin: 0 10px;
  cursor: pointer;
}

/* 音量滑块填充 */
.volume-slider-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #5B5B5B;
  border-radius: 8px;
  transition: height 0.1s ease;
}

/* 音量滑块手柄 */
.volume-slider-handle {
  position: absolute;
  left: 50%;
  transform: translateX(-50%) translateY(50%);
  width: 12px;
  height: 12px;
  background-color: #5B5B5B;
  border-radius: 50%;
  cursor: grab;
  transition: bottom 0.1s ease, transform 0.1s ease, box-shadow 0.1s ease;
  z-index: 2;
  pointer-events: auto;
}

.volume-slider-handle:hover {
  transform: translateX(-50%) translateY(50%) scale(1.2);
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
  background-color: #409eff;
}

.volume-slider-handle:active {
  cursor: grabbing;
  transform: translateX(-50%) translateY(50%) scale(1.3);
  box-shadow: 0 0 0 6px rgba(64, 158, 255, 0.3);
  background-color: #409eff;
}

/* 暗黑模式 */
body.dark-mode .volume-slider-track {
  background-color: #5B5B5B;
}

body.dark-mode .volume-slider-fill {
  background-color: #EBEBEB;
}

body.dark-mode .volume-slider-handle {
  background-color: #EBEBEB;
}

body.dark-mode .volume-slider-handle:hover {
  background-color: #409eff;
}
```

### 2.11 素材管理组件（Material Management）

#### 素材卡片（Material Item）
```html
<div class="material-item">
  <div class="material-thumb">
    <img src="material-preview.png" alt="素材预览">
  </div>
  <div class="material-info">
    <div class="material-name-row">
      <span class="material-name">素材名称</span>
      <button class="material-btn-copy" title="复制路径">
        <svg>...</svg>
      </button>
    </div>
    <div class="material-meta">1024x768 • PNG</div>
  </div>
  <div class="material-actions">
    <button class="material-btn-replace">替换</button>
    <button class="material-btn-close">恢复</button>
    <button class="material-btn-new">新建</button>
  </div>
</div>
```

```css
/* 素材卡片（列表样式）*/
.material-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 161px;
  align-items: flex-start;
  padding: 0px;
  gap: 10px;
  height: auto;
  flex: none;
}

/* 缩略图 */
.material-thumb {
  width: 161px;
  height: 100px;
  flex: none;
  order: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: background-color 0.3s;
}

.material-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 素材信息区 */
.material-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 161px;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  height: 59px;
  flex: none;
  order: 1;
  align-self: stretch;
}

/* 素材名称行 */
.material-name-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 161px;
  flex: none;
  order: 0;
  align-self: stretch;
}

.material-name {
  flex: 1;
  height: 19px;
  font-family: 'Segoe UI';
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 19px;
  display: flex;
  align-items: center;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s;
}

/* 复制按钮 */
.material-btn-copy {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.material-btn-copy:hover {
  opacity: 1;
}

.material-meta {
  width: 161px;
  height: 16px;
  font-family: 'Segoe UI';
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  display: flex;
  align-items: center;
  color: #333333;
  flex: none;
  align-self: stretch;
}

/* 操作按钮区 */
.material-actions {
  width: 161px;
  height: 28px;
  flex: none;
  order: 2;
  align-self: stretch;
  position: relative;
  display: flex;
  justify-content: flex-start;
  flex-direction: row;
  gap: 4px;
}

/* 暗黑模式 */
body.dark-mode .material-name {
  color: #e0e0e0;
}

body.dark-mode .material-meta {
  color: #8e8e93;
}

body.dark-mode .material-btn-copy svg rect {
  stroke: #999999;
  fill: #2a2a2a;
}

body.dark-mode .material-btn-copy svg rect:first-child {
  fill: none;
}
```

### 2.12 沉浸模式组件（Immersive Mode）

#### Mini浮层（Footer Mini）
```html
<div class="footer-mini">
  <button class="mini-play-btn"></button>
  <button class="mini-mute-btn"></button>
  <button class="mini-scale-btn"></button>
  <button class="mini-maximize-btn"></button>
</div>
```

```css
/* Mini浮层容器 */
.footer-mini {
  display: flex;
  position: absolute;
  top: 114px;
  align-items: center;
  gap: 12px;
  height: 68px;
  padding: 0 20px;
  background-color: #ffffff;
  border: 1px solid #e6e6e6;
  border-radius: 16px;
  box-shadow: 0px 10px 32px 0px rgba(51, 51, 0, 0.2);
  z-index: 10;
}

body.dark-mode .footer-mini {
  background-color: #2a2a2a;
  border-color: #404040;
  box-shadow: 0px 10px 32px 0px rgba(0, 0, 0, 0.4);
}
```

### 2.13 主题切换按钮（Theme Toggle）

```html
<button class="theme-toggle" title="切换主题">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
  </svg>
  <span class="tooltip-text">切换主题</span>
</button>
```

```css
.theme-toggle {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s;
  flex-shrink: 0;
}

.theme-toggle:hover {
  opacity: 0.7;
}

.theme-toggle svg {
  width: 20px;
  height: 20px;
  fill: #2c3e50;
  transition: fill 0.3s;
}

body.dark-mode .theme-toggle svg {
  fill: #e0e0e0;
}

/* 主题切换按钮的tooltip在下方 */
.theme-toggle .tooltip-text {
  bottom: auto;
  top: 125%;
}

.theme-toggle .tooltip-text::after {
  top: auto;
  bottom: 100%;
  border-color: transparent transparent #ffffff transparent;
}

body.dark-mode .theme-toggle .tooltip-text::after {
  border-color: transparent transparent #2a2a2a transparent;
}
```

### 2.14 导航栏组件（Header Navbar）

```html
<header class="header-navbar">
  <div class="header-left-action">
    <img class="header-logo" src="logo.png" alt="Logo">
  </div>
  <h1 class="header-navbar-title">SVGA Preview</h1>
  <div class="header-right-action">
    <a href="#" class="nav-link">文档</a>
    <a href="#" class="avatar-link">
      <img class="avatar-icon" src="avatar.png" alt="用户头像">
    </a>
    <button class="theme-toggle">...</button>
  </div>
</header>
```

```css
.header-logo {
  height: 24px;
  width: auto;
  margin-right: 12px;
  content: url('../img/logo.png');
  transition: all 0.2s ease;
}

.header-logo:hover {
  content: url('../img/logo_hover.png');
}

body.dark-mode .header-logo {
  content: url('../img/logo_dark.png');
}

body.dark-mode .header-logo:hover {
  content: url('../img/logo_hover.png');
}

.header-navbar {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  position: absolute;
  z-index: 100;
  transition: background-color 0.3s, border-color 0.3s, transform 0.3s ease, opacity 0.3s ease;
}

.nav-link {
  font-family: 'Noto Sans SC', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 1.2;
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.3s;
  flex-shrink: 0;
}

.nav-link:hover {
  opacity: 0.7;
  text-decoration: underline;
}

body.dark-mode .nav-link {
  color: #66b1ff;
}

.avatar-link {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  transition: opacity 0.3s;
}

.avatar-link:hover .avatar-icon {
  opacity: 0.7;
}

body.dark-mode .header-navbar {
  background-color: transparent;
  border-bottom-color: transparent;
}

.header-navbar-title {
  font-family: 'Noto Sans SC', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.2;
  color: #2c3e50;
  transition: color 0.3s;
  flex: 1;
  text-align: center;
}

body.dark-mode .header-navbar-title {
  color: #e0e0e0;
}

/* 左侧操作按钮 */
.header-left-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  position: absolute;
  left: 16px;
  top: 16px;
}

/* 右侧操作按钮 */
.header-right-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  position: absolute;
  right: 16px;
  top: 16px;
}

/* 导航栏隐藏时的动画 */
.header-navbar.header-hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
```

### 2.15 拖拽覆盖层组件（Drop Overlay）

```html
<div class="drop-overlay show">
  <div class="drop-hint">
    <span class="drop-hint-text">拖拽文件到此处</span>
  </div>
</div>
```

```css
/* 全屏拖拽覆盖层（默认隐藏，拖拽时显示） */
.drop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  /* 默认不阻挡点击 */
  transition: opacity 0.2s ease;
}

.drop-overlay.show {
  opacity: 1;
  pointer-events: auto;
  /* 显示时可接收拖拽事件 */
}

/* 拖拽提示 */
.drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  outline: 4px dashed #333333;
  outline-offset: -80px;
  border-radius: 100px;
  width: 100%;
  height: 100%;
  /* margin: 60px 24px 24px 24px; */
  justify-content: center;
  box-sizing: border-box;
}

.drop-hint-text {
  font-size: 40px;
  font-weight: 500;
  color: #333333;
}

/* 暗黑模式 */
body.dark-mode .drop-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}

body.dark-mode .drop-hint {
  outline: 4px dashed #F5F5F5;
}

body.dark-mode .drop-hint-text {
  color: #F5F5F5;
}
```

---

## 3. 布局规范

### 3.1 Flex 布局使用规范

#### 水平居中
```css
.flex-center-horizontal {
  display: flex;
  justify-content: center;
}
```

#### 垂直居中
```css
.flex-center-vertical {
  display: flex;
  align-items: center;
}

```

#### 完全居中
```css
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### 水平分布（两端对齐）
```css
.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

#### 水平分布（等间距）
```css
.flex-around {
  display: flex;
  align-items: center;
  gap: 12px; /* 推荐使用 gap 代替 justify-content: space-around */
}
```

#### 垂直分布
```css
.flex-column {
  display: flex;
  flex-direction: column;
}

.flex-column-between {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
```

### 3.2 间距使用规范

#### 组件内部间距（Padding）
```css
/* 紧凑型组件 */
.component-compact {
  padding: 8px 12px;
}

/* 标准组件 */
.component-standard {
  padding: 12px 16px;
}

/* 宽松组件 */
.component-loose {
  padding: 16px 24px;
}

/* 大型容器 */
.container-large {
  padding: 24px 32px;
}
```

#### 组件间距（Gap/Margin）
```css
/* 小间距 */
.gap-sm {
  gap: 8px;
}

/* 标准间距 */
.gap-base {
  gap: 12px;
}

/* 中等间距 */
.gap-md {
  gap: 16px;
}

/* 大间距 */
.gap-lg {
  gap: 24px;
}

/* 工具间距 */
.tool-gap-xs {
  gap: 4px;
}

.tool-gap-sm {
  gap: 6px;
}

.tool-gap-md {
  gap: 10px;
}
```

### 3.3 栅格系统

基于 12 列栅格系统：

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -12px;
}

.col {
  padding: 0 12px;
}

.col-6 {
  width: 50%;
}

.col-4 {
  width: 33.333%;
}

.col-3 {
  width: 25%;
}

.col-2 {
  width: 16.666%;
}
```

### 3.4 播放器布局系统

#### 整体结构

```
.main-page
├─ .header-navbar            ← 顶部导航栏（绝对定位）
├─ .viewer-area              ← 主播放区域（Flexbox 布局）
│   ├─ .viewer-container      ← 播放器容器（由 JS 控制 transform）
│   │   ├─ .viewer-filename   ← 文件名（绝对定位于播放器上方）
│   │   └─ .viewer-canvas     ← 播放器画布（包含 canvas 元素）
│   ├─ .empty-state-overlay   ← 空状态覆盖层
│   └─ .drop-overlay          ← 拖拽覆盖层
└─ .footer-bar               ← 底部控制栏（绝对定位）
    └─ .footer-mini           ← 沉浸模式 Mini 浮层
```

#### .viewer-area（主播放区域）

```css
/* 结构：占据除顶栏外的所有空间
 * 布局控制：
 *   - align-items: flex-start → 子元素从顶部开始，不自动垂直居中
 *   - justify-content: center → 子元素水平居中
 *   - padding-bottom: 190px → 为 .footer-bar 留空间，确保拖拽虚线边界不超出屏幕
 * 位置控制：子元素 .viewer-container 的垂直位置由 JS 的 offsetY 控制（通过 transform: translateY）
 */
.viewer-area {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
}
```

#### .viewer-container（播放器容器）

```css
/* 结构：包裹文件名 + 播放器画布，大小由 JS 设置为原始尺寸
 * 缩放机制：
 *   - transform-origin: top center → 缩放原点在顶部中心，缩放时视觉顶部保持在 y=0 处
 *   - transform: translate + scale → 由 JS 动态设置，translate 控制位置，scale 控制缩放
 * 关键设计：
 *   - 使用 top center 而非 center center，避免缩放后视觉顶部位置偏移导致内容显示偏下
 *   - width/height 为原始尺寸，缩放通过 transform: scale() 实现，保证布局计算正确
 */
.viewer-container {
  position: relative;
  transform-origin: top center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
```

#### JS 控制逻辑

| 函数 | 功能 | 说明 |
|------|------|------|
| `getContentOriginalSize()` | 获取内容原始尺寸 | 返回 `{width, height}`，统一处理 SVGA/Lottie/YYEVA/MP4 |
| `centerViewer()` | 垂直居中 | 计算 offsetY = (可用高度 - 内容高度) / 2 |
| `applyZoomWithCenterPoint()` | 中心点缩放 | offsetY -= heightDiff / 2，补偿 transform-origin: top center |
| `viewerContainerStyle()` | 容器样式 | 返回 width/height/transform/cursor |
| `viewerFilenameStyle()` | 文件名样式 | 反向 scale 保持字体大小不变 |

#### 居中计算逻辑

```javascript
// centerViewer() 的计算逻辑
var footerHeight = 190;  // 底部浮层高度
var availableHeight = window.innerHeight - footerHeight;  // 可用高度
var contentHeight = originalHeight * viewerScale;  // 内容显示高度

if (contentHeight < availableHeight) {
  offsetY = (availableHeight - contentHeight) / 2;  // 居中
} else {
  offsetY = 0;  // 顶部对齐
}
```

#### 缩放中心点补偿逻辑

```javascript
// applyZoomWithCenterPoint() 的计算逻辑
// 问题：transform-origin: top center 让顶部固定，底部移动
// 解决：调整 offsetY 让中心点相对屏幕位置不变

var heightDiff = newHeight - oldHeight;  // 高度变化量
offsetY -= heightDiff / 2;  // 向上移动补偿
```

#### 文件名反向缩放逻辑

```javascript
// viewerFilenameStyle() 的计算逻辑
// 问题：父容器 scale 会导致文件名跟着缩放
// 解决：反向 scale 抵消父容器的缩放

var inverseScale = 1 / viewerScale;
style.transform = 'scale(' + inverseScale + ')';
style.transformOrigin = 'left bottom';
style.marginBottom = (8 * viewerScale) + 'px';  // 补偿边距
```

### 3.5 底部控制栏布局

#### .footer-bar（底部控制栏）

```css
/* 结构：固定宽度的底部控制栏，包含多个功能模块
 * 定位方式：绝对定位，水平居中
 * 响应式：根据内容状态调整大小和位置
 */
.footer-bar {
  position: absolute;
  top: calc(100vh - 190px);
  left: calc((100vw - 1020px) / 2);
  right: calc((100vw - 1020px) / 2);
  width: 1020px;
  height: 190px;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: center;
  padding: 10px;
  gap: 10px;
  transition: background-color 0.3s, height 0.3s ease, top 0.3s ease, left 0.3s ease, right 0.3s ease, width 0.3s ease;
  z-index: 130;
}

/* 空状态 */
.footer-bar.is-empty {
  top: 540px;
  width: 300px;
  height: 120px;
  left: calc((100vw - 300px) / 2);
  right: calc((100vw - 300px) / 2);
}

/* 沉浸模式 */
.footer-bar.footer-immersive {
  height: 88px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 3.6 顶部导航栏布局

#### .header-navbar（顶部导航栏）

```css
/* 结构：固定高度的顶部导航栏，包含 Logo、标题和操作按钮
 * 定位方式：绝对定位，顶部对齐
 * 布局控制：flex 布局，两端对齐 + 居中标题
 */
.header-navbar {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  position: absolute;
  z-index: 100;
  transition: background-color 0.3s, border-color 0.3s, transform 0.3s ease, opacity 0.3s ease;
}

/* 左侧操作区 */
.header-left-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  position: absolute;
  left: 16px;
  top: 16px;
}

/* 右侧操作区 */
.header-right-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  position: absolute;
  right: 16px;
  top: 16px;
}

/* 标题区域 */
.header-navbar-title {
  font-family: 'Noto Sans SC', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.2;
  color: #2c3e50;
  transition: color 0.3s;
  flex: 1;
  text-align: center;
}
```

### 3.7 侧边弹窗布局

#### .material-panel（侧边弹窗）

```css
/* 结构：右侧滑出式弹窗，包含标题、统计信息和操作按钮
 * 定位方式：固定定位，右侧滑出
 * 动画：使用 CSS transition 实现平滑滑入滑出效果
 */
.material-panel {
  position: fixed;
  top: 0;
  right: -400px;              /* 隐藏在右侧 */
  width: 400px;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}

.material-panel.show {
  right: 0;                   /* 滑入显示 */
}

.material-panel-container {
  display: flex;
  flex-direction: column;
  width: 380px;
  height: 100%;
  padding: 20px;
  gap: 16px;
  background: #FFFFFF;
  border: 1px solid #E3E3E3;
  box-shadow: 0px 10px 32px rgba(51, 51, 51, 0.2);
  border-radius: 16px;
  overflow-y: auto;
}
```

### 3.8 响应式布局规范

#### 断点设置

| 断点名称 | 屏幕宽度 | 布局调整 |
|---------|---------|---------|
| 移动端 | < 768px | 单栏布局，隐藏侧边栏 |
| 平板 | 768px - 1024px | 双栏布局，调整组件大小 |
| 桌面 | > 1024px | 完整布局，三栏结构 |

#### 响应式工具类

```css
/* 移动端隐藏 */
@media (max-width: 767px) {
  .hidden-mobile {
    display: none !important;
  }
}

/* 平板隐藏 */
@media (max-width: 1023px) {
  .hidden-tablet {
    display: none !important;
  }
}

/* 桌面隐藏 */
@media (min-width: 1024px) {
  .hidden-desktop {
    display: none !important;
  }
}

/* 响应式字体大小 */
@media (max-width: 767px) {
  .responsive-text {
    font-size: 14px;
  }
}

@media (min-width: 768px) {
  .responsive-text {
    font-size: 16px;
  }
}
```

---

## 4. 交互规范

### 4.1 状态变化

#### Hover 状态
- **视觉反馈**：背景色变化、边框色变化、透明度变化
- **过渡时间**：0.2s ease
- **适用场景**：按钮、链接、可点击元素

```css
.interactive-element:hover {
  background: #f5f5f5;
  transition: all 0.2s ease;
}
```

#### Active 状态
- **视觉反馈**：背景色进一步加深
- **过渡时间**：无（立即响应）
- **适用场景**：按钮按下、拖拽操作

```css
.interactive-element:active {
  background: #eeeeee;
}
```

#### Focus 状态
- **视觉反馈**：蓝色外发光边框
- **颜色**：#409eff，透明度 0.1
- **适用场景**：输入框、可聚焦元素

```css
.interactive-element:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}
```

#### Disabled 状态
- **视觉反馈**：降低透明度、禁用鼠标指针
- **透明度**：0.5
- **适用场景**：禁用的按钮、输入框

```css
.interactive-element:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 4.2 过渡动画时长

| 动画类型 | 时长 | 适用场景 |
|---------|------|---------|
| 快速 | 0.15s | 按钮 hover、小元素状态变化、素材操作 |
| 标准 | 0.2s | 输入框 focus、颜色变化、标签切换 |
| 缓慢 | 0.3s | 弹窗展开、页面切换、主题切换 |
| 面板 | 0.3s cubic-bezier(0.4, 0, 0.2, 1) | 侧边弹窗滑动 |
| 底部栏 | 0.4s cubic-bezier(0.4, 0, 0.2, 1) | 底部控制栏切换 |

### 4.3 暗黑模式切换

**切换方式**：通过在 `<body>` 标签上添加/移除 `.dark-mode` 类

```javascript
// 切换暗黑模式
document.body.classList.toggle('dark-mode');

// 保存用户偏好
localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
```

**样式定义原则**：
1. 所有组件都必须提供暗黑模式样式
2. 使用 `body.dark-mode` 选择器覆盖样式
3. 保持视觉层次关系不变
4. 确保文字对比度符合无障碍标准（WCAG AA 标准，对比度 ≥ 4.5:1）

```css
/* 浅色模式 */
.component {
  background: #ffffff;
  color: #333333;
}

/* 暗黑模式 */
body.dark-mode .component {
  background: #2a2a2a;
  color: #e0e0e0;
}
```

### 4.4 拖拽交互规范

#### 文件拖拽

**触发条件**：文件拖拽到页面区域
**视觉反馈**：
- 显示半透明覆盖层（`drop-overlay`）
- 显示虚线边框和提示文字
- 鼠标指针变化为拖拽指针

**操作流程**：
1. 文件拖拽进入页面 → 显示拖拽覆盖层
2. 文件悬停在有效区域 → 覆盖层保持显示
3. 文件放置 → 处理文件上传
4. 文件拖拽离开 → 隐藏拖拽覆盖层

**代码示例**：
```javascript
// 拖拽进入
function handleDragEnter(e) {
  e.preventDefault();
  dropOverlay.classList.add('show');
}

// 拖拽离开
function handleDragLeave(e) {
  e.preventDefault();
  dropOverlay.classList.remove('show');
}

// 文件放置
function handleDrop(e) {
  e.preventDefault();
  dropOverlay.classList.remove('show');
  const files = e.dataTransfer.files;
  processFiles(files);
}
```

### 4.5 缩放交互规范

#### 鼠标缩放

**触发方式**：鼠标滚轮
**操作流程**：
1. 鼠标悬停在播放器区域
2. 滚动鼠标滚轮 → 放大/缩小
3. 按住 Ctrl 键 + 滚动 → 以鼠标位置为中心点缩放

**视觉反馈**：
- 播放器内容平滑缩放
- 缩放时保持视觉中心点

#### 按钮缩放

**触发方式**：点击缩放按钮
**操作流程**：
1. 点击放大按钮 → 放大 1.2 倍
2. 点击缩小按钮 → 缩小 0.8 倍
3. 点击 1:1 按钮 → 恢复原始大小
4. 点击适应屏幕按钮 → 适应屏幕高度

**限制**：
- 最小缩放：0.1
- 最大缩放：10

### 4.6 沉浸模式交互

#### 进入沉浸模式

**触发方式**：
- 点击 Mini 按钮
- 快捷键：F11

**视觉变化**：
- 底部控制栏收缩为 Mini 浮层
- 顶部导航栏隐藏
- 播放器区域最大化

#### 退出沉浸模式

**触发方式**：
- 点击 Mini 浮层上的最大化按钮
- 快捷键：F11

**视觉变化**：
- 底部控制栏恢复完整大小
- 顶部导航栏显示
- 播放器区域恢复正常布局

### 4.7 快捷键规范

#### 通用快捷键

| 快捷键 | 功能 | 说明 |
|-------|------|------|
| Ctrl + O | 打开文件 | 打开文件选择对话框 |
| Ctrl + S | 保存文件 | 保存当前内容 |
| Ctrl + Z | 撤销 | 撤销上一步操作 |
| Ctrl + Y | 重做 | 重做上一步操作 |
| F11 | 切换全屏 | 进入/退出沉浸模式 |
| Esc | 关闭弹窗 | 关闭当前打开的弹窗 |

#### 播放器快捷键

| 快捷键 | 功能 | 说明 |
|-------|------|------|
| 空格 | 播放/暂停 | 控制动画播放状态 |
| ↑ | 音量增大 | 增加音量 10% |
| ↓ | 音量减小 | 减小音量 10% |
| M | 静音切换 | 切换静音状态 |
| + | 放大 | 放大播放器内容 |
| - | 缩小 | 缩小播放器内容 |
| 0 | 重置缩放 | 恢复 1:1 缩放比例 |
| F | 适应屏幕 | 适应屏幕高度 |

### 4.8 反馈机制

#### 即时反馈

**操作**：按钮点击、滑块调整
**反馈**：
- 按钮状态变化（hover/active）
- 滑块实时更新
- 进度条动画

#### 延迟反馈

**操作**：文件上传、格式转换
**反馈**：
- 加载指示器（loading spinner）
- 进度条显示
- Toast 提示消息

#### Toast 提示

**使用场景**：
- 操作成功确认
- 错误提示
- 信息通知

**设计规范**：
- 位置：屏幕顶部中央
- 显示时长：2-3 秒
- 动画：淡入淡出
- 样式：半透明背景，圆角边框

**代码示例**：
```javascript
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}
```

---

## 5. 无障碍规范（Accessibility）

### 5.1 颜色对比度

- **大文字**（≥18px 或 ≥14px 加粗）：对比度 ≥ 3:1
- **小文字**（<18px）：对比度 ≥ 4.5:1
- **图标和图形**：对比度 ≥ 3:1

### 5.2 键盘导航

- 所有可交互元素必须支持键盘访问（Tab 键切换）
- 使用 `:focus` 伪类提供明显的焦点指示
- 避免使用 `outline: none;` 除非提供替代的焦点样式

### 5.3 语义化 HTML

```html
<!-- ✅ 推荐 -->
<button class="btn-primary">提交</button>
<a href="#" class="link">链接</a>

<!-- ❌ 不推荐 -->
<div class="btn-primary" onclick="submit()">提交</div>
<span class="link" onclick="navigate()">链接</span>
```

### 5.4 ARIA 标签

```html
<!-- 为图标按钮添加 aria-label -->
<button class="icon-btn" aria-label="关闭">
  <svg>...</svg>
</button>

<!-- 为 Tooltip 添加 aria-describedby -->
<button aria-describedby="tooltip-1">帮助</button>
<div id="tooltip-1" role="tooltip">这是帮助信息</div>

<!-- 为模态框添加 aria-modal -->
<div class="modal" aria-modal="true" role="dialog" aria-labelledby="modal-title">
  <h2 id="modal-title">弹窗标题</h2>
  <!-- 弹窗内容 -->
</div>
```

### 5.5 屏幕阅读器支持

#### 角色和状态

- 为所有交互元素添加适当的 `role` 属性
- 使用 `aria-hidden` 隐藏装饰性元素
- 为动态内容添加 `aria-live` 属性

**示例**：
```html
<!-- 进度条 -->
<div role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
  50%
</div>

<!-- 实时通知 -->
<div aria-live="polite" class="notification">
  操作成功
</div>
```

#### 标签和描述

- 使用 `aria-label` 为无文本的元素提供标签
- 使用 `aria-labelledby` 关联元素和其标签
- 使用 `aria-describedby` 提供额外描述信息

### 5.6 焦点管理

#### 焦点陷阱

- 模态框打开时，将焦点限制在模态框内
- 模态框关闭时，将焦点返回到触发元素

**代码示例**：
```javascript
// 模态框焦点陷阱
function setupFocusTrap(modal, trigger) {
  const focusableElements = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }

    if (e.key === 'Escape') {
      closeModal();
      trigger.focus();
    }
  });

  firstElement.focus();
}
```

#### 焦点指示

- 确保所有可聚焦元素都有明显的焦点样式
- 使用 `:focus-visible` 为键盘导航提供更明显的焦点指示

**代码示例**：
```css
/* 键盘焦点 */
.interactive-element:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

/* 鼠标焦点 */
.interactive-element:focus:not(:focus-visible) {
  outline: none;
}
```

### 5.7 错误处理的无障碍性

#### 表单验证

- 使用 `aria-invalid` 标记无效字段
- 使用 `aria-describedby` 关联错误信息
- 错误信息应该清晰、具体

**代码示例**：
```html
<div class="form-group">
  <label for="email">邮箱</label>
  <input type="email" id="email" aria-invalid="true" aria-describedby="email-error">
  <div id="email-error" class="error-message">请输入有效的邮箱地址</div>
</div>
```

#### 错误通知

- 使用 `aria-live="assertive"` 为错误通知
- 确保错误信息能够被屏幕阅读器读取

### 5.8 响应式设计的无障碍性

#### 触摸目标

- 移动设备上的触摸目标至少为 48px × 48px
- 触摸目标之间的间距至少为 8px

**代码示例**：
```css
/* 移动设备触摸目标 */
@media (max-width: 767px) {
  .touch-target {
    min-width: 48px;
    min-height: 48px;
    margin: 4px;
  }
}
```

#### 屏幕方向

- 确保在横屏和竖屏模式下都能正常访问
- 避免依赖屏幕方向的交互

### 5.9 无障碍测试工具

#### 推荐工具

| 工具名称 | 用途 | 平台 |
|---------|------|------|
| axe DevTools | 全面的无障碍测试 | 浏览器扩展 |
| WAVE | 可视化无障碍评估 | 浏览器扩展 |
| Lighthouse | 性能和无障碍测试 | Chrome 开发工具 |
| screenreader | 屏幕阅读器模拟 | 命令行工具 |

#### 测试方法

1. **键盘导航测试**：仅使用键盘操作整个应用
2. **屏幕阅读器测试**：使用 NVDA、VoiceOver 等测试
3. **对比度测试**：使用工具检查颜色对比度
4. **响应式测试**：在不同设备上测试
5. **自动化测试**：集成 axe-core 到 CI/CD 流程

### 5.10 最佳实践

1. **始终优先使用语义化 HTML**
2. **为所有交互元素提供键盘支持**
3. **确保颜色不是唯一的信息传递方式**
4. **为复杂组件提供完整的 ARIA 支持**
5. **测试、测试、再测试**
6. **持续学习无障碍标准和技术**

**示例：完整的无障碍按钮**
```html
<button 
  class="btn-primary"
  aria-label="播放动画"
  aria-pressed="false"
  tabindex="0"
  role="button"
>
  <svg aria-hidden="true" width="20" height="20">
    <path d="M8 5v14l11-7z"/>
  </svg>
  <span>播放</span>
</button>
```

---

## 6. 代码示例

### 6.1 完整的表单组件

```html
<div class="form-group">
  <label class="form-label" for="input-example">输入框标签</label>
  <input type="text" id="input-example" class="input-base" placeholder="请输入内容">
  <span class="form-hint">这是提示文字</span>
</div>
```

```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #333333;
}

.form-hint {
  font-size: 12px;
  color: #999999;
}

/* 暗黑模式 */
body.dark-mode .form-label {
  color: #e0e0e0;
}

body.dark-mode .form-hint {
  color: #808080;
}
```

### 6.2 完整的卡片组件

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">卡片标题</h3>
    <button class="icon-btn">···</button>
  </div>
  <div class="card-body">
    <p>卡片内容</p>
  </div>
  <div class="card-footer">
    <button class="btn-primary">取消</button>
    <button class="btn-secondary">确定</button>
  </div>
</div>
```

```css
.card {
  background: #ffffff;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e3e3e3;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin: 0;
}

.card-body {
  padding: 20px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e3e3e3;
  background: #fcfcfc;
}

/* 暗黑模式 */
body.dark-mode .card {
  background: #2a2a2a;
  border-color: #404040;
}

body.dark-mode .card-header,
body.dark-mode .card-footer {
  border-color: #404040;
}

body.dark-mode .card-title {
  color: #e0e0e0;
}

body.dark-mode .card-footer {
  background: #1a1a1a;
}
```

---

## 7. 最佳实践

### 7.1 CSS 命名规范

采用 **BEM（Block Element Modifier）** 命名规范：

```css
/* Block（块） */
.button { }

/* Element（元素） */
.button__icon { }
.button__text { }

/* Modifier（修饰符） */
.button--primary { }
.button--disabled { }

/* 组合使用 */
.button.button--primary { }
.button__icon.button__icon--large { }
```

**项目当前命名风格**：混合使用 BEM 和语义化类名

```css
/* 推荐的命名方式 */
.btn-primary { }          /* 主要按钮 */
.modal-overlay { }        /* 弹窗遮罩 */
.file-name-box { }        /* 文件名容器 */
.toggle-switch { }        /* 开关组件 */
```

### 7.2 CSS 书写顺序

```css
.component {
  /* 1. 定位 */
  position: relative;
  top: 0;
  left: 0;
  z-index: 10;
  
  /* 2. 盒模型 */
  display: flex;
  width: 100%;
  height: 28px;
  padding: 0 12px;
  margin: 0;
  
  /* 3. 边框 */
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  
  /* 4. 背景 */
  background: #ffffff;
  
  /* 5. 文字 */
  color: #333333;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  
  /* 6. 其他 */
  cursor: pointer;
  opacity: 1;
  
  /* 7. 过渡动画 */
  transition: all 0.2s ease;
}
```

### 7.3 避免魔法数字

```css
/* ❌ 不推荐 */
.button {
  padding: 0 16px;
  font-size: 13px;
  border-radius: 8px;
}

/* ✅ 推荐 */
:root {
  --space-4: 16px;
  --font-size-base: 13px;
  --radius-sm: 8px;
}

.button {
  padding: 0 var(--space-4);
  font-size: var(--font-size-base);
  border-radius: var(--radius-sm);
}
```

### 7.4 移动端适配

```css
/* 响应式断点 */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  .modal-panel {
    width: 95%;
    max-height: 90vh;
  }
  
  .btn-primary {
    height: 32px; /* 移动端增加高度以便点击 */
  }
}
```

### 7.5 沉浸模式布局

沉浸模式提供极简的视觉体验，隐藏非核心UI元素，增加内容展示空间。

**标题栏隐藏动画**：
```css
.header-navbar {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.header-navbar.header-hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}
```

**底部浮层高度切换**：
```css
.footer-bar {
  height: 154px; /* 普通模式 */
  transition: height 0.3s ease;
}

.footer-bar.footer-immersive {
  height: 80px; /* 沉浸模式 */
}
```

**模式名称居中**：
```css
.footer-top-actions {
  position: absolute;
  right: 0;
  bottom: 132px;
  transition: bottom 0.3s ease;
}

.footer-top-actions-immersive {
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}
```

---

## 8. 沉浸模式组件

### 8.1 Mini浮层

**功能**：沉浸模式下的精简控制条，居中显示，包含核心播放控制。

**尺寸规范**：
- 浮层高度：60px
- 内边距：0 24px
- 按钮尺寸：60x60px
- 按钮间距：16px
- 圆角：16px

**样式定义**：
```css
.footer-mini {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 60px;
  padding: 0 24px;
  background-color: #ffffff;
  border: 1px solid #e6e6e6;
  border-radius: 16px;
  box-shadow: 0px 10px 32px 0px rgba(51, 51, 51, 0.2);
}

body.dark-mode .footer-mini {
  background-color: #2a2a2a;
  border-color: #404040;
  box-shadow: 0px 10px 32px 0px rgba(0, 0, 0, 0.6);
}
```

### 8.2 Mini按钮

**组件列表**：
1. mini-play-btn - 播放/暂停
2. mini-mute-btn - 静音控制
3. mini-scale-btn - 1:1/适应屏幕
4. mini-maximize-btn - 退出沉浸模式

**通用样式**：
```css
.mini-play-btn,
.mini-mute-btn,
.mini-scale-btn,
.mini-maximize-btn {
  width: 60px;
  height: 60px;
  border: none;
  background-color: transparent;
  background-size: 400px 320px;
  background-repeat: no-repeat;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}

/* Hover状态无过渡动画，直接切换图标 */
.mini-play-btn:hover {
  background-position: -60px -560px;
}
```

**状态切换**：
```css
/* 播放按钮 */
.mini-play-btn { background-position: 0 -560px; }
.mini-play-btn:hover { background-position: -60px -560px; }
.mini-play-btn.is-playing { background-position: -120px -560px; }
.mini-play-btn.is-playing:hover { background-position: -180px -560px; }

/* 静音按钮 */
.mini-mute-btn { background-position: 0 -620px; }
.mini-mute-btn:hover { background-position: -60px -620px; }
.mini-mute-btn.is-muted { background-position: -120px -620px; }
.mini-mute-btn.is-muted:hover { background-position: -180px -620px; }

/* 缩放按钮 */
.mini-scale-btn { background-position: -240px -560px; }
.mini-scale-btn:hover { background-position: -300px -560px; }
.mini-scale-btn.is-contain { background-position: -240px -620px; }
.mini-scale-btn.is-contain:hover { background-position: -300px -620px; }

/* 最大化按钮 */
.mini-maximize-btn { background-position: -60px -680px; }
.mini-maximize-btn:hover { background-position: -120px -680px; }
```

**暗黑模式**：
```css
body.dark-mode .mini-play-btn { background-position: 0 -740px; }
body.dark-mode .mini-play-btn:hover { background-position: -60px -740px; }
body.dark-mode .mini-play-btn.is-playing { background-position: -120px -740px; }
/* ... 其他按钮类似 */
```

### 8.3 最小化/最大化按钮

**minimize-btn**（进入沉浸模式）：
```css
.minimize-btn {
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  background-size: 400px 320px;
  background-repeat: no-repeat;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}

.minimize-btn { background-position: 0 -680px; }
.minimize-btn:hover { background-position: -32px -680px; }

body.dark-mode .minimize-btn { background-position: -64px -680px; }
body.dark-mode .minimize-btn:hover { background-position: -96px -680px; }
```

### 8.4 设计原则

**视觉层级**：
1. 最低层：标题栏（可隐藏）
2. 中间层：内容展示区（自动适配）
3. 顶层：Mini浮层（始终可见）

**交互规则**：
- ✅ 只能通过最大化按钮退出沉浸模式
- ❌ 沉浸模式下禁用恢复播放
- ❌ 沉浸模式下禁用清空画布
- ❌ 沉浸模式下隐藏帮助按钮
- ❌ 沉浸模式下不显示进度条

**动画要求**：
- 标题栏隐藏：300ms ease
- 浮层高度：300ms ease
- 图标状态：无过渡，直接切换

---

### 居中弹窗 (Center Modal)

用于需要用户聚焦处理的任务，如设置参数、确认操作等。

#### HTML 结构

```html
<div class="center-modal-overlay show">
  <div class="center-modal-dialog">
    <div class="center-modal-header">
      <h3>弹窗标题</h3>
    </div>
    <div class="center-modal-body">
      <!-- 弹窗内容 -->
      <div class="svga-config-item">
        <div class="svga-config-label">配置项：</div>
        <!-- ... -->
      </div>
    </div>
    <div class="center-modal-footer">
      <button class="btn-large-primary">取消</button>
      <button class="btn-large-secondary">确定</button>
    </div>
  </div>
</div>
```

#### CSS 样式类

- `.center-modal-overlay`: 全屏遮罩层，固定定位，背景色 `rgba(0, 0, 0, 0.3)`。
- `.center-modal-dialog`: 弹窗主体，白色背景，圆角 `24px`，阴影 `0 10px 40px rgba(0, 0, 0, 0.2)`。
- `.center-modal-header`: 头部，包含 `h3` 标题，下边框分隔。
- `.center-modal-body`: 内容区域，垂直内边距 `24px`。
- `.center-modal-footer`: 底部按钮区域，右对齐，上内边距 `16px`。

### 变速时间轴编辑器 (Speed Remap Editor)

用于 MP4 视频的多段变速编辑，支持添加关键帧和调整速率。

#### HTML 结构

```html
<div class="speed-remap-editor">
  <div class="speed-remap-editor-content">
    <div class="speed-remap-timeline-wrapper">
      <div class="speed-remap-timeline">
        <!-- 时间轴内容: 关键帧, 预览线等 -->
        <div class="keyframe-node">...</div>
      </div>
      <div class="speed-remap-timescale">
        <!-- 时间刻度 -->
      </div>
    </div>
    <div class="speed-remap-buttons">
      <button class="btn-large-primary btn-speed-reset"></button>
      <button class="btn-large-primary">取消</button>
      <button class="btn-large-secondary">确定</button>
    </div>
  </div>
</div>
```

#### CSS 样式类

- `.speed-remap-editor`: 底部浮动面板，白色背景，圆角 `16px`，宽度 `1000px`。
- `.speed-remap-timeline`: 时间轴主体，灰色背景 `#F3F3F3`，高度 `16px`。
- `.keyframe-node`: 关键帧节点，包含垂直指示线和拖拽手柄。
- `.speed-remap-segment-overlay`: 变速片段覆盖层，不同颜色表示加速/减速。
  - `.segment-speedup`: 加速 (深蓝)
  - `.segment-slowdown`: 减速 (浅蓝)

### 素材编辑器 (Material Editor)

用于编辑 SVGA 中的素材图片，支持缩放、平移和添加文案。

#### HTML 结构

```html
<div class="center-modal-dialog material-editor-modal">
  <div class="center-modal-body material-editor-body">
    <!-- 左侧预览区 -->
    <div class="editor-preview-area">
      <div class="editor-preview-wrapper">
        <div class="editor-preview-content">
          <!-- 画布内容 -->
        </div>
      </div>
      <!-- 底部控制栏 -->
      <div class="editor-bottom-actions">
        <div class="editor-bottom-left">
          <button class="editor-view-btn"></button>
          <div class="editor-scale-percentage">100%</div>
        </div>
        <div class="editor-bottom-right">
          <button class="btn-large-primary">上传图片</button>
          <button class="btn-large-primary btn-editor-recover"></button>
        </div>
      </div>
    </div>
    <!-- 右侧控制区 -->
    <div class="editor-controls-area">
      <!-- 控制选项 -->
    </div>
  </div>
</div>
```

#### CSS 样式类

- `.material-editor-modal`: 扩展自居中弹窗，宽度 `1000px`，高度 `80vh`。
- `.material-editor-body`: Flex 布局，包含预览区和控制区。
- `.editor-preview-area`: 左侧预览区域，包含画布和底部工具栏。
- `.editor-controls-area`: 右侧属性控制面板，宽度 `300px`。
- `.editor-zoom-controls`: 缩放控制按钮组。

## 版本历史

| 版本 | 日期 | 描述 |
|-----|------|------|
| 1.0 | 2025-12-16 | 初始版本，基于现有代码梳理 |
| 1.1 | 2025-12-22 | 根据styles.css实际内容更新：<br>• 补充播放/暂停按钮、静音按钮组件<br>• 补充Help按钮（四种主题状态图片）<br>• 更新Tab按钮为is-active样式<br>• 更新清空画布按钮危险警告样式<br>• 更新开关组件为实际使用的样式<br>• 更新进度条为播放进度条样式<br>• 添加侧边弹窗组件说明<br>• 添加Toast提示组件<br>• 添加库加载进度指示器<br>• 添加动画关键帧定义<br>• 更新颜色、圆角、阴影系统为实际值 |
| 1.2 | 2026-01-01 | 添加沉浸模式组件：<br>• 添加Mini浮层设计规范<br>• 添加Mini按钮组件（play/mute/scale/maximize）<br>• 添加最小化/最大化按钮<br>• 添加沉浸模式布局规则<br>• 添加标题栏隐藏动画<br>• 添加底部浮层高度切换样式<br>• 添加模式名称居中样式 |
| 1.3 | 2026-01-10 | 素材编辑器功能升级：<br>• 添加视图模式切换按钮（1:1/适应高度）<br>• 添加编辑器缩放百分比显示<br>• 实现智能缩放算法：优先按高度75%，宽度超出则按宽度100%<br>• AI生图按钮图标优化（24px显示，居中对齐）<br>• 底部按钮布局优化（左右分组）<br>• 图标按钮HTML结构简化（去除i标签，直接使用button） |

---

## 9. 参考资源

- [Material Design](https://material.io/design)
- [Ant Design](https://ant.design/)
- [Element Plus](https://element-plus.org/)
- [Figma 设计规范](https://www.figma.com/)
- [WCAG 无障碍标准](https://www.w3.org/WAI/WCAG21/quickref/)
