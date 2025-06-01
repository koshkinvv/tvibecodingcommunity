import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY не установлен");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGeminiConnection() {
  try {
    console.log("Тестирование подключения к Gemini API...");
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = "Привет! Это тест подключения к API. Ответь коротко 'Подключение работает' на русском языке.";
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log("✅ Gemini API работает!");
    console.log("Ответ:", text);
    
    return true;
  } catch (error) {
    console.error("❌ Ошибка подключения к Gemini API:");
    console.error(error);
    return false;
  }
}

// Запускаем тест
testGeminiConnection().then(success => {
  process.exit(success ? 0 : 1);
});

export { testGeminiConnection };