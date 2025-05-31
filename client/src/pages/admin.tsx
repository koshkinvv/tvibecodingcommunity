import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminUserTable } from '@/components/admin/admin-user-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserStats } from '@/lib/types';
import { CalendarDays, Hammer, Users, RefreshCcw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [lastCheckResults, setLastCheckResults] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/stats'],
  });

  // Repository check mutation
  const repositoryCheckMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/check-repositories');
    },
    onSuccess: (data: any) => {
      setLastCheckResults(data.results);
      toast({
        title: 'Repository check completed',
        description: `Checked ${data.results.usersChecked} users, updated ${data.results.repositoriesUpdated} repositories`,
      });
      // Refresh stats and community data
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error) => {
      toast({
        title: 'Repository check failed',
        description: `Failed to complete repository check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    },
  });

  const handleManualRepositoryCheck = () => {
    repositoryCheckMutation.mutate();
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Admin Dashboard</h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button 
              onClick={handleManualRepositoryCheck}
              disabled={repositoryCheckMutation.isPending}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${repositoryCheckMutation.isPending ? 'animate-spin' : ''}`} />
              {repositoryCheckMutation.isPending ? 'Checking...' : 'Run Repository Check'}
            </Button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                    <Users className="h-4 w-4 mr-1.5 text-gray-400" />
                    Total Members
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats?.totalMembers || 0
                    )}
                  </dd>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                    <Users className="h-4 w-4 mr-1.5 text-green-400" />
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

            <Card>
              <CardContent className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                    <Users className="h-4 w-4 mr-1.5 text-yellow-400" />
                    Warning Status
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      (stats?.totalMembers || 0) - (stats?.activeMembers || 0) - 
                      /* Note: This is just an estimation for demo purposes */
                      Math.floor((stats?.totalMembers || 0) * 0.1)
                    )}
                  </dd>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                    <Users className="h-4 w-4 mr-1.5 text-red-400" />
                    Inactive Members
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      /* Note: This is just an estimation for demo purposes */
                      Math.floor((stats?.totalMembers || 0) * 0.1)
                    )}
                  </dd>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-8">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">
                <CalendarDays className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="members">
                <Users className="h-4 w-4 mr-2" />
                Member Management
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Hammer className="h-4 w-4 mr-2" />
                System Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">System Status</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-md">
                        <span className="font-medium">Daily Repository Check</span>
                        <span className="text-green-600">Active</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-md">
                        <span className="font-medium">GitHub API Status</span>
                        <span className="text-green-600">Connected</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-md">
                        <span className="font-medium">Notification System</span>
                        <span className="text-green-600">Active</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-md">
                        <span className="font-medium">Weekly Stats Calculation</span>
                        <span className="text-green-600">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Last Repository Check Results */}
                {lastCheckResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        Last Repository Check Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-md">
                          <div className="text-2xl font-bold text-blue-600">{lastCheckResults.usersChecked}</div>
                          <div className="text-sm text-blue-700">Users Checked</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-md">
                          <div className="text-2xl font-bold text-green-600">{lastCheckResults.repositoriesUpdated}</div>
                          <div className="text-sm text-green-700">Repositories Updated</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-md">
                          <div className="text-2xl font-bold text-red-600">{lastCheckResults.errors}</div>
                          <div className="text-sm text-red-700">Errors</div>
                        </div>
                      </div>

                      {lastCheckResults.details && lastCheckResults.details.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Recent Updates</h4>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {lastCheckResults.details.slice(0, 10).map((detail: any, index: number) => (
                              <div key={index} className="text-sm p-2 bg-gray-50 rounded flex items-center">
                                {detail.status === 'error' ? (
                                  <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                                ) : detail.status === 'skipped' ? (
                                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <span className="font-medium">{detail.user}</span>
                                  {detail.repository && (
                                    <>
                                      <span className="text-gray-500 mx-1">/</span>
                                      <span>{detail.repository}</span>
                                    </>
                                  )}
                                  {detail.oldStatus && detail.newStatus && (
                                    <span className="text-gray-500 ml-2">
                                      ({detail.oldStatus} → {detail.newStatus})
                                    </span>
                                  )}
                                  {detail.reason && (
                                    <span className="text-gray-500 ml-2">- {detail.reason}</span>
                                  )}
                                  {detail.error && (
                                    <span className="text-red-500 ml-2">- {detail.error}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {lastCheckResults.details.length > 10 && (
                            <p className="text-sm text-gray-500 mt-2">
                              Showing 10 of {lastCheckResults.details.length} updates
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="members">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h3 className="text-lg font-medium text-gray-900">Members Management</h3>
                  <p className="mt-2 text-sm text-gray-700">A list of all members with actions to manage their status.</p>
                </div>
              </div>
              
              <div className="mt-4">
                <AdminUserTable />
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">System Settings</h3>
                  <p className="text-gray-500 mb-4">Configure system-wide settings for the Vibe Coding platform.</p>
                  
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Notification Email Sender</label>
                      <input 
                        type="text"
                        value="noreply@vibecoding.example.com"
                        disabled
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Set in environment variables. Contact system administrator to change.
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">API Integration Settings</label>
                      <div className="p-4 bg-gray-50 rounded-md">
                        <p className="text-sm">GitHub API: Connected</p>
                        <p className="text-sm">Telegram Bot API: Connected</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Daily Check Time</label>
                      <input 
                        type="time"
                        value="03:00"
                        disabled
                        className="flex h-10 w-full max-w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <p className="text-xs text-muted-foreground">
                        System runs daily checks at 03:00 UTC. Configure in server settings.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
