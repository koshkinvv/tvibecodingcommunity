import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { StatusBadge } from '@/components/status-badge';
import { RepositorySummary } from '@/components/repository-summary';
import { Repository } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatRelativeTime } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface RepositoryListProps {
  userId?: number;
  readOnly?: boolean;
}

const addRepositorySchema = z.object({
  fullName: z.string().regex(/^[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/, 'Repository must be in format "username/repository"'),
  name: z.string().min(1, 'Repository name is required'),
});

type AddRepositoryFormValues = z.infer<typeof addRepositorySchema>;

export function RepositoryList({ userId, readOnly = false }: RepositoryListProps) {
  const [repositoryToDelete, setRepositoryToDelete] = useState<Repository | null>(null);
  const [showGitHubRepos, setShowGitHubRepos] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddRepositoryFormValues>({
    resolver: zodResolver(addRepositorySchema),
    defaultValues: {
      fullName: '',
      name: '',
    },
  });

  // Query to fetch repositories
  const { data: repositories, isLoading } = useQuery<Repository[]>({
    queryKey: [userId ? `/api/admin/users/${userId}/repositories` : '/api/repositories'],
  });

  // Query to fetch GitHub repositories
  const { data: githubRepos, isLoading: isLoadingGitHub } = useQuery({
    queryKey: ['/api/github/repositories'],
    enabled: showGitHubRepos,
  });

  // Mutation to delete repository
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/repositories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Repository deleted',
        description: 'The repository has been removed from your profile',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/repositories'] });
      setRepositoryToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete repository: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to add repository
  const addMutation = useMutation({
    mutationFn: async (data: AddRepositoryFormValues) => {
      return apiRequest('POST', '/api/repositories', data);
    },
    onSuccess: () => {
      toast({
        title: 'Repository added',
        description: 'The repository has been added to your profile',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/repositories'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add repository: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to add multiple repositories
  const addMultipleMutation = useMutation({
    mutationFn: async (repos: string[]) => {
      return apiRequest('POST', '/api/repositories/multiple', { repositoryNames: repos });
    },
    onSuccess: (data: any) => {
      const addedCount = data.added?.length || 0;
      const skippedCount = data.skipped?.length || 0;
      
      toast({
        title: 'Repositories processed',
        description: `${addedCount} repositories added${skippedCount > 0 ? `, ${skippedCount} skipped (already exist)` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/repositories'] });
      setSelectedRepos([]);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add repositories: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handle repository form submission
  const onSubmit = (data: AddRepositoryFormValues) => {
    addMutation.mutate(data);
  };

  // Handle repository name extraction
  const handleFullNameChange = (value: string) => {
    // Extract the repository name from the full name
    // e.g., "username/repository" -> "repository"
    const parts = value.split('/');
    if (parts.length === 2 && !form.getValues('name')) {
      form.setValue('name', parts[1]);
    }
  };

  // Handle multiple repository selection
  const handleRepoSelection = (repoFullName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoFullName) 
        ? prev.filter(name => name !== repoFullName)
        : [...prev, repoFullName]
    );
  };

  // Handle adding selected repositories
  const handleAddSelected = () => {
    if (selectedRepos.length > 0) {
      addMultipleMutation.mutate(selectedRepos);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {repositories && repositories.length > 0 ? (
        repositories.map(repo => (
          <div key={repo.id} className="space-y-2">
            <RepositorySummary repository={repo} />
            
            {!readOnly && (
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Удалить
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Подтвердите действие</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это удалит репозиторий "{repo.name}" из вашего профиля. Это действие нельзя отменить.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate(repo.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ))
      ) : (
        <Card className="bg-white shadow">
          <CardContent className="px-4 py-5 sm:p-6 text-center">
            <p className="text-gray-500">
              {readOnly ? 'Репозитории не найдены' : 'У вас пока нет репозиториев'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Repository Form */}
      {!readOnly && (
        <Card className="bg-white shadow">
          <CardContent className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Add a new repository</h3>
              <Button
                variant="outline"
                onClick={() => setShowGitHubRepos(!showGitHubRepos)}
                disabled={isLoadingGitHub}
              >
                {isLoadingGitHub ? 'Loading...' : showGitHubRepos ? 'Hide GitHub Repos' : 'Load from GitHub'}
              </Button>
            </div>

            {/* GitHub Repositories List */}
            {showGitHubRepos && (
              <div className="mt-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-700">Your GitHub Repositories</h4>
                  {selectedRepos.length > 0 && (
                    <Button
                      onClick={handleAddSelected}
                      disabled={addMultipleMutation.isPending}
                      size="sm"
                    >
                      {addMultipleMutation.isPending ? 'Adding...' : `Add Selected (${selectedRepos.length})`}
                    </Button>
                  )}
                </div>
                {isLoadingGitHub ? (
                  <p className="text-gray-500">Loading your repositories...</p>
                ) : githubRepos && Array.isArray(githubRepos) && githubRepos.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {githubRepos.map((repo: any) => {
                      const isSelected = selectedRepos.includes(repo.fullName);
                      const isAlreadyAdded = repositories?.some(r => r.fullName === repo.fullName);
                      
                      return (
                        <div key={repo.id} className="flex items-center p-2 border rounded-md">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isAlreadyAdded}
                            onChange={() => handleRepoSelection(repo.fullName)}
                            className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${isAlreadyAdded ? 'text-gray-400' : ''}`}>
                              {repo.fullName}
                              {isAlreadyAdded && <span className="ml-2 text-xs">(already added)</span>}
                            </p>
                            {repo.description && (
                              <p className="text-xs text-gray-500">{repo.description}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isAlreadyAdded}
                            onClick={() => {
                              form.setValue('fullName', repo.fullName);
                              form.setValue('name', repo.name);
                            }}
                          >
                            Use Single
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">No repositories found or failed to load.</p>
                )}
              </div>
            )}

            <div className="mt-4 max-w-xl">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub Repository URL</FormLabel>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                            github.com/
                          </span>
                          <FormControl>
                            <Input
                              {...field}
                              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-primary focus:border-primary sm:text-sm border-gray-300"
                              placeholder="username/repository"
                              onChange={(e) => {
                                field.onChange(e);
                                handleFullNameChange(e.target.value);
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repository Name (display name)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md focus:ring-primary focus:border-primary sm:text-sm border-gray-300"
                            placeholder="Repository name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <Button 
                      type="submit"
                      disabled={addMutation.isPending}
                    >
                      {addMutation.isPending ? 'Adding...' : 'Add Repository'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
