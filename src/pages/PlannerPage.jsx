import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, BookOpen, Plus, Trash2, 
  Zap, Save, ChevronRight, CheckCircle2, Loader2,
  AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { pageVariants, staggerContainer, staggerItem, expandDown } from '../lib/animations';

export default function PlannerPage() {
  const { user } = useAuth();
  
  // Data States
  const [subjects, setSubjects] = useState([]);
  const [plannedDays, setPlannedDays] = useState({}); // { 'yyyy-mm-dd': [topicIds] }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState(null);

  // Get start of current week (Monday)
  const weekStart = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0,0,0,0);
    return d;
  }, []);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, [weekStart]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        
        // 1. Fetch Subjects and Topics
        const { data: subData } = await supabase
          .from('subjects')
          .select('id, nome, cor, icone, topics(id, nome, ordem)')
          .order('ordem');

        // 2. Fetch User Progress (to show what's unread)
        const { data: progData } = await supabase
          .from('user_progress')
          .select('topic_id, conteudo_lido')
          .eq('user_id', user.id);

        const progMap = new Map((progData || []).map(p => [p.topic_id, p.conteudo_lido]));

        const enriched = (subData || []).map(s => ({
          ...s,
          topics: (s.topics || []).sort((a,b) => a.ordem - b.ordem).map(t => ({
            ...t,
            read: progMap.get(t.id) || false
          }))
        }));
        setSubjects(enriched);

        // 3. Fetch current week plans
        const { data: planData } = await supabase
          .from('study_plans')
          .select('data, topicos')
          .eq('user_id', user.id)
          .gte('data', weekDays[0])
          .lte('data', weekDays[6]);

        const plans = {};
        (planData || []).forEach(p => {
          plans[p.data] = p.topicos || [];
        });
        setPlannedDays(plans);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, weekDays]);

  const toggleTopicInDay = (date, topic) => {
    setPlannedDays(prev => {
      const current = prev[date] || [];
      const exists = current.find(t => t.id === topic.id);
      
      if (exists) {
        return { ...prev, [date]: current.filter(t => t.id !== topic.id) };
      } else {
        // Limite de 4 tópicos por dia para não poluir
        if (current.length >= 4) return prev;
        return { 
          ...prev, 
          [date]: [...current, { id: topic.id, nome: topic.nome, subjectId: topic.subjectId, cor: topic.cor }] 
        };
      }
    });
  };

  const handleSavePlan = async () => {
    setSaving(true);
    try {
      const payloads = Object.entries(plannedDays).map(([date, topics]) => ({
        user_id: user.id,
        data: date,
        topicos: topics,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('study_plans')
        .upsert(payloads, { onConflict: 'user_id,data' });

      if (error) throw error;
      alert('Plano salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o plano. Verifique se o banco de dados foi atualizado.');
    } finally {
      setSaving(false);
    }
  };

  const autoPlan = () => {
    // Pegar todos os tópicos não lidos
    const allUnread = subjects.flatMap(s => 
      s.topics.filter(t => !t.read).map(t => ({ ...t, subjectId: s.id, cor: s.cor }))
    );

    if (allUnread.length === 0) return;

    const newPlans = { ...plannedDays };
    let topicIdx = 0;

    // Distribuir 2 por dia nos próximos 7 dias
    for (const date of weekDays) {
      const current = [...(newPlans[date] || [])];
      while (current.length < 2 && topicIdx < allUnread.length) {
        const topic = allUnread[topicIdx];
        // Evitar duplicados no mesmo dia
        if (!current.find(t => t.id === topic.id)) {
          current.push({ id: topic.id, nome: topic.nome, subjectId: topic.subjectId, cor: topic.cor });
        }
        topicIdx++;
      }
      newPlans[date] = current;
    }
    setPlannedDays(newPlans);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-muted">Acessando biblioteca de tópicos...</p>
    </div>
  );

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pb-20 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent/10 text-accent glow-accent">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-primary tracking-tighter italic">Planejador</h1>
          </div>
          <p className="text-sm text-muted ml-16 font-medium">Organize os tópicos que deseja dominar nesta semana.</p>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={autoPlan}
             className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all text-muted hover:text-primary"
           >
              <Zap className="w-4 h-4 text-yellow-500" /> Auto-Planejar
           </button>
           <button 
             onClick={handleSavePlan}
             disabled={saving}
             className="flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-glow-accent hover:opacity-90 transition-all disabled:opacity-50"
           >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Cronograma
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* BIBLIOTECA DE TÓPICOS (Col 4) */}
        <div className="lg:col-span-4 space-y-4 h-[70vh] flex flex-col">
          <div className="flex items-center gap-3 px-2">
             <BookOpen className="w-4 h-4 text-accent" />
             <h2 className="text-[10px] font-black uppercase tracking-widest text-muted">Biblioteca de Conteúdo</h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 thin-scrollbar">
            {subjects.map(sub => (
              <div key={sub.id} className="glass-card !p-0 overflow-hidden border-white/5">
                <button 
                  onClick={() => setExpandedSubject(expandedSubject === sub.id ? null : sub.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.cor }} />
                    <span className="text-sm font-bold text-primary truncate">{sub.nome}</span>
                  </div>
                  {expandedSubject === sub.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <AnimatePresence>
                  {expandedSubject === sub.id && (
                    <motion.div variants={expandDown} initial="initial" animate="animate" exit="exit" className="px-4 pb-4 space-y-1">
                      {sub.topics.map(topic => (
                        <div 
                          key={topic.id}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border border-white/5 ${topic.read ? 'opacity-40' : 'bg-white/[0.02]'} group hover:border-accent/40 transition-all`}
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-primary truncate leading-tight">{topic.nome}</h4>
                            {topic.read && <span className="text-[8px] font-bold text-success uppercase tracking-widest">Lido</span>}
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Inserir nos próximos dias */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                               {weekDays.map((date, idx) => {
                                 const dayLabels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
                                 return (
                                   <button
                                     key={date}
                                     onClick={() => toggleTopicInDay(date, { ...topic, subjectId: sub.id, cor: sub.cor })}
                                     className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black border border-white/10 hover:bg-accent hover:text-white transition-all ${
                                       (plannedDays[date] || []).find(t => t.id === topic.id) ? 'bg-accent text-white' : 'bg-white/5 text-muted'
                                     }`}
                                   >
                                     {dayLabels[idx]}
                                   </button>
                                 );
                               })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* GRADE SEMANAL (Col 8) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((date, i) => {
            const dateObj = new Date(date + 'T12:00:00');
            const isToday = new Date().toISOString().split('T')[0] === date;
            const plans = plannedDays[date] || [];

            return (
              <div key={date} className={`flex flex-col h-[70vh] rounded-3xl border transition-all ${isToday ? 'bg-accent/5 border-accent/20' : 'bg-secondary/40 border-white/5'}`}>
                <div className="p-4 border-b border-default text-center">
                   <div className="text-[9px] font-black uppercase tracking-tighter text-muted">
                      {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                   </div>
                   <div className={`text-xl font-black mt-1 ${isToday ? 'text-accent' : 'text-primary'}`}>
                      {dateObj.getDate()}
                   </div>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                   {plans.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center opacity-20 scale-90">
                        <Plus className="w-8 h-8 text-muted mb-2" />
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Vazio</span>
                     </div>
                   ) : (
                     plans.map(p => (
                       <div 
                         key={p.id}
                         className="relative group p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-accent/40 transition-all overflow-hidden"
                       >
                         <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: p.cor }} />
                         <h5 className="text-[10px] font-bold text-primary leading-tight mb-1">{p.nome}</h5>
                         <button 
                           onClick={() => toggleTopicInDay(date, p)}
                           className="absolute top-2 right-2 p-1 rounded-md bg-error/10 text-error opacity-0 group-hover:opacity-100 transition-all hover:bg-error hover:text-white"
                         >
                            <Trash2 size={10} />
                         </button>
                       </div>
                     ))
                   )}
                </div>

                {plans.length > 0 && (
                  <div className="p-3 border-t border-default bg-white/[0.02]">
                     <div className="flex justify-center -space-x-2">
                        {plans.map(p => (
                          <div 
                            key={p.id}
                            className="w-5 h-5 rounded-full border-2 border-secondary overflow-hidden flex items-center justify-center"
                            style={{ backgroundColor: `${p.cor}40` }}
                          >
                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.cor }} />
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </motion.div>
  );
}
