# ... existing code ...
# Wrapper script: run deploy.ps1 with ExecutionPolicy bypass

$deployScript = Join-Path (Get-Location) "deploy.ps1"

if (-not (Test-Path $deployScript)) {
  Write-Host "[ERROR] deploy.ps1 not found in current directory." -ForegroundColor Red
  Write-Host "Please make sure you run this script in the project root."
  Read-Host "Press Enter to exit..."
  exit 1
}

Write-Host "Running deploy.ps1 with ExecutionPolicy Bypass..."
powershell -ExecutionPolicy Bypass -File "$deployScript"
# ... existing code ...