import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ExternalLink, MessageCircle, Unlink, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { User } from '@shared/schema';

interface TelegramConnectionProps {
  user: User;
}

export function TelegramConnection({ user }: TelegramConnectionProps) {
  const [telegramUsername, setTelegramUsername] = useState(user.telegramUsername || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-refresh profile data every 10 seconds if username is set but not connected
  useEffect(() => {
    if (user.telegramUsername && !user.telegramConnected) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [user.telegramUsername, user.telegramConnected, queryClient]);

  // Проверяем что пользователь авторизован
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Требуется авторизация для подключения Telegram</p>
        </CardContent>
      </Card>
    );
  }

  const connectMutation = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest('POST', '/api/telegram/connect', { telegramUsername: username });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Успешно сохранено",
        description: "Теперь перейдите в Telegram бот и нажмите /start"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
    onError: (error: any) => {
      console.error('Telegram connection error:', error);
      let errorMessage = "Не удалось подключить Telegram аккаунт";
      
      if (error.status === 401) {
        errorMessage = "Требуется авторизация. Пожалуйста, войдите в систему";
      } else if (error.status === 400) {
        errorMessage = error.message || "Неверные данные";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Ошибка подключения",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/telegram/disconnect');
    },
    onSuccess: () => {
      toast({
        title: "Отключено",
        description: "Telegram аккаунт отключен"
      });
      setTelegramUsername('');
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отключить Telegram аккаунт",
        variant: "destructive"
      });
    }
  });

  const handleConnect = () => {
    if (!telegramUsername.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ваш Telegram username",
        variant: "destructive"
      });
      return;
    }
    connectMutation.mutate(telegramUsername);
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const refreshMutation = useMutation({
    mutationFn: async () => {
      // Just trigger a refresh of profile data
      await queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Данные обновлены",
        description: "Статус подключения проверен"
      });
    }
  });

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const openTelegramBot = () => {
    window.open('https://t.me/TVibeCoding_Bot', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Подключение Telegram
        </CardTitle>
        <CardDescription>
          Подключите Telegram для получения важных уведомлений сообщества
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.telegramConnected ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Аккаунт успешно привязан!</span>
                  <span className="text-green-600 dark:text-green-400">@{user.telegramUsername}</span>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  🎉
                </div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Вы подключены к боту сообщества!</h4>
              </div>
              
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center">📢</span>
                  <span className="font-medium">Теперь вы будете получать:</span>
                </p>
                <ul className="list-none space-y-2 ml-7">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Важные анонсы сообщества
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Новые материалы и статьи
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Приглашения на мероприятия
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Возможность записаться на события
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={openTelegramBot}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Открыть бот
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="flex items-center gap-2"
              >
                <Unlink className="w-4 h-4" />
                Отключить
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {user.telegramUsername && !user.telegramConnected && (
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <div className="space-y-1">
                    <p className="font-semibold">Username сохранен, ожидается подтверждение</p>
                    <p className="text-sm">Перейдите в бот @TVibeCoding_Bot и нажмите /start для завершения подключения</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="telegram-username">Telegram Username</Label>
              <Input
                id="telegram-username"
                placeholder="username (без символа @)"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                disabled={connectMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Введите ваш Telegram username без символа @
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleConnect}
                disabled={connectMutation.isPending || !telegramUsername.trim()}
                className="w-full"
              >
                {connectMutation.isPending ? "Сохранение..." : "Сохранить username"}
              </Button>

              {user.telegramUsername && (
                <Button 
                  variant="outline" 
                  onClick={openTelegramBot}
                  className="w-full flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Перейти в бот @TVibeCoding_Bot
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-2">💡 Как подключить:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Введите ваш Telegram username (без @)</li>
                <li>Нажмите "Сохранить username"</li>
                <li>Перейдите в бот @TVibeCoding_Bot</li>
                <li>Нажмите /start для подтверждения</li>
              </ol>
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                <p className="text-amber-800 text-xs">
                  <strong>Важно:</strong> Username должен точно совпадать с тем, что указан в настройках вашего Telegram аккаунта. 
                  Если бот не найдет ваш username, проверьте правильность написания и попробуйте снова.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}