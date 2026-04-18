import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useSubjectsContext } from '../contexts/SubjectsContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import {
  Save,
  Eye,
  Edit3,
  Loader2,
  BookOpen,
  AlertCircle,
  Plus,
  X,
  FileText,
  UploadCloud,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import '../styles/markdown.css';

export default function ContentAdminPage() {
  useAuth();
  const MotionDiv = motion.div;

  const { currentConcursoId, currentWorkspace } = useWorkspace();
  const { invalidateCache } = useSubjectsContext();
  const fileInputRef = useRef(null);

  const [subjects, setSubjects] = useState([]);
  const [subSubjects, setSubSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubSubject, setSelectedSubSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('resumo');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingSubSubject, setIsAddingSubSubject] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newSubject, setNewSubject] = useState({ nome: '', categoria: 'Geral' });
  const [newSubSubjectName, setNewSubSubjectName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');

  const loadSubjects = async () => {
    if (!currentConcursoId) return;

    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('concurso_id', currentConcursoId)
      .order('ordem');

    setSubjects(data || []);
  };

  useEffect(() => {
    loadSubjects();
  }, [currentConcursoId]);

  const loadSubSubjects = async (subjectId) => {
    if (!subjectId) {
      setSubSubjects([]);
      setSelectedSubSubject('');
      return;
    }

    setFetching(true);
    const { data } = await supabase
      .from('sub_subjects')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('concurso_id', currentConcursoId)
      .order('ordem');

    setSubSubjects(data || []);
    setFetching(false);
  };

  useEffect(() => {
    loadSubSubjects(selectedSubject);
  }, [selectedSubject, currentConcursoId]);

  const loadTopics = async (subjectId, subSubjectId) => {
    if (!subjectId) {
      setTopics([]);
      setSelectedTopic('');
      return;
    }

    setFetching(true);
    let query = supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('concurso_id', currentConcursoId);

    if (subSubjectId) {
      query = query.eq('sub_subject_id', subSubjectId);
    } else {
      query = query.is('sub_subject_id', null);
    }

    const { data } = await query.order('ordem');
    setTopics(data || []);
    setFetching(false);
  };

  useEffect(() => {
    loadTopics(selectedSubject, selectedSubSubject);
  }, [selectedSubject, selectedSubSubject, currentConcursoId]);

  useEffect(() => {
    async function loadContent() {
      if (!selectedTopic) {
        setContent('');
        return;
      }

      setFetching(true);
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('topic_id', selectedTopic)
        .eq('tipo', contentType)
        .limit(1);

      setContent(data?.[0]?.conteudo || '');
      setFetching(false);
    }

    loadContent();
  }, [selectedTopic, contentType]);

  const handleSave = async () => {
    if (!selectedTopic) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('contents').upsert(
        {
          topic_id: selectedTopic,
          concurso_id: currentConcursoId,
          tipo: contentType,
          conteudo: content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'topic_id,tipo' },
      );

      if (error) throw error;

      toast.success('Alteracoes salvas com sucesso!');
      invalidateCache();
    } catch (err) {
      toast.error(`Falha ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubject.nome) return;

    setLoading(true);

    try {
      const nextOrder = subjects.length > 0 ? Math.max(...subjects.map((s) => s.ordem || 0)) + 1 : 1;
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          concurso_id: currentConcursoId,
          nome: newSubject.nome,
          categoria: newSubject.categoria,
          icone: 'Book',
          cor: '#7C5CFC',
          ordem: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;

      await loadSubjects();
      setSelectedSubject(data.id);
      setIsAddingSubject(false);
      setNewSubject({ nome: '', categoria: 'Geral' });
      toast.success('Materia criada!');
      invalidateCache();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubSubject = async () => {
    if (!newSubSubjectName || !selectedSubject) return;

    setLoading(true);

    try {
      const nextOrder = subSubjects.length > 0 ? Math.max(...subSubjects.map((s) => s.ordem || 0)) + 1 : 1;
      const { data, error } = await supabase
        .from('sub_subjects')
        .insert({
          concurso_id: currentConcursoId,
          subject_id: selectedSubject,
          nome: newSubSubjectName,
          ordem: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;

      await loadSubSubjects(selectedSubject);
      setSelectedSubSubject(data.id);
      setIsAddingSubSubject(false);
      setNewSubSubjectName('');
      toast.success('Modulo criado!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName || !selectedSubject) return;

    setLoading(true);

    try {
      const nextOrder = topics.length > 0 ? Math.max(...topics.map((t) => t.ordem || 0)) + 1 : 1;
      const { data, error } = await supabase
        .from('topics')
        .insert({
          concurso_id: currentConcursoId,
          subject_id: selectedSubject,
          sub_subject_id: selectedSubSubject || null,
          nome: newTopicName,
          ordem: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;

      await loadTopics(selectedSubject, selectedSubSubject);
      setSelectedTopic(data.id);
      setIsAddingTopic(false);
      setNewTopicName('');
      toast.success('Topico criado!');
      invalidateCache();
    } catch (err) {
      toast.error(err.message);
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

        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: [
              "p[style-name='Quote'] => blockquote:fresh",
              "p[style-name='Intense Quote'] => blockquote:fresh",
              "p[style-name='List Paragraph'] => li:fresh",
            ],
          },
        );

        const parser = new DOMParser();
        const doc = parser.parseFromString(result.value, 'text/html');
        const tableCache = [];

        doc.querySelectorAll('table').forEach((table, index) => {
          const rows = Array.from(table.querySelectorAll('tr'));
          if (rows.length === 0) return;

          let mdTable = '\n\n';

          if (rows.length === 1) {
            const firstRowCells = Array.from(rows[0].querySelectorAll('td, th'));
            let rowContent = firstRowCells.map((c) => c.textContent.replace(/\s+/g, ' ').trim()).join(' - ');

            if ((rowContent.includes(':') || rowContent.includes(')')) && !rowContent.startsWith('**')) {
              rowContent = rowContent.replace(/^([^:)]+[:)])/, '**$1** ');
            }

            mdTable = `\n\n> ${rowContent}\n\n`;
          } else {
            rows.forEach((row, i) => {
              const cells = Array.from(row.querySelectorAll('td, th')).map((c) => c.textContent.replace(/\s+/g, ' ').trim());
              if (cells.join('').trim() === '') return;

              mdTable += `| ${cells.join(' | ')} |\n`;
              if (i === 0) {
                mdTable += `| ${cells.map(() => ' --- ').join(' | ')} |\n`;
              }
            });
          }

          mdTable += '\n';
          tableCache.push(mdTable);
          table.outerHTML = `TABLEXP${index}XP`;
        });

        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          bullet: '*',
          br: '  \n',
        });

        turndownService.addRule('forceHighlight', {
          filter: 'blockquote',
          replacement: (blockquoteContent) => {
            let cleanContent = blockquoteContent.trim();
            cleanContent = cleanContent.replace(/^DESTAQUE:\s*/i, '');

            if ((cleanContent.includes(':') || cleanContent.includes(')')) && !cleanContent.startsWith('**')) {
              cleanContent = cleanContent.replace(/^([^:)]+[:)])/, '**$1** ');
            }

            return `\n\n> ${cleanContent}\n\n`;
          },
        });

        let markdown = turndownService.turndown(doc.body.innerHTML);

        tableCache.forEach((tableMd, index) => {
          markdown = markdown.replace(`TABLEXP${index}XP`, tableMd);
        });

        markdown = markdown
          .replace(/<[^>]*>?/gm, '')
          .replace(/\u00A0/g, ' ')
          .replace(/\n{3,}/g, '\n\n');

        setContent(markdown);
        toast.success('Importacao concluida!');
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      toast.error(`Erro critico: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const contentTypes = [
    { id: 'resumo', label: 'Resumo / Apostila', Icon: BookOpen },
    { id: 'video', label: 'Videoaulas', Icon: Eye },
    { id: 'dicas', label: 'Dicas e Macetes', Icon: AlertCircle },
  ];

  return (
    <div className="w-full space-y-8 pb-12 relative">
      <input type="file" ref={fileInputRef} onChange={handleWordImport} accept=".docx" className="hidden" />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter italic flex items-center gap-3">
            <Edit3 className="text-accent" />
            Gerenciar Conteudo
          </h1>
          <p className="text-sm text-muted mt-1 uppercase tracking-widest font-bold">Importador e Criador de Apostilas</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin · {currentWorkspace?.name || 'Workspace'}
          </div>

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
            Salvar Conteudo
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <section className="glass-card p-5 grid grid-cols-1 md:grid-cols-3 gap-6 bg-secondary/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-accent/70">Materia</label>
              <button onClick={() => setIsAddingSubject(!isAddingSubject)} className="text-accent hover:text-white transition-colors p-1">
                {isAddingSubject ? <X size={14} /> : <Plus size={14} />}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isAddingSubject ? (
                <MotionDiv
                  key="add-subject"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-2"
                >
                  <input
                    className="w-full bg-white/5 border border-accent/40 rounded-xl px-4 py-2 text-sm text-primary font-bold outline-none"
                    placeholder="Nome da materia..."
                    value={newSubject.nome}
                    onChange={(e) => setNewSubject({ ...newSubject, nome: e.target.value })}
                    autoFocus
                  />
                  <button onClick={handleCreateSubject} className="w-full py-2 bg-accent/20 text-accent text-[10px] font-black uppercase rounded-xl hover:bg-accent/30 transition-colors">
                    Confirmar Criacao
                  </button>
                </MotionDiv>
              ) : (
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm font-bold text-primary appearance-none cursor-pointer hover:bg-white/[0.07] transition-all"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="" className="bg-[#1a1a2e] text-primary text-sm font-bold">Selecione a materia</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#1a1a2e] text-primary">
                      {s.nome}
                    </option>
                  ))}
                </select>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-accent/70">Modulo</label>
              {selectedSubject && (
                <button onClick={() => setIsAddingSubSubject(!isAddingSubSubject)} className="text-accent hover:text-white transition-colors p-1">
                  {isAddingSubSubject ? <X size={14} /> : <Plus size={14} />}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isAddingSubSubject ? (
                <MotionDiv
                  key="add-sub"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-2"
                >
                  <input
                    className="w-full bg-white/5 border border-accent/40 rounded-xl px-4 py-2 text-sm text-primary font-bold outline-none"
                    placeholder="Nome do modulo..."
                    value={newSubSubjectName}
                    onChange={(e) => setNewSubSubjectName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={handleCreateSubSubject} className="w-full py-2 bg-accent/20 text-accent text-[10px] font-black uppercase rounded-xl hover:bg-accent/30 transition-colors">
                    Confirmar Modulo
                  </button>
                </MotionDiv>
              ) : (
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm font-bold text-primary disabled:opacity-30 appearance-none cursor-pointer hover:bg-white/[0.07] transition-all"
                  value={selectedSubSubject}
                  onChange={(e) => setSelectedSubSubject(e.target.value)}
                  disabled={!selectedSubject || fetching}
                >
                  <option value="" className="bg-[#1a1a2e] text-primary text-sm font-bold">Diretos (Sem Modulo)</option>
                  {subSubjects.map((ss) => (
                    <option key={ss.id} value={ss.id} className="bg-[#1a1a2e] text-primary">
                      {ss.nome}
                    </option>
                  ))}
                </select>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-accent/70">Topico</label>
              {selectedSubject && (
                <button onClick={() => setIsAddingTopic(!isAddingTopic)} className="text-accent hover:text-white transition-colors p-1">
                  {isAddingTopic ? <X size={14} /> : <Plus size={14} />}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isAddingTopic ? (
                <MotionDiv
                  key="add-topic"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-2"
                >
                  <input
                    className="w-full bg-white/5 border border-accent/40 rounded-xl px-4 py-2 text-sm text-primary font-bold outline-none"
                    placeholder="Nome do topico..."
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={handleCreateTopic} className="w-full py-2 bg-accent/20 text-accent text-[10px] font-black uppercase rounded-xl hover:bg-accent/30 transition-colors">
                    Confirmar Topico
                  </button>
                </MotionDiv>
              ) : (
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm font-bold text-primary disabled:opacity-30 appearance-none cursor-pointer hover:bg-white/[0.07] transition-all"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  disabled={!selectedSubject || fetching}
                >
                  <option value="" className="bg-[#1a1a2e] text-primary text-sm font-bold">
                    {fetching ? 'Carregando...' : 'Selecione o topico'}
                  </option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#1a1a2e] text-primary">
                      {t.nome}
                    </option>
                  ))}
                </select>
              )}
            </AnimatePresence>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-4 glass-card p-4 bg-secondary/20 border border-accent/10">
            <div className="flex items-center justify-between gap-3 mb-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Tipo de Conteudo</label>
              <span className="text-[9px] uppercase tracking-[0.18em] text-secondary">Formato</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {contentTypes.map(({ id, label, Icon }) => {
                const ItemIcon = Icon;
                const isActive = contentType === id;

                return (
                  <button
                    key={id}
                    onClick={() => setContentType(id)}
                    className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-accent/12 border-accent/35 text-primary shadow-[0_6px_18px_rgba(var(--accent-rgb),0.12)]'
                        : 'bg-primary/20 border-transparent text-secondary hover:bg-primary/30 hover:text-primary'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive ? 'bg-accent text-white' : 'bg-secondary/70 text-accent/80 group-hover:bg-accent/10 group-hover:text-accent'
                      }`}
                    >
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>

                    <span className={`text-[10px] font-black uppercase tracking-[0.16em] leading-none ${isActive ? 'text-primary' : 'text-secondary group-hover:text-primary'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lg:col-span-8 glass-card p-5 bg-accent/5 border-accent/10">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4 italic flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Guia de Estilo Markdown
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-8">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-muted uppercase">Titulos</p>
                <code className="text-[10px] text-primary"># ## ###</code>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-muted uppercase">Enfase</p>
                <code className="text-[10px] text-primary">**Bold** _Ital_</code>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-muted uppercase">Listas</p>
                <code className="text-[10px] text-primary">* Item 1. Item</code>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-muted uppercase">Destaque</p>
                <code className="text-[10px] text-accent">&gt; **Texto**</code>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-muted uppercase">Tabelas</p>
                <code className="text-[10px] text-primary">| Col | Col |</code>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-muted uppercase">Codigo</p>
                <code className="text-[10px] text-primary">{'`code` ```block'}</code>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-muted uppercase">Links</p>
                <code className="text-[10px] text-primary">[Txt](URL)</code>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-muted uppercase">Quebra</p>
                <code className="text-[10px] text-primary">2 espacos + Enter</code>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8 lg:h-[calc(100vh-22rem)] lg:min-h-[650px] lg:max-h-[900px]">
        <div className={`flex flex-col min-h-[420px] lg:min-h-0 lg:h-full bg-secondary/30 rounded-3xl border overflow-hidden transition-all ${!selectedTopic ? 'border-white/5 opacity-40' : 'border-accent/20 shadow-lg shadow-accent/5'}`}>
          <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Campo de Escrita</span>
            </div>
            {!selectedTopic && <span className="text-[9px] font-bold text-accent animate-pulse uppercase">Selecione um topico para editar</span>}
          </div>

          <textarea
            className="flex-1 min-h-[320px] lg:min-h-0 w-full bg-transparent p-8 outline-none resize-none overflow-y-auto text-[15px] font-medium text-secondary leading-relaxed font-mono custom-scrollbar"
            placeholder={
              !selectedTopic
                ? 'Escolha ou crie um topico para habilitar o editor.'
                : contentType === 'video'
                  ? 'Cole os links do YouTube aqui.\nUse um link por linha.\nExemplo:\nhttps://youtube.com/watch?v=123\nhttps://youtube.com/watch?v=456'
                  : 'Comece a escrever sua apostila aqui...'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!selectedTopic || fetching}
          />
        </div>

        <div className="flex flex-col min-h-[420px] lg:min-h-0 lg:h-full bg-secondary/50 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <Eye className="w-4 h-4 text-success" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Visualizacao Final</span>
          </div>

          <div className="flex-1 min-h-[320px] lg:min-h-0 overflow-y-auto p-10 bg-primary/40 custom-scrollbar">
            {content ? (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content.replace(/\n/g, '  \n')}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8 grayscale">
                <BookOpen className="w-16 h-16 mb-6" />
                <p className="text-xs font-black uppercase tracking-widest leading-loose">
                  Visualizacao Vazia
                  <br />
                  O conteudo formatado aparecera aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
