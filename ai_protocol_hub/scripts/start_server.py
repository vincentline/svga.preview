#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
本地 HTTP 服务器启动脚本

功能：
- 启动一个本地 HTTP 服务器，默认端口为 8085
- 自动检测 docs 目录并将其作为 web 根目录
- 支持 SharedArrayBuffer 所需的 COOP/COEP 头
- 支持跨域访问
- 端口被占用时自动尝试下一个可用端口

作者：MeeWoo 团队
最后修改：2026-01-29
"""

import http.server
import socketserver
import os
import sys

# 配置端口
PORT = 8085


class CoopCoepHandler(http.server.SimpleHTTPRequestHandler):
    """
    自定义 HTTP 请求处理器
    
    添加了启用 SharedArrayBuffer 所必需的 COOP/COEP 头
    以及跨域访问支持
    """
    def end_headers(self):
        """
        结束响应头的处理
        
        添加必要的 HTTP 头：
        - Cross-Origin-Opener-Policy: same-origin
        - Cross-Origin-Embedder-Policy: require-corp
        - Access-Control-Allow-Origin: *
        """
        # 添加启用 SharedArrayBuffer 所必需的头
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        # 允许跨域访问
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


class ReusableTCPServer(socketserver.TCPServer):
    """
    可重用的 TCP 服务器类
    
    允许地址重用，避免端口释放后的 TIME_WAIT 状态导致的绑定失败
    """
    allow_reuse_address = True


def start_server():
    """
    启动本地 HTTP 服务器
    
    步骤：
    1. 检查并设置 web 根目录
    2. 创建可重用的 TCP 服务器实例
    3. 尝试绑定端口并启动服务
    4. 端口被占用时自动尝试下一个可用端口
    """
    # 如果存在 docs 目录，则将其作为 web 根目录
    if os.path.exists("docs"):
        print(f"Found 'docs' directory, using it as web root.")
        os.chdir("docs")
    else:
        print(f"Using current directory as web root.")

    print(f"Starting server...")
    print("Enabled headers: COOP: same-origin, COEP: require-corp")

    # 尝试绑定端口，如果被占用则自动递增
    global PORT
    while True:
        try:
            with ReusableTCPServer(("", PORT), CoopCoepHandler) as httpd:
                print(f"Server started at http://localhost:{PORT}")
                print("Press Ctrl+C to stop")
                httpd.serve_forever()
            break
        except KeyboardInterrupt:
            print("\nServer stopped.")
            break
        except OSError as e:
            # 捕获所有绑定错误，强制尝试下一个端口
            # 常见错误码：98, 10048 (Address already in use), 10013 (Permission denied)
            print(f"Port {PORT} bind failed: {e}")
            print(f"Trying next port {PORT + 1}...")
            PORT += 1


if __name__ == "__main__":
    """
    脚本执行入口
    """
    start_server()