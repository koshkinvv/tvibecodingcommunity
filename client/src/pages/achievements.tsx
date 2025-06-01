import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Crown, Zap } from "lucide-react";
import { Achievement, UserAchievement } from "@shared/schema";

interface AchievementWithProgress extends Achievement {
  earned?: boolean;
  earnedAt?: string;
}

export default function AchievementsPage() {
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: userAchievements = [] } = useQuery<(UserAchievement & { achievement: Achievement })[]>({
    queryKey: ["/api/user/achievements"],
  });

  if (achievementsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
  const earnedAchievementsMap = new Map(
    userAchievements.map(ua => [ua.achievementId, ua])
  );

  const achievementsWithProgress: AchievementWithProgress[] = achievements.map(achievement => {
    const userAchievement = earnedAchievementsMap.get(achievement.id);
    return {
      ...achievement,
      earned: earnedAchievementIds.has(achievement.id),
      earnedAt: userAchievement?.earnedAt ? userAchievement.earnedAt.toString() : undefined,
    };
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'rare': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'epic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="w-4 h-4" />;
      case 'rare': return <Zap className="w-4 h-4" />;
      case 'epic': return <Trophy className="w-4 h-4" />;
      case 'legendary': return <Crown className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'coding': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'social': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'learning': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'special': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const earnedAchievements = achievementsWithProgress.filter(a => a.earned);
  const availableAchievements = achievementsWithProgress.filter(a => !a.earned);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Достижения
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Заработано: {earnedAchievements.length} из {achievements.length} достижений
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(earnedAchievements.length / achievements.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {earnedAchievements.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Заработанные достижения
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {earnedAchievements.map((achievement) => (
              <Card key={achievement.id} className="relative overflow-hidden border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
                <div className="absolute top-2 right-2">
                  <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="flex gap-2">
                      <Badge className={getRarityColor(achievement.rarity)}>
                        <div className="flex items-center gap-1">
                          {getRarityIcon(achievement.rarity)}
                          {achievement.rarity}
                        </div>
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{achievement.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {achievement.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(achievement.category)}>
                      {achievement.category}
                    </Badge>
                    <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      +{achievement.xpReward} XP
                    </div>
                  </div>
                  {achievement.earnedAt && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Получено: {new Date(achievement.earnedAt).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {availableAchievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Доступные достижения
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableAchievements.map((achievement) => (
              <Card key={achievement.id} className="relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl grayscale">{achievement.icon}</div>
                    <div className="flex gap-2">
                      <Badge className={getRarityColor(achievement.rarity)}>
                        <div className="flex items-center gap-1">
                          {getRarityIcon(achievement.rarity)}
                          {achievement.rarity}
                        </div>
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{achievement.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {achievement.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(achievement.category)}>
                      {achievement.category}
                    </Badge>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                      +{achievement.xpReward} XP
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}