import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CommitChangesSummary {
  summary: string;
  mainChanges: string[];
  filesModified: number;
  linesAdded: number;
  linesDeleted: number;
}

export class OpenAIService {
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

      const prompt = `Проанализируй изменения в GitHub репозитории и создай краткое описание на русском языке. 

Данные о коммитах:
${JSON.stringify(commitData, null, 2)}

Создай краткое и понятное описание изменений простыми словами. Ответ должен быть в формате JSON:
{
  "summary": "Краткое описание основных изменений простыми словами (максимум 2-3 предложения)",
  "mainChanges": ["список ключевых изменений", "каждое изменение отдельной строкой"],
  "filesModified": количество_измененных_файлов,
  "linesAdded": количество_добавленных_строк,
  "linesDeleted": количество_удаленных_строк
}

Используй простые слова, избегай технических терминов. Например, вместо "рефакторинг" используй "улучшение кода", вместо "баг фикс" - "исправление ошибки".`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Ты эксперт по анализу изменений в коде. Ты создаешь понятные описания изменений в репозиториях простыми словами для разработчиков. Отвечай только в формате JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Возвращаем только summary для хранения в базе данных
      return result.summary || "Обновления в репозитории";

    } catch (error) {
      console.error("Error generating changes summary:", error);
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

      const prompt = `Проанализируй изменения в GitHub репозитории и создай детальное описание на русском языке.

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

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Ты эксперт по анализу изменений в коде. Ты создаешь понятные описания изменений в репозиториях простыми словами для разработчиков. Отвечай только в формате JSON."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        summary: result.summary || "Обновления в репозитории",
        mainChanges: result.mainChanges || [],
        filesModified: result.filesModified || 0,
        linesAdded: result.linesAdded || 0,
        linesDeleted: result.linesDeleted || 0
      };

    } catch (error) {
      console.error("Error generating detailed summary:", error);
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

export const openaiService = new OpenAIService();