# One-click build & preview/deploy for this VuePress project

$ErrorActionPreference = 'Stop'

function Pause-And-Exit($msg) {
  Write-Host ""
  Write-Host $msg -ForegroundColor Yellow
  Read-Host "Press Enter to exit..."
  exit 1
}

# 1. 确认当前在 main 分支
Write-Host "== Step 0: Check current git branch =="

$branch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
if (-not $branch) {
  Pause-And-Exit "[ERROR] Not a git repository or git not available."
}

Write-Host "Current branch: $branch"
if ($branch -ne "main") {
  Pause-And-Exit "[ERROR] Please switch to 'main' branch in Qoder and run this script again."
}

# 2. 运行构建：npm run build
Write-Host "`n== Step 1: Build static site (npm run build) =="
try {
  npm.cmd run build
} catch {
  Pause-And-Exit "[ERROR] Build failed. Please check the output above."
}

# 简单检查 docs/ 是否存在
if (-not (Test-Path ".\docs")) {
  Pause-And-Exit "[ERROR] Build finished but 'docs' directory not found. Check vuepress config."
}

Write-Host "`nBuild succeeded. Output directory: .\docs"

# 3. 提供操作菜单
Write-Host "`n== Step 2: Choose next action =="
Write-Host "1) Start local dev server and open browser (preview)"
Write-Host "2) Deploy to gh-pages branch (sync docs/, commit & push, then switch back to main)"
Write-Host ""
$choice = Read-Host "Please enter 1 or 2"

if ($choice -eq "1") {
  Write-Host "`n== Option 1: Start local dev server =="

  if (Test-Path ".\run-dev.ps1") {
    Write-Host "Running: ./run-dev.ps1"
    Start-Process powershell -ArgumentList @(
      "-ExecutionPolicy", "Bypass",
      "-File", ".\run-dev.ps1"
    )
  } else {
    Write-Host "run-dev.ps1 not found. Running: npm run dev"
    Start-Process powershell -ArgumentList @(
      "-ExecutionPolicy", "Bypass",
      "-Command", "npm run dev"
    )
  }

  # 默认 VuePress dev 端口一般是 8080 或你当前显示的端口（比如 8081）
  # 如果你习惯固定使用 8081，也可以改成 http://localhost:8081/
  Start-Process "http://localhost:8080"
  Write-Host "`nDev server starting in a new window, browser opened."
  Read-Host "Press Enter to exit this script..."
  exit 0
}

if ($choice -ne "2") {
  Pause-And-Exit "[ERROR] Invalid choice. Please run the script again and enter 1 or 2."
}

# 4. 部署到 gh-pages 分支
Write-Host "`n== Option 2: Deploy to gh-pages =="

Write-Host "`nChecking for uncommitted changes on main..."
$status = git status --porcelain
if ($status) {
  Pause-And-Exit "[ERROR] There are uncommitted changes on 'main'. Please commit or discard them in Qoder, then run this script again."
}

$currentBranch = $branch

Write-Host "`nSwitching to gh-pages branch..."
try {
  git checkout gh-pages
} catch {
  Pause-And-Exit "[ERROR] Failed to switch to 'gh-pages' branch. Make sure it exists locally."
}

Write-Host "`nSyncing static files from 'main:docs/' to 'gh-pages:./' ..."

Get-ChildItem -Path . -Force |
  Where-Object { $_.Name -notin @(".git", "CNAME", "LICENSE", "README.md") } |
  ForEach-Object {
    if ($_.PSIsContainer) {
      Remove-Item $_.FullName -Recurse -Force
    } else {
      Remove-Item $_.FullName -Force
    }
  }

$tempDir = Join-Path $env:TEMP "vuepress_deploy_docs"
if (Test-Path $tempDir) {
  Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Exporting docs/ from main to temp folder..."
git show "$currentBranch:docs" 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Pause-And-Exit "[ERROR] Cannot find 'docs' directory in branch '$currentBranch'. Did you run build on main?"
}

git archive $currentBranch docs | tar -x -C $tempDir

$sourceDocs = Join-Path $tempDir "docs"
if (-not (Test-Path $sourceDocs)) {
  Pause-And-Exit "[ERROR] Docs export failed. Temp docs directory not found."
}

Write-Host "Copying docs/* into gh-pages root..."
Copy-Item (Join-Path $sourceDocs "*") . -Recurse -Force

Write-Host "`nAdding, committing and pushing changes on gh-pages..."
git add .

try {
  git commit -m "chore: update site"
} catch {
  Write-Host "[INFO] No changes to commit on gh-pages."
}

try {
  git push origin gh-pages
} catch {
  Pause-And-Exit "[ERROR] git push origin gh-pages failed. Please check your network or credentials."
}

Write-Host "`nSwitching back to '$currentBranch' branch..."
git checkout $currentBranch

Write-Host "`n== Done =="
Write-Host "Deployed latest docs to 'gh-pages' and switched back to '$currentBranch'."
Read-Host "Press Enter to exit..."