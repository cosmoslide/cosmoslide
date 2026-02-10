import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/RequireAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate({ to: '/auth/signin' });
  };

  return (
    <AppLayout>
      <RequireAuth>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>

            {/* User Info Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={user?.avatarUrl}
                      alt={user?.displayName || user?.username}
                    />
                    <AvatarFallback>
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">
                      {user?.displayName || user?.username}
                    </h2>
                    <p className="text-muted-foreground">@{user?.username}</p>
                    {user?.bio && <p className="mt-2 text-sm">{user.bio}</p>}
                    <div className="mt-4">
                      <Button variant="link" className="px-0" asChild>
                        <Link
                          to="/$username"
                          params={{ username: `@${user?.username}` }}
                        >
                          View Public Profile →
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center py-8">
                  Your activity feed will appear here once federation features
                  are enabled.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </RequireAuth>
    </AppLayout>
  );
}
