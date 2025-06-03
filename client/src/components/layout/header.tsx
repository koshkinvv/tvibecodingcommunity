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
import { Menu, X, HelpCircle, Home, Activity, TrendingUp, Users, Settings, User, LogOut, Github, BookOpen, Target, BarChart3 } from 'lucide-react';

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { startOnboarding, resetOnboarding } = useOnboarding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const NavLink = ({ href, children, icon: Icon, badge }: { 
    href: string; 
    children: React.ReactNode; 
    icon?: React.ComponentType<{ className?: string }>; 
    badge?: number;
  }) => {
    const isActive = location === href;
    
    return (
      <Link 
        href={href} 
        className={`
          ${isActive 
            ? 'text-blue-600 bg-blue-50 border-blue-600' 
            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 border-transparent'
          } 
          relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium 
          border-b-2 transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          min-h-[44px] min-w-[44px]
        `}
        aria-current={isActive ? 'page' : undefined}
      >
        {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
        <span className="hidden lg:inline">{children}</span>
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    );
  };

  const MobileNavLink = ({ href, children, icon: Icon, badge }: { 
    href: string; 
    children: React.ReactNode; 
    icon?: React.ComponentType<{ className?: string }>; 
    badge?: number;
  }) => {
    const isActive = location === href;
    
    return (
      <Link 
        href={href} 
        className={`
          ${isActive 
            ? 'bg-blue-50 border-blue-500 text-blue-700' 
            : 'border-transparent text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
          } 
          relative flex items-center gap-3 pl-4 pr-4 py-4 border-l-4 text-base font-medium 
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
          min-h-[56px]
        `}
        aria-current={isActive ? 'page' : undefined}
      >
        {Icon && <Icon className="h-6 w-6 flex-shrink-0" />}
        <span className="flex-1">{children}</span>
        {badge && badge > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-[#ffdd00]">TVibe<span className="text-gray-700">coding</span></span>
            </Link>
            <nav className="hidden lg:ml-10 lg:flex lg:space-x-2" role="navigation" aria-label="Основная навигация" data-onboarding="navigation">
              <NavLink href="/" icon={Home}>Главная</NavLink>
              
              {user && (
                <>
                  <div className="h-6 w-px bg-gray-300 mx-2" role="separator" />
                  <NavLink href="/progress" icon={BarChart3}>Прогресс</NavLink>
                  <NavLink href="/activity" icon={Activity}>Активность</NavLink>
                  <NavLink href="/community" icon={Users}>Сообщество</NavLink>
                  
                  <div className="h-6 w-px bg-gray-300 mx-2" role="separator" />
                  <NavLink href="/profile" icon={User}>Профиль</NavLink>
                </>
              )}
              
              {user?.isAdmin && (
                <>
                  <div className="h-6 w-px bg-gray-300 mx-2" role="separator" />
                  <NavLink href="/admin" icon={Settings}>Админ</NavLink>
                </>
              )}
            </nav>
          </div>
          <div className="hidden lg:ml-6 lg:flex lg:items-center space-x-2" data-onboarding="profile-menu">
            {/* Secondary Navigation */}
            <nav className="flex items-center space-x-1" role="navigation" aria-label="Вторичная навигация">
              <Link href="/guidelines" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" title="Правила и гайдлайны">
                <BookOpen className="h-5 w-5" />
                <span className="sr-only">Правила</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetOnboarding();
                  setTimeout(startOnboarding, 100);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Справка и онбординг"
                aria-label="Открыть справку"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </nav>
            
            <div className="h-6 w-px bg-gray-300" role="separator" />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="relative bg-white rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-200 transition-all"
                    aria-label="Открыть пользовательское меню"
                    aria-haspopup="true"
                  >
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random&format=svg`}
                      alt={`Аватар ${user.username}`}
                      loading="lazy"
                    />
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></span>
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
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className={`
                relative inline-flex items-center justify-center p-2 rounded-lg
                ${mobileMenuOpen 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                transition-all duration-200 ease-in-out
                min-h-[44px] min-w-[44px]
              `}
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">{mobileMenuOpen ? 'Закрыть' : 'Открыть'} главное меню</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div 
        className={`lg:hidden border-b border-gray-200 bg-white ${mobileMenuOpen ? 'block' : 'hidden'}`} 
        id="mobile-menu"
        role="navigation"
        aria-label="Мобильная навигация"
      >
        {/* Primary Navigation Section */}
        <div className="py-3">
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Основное</h3>
          </div>
          <MobileNavLink href="/" icon={Home}>Главная</MobileNavLink>
        </div>
        
        {user && (
          <>
            {/* User Section */}
            <div className="border-t border-gray-100 py-3">
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Личное</h3>
              </div>
              <MobileNavLink href="/progress" icon={BarChart3}>Мой прогресс</MobileNavLink>
              <MobileNavLink href="/activity" icon={Activity}>Активность</MobileNavLink>
              <MobileNavLink href="/profile" icon={User}>Профиль</MobileNavLink>
            </div>
            
            {/* Community Section */}
            <div className="border-t border-gray-100 py-3">
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Сообщество</h3>
              </div>
              <MobileNavLink href="/community" icon={Users}>Участники</MobileNavLink>
            </div>
          </>
        )}
        
        {/* Help & Resources Section */}
        <div className="border-t border-gray-100 py-3">
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Справка</h3>
          </div>
          <MobileNavLink href="/guidelines" icon={BookOpen}>Правила</MobileNavLink>
          <button
            onClick={() => {
              resetOnboarding();
              setTimeout(startOnboarding, 100);
              setMobileMenuOpen(false);
            }}
            className="relative flex items-center gap-3 pl-4 pr-4 py-4 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset min-h-[56px] w-full text-left"
          >
            <HelpCircle className="h-6 w-6 flex-shrink-0" />
            <span className="flex-1">Помощь</span>
          </button>
        </div>
        
        {/* Admin Section */}
        {user?.isAdmin && (
          <div className="border-t border-gray-100 py-3">
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Администрирование</h3>
            </div>
            <MobileNavLink href="/admin" icon={Settings}>Админ-панель</MobileNavLink>
          </div>
        )}
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
