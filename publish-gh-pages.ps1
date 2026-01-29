#!/usr/bin/env powershell
# 发布脚本：将 docs 目录部署到 gh-pages 分支
# 功能：关闭 Node 进程，检查并提交 Git 更改，将 docs 发布到 gh-pages 分支
# 注意：此脚本必须使用 UTF-8 with BOM 编码保存，否则中文会显示为乱码

# 设置编码为 UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
[System.Console]::InputEncoding = [System.Text.UTF8Encoding]::new()

Write-Host "=== 发布到 gh-pages 分支脚本 ==="

# 1. 检查并关闭 Node 进程
Write-Host "\n1. 检查 Node 进程..."
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $processCount = $nodeProcesses.Count
        Write-Host "发现 $processCount 个 Node 进程，正在关闭..."
        foreach ($process in $nodeProcesses) {
            $process | Stop-Process -Force -ErrorAction SilentlyContinue
        }
        Write-Host "成功关闭所有 Node 进程"
    } else {
        Write-Host "未发现 Node 进程"
    }
} catch {
    Write-Host "错误：关闭 Node 进程失败：$($_.Exception.Message)"
    exit 1
}

# 2. 检查 Git 状态并提交更改
Write-Host "\n2. 检查 Git 状态..."
try {
    # 检查是否在 Git 仓库中
    $gitStatus = git status --short 2>$null
    if (-not $gitStatus) {
        Write-Host "没有需要提交的更改"
    } else {
        Write-Host "发现未提交的更改，正在调用提交脚本..."
        # 调用现有的 git-push.ps1 脚本
        $gitPushScriptPath = Join-Path -Path $PSScriptRoot -ChildPath "git-push.ps1"
        if (Test-Path $gitPushScriptPath) {
            & $gitPushScriptPath
            if ($LASTEXITCODE -ne 0) {
                Write-Host "错误：提交更改失败"
                exit 1
            }
            Write-Host "成功提交更改"
        } else {
            Write-Host "错误：未找到 git-push.ps1 脚本"
            exit 1
        }
    }
} catch {
    Write-Host "错误：检查 Git 状态失败：$($_.Exception.Message)"
    exit 1
}

# 3. 将 docs 目录发布到 gh-pages 分支
Write-Host "\n3. 正在将 docs 目录发布到 gh-pages 分支..."
try {
    # 检查 docs 目录是否存在
    $docsPath = Join-Path -Path $PSScriptRoot -ChildPath "docs"
    if (-not (Test-Path $docsPath)) {
        Write-Host "错误：docs 目录不存在"
        exit 1
    }
    
    # 使用 git subtree split 将 docs 目录分离为独立的提交
    Write-Host "[进度] 正在分离 docs 目录... (此步骤可能需要几分钟)"
    Write-Host "[进度] 正在执行: git subtree split --prefix docs main"
    $splitHash = git subtree split --prefix docs main 2>&1
    
    Write-Host "[进度] 分离完成，正在处理结果..."
    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误：分离 docs 目录失败：$splitHash"
        exit 1
    }
    
    # 移除可能的错误消息，只保留哈希值
    Write-Host "[进度] 正在提取提交哈希值..."
    $splitHash = $splitHash | Where-Object { $_ -match '^[0-9a-f]{40}$' }
    if (-not $splitHash) {
        Write-Host "错误：获取分离的提交哈希值失败"
        exit 1
    }
    
    Write-Host "成功分离 docs 目录，提交哈希值：$splitHash"
    
    # 将分离的提交推送到 gh-pages 分支
    Write-Host "[进度] 正在推送到 gh-pages 分支..."
    Write-Host "[进度] 正在执行: git push origin ${splitHash}:refs/heads/gh-pages --force"
    $pushResult = git push origin ${splitHash}:refs/heads/gh-pages --force 2>&1
    
    Write-Host "[进度] 推送完成，正在检查结果..."
    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误：推送失败：$pushResult"
        exit 1
    }
    
    Write-Host "成功：docs 目录已发布到 gh-pages 分支"
} catch {
    Write-Host "错误：发布到 gh-pages 分支失败：$($_.Exception.Message)"
    exit 1
}

Write-Host "\n=== 发布完成 ==="
Write-Host "docs 目录已成功发布到 gh-pages 分支"
