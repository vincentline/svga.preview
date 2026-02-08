#!/usr/bin/env python3
"""
启动增强版错误捕获脚本

Usage:
    python scripts/capture_errors.py [--help]

Options:
    --help  显示帮助信息
"""

import sys
import os
import subprocess


def main():
    # 显示帮助信息
    if '--help' in sys.argv or '-h' in sys.argv:
        print(__doc__)
        return
    
    # 脚本目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, '../../..'))
    
    # 增强版错误捕获脚本路径
    error_capture_script = os.path.join(script_dir, '../examples/enhanced_error_capture.py')
    
    # 检查脚本是否存在
    if not os.path.exists(error_capture_script):
        print(f"错误：增强版错误捕获脚本不存在: {error_capture_script}")
        return
    
    # 构建命令
    command = [
        'python', 'scripts/with_server.py',
        '--server', 'npm run dev',
        '--port', '5173',
        '--',
        'python', error_capture_script
    ]
    
    print("启动增强版错误捕获...")
    print(f"执行命令: {' '.join(command)}")
    print("\n提示:")
    print("1. 浏览器会自动打开，您可以进行各种操作测试")
    print("2. 错误和警告会实时显示在终端中")
    print("3. 按 Ctrl+C 停止捕获并查看统计信息")
    print("4. 详细日志会保存到带时间戳的文件中\n")
    
    # 执行命令
    try:
        subprocess.run(command, cwd=project_root, check=True)
    except subprocess.CalledProcessError as e:
        print(f"命令执行失败: {e}")
    except KeyboardInterrupt:
        print("\n操作被用户中断")


if __name__ == "__main__":
    main()
