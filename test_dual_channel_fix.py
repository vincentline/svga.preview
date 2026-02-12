#!/usr/bin/env python3
"""
测试双通道MP4弹窗Vue渲染修复
"""

from playwright.sync_api import sync_playwright
import time


def test_dual_channel_popup():
    """测试双通道MP4弹窗的Vue渲染"""
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
            
            # 截图：初始页面状态
            page.screenshot(path='test_screenshots/01_initial_page.png')
            print("初始页面截图完成")
            
            # 检查Vue实例是否存在
            print("\n=== 检查Vue实例 ===")
            
            try:
                # 检查Vue是否加载
                is_vue_loaded = page.evaluate('typeof Vue !== "undefined"')
                print(f"Vue是否加载: {is_vue_loaded}")
                
                # 检查Vue实例是否存在
                vue_instance_exists = page.evaluate('typeof vueInstance !== "undefined" && vueInstance !== null')
                print(f"Vue实例是否存在: {vue_instance_exists}")
                
                # 检查app实例是否存在
                app_instance_exists = page.evaluate('typeof MeeWoo !== "undefined" && typeof MeeWoo.app !== "undefined"')
                print(f"MeeWoo.app是否存在: {app_instance_exists}")
                
            except Exception as e:
                print(f"检查Vue实例失败: {e}")
            
            # 直接通过JavaScript代码触发双通道弹窗
            print("\n=== 直接触发双通道弹窗 ===")
            
            try:
                # 执行JavaScript代码来打开双通道弹窗
                result = page.evaluate('''() => {
                    // 检查vueInstance是否存在
                    if (typeof vueInstance !== "undefined" && vueInstance !== null) {
                        console.log("使用vueInstance打开双通道弹窗");
                        
                        // 设置必要的状态
                        vueInstance.dualChannelSourceInfo = {
                            typeLabel: "SVGA",
                            sizeWH: "300x300",
                            duration: "3.0s"
                        };
                        
                        vueInstance.dualChannelConfig = {
                            width: 300,
                            height: 300,
                            fps: 30,
                            quality: 80,
                            muted: false,
                            channelMode: "color-left-alpha-right"
                        };
                        
                        // 打开弹窗
                        vueInstance.activeRightPanel = "dual-channel";
                        
                        return true;
                    } else if (typeof MeeWoo !== "undefined" && typeof MeeWoo.app !== "undefined") {
                        console.log("使用MeeWoo.app打开双通道弹窗");
                        
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
                        MeeWoo.app.activeRightPanel = "dual-channel";
                        
                        return true;
                    } else {
                        console.log("没有找到可用的实例");
                        return false;
                    }
                }''')
                
                print(f"触发弹窗结果: {result}")
                
                # 等待2秒，让弹窗有时间显示
                time.sleep(2)
                
                # 截图：尝试打开弹窗后
                page.screenshot(path='test_screenshots/after_trigger_popup.png')
                
            except Exception as e:
                print(f"触发弹窗失败: {e}")
            
            # 检查弹窗是否显示
            print("\n=== 检查弹窗显示状态 ===")
            
            try:
                # 查找双通道弹窗元素
                popup = page.locator('.dual-channel-panel').first
                if popup.is_visible():
                    print("✅ 双通道弹窗已显示！")
                    # 检查弹窗内容
                    popup_content = popup.text_content()
                    print(f"弹窗内容包含: {'转换为双通道MP4格式' in popup_content}")
                    # 截图：弹窗显示
                    page.screenshot(path='test_screenshots/popup_visible.png')
                else:
                    print("❌ 双通道弹窗未显示")
                    # 检查弹窗元素是否存在但不可见
                    if popup.is_visible() == False and popup.is_hidden() == True:
                        print("弹窗元素存在但不可见")
                    # 截图：无弹窗
                    page.screenshot(path='test_screenshots/no_popup.png')
            except Exception as e:
                print(f"检查弹窗失败: {e}")
            
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
            
        except Exception as e:
            print(f"测试过程中发生错误: {e}")
            # 截图：错误状态
            page.screenshot(path='test_screenshots/error_screenshot.png')
        finally:
            # 关闭浏览器
            browser.close()
            print("\n测试完成，浏览器已关闭")


if __name__ == '__main__':
    test_dual_channel_popup()
