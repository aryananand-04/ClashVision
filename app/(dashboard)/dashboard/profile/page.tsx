'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Crown, Save, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const supabase = createSupabaseClient();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        setFullName(user.user_metadata?.full_name || '');

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(profileData);
      }
      setLoading(false);
    };

    loadProfile();
  }, [supabase]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      setMessage('Failed to update profile');
      setSaving(false);
      return;
    }

    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (updatedProfile) {
      setProfile(updatedProfile);
    }

    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-gray-400">Manage your account information</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-white text-2xl">
                  {profile?.full_name || 'User'}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
              </div>
            </div>
            {profile?.is_premium && (
              <Badge className="bg-linear-to-r from-yellow-400 to-orange-500 text-white">
                <Crown className="h-4 w-4 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Full Name
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Email Address
            </label>
            <Input
              value={user.email}
              disabled
              className="bg-slate-800 border-slate-700 text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${message.includes('success') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {message}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Account Created</span>
            <span className="text-white">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Account Status</span>
            <span className="text-white">
              {profile?.is_premium ? 'Premium' : 'Free'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">User ID</span>
            <span className="text-white font-mono text-xs">{user.id.slice(0, 16)}...</span>
          </div>
        </CardContent>
      </Card>

      {!profile?.is_premium && (
        <Card className="bg-linear-to-r from-blue-900 to-purple-900 border-0">
          <CardContent className="p-6">
            <div className="text-center">
              <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h3>
              <p className="text-gray-200 mb-4">
                Unlock unlimited searches, priority matching, and exclusive features
              </p>
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                View Premium Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}