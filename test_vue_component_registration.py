from playwright.sync_api import sync_playwright
import time

def test_vue_component_registration():
    """测试Vue组件是否已经正确注册，特别是双通道MP4弹窗组件"""
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
        time.sleep(5)  # 给更多时间让Vue组件注册
        
        # 执行JavaScript检查Vue组件注册情况
        print("检查Vue组件注册情况...")
        
        try:
            # 检查Vue是否已加载
            vue_loaded = page.evaluate('typeof Vue !== "undefined"')
            print(f"Vue已加载: {vue_loaded}")
            
            # 检查Vue实例是否存在
            vue_instance_exists = page.evaluate('typeof window.vueInstance !== "undefined"')
            print(f"Vue实例存在: {vue_instance_exists}")
            
            # 检查双通道MP4弹窗组件是否已注册
            dual_channel_registered = page.evaluate('''
                () => {
                    // 检查全局组件注册
                    if (typeof Vue !== "undefined" && Vue.options.components && Vue.options.components['dual-channel-panel']) {
                        return true;
                    }
                    // 检查局部组件注册
                    if (typeof window.vueInstance !== "undefined" && window.vueInstance.$options.components && window.vueInstance.$options.components['dual-channel-panel']) {
                        return true;
                    }
                    // 检查页面上是否有双通道MP4弹窗的Vue组件定义
                    const scripts = document.querySelectorAll('script');
                    for (let script of scripts) {
                        if (script.textContent && script.textContent.includes('dual-channel-panel')) {
                            return true;
                        }
                    }
                    return false;
                }
            ''')
            print(f"双通道MP4弹窗组件已注册: {dual_channel_registered}")
            
            # 检查页面上是否有Vue渲染的痕迹
            vue_rendered = page.evaluate('''
                () => {
                    const pageContent = document.body.innerHTML;
                    return pageContent.includes('vue-component') || pageContent.includes('dual-channel-panel');
                }
            ''')
            print(f"检测到Vue渲染痕迹: {vue_rendered}")
            
            # 检查控制台是否有Vue相关错误
            vue_errors = [log for log in console_logs if "Vue" in log and ("error" in log.lower() or "fail" in log.lower() or "未加载" in log)]
            if vue_errors:
                print("发现Vue相关错误:")
                for error in vue_errors:
                    print(f"  - {error}")
            else:
                print("未发现Vue相关错误")
            
            # 截图保存
            page.screenshot(path='test_vue_component_registration.png', full_page=True)
            print("已保存Vue组件注册测试截图: test_vue_component_registration.png")
            
            # 关闭浏览器
            browser.close()
            
            # 返回测试结果
            if vue_loaded and dual_channel_registered and not vue_errors:
                print("✅ 测试通过: Vue组件已正确注册，包括双通道MP4弹窗组件")
                return True
            else:
                print("❌ 测试失败: Vue组件注册存在问题")
                return False
                
        except Exception as e:
            print(f"执行JavaScript检查失败: {e}")
            
            # 截图保存
            page.screenshot(path='test_vue_component_registration_error.png', full_page=True)
            print("已保存错误截图: test_vue_component_registration_error.png")
            
            # 关闭浏览器
            browser.close()
            return False

if __name__ == "__main__":
    test_vue_component_registration()
