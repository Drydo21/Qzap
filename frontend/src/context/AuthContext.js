import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const response = await authAPI.getMe();
          setUser(response.data);
          setLanguage(response.data.language || 'en');
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data);
          setLanguage(response.data.language || 'en');
        } catch (error) {
          console.error('Get user error:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    setUser(response.data.user);
    setLanguage(response.data.user.language || 'en');
    return response.data;
  };

  const signup = async (email, password, name) => {
    const response = await authAPI.signup({ email, password, name });
    if (response.data.access_token) {
      setUser(response.data.user);
    }
    return response.data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateLanguage = (lang) => {
    setLanguage(lang);
    if (user) {
      setUser({ ...user, language: lang });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      logout, 
      language, 
      setLanguage: updateLanguage 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
