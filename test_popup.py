from playwright.sync_api import sync_playwright
import time

# 测试弹窗是否出现的脚本
def test_popup_appearance():
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 使用非无头模式以便观察
        page = browser.new_page()
        
        # 访问本地开发服务器
        page.goto('http://localhost:8080')
        
        # 等待页面加载完成
        page.wait_for_load_state('networkidle')
        print('页面加载完成')
        
        # 捕获页面内容，检查是否有dual-channel-panel组件
        content = page.content()
        if 'dual-channel-panel' in content:
            print('找到dual-channel-panel组件')
        else:
            print('未找到dual-channel-panel组件')
        
        # 检查控制台日志
        page.on('console', lambda msg: print(f'控制台: {msg}'))
        
        # 检查是否有转双通道MP4的按钮
        try:
            # 首先检查是否有文件上传区域
            print('检查文件上传区域...')
            
            # 尝试找到文件上传输入
            file_input = page.locator('input[type="file"]').first
            
            # 上传一个测试文件（需要准备一个测试SVGA文件）
            # 注意：这里需要一个实际的SVGA文件路径
            test_file_path = 'f:\\my_tools\\MeeWoo\\MeeWoo\\test_files\\test.svga'
            
            try:
                print(f'尝试上传测试文件: {test_file_path}')
                file_input.set_input_files(test_file_path)
                print('文件上传成功')
                
                # 等待文件加载完成
                time.sleep(5)
                
                # 再次检查所有按钮
                buttons = page.locator('button').all()
                print('上传文件后找到的按钮:')
                for i, button in enumerate(buttons):
                    try:
                        text = button.inner_text()
                        if text:
                            print(f'{i}: {text}')
                    except:
                        pass
                
                # 尝试找到转双通道MP4按钮
                dual_channel_button = None
                for button in buttons:
                    try:
                        text = button.inner_text()
                        if '转双通道MP4' in text:
                            dual_channel_button = button
                            break
                    except:
                        pass
                
                if dual_channel_button:
                    print('找到转双通道MP4按钮')
                    
                    # 点击按钮
                    dual_channel_button.click()
                    print('点击了转双通道MP4按钮')
                    
                    # 等待弹窗出现
                    time.sleep(2)
                    
                    # 检查是否有dual-channel-panel元素
                    if page.locator('.dual-channel-panel').count() > 0:
                        print('找到dual-channel-panel元素')
                        # 检查是否有show类
                        panel_class = page.locator('.dual-channel-panel').get_attribute('class')
                        print(f'dual-channel-panel的class属性: {panel_class}')
                        if 'show' in panel_class:
                            print('dual-channel-panel有show类，弹窗应该显示')
                        else:
                            print('dual-channel-panel没有show类，弹窗不会显示')
                    else:
                        print('未找到dual-channel-panel元素')
                else:
                    print('未找到转双通道MP4按钮')
                    
            except Exception as e:
                print(f'文件上传失败: {e}')
                # 即使文件上传失败，也要继续检查其他按钮
                
        except Exception as e:
            print(f'错误: {e}')
        
        # 检查window.MeeWoo.Components对象
        components = page.evaluate('window.MeeWoo ? window.MeeWoo.Components : {}')
        print('\n组件注册情况:')
        print(f'DualChannelPanel: {"存在" if "DualChannelPanel" in components else "不存在"}')
        print(f'StandardMp4Panel: {"存在" if "StandardMp4Panel" in components else "不存在"}')
        
        # 截图保存
        page.screenshot(path='f:\\my_tools\\MeeWoo\\MeeWoo\\test_screenshot.png', full_page=True)
        print('\n截图已保存到 test_screenshot.png')
        
        # 关闭浏览器
        browser.close()

if __name__ == '__main__':
    test_popup_appearance()
