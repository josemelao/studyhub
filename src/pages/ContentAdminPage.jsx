import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSubjectsContext } from '../contexts/SubjectsContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { 
  Save, Eye, Edit3, Loader2, BookOpen, 
  AlertCircle, CheckCircle2, Plus, X, 
  FileText, UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/markdown.css';

export default function ContentAdminPage() {
  const { user } = useAuth();
  const { invalidateCache } = useSubjectsContext();
  const fileInputRef = useRef(null);
  
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('resumo');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState(null);

  // States para criação dinâmica
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newSubject, setNewSubject] = useState({ nome: '', categoria: 'Geral' });
  const [newTopicName, setNewTopicName] = useState('');

  // Carregar matérias
  const loadSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('ordem');
    setSubjects(data || []);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  // Carregar tópicos
  const loadTopics = async (subjectId) => {
    if (!subjectId) {
      setTopics([]);
      setSelectedTopic('');
      return;
    }
    setFetching(true);
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('ordem');
    setTopics(data || []);
    setFetching(false);
  };

  useEffect(() => {
    loadTopics(selectedSubject);
  }, [selectedSubject]);

  // Carregar conteúdo
  useEffect(() => {
    async function loadContent() {
      if (!selectedTopic) {
        setContent('');
        return;
      }
      setFetching(true);
      const { data } = await supabase
        .from('contents')
        .select('*')
        .eq('topic_id', selectedTopic)
        .eq('tipo', contentType)
        .single();
      
      setContent(data?.conteudo || '');
      setFetching(false);
    }
    loadContent();
  }, [selectedTopic, contentType]);

  const handleSave = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('contents').upsert({
        topic_id: selectedTopic,
        tipo: contentType,
        conteudo: content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'topic_id,tipo' });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Alterações salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
      invalidateCache();
    } catch (err) {
      setMessage({ type: 'error', text: 'Falha ao salvar: ' + err.message });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubject.nome) return;
    setLoading(true);
    try {
      const nextOrder = subjects.length > 0 ? Math.max(...subjects.map(s => s.ordem || 0)) + 1 : 1;
      const { data, error } = await supabase.from('subjects').insert({
        nome: newSubject.nome,
        categoria: newSubject.categoria,
        icone: 'Book',
        cor: '#7C5CFC',
        ordem: nextOrder
      }).select().single();

      if (error) throw error;
      await loadSubjects();
      setSelectedSubject(data.id);
      setIsAddingSubject(false);
      setNewSubject({ nome: '', categoria: 'Geral' });
      setMessage({ type: 'success', text: 'Matéria criada!' });
      setTimeout(() => setMessage(null), 3000);
      invalidateCache();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName || !selectedSubject) return;
    setLoading(true);
    try {
      const nextOrder = topics.length > 0 ? Math.max(...topics.map(t => t.ordem || 0)) + 1 : 1;
      const { data, error } = await supabase.from('topics').insert({
        subject_id: selectedSubject,
        nome: newTopicName,
        ordem: nextOrder
      }).select().single();

      if (error) throw error;
      await loadTopics(selectedSubject);
      setSelectedTopic(data.id);
      setIsAddingTopic(false);
      setNewTopicName('');
      setMessage({ type: 'success', text: 'Tópico criado!' });
      setTimeout(() => setMessage(null), 3000);
      invalidateCache();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWordImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        
        const result = await mammoth.convertToHtml({ arrayBuffer }, {
          styleMap: [
            "p[style-name='Quote'] => blockquote:fresh",
            "p[style-name='Intense Quote'] => blockquote:fresh",
            "p[style-name='List Paragraph'] => li:fresh"
          ]
        });

        const parser = new DOMParser();
        const doc = parser.parseFromString(result.value, 'text/html');
        const tableCache = [];

        // 1. EXTRAIR E PROTEGER TABELAS (Técnica de Placeholders)
        doc.querySelectorAll('table').forEach((table, index) => {
          let rows = Array.from(table.querySelectorAll('tr'));
          if (rows.length === 0) return;

          let mdTable = '\n\n';
          
          // Lógica Especial: Se for uma tabela de uma linha só, converter para DESTAQUE (>) sem a palavra redundante
          if (rows.length === 1) {
            const firstRowCells = Array.from(rows[0].querySelectorAll('td, th'));
            let content = firstRowCells.map(c => c.textContent.replace(/\s+/g, ' ').trim()).join(' - ');
            
            // Negritar o primeiro termo (até : ou )) e garantir um espaço depois
            if ((content.includes(':') || content.includes(')')) && !content.startsWith('**')) {
              content = content.replace(/^([^:)]+[:)])/, '**$1** ');
            }
            
            mdTable = `\n\n> ${content}\n\n`;
          } else {
            // Tabela real com mais de uma linha
            rows.forEach((row, i) => {
              let cells = Array.from(row.querySelectorAll('td, th')).map(c => 
                c.textContent.replace(/\s+/g, ' ').trim()
              );
              if (cells.join('').trim() === '') return;
              mdTable += `| ${cells.join(' | ')} |\n`;
              if (i === 0) mdTable += `| ${cells.map(() => ' --- ').join(' | ')} |\n`;
            });
          }
          
          mdTable += '\n';
          tableCache.push(mdTable);
          table.outerHTML = `TABLEXP${index}XP`; 
        });

        // 2. Configurar Turndown
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          bullet: '*',
          br: '  \n'
        });

        turndownService.addRule('forceHighlight', {
          filter: 'blockquote',
          replacement: (content) => {
            let cleanContent = content.trim();
            // Negritar o primeiro termo (até : ou )) e remover 'DESTAQUE' caso venha do mammoth
            cleanContent = cleanContent.replace(/^DESTAQUE:\s*/i, '');
            if ((cleanContent.includes(':') || cleanContent.includes(')')) && !cleanContent.startsWith('**')) {
              cleanContent = cleanContent.replace(/^([^:)]+[:)])/, '**$1** ');
            }
            return `\n\n> ${cleanContent}\n\n`;
          }
        });

        // 3. Converter Restante do Documento
        let markdown = turndownService.turndown(doc.body.innerHTML);

        // 4. DEVOLVER TABELAS PROTEGIDAS
        tableCache.forEach((tableMd, index) => {
          markdown = markdown.replace(`TABLEXP${index}XP`, tableMd);
        });

        // Limpeza final de HTML residual (como <span> ou tags de style do Word)
        markdown = markdown.replace(/<[^>]*>?/gm, '')
                          .replace(/\u00A0/g, ' ')
                          .replace(/\n{3,}/g, '\n\n');

        setContent(markdown);
        
        setMessage({ type: 'success', text: 'Importação v3.1 (Protegida) Concluída!' });
        setTimeout(() => setMessage(null), 3000);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro crítico: ' + err.message });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 relative">
      <input type="file" ref={fileInputRef} onChange={handleWordImport} accept=".docx" className="hidden" />

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-24 left-1/2 -track-x-1/2 z-[100] -translate-x-1/2"
          >
            <div className={`px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-4 min-w-[320px] ${message.type === 'success' ? 'bg-success/20 border-success/30 text-success' : 'bg-error/20 border-error/30 text-error'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${message.type === 'success' ? 'bg-success/20' : 'bg-error/20'}`}>
                {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{message.type === 'success' ? 'Sucesso' : 'Erro no Sistema'}</p>
                <p className="text-sm font-bold tracking-tight">{message.text}</p>
              </div>
              <button onClick={() => setMessage(null)} className="ml-auto opacity-40 hover:opacity-100 transition-opacity"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter italic flex items-center gap-3">
            <Edit3 className="text-accent" />
            Gerenciar Conteúdo
          </h1>
          <p className="text-sm text-muted mt-1 uppercase tracking-widest font-bold">Importador e Criador de Apostilas</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing || !selectedTopic}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 text-primary border border-white/10 font-black rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest text-[10px] disabled:opacity-30"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 text-accent" />}
            Importar Word
          </button>

          <button
            onClick={handleSave}
            disabled={loading || !selectedTopic}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-white font-black rounded-xl shadow-glow-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Conteúdo
          </button>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Navegação e Criação */}
        <div className="space-y-6">
          <section className="glass-card p-6 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-accent mb-4">Estrutura de Estudo</h2>
            
            {/* Matéria */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Matéria</label>
                <button 
                  onClick={() => setIsAddingSubject(!isAddingSubject)}
                  className="text-accent hover:text-white transition-colors"
                >
                  {isAddingSubject ? <X size={14} /> : <Plus size={14} />}
                </button>
              </div>

              <AnimatePresence>
                {isAddingSubject && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-2"
                  >
                    <input 
                      className="w-full bg-white/5 border border-accent/30 rounded-xl px-4 py-2 text-sm text-primary font-bold outline-none"
                      placeholder="Nome da matéria..."
                      value={newSubject.nome}
                      onChange={e => setNewSubject({...newSubject, nome: e.target.value})}
                    />
                    <button 
                      onClick={handleCreateSubject}
                      className="w-full py-2 bg-accent/20 text-accent text-[10px] font-black uppercase rounded-lg hover:bg-accent/30"
                    >
                      Criar Matéria
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isAddingSubject && (
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm font-bold text-primary appearance-none cursor-pointer"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="" className="bg-[#1a1a2e] text-primary">Selecione a matéria</option>
                  {subjects.map(s => <option key={s.id} value={s.id} className="bg-[#1a1a2e] text-primary">{s.nome}</option>)}
                </select>
              )}
            </div>

            {/* Tópico */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Tópico</label>
                {selectedSubject && (
                  <button 
                    onClick={() => setIsAddingTopic(!isAddingTopic)}
                    className="text-accent hover:text-white transition-colors"
                  >
                    {isAddingTopic ? <X size={14} /> : <Plus size={14} />}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isAddingTopic && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-2"
                  >
                    <input 
                      className="w-full bg-white/5 border border-accent/30 rounded-xl px-4 py-2 text-sm text-primary font-bold outline-none"
                      placeholder="Nome do tópico..."
                      value={newTopicName}
                      onChange={e => setNewTopicName(e.target.value)}
                    />
                    <button 
                      onClick={handleCreateTopic}
                      className="w-full py-2 bg-accent/20 text-accent text-[10px] font-black uppercase rounded-lg hover:bg-accent/30"
                    >
                      Criar Tópico
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isAddingTopic && (
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm font-bold text-primary disabled:opacity-30 appearance-none cursor-pointer"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  disabled={!selectedSubject || fetching}
                >
                  <option value="" className="bg-[#1a1a2e] text-primary">{fetching ? 'Carregando...' : 'Selecione o tópico'}</option>
                  {topics.map(t => <option key={t.id} value={t.id} className="bg-[#1a1a2e] text-primary">{t.nome}</option>)}
                </select>
              )}
            </div>

            {/* Conteúdo Tipo */}
            <div className="pt-4 border-t border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-3 px-1">Tipo de Conteúdo</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'resumo', label: 'Resumo / Apostila', icon: BookOpen },
                  { id: 'video', label: 'Videoaula', icon: Eye },
                  { id: 'dicas', label: 'Dicas / Macetes', icon: AlertCircle },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      contentType === type.id 
                        ? 'bg-accent text-white' 
                        : 'bg-white/5 text-muted hover:bg-white/10'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Guia de Markdown */}
          <section className="glass-card p-6 bg-accent/5 border-accent/10">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4 italic">Guia de Estilo (Markdown)</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted uppercase">Títulos</p>
                <code className="text-[10px] text-primary block bg-white/5 p-2 rounded"># Título Principal<br/>## Subtítulo<br/>### Tópico Menor</code>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted uppercase">Destaques</p>
                <code className="text-[10px] text-primary block bg-white/5 p-2 rounded">**Negrito**<br/>_Itálico_<br/>* Lista de Tópicos</code>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted uppercase">Caixa de Destaque (LGPD Style)</p>
                <code className="text-[10px] text-accent block bg-accent/10 p-2 rounded border border-accent/20">
                  &gt; **Texto em destaque aqui**
                </code>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted uppercase">Links e Mídia</p>
                <code className="text-[10px] text-primary block bg-white/5 p-2 rounded">[Título do Link](URL)</code>
              </div>
            </div>
          </section>
        </div>

        {/* Lado Direito: Editor e Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[700px]">
            {/* Editor */}
            <div className={`flex flex-col h-full bg-secondary/30 rounded-3xl border transition-all ${!selectedTopic ? 'border-white/5 opacity-40' : 'border-accent/20 shadow-lg shadow-accent/5'}`}>
               <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Editor</span>
                  </div>
                  {!selectedTopic && <span className="text-[9px] font-bold text-accent animate-pulse">SELECIONE UM TÓPICO</span>}
               </div>
               <textarea
                  className="flex-1 w-full bg-transparent p-6 outline-none resize-none text-sm font-medium text-secondary leading-relaxed font-mono"
                  placeholder={selectedTopic ? "Cole sua apostila aqui..." : "Escolha ou crie um tópico para habilitar o editor."}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={!selectedTopic || fetching}
               />
            </div>

             {/* Preview */}
            <div className="flex flex-col h-full bg-secondary/50 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
               <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-success" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Visualização Real</span>
               </div>
               <div className="flex-1 overflow-y-auto p-8 bg-primary/40">
                  {content ? (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content.replace(/\n/g, '  \n')}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8 grayscale">
                       <BookOpen className="w-16 h-16 mb-6" />
                       <p className="text-xs font-black uppercase tracking-widest leading-loose">Nada para mostrar ainda.<br/>Seu conteúdo aparecerá aqui formatado.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
