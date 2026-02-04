#!/usr/bin/env python3
# 发布脚本：将 docs 目录部署到 gh-pages 分支
# 功能：关闭 Node 进程，检查并提交 Git 更改，将 docs 发布到 gh-pages 分支
# 注意：此脚本使用 UTF-8 编码，确保中文显示正常

import os
import sys
import subprocess
import shutil
import tempfile
from datetime import datetime

# 设置编码为 UTF-8
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

def print_with_encoding(text):
    """确保文本以正确的编码输出"""
    print(text)

def run_command(cmd, cwd=None, shell=True):
    """运行命令并返回结果"""
    try:
        # 对于Windows系统，先尝试使用utf-8编码
        if os.name == 'nt':
            try:
                result = subprocess.run(
                    cmd, 
                    cwd=cwd, 
                    shell=shell, 
                    capture_output=True, 
                    text=True,
                    encoding='utf-8'
                )
                return result
            except UnicodeDecodeError:
                # 如果utf-8失败，尝试使用gbk编码
                result = subprocess.run(
                    cmd, 
                    cwd=cwd, 
                    shell=shell, 
                    capture_output=True, 
                    text=True, 
                    encoding='gbk'
                )
                return result
        else:
            # 对于非Windows系统，使用UTF-8编码
            result = subprocess.run(
                cmd, 
                cwd=cwd, 
                shell=shell, 
                capture_output=True, 
                text=True, 
                encoding='utf-8'
            )
            return result
    except Exception as e:
        print_with_encoding(f"错误：运行命令失败：{e}")
        return None

def close_node_processes():
    """关闭 Node 进程"""
    print_with_encoding("\n1. 检查 Node 进程...")
    
    if os.name == 'nt':  # Windows
        cmd = 'tasklist /FI "IMAGENAME eq node.exe"'
        result = run_command(cmd)
        if result and result.stdout:
            if "node.exe" in result.stdout:
                print_with_encoding("发现 Node 进程，正在关闭...")
                kill_cmd = 'taskkill /F /IM node.exe'
                kill_result = run_command(kill_cmd)
                if kill_result and kill_result.returncode == 0:
                    print_with_encoding("成功关闭所有 Node 进程")
                else:
                    print_with_encoding("警告：关闭 Node 进程时出现问题")
            else:
                print_with_encoding("未发现 Node 进程")
        else:
            print_with_encoding("未发现 Node 进程")
    else:  # Linux/macOS
        cmd = 'ps aux | grep node'
        result = run_command(cmd)
        if result and result.stdout:
            node_processes = [line for line in result.stdout.split('\n') if 'node' in line and not 'grep' in line]
            if node_processes:
                print_with_encoding(f"发现 {len(node_processes)} 个 Node 进程，正在关闭...")
                for process in node_processes:
                    pid = process.split()[1]
                    kill_cmd = f'kill -9 {pid}'
                    run_command(kill_cmd)
                print_with_encoding("成功关闭所有 Node 进程")
            else:
                print_with_encoding("未发现 Node 进程")
        else:
            print_with_encoding("未发现 Node 进程")

def check_and_commit_git_changes():
    """检查并提交 Git 更改"""
    print_with_encoding("\n2. 检查 Git 状态...")
    
    # 检查是否在 Git 仓库中
    result = run_command('git status --short')
    if result and result.stdout:
        if result.stdout.strip():
            print_with_encoding("发现未提交的更改，正在提交...")
            
            # 检查是否存在 git-push.py 脚本
            git_push_script = os.path.join(os.getcwd(), 'git-push.py')
            if os.path.exists(git_push_script):
                # 运行 git-push.py 脚本
                try:
                    push_result = subprocess.run(
                        [sys.executable, git_push_script],
                        cwd=os.getcwd(),
                        capture_output=True,
                        text=True
                    )
                except UnicodeDecodeError:
                    # 如果编码解码失败，尝试使用gbk编码
                    push_result = subprocess.run(
                        [sys.executable, git_push_script],
                        cwd=os.getcwd(),
                        capture_output=True,
                        text=True,
                        encoding='gbk'
                    )
                if push_result.returncode == 0:
                    print_with_encoding("成功提交更改")
                else:
                    print_with_encoding("错误：提交更改失败")
                    print_with_encoding(f"错误信息：{push_result.stderr}")
                    return False
            else:
                # 如果没有 git-push.py 脚本，手动提交
                print_with_encoding("未找到 git-push.py 脚本，手动提交更改...")
                
                # 添加所有更改
                add_result = run_command('git add .')
                if add_result:
                    if add_result.returncode != 0:
                        print_with_encoding("错误：添加更改失败")
                        print_with_encoding(f"错误信息：{add_result.stderr}")
                        return False
                    else:
                        print_with_encoding("成功添加更改")
                else:
                    print_with_encoding("错误：添加更改失败")
                    return False
                
                # 提交更改
                commit_msg = f"Update: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                # 使用双引号包围提交消息，更适合Windows命令行
                if os.name == 'nt':
                    # Windows命令行使用双引号
                    commit_result = run_command(f'git commit -m "{commit_msg}"')
                else:
                    # 非Windows系统使用单引号
                    commit_result = run_command(f"git commit -m '{commit_msg}'")
                if commit_result:
                    if commit_result.returncode != 0:
                        print_with_encoding("错误：提交更改失败")
                        print_with_encoding(f"错误信息：{commit_result.stderr}")
                        return False
                    else:
                        print_with_encoding("成功提交更改")
                else:
                    print_with_encoding("错误：提交更改失败")
                    return False
                
                print_with_encoding("成功提交更改")
        else:
            print_with_encoding("没有需要提交的更改")
    else:
        print_with_encoding("错误：检查 Git 状态失败")
        return False
    
    return True

def publish_to_gh_pages():
    """将 docs 目录发布到 gh-pages 分支"""
    print_with_encoding("\n3. 正在将 docs 目录发布到 gh-pages 分支...")
    
    # 检查 docs 目录是否存在
    docs_path = os.path.join(os.getcwd(), 'docs')
    if not os.path.exists(docs_path):
        print_with_encoding("错误：docs 目录不存在")
        return False
    
    # 保存当前分支
    current_branch_result = run_command('git rev-parse --abbrev-ref HEAD')
    if not current_branch_result:
        print_with_encoding("错误：获取当前分支失败")
        return False
    current_branch = current_branch_result.stdout.strip()
    print_with_encoding(f"[进度] 当前分支: {current_branch}")
    
    # 保存项目根目录路径
    project_root = os.getcwd()
    print_with_encoding(f"[进度] 项目根目录: {project_root}")
    
    # 创建临时目录
    temp_dir = tempfile.mkdtemp(prefix='gh-pages-deploy-')
    print_with_encoding(f"[进度] 创建临时目录: {temp_dir}")
    
    try:
        # 克隆仓库到临时目录
        print_with_encoding("[进度] 克隆仓库到临时目录...")
        # 使用 --no-single-branch 选项克隆所有分支
        clone_result = run_command(f'git clone --no-single-branch "file://{os.getcwd()}" "{temp_dir}"')
        if clone_result and clone_result.returncode != 0:
            print_with_encoding("错误：克隆仓库失败")
            return False
        
        # 切换到临时目录
        os.chdir(temp_dir)
        
        # 切换到 gh-pages 分支
        print_with_encoding("[进度] 切换到 gh-pages 分支...")
        
        # 先检查远程 gh-pages 分支是否存在
        remote_gh_pages_exists = run_command('git show-ref --verify --quiet refs/remotes/origin/gh-pages')
        
        # 再检查本地 gh-pages 分支是否存在
        local_gh_pages_exists = run_command('git show-ref --verify --quiet refs/heads/gh-pages')
        
        if local_gh_pages_exists and local_gh_pages_exists.returncode == 0:
            # 如果本地 gh-pages 分支存在，直接切换
            print_with_encoding("[进度] 本地 gh-pages 分支存在，切换到该分支...")
            checkout_result = run_command('git checkout gh-pages')
            if checkout_result and checkout_result.returncode != 0:
                print_with_encoding("错误：切换到 gh-pages 分支失败")
                return False
        elif remote_gh_pages_exists and remote_gh_pages_exists.returncode == 0:
            # 如果远程 gh-pages 分支存在但本地不存在，从远程创建本地分支
            print_with_encoding("[进度] 远程 gh-pages 分支存在，从远程创建本地分支...")
            checkout_result = run_command('git checkout -b gh-pages origin/gh-pages')
            if checkout_result and checkout_result.returncode != 0:
                print_with_encoding("错误：从远程创建并切换到 gh-pages 分支失败")
                return False
        else:
            # 如果 gh-pages 分支不存在，创建一个新的
            print_with_encoding("[进度] gh-pages 分支不存在，创建新分支...")
            run_command('git checkout --orphan gh-pages')
            run_command('git reset --hard')
            run_command('git commit --allow-empty -m "Initial commit for gh-pages"')
        
        # 清空 gh-pages 分支的内容
        print_with_encoding("[进度] 清空 gh-pages 分支的内容...")
        files_to_keep = ['.git', '.gitignore', 'CNAME', '_headers', 'vercel.json']
        
        for item in os.listdir('.'):
            if item in files_to_keep:
                continue
            item_path = os.path.join('.', item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path)
            else:
                os.remove(item_path)
        
        # 复制 main 分支的 docs 目录内容到 gh-pages 分支
        print_with_encoding("[进度] 复制 docs 目录内容到 gh-pages 分支...")
        main_docs_path = os.path.join(project_root, 'docs')
        print_with_encoding(f"[进度] 源 docs 目录: {main_docs_path}")
        
        def copy_directory(src, dst):
            if not os.path.exists(dst):
                os.makedirs(dst)
            
            for item in os.listdir(src):
                src_item = os.path.join(src, item)
                dst_item = os.path.join(dst, item)
                
                if os.path.isdir(src_item):
                    copy_directory(src_item, dst_item)
                else:
                    shutil.copy2(src_item, dst_item)
        
        copy_directory(main_docs_path, '.')
        
        # 添加所有文件并提交
        print_with_encoding("[进度] 添加所有文件并提交...")
        run_command('git add .')
        
        commit_msg = f"Deploy docs to gh-pages: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        commit_result = run_command(f"git commit -m '{commit_msg}'")
        if commit_result and commit_result.returncode != 0:
            print_with_encoding("警告：没有需要提交的更改")
        
        # 推送到 gh-pages 分支 - 使用强制推送，因为我们是重建分支内容
        print_with_encoding("[进度] 推送到 gh-pages 分支...")
        push_result = run_command('git push -f origin gh-pages')
        if push_result:
            if push_result.returncode != 0:
                print_with_encoding("错误：推送失败")
                print_with_encoding(f"错误信息：{push_result.stderr}")
                print_with_encoding(f"标准输出：{push_result.stdout}")
                return False
            else:
                print_with_encoding("成功推送到 gh-pages 分支")
        else:
            print_with_encoding("错误：推送失败")
            return False
        
        # 清理临时目录
        os.chdir(os.path.dirname(temp_dir))
        print_with_encoding("[进度] 清理临时目录")
        
        # 切换回原分支
        os.chdir(project_root)
        checkout_result = run_command(f'git checkout {current_branch}')
        if checkout_result and checkout_result.returncode != 0:
            print_with_encoding("警告：切换回原分支失败")
        
        print_with_encoding("成功：docs 目录已发布到 gh-pages 分支")
        return True
        
    except Exception as e:
        print_with_encoding(f"错误：发布到 gh-pages 分支失败：{e}")
        return False
    finally:
        # 确保临时目录被清理
        if 'temp_dir' in locals() and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except:
                pass

def main():
    """主函数"""
    print_with_encoding("=== 发布到 gh-pages 分支脚本 ===")
    
    # 1. 关闭 Node 进程
    close_node_processes()
    
    # 2. 检查并提交 Git 更改
    if not check_and_commit_git_changes():
        print_with_encoding("错误：检查并提交 Git 更改失败")
        sys.exit(1)
    
    # 3. 将 docs 目录发布到 gh-pages 分支
    if not publish_to_gh_pages():
        print_with_encoding("错误：发布到 gh-pages 分支失败")
        sys.exit(1)
    
    print_with_encoding("\n=== 发布完成 ===")
    print_with_encoding("docs 目录已成功发布到 gh-pages 分支")

if __name__ == '__main__':
    main()
