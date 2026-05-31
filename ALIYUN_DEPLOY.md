# 阿里云轻量应用服务器部署说明

这个项目推荐部署到阿里云轻量应用服务器或 ECS。对当前代码改动最少，后台上传的图片和 JSON 数据可以直接保存在服务器硬盘里。

## 推荐方案

选择阿里云轻量应用服务器：

- 系统镜像：Ubuntu 22.04 或 Debian 12
- 地域：中国内地离你用户近的区域，比如杭州、上海、北京、深圳
- 带宽：个人作品集 3M 到 5M 起步即可
- 防火墙/安全组：开放 80、443、5174

如果只是先免费试用，去阿里云免费试用中心领取轻量应用服务器或 ECS。

## 1. 上传项目

在服务器创建目录：

```bash
mkdir -p /www/portfolio-cms
```

把当前项目文件上传到：

```txt
/www/portfolio-cms
```

必须保留：

- `data/`
- `uploads/`
- `server.js`
- `index.html`
- `admin.html`
- `login.html`
- `project.html`
- `styles.css`
- `*.js`
- `package.json`
- `ecosystem.config.cjs`

## 2. 安装 Node.js 和 PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm i -g pm2
```

## 3. 设置后台密钥

编辑 `ecosystem.config.cjs`：

```js
ADMIN_TOKEN: "change-this-admin-token"
```

把它改成你自己的后台密码。

## 4. 启动网站

```bash
cd /www/portfolio-cms
npm install --omit=dev
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

先用服务器公网 IP 测试：

```txt
http://你的服务器公网IP:5174
```

后台：

```txt
http://你的服务器公网IP:5174/login.html
```

## 5. 配置 Nginx 绑定域名

安装 Nginx：

```bash
sudo apt-get install -y nginx
```

复制配置：

```bash
sudo cp /www/portfolio-cms/nginx-portfolio.conf.example /etc/nginx/conf.d/portfolio.conf
```

编辑：

```bash
sudo nano /etc/nginx/conf.d/portfolio.conf
```

把：

```txt
your-domain.com
```

改成你的域名。如果暂时没有域名，也可以先用公网 IP 访问，不配 Nginx 域名。

检查并重启：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

之后访问：

```txt
http://你的域名
```

## 6. HTTPS

如果域名已经备案并解析到服务器，可以安装证书工具：

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx
```

## 7. 数据备份

你的作品数据在：

```txt
data/projects.json
data/profile.json
uploads/
```

建议定期备份这两个目录：

```bash
tar -czf portfolio-backup.tar.gz data uploads
```

## 注意

如果服务器在中国大陆，绑定域名公开访问通常需要 ICP 备案。没有备案时，可以先用公网 IP 测试，或选择中国香港地域。
