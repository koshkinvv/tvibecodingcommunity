import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Repository } from "@shared/schema";
import { githubClient } from "./github";

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

    // Получаем реальную структуру и код репозитория
    console.log(`Получаю структуру репозитория: ${repository.fullName}`);
    
    if (!user.githubToken) {
      throw new Error('GitHub токен не найден. Требуется повторная авторизация.');
    }

    githubClient.setToken(user.githubToken);
    
    let repoStructure;
    try {
      repoStructure = await githubClient.getRepositoryStructure(repository.fullName);
    } catch (error) {
      console.error('Ошибка получения структуры репозитория:', error);
      throw new Error('Не удалось получить содержимое репозитория. Проверьте права доступа.');
    }

    // Анализируем технологический стек
    const techStack = [];
    if (repoStructure.packageJson) {
      const deps = { ...repoStructure.packageJson.dependencies, ...repoStructure.packageJson.devDependencies };
      if (deps.react) techStack.push('React');
      if (deps.typescript) techStack.push('TypeScript');
      if (deps['@types/node']) techStack.push('Node.js');
      if (deps.tailwindcss) techStack.push('Tailwind CSS');
      if (deps.express) techStack.push('Express');
      if (deps.drizzle) techStack.push('Drizzle ORM');
    }

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

СТРУКТУРА ПРОЕКТА:
- Общее количество файлов: ${repoStructure.totalFiles}
- Типы файлов: ${Object.entries(repoStructure.fileTypes).map(([ext, count]) => `${ext}: ${count}`).join(', ')}
- Технологический стек: ${techStack.join(', ') || 'Не определен'}

README СОДЕРЖИМОЕ:
${repoStructure.readme ? repoStructure.readme.substring(0, 2000) : 'README файл не найден'}

PACKAGE.JSON АНАЛИЗ:
${repoStructure.packageJson ? `
- Название: ${repoStructure.packageJson.name || 'Не указано'}
- Описание: ${repoStructure.packageJson.description || 'Не указано'}
- Версия: ${repoStructure.packageJson.version || 'Не указано'}
- Скрипты: ${Object.keys(repoStructure.packageJson.scripts || {}).join(', ')}
- Основные зависимости: ${Object.keys(repoStructure.packageJson.dependencies || {}).slice(0, 10).join(', ')}
` : 'Package.json не найден'}

КЛЮЧЕВЫЕ ФАЙЛЫ ПРОЕКТА:
${repoStructure.mainFiles.map(file => `
Файл: ${file.path} (${file.size} байт)
Содержимое:
${file.content}
---
`).join('\n')}

ТЕХНИЧЕСКИЙ КОНТЕКСТ:
Это система мониторинга GitHub репозиториев с интеграцией AI анализа.
`;

    const prompt = `
Проанализируй конкретный репозиторий "${repository.name}" на основе его РЕАЛЬНОГО КОДА и структуры:

${projectContext}

ГЛУБОКИЙ АНАЛИЗ НА ОСНОВЕ КОДА:
1. Изучи архитектуру проекта по файловой структуре и коду
2. Проанализируй качество кода в представленных файлах
3. Оцени технологический стек и его использование
4. Рассмотри README и package.json для понимания назначения проекта
5. Дай конкретные советы на основе РЕАЛЬНОГО кода

ОСОБОЕ ВНИМАНИЕ:
- Статус репозитория: ${repository.status}
- Активность: ${daysSinceLastCommit} дней с последнего коммита
- Технологии: ${techStack.join(', ') || 'Анализируй из кода'}
- Реальные файлы и их содержимое представлены выше

КРИТЕРИИ АНАЛИЗА:
- Анализируй НАСТОЯЩИЙ код, а не общие рекомендации
- Учитывай специфику технологий, используемых в проекте
- Давай конкретные советы по улучшению существующего кода
- Находи реальные проблемы в архитектуре и коде

Верни результат СТРОГО в JSON формате:
{
  "codeQuality": {
    "suggestions": ["конкретная рекомендация на основе анализа кода ${repository.name}", "улучшение качества найденных файлов", "оптимизация существующих компонентов"]
  },
  "architecture": {
    "suggestions": ["архитектурное улучшение на основе структуры ${repository.name}", "реорганизация найденных модулей", "улучшение существующей архитектуры"]
  },
  "userExperience": {
    "suggestions": ["UX улучшение на основе анализа интерфейса ${repository.name}", "улучшение пользовательского опыта в найденных компонентах", "оптимизация взаимодействия"]
  },
  "performance": {
    "suggestions": ["оптимизация производительности ${repository.name} на основе кода", "улучшение скорости загрузки найденных компонентов", "оптимизация существующих алгоритмов"]
  },
  "security": {
    "suggestions": ["усиление безопасности ${repository.name} на основе найденного кода", "защита от уязвимостей в существующих файлах", "улучшение безопасности API"]
  },
  "overallRecommendations": ["стратегическая рекомендация для развития ${repository.name}", "долгосрочный план улучшения проекта", "приоритетные направления развития"]
}

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Рекомендации ТОЛЬКО на русском языке
- Анализируй РЕАЛЬНЫЙ код, а не давай общие советы
- Ссылайся на конкретные файлы и технологии из проекта
- Ответь ТОЛЬКО в JSON формате без дополнительного текста
`;

    try {
      console.log(`Начинаю анализ репозитория: ${repository.name}`);
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      console.log(`Получен ответ от AI для репозитория: ${repository.name}`);
      
      // Очищаем ответ от лишних символов
      const cleanedText = text.replace(/```json|```/g, '').trim();
      
      try {
        const analysis = JSON.parse(cleanedText);
        console.log(`Анализ репозитория ${repository.name} успешно завершен`);
        return analysis;
      } catch (parseError) {
        console.error('Ошибка парсинга JSON ответа:', parseError);
        console.log('Сырой ответ:', text);
        throw new Error('Ошибка обработки ответа AI');
      }
    } catch (error) {
      console.error('Ошибка анализа конкретного репозитория:', error);
      if (error instanceof Error && error.message.includes('API key')) {
        throw new Error('Проблема с API ключом Gemini. Проверьте настройки.');
      }
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