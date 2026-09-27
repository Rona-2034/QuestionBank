# 更新管理约定

本文面向「研发部题库」项目的日常更新与发布上线操作，解决「改了代码之后，团队每个人 / 线上环境如何拿到最新版并安全切换」的问题。涉及版本号、分支命名、提交规范等与《git-workflow.md》中定义保持一致，此处不重复，只补充**操作层面的更新约定**。

> 阅读顺序：先看《git-workflow.md》理解版本与分支语义，再看本文掌握「如何更新」。

## 1. 更新的三种类型

| 类型 | 触发 | 去向 | 示例 |
| --- | --- | --- | --- |
| 功能更新 | 新功能 / 优化 | `develop` → `release/vX.Y.Z` → `main` | 新增错题练习 |
| 修复更新 | 线上 / 测试发现的 bug | `hotfix/*` → `main` + `develop` | 修复登录失效 |
| 文档/配置更新 | 说明文档、构建配置 | 按改动范围选分支 | README、CI 配置 |

## 2. 同步与拉取约定

- **每天开工先同步 `develop`**：`git checkout develop && git pull`，再从最新 develop 拉功能分支，避免过期基线导致冲突。
- **拉取用 rebase 而非 merge**（个人 feature 分支上）：`git pull --rebase`，让历史保持线性、便于 review。
- **feature 分支合入前**：先 `git merge develop` 解决冲突并本地验证通过，再 push 发起 MR/PR 合入 `develop`。
- **禁止把 `develop` 直接推到 `main`**；`main` 只接受 `release/*` 与 `hotfix/*` 的合并（见《git-workflow.md》§2）。
- **合并到 `main` 后必须回并 `develop`**（release 与 hotfix 均要），防止修复在 `develop` 上丢失（《git-workflow.md》§5 已给命令）。

## 3. 发布上线流程

版本号、打 tag、分支转合见《git-workflow.md》§5。本章补充「发布到线上运行时怎么操作」：

1. **确认基线**：`main` 合并到最新 release/hotfix，`git tag vX.Y.Z` 已打并推送。
2. **构建产物**：本工程前端 SPA 内嵌进同一个可执行 JAR，发布即一个 `target/examxx-*.jar`。
   ```bash
   cd frontend && npm run build:embedded   # 先重建内嵌前端
   cd .. && mvn clean package              # 再打包后端（含前端产物）
   ```
3. **数据库迁移先行**：若有 `docs/sql/*.sql` 增量脚本，**先于应用启动执行**，严格按文件名顺序（时间/版本前缀）执行，避免重复执行（脚本应幂等或人工核对）。
4. **平滑切换**：停旧进程 → 备份旧 JAR（便于回滚）→ 启动新 JAR → 冒烟验证登录与核心接口。
   ```bash
   java --add-opens java.base/java.util=ALL-UNNAMED \
        --add-opens java.base/java.lang=ALL-UNNAMED \
        -jar target/examxx-0.0.1-SNAPSHOT.jar
   ```
5. **镜像 tag 与发布产物对应**：每次部署记录的 `vX.Y.Z` 必须与线上运行的 JAR 一致，便于追问题。

> 启停在 Windows 上可用工作区外层的 `start.bat` / `stop.bat`（未纳入版本库，属本机运维脚本），其内容与上述命令一致。

## 4. 回滚约定

| 场景 | 做法 | 说明 |
| --- | --- | --- |
| 代码回滚 | `git revert <commit>` | 追加反向提交，保留历史，适合已 push / 多人协作 |
| 整版本回退 | `git checkout vX.Y.Z` 重新打包；或直接切回旧 JAR | 慎用 `reset --hard`（会丢提交，仅限本地未推送） |
| 数据库回滚 | 依赖迁移脚本方向 | SQL 迁移通常向前执行，回滚需专门编写回滚脚本，**上线前先确认** |
| 结构破坏性修改 | 走高版本号，不回滚到兼容旧数据的旧版 | 遵循《git-workflow.md》§1 主版本语义 |

**核心铁律**：tag 一旦推送禁止改写（《git-workflow.md》§6）。因此线上出错优先 `hotfix/*` 递增补丁版本，而不是回退旧 tag。

## 5. 更新节奏建议

- 提交粒度：小步、原子提交，能独立构建（`feat`/`fix` 驱动 CHANGELOG）。
- 合入节奏：功能完成即合 `develop`，避免长时间积压分支（分支生命周期越短冲突越少）。
- 发布节奏：建议每个可交付点打 tag 并补 Release Notes；小团队可视情每周/每功能发布一次补丁或次版本。

## 6. 关联文档

- 《git-workflow.md》：版本号、分支模型、提交规范、release/hotfix 流程。
- 《production-deployment.md》：生产环境部署细节。
- 《README.md》:项目"更新管理约定"入口即本文件。