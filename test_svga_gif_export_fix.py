from playwright.sync_api import sync_playwright
import time
import os

def test_svga_gif_export():
    """测试SVGA模式下的GIF导出功能，使用test.svga测试文件"""
    with sync_playwright() as p:
        # 启动浏览器（非无头模式，符合测试规则）
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        try:
            # 导航到本地开发服务器
            page.goto('http://localhost:4003')
            page.wait_for_load_state('networkidle')
            print('✅ 页面加载完成')
            
            # 等待页面完全初始化
            time.sleep(2)
            
            # 检查是否显示SVGA模块
            if page.locator('text=SVGA').is_visible():
                print('✅ SVGA模块可见')
            else:
                print('❌ SVGA模块不可见')
                return
            
            # 上传测试文件
            test_file_path = os.path.join(os.getcwd(), 'test_files', 'test.svga')
            print(f'📁 测试文件路径: {test_file_path}')
            
            # 检查文件是否存在
            if os.path.exists(test_file_path):
                print('✅ 测试文件存在')
                
                # 找到文件输入元素并上传文件
                file_input = page.locator('input[type="file"]')
                if file_input.is_visible():
                    print('✅ 文件上传区域可见')
                    
                    # 上传测试文件
                    file_input.set_input_files(test_file_path)
                    print('✅ 测试文件上传完成')
                    
                    # 等待文件加载完成（给足够的时间）
                    time.sleep(5)
                    
                    # 检查是否显示播放控制
                    if page.locator('button:has-text("播放")').is_visible() or page.locator('button:has-text("暂停")').is_visible():
                        print('✅ SVGA文件加载成功，显示播放控制')
                    else:
                        print('❌ SVGA文件加载失败')
                        return
                else:
                    print('❌ 文件上传区域不可见')
                    return
            else:
                print(f'❌ 测试文件不存在: {test_file_path}')
                return
            
            # 等待用户确认文件加载完成
            print('\n📋 测试准备完成：')
            print('1. 测试文件已上传并加载')
            print('2. 页面显示正常')
            print('\n按Enter键开始导出GIF测试...')
            input()
            
            # 查找并点击导出GIF按钮
            print('\n🔍 查找导出GIF按钮...')
            
            # 尝试不同的选择器
            export_buttons = [
                'text=导出GIF',
                'button:has-text("导出GIF")',
                '//button[contains(text(), "导出GIF")]',
                '//*[contains(text(), "导出GIF")]'
            ]
            
            export_button = None
            for selector in export_buttons:
                if page.locator(selector).is_visible():
                    export_button = page.locator(selector)
                    print(f'✅ 找到导出GIF按钮: {selector}')
                    break
            
            if not export_button:
                print('❌ 未找到导出GIF按钮')
                return
            
            # 点击导出GIF按钮
            export_button.click()
            print('✅ 点击导出GIF按钮')
            
            # 等待导出配置弹窗出现
            time.sleep(2)
            print('✅ 等待导出配置弹窗...')
            
            # 尝试找到开始导出按钮
            start_export_buttons = [
                'text=开始导出',
                'button:has-text("开始导出")',
                '//button[contains(text(), "开始导出")]'
            ]
            
            start_export_button = None
            for selector in start_export_buttons:
                if page.locator(selector).is_visible():
                    start_export_button = page.locator(selector)
                    print(f'✅ 找到开始导出按钮: {selector}')
                    break
            
            if not start_export_button:
                print('❌ 未找到开始导出按钮')
                return
            
            # 点击开始导出按钮
            start_export_button.click()
            print('✅ 点击开始导出按钮，开始GIF导出')
            
            # 捕获控制台日志
            console_logs = []
            def log_handler(msg):
                if 'GIF Exporter' in msg.text or 'gif.js' in msg.text:
                    console_logs.append(msg.text)
                    print(f'📋 {msg.text}')
            
            page.on('console', log_handler)
            
            # 等待导出完成或超时
            print('\n⏳ 等待导出完成...')
            print('请观察导出进度条，确保它能从0%一直到100%')
            print('如果修复成功，导出过程不会卡在50%')
            
            # 设置最大等待时间（60秒）
            start_time = time.time()
            max_wait_time = 60
            
            # 监控导出进度
            export_completed = False
            while time.time() - start_time < max_wait_time:
                # 检查是否有完成的迹象
                if any('编码完成' in log for log in console_logs):
                    export_completed = True
                    print('✅ GIF导出完成！')
                    break
                
                # 检查是否有错误
                if any('编码失败' in log or '编码错误' in log for log in console_logs):
                    print('❌ GIF导出失败')
                    break
                
                time.sleep(2)
            
            if not export_completed:
                print('❌ GIF导出超时（60秒）')
            
            # 打印捕获的日志
            print('\n📋 捕获的控制台日志：')
            if console_logs:
                for log in console_logs:
                    print(f'  {log}')
            else:
                print('  未捕获到相关日志')
            
            # 分析测试结果
            print('\n📊 测试结果分析：')
            if export_completed:
                print('✅ 测试通过：GIF导出成功完成')
                print('✅ 修复有效：导出过程没有卡在50%')
            else:
                print('❌ 测试失败：GIF导出未完成')
                print('❌ 需要进一步修复')
                
        except Exception as e:
            print(f'❌ 测试过程中出错: {e}')
        finally:
            # 关闭浏览器
            browser.close()

if __name__ == '__main__':
    test_svga_gif_export()
