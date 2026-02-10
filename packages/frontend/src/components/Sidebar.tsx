import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Globe,
  Search,
  FileText,
  Upload,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { user: currentUser, loading: authLoading, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate({ to: '/auth/signin' });
    onClose?.();
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  const navLinks: {
    href: string;
    label: string;
    icon: LucideIcon;
    requiresAuth: boolean;
  }[] = [
    { href: '/home', label: 'Home', icon: Home, requiresAuth: true },
    {
      href: '/timeline/public',
      label: 'Public',
      icon: Globe,
      requiresAuth: false,
    },
    { href: '/search', label: 'Search', icon: Search, requiresAuth: true },
    {
      href: '/presentations',
      label: 'Presentations',
      icon: FileText,
      requiresAuth: true,
    },
    { href: '/upload', label: 'Upload', icon: Upload, requiresAuth: true },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      requiresAuth: true,
    },
  ];

  const visibleLinks = navLinks.filter(
    (link) => !link.requiresAuth || currentUser,
  );

  return (
    <aside className="flex flex-col h-full bg-card border-r">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link
          to="/"
          onClick={handleLinkClick}
          className="flex items-center space-x-2"
        >
          <span className="text-2xl">🌐</span>
          <span className="text-xl font-bold">Cosmoslide</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="mr-3 size-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        {authLoading ? (
          <div className="flex items-center space-x-3 px-4 py-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : currentUser ? (
          <div className="space-y-3">
            <Link
              to="/$username"
              params={{ username: `@${currentUser.username}` }}
              onClick={handleLinkClick}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Avatar className="size-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {currentUser.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  @{currentUser.username}
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 h-auto text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 size-5" />
              Sign out
            </Button>
          </div>
        ) : (
          <Button asChild className="w-full">
            <Link to="/auth/signin" onClick={handleLinkClick}>
              Sign in
            </Link>
          </Button>
        )}
      </div>
    </aside>
  );
}
