import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserProgressCard } from '@/components/progress/user-progress-card';
import { Leaderboard } from '@/components/progress/leaderboard';
import { Trophy, Users, Target, TrendingUp, RefreshCw, Info, GitCommit, Calendar, Flame, Star, Zap } from 'lucide-react';

interface LeaderboardEntry {
  user: {
    id: number;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  progress: {
    id: number;
    userId: number;
    totalCommits: number;
    activeDays: number;
    currentStreak: number;
    longestStreak: number;
    level: number;
    experience: number;
    lastActivityDate: string | null;
    badges: any[];
    updatedAt: string | null;
  };
}

export default function ProgressPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user's progress
  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: [`/api/progress/${user?.id}`],
    enabled: !!user,
  });

  // Fetch leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard'],
  });

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Требуется авторизация</h2>
            <p className="text-gray-600 mb-4">Войдите в систему для просмотра прогресса.</p>
            <Button asChild>
              <a href="/api/auth/github">Войти через GitHub</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (progressLoading || leaderboardLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded"></div>
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Прогресс участников</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchLeaderboard()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Правила
            </TabsTrigger>
            <TabsTrigger value="leaderboard-level" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              По уровню
            </TabsTrigger>
            <TabsTrigger value="leaderboard-commits" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              По коммитам
            </TabsTrigger>
            <TabsTrigger value="leaderboard-streak" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              По сериям
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User's Personal Progress */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Ваш прогресс</h2>
                {userProgress ? (
                  <UserProgressCard
                    progress={userProgress}
                    userName={user.name || user.username}
                    userAvatar={user.avatarUrl || undefined}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500">Нет данных о прогрессе</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Top 5 Leaderboard */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Топ участников</h2>
                {leaderboard && leaderboard.length > 0 ? (
                  <Leaderboard 
                    entries={leaderboard.slice(0, 5)} 
                    title="Лидеры по уровню"
                    metric="level"
                  />
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500">Нет данных о лидерах</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Star className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Уровни и опыт (XP)</h3>
                      <p className="text-sm text-gray-600">Как повышается ваш уровень</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">Каждые 100 XP = новый уровень</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">XP начисляется за коммиты в репозиториях</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">Дополнительные XP за активность в сообществе</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg mt-4">
                      <p className="text-xs text-blue-800">
                        <strong>Совет:</strong> Регулярная активность в репозиториях поможет быстрее набирать опыт
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <GitCommit className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Коммиты</h3>
                      <p className="text-sm text-gray-600">Отслеживание активности в репозиториях</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">Считаются все коммиты в подключенных репозиториях</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">Обновляется автоматически каждый день</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">Влияет на общий рейтинг активности</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg mt-4">
                      <p className="text-xs text-green-800">
                        <strong>Совет:</strong> Подключите свои активные репозитории для полного учета
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Активные дни</h3>
                      <p className="text-sm text-gray-600">Дни с активностью в репозиториях</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">День считается активным при наличии коммитов</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">Показывает постоянство в разработке</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">Учитывается общее количество уникальных дней</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg mt-4">
                      <p className="text-xs text-orange-800">
                        <strong>Совет:</strong> Стремитесь к регулярной активности, а не к большому количеству коммитов за один день
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Flame className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Серии активности</h3>
                      <p className="text-sm text-gray-600">Последовательные дни с коммитами</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">Текущая серия - дни подряд с активностью</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">Лучшая серия - максимальная достигнутая серия</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">Серия обнуляется при пропуске дня</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg mt-4">
                      <p className="text-xs text-red-800">
                        <strong>Совет:</strong> Даже небольшой коммит в день поддержит вашу серию
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Система обновления</h3>
                    <p className="text-sm text-gray-600">Как и когда обновляются данные</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Автоматические обновления:</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700">Ежедневная проверка репозиториев</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700">Анализ новых коммитов через GitHub API</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700">Пересчет статистики и рейтингов</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Требования:</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700">Авторизация через GitHub</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700">Подключенные репозитории</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700">Публичные или доступные репозитории</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard-level" className="space-y-6">
            {leaderboard && leaderboard.length > 0 ? (
              <Leaderboard 
                entries={leaderboard} 
                title="Лидерборд по уровню"
                metric="level"
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Нет данных для отображения лидерборда</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaderboard-commits" className="space-y-6">
            {leaderboard && leaderboard.length > 0 ? (
              <Leaderboard 
                entries={leaderboard} 
                title="Лидерборд по количеству коммитов"
                metric="commits"
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Нет данных для отображения лидерборда</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaderboard-streak" className="space-y-6">
            {leaderboard && leaderboard.length > 0 ? (
              <Leaderboard 
                entries={leaderboard} 
                title="Лидерборд по текущим сериям"
                metric="streak"
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Нет данных для отображения лидерборда</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}