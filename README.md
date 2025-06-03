# TVibeCoding - Платформа для разработчиков

Социальная платформа для разработчиков с ИИ-аналитикой и автоматическим трекингом активности GitHub репозиториев.

## 🚀 Функциональность

### Основные возможности
- **Автоматический мониторинг репозиториев** - отслеживание коммитов и активности
- **ИИ-аналитика проектов** - автоматическое создание описаний и анализ кода
- **Система прогресса** - уровни, опыт, стрики и достижения
- **Социальные функции** - комментарии к проектам, лента активности
- **Административная панель** - управление пользователями и системой

### Технические особенности
- **TypeScript/Node.js** полный стек
- **PostgreSQL** с Drizzle ORM
- **GitHub OAuth** авторизация
- **AI/ML интеграция** (Gemini API)
- **Real-time уведомления** через Telegram/Email
- **Современный UI** на React с Tailwind CSS

## 🏗️ Архитектура

Проект следует принципам **MVC (Model-View-Controller)**:

```
client/src/
├── controllers/     # Бизнес-логика и API взаимодействие
├── models/         # Модели данных и утилиты
├── views/          # Presentational компоненты
├── hooks/          # Custom React хуки
├── services/       # Внешние сервисы
├── components/     # UI компоненты
└── pages/          # Container компоненты

server/
├── routes.ts       # API маршруты
├── storage.ts      # Слой доступа к данным
├── auth.ts         # Аутентификация
├── github.ts       # GitHub API интеграция
├── gemini.ts       # AI сервис
└── scheduler.ts    # Фоновые задачи
```

## 🛠️ Установка и запуск

### Требования
- Node.js 18+ 
- PostgreSQL 14+
- GitHub OAuth App
- Gemini API ключ (опционально)

### Установка зависимостей
```bash
npm install
```

### Настройка переменных окружения
Создайте файл `.env` со следующими переменными:

```env
# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/database

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI сервисы (опционально)
GEMINI_API_KEY=your_gemini_api_key

# Уведомления (опционально)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Настройка GitHub OAuth

1. Перейдите в [GitHub Developer Settings](https://github.com/settings/developers)
2. Создайте новое OAuth приложение
3. Установите Authorization callback URL: `https://your-domain.com/api/auth/github/callback`
4. Скопируйте Client ID и Client Secret в `.env`

### Инициализация базы данных
```bash
npm run db:push
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка для продакшена
```bash
npm run build
npm start
```

## 📊 API Документация

### Основные эндпоинты

#### Аутентификация
- `GET /api/auth/github` - Авторизация через GitHub
- `GET /api/auth/user` - Получение текущего пользователя
- `POST /api/auth/logout` - Выход из системы

#### Проекты
- `GET /api/projects` - Список публичных проектов
- `GET /api/user/repositories` - Репозитории пользователя
- `POST /api/repositories` - Добавление репозитория
- `DELETE /api/repositories/:id` - Удаление репозитория

#### Комментарии
- `POST /api/repositories/:id/comments` - Добавление комментария
- `DELETE /api/comments/:id` - Удаление комментария

#### Аналитика
- `GET /api/project/analysis` - ИИ-анализ проекта
- `GET /api/user/progress` - Прогресс пользователя
- `GET /api/leaderboard` - Рейтинг пользователей

#### Администрирование
- `GET /api/admin/users` - Список пользователей (только админ)
- `POST /api/admin/check-repositories` - Проверка репозиториев (только админ)

## 🧪 Тестирование

### Запуск тестов
```bash
# Frontend тесты
npm run test:client

# Backend тесты
npm run test:server

# E2E тесты
npm run test:e2e
```

### Структура тестов
```
tests/
├── unit/           # Модульные тесты
├── integration/    # Интеграционные тесты
└── e2e/           # End-to-end тесты
```

## 🚀 Деплой

### На Replit
Проект готов к деплою на Replit Deployments. Просто нажмите кнопку Deploy.

### Ручной деплой
```bash
# Установка зависимостей
npm ci

# Сборка
npm run build

# Инициализация БД
npm run db:push

# Запуск
npm start
```

## 🔧 Конфигурация

### Scheduler (фоновые задачи)
По умолчанию проверка репозиториев запускается каждые 24 часа. Настройка в `server/scheduler.ts`.

### AI интеграция
Поддерживается Gemini API для:
- Генерации описаний проектов
- Анализа изменений в коде
- Создания рекомендаций

### Уведомления
Поддерживаются Email и Telegram уведомления о неактивности репозиториев.

## 🤝 Разработка

### Принципы архитектуры
1. **Разделение ответственности** - Controllers, Models, Views
2. **Типизация** - Строгая типизация с TypeScript
3. **Переиспользование** - Модульные компоненты и хуки
4. **Тестируемость** - Инъекция зависимостей и моки

### Соглашения по коду
- ESLint + Prettier для форматирования
- Conventional Commits для сообщений коммитов
- Husky для pre-commit хуков

### Внесение изменений
1. Создайте ветку от `main`
2. Внесите изменения
3. Добавьте тесты
4. Создайте Pull Request

## 📄 Лицензия

MIT License. См. файл [LICENSE](LICENSE) для деталей.

## 👥 Команда

Разработано с помощью Claude (Anthropic) и Replit AI.