# Plano de Implementação: Página "Meu Progresso"

## Objetivo

Reestruturar a página `Meu Progresso` para que ela seja uma tela analítica de evolução, usando métricas que o app já possui hoje e gráficos do `Recharts` que façam sentido real para o domínio do produto.

Esta página deve responder com clareza:

- como o usuário está evoluindo ao longo do tempo
- como está o volume de prática
- como está o desempenho por matéria
- como está o avanço no edital por matéria

Esta página não deve tentar ser dashboard operacional diário. Esse papel continua sendo do `Dashboard`.

## Escopo

Implementar a nova versão da página `Meu Progresso` com:

- KPIs resumidos no topo
- gráfico principal de evolução temporal
- gráficos secundários de volume e simulados
- gráficos setorizados por matéria
- seção de conquistas

Remover da página:

- mini histórico de questões
- mini histórico de simulados

Motivo:

- já existe a página `Histórico`
- esses blocos ocupam espaço com informação operacional repetida
- a página `Meu Progresso` deve ficar focada em análise agregada e evolução, não em listagem recente

## Fonte de dados já disponível no app

O plano deve usar apenas métricas já existentes no produto:

- `workspace_stats`
  - `total_questoes_respondidas`
  - `total_acertos`
  - `conquistas`

- `user_stats`
  - `streak_atual`
  - `streak_max`
  - `pontos_xp`

- `quiz_sessions`
  - `questions_total`
  - `questions_correct`
  - `score_percent`
  - `completed_at`
  - relacionamento com `topics`
  - relacionamento com `topics.subjects`

- `exam_sessions`
  - `score_percent`
  - `finalizada_em`
  - `status`
  - `questoes`
  - `tempo_gasto_segundos`

- `user_progress`
  - `conteudo_lido`
  - `acertos`
  - `total_questoes`

- `subjects` via `SubjectsContext`
  - `topicsDone`
  - `topicsTotal`
  - `nome`
  - `cor`

## Estrutura final da página

Ordem final recomendada:

1. Cabeçalho da página
2. Bloco de KPIs resumidos
3. Bloco principal: evolução de desempenho no tempo
4. Bloco secundário: volume de prática e desempenho em simulados
5. Bloco setorial: desempenho por matéria e progresso por matéria
6. Bloco de conquistas

## Diretrizes gerais de implementação

- Não misturar métricas de natureza diferente no mesmo gráfico
- Separar claramente:
  - desempenho
  - volume
  - progresso no edital
- Usar no máximo 2 gráficos por linha
- Priorizar leitura antes de impacto visual
- Usar animações leves:
  - entrada
  - desenho inicial das séries
  - hover
- Não exagerar em sombras, ornamentos ou overlays
- Usar cores por semântica:
  - `accent` para desempenho principal
  - `success` para progresso positivo
  - `blue` ou variação neutra para séries secundárias
  - cores das matérias quando houver breakdown por disciplina

## Bloco 1: Cabeçalho

### Objetivo

Manter o topo da página simples e direto, apresentando a proposta analítica da tela.

### Conteúdo

- título: `Meu Progresso`
- subtítulo curto:
  - exemplo: `Acompanhe sua evolução, consistência e desempenho por matéria.`

### Observações de layout

- não transformar o cabeçalho em hero grande
- manter hierarquia visual limpa

## Bloco 2: KPIs resumidos

### Objetivo

Entregar leitura rápida antes dos gráficos.

### Conteúdo

Manter 4 KPIs:

- `Taxa geral de acerto`
- `Questões respondidas`
- `Simulados finalizados`
- `Streak atual`

### Fonte de dados

- `Taxa geral de acerto`
  - `workspace_stats.total_acertos / workspace_stats.total_questoes_respondidas`

- `Questões respondidas`
  - `workspace_stats.total_questoes_respondidas`

- `Simulados finalizados`
  - quantidade de registros em `exam_sessions` com `status = 'finalizada'`

- `Streak atual`
  - `user_stats.streak_atual`

### Regras de exibição

- quando não houver dados:
  - usar `0` para contagens
  - usar `--` para percentuais impossíveis de calcular

### Layout

- grid com 4 cards
- em mobile:
  - 1 coluna ou 2 colunas
- em desktop:
  - 4 colunas

### Observações

- esses cards devem ser mais compactos do que os gráficos
- não usar esses cards para repetir histórico detalhado

## Bloco 3: Evolução de desempenho no tempo

### Objetivo

Ser o gráfico principal da página.

Responder:

- o usuário está melhorando?
- a performance está estável, subindo ou caindo?

### Tipo de gráfico

- `LineChart`

### Estrutura

Duas linhas no mesmo gráfico:

- `Acerto em quizzes`
- `Acerto em simulados`

### Fonte de dados

- quizzes:
  - `quiz_sessions.score_percent`
  - `quiz_sessions.completed_at`

- simulados:
  - `exam_sessions.score_percent`
  - `exam_sessions.finalizada_em`
  - apenas `status = 'finalizada'`

### Transformação dos dados

- normalizar ambos para um eixo temporal comum
- agrupar por período:
  - diário para janelas curtas
  - semanal para janelas mais longas

### Filtros de período

Adicionar filtro simples acima do gráfico:

- `7d`
- `30d`
- `90d`
- `Tudo`

### Regras de agregação

- para quizzes:
  - média de `score_percent` por período

- para simulados:
  - média de `score_percent` por período

### Regras de UX

- se houver poucos dados de simulados:
  - manter a série
  - mas aceitar lacunas

- se não houver dados suficientes:
  - exibir estado vazio elegante com mensagem curta

### Eixos e visual

- eixo Y fixo em `0-100`
- tooltip com:
  - período
  - média quizzes
  - média simulados
- legenda visível

### Motivo de estar aqui

Esse é o gráfico mais importante para uma página chamada `Meu Progresso`.

## Bloco 4: Volume de prática e desempenho em simulados

Este bloco deve ter 2 gráficos lado a lado.

## Bloco 4A: Volume de prática

### Objetivo

Mostrar consistência e intensidade de prática.

### Tipo de gráfico

- `BarChart`

### Métrica

- quantidade de questões resolvidas por período

### Fonte de dados

- `quiz_sessions.questions_total`
- `quiz_sessions.completed_at`

### Transformação

- agrupar por período usando o mesmo filtro temporal do bloco principal

### Exibição

- eixo X: período
- eixo Y: total de questões

### Tooltip

- período
- total de questões respondidas

### Motivo de estar aqui

Desempenho sem volume é enganoso.
Este gráfico complementa o `LineChart` principal.

## Bloco 4B: Desempenho em simulados

### Objetivo

Mostrar performance específica em simulados, separada de quizzes.

### Tipo de gráfico

- `BarChart`

### Métrica

- `score_percent` por simulado

### Fonte de dados

- `exam_sessions.score_percent`
- `exam_sessions.finalizada_em`
- `exam_sessions.status = 'finalizada'`

### Exibição

- eixo X: data do simulado
- eixo Y: percentual

### Regras

- limitar a uma janela coerente com o filtro
- se houver poucos simulados, isso continua sendo aceitável

### Tooltip

- data
- score_percent
- opcionalmente:
  - quantidade de questões
  - tempo gasto

### Motivo de estar aqui

Simulado é um tipo de esforço diferente de quiz.
Ele merece leitura própria.

## Bloco 5: Desempenho e progresso por matéria

Este bloco deve ser setorizado e não misturar performance com avanço.

Deve ter 2 gráficos separados.

## Bloco 5A: Desempenho por matéria

### Objetivo

Mostrar em quais matérias o usuário performa melhor ou pior.

### Tipo de gráfico principal

- `BarChart` horizontal

### Tipo opcional complementar

- `RadarChart`

### Recomendação

Implementar primeiro o `BarChart` horizontal.
O `RadarChart` pode ser adicionado depois se ainda fizer sentido visual.

### Fonte de dados

Usar `quiz_sessions` com relacionamento:

- `quiz_sessions -> topics -> subjects`

### Métrica

- acerto médio por matéria

### Regra de cálculo

Para cada matéria:

- agrupar quizzes vinculados à matéria
- calcular média de `score_percent`

### Regras de corte

- mostrar apenas matérias com volume mínimo razoável
  - exemplo: ao menos 1 sessão
  - ideal: ao menos 2 ou 3 sessões, se quiser evitar ruído

- limitar a 6 ou 8 matérias no gráfico
  - ordenar da maior para a menor

### Exibição

- eixo Y: nome da matéria
- eixo X: percentual médio
- barras usando a cor da matéria quando disponível

### Tooltip

- matéria
- acerto médio
- quantidade de sessões consideradas

### Motivo de estar aqui

Esse gráfico responde diretamente:

- onde estou forte?
- onde estou fraco?

## Bloco 5B: Progresso por matéria

### Objetivo

Separar desempenho de avanço real no edital.

### Tipo de gráfico

- `BarChart` horizontal

### Fonte de dados

- `subjects` via `SubjectsContext`
  - `topicsDone`
  - `topicsTotal`
  - `nome`
  - `cor`

### Métrica

- percentual concluído por matéria

### Regra de cálculo

Para cada matéria:

- `topicsDone / topicsTotal * 100`

### Exibição

- eixo Y: matéria
- eixo X: percentual concluído
- mostrar também valor absoluto:
  - `x / y tópicos`
  - no tooltip ou no rótulo

### Ordenação

Escolher uma regra e manter consistência:

- ou ordenar do maior progresso para o menor
- ou ordenar por peso da matéria no edital

Recomendação:

- ordenar por percentual concluído se a intenção for leitura rápida

### Motivo de estar aqui

Uma matéria pode ter bom desempenho e pouco avanço.
Outra pode ter avanço alto e desempenho fraco.
Separar esses 2 gráficos evita confusão.

## Bloco 6: Conquistas

### Objetivo

Manter o aspecto de progresso gamificado sem competir com os gráficos.

### Conteúdo

- grid de conquistas desbloqueadas

### Fonte de dados

- `workspace_stats.conquistas`

### Regras

- manter como bloco final
- não transformar em bloco dominante

### Estado vazio

- mensagem curta:
  - exemplo: `Nenhuma conquista desbloqueada ainda. Continue avançando.`

## Blocos que devem ser removidos

Remover completamente:

- acordeão de `Questões Resolvidas`
- acordeão de `Simulados Resolvidos`

### Justificativa

- já existe a página `Histórico`
- aqui esses blocos desviam o foco da análise agregada
- essa página deve priorizar evolução e leitura estratégica

## Organização sem misturar tópicos

A página deve ficar dividida assim:

- `Resumo`
  - KPIs

- `Evolução`
  - line chart temporal

- `Volume e prática`
  - bar chart de questões
  - bar chart de simulados

- `Análise por matéria`
  - desempenho por matéria
  - progresso por matéria

- `Reconhecimento`
  - conquistas

Essa separação é obrigatória para manter clareza.

## Sugestão de componentes a criar

Se quiser modularizar bem, criar componentes como:

- `ProgressKpis`
- `PerformanceEvolutionChart`
- `PracticeVolumeChart`
- `ExamPerformanceChart`
- `SubjectAccuracyChart`
- `SubjectProgressChart`
- `AchievementsGrid`

Não é obrigatório, mas ajuda a manter a página legível.

## Sugestão de estados derivados

Preparar no container da página:

- `kpiStats`
- `quizTrendData`
- `examTrendData`
- `combinedPerformanceTrendData`
- `practiceVolumeData`
- `examScoreData`
- `subjectAccuracyData`
- `subjectProgressData`

## Regras de fallback e estados vazios

Cada gráfico deve ter tratamento explícito para ausência de dados.

### Exemplos

- sem quizzes:
  - `Você ainda não tem sessões suficientes para visualizar evolução de quizzes.`

- sem simulados:
  - `Nenhum simulado finalizado ainda.`

- sem dados por matéria:
  - `Ainda não há dados suficientes para análise por matéria.`

## Recomendações visuais por gráfico

### LineChart

- linhas suaves
- pontos discretos
- área opcional leve apenas se não poluir

### BarChart

- barras com cantos arredondados
- grid horizontal sutil
- tooltip limpo

### RadarChart

- usar apenas se o resultado estiver legível
- evitar excesso de matérias

## Ordem de implementação recomendada

Implementar em etapas:

1. refatorar carregamento de dados da página
2. manter KPIs resumidos
3. implementar `LineChart` principal
4. implementar `BarChart` de volume de prática
5. implementar `BarChart` de simulados
6. implementar `BarChart` de acerto por matéria
7. implementar `BarChart` de progresso por matéria
8. manter e reposicionar conquistas
9. remover mini históricos
10. revisar estados vazios, responsividade e tooltips

## Critério de sucesso

A implementação estará correta quando:

- a página deixar de parecer uma mistura de KPIs e listas
- o usuário conseguir entender sua evolução temporal
- o usuário conseguir entender volume de prática
- o usuário conseguir comparar desempenho e progresso por matéria
- a página não repetir o papel da tela `Histórico`

