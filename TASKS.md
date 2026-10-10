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
