# TASKS.md — Tarefas e Critérios de Aceite

Legenda de status: ⬜ pendente | 🚧 em andamento | ✅ concluída (validada)

## CHECKPOINT 1 — Fundação

| #   | Tarefa                                                        | Status | Critério de aceite                          |
| --- | ------------------------------------------------------------- | ------ | ------------------------------------------- |
| 1.1 | Scaffold Vite + React + TypeScript                            | ✅     | `npm run dev` funcional                     |
| 1.2 | Instalar Tailwind v4, Lucide React, Vitest + Testing Library  | ✅     | Dependências no `package.json`, sem erros   |
| 1.3 | Configurar Vite (Tailwind, Vitest, base do GitHub Pages)      | ✅     | `vite.config.ts` válido                     |
| 1.4 | Criar estrutura `src/` (8 pastas)                             | ✅     | Pastas conforme PROJECT.md                  |
| 1.5 | Criar arquivos canônicos                                      | ✅     | 5 arquivos na raiz refletindo o estado real |
| 1.6 | Definir tipos de domínio                                      | ✅     | `src/types/index.ts` tipado, sem erros      |
| 1.7 | Criar base de destinos (3 destinos, ≥8 atividades cada)       | ✅     | 10 atividades por destino, testes passando  |
| 1.8 | Testes de integridade da base + validação geral               | ✅     | `typecheck`, `test:run` e `build` sem erros |

## CHECKPOINT 2 — Interface Inicial

| #   | Tarefa                                                             | Status | Critério de aceite                                  |
| --- | ------------------------------------------------------------------ | ------ | --------------------------------------------------- |
| 2.1 | Header com identidade Travel Planner                               | ✅     | Logo/nome visível, navegação por teclado, menu móvel |
| 2.2 | Hero com título e CTA funcional                                    | ✅     | CTAs ancoram ao formulário e aos destinos           |
| 2.3 | Formulário (destino, 1–14 dias, interesses, estilo, orçamento)     | ✅     | Validação de todos os campos, mensagens em pt-BR    |
| 2.4 | Área de destinos disponíveis (cards)                               | ✅     | Cards gerados a partir de `src/data/`, com seleção  |
| 2.5 | Seção "como funciona"                                              | ✅     | Explicação em 3 passos, em pt-BR                    |
| 2.6 | Footer                                                             | ✅     | Links âncora válidos, aviso de dados ilustrativos   |
| 2.7 | Responsividade (desktop, tablet, smartphone) e acessibilidade      | ✅     | Grid responsivo, skip link, aria em erros e menu    |

## CHECKPOINT 3 — Roteiro, Persistência e Exportação

| #   | Tarefa                                                            | Status | Critério de aceite                                     |
| --- | ----------------------------------------------------------------- | ------ | ------------------------------------------------------ |
| 3.1 | Gerador de roteiros determinístico em `services/`                 | ✅     | Filtra, distribui por dias, sem sobreposição, com pausas |
| 3.2 | Tratamento de atividades insuficientes                            | ✅     | Mensagem clara; não inventa atividades                  |
| 3.3 | Página do roteiro (dias, atividades, resumo financeiro, avisos)   | ✅     | Custos rotulados como ilustrativos                      |
| 3.4 | Persistência em LocalStorage (salvar, reabrir, excluir, novo)     | ✅     | Trata dados inválidos/corrompidos sem quebrar           |
| 3.5 | Exportação do roteiro em JSON                                     | ✅     | Arquivo validado, sem dados sensíveis                   |

## CHECKPOINT 4 — Qualidade e Publicação

| #   | Tarefa                                                    | Status | Critério de aceite                               |
| --- | --------------------------------------------------------- | ------ | ------------------------------------------------ |
| 4.1 | Testes: validação do formulário                           | ✅     | Comportamento testado, não só existência         |
| 4.2 | Testes: filtragem de atividades e distribuição por dias   | ✅     | Cenários reais com a base local                  |
| 4.3 | Testes: limite de orçamento e atividades insuficientes    | ✅     | Casos-limite cobertos                            |
| 4.4 | Testes: persistência local e exportação                   | ✅     | Dados corrompidos tratados; JSON validado        |
| 4.5 | Build de produção                                         | ✅     | `npm run build` sem erros                        |
| 4.6 | Workflow `.github/workflows/deploy.yml`                   | ✅     | typecheck → testes → lint → build → Pages, permissões mínimas |
| 4.7 | Git local inicializado + `.gitignore`                     | ✅     | Repositório local criado; sem commit/push/publicação |

---

## Relatório do CHECKPOINT 1 (2026-10-10)

- **Status**: concluído e validado.
- **Validações executadas**: `npm run typecheck`, `npm run test:run`,
  `npm run build` — ver seção de relatório apresentada ao supervisor.
- **Pendências**: nenhuma neste checkpoint.

## Relatório do CHECKPOINT 2 (2026-10-10)

- **Status**: concluído e validado.
- **Validações executadas**: `npm run typecheck` (sem erros),
  `npm run test:run` (22 testes, 2 arquivos, todos passando),
  `npm run build` (sucesso).
- **Observação**: o envio do formulário valida os dados e exibe um resumo;
  a geração do roteiro será conectada no Checkpoint 3 (ver DECISIONS.md, D11).
- **Pendências**: nenhuma neste checkpoint.

## Relatório do CHECKPOINT 3 (2026-10-10)

- **Status**: concluído e validado.
- **Validações executadas**: `npm run typecheck` (sem erros),
  `npm run test:run` (51 testes, 5 arquivos, todos passando),
  `npm run build` (sucesso), `npm run lint` (1 aviso pré-existente no
  `Footer`, herdado do Checkpoint 2, fora do escopo deste checkpoint).
- **Implementado**:
  - Gerador determinístico em `src/services/itineraryGenerator.ts`
    (filtragem por interesses/estilo, seleção gananciosa com orçamento,
    distribuição por dias em janelas de horário sem sobreposição, pausa de
    almoço, passeios de dia inteiro, avisos em pt-BR).
  - Página de resultado em `src/pages/ItineraryPage.tsx` com resumo da
    viagem, roteiro diário, resumo financeiro (apenas atividades, com nota
    explícita) e avisos; componentes `ItinerarySummary`, `ItineraryDayCard`
    e `BudgetSummary`.
  - Persistência em `src/services/itineraryStorage.ts` (chave versionada,
    id determinístico por planejamento, validação estrutural na leitura,
    salvar/reabrir/excluir); seção "Meus roteiros salvos" na página inicial.
  - Exportação JSON em `src/services/itineraryExport.ts` (schemaVersion,
    disclaimer de valores ilustrativos, sem dados sensíveis).
  - Formulário conectado ao gerador (botão "Gerar roteiro"; substitui o
    painel de validação da D11 — ver DECISIONS.md, D15).
- **Testes adicionados**: 29 (gerador: 15; persistência: 9; exportação: 4;
  integridade da base: 1). Total da suíte: 51 testes em 5 arquivos.
- **Pendências**: nenhuma neste checkpoint.

## Relatório do CHECKPOINT 4 (2026-10-10)

- **Status**: concluído e validado.
- **Validações executadas (resultados reais)**: `npm run typecheck` (sem
  erros), `npm run test:run` (58 testes, 6 arquivos, todos passando),
  `npm run lint` (0 erros, 0 avisos), `npm run build` (sucesso),
  `npm audit` (0 vulnerabilidades).
- **Resumo financeiro**: diferenciação explícita entre orçamento informado,
  custo estimado das atividades, saldo não alocado e média por dia; novo
  bloco "Gastos não contemplados nas estimativas" (hospedagem, alimentação,
  transporte e passagens) sem valores inventados; nota reforçando que o
  resumo não é o custo total da viagem. Cálculos existentes preservados.
- **Qualidade**: aviso de pureza do `Footer` corrigido (ano calculado em
  nível de módulo); tipagem do mapa de períodos reforçada; lint zerado.
- **Acessibilidade**: contraste corrigido no cabeçalho da página de
  resultado (texto `blue-100` → `white` sobre gradiente azul) e em textos
  auxiliares (`slate-400` → `slate-500`); skip link adicionado à página do
  roteiro; demais pontos (labels, foco visível, `role="alert"`, semântica)
  revisados sem novos problemas.
- **Responsividade**: grids e ações revisados (desktop, tablet, smartphone);
  nenhum problema comprovado encontrado; identidade visual preservada.
- **CI/CD**: `.github/workflows/deploy.yml` com jobs `quality` (npm ci →
  typecheck → testes → lint → build → artifact) e `deploy` (GitHub Pages),
  permissões mínimas (`contents: read`; `pages: write` + `id-token: write`
  apenas no job de deploy). Caminho base do Vite (`/Travel-Planner/`)
  confirmado conforme D3.
- **Git**: repositório local inicializado e `.gitignore` criado; nenhum
  commit, push ou publicação executados (aguardando autorização).
- **Segurança**: sem credenciais no código (varredura por padrões comuns);
  LocalStorage armazena apenas dados de roteiros; dependências sem
  vulnerabilidades conhecidas; workflow com permissões mínimas.
- **Testes adicionados**: 7 (cálculos do resumo financeiro: 2; apresentação
  do `BudgetSummary`: 5). Total da suíte: 58 testes em 6 arquivos.
- **Pendências**: publicação no GitHub Pages e primeiro commit/push dependem
  de autorização explícita.

---

## CORREÇÕES PÓS-AUDITORIA

| #     | Problema                                                        | Status | Critério de aceite                              |
| ----- | --------------------------------------------------------------- | ------ | ----------------------------------------------- |
| TP-01 | Sobreposição entre passeio de dia inteiro e atividade da tarde  | ✅     | Sem sobreposição em nenhum dia; teste de regressão do cenário auditado |
| TP-02 | Persistência aceitava registros inválidos (data, dias, totais)  | ✅     | Validação estrutural e semântica; inválidos nunca renderizados |
| TP-03 | Colisão de hash substituía roteiros diferentes silenciosamente  | ✅     | Id único por registro; equivalência por fingerprint; teste de regressão de colisão |
| TP-04 | Falhas de escrita lançavam exceções não tratadas na interface   | ✅     | Operações retornam resultado; mensagens acessíveis; estado anterior preservado |
| TP-05 | JSON corrompido era tratado como vazio e podia ser sobrescrito  | ✅     | Leitura distingue vazio/válido/corrompido/indisponível; quarentena; descarte só com autorização |

## Relatório da correção TP-01 (2026-10-10)

- **Problema**: o gerador de roteiros permitia sobreposição entre um
  passeio de dia inteiro e uma atividade já posicionada à tarde. Cenário
  reproduzido pela auditoria: Florianópolis, 2 dias, interesse Natureza,
  estilo Equilibrado, orçamento R$ 300 — o dia 2 exibia Ilha do Campeche
  (09:00–15:00) sobreposta à Lagoa da Conceição (14:00–17:00).
- **Causa raiz**: `trySchedule` verificava apenas o cursor do período de
  destino (para passeios de dia inteiro, apenas o cursor da manhã) e os
  limites da janela do período, sem conferir conflitos contra atividades
  já agendadas em **outros** períodos do mesmo dia.
- **Correção aplicada**: nova verificação `hasScheduleConflict` em
  `src/services/itineraryGenerator.ts`, executada em `trySchedule` antes
  de qualquer alocação, contra todas as atividades já agendadas no dia,
  independentemente do período. Intervalos que apenas se tocam (término
  de uma = início da outra) não configuram sobreposição. Determinismo,
  regras de orçamento e de preferências preservados; nenhuma mudança em
  persistência, interface ou arquitetura.
- **Comportamento no cenário auditado (após correção)**: a Ilha do
  Campeche não encontra dia com intervalo livre e é deixada de fora, com
  aviso ao usuário ("atividade compatível não coube na agenda sugerida").
- **Testes adicionados**: 7, todos em `src/tests/itineraryGenerator.test.ts`:
  regressão do cenário exato da auditoria; exclusão com aviso do passeio
  que não cabe sem sobreposição; atividade longa seguida de atividade da
  tarde (pausa de 30 min); atividades curtas em sequência com término no
  limite da janela; distribuição por manhã/tarde/noite no mesmo dia; dias
  sem atividades; varredura determinística (3 destinos × 3 estilos × 5
  conjuntos de interesses × 4 durações × 4 orçamentos) garantindo ausência
  de sobreposição. Total da suíte: 65 testes em 6 arquivos.
- **Validações executadas (resultados reais)**: `npm run typecheck` (sem
  erros), `npm run test:run` (65 testes, 6 arquivos, todos passando),
  `npm run lint` (0 erros, 0 avisos), `npm run build` (sucesso).
- **Riscos remanescentes**: o empacotamento permanece ganancioso —
  atividades podem ficar de fora mesmo havendo combinação alternativa que
  as acomodasse (comportamento pré-existente, transparente via avisos); a
  pausa de 30 minutos é garantida entre atividades consecutivas no mesmo
  período e após passeios de dia inteiro, mas não entre períodos distintos
  (as janelas fixas já embatem os intervalos de almoço e descanso).

## Relatório das correções TP-02 a TP-05 (2026-10-10)

- **TP-02 — Validação de dados persistidos**. Causa: `isSavedItinerary`
  fazia apenas verificação estrutural rasa (tipos dos campos de primeiro
  nível), aceitando datas ilegíveis ("ontem"), dias como objetos vazios e
  totais financeiros incoerentes. Correção: validação estrutural e
  semântica completa em `src/services/itineraryStorage.ts` — data ISO
  real, id não vazio, destino existente na base, dias numerados e em
  quantidade exata, atividades com categorias/estilos/períodos conhecidos,
  duração/custo finitos e coerentes, horários dentro do dia, coerentes com
  a duração e sem sobreposição (invariante TP-01), e totais que fecham com
  as atividades e com o orçamento. Registros inválidos não são renderizados
  e a página inicial informa a quantidade ignorada (erro recuperável).
- **TP-03 — Colisão de identificadores**. Causa: o id do registro era o
  hash djb2 do planejamento; roteiros diferentes com o mesmo hash se
  substituíam silenciosamente. Correção: id único por registro
  (`crypto.randomUUID()`, com fallback); o hash virou
  `buildPlanningFingerprint`, usado só para detectar planejamento
  equivalente — que substitui o registro anterior preservando o id
  original. Compatibilidade: registros legados (id = hash) continuam
  válidos e são substituídos corretamente ao salvar o mesmo planejamento.
- **TP-04 — Erros de armazenamento**. Causa: `setItem`/`getItem` sem
  tratamento lançavam exceções (ex.: `QuotaExceededError`) e a interface
  podia informar sucesso em caso de falha. Correção: todas as operações
  retornam `{ ok: true, ... } | { ok: false, message }`; mensagens em
  pt-BR com `role="alert"` na página do roteiro (salvar) e na inicial
  (excluir); a escrita é atômica, preservando o estado anterior.
- **TP-05 — Dados corrompidos**. Causa: JSON inválido caía no mesmo
  `catch` de armazenamento vazio e podia ser sobrescrito em qualquer
  escrita. Correção: a leitura distingue `empty`/`ok`/`corrupted`/
  `unavailable`; escritas movem payload ilegível (ou com registros
  descartados) para a chave de quarentena
  `travel-planner:saved-itineraries:v1:quarentena` antes de gravar; o
  descarte definitivo só ocorre por ação explícita do usuário na página
  inicial (botão "Descartar dados ilegíveis"), sem migração destrutiva
  automática.
- **Arquivos modificados**: `src/services/itineraryStorage.ts`,
  `src/pages/HomePage.tsx`, `src/pages/ItineraryPage.tsx`,
  `src/tests/itineraryStorage.test.ts`, `src/tests/itineraryExport.test.ts`,
  `TASKS.md`, `DECISIONS.md` (revisão da D14, nova D21).
- **Testes**: suíte de persistência reescrita com 27 testes (9 anteriores
  atualizados + 18 novos), cobrindo data inválida, estrutura incompleta,
  totais inconsistentes, valores monetários inválidos, colisão de
  identificadores, quota excedida, armazenamento indisponível, JSON
  corrompido, quarentena, descarte autorizado, preservação de registros
  anteriores, exclusão (sucesso e falha) e reabertura de roteiros válidos.
  Total da suíte: 83 testes em 6 arquivos.
- **Validações executadas (resultados reais)**: `npm run typecheck` (sem
  erros), `npm run test:run` (83 testes, todos passando), `npm run lint`
  (0 erros, 0 avisos), `npm run build` (sucesso).
- **Limitações restantes**: a quarentena guarda apenas o último payload
  ilegível; se a própria quarentena falhar (quota esgotada), uma escrita
  posterior pode sobrescrever o conteúdo corrompido. Registros salvos
  antes da correção TP-01 com sobreposição de horários são rejeitados
  pela nova validação (ficam invisíveis, mas não são apagados).
