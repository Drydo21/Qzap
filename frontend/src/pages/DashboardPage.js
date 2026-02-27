import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { dashboardAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { 
  LayoutDashboard, Trophy, Target, TrendingUp, Camera, 
  ChevronRight, Calendar, Zap, BookOpen
} from 'lucide-react';
import MobileNav from '../components/MobileNav';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, language } = useAuth();
  const { t } = useTranslation(language);
  const [stats, setStats] = useState(null);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardAPI.get();
      setStats(response.data.stats);
      setRecentQuizzes(response.data.recent_quizzes);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      icon: BookOpen, 
      label: t('totalQuizzes'), 
      value: stats?.total_quizzes || 0,
      color: 'bg-indigo-100 text-indigo-600'
    },
    { 
      icon: Target, 
      label: t('averageScore'), 
      value: `${stats?.avg_score || 0}%`,
      color: 'bg-green-100 text-green-600'
    },
    { 
      icon: TrendingUp, 
      label: t('bestScore'), 
      value: stats?.best_score || 0,
      color: 'bg-amber-100 text-amber-600'
    },
    { 
      icon: Trophy, 
      label: t('yourRank'), 
      value: `#${stats?.rank || '-'}`,
      color: 'bg-purple-100 text-purple-600'
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC] main-content">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 font-['Manrope']">QZap</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-['Manrope']">
            {t('welcomeBack')}, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'hi' ? 'आज क्या पढ़ना है?' : "What would you like to learn today?"}
          </p>
        </motion.div>

        {/* Quick Action - Create Quiz FAB */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate('/quiz/create')}
            className="w-full md:w-auto h-14 px-8 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-500/30 btn-active"
            data-testid="create-quiz-btn"
          >
            <Camera className="w-6 h-6 mr-3" />
            {t('createQuiz')}
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-3xl" />
            ))
          ) : (
            statCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-sm rounded-3xl overflow-hidden card-hover" data-testid={`stat-card-${index}`}>
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Recent Quizzes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 font-['Manrope']">{t('recentQuizzes')}</h2>
            <Button 
              variant="ghost" 
              className="text-indigo-600 hover:text-indigo-700"
              onClick={() => navigate('/leaderboard')}
              data-testid="view-all-btn"
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : recentQuizzes.length > 0 ? (
            <div className="space-y-3">
              {recentQuizzes.map((quiz, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-sm rounded-2xl overflow-hidden card-hover" data-testid={`recent-quiz-${index}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          quiz.percentage >= 70 ? 'bg-green-100' : quiz.percentage >= 40 ? 'bg-amber-100' : 'bg-red-100'
                        }`}>
                          <span className={`text-lg font-bold ${
                            quiz.percentage >= 70 ? 'text-green-600' : quiz.percentage >= 40 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {quiz.percentage}%
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {quiz.score}/{quiz.total} {language === 'hi' ? 'सही' : 'correct'}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs capitalize">
                              {quiz.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{t('noQuizzesYet')}</p>
                <Button 
                  onClick={() => navigate('/quiz/create')}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
                  data-testid="start-first-quiz-btn"
                >
                  {t('createQuiz')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="border-0 shadow-sm rounded-2xl overflow-hidden cursor-pointer card-hover"
            onClick={() => navigate('/leaderboard')}
            data-testid="leaderboard-card"
          >
            <CardContent className="p-5">
              <Trophy className="w-8 h-8 text-amber-500 mb-3" />
              <p className="font-semibold text-slate-900">{t('leaderboard')}</p>
              <p className="text-sm text-slate-500">{language === 'hi' ? 'टॉपर देखें' : 'See top students'}</p>
            </CardContent>
          </Card>
          
          <Card 
            className="border-0 shadow-sm rounded-2xl overflow-hidden cursor-pointer card-hover"
            onClick={() => navigate('/friends')}
            data-testid="friends-card"
          >
            <CardContent className="p-5">
              <LayoutDashboard className="w-8 h-8 text-indigo-500 mb-3" />
              <p className="font-semibold text-slate-900">{t('friends')}</p>
              <p className="text-sm text-slate-500">{language === 'hi' ? 'दोस्तों से जुड़ें' : 'Connect with friends'}</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
