#!/usr/bin/env python3
"""
Git 推送脚本 - Python 版本
避免编码问题，使用基本功能
"""

import subprocess
import sys
import os
from datetime import datetime

def run_cmd(cmd, cwd=None):
    """运行命令并返回结果"""
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            capture_output=True, 
            text=True, 
            encoding='utf-8',
            cwd=cwd
        )
        return result.returncode, result.stdout.strip(), result.stderr.strip()
    except Exception as e:
        return 1, "", str(e)

def main():
    print("==== Git 推送 ====\n")
    
    # 检查当前分支
    print("0. 检查当前分支...")
    code, stdout, stderr = run_cmd("git rev-parse --abbrev-ref HEAD")
    if code != 0:
        print(f"错误：不在 git 仓库中: {stderr}")
        return 1
    current_branch = stdout
    print(f"当前分支: {current_branch}")
    
    # 验证分支是否为支持的分支
    supported_branches = ["main", "master"]
    if current_branch not in supported_branches:
        print(f"警告: 当前分支 {current_branch} 不是推荐的分支（main 或 master）")
        print("将继续在当前分支上操作，但建议使用 main 或 master 分支")
    
    # 检查是否有修改
    print("\n1. 检查本地修改...")
    code, stdout, stderr = run_cmd("git status --short")
    if code != 0:
        print(f"运行 git status 失败: {stderr}")
        return 1
    
    if not stdout:
        print("没有需要提交的修改")
        return 0
    
    print("发现以下修改：")
    print(stdout)
    
    # 添加所有修改
    print("\n2. 添加所有修改...")
    code, stdout, stderr = run_cmd("git add -A")
    if code != 0:
        print(f"添加文件失败: {stderr}")
        return 1
    
    # 生成变更描述
    print("\n2.1 生成变更描述...")
    code, stdout, stderr = run_cmd("git diff --name-status")
    if code != 0:
        print(f"获取变更信息失败: {stderr}")
        return 1
    
    # 提取变更的文件名
    changed_files = []
    for line in stdout.split('\n'):
        if line:
            parts = line.split('\t', 1)
            if len(parts) == 2:
                # 只提取文件名，不包括变更类型
                file_path = parts[1]
                # 对于重命名的文件，只保留新文件名
                if '->' in file_path:
                    file_path = file_path.split(' -> ')[1]
                changed_files.append(file_path)
    
    # 生成最终描述
    if changed_files:
        # 生成包含文件名的描述
        change_summary = "更新文件: " + ', '.join(changed_files)
    else:
        change_summary = "文件修改"
    
    # 提交
    print("\n3. 提交更改...")
    commit_msg = f"{change_summary}"
    print(f"提交信息: {commit_msg}")
    code, stdout, stderr = run_cmd(f"git commit -m \"{commit_msg}\"")
    if code != 0:
        print(f"提交失败: {stderr}")
        return 1
    
    # 拉取远程更改
    print("\n4. 拉取远程更改...")
    code, stdout, stderr = run_cmd(f"git pull --no-rebase origin {current_branch}")
    if code != 0:
        print(f"拉取失败，尝试直接推送: {stderr}")
    else:
        print("拉取成功")
    
    # 推送
    print("\n5. 推送到远程...")
    code, stdout, stderr = run_cmd(f"git push origin {current_branch}")
    if code != 0:
        print(f"推送失败: {stderr}")
        return 1
    
    print("\n==== 完成！ ====")
    print("代码已成功推送到 GitHub")
    return 0

if __name__ == "__main__":
    sys.exit(main())
