# UI 设计系统规范

> 本文档基于项目现有代码梳理而成，定义了统一的设计令牌（Design Tokens）和组件规范，确保各页面视觉风格一致。
> 
> **文件路径**：`docs/assets/css/styles.css`

---

## 1. 设计令牌（Design Tokens）

### 1.1 颜色系统

#### 主色调
```css
--primary-blue: #409eff;      /* 主要操作、链接、进度条 */
--primary-gray: #5b5b5b;      /* 次要按钮、强调文字 */
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

/* 暗黑模式 */
--bg-base-dark: #1a1a1a;      /* 页面基础背景（带点阵图案） */
--bg-elevated-dark: #2a2a2a;  /* 卡片/弹窗背景 */
--bg-input-dark: #3a3a3a;     /* 输入框背景 */
--bg-hover-dark: #333333;     /* Hover状态背景 */
--bg-active-dark: #404040;    /* Active状态背景 */
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
--font-size-sm: 12px;         /* 标题标签、帮助说明 */
--font-size-base: 13px;       /* 按钮文字、搜索框 */
--font-size-md: 14px;         /* 信息文字、输入框 */
--font-size-lg: 16px;         /* 配置标签、选择器文字 */
--font-size-xl: 20px;         /* 空状态提示 */
--font-size-xxl: 120px;       /* 404错误码 */
```

#### 字重规范
```css
--font-weight-normal: 400;    /* 正常字重 */
--font-weight-medium: 500;    /* 中等字重 */
--font-weight-semibold: 600;  /* 半粗体 */
--font-weight-bold: 700;      /* 粗体 */
```

#### 行高规范
```css
--line-height-tight: 1.2;     /* 紧凑行高 */
--line-height-base: 1.5;      /* 基础行高 */
--line-height-loose: 1.8;     /* 宽松行高 */
```

### 1.3 间距系统

基于 **4px 基准单位**（4px Grid System）：

```css
--space-1: 4px;               /* 0.25rem */
--space-2: 8px;               /* 0.5rem */
--space-3: 12px;              /* 0.75rem */
--space-4: 16px;              /* 1rem */
--space-5: 20px;              /* 1.25rem */
--space-6: 24px;              /* 1.5rem */
--space-8: 32px;              /* 2rem */
--space-10: 40px;             /* 2.5rem */
--space-12: 48px;             /* 3rem */
```

**常用场景**：
- 组件内部间距：8px、12px
- 组件之间间距：16px、20px
- 区块间距：24px、32px
- 页面边距：40px、48px

### 1.4 圆角系统

```css
--radius-none: 0;             /* 无圆角：进度条 */
--radius-sm: 8px;             /* 小组件：按钮、输入框、标签、Tooltip */
--radius-md: 12px;            /* 中等组件：选择器、输入包裹器 */
--radius-lg: 16px;            /* 大组件：弹窗、底部控制栏、大按钮 */
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

/* 暗黑模式 */
--shadow-tooltip-dark: 0px 6px 10px rgba(0, 0, 0, 0.5);
--shadow-popup-dark: 0px 2px 8px rgba(0, 0, 0, 0.5);
--shadow-panel-dark: 0px 10px 32px rgba(0, 0, 0, 0.5);
--shadow-toast-dark: 0px 4px 12px rgba(0, 0, 0, 0.5);
--shadow-dropdown-dark: 0px 4px 12px rgba(0, 0, 0, 0.5);
```

### 1.6 过渡动画

```css
--transition-fast: 0.15s ease;       /* 快速响应：按钮点击 */
--transition-base: 0.2s ease;        /* 基础过渡：hover状态 */
--transition-slow: 0.3s ease;        /* 缓慢过渡：弹窗展开、主题切换、背景色 */
--transition-panel: 0.3s cubic-bezier(0.4, 0, 0.2, 1);  /* 侧边弹窗滑动 */
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
.material-search-input {
  width: 100%;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
  background: #ffffff;
  outline: none;
  transition: all 0.3s;
}

.material-search-input::placeholder {
  color: #999999;
}

.material-search-input:focus {
  border-color: #00b4ff;
}

/* 暗黑模式 */
body.dark-mode .material-search-input {
  background: #2a2a2a;
  border-color: #444444;
  color: #e0e0e0;
}

body.dark-mode .material-search-input::placeholder {
  color: #666666;
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
</div>
<span class="progress-text">12 / 60</span>
```

```css
.progress-bar {
  width: 260px;
  height: 16px;
  background-color: #f3f3f3;
  border-radius: 0;           /* 无圆角 */
  border: 1px solid #e3e3e3;
  position: relative;
  cursor: pointer;
}

.progress-bar:hover {
  border-color: #5b5b5b;
}

.progress-fill {
  height: 100%;
  background-color: #409eff;  /* 主色调 */
  border-radius: 0;
  transition: width 0.1s;
}

.progress-text {
  margin-left: 8px;
  width: 60px;
  font-size: 14px;
  color: #818181;
  white-space: nowrap;
  text-align: left;
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

### 2.8 Toast提示组件

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
  top: 60px;                  /* 在header-navbar下方 */
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  max-width: 90%;
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
```

### 3.4 播放器布局系统

#### 整体结构

```
.main-page
├─ .viewer-area              ← 主播放区域（Flexbox 布局）
│   ├─ .viewer-container      ← 播放器容器（由 JS 控制 transform）
│   │   ├─ .viewer-filename   ← 文件名（绝对定位于播放器上方）
│   │   └─ .viewer-canvas     ← 播放器画布（包含 canvas 元素）
│   └─ .empty-state-overlay   ← 空状态覆盖层
└─ .footer-bar               ← 底部浮层（绝对定位）
```

#### .viewer-area（主播放区域）

```css
/* 结构：占据除顶栏外的所有空间
 * 布局控制：
 *   - align-items: flex-start → 子元素从顶部开始，不自动垂直居中
 *   - justify-content: center → 子元素水平居中
 *   - padding-bottom: 154px → 为 .footer-bar 留空间，确保拖拽虚线边界不超出屏幕
 * 位置控制：子元素的垂直位置由 JS 的 offsetY 控制（transform: translateY）
 */
.viewer-area {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0px 200px 154px;
  position: relative;
}
```

#### .viewer-container（播放器容器）

```css
/* 结构：包裹文件名 + 播放器画布，大小由 JS 设置为原始尺寸
 * 缩放机制：
 *   - transform-origin: top center → 缩放原点在顶部中心，缩放时视觉顶部保持在 y=0 处
 *   - transform: translate + scale → 由 JS 设置，translate 控制位置，scale 控制缩放
 * 关键设计：
 *   - 使用 top center 而非 center center，避免缩放后视觉顶部位置偏移
 *   - width/height 为原始尺寸，缩放通过 transform: scale() 实现
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
var footerHeight = 154;  // 底部浮层高度
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
| 快速 | 0.15s | 按钮 hover、小元素状态变化 |
| 标准 | 0.2s | 输入框 focus、颜色变化 |
| 缓慢 | 0.3s | 弹窗展开、页面切换 |

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

## 9. 版本历史

| 版本 | 日期 | 描述 |
|-----|------|------|
| 1.0 | 2025-12-16 | 初始版本，基于现有代码梳理 |
| 1.1 | 2025-12-22 | 根据styles.css实际内容更新：<br>• 补充播放/暂停按钮、静音按钮组件<br>• 补充Help按钮（四种主题状态图片）<br>• 更新Tab按钮为is-active样式<br>• 更新清空画布按钮危险警告样式<br>• 更新开关组件为实际使用的样式<br>• 更新进度条为播放进度条样式<br>• 添加侧边弹窗组件说明<br>• 添加Toast提示组件<br>• 添加库加载进度指示器<br>• 添加动画关键帧定义<br>• 更新颜色、圆角、阴影系统为实际值 |
| 1.2 | 2026-01-01 | 添加沉浸模式组件：<br>• 添加Mini浮层设计规范<br>• 添加Mini按钮组件（play/mute/scale/maximize）<br>• 添加最小化/最大化按钮<br>• 添加沉浸模式布局规则<br>• 添加标题栏隐藏动画<br>• 添加底部浮层高度切换样式<br>• 添加模式名称居中样式 |

---

## 9. 参考资源

- [Material Design](https://material.io/design)
- [Ant Design](https://ant.design/)
- [Element Plus](https://element-plus.org/)
- [Figma 设计规范](https://www.figma.com/)
- [WCAG 无障碍标准](https://www.w3.org/WAI/WCAG21/quickref/)
