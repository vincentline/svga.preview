from playwright.sync_api import sync_playwright
import time

"""
测试双通道MP4弹窗不显示的问题
"""

def test_dual_channel_popup():
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 使用非无头模式以便观察
        page = browser.new_page()
        
        try:
            # 直接加载src文件夹中的index.html文件
            import os
            index_path = os.path.abspath('src/index.html')
            page.goto(f'file://{index_path}')
            page.wait_for_load_state('networkidle')  # 等待页面完全加载
            
            # 截图初始状态
            page.screenshot(path='test_screenshots/initial_state.png', full_page=True)
            print('初始状态截图已保存')
            
            # 检查是否有文件上传区域，拖入一个测试SVGA文件
            # 注意：这里需要一个测试SVGA文件
            # 暂时跳过文件上传，假设页面已经有一个SVGA文件加载
            
            # 等待几秒钟，确保页面稳定
            time.sleep(2)
            
            # 查找所有按钮，以便了解页面上有哪些按钮
            print('查找所有按钮...')
            all_buttons = page.locator('button').all()
            print(f'找到 {len(all_buttons)} 个按钮')
            
            # 打印所有按钮的文本
            print('=== 所有按钮文本 ===')
            for i, button in enumerate(all_buttons):
                try:
                    text = button.inner_text()
                    print(f'按钮 {i}: {text}')
                except Exception as e:
                    print(f'按钮 {i}: 无法获取文本: {e}')
            
            # 查找并点击"转双通道MP4"按钮
            print('\n查找转双通道MP4按钮...')
            
            # 尝试不同的选择器
            dual_channel_buttons = page.locator('button').filter(has_text='转双通道MP4').all()
            print(f'找到 {len(dual_channel_buttons)} 个转双通道MP4按钮')
            
            if dual_channel_buttons:
                # 点击第一个找到的按钮
                dual_channel_buttons[0].click()
                print('点击了转双通道MP4按钮')
                
                # 等待几秒钟，观察弹窗是否出现
                time.sleep(3)
                
                # 截图点击后的状态
                page.screenshot(path='test_screenshots/after_click.png', full_page=True)
                print('点击后状态截图已保存')
                
                # 检查控制台日志
                print('\n=== 控制台日志 ===')
                logs = []
                
                def handle_console_message(msg):
                    logs.append(msg.text)
                    print(f'[控制台] {msg.text}')
                
                page.on('console', handle_console_message)
                
                # 等待几秒钟，收集更多日志
                time.sleep(2)
                
                # 检查双通道MP4面板是否存在
                print('\n=== 检查双通道MP4面板 ===')
                dual_channel_panel = page.locator('.dual-channel-panel').first
                try:
                    if dual_channel_panel.is_visible():
                        print('✅ 双通道MP4面板可见')
                        # 截图面板
                        dual_channel_panel.screenshot(path='test_screenshots/dual_channel_panel.png')
                        print('双通道MP4面板截图已保存')
                    else:
                        print('❌ 双通道MP4面板不可见')
                except Exception as e:
                    print(f'❌ 找不到双通道MP4面板: {e}')
                
                # 检查所有side-panel元素
                print('\n=== 检查所有side-panel元素 ===')
                side_panels = page.locator('.side-panel').all()
                print(f'找到 {len(side_panels)} 个side-panel元素')
                
                for i, panel in enumerate(side_panels):
                    try:
                        panel_class = panel.get_attribute('class')
                        panel_style = panel.get_attribute('style')
                        print(f'面板 {i}: 类名={panel_class}, 样式={panel_style}')
                    except Exception as e:
                        print(f'面板 {i}: 错误={e}')
                
                # 检查模板是否存在
                print('\n=== 检查模板 ===')
                template = page.locator('#tpl-dual-channel-panel').first
                try:
                    if template.is_visible():
                        print('✅ 双通道MP4模板可见')
                    else:
                        print('❌ 双通道MP4模板不可见')
                except Exception as e:
                    print(f'❌ 找不到双通道MP4模板: {e}')
                
                # 保存控制台日志到文件
                with open('test_logs/console_logs.txt', 'w', encoding='utf-8') as f:
                    for log in logs:
                        f.write(log + '\n')
                print('控制台日志已保存到 test_logs/console_logs.txt')
                
            else:
                print('❌ 找不到转双通道MP4按钮')
                # 截图当前状态
                page.screenshot(path='test_screenshots/no_button_found.png', full_page=True)
                
        except Exception as e:
            print(f'测试过程中发生错误: {e}')
            # 截图错误状态
            page.screenshot(path='test_screenshots/error_state.png', full_page=True)
        finally:
            # 等待用户查看
            input('按回车键结束测试...')
            
            # 关闭浏览器
            browser.close()

if __name__ == '__main__':
    # 创建截图和日志目录
    import os
    os.makedirs('test_screenshots', exist_ok=True)
    os.makedirs('test_logs', exist_ok=True)
    
    test_dual_channel_popup()
