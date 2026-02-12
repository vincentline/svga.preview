#!/usr/bin/env python3
"""
调试双通道MP4弹窗Vue渲染
"""

from playwright.sync_api import sync_playwright
import time


def debug_dual_channel_popup():
    """调试双通道MP4弹窗的Vue渲染"""
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
                
            except Exception as e:
                print(f"检查Vue实例失败: {e}")
            
            # 直接通过JavaScript代码触发双通道弹窗
            print("\n=== 直接触发双通道弹窗 ===")
            
            try:
                # 执行JavaScript代码来打开双通道弹窗
                result = page.evaluate('''() => {
                    console.log("开始触发双通道弹窗");
                    
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
                    
                    return true;
                }''')
                
                print(f"触发弹窗结果: {result}")
                
                # 等待2秒，让弹窗有时间显示
                time.sleep(2)
                
            except Exception as e:
                print(f"触发弹窗失败: {e}")
            
            # 检查弹窗状态
            print("\n=== 检查弹窗详细状态 ===")
            
            try:
                # 执行JavaScript代码来检查弹窗状态
                popup_status = page.evaluate('''() => {
                    console.log("开始检查弹窗状态");
                    
                    // 查找弹窗元素
                    const popup = document.querySelector('.dual-channel-panel');
                    console.log("弹窗元素:", popup);
                    
                    if (popup) {
                        // 检查弹窗的class属性
                        const className = popup.className;
                        console.log("弹窗class:", className);
                        
                        // 检查弹窗是否有show类
                        const hasShowClass = popup.classList.contains('show');
                        console.log("弹窗是否有show类:", hasShowClass);
                        
                        // 检查弹窗的style属性
                        const style = window.getComputedStyle(popup);
                        console.log("弹窗display:", style.display);
                        console.log("弹窗.visibility:", style.visibility);
                        console.log("弹窗.opacity:", style.opacity);
                        console.log("弹窗.right:", style.right);
                        
                        // 检查visible属性
                        const visibleAttr = popup.getAttribute('visible');
                        console.log("弹窗visible属性:", visibleAttr);
                        
                        // 检查Vue实例中的visible状态
                        if (typeof MeeWoo !== "undefined" && typeof MeeWoo.app !== "undefined") {
                            console.log("MeeWoo.app.activeRightPanel:", MeeWoo.app.activeRightPanel);
                            console.log("MeeWoo.app.activeRightPanel === 'dual-channel':", MeeWoo.app.activeRightPanel === "dual-channel");
                        }
                        
                        return {
                            exists: true,
                            hasShowClass: hasShowClass,
                            display: style.display,
                            visibility: style.visibility,
                            opacity: style.opacity,
                            right: style.right,
                            className: className
                        };
                    } else {
                        return {
                            exists: false
                        };
                    }
                }''')
                
                print(f"弹窗存在: {popup_status.get('exists', False)}")
                if popup_status.get('exists', False):
                    print(f"弹窗是否有show类: {popup_status.get('hasShowClass', False)}")
                    print(f"弹窗display: {popup_status.get('display', 'N/A')}")
                    print(f"弹窗visibility: {popup_status.get('visibility', 'N/A')}")
                    print(f"弹窗opacity: {popup_status.get('opacity', 'N/A')}")
                    print(f"弹窗right: {popup_status.get('right', 'N/A')}")
                    print(f"弹窗className: {popup_status.get('className', 'N/A')}")
                
            except Exception as e:
                print(f"检查弹窗状态失败: {e}")
            
            # 尝试手动添加show类
            print("\n=== 尝试手动添加show类 ===")
            
            try:
                # 执行JavaScript代码来手动添加show类
                result = page.evaluate('''() => {
                    const popup = document.querySelector('.dual-channel-panel');
                    if (popup) {
                        console.log("手动添加show类");
                        popup.classList.add('show');
                        return true;
                    }
                    return false;
                }''')
                
                print(f"手动添加show类结果: {result}")
                
                # 等待1秒
                time.sleep(1)
                
                # 检查弹窗是否可见
                popup_visible = page.evaluate('''() => {
                    const popup = document.querySelector('.dual-channel-panel');
                    if (popup) {
                        return popup.classList.contains('show');
                    }
                    return false;
                }''')
                
                print(f"手动添加show类后弹窗是否可见: {popup_visible}")
                
                # 截图
                page.screenshot(path='test_screenshots/after_manual_show.png')
                print("截图: after_manual_show.png")
                
            except Exception as e:
                print(f"手动添加show类失败: {e}")
            
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
    debug_dual_channel_popup()
