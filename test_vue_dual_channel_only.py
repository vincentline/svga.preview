#!/usr/bin/env python3
"""
测试双通道MP4弹窗（仅Vue渲染方式）

此测试脚本用于验证双通道MP4弹窗是否只使用Vue渲染方式，没有DOM兜底渲染。
"""

from playwright.sync_api import sync_playwright
import time
import os


def test_vue_dual_channel_only(
    test_name="vue_dual_channel_only",
    server_url="http://localhost:4000/",
    test_file_path="f:\\my_tools\\MeeWoo\\MeeWoo\\test_files\\test.svga",
    component_name="dual-channel-panel",
    open_method="openDualChannelPanel",
    screenshot_dir="test_screenshots",
    console_log_file="dual_channel_only_console.log"
):
    """
    测试双通道MP4弹窗（仅Vue渲染方式）
    
    参数:
        test_name: 测试名称，用于命名截图和日志文件
        server_url: 开发服务器URL
        test_file_path: 测试文件路径（如SVGA文件）
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
            
            # 加载测试文件
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
            page.evaluate('console.log("MeeWoo.Utils.showDualChannelPanel是否存在:", typeof MeeWoo !== "undefined" && typeof MeeWoo.Utils !== "undefined" && typeof MeeWoo.Utils.showDualChannelPanel !== "undefined")')
            
            meewoo_app_exists = page.evaluate('typeof MeeWoo !== "undefined" && typeof MeeWoo.app !== "undefined"')
            if meewoo_app_exists:
                page.evaluate('console.log("当前activeRightPanel:", MeeWoo.app.activeRightPanel)')
                
                # 尝试打开组件面板
                print(f"尝试打开{component_name}面板...")
                page.evaluate(f'MeeWoo.app.{open_method}()')
                
                # 延迟检查面板状态
                time.sleep(2)  # 等待面板打开
                print(f"打开面板后activeRightPanel:", page.evaluate('MeeWoo.app.activeRightPanel'))
            
            # 检查DOM中是否存在Vue组件元素
            print(f"\n=== 检查Vue组件渲染状态 ===")
            
            # 增加等待时间，让Vue有足够的时间渲染组件
            time.sleep(3)
            
            # 检查Vue组件元素
            vue_component_selector = f'{component_name}'
            has_vue_component = page.evaluate(f'document.querySelector("{vue_component_selector}") !== null')
            print(f"Vue组件元素是否存在: {has_vue_component}")
            
            # 检查带show类的Vue组件元素
            show_vue_component_selector = f'.{component_name}.show'
            has_show_vue_component = page.evaluate(f'document.querySelector("{show_vue_component_selector}") !== null')
            print(f"带show类的Vue组件元素是否存在: {has_show_vue_component}")
            
            # 增加更多调试信息
            print(f"\n=== 额外调试信息 ===")
            # 检查所有dual-channel相关的元素
            dual_channel_elements = page.evaluate('Array.from(document.querySelectorAll("*[class*=dual-channel]"))')
            print(f"所有包含dual-channel的元素数量: {len(dual_channel_elements)}")
            
            # 检查Vue实例状态
            vue_app_state = page.evaluate('typeof MeeWoo !== "undefined" && typeof MeeWoo.app !== "undefined" ? {\n  activeRightPanel: MeeWoo.app.activeRightPanel,\n  dualChannelSourceInfo: MeeWoo.app.dualChannelSourceInfo,\n  dualChannelConfig: MeeWoo.app.dualChannelConfig\n} : null')
            print(f"Vue应用状态: {vue_app_state}")
            
            # 检查是否存在DOM兜底渲染的元素
            print(f"\n=== 检查是否存在DOM兜底渲染元素 ===")
            dom_fallback_selector = '.dual-channel-panel-root'
            has_dom_fallback = page.evaluate(f'document.querySelector("{dom_fallback_selector}") !== null')
            print(f"DOM兜底渲染元素是否存在: {has_dom_fallback}")
            
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
            meewoo_app_exists = page.evaluate('typeof MeeWoo !== "undefined" && typeof MeeWoo.app !== "undefined"')
            if meewoo_app_exists:
                active_panel = page.evaluate('MeeWoo.app.activeRightPanel')
                print(f"active_panel: '{active_panel}', component_name: '{component_name}'")
                panel_opened = active_panel == 'dual-channel'
            
            print(f"✅ 面板是否成功打开: {panel_opened}")
            print(f"✅ DOM兜底渲染元素是否存在: {has_dom_fallback}")
            
            # 判断测试是否成功（仅基于Vue渲染结果，且没有DOM兜底渲染）
            if panel_opened and (has_vue_component or has_show_vue_component) and not has_dom_fallback:
                print(f"🎉 {component_name} 仅Vue渲染测试成功！")
                return True
            else:
                print(f"❌ {component_name} 仅Vue渲染测试失败！")
                print(f"  - 面板是否打开: {panel_opened}")
                print(f"  - Vue组件元素是否存在: {has_vue_component}")
                print(f"  - 带show类的Vue组件元素是否存在: {has_show_vue_component}")
                print(f"  - DOM兜底渲染元素是否存在: {has_dom_fallback}")
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
    test_vue_dual_channel_only(
        test_name="vue_dual_channel_only",
        server_url="http://localhost:4000/",
        test_file_path="f:\\my_tools\\MeeWoo\\MeeWoo\\test_files\\test.svga",
        component_name="dual-channel-panel",
        open_method="openDualChannelPanel",
        screenshot_dir="test_screenshots",
        console_log_file="dual_channel_only_console.log"
    )
