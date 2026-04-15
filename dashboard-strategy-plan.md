# Plano de Inteligência Estratégica: Dashboard Hero

Este documento detalha a transformação do Dashboard do StudyHub de um painel informativo simples para uma ferramenta de análise estratégica de alocação de esforço.

## 1. O Problema
A barra de progresso linear atual (`0/14 módulos`) informa ao usuário apenas a **quantidade bruta** completada. Ela não revela se o usuário está priorizando as matérias corretas baseadas no peso do edital.

## 2. A Solução: Visão de Espelho (Pizzas Comparativas)
Substituiremos a barra linear por dois gráficos de pizza (Doughnut Charts) que permitem comparação instantânea:

### Pizza 1: O Edital (Expectativa)
- **O que mostra**: A distribuição total de tópicos cadastrados no sistema por matéria.
- **Objetivo**: Mostrar o "tamanho do inimigo".

### Pizza 2: O Aluno (Realidade)
- **O que mostra**: A distribuição de tópicos que o usuário **efetivamente concluiu** até agora.
- **Objetivo**: Mostrar onde o esforço real está sendo alocado.

*Nota: Ambas as pizzas ficarão posicionadas lado a lado na parte inferior do Hero Card para máxima visibilidade, mantendo a saudação e infos no topo.*

## 3. Detalhes Técnicos

### Biblioteca de Gráficos
Utilizaremos o **Recharts**, uma biblioteca leve e performática para React que suporta:
- Animações fluidas ao carregar.
- Tooltips personalizados no hover.
- Design responsivo.

### Integração de Cores
Os gráficos usarão as cores definidas pelo Administrador para cada matéria, criando uma conexão visual imediata entre os gráficos e a biblioteca de matérias abaixo.

## 4. Próximos Passos
1. Instalação do pacote `@recharts/recharts`.
2. Refatoração da lógica de dados em `DashboardPage.jsx`.
3. Redesenho do Header (Hero Card) para acomodar os novos elementos visuais.
