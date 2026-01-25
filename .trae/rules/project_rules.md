# 项目：
1. 项目名称：MeeWoo

# 项目规则
1. 当用户要求测试时，启动测试服务，请执行`python start_server.py`
2. 当用户要求提交到GitHub时
  - 终端运行：`PowerShell.exe -ExecutionPolicy Bypass -File git-push.ps1`
3. 当用户要求发布网页时：
  - 如果有未提交的变更，必须先提交到 GitHub，按上面GitHub提交流程提交
  - 如果变更都提交了，把docs文件夹里的内容提交到GitHub仓库的gh-pages分支
  - 发布时，必须填写发布信息，包括发布内容等