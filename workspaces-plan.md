# Plano de Implementação: Arquitetura Multitenant / Workspaces (Editais)

Este documento detalha o plano arquitetural para escalar o StudyHub V4 de um ambiente single-target (atual Banco do Brasil) para um modelo multitenant assente em múltiplos "Workspaces" ou "Editais" (ex: Banco do Brasil, Polícia Federal, Receita Federal, etc).

## 1. Visão Geral e Filosofia

- **Foco Absoluto (Isolamento de Estado):** O ambiente do usuário é atrelado ao Edital ativo. O progresso (%), os históricos, flashcards diários, notas e calendário pertencem exclusivamente a essa bolha.
- **Continuidade Global (Gamificação Mestre):** O esforço do usuário pertence a ele, não à prova. Nível (Level), Experiência (XP Total) e Limitações (Streak diário) viajam através dos painéis e são universais na conta.
- **Setup Híbrido Administrativo:** A barreira de criação de novos painéis será resolvida gerando um "Banco Compartilhado Master" (apenas leitura para alunos, editável pelo Admin). O aluno, ao abrir o "edital Polícia Federal", importa em massa com um clique todo o esqueleto (Matérias, Aulas, Questões) atrelado à PF.

---

## 2. Modelagem do Banco de Dados (Supabase)

A infraestrutura atual será robustecida com a introdução do conceito de `workspaces` e injeção massiva da coluna `workspace_id` (Chave Estrangeira).

### 2.1 Novas Tabelas Mestre
1. **`workspaces`**
   - `id` (UUID), `user_id` (FK), `name` (Ex: "Escrevente TJ-SP"), `icon`, `created_at`
2. **`admin_global_subjects`** e **`admin_global_topics`** e **`admin_global_questions`**
   - Opcional: em vez de renomear, podemos usar as próprias tabelas de matérias atuais com um campo `is_global_template = boolean` ou criar uma biblioteca à parte de "Templates Master". Essa biblioteca guarda os conteúdos universais geridos pelo Admin.

### 2.2 Alterações nas Tabelas Existentes (Injeção de Identidade)
As seguintes tabelas passarão a ter obrigatoriamente a coluna `workspace_id`:
- `materias`
- `topicos`
- `questoes_resolvidas` (Note: O banco original de questões pode ser global para o admin, mas o progresso vinculado é pelo workspace. Se quisermos importar questões pro workspace, cria-se as conexoes aqui)
- `history`
- `daily_topics` (Bento grides e dias do planner)
- `quick_notes`
- O `RLS` (Row Level Security) será ajustado de: `(auth.uid() = user_id)` para `(auth.uid() = user_id AND workspace_id = requested_id)`.

### 2.3 Mantido Globalmente
- `user_stats` (XP, nível atual)
- `user_streaks`
- `user_achievements`

---

## 3. Arquitetura do Frontend (React & Zustand)

A barreira mais crítica desta implementação é assegurar que os dados **não vazem** de um `workspace_id` para outro em tela após a troca no dropdown.

### 3.1 Store de Gerenciamento (`useWorkspaceStore`)
```javascript
// A central de comando sobre em qual edital estamos operando.
const useWorkspaceStore = create((set) => ({
  workspaces: [],
  currentWorkspaceId: localStorage.getItem('studyhub_active_ws') || null,
  setWorkspace: (id) => {
    localStorage.setItem('studyhub_active_ws', id)
    set({ currentWorkspaceId: id })
    // INVOCAR FUNÇÃO DE CLEANUP GLOBAL
    resetApplicationState(); 
  }
}))
```

### 3.2 O "Reset Application State" (Prevenção de Vazamento)
Quando o seletor da navbar for trocado (Ex: De BB para PF), dispararemos purges (`store.reset()`) em todos os stores secundários: `useMateriasStore.getState().reset()`, `usePlannerStore.getState().reset()`.
Efeitos Reactive (`useEffect(..., [currentWorkspaceId])`) nos componentes das páginas notarão a troca e repuxarão os conteúdos frescos passando o novo `workspaceId` no load do backend.

---

## 4. O Fluxo de Gerenciamento de Conteúdo (Admin vs Usuário)

### 4.1 Acesso Privilegiado
- Todo o sistema de "Gerenciar Conteúdo" (adição livre de apostilas, envio de arquivos, criação crua de questões) passa a ser protegido por uma Role Base Access Control (RBAC). Apenas você (Admin) poderá adicionar disciplinas ali.

### 4.2 Fluxo de Criação de Novo Concurso
1. O Usuário acessa seu perfil ou Navbar e clica em **"Adicionar Concurso/Edital"**.
2. Aparecerão cards de pacotes fechados disponíveis providenciados pelo Admin (ex: "Pacote INSS", "Pacote Banco do Brasil").
3. Quando o usuário clica em **Importar Edital**:
   - Uma *Supabase RPC* function rola silenciosamente no servidor.
   - Ela lê os Módulos do `global_subjects` e copia (clone relacional) injetando-os como propriedades diretas do `workspace_id` e `user_id` daquele candidato.
   - O aluno recebe os conteúdos estruturados em seu painel, 100% "zerados" e virgens no ponto de vista de preenchimento (progressão, acertos e revisões em 0%).
   - Se o aluno já fez uma questão idêntica nos "seus" painéis antigos, o fato não conta. Ele precisará estudar novamente este assunto recriminado no seu novo edital. Acorda pro jogo!

---

## 5. Roteiro de Migração (Fases)

**Fase 1: Preparação do Terreno (Supabase)**
- Atualização do banco de dados no Supabase. Criação da tabela `workspaces` e injeção do FK nas tabelas operacionais em uma migration.
- Atualização das Policies RLS para evitar quebras e acomodar o novo id em cascata.

**Fase 2: Frontend Global Config**
- Criação e montagem da loja `useWorkspaceStore`.
- Adição prática visual na `Navbar` de um seletor que lê os Workspaces e permite transicionar a store (mas que de momento faz o app engasgar).

**Fase 3: Refatoração Massiva (Propagação)**
- Injetar em **todas** as queries (seja Zustand actions ou services com supabase js) o filtro `.eq('workspace_id', currentWorkspaceId)`. Nas inserções `.insert({ ..., workspace_id: id })`.

**Fase 4: A Área Global/Admin (Importação)**
- Largar o botão 'adicionar edital' no UI;
- Montar a lógica Server Side RPC para a duplicação em massa do pacote Admin para as tabelas próprias do respectivo Workspace/User.
- Condicionar "Gerenciamento de Conteúdo" à autorização "Admin".

---
*Este plano garante que um único deploy opere com arquitetura robusta de multi-concursos, maximizando foco de UX e reduzindo fricções de recriação de tabelas e escopos para usuários repetentes em outras rotas.*
