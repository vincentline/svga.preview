#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
静态资源复制和压缩脚本
功能：
1. 复制 CSS、JS、img 等静态文件到 docs 目录（img已通过规则排除）
2. 复制其他资源目录
3. 复制 gadgets 目录
4. 复制 src 根目录文件（排除指定文件）
5. 压缩 CSS 文件（使用 clean-css-cli）
6. 压缩 JavaScript 文件（使用 terser）
"""

import os
import shutil
import subprocess
import sys

# ==============================================
# 全局定义排除规则
# ==============================================
# 要排除的文件名
exclude_files = ['index.html', '404.html', 'drawer.css', 'panel.css', 'sprite-generated.css', 'style.css']
# 要排除的文件夹名
exclude_folders = ['gadgets', 'css']
# ==============================================

# 确保脚本使用 UTF-8 编码
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

def print_info(message):
    """打印信息"""
    print(f"[INFO] {message}")

def print_error(message):
    """打印错误"""
    print(f"[ERROR] {message}")

def copy_directory(source, destination):
    """复制目录"""
    try:
        if not os.path.exists(destination):
            os.makedirs(destination)
        
        # 复制目录内容
        for item in os.listdir(source):
            s = os.path.join(source, item)
            d = os.path.join(destination, item)
            # 跳过排除的文件夹
            if os.path.isdir(s) and item in exclude_folders:
                print_info(f"跳过排除的文件夹: {item}")
                continue
            if os.path.isdir(s):
                copy_directory(s, d)
            else:
                # 判断如果是排除的文件，直接跳过不复制
                if item in exclude_files:
                    print_info(f"跳过排除的文件: {item}")
                    continue  # 跳过当前文件，继续复制下一个
                shutil.copy2(s, d)  # 不是排除文件才执行复制
        print_info(f"复制目录完成: {source} -> {destination}")
    except Exception as e:
        print_error(f"复制目录失败 {source}: {e}")

def copy_file(source, destination):
    """复制单个文件【修复：增加排除判断】"""
    try:
        # 提取文件名，判断是否在排除列表中
        file_name = os.path.basename(source)
        if file_name in exclude_files:
            print_info(f"跳过排除的单个文件: {file_name}")
            return  # 直接返回，不执行复制
        
        # 确保目标目录存在
        dest_dir = os.path.dirname(destination)
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir)
        
        shutil.copy2(source, destination)
        print_info(f"复制文件完成: {source} -> {destination}")
    except Exception as e:
        print_error(f"复制文件失败 {source}: {e}")

def compress_css_files(directory):
    """压缩 CSS 文件"""
    try:
        css_files = []
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith('.css') and not file.endswith('.min.css'):
                    css_files.append(os.path.join(root, file))
        
        if css_files:
            print_info(f"开始压缩 {len(css_files)} 个CSS文件...")
            for css_file in css_files:
                try:
                    # 使用 npx cleancss 压缩 CSS
                    subprocess.run(
                        ['npx', 'cleancss', css_file, '-o', css_file],
                        check=True,
                        shell=True  # 在 Windows 上使用 shell
                    )
                    print_info(f"CSS压缩完成: {css_file}")
                except Exception as e:
                    print_error(f"CSS压缩失败 {css_file}: {e}")
        else:
            print_info("无需要压缩的CSS文件")
    except Exception as e:
        print_error(f"CSS压缩流程失败: {e}")

def compress_js_files(directory):
    """压缩 JavaScript 文件"""
    try:
        js_files = []
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith('.js') and not file.endswith('.min.js'):
                    js_files.append(os.path.join(root, file))
        
        if js_files:
            print_info(f"开始压缩 {len(js_files)} 个JavaScript文件...")
            for js_file in js_files:
                try:
                    # 使用 npx terser 压缩 JavaScript
                    subprocess.run(
                        ['npx', 'terser', js_file, '-o', js_file, '--compress', '--mangle'],
                        check=True,
                        shell=True  # 在 Windows 上使用 shell
                    )
                    print_info(f"JS压缩完成: {js_file}")
                except Exception as e:
                    print_error(f"JS压缩失败 {js_file}: {e}")
        else:
            print_info("无需要压缩的JavaScript文件")
    except Exception as e:
        print_error(f"JS压缩流程失败: {e}")

def main():
    """主函数"""
    print_info("===== 开始执行静态资源复制和压缩 =====")
    
    # 定义源目录和目标目录
    src_dir = os.path.join(os.getcwd(), 'src')
    docs_dir = os.path.join(os.getcwd(), 'docs')
    
    # 复制 CSS 文件
    css_source = os.path.join(src_dir, 'assets', 'css')
    css_dest = os.path.join(docs_dir, 'assets', 'css')
    if os.path.exists(css_source):
        copy_directory(css_source, css_dest)
    
    # 复制 js 文件
    js_source = os.path.join(src_dir, 'assets', 'js')
    js_dest = os.path.join(docs_dir, 'assets', 'js')
    if os.path.exists(js_source):
        copy_directory(js_source, js_dest)
    
    # 复制其他资源目录
    resource_dirs = [
        'dar_svga',
        'mingren_gift_1photo',
        'sth_auto_img',
        'svga',
        'xunzhang',
        'img'
    ]
    
    for resource_dir in resource_dirs:
        source = os.path.join(src_dir, 'assets', resource_dir)
        dest = os.path.join(docs_dir, 'assets', resource_dir)
        if os.path.exists(source):
            copy_directory(source, dest)
    
    # 复制 gadgets 目录
    gadgets_source = os.path.join(src_dir, 'gadgets')
    gadgets_dest = os.path.join(docs_dir, 'gadgets')
    if os.path.exists(gadgets_source):
        copy_directory(gadgets_source, gadgets_dest)
    
    # 复制 src 根目录文件（现在会走copy_file的排除规则）
    if os.path.exists(src_dir):
        for item in os.listdir(src_dir):
            item_path = os.path.join(src_dir, item)
            if os.path.isfile(item_path):
                dest_path = os.path.join(docs_dir, item)
                copy_file(item_path, dest_path)
    
    # 压缩 CSS 文件
    compress_css_files(os.path.join(docs_dir, 'assets', 'css'))
    
    # 压缩 JavaScript 文件
    compress_js_files(os.path.join(docs_dir, 'assets', 'js'))
    
    print_info("===== 静态资源复制和压缩执行完成 =====")

if __name__ == '__main__':
    main()