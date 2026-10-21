# REQ-015 · 公网可访问与生产运行

- 状态：done
- 依赖：REQ-009 / REQ-014

## 背景

GitHub 仓库公开不等于网站可打开。要“直接在公网打开”，必须把 Next.js 服务运行在有持久磁盘、能写 SQLite 的宿主上。Qoder Sites 的本轮能力是静态文件 + 单个 Function，不能直接承载现有 Next.js SSR + SQLite 全栈应用。

## 目标

1. 提供可重复的生产运行方式：环境变量、数据库路径、构建/启动命令、持久磁盘要求、反向代理与 HTTPS。
2. 提供 Dockerfile / docker-compose，可在任意支持 Node 22 的 VPS 或容器平台部署。
3. 若当前环境可建立临时公网隧道，给出一个可打开的真实预览 URL，并明确标注“临时预览、非长期托管”。
4. 部署后验证注册/登录、页面、内容静态资源、SQLite 持久化与健康检查；不验证不可用的外部 AI。

## 非目标

- 不承诺免费/长期托管；不接入支付、邮件、第三方 AI。
- 不在没有账号凭据时伪造 Vercel/Render 部署成功。
- 不把 SQLite 部署到无持久磁盘的 Serverless 环境。

## 交付

- `Dockerfile`、`.dockerignore`、`docker-compose.yml`、`docs/DEPLOYMENT.md`。
- 环境变量：`DATABASE_PATH`、`SESSION_SECRET`（预留）、`NODE_ENV`、`PORT`。
- 临时预览 URL（若网络允许）；否则明确说明只剩“选择宿主并执行部署”这一步。
- README 更新访问方式与限制。

## 验收

- [x] 生产构建成功；`npm start` 可访问首页与注册登录。
- [ ] 数据库文件在持久目录；容器重启后用户数据仍在。
- [x] 公网 URL 可访问（临时或正式），密码/令牌不出现在 URL/日志。
- [x] 部署文档可以让另一个人从空机器复现。
- [x] 明确标注临时预览的生命周期，不把它说成长期上线。

## 实现偏差

- 已提供 Dockerfile / docker-compose / 部署文档，但当前开发机没有 Docker，容器构建与重启持久化未实测。
- 已通过 localhost.run 临时隧道完成公网实测；该地址随进程结束失效，长期托管需用户提供主机或平台账号。
- 登录表单在无 JS 时默认 POST，避免密码进入 URL；反向代理下的 Origin 校验已补测试。
