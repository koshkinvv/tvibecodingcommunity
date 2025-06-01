import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Repository } from "@shared/schema";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export interface ProjectAnalysis {
  codeQuality: {
    score: number;
    suggestions: string[];
  };
  architecture: {
    score: number;
    suggestions: string[];
  };
  userExperience: {
    score: number;
    suggestions: string[];
  };
  performance: {
    score: number;
    suggestions: string[];
  };
  security: {
    score: number;
    suggestions: string[];
  };
  overallRecommendations: string[];
}

export class ProjectAnalyzer {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  async analyzeUserProject(user: User, repositories: Repository[]): Promise<ProjectAnalysis> {
    const activeRepos = repositories.filter(repo => repo.status === 'active');
    const totalRepos = repositories.length;
    const lastActivity = repositories.reduce((latest, repo) => {
      const repoDate = repo.lastCommitDate ? new Date(repo.lastCommitDate) : new Date(0);
      return repoDate > latest ? repoDate : latest;
    }, new Date(0));

    // Создаем контекст проекта для анализа
    const projectContext = `
Анализируемый проект сообщества разработчиков:
- Пользователь: ${user.name || user.username}
- Общее количество репозиториев: ${totalRepos}
- Активные репозитории: ${activeRepos.length}
- Последняя активность: ${lastActivity.toLocaleDateString('ru-RU')}
- Репозитории: ${repositories.map(repo => `${repo.name} (${repo.status})`).join(', ')}

Технический стек проекта:
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- База данных: PostgreSQL + Drizzle ORM
- AI интеграция: Google Gemini API
- Аутентификация: GitHub OAuth
- Хостинг: Replit

Функциональность:
- Мониторинг GitHub репозиториев
- AI анализ коммитов
- Система уведомлений
- Лента активности сообщества
- Статистика и аналитика
`;

    const prompt = `
Проанализируй проект разработчика и дай экспертные рекомендации по улучшению в следующих областях:

${projectContext}

Дай оценку от 1 до 10 и конкретные предложения по улучшению в каждой категории:

1. КАЧЕСТВО КОДА
- Анализируй структуру проекта, использование TypeScript, организацию компонентов
- Предложи улучшения архитектуры кода, рефакторинг, лучшие практики

2. АРХИТЕКТУРА
- Оцени текущую архитектуру fullstack приложения
- Предложи улучшения масштабируемости, модульности, разделения ответственности

3. ПОЛЬЗОВАТЕЛЬСКИЙ ОПЫТ
- Проанализируй UX/UI, удобство использования
- Предложи улучшения интерфейса, навигации, мобильной версии

4. ПРОИЗВОДИТЕЛЬНОСТЬ
- Оцени потенциальные проблемы производительности
- Предложи оптимизации запросов, кеширования, загрузки данных

5. БЕЗОПАСНОСТЬ
- Проанализируй аспекты безопасности приложения
- Предложи улучшения аутентификации, защиты данных, валидации

Ответь в формате JSON:
{
  "codeQuality": {
    "score": число_от_1_до_10,
    "suggestions": ["предложение1", "предложение2", ...]
  },
  "architecture": {
    "score": число_от_1_до_10,
    "suggestions": ["предложение1", "предложение2", ...]
  },
  "userExperience": {
    "score": число_от_1_до_10,
    "suggestions": ["предложение1", "предложение2", ...]
  },
  "performance": {
    "score": число_от_1_до_10,
    "suggestions": ["предложение1", "предложение2", ...]
  },
  "security": {
    "score": число_от_1_до_10,
    "suggestions": ["предложение1", "предложение2", ...]
  },
  "overallRecommendations": ["общая_рекомендация1", "общая_рекомендация2", ...]
}

Отвечай на русском языке, будь конкретным и практичным в рекомендациях.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Извлекаем JSON из ответа
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Не удалось найти JSON в ответе AI");
      }
      
      const analysis = JSON.parse(jsonMatch[0]) as ProjectAnalysis;
      
      // Валидируем структуру ответа
      if (!analysis.codeQuality || !analysis.architecture || !analysis.userExperience || 
          !analysis.performance || !analysis.security || !analysis.overallRecommendations) {
        throw new Error("Неполная структура анализа");
      }
      
      return analysis;
    } catch (error) {
      console.error("Ошибка анализа проекта:", error);
      
      // Возвращаем базовый анализ в случае ошибки
      return {
        codeQuality: {
          score: 7,
          suggestions: ["Улучшите типизацию TypeScript", "Добавьте больше unit тестов", "Рефакторите крупные компоненты"]
        },
        architecture: {
          score: 7,
          suggestions: ["Добавьте слой сервисов", "Улучшите разделение логики", "Рассмотрите микросервисную архитектуру"]
        },
        userExperience: {
          score: 6,
          suggestions: ["Улучшите мобильную версию", "Добавьте индикаторы загрузки", "Оптимизируйте навигацию"]
        },
        performance: {
          score: 6,
          suggestions: ["Добавьте кеширование", "Оптимизируйте запросы к базе", "Внедрите lazy loading"]
        },
        security: {
          score: 7,
          suggestions: ["Усильте валидацию данных", "Добавьте rate limiting", "Улучшите обработку ошибок"]
        },
        overallRecommendations: [
          "Сосредоточьтесь на улучшении пользовательского опыта",
          "Добавьте комплексное тестирование",
          "Рассмотрите внедрение CI/CD пайплайна"
        ]
      };
    }
  }
}

export const projectAnalyzer = new ProjectAnalyzer();