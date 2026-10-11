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
| TP-02 | Persistência aceitava registros inválidos (data, dias, totais)  | 🚧     | Validação completa (P1 ✅) aplicada na leitura e antes de gravar (P2 ✅); auditoria final pendente |
| TP-03 | Colisão de hash substituía roteiros diferentes silenciosamente  | 🚧     | Identidade UUID + equivalência por campos (P1 ✅); substituição com confirmação vinculada ao conteúdo (P2 ✅); auditoria final pendente |
| TP-04 | Falhas de escrita lançavam exceções não tratadas na interface   | 🚧     | Fluxo com uma leitura de decisão, escrita única, confirmação por releitura, resultado incerto e Web Locks (P2 ✅); auditoria final pendente |
| TP-05 | JSON corrompido era tratado como vazio e podia ser sobrescrito  | 🚧     | Escrita bloqueada em coleção corrompida, quarentena com confirmação e recuperação explícita (P2 ✅); auditoria final pendente |

> TP-02 a TP-05 estão em remediação conforme
> `docs/PERSISTENCE_REMEDIATION_PLAN.md`. Os checkpoints P1 (identidade e
> validação), P2 (operações seguras, concorrência e recuperação) e P3
> (integração com a interface e validação final) foram implementados e
> validados; a declaração de correção total só ocorrerá após a auditoria
> independente final. Ver relatórios abaixo.

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

## Relatório do CHECKPOINT P1 — Remediação de persistência: identidade e validação (2026-10-10)

- **Escopo entregue** (conforme `docs/PERSISTENCE_REMEDIATION_PLAN.md`,
  seções 4 e 5; sem novo fluxo de gravação, sem Web Locks, sem
  recuperação completa, sem alterações extensas de interface):
  - **Identidade (TP-03)**: registros novos usam `crypto.randomUUID()`
    confrontado com os IDs existentes (máx. 10 tentativas; esgotamento
    ou indisponibilidade retorna erro, sem escrita); removido o fallback
    de horário/Math.random. Equivalência passou a ser comparação direta
    de campos (`arePlanningsEquivalent`: destino, dias, estilo,
    orçamento exato e conjunto de interesses sem ordem) — o hash djb2
    (`buildPlanningFingerprint`) não participa mais de nenhuma decisão
    de persistência (resta apenas no nome do arquivo de exportação de
    roteiro não salvo, uso permitido pelo plano). Mais de um equivalente
    bloqueia a substituição automática com mensagem de ambiguidade.
    Identificadores históricos válidos (inclusive legados de hash) são
    preservados e substituídos corretamente.
  - **Validação (TP-02)**: datas reais de calendário por comparação de
    componentes UTC (30/02, 31/04, 29/02 não bissexto e 24:00 rejeitados;
    fração de 1–3 dígitos aceita); id não vazio nem só de espaços; dias
    em quantidade exata e numeração sequencial; atividades completas,
    sem repetição no roteiro, compatíveis com estilo e ao menos um
    interesse; horários inteiros, coerentes com a duração, dentro das
    janelas `SLOT_WINDOWS` (mantida a exceção do passeio longo iniciado
    às 09:00) e sem sobreposição (contato permitido); integridade
    financeira com tolerância ABSOLUTA de 1e-6 (custo = soma das
    atividades, saldo = orçamento − custo, média = custo ÷ dias),
    rejeitando custo superior ao orçamento, saldo negativo e valores/somas
    não finitos. A mesma validação é aplicada antes de gravar um novo
    estado. A leitura retorna motivos de rejeição por registro
    (`rejections`) e marca como corrompida a coleção com IDs duplicados
    (`duplicateIds`), sem expor integrantes do grupo a ações individuais.
  - **Tipos**: descrição do `SavedItinerary.id` corrigida (identidade
    única, não mais derivada do planejamento).
- **Arquivos modificados**: `src/services/itineraryStorage.ts`,
  `src/types/index.ts`, `TASKS.md`, `DECISIONS.md` (nova D22).
- **Arquivos criados**: `src/tests/fixtures/savedItineraries.ts`
  (registro histórico válido, registro sobreposto pré-TP-01, coleção com
  IDs duplicados, par de colisão), `src/tests/itineraryStorageIdentity.test.ts`
  (10 testes), `src/tests/itineraryStorageValidation.test.ts` (35 testes).
- **Cenários de colisão testados**: registro legado cujo id coincide com
  o fingerprint de outro planejamento é preservado ao salvar (o par exato
  da auditoria, fingerprint `roteiro-2cd27b6e`, não foi transcrito no
  plano — ambiguidade nº 9 — e o mecanismo foi reproduzido com
  planejamentos da base local); interesses em ordens diferentes;
  UUID repetido com geração de alternativa; esgotamento das 10
  tentativas sem escrita; indisponibilidade de `crypto.randomUUID`;
  mais de um equivalente bloqueado; IDs duplicados na coleção.
- **Validações executadas (resultados reais)**: `npm run typecheck` (sem
  erros), `npm run test:run` (128 testes, 8 arquivos, todos passando),
  `npm run lint` (0 erros, 0 avisos), `npm run build` (sucesso).
- **Dependências de P2 (registradas, não implementadas)**:
  1. Confirmação de substituição vinculada ao id e ao conteúdo bruto
     observado (hoje um único equivalente ainda é substituído sem
     confirmação — comportamento pré-existente mantido para não quebrar
     o fluxo atual).
  2. Novo fluxo de gravação: leitura única de decisão, escrita atômica,
     confirmação por releitura e resultado incerto com mensagem própria.
  3. Web Locks (`travel-planner:storage:v1`) tornando as mutações
     assíncronas, com bloqueio de mutações na ausência da API.
  4. Reclassificação de coleção parcialmente válida como `corrupted`
     (hoje: `ok` + `discardedCount`) junto com o bloqueio de escritas em
     coleção corrompida — depende do fluxo de recuperação para não
     deixar o usuário sem caminho seguro.
  5. Recuperação explícita, restauração e descarte vinculado da
     quarentena, com exportação de recuperação.
  6. Bloqueio de ações individuais na interface para estados de
     armazenamento incompatíveis (a leitura já não expõe registros de
     grupos com IDs duplicados; a interface será adaptada no P1 de
     interface do plano).
- **Riscos remanescentes**: além das limitações já registradas na D21
  (quarentena de melhor esforço, registros sobrepostos antigos
  invisíveis), permanecem os riscos mapeados no plano enquanto P2 não é
  integrado: ausência de coordenação entre abas, ausência de confirmação
  de gravação por releitura e substituição de equivalente sem
  confirmação do usuário.
- **TP-02 e TP-03 NÃO estão declarados totalmente corrigidos**: a
  conclusão depende da integração final (P2) e de nova auditoria.

## Relatório do CHECKPOINT P3 — Remediação de persistência: integração e validação final (2026-10-10)

- **Escopo entregue** (conforme `docs/PERSISTENCE_REMEDIATION_PLAN.md`,
  seção 8.5 e dependências registradas no relatório do P2; ver
  DECISIONS.md, D24):
  - **Revisão da integração interface × serviço**: HomePage,
    ItineraryPage e SavedItineraries conferidos contra os resultados
    reais do serviço — nenhum caminho informa sucesso antes da
    confirmação por releitura; ações ficam desabilitadas durante
    operações em andamento; exclusão, substituição, recuperação,
    restauração e descarte carregam o vínculo do conteúdo observado e
    são revalidadas no serviço; nenhuma gravação com resultado incerto
    é repetida automaticamente.
  - **Sucesso confirmado explícito (novo)**: feedback `role="status"`
    na HomePage após confirmação de exclusão, recuperação (com
    contagens de recuperados/ilegíveis/IDs corrigidos), restauração e
    descarte — nunca antes da evidência; a exportação da cópia bruta
    não afirma que o download foi guardado.
  - **Lista vazia sem falsa afirmação (correção)**: "Nenhum roteiro
    salvo ainda" só é exibida em `empty`/`ok`; em `corrupted` ou
    `unavailable` a seção de salvos não afirma inexistência de
    registros (plano, 8.1). Nova prop `storageStatus` em
    `SavedItineraries`.
- **Arquivos modificados**: `src/pages/HomePage.tsx`,
  `src/components/SavedItineraries.tsx`, `TASKS.md`, `DECISIONS.md`,
  `ROADMAP.md`.
- **Arquivos criados**: `src/tests/itineraryPageInteraction.test.tsx`
  (10 testes), `src/tests/homePageInteraction.test.tsx` (12 testes).
- **Testes de interação adicionados (22)** — salvar com sucesso (selo só
  após confirmação); falha ao salvar por quota (sem falso sucesso, chave
  intacta); salvamento com armazenamento indisponível (zero escritas);
  resultado incerto no salvamento (mensagem fixa do plano, um único
  setItem); confirmação de substituição (alvo informado, id preservado,
  somente ele substituído); cancelamento da substituição (armazenamento
  intacto); salvamento bloqueado em coleção corrompida (sem escrita, sem
  quarentena como efeito colateral); roteiro aberto dos salvos sem novo
  salvamento; exportação JSON (download disparado, nada gravado);
  navegação "Novo planejamento" e "Abrir"; exclusão com sucesso
  confirmado (grava `[]`, sem remover a chave); falha ao excluir por
  quota com nova tentativa segura após restabelecimento; armazenamento
  indisponível (alerta, sem falsa lista vazia, sem ações); recuperação
  de coleção parcialmente válida (contagens antes da confirmação, cópia
  bruta preservada, id preservado, exclusão habilitada após recuperar);
  recuperação bloqueada por quarentena ocupada (ambas as chaves
  intactas); restauração com confirmação (cópia mantida); descarte da
  quarentena com confirmação e com cancelamento; ação desatualizada na
  exclusão (nenhuma chave alterada, lista recarregada); resultado
  incerto na exclusão; IDs duplicados sem ações individuais nem falsa
  lista vazia. Total da suíte: 190 testes em 12 arquivos.
- **Regressões verificadas** (suíte completa): geração determinística e
  ausência de sobreposição (`itineraryGenerator.test.ts`, incluindo a
  varredura e o cenário auditado TP-01); resumo financeiro
  (`budgetSummary.test.tsx`); exportação JSON (`itineraryExport.test.ts`
  + interação); navegação entre páginas (interação). Responsividade
  básica preservada: nenhuma alteração de layout ou identidade visual —
  o único elemento novo (feedback de sucesso) reutiliza o padrão visual
  dos alertas existentes.
- **Validações executadas (resultados reais)**: `npm run typecheck` (sem
  erros), `npm run test:run` (190 testes, 12 arquivos, todos passando),
  `npm run lint` (0 erros, 0 avisos), `npm run build` (sucesso).
- **Critérios de aceite do plano (seção 11) atendidos nesta etapa**:
  1 (casos obrigatórios passando, incluindo os de interface), 10 (a
  interface não promete preservação, backup ou sucesso sem evidência) e
  11 (typecheck, testes, lint e build verdes). Os critérios 1–11 estão
  cobertos pela suíte; o critério 12 depende da auditoria independente.

  **Revisão (AUD-07, 2026-10-11)**: a afirmação "os critérios 1–11
  estão cobertos pela suíte" excedia as evidências. A auditoria
  independente final reproduziu violações em cenários ausentes da
  suíte (AUD-01 a AUD-06) e constatou que o teste denominado "colisão
  real" não calculava dois hashes iguais (a fixture atribuía a um
  registro o fingerprint de outro planejamento) e que o par original e
  a amostra histórica original permanecem indisponíveis. O registro
  correto é: a suíte existente passava nos cenários que cobria, sem
  cobertura integral dos casos obrigatórios. As lacunas foram tratadas
  nos checkpoints C1, C2-A e C2-B (regressões incorporadas, incluindo
  a colisão verdadeira reconstruída com origem sintética identificada);
  a reavaliação dos 12 critérios é pendência da nova auditoria
  independente.
- **Riscos remanescentes** (inalterados em relação ao P2): abas
  executando versões antigas ignoram o lock (limitação explícita do
  plano, seção 12); o resultado incerto depende de releitura antes da
  próxima ação (a interface recarrega a lista após cada mutação, mas a
  decisão é do usuário); a quarentena guarda uma única cópia — ocupada
  por conteúdo diferente, novas recuperações ficam bloqueadas até
  download ou descarte explícito (por design); extensões desconhecidas
  de um registro substituído não são mantidas na substituição confirmada
  (ambiguidade nº 7 do plano); a durabilidade física e a limpeza do
  armazenamento pelo navegador/usuário estão fora de escopo.
- **Pendências para a auditoria independente**: reproduzir os caminhos
  de perda da auditoria original (TP-02 a TP-05) contra o estado atual;
  validar a amostra histórica citada no plano (64.851 aceitos / 837
  sobrepostos — ambiguidade nº 9, valores não transcritos no plano);
  revisar as ambiguidades resolvidas (nº 2, 5 e 10, registradas na D23).
- **TP-02 a TP-05 NÃO estão declarados totalmente corrigidos**: a
  declaração depende da auditoria independente final (critério 12 do
  plano). O projeto está pronto para essa auditoria.

## Relatório do CHECKPOINT P2 — Remediação de persistência: operações seguras e recuperação (2026-10-10)

- **Escopo entregue** (conforme `docs/PERSISTENCE_REMEDIATION_PLAN.md`,
  seções 3, 6 e 8; ver DECISIONS.md, D23):
  - **Operações seguras**: uma leitura de decisão por operação (o
    conteúdo bruto lido é interpretado uma única vez — falha de leitura
    bloqueia a mutação e nunca vira lista vazia); novo estado construído
    e validado integralmente em memória (`isValidCollection`); um único
    `setItem` na chave principal; confirmação por releitura com
    igualdade exata; resultados distintos de sucesso confirmado, falha
    sem alteração e resultado incerto (mensagem fixa do plano, sem
    repetição nem rollback). `removeItem` na chave principal abolido:
    excluir o último roteiro grava `[]`.
  - **Concorrência**: mutações assíncronas sob o lock exclusivo Web
    Locks `travel-planner:storage:v1`; sem a API ou com falha de
    aquisição, mutações bloqueadas com mensagem explicativa (sem
    fallback inseguro); leitura/exportação seguem disponíveis. A
    confirmação do usuário ocorre fora do lock e é revalidada dentro
    dele.
  - **Quarentena**: preservação do conteúdo bruto original (sem filtrar
    nem reserializar); cópia idêntica é reutilizada; cópia diferente
    (inclusive string vazia) bloqueia a operação; gravação do backup
    confirmada por releitura; falha de leitura/escrita/confirmação do
    backup impede a escrita principal; a chave principal nunca é
    removida antes de ser substituída.
  - **Recuperação explícita**: `previewRecovery` (somente leitura, com
    contagens e vínculo ao conteúdo bruto), `recoverCorruptedStorage`
    (revalida conteúdo e estado corrompido, preserva backup, grava e
    confirma; IDs duplicados corrigidos com UUIDs novos para TODOS os
    integrantes do grupo; registros válidos preservados com id, savedAt
    e campos desconhecidos), `restoreQuarantineCopy` (somente com a
    chave principal vazia; mantém a quarentena) e
    `discardQuarantineCopy` (vinculado ao conteúdo da quarentena, sem
    tocar a chave principal, com confirmação por releitura — falha nunca
    é falso sucesso). A antiga `discardCorruptedData` foi removida.
  - **Confirmação de substituição (TP-03)**: um planejamento equivalente
    não é mais substituído automaticamente — `saveItinerary` retorna
    `needs-confirmation` com o vínculo (id do alvo + conteúdo bruto
    observado + resumo destino/dias/data); a substituição confirmada
    preserva o id do alvo e só é executada se o conteúdo não mudou.
  - **Reclassificação (TP-05)**: coleção parcialmente válida passa a ser
    `corrupted` (registros íntegros expostos só para consulta) e string
    vazia armazenada é corrompida; escritas normais são bloqueadas em
    coleção corrompida, sem quarentena automática.
  - **Interface (adaptação inseparável dos consumidores)**: HomePage com
    exclusão assíncrona vinculada ao conteúdo observado, painel de
    recuperação com contagens e confirmação explícita (incluindo aviso
    de lista vazia quando não há recuperáveis), painel de quarentena
    (baixar cópia, restaurar com confirmação quando não há roteiros
    ativos, descartar definitivamente com confirmação); ItineraryPage
    com salvamento assíncrono, estado "Salvando…", painel de confirmação
    de substituição e mensagens de falha/incerto; SavedItineraries com
    exclusão bloqueada quando o armazenamento não está íntegro ou há
    operação em andamento; exportação de recuperação
    (`travel-planner:recuperacao-armazenamento`, versão 1) separada da
    exportação normal.
- **Arquivos modificados**: `src/services/itineraryStorage.ts`,
  `src/services/itineraryExport.ts`, `src/pages/HomePage.tsx`,
  `src/pages/ItineraryPage.tsx`, `src/components/SavedItineraries.tsx`,
  `src/tests/itineraryStorage.test.ts`,
  `src/tests/itineraryStorageIdentity.test.ts`,
  `src/tests/itineraryExport.test.ts`, `TASKS.md`, `DECISIONS.md`.
- **Arquivos criados**: `src/tests/helpers/webLocksMock.ts` (mock de Web
  Locks com serialização FIFO e detecção de concorrência),
  `src/tests/itineraryStorageSafeWrites.test.ts` (12 testes),
  `src/tests/itineraryStorageRecovery.test.ts` (20 testes).
- **Regressões adicionadas** (todas comparando o conteúdo bruto das
  chaves antes e depois): falha na primeira leitura (zero escritas);
  falha na confirmação de escrita (resultado incerto, um único setItem,
  sem rollback); confirmação com conteúdo divergente (incerto); quota
  excedida (chave principal idêntica); escritas consecutivas (cada
  estado conferido pelo raw); falhas consecutivas de leitura/escrita
  (nenhuma conversão em lista vazia); duas operações concorrentes
  serializadas pelo lock sem atualização perdida; Web Locks ausente ou
  com falha de aquisição (mutações bloqueadas, leitura/exportação
  utilizáveis); ações desatualizadas na exclusão, na substituição, na
  recuperação e no descarte (nenhuma chave alterada); exclusão de ID
  ausente (falha sem escrita); exclusão do último registro (grava `[]`,
  não remove a chave); quarentena ocupada por conteúdo diferente
  (bloqueio, ambas as chaves intactas) e idêntica (reuso); falha na
  criação e na confirmação do backup (escrita principal impedida);
  quota real no backup (operação bloqueada, original intacto); backup
  confirmado com falha na escrita principal (original preservado, cópia
  mantida); preservação integral do conteúdo bruto original (JSON
  inválido, string vazia, formato desconhecido, campos desconhecidos);
  recuperação com confirmação (contagens, IDs duplicados corrigidos,
  lista vazia quando não há recuperáveis); restauração (permitida só sem
  roteiros ativos, bloqueada com conteúdo ativo ou corrompido,
  quarentena mantida); descarte da quarentena (sucesso confirmado, falha
  na remoção e falha na confirmação nunca são falso sucesso).
- **Validações executadas (resultados reais)**: `npm run typecheck` (sem
  erros), `npm run test:run` (168 testes, 10 arquivos, todos passando),
  `npm run lint` (0 erros, 0 avisos), `npm run build` (sucesso).
- **Dependências de P3 (etapa de interface do plano, não iniciada)**:
  1. Testes de interação de HomePage e ItineraryPage (alertas
     acessíveis, painéis de confirmação, nova tentativa segura).
  2. Revisão fina de mensagens/estados visuais contra a tabela de
     resultados (o essencial funcional já está na interface).
  3. Validação final de compatibilidade e auditoria independente antes
     de declarar TP-02 a TP-05 corrigidos.
- **Riscos remanescentes**: abas executando versões antigas ignoram o
  lock (limitação explícita do plano, seção 12); o resultado incerto
  depende de releitura antes da próxima ação (a interface recarrega a
  lista após cada mutação, mas a decisão é do usuário); a quarentena
  guarda uma única cópia — com ela ocupada por conteúdo diferente, novas
  recuperações ficam bloqueadas até download ou descarte explícito (por
  design); extensões desconhecidas de um registro substituído não são
  mantidas na substituição confirmada (ambiguidade nº 7 do plano).
- **TP-02 a TP-05 NÃO estão declarados totalmente corrigidos**: a
  conclusão depende da auditoria independente final (critério 12 do
  plano). P3 não foi iniciado.

---

## CORREÇÕES DA AUDITORIA INDEPENDENTE FINAL (docs/FINAL_AUDIT_FINDINGS.md)

| #      | Problema                                                                 | Status | Critério de aceite                                              |
| ------ | ------------------------------------------------------------------------ | ------ | --------------------------------------------------------------- |
| AUD-01 | Confirmação antiga de descarte apagava uma nova quarentena               | 🚧     | Correção implementada e validada na suíte local; reauditoria pendente |
| AUD-02 | Mensagem falsa de preservação após resultado incerto                     | 🚧     | Correção implementada e validada na suíte local (C2-A); reauditoria pendente |
| AUD-03 | Custo superior ao orçamento aceito dentro da tolerância                  | 🚧     | Correção implementada e validada na suíte local (C2-B); reauditoria pendente |
| AUD-04 | Saldo incorreto aceito pela perda de precisão na soma                    | 🚧     | Correção implementada e validada na suíte local (C2-B); reauditoria pendente |
| AUD-05 | Falta exportação bruta da principal corrompida                           | 🚧     | Correção implementada e validada na suíte local (C2-B); reauditoria pendente |
| AUD-06 | Restauração corrige IDs sem aviso prévio                                 | 🚧     | Correção implementada e validada na suíte local (C2-A); reauditoria pendente |
| AUD-07 | Declaração de aceite excede as evidências                                | 🚧     | Regressões incorporadas e documentação reconciliada com as evidências (C2-B); reauditoria pendente |

> As correções de AUD-01 a AUD-07 foram implementadas e validadas
> localmente (checkpoints C1, C2-A e C2-B), mas os achados só poderão
> ser declarados corrigidos após nova auditoria independente. A
> auditoria final NÃO está aprovada.

## Relatório da correção AUD-01 (2026-10-11)

- **Problema**: uma confirmação de descarte da quarentena, aberta para o
  conteúdo A, conseguia descartar um conteúdo diferente B. Cenário exato
  da auditoria: painel de descarte aberto para A; outra sessão descarta
  A e uma recuperação cria a cópia B na quarentena; uma exclusão local
  recarrega a quarentena para B mantendo o painel antigo aberto; ao
  confirmar, B era removida e a interface informava sucesso.
- **Causa raiz (integração interface × serviço)**: a confirmação de
  descarte era representada por um booleano (`confirmingDiscard`) e não
  guardava o conteúdo autorizado na abertura do painel. Ao confirmar, o
  handler lia `quarantine.raw` do estado ATUAL — já atualizado para B
  pela recarga intermediária — e o enviava ao serviço, substituindo
  implicitamente o alvo da autorização. O serviço validava corretamente
  o conteúdo recebido; a interface trocava esse conteúdo antes de enviar.
- **Reprodução antes da correção**: o teste "reproduz o cenário exato do
  AUD-01" em `src/tests/quarantineDiscardAud01.test.tsx` FALHOU no estado
  anterior com perda real de dados — a quarentena B foi removida
  (`null`) pela confirmação autorizada para A.
- **Correção implementada** (`src/pages/HomePage.tsx`, somente interface;
  serviço e persistência inalterados):
  1. A confirmação passou a guardar o conteúdo bruto exato da quarentena
     apresentado ao usuário na abertura do painel
     (`discardAuthorization: string | null`), capturado no clique de
     "Descartar cópia definitivamente".
  2. A confirmação envia ao serviço SOMENTE esse conteúdo capturado,
     nunca uma releitura posterior; se o armazenamento mudou, o serviço
     cancela a operação (ação desatualizada, sem escrita).
  3. Toda releitura que observa conteúdo de quarentena diferente do
     autorizado (ou ausente) invalida a confirmação em aberto
     (`reloadSaved`), fechando o painel — o conteúdo novo nunca
     substitui o alvo da autorização.
  4. Cancelar, concluir ou falhar limpa a autorização: nenhuma
     autorização é reutilizável.
- **Proteções preservadas**: Web Locks, validação de estado, confirmação
  de leitura (releitura com igualdade exata), tratamento de resultado
  incerto e a proibição de `removeItem` na chave principal permanecem
  intactos — nenhuma linha do serviço de persistência foi alterada; os
  190 testes anteriores seguem passando sem modificação.
- **Testes adicionados**: 8, no novo arquivo
  `src/tests/quarantineDiscardAud01.test.tsx`, todos comparando o
  conteúdo bruto das duas chaves antes e depois: reprodução do cenário
  exato do AUD-01 (com recarga intermediária); descarte autorizado e
  válido (remove só a cópia autorizada, principal intacta); descarte
  cancelado (nenhuma chave alterada); quarentena indisponível na
  confirmação (erro explícito, sem falso sucesso, chaves intactas);
  erro durante a remoção da cópia (falha explícita, cópia preservada);
  confirmação reutilizada (após descarte confirmado, cópia nova exige
  nova autorização explícita — interface e serviço); mudança entre duas
  abas sem recarga local (a confirmação envia o conteúdo autorizado A e
  o serviço cancela, B intacta). Total da suíte: 198 testes em 13
  arquivos.
- **Validações executadas (resultados reais)**: `npm run typecheck` (sem
  erros), `npm run test:run` (198 testes, 13 arquivos, todos passando),
  `npm run lint` (0 erros, 0 avisos), `npm run build` (sucesso).
- **Evidência de preservação**: no cenário auditado corrigido, a
  quarentena B permanece byte a byte idêntica após a tentativa de
  descarte com confirmação antiga, a principal permanece com `[]`
  (resultado da exclusão legítima) e nenhuma mensagem de sucesso é
  exibida para a ação desatualizada.
- **Riscos remanescentes**: o painel de RESTAURAÇÃO da quarentena segue
  com confirmação representada por booleano (lê `quarantine.raw` no
  momento da confirmação); a auditoria não comprovou perda nesse fluxo
  (a restauração preserva a quarentena e exige a principal vazia), mas o
  mesmo padrão de vínculo pode ser avaliado em correção futura. AUD-02 a
  AUD-07 permanecem abertos. O parecer da auditoria segue NO-GO até a
  reavaliação independente.
- **AUD-01 NÃO está declarado totalmente corrigido**: a declaração
  depende de nova auditoria independente (critério 12 do plano e seção
  10 dos achados).

## Relatório da correção C2-A — AUD-02, AUD-06 e lacuna de restauração (2026-10-11)

- **Escopo**: somente os achados AUD-02 e AUD-06 e a lacuna de
  autorização da restauração da quarentena (risco remanescente
  registrado no relatório do AUD-01). AUD-03, AUD-04 e AUD-05 NÃO foram
  implementados, conforme as restrições. Nenhuma dependência instalada,
  nenhuma mudança de identidade visual, nenhum commit/push/publicação.

### AUD-02 — Mensagens de segurança

- **Problema**: o alerta genérico de indisponibilidade da HomePage
  afirmava "Nenhum dado foi alterado" com base apenas no estado da
  leitura seguinte, sem evidência sobre a mutação anterior. No cenário
  auditado (exclusão com escrita efetiva de `[]` + falha na leitura de
  confirmação + falha na releitura da interface), a mensagem de
  resultado incerto e a falsa afirmação de preservação eram exibidas
  simultaneamente.
- **Causa raiz**: a afirmação absoluta não estava condicionada à
  evidência de que nenhuma escrita foi tentada.
- **Reprodução antes da correção**: os testes "reproduz o cenário exato
  do AUD-02" e "falha de escrita (quota) seguida de leitura
  indisponível" FALHARAM no estado anterior — a afirmação "Nenhum dado
  foi alterado." estava presente nos dois cenários (a escrita efetiva
  de `[]` foi confirmada por inspeção direta do armazenamento).
- **Correção implementada** (`src/pages/HomePage.tsx`, somente
  interface): a página registra se alguma mutação foi tentada na sessão
  (`mutationAttempted`). A afirmação "Nenhum dado foi alterado." só é
  exibida quando NENHUMA mutação foi tentada (evidência: a página não
  escreveu nada); após qualquer tentativa — inclusive falhas, que podem
  deixar cópia adicional na quarentena (plano, 3.2) — o alerta informa
  a indisponibilidade e orienta recarregar e verificar o estado real,
  sem prometer preservação. A mensagem fixa de resultado incerto do
  plano foi preservada. As demais mensagens foram revisadas: o serviço
  só afirma preservação em falhas anteriores à escrita (evidência real)
  e os sucessos só aparecem após confirmação por releitura — nenhum
  outro caminho prometia preservação, backup ou conclusão sem
  evidência.

### AUD-06 — Restauração com aviso prévio de IDs

- **Problema**: o painel de confirmação da restauração era genérico e
  não informava que o serviço atribui NOVOS identificadores a TODOS os
  integrantes de grupos com IDs duplicados.
- **Causa raiz**: a interface não analisava o conteúdo da cópia na
  abertura do painel (a análise existia apenas no serviço, no momento
  da execução).
- **Reprodução antes da correção**: o teste "reproduz o cenário exato
  do AUD-06" (principal `[]`, quarentena com dois registros
  individualmente válidos com o mesmo ID) FALHOU no estado anterior —
  o painel não mencionava identificadores.
- **Correção implementada**:
  1. Nova função somente de leitura no serviço
     (`previewQuarantineRestore` em `src/services/itineraryStorage.ts`):
     informa quantos registros serão restaurados e quantos receberão
     novos identificadores, com o conteúdo bruto exato observado para
     vincular a confirmação. Não altera nenhuma chave.
  2. O painel de restauração apresenta a análise ANTES da confirmação
     ("2 registros válidos serão restaurados", "2 registros com
     identificadores duplicados receberão novos identificadores"),
     incluindo aviso quando nenhum registro é restaurável.
  3. A mensagem de sucesso confirmado passa a refletir a correção de
     IDs efetivamente realizada (ex.: "2 registros restaurados (2
     identificadores duplicados foram corrigidos)").

### Lacuna de autorização da restauração

- **Lacuna**: a confirmação de restauração era um booleano que lia
  `quarantine.raw` do estado no momento da confirmação — o mesmo padrão
  do AUD-01.
- **Nota de reprodução**: diferente do descarte, não foi encontrado
  caminho na interface que recarregue o estado da quarentena mantendo o
  painel de restauração aberto — com a chave principal vazia
  (pré-condição da restauração), nenhuma mutação local disponível
  provoca recarga sem fechar o painel. A lacuna é estrutural; a
  correção elimina a classe de defeito e os testes comprovam o
  cancelamento quando o conteúdo muda entre a abertura e a confirmação.
- **Correção implementada** (`src/pages/HomePage.tsx`, mesmo padrão do
  AUD-01): a confirmação passou a guardar o conteúdo bruto exato
  observado na abertura do painel (`restoreAuthorization`), capturado
  pelo `previewQuarantineRestore` no clique de "Restaurar registros da
  cópia"; a confirmação envia ao serviço SOMENTE esse conteúdo
  capturado; toda releitura que observa conteúdo diferente (ou ausente)
  invalida a autorização em aberto (`reloadSaved`); cancelar, concluir
  ou falhar limpa a autorização — nenhuma é reutilizável. O serviço
  (`restoreQuarantineCopy`) já revalidava o conteúdo dentro do lock e
  não foi alterado.

### Testes adicionados (11), todos comparando o conteúdo bruto das chaves

- `src/tests/quarantineRestoreAud06.test.tsx` (7): reprodução do
  cenário exato do AUD-06 (aviso prévio de IDs); confirmação válida
  (IDs novos e distintos, `savedAt` e demais campos preservados,
  quarentena intacta byte a byte, mensagem refletindo a correção);
  conteúdo alterado entre abertura e confirmação (operação cancelada,
  nenhuma chave modificada, cópia nova intacta); confirmação cancelada
  (nenhuma alteração); confirmação reutilizada (nenhuma autorização
  herdada após restauração confirmada); quarentena indisponível na
  confirmação (erro explícito, sem falso sucesso, chaves intactas);
  resultado incerto na restauração — falha de confirmação (mensagem
  fixa do plano, uma única escrita principal, sem repetição nem
  rollback, quarentena intacta).
- `src/tests/securityMessagesAud02.test.tsx` (4): reprodução do cenário
  exato do AUD-02 (escrita efetiva + falhas persistentes de leitura →
  incerteza sem a falsa afirmação, uma única escrita, sem rollback nem
  repetição); carga inicial indisponível sem mutação (afirmação de
  preservação mantida — evidenciada); falha de escrita por quota
  seguida de leitura indisponível (alerta genérico sem afirmação
  absoluta); falha no backup durante a recuperação (mensagem de falha
  de preservação, principal intacta byte a byte, sem falso sucesso).
- Cobertura existente mantida e passando sem modificação: falha na
  criação e na confirmação do backup no serviço
  (`itineraryStorageRecovery.test.ts`), restauração bloqueada com
  principal ativa ou corrompida, restauração com conteúdo divergente e
  quarentena vazia no serviço, restauração com confirmação na interface
  (`homePageInteraction.test.tsx`) e todos os cenários do AUD-01.
- Total da suíte: 209 testes em 15 arquivos (198 anteriores + 11 novos).

### Validações executadas (resultados reais)

- `npm run typecheck` — sem erros.
- `npm run test:run` — 209 testes, 15 arquivos, todos passando.
- `npm run lint` — 0 erros, 0 avisos.
- `npm run build` — sucesso.

### Garantias preservadas

- Nenhuma linha do fluxo de gravação, da validação ou das operações de
  quarentena do serviço foi alterada — a única adição ao serviço é a
  leitura `previewQuarantineRestore` (sem escrita).
- Web Locks, confirmação por releitura com igualdade exata, resultado
  incerto sem repetição nem rollback, proibição de `removeItem` na
  chave principal e o vínculo do descarte (AUD-01) intactos — os 198
  testes anteriores seguem passando sem modificação.
- Identidade visual inalterada: o painel de restauração reutiliza o
  padrão dos painéis existentes (mesmas classes); os textos originais
  foram preservados e apenas ampliados com a análise.

### Riscos remanescentes

- Inalterados em relação aos relatórios anteriores (abas antigas
  ignoram o lock; resultado incerto exige releitura manual; quarentena
  de cópia única; extensões desconhecidas de registro substituído não
  mantidas; durabilidade física fora de escopo).
- A afirmação "Nenhum dado foi alterado." na carga inicial cobre
  apenas as ações desta página (que não tentou mutação); alterações
  feitas por outras abas enquanto o armazenamento está indisponível
  não são observáveis por esta sessão — limitação inerente.
- AUD-03, AUD-04, AUD-05 e AUD-07 permanecem abertos.
- **AUD-02 e AUD-06 NÃO estão declarados totalmente corrigidos**: a
  declaração depende de nova auditoria independente (critério 12 do
  plano e seção 10 dos achados). O parecer segue NO-GO até a
  reavaliação.

## Relatório da correção C2-B — AUD-03, AUD-04, AUD-05 e AUD-07 (2026-10-11)

- **Escopo**: somente os achados AUD-03, AUD-04 (validação financeira),
  AUD-05 (exportação do conteúdo bruto da principal corrompida) e
  AUD-07 (regressões e reconciliação documental). Nenhuma dependência
  instalada, nenhuma mudança de arquitetura ou de identidade visual,
  nenhum commit/push/publicação. O gerador de roteiros NÃO foi
  alterado (não havia necessidade comprovada: os defeitos estavam no
  validador compartilhado e na interface).

### AUD-03 — Custo superior ao orçamento aceito dentro da tolerância

- **Causa raiz**: `src/services/itineraryStorage.ts` exigia que
  `custo − orçamento` ultrapassasse EPSILON (1e-6) para rejeitar. O
  plano (seção 5) exige rejeitar custo superior ao orçamento; a
  tolerância das relações financeiras não autoriza ultrapassá-lo.
- **Reprodução antes da correção**: os três testes do cenário exato
  (orçamento 9.9999995, uma atividade de custo 10, custo estimado 10,
  saldo 0, média 10) FALHARAM no estado anterior —
  `validateSavedItinerary` retornou `{ ok: true }`,
  `loadSavedItineraries` retornou `ok` e `saveItinerary` confirmou o
  salvamento.
- **Correção implementada**: comparação ESTRITA `custo > orçamento`
  (sem tolerância). A tolerância absoluta de 1e-6 permanece apenas nas
  relações de igualdade que a admitem (custo = soma das atividades,
  saldo = orçamento − custo, média = custo ÷ dias).

### AUD-04 — Saldo incorreto aceito pela perda de precisão na soma

- **Causa raiz**: o saldo era validado por `custo + saldo ≈ orçamento`.
  Com valores grandes, a soma absorve a discrepância pela precisão
  numérica (no cenário auditado, 1e16 + 1 === 1e16), aceitando um saldo
  que difere de orçamento − custo por 1 — acima da tolerância.
- **Reprodução antes da correção**: os três testes do cenário exato
  (orçamento = custo = 10000000000000000, saldo declarado 1, média
  10000000000000000) FALHARAM no estado anterior nos três caminhos
  (validação, leitura e salvamento confirmado).
- **Correção implementada**: o saldo declarado é comparado
  DIRETAMENTE com `orçamento − custo`, mantendo tolerância absoluta de
  1e-6 e as verificações preexistentes de finitude e não negatividade
  (a subtração de orçamento e custo finitos e não negativos é sempre
  finita). Controle com saldo 0 nos mesmos valores permanece válido.

### AUD-05 — Exportação do conteúdo bruto da principal corrompida

- **Causa raiz**: o exportador de recuperação existia
  (`downloadRecoveryJson`), mas a interface o conectava somente à
  quarentena — não havia ação para exportar o conteúdo bruto observado
  da principal corrompida, saída necessária inclusive quando não há
  espaço para criar o backup (quota insuficiente bloqueia a
  recuperação por design).
- **Reprodução antes da correção**: os quatro testes do novo arquivo
  FALHARAM no estado anterior — o botão "Baixar cópia do conteúdo
  bruto" não existia no painel de corrupção.
- **Correção implementada** (`src/pages/HomePage.tsx`, somente
  interface; o exportador existente foi reutilizado sem alteração):
  novo botão no painel de corrupção exporta `storage.raw` da chave
  principal com o envelope de recuperação
  (`travel-planner:recuperacao-armazenamento`, versão 1) e a chave de
  origem correta. A exportação não lê para mutação nem grava nada:
  nenhuma das duas chaves é alterada e a quarentena existente nunca é
  sobrescrita. O aviso exibido após o clique (`role="status"`)
  registra apenas o download INICIADO e informa explicitamente que
  iniciar o download não confirma que o arquivo foi guardado — a
  interface não afirma que o usuário salvou o arquivo sem evidência.

### AUD-07 — Regressões e reconciliação documental

- **Regressão da colisão verdadeira reconstruída**: novo teste calcula
  os fingerprints dos dois planejamentos SINTÉTICOS reconstruídos pela
  auditoria (florianopolis, 1 dia, econômico; orçamentos 95263682 e
  97062267; conjuntos de interesses distintos), comprova que ambos são
  exatamente `roteiro-2cd27b6e` e que salvar o segundo preserva
  integralmente o registro legado do primeiro (dois registros na
  coleção, conteúdo legado intacto). A origem sintética está
  identificada no próprio teste: o par original da auditoria anterior
  permanece indisponível (ambiguidade nº 9 do plano) e esta regressão
  não substitui sua rastreabilidade.
- **Documentação reconciliada**: a declaração do relatório do P3 que
  afirmava cobertura dos critérios 1–11 recebeu revisão explícita do
  AUD-07 (acima, neste arquivo); DECISIONS.md registra a D26; ROADMAP
  reflete o estado real. Nenhum documento declara aprovação definitiva.

### Arquivos modificados

- `src/services/itineraryStorage.ts` (duas comparações financeiras e
  comentários; nenhuma outra linha do serviço alterada — fluxo de
  gravação, Web Locks, quarentena e recuperação intactos).
- `src/pages/HomePage.tsx` (botão de exportação do conteúdo bruto da
  principal corrompida, aviso de download iniciado, texto do painel de
  corrupção ampliado).
- `TASKS.md`, `DECISIONS.md` (nova D26), `ROADMAP.md`.

### Arquivos criados

- `src/tests/financialValidationAud0304.test.ts` (15 testes): cenários
  exatos do AUD-03 e do AUD-04 na validação, na leitura e no
  salvamento (com zero escritas e preservação das duas chaves); limite
  custo = orçamento e custo abaixo por menos que a tolerância
  (compatibilidade); controle AUD-04 com saldo 0; média diária
  incorreta; valores não finitos (orçamento NaN, custo Infinity);
  custo divergente da soma; saldo negativo dentro da tolerância;
  registro histórico válido preservado byte a byte.
- `src/tests/corruptedRawExportAud05.test.tsx` (4 testes): cenário
  exato do AUD-05 (envelope, origem, raw exato, chaves intactas, aviso
  sem afirmação de arquivo guardado); exportação sob quota insuficiente
  (zero escritas); quarentena ocupada por conteúdo diferente preservada;
  distinção entre a exportação da principal e a da quarentena.
- `src/tests/trueCollisionAud07.test.ts` (2 testes): fingerprints
  calculados e comprovadamente iguais; preservação dos dois registros.

### Validações executadas (resultados reais)

- Pré-correção: os 10 testes de reprodução FALHARAM no estado anterior
  (3 do AUD-03, 3 do AUD-04 e 4 do AUD-05), confirmando os defeitos.
- `npm run typecheck` — sem erros.
- `npm run test:run` — 230 testes, 18 arquivos, todos passando
  (209 anteriores + 21 novos de C2-B; os 209 anteriores seguem passando
  sem modificação).
- `npm run lint` — 0 erros, 0 avisos.
- `npm run build` — sucesso.

### Compatibilidade histórica

- O registro histórico válido da fixture (id legado de hash, data
  bissexta com fração, campos desconhecidos) continua aceito e
  preservado byte a byte após o endurecimento financeiro — a
  comparação estrita custo ≤ orçamento e o saldo comparado com
  orçamento − custo são satisfeitos exatamente pelos registros
  produzidos pelo gerador e pelos históricos íntegros (mesma
  aritmética). Nenhum formato foi migrado ou regravado.
- A amostra histórica ORIGINAL da auditoria (64.851 aceitos / 837
  sobrepostos) permanece indisponível: não é possível afirmar ausência
  de rejeições adicionais nessa população (limitação registrada na
  auditoria, não preenchida com dados inventados).

### Riscos remanescentes

- Inalterados em relação aos relatórios anteriores (abas antigas
  ignoram o lock; resultado incerto exige releitura manual; quarentena
  de cópia única; extensões desconhecidas de registro substituído não
  mantidas; durabilidade física e downloads fora de escopo).
- A exportação do conteúdo bruto é uma ação da sessão atual: se o
  armazenamento estiver indisponível (`unavailable`), não há conteúdo
  observado para exportar — limitação inerente, não um caminho de
  perda novo.

### Pendências para a auditoria final

- Reexecutar os cenários exatos do AUD-03 e do AUD-04 contra os três
  caminhos (validação, leitura, salvamento) e verificar zero escritas.
- Verificar a exportação da principal corrompida (envelope, origem,
  raw exato, chaves intactas) inclusive sob quota insuficiente.
- Validar o par original da colisão e o corpus histórico original
  quando os artefatos forem disponibilizados, sem substituí-los por
  dados inventados.
- Reavaliar os 12 critérios do plano e os 7 achados com evidência
  suficiente. O parecer segue NO-GO até a reavaliação independente.
- **AUD-03, AUD-04, AUD-05 e AUD-07 NÃO estão declarados totalmente
  corrigidos**: a declaração depende de nova auditoria independente
  (critério 12 do plano e seção 10 dos achados).
