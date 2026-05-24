# Аудит приложения «Ветка» — лог изменений

## Карта приложения

### Экраны
| Путь | Компонент | Доступ |
|------|-----------|--------|
| `/` | HomePage | публичный |
| `/roadmaps` | RoadmapsPage | публичный |
| `/map/:slug` | RoadmapDetailsPage | публичный (гость без прогресса) |
| `/roadmaps/:slug` | LegacyRoadmapRedirectPage | redirect → `/map/:slug` |
| `/collection` | CollectionPage | публичный (localStorage) |
| `/map` | CurrentMapPage | публичный (redirect по localStorage) |
| `/login` | LoginPage | публичный |
| `/register` | RegisterPage | публичный |
| `/profile` | ProfilePage | protected |
| `/workshop/roadmaps` | AdminRoadmapsPage | protected |
| `/workshop/roadmaps/new` | AdminRoadmapNewPage | protected |
| `/workshop/roadmaps/:id/edit` | AdminRoadmapEditPage | protected |
| `/about` | AboutPage | публичный |

### API-эндпоинты
| Метод | Путь | Авторизация |
|-------|------|-------------|
| POST | /api/auth/register | — |
| POST | /api/auth/login | — |
| GET | /api/auth/me | JWT |
| PATCH | /api/auth/me/profile | JWT |
| GET | /api/roadmaps | — |
| GET | /api/roadmaps/:slug | — |
| GET | /api/progress/roadmaps | JWT |
| GET | /api/progress/roadmaps/:slug | JWT |
| PATCH | /api/progress/roadmaps/:slug/nodes/:id | JWT |
| PATCH | /api/progress/roadmaps/:slug/nodes/:id/note | JWT |
| GET | /api/admin/roadmaps | JWT |
| GET | /api/admin/roadmaps/:id | JWT |
| POST | /api/admin/roadmaps | JWT |
| PATCH | /api/admin/roadmaps/:id | JWT |
| DELETE | /api/admin/roadmaps/:id | JWT |
| POST | /api/admin/roadmaps/:id/nodes | JWT |
| PATCH | /api/admin/nodes/:id | JWT |
| DELETE | /api/admin/nodes/:id | JWT |
| POST | /api/admin/nodes/:id/resources | JWT |
| DELETE | /api/admin/resources/:id | JWT |

### Модель данных
```
users → roadmaps (author_id, RESTRICT)
roadmaps → roadmap_nodes (CASCADE)
roadmap_nodes → roadmap_nodes (parent_id, CASCADE — дерево)
roadmap_nodes → resources (CASCADE)
roadmap_nodes → user_node_progress (CASCADE)
users → user_node_progress (CASCADE)
roadmaps → user_node_progress (CASCADE)
roadmaps → roadmap_tag_links (CASCADE)
roadmap_tags → roadmap_tag_links (CASCADE)
```

### Ключевой сценарий
`/register` → `/login` → `/roadmaps` → `/map/:slug` → клик по шагу → изменение статуса → заметка → `/profile` (виден прогресс)

---

## Найденные проблемы и исправления

### BUG-01 — Авто-логин после регистрации отсутствует [КРИТИЧНЫЙ]
**Где:** `backend/app/routes/auth.py`, `frontend/src/pages/RegisterPage.tsx`  
**Суть:** После регистрации backend возвращает только `{"user": ...}` без токена. Frontend редиректит на `/login`, требуя от пользователя повторно заполнить форму. Это лишний шаг в ключевом онбординге.  
**Воспроизведение:** Зарегистрироваться → оказаться на `/login` → снова вводить credentials.  
**Последствие:** Friction на старте, часть пользователей уходит не зайдя.  
**Исправление:** Backend register endpoint теперь возвращает `access_token` (как login). Frontend хранит токен сразу после регистрации и редиректит на главную.

### BUG-02 — `minLength=8` на поле пароля в форме входа [СРЕДНИЙ]
**Где:** `frontend/src/pages/LoginPage.tsx`  
**Суть:** HTML-атрибут `minLength={8}` на поле пароля формы входа. При попытке войти с паролем < 8 символов браузер блокирует форму с кривым native tooltip, хотя сервер должен решать, верен ли пароль.  
**Последствие:** Часть пользователей не может войти через фронт, хотя аккаунт валиден (например, если пароль был создан другим путём или изменена политика).  
**Исправление:** Атрибут удалён из поля логина.

### BUG-03 — Отсутствуют кросс-ссылки между страницами входа и регистрации [СРЕДНИЙ UX]
**Где:** `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/RegisterPage.tsx`  
**Суть:** На странице входа нет ссылки «Нет аккаунта? Зарегистрироваться» и наоборот.  
**Последствие:** Пользователь, попавший не на ту страницу, вынужден искать путь через шапку.  
**Исправление:** Добавлены перекрёстные ссылки под кнопками обеих форм.

### BUG-04 — ProgressSummary показывает «Текущий шаг» когда карта пройдена 100% [СРЕДНИЙ UX]
**Где:** `frontend/src/features/roadmap-progress/ui/ProgressSummary.tsx`  
**Суть:** При `completionPercent === 100` блок «Текущий шаг» показывает последний шаг карты. Это вводит в заблуждение — пользователь видит «пройдено», но ниже написан «текущий шаг».  
**Исправление:** Блок скрывается при 100% прохождении, вместо него — поздравление.

### BUG-05 — Нет feedback'а о сохранении заметки [СРЕДНИЙ UX]
**Где:** `frontend/src/entities/roadmap/ui/RoadmapNodeDetailsPanel.tsx`  
**Суть:** После автосохранения заметки по blur появляется «Сохраняем заметку...», но после успеха нет подтверждения. Пользователь не знает, сохранилось ли.  
**Исправление:** После успешного сохранения показывается «Сохранено ✓» с автоматическим исчезновением.

### BUG-06 — В карточке роадмапа не отображается количество шагов [СЛАБЫЙ UX]
**Где:** `frontend/src/entities/roadmap/ui/RoadmapCard.tsx`  
**Суть:** Backend возвращает `steps_count`, тип `RoadmapSummary` содержит поле, но карточка его не показывает.  
**Исправление:** Добавлен бейдж «N шагов» в карточку.

### BUG-07 — Slugify не транслитерирует кириллицу [СЛАБЫЙ]
**Где:** `backend/app/services/admin_roadmap_service.py`  
**Суть:** Русские символы заменяются дефисами, и роадмап с русским заголовком получает slug вида `---2`.  
**Исправление:** Добавлена базовая таблица транслитерации кириллицы.

---

## Оценка безопасности (быстрая)
- Пароли хранятся в виде хеша (bcrypt/werkzeug) ✓
- JWT токены используются корректно ✓
- IDOR: admin-эндпоинты проверяют ownership через `_ensure_can_manage_roadmap` ✓
- Валидация входных данных есть на backend ✓
- Секреты не закоммичены (используются .env-файлы в .gitignore) ✓
- SQL-инъекции: SQLAlchemy ORM с параметризованными запросами ✓

---

## Резюме «до / после»

### До
- Регистрация требует 2 формы: сначала регистрация, потом вход вручную
- На форме входа `minLength=8` блокирует некоторых валидных пользователей
- Нет навигации между страницами входа/регистрации
- Прогресс-резюме показывает «Текущий шаг» у завершённой карты
- После сохранения заметки нет подтверждения
- В карточках библиотеки не видно количество шагов
- Русские названия карт дают уродливые slug'и типа `---2`

### После  
- Регистрация → автоматический вход → главная (1 шаг вместо 3)
- minLength убран с поля пароля логина
- Перекрёстные ссылки между формами входа/регистрации
- Завершённая карта показывает поздравление, не «текущий шаг»
- «Сохранено ✓» появляется после сохранения заметки
- Количество шагов видно в карточках библиотеки
- Кириллические заголовки транслитерируются в slug

---

## Оставлено на будущее
- **Avatar upload** — хранение base64 до 1.5MB в Postgres (Text). Для MVP работает, в production стоит перейти на S3/объектное хранилище.
- **Collection persistence** — коллекция в localStorage не синхронизирована с backend. При смене устройства теряется. Задел: добавить таблицу `user_saved_roadmaps`.
- **Premium/Referral** — на странице `/about` и в конце страницы карты логично место для premium CTA (расширенная аналитика прогресса, экспорт, шаблоны карт). Referral: на странице профиля, рядом с бейджем «Автор».
- **Search optimization** — полнотекстовый поиск сейчас через ILIKE, при росте базы нужен pg_trgm или elasticsearch.
- **Email verification** — регистрация без подтверждения email. Стоит добавить для продакшена.
