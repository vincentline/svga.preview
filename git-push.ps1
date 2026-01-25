# 简单的Git推送脚本
# 使用方法: PowerShell.exe -ExecutionPolicy Bypass -File git-push-new.ps1

# 设置PowerShell输出编码为UTF-8
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
[System.Console]::InputEncoding = [System.Text.UTF8Encoding]::new()

# 确保PowerShell使用UTF-8编码
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# 设置Git输出编码为UTF-8
git config --global core.quotepath false 2>$null
git config --global i18n.commitencoding utf-8 2>$null
git config --global i18n.logoutputencoding utf-8 2>$null

# 注意：此脚本必须使用UTF-8 with BOM编码保存，否则中文会显示为乱码

Write-Host "=== Git推送脚本 ===" -ForegroundColor Cyan

# 获取当前分支
$currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
if (-not $currentBranch) {
    Write-Host "错误: 不在git仓库中" -ForegroundColor Red
    exit 1
}
Write-Host "当前分支: $currentBranch" -ForegroundColor Green

# 检查变更
$status = git status --short 2>$null
if (-not $status) {
    Write-Host "没有需要提交的变更" -ForegroundColor Green
    exit 0
}

Write-Host "发现变更:" -ForegroundColor Green
git status --short

# 解析UPDATE_LOG.md，提取文件路径与更新简述的对应关系
function Get-UpdateLogMapping {
    param (
        [string]$logFilePath
    )
    
    if (-not (Test-Path $logFilePath)) {
        return @{}
    }
    
    try {
        $logContent = Get-Content -Path $logFilePath -Encoding UTF8
        $mapping = @{}
        
        foreach ($line in $logContent) {
            # 跳过空行和注释行
            if ([string]::IsNullOrWhiteSpace($line) -or $line -match '^\s*#') {
                continue
            }
            
            # 找到第一个" - "分隔符
            $sepIndex = $line.IndexOf(" - ")
            if ($sepIndex -eq -1) {
                continue
            }
            
            # 提取路径部分和描述部分
            $pathPart = $line.Substring(0, $sepIndex)
            $descPart = $line.Substring($sepIndex + 3).Trim()
            
            # 从路径部分中提取实际的文件路径
            # 路径部分格式：[时间戳] 【操作类型】 : 路径信息
            $pathStartIndex = $pathPart.IndexOf(":")
            if ($pathStartIndex -eq -1) {
                continue
            }
            
            $filePath = $pathPart.Substring($pathStartIndex + 1).Trim()
            if ($filePath -and $descPart) {
                $mapping[$filePath] = $descPart
            }
        }
        
        return $mapping
    } catch {
        return @{}
    }
}

# 获取变更详情（在add之前获取，确保能获取到所有变更）
$changes = git status --short 2>$null
$changeDetails = ""
if ($changes) {
    # 解析UPDATE_LOG.md
    $updateLogPath = Join-Path -Path $PSScriptRoot -ChildPath "UPDATE_LOG.md"
    $updateLogMapping = Get-UpdateLogMapping -logFilePath $updateLogPath
    
    # 确保变更详情使用正确的编码，并按行格式化
    $changeDetails = "`n变更详情:`n"
    $changes -split '\r?\n' | ForEach-Object {
        $changeLine = $_
        # 跳过空行
        if ([string]::IsNullOrWhiteSpace($changeLine)) {
            continue
        }
        
        # 提取文件路径（格式：XY file/path）
        $filePath = $changeLine -replace '^\s*[MADRCU?!]\s+', ''
        
        # 查找对应的更新简述
        $changeDetails += "  $($changeLine.Trim())"
        if ($updateLogMapping.ContainsKey($filePath)) {
            $changeDetails += " - $($updateLogMapping[$filePath])"
        }
        $changeDetails += "`n"
    }
}

# 添加所有变更
git add -A 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "添加变更失败" -ForegroundColor Red
    exit 1
}

# 提交变更
$commitMsg = "自动更新: $(Get-Date -Format 'yyyy-MM-dd HH:mm')$changeDetails"
git commit -m $commitMsg 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "提交变更失败" -ForegroundColor Red
    exit 1
}

# 先拉取变更
git pull --no-rebase origin main 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "警告: 拉取失败，尝试直接推送..." -ForegroundColor Yellow
}

# 推送变更
git push origin main 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n成功: 变更已推送到GitHub" -ForegroundColor Green
} else {
    Write-Host "`n推送变更失败" -ForegroundColor Red
    exit 1
}

Write-Host "=== 完成 ===" -ForegroundColor Cyan