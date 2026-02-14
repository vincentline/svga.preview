from playwright.sync_api import sync_playwright
import time
import os

def test_svga_gif_export():
    """测试SVGA模式下的GIF导出功能"""
    with sync_playwright() as p:
        # 启动浏览器（非无头模式，符合测试规则）
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # 捕获控制台日志
        console_logs = []
        def log_handler(msg):
            log_text = f'[{msg.type}] {msg.text}'
            console_logs.append(log_text)
            print(log_text)
        
        page.on('console', log_handler)
        
        try:
            # 导航到本地开发服务器
            page.goto('http://localhost:4001')
            page.wait_for_load_state('networkidle')
            print('✅ 页面加载完成')
            
            # 等待页面完全初始化
            time.sleep(2)
            
            # 上传测试文件
            test_file_path = os.path.join(os.getcwd(), 'test_files', 'test.svga')
            print(f'📁 测试文件路径: {test_file_path}')
            
            if os.path.exists(test_file_path):
                print('✅ 测试文件存在')
                
                # 找到文件输入元素并上传文件
                file_input = page.locator('input[type="file"]')
                if file_input.is_visible():
                    print('✅ 文件上传区域可见')
                    
                    # 上传测试文件
                    file_input.set_input_files(test_file_path)
                    print('✅ 测试文件上传完成')
                    
                    # 等待文件加载完成
                    time.sleep(5)
                    
                    # 检查是否显示播放控制
                    if page.locator('button:has-text("播放")').is_visible() or page.locator('button:has-text("暂停")').is_visible():
                        print('✅ SVGA文件加载成功，显示播放控制')
                    else:
                        print('❌ SVGA文件加载失败')
                        return False
                else:
                    print('❌ 文件上传区域不可见')
                    return False
            else:
                print(f'❌ 测试文件不存在: {test_file_path}')
                return False
            
            # 查找并点击导出GIF按钮
            print('\n🔍 查找导出GIF按钮...')
            
            export_buttons = [
                'text=导出GIF',
                'button:has-text("导出GIF")',
                '//button[contains(text(), "导出GIF")]'
            ]
            
            export_button = None
            for selector in export_buttons:
                if page.locator(selector).is_visible():
                    export_button = page.locator(selector)
                    print(f'✅ 找到导出GIF按钮: {selector}')
                    break
            
            if not export_button:
                print('❌ 未找到导出GIF按钮')
                return False
            
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
                return False
            
            # 点击开始导出按钮
            start_export_button.click()
            print('✅ 点击开始导出按钮，开始GIF导出')
            
            # 等待导出完成或超时
            print('\n⏳ 等待导出完成...')
            print('请观察导出进度条，确保它能从0%一直到100%')
            
            # 设置最大等待时间（120秒）
            start_time = time.time()
            max_wait_time = 120
            
            # 监控导出进度
            export_completed = False
            last_progress_time = start_time
            
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
                
                # 检查是否有进度更新
                if any('编码进度:' in log for log in console_logs[-10:]):
                    last_progress_time = time.time()
                
                # 检查是否卡住（30秒无进度更新）
                if time.time() - last_progress_time > 30:
                    print('❌ GIF导出可能卡住（30秒无进度更新）')
                    break
                
                time.sleep(2)
            
            if not export_completed:
                print('❌ GIF导出超时（120秒）')
            
            # 打印捕获的日志
            print('\n📋 捕获的控制台日志（最后50条）：')
            if console_logs:
                for log in console_logs[-50:]:
                    print(f'  {log}')
            else:
                print('  未捕获到相关日志')
            
            # 分析测试结果
            print('\n📊 测试结果分析：')
            if export_completed:
                print('✅ 测试通过：GIF导出成功完成')
                return True
            else:
                print('❌ 测试失败：GIF导出未完成')
                return False
                
        except Exception as e:
            print(f'❌ 测试过程中出错: {e}')
            import traceback
            traceback.print_exc()
            return False
        finally:
            # 关闭浏览器
            browser.close()

if __name__ == '__main__':
    success = test_svga_gif_export()
    if success:
        print('\n🎉 测试成功！SVGA模式下的GIF导出功能已修复。')
    else:
        print('\n💥 测试失败！SVGA模式下的GIF导出功能仍有问题。')
