import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Repository } from "@shared/schema";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export interface ProjectAnalysis {
  codeQuality: {
    suggestions: string[];
  };
  architecture: {
    suggestions: string[];
  };
  userExperience: {
    suggestions: string[];
  };
  performance: {
    suggestions: string[];
  };
  security: {
    suggestions: string[];
  };
  overallRecommendations: string[];
}

export class ProjectAnalyzer {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  async analyzeSpecificRepository(user: User, repository: Repository): Promise<ProjectAnalysis> {
    const daysSinceLastCommit = repository.lastCommitDate 
      ? Math.floor((Date.now() - new Date(repository.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const projectContext = `
АНАЛИЗ КОНКРЕТНОГО РЕПОЗИТОРИЯ: ${repository.name}

ИНФОРМАЦИЯ О РАЗРАБОТЧИКЕ:
- Пользователь: ${user.name || user.username}
- GitHub: ${user.username}

ДЕТАЛИ РЕПОЗИТОРИЯ:
- Название: ${repository.name}
- Полное имя: ${repository.fullName}
- Статус: ${repository.status}
- Дней с последнего коммита: ${daysSinceLastCommit}
- Последние изменения: ${repository.changesSummary || "Нет данных об изменениях"}
- Дата создания: ${new Date(repository.createdAt || Date.now()).toLocaleDateString('ru-RU')}
- Последний коммит: ${repository.lastCommitDate ? new Date(repository.lastCommitDate).toLocaleDateString('ru-RU') : 'Нет данных'}

ТЕХНИЧЕСКИЙ КОНТЕКСТ:
Это система мониторинга GitHub репозиториев с интеграцией AI анализа.
`;

    const prompt = `
Проанализируй конкретный репозиторий "${repository.name}" и дай персонализированные рекомендации:

${projectContext}

СПЕЦИФИЧНЫЙ АНАЛИЗ РЕПОЗИТОРИЯ:
1. Учти статус репозитория: ${repository.status}
2. Обрати внимание на активность: ${daysSinceLastCommit} дней с последнего коммита
3. Проанализируй последние изменения: ${repository.changesSummary || "Данные недоступны"}
4. Дай конкретные советы именно для репозитория "${repository.name}"

РЕКОМЕНДАЦИИ ДОЛЖНЫ БЫТЬ:
- Специфичными для репозитория "${repository.name}"
- Учитывающими его текущий статус (${repository.status})
- Практичными и выполнимыми
- Нацеленными на улучшение активности и качества

Верни результат СТРОГО в JSON формате:
{
  "codeQuality": {
    "suggestions": ["конкретная рекомендация для ${repository.name}", "специфичная рекомендация по коду", "практический совет по улучшению"]
  },
  "architecture": {
    "suggestions": ["архитектурная рекомендация для ${repository.name}", "совет по структуре проекта", "предложение по организации кода"]
  },
  "userExperience": {
    "suggestions": ["UX рекомендация для ${repository.name}", "совет по пользовательскому интерфейсу", "предложение по удобству использования"]
  },
  "performance": {
    "suggestions": ["рекомендация по производительности для ${repository.name}", "совет по оптимизации", "предложение по ускорению"]
  },
  "security": {
    "suggestions": ["рекомендация по безопасности для ${repository.name}", "совет по защите данных", "предложение по безопасности кода"]
  },
  "overallRecommendations": ["общая рекомендация для репозитория ${repository.name}", "стратегический совет", "долгосрочное предложение"]
}

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Все рекомендации ТОЛЬКО на русском языке
- Упоминай название репозитория "${repository.name}" в рекомендациях
- Учитывай реальный статус и активность репозитория
- Ответь ТОЛЬКО в JSON формате, без дополнительного текста
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Очищаем ответ от лишних символов
      const cleanedText = text.replace(/```json|```/g, '').trim();
      
      const analysis = JSON.parse(cleanedText);
      return analysis;
    } catch (error) {
      console.error('Ошибка анализа конкретного репозитория:', error);
      throw new Error('Не удалось выполнить анализ репозитория');
    }
  }

  async analyzeUserProject(user: User, repositories: Repository[]): Promise<ProjectAnalysis> {
    const activeRepos = repositories.filter(repo => repo.status === 'active');
    const inactiveRepos = repositories.filter(repo => repo.status === 'inactive');
    const warningRepos = repositories.filter(repo => repo.status === 'warning');
    const totalRepos = repositories.length;
    
    const lastActivity = repositories.reduce((latest, repo) => {
      const repoDate = repo.lastCommitDate ? new Date(repo.lastCommitDate) : new Date(0);
      return repoDate > latest ? repoDate : latest;
    }, new Date(0));

    const daysSinceLastActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    // Определяем уровень активности пользователя
    let activityLevel = "высокий";
    if (daysSinceLastActivity > 7) activityLevel = "средний";
    if (daysSinceLastActivity > 30) activityLevel = "низкий";
    
    // Анализируем конкретные репозитории
    const repoAnalysis = repositories.map(repo => {
      const daysSinceCommit = repo.lastCommitDate 
        ? Math.floor((Date.now() - new Date(repo.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      return {
        name: repo.name,
        status: repo.status,
        daysSinceCommit,
        summary: repo.changesSummary || "Нет данных об изменениях",
        hasRecentActivity: daysSinceCommit <= 7
      };
    });

    // Создаем контекст проекта для анализа
    const projectContext = `
АНАЛИЗ РАЗРАБОТЧИКА: ${user.name || user.username}

ОБЩАЯ СТАТИСТИКА:
- Общее количество репозиториев: ${totalRepos}
- Активные репозитории: ${activeRepos.length}
- Репозитории с предупреждениями: ${warningRepos.length}
- Неактивные репозитории: ${inactiveRepos.length}
- Уровень активности: ${activityLevel}
- Дней с последней активности: ${daysSinceLastActivity}

ДЕТАЛИ ПО РЕПОЗИТОРИЯМ:
${repoAnalysis.map(repo => `
• ${repo.name}:
  - Статус: ${repo.status}
  - Дней с последнего коммита: ${repo.daysSinceCommit}
  - Последние изменения: ${repo.summary}
  - Недавняя активность: ${repo.hasRecentActivity ? 'Да' : 'Нет'}
`).join('')}

ТЕХНИЧЕСКИЙ КОНТЕКСТ:
Проект представляет собой систему мониторинга GitHub репозиториев с использованием:
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript  
- База данных: PostgreSQL + Drizzle ORM
- AI: Google Gemini API
- Аутентификация: GitHub OAuth
- Развертывание: Replit
`;

    const prompt = `
Проанализируй активность разработчика и дай персонализированные рекомендации на основе РЕАЛЬНЫХ данных:

${projectContext}

ВАЖНЫЕ ИНСТРУКЦИИ ДЛЯ АНАЛИЗА:
1. Обрати внимание на уровень активности (${activityLevel})
2. Учти количество неактивных репозиториев (${inactiveRepos.length})
3. Проанализируй последнюю активность (${daysSinceLastActivity} дней назад)
4. Дай конкретные советы для каждого репозитория по имени
5. Рекомендации должны быть уникальными для этого разработчика

ПЕРСОНАЛИЗИРОВАННЫЕ РЕКОМЕНДАЦИИ:
- Если есть неактивные репозитории - дай советы по их реактивации
- Если активность низкая - предложи стратегии повышения активности
- Если репозитории активные - дай советы по их улучшению
- Упоминай конкретные названия репозиториев в рекомендациях

Верни результат СТРОГО в JSON формате:
{
  "codeQuality": {
    "suggestions": ["персонализированная рекомендация 1", "персонализированная рекомендация 2", "персонализированная рекомендация 3"]
  },
  "architecture": {
    "suggestions": ["персонализированная рекомендация 1", "персонализированная рекомендация 2", "персонализированная рекомендация 3"]
  },
  "userExperience": {
    "suggestions": ["персонализированная рекомендация 1", "персонализированная рекомендация 2", "персонализированная рекомендация 3"]
  },
  "performance": {
    "suggestions": ["персонализированная рекомендация 1", "персонализированная рекомендация 2", "персонализированная рекомендация 3"]
  },
  "security": {
    "suggestions": ["персонализированная рекомендация 1", "персонализированная рекомендация 2", "персонализированная рекомендация 3"]
  },
  "overallRecommendations": ["общая персонализированная рекомендация 1", "общая персонализированная рекомендация 2", "общая персонализированная рекомендация 3"]
}

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Все рекомендации ТОЛЬКО на русском языке
- Упоминай конкретные названия репозиториев где возможно
- Рекомендации должны отражать реальное состояние проектов
- Ответь ТОЛЬКО в JSON формате, без дополнительного текста
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
          suggestions: ["Улучшите типизацию TypeScript", "Добавьте больше unit тестов", "Рефакторите крупные компоненты"]
        },
        architecture: {
          suggestions: ["Добавьте слой сервисов", "Улучшите разделение логики", "Рассмотрите микросервисную архитектуру"]
        },
        userExperience: {
          suggestions: ["Улучшите мобильную версию", "Добавьте индикаторы загрузки", "Оптимизируйте навигацию"]
        },
        performance: {
          suggestions: ["Добавьте кеширование", "Оптимизируйте запросы к базе", "Внедрите lazy loading"]
        },
        security: {
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