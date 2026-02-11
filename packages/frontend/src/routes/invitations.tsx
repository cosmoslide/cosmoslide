import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { invitationApi, Invitation } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { RequireAuth } from '@/components/require-auth';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Check } from 'lucide-react';

export const Route = createFileRoute('/invitations')({
  component: InvitationsPage,
});

function InvitationsPage() {
  const { user: currentUser } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [quota, setQuota] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const data = await invitationApi.getInvitations();
      setInvitations(data.invitations);
      setQuota(data.quota);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      setStatusMessage({
        type: 'error',
        text: 'Failed to load invitations',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setStatusMessage(null);

    try {
      await invitationApi.sendInvitation(
        email.trim(),
        message.trim() || undefined,
      );
      setStatusMessage({
        type: 'success',
        text: `Invitation sent to ${email}`,
      });
      setEmail('');
      setMessage('');
      // Refresh invitations list and quota
      fetchInvitations();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      setStatusMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Failed to send invitation',
      });
    } finally {
      setSending(false);
    }
  };

  const getInvitationStatus = (
    invitation: Invitation,
  ): { label: string; variant: 'default' | 'secondary' | 'outline' } => {
    if (invitation.usedCount >= invitation.maxUses) {
      return { label: 'Used', variant: 'default' };
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      return { label: 'Expired', variant: 'secondary' };
    }
    return { label: 'Pending', variant: 'outline' };
  };

  return (
    <AppLayout>
      <RequireAuth>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Invitations</h1>
                  <p className="mt-2 text-muted-foreground">
                    Invite new users to join Cosmoslide
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Quota:</span>
                  <Badge variant={quota > 0 ? 'default' : 'secondary'}>
                    {quota} remaining
                  </Badge>
                </div>
              </div>
            </div>

            {/* Send Invitation Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Send Invitation</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendInvitation} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={quota <= 0 || sending}
                      placeholder="friend@example.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">
                      Personal Message{' '}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={500}
                      disabled={quota <= 0 || sending}
                      rows={3}
                      placeholder="Add a personal message to your invitation..."
                      className="mt-2"
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {message.length}/500 characters
                    </p>
                  </div>

                  {statusMessage && (
                    <Alert
                      variant={
                        statusMessage.type === 'error'
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      <AlertDescription>{statusMessage.text}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={quota <= 0 || sending || !email.trim()}
                    className="w-full"
                  >
                    {sending
                      ? 'Sending...'
                      : quota <= 0
                        ? 'No Quota Available'
                        : 'Send Invitation'}
                  </Button>

                  {quota <= 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      You don't have any invitation quota. Contact an
                      administrator to request more.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Invitations List */}
            <Card>
              <CardHeader>
                <CardTitle>Sent Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    You haven't sent any invitations yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {invitations.map((invitation) => {
                      const status = getInvitationStatus(invitation);
                      return (
                        <div
                          key={invitation.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">
                                  {invitation.email}
                                </span>
                                <Badge variant={status.variant}>
                                  {status.label}
                                </Badge>
                              </div>
                              {invitation.note && (
                                <p className="mt-1 text-sm text-muted-foreground italic">
                                  "{invitation.note}"
                                </p>
                              )}
                              <div className="mt-2 text-sm text-muted-foreground">
                                <span>
                                  Sent{' '}
                                  {new Date(
                                    invitation.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="mx-2">•</span>
                                <span>
                                  Expires{' '}
                                  {new Date(
                                    invitation.expiresAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {invitation.usedBy && (
                                <div className="mt-2">
                                  <Link
                                    to="/$username"
                                    params={{
                                      username: `@${invitation.usedBy.username}`,
                                    }}
                                    className="inline-flex items-center text-sm text-green-600 dark:text-green-400 hover:underline"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Accepted by @{invitation.usedBy.username}
                                    {invitation.usedBy.displayName !==
                                      invitation.usedBy.username && (
                                      <span className="ml-1 text-muted-foreground">
                                        ({invitation.usedBy.displayName})
                                      </span>
                                    )}
                                  </Link>
                                  {invitation.usedAt && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      on{' '}
                                      {new Date(
                                        invitation.usedAt,
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Back to Settings */}
            <div className="mt-6 text-center">
              <Button variant="link" asChild>
                <Link to="/settings">Back to Settings</Link>
              </Button>
            </div>
          </div>
        )}
      </RequireAuth>
    </AppLayout>
  );
}
