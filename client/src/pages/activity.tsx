import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatRelativeTime } from "@/lib/utils";
import { GitCommit, FileText, Plus, Minus, ChevronDown, ChevronRight } from "lucide-react";

interface CommitDetail {
  sha: string;
  message: string;
  author: string;
  date: string;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
}

interface ActivityItem {
  id: number;
  commitSha: string;
  commitMessage: string;
  commitCount: number;
  commits: CommitDetail[] | null;
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

function ActivityCard({ activity }: { activity: ActivityItem }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
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
              <span className="text-gray-500">
                {activity.commitCount === 1 ? 'committed to' : `made ${activity.commitCount} commits to`}
              </span>
              <Badge variant="outline" className="text-xs">
                {activity.repository.name}
              </Badge>
              <span className="text-gray-400 text-sm">
                {formatRelativeTime(new Date(activity.commitDate))}
              </span>
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

            <div className="flex items-center justify-between mb-3">
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
              </div>

              {activity.commits && activity.commits.length > 1 && (
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      {isExpanded ? (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Hide commits
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-3 w-3 mr-1" />
                          Show {activity.commitCount} commits
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </div>

            {activity.commits && activity.commits.length > 1 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent className="space-y-2">
                  <div className="border-t pt-3">
                    {activity.commits.map((commit, index) => (
                      <div key={commit.sha} className="flex items-start space-x-3 py-2 border-l-2 border-gray-200 pl-3 ml-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 mb-1">{commit.message}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="font-mono">{commit.sha.substring(0, 7)}</span>
                            <span>{commit.author}</span>
                            <span>{formatRelativeTime(new Date(commit.date))}</span>
                            <div className="flex items-center space-x-2">
                              {commit.filesChanged > 0 && (
                                <span className="flex items-center space-x-1">
                                  <FileText className="h-3 w-3" />
                                  <span>{commit.filesChanged}</span>
                                </span>
                              )}
                              {commit.linesAdded > 0 && (
                                <span className="flex items-center space-x-1 text-green-600">
                                  <Plus className="h-3 w-3" />
                                  <span>{commit.linesAdded}</span>
                                </span>
                              )}
                              {commit.linesDeleted > 0 && (
                                <span className="flex items-center space-x-1 text-red-600">
                                  <Minus className="h-3 w-3" />
                                  <span>{commit.linesDeleted}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {(!activity.commits || activity.commits.length === 1) && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <GitCommit className="h-3 w-3" />
                <span className="font-mono">
                  {activity.commitSha.substring(0, 7)}
                </span>
                {activity.commits && activity.commits.length === 1 && (
                  <span className="text-gray-700">
                    {activity.commits[0].message}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
            <ActivityCard key={activity.id} activity={activity} />
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