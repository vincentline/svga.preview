from playwright.sync_api import sync_playwright
import time

# 测试GIF导出功能的脚本
def test_gif_export():
    with sync_playwright() as p:
        # 启动浏览器，使用非无头模式以便查看操作
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # 导航到开发服务器
        page.goto('http://localhost:4000')
        
        # 等待页面加载完成
        page.wait_for_load_state('networkidle')
        
        # 监听控制台日志
        def log_console_message(msg):
            print(f"[Console] {msg.type}: {msg.text}")
            if msg.type == 'error':
                print(f"[Console Error] {msg.text}")
                print(f"[Console Error Stack] {msg.stack}")
        
        page.on('console', log_console_message)
        
        # 打印页面标题，确认页面加载成功
        print(f"Page title: {page.title()}")
        
        # 检查页面是否有文件上传区域
        try:
            # 查找文件输入元素
            file_input = page.locator('input[type="file"]')
            print(f"Found {file_input.count()} file input elements")
            
            # 检查是否有可拖动区域
            drop_area = page.locator('.drop-overlay')
            print(f"Found drop area: {drop_area.is_visible()}")
            
            # 打印页面中的主要按钮
            buttons = page.locator('button').all()
            print(f"Found {len(buttons)} buttons")
            for i, btn in enumerate(buttons[:10]):  # 只打印前10个按钮
                try:
                    text = btn.text_content().strip()
                    if text:
                        print(f"Button {i}: {text}")
                except:
                    pass
            
            # 等待用户操作：拖入一个SVGA文件并尝试导出GIF
            print("\n请在浏览器中执行以下操作：")
            print("1. 拖入一个SVGA文件到页面中")
            print("2. 等待文件加载完成")
            print("3. 点击'转GIF'按钮")
            print("4. 设置导出参数并点击'开始转GIF'按钮")
            print("\n观察控制台日志，查看GIF导出过程中的错误信息...")
            print("\n按Ctrl+C停止脚本...")
            
            # 保持脚本运行，以便观察控制台日志
            while True:
                time.sleep(1)
                
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test_gif_export()