const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testProjectAnalyzer() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const testRepository = {
    name: "tvibecodingcommunity",
    full_name: "koshkinvv/tvibecodingcommunity",
    status: "active",
    lastCommitDate: new Date()
  };

  const testUser = {
    name: "Виктор Кошкин",
    username: "koshkinvv"
  };

  const prompt = `
Проанализируй GitHub репозиторий на основе следующих данных:

Название: ${testRepository.name}
Полное имя: ${testRepository.full_name}
Автор: ${testUser.name || testUser.username}
Статус активности: ${testRepository.status}
Последний коммит: ${testRepository.lastCommitDate || 'неизвестно'}

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

  try {
    console.log('Testing Gemini project analysis...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text();

    console.log('Raw response:', content);

    // Извлечение JSON из ответа
    let jsonStr = content.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const analysis = JSON.parse(jsonStr);
    console.log('Parsed analysis:', JSON.stringify(analysis, null, 2));

    return analysis;
  } catch (error) {
    console.error('Error analyzing project:', error);
    
    // Fallback анализ
    const fallbackAnalysis = {
      description: `Проект ${testRepository.name} - платформа для разработчиков с социальными функциями`,
      tags: ['javascript', 'веб-сайт', 'социальные-сети'],
      category: "веб-разработка",
      techStack: ['javascript', 'node'],
      complexity: 'intermediate',
      features: ['социальная платформа', 'трекинг активности'],
      recommendations: ['Добавить документацию', 'Настроить CI/CD']
    };
    
    console.log('Using fallback analysis:', fallbackAnalysis);
    return fallbackAnalysis;
  }
}

// Запускаем тест
testProjectAnalyzer()
  .then(() => console.log('Test completed'))
  .catch(error => console.error('Test failed:', error));