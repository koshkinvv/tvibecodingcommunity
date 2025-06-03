import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/status-badge';
import { useAuth } from '@/hooks/use-auth';
import { UserStats, FeaturedMember } from '@/lib/types';

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

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Welcome to Vibe Coding</h2>
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
                      Active Members
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
                      Total Repositories
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
                      Viber of the Week
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
                        <span className="text-gray-500">No viber this week</span>
                      )}
                    </dd>
                  </dl>
                </CardContent>
              </Card>
            </div>

            {/* About Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">About Vibe Coding Community</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>Vibe Coding is a community where members commit to consistent coding practice. We track activity through GitHub commits, ensuring everyone stays active by contributing to their projects at least once every two weeks.</p>
                <div className="mt-4">
                  {!user ? (
                    <Link href="/login">
                      <Button>
                        Join the Community
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/profile">
                      <Button>
                        Go to Your Profile
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Getting Started Section - only show for authenticated users */}
            {user && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-4">🚀 Добро пожаловать! Как начать:</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Привяжите репозитории</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Перейдите в <Link href="/profile" className="underline hover:text-blue-800">ваш профиль</Link> и добавьте ваши GitHub репозитории для отслеживания активности.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Делайте коммиты регулярно</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Система автоматически отслеживает ваши коммиты в GitHub. Делайте хотя бы один коммит каждые 2 недели, чтобы оставаться активным.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Отслеживайте прогресс</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Смотрите свой <Link href="/progress" className="underline hover:text-blue-800">прогресс</Link>, набирайте XP за коммиты и соревнуйтесь в <Link href="/activity" className="underline hover:text-blue-800">рейтинге активности</Link>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Взаимодействуйте с сообществом</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Просматривайте <Link href="/community" className="underline hover:text-blue-800">публичные репозитории</Link> других участников, оставляйте комментарии и изучайте интересные проекты.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/profile">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Добавить репозитории
                    </Button>
                  </Link>
                  <Link href="/progress">
                    <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                      Посмотреть прогресс
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm text-amber-800">
                    <strong>Важно:</strong> Убедитесь, что ваши репозитории публичные или у вас есть соответствующие права доступа, чтобы система могла отслеживать коммиты.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Featured Members */}
        <h3 className="mt-8 text-lg font-medium text-gray-900">Featured Community Members</h3>
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
                      <p className="text-xs text-gray-500">{member.activeRepoCount} active repositories</p>
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
              <p className="text-gray-500">No featured members yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
