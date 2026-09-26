# ExamXX 迁移到 Spring Boot 3 + React SPA + 单 JAR 实施计划

## Context（为什么做）

用户目标是：把耗时考系统重构为 **Spring Boot 3 单体 API + React 单页应用 + 打成单个可执行 JAR**。调研发现本项目正处于**迁移中途、新旧代码混杂**状态，且经两个 Explore agent 和一个 Plan agent 逐文件核实。

现状矛盾：
- 根 `pom.xml` 仍是旧版：`packaging=war`、`java-version 1.6`、Spring 3.2.2、无 Boot parent。
- `application.properties` 仅 4 行 `db.*` 旧配置。
- 但已存在 Boot3 风格新代码：`ExamxxApplication.java`、`config/SecurityConfig.java`、`config/WebConfig.java`、`controller/SpaEntryController.java`（`/app/**` → `forward:/resources/app/index.html`）。
- 其余 controller / security filter 仍用 `javax.servlet.*`，service/domain/persistence 层无 javax 耦合、可复用。
- 旧 `src/main/webapp` 树仍在（web.xml、spring XML、JSP views、webapp/resources/app）。
- 前端 `frontend/` 完整（React18+Vite+TS，有 `dev/build/build:embedded`），vite embedded 输出到 `webapp/resources/app`，base=`/resources/app/`。
- Dockerfile、scripts/build-release.sh、doc 均已按 Boot3 形态写好。

**本计划 = 在半成品基础上完成并校准迁移**，产出可执行 JAR，用 H2 集成测试验收。

已确认决策（用户）：完整迁移到可运行 JAR；用 H2 集成测试（`@SpringBootTest+MockMvc**+Java17 验收；删除旧版 `static/app` 遗留产物，统一到 `/resources/app/`。

## 权威 SPA 路径：`/resources/app/`

前端 embedded base 保持 `/resources/app/`；产物进 `classpath:/static/resources/app`。`SpaEntryController` 保持 `forward:/resources/app/index.html`。**不要**改成 `/app/`——否则 `/app/**` 控制器会抢占 `/app/assets/**` 资源导致 JS/CSS 404。

## 关键文件清单

- `pom.xml` — 重写（本节）
- `src/main/resources/application.properties` — Boot 配置迁移
- `src/test/java/com/extr/integration/AppApiIntegrationTest.java` — 重写为 `@SpringBootTest+@AutoConfigureMockMvc+JUnit5`
- `frontend/vite.config.ts` — embedded outDir + dev proxy target
- `src/main/java/com/extr/controller/AppApiController.java`、`controller/BaseController.java` — javax→jakarta 主战场
- `src/main/java/com/extr/config/SecurityConfig.java`、`config/WebConfig.java` — 保留并核对装配
- `src/main/java/com/extr/util/xml/Object2Xml.java` — XStream 升版 + 白名单

## 实施步骤

### Phase 0：基线备份
对改动文件 `git` 快照。验证 `git status` 干净、可回滚。

### Phase 1：重写 pom.xml（能 compile）
- parent → `spring-boot-starter-parent:3.3.5`；`packaging` war→`jar`；`java-version 1.6`→`java.version=17`；删自定义版本属性。
- 依赖：`spring-boot-starter-web`、`spring-boot-starter-security`、`spring-boot-starter-cache`、`org.mybatis.spring.boot:mybatis-spring-boot-starter:3.0.4`、`com.mysql:mysql-connector-j`(runtime)、`com.h2database:h2`(test)、`spring-boot-starter-test`(test)。保留：`com.thoughtworks.xstream:xstream:1.4.20`、POI 系列、jsoup、httpclient。
- 删除：maven-war-plugin（换 s`spring-boot-maven-plugin`）、javax.servlet/jsp/jstl、log4j+slf4j-log4j12（代码改 slf4j）、c3p0、commons-fileupload、javax.inject、javax.validation+hibernate-validator、codehaus jackson、kaptcha、旧 mybatis/mybatis-spring 坐标、ehcache（用 SimpleCacheManager）、jodconverter/pdfbox/openoffice（如无生产需求）。
- 不引入 frontend-maven-plugin；保持 `scripts/build-release.sh` 先 `npm run build:embedded` 再 `mvn package`。
- 验证：`mvn -q validate` 过 → `mvn -q compile`，收集 javax/移除 API 错误清单（=Phase2 输入）。

### Phase 2：javax→jakarta + API 清理（能 test-compile）
- `AppApiController`、`BaseController`、`file/util/*`（FileUploadUtil、PropertyReaderUtil、PdfToSwf、JOD4DocToPDF）：`javax.servlet.*`→`jakarta.servlet.*`。
- 删 10 个 domain/controller domain 类的 `javax.xml.bind.annotation.XmlRootElement`（无 JAXB 运行时，编译不过）。
- `BaseController`：`GrantedAuthorityImpl`→`org.springframework.security.core.authority.SimpleGrantedAuthority`。
- UserDetailsServiceImpl / ExamServiceImpl：`org.apache.log4j.Logger`→`org.slf4j.LoggerFactory`。
- 新增 `config/MyBatisConfig`（`@Bean MyInterceptor`，boot starter 自动并入）。
- 删除：JSP 控制器（UserController/ExamController/PracticeController/QuestionController/ExamPaperController/CommentController/UserCenterController/SystemConfigController）、`security/filter/**`（AuthenticationFilter、SimpleCorsFilter）、`security/handler/**`、整棵 `src/main/webapp/`、`src/main/resources/static/app/`。
- `util/xml/Object2Xml`：升版 + 放行 XStream 白名单（domain 类、linked-hash-map、QuestionContent 等）。
- 验证：`mvn -q test-compile` 0 错误。

### Phase 3：配置与装配（能启动）
重写 `application.properties`（Boot 数据源/MyBatis/上传/端口，见下文）。`WebConfig` 已读 `${examxx.upload-dir}`，需与之匹配。验证 `mvn -q spring-boot:run` 能起（可 Ctrl-C），修 auto-config 报错。

### Phase 4：重写集成测试（里程碑）
- 重写 `AppApiIntegrationTest`：`@SpringBootTest+@AutoConfigureMockMvc+@ActiveProfiles("test")+JUnit5`；删 XML 加载与 FilterChainProxy 手动装配；ObjectMapper 换 `com.fasterxml.jackson.databind.ObjectMapper`。
- 新增 `src/test/resources/application-test.properties`，`spring.datasource.url=jdbc:h2:mem:examxx;MODE=MySQL;DATABASE_TO_UPPER=false`，`@Before` 用 `ResourceDatabasePopulator` 加载 `h2/e2e-schema.sql`+`h2/e2e-seed.sql`。
- 验证：`mvn -Dtest=AppApiIntegrationTest test` 全绿。

### Phase 5：前端产物路径（能集成）
- `frontend/vite.config.ts` embedded `outDir` → `../src/main/resources/static/resources/app`；dev proxy `/api` target `http://localhost:8080`（去掉 `/examxx` 旧 context）；移除 `/Kaptcha.jpg` 代理。
- 验证：`cd frontend && npx tsc --noEmit && npm run build:embedded` 产物落在 `static/resources/app`。

### Phase 6：Security 收敛复跑
确认仅剩 Boot `SecurityFilterChain`（permitAll：auth/**、/app/**、/files/**、/error；hasRole ADMIN：/api/app/admin/**；hasRole STUDENT：/api/app/student/**）。重跑 `mvn -Dtest=AppApiIntegrationTest test` 与 `mvn -q clean package`。

### Phase 7：端到端 + 产线
`mvn clean package` → 验证 `java -jar target/examxx-0.0.1-SNAPSHOT.jar`（配 EXAMXX_DB_*）可启动；浏览器 `/app/login` 用 admin/student 登录、深链可刷新、题目上传后 `/files/**` 可访问。

## application.properties 目标内容

```properties
server.port=${EXAMXX_PORT:8080}
server.servlet.session.timeout=120m
spring.datasource.url=${EXAMXX_DB_URL:jdbc:mysql://localhost:3306/examxx?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai&sslMode=DISABLED}
spring.datasource.username=${EXAMXX_DB_USER:root}
spring.datasource.password=${EXAMXX_DB_PASSWORD:}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
mybatis.mapper-locations=classpath:com/extr/persistence/*.xml
mybatis.type-aliases-package=com.extr.domain
examxx.upload-dir=${EXAMXX_UPLOAD_DIR:./uploads}
spring.servlet.multipart.max-file-size=20MB
spring.servlet.multipart.max-request-size=20MB
```

## 遗留隐患（Phase 内处理或记录）

1. XStream 升版 + 白名单（必做，否则 exam 卷反序列化崩）。
2. MyInterceptor 依赖 MyBatis 内部字段，若分页断言回归失败改用 PageHelper。
3. log4j→logback（Phase2 必做）。
4. JAXB 注解残留（Phase2 必做）。
5. MySQL 驱动类 `com.mysql.cj.jdbc.Driver` + url 参数更新。
6. ehcache→SimpleCacheManager（删 ehcache.xml 依赖）。
7. `scheduler.xml` 定时任务删除后无 `@Scheduled` 替代（记录，本轮测试不覆盖）。
8. `/files/**` 上传大小适配。

## 验证矩阵

| 层 | 命令 | 期望 |
|---|---|---|
| 编译 | `mvn -q compile` | 0 错误 |
| 测试编译 | `mvn -q test-compile` | 0 错误 |
| 集成测试 | `mvn -Dtest=AppApiIntegrationTest test` | 全绿 |
| 前端 | `cd frontend && npx tsc --noEmit && npm run build:embedded` | 0 类型错误，产物在 `static/resources/app` |
| 打包 | `mvn clean package` | `target/examxx-0.0.1-SNAPSHOT.jar` 可执行 |
| 运行 | `java -jar target/*.jar` | 启动、连 MySQL 无 DS 错误 |
| 手动 | `/app/login` 登录 admin/student；上传文件看 `/files/**` | SPA 正常、深链刷新、外链可用 |