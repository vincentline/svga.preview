Write-Host "==== Git Sync Script ====" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".git")) {
    Write-Host "Error: Not a git repository" -ForegroundColor Red
    pause
    exit 1
}

$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

if ($currentBranch -ne "master") {
    Write-Host "Warning: Not on master branch" -ForegroundColor Red
    $switch = Read-Host "Switch to master? (y/n)"
    if ($switch -eq "y" -or $switch -eq "Y") {
        git checkout master
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Switch failed" -ForegroundColor Red
            pause
            exit 1
        }
    } else {
        Write-Host "Cancelled" -ForegroundColor Yellow
        pause
        exit 0
    }
}

Write-Host ""
Write-Host "Step 1: Pulling..." -ForegroundColor Green
git pull origin master
if ($LASTEXITCODE -ne 0) {
    Write-Host "Pull failed" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Step 2: Checking changes..." -ForegroundColor Green
git status

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit" -ForegroundColor Yellow
    pause
    exit 0
}

Write-Host ""
Write-Host "Step 3: Adding files..." -ForegroundColor Green
git add .

Write-Host ""
$commitMsg = Read-Host "Commit message (Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Write-Host ""
Write-Host "Step 4: Committing..." -ForegroundColor Green
git commit -m "$commitMsg"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Step 5: Pushing..." -ForegroundColor Green
git push origin master
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "==== Sync Complete ====" -ForegroundColor Green
Write-Host "All changes pushed to master" -ForegroundColor Cyan
pause
