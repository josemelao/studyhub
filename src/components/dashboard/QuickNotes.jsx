import { useState, useEffect } from 'react';
import { StickyNote, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function QuickNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Carregar notas iniciais
  useEffect(() => {
    async function loadNotes() {
      if (!user) return;
      const { data } = await supabase
        .from('user_notes')
        .select('content, updated_at')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setNotes(data.content || '');
        setLastSaved(new Date(data.updated_at));
      }
    }
    loadNotes();
  }, [user]);

  // Salvar com debounce seria ideal, mas vamos usar um botão ou auto-save simples
  const handleSave = async (content) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_notes')
        .upsert({ 
          user_id: user.id, 
          content: content,
          updated_at: new Date().toISOString()
        });
      
      if (!error) setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save após 2 segundos de inatividade
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (notes) handleSave(notes);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [notes]);

  return (
    <div className="glass-card flex flex-col h-full bg-yellow-500/5 border-yellow-500/10 group">
      <div className="p-4 border-b border-default flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-500">
          <StickyNote className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Anotações</span>
        </div>
        <div className="flex items-center gap-2">
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted" />
          ) : lastSaved ? (
            <span className="text-[8px] text-muted font-bold uppercase">
              Salvo {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
        </div>
      </div>
      
      <div className="flex-1 p-4 relative">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Lembretes, fórmulas, metas do dia..."
          className="w-full h-full bg-transparent border-none outline-none text-sm text-primary/90 placeholder:text-muted/50 resize-none leading-relaxed font-medium"
        />
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
           <Save className="w-3 h-3 text-muted" />
        </div>
      </div>
    </div>
  );
}
