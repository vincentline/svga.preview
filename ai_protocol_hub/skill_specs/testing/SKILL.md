---
name: "testing"
description: "MANDATORY: Before ANY testing operation, MUST read TESTING_RULES.md first. Invoke when user asks to test, run tests, write tests, debug tests, or verify functionality."
---

# Testing Skill

**CRITICAL: This skill MUST be invoked BEFORE any testing operation.**

## 必须执行的操作

1. ✅ **查阅测试规范**：`ai_protocol_hub/core_rules/TESTING_RULES.md`

## 工具使用前检查

**在执行测试操作前，必须先查阅测试规范**：
- 使用 Playwright 工具前
- 使用 RunCommand 执行测试命令前
- 任何涉及测试的操作前

## 触发条件

- 用户要求执行测试
- 用户要求运行测试
- 用户要求编写测试
- 用户要求调试测试
- 用户要求验证功能

## 执行流程

```
用户请求测试相关操作
    ↓
[触发 testing Skill]
    ↓
查阅 TESTING_RULES.md
    ↓
执行测试
```

## 示例

```
用户: "测试这个功能"
用户: "运行测试套件"
用户: "编写单元测试"
用户: "验证这个功能是否正常"

AI 行为:
1. 查阅 TESTING_RULES.md
2. 执行测试
```

## 重要提醒

⚠️ **工具使用前检查**：
- 在执行测试操作前，必须确认已查阅 TESTING_RULES.md
- 如果未查阅，应先查阅再执行测试
