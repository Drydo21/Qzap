import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { ocrAPI, quizAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Camera, Upload, Loader2, Zap, ArrowLeft, BookOpen, Clock, HelpCircle } from 'lucide-react';
import MobileNav from '../components/MobileNav';

export default function QuizCreatePage() {
  const navigate = useNavigate();
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const fileInputRef = useRef(null);
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState('10');
  const [timerDuration, setTimerDuration] = useState('30');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Please upload a JPEG, PNG, or WebP image');
        return;
      }
      
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!image) {
      toast.error(language === 'hi' ? 'कृपया एक छवि अपलोड करें' : 'Please upload an image');
      return;
    }

    setLoading(true);
    try {
      // Step 1: OCR
      setLoadingStep(t('extractingText'));
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(image);
      });
      
      const imageBase64 = await base64Promise;
      const ocrResponse = await ocrAPI.extract(imageBase64, language);
      const extractedText = ocrResponse.data.text;
      
      if (!extractedText || extractedText.trim().length < 50) {
        toast.error(language === 'hi' ? 'पर्याप्त टेक्स्ट नहीं मिला' : 'Not enough text extracted');
        setLoading(false);
        return;
      }

      // Step 2: Generate Quiz
      setLoadingStep(t('generatingQuiz'));
      const quizResponse = await quizAPI.generate(
        extractedText,
        difficulty,
        parseInt(numQuestions),
        language
      );

      // Navigate to quiz taking page with data
      navigate('/quiz/take', { 
        state: { 
          quiz: quizResponse.data.quiz,
          difficulty,
          timerDuration: parseInt(timerDuration),
          language
        }
      });
      
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate quiz');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] main-content">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="rounded-full"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-slate-900 font-['Manrope']">{t('createQuiz')}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Image Upload */}
          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <Label className="text-slate-900 font-semibold mb-4 block">
                <Camera className="w-5 h-5 inline mr-2" />
                {t('uploadImage')}
              </Label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl cursor-pointer transition-all
                  ${imagePreview 
                    ? 'border-indigo-300 bg-indigo-50' 
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                  }
                `}
                data-testid="image-upload-area"
              >
                {imagePreview ? (
                  <div className="relative aspect-[4/3]">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white font-medium">
                        {language === 'hi' ? 'बदलने के लिए क्लिक करें' : 'Click to change'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[4/3] flex flex-col items-center justify-center p-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-indigo-600" />
                    </div>
                    <p className="text-slate-600 text-center">
                      {language === 'hi' 
                        ? 'किताब का पेज अपलोड करें' 
                        : 'Upload a book page photo'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">JPEG, PNG, WebP</p>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
                data-testid="file-input"
              />
            </CardContent>
          </Card>

          {/* Quiz Options */}
          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-5">
              {/* Difficulty */}
              <div>
                <Label className="text-slate-900 font-semibold mb-3 block">
                  <BookOpen className="w-5 h-5 inline mr-2" />
                  {t('selectDifficulty')}
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-transparent" data-testid="difficulty-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">{t('easy')}</SelectItem>
                    <SelectItem value="medium">{t('medium')}</SelectItem>
                    <SelectItem value="hard">{t('hard')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Number of Questions */}
              <div>
                <Label className="text-slate-900 font-semibold mb-3 block">
                  <HelpCircle className="w-5 h-5 inline mr-2" />
                  {t('numQuestions')}
                </Label>
                <Select value={numQuestions} onValueChange={setNumQuestions}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-transparent" data-testid="questions-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">{t('questionCount', { count: 5 })}</SelectItem>
                    <SelectItem value="10">{t('questionCount', { count: 10 })}</SelectItem>
                    <SelectItem value="15">{t('questionCount', { count: 15 })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timer Duration */}
              <div>
                <Label className="text-slate-900 font-semibold mb-3 block">
                  <Clock className="w-5 h-5 inline mr-2" />
                  {t('timerDuration')}
                </Label>
                <Select value={timerDuration} onValueChange={setTimerDuration}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-transparent" data-testid="timer-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 {t('seconds')}</SelectItem>
                    <SelectItem value="60">60 {t('seconds')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateQuiz}
            disabled={loading || !image}
            className="w-full h-14 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-semibold text-lg shadow-lg shadow-indigo-500/30 btn-active disabled:opacity-50"
            data-testid="generate-quiz-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                {loadingStep}
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 mr-3" />
                {t('generateQuiz')}
              </>
            )}
          </Button>
        </motion.div>
      </main>

      <MobileNav />
    </div>
  );
}
