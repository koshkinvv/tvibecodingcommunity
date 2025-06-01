import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Database, UserCheck, FileText, Mail, Clock } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Политика конфиденциальности</h1>
        <p className="text-lg text-muted-foreground">
          Настоящая Политика конфиденциальности определяет порядок обработки персональных данных 
          пользователей платформы Vibe Coding в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ 
          "О персональных данных".
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU')}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Основные положения */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              1. Основные положения
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1.1 Определения</h4>
              <ul className="space-y-2 text-sm pl-4">
                <li><strong>Платформа</strong> — веб-сайт Vibe Coding, расположенный по адресу в сети Интернет</li>
                <li><strong>Администрация</strong> — уполномоченные сотрудники на управление Платформой</li>
                <li><strong>Пользователь</strong> — лицо, зарегистрированное на Платформе</li>
                <li><strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определенному физическому лицу</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">1.2 Применимое законодательство</h4>
              <p className="text-sm text-muted-foreground">
                Настоящая Политика разработана в соответствии с Конституцией Российской Федерации, 
                Федеральным законом от 27.07.2006 № 152-ФЗ "О персональных данных", 
                Федеральным законом от 27.07.2006 № 149-ФЗ "Об информации, информационных технологиях и о защите информации" 
                и иными нормативными правовыми актами Российской Федерации.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Собираемые данные */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              2. Персональные данные пользователей
            </CardTitle>
            <CardDescription>
              Информация, которую мы собираем и обрабатываем
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">2.1 Данные, предоставляемые пользователем</h4>
              <ul className="space-y-1 text-sm pl-4">
                <li>• Имя пользователя и отображаемое имя</li>
                <li>• Адрес электронной почты</li>
                <li>• Аватар и профильная информация GitHub</li>
                <li>• Информация о репозиториях GitHub</li>
                <li>• Комментарии и сообщения на платформе</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2.2 Автоматически собираемые данные</h4>
              <ul className="space-y-1 text-sm pl-4">
                <li>• IP-адрес и информация о браузере</li>
                <li>• Дата и время посещения</li>
                <li>• Информация о действиях на платформе</li>
                <li>• Технические данные для обеспечения работы сервиса</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2.3 Данные от третьих лиц</h4>
              <p className="text-sm text-muted-foreground">
                При авторизации через GitHub мы получаем только публичную информацию вашего профиля 
                в соответствии с разрешениями, которые вы предоставляете.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Цели обработки */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              3. Цели обработки персональных данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Основные цели:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Предоставление доступа к платформе</li>
                  <li>• Идентификация пользователя</li>
                  <li>• Обеспечение функционирования сервиса</li>
                  <li>• Персонализация контента</li>
                  <li>• Коммуникация с пользователями</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Дополнительные цели:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Анализ активности для улучшения сервиса</li>
                  <li>• Обеспечение безопасности</li>
                  <li>• Предотвращение мошенничества</li>
                  <li>• Выполнение правовых обязательств</li>
                  <li>• Техническая поддержка</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Правовые основания */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              4. Правовые основания обработки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2">Обработка персональных данных осуществляется на основании:</h4>
              <ul className="space-y-2 text-sm pl-4">
                <li>• <strong>Согласие субъекта</strong> — при регистрации на платформе</li>
                <li>• <strong>Исполнение договора</strong> — для предоставления услуг платформы</li>
                <li>• <strong>Законные интересы</strong> — для обеспечения безопасности и функционирования</li>
                <li>• <strong>Правовые обязательства</strong> — при необходимости соблюдения требований законодательства</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Сроки хранения */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              5. Сроки хранения персональных данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Активные пользователи:</h4>
                <p className="text-sm text-muted-foreground">
                  Данные хранятся в течение всего периода использования платформы 
                  и 3 лет после последней активности.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Удаленные аккаунты:</h4>
                <p className="text-sm text-muted-foreground">
                  Персональные данные удаляются в течение 30 дней после удаления аккаунта, 
                  за исключением данных, требующих более длительного хранения по закону.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">Особые случаи:</h4>
              <ul className="space-y-1 text-sm pl-4">
                <li>• Логи безопасности — до 6 месяцев</li>
                <li>• Финансовая отчетность — в соответствии с требованиями законодательства</li>
                <li>• Данные для разрешения споров — до окончания разбирательства</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Права пользователей */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              6. Права субъектов персональных данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">В соответствии с 152-ФЗ вы имеете право:</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-sm">
                  <li>• Получать информацию об обработке ваших данных</li>
                  <li>• Требовать уточнения, блокирования или уничтожения данных</li>
                  <li>• Отзывать согласие на обработку</li>
                  <li>• Получать копию ваших персональных данных</li>
                </ul>
                <ul className="space-y-2 text-sm">
                  <li>• Ограничивать обработку персональных данных</li>
                  <li>• Возражать против обработки</li>
                  <li>• Обращаться в уполномоченный орган по защите прав</li>
                  <li>• Защищать свои права в судебном порядке</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">Способы реализации прав:</h4>
              <p className="text-sm text-muted-foreground">
                Для реализации ваших прав обратитесь к администрации платформы через контактную форму 
                или по электронной почте. Мы рассматриваем обращения в течение 30 дней.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Безопасность */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              7. Меры защиты персональных данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2">Технические меры:</h4>
              <ul className="space-y-1 text-sm pl-4">
                <li>• Шифрование данных при передаче (HTTPS)</li>
                <li>• Контроль доступа к серверам и базам данных</li>
                <li>• Регулярное обновление системы безопасности</li>
                <li>• Мониторинг несанкционированного доступа</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Организационные меры:</h4>
              <ul className="space-y-1 text-sm pl-4">
                <li>• Ограничение доступа сотрудников к персональным данным</li>
                <li>• Обучение персонала вопросам защиты данных</li>
                <li>• Регулярный аудит системы защиты</li>
                <li>• Документирование процедур обработки данных</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Передача третьим лицам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              8. Передача персональных данных третьим лицам
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2">Передача данных возможна:</h4>
              <ul className="space-y-2 text-sm pl-4">
                <li>• <strong>GitHub</strong> — для авторизации и получения информации о репозиториях</li>
                <li>• <strong>Хостинг-провайдеры</strong> — для обеспечения работы платформы</li>
                <li>• <strong>Государственные органы</strong> — при наличии законных требований</li>
                <li>• <strong>Аналитические сервисы</strong> — в обезличенном виде для улучшения сервиса</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Условия передачи:</h4>
              <p className="text-sm text-muted-foreground">
                Передача персональных данных осуществляется только при наличии правовых оснований 
                и с соблюдением требований законодательства о защите персональных данных.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Файлы cookie */}
        <Card>
          <CardHeader>
            <CardTitle>9. Использование файлов cookie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Платформа использует файлы cookie для обеспечения функционирования сервиса, 
              сохранения пользовательских настроек и анализа использования.
            </p>
            
            <div>
              <h4 className="font-semibold mb-2">Типы используемых cookie:</h4>
              <ul className="space-y-1 text-sm pl-4">
                <li>• <strong>Необходимые</strong> — для базового функционирования</li>
                <li>• <strong>Функциональные</strong> — для сохранения настроек</li>
                <li>• <strong>Аналитические</strong> — для анализа использования (обезличенные)</li>
              </ul>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Вы можете настроить использование cookie в настройках вашего браузера.
            </p>
          </CardContent>
        </Card>

        {/* Контакты */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              10. Контактная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2">По вопросам обработки персональных данных обращайтесь:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Через форму обратной связи на платформе</li>
                <li>• В комментариях к проектам администраторов</li>
                <li>• По вопросам нарушения прав — в Роскомнадзор</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">Изменения в политике конфиденциальности:</h4>
              <p className="text-sm text-muted-foreground">
                Администрация оставляет за собой право вносить изменения в настоящую Политику. 
                Существенные изменения вступают в силу через 30 дней после публикации уведомления на платформе.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}