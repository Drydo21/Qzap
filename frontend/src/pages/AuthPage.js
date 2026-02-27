import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Zap, BookOpen, Mail, Lock, User } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, signup, language } = useAuth();
  const { t } = useTranslation(language);
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', name: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signup(signupData.email, signupData.password, signupData.name);
      if (result.access_token) {
        toast.success('Account created! Logging you in...');
        navigate('/dashboard');
      } else {
        toast.success('Account created! Please login with your credentials.');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 font-['Manrope']">QZap</span>
        </div>

        <Card className="border-0 shadow-xl rounded-3xl">
          <CardHeader className="text-center pb-0">
            <CardTitle className="text-2xl font-bold text-slate-900">
              {t('welcomeBack')}
            </CardTitle>
            <CardDescription className="text-slate-500">
              Sign in to continue learning
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 rounded-xl p-1">
                <TabsTrigger 
                  value="login" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  data-testid="login-tab"
                >
                  {t('login')}
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  data-testid="signup-tab"
                >
                  {t('signup')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-slate-700">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-10 h-12 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl"
                        required
                        data-testid="login-email-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-slate-700">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-10 h-12 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl"
                        required
                        data-testid="login-password-input"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/30 btn-active"
                    disabled={loading}
                    data-testid="login-submit-btn"
                  >
                    {loading ? t('loading') : t('login')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-slate-700">{t('name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your name"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        className="pl-10 h-12 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl"
                        required
                        data-testid="signup-name-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-700">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="pl-10 h-12 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl"
                        required
                        data-testid="signup-email-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-700">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="pl-10 h-12 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl"
                        required
                        minLength={6}
                        data-testid="signup-password-input"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/30 btn-active"
                    disabled={loading}
                    data-testid="signup-submit-btn"
                  >
                    {loading ? t('loading') : t('signup')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-indigo-600"
            data-testid="back-home-btn"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
