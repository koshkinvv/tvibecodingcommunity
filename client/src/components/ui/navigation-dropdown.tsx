import { Link } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, GitBranch, Eye, Target, Plus } from 'lucide-react';

interface NavigationDropdownProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    separator?: boolean;
  }>;
}

export function NavigationDropdown({ title, icon: Icon, items }: NavigationDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 border-b-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]">
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span className="hidden lg:inline">{title}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {items.map((item, index) => (
          <div key={item.href}>
            {item.separator && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem asChild>
              <Link href={item.href} className="w-full flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Предустановленные выпадающие меню
export const ProjectsDropdown = () => (
  <NavigationDropdown
    title="Проекты"
    icon={GitBranch}
    items={[
      { href: '/projects', label: 'Просмотр проектов', icon: Eye },
      { href: '/insights', label: 'Аналитика проектов', icon: Target },
      { href: '/profile', label: 'Добавить репозиторий', icon: Plus, separator: true },
    ]}
  />
);