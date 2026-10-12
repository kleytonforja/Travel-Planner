# TASKS.md — Tarefas e Critérios de Aceite

## Fila atual

> Consultar antes de iniciar qualquer alteração e atualizar ao assumir e ao
> finalizar uma tarefa. Regras em `AGENTS.md` (seção "Fluxo multiagente"):
> um único agente executor por tarefa; preencher a tabela abaixo apenas com
> autorização para escrever neste arquivo.

| Campo               | Valor                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| Tarefa ativa        | **V1-T3.4** — planejamento progressivo, etapa 4 (transporte). Anteriores: V1-T3.3 (commit `a36d506`), V1-T3.2 (commit `3f5d9e2`), V1-T3.1 (commit `9f18f51`), V1-T2/T2.1/T2.2 (commit `d6d70d0`) e V1-T1 (`2a3580c`) |
| Agente responsável  | Claude Code (Sonnet 5.5)                                               |
| Arquivos previstos  | `src/components/planning/*` (novo), `src/pages/PlanningPage.tsx` (novo), `src/utils/destinationSearch.ts` (novo), `src/App.tsx`, `src/pages/HomePage.tsx`, `src/components/Hero.tsx`, `src/components/ui/ProgressSteps.tsx`, `src/tests/{planningFlow,destinationSearch}.test.tsx` (novos), `PROJECT.md`, `ROADMAP.md`, `DECISIONS.md` (D32), `TASKS.md` |
| Status              | 🚧 **parcial por desenho**: etapa 4 implementada e validada localmente em 2026-10-12 (ver "Relatório do V1-T3.4"); etapas 5 a 7 pendentes; **sem commit** (aguarda autorização) |
| Próximo checkpoint  | Revisão/commit do V1-T3.4 e definição da etapa 5 (interesses), mediante autorização. Fotografias das atrações (Rio de Janeiro primeiro) em fase posterior. Reauditoria independente da importação (e push/publicação somente com autorização). Pendentes gerais: nova verificação independente (AUD-01 a AUD-07); evidência da publicação no GitHub Pages (URL HTTPS e execução do workflow), ver "Estado do Git e da publicação" abaixo |

> Registro anterior da fila (C5-T3/C5-T4, preservado): importação JSON e favicon concluídos, commits `2c883f2` e `bb441d4`.

> Registro anterior da fila (C5-T2, preservado): serviço de importação
> `src/services/itineraryImport.ts` e testes; ✅ validada localmente em
> 2026-10-12 e registrada no commit `b505a66`.

> Registro anterior da fila (preservado): "Nenhuma. Reconciliação documental
> concluída (2026-10-12), aguardando revisão do usuário"; último agente: Claude
> Code; status "livre para nova tarefa mediante autorização".

#### Skills ativas (biblioteca global, registrado em 2026-10-12)

Biblioteca: `C:\ProjetosDev\Skill-Library` (somente leitura; regras em
`AGENTS.md`, "Biblioteca Global de Skills"). IDs e caminhos conferidos no
`registry.yaml`.

| Campo               | Valor                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| Fase atual          | Remediação de persistência com reauditoria independente pendente e preparação da publicação experimental (ver ROADMAP.md) |
| Essenciais          | `tdd-testing`, `diagnosing-bugs`, `codebase-architecture`              |
| Auxiliares (sob demanda) | `security-review`, `react-next-best-practices`                   |
| Descartadas         | `domain-modeling`, `frontend-design`, `database-design`, `project-bootstrap`, `skill-router`, `find-skills` |
| Próximo checkpoint  | C3 (aguardando autorização)                                            |

Justificativa resumida:

- `tdd-testing`: regressões e lógica de negócio críticas (persistência,
  gerador); correções exigem teste que reproduza o defeito.
- `diagnosing-bugs`: a fase trata achados de auditoria (AUD-xx, TP-xx) por
  reprodução e causa raiz.
- `codebase-architecture`: preservar a separação interface/dados/serviços e
  evitar componentes grandes (`HomePage`, `itineraryStorage`).
- `security-review` (auxiliar): usar se a tarefa tocar armazenamento,
  exportação ou configuração de publicação; não há credenciais nem backend.
- `react-next-best-practices` (auxiliar): usar em mudanças de componentes
  React; o projeto não usa Next.js.
- Descartadas: `domain-modeling` (regras de negócio estáveis, sem nova
  modelagem), `frontend-design` (sem trabalho de UI nesta fase),
  `database-design` (sem banco; LocalStorage), `project-bootstrap`,
  `skill-router` e `find-skills` (projeto já estruturado e seleção feita).

##### Seleção de skills para a fase de redesign V1 (2026-10-12)

Complementa a tabela acima, que permanece como registro da fase anterior.

| Campo               | Valor                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| Fase                | Redesign visual V1 (Design System e telas com a nova identidade)       |
| Essenciais          | `tdd-testing`, `diagnosing-bugs`, `codebase-architecture` (inalteradas) |
| Auxiliares (sob demanda) | `security-review`, `react-next-best-practices`, **`frontend-design` (ativação seletiva, nova)** |
| Total               | 6 skills (limite: 3 auxiliares; acima de 8 exigiria justificativa)     |

- **Disponibilidade**: `frontend-design` consta no `registry.yaml` da
  biblioteca global (aprovada, versão 1.0.0,
  `frontend/frontend-design/SKILL.md`); a biblioteca está com a árvore limpa e
  não foi modificada.
- **Utilidade**: cobre hierarquia, espaçamento, estados, responsividade e
  consistência — o núcleo do redesign. Ativada somente em tarefas de interface
  (`avoid_when`: backend e migração de banco não se aplicam).
- **Sobreposições**: parcial com `react-next-best-practices` (limites de
  componentes) e nenhuma com `codebase-architecture`; as regras de
  acessibilidade e os tokens do D29 continuam valendo.
- **Riscos**: a skill é uma única frase genérica; "evitar complexidade
  decorativa" pode tensionar com a fidelidade à referência visual premium —
  nesse caso a referência oficial (`docs/references/`) prevalece. Não
  substitui verificação de contraste, foco e movimento reduzido.
- Nenhuma dependência instalada e nenhuma skill ou configuração global
  alterada.

Modelo para uma nova tarefa: tarefa · agente (Claude Code, Codex ou Kimi K3) ·
arquivos previstos · status (⬜ pendente, 🚧 em andamento, ✅ validada) ·
próximo checkpoint.

### Divergências documentais identificadas (2026-10-12)

Registradas sem alterar decisões técnicas anteriores; correção depende de
autorização.

1. **Histórico Git**: a D20 e o critério da tarefa 4.7 dizem "sem commits",
   mas o repositório já tem commits (ROADMAP, checkpoint 4: "histórico local
   existente"). D20/4.7 refletem o momento original, não o estado atual.
2. **Branch do workflow**: o corpo da D19 diz "push na `main`"; a revisão da
   própria D19 e a D27 alinham o gatilho a `master`, que é o que o
   `deploy.yml` usa.
3. **Ordem e numeração em DECISIONS.md**: D21–D26 aparecem entre a D14 e a
   D15, e a D27 após a D20. A numeração não é cronológica no arquivo, o que
   favorece colisão de números entre agentes.
4. **D21 × D22**: a D21 ainda descreve id com `crypto.randomUUID()` "com
   fallback", removido pela D22; a D21 também cita `discardCorruptedData`,
   removida na D23. As revisões existem, mas o texto original continua.
5. **Playwright**: o relatório de 2026-10-12 cita Playwright 1.59.1 e
   Chromium, que não constam do `package.json`. A origem da ferramenta não
   está registrada (regra de dependências desnecessárias).
6. **Comandos de validação**: o `AGENTS.md` exige `typecheck`, `test:run` e
   `build`; PROJECT.md, o workflow e os relatórios deste arquivo também usam
   `lint`.
7. **Título do checkpoint 4**: "Qualidade e Publicação" aqui; "Qualidade e
   Preparação de Publicação" no ROADMAP.
8. **Documentos de referência**: `docs/PERSISTENCE_REMEDIATION_PLAN.md` e
   `docs/FINAL_AUDIT_FINDINGS.md` governam a persistência, mas não constam
   da lista de arquivos canônicos do `AGENTS.md`.
9. **D3**: pressupõe o nome de repositório `Travel-Planner`; o remoto ainda
   não existe, então a suposição não foi confirmada.

### Estado do Git e da publicação (verificado em 2026-10-12)

Comandos executados em leitura: `git status --short`, `git branch
--show-current`, `git remote -v`, `git log -5 --oneline`.

- **Branch atual**: `master`.
- **Histórico**: 10 commits; o mais recente é `6b8ea0a chore: prepare Travel
  Planner for experimental deployment`.
- **Remoto**: `origin` → `https://github.com/kleytonforja/Travel-Planner.git`
  (fetch e push). `master` acompanha `origin/master`, e a referência local
  `origin/master` aponta para o mesmo commit do `HEAD` (`6b8ea0a`), ou seja,
  o push da `master` foi feito. A referência local pode estar defasada em
  relação ao GitHub; nenhuma consulta de rede foi feita.
- **Working tree**: apenas as alterações documentais desta reconciliação e das
  anteriores (nenhuma em `src/`).
- **Publicação experimental no GitHub Pages**: **não comprovada pelos
  registros do repositório.** Nenhum documento registra a URL HTTPS, a
  execução do workflow nem a configuração de Pages/ambiente `github-pages`.
  O remoto e o push são evidência indireta, não de publicação. Não registrar
  como publicada até haver evidência (URL e execução do workflow).

### Reconciliação das divergências acima (2026-10-12)

O conteúdo histórico não foi alterado; cada item recebe uma nota atual.

1. **Resolvida por nota**: D20 e a tarefa 4.7 descrevem o momento original.
   Estado atual: repositório com histórico e remoto `origin` (ver acima).
2. **Resolvida por nota**: o gatilho vigente do workflow é `master` (D19,
   revisão; D27). O texto original da D19 permanece como histórico.
3. **Preservada**: a ordem e os identificadores do `DECISIONS.md` não foram
   alterados, conforme instrução. A cronologia está nas datas e revisões.
4. **Resolvida por nota**: `DECISIONS.md` ganhou nota de reconciliação
   indicando que D22/D23 prevalecem sobre trechos da D21.
5. **Pendente**: origem do Playwright/Chromium segue sem registro. Não está
   no `package.json`; confirmar com o autor do relatório.
6. **Resolvida**: `typecheck`, `test:run`, `lint` e `build` são obrigatórios
   (`AGENTS.md`, "Validação antes de concluir tarefas").
7. **Pendente (cosmético)**: títulos do checkpoint 4 ainda diferem entre
   `TASKS.md` e `ROADMAP.md`; histórico mantido.
8. **Resolvida**: `docs/PERSISTENCE_REMEDIATION_PLAN.md` e
   `docs/FINAL_AUDIT_FINDINGS.md` referenciados em `AGENTS.md` e `PROJECT.md`.
9. **Parcialmente resolvida**: o remoto se chama `Travel-Planner`, o que é
   compatível com a D3; a URL publicada ainda não foi validada.

---

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
  o fingerprint de outro planejamento é preservado ao salvar — colisão
  SIMULADA pela fixture, sem cálculo de dois hashes iguais (o par exato
  da auditoria, fingerprint `roteiro-2cd27b6e`, não foi transcrito no
  plano — ambiguidade nº 9 — e o mecanismo foi reproduzido com
  planejamentos da base local; a colisão verdadeira, com fingerprints
  calculados, foi incorporada depois, em `trueCollisionAud07.test.ts`);
  interesses em ordens diferentes;
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

  **Revisão (encerramento documental AUD-07, 2026-10-11)**: o teste
  antigo foi renomeado para "colisão SIMULADA de identificadores" em
  `itineraryStorageIdentity.test.ts` (lógica e verificações
  preservadas), eliminando a nomenclatura que sugeria colisão real. O
  teste separado de colisão verdadeira
  (`trueCollisionAud07.test.ts`) foi conferido: ambos os fingerprints
  são efetivamente CALCULADOS e a igualdade comprovada. Registra-se
  explicitamente que a amostra histórica original citada pelo plano
  (64.851 roteiros aceitos e 837 sobrepostos) NÃO está disponível para
  reprodução independente — o corpus e o procedimento original não
  foram transcritos (ambiguidade nº 9) e nenhum dado ausente foi
  inventado. Nenhuma aprovação da auditoria final é declarada.
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
  sobrepostos — ambiguidade nº 9, valores não transcritos no plano;
  amostra original NÃO disponível para reprodução independente);
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
| AUD-02 | Mensagem falsa de preservação após resultado incerto                     | 🚧     | Correção residual da restauração implementada e validada (2026-10-12); nova verificação independente pendente |
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

**Revisão (correção final AUD-02, 2026-10-11)**: a garantia acima era
restrita à sessão da HomePage e não cobria o salvamento na ItineraryPage
seguido de navegação pela App. A auditoria independente reproduziu a falsa
afirmação após esse fluxo. A correção final remove a afirmação absoluta do
alerta genérico e o estado local que a condicionava; ver relatório ao final.

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

## Relatório da correção final AUD-02 — navegação após resultado incerto (2026-10-11)

- **Causa raiz**: a ItineraryPage exibe o resultado incerto retornado pelo
  serviço, mas a App remonta a HomePage ao voltar por "Novo planejamento".
  O estado local `mutationAttempted` reinicia como falso; a ausência de
  tentativa nessa nova instância não prova que nenhuma escrita ocorreu.
- **Correção mínima**: removidos o estado e suas quatro atribuições da
  HomePage. O alerta genérico de indisponibilidade orienta recarregar os
  roteiros e verificar o estado real dos dados antes de tentar alteração.
  Não contém mais a afirmação "Nenhum dado foi alterado.".
- **Arquivos modificados**: `src/pages/HomePage.tsx`,
  `src/tests/securityMessagesAud02.test.tsx`, `DECISIONS.md` e `TASKS.md`.
- **Regressão criada**: renderiza a App, preenche o formulário, gera e salva
  o roteiro, permite a escrita real no LocalStorage isolado do jsdom e
  bloqueia a confirmação e as leituras posteriores. Após exibir incerteza,
  navega por "Novo planejamento" até a HomePage e exige ausência da falsa
  afirmação e da falsa lista vazia. Confere uma única escrita, o conteúdo
  principal exato após navegar e a quarentena intacta, sem rollback.
- **TDD observado**: a nova regressão falhou antes da correção exatamente
  na afirmação de preservação; depois, os cinco testes de AUD-02 passaram.
  O teste de carga inicial indisponível foi ajustado à orientação neutra.
- **Validações executadas**: `npm run typecheck` sem erros;
  `npm run test:run` com 231 testes em 18 arquivos, todos passando;
  `npm run lint` com zero erros e avisos; `npm run build` com sucesso.
- **Escopo preservado**: contratos de persistência e recuperação, gerador,
  App e ItineraryPage sem mudanças; nenhuma dependência nova. Testes usam
  armazenamento isolado, sem alterar dados reais do navegador.
- **Riscos remanescentes**: resultado incerto ainda exige nova leitura para
  determinar o estado real; este teste não valida duas abas de navegador.
  Nenhum commit, push ou publicação executado.
- **AUD-02 aguarda nova auditoria independente**: implementação e validação
  local registradas; nenhuma aprovação final ou GO técnico declarado.

## Relatório da correção residual AUD-02 — restauração incerta (2026-10-12)

- **Causa raiz**: o painel de corrupção afirmava "Eles não foram alterados
  nem apagados" com base apenas na classificação da releitura. Após uma
  restauração com escrita efetiva e confirmação indisponível ou divergente,
  esse painel podia contradizer a mensagem de resultado incerto.
- **Correção**: substituída a afirmação absoluta por orientação para
  recarregar os roteiros e verificar o estado real dos dados antes de
  outra operação. Nenhum handler ou serviço de persistência foi alterado.
- **Arquivos alterados nesta tarefa**: `src/pages/HomePage.tsx`,
  `src/tests/securityMessagesAud02.test.tsx`, `DECISIONS.md` e `TASKS.md`.
- **Regressões adicionadas (2)**: principal inicialmente `[]`, quarentena
  com registro válido, confirmação da restauração e escrita real, seguidas
  de confirmação indisponível ou divergente. A releitura retorna conteúdo
  incompatível para exibir o painel de corrupção. Os testes exigem a
  mensagem de incerteza sem afirmação falsa, principal com o conteúdo
  restaurado exato, quarentena intacta, uma única escrita e zero remoções,
  sem rollback, repetição ou falso sucesso.
- **TDD observado**: as duas regressões falharam antes da correção
  exatamente na afirmação de preservação; após a correção, os sete testes
  de mensagens do AUD-02 passaram.
- **Validações executadas**: `npm run typecheck` sem erros;
  `npm run test:run` com 233 testes em 18 arquivos, todos passando;
  `npm run lint` com zero erros e avisos; `npm run build` com sucesso.
- **Escopo preservado**: gerador, arquitetura, dependências, formato v1,
  contratos de recuperação/quarentena e operações de escrita intactos.
  Alterações locais anteriores foram preservadas. Nenhum commit, push ou
  publicação executado.
- **Limites e riscos**: testes em jsdom com falhas injetadas, sem nova
  execução Playwright; resultado incerto ainda exige nova leitura para
  determinar o estado real. O par de colisão e o corpus histórico originais
  continuam indisponíveis. Esta correção não declara GO ou aceite integral
  dos 12 critérios; aguarda nova verificação independente e autorização
  para qualquer próxima etapa.

## Preparação local para publicação experimental (2026-10-12)

- **Estado**: preparação local concluída e validada; pronto para configurar
  o GitHub após autorização. Não constitui publicação nem aceite integral
  de produção.
- **Workflow**: gatilho de push alinhado à branch `master`. Execução manual,
  jobs de qualidade/deploy, permissões mínimas e artefato `dist/` preservados.
- **Interface**: aviso com o texto solicitado no rodapé compartilhado pela
  página inicial e pelo roteiro. Bloco destacado, semanticamente um `aside`
  com identificação acessível; informa perda possível de dados, ausência de
  sincronização/garantia permanente, exportação e ausência de importação.
- **Documentação**: Checkpoint 2 marcado concluído conforme implementação e
  QA; Checkpoint 4 descrito como preparação de publicação. ROADMAP separa
  demonstração experimental, configuração remota/publicação pendentes e
  aceite integral de produção. PROJECT registra o aviso; DECISIONS registra
  revisão da D19 e nova D27.
- **Arquivos modificados**: `.github/workflows/deploy.yml`,
  `src/components/Footer.tsx`, `PROJECT.md`, `ROADMAP.md`, `DECISIONS.md`
  e `TASKS.md`.
- **Validações executadas**: `npm run typecheck` sem erros;
  `npm run test:run` com 233 testes em 18 arquivos, todos passando;
  `npm run lint` com zero erros e avisos; `npm run build` com sucesso.
- **Verificação em navegador real**: Playwright 1.59.1 e Chromium 153,
  build de produção servido somente em localhost, contextos isolados e
  dados sintéticos. Quatro larguras (375, 768, 1366 e 1920 px), todas
  aprovadas: aviso visível e acessível nas duas páginas, texto solicitado
  completo e contraste 8,73:1; ausência de rolagem horizontal; geração,
  agenda sem sobreposição, resumo financeiro (custo 30, saldo 270, média
  15 para orçamento 300 em dois dias), salvar, reabrir, recarregar,
  exportação JSON e navegação preservados. Nenhum erro de página.
- **Escopo preservado**: nenhuma alteração nos serviços, gerador, resumo
  financeiro, persistência, exportação, navegação, dependências ou formato
  dos dados. A mudança visual reutiliza o rodapé e não acrescenta lógica
  de negócio ou estado.
- **Pendências**: configurar remoto, GitHub Actions, Pages e ambiente
  `github-pages`; aprovar commit/push/publicação; validar URL HTTPS e
  execução remota do workflow. Nenhuma dessas ações foi executada.
- **Riscos**: LocalStorage e quarentena não garantem preservação permanente;
  abas antigas podem ignorar locks; par de colisão e corpus histórico
  originais continuam indisponíveis. Não bloqueiam automaticamente a
  demonstração experimental, mas o aceite integral de produção permanece
  pendente. Firefox/WebKit e configurações remotas não foram verificados
  nesta preparação.

## Relatório do C5-T2 — serviço de importação de roteiros JSON (2026-10-12)

- **Escopo**: somente o serviço de leitura, reconstrução e validação do JSON
  exportado, mais seus testes. **Sem interface**: nada grava, abre ou lê
  arquivos ainda (isso é o C5-T3). Importação não fazia parte do MVP; a
  mudança de escopo (PROJECT, ROADMAP, DECISIONS/D28, rodapé) fica para a
  entrega da interface, conforme a restrição desta tarefa.
- **Arquivos criados**: `src/services/itineraryImport.ts` e
  `src/tests/itineraryImport.test.ts`. **Alterado**: `TASKS.md` (Fila atual e
  este relatório). `itineraryStorage.ts`, `itineraryExport.ts`, páginas,
  componentes, PROJECT, ROADMAP e DECISIONS não foram tocados.
- **Contrato**: `parseItineraryImport(text: string): ItineraryImportResult`,
  `{ ok: true, itinerary }` (sem `id` nem `savedAt`) ou
  `{ ok: false, code, message, details }`. Códigos: `invalid-json`,
  `too-large`, `not-an-export`, `recovery-envelope`, `unsupported-version`,
  `invalid-structure`, `unknown-destination`, `unknown-activity`,
  `catalog-mismatch`, `invalid-schedule`, `invalid-warnings`,
  `validation-failed`. Constantes: `IMPORT_MAX_FILE_BYTES` (256 KB),
  `IMPORT_MAX_WARNINGS` (50), `IMPORT_MAX_WARNING_LENGTH` (500).
- **Comportamento**: entrada tratada como não confiável; lê só propriedades
  próprias e conhecidas, monta objetos novos (campos extras e `__proto__`
  são ignorados); reconstrói atividades pelo catálogo atual (cópias
  independentes) e rejeita divergência de custo, duração, categorias, país ou
  moeda; interpreta `"HH:MM – HH:MM"`; valida o resultado com o mesmo
  `validateSavedItinerary` usado na leitura e na gravação (regras de AUD-03 e
  AUD-04 incluídas). Não acessa o armazenamento, não gera identificador e não
  executa conteúdo do arquivo.
- **Testes**: 119 em `src/tests/itineraryImport.test.ts` (TDD: a suíte foi
  escrita antes do serviço e falhou por ausência do módulo). Cobrem ida e
  volta com a exportação real (inclusive varredura de destinos, estilos,
  interesses, dias e orçamentos), JSON inválido, versão incompatível,
  envelope de recuperação, campos ausentes e de tipo inválido, atividades
  desconhecidas, divergência com o catálogo, valores financeiros alterados
  (inclusive custo acima do orçamento por 5e-7), horários inválidos e
  sobrepostos, dias inconsistentes, avisos excessivos ou inválidos, BOM,
  campos adicionais maliciosos, ausência de efeitos no armazenamento e
  entradas extremas. Uma mutação deliberada (leitura de propriedades
  herdadas) fez exatamente o teste de protótipos falhar e foi revertida.
- **Validações executadas (resultados reais)**: `npm run typecheck` sem
  erros; `npm run test:run` com 352 testes em 19 arquivos, todos passando
  (233 anteriores + 119 novos); `npm run lint` com saída vazia e código 0;
  `npm run build` com sucesso.
- **Skills consultadas**: `tdd-testing` e `security-review` (seleção da fase
  mantida; `codebase-architecture` e `react-next-best-practices` não foram
  necessárias nesta etapa).
- **Limitações e riscos**: arquivos exportados com uma base de dados
  diferente são rejeitados (por decisão); o serviço depende do formato de
  exportação v1 e do catálogo atual; a definição de `savedAt`, a gravação, a
  confirmação de duplicatas e o tratamento de erro de armazenamento ficam na
  interface do C5-T3, reutilizando `saveItinerary`; a nova superfície deve
  entrar na próxima reauditoria independente. Nada foi declarado corrigido ou
  aprovado em auditoria.

## Relatório do C5-T3 — interface e integração da importação JSON (2026-10-12)

- **Escopo**: componente de importação na página inicial, integração com o
  serviço do C5-T2 e com `saveItinerary`, testes de interação, aviso do
  rodapé e documentação da mudança de escopo (D28). C5-T2 já estava no Git
  (`b505a66`) e a árvore estava limpa antes de iniciar.
- **Implementado**: `src/components/ImportItinerary.tsx` — arquivo acima de
  256 KB é recusado antes da leitura; `parseItineraryImport`; mensagens e
  motivos claros quando inválido (sem gravar); pré-visualização (destino,
  dias, estilo, interesses, atividades, orçamento, custo ilustrativo e
  avisos); "Confirmar importação" e "Cancelar"; gravação exclusivamente por
  `saveItinerary`; `needs-confirmation` usa o painel de substituição
  vinculado ao conteúdo; sucesso só depois da confirmação do serviço; lista
  relida após toda tentativa de gravação. Integração em
  `src/pages/HomePage.tsx` (montagem do componente, `onBusyChange` para
  bloquear ações concorrentes e relida da lista). Rodapé atualizado somente
  depois da funcionalidade pronta.
- **Integridade**: o registro importado recebe UUID e `savedAt` gerados na
  gravação (nada do arquivo é reaproveitado); nenhuma escrita direta no
  LocalStorage; autorização de substituição descartada ao cancelar, concluir,
  falhar ou quando a página observa outro conteúdo; importação bloqueada
  quando o armazenamento não está legível (`ok`/`empty` apenas) e durante
  outras operações; quarentena e dados brutos preservados; texto do arquivo
  sempre renderizado como texto (sem HTML).
- **Arquivos criados**: `src/components/ImportItinerary.tsx`,
  `src/tests/itineraryImportInteraction.test.tsx`. **Alterados**:
  `src/pages/HomePage.tsx`, `src/components/Footer.tsx`, `PROJECT.md`,
  `ROADMAP.md`, `DECISIONS.md` (D28), `TASKS.md`. `itineraryStorage.ts`,
  `itineraryExport.ts` e `itineraryImport.ts` não foram tocados.
- **Testes novos (29)**: importação válida (também com armazenamento vazio);
  pré-visualização sem gravação; cancelamento; lista atualizada só após o
  sucesso; arquivo inválido, acima de 256 KB (sem leitura), versão
  incompatível, envelope de recuperação, outro aplicativo, divergência com a
  base e totais adulterados; HTML tratado como texto; duplicata com
  confirmação, cancelamento, substituição, confirmação desatualizada e
  autorização descartada; quota, armazenamento indisponível (inicial e
  posterior), ausência de Web Locks e resultado incerto; quarentena
  preservada, coleção corrompida e bloqueio de ações concorrentes;
  acessibilidade (rótulo, descrição, foco na pré-visualização, papéis ARIA) e
  aviso do rodapé. Três mutações deliberadas (sem descarte de autorização
  desatualizada, sem limite antes da leitura, sem releitura da lista) fizeram
  testes falharem e foram revertidas.
- **Validações executadas (resultados reais)**: `npm run typecheck` sem
  erros (um erro de tipo no teste foi corrigido); `npm run test:run` com 381
  testes em 20 arquivos, todos passando (233 + 119 do C5-T2 + 29 novos);
  `npm run lint` com saída vazia e código 0 (um aviso de
  `set-state-in-effect` foi eliminado ajustando o estado durante a
  renderização); `npm run build` com sucesso.
- **Skills consultadas**: `tdd-testing`, `security-review`,
  `react-next-best-practices` e `codebase-architecture` (seleção da fase
  mantida).
- **Riscos e limitações**: sem verificação em navegador real (somente jsdom);
  arquivos exportados com outra versão da base são rejeitados; a seleção de
  arquivo usa `FileReader` e `accept` do navegador; a nova superfície ainda
  não passou por reauditoria independente; nada foi declarado corrigido ou
  aprovado. Nenhum commit, push ou publicação.

## Verificação funcional em Chromium — importação JSON (C5-T3, 2026-10-12)

- **Ambiente**: build de produção (`npm run build`) servido apenas em
  `127.0.0.1:4173` com `vite preview` (encerrado ao final); Chromium 1243 já
  presente no cache do Playwright do usuário, acionado por `playwright-core`
  1.59.1 de uma instalação global existente (n8n) — **nenhuma dependência do
  projeto foi adicionada ou alterada** e nada foi instalado. Contexto isolado,
  dados sintéticos; roteiros e scripts de apoio ficaram fora do repositório.
- **Resultado**: 28 verificações, 28 aprovadas. Fluxo executado de ponta a
  ponta: gerar e salvar um roteiro de Lisboa (3 dias), exportar o JSON (v1,
  3.008 bytes), excluir o registro, importar o arquivo exportado,
  pré-visualização (destino, dias, estilo, interesses, atividades, orçamento,
  custo ilustrativo e foco na pré-visualização), cancelar (nada gravado),
  confirmar (registro novo com UUID e `savedAt` da importação, diferentes dos
  do arquivo; itinerário coerente com o exportado), atualizar a página
  (persistência idêntica), reimportar (duplicata pede confirmação, cancelar não
  altera, confirmar substitui preservando o id), recusa de arquivo não JSON,
  versão incompatível, envelope de recuperação, divergência com a base e
  arquivo de 300 KB (sem gravação e sem quarentena criada), ausência de
  rolagem horizontal em 375 px, aviso do rodapé, ausência de erros de página e
  de requisições externas.
- **Achado fora do escopo (pré-existente)**: o navegador registra um 404 para
  `/favicon.ico` ao apenas abrir a página, pois `index.html` não declara ícone
  e `public/` está vazio. Não tem relação com a importação e não foi alterado;
  a verificação de console exclui esse item de forma explícita.
- **Limites**: apenas Chromium (Firefox e WebKit não verificados); o seletor
  de arquivo foi acionado por `setInputFiles`, sem o diálogo nativo do sistema.

## Relatório do C5-T4 — finalização da importação JSON e favicon (2026-10-12)

- **Conclusão da importação JSON**: serviço (C5-T2, `b505a66`) e interface
  (C5-T3, `2c883f2`) concluídos, validados localmente e em Chromium real
  (28 verificações).
- **Auditoria independente**: informada pelo usuário como **aprovada** (Codex),
  com 148 testes específicos da importação. O relatório da auditoria não está
  no repositório; este registro reproduz a informação recebida e não a
  substitui. A verificação independente de AUD-01 a AUD-07 segue pendente.
- **Favicon**: `public/favicon.svg` (traço do ícone `Plane` do Lucide, o mesmo
  do cabeçalho, em quadrado azul `blue-600`) e `<link rel="icon">` em
  `index.html`. O build gera `href="/Travel-Planner/favicon.svg"` e o servidor
  de preview responde 200 `image/svg+xml` nesse caminho. `/favicon.ico` na raiz
  continua inexistente, mas os navegadores usam o link declarado. Não foi
  repetida a navegação completa em Chromium após esta mudança.
- **Arquivos**: criado `public/favicon.svg`; alterados `index.html`,
  `DECISIONS.md` (revisão da D28), `ROADMAP.md`, `TASKS.md`. Lógica de
  importação, serviços e dependências não foram tocados.
- **Validações executadas**: `typecheck` sem erros; `test:run` com 381 testes
  em 20 arquivos passando; `lint` código 0; `build` com sucesso.
- **Riscos residuais**: apenas Chromium verificado; seletor nativo de arquivo
  não exercitado; arquivos exportados com outra versão da base são rejeitados
  (por decisão); a importação depende do formato de exportação v1 e do
  catálogo atual; reauditoria de AUD-01 a AUD-07 pendente; push e publicação
  não executados.

## Relatório do V1-T1 — fundamentos do Design System (2026-10-12)

- **Escopo**: tokens, estilos globais e primitivos reutilizáveis para o
  redesign, sem reconstruir o aplicativo, sem tocar no motor de planejamento,
  na persistência nem na importação/exportação (D29).
- **Skills consultadas**: `frontend-design` (descartada na seleção da fase em
  "Skills ativas"; consultada sob demanda, **sem alterar a seleção** — decisão
  pendente abaixo), além de `tdd-testing`, `react-next-best-practices` e
  `codebase-architecture`.
- **Implementado**: `src/index.css` (tokens `@theme`, foco visível padrão,
  `prefers-reduced-motion`, utilitários `focus-ring`, `focus-ring-on-dark` e
  `bg-night-gradient`); `src/components/ui/` com `Button`, `Card`,
  `CategoryBadge`, `SearchField`, `ProgressSteps` e `variants.ts`. `Hero` e
  `DestinationCard` passaram a usar `Button`/`Card`; os demais primitivos
  ficam preparados para as próximas telas e ainda não aparecem na interface.
- **Aparência preservada (evidência)**: capturas de página inteira em
  Chromium (1280 px e 375 px) do build anterior e do novo têm o mesmo SHA-256;
  a única diferença de estilo computado é `column-gap` nos CTAs do Hero (sem
  efeito, conteúdo só de texto) e o foco por teclado em um elemento sem estilo
  próprio, que passou do contorno padrão do navegador para o anel azul de 2 px.
- **Contraste**: verificado por teste a partir dos tokens (texto ≥ 4,5:1,
  elementos de interface ≥ 3:1): por exemplo ink/superfície 17,84; texto
  atenuado 7,56; discreto 4,77; branco sobre brand-600 5,26; texto noturno
  15,83; categorias entre 6,38 e 8,06. Defeito encontrado e corrigido: número
  branco sobre brand-500 (3,76:1) no indicador de progresso sobre fundo escuro.
- **Testes**: `src/tests/designSystem.test.tsx` com 52 casos (tokens,
  contraste, movimento reduzido, foco, botões, cards, categorias, busca,
  progresso e adoção em Hero/DestinationCard). Total da suíte: 433 testes em
  21 arquivos.
- **Validações executadas (resultados reais)**: `typecheck` sem erros (um erro
  de tipos Node no teste foi resolvido com referência de tipos restrita ao
  arquivo, sem mexer em `tsconfig`); `test:run` com 433 testes passando em duas
  execuções consecutivas; `lint` com código 0; `build` com sucesso;
  `git diff --check` sem problemas. Uma execução intermediária da suíte falhou
  em todos os arquivos ("no tests") e não se reproduziu em quatro execuções
  seguintes; a causa não foi identificada.
- **Arquivos**: criados `src/components/ui/{Button,Card,CategoryBadge,
  SearchField,ProgressSteps}.tsx`, `src/components/ui/variants.ts`,
  `src/tests/designSystem.test.tsx`; alterados `src/index.css`,
  `src/components/Hero.tsx`, `src/components/DestinationCard.tsx`,
  `PROJECT.md`, `ROADMAP.md`, `DECISIONS.md`, `TASKS.md`. Nenhuma dependência
  alterada; `package.json` e serviços intactos.
- **Riscos e limitações**: apenas Chromium; CSS gerado maior (+8,9 KB, cerca de
  +1,4 KB comprimido); primitivos sem uso nas telas ainda; fotografias, fundo
  noturno e navegação progressiva ainda não aplicados; Inter sem carregamento
  explícito. Nenhum commit, push ou deploy.

## Relatório do V1-T2 — nova Home (2026-10-12)

- **Status**: **parcial**. A Home foi implementada e validada, mas a
  fidelidade à referência é **parcial** porque não há fotografias: nenhuma
  imagem local tinha origem e licença identificáveis e obter imagens de
  terceiros exigiria operação externa sem autorização (AGENTS.md). Foram usadas
  ilustrações vetoriais originais, declaradas na interface (D30).
- **Skills**: `frontend-design` consultada (auxiliar ativada no V1-T1), mais
  `tdd-testing`, `react-next-best-practices` e `codebase-architecture`.
- **Implementado**: cabeçalho escuro integrado (`Header tone="dark"`); `Hero`
  com cena de baía ao pôr do sol, título, descrição, CTAs e quatro destaques
  verdadeiros; painel "Destinos em destaque" sobreposto ao hero;
  `DestinationCard` com imagem, moeda, país, descrição, atrações e
  indicadores de categoria coloridos; `Card` variante `media`; `CategoryBadge`
  variante `dot`; `scenes.tsx` (ilustrações originais); reordenação da
  `HomePage` (hero, destinos, formulário atual, salvos, importação, como
  funciona). Formulário de planejamento mantido até o V1-T3.
- **Ações preservadas**: selecionar destino (preenche o formulário), gerar e
  salvar, abrir roteiro salvo, importar JSON e excluir roteiro (a exclusão já
  era imediata e vinculada ao conteúdo observado, **sem diálogo de
  confirmação**; não foi alterada por restrição de não mexer na persistência).
- **Comparação visual com a referência** (capturas em Chromium a 375, 768, 1366
  e 1920 px, comparadas visualmente com a imagem aprovada): semelhantes na
  composição (cabeçalho escuro, hero com título em três linhas, selo, dois CTAs,
  quatro destaques com ícones circulares, painel branco arredondado sobreposto,
  três cards com moeda, atrações e ícones de categoria coloridos). **Diferenças
  restantes**: (1) ilustração no lugar de fotografia panorâmica e fotos dos
  destinos; (2) hero menos vívido que a fotografia; (3) sem avatar, alternância
  de tema, selo de localização e "Ver todos" (sem função); (4) destaques com
  textos verdadeiros (a referência cita mapa, fotos e modo offline, inexistentes);
  (5) botão de destino em largura total, não circular; (6) em 1920 px o
  conteúdo permanece em coluna de 72 rem, deixando mais área livre que o modelo;
  (7) em 768 px os cards ficam em duas colunas. Não se declara fidelidade
  perfeita.
- **Contraste medido** (pior caso, pixel mais claro atrás do texto, 375/768/
  1366/1920 px): h1 ≥ 9,6; parágrafo ≥ 5,6; selo ≥ 6,8; destaques ≥ 6,9;
  botão primário 5,25; botão secundário ≥ 11,8. Antes dos ajustes havia
  falhas (botão secundário 1,8 a 3,7:1; selo 4,3:1; destaques 3,5:1),
  corrigidas com fundo escuro translúcido no botão e no selo e gradiente
  inferior mais forte.
- **Chromium (11 verificações aprovadas)**: seleção de destino, geração,
  salvamento, reabertura, importação disponível, exclusão, ordem de tabulação
  (pular, logo, navegação, CTAs), foco visível de 2 px, ausência de erros,
  `prefers-reduced-motion` (rolagem automática e transições mínimas) e rolagem
  suave quando não há preferência. Sem rolagem horizontal em 375, 768, 1366 e
  1920 px.
- **Testes**: `src/tests/homeRedesign.test.tsx` (9 casos) e ajustes em
  `designSystem.test.tsx` (+2 casos: card com mídia e categoria em círculo).
  Total: 444 testes em 22 arquivos.
- **Validações executadas (resultados reais)**: `typecheck` sem erros; `lint`
  código 0; `test:run` com 444 testes passando em duas execuções
  consecutivas; `build` com sucesso (CSS 41,0 KB, 7,9 KB comprimido);
  `git diff --check` sem problemas.
- **Arquivos**: criados `src/components/ui/scenes.tsx` e
  `src/tests/homeRedesign.test.tsx`; alterados `Header.tsx`, `Hero.tsx`,
  `DestinationCard.tsx`, `DestinationsSection.tsx`, `ui/CategoryBadge.tsx`,
  `ui/variants.ts`, `HomePage.tsx`, `designSystem.test.tsx`, `PROJECT.md`,
  `ROADMAP.md`, `DECISIONS.md` (D30) e `TASKS.md`. Motor de planejamento,
  persistência, importação/exportação e dependências intactos.
- **Riscos**: apenas Chromium; sem fotografias; dependência de decisão sobre
  fonte de imagens; formulário ainda no formato antigo até o V1-T3.

## Relatório do V1-T2.1 — fotografias reais e refinamento da Home (2026-10-12)

- **Escopo (ajustado pelo usuário)**: fotografia do hero, fotografias dos três
  destinos, refinamento visual e três colunas no desktop. **Sem** fotografias
  das atrações (fase posterior, começando pelas dez do Rio de Janeiro) e sem
  alterar motor, catálogo ou persistência.
- **Skills**: `frontend-design` (ativada seletivamente) e `tdd-testing`,
  `react-next-best-practices`, `codebase-architecture`.
- **Fotografias incorporadas (4)**, todas do Unsplash, Unsplash License,
  verificadas página a página (detalhes em `docs/IMAGE_CREDITS.md`): hero —
  Mauro Lima, Rio de Janeiro ao pôr do sol (Mirante Dona Marta);
  Florianópolis — Henrique Pereira; Rio de Janeiro — Lucas Campoi (Baía de
  Guanabara e Pão de Açúcar); Lisboa — Sarah Markstaller (elétrico em rua
  histórica). **Pendentes**: fotografias das atrações individuais; fotografia
  de Florianópolis que nomeie a Ponte Hercílio Luz (a atual é identificada por
  etiqueta e aparência, com texto alternativo genérico). Pexels não foi
  utilizado (acesso automatizado recusado, 403).
- **Como foram verificadas**: o Unsplash bloqueia o acesso automatizado às
  páginas (resposta "not a bot"; **não houve tentativa de contornar**). A
  verificação de autor, local, data e licença foi feita pela ferramenta de
  consulta web; as imagens foram baixadas do CDN público `images.unsplash.com`
  (sem chave de API), convertidas para WebP pelos parâmetros do próprio CDN e
  conferidas visualmente antes de serem incorporadas.
- **Implementado**: `public/images/hero|destinations` (1,2 MB no total);
  `src/data/photos.ts` (arquivos, dimensões, alt e crédito);
  `src/components/ui/photos.tsx` (`HeroPhoto` e `DestinationPhotoImage`, com
  ilustração como substituta em caso de erro); hero com `fetchpriority="high"`,
  cards com `loading="lazy"`; créditos no rodapé; aviso da seção de destinos
  atualizado; sobreposições escuras do hero ajustadas.
- **Medições no Chromium (build de produção, `/Travel-Planner/`)**: todas as
  imagens respondem 200 sob o caminho base; `srcset` escolhe 960 px no celular
  e 1920 px no desktop; cards usam as versões de 640 px; **CLS = 0**; sem
  rolagem horizontal em 375, 768, 1366 e 1920 px; sem erros de página ou
  console; 11 verificações funcionais aprovadas (seleção de destino, geração,
  salvamento, abertura, importação, exclusão, teclado, foco, movimento
  reduzido). Os três cards ficam na mesma linha a partir de 1024 px.
- **Contraste do texto sobre a fotografia**: a primeira medição **reprovou**
  (h1 1,7:1 e parágrafo 1,7:1 em 375 px; h1 3,1:1 e parágrafo 4,1:1 em 1366 px).
  Corrigido com camada escura uniforme (55% abaixo de `lg`, 30% a partir de
  `lg`). Resultado final (99% dos pixels atrás do texto, 375 a 1920 px):
  todos ≥ 4,5:1; pior pixel ≥ 4,9:1.
- **Comparação visual com a referência**: composição próxima (cabeçalho
  integrado, hero fotográfico do Rio com Pão de Açúcar à direita e texto à
  esquerda, painel branco sobreposto, três cards fotográficos na mesma linha
  com moeda, atrações e ícones coloridos). **Diferenças restantes**: hero mais
  escuro e menos vívido que a referência (preço do contraste); fotografia do
  hero com composição e hora do dia distintas; sem avatar, alternância de tema,
  selo de localização e "Ver todos" (sem função); botão de destino em largura
  total (não circular); em 1920 px o conteúdo permanece em coluna de 72 rem.
  Comparação visual, não pixel a pixel.
- **Testes**: `homeRedesign.test.tsx` passou a cobrir fotografia do hero
  (prioridade, dimensões, srcset, base do Vite), fotografias dos cards,
  substituição por ilustração quando a imagem falha (hero e card) e créditos
  no rodapé. Total: 447 testes em 22 arquivos.
- **Validações executadas (resultados reais)**: `typecheck` sem erros; `lint`
  código 0; `test:run` com 447 testes passando em duas execuções; `build`
  com sucesso; `git diff --check` sem problemas.
- **Arquivos**: criados `docs/IMAGE_CREDITS.md`, `public/images/**` (8 WebP),
  `src/data/photos.ts`, `src/components/ui/photos.tsx` (além de `scenes.tsx` e
  `homeRedesign.test.tsx`, do V1-T2); alterados `Hero.tsx`, `DestinationCard.tsx`,
  `DestinationsSection.tsx`, `Footer.tsx`, `HomePage.tsx`, `Header.tsx`,
  `ui/CategoryBadge.tsx`, `ui/variants.ts`, `designSystem.test.tsx`, `PROJECT.md`,
  `ROADMAP.md`, `DECISIONS.md` (D30, D31) e `TASKS.md`. Motor, persistência,
  importação/exportação e dependências intactos. Biblioteca de skills não tocada.
- **Riscos**: apenas Chromium; a licença do Unsplash proíbe vender as fotos sem
  modificação (não é o caso); a foto de Florianópolis não nomeia a Hercílio Luz;
  hero mais escuro que a referência; imagens hospedadas no repositório (+1,2 MB).
  Nenhum commit, push ou deploy.

## Relatório do V1-T2.2 — refinamento final e consolidação da Home (2026-10-12)

- **Escopo**: somente dois refinamentos aprovados pelo usuário e a consolidação
  de V1-T2 e V1-T2.1 em um commit local. Skill `frontend-design` consultada
  seletivamente.
- **A. Fotografia do hero mais clara**: a camada escura passou de 55% para 50%
  abaixo de `md`, 40% de `md` a `lg` e 12% a partir de `lg` (antes 30%), com
  gradiente lateral e de base um pouco mais suaves, preservando o lado do texto.
  A região central e direita da foto ficou visivelmente mais clara nas capturas.
- **B. Espaço vertical do hero reduzido**: preenchimento superior de
  `pt-14/sm:pt-20/lg:pt-24` para `pt-10/sm:pt-14/lg:pt-16`, inferior de
  `pb-32/sm:pb-40` para `pb-28/sm:pb-32/lg:pb-36` e margem dos destaques de
  `mt-12` para `mt-10`. Em 1366 px o painel "Destinos em destaque" subiu cerca de
  56 px; a sobreposição do painel e a legibilidade foram mantidas.
- **Contraste medido após os ajustes** (375, 768, 1366 e 1920 px, pixels atrás
  do texto): texto normal (parágrafo, selo e descrições dos destaques) ≥ 4,75:1
  mesmo no pior pixel; 99% dos pixels ≥ 4,5:1 em todos os elementos. O título
  (texto grande, mínimo 3:1) ficou ≥ 3,87:1 no pior pixel e ≥ 4,5:1 em 99%.
  Durante o ajuste, uma tentativa intermediária (tablet com 30%) deixou o
  parágrafo em 4,29:1 no pior pixel; foi corrigida para 40%.
- **Verificação visual no Chromium** (375, 768, 1366 e 1920 px): sem rolagem
  horizontal, sem erros de página nem de console; 11 verificações funcionais
  aprovadas (seleção de destino, geração, salvamento, abertura, importação,
  exclusão, teclado, foco, movimento reduzido). Fotografias reais, cards em
  três colunas no desktop, indicadores coloridos, navegação, formulário atual,
  importação e exportação e roteiros salvos preservados.
- **Validações executadas (resultados reais)**: ver o resumo da entrega;
  `typecheck`, `lint`, `build` e `git diff --check` sem problemas e 447 testes
  passando em duas execuções.
- **Arquivos**: `src/components/Hero.tsx` e esta documentação (`TASKS.md`,
  `ROADMAP.md`). Nenhuma alteração em motor, persistência, importação/exportação,
  dependências ou biblioteca de skills.
- **Riscos**: apenas Chromium; hero ainda mais escuro que a referência (limite
  imposto pelo contraste); fotos das atrações e da Hercílio Luz pendentes.

## Relatório do V1-T3.1 — estrutura do planejamento progressivo e seleção visual de destino (2026-10-12)

- **Escopo**: estrutura de sete etapas, indicador de progresso e **somente** a
  etapa de destino. Etapas 2 a 7 **não** foram implementadas. Sem alterações no
  motor de roteiros, na persistência, na importação/exportação nem em
  dependências. Skill `frontend-design` ativada seletivamente. Base: commit
  `d6d70d0`.
- **Implementado**: `src/components/planning/{planningSteps.ts,stepRegistry.ts,
  PlanningFlow.tsx,DestinationStep.tsx}`; `src/pages/PlanningPage.tsx`;
  `src/utils/destinationSearch.ts`; `App.tsx` com o rascunho e a nova tela;
  `HomePage` com `initialDestinationId`, `onDestinationChange` e
  `onStartPlanning` (props opcionais); `Hero` com `onStartPlanning`;
  `ProgressSteps` com quebra de linha e rótulos a partir de `lg`. Decisão D32.
- **Funcionalidades**: pergunta "Para onde vamos viajar?"; pesquisa por nome,
  país, descrição e categoria; filtros Todos, países e categorias; cards
  fotográficos com categorias coloridas; seleção por mouse, toque e teclado com
  destaque; preservação da seleção entre home e planejamento na sessão;
  formulário tradicional mantido e pré-preenchido, acessível pelo botão
  "Continuar com o formulário tradicional" e pelo menu "Planejar".
- **Chromium (build de produção)**: 21 verificações aprovadas: abertura pelo
  hero, indicador com as sete etapas na ordem, cards com fotografia carregada,
  pesquisa e filtro (1 e 2 cards), mensagem de vazio e limpeza, seleção por
  teclado (Enter) e por clique, destaque do card, preservação da seleção ao voltar
  e retornar, formulário tradicional aberto com o destino e ainda gerando o
  roteiro, ausência de erros de página e de console; sem rolagem horizontal em
  375, 768, 1366 e 1920 px (cards em 3, 2, 1 e 1 linhas). Seleção por **toque** não
  foi testada em dispositivo real (o clique equivalente passou).
- **Observação de captura**: o botão selecionado aparecia esmaecido numa
  captura feita no meio da transição de cor; medido após a transição, usa fundo
  claro, texto azul e opacidade 1.
- **Testes**: `planningFlow.test.tsx` (14 casos) e `destinationSearch.test.ts`
  (13). Uma mutação deliberada (remover o destino inicial da home) fez dois testes
  falharem e foi revertida. Total: 474 testes em 24 arquivos.
- **Validações executadas (resultados reais)**: `typecheck` sem erros; `lint`
  código 0; `test:run` com 474 testes passando em duas execuções; `build` com
  sucesso; `git diff --check` sem problemas.
- **Pendente**: etapas 2 a 7 (Datas, Viajantes, Transporte, Interesses,
  Orçamento, Revisão) e a geração do roteiro pelo fluxo progressivo; persistência
  do rascunho entre sessões; remoção do formulário tradicional.
- **Riscos**: o fluxo ainda termina no formulário tradicional; apenas Chromium; o
  filtro por categoria usa as categorias das atividades (todos os destinos têm
  várias, então filtra pouco).
- **Arquivos**: criados `src/components/planning/*` (4), `src/pages/PlanningPage.tsx`,
  `src/utils/destinationSearch.ts`, `src/tests/planningFlow.test.tsx`,
  `src/tests/destinationSearch.test.ts`; alterados `App.tsx`, `HomePage.tsx`,
  `Hero.tsx`, `ui/ProgressSteps.tsx`, `PROJECT.md`, `ROADMAP.md`, `DECISIONS.md` e
  `TASKS.md`. Nenhum commit, push ou deploy.

### Consolidação do V1-T3.1 (2026-10-12)

- **Refinamento**: filtros da etapa Destino separados em **Localização** (Todos,
  Brasil, Portugal, com ícone de local) e **Categorias dos destinos** (ícones
  coloridos), cada grupo com legenda visível e nome acessível, mais a nota "Estes
  controles apenas filtram os destinos listados abaixo. Os seus interesses de
  viagem serão escolhidos em uma etapa própria." Filtro continua de escolha única;
  a seleção múltipla de interesses fica para a etapa 5.
- **Formulário tradicional**: preservado na home; **será substituído somente após
  a conclusão do wizard** (etapas 2 a 7). Registrado em D32, ROADMAP e PROJECT.
- **Testes**: +2 casos em `planningFlow.test.tsx` (grupos e nota; escolha única).
  Total: 476 testes em 24 arquivos.
- **Chromium**: 21 verificações aprovadas novamente, sem rolagem horizontal em
  375, 768, 1366 e 1920 px; capturas conferidas em 375 e 1366 px.
- **Validações executadas (resultados reais)**: ver o resumo da entrega;
  `typecheck`, `lint`, `build` e `git diff --check` sem problemas.

## Relatório do V1-T3.2 — planejamento progressivo: datas e duração (2026-10-12)

- **Status**: implementado e validado localmente; **sem commit, push ou deploy**.
  Etapas 3 a 7 pendentes.
- **Funcionalidades**: etapa 2 "Quando começa sua aventura?" com dois cards
  (`Já tenho as datas` / `Ainda não defini as datas`); modo datas com duração
  inclusiva calculada e validação (data inexistente, término antes do início,
  início no passado, mais de 14 dias); modo duração com atalhos 3/5/7/10/14 e
  valor personalizado (inteiro de 1 a 14); alternar modos preserva valores;
  voltar/continuar com foco no título; resumo de destino e duração; formulário
  tradicional pré-preenchido com a duração (`initialDays`). Decisão em D33.
- **Fotografias dinâmicas**: registrada como decisão futura aprovada em D33 e no
  ROADMAP; **não implementada**.
- **Arquivos**: novos `src/utils/tripDates.ts`, `src/components/planning/DatesStep.tsx`,
  `src/tests/tripDates.test.ts`, `src/tests/datesStep.test.tsx`; alterados
  `planningSteps.ts`, `stepRegistry.ts`, `PlanningFlow.tsx`, `PlanningForm.tsx`,
  `HomePage.tsx`, `App.tsx`, `src/tests/planningFlow.test.tsx`, `DECISIONS.md`,
  `ROADMAP.md`, `PROJECT.md`, `TASKS.md`. Motor, persistência e importação/exportação intocados.
- **Chromium** (build servida por `vite preview`): 27 de 27 verificações
  aprovadas; sem rolagem horizontal em 375, 768, 1366 e 1920 px. Em
  `prefers-reduced-motion`, a transição mede 0,00001 s: vem da regra global de
  `index.css` (`0.01ms !important`, não nulo de propósito); só há transição de cor,
  sem movimento. O critério do script (0 s exato) foi corrigido para "<= 1 ms".
- **Riscos**: apenas Chromium; o seletor nativo de data varia por navegador; o
  fluxo ainda termina no formulário tradicional.

## Relatório do V1-T3.3 — planejamento progressivo: viajantes (2026-10-12)

- **Status**: implementado e validado localmente; **sem commit, push ou deploy**.
  Etapas 4 a 7 pendentes. Próxima etapa: Transporte.
- **Funcionalidade**: etapa 3 "Quem vai viajar com você?" com contadores
  (−/+, alvos de 44 px) de adultos (padrão 1), crianças e bebês; faixas etárias
  opcionais das crianças; perfil opcional (Individual/Casal/Família/Amigos),
  nunca inferido; necessidades de acessibilidade opcionais; resumo "Viajantes: …"
  no planejamento; dados preservados ao avançar, voltar e alterar datas ou
  destino. Regras e limites justificados em D34.
- **Dados coletados** (só em memória): adultos, crianças, bebês, crianças por
  faixa etária, perfil, necessidades de acessibilidade. Sem nomes, documentos ou
  datas de nascimento.
- **Consolidação**: regra "um adulto por bebê" removida; exige-se apenas 1
  adulto e o limite provisório de 20 viajantes (mantido). Ver D34.
- **Limitações**: o motor **não utiliza** a composição do grupo; nenhuma atração
  ou custo é personalizado por viajante (a tela avisa). Integração prevista no
  **V1-T3.7**. A etapa não tem "Continuar" até a etapa Transporte existir; o
  formulário tradicional segue como fallback com destino e duração.
- **Arquivos**: novos `src/utils/travelers.ts`, `src/components/planning/TravelersStep.tsx`,
  `src/tests/travelers.test.ts`, `src/tests/travelersStep.test.tsx`; alterados
  `planningSteps.ts`, `stepRegistry.ts`, `PlanningFlow.tsx`,
  `src/tests/planningFlow.test.tsx`, `src/tests/datesStep.test.tsx`, `DECISIONS.md` (D34),
  `ROADMAP.md`, `PROJECT.md`, `TASKS.md`. Motor, persistência e importação/exportação intocados.
- **Chromium**: 20 de 20 verificações aprovadas (quantidades, limites,
  perfis, acessibilidade, teclado, preservação, navegação, formulário
  tradicional); sem rolagem horizontal e alvos ≥ 44 px em 375, 768, 1366 e 1920 px.
- **Riscos**: apenas Chromium; os dados ainda não afetam o roteiro.

## Relatório do V1-T3.4 — planejamento progressivo: transporte (2026-10-12)

- **Status**: implementado e validado localmente; **sem commit, push ou deploy**.
  Etapas 5 a 7 pendentes. Próxima etapa: Interesses.
- **Funcionalidade**: etapa 4 "Como você pretende viajar?" com duas seções:
  chegada ao destino (Carro próprio, Avião, Ônibus, Trem, Ainda não decidi;
  escolha única) e deslocamentos locais (6 meios combináveis + "Ainda não
  decidi" exclusivo); cidade de origem opcional com validação de formato e
  tamanho (2 a 80 caracteres); resumo "Transporte: …"; escolhas preservadas ao
  voltar/avançar e ao alterar destino, datas ou viajantes; fallback para o
  formulário tradicional com destino e duração. Decisão em D35.
- **Dados coletados** (só em memória): modo de chegada, cidade de origem (texto
  livre, não verificado), lista de deslocamentos locais.
- **Depende da integração futura (V1-T3.7)**: cálculo de rotas, distâncias,
  tempos e tarifas; uso das preferências pelo motor de roteiros. Nada disso
  existe: a tela informa que as preferências não geram cálculos nem alteram as
  atrações sugeridas. Sem API externa, mapa ou persistência.
- **Arquivos**: novos `src/utils/transport.ts`, `src/components/planning/TransportStep.tsx`,
  `src/tests/transport.test.ts`, `src/tests/transportStep.test.tsx`; alterados
  `planningSteps.ts`, `stepRegistry.ts`, `PlanningFlow.tsx`, `planningFlow.test.tsx`,
  `datesStep.test.tsx`, `travelersStep.test.tsx`, `DECISIONS.md` (D35), `ROADMAP.md`,
  `PROJECT.md`, `TASKS.md`. Motor, persistência e importação/exportação intocados.
- **Chromium**: 21 de 21 verificações (seleção única e múltipla, exclusividade,
  validação da origem, teclado, preservação, navegação, fallback, reduced-motion);
  sem rolagem horizontal e cards ≥ 44 px em 375, 768, 1366 e 1920 px.
- **Riscos**: apenas Chromium; preferências sem efeito no roteiro.

### Consolidação do V1-T3.4 (2026-10-12)

- **Refinamento visual**: novo `SelectableCard` no Design System (selecionado:
  fundo `brand-100`, borda azul de 2 px, check no canto superior direito, sombra
  de destaque; não selecionado: branco e borda neutra), igual para escolha única
  e múltipla; lógica de transporte e opcionalidade preservadas. Ver D35.
- **Testes**: `selectableCard.test.tsx` (novo) e um caso novo em
  `transportStep.test.tsx`. Total: 587 testes em 31 arquivos.
- **Chromium**: 21/21 (transporte) + 13/13 (estilo calculado, check, múltiplos,
  foco por teclado no card selecionado, remoção, preservação, sem overflow) em
  375 e 1366 px.
