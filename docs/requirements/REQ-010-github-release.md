# REQ-010 · GitHub 公开发布

- 状态：blocked（等待 GitHub 授权）
- 依赖：REQ-009
- 阻塞事实：当前 `gh auth status` 未登录；本工作区 `.git/config` 无 remote，尚未推送。本地分支将统一为 `main`

## 背景

MVP 需要在公开仓库中可被审阅、克隆与运行。发布不是「把代码传上去」：必须先确认没有秘密与数据库、内容与构建可用、README 与真实能力一致，再建立 remote 并推送。

## 目标 / 非目标

**目标**：创建公开仓库 `offerpath`；保留可审计的逐需求提交历史；首次推送前完成 secrets/DB/内容/构建检查；推送后从全新克隆验证安装、校验、测试与启动；记录仓库地址与 remote。

**非目标**：部署上线、域名、HTTPS、CI/CD、Release 二进制、容器镜像、许可证选择的法律审查、将数据库或用户数据上传。

## 发布前检查

1. 内容与构建：两端课程/面试库已齐备并通过 `npm run content:validate`；`npm run typecheck`、`npm test`（34/34）、`npm run build` 已通过。Secrets：`.env*`、`data/*.db*`、`artifacts/` 等已排除；首次推送前再次检查 `git ls-files` 与历史中无凭据。
2. 工作区：所有文档（含本目录 REQ-002..010 与 `docs/ROADMAP.md`）纳入同一次或按需求拆分的提交；不把无关文件混入。
3. 历史：按 `COMMIT_CONVENTION.md` 检查提交信息含 `Refs: REQ-xxx`；不使用 `--no-verify`，不 amend 已推送提交。
4. 分支：本地分支统一为 `main`（尚无 remote，不改写历史）。

## 交互与页面（发布流程）

```bash
gh auth status                         # 必须显示已登录且有 repo 权限
gh auth login                          # 或提供 GH_TOKEN，仅需一次
git status --short                     # 确认待提交内容
git log --oneline -10                  # 检查提交粒度与信息
git ls-files | grep -E '(^|/)(\.env|.*\.db)'   # 应无输出
npm run content:validate && npm run typecheck && npm test && npm run build
gh repo create offerpath --public --source=. --remote=origin --push
gh repo view --web                     # 确认公开描述与 README
```

- 仓库描述建议：`职跃 OfferPath — 面向程序员的求职与技能进阶平台（MVP）`；若 `offerpath` 被占用，用 `offerpath-platform`。手动建 remote 时用 `git remote add origin https://github.com/<user>/offerpath.git`，再 `git push -u origin master`（或改名后的 `main`）。
- 推送后从临时目录 `git clone`，执行 `npm ci`、`npm run content:validate`、`npm run typecheck`、`npm test`、`npm run seed`、`npm run dev`，确认克隆可用。
- 用户只需完成一次 `gh auth login`/`GH_TOKEN` 授权；检查、建库、推送与克隆验证可在授权后自动完成，但每一步结果必须如实记录。

## 数据与接口

- 不新增应用表/API；涉及的外部对象是 GitHub 仓库、remote `origin` 与公开 URL。
- 仓库名：`offerpath`；可见性：public；默认分支建议 `main`；不创建 GitHub Release，除非另立需求。
- 仓库内不得包含 `data/offerpath.db`、`-wal`/`-shm`、`.env`、`SESSION_SECRET`、真实简历或面试回答。

## 验收标准

> 当前全部未完成，禁止写成「已上传/已发布」。

- [ ] `gh auth status` 已登录且具备 repo 权限（需用户完成一次授权）。
- [ ] 三份缺失内容文件补齐；`content:validate`、`typecheck`、`test`、`build` 全部通过。
- [ ] `git status` 仅含预期文档/代码；无 `.env`、数据库、构建产物、密钥。
- [ ] 提交历史可读，逐需求可追溯，README 能力与限制准确。
- [ ] 公开仓库 `offerpath` 创建成功，`origin` 指向正确 URL，默认分支明确。
- [ ] 首次 push 成功；`gh repo view` 可见公开 README。
- [ ] 全新克隆后安装、校验、测试、seed、启动均成功。
- [ ] 在交付说明中记录仓库 URL、分支、最后一次提交；未部署则明确写「仅代码托管，未上线」。

## 测试计划

- 授权后执行：`gh auth status`、`git status --short`、`git log --oneline -10`、`git remote -v`、`git ls-files` 秘密扫描。
- 发布前：`npm run content:validate && npm run typecheck && npm test && npm run build`；当前均待执行。
- 发布后：临时目录 fresh clone + `npm ci` + 同一组命令 + 浏览器打开首页/登录；待执行。
- 当前未运行任何 git/gh 命令；本工作区仍无 remote，不能声称已推送。

## 实现偏差与后续

- 唯一需要用户亲自完成的是 GitHub 授权（浏览器 OAuth 或提供 `GH_TOKEN`）；没有凭据时状态保持 `blocked`。内容文件缺失会阻止校验/构建，不应以「先传上去再补」绕过。
- 当前无 CI 工作流、LICENSE、CONTRIBUTING、发布标签；公开前应决定许可证与贡献方式。本地分支是 `master`，与文档建议的 `main` 不一致；改名或保持现状需用户确认后再执行。
