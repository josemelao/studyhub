import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function StreakWidget() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_stats')
          .select('streak_atual, ultimo_estudo_dia')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setStreak(data.streak_atual || 0);
          
          // Lógica simples para ver se o streak tá ativo hoje
          const today = new Date().toISOString().split('T')[0];
          if (data.ultimo_estudo_dia !== today && data.streak_atual > 0) {
            // Checa se estudou ontem. Se não, o streak na verdade é 0
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (data.ultimo_estudo_dia !== yesterdayStr) {
              setStreak(0); // Perdeu o streak
            }
          }
        }
      } catch (err) {
        console.error("Erro ao buscar streak:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStreak();
    
    // Opcional: Escutar caso uma prova atualize o streak no mesmo dispositivo
    const handleUpdate = () => fetchStreak();
    window.addEventListener('update_streak', handleUpdate);
    return () => window.removeEventListener('update_streak', handleUpdate);
  }, [user]);

  if (loading) return null;

  const isActive = streak > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`px-4 py-3 mx-4 rounded-xl flex items-center justify-between border transition-all duration-500 overflow-hidden relative ${
        isActive 
          ? 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
          : 'bg-secondary border-default hover:bg-white/[0.02]'
      }`}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none" />
      )}
      
      <div className="flex items-center gap-3 relative z-10">
        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-orange-500/20 text-orange-500' : 'bg-default text-muted'}`}>
          <Flame className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]' : ''}`} />
        </div>
        <div>
          <div className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-orange-500' : 'text-muted'}`}>
            Streak
          </div>
          <div className="text-sm font-bold text-primary leading-none mt-0.5">
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </div>
        </div>
      </div>
      
      {/* Indicador de meta do dia */}
      <div className="relative w-2 h-2 rounded-full bg-default z-10 overflow-hidden">
        {isActive && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-orange-500 rounded-full glow-accent"
            style={{ '--tw-glow-color': 'rgba(249,115,22,0.4)' }}
          />
        )}
      </div>
    </motion.div>
  );
}
