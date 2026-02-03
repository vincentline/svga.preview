import { resolve, dirname } from 'path'
import { copyFileSync, existsSync, mkdirSync, cpSync } from 'fs'

// 复制静态文件到构建目录
function copyStaticFiles() {
  console.log('=== Starting to copy static files ===')
  
  try {
    // 先创建必要的目录结构
    const docsDir = resolve('docs')
    const assetsDir = resolve(docsDir, 'assets')
    const jsDir = resolve(assetsDir, 'js')
    const libDir = resolve(assetsDir, 'lib')
    const gadgetsDir = resolve(docsDir, 'gadgets')
    
    // 创建目录
    mkdirSync(docsDir, { recursive: true })
    mkdirSync(assetsDir, { recursive: true })
    mkdirSync(jsDir, { recursive: true })
    mkdirSync(libDir, { recursive: true })
    mkdirSync(gadgetsDir, { recursive: true })
    console.log('Created directory structure')
    
    // 复制lib目录
    const libSource = resolve('src/assets/lib')
    if (existsSync(libSource)) {
      console.log(`Copying lib files`)
      cpSync(libSource, libDir, { recursive: true })
      console.log('Copied lib files')
    }
    
    // 复制JavaScript文件（只复制最必要的目录）
    const jsSource = resolve('src/assets/js')
    if (existsSync(jsSource)) {
      console.log(`Copying JavaScript files`)
      
      // 只复制最必要的子目录
      const jsSubDirs = ['core', 'service', 'utils']
      jsSubDirs.forEach(subDir => {
        const subDirSource = resolve(jsSource, subDir)
        const subDirDest = resolve(jsDir, subDir)
        if (existsSync(subDirSource)) {
          console.log(`Copying ${subDir} directory`)
          cpSync(subDirSource, subDirDest, { recursive: true })
          console.log(`Copied ${subDir} directory`)
        }
      })
      
      console.log('Copied JavaScript files')
    }
    
    // 复制gadgets目录
    const gadgetsSource = resolve('src/gadgets')
    if (existsSync(gadgetsSource)) {
      console.log(`Copying gadgets directory`)
      cpSync(gadgetsSource, gadgetsDir, { recursive: true })
      console.log('Copied gadgets directory')
    }
    
    // 复制特殊配置文件
    const staticFiles = [
      { from: 'src/CNAME', to: 'docs/CNAME' },
      { from: 'src/vercel.json', to: 'docs/vercel.json' },
      { from: 'src/coi-serviceworker.js', to: 'docs/coi-serviceworker.js' },
      { from: 'src/favicon.png', to: 'docs/favicon.png' },
      { from: 'src/icon.png', to: 'docs/icon.png' },
      { from: 'src/svga.proto', to: 'docs/svga.proto' },
      { from: 'src/help.md', to: 'docs/help.md' },
      { from: 'src/ads.txt', to: 'docs/ads.txt' },
      { from: 'src/_headers', to: 'docs/_headers' },
      { from: 'src/google76b46e47c22bf562.html', to: 'docs/google76b46e47c22bf562.html' }
    ]
    
    staticFiles.forEach(file => {
      const sourcePath = resolve(file.from)
      const destPath = resolve(file.to)
      if (existsSync(sourcePath)) {
        mkdirSync(dirname(destPath), { recursive: true })
        copyFileSync(sourcePath, destPath)
        console.log(`Copied ${file.from.replace('src/', '')} to ${file.to}`)
      }
    })
    
    console.log('=== Static files copied successfully ===')
  } catch (error) {
    console.error('Error copying static files:', error.message)
    process.exit(1)
  }
}

// 执行复制操作
copyStaticFiles()
