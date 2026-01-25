﻿# 简单的Git推送脚本
# 使用方法: PowerShell.exe -ExecutionPolicy Bypass -File git-push.ps1

# 设置PowerShell输出编码为UTF-8
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
[System.Console]::InputEncoding = [System.Text.UTF8Encoding]::new()

# 确保PowerShell使用UTF-8编码
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# 设置Git输出编码为UTF-8
git config --global core.quotepath false 2>$null
git config --global i18n.commitencoding utf-8 2>$null
git config --global i18n.logoutputencoding utf-8 2>$null

# 设置环境变量，确保使用UTF-8编码
$env:LC_ALL="zh_CN.UTF-8"
$env:LANG="zh_CN.UTF-8"
$env:LC_CTYPE="zh_CN.UTF-8"
$env:LC_MESSAGES="zh_CN.UTF-8"

# 确保控制台使用UTF-8代码页
$OutputEncoding = [System.Text.UTF8Encoding]::new()

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
function Get-UpdateLogDetails {
    param (
        [string]$logPath
    )
    
    if (-not (Test-Path $logPath)) {
        Write-Host "警告: UPDATE_LOG.md文件不存在" -ForegroundColor Yellow
        return @{}
    }
    
    try {
        # 使用UTF-8 with BOM编码读取文件
        $logContent = Get-Content -Path $logPath -Encoding UTF8
        $logMap = @{}
        
        # 匹配更新记录行：[时间戳] 【操作类型】 : 路径信息 - 更新简述
        # 修复正则表达式，确保正确匹配完整路径和描述
        $logPattern = '^\[(.+?)\]\s+【(.+?)】\s*:\s+([^\-]+?)\s*\-\s*(.+)$'
        
        foreach ($line in $logContent) {
            # 跳过空行和注释行
            if ([string]::IsNullOrWhiteSpace($line) -or $line -match '^\s*#') {
                continue
            }
            
            if ($line -match $logPattern) {
                # 正确的分组索引：1-时间戳, 2-操作类型, 3-文件路径, 4-描述
                $filePath = $matches[3].Trim()
                $updateDesc = $matches[4].Trim()
                $logMap[$filePath] = $updateDesc
                Write-Host "DEBUG: 解析到记录 - 路径: $filePath, 描述: $updateDesc" -ForegroundColor Gray
            }
        }
        
        return $logMap
    } catch {
        Write-Host "错误: 解析UPDATE_LOG.md失败 - $($_.Exception.Message)" -ForegroundColor Red
        return @{}
    }
}

# 获取变更详情（在add之前获取，确保能获取到所有变更）
$changes = git status --short 2>$null
$changeDetails = ""
if ($changes) {
    # 解析UPDATE_LOG.md
    $updateLogPath = Join-Path -Path $PSScriptRoot -ChildPath "UPDATE_LOG.md"
    Write-Host "DEBUG: UPDATE_LOG.md路径: $updateLogPath" -ForegroundColor Gray
    $updateLogMap = Get-UpdateLogDetails -logPath $updateLogPath
    
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
        Write-Host "DEBUG: 变更文件路径: $filePath" -ForegroundColor Gray
        
        # 查找对应的更新简述
        if ($updateLogMap.ContainsKey($filePath)) {
            $updateDesc = $updateLogMap[$filePath]
            $changeDetails += "  $($changeLine.Trim()) - $updateDesc`n"
            Write-Host "DEBUG: 找到匹配的更新简述: $updateDesc" -ForegroundColor Gray
        } else {
            $changeDetails += "  $($changeLine.Trim())`n"
        }
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
