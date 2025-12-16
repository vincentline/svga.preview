#!/usr/bin/env python3
"""
支持SharedArrayBuffer的本地HTTP服务器
用于ffmpeg.wasm等需要跨域隔离的库
"""

import http.server
import socketserver

PORT = 8081

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加跨域隔离头，启用SharedArrayBuffer
        # 使用 credentialless 代替 require-corp，允许从 CDN 加载资源
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'credentialless')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        super().end_headers()

    def do_GET(self):
        # 处理wasm文件的MIME类型
        if self.path.endswith('.wasm'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/wasm')
            self.end_headers()
            with open('.' + self.path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            super().do_GET()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"服务器启动成功！")
        print(f"请访问: http://localhost:{PORT}")
        print(f"按 Ctrl+C 停止服务器")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
