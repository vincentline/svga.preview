import sys
import os
sys.path.insert(0, r'e:\BaiduNetdiskWorkspace\01工作\林嘉跃vincent\自动化\小工具\svga_preview\svga.preview\.trae\skills\webapp-testing')

from playwright.sync_api import sync_playwright
import time

def test_dual_channel_export():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        console_logs = []
        errors = []
        
        def handle_console(msg):
            log_entry = f"[{msg.type}] {msg.text}"
            console_logs.append(log_entry)
            print(f"Console: {log_entry}")
        
        def handle_page_error(error):
            error_msg = f"Page Error: {error}"
            errors.append(error_msg)
            print(error_msg)
        
        page.on('console', handle_console)
        page.on('pageerror', handle_page_error)
        
        print("Navigating to page...")
        page.goto('http://localhost:8080')
        page.wait_for_load_state('networkidle')
        
        print("Page loaded, taking screenshot...")
        page.screenshot(path='/tmp/initial_page.png')
        
        print("\nLooking for file input...")
        file_input = page.query_selector('input[type="file"]')
        if not file_input:
            print("File input not found, checking for alternative selectors...")
            inputs = page.query_selector_all('input')
            print(f"Found {len(inputs)} input elements")
            for i, inp in enumerate(inputs):
                inp_type = inp.get_attribute('type') or 'text'
                print(f"  Input {i}: type={inp_type}")
        
        test_file = r'e:\BaiduNetdiskWorkspace\01工作\林嘉跃vincent\自动化\小工具\svga_preview\svga.preview\test_files\test.svga'
        
        if file_input:
            print(f"\nUploading test file: {test_file}")
            file_input.set_input_files(test_file)
            
            print("Waiting for SVGA to load...")
            time.sleep(3)
            page.screenshot(path='/tmp/after_upload.png')
            
            print("\nLooking for dual channel export button...")
            dual_channel_btns = page.query_selector_all('button, [class*="btn"], [class*="button"]')
            print(f"Found {len(dual_channel_btns)} buttons")
            
            for i, btn in enumerate(dual_channel_btns):
                btn_text = btn.inner_text() if btn.inner_text() else ""
                print(f"  Button {i}: '{btn_text[:50]}'")
                if '双通道' in btn_text or 'MP4' in btn_text:
                    print(f"    -> Potential dual channel button!")
            
            convert_btn = None
            for btn in dual_channel_btns:
                btn_text = btn.inner_text() if btn.inner_text() else ""
                if '双通道' in btn_text or '导出MP4' in btn_text:
                    convert_btn = btn
                    break
            
            if convert_btn:
                print(f"\nClicking convert button: '{convert_btn.inner_text()}'")
                convert_btn.click()
                time.sleep(2)
                page.screenshot(path='/tmp/after_convert_click.png')
                
                print("\nWaiting for conversion to complete or error...")
                time.sleep(10)
                page.screenshot(path='/tmp/final_state.png')
            else:
                print("\nDual channel button not found")
                page.screenshot(path='/tmp/no_convert_btn.png')
        else:
            print("File input not found!")
        
        print("\n=== Console Logs ===")
        for log in console_logs[-50:]:
            print(log)
        
        print("\n=== Errors ===")
        for err in errors:
            print(err)
        
        print("\nKeeping browser open for 5 seconds...")
        time.sleep(5)
        
        browser.close()

if __name__ == '__main__':
    test_dual_channel_export()
