import { useState } from 'react';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Globe,
  Search,
  FileText,
  Upload,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export default function NavigationHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { user: currentUser, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate({ to: '/auth/signin' });
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
    <header className="bg-card shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌐</span>
              <span className="text-xl font-bold">Cosmoslide</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center',
                    pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="mr-1 size-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/$username"
                  params={{ username: `@${currentUser.username}` }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                      {currentUser.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                    @{currentUser.username}
                  </span>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              </div>
            ) : (
              <Button asChild>
                <Link to="/auth/signin">Sign in</Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-1">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      pathname === link.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <Icon className="mr-2 size-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
