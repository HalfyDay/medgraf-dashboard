# Deploy с нуля (Ubuntu)

Ниже пошаговая инструкция для нового сервера, чтобы поднять сайт с нуля через `deploy-medgraft`.

## 1) Домен, DNS и порты
1. Задай домен переменной (замени на свой домен):
Бесплатный домен можно создать на timeweb, там же можно его и купить и загрузить имеющийся.
После нужно привязать домен к проекту.
```bash
DOMAIN="test.1499383-cl93109.tw1.ru" # <-- замени на свой домен
```
2. Проверь DNS с сервера:
```bash
getent hosts "$DOMAIN"
```
3. Проверь UFW:
```bash
ufw status
```
4. Если UFW активен (или планируешь включить), открой 80/443:
```bash
ufw allow OpenSSH # <-- важно: иначе потеряешь доступ по SSH/SFTP
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
```bash
cat <<'UNIT' > /etc/systemd/system/medgraft.service
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
UNIT
```

Активировать:
```bash
systemctl daemon-reload
systemctl enable medgraft.service
```

## 5) Nginx (HTTP для certbot)
Сначала поднимаем HTTP-конфиг, чтобы certbot смог пройти проверку.
```bash
cat <<'NGINX' > /etc/nginx/sites-available/medgraft
server {
    listen 80;
    server_name YOUR_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }
}
NGINX

sed -i "s/YOUR_DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/medgraft
ln -s /etc/nginx/sites-available/medgraft /etc/nginx/sites-enabled/medgraft
nginx -t && systemctl reload nginx
```

## 6) SSL сертификат и финальный Nginx
Получаем сертификат:
```bash
certbot --nginx -d "$DOMAIN" # <-- домен из переменной
```

Если certbot сообщает про лимит Let's Encrypt (например, `too many certificates`), то:
1. Проверь конфиг через staging (не влияет на лимиты):
```bash
certbot --nginx --staging -d "$DOMAIN" # <-- домен из переменной
```
2. Дождись окна лимита и повтори обычный выпуск без `--staging`.

Если certbot пишет, что сертификат уже существует, выбирай вариант `1` (reinstall).

Если сначала выпускал staging, а потом нужен боевой:
```bash
certbot delete --cert-name "$DOMAIN" # <-- домен из переменной
certbot --nginx -d "$DOMAIN" # <-- домен из переменной
```

После этого применяем финальный HTTPS-конфиг:
```bash
cat <<'NGINX' > /etc/nginx/sites-available/medgraft
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

        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }
}
NGINX

sed -i "s/YOUR_DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/medgraft
nginx -t && systemctl reload nginx
```

## 7) Переменные окружения
Создай файл `/etc/medgraft.env`:
```bash
AUTH_SECRET=$(openssl rand -hex 32)
cat <<ENV > /etc/medgraft.env
AUTH_SECRET=$AUTH_SECRET
ONEC_BASE_URL=http://ob75av-o5lx9s-319rsf-umcclient.medgraft.ru/hs/umc_client
ONEC_AUTH_MODE=basic
ONEC_BASIC_USER=Test
ONEC_BASIC_PASSWORD=12345678
ENV

chmod 600 /etc/medgraft.env
```

Важно: не добавляй inline-комментарии в `.env` (например `VAR=value # comment`), они становятся частью значения.

Дай доступ на чтение для `www-data`:
```bash
chgrp www-data /etc/medgraft.env
chmod 640 /etc/medgraft.env
```

## 8) deploy-скрипт
Скопируй файл `deploy-medgraft` из репозитория на сервер в:
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
5. Делает health-check и rollback при ошибке.
6. ������ nginx (alias ��� `/_next/static`), ���� ��������.

######################################################

## 10) Чистый корень /var/www/medgraft (Ничего не делать)
В корне `/var/www/medgraft` не должно быть ручных артефактов сборки (старые `package.json`, `node_modules`, `next.config.*`), иначе Next.js может ошибочно выбрать workspace root.

Допустимые объекты в корне:
- `releases/`
- `current/`
- `shared/`
- `logs/`
- `.next` (symlink)
- `deploy-medgraft`

Очистка (разово):
```bash
rm -rf /var/www/medgraft/node_modules
rm -f /var/www/medgraft/package.json /var/www/medgraft/package-lock.json
rm -f /var/www/medgraft/next.config.* /var/www/medgraft/next-env.d.ts
```

## 11) Standalone режим (Ничего не делать)
В `next.config.ts` включен:
```ts
output: "standalone"
```

Если `standalone` отсутствует, скрипт автоматически переключится на:
```
next start -p 3000
```

## 12) Полезные проверки (Ничего не делать)
```bash
systemctl status medgraft.service -n 50 --no-pager
nginx -T | sed -n '1,200p'
curl -I https://$DOMAIN/
```

