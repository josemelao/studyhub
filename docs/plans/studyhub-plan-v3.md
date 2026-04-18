# StudyHub — Plano V3 (Brainstorming)

Este documento contém ideias e planejamentos iniciais para uma futura Fase 3 de desenvolvimento do StudyHub. O objetivo desta fase será focar principalmente na escalabilidade da interface, organização de históricos e ferramentas avançadas de visualização, sem focar ainda em detalhes técnicos de banco de dados.

## 1. Melhoria na Exibição de Históricos (Página Meu Progresso)
Com o tempo, as sessões "Questões Resolvidas" e "Simulados Resolvidos" ficarão gigantes, mesmo contidas em um collapsible. Na V3, faremos o seguinte:
*   **Limitar a Exibição Local:** Passar a exibir apenas as **5 atividades mais recentes** em cada collapsible, focando apenas no que o usuário fez nos últimos dias.
*   **Limpeza Visual:** Inserir um botão de atalho "Ver Histórico Completo", incentivando quem estuda frequentemente a ir para a página detalhada sem poluir a visão geral de progresso.

## 2. Nova Página Dedicada: "Página de Histórico" (`/historico`)
A grande adição da V3 será a criação de uma página inteira e robusta dedicada apenas ao log completo e detalhado de tudo o que o usuário já fez no StudyHub.
*   **Acesso Direto:** Disponível tanto pela Sidebar quanto em links na página "Meu Progresso".
*   **Visualização Completa e Infinita:** Suporte para ver as dezenas ou centenas de provas, simulados e questões feitas no mês ou no ano, implementando paginação inteligente ou rolagem interna.
*   **Filtros Inteligentes (Brainstorming):**
    *   Filtro por Tipo: Alternar a visualização entre Simulados e Questões Avulsas.
    *   Filtro por Período: "Hoje", "Últimos 7 Dias", "Este Ano", etc.
    *   Filtro de Performance: "Apenas resultados acima de 80%", "Destaques", ou "Simulados onde fui mal".
    *   Filtro por Disciplina: Analisar histórico específico em provas de Matemática, Legislação, etc. 

## 3. Padrão Estético e Design
Toda essa nova página precisará manter os padrões premium, usando `framer-motion` para suavizar carregamentos e filtragens dinâmicas.

---
*Status: Apenas planejamento e conceituação (sem modelagem de código no momento).*
