import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AdminUser } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { formatRelativeTime } from '@/lib/utils';
import { Eye, UmbrellaIcon, AlertTriangle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdminUserTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, onVacation }: { userId: number; onVacation: boolean }) => {
      return apiRequest('PATCH', `/api/admin/users/${userId}`, {
        onVacation,
        // Set vacation until 2 weeks from now
        vacationUntil: onVacation ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.onVacation ? 'User suspended' : 'User unsuspended',
        description: variables.onVacation 
          ? 'The user has been put on vacation mode for 2 weeks' 
          : 'The user has been removed from vacation mode',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update user: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: 'User deleted',
        description: 'The user has been removed from the system',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setUserToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete user: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleViewUser = (userId: number) => {
    setLocation(`/admin/users/${userId}`);
  };

  const handleToggleSuspend = (user: AdminUser) => {
    suspendMutation.mutate({ userId: user.id, onVacation: !user.onVacation });
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="h-12 bg-gray-100 animate-pulse rounded-lg mb-4"></div>
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>GitHub</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={user.avatarUrl || ''} alt={user.username} />
                        <AvatarFallback>
                          {user.name?.substring(0, 2) || user.username.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{user.name || user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-900">@{user.username}</div>
                    <div className="text-gray-500 text-sm">{user.repositoryCount} repositories</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <StatusBadge status={user.status} />
                      {user.onVacation && (
                        <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                          <UmbrellaIcon className="h-3 w-3 mr-1" />
                          Vacation
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.lastActivity ? formatRelativeTime(new Date(user.lastActivity)) : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUser(user.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        variant={user.onVacation ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleSuspend(user)}
                        className={user.onVacation ? "bg-amber-600 hover:bg-amber-700" : ""}
                      >
                        {user.onVacation ? (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Unsuspend
                          </>
                        ) : (
                          <>
                            <UmbrellaIcon className="h-4 w-4 mr-1" />
                            Suspend
                          </>
                        )}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setUserToDelete(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the user "{user.name || user.username}" and all their repositories.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteUser}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
