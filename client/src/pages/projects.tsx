import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectFilter } from "@/components/project-filter";
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
  Tag
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
  tags: string[];
  analysisData: any;
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
  const [filters, setFilters] = useState({
    tags: [] as string[],
    category: "",
    complexity: "",
    search: ""
  });

  const { data: allProjects, isLoading, error } = useQuery<Repository[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  // Применяем фильтры локально
  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];
    
    return allProjects.filter(project => {
      // Фильтр по поиску
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(searchLower);
        const matchesDescription = project.description?.toLowerCase().includes(searchLower) || false;
        const matchesAuthor = (project.user.name || project.user.username).toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesDescription && !matchesAuthor) {
          return false;
        }
      }
      
      // Фильтр по тегам
      if (filters.tags.length > 0) {
        const projectTags = project.tags?.map(tag => tag.toLowerCase()) || [];
        const hasMatchingTag = filters.tags.some(filterTag => 
          projectTags.includes(filterTag.toLowerCase())
        );
        if (!hasMatchingTag) return false;
      }
      
      // Фильтр по категории
      if (filters.category) {
        const analysis = project.analysisData;
        if (!analysis?.category || !analysis.category.toLowerCase().includes(filters.category.toLowerCase())) {
          return false;
        }
      }
      
      // Фильтр по сложности
      if (filters.complexity) {
        const analysis = project.analysisData;
        if (!analysis?.complexity || analysis.complexity !== filters.complexity) {
          return false;
        }
      }
      
      return true;
    });
  }, [allProjects, filters]);

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
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Проекты сообщества</h1>
          <p className="text-sm text-gray-500">
            Исследуйте проекты участников и оставляйте комментарии
          </p>
        </div>

        {/* Компонент фильтрации */}
        <ProjectFilter onFilterChange={setFilters} />

        {/* Статистика результатов */}
        {allProjects && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Показано {filteredProjects.length} из {allProjects.length} проектов
            </span>
            {filters.tags.length > 0 || filters.category || filters.complexity || filters.search ? (
              <span>Применены фильтры</span>
            ) : null}
          </div>
        )}

        {filteredProjects && filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {allProjects && allProjects.length > 0 ? "Нет проектов по выбранным фильтрам" : "Пока нет проектов"}
              </h3>
              <p className="text-gray-600">
                {allProjects && allProjects.length > 0 
                  ? "Попробуйте изменить критерии фильтрации"
                  : "Добавьте свой первый репозиторий, чтобы поделиться проектом с сообществом"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects?.map((project: Repository) => (
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

                  {/* Project tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Теги</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Analysis data - complexity and category */}
                  {project.analysisData && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        {project.analysisData.category && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Категория:</span>
                            {project.analysisData.category}
                          </span>
                        )}
                        {project.analysisData.complexity && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Сложность:</span>
                            {project.analysisData.complexity === 'beginner' ? 'Начинающий' :
                             project.analysisData.complexity === 'intermediate' ? 'Средний' :
                             project.analysisData.complexity === 'advanced' ? 'Продвинутый' :
                             project.analysisData.complexity}
                          </span>
                        )}
                      </div>
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