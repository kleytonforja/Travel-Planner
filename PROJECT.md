# PROJECT.md — Travel Planner

## Objetivo

Aplicação web de **planejamento personalizado de viagens**. O usuário informa
destino, quantidade de dias, interesses, estilo de viagem e orçamento; a
aplicação gera um **roteiro organizado por dia** com base em dados locais e
regras determinísticas.

O MVP **não** utiliza inteligência artificial generativa nem serviços de
preços em tempo real.

## Escopo do MVP

### Incluído

- Formulário de planejamento com validação (destino, 1–14 dias, interesses,
  estilo, orçamento).
- Base local com 3 destinos (Florianópolis, Rio de Janeiro, Lisboa), cada um
  com pelo menos 8 atividades tipadas.
- Gerador de roteiros determinístico (filtro por interesses, estilo e
  orçamento; distribuição por dias sem sobreposição de horários).
- Página de roteiro com resumo financeiro e avisos.
- Persistência em LocalStorage (salvar, reabrir, excluir, novo planejamento).
- Exportação do roteiro em JSON.
- Importação segura de roteiros JSON exportados por este próprio aplicativo
  (validação contra a base atual, pré-visualização e confirmação; nada é
  substituído sem confirmação — ver D28).
- Testes automatizados com Vitest.
- Pipeline de CI/CD para GitHub Pages (GitHub Actions).
- Aviso visível e acessível de demonstração experimental nas duas páginas,
  sem sincronização ou garantia de preservação permanente dos roteiros.

### Fora de escopo

- IA generativa, recomendações em tempo real.
- Cotações, horários oficiais ou disponibilidade real (custos e durações da
  base são **ilustrativos** e rotulados como tal na interface).
- Backend, autenticação, banco de dados remoto.
- Importação de arquivos de outras origens ou de versões anteriores da base,
  mesclagem de coleções e importação do envelope de recuperação do
  armazenamento (a recuperação continua sendo feita pelos fluxos de
  quarentena da página inicial).

## Stack

| Camada        | Tecnologia                          |
| ------------- | ----------------------------------- |
| UI            | React 19 + TypeScript + Vite        |
| Estilo        | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Ícones        | Lucide React                        |
| Testes        | Vitest + Testing Library + jsdom    |
| Persistência  | LocalStorage                        |
| Hospedagem    | GitHub Pages                        |
| CI/CD         | GitHub Actions                      |

## Arquitetura

```
src/
  components/   # Componentes de interface reutilizáveis (ui/: primitivos do Design System)
  pages/        # Páginas da aplicação (inicial, roteiro)
  data/         # Base local de destinos e atividades (tipada)
  services/     # Regras de negócio: gerador de roteiros, persistência, exportação
  hooks/        # Hooks React
  types/        # Tipos de domínio (Destination, Activity, TravelStyle, ...)
  utils/        # Funções utilitárias (formatação, etc.)
  tests/        # Testes com Vitest + setup
```

Princípios:

- **Separação de responsabilidades**: interface, dados, regras de negócio,
  persistência e tipos em módulos distintos.
- O **algoritmo do gerador de roteiros** vive em `services/`, fora de
  componentes, e é determinístico (mesma entrada → mesma saída).
- Componentes pequenos e compostos.

## Comandos

```bash
npm run dev         # ambiente de desenvolvimento
npm run test:run    # testes (execução única)
npm run typecheck   # verificação de tipos
npm run lint        # análise estática (oxlint)
npm run build       # build de produção
```

Antes de considerar uma tarefa de código concluída, `typecheck`, `test:run`,
`lint` e `build` são todos obrigatórios (ver `AGENTS.md`).

## Documentos técnicos de persistência

- `docs/PERSISTENCE_REMEDIATION_PLAN.md` — plano de remediação (TP-02 a TP-05)
- `docs/FINAL_AUDIT_FINDINGS.md` — achados da auditoria independente final
  (AUD-01 a AUD-07)

Fluxo entre agentes e estado do Git/publicação: `AGENTS.md` ("Fluxo
multiagente") e `TASKS.md` ("Fila atual").

## Referência visual oficial (redesign V1)

- **Arquivo**: `docs/references/travel-planner-design-approved.png` (PNG,
  1536 × 1024). Mostra a página inicial (hero com fotografia, destinos em
  destaque), o passo 1 de 7 do planejamento (busca, filtros e cards com foto)
  e o roteiro por dia com mapa. É a **referência visual oficial aprovada**.
- **Fidelidade**: o redesign deve buscar **alta fidelidade** a esse modelo
  (fundo azul-escuro com gradientes, azul vibrante nos elementos interativos,
  cards claros e arredondados, ícones coloridos por categoria), respeitando
  a stack, as proibições do `AGENTS.md` e os tokens do Design System (D29).
  Os textos do modelo são ilustrativos; dados e valores continuam sendo os da
  base local, rotulados como ilustrativos.

### Funcionalidades atuais × planejadas

| Situação | Funcionalidade |
| --- | --- |
| **Atual** | Formulário de planejamento, 3 destinos, gerador determinístico, roteiro por dia com resumo financeiro, salvar/reabrir/excluir, exportação e importação JSON, quarentena e recuperação, Design System (tokens e primitivos, V1-T1) |
| **Planejada** | Avatar e perfil local |
| **Planejada** | Mapa interativo com atrações |
| **Planejada** | Rotas reais entre atrações |
| **Parcial** | Fotografias e ícones coloridos: ícones de categoria e fotografias do hero e dos três destinos já aplicados na home (Unsplash, créditos em `docs/IMAGE_CREDITS.md`); fotografias de 24 das 30 atrações (Rio 9, Florianópolis 8, Lisboa 7) aplicadas nos cards do roteiro (Wikimedia Commons, créditos no roteiro); 6 atrações com placeholder |
| **Parcial** | Planejamento progressivo em etapas: estrutura de sete etapas, indicador de progresso e as etapas de destino (V1-T3.1), datas/duração (V1-T3.2) e viajantes (V1-T3.3), transporte (V1-T3.4), interesses/ritmo (V1-T3.5) orçamento (V1-T3.6) e revisão com geração direta (V1-T3.7) existem; o fluxo gera o roteiro com destino, duração, interesses, estilo e orçamento por pessoa, mas viajantes, transporte e ritmo ainda não são usados pelo motor nem salvos. O fluxo progressivo é o único caminho para criar roteiros: o formulário tradicional foi removido no V1-T3.8. O orçamento é opcional: sem ele o roteiro é gerado sem teto financeiro e sem saldo. O esquema v2 (orçamento, saldo e ritmo opcionais; JSON `schemaVersion` 2 com importação das versões 1 e 2) está concluído e validado (M2.2 a M2.6); o ritmo limita as atividades por dia no motor (M3: Tranquilo 2, Equilibrado 3, Intenso sem limite). Referência: planejamento progressivo em etapas (7 etapas na referência: Destino, Datas, Viajantes, Transporte, Interesses, Orçamento e Roteiro; `ProgressSteps` existe, sem o fluxo) |

As funcionalidades planejadas **não estão implementadas** e só entram com
autorização, registro no `ROADMAP.md` e decisão no `DECISIONS.md`. Atenção:
mapa interativo e rotas reais costumam exigir serviços externos de mapas e
roteamento, o que o `AGENTS.md` só permite com autorização (sem APIs pagas);
é uma decisão pendente. Itens do modelo como viajantes, transporte e
funcionamento offline também ampliam o escopo atual do MVP.
