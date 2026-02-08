from playwright.sync_api import sync_playwright
import time
import datetime

def capture_browser_errors():
    # 创建带时间戳的日志文件
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = f"browser_errors_{timestamp}.log"
    
    print(f"开始捕获浏览器错误，日志将保存到: {log_file}")
    
    console_logs = []
    
    with sync_playwright() as p:
        # 启动带界面的浏览器
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        # 设置控制台日志捕获
        def handle_console_message(msg):
            timestamp_str = datetime.datetime.now().strftime("%H:%M:%S")
            location = f" ({msg.location['url']}:{msg.location['line']}:{msg.location['column']})" if msg.location else ""
            log_entry = f"[{timestamp_str}] [{msg.type.upper()}] {msg.text}{location}"
            console_logs.append(log_entry)
            
            # 只显示错误和警告
            if msg.type in ["error", "warning"]:
                print(log_entry)
        
        page.on("console", handle_console_message)
        
        # 导航到应用
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        
        print("\n浏览器已打开，正在捕获错误...")
        print("请在浏览器中进行各种操作，错误将被自动捕获")
        print("按 Ctrl+C 停止捕获\n")
        
        try:
            # 持续运行，直到用户中断
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n停止捕获错误...")
        
        browser.close()
    
    # 保存日志到文件
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write('=== 浏览器错误捕获日志 ===\n')
        f.write(f'开始时间: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n')
        f.write('\n'.join(console_logs))
        f.write(f'\n\n结束时间: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
    
    error_count = sum(1 for log in console_logs if "[ERROR]" in log)
    warning_count = sum(1 for log in console_logs if "[WARNING]" in log)
    
    print(f"\n捕获到 {len(console_logs)} 条控制台消息")
    print(f"其中包含: {error_count} 个错误, {warning_count} 个警告")
    print(f"日志已保存到: {log_file}")

if __name__ == "__main__":
    capture_browser_errors()
