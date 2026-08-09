# 研发部题库

基于 Java、Spring MVC、JSP、MySQL 的内部题库与考试系统。

## 前端改造

项目已增加一套 `Vite + React + TypeScript` 的新前端壳，目录位于 `frontend/`。

- 开发入口：`/app`
- 兼容接口：`/api/app/**`
- 独立前端构建输出：`frontend/dist`
- 嵌入式构建输出：`src/main/webapp/resources/app`

### 前端命令

1. 进入 `frontend/`
2. 执行 `npm install`
3. 复制 `.env.example` 为 `.env.local`，按需配置 `VITE_API_BASE_URL`
4. 本地开发：`npm run dev`
5. 独立部署构建：`npm run build`
6. 仍需随 WAR 一起发布时：`npm run build:embedded`

`npm run build` 现在默认产出独立静态站点，适合 Nginx/对象存储部署。

`npm run build:embedded` 会将静态资源写入 `src/main/webapp/resources/app`，保留旧式 WAR 内嵌发布方式。

后端支持通过 `-Dapp.cors.allowedOrigins=https://your-frontend.example.com` 或环境变量 `APP_CORS_ALLOWED_ORIGINS` 配置跨域白名单，便于独立前端以 `withCredentials` 方式复用现有 Session 登录。

### 已接入能力

- Session/Cookie 登录兼容
- 登录/登出接口：`/api/app/auth/login`、`/api/app/auth/logout`
- 当前用户接口：`/api/app/auth/me`
- 首页聚合接口：`/api/app/home`
- 管理端题库列表接口：`/api/app/admin/questions`
- 学员强化练习接口：`/api/app/student/practice/by-point/*`
- 学员考试载荷接口：`/api/app/student/exams/*`

### 运行验证

- e2e 业务流验证：`bash scripts/run-runtime-flow.sh`
- 原始数据库快照验证：`bash scripts/run-legacy-snapshot-stack.sh`

`run-legacy-snapshot-stack.sh` 使用 `h2/legacy-schema.sql` + `h2/legacy-seed.sql` 启动后端。
这组 H2 数据是 `doc/examxx.sql` 的兼容快照，包含原始管理员、题库、知识类、答题人阶段、法条引用等基础数据，并通过独立构建的前端预览站点做 Playwright 校验。

## 功能

| 功能模块 | 子功能 | 说明 |
| :-- | :-- | :-- |
| 用户功能模块 | 用户注册登录 | 用户可以注册并登录系统。 |
| 用户功能模块 | 随机练习 | 从题库中随机取出指定数量的题目供学员练习。 |
| 用户功能模块 | 强化练习 | 按知识分类进行练习，并记录学习进度。 |
| 用户功能模块 | 错题练习 | 记录错题，支持复习巩固。 |
| 用户功能模块 | 模拟考试 | 选择试卷进行考试。 |
| 用户功能模块 | 统计分析 | 用图表查看知识点掌握情况。 |
| 管理功能模块 | 题库管理 | 增加、修改、删除题目。 |
| 管理功能模块 | 试卷管理 | 从题库中选择试题组成试卷。 |
| 管理功能模块 | 用户管理 | 管理系统用户。 |

## 使用

1. 安装 MySQL，并创建项目数据库。
2. 导入 `doc/examxx.sql`。
3. 将 WAR 包部署到 Tomcat。
4. 修改 `WEB-INF/spring/root-context.xml` 中的数据库连接配置。
