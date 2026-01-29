#!/usr/bin/env powershell
# -*- coding: utf-8 -*-
# 启动支持 SharedArrayBuffer 的 HTTP 服务器，用于 FFmpeg.wasm
# 注意：此脚本必须使用 UTF-8 with BOM 编码保存，否则中文会显示为乱码

# 设置编码为 UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
[System.Console]::InputEncoding = [System.Text.UTF8Encoding]::new()

Write-Output "正在启动支持 SharedArrayBuffer 的服务器..."
Write-Output "访问地址: http://localhost:8081/index.html"
Write-Output ""
Write-Output "注意：此服务器启用了 Cross-Origin-Opener-Policy 头"
Write-Output "      这是 FFmpeg.wasm 和其他 WASM 库所必需的。"
Write-Output ""
Write-Output "按 Ctrl+C 停止服务器"
Write-Output ""

# 使用自定义的 Python 服务器，带有 COOP/COEP 头
# 调用根目录下的 start_server.py 文件
python ../start_server.py
