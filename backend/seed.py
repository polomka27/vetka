import os

from app import create_app
from app.extensions import db
from app.models import Resource, Roadmap, RoadmapNode, RoadmapTag, RoadmapTagLink, User
from app.utils.security import hash_password


# Блок хранит учётные данные демо-администратора.
ADMIN_SEED = {
    "username": "admin",
    "email": "admin@vetka.dev",
    "password": "Admin12345!",
    "role": "admin",
}


# Блок хранит все демо-роадмапы, их теги, узлы и ресурсы.
ROADMAP_SEEDS = [
    {
        "slug": "python-backend",
        "title": "Python Backend",
        "short_description": "Пошаговый старт во Flask backend-разработке: Python, API, БД и продакшен-база.",
        "full_description": (
            "Роадмап для тех, кто хочет уверенно войти в backend-разработку на Python. "
            "Сначала закрываем базовый язык и окружение, затем переходим к HTTP, Flask, "
            "PostgreSQL, а в конце собираем минимальный production-ready API."
        ),
        "category": "backend",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "Python", "slug": "python"},
            {"name": "Flask", "slug": "flask"},
            {"name": "PostgreSQL", "slug": "postgresql"},
        ],
        "nodes": [
            {
                "title": "Основа Python",
                "description": "Разобраться с типами данных, функциями, модулями и virtualenv.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Python Tutorial",
                        "url": "https://docs.python.org/3/tutorial/",
                        "resource_type": "docs",
                        "position": 0,
                    },
                    {
                        "title": "Packaging and Virtual Environments",
                        "url": "https://packaging.python.org/en/latest/tutorials/installing-packages/",
                        "resource_type": "docs",
                        "position": 1,
                    },
                ],
                "children": [
                    {
                        "title": "Функции и структуры данных",
                        "description": "Повторить функции, списки, словари, comprehensions и работу с импортами.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "ООП и исключения",
                        "description": "Понять классы, inheritance, composition и обработку ошибок.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                ],
            },
            {
                "title": "Flask API",
                "description": "Собрать приложение через app factory, blueprints и JSON API.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Flask Documentation",
                        "url": "https://flask.palletsprojects.com/",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Маршруты и blueprint'ы",
                        "description": "Разделить API по доменам и научиться возвращать чистый JSON.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "JWT-аутентификация",
                        "description": "Добавить логин, protected routes и текущего пользователя.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Flask-JWT-Extended Basics",
                                "url": "https://flask-jwt-extended.readthedocs.io/en/stable/basic_usage.html",
                                "resource_type": "docs",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    },
                ],
            },
            {
                "title": "PostgreSQL и деплой-база",
                "description": "Подключить PostgreSQL, миграции и подготовить приложение к запуску.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "PostgreSQL Tutorial",
                        "url": "https://www.postgresql.org/docs/current/tutorial-start.html",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "SQLAlchemy и миграции",
                        "description": "Описать модели, прогнать Flask-Migrate и зафиксировать схему.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "Логи, конфиги и прод-сборка",
                        "description": "Разнести конфиги, env и подготовить backend к деплою.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": True,
                        "resources": [],
                        "children": [],
                    },
                ],
            },
        ],
    },
    {
        "slug": "product-manager",
        "title": "Product Manager",
        "short_description": "Разветвлённый roadmap продуктового менеджера: Discovery, Strategy, Delivery и Growth & Leadership.",
        "full_description": (
            "Роадмап для тех, кто хочет системно войти в профессию продуктового менеджера. "
            "Карта построена вокруг четырёх крупных направлений: discovery, strategy, "
            "delivery и growth/leadership. Внутри каждой ветки лежат ключевые темы, "
            "которые помогают пройти путь от понимания пользователя до управления продуктом."
        ),
        "category": "product",
        "level": "middle",
        "is_published": True,
        "tags": [
            {"name": "Product", "slug": "product"},
            {"name": "Discovery", "slug": "discovery"},
            {"name": "Analytics", "slug": "analytics"},
        ],
        "nodes": [
            {
                "title": "Product Manager Roadmap",
                "description": "Общий корень карты: профессия PM как система решений про пользователя, бизнес, команду и рост продукта.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Product Management Basics",
                        "url": "https://www.atlassian.com/agile/product-management",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "1. Discovery",
                        "description": "Ветка про понимание пользователя, поиск проблем и формулировку ценности.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Continuous Discovery Habits",
                                "url": "https://www.producttalk.org/continuous-discovery/",
                                "resource_type": "guide",
                                "position": 0,
                            }
                        ],
                        "children": [
                            {
                                "title": "2. Продуктовое мышление",
                                "description": "Собрать базовую рамку мышления: outcome, ценность для пользователя и ответственность за результат.",
                                "content_type": "article",
                                "position": 0,
                                "is_optional": False,
                                "resources": [
                                    {
                                        "title": "Outcome over Output",
                                        "url": "https://www.svpg.com/product-vs-feature-teams/",
                                        "resource_type": "article",
                                        "position": 0,
                                    }
                                ],
                                "children": [],
                            },
                            {
                                "title": "3. Пользователь и сегменты",
                                "description": "Разобраться, для кого строится продукт: сегменты, контекст использования, jobs и различия аудиторий.",
                                "content_type": "article",
                                "position": 1,
                                "is_optional": False,
                                "resources": [
                                    {
                                        "title": "Jobs to Be Done",
                                        "url": "https://www.intercom.com/blog/jobs-to-be-done/",
                                        "resource_type": "article",
                                        "position": 0,
                                    }
                                ],
                                "children": [
                                    {
                                        "title": "4. CustDev и проблемные интервью",
                                        "description": "Освоить интервью, наблюдение и синтез инсайтов, чтобы находить реальные боли пользователей.",
                                        "content_type": "article",
                                        "position": 0,
                                        "is_optional": False,
                                        "resources": [
                                            {
                                                "title": "The Mom Test Summary",
                                                "url": "https://review.firstround.com/the-mom-test-how-to-talk-to-customers-learn-if-your-business-is-a-good-idea-when-everyone-is-lying-to-you/",
                                                "resource_type": "article",
                                                "position": 0,
                                            }
                                        ],
                                        "children": [
                                            {
                                                "title": "5. Ценность и positioning",
                                                "description": "Сформулировать, какую ценность даёт продукт, для кого он существует и почему его выберут среди альтернатив.",
                                                "content_type": "article",
                                                "position": 0,
                                                "is_optional": False,
                                                "resources": [
                                                    {
                                                        "title": "Value Proposition Guide",
                                                        "url": "https://www.strategyzer.com/library/the-value-proposition-canvas",
                                                        "resource_type": "guide",
                                                        "position": 0,
                                                    }
                                                ],
                                                "children": [],
                                            }
                                        ],
                                    }
                                ],
                            }
                        ],
                    }
                    ,
                    {
                        "title": "6. Strategy",
                        "description": "Ветка про метрики, стратегию, приоритизацию и сборку осмысленного roadmap.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Good Product Strategy",
                                "url": "https://www.svpg.com/good-product-strategy-bad-product-strategy/",
                                "resource_type": "article",
                                "position": 0,
                            }
                        ],
                        "children": [
                            {
                                "title": "7. Метрики продукта",
                                "description": "Понять North Star Metric, воронки, activation, retention и базовую систему наблюдения за продуктом.",
                                "content_type": "article",
                                "position": 0,
                                "is_optional": False,
                                "resources": [
                                    {
                                        "title": "North Star Metric",
                                        "url": "https://amplitude.com/blog/north-star-metric",
                                        "resource_type": "article",
                                        "position": 0,
                                    }
                                ],
                                "children": [],
                            },
                            {
                                "title": "8. Приоритизация решений",
                                "description": "Научиться выбирать, что делать сейчас, а что откладывать, с опорой на impact, effort, risk и стратегический фокус.",
                                "content_type": "article",
                                "position": 1,
                                "is_optional": False,
                                "resources": [
                                    {
                                        "title": "RICE Framework",
                                        "url": "https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/",
                                        "resource_type": "guide",
                                        "position": 0,
                                    }
                                ],
                                "children": [],
                            },
                            {
                                "title": "9. Roadmap и стратегический фокус",
                                "description": "Собрать roadmap, который отражает стратегию и связи между инициативами, а не просто список задач.",
                                "content_type": "article",
                                "position": 2,
                                "is_optional": False,
                                "resources": [],
                                "children": [],
                            },
                        ],
                    },
                    {
                        "title": "10. Delivery",
                        "description": "Ветка про работу с дизайном и разработкой, запуск и доведение решений до результата.",
                        "content_type": "article",
                        "position": 2,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Product Trio",
                                "url": "https://www.producttalk.org/2021/05/product-trio/",
                                "resource_type": "article",
                                "position": 0,
                            }
                        ],
                        "children": [
                            {
                                "title": "11. Delivery с дизайном и разработкой",
                                "description": "Выстроить совместную работу discovery и delivery, снять разрывы между проработкой и реализацией.",
                                "content_type": "article",
                                "position": 0,
                                "is_optional": False,
                                "resources": [],
                                "children": [],
                            },
                            {
                                "title": "12. Запуск и go-to-market",
                                "description": "Подготовить релиз, коммуникацию, критерии успеха и измерение эффекта после запуска.",
                                "content_type": "article",
                                "position": 1,
                                "is_optional": False,
                                "resources": [
                                    {
                                        "title": "Product Launch Checklist",
                                        "url": "https://www.atlassian.com/blog/productivity/product-launch-checklist",
                                        "resource_type": "guide",
                                        "position": 0,
                                    }
                                ],
                                "children": [],
                            },
                        ],
                    },
                    {
                        "title": "Growth & Leadership",
                        "description": "Дополнительная верхняя ветка про рост продукта, аналитику, UX-мышление и работу со стейкхолдерами.",
                        "content_type": "article",
                        "position": 3,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Experimentation for Product Teams",
                                "url": "https://www.optimizely.com/optimization-glossary/experimentation/",
                                "resource_type": "guide",
                                "position": 0,
                            }
                        ],
                        "children": [
                            {
                                "title": "Побочная ветка: SQL и продуктовая аналитика",
                                "description": "Освоить минимальный аналитический стек PM: события, таблицы, базовые SQL-запросы и чтение воронок.",
                                "content_type": "article",
                                "position": 0,
                                "is_optional": True,
                                "resources": [
                                    {
                                        "title": "SQLBolt Lessons",
                                        "url": "https://sqlbolt.com/",
                                        "resource_type": "practice",
                                        "position": 0,
                                    }
                                ],
                                "children": [],
                            },
                            {
                                "title": "Побочная ветка: CJM и UX-мышление",
                                "description": "Понять путь пользователя, фрикции и качество опыта через customer journey map и базовые UX-артефакты.",
                                "content_type": "article",
                                "position": 1,
                                "is_optional": True,
                                "resources": [
                                    {
                                        "title": "Customer Journey Mapping",
                                        "url": "https://www.nngroup.com/articles/customer-journey-mapping/",
                                        "resource_type": "guide",
                                        "position": 0,
                                    }
                                ],
                                "children": [],
                            },
                            {
                                "title": "Побочная ветка: Stakeholder Management",
                                "description": "Прокачать работу с ожиданиями стейкхолдеров, конфликтами приоритетов и защитой продуктового фокуса.",
                                "content_type": "article",
                                "position": 2,
                                "is_optional": True,
                                "resources": [
                                    {
                                        "title": "Stakeholder Management for PMs",
                                        "url": "https://www.svpg.com/teams-stakeholders-people/",
                                        "resource_type": "article",
                                        "position": 0,
                                    }
                                ],
                                "children": [],
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        "slug": "frontend-basics",
        "title": "Frontend Basics",
        "short_description": "Старт во frontend: HTML, CSS, JavaScript, React и работа с API.",
        "full_description": (
            "Роадмап для новичка во frontend. Начинаем с семантической вёрстки и CSS, "
            "после этого переходим к JavaScript, React и интеграции с backend API."
        ),
        "category": "frontend",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "HTML", "slug": "html"},
            {"name": "CSS", "slug": "css"},
            {"name": "React", "slug": "react"},
        ],
        "nodes": [
            {
                "title": "HTML и семантика",
                "description": "Понять структуру документа, формы, ссылки и базовую доступность.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "MDN HTML Introduction",
                        "url": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Формы и элементы ввода",
                        "description": "Разобраться с input, label, validation и отправкой форм.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "CSS и адаптивность",
                "description": "Освоить box model, flex, grid и адаптивную вёрстку.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "CSS Flexbox Guide",
                        "url": "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
                        "resource_type": "guide",
                        "position": 0,
                    },
                    {
                        "title": "CSS Grid Guide",
                        "url": "https://css-tricks.com/snippets/css/complete-guide-grid/",
                        "resource_type": "guide",
                        "position": 1,
                    },
                ],
                "children": [],
            },
            {
                "title": "JavaScript и React",
                "description": "Собрать компонентное мышление, состояние и работу с API на React.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "React Learn",
                        "url": "https://react.dev/learn",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Состояние и события",
                        "description": "Понять state, props, controlled inputs и базовые хуки.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "Запросы к API",
                        "description": "Научиться загружать данные и обрабатывать loading/error состояния.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "TanStack Query Overview",
                                "url": "https://tanstack.com/query/latest/docs/framework/react/overview",
                                "resource_type": "docs",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    },
                ],
            },
        ],
    },
    {
        "slug": "sql-fundamentals",
        "title": "SQL Fundamentals",
        "short_description": "Основы SQL для прикладной разработки: select, join, group by и индексы.",
        "full_description": (
            "Практический роадмап по SQL. Закрываем фундамент чтения данных, потом "
            "переходим к join'ам, агрегациям и оптимизации запросов."
        ),
        "category": "database",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "SQL", "slug": "sql"},
            {"name": "Databases", "slug": "databases"},
            {"name": "Querying", "slug": "querying"},
        ],
        "nodes": [
            {
                "title": "SELECT и фильтрация",
                "description": "Научиться читать таблицы, выбирать колонки и фильтровать строки.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "SQLBolt Lessons",
                        "url": "https://sqlbolt.com/",
                        "resource_type": "practice",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "ORDER BY, LIMIT, DISTINCT",
                        "description": "Закрепить сортировку, ограничение выборки и уникальные значения.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "JOIN и работа с несколькими таблицами",
                "description": "Понять связи данных и научиться собирать полезные выборки.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "PostgreSQL Joins Tutorial",
                        "url": "https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-joins/",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "GROUP BY и производительность",
                "description": "Разобраться с агрегациями, индексами и анализом плана запроса.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Use The Index, Luke",
                        "url": "https://use-the-index-luke.com/",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "COUNT, SUM, AVG",
                        "description": "Научиться считать агрегаты и комбинировать их с группировкой.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "EXPLAIN и индексы",
                        "description": "Понять, как база исполняет запрос и где помогают индексы.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": True,
                        "resources": [],
                        "children": [],
                    },
                ],
            },
        ],
    },
    # ──────────────────────────────────────────────────────────── 5 ────
    {
        "slug": "typescript",
        "title": "TypeScript",
        "short_description": "Полноценный TypeScript: базовые типы, Generics, Utility Types и интеграция с React.",
        "full_description": (
            "Роадмап охватывает TypeScript с нуля: примитивы, интерфейсы, narrowing, generics, "
            "utility types и настройка tsconfig. В конце — практика в связке с React."
        ),
        "category": "frontend",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "TypeScript", "slug": "typescript"},
            {"name": "JavaScript", "slug": "javascript"},
            {"name": "React", "slug": "react"},
        ],
        "nodes": [
            {
                "title": "Базовые типы",
                "description": "Освоить примитивы, массивы, tuple, union, intersection и type aliases.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "TypeScript Handbook: Everyday Types",
                        "url": "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Интерфейсы и type aliases",
                        "description": "Понять разницу между interface и type, когда что применять.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "Narrowing и type guards",
                        "description": "strictNullChecks, typeof, instanceof и пользовательские guard-функции.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Narrowing",
                                "url": "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
                                "resource_type": "docs",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    },
                ],
            },
            {
                "title": "Generics",
                "description": "Параметризованные типы, constraints и generic-функции.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Generics",
                        "url": "https://www.typescriptlang.org/docs/handbook/2/generics.html",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Utility Types",
                        "description": "Partial, Required, Pick, Omit, Record, ReturnType и другие встроенные хелперы.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Utility Types Reference",
                                "url": "https://www.typescriptlang.org/docs/handbook/utility-types.html",
                                "resource_type": "docs",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    }
                ],
            },
            {
                "title": "TypeScript + React",
                "description": "Типизировать компоненты, хуки, события и контекст.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "React TypeScript Cheatsheet",
                        "url": "https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/basic_type_example",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Props и useRef с типами",
                        "description": "Prop-интерфейсы, типизация ref-объектов и forwardRef.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "Типизация событий и форм",
                        "description": "MouseEvent, ChangeEvent, FormEvent и кастомные обработчики.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                ],
            },
            {
                "title": "tsconfig и инструментарий",
                "description": "Strict mode, пути, target и интеграция с Vite.",
                "content_type": "article",
                "position": 3,
                "is_optional": True,
                "resources": [
                    {
                        "title": "tsconfig Reference",
                        "url": "https://www.typescriptlang.org/tsconfig",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [],
            },
        ],
    },
    # ──────────────────────────────────────────────────────────── 6 ────
    {
        "slug": "nodejs-backend",
        "title": "Node.js Backend",
        "short_description": "Node.js от основ до production API: Express, PostgreSQL через Prisma и JWT-авторизация.",
        "full_description": (
            "Маршрут для тех, кто строит backend на Node.js. "
            "Начинаем с event loop и модульной системы, затем REST API на Express, "
            "база данных через Prisma, JWT-аутентификация и деплой."
        ),
        "category": "backend",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "Node.js", "slug": "nodejs"},
            {"name": "Express", "slug": "express"},
            {"name": "JavaScript", "slug": "javascript"},
        ],
        "nodes": [
            {
                "title": "Node.js и модульная система",
                "description": "Event loop, CommonJS / ESM, npm и встроенные модули fs, path, http.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Node.js Docs",
                        "url": "https://nodejs.org/en/docs",
                        "resource_type": "docs",
                        "position": 0,
                    },
                    {
                        "title": "Event Loop Explained",
                        "url": "https://nodejs.org/en/guides/event-loop-timers-and-nexttick",
                        "resource_type": "guide",
                        "position": 1,
                    },
                ],
                "children": [
                    {
                        "title": "Async и Promises",
                        "description": "Callbacks, Promise, async/await и обработка ошибок в асинхронном коде.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "Express.js и REST API",
                "description": "Маршруты, middleware, обработка ошибок и структура JSON API.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Express Guide",
                        "url": "https://expressjs.com/en/guide/routing.html",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Middleware и error handler",
                        "description": "Цепочка middleware, глобальный error handler и структура ответов API.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "Валидация через zod",
                        "description": "Парсить и валидировать входные данные на границе запроса.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Zod Documentation",
                                "url": "https://zod.dev/",
                                "resource_type": "docs",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    },
                ],
            },
            {
                "title": "База данных с Prisma",
                "description": "PostgreSQL, схема, миграции и CRUD-запросы через Prisma Client.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Prisma Getting Started",
                        "url": "https://www.prisma.io/docs/getting-started",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Связи и вложенные запросы",
                        "description": "One-to-many, many-to-many, include и select в Prisma Client.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "JWT-аутентификация",
                "description": "Регистрация, логин, refresh-токены и защищённые маршруты.",
                "content_type": "article",
                "position": 3,
                "is_optional": False,
                "resources": [
                    {
                        "title": "jsonwebtoken (npm)",
                        "url": "https://github.com/auth0/node-jsonwebtoken",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "Окружение и деплой",
                "description": "dotenv, разделение конфигов, Docker-образ и деплой на VPS.",
                "content_type": "article",
                "position": 4,
                "is_optional": True,
                "resources": [
                    {
                        "title": "dotenv",
                        "url": "https://github.com/motdotla/dotenv",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [],
            },
        ],
    },
    # ──────────────────────────────────────────────────────────── 7 ────
    {
        "slug": "devops-basics",
        "title": "DevOps Basics",
        "short_description": "Linux, Docker, CI/CD с GitHub Actions и базовый деплой на VPS — минимальный DevOps-маршрут.",
        "full_description": (
            "Маршрут для разработчика, который хочет уверенно разворачивать и поддерживать сервисы. "
            "Начинаем с Linux и командной строки, затем Docker и автоматизация через GitHub Actions."
        ),
        "category": "devops",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "Docker", "slug": "docker"},
            {"name": "Linux", "slug": "linux"},
            {"name": "CI/CD", "slug": "cicd"},
        ],
        "nodes": [
            {
                "title": "Linux и командная строка",
                "description": "Файловая система, процессы, права, SSH и базовая автоматизация через bash.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "The Linux Command Line (бесплатная книга)",
                        "url": "https://linuxcommand.org/tlcl.php",
                        "resource_type": "guide",
                        "position": 0,
                    },
                    {
                        "title": "OverTheWire: Bandit (практика)",
                        "url": "https://overthewire.org/wargames/bandit/",
                        "resource_type": "practice",
                        "position": 1,
                    },
                ],
                "children": [
                    {
                        "title": "Bash-скрипты",
                        "description": "Переменные, условия, циклы — простые скрипты для автоматизации.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "Docker",
                "description": "Контейнеры, образы, Dockerfile и Docker Compose для локальной разработки.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Docker Getting Started",
                        "url": "https://docs.docker.com/get-started/",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Dockerfile и слои образа",
                        "description": "Написать Dockerfile, понять кэширование слоёв и уменьшение размера образа.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Dockerfile Best Practices",
                                "url": "https://docs.docker.com/build/building/best-practices/",
                                "resource_type": "docs",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    },
                    {
                        "title": "Docker Compose",
                        "description": "Описать app + db + cache и поднять всё одной командой.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Docker Compose Overview",
                                "url": "https://docs.docker.com/compose/",
                                "resource_type": "docs",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    },
                ],
            },
            {
                "title": "CI/CD с GitHub Actions",
                "description": "Автоматизировать линтер, тесты и деплой при push в репозиторий.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "GitHub Actions Quickstart",
                        "url": "https://docs.github.com/en/actions/writing-workflows/quickstart",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Пайплайн деплоя",
                        "description": "Build → test → push Docker image → деплой на сервер по SSH.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "VPS, Nginx и HTTPS",
                "description": "Развернуть приложение на VPS, настроить reverse proxy и сертификат Let's Encrypt.",
                "content_type": "article",
                "position": 3,
                "is_optional": True,
                "resources": [
                    {
                        "title": "Nginx Beginner Guide",
                        "url": "https://nginx.org/en/docs/beginners_guide.html",
                        "resource_type": "docs",
                        "position": 0,
                    },
                    {
                        "title": "Let's Encrypt: Certbot",
                        "url": "https://certbot.eff.org/",
                        "resource_type": "guide",
                        "position": 1,
                    },
                ],
                "children": [],
            },
        ],
    },
    # ──────────────────────────────────────────────────────────── 8 ────
    {
        "slug": "ux-ui-design",
        "title": "UX/UI Design",
        "short_description": "Путь в дизайн интерфейсов: исследования, визуальный дизайн, Figma и первое портфолио.",
        "full_description": (
            "Маршрут для тех, кто хочет войти в UX/UI. Начинаем с UX-мышления "
            "и пользовательских исследований, затем визуальный дизайн и Figma."
        ),
        "category": "design",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "UX", "slug": "ux"},
            {"name": "Figma", "slug": "figma"},
            {"name": "UI Design", "slug": "ui-design"},
        ],
        "nodes": [
            {
                "title": "Основы UX-мышления",
                "description": "Что такое user experience, зачем нужен дизайн и как мыслить от задачи пользователя.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Nielsen Norman: What is UX?",
                        "url": "https://www.nngroup.com/articles/definition-user-experience/",
                        "resource_type": "article",
                        "position": 0,
                    },
                    {
                        "title": "10 Usability Heuristics",
                        "url": "https://www.nngroup.com/articles/ten-usability-heuristics/",
                        "resource_type": "guide",
                        "position": 1,
                    },
                ],
                "children": [
                    {
                        "title": "Пользовательские исследования",
                        "description": "Интервью, юзабилити-тесты и синтез инсайтов в actionable выводы.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "UX Research Methods",
                                "url": "https://www.nngroup.com/articles/which-ux-research-methods/",
                                "resource_type": "guide",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    }
                ],
            },
            {
                "title": "Визуальный дизайн",
                "description": "Типографика, цвет, пространство и визуальная иерархия — базовый фундамент UI.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Refactoring UI",
                        "url": "https://www.refactoringui.com/",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Сетки и отступы",
                        "description": "8pt-сетка, column grid и консистентные отступы.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "Компонентный подход",
                        "description": "Строить UI из переиспользуемых блоков: кнопки, формы, карточки, навигация.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                ],
            },
            {
                "title": "Figma",
                "description": "Фреймы, компоненты, auto-layout, варианты и прототипирование.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Figma for Beginners",
                        "url": "https://www.figma.com/resource-library/figma-for-beginners/",
                        "resource_type": "guide",
                        "position": 0,
                    },
                    {
                        "title": "Figma Community",
                        "url": "https://www.figma.com/community",
                        "resource_type": "practice",
                        "position": 1,
                    },
                ],
                "children": [
                    {
                        "title": "Auto-layout и компоненты",
                        "description": "Понять auto-layout, variants и основы design system в Figma.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "Прототипирование",
                        "description": "Связать экраны переходами и собрать кликабельный прототип для тестирования.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                ],
            },
            {
                "title": "Доступность (a11y)",
                "description": "Проектировать интерфейсы, которые работают для пользователей с ограниченными возможностями.",
                "content_type": "article",
                "position": 3,
                "is_optional": True,
                "resources": [
                    {
                        "title": "WCAG Quick Reference",
                        "url": "https://www.w3.org/WAI/WCAG22/quickref/",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "Портфолио дизайнера",
                "description": "Собрать 2–3 кейса с процессом, решениями и измеримым результатом.",
                "content_type": "article",
                "position": 4,
                "is_optional": True,
                "resources": [
                    {
                        "title": "UX Portfolio Guide — NN/g",
                        "url": "https://www.nngroup.com/articles/ux-portfolios/",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [],
            },
        ],
    },
    # ──────────────────────────────────────────────────────────── 9 ────
    {
        "slug": "data-science",
        "title": "Data Science: Python + ML",
        "short_description": "Python для анализа данных, визуализация, машинное обучение и оценка моделей.",
        "full_description": (
            "Маршрут для тех, кто хочет начать в Data Science. Начинаем с NumPy и Pandas, "
            "добавляем визуализацию, строим первые ML-модели в scikit-learn."
        ),
        "category": "data",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "Python", "slug": "python"},
            {"name": "Machine Learning", "slug": "machine-learning"},
            {"name": "Data Science", "slug": "data-science"},
        ],
        "nodes": [
            {
                "title": "Python для анализа данных",
                "description": "NumPy, Pandas и Jupyter Notebook — основной стек аналитика.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "NumPy User Guide",
                        "url": "https://numpy.org/doc/stable/user/index.html",
                        "resource_type": "docs",
                        "position": 0,
                    },
                    {
                        "title": "Pandas Getting Started",
                        "url": "https://pandas.pydata.org/docs/getting_started/index.html",
                        "resource_type": "docs",
                        "position": 1,
                    },
                ],
                "children": [
                    {
                        "title": "Jupyter Notebooks",
                        "description": "Ячейки, markdown, inline-визуализация и %magic-команды.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "JupyterLab Overview",
                                "url": "https://jupyterlab.readthedocs.io/en/stable/getting_started/overview.html",
                                "resource_type": "docs",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    },
                    {
                        "title": "Очистка и трансформация данных",
                        "description": "Пропуски, дубликаты, типы, groupby и pivot в Pandas.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                ],
            },
            {
                "title": "Визуализация данных",
                "description": "Информативные графики через Matplotlib и Seaborn.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Matplotlib Tutorials",
                        "url": "https://matplotlib.org/stable/tutorials/index.html",
                        "resource_type": "docs",
                        "position": 0,
                    },
                    {
                        "title": "Seaborn Tutorial",
                        "url": "https://seaborn.pydata.org/tutorial.html",
                        "resource_type": "docs",
                        "position": 1,
                    },
                ],
                "children": [],
            },
            {
                "title": "Основы Machine Learning",
                "description": "Supervised/unsupervised learning и первые модели через scikit-learn.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "scikit-learn User Guide",
                        "url": "https://scikit-learn.org/stable/user_guide.html",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Классификация и регрессия",
                        "description": "Логистическая регрессия и дерево решений — обучение, предсказание и интерпретация.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                    {
                        "title": "Оценка модели",
                        "description": "Train/test split, cross-validation, accuracy, precision, recall и F1.",
                        "content_type": "article",
                        "position": 1,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    },
                ],
            },
            {
                "title": "Feature Engineering",
                "description": "Кодирование категорий, масштабирование признаков и отбор наиболее важных.",
                "content_type": "article",
                "position": 3,
                "is_optional": False,
                "resources": [],
                "children": [],
            },
            {
                "title": "Нейронные сети: введение",
                "description": "Перцептрон, backpropagation и первая сеть на PyTorch.",
                "content_type": "article",
                "position": 4,
                "is_optional": True,
                "resources": [
                    {
                        "title": "PyTorch Tutorials",
                        "url": "https://pytorch.org/tutorials/beginner/basics/intro.html",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [],
            },
        ],
    },
    # ─────────────────────────────────────────────────────────── 10 ────
    {
        "slug": "git-github",
        "title": "Git & GitHub",
        "short_description": "Git от нуля до командной работы: коммиты, ветки, pull requests и разрешение конфликтов.",
        "full_description": (
            "Фундаментальный маршрут по Git для любого разработчика. "
            "Базовые операции, ветки, командные процессы на GitHub и продвинутые техники."
        ),
        "category": "tools",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "Git", "slug": "git"},
            {"name": "GitHub", "slug": "github"},
            {"name": "Version Control", "slug": "version-control"},
        ],
        "nodes": [
            {
                "title": "Основы Git",
                "description": "init, add, commit, log — и зачем вообще нужен контроль версий.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Pro Git (бесплатная книга)",
                        "url": "https://git-scm.com/book/ru/v2",
                        "resource_type": "guide",
                        "position": 0,
                    },
                    {
                        "title": "Learn Git Branching (интерактив)",
                        "url": "https://learngitbranching.js.org/?locale=ru_RU",
                        "resource_type": "practice",
                        "position": 1,
                    },
                ],
                "children": [
                    {
                        "title": "Staging area и .gitignore",
                        "description": "Рабочая директория, индекс, HEAD и исключение ненужных файлов.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "Ветки и слияние",
                "description": "Создавать, переключать и сливать ветки, решать конфликты вручную.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Git Branching (Pro Git)",
                        "url": "https://git-scm.com/book/ru/v2",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Разрешение конфликтов",
                        "description": "Почему возникают конфликты и как разрешать их без потери чужих изменений.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "GitHub и командная работа",
                "description": "Fork, pull requests, code review и GitHub Flow для совместной разработки.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "GitHub Flow",
                        "url": "https://docs.github.com/en/get-started/using-github/github-flow",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Хорошие commit-сообщения",
                        "description": "Conventional Commits и зачем нужна осмысленная история проекта.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Conventional Commits",
                                "url": "https://www.conventionalcommits.org/ru/v1.0.0/",
                                "resource_type": "guide",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    }
                ],
            },
            {
                "title": "Rebase и продвинутые техники",
                "description": "git rebase, cherry-pick, stash и интерактивный rebase для чистой истории.",
                "content_type": "article",
                "position": 3,
                "is_optional": True,
                "resources": [
                    {
                        "title": "git rebase (документация)",
                        "url": "https://git-scm.com/docs/git-rebase",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [],
            },
        ],
    },
    # ─────────────────────────────────────────────────────────── 11 ────
    {
        "slug": "system-design",
        "title": "System Design",
        "short_description": "Проектирование масштабируемых систем: CAP-теорема, базы данных, кэширование и очереди.",
        "full_description": (
            "Роадмап для тех, кто хочет проектировать системы, а не только писать код. "
            "Масштабируемость, шардирование, кэши, очереди и разбор реальных кейсов."
        ),
        "category": "backend",
        "level": "middle",
        "is_published": True,
        "tags": [
            {"name": "Architecture", "slug": "architecture"},
            {"name": "System Design", "slug": "system-design"},
            {"name": "Distributed Systems", "slug": "distributed-systems"},
        ],
        "nodes": [
            {
                "title": "Масштабируемость и надёжность",
                "description": "Горизонтальное vs вертикальное масштабирование, latency, throughput, SLA.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "System Design Primer",
                        "url": "https://github.com/donnemartin/system-design-primer",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "CAP-теорема",
                        "description": "Трилемма CAP, eventual consistency и когда жертвовать согласованностью.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "Базы данных при масштабировании",
                "description": "SQL vs NoSQL, репликация, шардирование и выбор хранилища под задачу.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Understanding Database Sharding",
                        "url": "https://www.digitalocean.com/community/tutorials/understanding-database-sharding",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Индексирование и оптимизация запросов",
                        "description": "B-tree и hash-индексы, покрывающие индексы и чтение планов запросов.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "Кэширование",
                "description": "Redis/Memcached, стратегии cache-aside / write-through и инвалидация кэша.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Redis Documentation",
                        "url": "https://redis.io/docs/",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "Очереди сообщений",
                "description": "Async messaging, Kafka vs RabbitMQ и паттерны event-driven архитектуры.",
                "content_type": "article",
                "position": 3,
                "is_optional": False,
                "resources": [
                    {
                        "title": "RabbitMQ Tutorials",
                        "url": "https://www.rabbitmq.com/tutorials",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "Разбор кейсов",
                "description": "Спроектировать сокращатель ссылок, систему уведомлений и ленту новостей.",
                "content_type": "article",
                "position": 4,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Designing Data-Intensive Applications",
                        "url": "https://dataintensive.net/",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [],
            },
        ],
    },
    # ─────────────────────────────────────────────────────────── 12 ────
    {
        "slug": "english-for-it",
        "title": "English for IT",
        "short_description": "Убрать языковой барьер: читать документацию, писать по делу и говорить на стендапах.",
        "full_description": (
            "Маршрут для тех, кто хочет убрать языковой барьер в IT. "
            "Чтение документации, письменная и устная коммуникация, техническое интервью."
        ),
        "category": "language",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "English", "slug": "english"},
            {"name": "Communication", "slug": "communication"},
            {"name": "Career", "slug": "career"},
        ],
        "nodes": [
            {
                "title": "Чтение технической документации",
                "description": "Читать docs, Stack Overflow и RFC без словаря каждые три слова.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "MDN Web Docs (практика чтения)",
                        "url": "https://developer.mozilla.org/en-US/",
                        "resource_type": "practice",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Разбор error messages",
                        "description": "Перестать паниковать от незнакомого стектрейса — понимать, что написано.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "Письменная коммуникация",
                "description": "Commit-сообщения, PR-описания, баг-репорты и вопросы на Stack Overflow.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "How to Ask a Good Question (Stack Overflow)",
                        "url": "https://stackoverflow.com/help/how-to-ask",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "Устная коммуникация",
                "description": "Стендапы, митинги и обсуждения задач на английском без страха замолчать.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "BBC Learning English: English at Work",
                        "url": "https://www.bbc.co.uk/learningenglish/english/features/english-at-work",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "Техническое интервью на английском",
                "description": "Думать вслух при решении задачи и отвечать на вопросы о своём опыте.",
                "content_type": "article",
                "position": 3,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Interviewing.io (практика)",
                        "url": "https://interviewing.io/",
                        "resource_type": "practice",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "Рост через английский контент",
                "description": "Регулярная практика: подкасты, технические блоги и конференционные доклады.",
                "content_type": "article",
                "position": 4,
                "is_optional": True,
                "resources": [
                    {
                        "title": "The Changelog Podcast",
                        "url": "https://changelog.com/podcast",
                        "resource_type": "guide",
                        "position": 0,
                    },
                    {
                        "title": "Hacker News",
                        "url": "https://news.ycombinator.com/",
                        "resource_type": "guide",
                        "position": 1,
                    },
                ],
                "children": [],
            },
        ],
    },
    # ─────────────────────────────────────────────────────────── 13 ────
    {
        "slug": "android-kotlin",
        "title": "Android-разработка (Kotlin)",
        "short_description": "Android с нуля: Kotlin, Jetpack Compose, MVVM, сеть и локальное хранилище.",
        "full_description": (
            "Маршрут для тех, кто хочет создавать Android-приложения. "
            "Kotlin и coroutines, Jetpack Compose, архитектура MVVM и работа с сетью через Retrofit."
        ),
        "category": "mobile",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "Kotlin", "slug": "kotlin"},
            {"name": "Android", "slug": "android"},
            {"name": "Jetpack Compose", "slug": "jetpack-compose"},
        ],
        "nodes": [
            {
                "title": "Kotlin основы",
                "description": "Синтаксис, null safety, data classes, extension functions и sealed classes.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Kotlin Documentation",
                        "url": "https://kotlinlang.org/docs/home.html",
                        "resource_type": "docs",
                        "position": 0,
                    },
                    {
                        "title": "Kotlin Koans (интерактивная практика)",
                        "url": "https://play.kotlinlang.org/koans/overview",
                        "resource_type": "practice",
                        "position": 1,
                    },
                ],
                "children": [
                    {
                        "title": "Coroutines и Flow",
                        "description": "Структурный параллелизм, suspend-функции, StateFlow и SharedFlow.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "Kotlin Coroutines Guide",
                                "url": "https://kotlinlang.org/docs/coroutines-guide.html",
                                "resource_type": "docs",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    }
                ],
            },
            {
                "title": "Android основы",
                "description": "Activity, Fragment, жизненный цикл и навигация.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Android Developer Guides",
                        "url": "https://developer.android.com/guide",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "Jetpack Compose",
                "description": "Composable-функции, State, recomposition, LazyColumn и Material 3.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Jetpack Compose Tutorial",
                        "url": "https://developer.android.com/develop/ui/compose/tutorial",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Material 3 и темы",
                        "description": "Цветовые схемы, типографика и компоненты Material Design 3.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "MVVM и Hilt",
                "description": "ViewModel, StateFlow, репозиторий и dependency injection через Hilt.",
                "content_type": "article",
                "position": 3,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Guide to App Architecture",
                        "url": "https://developer.android.com/topic/architecture",
                        "resource_type": "docs",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "Сеть и локальное хранилище",
                "description": "Retrofit для HTTP-запросов и Room для локальной базы данных.",
                "content_type": "article",
                "position": 4,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Retrofit GitHub",
                        "url": "https://github.com/square/retrofit",
                        "resource_type": "docs",
                        "position": 0,
                    },
                    {
                        "title": "Room Database Guide",
                        "url": "https://developer.android.com/training/data-storage/room",
                        "resource_type": "docs",
                        "position": 1,
                    },
                ],
                "children": [],
            },
        ],
    },
    # ─────────────────────────────────────────────────────────── 14 ────
    {
        "slug": "product-analytics",
        "title": "Продуктовая аналитика",
        "short_description": "SQL, ключевые метрики, воронки, когорты и A/B тесты для понимания поведения пользователей.",
        "full_description": (
            "Маршрут для PM, аналитиков и разработчиков, которые хотят понимать поведение пользователей. "
            "SQL с оконными функциями, продуктовые метрики, когортный анализ и A/B-тестирование."
        ),
        "category": "analytics",
        "level": "junior",
        "is_published": True,
        "tags": [
            {"name": "Analytics", "slug": "analytics"},
            {"name": "SQL", "slug": "sql"},
            {"name": "Product", "slug": "product"},
        ],
        "nodes": [
            {
                "title": "SQL для аналитика",
                "description": "SELECT, JOIN, GROUP BY и агрегации для ответов на продуктовые вопросы.",
                "content_type": "article",
                "position": 0,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Mode SQL Tutorial",
                        "url": "https://mode.com/sql-tutorial/",
                        "resource_type": "guide",
                        "position": 0,
                    },
                    {
                        "title": "SQLBolt (практика)",
                        "url": "https://sqlbolt.com/",
                        "resource_type": "practice",
                        "position": 1,
                    },
                ],
                "children": [
                    {
                        "title": "Оконные функции",
                        "description": "RANK, ROW_NUMBER, LAG/LEAD и скользящие агрегаты для расчёта метрик.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [
                            {
                                "title": "PostgreSQL Window Functions",
                                "url": "https://www.postgresql.org/docs/current/tutorial-window.html",
                                "resource_type": "docs",
                                "position": 0,
                            }
                        ],
                        "children": [],
                    }
                ],
            },
            {
                "title": "Ключевые продуктовые метрики",
                "description": "DAU/MAU, Retention, Churn, LTV и North Star Metric — понять и посчитать.",
                "content_type": "article",
                "position": 1,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Amplitude: Guide to Product Metrics",
                        "url": "https://amplitude.com/blog/product-metrics",
                        "resource_type": "article",
                        "position": 0,
                    }
                ],
                "children": [
                    {
                        "title": "Воронки и когортный анализ",
                        "description": "Построить воронку конверсии и когортную таблицу удержания.",
                        "content_type": "article",
                        "position": 0,
                        "is_optional": False,
                        "resources": [],
                        "children": [],
                    }
                ],
            },
            {
                "title": "A/B тестирование",
                "description": "Статистическая значимость, p-value, размер выборки и анализ результатов.",
                "content_type": "article",
                "position": 2,
                "is_optional": False,
                "resources": [
                    {
                        "title": "Evan Miller: Sample Size Calculator",
                        "url": "https://www.evanmiller.org/ab-testing/sample-size.html",
                        "resource_type": "guide",
                        "position": 0,
                    }
                ],
                "children": [],
            },
            {
                "title": "BI-инструменты",
                "description": "Looker Studio или Metabase для дашбордов и автоматических отчётов.",
                "content_type": "article",
                "position": 3,
                "is_optional": True,
                "resources": [
                    {
                        "title": "Looker Studio Help",
                        "url": "https://support.google.com/looker-studio",
                        "resource_type": "docs",
                        "position": 0,
                    },
                    {
                        "title": "Metabase Docs",
                        "url": "https://www.metabase.com/docs/latest/",
                        "resource_type": "docs",
                        "position": 1,
                    },
                ],
                "children": [],
            },
        ],
    },
]


# Блок выбирает конфигурацию приложения для seed-запуска.
def get_config_name() -> str:
    return os.getenv("VETKA_CONFIG") or os.getenv("FLASK_ENV", "development")


# Блок создаёт или обновляет администратора по email/username без дублей.
def upsert_admin_user() -> User:
    user_by_email = db.session.query(User).filter(User.email == ADMIN_SEED["email"]).first()
    user_by_username = (
        db.session.query(User).filter(User.username == ADMIN_SEED["username"]).first()
    )

    if (
        user_by_email is not None
        and user_by_username is not None
        and user_by_email.id != user_by_username.id
    ):
        raise RuntimeError(
            "Найдены разные пользователи с seed email и seed username. "
            "Приведи данные users к консистентному состоянию и повтори seed."
        )

    user = user_by_email or user_by_username
    if user is None:
        user = User(
            username=ADMIN_SEED["username"],
            email=ADMIN_SEED["email"],
            password_hash=hash_password(ADMIN_SEED["password"]),
            role=ADMIN_SEED["role"],
        )
        db.session.add(user)
        db.session.flush()
        return user

    user.username = ADMIN_SEED["username"]
    user.email = ADMIN_SEED["email"]
    user.password_hash = hash_password(ADMIN_SEED["password"])
    user.role = ADMIN_SEED["role"]
    db.session.flush()
    return user


# Блок создаёт или обновляет теги по slug.
def upsert_tag(tag_data: dict) -> RoadmapTag:
    tag = db.session.query(RoadmapTag).filter(RoadmapTag.slug == tag_data["slug"]).first()

    if tag is None:
        tag = RoadmapTag(name=tag_data["name"], slug=tag_data["slug"])
        db.session.add(tag)
        db.session.flush()
        return tag

    tag.name = tag_data["name"]
    db.session.flush()
    return tag


# Блок создаёт или обновляет seed-роадмап по slug.
def upsert_roadmap(seed_data: dict, author: User) -> Roadmap:
    roadmap = db.session.query(Roadmap).filter(Roadmap.slug == seed_data["slug"]).first()

    if roadmap is None:
        roadmap = Roadmap(slug=seed_data["slug"], author_id=author.id)
        db.session.add(roadmap)

    roadmap.title = seed_data["title"]
    roadmap.short_description = seed_data["short_description"]
    roadmap.full_description = seed_data["full_description"]
    roadmap.category = seed_data["category"]
    roadmap.level = seed_data["level"]
    roadmap.is_published = seed_data["is_published"]
    roadmap.author_id = author.id
    db.session.flush()
    return roadmap


# Блок синхронизирует теги seed-роадмапа до точного заданного состояния.
def sync_roadmap_tags(roadmap: Roadmap, tag_seeds: list[dict]) -> None:
    roadmap.tag_links.clear()
    db.session.flush()

    for tag_seed in tag_seeds:
        tag = upsert_tag(tag_seed)
        roadmap.tag_links.append(RoadmapTagLink(tag=tag))

    db.session.flush()


# Блок удаляет старые узлы seed-роадмапа и создаёт новое дерево.
def sync_roadmap_nodes(roadmap: Roadmap, node_seeds: list[dict]) -> None:
    roadmap.nodes.clear()
    db.session.flush()

    for node_seed in node_seeds:
        create_node_recursive(roadmap=roadmap, node_seed=node_seed, parent=None, depth=0)

    db.session.flush()


# Блок рекурсивно создаёт узел, его ресурсы и дочерние элементы.
def create_node_recursive(
    *,
    roadmap: Roadmap,
    node_seed: dict,
    parent: RoadmapNode | None,
    depth: int,
) -> RoadmapNode:
    node = RoadmapNode(
        roadmap=roadmap,
        parent=parent,
        title=node_seed["title"],
        description=node_seed.get("description"),
        content_type=node_seed.get("content_type", "article"),
        position=node_seed.get("position", 0),
        depth=depth,
        is_optional=node_seed.get("is_optional", False),
    )
    db.session.add(node)
    db.session.flush()

    for resource_seed in node_seed.get("resources", []):
        node.resources.append(
            Resource(
                title=resource_seed["title"],
                url=resource_seed["url"],
                resource_type=resource_seed.get("resource_type", "link"),
                position=resource_seed.get("position", 0),
            )
        )

    db.session.flush()

    for child_seed in node_seed.get("children", []):
        create_node_recursive(
            roadmap=roadmap,
            node_seed=child_seed,
            parent=node,
            depth=depth + 1,
        )

    return node


# Блок применяет все seed-данные в одной транзакции.
def run_seed() -> None:
    admin_user = upsert_admin_user()

    for roadmap_seed in ROADMAP_SEEDS:
        roadmap = upsert_roadmap(roadmap_seed, author=admin_user)
        sync_roadmap_tags(roadmap, roadmap_seed["tags"])
        sync_roadmap_nodes(roadmap, roadmap_seed["nodes"])

    db.session.commit()

    print("Seed завершён успешно.")
    print(f"Admin email: {ADMIN_SEED['email']}")
    print(f"Admin password: {ADMIN_SEED['password']}")
    print(f"Роадмапов в seed: {len(ROADMAP_SEEDS)}")


# Блок запускает seed под app context и откатывает транзакцию при ошибке.
def main() -> None:
    app = create_app(get_config_name())

    with app.app_context():
        try:
            run_seed()
        except Exception:
            db.session.rollback()
            raise


if __name__ == "__main__":
    main()
