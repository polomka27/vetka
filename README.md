# Ветка

Веб-приложение для структурированного обучения по картам развития (roadmaps). Выбираешь карту, проходишь шаги, отмечаешь прогресс, оставляешь заметки.

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Python 3.12, Flask 3, SQLAlchemy, Flask-JWT-Extended, Alembic, Flask-Limiter |
| Frontend | React 18, TypeScript, Vite, TanStack Query, React Router, Tailwind CSS |
| Граф карт | @xyflow/react + dagre |
| БД | PostgreSQL 16 |
| Deploy | Docker Compose + Nginx |

## Быстрый старт (Docker)

```bash
# 1. Скопируй конфиг и заполни секреты
cp .env.example .env
# Отредактируй .env: SECRET_KEY, JWT_SECRET_KEY, POSTGRES_PASSWORD, CORS_ORIGINS

# 2. Запусти
docker compose up -d

# Приложение доступно на http://localhost
```

## Локальная разработка

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # заполни POSTGRES_* под свою базу
flask db upgrade       # применить миграции
flask run              # http://127.0.0.1:5000
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env   # VITE_API_BASE_URL=/api (Vite проксирует на Flask)
npm run dev            # http://localhost:5173
```

## Структура

```
vetka/
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy-модели
│   │   ├── routes/       # Blueprint-роуты
│   │   ├── services/     # бизнес-логика
│   │   └── config.py
│   ├── migrations/       # Alembic
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── entities/     # roadmap, progress, user
│   │   ├── features/     # auth, collection, workshop
│   │   ├── pages/
│   │   ├── widgets/
│   │   └── shared/
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Переменные окружения

Все переменные описаны в `.env.example` (для Docker) и `backend/.env.example` (для локального dev).

Для production обязательны: `SECRET_KEY`, `JWT_SECRET_KEY`, `POSTGRES_PASSWORD`, `CORS_ORIGINS`.

## API

Основные эндпоинты:

| Метод | Путь | Авторизация |
|-------|------|-------------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| GET | `/api/auth/me` | JWT |
| GET | `/api/roadmaps` | — |
| GET | `/api/roadmaps/:slug` | — |
| POST/PATCH/DELETE | `/api/admin/roadmaps` | JWT |
| GET/POST | `/api/progress/:roadmap_slug` | JWT |

Полный список эндпоинтов — в `AUDIT_LOG.md`.
