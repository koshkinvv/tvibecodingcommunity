import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { 
  Code, 
  Building2, 
  Users, 
  Zap, 
  Shield, 
  Lightbulb, 
  RefreshCw,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface ProjectAnalysis {
  codeQuality: {
    score: number;
    suggestions: string[];
  };
  architecture: {
    score: number;
    suggestions: string[];
  };
  userExperience: {
    score: number;
    suggestions: string[];
  };
  performance: {
    score: number;
    suggestions: string[];
  };
  security: {
    score: number;
    suggestions: string[];
  };
  overallRecommendations: string[];
}

const ScoreCard = ({ 
  title, 
  score, 
  suggestions, 
  icon: Icon,
  color 
}: { 
  title: string; 
  score: number; 
  suggestions: string[]; 
  icon: any;
  color: string;
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant="outline" className={getScoreColor(score)}>
            {score}/10
          </Badge>
        </div>
        <div className="space-y-2">
          <Progress value={score * 10} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start space-x-2 text-sm">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{suggestion}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ProjectInsightsPage() {
  const { user } = useAuth();
  
  const { data: analysis, isLoading, error, refetch } = useQuery<ProjectAnalysis>({
    queryKey: ["/api/project/analysis"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Требуется авторизация</h2>
            <p className="text-gray-600 mb-4">Войдите в систему для получения анализа проекта.</p>
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
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Анализ проекта</h1>
            <div className="animate-spin">
              <RefreshCw className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка анализа</h2>
            <p className="text-gray-600 mb-4">Не удалось выполнить анализ проекта. Попробуйте позже.</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const overallScore = Math.round(
    (analysis.codeQuality.score + 
     analysis.architecture.score + 
     analysis.userExperience.score + 
     analysis.performance.score + 
     analysis.security.score) / 5
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Анализ проекта</h1>
            <p className="text-sm text-gray-500">
              AI анализ вашего проекта с рекомендациями по улучшению
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>

        {/* Общая оценка */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Общая оценка проекта</h2>
                <p className="text-sm text-gray-600">
                  Средний балл по всем категориям
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{overallScore}/10</div>
                  <Progress value={overallScore * 10} className="w-24 h-2 mt-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Детальные оценки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <ScoreCard
            title="Качество кода"
            score={analysis.codeQuality.score}
            suggestions={analysis.codeQuality.suggestions}
            icon={Code}
            color="text-blue-600"
          />
          
          <ScoreCard
            title="Архитектура"
            score={analysis.architecture.score}
            suggestions={analysis.architecture.suggestions}
            icon={Building2}
            color="text-purple-600"
          />
          
          <ScoreCard
            title="UX/UI"
            score={analysis.userExperience.score}
            suggestions={analysis.userExperience.suggestions}
            icon={Users}
            color="text-green-600"
          />
          
          <ScoreCard
            title="Производительность"
            score={analysis.performance.score}
            suggestions={analysis.performance.suggestions}
            icon={Zap}
            color="text-yellow-600"
          />
          
          <ScoreCard
            title="Безопасность"
            score={analysis.security.score}
            suggestions={analysis.security.suggestions}
            icon={Shield}
            color="text-red-600"
          />
        </div>

        {/* Общие рекомендации */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle>Общие рекомендации</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.overallRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Информация об анализе */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4" />
              <span>
                Анализ выполнен с помощью Google Gemini AI на основе структуры проекта и активности
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}