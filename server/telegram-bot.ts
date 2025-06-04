import { storage } from "./storage";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn("TELEGRAM_BOT_TOKEN not found. Telegram bot functionality will be disabled.");
}

export class TelegramBot {
  private token: string;
  private apiUrl: string;

  constructor() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
    }
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.apiUrl = `https://api.telegram.org/bot${this.token}`;
    console.log('[TELEGRAM] Bot initialized with token:', this.token.substring(0, 10) + '...');
  }

  async setWebhook(webhookUrl: string): Promise<boolean> {
    try {
      console.log('[TELEGRAM] Setting webhook URL:', webhookUrl);
      
      const response = await fetch(`${this.apiUrl}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl
        }),
      });

      const data = await response.json();
      console.log('[TELEGRAM] Webhook setup response:', data);
      
      return data.ok;
    } catch (error) {
      console.error('[TELEGRAM] Error setting webhook:', error);
      return false;
    }
  }

  async getWebhookInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/getWebhookInfo`);
      const data = await response.json();
      console.log('[TELEGRAM] Webhook info:', data);
      return data;
    } catch (error) {
      console.error('[TELEGRAM] Error getting webhook info:', error);
      return null;
    }
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    try {
      console.log(`[TELEGRAM] Sending message to ${chatId}:`, text.substring(0, 100) + '...');
      
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML'
        }),
      });

      const data = await response.json();
      console.log(`[TELEGRAM] Response:`, data);
      
      if (!data.ok) {
        console.error(`[TELEGRAM] Error sending message:`, data);
      }
      
      return data.ok;
    } catch (error) {
      console.error('[TELEGRAM] Error sending message:', error);
      return false;
    }
  }

  async handleWebhook(update: any): Promise<void> {
    try {
      console.log('[TELEGRAM] Received webhook update:', JSON.stringify(update, null, 2));
      
      const message = update.message;
      if (!message || !message.text) {
        console.log('[TELEGRAM] No message or text in update');
        return;
      }

      const chatId = message.chat.id.toString();
      const username = message.from.username;
      const text = message.text.trim();

      console.log(`[TELEGRAM] Message from @${username} (${chatId}): ${text}`);

      if (text === '/start') {
        console.log('[TELEGRAM] Processing /start command');
        await this.handleStartCommand(chatId, username);
      } else {
        console.log('[TELEGRAM] Unknown command:', text);
      }
    } catch (error) {
      console.error('[TELEGRAM] Error handling webhook:', error);
    }
  }

  private async handleStartCommand(chatId: string, username: string): Promise<void> {
    console.log(`[TELEGRAM] handleStartCommand called with chatId: ${chatId}, username: ${username}`);
    
    if (!username) {
      console.log('[TELEGRAM] No username provided, sending error message');
      await this.sendMessage(chatId, 
        '❌ <b>Ошибка подключения</b>\n\n' +
        'Для подключения к Vibe Coding необходимо установить username в настройках Telegram.\n\n' +
        'Пожалуйста, добавьте @username в настройках Telegram и попробуйте снова.'
      );
      return;
    }

    // Ищем пользователя с таким telegram username
    console.log('[TELEGRAM] Searching for user with username:', username);
    const users = await storage.getUsers();
    console.log('[TELEGRAM] Found users count:', users.length);
    console.log('[TELEGRAM] Users with telegram usernames:', users.filter(u => u.telegramUsername).map(u => u.telegramUsername));
    
    const user = users.find(u => u.telegramUsername === username);
    console.log('[TELEGRAM] Found user:', user ? `${user.username} (ID: ${user.id})` : 'null');

    if (!user) {
      await this.sendMessage(chatId,
        '❌ <b>Telegram username не найден</b>\n\n' +
        `Пользователь с username @${username} не найден в нашей базе.\n\n` +
        '📝 <b>Что нужно сделать:</b>\n' +
        '1. Зайдите в свой профиль на сайте Vibe Coding\n' +
        '2. Перейдите на вкладку "Telegram"\n' +
        '3. Добавьте ваш Telegram username (без символа @)\n' +
        '4. Сохраните изменения\n' +
        '5. Вернитесь сюда и нажмите /start снова\n\n' +
        '💡 <b>Важно:</b> Username должен точно совпадать с тем, что указан в вашем Telegram профиле'
      );
      return;
    }

    // Обновляем пользователя - привязываем Telegram ID и отмечаем как подключенного
    await storage.updateUser(user.id, {
      telegramId: chatId,
      telegramConnected: true
    });

    await this.sendMessage(chatId,
      '🎉 <b>Добро пожаловать в Vibe Coding!</b>\n\n' +
      `Привет, ${user.name || user.username}! Ваш Telegram аккаунт успешно подключен.\n\n` +
      '📢 <b>Что вас ждет:</b>\n' +
      '• Важные уведомления сообщества\n' +
      '• Анонсы новых материалов и статей\n' +
      '• Приглашения на мероприятия и вебинары\n' +
      '• Возможность записаться на события\n\n' +
      '⚙️ Управляйте уведомлениями в настройках профиля на сайте.\n\n' +
      '🚀 Добро пожаловать в команду!'
    );

    console.log(`Successfully connected Telegram account for user ${user.username} (@${username})`);
  }

  async sendCommunityAnnouncement(message: string, userIds?: number[]): Promise<void> {
    try {
      const users = userIds 
        ? await Promise.all(userIds.map(id => storage.getUser(id)))
        : await storage.getUsers();

      const telegramUsers = users.filter(user => 
        user && 
        user.telegramConnected && 
        user.telegramId && 
        user.notificationPreference !== 'none'
      );

      console.log(`Sending announcement to ${telegramUsers.length} Telegram users`);

      for (const user of telegramUsers) {
        if (user.telegramId) {
          await this.sendMessage(user.telegramId, message);
          // Небольшая задержка чтобы не превысить лимиты API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error sending community announcement:', error);
    }
  }
}

export const telegramBot = process.env.TELEGRAM_BOT_TOKEN ? new TelegramBot() : null;