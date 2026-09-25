# 研发部题库生产部署

本文对应当前的 React 单页应用和 Spring Boot 单体服务。生产环境只运行一个可执行 JAR，不使用外置 Tomcat、WAR、Node/Vite 开发服务器。

## 1. 部署清单

| 项目 | 要求 |
| --- | --- |
| 操作系统 | Ubuntu 22.04+/Debian 12+/RHEL 9+，具备 `systemd` |
| 应用运行时 | Java 17 JRE/JDK |
| 数据库 | MySQL 8.0+，字符集 `utf8mb4` |
| 应用进程 | 一个 Spring Boot JAR，默认仅监听 `127.0.0.1:8080` |
| Web 入口 | 推荐 Nginx 反向代理与 HTTPS |
| 文件存储 | 上传目录 `/var/lib/examxx/uploads`，需持久化备份 |
| 网络 | 应用服务器能连接 MySQL `3306`；外部只开放 `80/443` |

生产前准备以下信息：

```text
MySQL 主机、端口、数据库名
MySQL 应用账号与密码
域名与 HTTPS 证书（推荐）
应用服务器 SSH 权限（可 sudo）
现有数据 SQL 文件与上传目录备份（迁移已有环境时）
```

## 2. 数据库初始化

在 MySQL 服务器执行。`10.20.30.%` 必须替换为应用服务器所在网段；数据库密码使用随机强密码，不要使用示例值。

```sql
CREATE DATABASE IF NOT EXISTS examxx
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'examxx_app'@'10.20.30.%' IDENTIFIED BY 'replace-with-a-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON examxx.* TO 'examxx_app'@'10.20.30.%';
FLUSH PRIVILEGES;
```

首次安装导入初始数据：

```bash
mysql -h <mysql-host> -u root -p examxx < doc/examxx.sql
```

已在运行的系统迁移时，导入源数据库导出的完整备份，不要再覆盖导入 `doc/examxx.sql`。

验证数据库连接：

```bash
mysql -h <mysql-host> -u examxx_app -p -D examxx -e 'SELECT 1;'
```

## 3. 构建发布包

在构建机或 CI 中执行，不建议在生产机安装 Node.js 和 Maven。

```bash
cd examxx-master
./scripts/build-release.sh
```

产物是：

```text
target/examxx-0.0.1-SNAPSHOT.jar
```

该 JAR 已包含 `/app` 下的 React 静态资源和后端 API。构建后可校验：

```bash
sha256sum target/examxx-0.0.1-SNAPSHOT.jar
```

将 JAR 和安装脚本复制到服务器：

```bash
scp target/examxx-0.0.1-SNAPSHOT.jar scripts/install-production.sh <server>:/tmp/
```

## 4. 一键安装为 systemd 服务

在应用服务器执行以下命令。脚本会提示输入数据库密码，密码不会出现在终端命令历史中；也可由受控的部署系统通过 `EXAMXX_DB_PASSWORD` 环境变量传入。

```bash
sudo bash /tmp/install-production.sh \
  --artifact /tmp/examxx-0.0.1-SNAPSHOT.jar \
  --db-url 'jdbc:mysql://<mysql-host>:3306/examxx?useUnicode=true&characterEncoding=UTF-8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai' \
  --db-username examxx_app \
  --install-jre
```

脚本完成的工作：

1. 检查或安装 Java 17 JRE。
2. 创建受限 Linux 用户 `examxx`。
3. 安装 JAR 到 `/opt/examxx/examxx.jar`，旧 JAR 备份为 `examxx.jar.previous`。
4. 创建上传目录 `/var/lib/examxx/uploads`。
5. 将数据库连接信息保存到仅 root 和 `examxx` 用户组可读的 `/etc/examxx/examxx.env`。
6. 创建、启用并启动 `examxx.service`。
7. 请求 `http://127.0.0.1:8080/app/login` 进行本机验收。

默认只监听回环地址，适用于 Nginx 反向代理。如果没有 Nginx 且必须直接暴露端口，显式指定：

```bash
sudo bash /tmp/install-production.sh ... --bind-address 0.0.0.0
```

此方式必须在防火墙和安全组中严格限制 `8080` 的来源；推荐使用下一节的 Nginx 方式。

## 5. Nginx 与 HTTPS

安装 Nginx 后创建 `/etc/nginx/sites-available/examxx.conf`。将 `exam.example.com` 换为真实域名，HTTPS 证书由 Certbot 或企业证书系统配置。

```nginx
server {
    listen 80;
    server_name exam.example.com;
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用并检查：

```bash
sudo ln -s /etc/nginx/sites-available/examxx.conf /etc/nginx/sites-enabled/examxx.conf
sudo nginx -t
sudo systemctl reload nginx
```

配置 HTTPS 后，在 `/etc/examxx/examxx.env` 增加以下两行并重启服务，使 Session Cookie 仅通过 HTTPS 发送：

```text
SERVER_FORWARD_HEADERS_STRATEGY=framework
SERVER_SERVLET_SESSION_COOKIE_SECURE=true
```

```bash
sudo systemctl restart examxx
```

## 6. 验收清单

```bash
sudo systemctl status examxx --no-pager
sudo journalctl -u examxx -n 100 --no-pager
curl -I http://127.0.0.1:8080/app/login
```

浏览器验收：

1. 访问 `https://<domain>/app/login`。
2. 使用管理员和学员各登录一次，确认角色菜单正确。
3. 新增、编辑一条试题并验证图片/附件上传。
4. 创建试卷、开始一次考试并提交。
5. 检查浏览器 Network 中 `/api/app/**` 请求均通过 HTTPS。

## 7. 升级与回滚

每次升级均先备份数据库和上传目录，再重新构建、上传并执行相同安装命令。安装脚本会在覆盖前保留上一版本 JAR。

```bash
# 升级后出现问题时回滚 JAR
sudo cp /opt/examxx/examxx.jar.previous /opt/examxx/examxx.jar
sudo chown examxx:examxx /opt/examxx/examxx.jar
sudo systemctl restart examxx
```

数据库备份和上传目录必须成对保存：

```bash
mysqldump --single-transaction --routines --triggers -h <mysql-host> -u <backup-user> -p examxx | gzip > examxx-$(date +%F).sql.gz
sudo tar -C /var/lib/examxx -czf examxx-uploads-$(date +%F).tar.gz uploads
```

定期在独立环境验证一次恢复流程。JAR 回滚不能回滚数据库结构或数据变更；涉及数据库变更时必须先制定对应的回滚 SQL。
