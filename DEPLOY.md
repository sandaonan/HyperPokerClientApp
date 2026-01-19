# 部署指南 (Deployment Guide)

本指南将帮助你将 HyperPoker 部署到线上，让手机可以访问。

## 🚀 推荐部署平台

### 方案一：Vercel（推荐，最简单）

**优点：**
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 自动部署（连接 GitHub）
- ✅ 手机访问友好
- ✅ 支持环境变量配置

**部署步骤：**

1. **准备代码仓库**
   ```bash
   # 如果还没有 Git 仓库，先初始化
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **推送到 GitHub**
   - 在 GitHub 创建新仓库
   - 将代码推送到 GitHub：
     ```bash
     git remote add origin <你的GitHub仓库URL>
     git branch -M main
     git push -u origin main
     ```

3. **在 Vercel 部署**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录
   - 点击 "Add New Project"
   - 导入你的 GitHub 仓库
   - 配置环境变量：
   - 点击 "Deploy"（无需设置环境变量）
   - 等待部署完成（通常 1-2 分钟）

4. **完成！**
   - Vercel 会给你一个网址，例如：`https://hyperpoker.vercel.app`
   - 这个网址可以在手机上直接访问

---

### 方案二：Netlify

**部署步骤：**

1. **准备代码仓库**（同上）

2. **在 Netlify 部署**
   - 访问 [netlify.com](https://netlify.com)
   - 使用 GitHub 账号登录
   - 点击 "Add new site" → "Import an existing project"
   - 选择你的 GitHub 仓库
   - 配置：
     - Build command: `npm run build`
     - Publish directory: `dist`
   - 点击 "Deploy site"（无需设置环境变量）

---

### 方案三：GitHub Pages（免费但需要额外配置）

如果需要使用 GitHub Pages，需要：
1. 修改 `vite.config.ts` 添加 `base` 路径
2. 使用 GitHub Actions 自动部署

---

## 📱 手机访问优化

项目已经配置了响应式设计：
- ✅ `viewport` meta 标签已设置
- ✅ Tailwind CSS 响应式类已使用
- ✅ 移动端友好的 UI 设计

部署后，在手机浏览器直接访问部署网址即可。

---

## 🔐 环境变量配置

**注意：** 当前版本的应用使用 mock 数据，不需要任何环境变量。如果未来需要添加 API 功能，再设置相应的环境变量即可。

---

## 🛠️ 本地测试构建

部署前，建议先本地测试构建：

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

如果本地预览正常，部署到线上也应该没问题。

---

## 📝 注意事项

1. **域名**：Vercel 和 Netlify 都提供免费的自定义域名
2. **自动部署**：连接 GitHub 后，每次 push 代码会自动重新部署
3. **Mock 数据**：当前应用使用模拟数据，如需连接真实 API，需要修改代码并设置相应的环境变量

---

## 🆘 遇到问题？

- **构建失败**：检查 `npm run build` 是否在本地成功
- **页面空白**：检查浏览器控制台的错误信息
- **部署后无法访问**：确保构建成功，检查部署日志

