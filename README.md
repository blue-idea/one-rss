# OneRss（移动端）

OneRss 是一个基于 Expo + React Native 构建的 RSS 阅读应用，目标是提供「订阅发现 -> 聚合阅读 -> 收藏管理 -> 深度阅读 -> 会员能力」的一体化体验。

当前仓库处于 **架构与规范先行** 阶段：已完成核心需求、技术方案与任务拆解文档，并初始化了移动端工程骨架与提交前质量校验。

## 项目目标

- 支持邮箱/第三方登录与统一会话管理
- 提供发现页搜索与 RSS URL 导入订阅
- 提供今日聚合流、书架管理与阅读体验
- 支持会员能力（更高订阅上限、朗读、翻译）
- 提供离线缓存阅读、性能与可访问性保障

## 技术栈

- 客户端：Expo 54、React Native 0.81、React 19、Expo Router
- 语言：TypeScript
- 代码质量：ESLint、Prettier、Husky、lint-staged
- 后端规划：Supabase（Auth / Postgres / RLS / Storage / Edge Functions）

## 当前进度

- [x] 提交前质量门禁（Husky + lint-staged）
- [ ] CI/CD（GitHub Actions + 安全扫描）
- [ ] 认证、订阅、今日流、阅读、会员、离线等业务能力（按里程碑推进）

详细任务请查看：`docs/spec/tasks.md`

## 快速开始

### 1) 安装依赖

```bash
pnpm install
```

### 2) 启动开发

```bash
pnpm start
```

也可以按平台启动：

```bash
pnpm android
pnpm ios
pnpm web
```

## 常用脚本

- `pnpm start`：启动 Expo 开发服务
- `pnpm android`：在 Android 设备/模拟器启动
- `pnpm ios`：在 iOS 模拟器启动
- `pnpm web`：在 Web 端启动
- `pnpm lint`：执行 ESLint（不允许 warning）
- `pnpm typecheck`：执行 TypeScript 类型检查
- `pnpm format`：格式化代码
- `pnpm format:check`：检查格式是否符合规范
- `pnpm reset-project`：重置示例工程结构

## 工程规范

- 提交时会自动触发 `lint-staged`：
  - `*.{js,jsx,ts,tsx}` -> ESLint 自动修复 + Prettier
  - `*.{json,md,css,scss,yml,yaml}` -> Prettier
- 任何检查失败将阻止提交，确保主分支质量稳定

## 文档导航

- 需求基线：`docs/spec/requirements.md`
- 技术方案：`docs/spec/design.md`
- 数据设计：`docs/spec/data.md`
- 接口设计：`docs/spec/api.md`
- 任务拆解：`docs/spec/tasks.md`
- 发布与验收清单：`docs/spec/checklist.md`
- 待办池：`docs/spec/backlog.md`
- 工程宪法：`docs/spec/constitution.md`

## 建议里程碑

1. M1：认证与导航壳
2. M2：发现订阅与书架
3. M3：今日流与阅读基础
4. M4：会员计费与能力门禁
5. M5：离线与非功能优化

## 目录说明（当前）

```text
app/            # Expo Router 路由与页面
components/     # 通用 UI 组件
constants/      # 主题与常量
hooks/          # 复用 hooks
docs/spec/      # 需求、设计、数据、接口与任务文档
scripts/        # 工程脚本
ui/             # 原型与视觉相关资料
```
