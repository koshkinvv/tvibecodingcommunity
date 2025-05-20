import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Query to fetch current user
  const { 
    data: user, 
    isLoading, 
    isError,
    error 
  } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFnWithErrorHandling,
    retry: false, // Don't retry if 401
  });

  // Custom query function to handle 401 correctly
  async function getQueryFnWithErrorHandling() {
    try {
      const res = await fetch('/api/auth/user', {
        credentials: 'include',
      });
      
      if (res.status === 401) {
        // Return null instead of throwing error
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  }

  // Handle logout
  const logout = async () => {
    try {
      await apiRequest('GET', '/api/auth/logout');
      
      // Reset user state and redirect
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.invalidateQueries();
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
      
      setLocation('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Login with GitHub
  const loginWithGitHub = () => {
    window.location.href = '/api/auth/github';
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isError,
    error,
    logout,
    loginWithGitHub
  };
}
