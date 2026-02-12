from playwright.sync_api import sync_playwright
import os

def inspect_page():
    """检查页面结构，找到上传按钮和其他相关元素"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # 导航到应用
            page.goto('http://localhost:4005/')
            page.wait_for_load_state('networkidle')
            
            # 截图：当前页面
            screenshot_dir = 'test_screenshots'
            os.makedirs(screenshot_dir, exist_ok=True)
            page.screenshot(path=os.path.join(screenshot_dir, 'page_inspection.png'), full_page=True)
            print('已保存页面截图')
            
            # 查找所有按钮
            print('\n=== 页面上的所有按钮 ===')
            buttons = page.locator('button').all()
            for i, btn in enumerate(buttons):
                try:
                    text = btn.text_content().strip() if btn.text_content() else ''
                    classes = btn.get_attribute('class')
                    id_attr = btn.get_attribute('id')
                    if text:
                        print(f'按钮 {i}: 文本="{text}", class="{classes}", id="{id_attr}"')
                except Exception as e:
                    print(f'获取按钮 {i} 信息时出错: {e}')
            
            # 查找所有上传相关元素
            print('\n=== 上传相关元素 ===')
            upload_elements = page.locator('[class*="upload"], [id*="upload"], [text*="上传"]').all()
            for i, elem in enumerate(upload_elements):
                try:
                    text = elem.text_content().strip() if elem.text_content() else ''
                    classes = elem.get_attribute('class')
                    id_attr = elem.get_attribute('id')
                    tag = elem.tag_name()
                    print(f'上传元素 {i}: 标签={tag}, 文本="{text}", class="{classes}", id="{id_attr}"')
                except Exception as e:
                    print(f'获取上传元素 {i} 信息时出错: {e}')
            
            # 查找所有面板元素
            print('\n=== 面板相关元素 ===')
            panels = page.locator('[class*="panel"], panel').all()
            for i, panel in enumerate(panels):
                try:
                    classes = panel.get_attribute('class')
                    id_attr = panel.get_attribute('id')
                    tag = panel.tag_name()
                    print(f'面板 {i}: 标签={tag}, class="{classes}", id="{id_attr}"')
                except Exception as e:
                    print(f'获取面板 {i} 信息时出错: {e}')
            
            # 查看页面标题和基本信息
            print('\n=== 页面基本信息 ===')
            title = page.title()
            url = page.url
            print(f'页面标题: {title}')
            print(f'当前URL: {url}')
            
            # 检查是否有iframe
            frames = page.frames
            print(f'\n页面中的iframe数量: {len(frames)}')
            for i, frame in enumerate(frames):
                print(f'iframe {i}: {frame.url}')
                
        except Exception as e:
            print(f'检查页面时出错: {e}')
        finally:
            browser.close()
            print('\n页面检查完成')

if __name__ == '__main__':
    inspect_page()