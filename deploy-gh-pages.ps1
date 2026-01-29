#!/usr/bin/env powershell
# Deploy script: Publish docs directory to gh-pages branch
# Features: Close Node processes, commit changes, deploy docs to gh-pages

# Set encoding to UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
[System.Console]::InputEncoding = [System.Text.UTF8Encoding]::new()

Write-Host "=== Deploy to gh-pages Branch Script ==="

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
    
    # Save current branch
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "[Progress] Current branch: $currentBranch"
    
    # Create temporary directory
    $tempDir = Join-Path -Path $env:TEMP -ChildPath "gh-pages-deploy-$(Get-Random)"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Write-Host "[Progress] Created temporary directory: $tempDir"
    
    # Clone repository to temporary directory
    Write-Host "[Progress] Cloning repository to temporary directory..."
    git clone "file://$PSScriptRoot" "$tempDir"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to clone repository"
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    # Switch to temporary directory
    cd $tempDir
    
    # Switch to gh-pages branch
    Write-Host "[Progress] Switching to gh-pages branch..."
    $ghPagesExists = git show-ref --verify --quiet refs/heads/gh-pages
    if ($LASTEXITCODE -ne 0) {
        # If gh-pages branch does not exist, create a new one
        Write-Host "[Progress] gh-pages branch does not exist, creating new branch..."
        git checkout --orphan gh-pages
        git reset --hard
        git commit --allow-empty -m "Initial commit for gh-pages"
    } else {
        # If gh-pages branch exists, switch to it
        git checkout gh-pages
    }
    
    # Clear gh-pages branch content
    Write-Host "[Progress] Clearing gh-pages branch content..."
    $filesToKeep = @(".git", ".gitignore", "CNAME", "_headers", "vercel.json")
    $allFiles = Get-ChildItem -Force | Where-Object { $_.Name -notin $filesToKeep }
    $totalFiles = $allFiles.Count
    $currentFile = 0
    foreach ($file in $allFiles) {
        $currentFile++
        Write-Host "[Progress] Deleting file " $currentFile "/" $totalFiles ": " $file.Name
        Remove-Item $file.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Copy docs directory content
    Write-Host "[Progress] Copying docs directory content..."
    $mainDocsPath = Join-Path -Path $PSScriptRoot -ChildPath "docs"
    $docsFiles = Get-ChildItem -Path $mainDocsPath -Recurse
    $totalDocsFiles = $docsFiles.Count
    $currentDocsFile = 0
    foreach ($file in $docsFiles) {
        $currentDocsFile++
        $relativePath = $file.FullName.Substring($mainDocsPath.Length + 1)
        $targetPath = Join-Path -Path $tempDir -ChildPath $relativePath
        $targetDir = Split-Path -Path $targetPath -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item -Path $file.FullName -Destination $targetPath -Force -ErrorAction SilentlyContinue
        Write-Host "[Progress] Copying file " $currentDocsFile "/" $totalDocsFiles ": " $relativePath
    }
    
    # Add all files and commit
    Write-Host "[Progress] Adding all files and committing..."
    git add .
    $commitMsg = "Deploy docs to gh-pages: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git commit -m $commitMsg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: No changes to commit"
    }
    
    # Push to gh-pages branch with force
    Write-Host "[Progress] Pushing to gh-pages branch..."
    git push --force origin gh-pages
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Push failed"
        cd $PSScriptRoot
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    # Switch back to original branch
    git checkout $currentBranch
    
    # Clean up temporary directory
    cd $PSScriptRoot
    Write-Host "[Progress] Cleaning up temporary directory"
    # 等待几秒钟，确保所有文件都已释放
    Start-Sleep -Seconds 2
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host "Success: docs directory has been published to gh-pages branch"
} catch {
    Write-Host "Error: Failed to publish to gh-pages branch: $($_.Exception.Message)"
    try {
        cd $PSScriptRoot
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    } catch {
        # Ignore cleanup errors
    }
    exit 1
}

Write-Host "\n=== Deploy Complete ==="
Write-Host "docs directory has been successfully published to gh-pages branch"
