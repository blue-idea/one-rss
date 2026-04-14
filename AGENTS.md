## 工程化规范

在编写代码时，请务必遵循以下原则：

1. **严禁重复**: 任何重复的代码逻辑都必须被抽象成可复用的单元（函数、类等）。
2. **检查现有代码**：先分析项目中是否已有类似实现
3. **模块化设计**：将功能拆分为独立、可复用的模块
4. **统一接口**：使用一致的参数格式和返回值结构
5. **配置集中管理**：将常量和配置项统一管理
6. **优先封装**: 将相关功能和数据封装在独立的、职责明确的模块中。

## 核心技术栈

- 客户端框架：`Expo`（React Native）
- 后端能力：`Supabase`（Auth / Postgres / RLS / Storage / Edge Functions）
- 样式系统：`NativeWind`（Tailwind 风格原子类）
- 语言：`TypeScript`
-

## 编码安全

### 1.Row-Level Security 行级安全（让数据库保护你的用户）

```
Implement Row-Level Security in my Supabase database.
Tables: [list them]. Each row only accessible to the user who created it.
Generate SQL policies to enable RLS on all tables.
Restrict access based on auth.uid().
Include policies for SELECT, INSERT, UPDATE, DELETE.
```

### 2. Rate Limiting

```
Add rate limiting to all my API routes. Limit each IP address to
100 requests per hour. Apply globally to all API routes.
Return a clear error message when the limit is exceeded. Show me
where to add this and how it will work.
```

### 3. 将 API 密钥排除在你的代码之外

```
Move all my API keys to environment variables. Find every place
in my code using API keys directly (Stripe, AWS, database URLs,
third-party services). Show me: 1) how to create a .env.local file,
2) how to update code to use process.env, 3) what to add to .gitignore,
3) how to set these in Vercel/my hosting platform.
```

## 编写规范

任务完成后，必须进行lint，type-check，测试.
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:e2e
