import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SmartCalendar() {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Gerar os 7 dias da semana baseada na data de visualização
  const weekDays = useMemo(() => {
    const days = [];
    // Encontrar o início da semana (domingo ou segunda)
    const start = new Date(viewDate);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek); // Ajusta para o domingo da semana atual
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
  }, [viewDate]);

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

  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between group/cal">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-accent">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
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
          
          return (
            <motion.button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
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
              
              {/* Indicador de Tópicos (mock dinâmico) */}
              <div className="relative z-10 flex gap-0.5">
                {idx % 3 === 0 && <div className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : 'bg-accent/40'}`} />}
                {idx % 4 === 0 && <div className={`w-1 h-1 rounded-full ${selected ? 'bg-white/60' : 'bg-orange-500/40'}`} />}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-default flex items-center justify-between">
         <div className="text-[10px] text-muted font-medium">
            {isToday(selectedDate) ? (
              <>Você tem <span className="text-primary font-bold">2 tópicos</span> planejados para hoje.</>
            ) : (
              <>Plano para <span className="text-primary font-bold">{selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></>
            )}
         </div>
         <div className="flex -space-x-2 opacity-60 group-hover/cal:opacity-100 transition-opacity">
            <div className="w-5 h-5 rounded-full border-2 border-secondary bg-accent/20" />
            <div className="w-5 h-5 rounded-full border-2 border-secondary bg-orange-500/20" />
         </div>
      </div>
    </div>
  );
}
