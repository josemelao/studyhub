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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi, i) => (
        <motion.div 
          key={i}
          variants={staggerItem}
          className={`glass-card p-4 flex items-center gap-4 relative overflow-hidden group border ${getColorClasses(kpi.color)}`}
        >
          <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity">
            <kpi.icon size={64} />
          </div>
          
          <div className={`w-12 h-12 rounded-2xl ${getIconBg(kpi.color)} text-white flex items-center justify-center shrink-0 relative z-10 shadow-lg`}>
            <kpi.icon className="w-6 h-6" />
          </div>

          <div className="relative z-10 flex flex-col justify-center">
            <div className="text-2xl font-black text-primary tracking-tighter leading-none">
              {kpi.value}
            </div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
              {kpi.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
