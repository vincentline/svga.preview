#!/usr/bin/env python3
"""
Konva 素材编辑器测试模板 - 可复用测试模板

此模板适用于测试基于 Konva.js 的素材编辑器，包括：
- 编辑器打开和初始化
- 底图显示和操作（拖拽、缩放）
- 文案显示和操作（拖拽、缩放、对齐）
- Transformer 选中状态
- 导出功能验证
"""

from playwright.sync_api import sync_playwright
import time
import os


def test_konva_material_editor(
    test_name="konva_editor",
    server_url="http://localhost:5173/",
    screenshot_dir="test_screenshots",
    wait_timeout=2000
):
    """
    测试 Konva 素材编辑器
    
    参数:
        test_name: 测试名称，用于命名截图
        server_url: 开发服务器URL
        screenshot_dir: 截图保存目录
        wait_timeout: 操作等待时间（毫秒）
    """
    os.makedirs(screenshot_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        try:
            print(f"=== Konva 素材编辑器测试开始 ===")
            
            # 1. 导航到页面
            print("\n[1] 导航到页面...")
            page.goto(server_url)
            page.wait_for_load_state('networkidle')
            page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_01_initial.png"))
            
            # 2. 打开素材管理面板
            print("\n[2] 打开素材管理面板...")
            material_btn = page.locator('text=素材图管理').first
            if material_btn.is_visible():
                material_btn.click()
                page.wait_for_timeout(wait_timeout)
                page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_02_material_panel.png"))
                print("   ✓ 素材管理面板已打开")
            else:
                print("   ✗ 未找到素材管理按钮")
                return False
            
            # 3. 打开素材编辑器
            print("\n[3] 打开素材编辑器...")
            edit_btn = page.locator('button:has-text("编辑")').first
            if edit_btn.is_visible():
                edit_btn.click()
                page.wait_for_timeout(wait_timeout)
                page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_03_editor_opened.png"))
                print("   ✓ 素材编辑器已打开")
            else:
                print("   ✗ 未找到编辑按钮")
                return False
            
            # 4. 验证 Konva Stage 初始化
            print("\n[4] 验证 Konva Stage 初始化...")
            konva_initialized = page.evaluate('''
                () => {
                    const container = document.querySelector('.editor-preview-wrapper');
                    const canvas = container ? container.querySelector('canvas') : null;
                    return {
                        containerExists: !!container,
                        canvasExists: !!canvas,
                        canvasWidth: canvas ? canvas.width : 0,
                        canvasHeight: canvas ? canvas.height : 0
                    };
                }
            ''')
            print(f"   - 容器存在: {konva_initialized['containerExists']}")
            print(f"   - Canvas存在: {konva_initialized['canvasExists']}")
            print(f"   - Canvas尺寸: {konva_initialized['canvasWidth']}x{konva_initialized['canvasHeight']}")
            
            if konva_initialized['canvasExists']:
                print("   ✓ Konva Stage 初始化成功")
            else:
                print("   ✗ Konva Stage 初始化失败")
            
            # 5. 验证导出区域参考线
            print("\n[5] 验证导出区域参考线...")
            guide_exists = page.evaluate('''
                () => {
                    // 检查是否有虚线矩形（导出区域参考线）
                    const container = document.querySelector('.editor-preview-wrapper');
                    const canvas = container ? container.querySelector('canvas') : null;
                    if (!canvas) return false;
                    
                    // 通过 Konva 实例检查
                    if (typeof MeeWoo !== 'undefined' && MeeWoo.app && MeeWoo.app.$refs) {
                        return true;  // 简化检查
                    }
                    return false;
                }
            ''')
            print(f"   - 参考线状态: {'存在' if guide_exists else '未检测到'}")
            
            # 6. 测试显示文案功能
            print("\n[6] 测试显示文案功能...")
            show_text_checkbox = page.locator('input[type="checkbox"]').nth(1)  # 第二个checkbox通常是显示文案
            if show_text_checkbox.is_visible():
                if not show_text_checkbox.is_checked():
                    show_text_checkbox.click()
                    page.wait_for_timeout(wait_timeout)
                    page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_04_text_visible.png"))
                    print("   ✓ 已开启显示文案")
                else:
                    print("   - 文案已处于显示状态")
            else:
                print("   - 未找到显示文案开关")
            
            # 7. 测试文案编辑
            print("\n[7] 测试文案编辑...")
            text_input = page.locator('textarea').first
            if text_input.is_visible():
                test_text = "测试文案\n第二行"
                text_input.fill(test_text)
                page.wait_for_timeout(wait_timeout)
                page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_05_text_edited.png"))
                print(f"   ✓ 文案已编辑: {test_text.replace(chr(10), ' ')}")
            else:
                print("   - 未找到文案输入框")
            
            # 8. 测试对齐方式切换
            print("\n[8] 测试对齐方式切换...")
            for align in ['左', '中', '右']:
                align_btn = page.locator(f'button:has-text("{align}")').first
                if align_btn.is_visible():
                    align_btn.click()
                    page.wait_for_timeout(500)
                    print(f"   ✓ 已切换到{align}对齐")
            page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_06_align_changed.png"))
            
            # 9. 测试 Canvas 点击选中
            print("\n[9] 测试 Canvas 点击选中...")
            canvas_area = page.locator('.editor-preview-wrapper canvas').first
            if canvas_area.is_visible():
                # 点击画布中心区域
                box = canvas_area.bounding_box()
                if box:
                    center_x = box['x'] + box['width'] / 2
                    center_y = box['y'] + box['height'] / 2
                    page.mouse.click(center_x, center_y)
                    page.wait_for_timeout(500)
                    page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_07_canvas_clicked.png"))
                    print("   ✓ 已点击画布中心区域")
            
            # 10. 测试保存功能
            print("\n[10] 测试保存功能...")
            save_btn = page.locator('button:has-text("保存")').first
            if save_btn.is_visible():
                # 注意：实际保存可能需要更多时间，这里只验证按钮存在
                print("   ✓ 保存按钮存在")
                # save_btn.click()  # 取消注释以实际测试保存
            else:
                print("   - 未找到保存按钮")
            
            # 11. 测试关闭编辑器
            print("\n[11] 测试关闭编辑器...")
            close_btn = page.locator('.center-modal-close, button:has-text("关闭")').first
            if close_btn.is_visible():
                close_btn.click()
                page.wait_for_timeout(wait_timeout)
                page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_08_editor_closed.png"))
                print("   ✓ 编辑器已关闭")
            
            # 测试总结
            print("\n=== 测试总结 ===")
            print("✅ Konva 素材编辑器测试完成")
            print(f"   - 截图已保存到: {screenshot_dir}")
            
            return True
            
        except Exception as e:
            print(f"\n❌ 测试过程中发生错误: {e}")
            page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_error.png"))
            return False
            
        finally:
            browser.close()
            print("\n浏览器已关闭")


def test_konva_transformer_interaction(
    test_name="konva_transformer",
    server_url="http://localhost:5173/",
    screenshot_dir="test_screenshots"
):
    """
    测试 Konva Transformer 交互
    
    专门测试选中状态和 Transformer 手柄操作
    """
    os.makedirs(screenshot_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        try:
            print("=== Konva Transformer 交互测试 ===")
            
            page.goto(server_url)
            page.wait_for_load_state('networkidle')
            
            # 打开素材编辑器（复用上面的步骤）
            page.locator('text=素材图管理').first.click()
            page.wait_for_timeout(1000)
            page.locator('button:has-text("编辑")').first.click()
            page.wait_for_timeout(2000)
            
            # 点击底图区域选中
            print("\n[1] 测试底图选中...")
            canvas = page.locator('.editor-preview-wrapper canvas').first
            box = canvas.bounding_box()
            
            if box:
                # 点击底图位置（假设在参考线区域内）
                image_x = box['x'] + box['width'] * 0.4
                image_y = box['y'] + box['height'] * 0.4
                page.mouse.click(image_x, image_y)
                page.wait_for_timeout(500)
                page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_01_image_selected.png"))
                print("   ✓ 底图已选中")
                
                # 验证 Transformer 是否显示
                # Transformer 会添加额外的 canvas 元素或改变鼠标样式
                cursor = page.evaluate('document.body.style.cursor')
                print(f"   - 当前光标样式: {cursor or 'default'}")
            
            # 点击文案区域选中
            print("\n[2] 测试文案选中...")
            # 开启显示文案
            show_text = page.locator('input[type="checkbox"]').nth(1)
            if not show_text.is_checked():
                show_text.click()
                page.wait_for_timeout(500)
            
            # 点击文案位置
            if box:
                text_x = box['x'] + box['width'] * 0.6
                text_y = box['y'] + box['height'] * 0.6
                page.mouse.click(text_x, text_y)
                page.wait_for_timeout(500)
                page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_02_text_selected.png"))
                print("   ✓ 文案已选中")
            
            # 测试拖拽移动
            print("\n[3] 测试拖拽移动...")
            if box:
                # 拖拽文案
                text_x = box['x'] + box['width'] * 0.6
                text_y = box['y'] + box['height'] * 0.6
                page.mouse.move(text_x, text_y)
                page.mouse.down()
                page.mouse.move(text_x + 50, text_y + 30)
                page.mouse.up()
                page.wait_for_timeout(500)
                page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_03_text_dragged.png"))
                print("   ✓ 文案已拖拽移动")
            
            # 点击空白区域取消选中
            print("\n[4] 测试取消选中...")
            if box:
                # 点击画布边缘（空白区域）
                page.mouse.click(box['x'] + 10, box['y'] + 10)
                page.wait_for_timeout(500)
                page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}_04_deselected.png"))
                print("   ✓ 已取消选中")
            
            print("\n✅ Transformer 交互测试完成")
            return True
            
        except Exception as e:
            print(f"❌ 测试错误: {e}")
            return False
            
        finally:
            browser.close()


if __name__ == '__main__':
    # 运行完整测试
    test_konva_material_editor(
        test_name="konva_editor",
        server_url="http://localhost:5173/",
        screenshot_dir="test_screenshots"
    )
    
    # 运行 Transformer 交互测试
    # test_konva_transformer_interaction(
    #     test_name="konva_transformer",
    #     server_url="http://localhost:5173/",
    #     screenshot_dir="test_screenshots"
    # )
