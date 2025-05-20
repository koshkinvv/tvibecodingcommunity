import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatRelativeTime } from '@/lib/utils';
import { GitBranch } from 'lucide-react';
import { MemberWithRepositories } from '@/lib/types';

interface MemberCardProps {
  member: MemberWithRepositories;
}

export function MemberCard({ member }: MemberCardProps) {
  // Get the initials of the user for avatar fallback
  const getInitials = () => {
    if (member.name) {
      return member.name.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();
    }
    return member.username.slice(0, 2).toUpperCase();
  };

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
      <CardContent className="px-4 py-5 sm:px-6">
        <div className="flex items-center">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatarUrl || ''} alt={member.username} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{member.name || member.username}</h3>
            <p className="text-sm text-gray-500">@{member.username}</p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={member.status} />
          </div>
        </div>
      </CardContent>
      
      <div className="px-4 py-4 sm:px-6">
        <div className="space-y-2">
          {member.repositories.length > 0 ? (
            member.repositories.map(repo => (
              <div key={repo.id} className="flex items-center text-sm">
                <div className="flex-shrink-0 text-gray-400">
                  <GitBranch className="h-4 w-4 mr-1.5" />
                </div>
                <div>
                  <a 
                    href={`https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {repo.name}
                  </a>
                  <p className="text-gray-500">
                    Last commit: {repo.lastCommitDate 
                      ? formatRelativeTime(new Date(repo.lastCommitDate)) 
                      : 'unknown'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No repositories</p>
          )}
        </div>
      </div>
    </Card>
  );
}
