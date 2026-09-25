FROM node:20-bookworm-slim AS frontend
WORKDIR /workspace
COPY frontend/package.json frontend/package-lock.json frontend/
RUN cd frontend && npm ci
COPY frontend frontend
RUN cd frontend && npm run build:embedded

FROM maven:3.9.14-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src src
COPY --from=frontend /workspace/src/main/resources/static/app src/main/resources/static/app
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/target/examxx-0.0.1-SNAPSHOT.jar app.jar
ENV EXAMXX_UPLOAD_DIR=/var/lib/examxx/uploads
VOLUME ["/var/lib/examxx/uploads"]
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
