#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
自动生成雪碧图工具
将所有控制按钮图标合并成一张雪碧图，并生成对应的CSS代码
"""

import os
from PIL import Image
import json

# 配置
IMG_DIR = 'docs/assets/img'
OUTPUT_SPRITE = 'docs/assets/img/controls-sprite.png'
OUTPUT_CSS = 'docs/assets/css/sprite-generated.css'

# 需要合并的图标列表（按类别分组）
ICONS = {
    'help': [
        'help.png',
        'help_hover.png',
        'help_dark.png',
        'help_hover_dark.png'
    ],
    'play': [
        'play_Default.png',
        'play_hover.png',
        'play_press.png',
        'play_Default_dark.png',
        'play_hover_dark.png',
        'play_press_dark.png'
    ],
    'stop': [
        'stop_Default.png',
        'stop_hover.png',
        'stop_press.png',
        'stop_Default_dark.png',
        'stop_hover_dark.png',
        'stop_press_dark.png'
    ],
    'mute': [
        'mute_Default.png',
        'mute_hover.png',
        'mute_press.png',
        'mute_on_Default.png',
        'mute_on_hover.png',
        'mute_on_press.png',
        'mute_disabled.png',
        'mute_Default_dark.png',
        'mute_hover_dark.png',
        'mute_press_dark.png',
        'mute_on_Default_dark.png',
        'mute_on_hover_dark.png',
        'mute_on_press_dark.png',
        'mute_disabled_dark.png'
    ],
    'zoom': [
        'zoom_in.png',
        'zoom_in_hover.png',
        'zoom_out.png',
        'zoom_out_hover.png',
        'zoom_in_dark.png',
        'zoom_in_hover_dark.png',
        'zoom_out_dark.png',
        'zoom_out_hover_dark.png'
    ],
    'one2one': [
        'one2one.png',
        'one2one_hover.png',
        'one2one_dark.png',
        'one2one_hover_dark.png'
    ],
    'contain': [
        'contain.png',
        'contain_hover.png',
        'contain_dark.png',
        'contain_hover_dark.png'
    ],
    'recover': [
        'recover.png',
        'recover_dark.png',
    ],
    'close': [
        'close.png',
        'close_dark.png',
    ],
    'back': [
        'back.png',
        'back_dark.png',
    ],
    'minimize': [
        'minimize.png',
        'minimize_hover.png',
        'minimize_dark.png',
        'minimize_hover_dark.png',
    ],
    'maximize': [
        'maximize.png',
        'maximize_hover.png',
        'maximize_dark.png',
        'maximize_hover_dark.png',
    ],
    'mini_play': [
        'mini_play.png',
        'mini_play_hover.png',
        'mini_play_dark.png',
        'mini_play_hover_dark.png',
    ],
    'mini_stop': [
        'mini_stop.png',
        'mini_stop_hover.png',
        'mini_stop_dark.png',
        'mini_stop_hover_dark.png',
    ],
    'mini_mute': [
        'mini_mute.png',
        'mini_mute_hover.png',
        'mini_mute_dark.png',
        'mini_mute_hover_dark.png',
        'mini_mute_disabled.png',
        'mini_mute_disabled_dark.png',
        'mini_mute_on.png',
        'mini_mute_on_hover.png',
        'mini_mute_on_dark.png',
        'mini_mute_on_hover_dark.png',
    ],
    'AI_img': [
        'AI_img.png',
        'AI_img_hover.png',
        'AI_img_dark.png',
        'AI_img_hover_dark.png',
    ]
}


def generate_sprite():
    """生成雪碧图"""
    print("🎨 开始生成雪碧图...")

    # 收集所有图标文件
    all_icons = []
    icon_positions = {}

    for category, icons in ICONS.items():
        for icon in icons:
            icon_path = os.path.join(IMG_DIR, icon)
            if os.path.exists(icon_path):
                all_icons.append((icon, icon_path))
            else:
                print(f"⚠️  图标不存在: {icon}")

    if not all_icons:
        print("❌ 没有找到任何图标文件")
        return False

    print(f"✅ 找到 {len(all_icons)} 个图标文件")

    # 获取图标尺寸（假设所有图标尺寸一致或分类一致）
    first_img = Image.open(all_icons[0][1])
    icon_width = first_img.width
    icon_height = first_img.height
    first_img.close()

    print(f"📐 图标尺寸: {icon_width}x{icon_height}px")

    # 计算雪碧图尺寸（横向排列，每行10个）
    icons_per_row = 10
    rows = (len(all_icons) + icons_per_row - 1) // icons_per_row
    sprite_width = icon_width * icons_per_row
    sprite_height = icon_height * rows

    print(
        f"📊 雪碧图尺寸: {sprite_width}x{sprite_height}px ({icons_per_row}列 x {rows}行)")

    # 创建雪碧图
    sprite = Image.new('RGBA', (sprite_width, sprite_height), (0, 0, 0, 0))

    # 粘贴图标并记录位置
    for idx, (icon_name, icon_path) in enumerate(all_icons):
        img = Image.open(icon_path)

        # 确保图像模式为RGBA，保持透明通道
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        # 计算位置
        col = idx % icons_per_row
        row = idx // icons_per_row
        x = col * icon_width
        y = row * icon_height

        # 直接粘贴原始尺寸，不做任何缩放或重采样
        sprite.paste(img, (x, y), img)
        img.close()

        # 记录位置（CSS 使用负值）
        icon_positions[icon_name] = {
            'x': -x,
            'y': -y,
            'width': icon_width,
            'height': icon_height
        }

        print(f"  📍 {icon_name}: ({x}px, {y}px)")

    # 保存雪碧图（不压缩，保持最高质量）
    sprite.save(OUTPUT_SPRITE, 'PNG', compress_level=0)
    print(f"✅ 雪碧图已保存: {OUTPUT_SPRITE}")

    # 生成CSS
    generate_css(icon_positions, icon_width, icon_height)

    # 保存位置信息为JSON（方便调试）
    json_path = OUTPUT_SPRITE.replace('.png', '.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(icon_positions, f, indent=2, ensure_ascii=False)
    print(f"✅ 位置信息已保存: {json_path}")

    return True


def generate_css(positions, width, height):
    """生成CSS代码"""
    print("\n🎨 生成CSS代码...")

    css_lines = [
        "/* 自动生成的雪碧图样式 - 请勿手动编辑 */",
        "/* 生成时间: " +
        __import__('datetime').datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S') + " */",
        "",
        "/* 雪碧图基础样式 */",
        ".sprite-icon {",
        f"  background-image: url('../img/controls-sprite.png');",
        "  background-repeat: no-repeat;",
        "  display: inline-block;",
        "}",
        ""
    ]

    # 按类别生成CSS
    for category, icons in ICONS.items():
        css_lines.append(f"/* {category.upper()} 图标 */")

        for icon_name in icons:
            if icon_name not in positions:
                continue

            pos = positions[icon_name]
            class_name = icon_name.replace('.png', '').replace('_', '-')

            css_lines.append(f".sprite-{class_name} {{")
            css_lines.append(
                f"  background-position: {pos['x']}px {pos['y']}px;")
            css_lines.append(f"  width: {pos['width']}px;")
            css_lines.append(f"  height: {pos['height']}px;")
            css_lines.append("}")

        css_lines.append("")

    # 添加使用示例
    css_lines.extend([
        "/* 使用示例：",
        " * 播放按钮:",
        " * .play-btn {",
        " *   background-image: url('../img/controls-sprite.png');",
        " *   background-position: -0px -0px;  // play_Default.png的位置",
        " *   width: 28px;",
        " *   height: 28px;",
        " * }",
        " * ",
        " * 或者使用 sprite-play-Default 类名",
        " */"
    ])

    css_content = '\n'.join(css_lines)

    with open(OUTPUT_CSS, 'w', encoding='utf-8') as f:
        f.write(css_content)

    print(f"✅ CSS已生成: {OUTPUT_CSS}")
    print("\n💡 提示: 请将生成的CSS整合到 styles.css 中")


if __name__ == '__main__':
    try:
        success = generate_sprite()
        if success:
            print("\n🎉 雪碧图生成成功！")
            print("\n📝 下一步:")
            print("1. 查看生成的雪碧图: docs/assets/img/controls-sprite.png")
            print("2. 查看生成的CSS: docs/assets/css/sprite-generated.css")
            print("3. 将CSS样式整合到项目中")
        else:
            print("\n❌ 雪碧图生成失败")
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
