#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
CSV 转 JSON 工具脚本

功能：
- 读取 docs/assets/dar_svga/file-list.csv 文件中的数据
- 转换为 JSON 格式，支持文本样式的处理
- 处理字体权重、填充颜色、描边颜色、描边宽度、文本阴影、渐变和多重阴影等样式属性
- 生成 docs/assets/dar_svga/file-list.json 文件

作者：MeeWoo 团队
最后修改：2026-01-29
"""

import json
import csv

# 定义需要处理的样式key列表
STYLE_KEYS = [
    'name01',
    'Username01',
    'Assistant',
    'img_2103118107',
    'img_2103118097',
    'img_394'
]


def convert_csv_to_json():
    """
    将 CSV 文件转换为 JSON 格式
    
    步骤：
    1. 读取 CSV 文件内容
    2. 遍历每一行数据，构建 JSON 对象
    3. 处理文本样式属性
    4. 写入 JSON 文件
    
    返回值：
        int: 转换的数据条数
    """
    # 读取CSV
    rows = []
    with open('docs/assets/dar_svga/file-list.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # 转换为JSON格式
    result = []
    for row in rows:
        item = {
            'name': row['name'],
            'svga': row['svga']
        }
        
        text_style = {}
        
        for key in STYLE_KEYS:
            # 检查该key是否有任何属性有值
            has_style = any([
                row.get(f'{key}_fontWeight'),
                row.get(f'{key}_fillColor'),
                row.get(f'{key}_strokeColor'),
                row.get(f'{key}_strokeWidth'),
                row.get(f'{key}_textShadow'),
                row.get(f'{key}_gradient_colors'),
                row.get(f'{key}_multiShadow')
            ])
            
            if has_style:
                style_obj = {}
                
                if row.get(f'{key}_fontWeight'):
                    style_obj['fontWeight'] = row[f'{key}_fontWeight']
                if row.get(f'{key}_fillColor'):
                    style_obj['fillColor'] = row[f'{key}_fillColor']
                if row.get(f'{key}_strokeColor'):
                    style_obj['strokeColor'] = row[f'{key}_strokeColor']
                
                stroke_width = row.get(f'{key}_strokeWidth')
                if stroke_width:
                    style_obj['strokeWidth'] = float(stroke_width) if '.' in stroke_width else int(stroke_width)
                    
                if row.get(f'{key}_textShadow'):
                    style_obj['textShadow'] = row[f'{key}_textShadow']
                
                # 处理gradient
                if row.get(f'{key}_gradient_colors'):
                    colors = row[f'{key}_gradient_colors'].split('|')
                    pos_str = row.get(f'{key}_gradient_positions', '')
                    if pos_str:
                        positions = [float(p) for p in pos_str.split('|')]
                    else:
                        # 如果没有位置信息，默认为均匀分布或由使用方处理
                        positions = []
                    
                    style_obj['gradient'] = {
                        'colors': colors,
                        'positions': positions
                    }
                
                # 处理multiShadow
                if row.get(f'{key}_multiShadow'):
                    style_obj['multiShadow'] = row[f'{key}_multiShadow'].split('|')
                    
                text_style[key] = style_obj
                
        if text_style:
            item['textStyle'] = text_style
        
        result.append(item)

    # 写入JSON
    with open('docs/assets/dar_svga/file-list.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    return len(result)


if __name__ == '__main__':
    """
    脚本执行入口
    """
    count = convert_csv_to_json()
    print(f'✅ 已转换 {count} 条数据到 file-list.json')
