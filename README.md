# 🎓 StudyHub - Plataforma Inteligente para Concurseiros

O **StudyHub** é uma aplicação web moderna projetada para centralizar e otimizar a rotina de estudos para concursos públicos. Com foco em visualização de progresso e produtividade, a plataforma oferece ferramentas estratégicas para estudantes e administradores.

![StudyHub Dashboard Preview](src/assets/preview.png) *(Nota: Adicione seu screenshot aqui posteriormente)*

## 🚀 Funcionalidades Principais

### Para o Estudante
- **Dashboard Estratégico**: Visualização bento-style com progresso do edital vs. realidade de estudo.
- **Gerenciamento de Matérias**: Acompanhamento detalhado de tópicos concluídos e aproveitamento.
- **Planejador Dinâmico**: Organização de cronograma semanal.
- **Modo Praticar**: Resolução de questões e acompanhamento de desempenho por matéria.
- **Inbox de Favoritos & Histórico**: Acesso rápido a conteúdos salvos e acompanhamento de evolução.
- **Central de Ajuda & Feedback**: Sistema integrado para reporte de bugs e sugestões.

### Para o Admin
- **Gerenciador de Conteúdo**: Ferramenta robusta para importação de arquivos Word (.docx) e criação de apostilas em Markdown.
- **Feedback Inbox**: Painel centralizado para gerenciar solicitações de usuários com filtros por status e tipo.

## 🛠️ Tech Stack

- **Frontend**: React.js + Vite
- **Estilização**: CSS Moderno (Variáveis, Glassmorphism, Design Responsivo)
- **Animações**: Framer Motion
- **Gráficos**: Recharts (Otimizados para performance e acessibilidade)
- **Backend & Auth**: Supabase
- **Ícones**: Lucide React

## 📦 Instalação e Setup

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/josemelao/studyhub.git
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz com as credenciais do seu projeto Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_key_aqui
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

## 📈 Melhorias Recentes (V4)

- **Correção Visual Recharts**: Remoção de outlines indesejados e alertas de dimensão via ResizeObserver hooks.
- **Suporte Sólido**: Transição de elementos glassmorphism para cores sólidas em cards críticos para melhor legibilidade.
- **Sistema de Feedback**: Implementação de formulário global com portal e banco de dados Supabase dedicado.
- **Otimização de Performance**: Lazy loading de componentes e cache de dados do edital.

---
Desenvolvido com ❤️ para transformar a jornada de aprovação.
