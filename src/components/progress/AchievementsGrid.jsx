import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { staggerItem, scaleIn } from '../../lib/animations';

export default function AchievementsGrid({ conquistas }) {
  return (
    <motion.section variants={staggerItem}>
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-black text-primary tracking-tight uppercase tracking-widest text-sm">Suas Conquistas</h2>
        </div>
        <span className="text-[10px] font-black text-muted bg-white/5 px-2 py-1 rounded-md">{conquistas.length} DESBLOQUEADAS</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
         {conquistas.length === 0 ? (
           <div className="col-span-full glass-card p-12 text-center text-muted border-dashed border-2">
             Ainda não há conquistas. Continue estudando para desbloqueá-las!
           </div>
         ) : (
           conquistas.map((c, i) => (
             <motion.div 
               key={i} 
               variants={scaleIn} 
               className="glass-card p-4 flex flex-col items-center text-center gap-3 border-default bg-secondary hover:bg-accent/5 hover:border-accent/20 transition-all group"
             >
               <div className="text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{c.icone}</div>
               <div>
                 <div className="text-[9px] font-black text-primary uppercase tracking-tighter leading-none mb-1">{c.titulo}</div>
                 <div className="text-[7px] text-muted font-bold uppercase">
                   {c.unlocked_at ? new Date(c.unlocked_at).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : '--'}
                 </div>
               </div>
             </motion.div>
           ))
         )}
      </div>
    </motion.section>
  );
}
