import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SmartCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Gerar os 7 dias da semana atual (deixando o dia atual centralizado ou no início)
  const getWeekDays = () => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();
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

  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-accent">
          <CalendarIcon className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Plano Semanal</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft size={14} /></button>
          <span className="text-[10px] font-bold uppercase tracking-tight">{selectedDate.toLocaleDateString('pt-BR', { month: 'long' })}</span>
          <button className="p-1 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        {weekDays.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDate(day)}
            className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-xl transition-all ${
                isSelected(day) 
                ? 'bg-accent text-white shadow-glow-accent' 
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-tighter ${isSelected(day) ? 'text-white/80' : 'text-muted'}`}>
              {formatDayName(day)}
            </span>
            <span className="text-sm font-bold">{day.getDate()}</span>
            
            {/* Indicador de Tópicos/Estudo (mock) */}
            <div className={`w-1 h-1 rounded-full mt-1 ${
                isToday(day) ? 'bg-white' : idx % 3 === 0 ? 'bg-accent/40' : 'bg-transparent'
            }`} />
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-default flex items-center justify-between">
         <div className="text-[10px] text-muted font-medium">
            Você tem <span className="text-primary font-bold">2 tópicos</span> planejados para hoje.
         </div>
         <div className="flex -space-x-2">
            <div className="w-5 h-5 rounded-full border-2 border-secondary bg-accent/20" />
            <div className="w-5 h-5 rounded-full border-2 border-secondary bg-orange-500/20" />
         </div>
      </div>
    </div>
  );
}
