import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Repository } from "@shared/schema";
import { storage } from "./storage";
import { githubClient } from "./github";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export interface ProjectRecommendation {
  type: 'continuation' | 'improvement' | 'new_project' | 'collaboration' | 'learning';
  title: string;
  description: string;
  reasoning: string;
  actionItems: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  relatedRepositories?: string[];
  technologies?: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface UserProfile {
  programmingLanguages: string[];
  frameworks: string[];
  projectTypes: string[];
  activityLevel: 'high' | 'medium' | 'low';
  interests: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  recentActivity: {
    commitFrequency: number;
    activeProjects: number;
    daysActive: number;
  };
}

export class RecommendationEngine {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  async generateRecommendations(user: User): Promise<ProjectRecommendation[]> {
    try {
      // Получаем профиль пользователя
      const userProfile = await this.buildUserProfile(user);
      
      // Получаем репозитории пользователя
      const repositories = await storage.getRepositoriesByUser(user.id);
      
      // Получаем проекты сообщества для анализа трендов
      const communityProjects = await storage.getPublicRepositories();
      
      // Генерируем персонализированные рекомендации
      const recommendations = await this.generatePersonalizedRecommendations(
        user, 
        userProfile, 
        repositories, 
        communityProjects
      );

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  private async buildUserProfile(user: User): Promise<UserProfile> {
    const repositories = await storage.getRepositoriesByUser(user.id);
    const userProgress = await storage.getUserProgress(user.id);
    
    // Анализируем репозитории для определения технологий и интересов
    const technologies = new Set<string>();
    const projectTypes = new Set<string>();
    
    // Простая эвристика определения технологий по названиям репозиториев
    repositories.forEach(repo => {
      const name = repo.name.toLowerCase();
      const fullName = repo.fullName.toLowerCase();
      
      // Определяем языки программирования
      if (name.includes('js') || name.includes('javascript') || name.includes('node')) {
        technologies.add('JavaScript');
      }
      if (name.includes('py') || name.includes('python')) {
        technologies.add('Python');
      }
      if (name.includes('java') && !name.includes('javascript')) {
        technologies.add('Java');
      }
      if (name.includes('react')) {
        technologies.add('React');
      }
      if (name.includes('vue')) {
        technologies.add('Vue.js');
      }
      if (name.includes('angular')) {
        technologies.add('Angular');
      }
      if (name.includes('typescript') || name.includes('ts')) {
        technologies.add('TypeScript');
      }
      if (name.includes('php')) {
        technologies.add('PHP');
      }
      if (name.includes('rust')) {
        technologies.add('Rust');
      }
      if (name.includes('go') || name.includes('golang')) {
        technologies.add('Go');
      }
      
      // Определяем типы проектов
      if (name.includes('api') || name.includes('backend') || name.includes('server')) {
        projectTypes.add('Backend Development');
      }
      if (name.includes('frontend') || name.includes('ui') || name.includes('web')) {
        projectTypes.add('Frontend Development');
      }
      if (name.includes('mobile') || name.includes('android') || name.includes('ios')) {
        projectTypes.add('Mobile Development');
      }
      if (name.includes('ml') || name.includes('ai') || name.includes('data')) {
        projectTypes.add('Machine Learning');
      }
      if (name.includes('game') || name.includes('unity')) {
        projectTypes.add('Game Development');
      }
      if (name.includes('bot') || name.includes('automation')) {
        projectTypes.add('Automation');
      }
    });

    // Определяем уровень активности
    const activeRepos = repositories.filter(r => r.status === 'active').length;
    const totalRepos = repositories.length;
    let activityLevel: 'high' | 'medium' | 'low' = 'low';
    
    if (activeRepos >= totalRepos * 0.7) {
      activityLevel = 'high';
    } else if (activeRepos >= totalRepos * 0.3) {
      activityLevel = 'medium';
    }

    // Определяем уровень навыков на основе количества репозиториев и активности
    let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    const totalCommits = userProgress?.totalCommits || 0;
    
    if (totalCommits > 500 && totalRepos > 10) {
      skillLevel = 'advanced';
    } else if (totalCommits > 100 && totalRepos > 3) {
      skillLevel = 'intermediate';
    }

    return {
      programmingLanguages: Array.from(technologies),
      frameworks: [], // Будет расширено в будущем
      projectTypes: Array.from(projectTypes),
      activityLevel,
      interests: Array.from(projectTypes), // Используем типы проектов как интересы
      skillLevel,
      recentActivity: {
        commitFrequency: userProgress?.totalCommits || 0,
        activeProjects: activeRepos,
        daysActive: userProgress?.activeDays || 0
      }
    };
  }

  private async generatePersonalizedRecommendations(
    user: User,
    profile: UserProfile,
    repositories: Repository[],
    communityProjects: (Repository & { user: User })[]
  ): Promise<ProjectRecommendation[]> {
    
    const inactiveRepos = repositories.filter(r => r.status === 'inactive' || r.status === 'warning');
    const activeRepos = repositories.filter(r => r.status === 'active');
    
    // Формируем контекст для AI
    const context = `
ПЕРСОНАЛИЗИРОВАННЫЕ РЕКОМЕНДАЦИИ ДЛЯ РАЗРАБОТЧИКА

ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:
- Имя: ${user.name || user.username}
- Уровень навыков: ${profile.skillLevel}
- Уровень активности: ${profile.activityLevel}
- Технологии: ${profile.programmingLanguages.join(', ') || 'Не определены'}
- Типы проектов: ${profile.projectTypes.join(', ') || 'Не определены'}
- Активных проектов: ${activeRepos.length}
- Неактивных проектов: ${inactiveRepos.length}
- Общий опыт: ${profile.recentActivity.commitFrequency} коммитов, ${profile.recentActivity.daysActive} активных дней

РЕПОЗИТОРИИ ПОЛЬЗОВАТЕЛЯ:
${repositories.map(repo => `
- ${repo.name} (${repo.status}): ${repo.description || 'Без описания'}
  Последний коммит: ${repo.lastCommitDate ? new Date(repo.lastCommitDate).toLocaleDateString('ru-RU') : 'Неизвестно'}
`).join('')}

ТРЕНДЫ В СООБЩЕСТВЕ:
${communityProjects.slice(0, 10).map(project => `
- ${project.name} от ${project.user.username}: ${project.description || 'Без описания'}
`).join('')}

ЗАДАЧА: Создай 5-7 персонализированных рекомендаций для этого разработчика. Рекомендации должны быть:
1. Практичными и выполнимыми
2. Соответствующими уровню навыков
3. Мотивирующими к росту
4. Учитывающими текущие проекты и интересы

ТИПЫ РЕКОМЕНДАЦИЙ:
- continuation: продолжение заброшенных проектов
- improvement: улучшение существующих проектов
- new_project: новые проекты для развития навыков
- collaboration: совместная работа с сообществом
- learning: изучение новых технологий

Ответь в формате JSON массива объектов ProjectRecommendation.
`;

    try {
      const result = await this.model.generateContent(context);
      const response = result.response;
      const text = response.text();
      
      // Парсим JSON ответ
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const recommendations = JSON.parse(jsonMatch[0]) as ProjectRecommendation[];
      
      // Валидируем и дополняем рекомендации
      return recommendations.map(rec => ({
        ...rec,
        priority: rec.priority || 'medium',
        difficulty: rec.difficulty || profile.skillLevel,
        estimatedTime: rec.estimatedTime || 'Не определено',
        actionItems: rec.actionItems || [],
        technologies: rec.technologies || profile.programmingLanguages
      })).slice(0, 7); // Ограничиваем до 7 рекомендаций
      
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      
      // Fallback: базовые рекомендации на основе профиля
      return this.generateFallbackRecommendations(user, profile, repositories);
    }
  }

  private generateFallbackRecommendations(
    user: User,
    profile: UserProfile,
    repositories: Repository[]
  ): ProjectRecommendation[] {
    const recommendations: ProjectRecommendation[] = [];
    
    // Рекомендация для неактивных проектов
    const inactiveRepos = repositories.filter(r => r.status === 'inactive' || r.status === 'warning');
    if (inactiveRepos.length > 0) {
      recommendations.push({
        type: 'continuation',
        title: 'Возобновите заброшенные проекты',
        description: `У вас есть ${inactiveRepos.length} проект(ов), которые давно не обновлялись. Возможно, стоит их доработать или архивировать.`,
        reasoning: 'Завершение начатых проектов важно для портфолио и личной мотивации',
        actionItems: [
          'Просмотрите код и документацию',
          'Определите, что нужно доделать',
          'Составьте план завершения или рефакторинга'
        ],
        difficulty: profile.skillLevel,
        estimatedTime: '1-2 недели',
        relatedRepositories: inactiveRepos.slice(0, 3).map(r => r.name),
        priority: 'high'
      });
    }

    // Рекомендация изучения новых технологий
    recommendations.push({
      type: 'learning',
      title: 'Изучите современные технологии',
      description: 'Расширьте свой технологический стек изучением новых инструментов и фреймворков.',
      reasoning: 'Постоянное обучение критично для роста разработчика',
      actionItems: [
        'Выберите интересную технологию',
        'Создайте pet-проект для практики',
        'Поделитесь результатами с сообществом'
      ],
      difficulty: profile.skillLevel === 'beginner' ? 'intermediate' : 'advanced',
      estimatedTime: '2-4 недели',
      technologies: profile.skillLevel === 'beginner' ? ['React', 'Node.js'] : ['Docker', 'Kubernetes', 'GraphQL'],
      priority: 'medium'
    });

    // Рекомендация для совместной работы
    recommendations.push({
      type: 'collaboration',
      title: 'Присоединитесь к open source проекту',
      description: 'Участие в открытых проектах поможет получить опыт командной работы и обратную связь.',
      reasoning: 'Опыт работы в команде и код-ревью ускоряют профессиональный рост',
      actionItems: [
        'Найдите интересный open source проект',
        'Изучите contributing guidelines',
        'Начните с исправления небольших багов'
      ],
      difficulty: profile.skillLevel,
      estimatedTime: 'Постоянно',
      priority: 'medium'
    });

    return recommendations;
  }

  async getRecommendationById(user: User, recommendationId: string): Promise<ProjectRecommendation | null> {
    // В будущем можно сохранять рекомендации в базе данных для повторного доступа
    // Пока возвращаем null, так как рекомендации генерируются динамически
    return null;
  }

  async markRecommendationAsCompleted(user: User, recommendationId: string): Promise<boolean> {
    // Функция для отметки рекомендации как выполненной
    // Будет реализована при добавлении хранения рекомендаций в БД
    return true;
  }
}

export const recommendationEngine = new RecommendationEngine();