import re

# 读取使用的选择器
used_selectors_path = 'used_selectors.txt'
with open(used_selectors_path, 'r', encoding='utf-8') as f:
    used_selectors = set(line.strip() for line in f if line.strip())

# 读取CSS文件
css_path = 'docs/auth/styles.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

# 解析CSS，提取所有规则
# 更准确地匹配CSS规则：选择器组 + { 样式内容 }
# 考虑嵌套的情况（虽然在这个CSS中可能不存在）
css_rules = []
i = 0
n = len(css_content)

while i < n:
    # 查找下一个 { 的位置
    open_brace = css_content.find('{', i)
    if open_brace == -1:
        break
    
    # 提取选择器部分
    selectors_str = css_content[i:open_brace].strip()
    if not selectors_str:
        i = open_brace + 1
        continue
    
    # 查找对应的 } 的位置
    close_brace = open_brace + 1
    brace_count = 1
    
    while close_brace < n and brace_count > 0:
        if css_content[close_brace] == '{':
            brace_count += 1
        elif css_content[close_brace] == '}':
            brace_count -= 1
        close_brace += 1
    
    if brace_count == 0:
        # 提取样式内容
        styles = css_content[open_brace+1:close_brace-1].strip()
        css_rules.append((selectors_str, styles))
    
    i = close_brace

# 处理规则，保留使用的选择器
cleaned_rules = []
unused_selectors = []

# 定义需要特殊处理的选择器映射
# 这些选择器可能在HTML中使用，但在CSS中的定义方式不同
selector_mappings = {
    '.base-input': '.base-input',
    '.input-wrapper': '.input-wrapper',
    '.input-wrapper--lg': '.input-wrapper--lg',
    '.btn-large-secondary': '.btn-large-secondary',
    '.form-group': '.form-group',
    '.form-actions': '.form-actions',
    '.login-container': '.login-container',
    '.login-card': '.login-card',
    '.login-logo': '.login-logo',
    '.login-form': '.login-form',
    '.login-footer': '.login-footer',
    '.error-message': '.error-message',
    '.loading-overlay': '.loading-overlay',
    '.loading-spinner': '.loading-spinner',
    'body.dark-mode .input-wrapper': 'body.dark-mode .input-wrapper',
    'body.dark-mode .base-input': 'body.dark-mode .base-input',
    'body.dark-mode .btn-large-secondary': 'body.dark-mode .btn-large-secondary',
    'body.dark-mode .error-message': 'body.dark-mode .error-message',
    'body.dark-mode .form-group label': 'body.dark-mode .form-group label',
    'body.dark-mode .loading-overlay': 'body.dark-mode .loading-overlay',
    'body.dark-mode .login-card': 'body.dark-mode .login-card',
    'body.dark-mode .login-footer': 'body.dark-mode .login-footer',
    'body.dark-mode .login-logo h1': 'body.dark-mode .login-logo h1',
}

for selectors_str, styles in css_rules:
    # 分割选择器组
    selectors = [s.strip() for s in selectors_str.split(',')]
    
    # 检查每个选择器是否被使用
    used_in_group = []
    for selector in selectors:
        # 检查选择器是否在使用列表中
        if selector in used_selectors:
            used_in_group.append(selector)
        else:
            # 检查是否是body.dark-mode的子选择器
            if selector.startswith('body.dark-mode '):
                sub_selector = selector.replace('body.dark-mode ', '', 1)
                if f'body.dark-mode {sub_selector}' in used_selectors:
                    used_in_group.append(selector)
                else:
                    unused_selectors.append(selector)
            # 检查是否在映射中
            elif selector in selector_mappings:
                if selector_mappings[selector] in used_selectors:
                    used_in_group.append(selector)
                else:
                    unused_selectors.append(selector)
            else:
                unused_selectors.append(selector)
    
    # 如果组中有使用的选择器，保留该组
    if used_in_group:
        # 重新组合选择器
        new_selectors_str = ', '.join(used_in_group)
        # 保留样式
        cleaned_rules.append((new_selectors_str, styles))

# 构建清理后的CSS
cleaned_css = ''
for selectors_str, styles in cleaned_rules:
    # 格式化CSS，确保选择器和样式之间有空格，并且样式有正确的缩进
    cleaned_css += f'{selectors_str} {{\n'
    # 为样式内容添加缩进
    lines = styles.split('\n')
    for line in lines:
        if line.strip():
            cleaned_css += f'  {line.strip()}\n'
    cleaned_css += '}\n\n'

# 保存清理后的CSS
output_path = 'docs/auth/styles_cleaned.css'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(cleaned_css)

# 打印结果
print(f"清理完成！")
print(f"未使用的选择器数量: {len(unused_selectors)}")
print(f"清理后的CSS文件已保存到: {output_path}")
print(f"清理后的CSS文件大小: {len(cleaned_css)} 字符")
print(f"原始CSS文件大小: {len(css_content)} 字符")
print(f"减少了: {len(css_content) - len(cleaned_css)} 字符 ({((len(css_content) - len(cleaned_css))/len(css_content)*100):.2f}%)")

# 保存未使用的选择器到文件
with open('unused_selectors.txt', 'w', encoding='utf-8') as f:
    for selector in sorted(unused_selectors):
        f.write(f"{selector}\n")

print(f"\n未使用的选择器已保存到: unused_selectors.txt")
