# 腾讯 CloudBase 免费/体验部署说明

这个项目已经准备了腾讯 CloudBase 部署配置。

## 适合先试用的方案

使用腾讯云 CloudBase 个人版/新用户体验，把项目先部署成 Node Web 服务。

注意：当前版本仍然使用 `data/*.json` 和 `uploads/` 作为本地文件存储。它适合先上线预览和测试后台流程；如果要长期稳定使用，建议后续升级为 CloudBase 数据库 + 云存储版本。

## 1. 开通 CloudBase

1. 登录腾讯云。
2. 打开 CloudBase 云开发。
3. 开通个人版或新用户 0 元体验。
4. 创建一个 Web 应用/云开发环境。
5. 复制环境 ID，格式类似 `xxx-123456`。

## 2. 修改配置

打开 `cloudbaserc.json`，替换：

- `envId`：改成你的 CloudBase 环境 ID
- `ADMIN_TOKEN`：改成你的后台密钥

例如：

```json
{
  "envId": "portfolio-xxxxxx",
  "framework": {
    "plugins": {
      "node": {
        "inputs": {
          "functionOptions": {
            "envVariables": {
              "ADMIN_TOKEN": "my-secret-key"
            }
          }
        }
      }
    }
  }
}
```

## 3. 安装 CloudBase CLI

```bash
npm i -g @cloudbase/cli --registry=http://mirrors.cloud.tencent.com/npm/
```

## 4. 登录腾讯云

```bash
tcb login
```

## 5. 部署

在项目目录运行：

```bash
tcb framework deploy
```

如果你的 CLI 使用 `cloudbase` 命令，也可以尝试：

```bash
cloudbase framework deploy
```

部署完成后，终端会显示线上访问地址。

## 重要建议

如果你只是先让朋友访问、测试后台：这个版本可以先用。

如果你准备长期使用：下一步建议把数据迁到 CloudBase 数据库，把图片迁到 CloudBase 云存储。这样重启、重新部署后，作品和图片不会丢。
