# TVibeCoding - Техническая документация

## Обзор системы

TVibeCoding представляет собой полнофункциональную социальную платформу для разработчиков с интеллектуальной аналитикой, автоматическим мониторингом GitHub активности и комплексной системой геймификации.

## Архитектура системы

### Общая архитектура
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   React + TS    │◄───┤   Node.js + TS  │◄───┤   PostgreSQL    │
│   Tailwind CSS  │    │   Express       │    │   Drizzle ORM   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │              ┌─────────────────┐
         │                       └──────────────┤  External APIs  │
         │                                      │  - GitHub API   │
         │                                      │  - Gemini AI    │
         │                                      │  - SMTP/Email   │
         │                                      │  - Telegram     │
         │                                      └─────────────────┘
         │
┌─────────────────┐
│   Scheduler     │
│   Background    │
│   Tasks         │
└─────────────────┘
```

### MVC Архитектура Frontend
```
client/src/
├── controllers/           # Бизнес-логика и API взаимодействие
│   ├── ProjectController.ts
│   ├── UserController.ts
│   ├── CommunityController.ts
│   └── AdminController.ts
├── models/               # Модели данных и утилиты
│   ├── ProjectModel.ts
│   ├── UserModel.ts
│   └── AnalyticsModel.ts
├── views/                # Presentational компоненты
│   ├── ProjectCard.tsx
│   ├── CommentSection.tsx
│   └── UserProfile.tsx
├── hooks/                # Custom React hooks
│   ├── useProjects.ts
│   ├── useAuth.ts
│   └── useProgress.ts
├── components/           # UI компоненты
│   ├── ui/              # shadcn/ui компоненты
│   └── layout/          # Компоненты макета
└── pages/               # Container компоненты
    ├── home.tsx
    ├── profile.tsx
    ├── projects.tsx
    └── admin.tsx
```

## База данных

### Схема данных
```sql
-- Пользователи
users (
  id SERIAL PRIMARY KEY,
  github_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  github_token TEXT,
  telegram_id TEXT,
  notification_preference TEXT DEFAULT 'email',
  on_vacation BOOLEAN DEFAULT false,
  vacation_until TIMESTAMP,
  is_admin BOOLEAN DEFAULT false,
  last_active TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Репозитории
repositories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  last_commit_date TIMESTAMP,
  status TEXT DEFAULT 'pending',
  last_commit_sha TEXT,
  changes_summary TEXT,
  summary_generated_at TIMESTAMP,
  description TEXT,
  description_generated_at TIMESTAMP,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Прогресс пользователей
user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  total_commits INTEGER DEFAULT 0,
  active_days INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP,
  badges JSON DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Лента активности
activity_feed (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  repository_id INTEGER REFERENCES repositories(id),
  commit_sha TEXT NOT NULL,
  commit_message TEXT NOT NULL,
  files_changed INTEGER,
  lines_added INTEGER,
  lines_deleted INTEGER,
  ai_summary TEXT,
  commit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  commit_count INTEGER DEFAULT 1,
  commits JSON
);

-- Комментарии к репозиториям
repository_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  repository_id INTEGER REFERENCES repositories(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Еженедельная статистика
weekly_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  week_identifier TEXT NOT NULL,
  commits_count INTEGER DEFAULT 0,
  is_viber BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Индексы для производительности
```sql
-- Основные индексы
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_status ON repositories(status);
CREATE INDEX idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_repository_id ON activity_feed(repository_id);
CREATE INDEX idx_activity_feed_commit_date ON activity_feed(commit_date);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_repository_comments_repository_id ON repository_comments(repository_id);
CREATE INDEX idx_weekly_stats_week_identifier ON weekly_stats(week_identifier);
```

## API Документация

### Аутентификация
```typescript
// GitHub OAuth
GET /api/auth/github
GET /api/auth/github/callback
GET /api/auth/user          // Получить текущего пользователя
POST /api/auth/logout       // Выход из системы

// Тестовые endpoints
GET /api/test-login         // Вход как test_user
GET /api/mock-login         // Вход как админ
GET /api/mock-login-user2   // Вход как существующий пользователь
```

### Пользователи и профили
```typescript
GET /api/profile                    // Профиль текущего пользователя
GET /api/progress/:userId           // Прогресс пользователя
GET /api/users                      // Все пользователи (админ)
GET /api/members/featured           // Рекомендуемые участники
GET /api/leaderboard               // Рейтинг пользователей
```

### Репозитории
```typescript
GET /api/repositories              // Репозитории текущего пользователя
GET /api/repositories/user/:userId // Репозитории пользователя
POST /api/repositories             // Добавить репозиторий
DELETE /api/repositories/:id       // Удалить репозиторий
GET /api/github/repositories       // Репозитории из GitHub API
```

### Проекты и комментарии
```typescript
GET /api/projects                           // Публичные проекты
POST /api/repositories/:id/comments        // Добавить комментарий
DELETE /api/comments/:id                    // Удалить комментарий
POST /api/repositories/:id/generate-description // AI-описание
```

### Активность и аналитика
```typescript
GET /api/activity                   // Лента активности
GET /api/stats                      // Общая статистика
GET /api/project/analysis           // AI-анализ проекта
```

### Администрирование
```typescript
GET /api/admin/users                        // Управление пользователями
POST /api/admin/check-repositories          // Проверка репозиториев
PUT /api/admin/users/:id/vacation           // Управление отпусками
DELETE /api/admin/users/:id                 // Удаление пользователя
```

## Внешние интеграции

### GitHub API
```typescript
interface GitHubIntegration {
  authentication: "OAuth Token";
  endpoints: {
    userProfile: "/user";
    repositories: "/user/repos";
    commits: "/repos/{owner}/{repo}/commits";
    repository: "/repos/{owner}/{repo}";
  };
  rateLimits: {
    authenticated: "5000 requests/hour";
    unauthenticated: "60 requests/hour";
  };
}
```

### Google Gemini AI
```typescript
interface GeminiIntegration {
  model: "gemini-1.5-flash";
  capabilities: [
    "Project description generation",
    "Code analysis and recommendations",
    "Commit summary creation",
    "Architecture suggestions"
  ];
  inputLimits: {
    maxTokens: 1000000;
    maxOutputTokens: 8192;
  };
}
```

### Система уведомлений
```typescript
interface NotificationSystem {
  email: {
    provider: "SMTP";
    templates: ["inactivity_warning", "inactivity_alert"];
  };
  telegram: {
    provider: "Telegram Bot API";
    features: ["instant_notifications", "command_interface"];
  };
}
```

## Бизнес-логика

### Система прогресса
```typescript
interface ProgressCalculation {
  experience: number; // commits * 10
  level: number;      // Math.floor(experience / 100) + 1
  streakRules: {
    // Активность засчитывается при наличии коммитов в день
    minCommitsPerDay: 1;
    streakBreakThreshold: "24 hours";
    maxStreakBonus: "50% XP";
  };
}
```

### Система рейтингов
```typescript
interface RankingSystem {
  weeklyViber: {
    criteria: "Most commits in current week";
    calculation: "SUM(commits) WHERE week = current_week";
    reset: "Every Monday 00:00 UTC";
  };
  globalRanking: {
    criteria: "Total experience + level bonus";
    calculation: "experience + (level * 100)";
  };
}
```

### Статусы репозиториев
```typescript
type RepositoryStatus = "active" | "warning" | "inactive" | "pending";

interface StatusCalculation {
  active: "Last commit within 7 days";
  warning: "Last commit within 7-14 days";
  inactive: "Last commit older than 14 days";
  pending: "No commits tracked yet";
}
```

## Производительность и оптимизация

### Frontend оптимизации
```typescript
// React Query конфигурация
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 минут
      cacheTime: 10 * 60 * 1000,    // 10 минут
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

// Ленивая загрузка компонентов
const LazyProjects = lazy(() => import('./pages/projects'));
const LazyAdmin = lazy(() => import('./pages/admin'));
```

### Backend оптимизации
```typescript
// Кэширование в памяти
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

// Пагинация запросов
interface PaginationParams {
  limit: number;    // максимум 100
  offset: number;
  orderBy: string;
  orderDirection: "ASC" | "DESC";
}
```

### Мониторинг производительности
```typescript
// Метрики производительности
interface PerformanceMetrics {
  responseTime: "< 200ms for 95% requests";
  databaseConnections: "< 80% pool utilization";
  memoryUsage: "< 512MB baseline";
  errorRate: "< 1% of total requests";
}
```

## Безопасность

### Аутентификация и авторизация
```typescript
// Middleware для проверки аутентификации
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// Middleware для проверки админских прав
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
```

### Валидация данных
```typescript
// Zod схемы для валидации
const addRepositorySchema = z.object({
  name: z.string().min(1).max(100),
  fullName: z.string().regex(/^[\w\-\.]+\/[\w\-\.]+$/),
});

const addCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});
```

### Защита от атак
```typescript
// Защита от SQL инъекций - параметризованные запросы
const getUser = async (id: number) => {
  return await db.select().from(users).where(eq(users.id, id));
};

// Ограничение частоты запросов
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100,                  // максимум 100 запросов
});
```

## Тестирование

### Структура тестов
```
tests/
├── unit/                  # Модульные тесты
│   ├── models/
│   ├── controllers/
│   └── services/
├── integration/           # Интеграционные тесты
│   ├── api/
│   └── database/
└── e2e/                  # End-to-end тесты
    ├── auth.spec.ts
    ├── projects.spec.ts
    └── admin.spec.ts
```

### Покрытие тестами
```typescript
// Целевые метрики покрытия
interface TestCoverage {
  statements: "> 80%";
  branches: "> 75%";
  functions: "> 85%";
  lines: "> 80%";
}
```

## Развертывание

### Production конфигурация
```typescript
// Environment variables
interface ProductionConfig {
  NODE_ENV: "production";
  DATABASE_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GEMINI_API_KEY?: string;
  SMTP_HOST?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  TELEGRAM_BOT_TOKEN?: string;
  SESSION_SECRET: string;
}
```

### Docker конфигурация
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Мониторинг и логирование
```typescript
// Структурированное логирование
interface LogEntry {
  timestamp: string;
  level: "error" | "warn" | "info" | "debug";
  message: string;
  userId?: number;
  endpoint?: string;
  duration?: number;
  error?: Error;
}
```

## Масштабирование

### Горизонтальное масштабирование
```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tvibecoding-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tvibecoding
  template:
    spec:
      containers:
      - name: app
        image: tvibecoding:latest
        ports:
        - containerPort: 5000
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### База данных
```sql
-- Партиционирование по времени
CREATE TABLE activity_feed_2025_06 PARTITION OF activity_feed
FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

-- Репликация для чтения
CREATE PUBLICATION tvibecoding_read FOR ALL TABLES;
```

Данная техническая документация обеспечивает полное понимание архитектуры системы, позволяя разработчикам эффективно работать с кодом и развивать платформу дальше.