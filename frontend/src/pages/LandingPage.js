import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { Button } from '../components/ui/button';
import { Zap, BookOpen, Camera, Trophy, Users, ArrowRight, Check } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, language, setLanguage } = useAuth();
  const { t } = useTranslation(language);

  const features = [
    { icon: Camera, title: language === 'hi' ? 'स्मार्ट OCR' : 'Smart OCR', desc: language === 'hi' ? 'किसी भी किताब की फोटो अपलोड करें' : 'Upload any book page photo' },
    { icon: BookOpen, title: language === 'hi' ? 'AI क्विज़' : 'AI Quiz', desc: language === 'hi' ? 'तुरंत MCQ प्रश्न बनाएं' : 'Instant MCQ generation' },
    { icon: Trophy, title: language === 'hi' ? 'प्रतिस्पर्धा' : 'Compete', desc: language === 'hi' ? 'लीडरबोर्ड पर टॉप करें' : 'Top the leaderboard' },
    { icon: Users, title: language === 'hi' ? 'सामाजिक' : 'Social', desc: language === 'hi' ? 'दोस्तों के साथ पढ़ें' : 'Study with friends' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 font-['Manrope']">QZap</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex items-center bg-slate-100 rounded-full p-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                  language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
                data-testid="lang-en-btn"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                  language === 'hi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
                data-testid="lang-hi-btn"
              >
                हिं
              </button>
            </div>
            
            {user ? (
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 h-10 font-semibold shadow-lg shadow-indigo-500/30"
                data-testid="go-dashboard-btn"
              >
                {t('dashboard')}
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 h-10 font-semibold shadow-lg shadow-indigo-500/30"
                data-testid="get-started-btn"
              >
                {t('getStarted')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 font-['Manrope'] tracking-tight leading-tight">
                {t('tagline')}
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                {t('subtitle')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate(user ? '/quiz/create' : '/auth')}
                  className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-lg shadow-lg shadow-indigo-500/30 btn-active"
                  data-testid="hero-cta-btn"
                >
                  {t('getStarted')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-10 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-slate-600">English & Hindi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-slate-600">AI Powered</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBoYXBweXxlbnwwfHx8fDE3NzIxNjUwNTd8MA&ixlib=rb-4.1.0&q=85"
                  alt="Student studying"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/30 to-transparent" />
              </div>
              
              {/* Floating Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Top Score</p>
                    <p className="text-xl font-bold text-slate-900">95%</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 font-['Manrope']">
              {language === 'hi' ? 'कैसे काम करता है' : 'How It Works'}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-50 rounded-3xl p-6 text-center card-hover"
              >
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold font-['Manrope'] mb-4">
              {language === 'hi' ? 'आज ही शुरू करें!' : 'Start Learning Today!'}
            </h2>
            <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
              {language === 'hi' 
                ? 'अपनी पढ़ाई को मज़ेदार और प्रभावी बनाएं' 
                : 'Make your study sessions fun and effective'}
            </p>
            <Button 
              onClick={() => navigate(user ? '/quiz/create' : '/auth')}
              className="h-14 px-10 bg-white text-indigo-600 hover:bg-indigo-50 rounded-full font-semibold text-lg shadow-lg btn-active"
              data-testid="cta-btn"
            >
              {t('getStarted')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>&copy; 2024 QZap. {language === 'hi' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );
}
