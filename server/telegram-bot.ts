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
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    try {
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
      return data.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async handleWebhook(update: any): Promise<void> {
    try {
      const message = update.message;
      if (!message || !message.text) return;

      const chatId = message.chat.id.toString();
      const username = message.from.username;
      const text = message.text.trim();

      console.log(`Telegram message from @${username} (${chatId}): ${text}`);

      if (text === '/start') {
        await this.handleStartCommand(chatId, username);
      }
    } catch (error) {
      console.error('Error handling Telegram webhook:', error);
    }
  }

  private async handleStartCommand(chatId: string, username: string): Promise<void> {
    if (!username) {
      await this.sendMessage(chatId, 
        '❌ <b>Ошибка подключения</b>\n\n' +
        'Для подключения к Vibe Coding необходимо установить username в настройках Telegram.\n\n' +
        'Пожалуйста, добавьте @username в настройках Telegram и попробуйте снова.'
      );
      return;
    }

    // Ищем пользователя с таким telegram username
    const users = await storage.getUsers();
    const user = users.find(u => u.telegramUsername === username);

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