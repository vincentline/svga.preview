---
name: "task-preparation"
description: "MANDATORY: When AI needs to understand project structure or locate files, MUST read README.md and INDEX.md first. Invoke when starting new tasks, exploring project, or when AI determines it needs project context to complete the task."
---

# Task Preparation Skill

**CRITICAL: This skill MUST be invoked when AI needs project context.**

## 必须执行的操作

1. ✅ **了解项目结构**：`README.md`
2. ✅ **定位相关文件**：`INDEX.md`

## 触发条件

**用户明确触发**：
- 用户发送全新的任务请求
- 用户询问项目相关问题

**AI 内部决策触发**：
- AI 需要了解项目结构才能完成任务
- AI 需要定位文件/功能才能完成任务
- AI 需要项目上下文才能做出决策

## 执行流程

```
用户请求任务
    ↓
AI 分析任务需求
    ↓
AI 判断是否需要项目上下文？
    ↓ YES
[触发 task-preparation Skill]
    ↓
查阅 README.md
    ↓
查阅 INDEX.md
    ↓
继续执行任务
```

## 示例

### 用户明确触发
```
用户: "帮我添加一个新功能"
用户: "这个项目是做什么的？"

AI 行为:
1. 查阅 README.md
2. 查阅 INDEX.md
3. 继续执行任务
```

### AI 内部决策触发
```
用户: "修改用户认证的代码"

AI 分析:
- 需要找到用户认证相关的代码
- 不确定文件位置

AI 行为:
1. [触发 task-preparation Skill]
2. 查阅 INDEX.md 定位文件
3. 修改代码
```

## 与其他 Skill 的配合

此 Skill 专注于项目结构和文件定位，其他操作由专用 Skill 处理：

- **代码生成** → `code-generation` Skill
- **文件操作** → `file-operations` Skill
- **测试** → `testing` Skill

## 重要提醒

⚠️ **AI 自主判断触发**：
- AI 应该在需要项目上下文时主动触发此 Skill
- 不需要等待用户明确要求
- 如果 AI 不确定文件位置或项目结构，应该先触发此 Skill
