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
import { Menu, HelpCircle, Home, Activity, TrendingUp, Users, Settings, User, LogOut, Github, BookOpen, Target, BarChart3 } from 'lucide-react';

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { startOnboarding, resetOnboarding } = useOnboarding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const NavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) => {
    const isActive = location === href;
    
    return (
      <Link href={href} className={`${isActive ? 'bg-blue-50 text-blue-700 border-blue-500' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'} inline-flex items-center gap-2 px-3 py-2 border-b-2 text-sm font-medium rounded-t-lg transition-all duration-200`}>
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </Link>
    );
  };

  const MobileNavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) => {
    const isActive = location === href;
    
    return (
      <Link href={href} className={`${isActive ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900'} flex items-center gap-3 pl-4 pr-4 py-3 border-l-4 text-base font-medium transition-all duration-200`}>
        {Icon && <Icon className="h-5 w-5" />}
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
              <span className="text-2xl font-bold text-[#ffdd00]">TVibe<span className="text-gray-700">coding</span></span>
            </Link>
            <nav className="hidden sm:ml-10 sm:flex space-x-1" data-onboarding="navigation">
              {/* Основные разделы */}
              <NavLink href="/" icon={Home}>Главная</NavLink>
              {user && (
                <>
                  {/* Личные данные и активность */}
                  <NavLink href="/progress" icon={TrendingUp}>Мой прогресс</NavLink>
                  <NavLink href="/activity" icon={Activity}>Активность</NavLink>
                  
                  {/* Сообщество */}
                  <NavLink href="/community" icon={Users}>Сообщество</NavLink>
                  
                  {/* Настройки и профиль */}
                  <NavLink href="/profile" icon={User}>Профиль</NavLink>
                </>
              )}
              
              {/* Справочная информация */}
              <NavLink href="/guidelines" icon={BookOpen}>Правила</NavLink>
              
              {/* Административные функции */}
              {user?.isAdmin && <NavLink href="/admin" icon={Settings}>Админ</NavLink>}
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
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-4 py-3 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{user.name || user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Ваш профиль
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/progress" className="w-full flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Мой прогресс
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  Войти через GitHub
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
        <div className="pt-2 pb-3 space-y-1 bg-gray-50">
          {/* Основные разделы */}
          <MobileNavLink href="/" icon={Home}>Главная</MobileNavLink>
          {user && (
            <>
              {/* Личные данные и активность */}
              <MobileNavLink href="/progress" icon={TrendingUp}>Мой прогресс</MobileNavLink>
              <MobileNavLink href="/activity" icon={Activity}>Активность</MobileNavLink>
              
              {/* Сообщество */}
              <MobileNavLink href="/community" icon={Users}>Сообщество</MobileNavLink>
              
              {/* Настройки и профиль */}
              <MobileNavLink href="/profile" icon={User}>Профиль</MobileNavLink>
            </>
          )}
          
          {/* Справочная информация */}
          <MobileNavLink href="/guidelines" icon={BookOpen}>Правила</MobileNavLink>
          
          {/* Административные функции */}
          {user?.isAdmin && <MobileNavLink href="/admin" icon={Settings}>Админ</MobileNavLink>}
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
              <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <User className="h-5 w-5" />
                Ваш профиль
              </Link>
              <Link href="/progress" className="flex items-center gap-3 px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <BarChart3 className="h-5 w-5" />
                Мой прогресс
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Выйти
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-3 border-t border-gray-200 bg-gray-50">
            <div className="px-4">
              <Link href="/login" className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                <Github className="h-5 w-5" />
                Войти через GitHub
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
