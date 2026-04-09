# 接口设计（OneRss）

## 1. 目标与范围

本文档定义 OneRss 的接口契约与调用规范，覆盖认证、订阅、内容流、阅读、会员、偏好设置等能力。  
本文档与 `docs/spec/requirements.md`、`docs/spec/design.md`、`docs/spec/data.md` 保持一致。

## 2. 接口风格约定

- 协议：HTTPS + JSON
- 基础路径：`/api/v1`
- 认证方式：`Authorization: Bearer <supabase_access_token>`
- 时间格式：ISO 8601（UTC）
- ID 格式：UUID
- 语言：错误码固定英文，消息文本英文

## 3. 鉴权与权限模型

### 3.1 会话要求

- 除认证回调与健康检查外，所有业务接口必须要求登录态。
- 未登录访问统一返回 `401 UNAUTHORIZED`。

### 3.2 会员权限

- `free` 用户：
  - 最多订阅 10 个源
  - 不允许调用翻译与朗读能力接口
- `premium` 用户：
  - 解锁翻译与朗读能力
  - 不受 10 个订阅上限限制

### 3.3 数据隔离

- 用户私有资源（订阅、收藏、阅读进度、偏好）仅可访问本人数据。
- 目录与文章为公共可读（登录用户），写操作仅平台服务端。

## 4. 统一响应结构

## 4.1 成功响应

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-07T12:00:00Z"
  }
}
```

## 4.2 失败响应

```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_LIMIT_REACHED",
    "message": "Free plan can subscribe up to 10 feeds.",
    "details": {}
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-07T12:00:00Z"
  }
}
```

## 5. 错误码规范

### 5.1 通用错误码

- `UNAUTHORIZED`（401）
- `FORBIDDEN`（403）
- `NOT_FOUND`（404）
- `VALIDATION_FAILED`（422）
- `CONFLICT`（409）
- `RATE_LIMITED`（429）
- `INTERNAL_ERROR`（500）

### 5.2 业务错误码

- `SUBSCRIPTION_LIMIT_REACHED`
- `PREMIUM_REQUIRED`
- `THIRD_PARTY_AUTH_FAILED`
- `ACCOUNT_LINK_CONFLICT`
- `INVALID_CREDENTIALS`
- `FEED_URL_INVALID`
- `FEED_URL_UNREACHABLE`
- `PAYMENT_NOT_COMPLETED`
- `MEMBERSHIP_EXPIRED`

## 6. 分页、排序与筛选规范

### 6.1 分页参数

- `page`（默认 1）
- `pageSize`（默认 20，最大 100）

### 6.2 排序参数

- `sortBy`（如 `publishedAt`）
- `sortOrder`（`asc` / `desc`）

### 6.3 分页响应

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 230,
    "hasNext": true,
    "requestId": "uuid",
    "timestamp": "2026-04-07T12:00:00Z"
  }
}
```

## 7. 幂等与并发控制

- 对“创建类”接口支持幂等键：`Idempotency-Key`。
- 收藏/取消收藏、订阅/取消订阅接口要求幂等语义（重复请求结果一致）。
- 支付回调接口必须幂等处理，避免重复记账或重复升级会员。

## 8. 接口清单（按模块）

> 说明：以下为契约级定义，不绑定具体实现框架；路径可由 Edge Functions 或 API 网关承接。

### 8.1 Auth（认证与账户）

#### `POST /api/v1/auth/email/send-code`

- 用途：向指定邮箱发送 **6 位数字**注册验证码，并触发服务端节流（单邮箱最小间隔与小时额度）。
- 权限：匿名可用（客户端需配置可调用该端点的网关地址，如 Supabase Edge Function URL）。
- Request：

```json
{
  "email": "user@example.com"
}
```

- Response `200`：

```json
{
  "success": true,
  "data": {
    "cooldownSeconds": 60
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-09T12:00:00Z"
  }
}
```

- 失败示例 `422 VALIDATION_FAILED`：邮箱格式非法。
- 失败示例 `429 RATE_LIMITED`：请求过频；`error.details.cooldownSeconds` 可为剩余冷却秒数（可选）。
- 失败示例 `502 INTERNAL_ERROR` 或 `500 INTERNAL_ERROR`：SMTP/持久化异常，消息为英文通用描述。

> 实现映射：当前仓库对应 Edge Function `send-email-code`（路径以部署为准，例如 `/functions/v1/send-email-code`），契约字段与上文一致。

- `POST /auth/email/verify`
  - 用途：校验注册验证码并换取注册凭证
  - 权限：匿名可用
- `POST /auth/register`
  - 用途：基于已校验验证码完成邮箱密码注册并建立会话
  - 权限：匿名可用
- `POST /auth/password/sign-in`
  - 用途：使用邮箱与密码登录
  - 权限：匿名可用
- `POST /auth/oauth/sign-in`
  - 用途：第三方登录（Apple/Google/WeChat）
  - 权限：匿名可用
- `POST /auth/account/link`
  - 用途：处理账号合并与绑定
  - 权限：已登录
- `POST /auth/logout`
  - 用途：退出登录
  - 权限：已登录

### 8.2 Membership（会员与计费）

- `GET /membership/plans`
  - 用途：获取月付/年付套餐
  - 权限：已登录
- `POST /membership/checkout`
  - 用途：创建支付会话
  - 权限：已登录
- `POST /membership/webhook`
  - 用途：支付回调（服务端）
  - 权限：服务端签名校验
- `GET /membership/status`
  - 用途：获取会员状态与有效期
  - 权限：已登录

### 8.3 Discovery & Subscription（发现与订阅）

- `GET /feed-categories`
  - 用途：获取订阅源分类列表（用于发现页与书架筛选）
  - 权限：已登录
- `GET /feeds`
  - 用途：获取公开目录（支持分类、关键词、分页，`is_featured=true` 源优先）
  - 权限：已登录
- `POST /feeds/import`
  - 用途：按 RSS URL 校验并导入源
  - 权限：已登录
- `GET /subscriptions`
  - 用途：获取我的订阅列表
  - 权限：已登录
- `POST /subscriptions`
  - 用途：新增订阅（受 free 用户上限约束）
  - 权限：已登录
- `DELETE /subscriptions/{feedId}`
  - 用途：取消订阅
  - 权限：已登录

### 8.4 Feed & Library（今日流与书架）

- `GET /today/articles`
  - 用途：今日聚合流（时间范围、按 `is_featured desc, published_at desc` 排序）
  - 权限：已登录
- `GET /curated/articles`
  - 用途：精选栏目文章流（优先展示 `is_featured=true` 源内容，同优先级按发布时间倒序）
  - 权限：已登录
- `GET /library/feeds`
  - 用途：书架源列表（含未读数、最近更新时间）
  - 权限：已登录
- `GET /feeds/{feedId}/articles`
  - 用途：源文章列表
  - 权限：已登录

### 8.5 Reader（阅读、收藏、进度、增值能力）

- `GET /articles/{articleId}`
  - 用途：获取文章详情（触发正文+图片缓存）
  - 权限：已登录
- `POST /bookmarks`
  - 用途：收藏文章（幂等）
  - 权限：已登录
- `DELETE /bookmarks/{articleId}`
  - 用途：取消收藏（幂等）
  - 权限：已登录
- `PUT /reading-progress/{articleId}`
  - 用途：更新阅读进度
  - 权限：已登录
- `POST /reader/translate`
  - 用途：生成翻译内容
  - 权限：`premium`
- `POST /reader/read-aloud`
  - 用途：触发朗读能力
  - 权限：`premium`

### 8.6 Profile & Preferences（个人中心与偏好）

- `GET /profile`
  - 用途：获取个人资料与统计
  - 权限：已登录
- `PATCH /profile`
  - 用途：更新个人资料
  - 权限：已登录
- `GET /preferences`
  - 用途：获取偏好配置
  - 权限：已登录
- `PUT /preferences`
  - 用途：更新偏好配置（主题、字体、翻译语言等）
  - 权限：已登录

## 9. 关键业务接口规则

### 9.1 普通用户订阅上限

- `POST /subscriptions` 对 `free` 用户进行上限校验。
- 达到上限返回：
  - 状态码：`403`
  - 错误码：`SUBSCRIPTION_LIMIT_REACHED`

### 9.2 高级能力门禁

- `POST /reader/translate`、`POST /reader/read-aloud` 对 `premium` 校验。
- 非高级用户返回：
  - 状态码：`403`
  - 错误码：`PREMIUM_REQUIRED`

### 9.3 离线写操作阻断

- 客户端离线时不应发起写请求。
- 若写请求在异常场景下仍到达服务端，按真实失败原因返回通用错误语义（如 `CONFLICT` / `FORBIDDEN` / `VALIDATION_FAILED`）。

### 9.4 账号合并策略

- 第三方登录邮箱与现有账号一致：自动合并。
- 第三方缺失邮箱：要求补充并验证邮箱后继续。
- 冲突异常：返回 `ACCOUNT_LINK_CONFLICT` 并引导邮箱登录后绑定。

### 9.5 精品栏目优先展示规则

- 内容流排序以订阅源优先级为第一排序键：
  - 第一排序键：`feeds.is_featured desc`
  - 第二排序键：`articles.published_at desc`
- 适用接口：`GET /feeds`、`GET /today/articles`、`GET /curated/articles`、`GET /library/feeds`

## 10. 安全要求

- 所有写接口必须校验 JWT、用户身份与资源归属。
- 支付回调必须校验签名、时间窗与幂等键。
- 敏感字段不回传（令牌、内部凭据、风控字段）。
- 统一审计关键动作：登录、会员升级、订阅变更、偏好变更。

## 11. 测试与验收映射

- 需求 1：认证成功/失败、账号合并、未登录拦截。
- 需求 2：订阅增删、URL 校验失败、上限拦截。
- 需求 3：`is_featured` 优先 + 发布时间倒序一致性。
- 需求 5：翻译/朗读会员门禁、阅读进度更新。
- 需求 9：离线读可用、离线写阻断错误语义一致。

## 12. 版本策略

- 接口以 `/api/v1` 版本化，破坏性变更必须升主版本。
- 新增字段遵循向后兼容，不移除已发布字段。
- 废弃接口需至少经历一个小版本过渡并发布迁移说明。
