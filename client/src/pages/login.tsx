import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { FaGithub } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { user, isLoading, loginWithGitHub } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      setLocation('/profile');
    }
  }, [user, isLoading, setLocation]);

  // Special mock login function for demo purposes
  const mockLogin = () => {
    window.location.href = '/api/mock-login';
  };

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to Vibe Coding</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join a community of developers who code consistently
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <Button
              onClick={loginWithGitHub}
              variant="default"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <FaGithub className="h-5 w-5 text-gray-300 group-hover:text-gray-400" />
              </span>
              Sign in with GitHub
            </Button>
            
            <Button
              onClick={mockLogin}
              variant="outline"
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Demo Login (No GitHub Required)
            </Button>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-sm">
              <p className="text-gray-500">
                By signing in, you agree to share your GitHub public profile information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
