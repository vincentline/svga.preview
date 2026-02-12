from playwright.sync_api import sync_playwright
import time

def test_homepage_loading():
    """测试主页加载是否成功，无Vue组件注册失败错误"""
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        # 开启控制台日志捕获
        console_logs = []
        def handle_console_message(msg):
            console_logs.append(msg.text)
            print(f"控制台: {msg.text}")
        
        page.on('console', handle_console_message)
        
        # 访问开发服务器
        page.goto('http://localhost:4004/')
        
        # 等待页面加载完成
        page.wait_for_load_state('networkidle')
        
        # 等待3秒，确保所有组件都已加载
        time.sleep(3)
        
        # 检查是否有Vue组件注册失败的错误
        vue_error_found = False
        for log in console_logs:
            if "Vue还没加载" in log or "Vue组件注册失败" in log:
                vue_error_found = True
                print(f"发现Vue组件注册错误: {log}")
        
        # 截图保存
        page.screenshot(path='test_homepage_loading.png', full_page=True)
        print("已保存主页截图: test_homepage_loading.png")
        
        # 关闭浏览器
        browser.close()
        
        # 返回测试结果
        if vue_error_found:
            print("❌ 测试失败: 发现Vue组件注册错误")
            return False
        else:
            print("✅ 测试通过: 主页加载成功，无Vue组件注册错误")
            return True

if __name__ == "__main__":
    test_homepage_loading()
