# StudyHub AI — Especificação Técnica Completa
> Documento de referência para o agente Antigravity construir o MVP completo.
> Leia este documento integralmente antes de iniciar qualquer tarefa.

---

## 1. VISÃO DO PRODUTO

### O que é o StudyHub
Uma plataforma web de estudos para concursos públicos que centraliza conteúdo estruturado (resumos, apostilas) e prática ativa (simulados), com acompanhamento de progresso por tópico. O conteúdo é produzido externamente via NotebookLM e inserido manualmente no banco de dados.

### Usuário-alvo
Concurseiros que precisam organizar o estudo por edital, ler conteúdo de forma estruturada e praticar com questões — tudo em um só lugar.

### Primeiro concurso: Banco do Brasil (BB)
O MVP será construído com as matérias do edital do Banco do Brasil. A arquitetura deve suportar múltiplos concursos no futuro sem retrabalho.

### Princípios do produto
- Simples > complexo
- Conteúdo de qualidade > quantidade
- Prática ativa > leitura passiva
- Orientação clara > liberdade total (o app diz o que estudar)

---

## 2. STACK TÉCNICA

### Frontend
- **React** com **Vite** como bundler
- **Tailwind CSS** para estilização base
- **React Router v6** para navegação (SPA)
- **React Markdown** + **remark-gfm** para renderização de conteúdo
- **Framer Motion** para animações e transições
- **Lucide React** para ícones
- CSS customizado via variáveis para o design system

### Backend / Infra
- **Supabase** para tudo: Auth, PostgreSQL, Storage, RLS
- Sem backend próprio no MVP — tudo via Supabase client direto

### Dependências principais
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "@supabase/supabase-js": "^2",
    "react-markdown": "^9",
    "remark-gfm": "^4",
    "framer-motion": "^11",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
```

### Variáveis de ambiente (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 3. BANCO DE DADOS — SCHEMA COMPLETO

> Importante: Criar TODAS as tabelas com Row Level Security (RLS) habilitado.
> Executar as migrations na ordem abaixo.

### 3.1 Tabela: `concursos`
Suporte a múltiplos concursos desde o início.
```sql
CREATE TABLE concursos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,                    -- ex: "Banco do Brasil 2024"
  sigla TEXT NOT NULL,                   -- ex: "BB"
  descricao TEXT,
  ano INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Tabela: `subjects` (matérias)
```sql
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concurso_id UUID REFERENCES concursos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,                    -- ex: "Matemática Financeira"
  descricao TEXT,
  categoria TEXT,                        -- ex: "Conhecimentos Básicos"
  ordem INTEGER DEFAULT 0,              -- ordem de exibição no edital
  icone TEXT,                           -- nome do ícone Lucide
  cor TEXT,                             -- cor hex para o card
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Tabela: `topics` (tópicos)
```sql
CREATE TABLE topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Tabela: `contents` (conteúdo dos tópicos)
```sql
CREATE TABLE contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('resumo', 'apostila', 'flashcard')),
  titulo TEXT,
  conteudo TEXT NOT NULL,               -- markdown
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 Tabela: `questions` (questões dos simulados)
```sql
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  opcoes JSONB NOT NULL,                -- array: [{"letra": "A", "texto": "..."}]
  resposta_correta TEXT NOT NULL,       -- "A", "B", "C", "D" ou "E"
  explicacao TEXT,
  nivel TEXT DEFAULT 'medio' CHECK (nivel IN ('facil', 'medio', 'dificil')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.6 Tabela: `user_progress` (progresso do usuário)
```sql
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  conteudo_lido BOOLEAN DEFAULT false,
  total_questoes INTEGER DEFAULT 0,
  acertos INTEGER DEFAULT 0,
  last_studied_at TIMESTAMPTZ,
  UNIQUE(user_id, topic_id)
);
```

### 3.7 Tabela: `user_answers` (respostas individuais para revisão)
```sql
CREATE TABLE user_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  resposta_dada TEXT NOT NULL,
  correta BOOLEAN NOT NULL,
  respondida_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.8 Row Level Security (RLS)
```sql
-- Habilitar RLS em todas as tabelas de usuário
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só acessa seus próprios dados
CREATE POLICY "user_progress_own" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_answers_own" ON user_answers
  FOR ALL USING (auth.uid() = user_id);

-- Conteúdo é público para leitura (autenticados)
ALTER TABLE concursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_concursos" ON concursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "public_read_subjects" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "public_read_topics" ON topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "public_read_contents" ON contents FOR SELECT TO authenticated USING (true);
CREATE POLICY "public_read_questions" ON questions FOR SELECT TO authenticated USING (true);
```

---

## 4. ESTRUTURA DE ARQUIVOS DO PROJETO

```
studyhub/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css                  # variáveis CSS globais + reset
│   ├── lib/
│   │   └── supabase.js            # cliente Supabase
│   ├── contexts/
│   │   └── AuthContext.jsx        # contexto de autenticação global
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProgress.js
│   │   └── useSubjects.js
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── PageWrapper.jsx
│   │   └── study/
│   │       ├── TopicCard.jsx
│   │       ├── QuestionCard.jsx
│   │       ├── ResultSummary.jsx
│   │       └── ProgressStats.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── SubjectPage.jsx
│   │   ├── StudyPage.jsx
│   │   ├── SimuladoPage.jsx
│   │   └── ProgressPage.jsx
│   └── styles/
│       ├── animations.css
│       └── markdown.css           # estilos para o conteúdo renderizado
├── .env
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 5. DESIGN SYSTEM E UI

### 5.1 Identidade Visual

**Direção estética:** Refinada, moderna e focada em leitura. Inspirada em apps de leitura premium (Readwise, Linear) com toques de warmth para não ficar fria demais. Dark mode por padrão com suporte a light mode.

**Tipografia:**
- Display / títulos: `'Instrument Serif'` (Google Fonts) — elegante, com personalidade
- Corpo / UI: `'DM Sans'` (Google Fonts) — legível, moderno, não genérico
- Código / markdown: `'JetBrains Mono'` (Google Fonts)

**Paleta de cores — Dark mode (padrão):**
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

  /* Accent — âmbar quente */
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

  /* Bordas e divisores */
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

**Light mode:**
```css
[data-theme="light"] {
  --bg-primary: #fafaf8;
  --bg-secondary: #f4f3ef;
  --bg-tertiary: #eeece7;
  --bg-elevated: #ffffff;
  --text-primary: #1a1a1e;
  --text-secondary: #5c5b66;
  --text-muted: #9e9da8;
  --border: rgba(0, 0, 0, 0.08);
  --border-hover: rgba(0, 0, 0, 0.15);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.12);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.15);
}
```

### 5.2 Animações e Motion

**Princípios:**
- Animações devem ter propósito, não ser decorativas
- Page transitions suaves (fade + slide leve)
- Micro-interações em botões, cards, progress bars
- Skeleton loading ao invés de spinners sempre que possível
- Staggered reveal em listas (items aparecem em cascata)

**Framer Motion — variantes reutilizáveis:**
```jsx
// src/lib/animations.js
export const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } }
}

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }
}

export const slideFromRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
}
```

**Progress bar animada:**
```css
.progress-bar-fill {
  transition: width var(--transition-slow);
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  border-radius: 999px;
  position: relative;
  overflow: hidden;
}

.progress-bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
```

**Hover em cards:**
```css
.study-card {
  transition: transform var(--transition-base), 
              box-shadow var(--transition-base),
              border-color var(--transition-base);
}

.study-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-hover);
}
```

**Feedback de questão (certo/errado):**
```css
@keyframes correctPulse {
  0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  70% { box-shadow: 0 0 0 12px rgba(74, 222, 128, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
}

@keyframes wrongShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.answer-correct { animation: correctPulse 0.6s ease-out; }
.answer-wrong { animation: wrongShake 0.4s ease-out; }
```

### 5.3 Layout Responsivo

**Breakpoints:**
- Mobile: < 768px — stack vertical, sidebar colapsada
- Tablet: 768px–1024px — layout híbrido
- Desktop: > 1024px — sidebar + conteúdo principal

**Layout geral (desktop):**
```
┌─────────────────────────────────────────────────────┐
│  Navbar (top, 56px, fixo)                           │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│   Sidebar    │   Conteúdo Principal                 │
│   (240px)    │   (flex-1, max-w-4xl, centralizado)  │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

**Mobile:** Sem sidebar. Navbar com botão de menu hamburguer que abre um drawer animado vindo da esquerda.

---

## 6. PÁGINAS — ESPECIFICAÇÃO DETALHADA

### 6.1 LoginPage (`/login`)

**Comportamento:**
- Se usuário já autenticado → redirecionar para `/dashboard`
- Única opção de login: Google OAuth via Supabase
- Após login bem-sucedido → redirecionar para `/dashboard`

**Layout:**
- Tela dividida: lado esquerdo com branding e frases de motivação (desktop), lado direito com form de login
- No mobile: tela inteira centrada
- Fundo com gradiente sutil animado (mesh gradient lento)

**Conteúdo da tela:**
```
Logo "StudyHub" em Instrument Serif
Tagline: "Seu edital. Seu ritmo. Seu resultado."

[Botão grande] Entrar com Google
[Texto pequeno] Gratuito para concurseiros
```

**Código do botão Google:**
```jsx
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  })
  if (error) console.error(error)
}
```

---

### 6.2 DashboardPage (`/dashboard`)

**Dados necessários (queries Supabase):**
1. Buscar todos os `subjects` do concurso ativo com `topics` vinculados
2. Buscar `user_progress` do usuário logado
3. Calcular progresso agregado por matéria
4. Buscar último tópico estudado (via `last_studied_at`)

**Seções da página (de cima para baixo):**

**Seção A — Header personalizado**
```
Bom dia, [nome]! 👋
Banco do Brasil — [X] dias até a prova (se configurado)
```

**Seção B — Continuar estudando**
Card destacado com o último tópico acessado.
```
← [ícone matéria]  Continuando: Juros Simples
   Matemática Financeira
   [Barra de progresso: 45% de acertos]
   [Botão] Continuar estudando →
```
Se não há histórico: exibir card de boas-vindas com CTA para começar pela primeira matéria.

**Seção C — Seu progresso geral**
Número grande com % geral de tópicos iniciados e média de acertos nos simulados.
```
[72%]  tópicos estudados    [68%]  média de acertos
```

**Seção D — Matérias (grid de cards)**
Grid 2–3 colunas (responsivo). Cada card:
```
[cor da matéria] [ícone]
Matemática Financeira
████████░░  8/12 tópicos
64% de acertos
[botão] Estudar →
```

Cards em stagger animation ao carregar (Framer Motion).

---

### 6.3 SubjectPage (`/materia/:subjectId`)

**Dados necessários:**
1. Buscar `subject` com nome, descrição
2. Buscar todos `topics` ordenados por `ordem`
3. Buscar `user_progress` do usuário para cada topic

**Layout:**
- Header com nome da matéria, categoria e progresso geral da matéria
- Lista de tópicos com status visual

**Status de cada tópico:**
- `não iniciado` — ícone ○ cinza
- `em andamento` — ícone ◑ âmbar (conteúdo lido mas simulado incompleto)
- `concluído` — ícone ● verde (conteúdo lido + simulado feito)

**Card de tópico:**
```
[status icon]  Juros Simples
               3 questões respondidas · 67% de acertos
               [Botão] Estudar
```

Ao clicar em "Estudar" → navegar para `/estudo/:topicId`

---

### 6.4 StudyPage (`/estudo/:topicId`) — PÁGINA PRINCIPAL

Esta é a página mais importante do app. Integra leitura + simulado em fluxo contínuo.

**Dados necessários:**
1. Buscar `topic` atual com `subject` pai
2. Buscar `content` do tipo `resumo` do tópico
3. Buscar tópico anterior e próximo (para navegação)
4. Buscar `user_progress` do usuário para este tópico

**Layout — duas abas:**

**Aba "Conteúdo"**
- Conteúdo markdown renderizado com `react-markdown`
- Tipografia otimizada para leitura (line-height 1.75, max-width 65ch)
- Botão flutuante fixo no fundo: `"✓ Li o conteúdo — Ir para o simulado"`
- Ao clicar no botão: marcar `conteudo_lido = true` no Supabase + mudar para aba "Simulado"

**Aba "Simulado"**
Ver seção 6.5 (SimuladoPage embutido)

**Navegação entre tópicos:**
```
← Tópico anterior          Tópico seguinte →
```

**Marcar conteúdo como lido:**
```jsx
const markAsRead = async () => {
  await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      topic_id: topicId,
      conteudo_lido: true,
      last_studied_at: new Date().toISOString()
    }, { onConflict: 'user_id,topic_id' })
}
```

---

### 6.5 SimuladoPage (embutido na StudyPage, aba "Simulado")

**Dados necessários:**
1. Buscar todas `questions` do `topic_id`
2. Embaralhar questões (Fisher-Yates shuffle no frontend)

**Fluxo do simulado:**

```
Estado 1: Questão exibida, nenhuma resposta selecionada
  [enunciado]
  (A) opção A
  (B) opção B
  (C) opção C
  (D) opção D
  (E) opção E

Estado 2: Usuário clica em uma opção
  → Se correta: opção fica verde + animação correctPulse
  → Se errada: opção fica vermelha + animação wrongShake + mostrar opção correta em verde
  → Exibir caixa de explicação (expand animado)
  → Botão "Próxima questão" aparece

Estado 3: Todas questões respondidas → exibir ResultSummary
```

**Salvar resposta no Supabase:**
```jsx
const saveAnswer = async (questionId, respostaDada, correta) => {
  // Salvar na tabela user_answers
  await supabase.from('user_answers').insert({
    user_id: user.id,
    question_id: questionId,
    resposta_dada: respostaDada,
    correta
  })

  // Atualizar agregado em user_progress
  const { data: prog } = await supabase
    .from('user_progress')
    .select('total_questoes, acertos')
    .eq('user_id', user.id)
    .eq('topic_id', topicId)
    .single()

  await supabase.from('user_progress').upsert({
    user_id: user.id,
    topic_id: topicId,
    total_questoes: (prog?.total_questoes || 0) + 1,
    acertos: (prog?.acertos || 0) + (correta ? 1 : 0),
    last_studied_at: new Date().toISOString()
  }, { onConflict: 'user_id,topic_id' })
}
```

**ResultSummary (componente ao final do simulado):**
```
🎯  Resultado do simulado

   7 / 10 acertos    70%

[Barra de progresso animada]

✅ Matemática Financeira · Juros Simples

[Botão primário]   Próximo tópico →
[Botão secundário] Rever questões erradas
[Botão terciário]  Refazer simulado
```

---

### 6.6 ProgressPage (`/progresso`)

**Dados necessários:**
1. Buscar `user_progress` de todos os tópicos do usuário
2. Agrupar por matéria e calcular médias
3. Buscar últimas respostas erradas via `user_answers` onde `correta = false`

**Seções:**

**Seção A — Visão geral**
```
Progresso geral:  ████████░░  72%
Média de acertos: ██████░░░░  64%
Tópicos estudados: 18 de 25
```

**Seção B — Por matéria**
Accordion ou cards expandíveis. Cada matéria mostra:
- % tópicos estudados
- % média de acertos
- Tópicos com menor desempenho destacados em âmbar

**Seção C — Revisão inteligente**
Lista de questões que o usuário errou (máximo 20 mais recentes).
```
[Q] Qual a fórmula do juro composto?
    Matemática Financeira · Juros Compostos
    Você respondeu: B  |  Correta: D
    [Botão] Refazer esta questão
```

---

## 7. COMPONENTES UI — ESPECIFICAÇÃO

### Button
```jsx
// Variantes: primary | secondary | ghost | danger
// Tamanhos: sm | md | lg
// Estado: loading (spinner interno), disabled

<Button variant="primary" size="md" loading={false}>
  Continuar estudando
</Button>
```

Estilo do botão primário:
```css
.btn-primary {
  background: var(--accent);
  color: #0f0f11;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: transform var(--transition-fast),
              box-shadow var(--transition-fast),
              background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-accent);
}

.btn-primary:active {
  transform: translateY(0);
}
```

### ProgressBar
```jsx
<ProgressBar 
  value={65}           // 0-100
  showLabel={true}     // exibir "65%"
  color="accent"       // accent | success | warning
  size="md"            // sm | md | lg
  animated={true}      // shimmer effect
/>
```

### Card
```jsx
// Variantes: default | elevated | interactive (hover effects)
<Card variant="interactive" onClick={handleClick}>
  {children}
</Card>
```

### Badge (status do tópico)
```jsx
// Variantes: not-started | in-progress | completed
<Badge status="completed">Concluído</Badge>
```

### LoadingSkeleton
Usar skeleton screens ao invés de spinners para carregamento de listas e cards.
```jsx
// Pulso animado via CSS
<SkeletonCard />  // placeholder animado do card de matéria
<SkeletonList />  // placeholder da lista de tópicos
```

### MarkdownRenderer
```jsx
// Wrap do react-markdown com estilos customizados
<MarkdownRenderer content={topic.conteudo} />
```

Estilos markdown (arquivo `src/styles/markdown.css`):
```css
.markdown-body {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--text-primary);
  max-width: 65ch;
}

.markdown-body h1, .markdown-body h2 {
  font-family: 'Instrument Serif', serif;
  color: var(--text-primary);
  margin-top: 2rem;
}

.markdown-body h2 {
  font-size: 1.5rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}

.markdown-body strong {
  color: var(--accent);
  font-weight: 600;
}

.markdown-body blockquote {
  border-left: 3px solid var(--accent);
  background: var(--accent-subtle);
  padding: 1rem 1.25rem;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin: 1.5rem 0;
}

.markdown-body code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-tertiary);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.875em;
}

.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.markdown-body th {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
}

.markdown-body td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
}
```

---

## 8. NAVEGAÇÃO E ROTEAMENTO

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Rotas protegidas — redireciona para /login se não autenticado
// Rotas públicas — redireciona para /dashboard se já autenticado

const routes = [
  { path: '/login',          component: LoginPage,      protected: false },
  { path: '/dashboard',      component: DashboardPage,  protected: true  },
  { path: '/materia/:id',    component: SubjectPage,    protected: true  },
  { path: '/estudo/:id',     component: StudyPage,      protected: true  },
  { path: '/progresso',      component: ProgressPage,   protected: true  },
  { path: '/',               redirect: '/dashboard'                       },
]
```

**Page transitions com AnimatePresence:**
```jsx
<AnimatePresence mode="wait">
  <Routes location={location} key={location.pathname}>
    {/* rotas aqui */}
  </Routes>
</AnimatePresence>
```

Cada page deve ter como elemento raiz:
```jsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.2 }}
>
  {/* conteúdo */}
</motion.div>
```

---

## 9. AUTENTICAÇÃO — FLUXO COMPLETO

### AuthContext
```jsx
// src/contexts/AuthContext.jsx
// Deve expor: user, session, loading, signOut

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listener de mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### ProtectedRoute
```jsx
// Redireciona para /login se não autenticado
// Exibe loading spinner enquanto verifica sessão
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}
```

---

## 10. NAVBAR E SIDEBAR

### Navbar (topo, fixo, 56px)
```
[Logo "SH"]  StudyHub          [ícone progresso] [avatar] [tema toggle]
```

No mobile: botão hamburguer à direita abre sidebar como drawer.

### Sidebar (desktop, 240px)
Links de navegação:
```
[🏠]  Dashboard
[📚]  Matérias
      ├─ Matemática Financeira
      ├─ Língua Portuguesa
      ├─ Conhecimentos Bancários
      └─ ... (expansível)
[📊]  Meu Progresso
[⚙️]  Configurações (futuro)
```

A sidebar deve mostrar o concurso ativo no topo:
```
CONCURSO ATIVO
Banco do Brasil 2024
▼ trocar
```

---

## 11. DADOS INICIAIS (SEED)

Inserir os seguintes dados como ponto de partida para o concurso Banco do Brasil:

### Concurso
```sql
INSERT INTO concursos (nome, sigla, descricao, ano) VALUES
('Banco do Brasil 2024', 'BB', 'Escriturário - Agente de Tecnologia', 2024);
```

### Matérias do edital do BB (exemplos — expandir conforme edital real)
```sql
INSERT INTO subjects (concurso_id, nome, categoria, ordem, cor) VALUES
([id_bb], 'Matemática Financeira', 'Conhecimentos Básicos', 1, '#f5a623'),
([id_bb], 'Língua Portuguesa', 'Conhecimentos Básicos', 2, '#60a5fa'),
([id_bb], 'Raciocínio Lógico', 'Conhecimentos Básicos', 3, '#a78bfa'),
([id_bb], 'Conhecimentos Bancários', 'Conhecimentos Específicos', 4, '#34d399'),
([id_bb], 'Atualidades do Mercado Financeiro', 'Conhecimentos Específicos', 5, '#f472b6'),
([id_bb], 'Tecnologia da Informação', 'Conhecimentos Específicos', 6, '#fb923c');
```

---

## 12. BOAS PRÁTICAS E REGRAS GERAIS

### Código
- Usar **functional components** e **hooks** exclusivamente (sem class components)
- Toda chamada ao Supabase deve ter tratamento de erro com try/catch
- Estados de loading devem ser tratados em todas as queries
- Não expor `SUPABASE_SERVICE_ROLE_KEY` jamais no frontend
- Usar `upsert` com `onConflict` para evitar duplicatas em `user_progress`

### Performance
- Lazy loading de páginas com `React.lazy` + `Suspense`
- Evitar re-renders desnecessários com `useMemo` e `useCallback` onde relevante
- Skeleton screens para qualquer lista ou grid que busque dados

### Acessibilidade
- Todos os botões com `aria-label` descritivo
- Foco visível em todos os elementos interativos
- Contraste mínimo 4.5:1 para textos normais

### Mobile First
- Testar layout em 375px de largura
- Touch targets mínimos de 44x44px
- Evitar hover-only interactions

---

## 13. O QUE NÃO IMPLEMENTAR NO MVP

Deixar fora do escopo atual (para V2):
- ❌ Modo Prova com timer (múltiplas matérias + cronômetro)
- ❌ Favoritos (salvar conteúdos/questões)
- ❌ Gamificação (streaks, conquistas, pontos)
- ❌ Social (ranking, perfis públicos)
- ❌ IA em tempo real (geração de questões, explicações dinâmicas)
- ❌ Notificações / lembretes
- ❌ Upload de PDF pelo usuário
- ❌ Painel administrativo para inserção de conteúdo (conteúdo inserido direto no Supabase)

---

## 14. CHECKLIST DE IMPLEMENTAÇÃO (ordem recomendada)

```
[ ] 1. Configurar projeto Vite + React + Tailwind + Framer Motion
[ ] 2. Configurar Supabase: criar projeto, rodar migrations do schema
[ ] 3. Configurar autenticação Google no Supabase Dashboard
[ ] 4. Implementar AuthContext + ProtectedRoute
[ ] 5. Implementar LoginPage
[ ] 6. Implementar layout base (Navbar + Sidebar + PageWrapper)
[ ] 7. Implementar DashboardPage (sem dados reais — mock primeiro)
[ ] 8. Implementar SubjectPage
[ ] 9. Implementar StudyPage — aba Conteúdo
[ ] 10. Implementar SimuladoPage (aba Simulado na StudyPage)
[ ] 11. Implementar ProgressPage
[ ] 12. Inserir seed data (concurso, matérias, tópicos)
[ ] 13. Inserir conteúdo real de um tópico completo para teste
[ ] 14. Inserir questões reais de um tópico completo para teste
[ ] 15. Teste de fluxo completo: login → estudar → simulado → progresso
[ ] 16. Ajustes de responsividade mobile
[ ] 17. Deploy (Vercel ou Netlify)
```

---

## 15. DEPLOY

### Vercel (recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no painel Vercel:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

### Configuração do Supabase para produção
No painel do Supabase → Authentication → URL Configuration:
```
Site URL: https://seu-dominio.vercel.app
Redirect URLs: https://seu-dominio.vercel.app/dashboard
```

---

*Documento gerado como especificação técnica para desenvolvimento com Antigravity + Supabase MCP.*
*Versão MVP — Banco do Brasil. Última revisão: abril/2026.*
