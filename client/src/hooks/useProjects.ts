import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectController } from '@/controllers/ProjectController';
import { ProjectWithDetails } from '@/models/ProjectModel';
import { useToast } from '@/hooks/use-toast';

export function useProjects() {
  return useQuery<ProjectWithDetails[]>({
    queryKey: ['/api/projects'],
    queryFn: ProjectController.getPublicProjects,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ repositoryId, content }: { repositoryId: number; content: string }) =>
      ProjectController.addComment(repositoryId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
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
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ProjectController.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
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
}