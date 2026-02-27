import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Trophy, Star, Check, X, ChevronDown, ChevronUp, 
  LayoutDashboard, RefreshCw, Zap
} from 'lucide-react';

export default function QuizResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useAuth();
  const { t } = useTranslation(language);
  
  const { questions = [], answers = {}, score = 0, total = 0, difficulty, timeTaken } = location.state || {};
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = () => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreMessage = () => {
    if (percentage >= 80) return language === 'hi' ? 'शानदार! 🎉' : 'Excellent! 🎉';
    if (percentage >= 60) return language === 'hi' ? 'अच्छा प्रयास! 👍' : 'Good effort! 👍';
    return language === 'hi' ? 'अभ्यास जारी रखें! 💪' : 'Keep practicing! 💪';
  };

  if (!location.state) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center p-4">
        <Card className="border-0 shadow-lg rounded-3xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No results found</p>
            <Button 
              onClick={() => navigate('/quiz/create')}
              className="mt-4 bg-indigo-600 text-white rounded-full"
            >
              Start a Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] pb-8">
      {/* Score Header */}
      <div className={`bg-gradient-to-br ${getScoreBg()} pt-12 pb-24 px-4`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold font-['Manrope'] mb-2">{t('quizComplete')}</h1>
          <p className="text-xl opacity-90">{getScoreMessage()}</p>
        </motion.div>
      </div>

      {/* Score Card */}
      <div className="container mx-auto px-4 -mt-16 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden" data-testid="score-card">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className={`text-6xl font-extrabold ${getScoreColor()} font-['Manrope']`}>
                  {percentage}%
                </div>
                <p className="text-slate-600 mt-2">
                  {score}/{total} {t('correctAnswers')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-sm text-slate-500">{language === 'hi' ? 'कठिनाई' : 'Difficulty'}</p>
                  <p className="font-semibold text-slate-900 capitalize">{difficulty}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-sm text-slate-500">{language === 'hi' ? 'समय' : 'Time'}</p>
                  <p className="font-semibold text-slate-900">{Math.floor(timeTaken / 60)}:{String(timeTaken % 60).padStart(2, '0')}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => navigate('/quiz/create')}
                  variant="outline"
                  className="flex-1 h-12 rounded-full font-semibold"
                  data-testid="try-again-btn"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  {t('tryAgain')}
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/30"
                  data-testid="dashboard-btn"
                >
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  {t('dashboard')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Questions Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h2 className="text-xl font-bold text-slate-900 font-['Manrope'] mb-4">
            {t('viewExplanations')}
          </h2>

          <div className="space-y-3">
            {questions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correct_answer;
              const isExpanded = expandedQuestion === index;

              return (
                <Card 
                  key={index} 
                  className={`border-0 shadow-sm rounded-2xl overflow-hidden ${
                    isCorrect ? 'bg-green-50' : 'bg-red-50'
                  }`}
                  data-testid={`question-review-${index}`}
                >
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                      className="w-full p-4 flex items-center gap-3 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCorrect ? 'bg-green-200' : 'bg-red-200'
                      }`}>
                        {isCorrect ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <span className="flex-1 font-medium text-slate-900 line-clamp-2">
                        {question.question}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-slate-200/50"
                      >
                        <div className="pt-4 space-y-3">
                          {!isCorrect && userAnswer !== undefined && (
                            <div className="bg-red-100 rounded-xl p-3">
                              <p className="text-sm text-red-600 font-medium">{t('yourAnswer')}:</p>
                              <p className="text-red-700">{question.options[userAnswer]}</p>
                            </div>
                          )}
                          
                          <div className="bg-green-100 rounded-xl p-3">
                            <p className="text-sm text-green-600 font-medium">{t('correctAnswer')}:</p>
                            <p className="text-green-700">{question.options[question.correct_answer]}</p>
                          </div>

                          {question.explanation && (
                            <div className="bg-white rounded-xl p-3">
                              <p className="text-sm text-slate-500 font-medium">{t('explanation')}:</p>
                              <p className="text-slate-700">{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
