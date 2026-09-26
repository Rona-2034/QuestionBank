# Git 版本与分支管理规范

本文适用于「研发部题库」项目（Spring Boot 3 单体后端 + React 单页前端，最终打成单个 JAR 发布）。全文通用命令为 git 标准命令，Windows 与 Linux 均适用。

## 1. 版本号规范（语义化版本 SemVer）

本项目前端与后端打进同一个 JAR，**共用一个版本号**，格式为 `主版本.次版本.补丁`。版本号只写入 tag 与相关文档，不散落多处维护。

| 部分 | 何时递增 | 示例 |
| --- | --- | --- |
| 主版本 | 破坏性变更 / 里程碑 / UI 彻底重构 | `2.0.0`（如 JSP 迁到 React） |
| 次版本 | 新增功能、新页面、新模块 | `0.4.0`（如新增「错题复习」） |
| 补丁 | 修 bug、改样式、性能优化 | `0.4.1`（如修复登录 Session 超时） |

## 2. 分支模型（轻量 Git Flow）

单体小团队项目不引入重型多级分支，使用以下四类分支即可。

| 分支 | 命名 | 生命周期 | 来源 | 合入目标 |
| --- | --- | --- | --- | --- |
| `main` | 主干，稳定可发布 | 永久 | — | 只接受 `release/*` 和 `hotfix/*` |
| `develop` | 集成分支 | 永久 | 自 `main` 拉出 | 只接受 `feature/*` |
| `feature/*` | 功能分支 | 功能完成即删 | 自 `develop` | 合入 `develop` |
| `release/*` | 发布预分支 | 发版后删 | 自 `develop` | 合入 `main` + `develop` |
| `hotfix/*` | 线上紧急修复 | 修复后删 | 自 `main` | 合入 `main` + `develop` |

**命名规范**：功能 `feature/功能名`、发布 `release/0.4.0`、修复 `hotfix/问题名`。

## 3. 提交规范（Conventional Commits）

每次提交使用统一前缀，便于自动生成 CHANGELOG 和判断版本递增。

```
<type>(<scope>): <描述>
```

| type | 含义 | 示例 |
| --- | --- | --- |
| `feat` | 新功能 | `feat(练习): 增加随机练习模式` |
| `fix` | 修 bug | `fix(登录): 修复 Session 超时` |
| `docs` | 文档 | `docs: 补充部署说明` |
| `style` | 格式化 / 样式 | `style: 统一缩进` |
| `refactor` | 重构（不改行为） | `refactor(题库): 抽取 QuestionAdapter` |
| `perf` | 性能优化 | `perf(考试): 优化提交接口` |
| `test` | 测试 | `test(题库): 补充导入用例` |
| `chore` | 构建 / 依赖 / 杂务 | `chore: 升级 MyBatis` |
| `build` | 构建脚本 | `build: 更新打包脚本` |

> `feat` 与 `fix` 驱动 CHANGELOG 自动归类，也是补丁/次版本判断的依据。

## 4. 日常工作流（Feature Branch Flow）

以「新增错题复习功能」为例：

```bash
# 1. 从最新 develop 拉功能分支
git checkout develop && git pull
git checkout -b feature/错题复习

# 2. 用「原子提交」逐步推进（每步可回滚）
git add src/... test/...
git commit -m "feat(错题): 新增错题记录查询接口"
git commit -m "test(错题): 补充复习用例"

# 3. 功能完成后同步 develop 避免冲突
git checkout develop && git pull
git checkout feature/错题复习 && git merge develop

# 4. 推送并发起 Merge Request 到 develop
git push -u origin feature/错题复习
```

**原则**：
- 一个分支只做一件事，不混多个需求。
- 每步提交小而完整、能独立构建通过。
- 上屏前本地验证：`mvn -Dtest=AppApiIntegrationTest test`、`npx tsc --noEmit`。

## 5. 发布流程（Release Flow）

```bash
# 1. 从 develop 拉发布分支，按范围 bump 版本
git checkout -b release/0.5.0 develop

# 2. 冻结功能，只允许修 bug / 改文档 / 更新版本号，并跑全量回归

# 3. 打 tag，合并回 main 与 develop
git tag -a v0.5.0 -m "Release 0.5.0"
git checkout main && git merge --no-ff release/0.5.0 && git push origin main
git checkout develop && git merge --no-ff release/0.5.0 && git push origin develop

# 4. 删除已合并的发布分支
git branch -d release/0.5.0
```

**线上紧急修复（Hotfix Flow）**：

```bash
git checkout -b hotfix/login-timeout main      # 一定从 main 拉
git commit -m "fix(登录): 修复 Session 超时"
# 验证后合入 main 打 tag，再合回 develop 防止修复丢失
git checkout main && git merge --no-ff hotfix/login-timeout
git tag -a v0.5.1 -m "Hotfix 0.5.1"
git checkout develop && git merge --no-ff hotfix/login-timeout
```

## 6. Tag 与 Release 管理

- tag 即版本，只打在 `main` 上，命名 `v0.5.0`（与 pom 版本严格一致）。
- 每个 tag 对应一份 Release Notes（从 conventional commits 自动抽取 `feat`/`fix`）。
- tag 一旦 push 禁止改写，新问题走 hotfix 递增补丁。

## 7. 分支保护规则（远程平台配置）

- `main` / `develop` 禁止直接推送，只允许 MR/PR 合并。
- 合并前须通过 CI（本项目 `mvn test` + `npm run build:embedded`）。
- 至少 1 个 review 通过。
- 合入前要求目标分支自动更新到最新。
- 普通成员无 `main` 写权限，仅维护者可打 tag。

## 8. 常用命令速查

```bash
git checkout develop && git pull    # 更新
git checkout -b feature/x develop   # 建分支
git commit -m "feat(x): 描述"        # 原子提交
git pull --rebase                   # 同步上游
git push -u origin feature/x        # 推送
git tag -a v0.5.0 -m "Release"      # 打标签
git log --oneline --graph --all     # 看分支拓扑
git stash / git stash pop           # 暂存未提交改动
```