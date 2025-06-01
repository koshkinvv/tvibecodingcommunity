import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { 
  Code, 
  Building2, 
  Users, 
  Zap, 
  Shield, 
  Lightbulb, 
  RefreshCw,
  AlertCircle,
  GitBranch
} from "lucide-react";

interface ProjectAnalysis {
  codeQuality: {
    suggestions: string[];
  };
  architecture: {
    suggestions: string[];
  };
  userExperience: {
    suggestions: string[];
  };
  performance: {
    suggestions: string[];
  };
  security: {
    suggestions: string[];
  };
  overallRecommendations: string[];
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  status: string;
}

const RecommendationCard = ({ 
  title, 
  suggestions, 
  icon: Icon,
  color 
}: { 
  title: string; 
  suggestions: string[]; 
  icon: any;
  color: string;
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <CardTitle className="text-lg">{title}</CardTitle>
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
  const [selectedRepository, setSelectedRepository] = useState<string>("");
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Получаем список репозиториев пользователя
  const { data: repositories } = useQuery<Repository[]>({
    queryKey: ["/api/user/repositories"],
    enabled: !!user,
  });

  const handleAnalyze = async () => {
    if (!selectedRepository) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/project/analysis?repositoryId=${selectedRepository}`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Ошибка при анализе проекта");
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Анализ проекта</h1>
          <p className="text-sm text-gray-500">
            AI анализ вашего проекта с рекомендациями по улучшению
          </p>
        </div>

        {/* Выбор репозитория */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <GitBranch className="h-5 w-5 text-blue-600" />
              <CardTitle>Выберите репозиторий для анализа</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedRepository} onValueChange={setSelectedRepository}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите репозиторий" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories?.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{repo.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            repo.status === 'active' ? 'bg-green-100 text-green-700' :
                            repo.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {repo.status}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAnalyze} 
                disabled={!selectedRepository || isLoading}
                className="whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Анализируем...
                  </>
                ) : (
                  "Получить рекомендации"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ошибка */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Результаты анализа */}
        {analysis && (
          <>
            {/* Рекомендации по категориям */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <RecommendationCard
                title="Качество кода"
                suggestions={analysis.codeQuality.suggestions}
                icon={Code}
                color="text-blue-600"
              />
              
              <RecommendationCard
                title="Архитектура"
                suggestions={analysis.architecture.suggestions}
                icon={Building2}
                color="text-purple-600"
              />
              
              <RecommendationCard
                title="UX/UI"
                suggestions={analysis.userExperience.suggestions}
                icon={Users}
                color="text-green-600"
              />
              
              <RecommendationCard
                title="Производительность"
                suggestions={analysis.performance.suggestions}
                icon={Zap}
                color="text-yellow-600"
              />
              
              <RecommendationCard
                title="Безопасность"
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
          </>
        )}

        {/* Пустое состояние */}
        {!analysis && !isLoading && !error && (
          <Card>
            <CardContent className="p-8 text-center">
              <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Выберите репозиторий</h3>
              <p className="text-gray-600">
                Выберите репозиторий из списка выше и нажмите "Получить рекомендации" для начала анализа
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}