import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log('Доступные модели Gemini:');
    for await (const model of models) {
      console.log(`- ${model.name}`);
      console.log(`  Поддерживает generateContent: ${model.supportedGenerationMethods.includes('generateContent')}`);
    }
  } catch (error) {
    console.error('Ошибка при получении списка моделей:', error);
  }
}

listModels();