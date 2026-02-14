from playwright.sync_api import sync_playwright
import time
import os

def test_svga_gif_export():
    """测试SVGA模式下的GIF导出功能"""
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 非无头模式，方便观察
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
            
            # 上传SVGA文件（使用示例文件）
            # 注意：这里需要替换为实际的SVGA测试文件路径
            # 先检查是否有文件输入区域
            file_input = page.locator('input[type="file"]')
            if file_input.is_visible():
                print('✅ 文件上传区域可见')
                
                # 选择一个示例SVGA文件
                # 假设我们有一个测试文件
                test_file_path = os.path.join(os.getcwd(), 'test_sample.svga')
                
                # 检查文件是否存在
                if os.path.exists(test_file_path):
                    print(f'✅ 测试文件存在: {test_file_path}')
                    # 上传文件
                    file_input.set_input_files(test_file_path)
                    print('✅ 文件上传完成')
                    
                    # 等待文件加载完成
                    time.sleep(5)
                    
                    # 检查是否显示播放控制
                    if page.locator('button:has-text("播放")').is_visible() or page.locator('button:has-text("暂停")').is_visible():
                        print('✅ SVGA文件加载成功，显示播放控制')
                    else:
                        print('❌ SVGA文件加载失败')
                        return
                else:
                    print(f'❌ 测试文件不存在: {test_file_path}')
                    print('⚠️  跳过文件上传步骤，手动测试时请上传SVGA文件')
            else:
                print('❌ 文件上传区域不可见')
                return
            
            # 等待用户手动操作（如果没有测试文件）
            print('\n📋 测试步骤：')
            print('1. 请上传一个SVGA文件')
            print('2. 等待文件加载完成')
            print('3. 点击右下角的"导出GIF"按钮')
            print('4. 在弹出的对话框中设置参数，点击"开始导出"')
            print('5. 观察导出过程是否正常完成，没有卡在50%')
            print('\n按Enter键继续...')
            input()
            
            # 等待导出完成
            print('\n⏳ 等待导出完成...')
            print('请观察导出进度条，确保它能从0%一直到100%')
            print('如果修复成功，导出过程不会卡在50%')
            print('\n按Enter键结束测试...')
            input()
            
            # 捕获控制台日志
            print('\n📋 控制台日志：')
            logs = []
            def log_handler(msg):
                if 'GIF Exporter' in msg.text:
                    logs.append(msg.text)
            
            page.on('console', log_handler)
            
            # 等待几秒捕获更多日志
            time.sleep(3)
            
            # 打印捕获的日志
            if logs:
                for log in logs:
                    print(f'  {log}')
            else:
                print('  未捕获到GIF Exporter相关日志')
            
            print('\n✅ 测试完成')
            print('\n📊 测试结果分析：')
            print('如果导出过程顺利完成（从0%到100%），则修复成功')
            print('如果仍然卡在50%，则需要进一步调试')
            
        except Exception as e:
            print(f'❌ 测试过程中出错: {e}')
        finally:
            # 关闭浏览器
            browser.close()

if __name__ == '__main__':
    test_svga_gif_export()
