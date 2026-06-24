# My Days

My Days 是一个个人 Daily Recorder 项目：本地用 `daylog` 命令记录每天做了什么，上传到服务器 API，数据存进 PostgreSQL，网站用类似 GitHub contribution graph 的热力图展示。

## 项目结构

```txt
my-days/
  apps/
    web/   Next.js + TypeScript + Tailwind CSS + Prisma
    cli/   Node.js TypeScript CLI，命令名 daylog
```

核心链路：

```txt
本地 CLI -> API Token 鉴权 -> Next.js API -> Prisma -> PostgreSQL -> 网站热力图
```

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Node.js CLI
- PM2 / 1Panel / OpenResty 反向代理

## 本地安装依赖

```bash
npm install
```

项目使用 npm workspaces：

```txt
apps/web  网站和 API
apps/cli  本地命令行工具
```

## 本地数据库

推荐用 Docker Compose 启动 PostgreSQL：

```bash
docker compose up -d
```

默认数据库信息：

```txt
database: my_days
user: my_days_user
password: my_days_password
port: 5432
```

也可以自己安装 PostgreSQL，然后创建数据库：

```sql
CREATE DATABASE my_days;
```

## 环境变量

复制示例文件：

```bash
cp apps/web/.env.example apps/web/.env
```

编辑 `apps/web/.env`：

```env
DATABASE_URL="postgresql://my_days_user:my_days_password@localhost:5432/my_days"
MY_DAYS_API_TOKEN="change-this-token"
```

`MY_DAYS_API_TOKEN` 是 CLI 上传时使用的 API Token。不要提交真实 `.env` 到 GitHub。

## Prisma 数据库迁移

本地开发：

```bash
npm run prisma:generate
npm run prisma:migrate
```

服务器部署：

```bash
npm --workspace apps/web run prisma:deploy
```

当前主表是 `DayLog`，其中 `date` 唯一，所以同一天重复上传会更新旧记录，不会创建重复记录。

## 启动网站

开发模式：

```bash
npm run dev
```

打开：

```txt
http://localhost:3000
```

生产构建：

```bash
npm run build
npm --workspace apps/web run start
```

## CLI 使用

构建 CLI：

```bash
npm run cli:build
```

直接运行：

```bash
node apps/cli/dist/index.js help
```

本地 link 成 `daylog` 命令：

```bash
npm --workspace apps/cli link
```

之后可以直接运行：

```bash
daylog help
```

## 初始化 CLI

```bash
daylog init
```

它会创建：

```txt
~/.my-days/config.json
~/.my-days/drafts/
```

需要填写：

```txt
serverUrl: https://days.your-domain.com
apiToken: 和服务器 MY_DAYS_API_TOKEN 一样
```

本地测试时可以填：

```txt
serverUrl: http://localhost:3000
```

## 最方便的记录方式

推荐每天直接运行：

```bash
daylog done
```

它会完成两件事：

```txt
询问今天记录 -> 保存本地 draft -> 自动上传到服务器
```

如果想额外记录 vibe：

```bash
daylog done --vibe
```

上传成功后会显示当天详情页链接，例如：

```txt
View: https://days.mydarling.space/days/2026-06-25
```

## 添加今天的记录

```bash
daylog add
```

默认会询问：

- 今天做了什么？
- 明天要做什么？
- 额外想记录的内容？
- mood，支持 `good`、`normal`、`tired`、`sad`、`excited`
- tags，逗号分隔

mood 可以用缩写：

```txt
g -> good
n -> normal
t -> tired
s -> sad
e -> excited
```

直接回车默认是 `normal`。

如果想额外记录 vibe：

```bash
daylog add --vibe
```

草稿会保存到：

```txt
~/.my-days/drafts/YYYY-MM-DD.json
```

如果今天已经有 draft，CLI 会询问是否覆盖。

`daylog add` 保存 draft 后会继续询问：

```txt
Upload now? (Y/n):
```

直接回车会立即上传；输入 `n` 会只保存本地 draft。

## 上传今天的记录

```bash
daylog push
```

它会请求：

```txt
POST {serverUrl}/api/logs
Authorization: Bearer {apiToken}
```

上传失败时不会删除本地 draft。

## Windows 双击记录

项目根目录提供了：

```txt
record-my-day.bat
```

在 Windows 上可以双击它。它会自动进入项目目录并执行：

```bash
node apps\cli\dist\index.js done
```

如果改过 CLI 代码，记得先重新构建：

```bash
npm run cli:build
```

## 查看今天的本地 draft

```bash
daylog today
```

## 查看远程统计

```bash
daylog stats
```

会统计：

- 总记录天数
- 当前连续记录天数
- 本月记录天数
- 今年记录天数

## API

### `POST /api/logs`

创建或更新某一天的记录。需要 Header：

```txt
Authorization: Bearer MY_DAYS_API_TOKEN
```

请求 body：

```json
{
  "date": "2026-06-24",
  "today": "今天做了什么",
  "tomorrow": "明天要做什么",
  "notes": "额外想记录的内容",
  "vibe": "今天的状态",
  "mood": "good",
  "tags": ["coding", "life"]
}
```

`score` 会根据 `today + tomorrow + notes + vibe` 的总字符数自动计算：

```txt
空内容: 0
1-100: 1
101-300: 2
301-600: 3
600 以上: 4
```

### `GET /api/logs`

返回所有记录，用于首页热力图和最近 30 天列表。

### `GET /api/logs/YYYY-MM-DD`

返回某一天的记录。不存在则返回 `404`。

## 网站页面

首页包含：

- 标题和副标题
- 当前连续记录天数
- 总记录天数
- 本月记录天数
- 今年记录天数
- 带月份和星期标记的年度热力图
- 最近 30 天记录列表

详情页包含：

- 日期
- 今天做了什么
- 明天要做什么
- notes
- vibe
- mood
- tags
- createdAt / updatedAt，精确到分钟

## 1Panel 部署流程

假设主博客已经使用 `mydarling.space`，My Days 推荐使用子域名：

```txt
days.mydarling.space
```

### 1. DNS 解析

在域名服务商添加：

```txt
A    days    你的 VPS 公网 IP
```

### 2. 1Panel 安装 PostgreSQL

在 1Panel：

```txt
应用商店 -> PostgreSQL -> 安装
```

然后在：

```txt
数据库 -> PostgreSQL
```

创建数据库，例如：

```txt
数据库名: my_days
用户名: my_days
密码: 自己生成强密码
```

### 3. 拉取代码

SSH 到服务器：

```bash
cd /opt
git clone https://github.com/zm-moon/my_day.git my-days
cd my-days
```

### 4. 安装 Node.js 和 PM2

如果服务器还没有 Node.js：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2
```

检查：

```bash
node -v
npm -v
pm2 -v
```

### 5. 配置服务器环境变量

创建：

```bash
nano apps/web/.env
```

写入：

```env
DATABASE_URL="postgresql://my_days:你的数据库密码@127.0.0.1:5432/my_days"
MY_DAYS_API_TOKEN="换成一串很长的随机 token"
```

如果 1Panel 的 PostgreSQL 容器不能通过 `127.0.0.1` 访问，需要把 host 改成 1Panel 给出的容器内部地址。

### 6. 安装、迁移、构建

```bash
npm install
npm --workspace apps/web run prisma:deploy
npm run build
```

### 7. 用 PM2 启动

```bash
pm2 start npm --name my-days -- --workspace apps/web run start
pm2 save
pm2 startup
```

执行 `pm2 startup` 输出的那条命令。

查看状态：

```bash
pm2 status
pm2 logs my-days
```

### 8. 1Panel 反向代理

在 1Panel：

```txt
网站 -> 创建网站 -> 反向代理
```

填写：

```txt
域名: days.mydarling.space
端口: 80
代理地址: http + 127.0.0.1:3000
```

注意：如果左侧已经选择了 `http`，右侧输入框只填：

```txt
127.0.0.1:3000
```

不要填成：

```txt
http://127.0.0.1:3000
```

### 9. 配置 HTTPS

在 1Panel 给 `days.mydarling.space` 单独申请 Let's Encrypt 证书。

证书必须包含：

```txt
days.mydarling.space
```

不要误用只包含 `mydarling.space` 的证书，否则 CLI 会因为证书域名不匹配而 `fetch failed`。

配置完成后访问：

```txt
https://days.mydarling.space
```

## 更新服务器版本

本地修改后提交并 push 到 GitHub，然后服务器执行：

```bash
cd /opt/my-days
git pull
npm install
npm --workspace apps/web run prisma:deploy
npm run build
pm2 restart my-days
```

如果只改了 CLI，本地也要重新构建：

```bash
npm run cli:build
```

## PostgreSQL 备份

手动备份：

```bash
pg_dump "postgresql://my_days:你的数据库密码@127.0.0.1:5432/my_days" > my_days_$(date +%F).sql
```

恢复：

```bash
psql "postgresql://my_days:你的数据库密码@127.0.0.1:5432/my_days" < my_days_2026-06-24.sql
```

简单定时备份：

```bash
mkdir -p ~/backups/my-days
crontab -e
```

添加：

```cron
0 3 * * * pg_dump "postgresql://my_days:你的数据库密码@127.0.0.1:5432/my_days" > /root/backups/my-days/my_days_$(date +\%F).sql
```

建议定期把备份下载到本地或同步到对象存储。

## 注意事项

- 第一版没有登录系统。
- 写入 API 依靠 `MY_DAYS_API_TOKEN` 鉴权。
- 网站只读取 PostgreSQL，不读取本地 draft。
- CLI 上传失败会保留本地 draft。
- 用户可见日期统一使用 `YYYY-MM-DD`。
- 本地和服务器默认使用机器本地时区。
- `.env` 不要提交到 GitHub。
