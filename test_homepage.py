from playwright.sync_api import sync_playwright

def test_homepage():
    """测试首页是否正常加载"""
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 访问本地服务器
        page.goto('http://localhost:8000')
        
        # 等待页面加载完成
        page.wait_for_load_state('networkidle')
        
        # 检查页面标题
        title = page.title()
        print(f"页面标题: {title}")
        assert "MeeWoo" in title, "页面标题中应该包含'MeeWoo'"
        
        # 检查页面是否有明显的错误
        errors = []
        
        # 1. 检查控制台错误
        console_errors = []
        def handle_console(message):
            if message.type == 'error':
                console_errors.append(message.text)
        
        page.on('console', handle_console)
        
        # 等待一段时间，确保所有资源都加载完成
        page.wait_for_timeout(2000)
        
        if console_errors:
            errors.append(f"控制台错误: {console_errors}")
        
        # 2. 检查页面主要元素是否存在
        # 检查加载骨架屏是否已隐藏
        loading_skeleton = page.locator('#loading-skeleton')
        if loading_skeleton.is_visible():
            errors.append("页面加载超时，骨架屏未隐藏")
        
        # 检查主应用容器是否存在
        app_container = page.locator('#app')
        if not app_container.is_visible():
            errors.append("主应用容器未找到")
        
        # 检查播放区域是否存在
        viewer_area = page.locator('.viewer-area')
        if not viewer_area.is_visible():
            errors.append("播放区域未找到")
        
        # 3. 检查是否有明显的视觉问题
        # 截取页面截图
        page.screenshot(path='homepage_screenshot.png', full_page=True)
        
        # 4. 检查空状态是否显示
        empty_state = page.locator('.empty-state-overlay')
        if not empty_state.is_visible():
            errors.append("空状态未显示")
        
        # 5. 检查核心功能按钮是否存在
        # 检查主题切换按钮
        theme_toggle = page.locator('.theme-toggle')
        if not theme_toggle.is_visible():
            errors.append("主题切换按钮未找到")
        
        # 检查帮助按钮
        help_button = page.locator('.help-button')
        if not help_button.is_visible():
            errors.append("帮助按钮未找到")
        
        # 关闭浏览器
        browser.close()
        
        # 输出测试结果
        if errors:
            print("测试失败，发现以下问题:")
            for error in errors:
                print(f"- {error}")
            return False
        else:
            print("测试通过，首页加载正常")
            return True

if __name__ == "__main__":
    test_homepage()
