import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

export default function AchievementToast() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const handleAchievement = (event) => {
      const achievements = event.detail; // Array of newly unlocked achievements
      if (Array.isArray(achievements)) {
        setQueue(prev => [...prev, ...achievements.map(a => ({ ...a, uid: Math.random().toString(36).substr(2, 9) }))]);
      }
    };

    window.addEventListener('show_achievement', handleAchievement);
    return () => window.removeEventListener('show_achievement', handleAchievement);
  }, []);

  useEffect(() => {
    if (queue.length > 0) {
      const timer = setTimeout(() => {
        setQueue(prev => prev.slice(1));
      }, 5000); // Mostra por 5 segundos
      return () => clearTimeout(timer);
    }
  }, [queue]);

  const current = queue[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.uid}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
            className="pointer-events-auto flex items-center gap-4 bg-secondary/80 backdrop-blur-xl border-l-4 border-accent p-4 rounded-2xl shadow-2xl glass-card overflow-hidden w-80 relative"
          >
            {/* Brilho de fundo decorativo */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none" />
            
            <div className="relative w-12 h-12 rounded-xl bg-accent/20 flex flex-shrink-0 items-center justify-center border border-accent/20">
              <span className="text-2xl drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]">{current.icone || '🏆'}</span>
            </div>
            
            <div className="flex-1 min-w-0 z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-0.5 glow-text">Desbloqueado!</p>
              <p className="text-sm font-bold text-primary truncate leading-tight">{current.titulo}</p>
            </div>
            
            <button 
              onClick={() => setQueue(prev => prev.slice(1))}
              className="absolute top-2 right-2 p-1 text-muted hover:text-primary transition-colors bg-white/5 hover:bg-white/10 rounded-full z-20"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
