import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserProgressCard } from '@/components/progress/user-progress-card';
import { Leaderboard } from '@/components/progress/leaderboard';
import { AchievementsWidget } from '@/components/progress/achievements-widget';
import { Trophy, Users, Target, TrendingUp, RefreshCw } from 'lucide-react';

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Обзор
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
                
                {/* Achievements Widget */}
                <AchievementsWidget />
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