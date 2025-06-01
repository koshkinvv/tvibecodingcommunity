import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Star, Flame, GitCommit } from 'lucide-react';
import type { UserProgress, User } from '@shared/schema';

interface LeaderboardEntry {
  user: User;
  progress: UserProgress;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  metric?: 'level' | 'experience' | 'commits' | 'streak';
}

export function Leaderboard({ entries, title = "Лидеры сообщества", metric = 'level' }: LeaderboardProps) {
  // Sort entries based on the selected metric
  const sortedEntries = [...entries].sort((a, b) => {
    switch (metric) {
      case 'level':
        return b.progress.level - a.progress.level || b.progress.experience - a.progress.experience;
      case 'experience':
        return b.progress.experience - a.progress.experience;
      case 'commits':
        return b.progress.totalCommits - a.progress.totalCommits;
      case 'streak':
        return b.progress.currentStreak - a.progress.currentStreak;
      default:
        return b.progress.level - a.progress.level;
    }
  });

  const getMetricValue = (progress: UserProgress) => {
    switch (metric) {
      case 'level':
        return `Ур. ${progress.level}`;
      case 'experience':
        return `${progress.experience} XP`;
      case 'commits':
        return `${progress.totalCommits} коммитов`;
      case 'streak':
        return `${progress.currentStreak} дней`;
      default:
        return `Ур. ${progress.level}`;
    }
  };

  const getMetricIcon = () => {
    switch (metric) {
      case 'level':
        return Star;
      case 'experience':
        return Award;
      case 'commits':
        return GitCommit;
      case 'streak':
        return Flame;
      default:
        return Star;
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-500">#{position}</span>;
    }
  };

  const MetricIcon = getMetricIcon();

  if (sortedEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MetricIcon className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Пока нет данных о прогрессе участников
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MetricIcon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedEntries.slice(0, 10).map((entry, index) => {
            const position = index + 1;
            const isTopThree = position <= 3;
            
            return (
              <div
                key={entry.user.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isTopThree 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 flex justify-center">
                  {getRankIcon(position)}
                </div>

                {/* User Avatar & Info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <img
                    src={entry.user.avatarUrl || `https://ui-avatars.com/api/?name=${entry.user.username}&background=random`}
                    alt={entry.user.username}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {entry.user.name || entry.user.username}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      @{entry.user.username}
                    </div>
                  </div>
                </div>

                {/* Progress Stats */}
                <div className="flex-shrink-0 text-right">
                  <div className="font-semibold text-gray-900">
                    {getMetricValue(entry.progress)}
                  </div>
                  {metric === 'level' && (
                    <div className="text-xs text-gray-500">
                      {entry.progress.experience} XP
                    </div>
                  )}
                </div>

                {/* Level Badge */}
                <div className="flex-shrink-0">
                  <Badge 
                    variant={isTopThree ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {entry.progress.level}
                  </Badge>
                </div>
              </div>
            );
          })}
          
          {sortedEntries.length > 10 && (
            <div className="text-center py-2 text-sm text-gray-500">
              и еще {sortedEntries.length - 10} участников...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}