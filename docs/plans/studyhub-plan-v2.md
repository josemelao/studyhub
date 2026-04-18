# StudyHub AI — Especificação Técnica V2
> Documento de referência para o agente Antigravity.
> Leia integralmente antes de iniciar qualquer tarefa.
> Este documento pressupõe que o MVP (V1) está implementado e funcionando.

---

## 0. CONTEXTO: O QUE EXISTE E O QUE MUDA

### O que foi entregue no MVP (V1) — NÃO reescrever
- ✅ Auth + Login Google (Supabase)
- ✅ Dashboard com matérias e progresso
- ✅ Página de Matérias com lista de tópicos
- ✅ Leitura de conteúdo em markdown
- ✅ Simulado por tópico (página separada de questões — decisão do usuário)
- ✅ Página de Progresso
- ✅ Schema completo no Supabase (concursos, subjects, topics, contents, questions, user_progress, user_answers)

### O que esta V2 entrega
1. **Correção visual** — elevar animações e motion design para o nível especificado originalmente
2. **Modo Prova** — simulado configurável com seleção de matérias, quantidade de questões e timer
3. **Favoritos** — salvar conteúdos e questões
4. **Gamificação básica** — streaks de estudo diário e sistema de conquistas simples

### Regra de ouro para o agente
> Nunca reescrever o que funciona. Todas as alterações neste documento são **adições** ou **refinamentos cirúrgicos**. Se uma página existente for mencionada, significa apenas que ela recebe incrementos — não refatoração completa.

---

## 1. PRIORIDADE 0 — CORREÇÃO VISUAL (fazer primeiro)

Antes de qualquer nova feature, o design e as animações precisam atingir o padrão especificado na V1. Esta é a correção mais importante.

### 1.1 Diagnóstico e critério de qualidade

O padrão visual esperado é: **refinado, fluido, com personalidade** — inspirado em Linear, Raycast e Readwise. Não deve parecer um template genérico de Tailwind.

Verificar e corrigir cada item abaixo:

---

### 1.2 Tipografia — verificar implementação

As fontes devem estar carregadas corretamente via Google Fonts no `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

CSS global (`src/index.css`) deve ter:
```css
body {
  font-family: 'DM Sans', sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, .display {
  font-family: 'Instrument Serif', serif;
}
```

Verificar se os títulos das páginas estão usando `Instrument Serif`. Se não, corrigir.

---

### 1.3 Variáveis CSS — garantir presença completa

Verificar se **todas** estas variáveis existem no `:root` do `index.css`. Adicionar as que faltarem:

```css
:root {
  /* Backgrounds */
  --bg-primary: #0f0f11;
  --bg-secondary: #17171a;
  --bg-tertiary: #1e1e22;
  --bg-elevated: #252529;

  /* Texto */
  --text-primary: #f0eff4;
  --text-secondary: #9e9da8;
  --text-muted: #5c5b66;

  /* Accent âmbar */
  --accent: #f5a623;
  --accent-hover: #f7b84a;
  --accent-subtle: rgba(245, 166, 35, 0.12);
  --accent-border: rgba(245, 166, 35, 0.25);

  /* Semânticas */
  --success: #4ade80;
  --success-subtle: rgba(74, 222, 128, 0.1);
  --error: #f87171;
  --error-subtle: rgba(248, 113, 113, 0.1);
  --warning: #fbbf24;

  /* Bordas */
  --border: rgba(255, 255, 255, 0.07);
  --border-hover: rgba(255, 255, 255, 0.14);

  /* Sombras */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);
  --shadow-accent: 0 0 24px rgba(245, 166, 35, 0.15);

  /* Raios */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Transições */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

### 1.4 Animações — arquivo dedicado

Criar ou substituir `src/styles/animations.css` com o seguinte conteúdo completo:

```css
/* ============================================
   STUDYHUB — ANIMATION SYSTEM
   ============================================ */

/* --- Keyframes base --- */

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes shimmer {
  from { transform: translateX(-100%); }
  to   { transform: translateX(200%); }
}

@keyframes pulse-accent {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 166, 35, 0); }
  50%       { box-shadow: 0 0 0 6px rgba(245, 166, 35, 0.15); }
}

@keyframes correctPulse {
  0%   { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5); }
  70%  { box-shadow: 0 0 0 14px rgba(74, 222, 128, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
}

@keyframes wrongShake {
  0%, 100% { transform: translateX(0); }
  15%      { transform: translateX(-7px); }
  30%      { transform: translateX(7px); }
  45%      { transform: translateX(-5px); }
  60%      { transform: translateX(5px); }
  75%      { transform: translateX(-3px); }
  90%      { transform: translateX(3px); }
}

@keyframes timerPulse {
  0%, 100% { color: var(--text-primary); }
  50%      { color: var(--error); }
}

@keyframes streakBounce {
  0%, 100% { transform: scale(1); }
  40%      { transform: scale(1.25); }
  60%      { transform: scale(0.95); }
}

@keyframes confettiFall {
  0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
}

@keyframes progressFill {
  from { width: 0%; }
  to   { width: var(--progress-target); }
}

/* --- Classes utilitárias de animação --- */

.animate-fade-in {
  animation: fadeIn var(--transition-base) both;
}

.animate-fade-in-scale {
  animation: fadeInScale var(--transition-base) both;
}

.animate-slide-right {
  animation: slideInRight var(--transition-base) both;
}

/* Stagger para listas — adicionar delay via style inline */
.stagger-item {
  animation: fadeIn 0.3s both;
}

/* --- Cards interativos --- */

.card-interactive {
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base),
    border-color var(--transition-base),
    background var(--transition-base);
  cursor: pointer;
}

.card-interactive:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-hover);
}

.card-interactive:active {
  transform: translateY(-1px);
  transition-duration: 80ms;
}

/* --- Botões --- */

.btn-primary {
  background: var(--accent);
  color: #0f0f11;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-accent);
}

.btn-primary:active {
  transform: translateY(0px);
  transition-duration: 80ms;
}

.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

/* --- Progress bar --- */

.progress-track {
  background: var(--bg-tertiary);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  border-radius: 999px;
  transition: width var(--transition-slow);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.25) 50%,
    transparent 100%
  );
  animation: shimmer 2.5s infinite;
}

/* --- Feedback de questão --- */

.answer-option {
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
  cursor: pointer;
}

.answer-option:hover:not(.answered) {
  background: var(--bg-elevated);
  border-color: var(--border-hover);
  transform: translateX(4px);
}

.answer-correct {
  background: var(--success-subtle) !important;
  border-color: var(--success) !important;
  animation: correctPulse 0.7s ease-out;
}

.answer-wrong {
  background: var(--error-subtle) !important;
  border-color: var(--error) !important;
  animation: wrongShake 0.45s ease-out;
}

/* --- Skeleton loading --- */

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-elevated) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s infinite;
  border-radius: var(--radius-sm);
}

/* --- Timer --- */

.timer-warning {
  animation: timerPulse 1s infinite;
}

/* --- Streak --- */

.streak-bounce {
  display: inline-block;
  animation: streakBounce 0.6s var(--transition-spring);
}

/* --- Navbar link ativo --- */

.nav-link {
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
  border-radius: var(--radius-sm);
}

.nav-link:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.nav-link.active {
  background: var(--accent-subtle);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

/* --- Toggle de tema --- */

.theme-toggle {
  transition: transform var(--transition-spring);
}

.theme-toggle:hover {
  transform: rotate(20deg) scale(1.1);
}

/* --- Página de resultado --- */

.result-score {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(3rem, 10vw, 5rem);
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fadeInScale 0.5s var(--transition-spring) both;
}
```

---

### 1.5 Framer Motion — variantes globais

Criar `src/lib/animations.js` com as variantes reutilizáveis:

```js
// src/lib/animations.js

export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
}

export const pageTransition = {
  duration: 0.22,
  ease: [0.4, 0, 0.2, 1],
}

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }
  }
}

export const slideFromRight = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
  transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] }
}

export const expandDown = {
  initial: { opacity: 0, height: 0, y: -4 },
  animate: {
    opacity: 1,
    height: 'auto',
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2 }
  }
}
```

Aplicar `pageVariants` como wrapper em **todas as páginas existentes**:

```jsx
// Padrão obrigatório para toda página
import { motion } from 'framer-motion'
import { pageVariants, pageTransition } from '../lib/animations'

export default function NomeDaPagina() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {/* conteúdo */}
    </motion.div>
  )
}
```

Aplicar `staggerContainer` + `staggerItem` em **todas as listas de cards** existentes
(dashboard de matérias, lista de tópicos, lista de questões erradas no progresso).

---

### 1.6 Detalhes visuais adicionais

**Fundo com textura sutil** — adicionar ao `body` no `index.css`:
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: radial-gradient(
    ellipse 80% 50% at 50% -10%,
    rgba(245, 166, 35, 0.06) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}
```

**Scrollbar customizada:**
```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--bg-elevated);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
```

**Seleção de texto:**
```css
::selection {
  background: var(--accent-subtle);
  color: var(--accent);
}
```

---

## 2. MODO PROVA

### 2.1 Visão geral

O Modo Prova simula uma prova real de concurso. O usuário configura antes de começar: quais matérias incluir, quantas questões e quanto tempo. Ao finalizar, recebe um resultado detalhado por matéria.

**Diferença do Simulado por Tópico (MVP):**

| | Simulado (MVP) | Modo Prova (V2) |
|---|---|---|
| Questões | De um tópico só | Mistas, de várias matérias |
| Configuração | Nenhuma | Matérias + qtd + tempo |
| Feedback | Imediato por questão | Só no final |
| Timer | Não tem | Sim, configurável |
| Resultado | Simples | Detalhado por matéria |

---

### 2.2 Nova tabela no banco

```sql
CREATE TABLE exam_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  concurso_id UUID REFERENCES concursos(id),
  configuracao JSONB NOT NULL,
  -- configuracao: { subjects: [...ids], total_questoes: 20, tempo_minutos: 60 }
  questoes JSONB NOT NULL,
  -- questoes: array de question_ids embaralhados
  respostas JSONB DEFAULT '{}',
  -- respostas: { [question_id]: "A" }
  iniciada_em TIMESTAMPTZ DEFAULT NOW(),
  finalizada_em TIMESTAMPTZ,
  tempo_gasto_segundos INTEGER,
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizada', 'abandonada'))
);

ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_sessions_own" ON exam_sessions
  FOR ALL USING (auth.uid() = user_id);
```

---

### 2.3 Nova rota

```
/modo-prova              → ExamConfigPage (configuração)
/modo-prova/sessao/:id   → ExamSessionPage (prova em andamento)
/modo-prova/resultado/:id → ExamResultPage (resultado final)
```

Adicionar link "Modo Prova" na Sidebar e Navbar, com ícone `Trophy` do Lucide.

---

### 2.4 ExamConfigPage (`/modo-prova`)

**Layout — tela de configuração em 3 blocos:**

**Bloco 1 — Seleção de matérias**
```
Selecione as matérias
┌──────────────────────────────────────┐
│ ☑ Matemática Financeira   (12 q)    │
│ ☑ Língua Portuguesa       (18 q)    │
│ ☑ Raciocínio Lógico       (10 q)    │
│ ☐ Conhecimentos Bancários (15 q)    │
│ ☐ Tecnologia da Informação (8 q)    │
└──────────────────────────────────────┘
Total disponível: 40 questões
```

Checkboxes animados. Ao selecionar/deselecionar, o total atualiza com transição numérica.

**Bloco 2 — Número de questões**
Slider ou botões de incremento:
```
Quantidade de questões
[−]  [  20  ]  [+]
Máximo disponível: 40
```
Limitar ao total disponível das matérias selecionadas.

**Bloco 3 — Timer**
```
Tempo disponível
○ Sem limite de tempo
● Definir tempo:  [  60  ] minutos
```
Quando "Definir tempo" selecionado, mostrar input de minutos (mínimo: 5, máximo: 300).

**Botão de início:**
```
[  🎯  Iniciar Prova  ]
```
Desabilitado se nenhuma matéria selecionada ou qtd = 0.

**Lógica ao iniciar:**
```jsx
const startExam = async () => {
  // 1. Buscar questões das matérias selecionadas
  const { data: questions } = await supabase
    .from('questions')
    .select('id, topic_id, topics(subject_id)')
    .in('topics.subject_id', selectedSubjectIds)

  // 2. Embaralhar (Fisher-Yates) e pegar a quantidade desejada
  const shuffled = fisherYatesShuffle(questions).slice(0, totalQuestoes)

  // 3. Criar sessão no banco
  const { data: session } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: user.id,
      concurso_id: activeConcursoId,
      configuracao: { subjects: selectedSubjectIds, total_questoes: totalQuestoes, tempo_minutos: tempoMinutos },
      questoes: shuffled.map(q => q.id)
    })
    .select()
    .single()

  // 4. Navegar para a sessão
  navigate(`/modo-prova/sessao/${session.id}`)
}

// Fisher-Yates shuffle
function fisherYatesShuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
```

---

### 2.5 ExamSessionPage (`/modo-prova/sessao/:id`)

**Layout geral:**
```
┌─────────────────────────────────────────────────┐
│  Modo Prova  │  Questão 7 de 20  │  ⏱ 43:22   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [enunciado da questão]                         │
│                                                 │
│  (A) opção A                                    │
│  (B) opção B                                    │
│  (C) opção C                                    │
│  (D) opção D                                    │
│  (E) opção E                                    │
│                                                 │
├─────────────────────────────────────────────────┤
│  [← Anterior]   [mapa de questões]  [Próxima →] │
└─────────────────────────────────────────────────┘
```

**Diferença crítica do simulado:** Sem feedback imediato. O usuário marca uma opção e ela fica registrada visualmente (borda âmbar), mas **não revela se está certa ou errada**. O gabarito só é mostrado na tela de resultado.

**Timer:**
```jsx
// Hook dedicado para o timer
function useExamTimer(tempoMinutos, onTimeUp) {
  const [secondsLeft, setSecondsLeft] = useState(tempoMinutos * 60)
  
  useEffect(() => {
    if (!tempoMinutos) return // sem limite
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const isWarning = secondsLeft < 300 // últimos 5 min → vermelho pulsante
  
  return { minutes, seconds, isWarning, secondsLeft }
}
```

Exibição do timer:
```jsx
<span className={isWarning ? 'timer-warning' : ''}>
  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
</span>
```

**Mapa de questões (drawer/modal):**
Grid com todas as questões numeradas. Cada célula mostra:
- Cinza: não respondida
- Âmbar: respondida
- Borda branca: questão atual

Permite navegação direta para qualquer questão.

**Salvar resposta localmente e no banco:**
```jsx
// Salvar no estado local imediatamente (não aguardar Supabase)
const [localAnswers, setLocalAnswers] = useState({})

const selectAnswer = async (questionId, opcao) => {
  // Atualização local imediata (UX responsiva)
  setLocalAnswers(prev => ({ ...prev, [questionId]: opcao }))
  
  // Persistir no banco em background (sem await na UI)
  supabase.from('exam_sessions').update({
    respostas: { ...localAnswers, [questionId]: opcao }
  }).eq('id', sessionId)
}
```

**Finalizar prova:**
Botão "Finalizar Prova" visível no header. Ao clicar → modal de confirmação:
```
Tem certeza que deseja finalizar?
Você respondeu 18 de 20 questões.
[Cancelar]  [Finalizar e ver resultado]
```

Ao confirmar:
```jsx
const finishExam = async () => {
  const endTime = new Date()
  const tempoGasto = Math.floor((endTime - startTime) / 1000)
  
  await supabase.from('exam_sessions').update({
    respostas: localAnswers,
    finalizada_em: endTime.toISOString(),
    tempo_gasto_segundos: tempoGasto,
    status: 'finalizada'
  }).eq('id', sessionId)
  
  navigate(`/modo-prova/resultado/${sessionId}`)
}
```

**Proteção contra saída acidental:**
```jsx
// Bloquear navegação se prova em andamento
useEffect(() => {
  const handleBeforeUnload = (e) => {
    e.preventDefault()
    e.returnValue = ''
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [])
```

---

### 2.6 ExamResultPage (`/modo-prova/resultado/:id`)

**Layout — resultado completo:**

**Bloco 1 — Score principal (animado)**
```jsx
// Número anima de 0 até o valor real ao entrar na página
<motion.div
  className="result-score"
  initial={{ opacity: 0, scale: 0.5 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
>
  {score}%
</motion.div>
```

```
        75%
  15 de 20 acertos

  ⏱ Tempo: 47min 23s   📋 20 questões
```

**Bloco 2 — Resultado por matéria**
```
Matemática Financeira    8/10   80%   ████████░░
Língua Portuguesa        5/8    63%   ██████░░░░
Raciocínio Lógico        2/2   100%   ██████████
```

**Bloco 3 — Gabarito detalhado**
Accordion expansível com todas as questões.
Cada questão mostra:
- Enunciado
- Opção marcada pelo usuário (verde se certa, vermelha se errada)
- Opção correta destacada
- Explicação

**Bloco 4 — Ações**
```
[  Refazer com mesmas questões  ]
[  Nova prova                   ]
[  Ver questões erradas         ]
[  Voltar ao Dashboard          ]
```

---

## 3. FAVORITOS

### 3.1 Nova tabela

```sql
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('conteudo', 'questao')),
  referencia_id UUID NOT NULL,  -- content_id ou question_id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tipo, referencia_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON favorites
  FOR ALL USING (auth.uid() = user_id);
```

### 3.2 Componente FavoriteButton

```jsx
// Ícone de coração/estrela com toggle animado
// Aparece em: cards de conteúdo e cards de questão

function FavoriteButton({ tipo, referenciaId }) {
  const [isFav, setIsFav] = useState(false)

  const toggle = async () => {
    // Otimistic update: atualiza UI antes do Supabase responder
    setIsFav(prev => !prev)

    if (isFav) {
      await supabase.from('favorites').delete()
        .eq('user_id', user.id)
        .eq('tipo', tipo)
        .eq('referencia_id', referenciaId)
    } else {
      await supabase.from('favorites').insert({
        user_id: user.id, tipo, referencia_id: referenciaId
      })
    }
  }

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.8 }}
      whileHover={{ scale: 1.15 }}
    >
      <Star
        size={18}
        fill={isFav ? 'var(--accent)' : 'none'}
        stroke={isFav ? 'var(--accent)' : 'var(--text-muted)'}
        style={{ transition: 'fill 0.2s, stroke 0.2s' }}
      />
    </motion.button>
  )
}
```

### 3.3 Onde aparece o FavoriteButton

- **StudyPage** — botão de estrela no header do conteúdo
- **SimuladoPage / ExamResultPage** — botão de estrela em cada questão (no estado pós-resposta)

### 3.4 Página de Favoritos (`/favoritos`)

Adicionar na sidebar abaixo de "Meu Progresso".

**Duas abas:**
- **Conteúdos salvos** — cards com título do tópico + matéria + botão "Estudar"
- **Questões salvas** — lista de questões com enunciado + botão "Ver resposta" (expande com animação)

---

## 4. GAMIFICAÇÃO BÁSICA

### 4.1 Nova tabela

```sql
CREATE TABLE user_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  streak_atual INTEGER DEFAULT 0,
  streak_max INTEGER DEFAULT 0,
  ultimo_estudo_dia DATE,
  total_questoes_respondidas INTEGER DEFAULT 0,
  total_acertos INTEGER DEFAULT 0,
  conquistas JSONB DEFAULT '[]',
  -- conquistas: [{ id: "first_study", unlocked_at: "..." }]
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_stats_own" ON user_stats
  FOR ALL USING (auth.uid() = user_id);
```

### 4.2 Lógica de streak

Chamar esta função após qualquer sessão de estudo (simulado concluído ou conteúdo lido):

```jsx
// src/lib/gamification.js

export async function updateStreak(supabase, userId) {
  const today = new Date().toISOString().split('T')[0] // "YYYY-MM-DD"

  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Inicializar se não existe
  if (!stats) {
    await supabase.from('user_stats').insert({
      user_id: userId,
      streak_atual: 1,
      streak_max: 1,
      ultimo_estudo_dia: today
    })
    return { streak: 1, isNew: true }
  }

  // Já estudou hoje — não incrementar
  if (stats.ultimo_estudo_dia === today) {
    return { streak: stats.streak_atual, isNew: false }
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // Sequência mantida (estudou ontem)
  const newStreak = stats.ultimo_estudo_dia === yesterdayStr
    ? stats.streak_atual + 1
    : 1 // quebrou a sequência

  const newMax = Math.max(newStreak, stats.streak_max)

  await supabase.from('user_stats').update({
    streak_atual: newStreak,
    streak_max: newMax,
    ultimo_estudo_dia: today,
    updated_at: new Date().toISOString()
  }).eq('user_id', userId)

  return { streak: newStreak, isNew: newStreak > stats.streak_atual }
}
```

### 4.3 Conquistas definidas

```js
// src/lib/achievements.js

export const ACHIEVEMENTS = [
  {
    id: 'first_study',
    titulo: 'Primeiro passo',
    descricao: 'Estudou pela primeira vez',
    icone: '🎯',
    condicao: (stats) => stats.total_questoes_respondidas >= 1
  },
  {
    id: 'streak_3',
    titulo: 'Três em sequência',
    descricao: '3 dias seguidos de estudo',
    icone: '🔥',
    condicao: (stats) => stats.streak_atual >= 3
  },
  {
    id: 'streak_7',
    titulo: 'Semana perfeita',
    descricao: '7 dias seguidos de estudo',
    icone: '⚡',
    condicao: (stats) => stats.streak_atual >= 7
  },
  {
    id: 'streak_30',
    titulo: 'Dedicação total',
    descricao: '30 dias seguidos de estudo',
    icone: '🏆',
    condicao: (stats) => stats.streak_atual >= 30
  },
  {
    id: 'questions_50',
    titulo: 'Praticante',
    descricao: '50 questões respondidas',
    icone: '📝',
    condicao: (stats) => stats.total_questoes_respondidas >= 50
  },
  {
    id: 'questions_200',
    titulo: 'Veterano',
    descricao: '200 questões respondidas',
    icone: '🎓',
    condicao: (stats) => stats.total_questoes_respondidas >= 200
  },
  {
    id: 'accuracy_80',
    titulo: 'Precisão cirúrgica',
    descricao: 'Mais de 80% de acertos no geral',
    icone: '🎯',
    condicao: (stats) =>
      stats.total_questoes_respondidas >= 20 &&
      (stats.total_acertos / stats.total_questoes_respondidas) >= 0.8
  }
]

export async function checkAndUnlockAchievements(supabase, userId, stats) {
  const unlocked = stats.conquistas || []
  const unlockedIds = unlocked.map(c => c.id)
  const newlyUnlocked = []

  for (const achievement of ACHIEVEMENTS) {
    if (!unlockedIds.includes(achievement.id) && achievement.condicao(stats)) {
      newlyUnlocked.push({
        id: achievement.id,
        unlocked_at: new Date().toISOString()
      })
    }
  }

  if (newlyUnlocked.length > 0) {
    await supabase.from('user_stats').update({
      conquistas: [...unlocked, ...newlyUnlocked]
    }).eq('user_id', userId)
  }

  return newlyUnlocked // retornar para mostrar toast/celebração
}
```

### 4.4 Componentes de gamificação

**StreakWidget** — exibir no Dashboard e Navbar:
```jsx
function StreakWidget({ streak }) {
  return (
    <motion.div
      className="streak-widget"
      whileHover={{ scale: 1.05 }}
    >
      <motion.span
        key={streak} // re-animar quando muda
        className="streak-bounce"
        style={{ fontSize: '1.2rem' }}
      >
        🔥
      </motion.span>
      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
        {streak}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        dias
      </span>
    </motion.div>
  )
}
```

**AchievementToast** — aparecer quando conquista é desbloqueada:
```jsx
// Usar após checkAndUnlockAchievements retornar conquistas novas
function AchievementToast({ achievement, onClose }) {
  return (
    <motion.div
      className="achievement-toast"
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <span style={{ fontSize: '2rem' }}>{achievement.icone}</span>
      <div>
        <div style={{ fontWeight: 600 }}>Conquista desbloqueada!</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {achievement.titulo} — {achievement.descricao}
        </div>
      </div>
    </motion.div>
  )
}

// CSS para o toast
/*
.achievement-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  box-shadow: var(--shadow-lg), var(--shadow-accent);
  z-index: 9999;
  max-width: 320px;
}
*/
```

**AchievementsPage ou seção na ProgressPage:**
```
SUAS CONQUISTAS

🎯 Primeiro passo      ✅ Desbloqueado
🔥 Três em sequência   ✅ Desbloqueado
⚡ Semana perfeita     🔒 7 dias seguidos (você está no 4°)
🏆 Dedicação total     🔒 30 dias seguidos
📝 Praticante          🔒 50 questões (você respondeu 23)
```

Conquistas bloqueadas mostram progresso parcial quando aplicável.

---

## 5. ATUALIZAÇÕES NA SIDEBAR E NAVBAR

### Sidebar atualizada (adicionar itens novos):
```
[🏠]  Dashboard
[📚]  Matérias
[🏆]  Modo Prova        ← NOVO
[📊]  Meu Progresso
[⭐]  Favoritos         ← NOVO
```

**StreakWidget** no topo da sidebar (desktop) e na Navbar (mobile).

### Navbar — adicionar:
- Streak widget (🔥 N dias) ao lado do avatar
- Link "Modo Prova" como botão de destaque no mobile

---

## 6. ATUALIZAÇÕES NA PÁGINA DE PROGRESSO

Adicionar à página existente (não reescrever — apenas acrescentar):

**Nova seção — Estatísticas gerais:**
```
Total respondidas: 142    Acertos: 98    Taxa: 69%
Maior sequência: 🔥 12 dias    Atual: 🔥 5 dias
```

**Nova seção — Conquistas** (mini-grid com ícones, expandível para ver todas):
```
🎯  🔥  ⚡  🔒  🔒  🔒  🔒
[Ver todas as conquistas]
```

**Nova seção — Histórico de provas (Modo Prova):**
```
Prova · 14/04/2026 · 20 questões · 75% · 47min
Prova · 10/04/2026 · 15 questões · 60% · 35min
```

---

## 7. CHECKLIST DE IMPLEMENTAÇÃO V2

Executar **rigorosamente nesta ordem**:

```
FASE 1 — Correção visual (não pular)
[ ] 1.1  Verificar e corrigir carregamento das fontes no index.html
[ ] 1.2  Garantir todas as variáveis CSS no :root
[ ] 1.3  Criar/substituir src/styles/animations.css completo
[ ] 1.4  Criar src/lib/animations.js com variantes Framer Motion
[ ] 1.5  Aplicar pageVariants em todas as páginas existentes
[ ] 1.6  Aplicar staggerContainer + staggerItem em todas as listas de cards
[ ] 1.7  Adicionar fundo com radial-gradient, scrollbar e ::selection

FASE 2 — Banco de dados
[ ] 2.1  Criar tabela exam_sessions com RLS
[ ] 2.2  Criar tabela favorites com RLS
[ ] 2.3  Criar tabela user_stats com RLS

FASE 3 — Modo Prova
[ ] 3.1  Criar ExamConfigPage (/modo-prova)
[ ] 3.2  Criar ExamSessionPage (/modo-prova/sessao/:id)
[ ] 3.3  Criar ExamResultPage (/modo-prova/resultado/:id)
[ ] 3.4  Adicionar rotas no App.jsx
[ ] 3.5  Adicionar link na Sidebar

FASE 4 — Favoritos
[ ] 4.1  Criar componente FavoriteButton
[ ] 4.2  Inserir FavoriteButton na StudyPage (conteúdo)
[ ] 4.3  Inserir FavoriteButton nas questões (simulado e resultado de prova)
[ ] 4.4  Criar FavoritesPage (/favoritos)
[ ] 4.5  Adicionar link na Sidebar

FASE 5 — Gamificação
[ ] 5.1  Criar src/lib/gamification.js (updateStreak)
[ ] 5.2  Criar src/lib/achievements.js (ACHIEVEMENTS + checkAndUnlock)
[ ] 5.3  Chamar updateStreak ao finalizar simulado e ao marcar conteúdo lido
[ ] 5.4  Chamar checkAndUnlockAchievements após updateStreak
[ ] 5.5  Criar componente StreakWidget
[ ] 5.6  Criar componente AchievementToast
[ ] 5.7  Inserir StreakWidget na Sidebar e Navbar
[ ] 5.8  Adicionar seção de conquistas e estatísticas na ProgressPage

FASE 6 — Teste e refinamento
[ ] 6.1  Testar fluxo completo do Modo Prova (config → sessão → resultado)
[ ] 6.2  Testar favoritar conteúdo e questão, verificar página de favoritos
[ ] 6.3  Testar streak: estudar dois dias seguidos, verificar incremento
[ ] 6.4  Testar unlock de conquista e exibição do toast
[ ] 6.5  Testar em mobile (375px) todas as páginas novas
[ ] 6.6  Verificar que as animações da Fase 1 estão visíveis em todas as páginas
```

---

## 8. REGRAS FINAIS PARA O AGENTE

1. **A Fase 1 (visual) é obrigatória e vem primeiro** — não iniciar features novas antes de concluí-la
2. **Nunca reescrever componentes ou páginas existentes do MVP** — apenas adicionar e estender
3. **Toda nova query ao Supabase** deve ter try/catch e estado de loading
4. **Otimistic updates** são obrigatórios em favoritos e respostas do Modo Prova — a UI deve responder antes do banco confirmar
5. **O Modo Prova não mostra gabarito durante a prova** — apenas no resultado final
6. **Streak deve ser atualizado em um único lugar** (após qualquer evento de estudo), nunca duplicar chamadas
7. **AchievementToast** deve usar AnimatePresence para entrar e sair suavemente, com auto-dismiss em 4 segundos

---

*StudyHub AI — Especificação V2*
*Prioridade: Correção visual → Modo Prova → Favoritos → Gamificação*
*Última revisão: abril/2026*
