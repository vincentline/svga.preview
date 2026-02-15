---
name: "file-operations"
description: "MANDATORY: After using Write, DeleteFile, or SearchReplace tools for file operations, MUST update UPDATE_LOG.md with timestamp and change details. Invoke when ANY task involves file creation, deletion, modification, rename, or move."
---

# File Operations Skill

**CRITICAL: This skill MUST be invoked AFTER any file or folder operation.**

## 必须执行的操作

1. ✅ **记录操作**：查阅 `UPDATE_LOG.md` 并记录变更
2. ✅ **代码规范**：`ai_protocol_hub/core_rules/CODE_STYLE.md`（如涉及代码文件）

## 工具使用后记录

**在使用以下工具后，必须记录到 UPDATE_LOG.md**：
- `Write` 工具（创建新文件）
- `DeleteFile` 工具（删除文件）
- `SearchReplace` 工具（修改文件）
- 任何涉及文件操作的工具

## 触发条件

- 用户要求创建文件/文件夹
- 用户要求删除文件/文件夹
- 用户要求修改文件/文件夹
- 用户要求重命名文件/文件夹
- 用户要求移动文件/文件夹

## 执行流程

```
用户请求文件操作
    ↓
[可选] 查阅 CODE_STYLE.md（如涉及代码文件）
    ↓
执行文件操作
    ↓
[触发 file-operations Skill]
    ↓
查阅 UPDATE_LOG.md 并记录
```

## 示例

```
用户: "创建一个新的配置文件"
用户: "删除这个旧文件"
用户: "重命名这个文件夹"
用户: "移动这个文件到新位置"

AI 行为:
1. [可选] 查阅 CODE_STYLE.md
2. 执行文件操作
3. 查阅 UPDATE_LOG.md 并记录
```

## 重要提醒

⚠️ **工具使用后记录**：
- 在使用 Write/DeleteFile/SearchReplace 工具后，必须记录到 UPDATE_LOG.md
- 记录格式：时间戳 【操作类型】 : 路径信息 - 更新简述
- 时间戳必须使用北京时间，格式为 [YYYY-MM-DD HH:MM:SS]
