#!/usr/bin/env powershell
# 测试脚本：验证编码是否正确

# 设置编码为 UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
[System.Console]::InputEncoding = [System.Text.UTF8Encoding]::new()

Write-Host "=== 编码测试脚本 ==="
Write-Host "测试中文显示：你好，世界！"
Write-Host "测试变量：$env:USERNAME"
Write-Host "测试完成"
