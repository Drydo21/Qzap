import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { profileAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';
import { User, Settings, LogOut, Globe, Loader2, Zap } from 'lucide-react';
import MobileNav from '../components/MobileNav';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, language, setLanguage } = useAuth();
  const { t } = useTranslation(language);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.update({ name, language });
      toast.success(language === 'hi' ? 'प्रोफ़ाइल अपडेट की गई' : 'Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] main-content">
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Settings className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900 font-['Manrope']">{t('profile')}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Profile Header */}
          <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 h-24" />
            <CardContent className="relative pt-0 pb-6 px-6">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg -mt-12">
                <AvatarImage src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} />
                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-2xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-slate-900 font-['Manrope']">{user?.name}</h2>
                <p className="text-slate-500">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card className="border-0 shadow-sm rounded-3xl">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                {t('editProfile')}
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">{t('name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-transparent"
                  data-testid="name-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('language')}
                </Label>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setLanguage('en')}
                    variant={language === 'en' ? 'default' : 'outline'}
                    className={`flex-1 h-12 rounded-xl ${language === 'en' ? 'bg-indigo-600 text-white' : ''}`}
                    data-testid="lang-en-btn"
                  >
                    {t('english')}
                  </Button>
                  <Button
                    onClick={() => setLanguage('hi')}
                    variant={language === 'hi' ? 'default' : 'outline'}
                    className={`flex-1 h-12 rounded-xl ${language === 'hi' ? 'bg-indigo-600 text-white' : ''}`}
                    data-testid="lang-hi-btn"
                  >
                    {t('hindi')}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/30"
                data-testid="save-btn"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {t('saveChanges')}
              </Button>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="border-0 shadow-sm rounded-3xl">
            <CardContent className="p-6">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full h-12 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5 mr-2" />
                {t('logout')}
              </Button>
            </CardContent>
          </Card>

          {/* App Info */}
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 font-['Manrope']">QZap</span>
            </div>
            <p className="text-sm text-slate-500">Version 1.0.0</p>
          </div>
        </motion.div>
      </main>

      <MobileNav />
    </div>
  );
}
