#!/bin/bash
# Первичное получение SSL-сертификата Let's Encrypt.
# Запускать один раз на сервере перед `docker compose up -d`.

set -e

# Домен в Punycode (ветка.online -> xn--e1afmkfd.online)
# Проверить можно: python3 -c "print('ветка.online'.encode('idna').decode())"
DOMAINS="xn--e1afmkfd.online www.xn--e1afmkfd.online"
EMAIL="prodbysilentstill@gmail.com"
STAGING=0  # Поставь 1 для тестирования (не расходует лимит Let's Encrypt)

DATA_PATH="./certbot"

if [ -d "$DATA_PATH/conf/live/xn--e1afmkfd.online" ]; then
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
docker compose run --rm --entrypoint "sh -c 'mkdir -p /etc/letsencrypt/live/xn--e1afmkfd.online && openssl req -x509 -nodes -newkey rsa:4096 -days 1 -keyout /etc/letsencrypt/live/xn--e1afmkfd.online/privkey.pem -out /etc/letsencrypt/live/xn--e1afmkfd.online/fullchain.pem -subj /CN=localhost'" certbot

# Запускаем nginx с временным сертификатом
echo "--- Запуск nginx..."
docker compose up --force-recreate -d frontend

# Удаляем временный сертификат
echo "--- Удаление временного сертификата..."
docker compose run --rm --entrypoint "rm -Rf /etc/letsencrypt/live/xn--e1afmkfd.online \
  && rm -Rf /etc/letsencrypt/archive/xn--e1afmkfd.online \
  && rm -Rf /etc/letsencrypt/renewal/xn--e1afmkfd.online.conf" certbot

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
  -d xn--e1afmkfd.online \
  -d www.xn--e1afmkfd.online" certbot

# Перезагружаем nginx с реальным сертификатом
echo "--- Перезагрузка nginx..."
docker compose exec frontend nginx -s reload

echo "--- Готово! SSL-сертификат установлен."
