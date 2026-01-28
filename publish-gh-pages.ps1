# Publish script: Deploy docs directory to gh-pages branch
# Features: Close Node processes, check and commit Git changes, publish docs to gh-pages
# Note: This script must be saved in UTF-8 encoding

# Set encoding to UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== Publish to gh-pages Branch Script ==="

# 1. Check and close Node processes
Write-Host "\n1. Checking Node processes..."
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $processCount = $nodeProcesses.Count
        Write-Host "Found $processCount Node processes, closing..."
        foreach ($process in $nodeProcesses) {
            $process | Stop-Process -Force -ErrorAction SilentlyContinue
        }
        Write-Host "Successfully closed all Node processes"
    } else {
        Write-Host "No Node processes found"
    }
} catch {
    Write-Host "Error: Failed to close Node processes: $($_.Exception.Message)"
    exit 1
}

# 2. Check Git status and commit changes
Write-Host "\n2. Checking Git status..."
try {
    # Check if in Git repository
    $gitStatus = git status --short 2>$null
    if (-not $gitStatus) {
        Write-Host "No changes to commit"
    } else {
        Write-Host "Found uncommitted changes, calling commit script..."
        # Call existing git-push.ps1 script
        $gitPushScriptPath = Join-Path -Path $PSScriptRoot -ChildPath "git-push.ps1"
        if (Test-Path $gitPushScriptPath) {
            & $gitPushScriptPath
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Error: Failed to commit changes"
                exit 1
            }
            Write-Host "Successfully committed changes"
        } else {
            Write-Host "Error: git-push.ps1 script not found"
            exit 1
        }
    }
} catch {
    Write-Host "Error: Failed to check Git status: $($_.Exception.Message)"
    exit 1
}

# 3. Publish docs directory to gh-pages branch
Write-Host "\n3. Publishing docs directory to gh-pages branch..."
try {
    # Check if docs directory exists
    $docsPath = Join-Path -Path $PSScriptRoot -ChildPath "docs"
    if (-not (Test-Path $docsPath)) {
        Write-Host "Error: docs directory does not exist"
        exit 1
    }
    
    # Use git subtree split to separate docs directory into independent commit
    Write-Host "[进度] 正在分离docs目录... (此步骤可能需要几分钟)"
    Write-Host "[进度] 正在执行: git subtree split --prefix docs main"
    $splitHash = git subtree split --prefix docs main 2>&1
    
    Write-Host "[进度] 分离完成，正在处理结果..."
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to separate docs directory: $splitHash"
        exit 1
    }
    
    # Remove possible error messages, keep only hash value
    Write-Host "[进度] 正在提取提交哈希值..."
    $splitHash = $splitHash | Where-Object { $_ -match '^[0-9a-f]{40}$' }
    if (-not $splitHash) {
        Write-Host "Error: Failed to get separated commit hash"
        exit 1
    }
    
    Write-Host "Successfully separated docs directory, commit hash: $splitHash"
    
    # Push separated commit to gh-pages branch
    Write-Host "[进度] 正在推送到gh-pages分支..."
    Write-Host "[进度] 正在执行: git push origin ${splitHash}:refs/heads/gh-pages --force"
    $pushResult = git push origin ${splitHash}:refs/heads/gh-pages --force 2>&1
    
    Write-Host "[进度] 推送完成，正在检查结果..."
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Push failed: $pushResult"
        exit 1
    }
    
    Write-Host "Success: docs directory has been published to gh-pages branch"
} catch {
    Write-Host "Error: Failed to publish to gh-pages branch: $($_.Exception.Message)"
    exit 1
}

Write-Host "\n=== Publish Complete ==="
Write-Host "docs directory has been successfully published to gh-pages branch"