from playwright.sync_api import sync_playwright

# 测试双通道MP4弹窗的Vue渲染功能
def test_dual_channel_popup():
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 使用非无头模式以便观察
        page = browser.new_page()
        
        try:
            # 导航到本地开发服务器
            page.goto('http://localhost:4005')
            
            # 等待页面加载完成
            page.wait_for_load_state('networkidle')
            
            # 检查页面是否成功加载
            print("页面加载状态: 成功")
            
            # 检查是否存在Vue实例
            vue_exists = page.evaluate('typeof Vue !== "undefined"')
            print(f"Vue库加载状态: {'已加载' if vue_exists else '未加载'}")
            
            # 检查控制台是否有错误
            console_errors = []
            def capture_console(message):
                if message.type == 'error':
                    console_errors.append(message.text)
            
            page.on('console', capture_console)
            
            # 等待3秒让所有脚本执行完毕
            page.wait_for_timeout(3000)
            
            if console_errors:
                print("控制台错误:")
                for error in console_errors:
                    print(f"- {error}")
            else:
                print("控制台无错误")
            
            # 检查是否存在双通道MP4按钮
            dual_channel_button = page.locator('button:has-text("转双通道MP4")')
            button_exists = dual_channel_button.is_visible()
            print(f"转双通道MP4按钮状态: {'可见' if button_exists else '不可见'}")
            
            if button_exists:
                # 点击按钮打开弹窗
                dual_channel_button.click()
                print("已点击转双通道MP4按钮")
                
                # 等待弹窗出现
                page.wait_for_timeout(2000)
                
                # 检查弹窗是否通过Vue渲染
                # 检查是否存在Vue渲染的弹窗元素
                vue_popup = page.locator('.dual-channel-panel')
                popup_exists = vue_popup.is_visible()
                print(f"双通道MP4弹窗状态: {'可见' if popup_exists else '不可见'}")
                
                if popup_exists:
                    print("✅ 双通道MP4弹窗通过Vue渲染成功!")
                    
                    # 检查弹窗内容
                    popup_content = vue_popup.inner_text()
                    print("弹窗内容:")
                    print(popup_content[:500] + "..." if len(popup_content) > 500 else popup_content)
                    
                    # 检查是否存在转换按钮
                    convert_button = vue_popup.locator('button:has-text("开始转换")')
                    if convert_button.is_visible():
                        print("✅ 开始转换按钮存在!")
                    else:
                        print("❌ 开始转换按钮不存在!")
                else:
                    print("❌ 双通道MP4弹窗未显示!")
            else:
                print("❌ 转双通道MP4按钮不存在!")
                
        finally:
            # 关闭浏览器
            browser.close()

if __name__ == "__main__":
    test_dual_channel_popup()
