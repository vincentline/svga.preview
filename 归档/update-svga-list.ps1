# 自动生成 SVGA 文件列表
# Auto-generate SVGA file list

Write-Output "正在扫描 assets/svga/ 目录..."

$svgaDir = Join-Path (Get-Location) "docs\assets\svga"
$outputFile = Join-Path $svgaDir "file-list.json"

if (-not (Test-Path $svgaDir)) {
    Write-Error "目录不存在: $svgaDir"
    exit 1
}

# 获取所有 .svga 文件
$svgaFiles = Get-ChildItem -Path $svgaDir -Filter "*.svga" | Select-Object -ExpandProperty Name

if ($svgaFiles.Count -eq 0) {
    Write-Warning "未找到任何 SVGA 文件"
    # 创建空数组
    $jsonContent = "[]"
} else {
    Write-Output "找到 $($svgaFiles.Count) 个 SVGA 文件:"
    $svgaFiles | ForEach-Object { Write-Output "  - $_" }
    
    # 生成 JSON 数组
    $jsonArray = $svgaFiles | ConvertTo-Json
    
    # 如果只有一个文件，ConvertTo-Json 不会生成数组，需要手动包装
    if ($svgaFiles.Count -eq 1) {
        $jsonContent = "[$jsonArray]"
    } else {
        $jsonContent = $jsonArray
    }
}

# 写入文件
$jsonContent | Out-File -FilePath $outputFile -Encoding UTF8 -NoNewline

Write-Output ""
Write-Output "文件列表已生成: $outputFile"
Write-Output "完成！"
