# 研发部题库

企业内部电力题库与在线考试系统。

## 技术栈

- **后端**：Spring Boot 3.3.x / Java 17 / MyBatis / MySQL
- **前端**：React 18 + TypeScript + Vite
- **部署形态**：单体 Spring Boot 应用，前端 SPA 构建产物内嵌进同一个可执行 JAR，单进程运行

## 目录速览

```text
examxx-master/
  pom.xml                 Maven 构建（jar）
  Dockerfile / docker-compose.yml
  scripts/                运维 / 集成脚本
  docs/                   全部规范与说明文档（交接入口：见《项目结构与技术架构.md》）
  data/                   题库导入模板（*.xlsx）
  frontend/               React 前端源码
  src/main/java           后端源码（config/controller/service/persistence/…）
  src/main/resources      配置、MyBatis XML、H2 脚本、前端产物(static/resources/app)
  src/test                后端集成/单元测试
```

## 前端

- 开发入口：`/app`（SPA 路由）
- 接口前缀：`/api/app/**`
- 独立构建输出：`frontend/dist`
- 嵌入式构建输出：`src/main/resources/static/resources/app`（随 JAR 一起发布）

### 前端命令

```bash
cd frontend
npm install                         # 安装依赖
cp .env.example .env.local          # 按需配 VITE_API_BASE_URL
npm run dev                          # 本地热更新开发
npm run build                        # 独立静态站点（适合 Nginx 部署）
npm run build:embedded               # 内嵌到后端 JAR 的一体化构建
```

后端用 `-Dapp.cors.allowedOrigins=...` / `APP_CORS_ALLOWED_ORIGINS` 配置跨域白名单。

## 运行（单 JAR）

```bash
# 打包
mvn clean package
# 启动（Windows 用对应 java.exe，需 JDK 17）
EXAMXX_DB_PASSWORD='你的MySQL密码' \
  java --add-opens java.base/java.util=ALL-UNNAMED \
       --add-opens java.base/java.lang=ALL-UNNAMED \
       -jar target/examxx-0.0.1-SNAPSHOT.jar
```

一键启动脚本见仓库根 `start.bat`；详细运维见 `docs/production-deployment.md`。

## 功能模块

| 功能模块 | 子功能 | 说明 |
| :-- | :-- | :-- |
| 用户模块 | 注册登录 | 用户可注册并登录系统。 |
| 用户模块 | 随机练习 | 从题库随机取题供学员练习。 |
| 用户模块 | 强化练习 | 按知识分类练习，记录进度。 |
| 用户模块 | 错题练习 | 记录错题，支持复习巩固。 |
| 用户模块 | 模拟考试 | 选择试卷进行考试。 |
| 用户模块 | 统计分析 | 图表查看知识点掌握情况。 |
| 管理模块 | 题库管理 | 增删改查 + Excel 批量导入题目。 |
| 管理模块 | 试卷管理 | 从题库选试题组卷。 |
| 管理模块 | 用户管理 | 管理系统用户。 |

## 数据库

- 建库/初始化：`docs/sql/examxx.sql`（含建表 + 基础资源数据）
- 数据流与表结构说明：见 `docs/数据流与导入说明.md`
- 其它增量迁移 SQL 见 `docs/sql/`

## 文档入口

交接与规范文档集中在 `docs/`，从《项目结构与技术架构.md》开始阅读。