import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, GitBranch, Calendar, Activity, MessageCircle, Eye, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { CommentSection } from "@/views/CommentSection";
import { ProjectModel } from "@/models/ProjectModel";

interface ProjectDetailData {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  status: string;
  lastCommitDate: string | null;
  lastCommitSha: string | null;
  changesSummary: string | null;
  isPublic: boolean;
  createdAt: string;
  userId: number;
  summaryGeneratedAt: string | null;
  descriptionGeneratedAt: string | null;
  user: {
    id: number;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  comments: Array<{
    id: number;
    content: string;
    createdAt: string;
    user: {
      id: number;
      username: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }>;
  activity: Array<{
    id: number;
    commitSha: string;
    commitMessage: string;
    commitDate: string;
    filesChanged: number | null;
    linesAdded: number | null;
    linesDeleted: number | null;
  }>;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: project, isLoading, error } = useQuery<ProjectDetailData>({
    queryKey: ['/api/projects', id],
    queryFn: () => fetch(`/api/projects/${id}`).then(res => {
      if (!res.ok) {
        if (res.status === 401) {
          setLocation('/');
          throw new Error('Authentication required');
        }
        throw new Error('Project not found');
      }
      return res.json();
    }),
    enabled: !!id && !!user,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Доступ ограничен</h1>
          <p className="text-muted-foreground mb-4">
            Для просмотра страниц проектов необходимо войти в систему
          </p>
          <Link href="/">
            <Button>На главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Проект не найден</h1>
          <p className="text-muted-foreground mb-4">
            Запрашиваемый проект не существует или у вас нет доступа к нему
          </p>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к проектам
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться к проектам
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={project.user.avatarUrl || ""} />
                  <AvatarFallback>
                    {project.user.name?.charAt(0) || project.user.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{project.user.name || project.user.username}</span>
              </div>
              <Badge className={ProjectModel.getStatusColor(project.status)}>
                {ProjectModel.getStatusText(project.status)}
              </Badge>
              {project.isPublic && (
                <Badge variant="outline" className="gap-1">
                  <Eye className="w-3 h-3" />
                  Публичный
                </Badge>
              )}
            </div>
          </div>
          
          <Button variant="outline" asChild>
            <a href={`https://github.com/${project.fullName}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              GitHub
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Description */}
          <Card>
            <CardHeader>
              <CardTitle>Описание проекта</CardTitle>
            </CardHeader>
            <CardContent>
              {project.description ? (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{project.description}</p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  Описание проекта не добавлено
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Changes */}
          {project.changesSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Последние изменения
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{project.changesSummary}</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                История активности
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.activity.length > 0 ? (
                <div className="space-y-4">
                  {project.activity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{activity.commitMessage}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{ProjectModel.formatDate(activity.commitDate)}</span>
                            <span className="font-mono">{activity.commitSha.substring(0, 7)}</span>
                            {activity.filesChanged && (
                              <span>{activity.filesChanged} файлов изменено</span>
                            )}
                            {activity.linesAdded && (
                              <span className="text-green-600">+{activity.linesAdded}</span>
                            )}
                            {activity.linesDeleted && (
                              <span className="text-red-600">-{activity.linesDeleted}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">История активности пуста</p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Комментарии ({project.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection repository={project as any} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о проекте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono">{project.fullName}</span>
              </div>
              
              {project.lastCommitDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Последний коммит: {ProjectModel.formatDate(project.lastCommitDate)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Создан: {ProjectModel.formatDate(project.createdAt)}
                </span>
              </div>

              <Separator />

              <div className="text-sm">
                <div className="font-medium mb-2">Статистика</div>
                <div className="space-y-1 text-muted-foreground">
                  <div>Комментариев: {project.comments.length}</div>
                  <div>Записей активности: {project.activity.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle>Автор проекта</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={project.user.avatarUrl || ""} />
                  <AvatarFallback>
                    {project.user.name?.charAt(0) || project.user.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{project.user.name || project.user.username}</div>
                  <div className="text-sm text-muted-foreground">@{project.user.username}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}