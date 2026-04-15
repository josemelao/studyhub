import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export default function SmartCalendar({ selectedDate, onSelectDate }) {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [viewDate, setViewDate] = useState(new Date());
  const [plans, setPlans] = useState({}); // { 'yyyy-mm-dd': topics[] }
  const [loading, setLoading] = useState(false);
  
  // Gerar os 7 dias da semana baseada na data de visualização
  const weekDays = useMemo(() => {
    const days = [];
    // Encontrar o início da semana (segunda-feira)
    const start = new Date(viewDate);
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
  }, [viewDate]);

  // Carregar planos reais do Supabase
  useEffect(() => {
    async function fetchPlans() {
      if (!user || !currentWorkspaceId) return;
      try {
        setLoading(true);
        const start = weekDays[0].toISOString().split('T')[0];
        const end = weekDays[6].toISOString().split('T')[0];

        const { data } = await supabase
          .from('study_plans')
          .select('data, topicos')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('data', start)
          .lte('data', end);

        const planMap = {};
        (data || []).forEach(p => {
          planMap[p.data] = p.topicos || [];
        });
        setPlans(planMap);
      } catch (err) {
        console.error('Erro ao carregar planos:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, [user, viewDate, weekDays, currentWorkspaceId]);

  const changeWeek = (offset) => {
    const next = new Date(viewDate);
    next.setDate(next.getDate() + (offset * 7));
    setViewDate(next);
  };

  const formatDayName = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const currentPlan = plans[selectedDateStr] || [];

  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between group/cal">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-accent">
          <motion.div
            animate={{ rotate: loading ? 360 : [0, 10, -10, 0] }}
            transition={loading ? { repeat: Infinity, duration: 1, ease: "linear" } : { repeat: Infinity, duration: 5, ease: "linear" }}
          >
            <CalendarIcon className="w-4 h-4" />
          </motion.div>
          <span className="text-[10px] font-black uppercase tracking-widest">Plano Semanal</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => changeWeek(-1)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all active:scale-95"
          >
            <ChevronLeft size={14} />
          </button>
          <AnimatePresence mode="wait">
            <motion.span 
              key={monthName}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[10px] font-black uppercase tracking-widest min-w-[80px] text-center"
            >
              {monthName}
            </motion.span>
          </AnimatePresence>
          <button 
            onClick={() => changeWeek(1)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all active:scale-95"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        {weekDays.map((day, idx) => {
          const selected = isSelected(day);
          const today = isToday(day);
          const dayStr = day.toISOString().split('T')[0];
          const hasPlan = (plans[dayStr] || []).length > 0;
          
          return (
            <motion.button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl transition-all ${
                  selected 
                  ? 'text-white' 
                  : 'hover:bg-white/5 border border-transparent text-muted'
              }`}
            >
              {selected && (
                <motion.div
                  layoutId="activeDay"
                  className="absolute inset-0 bg-accent rounded-2xl shadow-glow-accent"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <span className={`relative z-10 text-[9px] font-black uppercase tracking-tighter ${selected ? 'text-white/80' : 'text-muted'}`}>
                {formatDayName(day)}
              </span>
              <span className={`relative z-10 text-sm font-black ${selected ? 'text-white' : today ? 'text-accent' : ''}`}>
                {day.getDate()}
              </span>
              
              {/* Indicador de Tópicos Real */}
              <div className="relative z-10 flex gap-0.5">
                {hasPlan && (
                  <div className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : 'bg-accent'}`} />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-default flex items-center justify-between">
         <div className="text-[10px] text-muted font-medium">
            {isToday(selectedDate) ? (
              <>Você tem <span className="text-primary font-bold">{currentPlan.length} tópicos</span> planejados para hoje.</>
            ) : (
              <>Plano para <span className="text-primary font-bold">{selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span> ({currentPlan.length})</>
            )}
         </div>
          <div className="flex gap-1.5 opacity-60 group-hover/cal:opacity-100 transition-opacity items-center">
            {currentPlan.slice(0, 4).map((topic, i) => {
              const IconComp = Icons[topic.icon] || Icons.BookOpen;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -2, scale: 1.1 }}
                  className="group/icon relative w-6 h-6 rounded-lg flex items-center justify-center border border-white/5 transition-all shadow-sm"
                  style={{ backgroundColor: `${topic.cor}15`, color: topic.cor }}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-secondary border border-white/10 rounded-md text-[8px] font-black uppercase text-white opacity-0 group-hover/icon:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-20">
                    {topic.nome}
                  </div>
                </motion.div>
              );
            })}
            {currentPlan.length > 4 && (
              <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-[8px] font-black text-muted">+{currentPlan.length - 4}</span>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
