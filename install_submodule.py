#!/usr/bin/env python3
"""
AI-Protocol-Hub 子模块安装脚本

功能：
- 添加并克隆 AI-Protocol-Hub 子模块
- 检查并创建 skill_specs 文件夹
- 检查并创建 INDEX.md 文件
- 检查并创建 UPDATE_LOG.md 文件

使用方法：
在目标项目根目录执行：
python install_submodule.py

"""

# 脚本版本号
VERSION = "1.0.1"

import os
import sys
import subprocess
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def run_cmd(cmd, cwd=None, shell=True):
    """
    运行命令并返回结果
    
    参数：
        cmd: 要执行的命令
        cwd: 命令执行的工作目录
        shell: 是否使用shell执行
    
    返回：
        tuple: (returncode, stdout, stderr)
    """
    try:
        logger.debug(f"执行命令: {cmd} (cwd: {cwd})")
        result = subprocess.run(
            cmd, 
            shell=shell, 
            capture_output=True, 
            text=True, 
            encoding='utf-8',
            cwd=cwd
        )
        if result.returncode != 0:
            logger.warning(f"命令执行失败: {cmd}")
            logger.warning(f"错误输出: {result.stderr}")
        return result.returncode, result.stdout.strip(), result.stderr.strip()
    except Exception as e:
        logger.error(f"执行命令时发生异常: {str(e)}")
        return 1, "", str(e)


def add_submodule():
    """
    添加并克隆 AI-Protocol-Hub 子模块
    
    返回：
        bool: 操作是否成功
    """
    logger.info("开始添加 AI-Protocol-Hub 子模块...")
    
    # 检查当前目录是否为 ai_protocol_hub 目录，防止嵌套执行
    current_dir = os.path.basename(os.getcwd())
    if current_dir == "ai_protocol_hub":
        logger.error("错误：不能在 ai_protocol_hub 目录内部执行此脚本，否则会导致嵌套的目录结构")
        logger.error("请在目标项目的根目录执行此脚本")
        return False
    
    # 检查是否已经存在 ai_protocol_hub 目录
    if os.path.exists("ai_protocol_hub"):
        logger.warning("ai_protocol_hub 目录已存在，将删除并重新安装")
        import shutil
        shutil.rmtree("ai_protocol_hub")
    
    # 清理 Git 索引中可能存在的 ai_protocol_hub 条目
    logger.info("清理 Git 索引中可能存在的 ai_protocol_hub 条目...")
    code, stdout, stderr = run_cmd("git rm -rf --cached ai_protocol_hub")
    if code == 0:
        logger.info("Git 索引清理成功")
    else:
        logger.info("Git 索引中无 ai_protocol_hub 条目，跳过清理步骤")
    
    # 创建临时目录
    import tempfile
    temp_dir = tempfile.mkdtemp()
    logger.info(f"创建临时目录: {temp_dir}")
    
    try:
        # 克隆 AI-PH 仓库到临时目录
        logger.info("克隆 AI-PH 仓库到临时目录...")
        code, stdout, stderr = run_cmd(f"git clone https://github.com/vincentline/AI-PH {temp_dir}")
        if code != 0:
            logger.error("克隆 AI-PH 仓库失败")
            return False
        
        # 检查临时目录中是否存在 ai_protocol_hub 目录
        source_dir = os.path.join(temp_dir, "ai_protocol_hub")
        if not os.path.exists(source_dir):
            logger.error(f"临时目录中不存在 ai_protocol_hub 目录: {source_dir}")
            return False
        
        # 复制 ai_protocol_hub 目录内容到目标位置
        logger.info("复制 ai_protocol_hub 目录内容到目标位置...")
        import shutil
        shutil.copytree(source_dir, "ai_protocol_hub")
        
        logger.info("AI-Protocol-Hub 子模块添加成功")
        return True
    except Exception as e:
        logger.error(f"添加子模块时发生异常: {str(e)}")
        return False
    finally:
        # 删除临时目录
        if os.path.exists(temp_dir):
            logger.info(f"删除临时目录: {temp_dir}")
            import shutil
            try:
                shutil.rmtree(temp_dir)
                logger.info("临时目录删除成功")
            except Exception as e:
                logger.warning(f"删除临时目录时发生错误: {str(e)}")
                logger.warning("临时目录可能需要手动清理，但不影响安装结果")


def check_skill_specs():
    """
    检查并创建 skill_specs 文件夹
    
    返回：
        bool: 操作是否成功
    """
    logger.info("检查 skill_specs 文件夹...")
    
    skill_specs_path = os.path.join("ai_protocol_hub", "skill_specs")
    
    if not os.path.exists(skill_specs_path):
        logger.info("创建 skill_specs 文件夹...")
        try:
            os.makedirs(skill_specs_path)
            logger.info("skill_specs 文件夹创建成功")
        except Exception as e:
            logger.error(f"创建 skill_specs 文件夹失败: {str(e)}")
            return False
    else:
        logger.info("skill_specs 文件夹已存在，跳过创建步骤")
    
    return True


def create_index_md():
    """
    检查并创建 INDEX.md 文件
    
    返回：
        bool: 操作是否成功
    """
    logger.info("检查 INDEX.md 文件...")
    
    index_path = "INDEX.md"
    
    if not os.path.exists(index_path):
        logger.info("创建 INDEX.md 文件...")
        try:
            content = """# 项目索引

## 目录结构

## 功能模块索引

## 配置文件

## 快速导航

## 注意事项

## 更新记录
"""
            with open(index_path, "w", encoding="utf-8") as f:
                f.write(content)
            logger.info("INDEX.md 文件创建成功")
        except Exception as e:
            logger.error(f"创建 INDEX.md 文件失败: {str(e)}")
            return False
    else:
        logger.info("INDEX.md 文件已存在，跳过创建步骤")
    
    return True


def create_update_log_md():
    """
    检查并创建 UPDATE_LOG.md 文件
    
    返回：
        bool: 操作是否成功
    """
    logger.info("检查 UPDATE_LOG.md 文件...")
    
    update_log_path = "UPDATE_LOG.md"
    
    if not os.path.exists(update_log_path):
        logger.info("创建 UPDATE_LOG.md 文件...")
        try:
            content = """## 更新日志规则
- 除忽略项外，所有文件/文件夹的新增、删除、修改、重命名、移动均需记录
- 记录项：操作类型、路径、改动要点（功能/修复/优化等）
- 忽略项：
  - .gitignore过滤的文件和文件夹
  - 本文件（UPDATE_LOG.md）
- 更新日志后，必须自我验证：
  - 时间戳是否为正确的北京时间
  - 格式是否符合规范
  - 记录是否完整（包含所有必需字段）
- 更新记录默认保留60天，超过60天的记录可以根据需要删除

## 记录格式
时间戳 【操作类型】 : 路径信息 - 更新简述
- 时间戳：必须使用北京时间，格式为 [YYYY-MM-DD HH:MM:SS]，精确到秒
- 操作类型：新增文件、新增文件夹、删除文件、删除文件夹、修改文件、重命名文件、重命名文件夹、移动文件、移动文件夹
- 路径信息：使用相对路径
- 更新简述：如新增功能、修复问题、优化性能等，简单描述

## 更新记录
[2026-01-01 09:30:00] 【新增文件】 : UPDATE_LOG.md - 新增文件
"""
            with open(update_log_path, "w", encoding="utf-8") as f:
                f.write(content)
            logger.info("UPDATE_LOG.md 文件创建成功")
        except Exception as e:
            logger.error(f"创建 UPDATE_LOG.md 文件失败: {str(e)}")
            return False
    else:
        logger.info("UPDATE_LOG.md 文件已存在，跳过创建步骤")
    
    return True


def main():
    """
    脚本主函数
    """
    logger.info(f"开始执行 AI-Protocol-Hub 子模块安装脚本 (v{VERSION})")
    
    # 步骤 1: 添加并克隆子模块
    if not add_submodule():
        logger.error("安装失败：添加子模块失败")
        return 1
    
    # 步骤 2: 检查并创建 skill_specs 文件夹
    if not check_skill_specs():
        logger.error("安装失败：创建 skill_specs 文件夹失败")
        return 1
    
    # 步骤 3: 检查并创建 INDEX.md 文件
    if not create_index_md():
        logger.error("安装失败：创建 INDEX.md 文件失败")
        return 1
    
    # 步骤 4: 检查并创建 UPDATE_LOG.md 文件
    if not create_update_log_md():
        logger.error("安装失败：创建 UPDATE_LOG.md 文件失败")
        return 1
    
    logger.info("AI-Protocol-Hub 子模块安装脚本执行成功")
    logger.info("\n安装完成！项目现在包含：")
    logger.info("1. AI-Protocol-Hub 子模块")
    logger.info("2. skill_specs 文件夹")
    logger.info("3. INDEX.md 项目索引文件")
    logger.info("4. UPDATE_LOG.md 更新日志文件")
    
    return 0


if __name__ == "__main__":
    # 检查是否需要显示版本号
    if len(sys.argv) > 1 and sys.argv[1] in ["--version", "-v"]:
        print(f"AI-Protocol-Hub 子模块安装脚本 v{VERSION}")
        sys.exit(0)
    sys.exit(main())
