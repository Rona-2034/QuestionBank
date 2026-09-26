# Spring Boot Migration Record

## Completed Target

The application is now a Java 17, Spring Boot 3 executable JAR with a React
SPA as its only UI. The MySQL schema and MyBatis mapper SQL remain in place.
The legacy `src/main/webapp` JSP tree, `web.xml`, Spring XML contexts, WAR
packaging, external Tomcat dependency, and form-login filter were removed.

## Runtime and Development Model

- **Release runtime:** build the React application with `npm run build:embedded`, then run the single Spring Boot JAR. Spring Boot serves the SPA at `/app/**`, API at `/api/app/**`, and uploads at `/files/**` on the same origin.
- **Local development:** run Spring Boot on port 8080 and Vite on port 5173. Vite proxies `/api` to the Boot process, so React hot reload does not require rebuilding the JAR after every source edit.
- **Debugging:** run `ExamxxApplication` from an IDE or use Maven with `-Dspring-boot.run.jvmArguments='-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005'` and attach a remote JVM debugger to port 5005.
- **Prerequisite:** all Maven commands must use JDK 17. Java 8 cannot load Spring Boot 3 plugins.

## Compatibility Decisions

| Area | Result |
| --- | --- |
| SPA entry | `GET /app` and `GET /app/**` forward to `/app/index.html`. |
| Static assets | React production assets are packaged under `src/main/resources/static/app`. |
| Authentication | Session endpoints remain `POST /api/app/auth/login`, `GET /api/app/auth/me`, and `POST /api/app/auth/logout`. |
| Roles | `/api/app/student/**` and `/api/app/admin/**` use the Spring Security 6 filter chain. |
| Passwords | Existing username-salted SHA-1 hashes remain valid through a dedicated compatibility authentication provider. A stronger password-hash migration can be performed later without forcing resets now. |
| MyBatis paging | The paging interceptor uses MyBatis 3 public APIs and retains the existing `Page` contract. |
| Uploads | Multipart uploads use Boot's resolver and `EXAMXX_UPLOAD_DIR`; `/files/**` serves those stored files. |
| XML data | XStream allows only project and collection types, including legacy TreeMap history XML, under Java 17. |

## Verification

```bash
mvn -Dtest=AppApiIntegrationTest test
cd frontend && npx tsc --noEmit && npm run build:embedded
```

The integration suite exercises JSON login, session lookup, role isolation,
student practice and exam flows, admin question APIs, and SPA deep links using
the H2 compatibility fixture.

## Release Checks

1. Restore a copy of the target MySQL database.
2. Set `EXAMXX_DB_URL`, `EXAMXX_DB_USERNAME`, and `EXAMXX_DB_PASSWORD`.
3. Start `java -jar target/examxx-0.0.1-SNAPSHOT.jar`.
4. Verify an existing administrator and student can sign in at `/app/login`.
5. Verify one question import and an image upload, then back up the external upload directory.
