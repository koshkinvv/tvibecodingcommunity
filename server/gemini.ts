import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface CommitChangesSummary {
  summary: string;
  mainChanges: string[];
  filesModified: number;
  linesAdded: number;
  linesDeleted: number;
}

export class GeminiService {
  async generateProjectDescription(repository: any, user: any): Promise<string> {
    try {
      const prompt = `
Создай краткое и понятное описание проекта на русском языке для сообщества разработчиков.

ИНФОРМАЦИЯ О ПРОЕКТЕ:
- Название: ${repository.name}
- Полное имя: ${repository.fullName}
- Владелец: ${user.name || user.username}
- Статус: ${repository.status}
- Последняя активность: ${repository.lastCommitDate ? new Date(repository.lastCommitDate).toLocaleDateString('ru-RU') : 'Нет данных'}

ТРЕБОВАНИЯ К ОПИСАНИЮ:
- Используй простой и понятный язык
- Опиши что это за проект простыми словами
- Укажи основные технологии (если можно определить по названию)
- Добавь информацию о статусе разработки
- Максимум 2-3 предложения
- Пиши на русском языке

Создай описание проекта, которое будет интересно и понятно другим разработчикам в сообществе.
`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Ошибка генерации описания проекта:', error);
      return `Проект ${repository.name} от разработчика ${user.name || user.username}. Статус: ${repository.status}.`;
    }
  }

  async generateChangesSummary(commits: any[]): Promise<string> {
    try {
      if (!commits || commits.length === 0) {
        return "Нет изменений";
      }

      // Подготавливаем данные о коммитах для анализа
      const commitData = commits.slice(0, 10).map(commit => ({
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
        files: commit.files?.map((f: any) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions
        })) || []
      }));

      const prompt = `Ты эксперт по анализу изменений в коде. Ты создаешь понятные описания изменений в репозиториях простыми словами для разработчиков.

Проанализируй изменения в GitHub репозитории и создай краткое описание на русском языке. 

Данные о коммитах:
${JSON.stringify(commitData, null, 2)}

Создай краткое и понятное описание изменений простыми словами. Ответ должен быть в формате JSON:
{
  "summary": "Краткое описание основных изменений простыми словами (максимум 2-3 предложения)"
}

Используй простые слова, избегай технических терминов. Например, вместо "рефакторинг" используй "улучшение кода", вместо "баг фикс" - "исправление ошибки".`;

      // Инициализируем модель Gemini 1.5 Flash
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 500,
          responseMimeType: "application/json"
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const parsed = JSON.parse(text);
        return parsed.summary || "Обновления в репозитории";
      } catch (parseError) {
        // Если JSON не распарсился, попробуем извлечь summary из текста
        const summaryMatch = text.match(/"summary"\s*:\s*"([^"]+)"/);
        return summaryMatch ? summaryMatch[1] : "Обновления в репозитории";
      }

    } catch (error) {
      console.error("Error generating changes summary with Gemini:", error);
      return "Не удалось проанализировать изменения";
    }
  }

  async generateDetailedSummary(commits: any[]): Promise<CommitChangesSummary> {
    try {
      if (!commits || commits.length === 0) {
        return {
          summary: "Нет изменений",
          mainChanges: [],
          filesModified: 0,
          linesAdded: 0,
          linesDeleted: 0
        };
      }

      const commitData = commits.slice(0, 10).map(commit => ({
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
        files: commit.files?.map((f: any) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions
        })) || []
      }));

      const prompt = `Ты эксперт по анализу изменений в коде. Ты создаешь понятные описания изменений в репозиториях простыми словами для разработчиков.

Проанализируй изменения в GitHub репозитории и создай детальное описание на русском языке.

Данные о коммитах:
${JSON.stringify(commitData, null, 2)}

Создай подробный анализ изменений простыми словами. Ответ должен быть в формате JSON:
{
  "summary": "Подробное описание основных изменений простыми словами",
  "mainChanges": ["список ключевых изменений", "каждое изменение отдельной строкой"],
  "filesModified": количество_измененных_файлов,
  "linesAdded": количество_добавленных_строк,
  "linesDeleted": количество_удаленных_строк
}

Используй простые слова, избегай технических терминов.`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 800,
          responseMimeType: "application/json"
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const parsed = JSON.parse(text);
        return {
          summary: parsed.summary || "Обновления в репозитории",
          mainChanges: parsed.mainChanges || [],
          filesModified: parsed.filesModified || 0,
          linesAdded: parsed.linesAdded || 0,
          linesDeleted: parsed.linesDeleted || 0
        };
      } catch (parseError) {
        return {
          summary: "Не удалось проанализировать изменения",
          mainChanges: [],
          filesModified: 0,
          linesAdded: 0,
          linesDeleted: 0
        };
      }

    } catch (error) {
      console.error("Error generating detailed summary with Gemini:", error);
      return {
        summary: "Не удалось проанализировать изменения",
        mainChanges: [],
        filesModified: 0,
        linesAdded: 0,
        linesDeleted: 0
      };
    }
  }
}

export const geminiService = new GeminiService();