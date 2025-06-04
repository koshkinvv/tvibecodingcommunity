import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MessageCircle, Send, Users } from 'lucide-react';

export function TelegramAnnouncements() {
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const sendAnnouncementMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return apiRequest('/api/telegram/announcement', 'POST', { message: messageText });
    },
    onSuccess: () => {
      toast({
        title: "Анонс отправлен",
        description: "Сообщение успешно отправлено всем подключенным пользователям"
      });
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка отправки",
        description: error.message || "Не удалось отправить анонс",
        variant: "destructive"
      });
    }
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст сообщения",
        variant: "destructive"
      });
      return;
    }
    sendAnnouncementMutation.mutate(message);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Анонсы в Telegram
        </CardTitle>
        <CardDescription>
          Отправьте важное сообщение всем пользователям, подключенным к Telegram боту
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Сообщение будет отправлено всем пользователям, которые подключили Telegram аккаунт и не отключили уведомления
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label htmlFor="announcement-message" className="text-sm font-medium">
            Текст анонса
          </label>
          <Textarea
            id="announcement-message"
            placeholder="Введите текст сообщения для отправки в Telegram..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            disabled={sendAnnouncementMutation.isPending}
          />
          <p className="text-sm text-muted-foreground">
            Поддерживается HTML разметка: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;, &lt;a href="..."&gt;ссылка&lt;/a&gt;
          </p>
        </div>

        <Button 
          onClick={handleSend}
          disabled={sendAnnouncementMutation.isPending || !message.trim()}
          className="w-full flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {sendAnnouncementMutation.isPending ? "Отправка..." : "Отправить анонс"}
        </Button>

        <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-2">💡 Рекомендации:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Используйте четкие заголовки для важных анонсов</li>
            <li>Добавляйте ссылки на события или материалы</li>
            <li>Указывайте даты и время для мероприятий</li>
            <li>Будьте краткими, но информативными</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}