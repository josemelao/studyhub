import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    // 1. Busca sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
    });

    // 2. Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(prev => {
          if (prev?.id === nextUser?.id) return prev;
          if (!nextUser) setProfile(null);
          return nextUser;
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 3. Busca o perfil separadamente quando o user.id mudar
  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user?.id]);

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`
      }
    });
  };

  const signOut = async () => {
    setProfile(null);
    return await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
