import { motion } from 'framer-motion';
import { Target, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DailyTopics() {
  // Mock de tópicos planejados
  const plannedTopics = [
    { id: '1', nome: 'Interpretação de Texto', materia: 'Português', cor: '#a855f7', status: 'pendente' },
    { id: '2', nome: 'Juros Compostos', materia: 'Matemática Fin.', cor: '#f59e0b', status: 'concluido' }
  ];

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-default flex items-center gap-2 text-primary">
        <Target className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-black uppercase tracking-widest">Tópicos do Dia</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {plannedTopics.map((topic, i) => (
          <div 
            key={topic.id}
            className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-transparent hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
               <div 
                 className="w-1.5 h-6 rounded-full shrink-0" 
                 style={{ backgroundColor: topic.cor }}
               />
               <div className="min-w-0">
                  <h4 className="text-xs font-bold text-primary truncate group-hover:text-accent transition-colors">
                    {topic.nome}
                  </h4>
                  <p className="text-[10px] text-muted font-medium truncate">
                    {topic.materia}
                  </p>
               </div>
            </div>

            {topic.status === 'concluido' ? (
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            ) : (
              <Link to={`/estudo/${topic.id}`}>
                <button className="p-1.5 rounded-lg bg-accent/10 text-accent opacity-0 group-hover:opacity-100 transition-all">
                  <ChevronRight size={14} />
                </button>
              </Link>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-accent/5 border-t border-accent/10">
         <button className="w-full py-2 rounded-lg bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-glow-accent hover:opacity-90 transition-all">
            Planejar Novo Tópico
         </button>
      </div>
    </div>
  );
}
