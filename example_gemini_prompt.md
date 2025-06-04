# Пример промпта для Gemini при анализе tvibecodingcommunity

## Полный промпт, отправляемый в Gemini:

```
Проанализируй конкретный репозиторий "tvibecodingcommunity" на основе его РЕАЛЬНОГО КОДА и структуры:

АНАЛИЗ КОНКРЕТНОГО РЕПОЗИТОРИЯ: tvibecodingcommunity

ИНФОРМАЦИЯ О РАЗРАБОТЧИКЕ:
- Пользователь: Koshkin 
- GitHub: koshkinvv

ДЕТАЛИ РЕПОЗИТОРИЯ:
- Название: tvibecodingcommunity
- Полное имя: koshkinvv/tvibecodingcommunity
- Статус: active
- Дней с последнего коммита: 0
- Последние изменения: Были добавлены функции поиска проектов и просмотра подробной информации о них, включая комментарии. Главная страница обновлена: теперь отображается общая статистика сообщества (проекты, участники, коммиты), а личные данные пользователей скрыты. Произошли улучшения рекомендаций участников и исправлены некоторые ошибки.
- Дата создания: 01.06.2025
- Последний коммит: 04.06.2025

СТРУКТУРА ПРОЕКТА:
- Общее количество файлов: 127
- Типы файлов: ts: 45, tsx: 23, js: 8, json: 12, md: 5, css: 3, html: 2, txt: 29
- Технологический стек: React, TypeScript, Node.js, Tailwind CSS, Express, Drizzle ORM

README СОДЕРЖИМОЕ:
# Vibe Coding Community Platform

Инновационная платформа социального кодинга, которая empowers разработчиков через интеллектуальное сотрудничество, AI-driven управление проектами и модульные рабочие процессы разработки.

## Ключевые технологии:
- TypeScript/Node.js full-stack архитектура  
- PostgreSQL с Drizzle ORM для управления данными
- React-based frontend с модульной структурой компонентов
- GitHub OAuth аутентификация
- AI-powered теггинг проектов и анализ репозиториев
- Интеграция Gemini AI для интеллектуальных инсайтов

## Особенности:
- 🔍 Интеллектуальный поиск и фильтрация проектов
- 📊 Детальная аналитика активности разработчиков
- 🤖 AI-анализ кода и рекомендации по улучшению
- 👥 Система сообщества с рейтингами и достижениями
- 📈 Отслеживание прогресса и метрики производительности

PACKAGE.JSON АНАЛИЗ:
- Название: rest-express
- Описание: Vibe Coding Community Platform
- Версия: 1.0.0
- Скрипты: dev, build, start, db:push, db:studio
- Основные зависимости: @google/generative-ai, @hookform/resolvers, @neondatabase/serverless, @radix-ui/react-accordion, @tanstack/react-query, drizzle-orm, express, framer-motion, lucide-react, react

КЛЮЧЕВЫЕ ФАЙЛЫ ПРОЕКТА:

Файл: package.json (3847 байт)
Содержимое:
{
  "name": "rest-express",
  "version": "1.0.0",
  "description": "Vibe Coding Community Platform",
  "main": "server/index.ts",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build --outDir dist/public",
    "build:server": "tsc --project tsconfig.server.json",
    "start": "NODE_ENV=production node dist/server/index.js",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "@hookform/resolvers": "^3.9.1",
    "@neondatabase/serverless": "^0.10.3",
    "@radix-ui/react-accordion": "^1.2.1",
    "@tanstack/react-query": "^5.62.7",
    "drizzle-orm": "^0.36.4",
    "express": "^4.21.1",
    "framer-motion": "^11.11.17",
    "lucide-react": "^0.460.0",
    "react": "^18.3.1"
  }
}
---

Файл: client/src/App.tsx (2156 байт)
Содержимое:
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import ProfilePage from "@/pages/profile";
import CommunityPage from "@/pages/community";
import ActivityPage from "@/pages/activity";
import AdminPage from "@/pages/admin";
import ProjectInsightsPage from "@/pages/project-insights";
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/project-detail";
import ProgressPage from "@/pages/progress";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/profile">
        {user ? <ProfilePage /> : <LoginPage />}
      </Route>
      <Route path="/insights">
        {user ? <ProjectInsightsPage /> : <LoginPage />}
      </Route>
      <Route path="/projects">
        {user ? <ProjectsPage /> : <LoginPage />}
      </Route>
      <Route path="/projects/:id">
        {user ? <ProjectDetailPage /> : <LoginPage />}
      </Route>
    </Switch>
  );
}
---

Файл: server/index.ts (1543 байт)
Содержимое:
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import { scheduler } from "./scheduler";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup authentication
setupAuth(app);

// Start background scheduler
scheduler.startDailyCheck();

(async () => {
  const server = await registerRoutes(app);
  
  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    log(`Error ${status}: ${message}`);
    
    res.status(status).json({ 
      error: message,
      ...(app.get("env") === "development" && { stack: err.stack })
    });
  });

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
---

Файл: shared/schema.ts (1500 байт)
Содержимое:
import { pgTable, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  githubId: text("github_id").unique().notNull(),
  username: text("username").unique().notNull(),
  email: text("email"),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  githubToken: text("github_token"),
  telegramId: text("telegram_id"),
  notificationPreference: text("notification_preference").default("email"),
  onVacation: boolean("on_vacation").default(false),
  vacationUntil: timestamp("vacation_until"),
  isAdmin: boolean("is_admin").default(false),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// Repositories table
export const repositories = pgTable("repositories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  fullName: text("full_name").unique().notNull(),
  lastCommitDate: timestamp("last_commit_date"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  lastCommitSha: text("last_commit_sha"),
  changesSummary: text("changes_summary"),
  summaryGeneratedAt: timestamp("summary_generated_at"),
  description: text("description"),
  descriptionGeneratedAt: timestamp("description_generated_at"),
  isPublic: boolean("is_public").default(true)
});
---

ТЕХНИЧЕСКИЙ КОНТЕКСТ:
Это система мониторинга GitHub репозиториев с интеграцией AI анализа.

ГЛУБОКИЙ АНАЛИЗ НА ОСНОВЕ КОДА:
1. Изучи архитектуру проекта по файловой структуре и коду
2. Проанализируй качество кода в представленных файлах
3. Оцени технологический стек и его использование
4. Рассмотри README и package.json для понимания назначения проекта
5. Дай конкретные советы на основе РЕАЛЬНОГО кода

ОСОБОЕ ВНИМАНИЕ:
- Статус репозитория: active
- Активность: 0 дней с последнего коммита
- Технологии: React, TypeScript, Node.js, Tailwind CSS, Express, Drizzle ORM
- Реальные файлы и их содержимое представлены выше

КРИТЕРИИ АНАЛИЗА:
- Анализируй НАСТОЯЩИЙ код, а не общие рекомендации
- Учитывай специфику технологий, используемых в проекте
- Давай конкретные советы по улучшению существующего кода
- Находи реальные проблемы в архитектуре и коде

Верни результат СТРОГО в JSON формате:
{
  "codeQuality": {
    "suggestions": ["конкретная рекомендация на основе анализа кода tvibecodingcommunity", "улучшение качества найденных файлов", "оптимизация существующих компонентов"]
  },
  "architecture": {
    "suggestions": ["архитектурное улучшение на основе структуры tvibecodingcommunity", "реорганизация найденных модулей", "улучшение существующей архитектуры"]
  },
  "userExperience": {
    "suggestions": ["UX улучшение на основе анализа интерфейса tvibecodingcommunity", "улучшение пользовательского опыта в найденных компонентах", "оптимизация взаимодействия"]
  },
  "performance": {
    "suggestions": ["оптимизация производительности tvibecodingcommunity на основе кода", "улучшение скорости загрузки найденных компонентов", "оптимизация существующих алгоритмов"]
  },
  "security": {
    "suggestions": ["усиление безопасности tvibecodingcommunity на основе найденного кода", "защита от уязвимостей в существующих файлах", "улучшение безопасности API"]
  },
  "overallRecommendations": ["стратегическая рекомендация для развития tvibecodingcommunity", "долгосрочный план улучшения проекта", "приоритетные направления развития"]
}

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Рекомендации ТОЛЬКО на русском языке
- Анализируй РЕАЛЬНЫЙ код, а не давай общие советы
- Ссылайся на конкретные файлы и технологии из проекта
- Ответь ТОЛЬКО в JSON формате без дополнительного текста
```

## Ключевые улучшения:

1. **Реальная структура проекта**: Gemini видит точное количество файлов и их типы
2. **Содержимое package.json**: Анализ зависимостей и скриптов
3. **Код ключевых файлов**: App.tsx, index.ts, schema.ts и другие
4. **README анализ**: Понимание назначения и архитектуры проекта
5. **Технологический стек**: Автоматическое определение из зависимостей

Теперь анализ базируется на реальном коде, а не только на метаданных репозитория.