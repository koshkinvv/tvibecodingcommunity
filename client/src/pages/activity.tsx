import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { GitCommit, FileText, Plus, Minus } from "lucide-react";

interface ActivityItem {
  id: number;
  commitSha: string;
  commitMessage: string;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  aiSummary: string | null;
  commitDate: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  repository: {
    id: number;
    name: string;
    fullName: string;
    status: string;
  };
}

export default function ActivityPage() {
  const { data: activities, isLoading, error } = useQuery<ActivityItem[]>({
    queryKey: ["/api/activity"],
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Community Activity</h1>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-10">
          <p className="text-red-600">Ошибка загрузки ленты активности</p>
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Community Activity</h1>
          <div className="text-center py-10">
            <GitCommit className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">Пока нет активности в сообществе</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Community Activity</h1>
          <p className="text-sm text-gray-500">{activities.length} recent activities</p>
        </div>

        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={activity.user.avatarUrl || ''} 
                      alt={activity.user.username} 
                    />
                    <AvatarFallback>
                      {activity.user.name?.substring(0, 2) || activity.user.username.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {activity.user.name || activity.user.username}
                      </span>
                      <span className="text-gray-500">committed to</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.repository.name}
                      </Badge>
                      <span className="text-gray-400 text-sm">
                        {formatRelativeTime(new Date(activity.commitDate))}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {activity.commitMessage}
                      </p>
                    </div>

                    {activity.aiSummary && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-medium text-blue-700">AI Summary</span>
                        </div>
                        <p className="text-sm text-blue-800">{activity.aiSummary}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{activity.filesChanged} files</span>
                      </div>
                      {activity.linesAdded > 0 && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Plus className="h-3 w-3" />
                          <span>{activity.linesAdded}</span>
                        </div>
                      )}
                      {activity.linesDeleted > 0 && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <Minus className="h-3 w-3" />
                          <span>{activity.linesDeleted}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <GitCommit className="h-3 w-3" />
                        <span className="font-mono text-xs">
                          {activity.commitSha.substring(0, 7)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {activities.length >= 50 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              Показаны последние 50 записей активности
            </p>
          </div>
        )}
      </div>
    </div>
  );
}