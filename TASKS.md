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
