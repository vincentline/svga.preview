NEW_FILE_CODE
# One-click install & run for this project (ASCII only)

$ErrorActionPreference = 'SilentlyContinue'

Write-Output "== Step 0: Check existing environment =="

$nodeModulesExists = Test-Path .\node_modules
$vuepressLocal = ".\node_modules\.bin\vuepress.cmd"
$vuepressLocalExists = Test-Path $vuepressLocal

if ($nodeModulesExists -and $vuepressLocalExists) {
  Write-Output "[OK] node_modules and local vuepress found. Skip reinstall."
} else {
  Write-Output "[INFO] node_modules or vuepress not found. Will reinstall dependencies."

  Write-Output "== Step 0: Clean old lock & node_modules =="
  if (Test-Path .\package-lock.json) {
    Remove-Item .\package-lock.json -Force
    Write-Output "Removed package-lock.json"
  }
  if (Test-Path .\node_modules) {
    Remove-Item .\node_modules -Recurse -Force
    Write-Output "Removed node_modules"
  }

  Write-Output "`n== Step 1: Install dependencies (try npx npm@10) =="
  $hasNpx = (Get-Command npx -ErrorAction SilentlyContinue) -ne $null
  if ($hasNpx) {
    Write-Output "Running: npx --yes npm@10 install"
    & npx --yes npm@10 install
  } else {
    Write-Output "Running: npm.cmd install"
    & npm.cmd install
  }

  if (-not (Test-Path .\node_modules)) {
    Write-Output "`n[WARN] node_modules not found. Trying registry mirror and reinstall..."
    & npm.cmd config set registry https://registry.npmmirror.com
    if ($hasNpx) {
      & npx --yes npm@10 install
    } else {
      & npm.cmd install
    }
  }

  # 重新计算本地 vuepress 路径
  $vuepressLocalExists = Test-Path $vuepressLocal
}

Write-Output "`n== Step 2: Start dev server =="

$hasNpx = (Get-Command npx -ErrorAction SilentlyContinue) -ne $null

if ($vuepressLocalExists) {
  Write-Output "Running: $vuepressLocal dev ."
  & $vuepressLocal dev .
} elseif ($hasNpx) {
  Write-Output "Running: npx vuepress@1.8.2 dev ."
  & npx vuepress@1.8.2 dev .
} else {
  Write-Output "Running: npm.cmd run dev"
  & npm.cmd run dev
}

Write-Output "`nDone. If it fails, copy the output and send it to me."
Read-Host "Press Enter to exit..."