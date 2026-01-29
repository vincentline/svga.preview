# 项目：
1. 项目名称：MeeWoo

# 项目规则
1. 当用户要求测试时，启动测试服务，请执行`python start_server.py`
2. 当用户要求提交到GitHub时
  - 终端运行：`PowerShell.exe -ExecutionPolicy Bypass -File git-push.ps1`
3. 当用户要求发布时：
  - 默认发布到gh-pages分支
  - 终端运行：`PowerShell.exe -ExecutionPolicy Bypass -File .\publish-gh-pages-final.ps1`