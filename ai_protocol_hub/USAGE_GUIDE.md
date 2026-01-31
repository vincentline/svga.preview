# 🚀 AI-Protocol-Hub 使用指南

欢迎使用 AI-Protocol-Hub！本指南将帮助你轻松将 AI-Protocol-Hub 安装到目标项目中，就像给项目安装一个超级能力包一样简单！

## 📋 目录

1. [快速开始](#快速开始)
2. [一键更新](#一键更新)
3. [超实用脚本](#超实用脚本)
4. [常见问题与解决方案](#常见问题与解决方案)
5. [系统要求](#系统要求)

## 🚩 快速开始

### 使用安装脚本（推荐，超简单！）

在目标项目的根目录执行以下命令，就像施展魔法一样：

```bash
# 下载安装脚本（获取魔法卷轴）
curl -O https://raw.githubusercontent.com/vincentline/AI-PH/main/install_submodule.py

# 执行安装脚本（施展魔法）
python install_submodule.py

# 提交更改（保存魔法效果）
git commit -m "添加 AI-Protocol-Hub 超级能力包"
git push
```

### 手动安装（备用方案）

如果无法使用安装脚本，没关系，我们还有备用方案：

```bash
# 克隆 AI-PH 仓库到临时目录（获取魔法材料）
git clone https://github.com/vincentline/AI-PH temp_ai_ph

# 复制 ai_protocol_hub 目录内容到目标位置（提炼魔法精华）
cp -r temp_ai_ph/ai_protocol_hub .

# 删除临时目录（清理魔法残渣）
rm -rf temp_ai_ph

# 提交更改（保存魔法效果）
git add ai_protocol_hub
git commit -m "添加 AI-Protocol-Hub 超级能力包"
git push
```

## 🔄 一键更新

想要获得最新的魔法能力？只需一键更新：

```bash
# 直接重新执行安装脚本（刷新魔法）
python install_submodule.py

# 提交更改（保存新魔法效果）
git add ai_protocol_hub
git commit -m "更新 AI-Protocol-Hub 到最新版本"
git push
```

这会自动删除旧的 `ai_protocol_hub` 目录，并从 AI-PH 仓库获取最新版本的魔法能力！

## 🛠️ 超实用脚本

AI-Protocol-Hub 提供了几个超实用的魔法脚本：

### 1. `GET_TIME.py` - 时间戳生成器

- **功能**：获取北京时间戳，就像拥有一个精准的魔法时钟
- **格式**：`[YYYY-MM-DD HH:MM:SS]`

```bash
# 执行时间戳生成脚本
python ai_protocol_hub/scripts/GET_TIME.py

# 在其他脚本中使用
import subprocess

time_stamp = subprocess.check_output(['python', 'ai_protocol_hub/scripts/GET_TIME.py'], universal_newlines=True).strip()
print(f"当前时间戳: {time_stamp}")
```

### 2. `git-push.py` - Git 推送助手

- **功能**：简化 Git 代码推送流程，就像有个小助手帮你整理代码

```bash
# 执行推送脚本
python ai_protocol_hub/scripts/git-push.py
```

### 3. `start_server.py` - 本地服务器启动器

- **功能**：启动本地 HTTP 服务器，让你的魔法项目可以在本地预览

```bash
# 启动本地服务器
python ai_protocol_hub/scripts/start_server.py
```

## ❓ 常见问题与解决方案

### 1. 安装失败了，怎么办？

**可能原因**：
- 网络连接问题（魔法信号不好）
- 权限不足（魔法能量不够）
- Python 版本过低（魔法卷轴版本不兼容）

**解决方案**：
- 检查网络连接是否正常（确保魔法信号畅通）
- 确保有足够的权限创建和删除目录（提升魔法能量等级）
- 确保使用 Python 3.6 或更高版本（使用最新的魔法卷轴）

### 2. 更新失败了，怎么办？

**可能原因**：
- 网络连接问题（魔法信号中断）
- 权限不足（旧魔法残留无法清除）

**解决方案**：
- 检查网络连接是否正常（重新连接魔法网络）
- 手动删除 `ai_protocol_hub` 目录后重新执行安装脚本（清除旧魔法，重新施展）

### 3. 脚本执行失败了，怎么办？

**可能原因**：
- Python 版本不兼容（魔法卷轴需要更高等级的魔法师）
- 权限问题（魔法施展区域受到限制）

**解决方案**：
- 确保使用 Python 3.6 或更高版本（提升魔法师等级）
- 确保有足够的权限执行脚本（获得魔法施展许可）

## 📝 系统要求

要使用 AI-Protocol-Hub 的魔法能力，你需要：

- Python 3.6 或更高版本（魔法卷轴读取器）
- Git 2.0 或更高版本（代码管理工具）
- Windows、macOS 或 Linux 操作系统（魔法施展平台）

## 🎯 小贴士

- **定期更新**：建议每周更新一次 AI-Protocol-Hub，获取最新的魔法能力
- **提交信息**：使用有趣的提交信息，让你的代码仓库更加生动
- **分享魔法**：如果你发现了 AI-Protocol-Hub 的新用法，别忘了分享给其他魔法师哦！

---

© 2026 AI-Protocol-Hub - 让项目拥有超级能力的魔法工具包！