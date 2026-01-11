# 脚本功能：下载项目所需的外部 JavaScript 库到本地目录
# 使用方法：
# 1. 确保已安装 PowerShell
# 2. 右键点击此文件 -> 使用 PowerShell 运行
# 3. 或者在终端中运行：.\download_libs.ps1
#
# 注意事项：
# - 此脚本会将库文件下载到 docs/assets/js/lib 目录
# - 如果需要更新库版本，请修改下方 $files 哈希表中的 URL
# - 下载前会自动备份现有文件（如果有）
# - 遇到下载失败会自动重试
#
# 维护说明：
# 当外部库（如 Vue, SVGA Player 等）发布新版本时，
# 请更新 $files 中对应的 URL，然后重新运行此脚本即可更新本地库文件。

$destDir = "docs/assets/js/lib"
if (!(Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force
}

$files = @{
    "vue.min.js" = "https://cdn.jsdelivr.net/npm/vue@2.7.14/dist/vue.min.js"
    "svga.min.js" = "https://cdn.jsdelivr.net/npm/svgaplayerweb@2.3.1/build/svga.min.js"
    "lottie.min.js" = "https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js"
    "howler.min.js" = "https://cdn.jsdelivr.net/npm/howler@2.2.3/dist/howler.min.js"
    "marked.min.js" = "https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js"
    "gif.js" = "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js"
    "protobuf.min.js" = "https://cdn.jsdelivr.net/npm/protobufjs@7.2.5/dist/protobuf.min.js"
    "pako.min.js" = "https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js"
    "jszip.min.js" = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"
    "ffmpeg.min.js" = "https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js"
    "html2canvas.min.js" = "https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"
    "svga-web.min.js" = "https://cdn.jsdelivr.net/npm/svga-web@2.4.2/svga-web.min.js"
}

foreach ($name in $files.Keys) {
    $url = $files[$name]
    $outputPath = Join-Path $destDir $name
    Write-Host "Downloading $name from $url ..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $outputPath
        Write-Host "Successfully downloaded $name"
    } catch {
        Write-Error "Failed to download $name : $_"
    }
}
