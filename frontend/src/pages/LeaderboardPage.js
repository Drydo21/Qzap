import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { leaderboardAPI } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';
import { Trophy, Medal, Crown, Zap } from 'lucide-react';
import MobileNav from '../components/MobileNav';

export default function LeaderboardPage() {
  const { user, language } = useAuth();
  const { t } = useTranslation(language);
  const [leaders, setLeaders] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await leaderboardAPI.get();
      setLeaders(response.data.leaders);
      setMyRank(response.data.my_rank);
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return null;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-amber-200/50';
    return 'bg-white border-transparent';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] main-content">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-500" />
          <h1 className="text-xl font-bold text-slate-900 font-['Manrope']">{t('leaderboard')}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* My Rank Card */}
        {myRank && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600">
              <CardContent className="p-6 text-white">
                <p className="text-sm opacity-80 mb-1">{t('yourRank')}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-4xl font-extrabold font-['Manrope']">#{myRank.rank || '-'}</span>
                    <p className="text-sm opacity-80 mt-1">
                      {myRank.total_score} {language === 'hi' ? 'अंक' : 'points'}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 h-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Top Students */}
        <h2 className="text-lg font-bold text-slate-900 font-['Manrope'] mb-4">
          {t('topStudents')}
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array(10).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : leaders.length > 0 ? (
          <div className="space-y-3">
            {leaders.map((leader, index) => (
              <motion.div
                key={leader.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`border shadow-sm rounded-2xl overflow-hidden ${getRankBg(leader.rank)} ${
                    leader.user_id === user?.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                  data-testid={`leaderboard-item-${index}`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      {getRankIcon(leader.rank) || (
                        <span className="font-bold text-slate-600">{leader.rank}</span>
                      )}
                    </div>

                    {/* Avatar & Name */}
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={leader.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.name}`} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                        {leader.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{leader.name}</p>
                      <p className="text-sm text-slate-500">
                        {leader.quizzes_taken} {language === 'hi' ? 'क्विज़' : 'quizzes'} • {leader.avg_score}% {language === 'hi' ? 'औसत' : 'avg'}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">{leader.total_score}</p>
                      <p className="text-xs text-slate-500">{language === 'hi' ? 'अंक' : 'pts'}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {language === 'hi' ? 'अभी कोई डेटा नहीं' : 'No data yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
