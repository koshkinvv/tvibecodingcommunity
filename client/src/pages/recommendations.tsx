import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { 
  Lightbulb, 
  Clock, 
  Target, 
  CheckCircle2, 
  RefreshCw,
  ArrowRight,
  Code2,
  GitBranch,
  Users,
  BookOpen,
  Zap,
  AlertCircle
} from "lucide-react";

interface ProjectRecommendation {
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

interface RecommendationsResponse {
  recommendations: ProjectRecommendation[];
  generatedAt: string;
  userId: number;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'continuation': return GitBranch;
    case 'improvement': return Zap;
    case 'new_project': return Code2;
    case 'collaboration': return Users;
    case 'learning': return BookOpen;
    default: return Lightbulb;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'continuation': return 'Продолжение проекта';
    case 'improvement': return 'Улучшение';
    case 'new_project': return 'Новый проект';
    case 'collaboration': return 'Сотрудничество';
    case 'learning': return 'Обучение';
    default: return type;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800';
    case 'advanced': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const RecommendationCard = ({ recommendation }: { recommendation: ProjectRecommendation }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = getTypeIcon(recommendation.type);

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <IconComponent className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg leading-tight">{recommendation.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getPriorityColor(recommendation.priority)}>
                  {recommendation.priority === 'high' ? 'Высокий приоритет' : 
                   recommendation.priority === 'medium' ? 'Средний приоритет' : 'Низкий приоритет'}
                </Badge>
                <Badge className={getDifficultyColor(recommendation.difficulty)}>
                  {recommendation.difficulty === 'beginner' ? 'Начинающий' :
                   recommendation.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Badge variant="outline" className="mb-2">
            {getTypeLabel(recommendation.type)}
          </Badge>
          <p className="text-gray-700 text-sm leading-relaxed">
            {recommendation.description}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{recommendation.estimatedTime}</span>
          </div>
          {recommendation.technologies && recommendation.technologies.length > 0 && (
            <div className="flex items-center gap-1">
              <Code2 className="h-4 w-4" />
              <span>{recommendation.technologies.slice(0, 2).join(', ')}</span>
              {recommendation.technologies.length > 2 && (
                <span className="text-gray-400">+{recommendation.technologies.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Обоснование:</h4>
              <p className="text-sm text-gray-600">{recommendation.reasoning}</p>
            </div>
            
            {recommendation.actionItems.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">План действий:</h4>
                <ul className="space-y-1">
                  {recommendation.actionItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <ArrowRight className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {recommendation.relatedRepositories && recommendation.relatedRepositories.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Связанные репозитории:</h4>
                <div className="flex flex-wrap gap-1">
                  {recommendation.relatedRepositories.map((repo, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {repo}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? 'Свернуть' : 'Подробнее'}
          </Button>
          <Button size="sm" className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3" />
            Начать
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function RecommendationsPage() {
  const { user } = useAuth();

  const { data: response, isLoading, error, refetch } = useQuery<RecommendationsResponse>({
    queryKey: ["/api/recommendations"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: false
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Требуется авторизация</h2>
            <p className="text-gray-600 mb-4">Войдите в систему для получения персонализированных рекомендаций.</p>
            <Button asChild>
              <a href="/api/auth/github">Войти через GitHub</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-96 mt-2"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка загрузки</h2>
            <p className="text-gray-600 mb-4">Не удалось сгенерировать рекомендации</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recommendations = response?.recommendations || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              Персональные рекомендации
            </h1>
            <p className="text-gray-600 mt-1">
              AI-анализ ваших проектов и персонализированные советы для развития
            </p>
            {response?.generatedAt && (
              <p className="text-sm text-gray-500 mt-1">
                Обновлено: {new Date(response.generatedAt).toLocaleString('ru-RU')}
              </p>
            )}
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
        </div>

        {recommendations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет рекомендаций</h3>
              <p className="text-gray-600 mb-4">
                Добавьте репозитории и начните программировать, чтобы получить персональные рекомендации
              </p>
              <Button asChild>
                <a href="/profile">Добавить репозитории</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((recommendation, index) => (
                <RecommendationCard key={index} recommendation={recommendation} />
              ))}
            </div>
            
            <Card className="bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Как работают рекомендации?</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Наш AI анализирует ваши репозитории, уровень активности, используемые технологии и тренды в сообществе, 
                      чтобы предложить персонализированные пути развития. Рекомендации обновляются на основе вашей активности.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}