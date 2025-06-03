import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Menu, HelpCircle } from 'lucide-react';

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { startOnboarding, resetOnboarding } = useOnboarding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = location === href;
    
    return (
      <Link href={href} className={`${isActive ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
        {children}
      </Link>
    );
  };

  const MobileNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = location === href;
    
    return (
      <Link href={href} className={`${isActive ? 'bg-primary-50 border-primary text-primary' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
        {children}
      </Link>
    );
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-primary">TVibe<span className="text-gray-700">coding</span></span>
            </Link>
            <nav className="hidden sm:ml-10 sm:flex space-x-8" data-onboarding="navigation">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/guidelines">Guidelines</NavLink>
              {user && <NavLink href="/activity">Activity</NavLink>}
              {user && <NavLink href="/insights">Insights</NavLink>}
              {user && <NavLink href="/progress">Progress</NavLink>}
              {user && <NavLink href="/profile">Profile</NavLink>}
              {user && <NavLink href="/community">Community</NavLink>}
              {user && <NavLink href="/projects">Projects</NavLink>}
              {user?.isAdmin && <NavLink href="/admin">Admin</NavLink>}
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-3" data-onboarding="profile-menu">
            {/* Help button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetOnboarding();
                setTimeout(startOnboarding, 100);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="ml-1 hidden lg:inline">Помощь</span>
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                      alt={`${user.username} profile`}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{user.name || user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full">
                      Your Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button>
                  Sign in with GitHub
                </Button>
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${mobileMenuOpen ? '' : 'hidden'}`} id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          <MobileNavLink href="/">Home</MobileNavLink>
          <MobileNavLink href="/guidelines">Guidelines</MobileNavLink>
          {user && <MobileNavLink href="/activity">Activity</MobileNavLink>}
          {user && <MobileNavLink href="/insights">Insights</MobileNavLink>}
          {user && <MobileNavLink href="/profile">Profile</MobileNavLink>}
          {user && <MobileNavLink href="/community">Community</MobileNavLink>}
          {user && <MobileNavLink href="/projects">Projects</MobileNavLink>}
          {user?.isAdmin && <MobileNavLink href="/admin">Admin</MobileNavLink>}
        </div>
        {user ? (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <img
                  className="h-10 w-10 rounded-full"
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                  alt={`${user.username} profile`}
                />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user.name || user.username}</div>
                <div className="text-sm font-medium text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link href="/profile" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                Your Profile
              </Link>
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4">
              <Link href="/login" className="block text-center px-4 py-2 rounded-md text-base font-medium text-white bg-primary hover:bg-primary-700">
                Sign in with GitHub
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
