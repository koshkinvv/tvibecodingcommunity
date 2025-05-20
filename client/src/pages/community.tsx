import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MemberCard } from '@/components/member-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MemberWithRepositories } from '@/lib/types';
import { Search } from 'lucide-react';

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 9;

  // Fetch community members
  const { data: members = [], isLoading } = useQuery<MemberWithRepositories[]>({
    queryKey: ['/api/community'],
  });

  // Apply filters
  const filteredMembers = members.filter(member => {
    // Apply status filter if selected
    if (statusFilter && member.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        member.username.toLowerCase().includes(query) ||
        (member.name && member.name.toLowerCase().includes(query)) ||
        member.repositories.some(repo => repo.name.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * membersPerPage,
    currentPage * membersPerPage
  );

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Community Gallery</h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shadow-sm focus:ring-primary focus:border-primary block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mt-4 flex space-x-4">
          <Button
            size="sm"
            variant={statusFilter === null ? "default" : "outline"}
            onClick={() => setStatusFilter(null)}
            className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-full shadow-sm"
          >
            All
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'active' ? "default" : "outline"}
            onClick={() => setStatusFilter('active')}
            className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-full shadow-sm"
          >
            Active
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'warning' ? "default" : "outline"}
            onClick={() => setStatusFilter('warning')}
            className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-full shadow-sm"
          >
            Warning
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'inactive' ? "default" : "outline"}
            onClick={() => setStatusFilter('inactive')}
            className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-full shadow-sm"
          >
            Inactive
          </Button>
        </div>

        {/* Member List */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : paginatedMembers.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedMembers.map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No members found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * membersPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * membersPerPage, filteredMembers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredMembers.length}</span> members
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
                
                {/* Page buttons */}
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === i + 1 
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
