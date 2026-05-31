# Portfolio CMS

一个轻量的个人作品集系统，包含公开作品展示页和后台管理页。

## 本地运行

```bash
npm start
```

打开：

- 作品集：http://127.0.0.1:5174
- 登录页：http://127.0.0.1:5174/login.html
- 后台：http://127.0.0.1:5174/admin.html

默认后台密钥：

```txt
portfolio-admin
```

## 部署到服务器

1. 把整个文件夹上传到服务器。
2. 确认服务器已安装 Node.js。
3. 设置后台密钥并启动：

```bash
ADMIN_TOKEN=你的后台密钥 PORT=5174 npm start
```

Windows 服务器可以用：

```powershell
$env:ADMIN_TOKEN="你的后台密钥"
$env:PORT="5174"
npm start
```

## 数据位置

- 作品数据：`data/projects.json`
- 个人资料：`data/profile.json`
- 上传图片：`uploads/`

部署时请保留 `data/` 和 `uploads/`。后台新增、编辑、删除作品、修改资料和拖拽排序时，会自动更新这些文件。

## 腾讯 CloudBase 部署

已添加腾讯 CloudBase 配置：

- `cloudbaserc.json`
- `.cloudbaseignore`
- `TENCENT_DEPLOY.md`

先看 `TENCENT_DEPLOY.md`，把 CloudBase 环境 ID 和后台密钥填进去，再运行：

```bash
tcb framework deploy
```

## 后台功能

- 登录页
- 自我介绍修改
- 头像 / 主视觉上传
- 作品新增、编辑、删除
- 作品封面上传
- 作品详情页
- 富文本详情编辑
- 拖拽排序
