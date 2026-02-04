# Deploy с нуля (Ubuntu)

Ниже пошаговая инструкция для нового сервера, чтобы поднять сайт с нуля через наш `deploy-medgraft`.

## 1) DNS и порты
1. Создай A‑запись домена на IP сервера.
2. Проверь, включен ли UFW:
```bash
ufw status
```
3. Если UFW активен (или вы планируете его включить), открой 80/443:
```bash
ufw allow 'Nginx Full'
ufw enable
```

## 2) Базовые пакеты
```bash
apt update
apt install -y curl git nginx build-essential python3 certbot python3-certbot-nginx
```

## 3) Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
```

## 4) systemd unit
Файл: `/etc/systemd/system/medgraft.service`
```ini
[Unit]
Description=MedGraft Next.js app
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/medgraft
ExecStart=/usr/bin/node /var/www/medgraft/current/.next/standalone/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Активировать:
```bash
systemctl daemon-reload
systemctl enable medgraft.service
```

## 5) Nginx конфиг
Файл: `/etc/nginx/sites-available/medgraft`
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 25m;

    location /_next/static/ {
        alias /var/www/medgraft/current/.next/static/;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        add_header Cache-Control "no-store";
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }
}
```

Включить сайт:
```bash
ln -s /etc/nginx/sites-available/medgraft /etc/nginx/sites-enabled/medgraft
nginx -t && systemctl reload nginx
```

## 6) SSL сертификат
```bash
certbot --nginx -d YOUR_DOMAIN
```

## 7) Переменные окружения
Создай файл `/etc/medgraft.env`:
```
AUTH_SECRET=...
ONEC_BASE_URL=...
ONEC_AUTH_MODE=bearer
ONEC_BASIC_USER=...
ONEC_BASIC_PASSWORD=...
```

## 8) deploy‑скрипт
Скопируй файл `deploy-medgraft` на сервер в:
```
/var/www/medgraft/deploy-medgraft
```

Сделай исполняемым:
```bash
chmod +x /var/www/medgraft/deploy-medgraft
```

## 9) Первый деплой
```bash
/var/www/medgraft/deploy-medgraft
```

Что делает скрипт:
1. Клонирует репозиторий.
2. Собирает релиз в `/var/www/medgraft/releases`.
3. Переключает `current` атомарно.
4. Перезапускает systemd.
5. Делает health‑check и rollback при ошибке.
6. Патчит nginx (alias + `no-store`), если включено.

## 10) Standalone режим
В `next.config.ts` включен:
```ts
output: "standalone"
```

Если `standalone` отсутствует, скрипт автоматически переключится на:
```
next start -p 3000
```

## 11) Полезные проверки
```bash
systemctl status medgraft.service -n 50 --no-pager
nginx -T | sed -n '1,200p'
curl -I https://YOUR_DOMAIN/
```

## 12) Проверить на тестовом сервере перед продом
```bash
ls -la /var/www/medgraft/current/.next/standalone/server.js
systemctl status medgraft.service -n 50 --no-pager
curl -I http://127.0.0.1:3000/
```

## 13) Если репозиторий приватный
Используй deploy key или HTTPS URL с token.
