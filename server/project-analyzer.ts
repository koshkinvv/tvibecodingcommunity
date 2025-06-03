import { GoogleGenerativeAI } from "@google/generative-ai";
import { Repository, User } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ProjectAnalysisResult {
  description: string;
  tags: string[];
  category: string;
  techStack: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  features: string[];
  recommendations: string[];
}

export class ProjectAnalyzer {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  async analyzeRepository(repository: any, user: User): Promise<ProjectAnalysisResult> {
    try {
      const prompt = `
Проанализируй GitHub репозиторий на основе следующих данных:

Название: ${repository.name}
Полное имя: ${repository.full_name}
Автор: ${user.name || user.username}
Статус активности: ${repository.status}
Последний коммит: ${repository.lastCommitDate || 'неизвестно'}

Задача: Создать краткое, но информативное описание проекта на русском языке и определить теги для фильтрации.

Верни результат СТРОГО в JSON формате без дополнительного текста:
{
  "description": "Краткое описание проекта (2-3 предложения)",
  "tags": ["тег1", "тег2", "тег3"],
  "category": "категория проекта",
  "techStack": ["технология1", "технология2"],
  "complexity": "beginner|intermediate|advanced",
  "features": ["функция1", "функция2"],
  "recommendations": ["рекомендация1", "рекомендация2"]
}

Используй следующие популярные теги для фильтрации:
- Языки: "javascript", "python", "typescript", "java", "csharp", "cpp", "go", "rust", "php", "swift"
- Фреймворки: "react", "vue", "angular", "node", "django", "flask", "spring", "dotnet", "laravel"
- Типы: "веб-сайт", "мобильное-приложение", "api", "библиотека", "утилита", "игра", "бот", "десктоп-приложение"
- Области: "ecommerce", "образование", "финансы", "здравоохранение", "развлечения", "продуктивность", "социальные-сети"
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const content = response.text();

      if (!content) {
        throw new Error("Пустой ответ от Gemini");
      }

      // Извлечение JSON из ответа
      let jsonStr = content.trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const analysis = JSON.parse(jsonStr) as ProjectAnalysisResult;
      
      // Валидация и очистка данных
      return {
        description: analysis.description || "Описание недоступно",
        tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 5) : [],
        category: analysis.category || "другое",
        techStack: Array.isArray(analysis.techStack) ? analysis.techStack.slice(0, 8) : [],
        complexity: ['beginner', 'intermediate', 'advanced'].includes(analysis.complexity) 
          ? analysis.complexity 
          : 'intermediate',
        features: Array.isArray(analysis.features) ? analysis.features.slice(0, 6) : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.slice(0, 4) : []
      };

    } catch (error) {
      console.error("Error analyzing repository:", error);
      
      // Fallback анализ на основе имени репозитория
      return this.createFallbackAnalysis(repository);
    }
  }

  private createFallbackAnalysis(repository: any): ProjectAnalysisResult {
    const name = repository.name.toLowerCase();
    const tags: string[] = [];
    let category = "другое";
    const techStack: string[] = [];

    // Простая эвристика на основе названия
    if (name.includes('web') || name.includes('site') || name.includes('landing')) {
      tags.push('веб-сайт');
      category = "веб-разработка";
    }
    if (name.includes('app') || name.includes('mobile')) {
      tags.push('мобильное-приложение');
      category = "мобильные приложения";
    }
    if (name.includes('api') || name.includes('server') || name.includes('backend')) {
      tags.push('api');
      category = "веб-разработка";
    }
    if (name.includes('bot') || name.includes('telegram') || name.includes('discord')) {
      tags.push('бот');
      category = "утилиты";
    }
    if (name.includes('game') || name.includes('play')) {
      tags.push('игра');
      category = "игры";
    }

    // Определение технологий по названию
    if (name.includes('react')) {
      techStack.push('react');
      tags.push('javascript');
    }
    if (name.includes('vue')) {
      techStack.push('vue');
      tags.push('javascript');
    }
    if (name.includes('node') || name.includes('express')) {
      techStack.push('node');
      tags.push('javascript');
    }
    if (name.includes('python') || name.includes('django') || name.includes('flask')) {
      tags.push('python');
    }

    return {
      description: `Проект ${repository.name} - разработка в области ${category}`,
      tags: tags.length > 0 ? tags : ['другое'],
      category,
      techStack,
      complexity: 'intermediate' as const,
      features: [],
      recommendations: ['Добавить документацию', 'Настроить CI/CD']
    };
  }

  // Получение всех доступных тегов для фильтрации
  static getAvailableTags(): Record<string, string[]> {
    return {
      "Языки программирования": [
        "javascript", "python", "typescript", "java", "csharp", 
        "cpp", "go", "rust", "php", "swift", "kotlin", "dart"
      ],
      "Фреймворки и технологии": [
        "react", "vue", "angular", "node", "django", "flask", 
        "spring", "dotnet", "laravel", "nextjs", "nuxt", "svelte"
      ],
      "Типы проектов": [
        "веб-сайт", "мобильное-приложение", "api", "библиотека", 
        "утилита", "игра", "бот", "десктоп-приложение", "расширение"
      ],
      "Области применения": [
        "ecommerce", "образование", "финансы", "здравоохранение", 
        "развлечения", "продуктивность", "социальные-сети", "аналитика"
      ],
      "Уровень сложности": [
        "beginner", "intermediate", "advanced"
      ]
    };
  }
}

export const projectAnalyzer = new ProjectAnalyzer();