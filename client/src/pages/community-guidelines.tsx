import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Users, GitBranch, MessageCircle, Trophy, Clock, Ban } from "lucide-react";

export default function CommunityGuidelines() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Правила сообщества Vibe Coding</h1>
        <p className="text-lg text-muted-foreground">
          Наше сообщество строится на принципах активного участия, взаимопомощи и постоянного развития. 
          Соблюдение этих правил помогает создать продуктивную среду для всех участников.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Основные принципы */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Основные принципы
            </CardTitle>
            <CardDescription>
              Фундаментальные ценности нашего сообщества
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">1</Badge>
              <div>
                <h4 className="font-semibold">Активное участие</h4>
                <p className="text-muted-foreground">Регулярно работайте над своими проектами и участвуйте в жизни сообщества</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">2</Badge>
              <div>
                <h4 className="font-semibold">Взаимопомощь</h4>
                <p className="text-muted-foreground">Помогайте другим участникам, делитесь знаниями и опытом</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">3</Badge>
              <div>
                <h4 className="font-semibold">Конструктивность</h4>
                <p className="text-muted-foreground">Оставляйте полезные комментарии и предложения к проектам других</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Требования к активности */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Требования к активности проектов
            </CardTitle>
            <CardDescription>
              Обязательные стандарты для поддержания активного статуса
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">≤ 7 дней</div>
                <div className="text-sm text-green-700 dark:text-green-300">Активный статус</div>
                <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Отлично!
                </Badge>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">8-14 дней</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">Предупреждение</div>
                <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Нужно активнее
                </Badge>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{'> 14 дней'}</div>
                <div className="text-sm text-red-700 dark:text-red-300">Неактивный</div>
                <Badge variant="destructive" className="mt-2">
                  Риск исключения
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Что считается активностью:
              </h4>
              <ul className="space-y-2 ml-6">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Коммиты в репозиториях
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Создание новых веток или pull request'ов
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Обновление документации
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Любые изменения в коде проекта
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Участие в сообществе */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Участие в сообществе
            </CardTitle>
            <CardDescription>
              Как активно взаимодействовать с другими участниками
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Рекомендуется:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Оставлять конструктивные комментарии к проектам</li>
                  <li>• Предлагать улучшения и идеи</li>
                  <li>• Делиться своим опытом</li>
                  <li>• Задавать вопросы и помогать новичкам</li>
                  <li>• Участвовать в обсуждениях</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Минимальные требования:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Минимум 2 комментария в месяц</li>
                  <li>• Ответы на вопросы в своих проектах</li>
                  <li>• Участие в еженедельных обсуждениях</li>
                  <li>• Обратная связь на полученные комментарии</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Система мотивации */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Система мотивации
            </CardTitle>
            <CardDescription>
              Награды за активное участие
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <Trophy className="h-8 w-8 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
                <div className="font-semibold">Вайбер недели</div>
                <div className="text-sm text-muted-foreground">За самую высокую активность</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Users className="h-8 w-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                <div className="font-semibold">Помощник сообщества</div>
                <div className="text-sm text-muted-foreground">За помощь другим участникам</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <GitBranch className="h-8 w-8 mx-auto text-green-600 dark:text-green-400 mb-2" />
                <div className="font-semibold">Активный разработчик</div>
                <div className="text-sm text-muted-foreground">За регулярные коммиты</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Последствия нарушений */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Последствия нарушений
            </CardTitle>
            <CardDescription>
              Что происходит при несоблюдении правил
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Первое предупреждение</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    При неактивности 8-14 дней - уведомление и призыв к активности
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <Ban className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200">Временное исключение</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    При неактивности более 14 дней - исключение на 2-4 недели
                  </p>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                    <li>• Проекты скрываются из публичного доступа</li>
                    <li>• Невозможность участвовать в конкурсе "Вайбер недели"</li>
                    <li>• Ограничение доступа к некоторым функциям</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">Возвращение в сообщество</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Для восстановления статуса необходимо показать активность в течение недели и связаться с администрацией
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Контакты */}
        <Card>
          <CardHeader>
            <CardTitle>Вопросы и обратная связь</CardTitle>
            <CardDescription>
              Как связаться с администрацией сообщества
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Если у вас есть вопросы по правилам или предложения по их улучшению, 
              обращайтесь к администраторам через комментарии к проектам или личные сообщения.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}