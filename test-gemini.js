import { geminiService } from './server/gemini.js';

// Тестовые данные коммитов
const testCommits = [
  {
    commit: {
      message: "Fix bug in user authentication",
      author: {
        name: "John Doe",
        date: "2024-01-15T10:30:00Z"
      }
    },
    stats: {
      additions: 15,
      deletions: 8
    },
    files: [
      {
        filename: "src/auth.js",
        status: "modified",
        additions: 12,
        deletions: 5
      },
      {
        filename: "src/utils.js", 
        status: "modified",
        additions: 3,
        deletions: 3
      }
    ]
  },
  {
    commit: {
      message: "Add new user profile page",
      author: {
        name: "Jane Smith",
        date: "2024-01-14T14:20:00Z"
      }
    },
    stats: {
      additions: 45,
      deletions: 2
    },
    files: [
      {
        filename: "src/components/Profile.jsx",
        status: "added",
        additions: 40,
        deletions: 0
      },
      {
        filename: "src/routes.js",
        status: "modified", 
        additions: 5,
        deletions: 2
      }
    ]
  }
];

async function testGeminiAnalysis() {
  try {
    console.log('Тестируем анализ изменений с Gemini 2.5 PRO...\n');
    
    const summary = await geminiService.generateChangesSummary(testCommits);
    console.log('Краткое описание:', summary);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    const detailedSummary = await geminiService.generateDetailedSummary(testCommits);
    console.log('Детальный анализ:');
    console.log('Описание:', detailedSummary.summary);
    console.log('Основные изменения:', detailedSummary.mainChanges);
    console.log('Файлов изменено:', detailedSummary.filesModified);
    console.log('Строк добавлено:', detailedSummary.linesAdded);
    console.log('Строк удалено:', detailedSummary.linesDeleted);
    
  } catch (error) {
    console.error('Ошибка при тестировании:', error);
  }
}

testGeminiAnalysis();