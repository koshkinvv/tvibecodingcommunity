import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, GitCommit, Calendar, Star, Zap } from 'lucide-react';
import type { UserProgress } from '@shared/schema';

interface UserProgressCardProps {
  progress: UserProgress;
  userName: string;
  userAvatar?: string;
}

export function UserProgressCard({ progress, userName, userAvatar }: UserProgressCardProps) {
  // Calculate experience progress to next level
  const currentLevelExp = (progress.level - 1) * 100;
  const nextLevelExp = progress.level * 100;
  const progressToNextLevel = ((progress.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;

  // Get badges from progress (if any)
  const badges = Array.isArray(progress.badges) ? progress.badges : [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          {userAvatar && (
            <img
              src={userAvatar}
              alt={userName}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1">
            <CardTitle className="text-lg">{userName}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                Уровень {progress.level}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {progress.experience} XP
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Прогресс до уровня {progress.level + 1}</span>
            <span className="text-gray-600">{Math.round(progressToNextLevel)}%</span>
          </div>
          <Progress value={progressToNextLevel} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{progress.experience - currentLevelExp} XP</span>
            <span>{nextLevelExp - currentLevelExp} XP</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <GitCommit className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-lg font-semibold text-blue-900">{progress.totalCommits}</div>
              <div className="text-xs text-blue-600">Коммитов</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
            <Calendar className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-lg font-semibold text-green-900">{progress.activeDays}</div>
              <div className="text-xs text-green-600">Активных дней</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
            <Flame className="w-5 h-5 text-orange-600" />
            <div>
              <div className="text-lg font-semibold text-orange-900">{progress.currentStreak}</div>
              <div className="text-xs text-orange-600">Текущая серия</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
            <Trophy className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-lg font-semibold text-purple-900">{progress.longestStreak}</div>
              <div className="text-xs text-purple-600">Лучшая серия</div>
            </div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Достижения</h4>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge: any, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {badge.name || badge}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Last Activity */}
        {progress.lastActivityDate && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Последняя активность: {new Date(progress.lastActivityDate).toLocaleDateString('ru-RU')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}