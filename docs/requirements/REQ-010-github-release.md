# REQ-010 · GitHub 公开发布

- 状态：done
- 仓库：https://github.com/Jessica-ying12/offerpath
- 可见性：Public
- 默认分支：`main`
- 本地 remote：`origin`（发布完成后切换为标准 HTTPS URL）
- 依赖：REQ-009

## 背景

MVP 需要在公开仓库中可被审阅、克隆与运行。发布不是「把代码传上去」：必须先确认没有秘密与数据库、内容与构建可用、README 与真实能力一致，再建立远程仓库并保留按需求拆分的提交历史。

## 目标 / 非目标

**目标**：创建公开仓库；保留可审计的逐需求提交历史；首次推送前完成 secrets/DB/内容/构建检查；推送后验证远程与本地一致；记录仓库地址与 remote。

**非目标**：部署上线、域名、HTTPS 站点、CI/CD、Release 二进制、容器镜像、许可证法律审查、将数据库或用户数据上传。

## 发布结果

- 公开仓库已创建并推送；发布记录提交后共 14 个提交（含本文件）。
- 本地与远程 `main` 的提交 SHA 在推送后一致。
- 远程树包含 187 个文件；`README.md`、两端课程/面试 JSON、源码、测试与文档均在；未包含 `.env`、数据库、`artifacts/` 或构建产物。
- 提交历史按需求拆分：规范基线、工程基座、内容、UI、认证、学习、练习、计划、面试、总览、测试、发布记录。
- 仓库描述：`职跃 OfferPath — 面向程序员的求职与技能进阶平台（MVP）`。
- 可选的后续远程设置（不在本次验收）：GitHub Actions CI、Release 标签、Issue 模板。

## 发布前检查

1. **秘密扫描**：`git grep` 扫描全部历史中的常见令牌/私钥模式，无命中；只保留无值的 `.env.example`。
2. **构建与测试**：`npm run content:validate`、`npm run typecheck`、`npm test`（34/34）、`npm run build` 全部通过。
3. **内容**：两端各 9 章 / 27 微课 / 45 题 / 9 代码题 / 15 面试题。
4. **浏览器验收**：真实 Chromium 在 1440×1000 与 390×844 走通登录、学习、练习、代码沙箱、急冲、规划、面试（提示/重答/追问/报告）、记录与设置；无移动端横向溢出。
5. **安全边界**：未登录 401/重定向、跨源 403、登录限流 429、跨用户资源 404、Cookie HttpOnly/SameSite 均已实测。
6. **工作区**：Git 工作区干净；`origin/main` 与本地 `main` 对齐。

## 发布方式与安全说明

- 复用本机凭据管理器中已有的 GitHub 授权完成 API 创建仓库，令牌未写入仓库、未打印、未提交。
- 由于当前网络对 `github.com:443` 不稳定，推送使用仓库级临时部署密钥，经 `ssh.github.com:443` 传输；**推送与校验完成后立即撤销该密钥并删除临时私钥**。
- 本地 remote 随后切换为标准 `https://github.com/Jessica-ying12/offerpath.git`；本地不保存任何令牌。
- 当前环境无法通过 `github.com` 的普通 HTTPS 克隆；在正常网络下可直接 `git clone https://github.com/Jessica-ying12/offerpath.git`。若网络受限，可使用 SSH（`ssh.github.com:443`）或在可访问 GitHub 的环境克隆。

## 验收

- [x] 公开仓库地址可访问，`private=false`，默认分支 `main`。
- [x] 远程 `main` HEAD 与本地 `main` 一致；提交信息符合规范并含 `Refs`。
- [x] 远程树不包含数据库、`.env`、验收截图或构建产物。
- [x] README 含产品定位、能力、技术栈、快速开始、演示账号、命令、目录与文档入口。
- [x] 发布结果与阻塞恢复步骤已记录；没有伪造「已部署」「已接入大模型」等表述。

## 后续

- 部署、域名与持久化数据库、CI、Issue/PR 模板、许可证选择均需单独需求与确认。
- 其他程序员方向按 `docs/ROADMAP.md` 逐个立项，不提前搭建空壳。
