Write-Host "Copying static files..."

# 复制 CSS 文件
& xcopy /E /I /Y "src\assets\css" "docs\assets\css"

# 复制 img 文件
& xcopy /E /I /Y "src\assets\img" "docs\assets\img"

# 复制 js 文件
& xcopy /E /I /Y "src\assets\js" "docs\assets\js"

# 复制其他资源目录
& xcopy /E /I /Y "src\assets\dar_svga" "docs\assets\dar_svga"
& xcopy /E /I /Y "src\assets\mingren_gift_1photo" "docs\assets\mingren_gift_1photo"
& xcopy /E /I /Y "src\assets\svga" "docs\assets\svga"
& xcopy /E /I /Y "src\assets\xunzhang" "docs\assets\xunzhang"
& xcopy /E /I /Y "src\assets\sth_auto_img" "docs\assets\sth_auto_img"

# 复制 gadgets 目录
& xcopy /E /I /Y "src\gadgets" "docs\gadgets"

# 复制 src 根目录文件
$srcFiles = Get-ChildItem -Path "src" -File
foreach ($file in $srcFiles) {
    Copy-Item -Path $file.FullName -Destination "docs" -Force
}

Write-Host "Compressing CSS files..."

# 压缩 CSS 文件
$cssFiles = Get-ChildItem -Path "docs\assets\css" -Recurse -Filter "*.css"
foreach ($cssFile in $cssFiles) {
    if ($cssFile.Name -notlike "*.min.css") {
        & npx cleancss "$($cssFile.FullName)" -o "$($cssFile.FullName)"
    }
}

Write-Host "Compressing JavaScript files..."

# 压缩 JavaScript 文件
$jsFiles = Get-ChildItem -Path "docs\assets\js" -Recurse -Filter "*.js"
foreach ($jsFile in $jsFiles) {
    if ($jsFile.Name -notlike "*.min.js") {
        & npx terser "$($jsFile.FullName)" -o "$($jsFile.FullName)" --compress --mangle
    }
}

Write-Host "Static files copied and compressed successfully"
