from playwright.sync_api import sync_playwright
import time

# 使用 with_server.py 管理服务器的监控脚本
def monitor_console_logs():
    print("=== MeeWoo 浏览器控制台日志监控 ===")
    print("正在启动浏览器...")
    
    with sync_playwright() as p:
        # 启动 Chromium 浏览器（有头模式）
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # 设置控制台日志监听
        def handle_console_message(msg):
            print(f"[控制台] {msg.type}: {msg.text}")
            # 如果有错误，突出显示
            if msg.type == "error":
                print(f"[错误] {msg.text}")
            # 如果有警告，显示为黄色
            elif msg.type == "warning":
                print(f"[警告] {msg.text}")
        
        page.on("console", handle_console_message)
        
        # 导航到开发服务器
        print("导航到 http://localhost:4000/")
        page.goto("http://localhost:4000/")
        
        # 等待页面加载完成
        print("等待页面加载完成...")
        page.wait_for_load_state('networkidle')
        
        print("页面加载完成，开始监控控制台日志...")
        print("按 Ctrl+C 停止监控")
        
        try:
            # 保持脚本运行，持续监控日志
            while True:
                # 每 1 秒检查一次，避免占用过多资源
                page.wait_for_timeout(1000)
        except KeyboardInterrupt:
            print("\n停止监控...")
        finally:
            # 关闭浏览器
            browser.close()
            print("浏览器已关闭")

if __name__ == "__main__":
    monitor_console_logs()