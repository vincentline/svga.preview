# 修复git-push.ps1的编码问题
$scriptPath = "$PSScriptRoot\git-push.ps1"
$content = Get-Content -Path $scriptPath -Encoding UTF8
[System.IO.File]::WriteAllLines($scriptPath, $content, [System.Text.UTF8Encoding]::new($true))
Write-Host "已将git-push.ps1转换为UTF-8 with BOM编码" -ForegroundColor Green