import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync, cpSync, rmSync } from 'fs'

// 复制静态文件到构建目录
function copyStaticFiles() {
  console.log('=== Starting to copy static files ===')
  
  try {
    // 先创建必要的目录结构
    const docsDir = resolve(__dirname, 'docs')
    const assetsDir = resolve(docsDir, 'assets')
    const jsDir = resolve(assetsDir, 'js')
    const libDir = resolve(assetsDir, 'lib')
    const imgDir = resolve(assetsDir, 'img')
    const gadgetsDir = resolve(docsDir, 'gadgets')
    
    // 创建目录
    mkdirSync(docsDir, { recursive: true })
    mkdirSync(assetsDir, { recursive: true })
    mkdirSync(jsDir, { recursive: true })
    mkdirSync(libDir, { recursive: true })
    mkdirSync(imgDir, { recursive: true })
    mkdirSync(gadgetsDir, { recursive: true })
    console.log('Created directory structure')
    
    // 复制JavaScript文件
    const jsSource = resolve(__dirname, 'src/assets/js')
    if (existsSync(jsSource)) {
      cpSync(jsSource, jsDir, { recursive: true })
      console.log('Copied JavaScript files')
    }
    
    // 复制lib目录
    const libSource = resolve(__dirname, 'src/assets/lib')
    if (existsSync(libSource)) {
      cpSync(libSource, libDir, { recursive: true })
      console.log('Copied lib files')
    }
    
    // 复制img目录
    const imgSource = resolve(__dirname, 'src/assets/img')
    if (existsSync(imgSource)) {
      cpSync(imgSource, imgDir, { recursive: true })
      console.log('Copied img files')
    }
    
    // 复制gadgets目录
    const gadgetsSource = resolve(__dirname, 'src/gadgets')
    if (existsSync(gadgetsSource)) {
      cpSync(gadgetsSource, gadgetsDir, { recursive: true })
      console.log('Copied gadgets directory')
    }
    
    console.log('=== Static files copied successfully ===')
  } catch (error) {
    console.error('Error copying static files:', error.message)
  }
}

export default defineConfig({
  //豆包叫我加root属性
  root: resolve(__dirname, 'src'),

  // 基础路径
  base: '/',
  // 构建输出
  build: {
    outDir: 'docs',         // 输出到docs目录，与现有发布脚本匹配
    assetsDir: 'assets',     // 静态资源目录
    minify: 'terser',        // 代码压缩
    sourcemap: false,        // 生产环境关闭sourcemap
    emptyOutDir: true,       // 构建前清空输出目录
    // 多页应用配置
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src', 'index.html'),
        '404': resolve(__dirname, 'src', '404.html'),
        'gadgets/fix_garbled_text': resolve(__dirname, 'src', 'gadgets/fix_garbled_text.html'),
        'gadgets/png_compression': resolve(__dirname, 'src', 'gadgets/png_compression.html')
      }
    }
  },
  // 开发服务器
  server: {
    port: 4000,
    open: true,
    host: true,
    // 静态文件服务
    static: {
      directory: resolve(__dirname, 'src'),
      watch: true,
      // 启用目录浏览
      serveIndex: true
    }
  },
  // 插件
  plugins: [
    vue()
  ],
  // 别名配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
