import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { quizAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Clock, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';

export default function QuizTakePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useAuth();
  const { t } = useTranslation(language);
  
  const { quiz, difficulty, timerDuration } = location.state || {};
  const questions = quiz?.questions || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(timerDuration || 30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // Redirect if no quiz data
  useEffect(() => {
    if (!quiz || questions.length === 0) {
      toast.error('No quiz data found');
      navigate('/quiz/create');
    }
  }, [quiz, navigate, questions.length]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleNextQuestion();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, currentIndex]);

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(timerDuration || 30);
  }, [currentIndex, timerDuration]);

  const handleSelectAnswer = (optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    
    try {
      // Calculate score
      let score = 0;
      questions.forEach((q, index) => {
        if (answers[index] === q.correct_answer) {
          score++;
        }
      });

      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      // Submit to backend
      await quizAPI.submit({
        quiz_data: { questions, answers },
        score,
        total: questions.length,
        difficulty,
        time_taken: timeTaken
      });

      // Navigate to results
      navigate('/quiz/results', {
        state: {
          questions,
          answers,
          score,
          total: questions.length,
          difficulty,
          timeTaken
        }
      });
    } catch (error) {
      toast.error('Failed to submit quiz');
      setIsSubmitting(false);
    }
  };

  if (!quiz || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isTimerLow = timeLeft <= 10;

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col">
      {/* Header with Progress */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">
              {t('question')} {currentIndex + 1} {t('of')} {questions.length}
            </span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isTimerLow ? 'bg-red-100 text-red-600 animate-pulse-ring' : 'bg-slate-100 text-slate-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{timeLeft}s</span>
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-slate-100" />
        </div>
      </header>

      {/* Question Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                {/* Question */}
                <h2 className="text-lg font-semibold text-slate-900 mb-6 leading-relaxed" data-testid="question-text">
                  {currentQuestion.question}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = answers[currentIndex] === index;
                    const optionLetter = String.fromCharCode(65 + index);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectAnswer(index)}
                        className={`
                          w-full p-4 rounded-2xl text-left transition-all duration-200
                          flex items-center gap-4 group
                          ${isSelected 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                            : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:border-indigo-200 border border-transparent'
                          }
                        `}
                        data-testid={`option-${index}`}
                      >
                        <span className={`
                          w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm
                          ${isSelected 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                          }
                        `}>
                          {isSelected ? <Check className="w-5 h-5" /> : optionLetter}
                        </span>
                        <span className="flex-1">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Footer */}
      <footer className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
        <div className="container mx-auto max-w-lg flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handlePrevQuestion}
            disabled={currentIndex === 0}
            className="flex-1 h-12 rounded-full font-semibold"
            data-testid="prev-btn"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            {t('previous')}
          </Button>
          
          {isLastQuestion ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting || Object.keys(answers).length === 0}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold shadow-lg shadow-green-500/30"
              data-testid="submit-btn"
            >
              {isSubmitting ? (
                <span className="animate-pulse">{t('loading')}</span>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-1" />
                  {t('submit')}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/30"
              data-testid="next-btn"
            >
              {t('next')}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </footer>

      {/* Unanswered Warning */}
      {Object.keys(answers).length < questions.length && currentIndex === questions.length - 1 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              {language === 'hi' 
                ? `${questions.length - Object.keys(answers).length} प्रश्न अनुत्तरित हैं` 
                : `${questions.length - Object.keys(answers).length} questions unanswered`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
