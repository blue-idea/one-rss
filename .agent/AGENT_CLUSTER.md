# Agent Cluster System

基于 OpenClaw + Codex/Claude Code 的双层 Agent 架构。

## 架构

```
OpenClaw (编排层)
    ├── 持有业务上下文
    ├── 分解任务
    ├── 选择合适的 Agent
    └── 监控进度
         │
         ▼
 Codex/Claude Code/Gemini (执行层)
     ├── 读写代码
     ├── 运行测试
     ├── 提交 PR
     └── Code Review
```

## 目录结构

```
.agent/
├── run-agent.sh        # 主启动脚本
├── worktree-manager.sh # Worktree 管理
├── monitor-agents.sh   # 监控脚本 (cron)
├── agent-selector.sh   # Agent 选择器
├── worktrees/          # 并行工作目录
└── logs/               # 日志
```

## 使用方式

### 1. 启动单个 Agent

```bash
cd /Volumes/data/NextCloud/coding/mobile/one-rss

# 基本用法
.agent/run-agent.sh "实现第三方登录功能" gpt-5.4 high

# 指定 Claude Code
.agent/run-agent.sh "实现发现页 UI" claude-sonnet-4 high
```

### 2. 批量启动多个 Agent (并行)

```bash
# Task 7: 第三方登录
.agent/run-agent.sh "接入 Apple/Google/微信登录" gpt-5.4 high &

# Task 8: 发现页
.agent/run-agent.sh "实现发现页目录查询与筛选" gpt-5.4 normal &

# Task 9: RSS 导入
.agent/run-agent.sh "实现 RSS URL 导入与订阅状态切换" gpt-5.4 normal &

wait  # 等待所有完成
```

### 3. 查看状态

```bash
# 查看 worktree 状态
.agent/worktree-manager.sh status

# 查看 tmux sessions
tmux list-sessions

# 监控
.agent/monitor-agents.sh
```

### 4. 管理 Worktrees

```bash
.agent/worktree-manager.sh list          # 列出所有
.agent/worktree-manager.sh prune         # 清理 stale
.agent/worktree-manager.sh cleanup       # 清理已完成
```

## Agent 选择策略

| 任务类型 | 推荐 Agent | 原因 |
|---------|-----------|------|
| 后端/API/复杂 Bug | Codex | 擅长复杂逻辑 |
| 前端/UI/组件 | Claude Code | 速度快 |
| 设计/文档 | Gemini | 有审美 |
| 测试/E2E | Codex | 可靠 |
| 离线/缓存 | Codex | 系统思维 |

## 自动化监控 (Cron)

```bash
# 添加到 crontab
*/10 * * * * /Volumes/data/NextCloud/coding/mobile/one-rss/.agent/monitor-agents.sh
```

## PR 完成标准

- ✅ PR 已创建
- ✅ CI 通过 (lint, typecheck, test)
- ✅ 分支同步到 main
- ✅ AI Reviewer 批准

## 剩余任务清单

- [ ] 7. 接入第三方登录与异常处理
- [ ] 8. 实现发现页目录查询与筛选
- [ ] 9. 实现 RSS URL 导入与订阅状态切换
- [ ] 10. 实现 free 用户订阅上限门禁
- [ ] 11. 实现今日聚合流与时间范围切换
- [ ] 12. 实现精品优先推荐流
- [ ] 13. 打通文章跳转与收藏联动
- [ ] 14. 实现书架列表、分类与未读计数展示
- [ ] 15. 实现阅读页基础渲染与偏好持久化
- [ ] 16. 实现阅读进度与系统分享
- [ ] 17. 实现朗读/翻译会员门禁与执行链路
- [ ] 18. 实现个人中心与偏好设置页面
- [ ] 19. 实现通知设置入口占位
- [ ] 20. 实现会员购买与状态同步
- [ ] 21. 实现底部导航与返回态保持
- [ ] 22. 实现离线缓存与离线读
- [ ] 23. 实现离线写阻断与通用失败语义
- [ ] 24. 落地视觉一致性与主题令牌
- [ ] 25. 完成性能指标优化
- [ ] 26. 完成可访问性适配
- [ ] 27. 补齐自动化测试矩阵与发布回归

## 启动所有剩余任务的并行 Agent

根据文章中的实践，同时运行 4-5 个 Agent (取决于 RAM)。

**第一批次 (4个):**
1. Task 7 - 第三方登录
2. Task 8 - 发现页
3. Task 9 - RSS 导入
4. Task 10 - 订阅上限门禁

**第二批次:**
5. Task 11 - 今日聚合流
6. Task 12 - 精品优先流
7. Task 13 - 文章跳转与收藏
8. Task 14 - 书架列表

**第三批次:**
9. Task 15 - 阅读页渲染
10. Task 16 - 阅读进度
11. Task 17 - 朗读/翻译门禁
12. Task 18 - 个人中心

**第四批次:**
13. Task 19 - 通知设置入口
14. Task 20 - 会员购买
15. Task 21 - 底部导航
16. Task 22 - 离线缓存

**第五批次:**
17. Task 23 - 离线写阻断
18. Task 24 - 视觉一致性
19. Task 25 - 性能优化
20. Task 26 - 可访问性

**第六批次:**
21. Task 27 - 测试矩阵
