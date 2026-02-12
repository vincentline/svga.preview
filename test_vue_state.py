#!/usr/bin/env python3
"""
测试Vue实例状态和双通道弹窗渲染
"""

from playwright.sync_api import sync_playwright
import time


def test_vue_state():
    """测试Vue实例状态和双通道弹窗渲染"""
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
            
            # 等待3秒，确保所有资源都已加载
            time.sleep(3)
            
            # 检查Vue实例和相关状态
            print("\n=== 检查Vue实例和状态 ===")
            
            try:
                # 检查Vue是否加载
                is_vue_loaded = page.evaluate('typeof Vue !== "undefined"')
                print(f"Vue是否加载: {is_vue_loaded}")
                
                # 检查MeeWoo.app是否存在
                app_instance_exists = page.evaluate('typeof MeeWoo !== "undefined" && typeof MeeWoo.app !== "undefined"')
                print(f"MeeWoo.app是否存在: {app_instance_exists}")
                
                # 检查双通道面板组件是否注册
                component_registered = page.evaluate('typeof Vue !== "undefined" && Vue.options.components["dual-channel-panel"] !== undefined')
                print(f"双通道面板组件是否注册: {component_registered}")
                
                # 检查Vue实例的具体状态
                if app_instance_exists:
                    vue_state = page.evaluate('''() => {
                        return {
                            activeRightPanel: MeeWoo.app.activeRightPanel,
                            dualChannelSourceInfo: MeeWoo.app.dualChannelSourceInfo,
                            dualChannelConfig: MeeWoo.app.dualChannelConfig,
                            isConvertingToDualChannel: MeeWoo.app.isConvertingToDualChannel,
                            dualChannelProgress: MeeWoo.app.dualChannelProgress,
                            dualChannelMessage: MeeWoo.app.dualChannelMessage,
                            isGlobalTaskRunning: MeeWoo.app.isGlobalTaskRunning
                        };
                    }''')
                    
                    print("\n=== Vue实例状态 ===")
                    print(f"activeRightPanel: {vue_state['activeRightPanel']}")
                    print(f"dualChannelSourceInfo: {vue_state['dualChannelSourceInfo']}")
                    print(f"dualChannelConfig: {vue_state['dualChannelConfig']}")
                    print(f"isConvertingToDualChannel: {vue_state['isConvertingToDualChannel']}")
                    print(f"dualChannelProgress: {vue_state['dualChannelProgress']}")
                    print(f"dualChannelMessage: {vue_state['dualChannelMessage']}")
                    print(f"isGlobalTaskRunning: {vue_state['isGlobalTaskRunning']}")
                
            except Exception as e:
                print(f"检查Vue实例失败: {e}")
            
            # 检查页面结构
            print("\n=== 检查页面结构 ===")
            
            try:
                # 检查是否存在dual-channel-panel元素
                has_dual_channel_panel = page.evaluate('document.querySelector("dual-channel-panel") !== null')
                print(f"是否存在dual-channel-panel元素: {has_dual_channel_panel}")
                
                # 检查所有side-panel元素
                side_panels = page.evaluate('Array.from(document.querySelectorAll(".side-panel")).map(p => p.className)')
                print(f"所有side-panel元素: {side_panels}")
                
            except Exception as e:
                print(f"检查页面结构失败: {e}")
            
            # 直接通过JavaScript代码触发双通道弹窗
            print("\n=== 直接触发双通道弹窗 ===")
            
            try:
                # 执行JavaScript代码来打开双通道弹窗
                result = page.evaluate('''() => {
                    console.log("开始触发双通道弹窗");
                    
                    // 重置状态
                    MeeWoo.app.activeRightPanel = null;
                    console.log("重置activeRightPanel为null");
                    
                    // 等待一下
                    setTimeout(() => {
                        // 设置必要的状态
                        MeeWoo.app.dualChannelSourceInfo = {
                            typeLabel: "SVGA",
                            sizeWH: "300x300",
                            duration: "3.0s"
                        };
                        
                        MeeWoo.app.dualChannelConfig = {
                            width: 300,
                            height: 300,
                            fps: 30,
                            quality: 80,
                            muted: false,
                            channelMode: "color-left-alpha-right"
                        };
                        
                        // 打开弹窗
                        console.log("设置activeRightPanel为dual-channel");
                        MeeWoo.app.activeRightPanel = "dual-channel";
                        
                        // 打印当前状态
                        console.log("当前activeRightPanel:", MeeWoo.app.activeRightPanel);
                        
                        // 检查弹窗元素是否创建
                        setTimeout(() => {
                            const panel = document.querySelector('.dual-channel-panel');
                            console.log("弹窗元素是否创建:", panel !== null);
                            
                            if (panel) {
                                console.log("弹窗元素class:", panel.className);
                                console.log("弹窗元素style:", panel.style.cssText);
                            }
                        }, 500);
                    }, 500);
                    
                    return true;
                }''')
                
                print(f"触发弹窗结果: {result}")
                
                # 等待3秒，让弹窗有时间显示
                time.sleep(3)
                
            except Exception as e:
                print(f"触发弹窗失败: {e}")
            
            # 再次检查Vue实例状态
            print("\n=== 再次检查Vue实例状态 ===")
            
            try:
                if app_instance_exists:
                    vue_state = page.evaluate('''() => {
                        return {
                            activeRightPanel: MeeWoo.app.activeRightPanel,
                            dualChannelSourceInfo: MeeWoo.app.dualChannelSourceInfo,
                            dualChannelConfig: MeeWoo.app.dualChannelConfig
                        };
                    }''')
                    
                    print(f"activeRightPanel: {vue_state['activeRightPanel']}")
                    print(f"dualChannelSourceInfo: {vue_state['dualChannelSourceInfo']}")
                    print(f"dualChannelConfig: {vue_state['dualChannelConfig']}")
                
            except Exception as e:
                print(f"检查Vue实例状态失败: {e}")
            
            # 检查弹窗元素
            print("\n=== 检查弹窗元素 ===")
            
            try:
                # 检查是否存在dual-channel-panel元素
                has_dual_channel_panel = page.evaluate('document.querySelector("dual-channel-panel") !== null')
                print(f"是否存在dual-channel-panel元素: {has_dual_channel_panel}")
                
                # 检查是否存在.dual-channel-panel元素
                has_dual_channel_panel_class = page.evaluate('document.querySelector(".dual-channel-panel") !== null')
                print(f"是否存在.dual-channel-panel元素: {has_dual_channel_panel_class}")
                
                # 检查所有side-panel元素
                side_panels = page.evaluate('Array.from(document.querySelectorAll(".side-panel")).map(p => p.className)')
                print(f"所有side-panel元素: {side_panels}")
                
            except Exception as e:
                print(f"检查弹窗元素失败: {e}")
            
            # 检查Vue相关的错误
            print("\n=== 检查控制台日志 ===")
            
            # 收集控制台日志
            console_logs = []
            def log_console_message(msg):
                console_logs.append(msg.text)
                print(f"控制台: {msg.text}")
            
            page.on('console', log_console_message)
            
            # 等待2秒，收集更多日志
            time.sleep(2)
            
            # 检查是否有Vue相关错误
            vue_errors = [log for log in console_logs if 'vue' in log.lower() and ('error' in log.lower() or 'warn' in log.lower())]
            if vue_errors:
                print(f"\n❌ 发现Vue相关错误: {len(vue_errors)}")
                for error in vue_errors:
                    print(f"  - {error}")
            else:
                print("✅ 没有发现Vue相关错误")
            
            # 截图
            page.screenshot(path='test_screenshots/final_state.png')
            print("\n截图: final_state.png")
            
        except Exception as e:
            print(f"测试过程中发生错误: {e}")
            # 截图：错误状态
            page.screenshot(path='test_screenshots/error_screenshot.png')
        finally:
            # 关闭浏览器
            browser.close()
            print("\n测试完成，浏览器已关闭")


if __name__ == '__main__':
    test_vue_state()
