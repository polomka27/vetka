#!/bin/bash
# Первичное получение SSL-сертификата Let's Encrypt.
# Запускать один раз на сервере перед `docker compose up -d`.

set -e

# Домен в Punycode (ветка.online -> xn--80adju3b.online)
# Проверить можно: python3 -c "print('ветка.online'.encode('idna').decode())"
DOMAINS="xn--80adju3b.online www.xn--80adju3b.online"
EMAIL="prodbysilentstill@gmail.com"
STAGING=0  # Поставь 1 для тестирования (не расходует лимит Let's Encrypt)

DATA_PATH="./certbot"

if [ -d "$DATA_PATH/conf/live/xn--80adju3b.online" ]; then
  read -p "Сертификат уже существует. Пересоздать? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

# Скачиваем рекомендованные параметры TLS от certbot
if [ ! -e "$DATA_PATH/conf/options-ssl-nginx.conf" ] || [ ! -e "$DATA_PATH/conf/ssl-dhparams.pem" ]; then
  echo "--- Загрузка рекомендованных TLS-параметров..."
  mkdir -p "$DATA_PATH/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    > "$DATA_PATH/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    > "$DATA_PATH/conf/ssl-dhparams.pem"
fi

# Создаём временный самоподписанный сертификат, чтобы nginx стартовал
echo "--- Создание временного самоподписанного сертификата..."
docker compose run --rm --entrypoint "sh -c 'mkdir -p /etc/letsencrypt/live/xn--80adju3b.online && openssl req -x509 -nodes -newkey rsa:4096 -days 1 -keyout /etc/letsencrypt/live/xn--80adju3b.online/privkey.pem -out /etc/letsencrypt/live/xn--80adju3b.online/fullchain.pem -subj /CN=localhost'" certbot

# Собираем образ и запускаем nginx с временным сертификатом
echo "--- Сборка и запуск nginx..."
docker compose up --build --force-recreate -d frontend

# Удаляем временный сертификат
echo "--- Удаление временного сертификата..."
docker compose run --rm --entrypoint "rm -Rf /etc/letsencrypt/live/xn--80adju3b.online \
  && rm -Rf /etc/letsencrypt/archive/xn--80adju3b.online \
  && rm -Rf /etc/letsencrypt/renewal/xn--80adju3b.online.conf" certbot

# Запрашиваем настоящий сертификат
echo "--- Получение сертификата Let's Encrypt..."
STAGING_ARG=""
if [ $STAGING != "0" ]; then
  STAGING_ARG="--staging"
fi

docker compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot \
  $STAGING_ARG \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d xn--80adju3b.online \
  -d www.xn--80adju3b.online" certbot

# Перезагружаем nginx с реальным сертификатом
echo "--- Перезагрузка nginx..."
docker compose exec frontend nginx -s reload

echo "--- Готово! SSL-сертификат установлен."
