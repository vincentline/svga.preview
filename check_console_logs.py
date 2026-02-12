#!/usr/bin/env python3
"""
检查浏览器控制台日志，了解弹窗未显示的原因
"""

import time
from playwright.sync_api import sync_playwright

# 测试文件路径
TEST_SVGA_FILE = r"f:\my_tools\MeeWoo\MeeWoo\src\assets\svga\kangua_05.svga"

# 测试页面URL
TEST_URL = "http://localhost:4004"

def check_console_logs():
    """检查浏览器控制台日志"""
    print("开始检查浏览器控制台日志...")
    print(f"测试文件: {TEST_SVGA_FILE}")
    print(f"测试页面: {TEST_URL}")
    
    console_logs = []
    
    def capture_console(msg):
        """捕获控制台日志"""
        log_entry = {
            "type": msg.type,
            "text": msg.text,
            "args": [arg.json_value() if hasattr(arg, 'json_value') else str(arg) for arg in msg.args]
        }
        console_logs.append(log_entry)
        print(f"[{msg.type}] {msg.text}")
    
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(
            headless=False,
            args=["--disable-cache", "--disable-application-cache"]
        )
        
        # 创建新页面
        page = browser.new_page()
        
        # 监听控制台日志
        page.on("console", capture_console)
        
        # 清空缓存并访问测试页面
        page.goto(TEST_URL, wait_until="networkidle")
        
        # 等待页面加载完成
        time.sleep(3)
        
        # 上传测试SVGA文件
        print("上传测试SVGA文件...")
        file_input = page.locator("input[type='file']").first
        file_input.set_input_files(TEST_SVGA_FILE)
        
        # 等待文件加载完成
        print("等待文件加载完成...")
        time.sleep(5)
        
        # 查找并点击"转双通道MP4"按钮
        print("查找并点击'转双通道MP4'按钮...")
        dual_channel_button = page.locator(".btn-large-secondary:has-text('转双通道MP4')")
        
        if dual_channel_button.is_visible():
            print("✓ 找到'转双通道MP4'按钮")
            
            # 点击按钮
            dual_channel_button.click()
            print("✓ 点击了'转双通道MP4'按钮")
            
            # 等待弹窗显示
            time.sleep(3)
            
            # 检查Vue实例和组件注册情况
            print("检查Vue实例和组件注册情况...")
            vue_info = page.evaluate('''
                (() => {
                    const info = {
                        hasVue: typeof Vue !== 'undefined',
                        hasMeeWoo: typeof window.MeeWoo !== 'undefined',
                        hasComponents: window.MeeWoo && typeof window.MeeWoo.Components !== 'undefined',
                        hasDualChannelPanel: window.MeeWoo && window.MeeWoo.Components && typeof window.MeeWoo.Components.DualChannelPanel !== 'undefined',
                        hasPanelMixin: window.MeeWoo && window.MeeWoo.Mixins && typeof window.MeeWoo.Mixins.PanelMixin !== 'undefined',
                        activeRightPanel: window.MeeWoo && window.MeeWoo.app ? window.MeeWoo.app.activeRightPanel : null,
                        appInstance: window.MeeWoo && window.MeeWoo.app ? '存在' : '不存在'
                    };
                    
                    // 检查组件注册
                    if (typeof Vue !== 'undefined') {
                        info.registeredComponents = Object.keys(Vue.options.components);
                    }
                    
                    return info;
                })()
            ''')
            
            print("Vue实例和组件注册情况:")
            for key, value in vue_info.items():
                print(f"  {key}: {value}")
            
            # 检查DOM结构
            print("检查DOM结构...")
            page.screenshot(path="test_screenshot_with_console.png")
            print("已保存截图: test_screenshot_with_console.png")
            
            # 等待3秒后关闭
            time.sleep(3)
            
        else:
            print("✗ 未找到'转双通道MP4'按钮")
            
        # 关闭浏览器
        browser.close()
        
    # 保存控制台日志
    print("保存控制台日志...")
    with open("console_logs_detailed.txt", "w", encoding="utf-8") as f:
        for log in console_logs:
            f.write(f"[{log['type']}] {log['text']}\n")
    print("已保存控制台日志: console_logs_detailed.txt")

if __name__ == "__main__":
    check_console_logs()
