import { motion } from 'framer-motion';
import { Crosshair, TrendingUp, Trophy, Flame } from 'lucide-react';
import { staggerItem } from '../../lib/animations';

export default function ProgressKpis({ stats }) {
  const kpiData = [
    { 
      label: 'Taxa de Acerto', 
      value: stats.accuracy > 0 ? `${stats.accuracy}%` : '--', 
      icon: Crosshair, 
      color: 'accent',
      description: 'Média geral de acertos'
    },
    { 
      label: 'Questões', 
      value: stats.totalQ, 
      icon: TrendingUp, 
      color: 'blue',
      description: 'Total respondidas'
    },
    { 
      label: 'Simulados', 
      value: stats.totalExams, 
      icon: Trophy, 
      color: 'purple',
      description: 'Provas finalizadas'
    },
    { 
      label: 'Streak Atual', 
      value: `${stats.streakAtual}d`, 
      icon: Flame, 
      color: 'orange',
      description: 'Dias seguidos'
    }
  ];

  const getColorClasses = (color) => {
    const maps = {
      accent: 'border-accent/20 bg-accent/5 text-accent shadow-glow-accent',
      blue: 'border-blue-500/20 bg-blue-500/5 text-blue-500 shadow-glow-blue',
      purple: 'border-purple-500/20 bg-purple-500/5 text-purple-500 shadow-glow-purple',
      orange: 'border-orange-500/20 bg-orange-500/5 text-orange-500 shadow-glow-orange'
    };
    return maps[color] || maps.accent;
  };

  const getIconBg = (color) => {
    const maps = {
      accent: 'bg-accent',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
    };
    return maps[color] || maps.accent;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpiData.map((kpi, i) => (
        <motion.div 
          key={i}
          variants={staggerItem}
          className={`glass-card p-5 flex flex-col gap-4 relative overflow-hidden group border ${getColorClasses(kpi.color)}`}
        >
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <kpi.icon size={80} />
          </div>
          
          <div className={`w-10 h-10 rounded-xl ${getIconBg(kpi.color)} text-white flex items-center justify-center relative z-10`}>
            <kpi.icon className="w-5 h-5" />
          </div>

          <div className="relative z-10">
            <div className="text-2xl md:text-3xl font-black text-primary tracking-tight leading-none mb-1">
              {kpi.value}
            </div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">
              {kpi.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
