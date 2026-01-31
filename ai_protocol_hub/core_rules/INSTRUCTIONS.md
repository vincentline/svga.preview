# 中文指令规则说明
当用户输入中文指令时，必须根据指令名称执行相应操作，
如用户输入“【提交】”，则必须执行运行：`python ai_protocol_hub/scripts/git-push.py`提交代码改动到GitHub仓库

## 指令列表

1. 【测试】
  - 执行：启动测试服务，请执行`python ai_protocol_hub/scripts/start_server.py`
2. 【更新依赖】
  - 执行：更新项目依赖
3. 【回答】
  - 执行：只回答问题或生成文档，不生成代码改动代码。
4. 【提交】
  - 执行：运行：`python ai_protocol_hub/scripts/git-push.py`提交代码改动到GitHub仓库
5. 【收尾】
  - 执行： `ai_protocol_hub/core_rules/DEVELOPMENT_FLOW.md` 文件中定义的收尾流程
  - 执行收尾流程时，记录每一步的执行结果和修改内容
  - 收尾完成后，提供收尾报告
6. 【更新索引】
  - 执行：查询git变更记录和`UPDATE_LOG.md`文件，如果有核心功能变更，修改项目索引文件`INDEX.md`
7. 【更新日志】
  - 执行：查询git变更记录和`UPDATE_LOG.md`文件，如果有核心功能变更，修改项目日志文件`UPDATE_LOG.md`
8. 【同步AI协议】
  - 执行：请执行`python ai_protocol_hub/scripts/sync_ai_protocol_hub.py`

## 指令执行流程
1. 用户发送指令（格式：`【指令名称 参数1 参数2 ...】`）
2. 执行指令对应的操作，多个指令按顺序执行
3. 记录操作日志到 `UPDATE_LOG.md`
4. 返回执行结果