import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ExternalLink, MessageCircle, Unlink, CheckCircle, AlertCircle } from 'lucide-react';
import type { User } from '@shared/schema';

interface TelegramConnectionProps {
  user: User;
}

export function TelegramConnection({ user }: TelegramConnectionProps) {
  const [telegramUsername, setTelegramUsername] = useState(user.telegramUsername || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      return apiRequest('/api/telegram/connect', 'POST', { telegramUsername: username });
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
      return apiRequest('/api/telegram/disconnect', 'DELETE');
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
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Telegram аккаунт подключен: @{user.telegramUsername}
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">🎉 <strong>Вы подключены к боту сообщества!</strong></p>
              <p className="mb-1">📢 Вы будете получать:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Важные анонсы сообщества</li>
                <li>Новые материалы и статьи</li>
                <li>Приглашения на мероприятия</li>
                <li>Возможность записаться на события</li>
              </ul>
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Username сохранен, но аккаунт не подтвержден. Перейдите в бот и нажмите /start
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