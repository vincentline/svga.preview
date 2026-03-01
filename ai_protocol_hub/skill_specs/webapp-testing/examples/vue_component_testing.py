#!/usr/bin/env python3
"""
测试Vue渲染方式的组件弹窗 - 可复用测试模板

此模板适用于测试基于Vue渲染的弹窗组件，专注于验证Vue组件的正常渲染流程
包含完整的测试流程，从页面加载到Vue组件渲染验证
"""

from playwright.sync_api import sync_playwright
import time
import os


def test_vue_component_popup(
    test_name="vue_component",
    server_url="http://localhost:4006/",
    test_file_path=None,
    component_name="dual-channel-panel",
    open_method="openDualChannelPanel",
    screenshot_dir="test_screenshots",
    console_log_file="console.log"
):
    """
    测试Vue渲染方式的组件弹窗
    
    参数:
        test_name: 测试名称，用于命名截图和日志文件
        server_url: 开发服务器URL
        test_file_path: 测试文件路径（如SVGA文件），如果为None则不加载测试文件
        component_name: 组件名称，用于DOM查询
        open_method: 打开组件的方法名称
        screenshot_dir: 截图保存目录
        console_log_file: 控制台日志保存文件
    """
    # 确保截图目录存在
    os.makedirs(screenshot_dir, exist_ok=True)
    
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 非无头模式，便于观察
        page = browser.new_page()
        
        try:
            # 收集控制台日志
            console_logs = []
            def log_console_message(msg):
                log_entry = f"[{time.strftime('%H:%M:%S')}] {msg.text}"
                console_logs.append(log_entry)
                print(f"控制台: {log_entry}")
            
            page.on('console', log_console_message)
            
            # 导航到开发服务器
            print(f"导航到: {server_url}")
            page.goto(server_url)
            
            # 等待页面加载完成
            page.wait_for_load_state('networkidle')
            print("页面加载完成")
            
            # 截图：初始页面状态
            initial_screenshot = os.path.join(screenshot_dir, f"{test_name}_initial.png")
            page.screenshot(path=initial_screenshot)
            print(f"初始页面截图完成: {initial_screenshot}")
            
            # 加载测试文件（如果提供）
            if test_file_path:
                print(f"加载测试文件: {test_file_path}")
                # 使用文件输入上传测试文件
                file_input = page.locator('input[type="file"]').nth(0)
                file_input.set_input_files(test_file_path)
                
                # 等待文件加载完成
                time.sleep(5)  # 根据文件大小调整等待时间
                print("测试文件加载完成")
            
            # 执行测试方法
            print(f"\n=== 执行Vue渲染测试: {component_name} ===")
            # 添加更多调试信息
            page.evaluate('console.log("=== 额外调试信息 ===")')
            page.evaluate('console.log("Vue是否加载:", typeof Vue !== "undefined")')
            page.evaluate(f'console.log("{component_name}组件是否注册:", typeof Vue !== "undefined" && Vue.options.components["{component_name}"] !== undefined)')
            page.evaluate('console.log("MeeWoo.app是否存在:", typeof MeeWoo !== "undefined" && typeof MeeWoo.app !== "undefined")')
            
            # 检查MeeWoo.app是否存在
            mewoo_app_exists = page.evaluate('typeof MeeWoo !== "undefined" && typeof MeeWoo.app !== "undefined"')
            if mewoo_app_exists:
                page.evaluate('console.log("当前activeRightPanel:", MeeWoo.app.activeRightPanel)')
                
                # 尝试打开组件面板
                print(f"尝试打开{component_name}面板...")
                page.evaluate(f'MeeWoo.app.{open_method}()')
                
                # 延迟检查面板状态
                time.sleep(2)  # 等待面板打开
                print(f"打开面板后activeRightPanel:", page.evaluate('MeeWoo.app.activeRightPanel'))
            
            # 检查DOM中是否存在Vue组件元素
            print(f"\n=== 检查Vue组件渲染状态 ===")
            
            # 检查Vue组件元素
            vue_component_selector = f'{component_name}'
            has_vue_component = page.evaluate(f'document.querySelector("{vue_component_selector}") !== null')
            print(f"Vue组件元素是否存在: {has_vue_component}")
            
            # 检查带show类的Vue组件元素
            show_vue_component_selector = f'.{component_name}.show'
            has_show_vue_component = page.evaluate(f'document.querySelector("{show_vue_component_selector}") !== null')
            print(f"带show类的Vue组件元素是否存在: {has_show_vue_component}")
            
            # 截图：测试后页面状态
            result_screenshot = os.path.join(screenshot_dir, f"{test_name}_result.png")
            page.screenshot(path=result_screenshot)
            print(f"测试后页面截图完成: {result_screenshot}")
            
            # 保存控制台日志
            log_file_path = os.path.join(screenshot_dir, console_log_file)
            with open(log_file_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(console_logs))
            print(f"控制台日志保存完成: {log_file_path}")
            
            # 分析测试结果
            print(f"\n=== 测试总结 ===")
            
            # 检查是否有错误信息
            errors = [log for log in console_logs if 'error' in log.lower() or 'Error' in log]
            if errors:
                print(f"❌ 发现错误: {len(errors)}")
                for error in errors[:5]:  # 只显示前5个错误
                    print(f"  - {error}")
                if len(errors) > 5:
                    print(f"  ... 还有 {len(errors) - 5} 个错误未显示")
            else:
                print("✅ 没有发现错误")
            
            # 检查面板是否成功打开
            panel_opened = False
            if mewoo_app_exists:
                active_panel = page.evaluate('MeeWoo.app.activeRightPanel')
                panel_opened = active_panel == component_name.replace('-', '')
            
            print(f"✅ 面板是否成功打开: {panel_opened}")
            
            # 判断测试是否成功（仅基于Vue渲染结果）
            if panel_opened and (has_vue_component or has_show_vue_component):
                print(f"🎉 {component_name} Vue组件测试成功！")
                return True
            else:
                print(f"❌ {component_name} Vue组件测试失败！")
                print(f"  - 面板是否打开: {panel_opened}")
                print(f"  - Vue组件元素是否存在: {has_vue_component}")
                print(f"  - 带show类的Vue组件元素是否存在: {has_show_vue_component}")
                return False
            
        except Exception as e:
            error_message = f"测试过程中发生错误: {e}"
            print(error_message)
            # 截图：错误状态
            error_screenshot = os.path.join(screenshot_dir, f"{test_name}_error.png")
            page.screenshot(path=error_screenshot)
            print(f"错误状态截图完成: {error_screenshot}")
            return False
        finally:
            # 关闭浏览器
            browser.close()
            print("\n测试完成，浏览器已关闭")


if __name__ == '__main__':
    """
    示例用法
    """
    # 测试双通道MP4面板
    test_vue_component_popup(
        test_name="vue_dual_channel",
        server_url="http://localhost:4001/",
        test_file_path="f:\\my_tools\\MeeWoo\\MeeWoo\\test_files\\test.svga",
        component_name="dual-channel-panel",
        open_method="openDualChannelPanel",
        screenshot_dir="test_screenshots",
        console_log_file="dual_channel_console.log"
    )
    
    # 示例：测试其他Vue组件
    # test_vue_component_popup(
    #     test_name="vue_material_panel",
    #     server_url="http://localhost:4000/",
    #     component_name="material-panel",
    #     open_method="openMaterialPanel",
    #     screenshot_dir="test_screenshots",
    #     console_log_file="material_panel_console.log"
    # )
