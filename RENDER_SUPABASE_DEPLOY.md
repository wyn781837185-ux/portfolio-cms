# Render + Supabase 免费部署

这是当前最稳的国外免费方案：

- Render：运行 Node 作品集后台
- Supabase：保存作品数据、个人资料和上传图片

这样 Render 免费服务休眠或重启，也不会丢作品数据和图片。

## 1. 创建 Supabase 项目

1. 打开 https://supabase.com/
2. 用 GitHub 登录。
3. New project。
4. 创建完成后，进入 SQL Editor。
5. 复制本项目的 `supabase-schema.sql` 内容并执行。

## 2. 获取 Supabase 环境变量

在 Supabase 项目里打开：

```txt
Project Settings -> API
```

复制：

- Project URL
- service_role key

注意：`service_role key` 是敏感密钥，不要发给别人，不要放到前端代码里。这里只放在 Render 的后台环境变量里。

## 3. 上传项目到 GitHub

把整个项目上传到一个 GitHub 仓库。需要保留：

- `server.js`
- `index.html`
- `admin.html`
- `login.html`
- `project.html`
- `styles.css`
- `*.js`
- `package.json`
- `render.yaml`
- `Dockerfile`
- `supabase-schema.sql`

可以不上传：

- `node_modules/`
- `pdf_pages/`
- 截图文件

## 4. Render 创建 Web Service

1. 打开 https://render.com/
2. 用 GitHub 登录。
3. New -> Web Service。
4. 选择你的 GitHub 仓库。
5. Runtime 选择 Node。
6. Build Command：

```bash
npm install --omit=dev
```

7. Start Command：

```bash
node server.js
```

8. Instance Type 选择 Free。

## 5. Render 环境变量

在 Render 的 Environment Variables 里添加：

```txt
NODE_ENV=production
ADMIN_TOKEN=你的后台密码
SUPABASE_URL=你的 Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
SUPABASE_BUCKET=portfolio
```

## 6. 访问

部署完成后，Render 会给你一个地址：

```txt
https://你的项目.onrender.com
```

后台登录页：

```txt
https://你的项目.onrender.com/login.html
```

## 说明

Render 免费服务可能会休眠，第一次打开会慢一些，这是免费版正常现象。

作品数据和图片已经放在 Supabase，不会因为 Render 休眠而丢。
