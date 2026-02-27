import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { LayoutDashboard, Trophy, Camera, Users, User } from 'lucide-react';

export const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useAuth();
  const { t } = useTranslation(language);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/leaderboard', icon: Trophy, label: t('leaderboard') },
    { path: '/quiz/create', icon: Camera, label: t('quiz') },
    { path: '/groups', icon: Users, label: t('groups') },
    { path: '/profile', icon: User, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around items-center z-50 md:hidden pb-safe">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || 
                        (item.path === '/quiz/create' && location.pathname.startsWith('/quiz'));
        
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            data-testid={`nav-${item.path.replace(/\//g, '-').slice(1)}`}
          >
            <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
