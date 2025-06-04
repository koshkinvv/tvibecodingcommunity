import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  GitBranch, 
  MessageCircle, 
  Send, 
  Calendar, 
  User,
  Trash2,
  Activity,
  AlertCircle,
  Search,
  ExternalLink,
  Eye
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

interface Repository {
  id: number;
  userId: number;
  name: string;
  fullName: string;
  lastCommitDate: string | null;
  status: string;
  description: string | null;
  descriptionGeneratedAt: string | null;
  createdAt: string;
  user: User;
  comments: Comment[];
}

interface Comment {
  id: number;
  repositoryId: number;
  userId: number;
  content: string;
  createdAt: string;
  user: User;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active': return 'Активный';
      case 'warning': return 'Предупреждение';
      case 'inactive': return 'Неактивный';
      default: return 'Неизвестно';
    }
  };

  return (
    <Badge className={`${getStatusColor()} border-0`}>
      {getStatusText()}
    </Badge>
  );
};

const CommentSection = ({ repository }: { repository: Repository }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/repositories/${repository.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setNewComment("");
      setIsCommenting(false);
      toast({
        title: "Комментарий добавлен",
        description: "Ваш комментарий успешно опубликован"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить комментарий",
        variant: "destructive"
      });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Комментарий удален",
        description: "Комментарий успешно удален"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить комментарий",
        variant: "destructive"
      });
    }
  });

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm("Вы уверены, что хотите удалить комментарий?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        <span className="font-medium">Комментарии ({repository.comments.length})</span>
      </div>

      {/* Existing comments */}
      <div className="space-y-3">
        {repository.comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.user.avatarUrl || ""} />
                  <AvatarFallback>
                    {comment.user.name?.charAt(0) || comment.user.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">
                  {comment.user.name || comment.user.username}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              {user?.id === comment.userId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-700">{comment.content}</p>
          </div>
        ))}
      </div>

      {/* Add new comment */}
      {isCommenting ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Напишите комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {newComment.length}/1000 символов
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCommenting(false);
                  setNewComment("");
                }}
              >
                Отменить
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
              >
                <Send className="h-3 w-3 mr-1" />
                {addCommentMutation.isPending ? "Отправка..." : "Отправить"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCommenting(true)}
          className="w-full"
        >
          <MessageCircle className="h-3 w-3 mr-2" />
          Добавить комментарий
        </Button>
      )}
    </div>
  );
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects, isLoading, error } = useQuery<Repository[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!projects || !searchQuery.trim()) return projects || [];
    
    const query = searchQuery.toLowerCase().trim();
    return projects.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.fullName.toLowerCase().includes(query) ||
      project.user.username.toLowerCase().includes(query) ||
      (project.user.name && project.user.name.toLowerCase().includes(query)) ||
      (project.description && project.description.toLowerCase().includes(query))
    );
  }, [projects, searchQuery]);

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Требуется авторизация</h2>
            <p className="text-gray-600 mb-4">Войдите в систему для просмотра проектов сообщества.</p>
            <Button asChild>
              <a href="/api/auth/github">Войти через GitHub</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка загрузки</h2>
            <p className="text-gray-600">Не удалось загрузить проекты сообщества</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Проекты сообщества</h1>
          <p className="text-sm text-gray-500">
            Исследуйте проекты участников и оставляйте комментарии
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по названию проекта или пользователю..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {projects && projects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Пока нет проектов</h3>
              <p className="text-gray-600">
                Добавьте свой первый репозиторий, чтобы поделиться проектом с сообществом
              </p>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 && searchQuery ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ничего не найдено</h3>
              <p className="text-gray-600">
                Попробуйте изменить поисковый запрос или очистить фильтры
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects?.map((project) => (
              <Card key={project.id} className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={project.user.avatarUrl || ""} />
                        <AvatarFallback>
                          {project.user.name?.charAt(0) || project.user.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {project.user.name || project.user.username}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* AI-generated description */}
                  {project.description && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">{project.description}</p>
                      {project.descriptionGeneratedAt && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Описание создано AI
                        </p>
                      )}
                    </div>
                  )}

                  {/* Project details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <GitBranch className="h-4 w-4" />
                      <span>{project.fullName}</span>
                    </div>
                    {project.lastCommitDate && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Последний коммит: {new Date(project.lastCommitDate).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-2" />
                        Подробнее
                      </Button>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MessageCircle className="h-4 w-4" />
                      <span>{project.comments.length}</span>
                    </div>
                  </div>

                  {/* Comments section */}
                  <CommentSection repository={project} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}