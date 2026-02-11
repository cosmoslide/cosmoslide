import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { userApi, uploadApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { RequireAuth } from '@/components/require-auth';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { UserPlus, Mail, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    email: '',
    defaultVisibility: 'public' as
      | 'public'
      | 'unlisted'
      | 'followers'
      | 'direct',
  });
  const [privacySettings, setPrivacySettings] = useState({
    isLocked: false,
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        displayName: currentUser.displayName || '',
        bio: currentUser.bio || '',
        email: currentUser.email || '',
        defaultVisibility: currentUser.defaultVisibility || 'public',
      });
      if (currentUser.actor) {
        setPrivacySettings({
          isLocked: currentUser.actor.manuallyApprovesFollowers || false,
        });
      }
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await userApi.updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await refreshUser();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrivacyToggle = async (setting: 'isLocked') => {
    setSavingPrivacy(true);
    setMessage(null);

    try {
      const newValue = !privacySettings[setting];
      const result = await userApi.updatePrivacySettings({
        [setting]: newValue,
      });
      setPrivacySettings((prev) => ({ ...prev, [setting]: result.isLocked }));
      setMessage({
        type: 'success',
        text: `Account is now ${result.isLocked ? 'private' : 'public'}`,
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      setMessage({ type: 'error', text: 'Failed to update privacy settings' });
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    setMessage(null);

    try {
      const { url } = await uploadApi.uploadProfileImage(avatarFile);
      await userApi.updateAvatar(url);
      setMessage({
        type: 'success',
        text: 'Profile image updated successfully!',
      });
      await refreshUser();
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setMessage({
        type: 'error',
        text: 'Failed to upload profile image. Please try again.',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <AppLayout>
      <RequireAuth>
        {currentUser && (
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="mt-2 text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Image Upload */}
                  <div>
                    <Label className="mb-2">Profile Image</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage
                            src={
                              avatarPreview ||
                              currentUser.avatarUrl ||
                              undefined
                            }
                            alt="Profile"
                          />
                          <AvatarFallback>
                            {currentUser.displayName?.[0]?.toUpperCase() ||
                              currentUser.username?.[0]?.toUpperCase() ||
                              'U'}
                          </AvatarFallback>
                        </Avatar>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                            <Spinner className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          id="avatar"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <div className="flex items-center space-x-2">
                          <Button type="button" variant="secondary" asChild>
                            <label htmlFor="avatar" className="cursor-pointer">
                              Choose Image
                            </label>
                          </Button>
                          {avatarFile && (
                            <Button
                              type="button"
                              onClick={handleAvatarUpload}
                              disabled={uploadingAvatar}
                            >
                              {uploadingAvatar ? 'Uploading...' : 'Upload'}
                            </Button>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          JPG, PNG or WebP. Max 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      placeholder="Your display name"
                      className="mt-2"
                    />
                  </div>

                  {/* Username (read-only) */}
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      type="text"
                      id="username"
                      value={`/@${currentUser.username}`}
                      disabled
                      className="mt-2"
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your username cannot be changed
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="mt-2"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell us about yourself..."
                      maxLength={500}
                      className="mt-2"
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formData.bio.length}/500 characters
                    </p>
                  </div>

                  {/* Default Post Visibility */}
                  <div>
                    <Label htmlFor="defaultVisibility">
                      Default Post Visibility
                    </Label>
                    <Select
                      value={formData.defaultVisibility}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          defaultVisibility:
                            value as typeof formData.defaultVisibility,
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          🌍 Public - Visible to everyone
                        </SelectItem>
                        <SelectItem value="unlisted">
                          🔓 Unlisted - Not shown in public timelines
                        </SelectItem>
                        <SelectItem value="followers">
                          👥 Followers only - Only visible to followers
                        </SelectItem>
                        <SelectItem value="direct">
                          ✉️ Direct - Only visible to mentioned users
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  {message && (
                    <Alert
                      variant={
                        message.type === 'error' ? 'destructive' : 'default'
                      }
                    >
                      <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        navigate({
                          to: '/$username',
                          params: { username: `@${currentUser.username}` },
                        })
                      }
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Privacy Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link
                  to="/follow-requests"
                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <UserPlus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Follow Requests</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage pending follow requests
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>

                <Link
                  to="/invitations"
                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mr-3">
                      <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Invitations</h3>
                      <p className="text-sm text-muted-foreground">
                        Invite new users to Cosmoslide
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Private Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Require approval for new followers
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.isLocked}
                    onCheckedChange={() => handlePrivacyToggle('isLocked')}
                    disabled={savingPrivacy}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </RequireAuth>
    </AppLayout>
  );
}
