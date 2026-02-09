from playwright.sync_api import sync_playwright
import time
import os

# 自动测试GIF导出功能的脚本
def test_gif_export_auto():
    with sync_playwright() as p:
        # 启动浏览器，使用非无头模式以便查看操作
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # 导航到开发服务器
        page.goto('http://localhost:4000')
        
        # 等待页面加载完成
        page.wait_for_load_state('networkidle')
        
        # 监听控制台日志
        console_logs = []
        def log_console_message(msg):
            log_entry = f"[{msg.type}] {msg.text}"
            console_logs.append(log_entry)
            print(log_entry)
            if msg.type == 'error':
                error_log = f"[ERROR] {msg.text}"
                console_logs.append(error_log)
                print(error_log)
                if msg.stack:
                    stack_log = f"[ERROR STACK] {msg.stack}"
                    console_logs.append(stack_log)
                    print(stack_log)
        
        page.on('console', log_console_message)
        
        # 打印页面标题，确认页面加载成功
        print(f"Page title: {page.title()}")
        
        try:
            # 查找文件输入元素
            file_input = page.locator('input[type="file"]').first
            print(f"Found file input element: {file_input.is_visible()}")
            
            # 上传一个测试SVGA文件
            # 注意：需要替换为实际存在的测试文件路径
            test_file_path = os.path.join(os.path.dirname(__file__), 'src', 'assets', 'svga', 'kangua_05.svga')
            print(f"Testing with file: {test_file_path}")
            
            if os.path.exists(test_file_path):
                # 上传文件
                file_input.set_input_files(test_file_path)
                print("File uploaded successfully")
                
                # 等待文件加载完成
                time.sleep(3)
                
                # 点击'转GIF'按钮
                gif_button = page.locator('button:has-text("开始转GIF")')
                if gif_button.is_visible():
                    print("Found GIF export button")
                    
                    # 点击按钮开始导出
                    gif_button.click()
                    print("Started GIF export")
                    
                    # 等待导出过程
                    print("Waiting for export to complete...")
                    
                    # 等待最多60秒
                    for i in range(60):
                        time.sleep(1)
                        
                        # 检查是否有错误日志
                        error_logs = [log for log in console_logs if '[ERROR]' in log]
                        if error_logs:
                            print("\nErrors found during export:")
                            for error in error_logs:
                                print(error)
                            break
                        
                        # 检查是否有完成日志
                        completion_logs = [log for log in console_logs if 'Encoding completed' in log]
                        if completion_logs:
                            print("\nExport completed successfully!")
                            break
                        
                        print(f"Waiting for {i+1} seconds...")
                else:
                    print("GIF export button not found, trying to find '转GIF' button")
                    
                    # 尝试找到'转GIF'按钮
                    convert_gif_button = page.locator('button:has-text("转GIF")')
                    if convert_gif_button.is_visible():
                        print("Found '转GIF' button")
                        convert_gif_button.click()
                        print("Clicked '转GIF' button")
                        
                        # 等待面板打开
                        time.sleep(2)
                        
                        # 点击开始转GIF按钮
                        start_gif_button = page.locator('button:has-text("开始转GIF")')
                        if start_gif_button.is_visible():
                            print("Found '开始转GIF' button")
                            # 滚动到按钮位置
                            start_gif_button.scroll_into_view_if_needed()
                            print("Scrolled to button position")
                            # 等待按钮可点击
                            start_gif_button.wait_for(state='visible', timeout=10000)
                            print("Button is visible and ready")
                            # 点击按钮
                            start_gif_button.click()
                            print("Started GIF export")
                        
                        # 等待导出过程
                        print("Waiting for export to complete...")
                        
                        # 等待最多120秒
                        for i in range(120):
                            time.sleep(1)
                            
                            # 检查是否有错误日志
                            error_logs = [log for log in console_logs if '[ERROR]' in log]
                            if error_logs:
                                print("\nErrors found during export:")
                                for error in error_logs:
                                    print(error)
                                break
                            
                            # 检查是否有完成日志
                            completion_logs = [log for log in console_logs if 'Encoding completed' in log]
                            if completion_logs:
                                print("\nExport completed successfully!")
                                break
                            
                            # 检查是否有进度日志
                            progress_logs = [log for log in console_logs if 'encoding' in log.lower()]
                            if progress_logs and i % 10 == 0:
                                print(f"\nProgress logs:")
                                for log in progress_logs[-5:]:
                                    print(log)
                            
                            if i % 5 == 0:
                                print(f"Waiting for {i+1} seconds...")
                                # 打印最新的10条日志
                                if console_logs:
                                    print("Latest logs:")
                                    for log in console_logs[-10:]:
                                        print(log)
                        else:
                            print("'开始转GIF' button not found")
                    else:
                        print("'转GIF' button not found")
            else:
                print(f"Test file not found: {test_file_path}")
                
        except Exception as e:
            print(f"Error: {e}")
        finally:
            # 保存控制台日志到文件
            with open('gif_export_logs.txt', 'w', encoding='utf-8') as f:
                f.write('\n'.join(console_logs))
            print("\nConsole logs saved to gif_export_logs.txt")
            
            # 关闭浏览器
            browser.close()

if __name__ == "__main__":
    test_gif_export_auto()