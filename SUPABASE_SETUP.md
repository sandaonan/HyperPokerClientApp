# Supabase 集成说明

## 已完成的功能

✅ **用户注册**：在 Supabase `member` 表中创建新用户，密码使用 SHA-256 hash
✅ **用户登录**：验证账号密码，从 Supabase 获取用户资料
✅ **用户资料更新**：更新用户敏感资料到 Supabase

## 环境变量配置

在项目根目录创建 `.env.local` 文件（如果还没有）：

```env
VITE_SUPABASE_URL=https://nxzdhptspqwuzhgfsxmu.supabase.co
VITE_SUPABASE_KEY=sb_publishable_O_LihLc-dnnJTmdSEoZNrQ_RJEf6ay7
```

**注意**：如果未设置环境变量，代码会使用默认值（硬编码在 `lib/supabaseClient.ts` 中）。

## 文件结构

### 新增的文件

1. **`lib/supabaseClient.ts`**
   - Supabase 客户端配置
   - 修正了同事提供的代码中的变量名错误

2. **`lib/passwordUtils.ts`**
   - 密码 hash 工具函数
   - 使用 Web Crypto API 的 SHA-256

3. **`services/supabaseAuth.ts`**
   - Supabase 认证服务
   - `registerUser()`: 注册新用户
   - `loginUser()`: 用户登录
   - `getUserById()`: 根据 ID 获取用户
   - `updateUserProfile()`: 更新用户资料

### 修改的文件

1. **`services/mockApi.ts`**
   - `login()`: 优先使用 Supabase，失败时回退到 mock
   - `register()`: 优先使用 Supabase，失败时回退到 mock
   - `updateUserSensitiveData()`: 优先使用 Supabase，失败时回退到 mock

## 数据库 Schema 映射

### User 类型 → member 表

| User 字段 | member 字段 | 说明 |
|-----------|-------------|------|
| `id` | `id` | 数字 ID（转换为字符串） |
| `username` | `account` | 登录账号 |
| `password` | `password_hash` | 密码 hash |
| `name` | `full_name` | 真实姓名 |
| `nationalId` | `id_number` | 身份证字号 |
| `mobile` | `mobile_phone` | 手机号码 |
| `birthday` | `date_of_birth` | 生日 |
| `kycUploaded` | `id_url` | KYC 证件上传状态 |

## 使用流程

### 1. 用户注册

```typescript
// 在 LoginView.tsx 中调用
const user = await mockApi.register(username, password, mobile);
```

**流程**：
1. 检查账号是否已存在
2. Hash 密码
3. 在 Supabase `member` 表中创建新记录
4. 自动加入第一个俱乐部（状态为 `pending`）

### 2. 用户登录

```typescript
// 在 LoginView.tsx 中调用
const user = await mockApi.login(username, password);
```

**流程**：
1. 从 Supabase 查询 `member` 表
2. 验证密码 hash
3. 返回用户资料

### 3. 更新用户资料

```typescript
// 在 ProfileView.tsx 中调用
const updatedUser = await mockApi.updateUserSensitiveData(user);
```

**流程**：
1. 更新 Supabase `member` 表中的用户资料
2. 将所有钱包状态重置为 `pending`（需要重新验证）

## 回退机制

如果 Supabase 不可用或配置错误，系统会自动回退到原有的 mock API（使用 localStorage）。这确保了：
- 开发环境可以正常测试
- 生产环境可以逐步迁移
- 不会因为 Supabase 问题导致应用崩溃

## 注意事项

1. **密码安全**：当前使用 SHA-256 + salt，在生产环境中建议使用更安全的算法（如 bcrypt 或 Argon2）

2. **环境变量**：确保 `.env.local` 文件不被提交到 Git（已在 `.gitignore` 中）

3. **错误处理**：所有 Supabase 操作都有错误处理，失败时会回退到 mock API

4. **类型安全**：使用 TypeScript 类型定义确保类型安全

## 测试

1. **注册新用户**：
   - 打开应用
   - 点击"註冊帳號"
   - 输入账号和密码
   - 检查 Supabase `member` 表是否有新记录

2. **登录**：
   - 使用注册的账号密码登录
   - 检查是否能正确获取用户资料

3. **更新资料**：
   - 登录后进入个人档案
   - 填写并保存身份资料
   - 检查 Supabase `member` 表是否更新

## 后续改进建议

1. 添加密码强度验证
2. 实现密码重置功能
3. 添加邮箱验证
4. 实现更安全的密码 hash 算法
5. 添加用户会话管理（JWT token）
6. 实现用户头像上传到 Supabase Storage

