# 重新实现Vite构建化改造方案

## 项目现状

* ✅ 所有源代码文件已整理到 `src` 目录

* ✅ `docs` 目录已清空

* ✅ 项目结构完整，包含所有必要文件

## 构建配置方案

### 1. 基础配置

* **构建输出目录**：`docs`

* **静态资源目录**：`assets`

* **代码压缩**：启用 Terser 压缩

* **Sourcemap**：生产环境关闭

### 2. 多页应用配置

需要构建的HTML页面：

* ✅ `src/index.html` → `docs/index.html`

* ✅ `src/sth_auto.html` → `docs/sth_auto.html`

* ✅ `src/404.html` → `docs/404.html`

* ✅ `src/gadgets/fix_garbled_text.html` → `docs/gadgets/fix_garbled_text.html`

* ✅ `src/gadgets/png_compression.html` → `docs/gadgets/png_compression.html`

### 3. 静态资源处理

#### 3.1 Vite自动处理

* HTML中引用的CSS/JS文件

* 图片等资源文件

#### 3.2 构建后复制

需要手动复制的文件：

**配置文件**：

* `src/CNAME` → `docs/CNAME`

* `src/vercel.json` → `docs/vercel.json`

* `src/coi-serviceworker.js` → `docs/coi-serviceworker.js`

* `src/favicon.png` → `docs/favicon.png`

* `src/icon.png` → `docs/icon.png`

* `src/svga.proto` → `docs/svga.proto`

* `src/help.md` → `docs/help.md`

* `src/ads.txt` → `docs/ads.txt`

* `src/_headers` → `docs/_headers`

* `src/google76b46e47c22bf562.html` → `docs/google76b46e47c22bf562.html`

**工具页面依赖**：

* `src/gadgets/` 目录 → `docs/gadgets/`

**资源目录**：

* `src/assets/dar_svga/` → `docs/assets/dar_svga/`

* `src/assets/mingren_gift_1photo/` → `docs/assets/mingren_gift_1photo/`

* `src/assets/svga/` → `docs/assets/svga/`

* `src/assets/xunzhang/` → `docs/assets/xunzhang/`

* `src/assets/sth_auto_img/` → `docs/assets/sth_auto_img/`

### 4. 开发服务器配置

* **端口**：3000

* **静态文件目录**：`src`

* **热更新**：启用

### 5. 实施步骤

#### 步骤1：配置 vite.config.js

* 创建完整的构建配置

* 配置多页应用构建

* 配置静态文件复制逻辑

#### 步骤2：验证构建

* 运行 `npm run build`

* 检查 `docs` 目录结构

* 确认所有文件都被正确生成

#### 步骤3：测试开发服务器

* 运行 `npm run dev`

* 访问 <http://localhost:3000/>

* 验证所有页面都能正常访问

### 6. 预期结果

* ✅ 所有HTML页面正确构建

* ✅ 所有静态资源正确复制

* ✅ 开发服务器正常运行

* ✅ 构建产物可直接部署到GitHub Pages

## 技术实现要点

* 使用 Vite 5.x 作为构建工具

* 使用 @vitejs/plugin-vue2 支持 Vue 2

* 利用 Rollup 的多页应用配置

* 实现构建后静态文件复制机制

* 确保构建过程的可靠性和可重复性

