import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface ProfileTabsProps {
  username: string;
}

export default function ProfileTabs({ username }: ProfileTabsProps) {
  const location = useLocation();
  const isNotesTab = location.pathname === `/@${username}`;
  const isPresentationsTab =
    location.pathname === `/@${username}/presentations`;

  return (
    <Card className="overflow-hidden">
      <div className="border-b">
        <nav className="flex -mb-px">
          <Link
            to="/$username"
            params={{ username: `@${username}` }}
            className={cn(
              'flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors',
              isNotesTab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            Notes
          </Link>
          <Link
            to="/$username/presentations"
            params={{ username: `@${username}` }}
            className={cn(
              'flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors',
              isPresentationsTab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            Presentations
          </Link>
        </nav>
      </div>
    </Card>
  );
}
