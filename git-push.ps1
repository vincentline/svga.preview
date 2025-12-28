# Git 安全推送脚本 - 自动避免分叉
# 使用方法：右键选择"使用PowerShell运行"或在终端运行：PowerShell.exe -ExecutionPolicy Bypass -File git-push.ps1

$ErrorActionPreference = 'Stop'
# 自动定位到脚本所在目录
Set-Location $PSScriptRoot

Write-Host "==== Git 安全推送 ====" -ForegroundColor Cyan

# 0. 检查当前分支
Write-Host "`n0. 检查当前分支..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "当前分支: $currentBranch" -ForegroundColor Green

if ($currentBranch -ne "main") {
    Write-Host "警告: 当前不在main分支" -ForegroundColor Red
    $switch = Read-Host "是否切换到main分支? (y/n)"
    if ($switch -eq "y" -or $switch -eq "Y") {
        git checkout main
        if ($LASTEXITCODE -ne 0) {
            Write-Host "切换分支失败" -ForegroundColor Red
            pause
            exit 1
        }
    } else {
        Write-Host "已取消" -ForegroundColor Yellow
        pause
        exit 0
    }
}

# 1. 检查是否有修改
Write-Host "`n1. 检查本地修改..." -ForegroundColor Yellow
$status = git status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "没有需要提交的修改" -ForegroundColor Green
    pause
    exit 0
}

Write-Host "发现以下修改：" -ForegroundColor Green
git status --short

# 2. 添加所有修改
Write-Host "`n2. 添加所有修改..." -ForegroundColor Yellow
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "添加文件失败" -ForegroundColor Red
    pause
    exit 1
}

# 3. 提交（如果需要）
$commitMsg = Read-Host "`n请输入提交信息（直接回车使用默认信息）"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "更新: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Write-Host "提交信息: $commitMsg" -ForegroundColor Green
git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) {
    Write-Host "提交失败" -ForegroundColor Red
    pause
    exit 1
}

# 4. 先拉取远程更改（关键步骤！避免分叉）
Write-Host "`n3. 拉取远程更改（避免分叉）..." -ForegroundColor Yellow

# 重试机制：应对Qoder后台Git进程占用文件锁
$maxRetries = 3
$retryCount = 0
$pullSuccess = $false

# 临时关闭错误停止，让重试逻辑能正常工作
$ErrorActionPreference = 'Continue'

while (-not $pullSuccess -and $retryCount -lt $maxRetries) {
    $output = git pull --no-rebase origin main 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pullSuccess = $true
        Write-Host "拉取成功" -ForegroundColor Green
    } else {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "文件被占用，等待3秒后重试... ($retryCount/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
}

# 恢复错误停止
$ErrorActionPreference = 'Stop'

if (-not $pullSuccess) {
    Write-Host "拉取失败，尝试直接推送..." -ForegroundColor Yellow
}

# 5. 推送
Write-Host "`n4. 推送到远程..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "推送失败" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "`n==== 完成！ ====" -ForegroundColor Green
Write-Host "代码已安全推送到GitHub" -ForegroundColor Green
pause
