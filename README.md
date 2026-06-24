# My Days

My Days is a small personal daily recorder: a local `daylog` CLI saves drafts, uploads them through a token-protected API, stores them in PostgreSQL with Prisma, and shows your year as a GitHub-style heatmap in a Next.js site.

## Project Layout

```txt
my-days/
  apps/
    web/   Next.js + TypeScript + Tailwind CSS + Prisma
    cli/   Node.js TypeScript CLI named daylog
```

## Install Dependencies

```bash
npm install
```

This repository uses npm workspaces. The web app lives in `apps/web`, and the CLI lives in `apps/cli`.

## Configure PostgreSQL Locally

Option A: use Docker Compose:

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with:

```txt
database: my_days
user: my_days_user
password: my_days_password
```

Option B: install PostgreSQL directly, then create a database:

```bash
createdb my_days
```

Or with `psql`:

```sql
CREATE DATABASE my_days;
```

## Configure Environment

Copy the example env file:

```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env`:

```env
DATABASE_URL="postgresql://my_days_user:my_days_password@localhost:5432/my_days"
MY_DAYS_API_TOKEN="change-this-token"
```

Use a long random token for `MY_DAYS_API_TOKEN`. The CLI will send it as:

```txt
Authorization: Bearer YOUR_TOKEN
```

## Run Prisma Migration

```bash
npm run prisma:generate
npm run prisma:migrate
```

The migration creates the `DayLog` table. Dates are handled as `YYYY-MM-DD` locally and stored as a unique Prisma `DateTime`.

## Start the Website

```bash
npm run dev
```

Open `http://localhost:3000`.

For production build:

```bash
npm run build
npm --workspace apps/web run start
```

## Build and Use the CLI

Build the CLI:

```bash
npm run cli:build
```

Run it directly:

```bash
node apps/cli/dist/index.js help
```

For a global local install during development:

```bash
npm --workspace apps/cli link
```

Then you can use:

```bash
daylog help
```

## Initialize CLI

```bash
daylog init
```

It creates:

```txt
~/.my-days/config.json
~/.my-days/drafts/
```

You will enter:

```txt
serverUrl: https://your-domain.com
apiToken: the same value as MY_DAYS_API_TOKEN
```

For local testing, use:

```txt
serverUrl: http://localhost:3000
```

## Add Today's Draft

```bash
daylog add
```

The CLI asks:

- 今天做了什么？
- 明天要做什么？
- 今日 vibe？
- mood: `good`, `normal`, `tired`, `sad`, `excited`
- tags: comma separated

It saves a draft to:

```txt
~/.my-days/drafts/YYYY-MM-DD.json
```

If a draft already exists for today, it asks before overwriting.

## Upload Today's Draft

```bash
daylog push
```

It posts to:

```txt
POST {serverUrl}/api/logs
```

If the upload fails, the local draft is kept and the CLI prints the error.

## Show Today's Draft

```bash
daylog today
```

## Show Remote Stats

```bash
daylog stats
```

It calls `GET {serverUrl}/api/logs` and prints:

- Total record days
- Current streak
- This month
- This year

## API

### `POST /api/logs`

Creates or updates one day. Requires:

```txt
Authorization: Bearer MY_DAYS_API_TOKEN
```

Body:

```json
{
  "date": "2026-06-24",
  "today": "今天做了什么",
  "tomorrow": "明天要做什么",
  "vibe": "今天的状态",
  "mood": "good",
  "tags": ["coding", "life"]
}
```

The API automatically calculates `score` from the character count of `today + tomorrow + vibe`:

- empty: `0`
- 1-100: `1`
- 101-300: `2`
- 301-600: `3`
- 600+: `4`

### `GET /api/logs`

Returns all logs for the homepage heatmap.

### `GET /api/logs/YYYY-MM-DD`

Returns one log or `404`.

## Ubuntu Server Deployment

These steps assume Ubuntu 22.04 or newer.

### Install Node.js

Install Node.js 22 with NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

### Install PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create database and user:

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE DATABASE my_days;
CREATE USER my_days_user WITH ENCRYPTED PASSWORD 'replace-this-password';
GRANT ALL PRIVILEGES ON DATABASE my_days TO my_days_user;
\q
```

### Upload Code and Install

Clone or upload the project:

```bash
git clone <your-repo-url> my-days
cd my-days
npm install
```

Create production env:

```bash
cp apps/web/.env.example apps/web/.env
nano apps/web/.env
```

Example:

```env
DATABASE_URL="postgresql://my_days_user:replace-this-password@localhost:5432/my_days"
MY_DAYS_API_TOKEN="use-a-long-random-token"
```

Run migrations and build:

```bash
npm --workspace apps/web run prisma:deploy
npm run build
```

### Keep the Site Running with PM2

Install PM2:

```bash
sudo npm install -g pm2
```

Start the web app:

```bash
pm2 start npm --name my-days -- --workspace apps/web run start
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`.

Check status:

```bash
pm2 status
pm2 logs my-days
```

### Alternative: systemd

Create a service:

```bash
sudo nano /etc/systemd/system/my-days.service
```

Example:

```ini
[Unit]
Description=My Days Next.js app
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/ubuntu/my-days/apps/web
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=ubuntu

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable my-days
sudo systemctl start my-days
sudo systemctl status my-days
```

## Nginx Reverse Proxy

Install Nginx:

```bash
sudo apt install -y nginx
```

Create a site:

```bash
sudo nano /etc/nginx/sites-available/my-days
```

Config:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/my-days /etc/nginx/sites-enabled/my-days
sudo nginx -t
sudo systemctl reload nginx
```

## Bind a Domain

At your DNS provider, create records:

```txt
A     your-domain.com       YOUR_SERVER_IP
CNAME www.your-domain.com   your-domain.com
```

After DNS resolves, visit:

```txt
http://your-domain.com
```

For HTTPS, install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## PostgreSQL Backups

Create a manual backup:

```bash
pg_dump "postgresql://my_days_user:replace-this-password@localhost:5432/my_days" > my_days_$(date +%F).sql
```

Restore:

```bash
psql "postgresql://my_days_user:replace-this-password@localhost:5432/my_days" < my_days_2026-06-24.sql
```

Simple daily backup cron:

```bash
mkdir -p ~/backups/my-days
crontab -e
```

Add:

```cron
0 3 * * * pg_dump "postgresql://my_days_user:replace-this-password@localhost:5432/my_days" > /home/ubuntu/backups/my-days/my_days_$(date +\%F).sql
```

Keep a copy outside the server too, such as object storage or another machine.

## Notes

- The first version intentionally has no login system.
- API write access is protected by `MY_DAYS_API_TOKEN`.
- The site reads from PostgreSQL, not local draft files.
- The CLI keeps drafts when upload fails.
- All user-facing dates use `YYYY-MM-DD`.
- Local date handling uses the machine/server local timezone.
