import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/status-badge';
import { useAuth } from '@/hooks/use-auth';
import { UserStats, FeaturedMember } from '@/lib/types';
import { BookOpen } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/stats'],
  });

  // Fetch featured members
  const { data: featuredMembers, isLoading: membersLoading } = useQuery<FeaturedMember[]>({
    queryKey: ['/api/members/featured'],
  });

  // Fetch user's repositories to check if onboarding is needed
  const { data: userRepositories, isLoading: repositoriesLoading } = useQuery({
    queryKey: [`/api/repositories/user/${user?.id}`],
    enabled: !!user,
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Добро пожаловать в Vibe Coding</h2>
          </div>
        </div>

        <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Stats section */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-onboarding="stats">
              {/* Active Members */}
              <Card>
                <CardContent className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Активных участников
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {statsLoading ? (
                        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        stats?.activeMembers || 0
                      )}
                    </dd>
                  </dl>
                </CardContent>
              </Card>

              {/* Total Repositories */}
              <Card>
                <CardContent className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Всего репозиториев
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {statsLoading ? (
                        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        stats?.totalRepositories || 0
                      )}
                    </dd>
                  </dl>
                </CardContent>
              </Card>

              {/* Viber of the Week */}
              <Card>
                <CardContent className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Вайбер недели
                    </dt>
                    <dd className="mt-1 text-xl font-semibold text-gray-900 flex items-center">
                      {statsLoading ? (
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full mr-2"></div>
                          <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                        </div>
                      ) : stats?.viberOfTheWeek ? (
                        <>
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage 
                              src={stats.viberOfTheWeek.avatarUrl || ''} 
                              alt={stats.viberOfTheWeek.username} 
                            />
                            <AvatarFallback>
                              {stats.viberOfTheWeek.name?.substring(0, 2) || 
                                stats.viberOfTheWeek.username.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{stats.viberOfTheWeek.name || stats.viberOfTheWeek.username}</span>
                        </>
                      ) : (
                        <span className="text-gray-500">Нет вайбера на этой неделе</span>
                      )}
                    </dd>
                  </dl>
                </CardContent>
              </Card>
            </div>

            {/* About Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">О сообществе Vibe Coding</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>Vibe Coding — это сообщество, где участники обязуются поддерживать постоянную практику программирования. Мы отслеживаем активность через коммиты GitHub, обеспечивая активность каждого участника через вклад в свои проекты минимум раз в две недели.</p>
                <div className="mt-4">
                  {!user ? (
                    <Link href="/login">
                      <Button>
                        Присоединиться к сообществу
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/profile">
                      <Button>
                        Перейти в профиль
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Onboarding Section - show for users without repositories */}
            {user && !repositoriesLoading && userRepositories && userRepositories.length === 0 && (
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Добро пожаловать в Vibe Coding!</h3>
                    <p className="text-blue-800 mb-4">Начните отслеживать свою активность в разработке, подключив GitHub репозитории.</p>
                    
                    <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
                      <h4 className="font-medium text-gray-900 mb-3">Что вы получите:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Автоматический подсчет коммитов</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Отслеживание серий активности</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Система уровней и опыта</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Участие в рейтинге сообщества</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href="/profile">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          Подключить репозитории
                        </Button>
                      </Link>
                      <Link href="/progress">
                        <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                          Узнать больше о системе
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tips Section - show for users with repositories */}
            {user && !repositoriesLoading && userRepositories && userRepositories.length > 0 && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Отлично! У вас подключено {userRepositories.length} репозиториев</h3>
                    <p className="text-sm text-green-700">Система отслеживает вашу активность и обновляет статистику ежедневно</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <h4 className="font-medium text-gray-900 mb-2">Следующие шаги:</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Проверьте свой <Link href="/progress" className="text-green-600 hover:text-green-700 underline">прогресс</Link></span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Изучите <Link href="/activity" className="text-green-600 hover:text-green-700 underline">активность сообщества</Link></span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Посетите <Link href="/community" className="text-green-600 hover:text-green-700 underline">проекты участников</Link></span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <h4 className="font-medium text-gray-900 mb-2">Полезные советы:</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Делайте коммиты регулярно для поддержания серии</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Каждый коммит приносит 10 XP</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Добавьте больше репозиториев в <Link href="/profile" className="text-blue-600 hover:text-blue-700 underline">профиле</Link></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Featured Members */}
        <h3 className="mt-8 text-lg font-medium text-gray-900">Рекомендуемые участники сообщества</h3>
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-onboarding="featured-members">
          {membersLoading ? (
            // Loading skeleton
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full"></div>
                    <div className="ml-3">
                      <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
                      <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                    <div className="ml-auto">
                      <div className="h-6 w-16 bg-gray-200 animate-pulse rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : featuredMembers && featuredMembers.length > 0 ? (
            featuredMembers.map(member => (
              <Card key={member.id}>
                <CardContent className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatarUrl || ''} alt={member.username} />
                      <AvatarFallback>
                        {member.name?.substring(0, 2) || member.username.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">{member.name || member.username}</h3>
                      <p className="text-xs text-gray-500">{member.activeRepoCount} активных репозиториев</p>
                    </div>
                    <div className="ml-auto">
                      <StatusBadge status="active" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-gray-500">Пока нет рекомендуемых участников</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
