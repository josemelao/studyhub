# Projeto StudyHub: Hub de Conteúdo Gerenciado (Admin-led)

Este documento detalha o planejamento estratégico para transformar o StudyHub em um portal de estudos centralizado, onde o conteúdo é fornecido pelo Administrador e consumido individualmente pelos alunos.

---

## 🏗️ 1. Conceito do Modelo
O objetivo é que o dono da plataforma (Admin) seja o único responsável por cadastrar os cursos (Workspaces), matérias, tópicos e materiais (vídeos/PDFs). 
Qualquer pessoa convidada que se cadastrar na plataforma terá acesso imediato a esses cursos, mas apenas como "leitor". Cada aluno mantém seu próprio progresso, notas e cronograma de forma isolada.

## 🛡️ 2. Arquitetura de Segurança (RLS)
Para garantir que alunos não alterem o conteúdo oficial ou vejam o progresso uns dos outros, as seguintes políticas de Row Level Security (RLS) no Supabase serão implementadas:

### A. Tabelas de Conteúdo (`subjects`, `topics`, `contents`, `questions`)
*   **Acesso de Leitura:** Aberto para qualquer usuário autenticado.
*   **Acesso de Escrita:** Restrito exclusivamente ao UUID do Administrador (`be6923f3-dcb4-4536-823b-601df1578036`).

### B. Tabelas de Workspaces (`workspaces`)
*   **Visibilidade:** Todos os usuários autenticados podem listar os workspaces oficiais.
*   **Gestão:** A criação de novos workspaces é bloqueada para usuários comuns, garantindo que o Hub mantenha a estrutura definida pelo Admin.

### C. Tabelas de Progresso Individual (`user_progress`, `user_notes`, `study_plans`)
*   **Privacidade:** Isolamento total por `user_id`. O banco de dados garante que um usuário NUNCA consiga ler as notas ou o progresso de outro usuário, mesmo dentro do mesmo curso.

## 💻 3. Mudanças na Interface (UX)

### A. Sidebar Inteligente
*   O link **"Gerenciar Conteúdo"** será condicional. Só será visível se `user.id === ADMIN_ID`.
*   Botões de "Criar Matéria" ou "Novo Workspace" serão removidos ou desativados para alunos.

### B. Onboarding Simplificado
*   Usuários novos não passarão pelo fluxo de criação de workspace. Eles serão direcionados diretamente para o Dashboard do workspace principal (ex: "Banco do Brasil").

## 🏁 4. Plano de Execução
1.  **Backend:** Executar o script SQL de atualização das políticas de RLS.
2.  **Frontend:** Atualizar `Sidebar.jsx` com a verificação de Admin.
3.  **Frontend:** Ajustar roteamento em `App.jsx` para lidar com novos registros sem workspace próprio.

---
**Nota:** Este plano foi registrado e está pronto para execução imediata assim que aprovado.
