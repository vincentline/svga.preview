# 简单的Git推送脚本
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

# 获取变更详情
$changes = git diff --name-status 2>$null
$changeDetails = ""
if ($changes) {
    # 确保变更详情使用正确的编码
    $changeDetails = "`n变更详情:`n$changes"
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
