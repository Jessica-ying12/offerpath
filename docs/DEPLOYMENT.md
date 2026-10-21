# 公网部署

## 结论

职跃是 Next.js 服务端渲染 + SQLite 的单实例应用，**不能只上传静态文件**，需要一个能长期运行 Node 进程、并挂载持久磁盘的公网主机。

| 平台 | 是否适用 | 原因 |
| --- | --- | --- |
| Qoder Sites | 否 | 只支持静态文件 + 单个 Function，无法承载 Next.js SSR、Better SQLite 原生模块和完整 API |
| Vercel / Netlify | 否（当前架构） | Serverless 文件系统不持久，SQLite 数据会丢失；需要改造成托管数据库 + 多实例架构 |
| GitHub Pages | 否 | 只能托管静态页面，没有 Node 运行时和数据库 |
| 云服务器 / 支持持久卷的容器平台 | 是 | 单实例 Node + 持久磁盘正是当前架构需要的运行环境 |

公网访问本身需要一个可被外网访问的主机。仓库里的 `Dockerfile` 和 `docker-compose.yml` 就是为此准备的；没有主机或平台账号时，只能用临时隧道做预览，隧道地址会随进程结束而失效。

## 方式一：Docker（推荐，持久）

要求：一台有公网 IP 的 Linux 主机，安装 Docker 与 Compose 插件。

```bash
git clone https://github.com/Jessica-ying12/offerpath.git
cd offerpath
docker compose up -d --build
```

- 应用监听 `3000` 端口，SQLite 数据存放在命名卷 `offerpath-data`，重建容器不会丢数据。
- 首次打开注册自己的账号；本地开发用的演示账号不会自动写入生产库。
- 若需要演示账号，可在宿主机执行 `npm ci && npm run seed` 前先设置同一个 `DATABASE_PATH`，或直接在页面注册。

检查：

```bash
docker compose ps
docker compose logs -f app
curl -I http://127.0.0.1:3000
```

### 必须遵守的边界

1. **只运行一个应用副本。** SQLite 是单写者，水平扩容会争抢同一个数据库文件。要扩容必须先换 PostgreSQL/MySQL。
2. **必须挂载 `/app/data`。** 这是唯一持久化目录；不挂载时容器删除即丢数据。
3. **在应用前放 HTTPS 反向代理。** 会话 Cookie 带 `HttpOnly` 与 `SameSite=Lax`，公网必须用 HTTPS。Caddy 示例：

```caddyfile
offer.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

Nginx 同理，把 `proxy_pass http://127.0.0.1:3000;` 放进 443 server 块，并转发 `Host`、`X-Forwarded-For`。

4. **备份数据库文件。** SQLite 在 WAL 模式运行，备份时使用在线备份而不是直接复制正在写入的 `.db`：

```bash
docker compose exec app node -e "const D=require('better-sqlite3');const db=new D('/app/data/offerpath.db');db.backup('/app/data/backup.db').then(()=>process.exit(0))"
docker compose cp app:/app/data/backup.db ./offerpath-backup.db
```

5. **不要提交数据库、`.env`、备份文件。** 仓库已忽略 `data/*.db` 与 `.env*`。

## 方式二：临时公网预览（非持久）

在本地开发机运行应用后，可通过 SSH 反向隧道把 3000 端口暴露到公网：

```bash
ssh -o StrictHostKeyChecking=accept-new -R 80:localhost:3000 nokey@localhost.run
```

终端会打印一个 `https://*.lhr.life` 地址。它的限制：

- 进程退出、网络断开或休眠后地址立即失效；
- 带宽与稳定性不适合正式使用；
- 只适合给他人快速验收，不等于正式部署。

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DATABASE_PATH` | `data/offerpath.db` | SQLite 文件路径；容器内固定为 `/app/data/offerpath.db` |
| `PORT` | `3000` | Next.js 监听端口 |
| `HOSTNAME` | `0.0.0.0`（容器） | 容器内必须监听所有网卡 |

应用启动时自动执行幂等建表，不需要额外迁移命令。

## 上线检查清单

- [ ] `docker compose up -d --build` 成功，`/` 返回 200。
- [ ] 注册、登录、退出正常，刷新后会话保持。
- [ ] 课程、题库（210 题）、模拟笔试、周期复习、学习报告可打开。
- [ ] 数据卷挂载成功，重启容器后账号与记录仍在。
- [ ] HTTPS 生效，HTTP 自动跳转 HTTPS。
- [ ] 已配置数据库备份，并实际恢复验证一次。
- [ ] 只运行一个副本。
