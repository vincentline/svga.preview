#!/usr/bin/env python3
"""
查找index.html文件中#app元素的结束标签
"""

import re

file_path = 'f:\\my_tools\\MeeWoo\\MeeWoo\\src\\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 查找#app元素的开始位置
app_start_pattern = r'<div id="app"[^>]*>'
app_start_match = re.search(app_start_pattern, content)

if app_start_match:
    app_start_pos = app_start_match.end()
    print(f"#app元素开始于位置: {app_start_pos}")
    
    # 从开始位置后开始查找匹配的结束标签
    current_pos = app_start_pos
    open_divs = 1  # 已经找到一个开始的div
    
    while current_pos < len(content) and open_divs > 0:
        # 查找下一个<div>或</div>
        next_open = content.find('<div', current_pos)
        next_close = content.find('</div>', current_pos)
        
        if next_open == -1 and next_close == -1:
            break
        
        # 确定下一个标签的位置
        if next_open == -1:
            next_pos = next_close
            is_open = False
        elif next_close == -1:
            next_pos = next_open
            is_open = True
        else:
            next_pos = min(next_open, next_close)
            is_open = next_pos == next_open
        
        # 更新计数器
        if is_open:
            # 检查是否是真正的div标签（不是注释或其他）
            if not re.search(r'<!--.*?-->', content[current_pos:next_pos+5]):
                open_divs += 1
        else:
            open_divs -= 1
        
        current_pos = next_pos + (5 if is_open else 6)
    
    if open_divs == 0:
        # 找到结束标签，计算行号
        lines_before = content[:current_pos-6].count('\n') + 1
        print(f"#app元素结束于行号: {lines_before}")
        print(f"结束标签位置: {current_pos-6} to {current_pos}")
        
        # 打印结束标签周围的内容
        context_start = max(0, current_pos - 100)
        context_end = min(len(content), current_pos + 100)
        print("\n结束标签周围的内容:")
        print(content[context_start:context_end])
    else:
        print("未找到#app元素的结束标签")
else:
    print("未找到#app元素的开始标签")
