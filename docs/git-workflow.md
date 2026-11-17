# Git 版本与发布流程

适用于「研发部题库」：Spring Boot 3 + React，前后端构建为一个 JAR。
采用 main + 短期分支 + Pull Request（PR）+ 发布 tag。main 表示可发布代码，实际线上版本以部署记录为准。

## 1. 分支与合并

| 分支 | 用途 | 来源 | 合入目标 |
| --- | --- | --- | --- |
| main | 稳定主干，长期保留 | — | 通过 PR 接受变更 |
| feature/<name> | 新功能 | 最新 origin/main | main |
| fix/<name> | 常规问题修复 | 最新 origin/main | main |
| docs/<name> | 文档维护 | 最新 origin/main | main |
| hotfix/<name> | 紧急线上修复 | 见下文 | main，或受控维护分支 |

分支名使用简短英文，例如 feature/wrong-question-review、docs/git-workflow。
一个 PR 围绕一个目的，提交应小而完整。默认使用 Squash merge，最终提交标题遵循提交规范。
PR 合并后删除远端分支；Squash 后本地分支不一定能用 git branch -d 删除，先核对提交已被纳入 PR，再决定清理。

目前不设置 develop/release 常驻流程。只有出现多版本并行维护或独立验收周期时，再通过文档 PR 引入，并明确修复回合路径。

## 2. 开始工作前：保护现有修改

先执行 git status --short、git diff、git diff --cached，确认当前分支与未提交内容。
有不属于当前任务的修改时，不直接切换分支、批量暂存，也不执行 reset --hard 或 clean。

对已有部署但未提交的代码，先保留源码备份（包括未跟踪文件），核对线上产物和修改范围，再分批提出 PR。
未核对完整的历史工作区不能直接标记为正式发布版本。Git 远端 main 不一定等于当前线上代码。

存在无关修改时，优先使用单独目录：
从已 fetch 的 origin/main 创建独立 worktree 或新克隆，只迁入本任务需要的文件；不要把整个旧工作区覆盖过去。
stash 仅在了解其范围和恢复方式时使用，默认 stash 不包含未跟踪文件，不能替代备份。
新建目录仍须遵守运行环境、AGENTS.md 和工具的 worktree 约束。

## 3. 日常操作示例

以下命令在干净的工作目录执行；每条成功后再执行下一条。

```bash
git fetch origin
git switch -c feature/wrong-question-review origin/main

# 修改后，逐项检查并暂存真实文件路径
git diff
git add src/main/java/path/to/ChangedFile.java
git diff --cached
git commit -m "feat(practice): 增加错题复习入口"

# 合并最新主干，解决冲突后重新验证
git fetch origin
git merge origin/main
git push -u origin feature/wrong-question-review
```

上面的 Java 路径是占位示例，执行时替换为实际文件。
随后创建 feature 分支到 main 的 PR，说明问题、变更行为、验证结果和必要的迁移/回滚步骤。
每次提交都需要重新暂存对应修改。不要使用 git add . 将无关业务修改或运行文件混入提交。
已共享分支默认通过 merge 同步主干；需要改写历史时先与协作者确认，不在公共分支随意 force push。

## 4. 提交规范

格式：type(scope): 描述；scope 可省略。

| type | 用途 |
| --- | --- |
| feat | 新增功能 |
| fix | 修复功能或用户可见的界面问题，如 fix(ui) |
| docs | 文档 |
| style | 缩进、空格等不影响行为的格式调整 |
| refactor | 不改变外部行为的重构 |
| perf | 性能优化 |
| test | 测试 |
| build | 构建和依赖 |
| ci | 自动化流水线 |
| chore | 其他维护 |

破坏性变更使用 ! 或 BREAKING CHANGE 说明。版本递增根据实际兼容性和发布范围决定，
不能只根据 feat/fix 前缀自动断定；发布说明还应包含安全、迁移和运维变化。
自动生成发布说明需要另行配置工具，本文不代表自动化已经启用。

## 5. 检查与分支保护

这是目标规范，实际启用情况以 GitHub Rulesets/分支保护和 Actions 配置为准。
仅提交本文不会自动建立 CI、审批规则或 tag 保护。

- main 禁止普通直接推送、强制推送和删除，变更通过 PR。
- 有独立审阅者时要求至少一名其他成员批准；单人维护阶段记录自检结果，不把作者自审当作 GitHub 审批通过。
- CI 配置并成功运行后再设为必需检查，避免配置不存在的检查导致所有 PR 阻塞。
- 合并前同步最新主干并验证；后续启用 merge queue 时可由队列完成相应检查。
- 发布 tag 的创建权限限制给维护者或发布自动化；保护已发布 tag 不被改写。

建议业务代码 PR 的检查顺序（仓库根目录启动，Node/Java/Maven 已准备好）：

```bash
cd frontend
npm ci
npx tsc --noEmit
npm run build:embedded
cd ..
mvn -B verify
```

前端嵌入构建完成后再打包后端，避免 JAR 混入旧资源；如环境需要 Maven 镜像，追加项目实际可用的 settings 参数。
关注测试报告中的失败与跳过数量，跳过旧测试不等于覆盖完整业务。
权限、注册、登录、考试等变更须验证对应集成场景；纯文档 PR 检查差异、路径和命令一致性即可。
构建目录、凭据、数据库导出、私钥、本机配置和临时打包 POM 不纳入提交。
当前仓库跟踪嵌入式前端资源：涉及前端的 PR 应确认生成资源与源码对应，或另提 PR 统一改为 CI 生成，不混用两种方式。

## 6. 版本与发布

前后端作为一个产品发布，共用一个正式版本，格式为 v主版本.次版本.补丁。
发布 tag 是产品正式版本来源；pom.xml/package.json 的现有版本暂作构建元数据，不要求与 tag 相同。
若以后采用自动同步版本号，应单独建立流程并删除此例外。

- 主版本：不兼容变更；0.x 阶段的不兼容变更需显式说明并至少递增次版本。
- 次版本：兼容的功能增加。
- 补丁：兼容的问题修复、样式修正和性能优化。
- 文档 PR 不强制发版；示例版本只是占位，实际应先检查已有 tags，选择未使用的新版本。

发布步骤：

1. 相关 PR 合入 main，选定发布提交，完成对应提交的验证。
2. 从干净目录构建该提交；记录 Git SHA 和最终 JAR SHA256。
3. 在该 main 历史中的提交上创建附注 tag，并显式推送单个 tag。
4. 创建 GitHub Release，列出变更、验证、已知限制、迁移及回滚方式；附上对应 JAR 和校验值。
5. 部署同一份已经校验的 JAR，不在部署阶段重新构建不同产物。

例如，以下命令中的版本与提交均需替换为已确认值：

```bash
git fetch origin --tags
git merge-base --is-ancestor <release-commit-sha> origin/main
git tag -a vX.Y.Z <release-commit-sha> -m "Release X.Y.Z"
git push origin vX.Y.Z
```

只有祖先检查成功才继续打 tag。tag 创建后不移动；发现问题使用新版本。
GitHub Release 表示产物已发布，不等于已经部署成功；部署失败必须如实记录。

## 7. 部署、迁移与回滚

每次部署记录：版本 tag、Git SHA、JAR SHA256、部署时间与环境、验证结果、备份位置，以及实际数据库迁移。
实际地址、服务名称与操作授权以维护交接文档和当前环境核验为准，不在公开仓库写入密码或私钥。

- 更新前备份应用、生产配置、数据库和受影响的上传文件；确认备份成功后再替换。
- 仅操作已授权的题库服务，不影响同机其他应用。
- 数据库使用增量迁移，记录脚本及执行状态；禁止对业务库重复导入含 DROP TABLE 的初始化 SQL。
- 发布前评估新旧程序与数据库的兼容性。应用回退不代表数据库自动回退，迁移必须有独立恢复方案。
- 就绪检查、关键业务验证及其他系统存活检查完成后，才标记部署成功。
- 防火墙等服务器配置变化记录为运维变更；修改了受版本管理的脚本/文档时可提 PR，实际凭据留在受限位置。

## 8. 紧急修复

线上运行提交与 main 一致时，从最新 origin/main 创建 hotfix/<name>，验证并通过 PR 合入 main，
再按照发布流程打新的补丁 tag。

若 main 已有尚未上线且不能随补丁发布的功能，从线上 tag 拉出 hotfix 分支。
由维护者建立并保护 maintenance/<version-line> 分支，通过 PR 接受补丁，
在该维护分支已审阅提交上打新的补丁 tag；这是“正常版本从 main 发布”的明确例外。
修复还须另提 PR 回合 main（可将补丁 cherry-pick 到从 main 创建的分支），避免后续版本丢失修复。

若线上包含尚未提交的修改，应先保存并还原准确代码基线；不能假定从旧 tag 构建就能安全替换线上。
紧急情况也不覆盖既有 tag、不绕过备份、不把源码状态不明的产物描述为可复现发布。
