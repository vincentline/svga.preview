---
name: "code-generation"
description: "MANDATORY: Before using Write or SearchReplace tools for code files, MUST read CODE_STYLE.md first. Invoke when ANY task involves code creation, modification, or file operations that may affect code."
---

# Code Generation Skill

**CRITICAL: This skill MUST be invoked BEFORE any code generation or modification.**

## 必须执行的操作

1. ✅ **查阅代码规范**：`ai_protocol_hub/core_rules/CODE_STYLE.md`
2. ✅ **定位相关文件**：`INDEX.md`（如需）

## 工具使用前检查

**在使用以下工具前，必须先查阅代码规范**：
- `Write` 工具（创建新文件）
- `SearchReplace` 工具（修改现有代码）
- 任何涉及代码生成的工具

## 触发条件

**明确触发**：
- 用户明确要求创建/修改代码

**潜在触发**（AI 可能需要对代码操作）：
- 用户要求添加功能
- 用户要求实现功能
- 用户要求修复问题
- 用户要求优化性能
- 用户要求重构
- 用户要求解决 bug

## 执行流程

```
用户请求任务
    ↓
AI 分析任务是否涉及代码操作
    ↓ YES
[触发 code-generation Skill]
    ↓
查阅 CODE_STYLE.md
    ↓
[可选] 查阅 INDEX.md
    ↓
使用工具（Write/SearchReplace）
    ↓
生成/修改代码
```

## 示例

### 明确触发
```
用户: "创建一个新的工具函数"
用户: "修改这个函数的实现"
```

### 潜在触发
```
用户: "添加一个登录功能"
用户: "实现用户认证"
用户: "修复这个bug"
用户: "优化性能"
```

## 重要提醒

⚠️ **此 Skill 依赖 AI 的判断**：
- AI 需要分析任务是否涉及代码操作
- 如果 AI 判断需要代码操作，应该触发此 Skill
- 如果 AI 忽略此 Skill，可能导致代码不符合规范

⚠️ **工具使用前检查**：
- 在使用 Write/SearchReplace 工具前，必须确认已查阅 CODE_STYLE.md
- 如果未查阅，应先查阅再使用工具
