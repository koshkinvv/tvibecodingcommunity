import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RepositoryList } from '@/components/repository-list';
import { NotificationSettings } from '@/components/profile/notification-settings';
import { VacationMode } from '@/components/profile/vacation-mode';
import { TelegramConnection } from '@/components/profile/telegram-connection';
import { ProfileData } from '@/lib/types';
import { Umbrella } from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('repositories');

  // Fetch profile data
  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
  });

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !authUser) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <p className="text-gray-500">Please log in to view your profile</p>
          </div>
        </div>
      </div>
    );
  }

  const { user, repositories } = data;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Your Profile</h2>
          </div>
          {user.onVacation && (
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Umbrella className="h-4 w-4 mr-1.5" />
                Vacation Mode Active
              </span>
            </div>
          )}
        </div>

        <div className="mt-8">
          <Card className="bg-white shadow overflow-hidden sm:rounded-lg">
            <CardContent className="px-4 py-5 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and repository status.</p>
                </div>
                <div className="col-span-1 md:text-right">
                  <a
                    href={`https://github.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View GitHub Profile
                  </a>
                </div>
              </div>
              
              <div className="mt-5 border-t border-gray-200">
                <dl className="divide-y divide-gray-200">
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Full name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name || 'Not provided'}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">GitHub username</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.username}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email || 'Not provided'}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {repositories.some(r => r.status === 'active') ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          Active
                        </span>
                      ) : repositories.some(r => r.status === 'warning') ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          Inactive
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Tabs defaultValue="repositories" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="repositories">Repositories</TabsTrigger>
              <TabsTrigger value="settings">Notification Settings</TabsTrigger>
              <TabsTrigger value="vacation">Vacation Mode</TabsTrigger>
            </TabsList>
            
            <TabsContent value="repositories">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Repositories</h3>
              <RepositoryList />
            </TabsContent>
            
            <TabsContent value="settings">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
              <NotificationSettings user={user} />
            </TabsContent>
            
            <TabsContent value="vacation">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vacation Mode</h3>
              <VacationMode user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
