import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trophy, Star, Crown, Zap, ArrowRight } from "lucide-react";
import { Achievement, UserAchievement } from "@shared/schema";

export function AchievementsWidget() {
  const { data: userAchievements = [] } = useQuery<(UserAchievement & { achievement: Achievement })[]>({
    queryKey: ["/api/user/achievements"],
  });

  const { data: allAchievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="w-4 h-4" />;
      case 'rare': return <Zap className="w-4 h-4" />;
      case 'epic': return <Trophy className="w-4 h-4" />;
      case 'legendary': return <Crown className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 dark:text-gray-400';
      case 'rare': return 'text-blue-600 dark:text-blue-400';
      case 'epic': return 'text-purple-600 dark:text-purple-400';
      case 'legendary': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get recent achievements (last 3)
  const recentAchievements = userAchievements
    .sort((a, b) => {
      const dateA = a.earnedAt ? new Date(a.earnedAt as string | Date).getTime() : 0;
      const dateB = b.earnedAt ? new Date(b.earnedAt as string | Date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  const completionPercentage = allAchievements.length > 0 
    ? Math.round((userAchievements.length / allAchievements.length) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Достижения
            </CardTitle>
            <CardDescription>
              {userAchievements.length} из {allAchievements.length} разблокировано
            </CardDescription>
          </div>
          <div className="text-2xl font-bold text-primary">
            {completionPercentage}%
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {recentAchievements.length > 0 ? (
          <>
            <div>
              <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-3">
                Недавние достижения
              </h4>
              <div className="space-y-2">
                {recentAchievements.map((userAchievement) => (
                  <div 
                    key={userAchievement.id} 
                    className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="text-2xl">{userAchievement.achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {userAchievement.achievement.name}
                        </p>
                        <div className={`flex items-center ${getRarityColor(userAchievement.achievement.rarity)}`}>
                          {getRarityIcon(userAchievement.achievement.rarity)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        +{userAchievement.achievement.xpReward} XP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <Link href="/achievements">
                <Button variant="outline" className="w-full" size="sm">
                  Все достижения
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Trophy className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              У вас пока нет достижений
            </p>
            <Link href="/achievements">
              <Button variant="outline" size="sm">
                Смотреть все достижения
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}