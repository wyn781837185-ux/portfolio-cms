# 国外免费部署方案

你的项目是 Node 后台作品集，能登录后台、上传图片、保存作品数据。

## 最推荐：Koyeb Free

Koyeb 官方免费实例提供：

- 1 个免费 Web Service
- 512MB RAM
- 0.1 vCPU
- 2GB SSD
- 区域：Frankfurt 或 Washington, D.C.

适合先把作品集挂到公网，让别人访问。

注意：Koyeb 免费实例不能挂载持久 Volume，并且 1 小时无流量会 scale down to zero。作为演示和轻量个人项目可以用；如果你要长期稳定保存后台上传内容，建议后续接 Supabase。

### Koyeb 部署步骤

1. 打开 https://www.koyeb.com/
2. 用 GitHub 登录。
3. 把当前项目上传到 GitHub 仓库。
4. Koyeb 新建 App。
5. 选择 GitHub 仓库。
6. 部署方式选择 Dockerfile 或 Node.js 自动识别。
7. Instance 选择 `free`。
8. 环境变量添加：

```txt
ADMIN_TOKEN=你的后台密码
PORT=8080
```

9. 部署完成后，Koyeb 会给一个公网域名。

后台地址：

```txt
https://你的-koyeb-域名/login.html
```

## 推荐落地：Render Free + Supabase Free

我已经把项目改成支持 Supabase。线上填入 Supabase 环境变量后：

- 个人资料保存到 Supabase 数据库
- 作品保存到 Supabase 数据库
- 上传图片保存到 Supabase Storage

详细步骤看：

```txt
RENDER_SUPABASE_DEPLOY.md
```

## 备选：Render Free 单独部署

Render 免费 Web Service 也能跑这个项目。

Render 官方免费 Web Service 的限制：

- 15 分钟无访问会休眠
- 下次访问会冷启动，可能等 1 分钟左右
- 免费 Web Service 文件系统是 ephemeral，重新部署、重启或休眠后，本地上传文件和 JSON 修改可能丢失

### Render 部署步骤

1. 打开 https://render.com/
2. 用 GitHub 登录。
3. 把当前项目上传到 GitHub 仓库。
4. New → Web Service。
5. 选择仓库。
6. Runtime 选择 Node。
7. Build Command：

```bash
npm install --omit=dev
```

8. Start Command：

```bash
node server.js
```

9. Environment Variables：

```txt
ADMIN_TOKEN=你的后台密码
NODE_ENV=production
```

10. Instance Type 选择 Free。

后台地址：

```txt
https://你的-render-域名/login.html
```

## 长期稳定方案

如果你确认要长期用，建议改成：

- 前台/后台 Node 服务：Koyeb 或 Render 免费
- 作品数据：Supabase Free PostgreSQL
- 图片：Supabase Free Storage

Supabase 免费额度适合个人作品集起步，官方价格页显示免费计划包含 500MB 数据库和 1GB 文件存储。
