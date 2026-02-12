#!/usr/bin/env python3
"""
测试Vue渲染方式的双通道MP4弹窗
"""

from playwright.sync_api import sync_playwright
import time


def test_vue_dual_channel_popup():
    """测试Vue渲染方式的双通道MP4弹窗"""
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 非无头模式，便于观察
        page = browser.new_page()
        
        try:
            # 导航到开发服务器
            page.goto('http://localhost:4000/')
            
            # 等待页面加载完成
            page.wait_for_load_state('networkidle')
            print("页面加载完成")
            
            # 加载测试文件
            print("加载测试文件 test.svga")
            # 使用文件输入上传测试文件
            file_input = page.locator('input[type="file"]').nth(0)
            file_input.set_input_files('f:\\my_tools\\MeeWoo\\MeeWoo\\test_files\\test.svga')
            
            # 等待文件加载完成
            time.sleep(5)
            print("测试文件加载完成")
            
            # 截图：初始页面状态
            page.screenshot(path='test_screenshots/vue_test_initial.png')
            print("初始页面截图完成")
            
            # 收集控制台日志
            console_logs = []
            def log_console_message(msg):
                console_logs.append(msg.text)
                print(f"控制台: {msg.text}")
            
            page.on('console', log_console_message)
            
            # 执行测试方法
            print("\n=== 执行Vue渲染测试 ===")
            # 添加更多调试信息
            page.evaluate('console.log("=== 额外调试信息 ===")')
            page.evaluate('console.log("模板是否存在:", document.querySelector("#tpl-dual-channel-panel"))')
            page.evaluate('console.log("Vue实例:", window.MeeWoo.app)')
            page.evaluate('console.log("Vue实例data:", window.MeeWoo.app.$data)')
            page.evaluate('console.log("组件注册:", Vue.options.components)')
            page.evaluate('MeeWoo.Utils.testDualChannelPanel()')
            # 直接测试组件渲染
            page.evaluate('MeeWoo.Utils.testComponentRender()')
            
            # 等待2秒，让测试方法执行完成
            time.sleep(2)
            
            # 检查控制台日志中是否有测试结果
            print("\n=== 分析测试结果 ===")
            
            # 检查是否有错误信息
            errors = [log for log in console_logs if 'error' in log.lower() or 'Error' in log]
            if errors:
                print(f"❌ 发现错误: {len(errors)}")
                for error in errors:
                    print(f"  - {error}")
            else:
                print("✅ 没有发现错误")
            
            # 检查是否成功打开面板
            panel_opened = any('activeRightPanel: dual-channel' in log for log in console_logs)
            print(f"✅ 面板是否成功打开: {panel_opened}")
            
            # 检查DOM中是否存在双通道面板元素
            print("\n=== 检查DOM状态 ===")
            
            # 检查dual-channel-panel元素
            has_panel_element = page.evaluate('document.querySelector("dual-channel-panel") !== null')
            print(f"dual-channel-panel元素是否存在: {has_panel_element}")
            
            # 检查带show类的面板元素
            has_show_panel = page.evaluate('document.querySelector(".dual-channel-panel.show") !== null')
            print(f"带show类的dual-channel-panel元素是否存在: {has_show_panel}")
            
            # 截图：测试后页面状态
            page.screenshot(path='test_screenshots/vue_test_result.png')
            print("测试后页面截图完成")
            
            # 总结测试结果
            print("\n=== 测试总结 ===")
            if panel_opened and (has_panel_element or has_show_panel):
                print("🎉 Vue渲染方式的双通道MP4弹窗测试成功！")
            else:
                print("❌ Vue渲染方式的双通道MP4弹窗测试失败！")
                print(f"  - 面板是否打开: {panel_opened}")
                print(f"  - dual-channel-panel元素是否存在: {has_panel_element}")
                print(f"  - 带show类的面板元素是否存在: {has_show_panel}")
            
        except Exception as e:
            print(f"测试过程中发生错误: {e}")
            # 截图：错误状态
            page.screenshot(path='test_screenshots/vue_test_error.png')
        finally:
            # 关闭浏览器
            browser.close()
            print("\n测试完成，浏览器已关闭")


if __name__ == '__main__':
    test_vue_dual_channel_popup()
