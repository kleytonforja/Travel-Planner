# ROADMAP.md — Etapas do Desenvolvimento

O desenvolvimento é dividido em quatro checkpoints. Cada checkpoint só é
considerado concluído após validação (typecheck, testes e/ou build).

## CHECKPOINT 1 — Fundação ✅ Concluído

- [x] Scaffold Vite + React + TypeScript
- [x] Tailwind CSS v4, Lucide React, Vitest configurados
- [x] Estrutura de pastas `src/` (components, pages, data, services, hooks,
      types, utils, tests)
- [x] Arquivos canônicos (AGENTS, PROJECT, ROADMAP, DECISIONS, TASKS)
- [x] Tipos de domínio (`src/types/`)
- [x] Base local com 3 destinos e 10 atividades cada (`src/data/`)
- [x] Testes de integridade da base de dados
- [x] Caminho base do Vite para GitHub Pages

## CHECKPOINT 2 — Interface Inicial ✅ Concluído

- [x] Header com identidade Travel Planner
- [x] Hero com título e chamada para ação
- [x] Formulário de planejamento com validação e mensagens em pt-BR
- [x] Área de destinos disponíveis
- [x] Seção "como funciona"
- [x] Footer
- [x] Layout responsivo (desktop, tablet, smartphone) e acessível

## CHECKPOINT 3 — Roteiro, Persistência e Exportação ✅ Concluído

- [x] Gerador de roteiros determinístico em `services/`
- [x] Página do roteiro (dias, atividades, resumo financeiro, avisos)
- [x] Persistência em LocalStorage (salvar, reabrir, excluir, novo)
- [x] Tratamento de dados inválidos/corrompidos no LocalStorage
- [x] Exportação do roteiro em JSON

## CHECKPOINT 4 — Qualidade e Preparação de Publicação ✅ Concluído

- [x] Suíte completa de testes (validação, filtragem, distribuição,
      orçamento, atividades insuficientes, persistência, exportação)
- [x] Build de produção validado
- [x] Workflow `.github/workflows/deploy.yml` (typecheck → testes → lint →
      build → GitHub Pages, permissões mínimas)
- [x] Git local e `.gitignore` configurados; histórico local existente

> Publicação efetiva no GitHub Pages aguarda autorização explícita.

## Remediação de persistência (pós-auditoria, TP-02 a TP-05)

Conforme `docs/PERSISTENCE_REMEDIATION_PLAN.md`:

- [x] **P1 — Identidade e validação**: UUID com confronto de existentes,
      equivalência por comparação direta de campos (sem hash), validação
      estrutural e semântica integral na leitura e antes de gravar.
- [x] **P2 — Operações seguras, concorrência e recuperação**: uma leitura
      de decisão, um único setItem com confirmação por releitura,
      resultado incerto distinto, Web Locks, quarentena não destrutiva e
      recuperação explícita com confirmações vinculadas ao conteúdo.
- [x] **P3 — Integração e validação final**: interface revisada contra os
      resultados reais do serviço, feedback de sucesso confirmado,
      correção da falsa lista vazia em estados corrompido/indisponível e
      22 testes de interação (HomePage e ItineraryPage).
- [x] **Correções da auditoria independente final (C1, C2-A, C2-B)**:
      AUD-01 (confirmação desatualizada de descarte), AUD-02 (mensagem
      de preservação sem evidência), AUD-06 (restauração com análise
      prévia de IDs), AUD-03/AUD-04 (validação financeira: custo ≤
      orçamento estrito e saldo comparado com orçamento − custo),
      AUD-05 (exportação do conteúdo bruto da principal corrompida) e
      AUD-07 (regressões, incluindo a colisão verdadeira reconstruída,
      e documentação reconciliada com as evidências). Implementadas e
      validadas localmente; NÃO declaradas corrigidas sem reauditoria.
- [x] **QA funcional direcionado** do commit `84b3330`: 11 cenários
      aprovados em Chromium real e 233 testes automatizados passando,
      incluindo a correção residual AUD-02.
- [ ] **Aceite integral de produção**: permanece pendente; o par de colisão
      e o corpus histórico originais estão indisponíveis. Essa limitação
      está documentada e não bloqueia automaticamente a demonstração
      experimental. Detalhes em TASKS.md e nos registros de auditoria.

## Preparação local para demonstração experimental

- [x] Workflow de publicação alinhado à branch `master`
- [x] Aviso experimental visível e acessível nas duas páginas
- [x] Revisão de prontidão: GO técnico para demonstração experimental,
      sem aprovação integral de produção
- [ ] Configurar remoto, GitHub Actions, Pages e ambiente `github-pages`
- [ ] Publicar e validar a URL HTTPS após autorização explícita

> **Nota de reconciliação (2026-10-12)**: o remoto `origin`
> (`github.com/kleytonforja/Travel-Planner`) já está configurado e a `master`
> foi enviada (`origin/master` = `6b8ea0a` na referência local). Os itens
> acima permanecem desmarcados porque não há evidência registrada de
> GitHub Actions, Pages, ambiente `github-pages` nem URL HTTPS validada.
> Ver `TASKS.md`, "Estado do Git e da publicação".

## Importação de roteiros JSON (C5, mudança de escopo — D28)

- [x] **C5-T2 — serviço** `parseItineraryImport` (leitura, reconstrução pelo
      catálogo atual e validação), 119 testes; commit `b505a66`.
- [x] **C5-T3 — interface** `ImportItinerary` na página inicial, próxima de
      "Meus roteiros salvos": validação, pré-visualização, confirmação,
      gravação exclusivamente por `saveItinerary` e confirmação de
      substituição vinculada ao conteúdo; 29 testes de interação; aviso do
      rodapé atualizado. Implementada e validada localmente (testes
      automatizados e fluxo real em Chromium, 28 verificações); commit local
      feito, **sem push** e **sem reauditoria independente**.
- [x] **C5-T4 — finalização**: favicon (`public/favicon.svg`, ícone de avião
      da identidade visual, sob o caminho base `/Travel-Planner/`) que
      elimina o 404 de favicon. Auditoria independente da importação
      informada pelo usuário como aprovada (Codex; 148 testes específicos); o
      relatório não está no repositório. Riscos residuais: ver D28 e TASKS.md.
- [ ] Push/publicação no GitHub Pages — aguardam autorização explícita.
- [ ] Verificação independente dos achados AUD-01 a AUD-07 continua pendente
      (a auditoria da importação não a substitui).

## Redesign visual (V1)

- [x] **V1-T1 — fundamentos do Design System** (D29): tokens (marca, fundo
      noturno, superfícies, texto, foco, categorias, raios, sombras),
      estilos globais (foco visível e prefers-reduced-motion) e primitivos em
      `src/components/ui/` (Button, Card, CategoryBadge, SearchField,
      ProgressSteps). Aparência atual preservada (capturas idênticas).
      Implementado e validado localmente; commit local feito, sem push.
      Referência visual oficial: `docs/references/travel-planner-design-approved.png`.
- [~] **V1-T2 — nova Home** (D30): cabeçalho escuro integrado, hero, painel
      "Destinos em destaque" com indicadores de categoria e ações preservadas;
      validada localmente (447 testes, Chromium); commit local feito, sem push.
- [x] **V1-T2.1 — fotografias reais** (D31): hero (Rio de Janeiro) e cards de
      Florianópolis, Rio de Janeiro e Lisboa, do Unsplash (Unsplash License),
      em WebP local com crédito (`docs/IMAGE_CREDITS.md`); ilustrações mantidas
      como substitutas. Fidelidade à referência comparada visualmente; hero
      mais escuro que o modelo por exigência de contraste.
- [ ] Fotografias das atrações (começando pelas dez do Rio de Janeiro) e de
      uma Ponte Hercílio Luz identificada — fase posterior.
- [~] **V1-T3.1 — planejamento progressivo (parcial)** (D32): estrutura de sete
      etapas, indicador de progresso e etapa 1 (destino com pesquisa, filtros,
      cards fotográficos e seleção preservada na sessão); formulário
      tradicional mantido **até a conclusão do wizard**, quando será
      substituído. Filtros da etapa Destino separados em Localização e
      Categorias dos destinos. Etapas 2 a 7 (Datas, Viajantes, Transporte,
      Interesses, Orçamento, Revisão) **pendentes**. Validada localmente;
      commit local feito, sem push.
- [~] **V1-T3.6 — etapa 6, orçamento (parcial)** (D37): estilo financeiro (mesmos
      valores do motor, padrão Equilibrado) e orçamento opcional em valor total ou
      por pessoa, em centavos, na moeda do destino, sem câmbio nem descontos
      presumidos; o formulário tradicional abre com estilo e valor por pessoa.
      Hospedagem, alimentação e transporte **não** são calculados. Geração do
      roteiro pelo fluxo e etapa 7 (Revisão) **pendentes**; formulário tradicional
      mantido. Validada localmente; sem commit.
- [x] V1-T3.5 — etapa 5, interesses e ritmo (D36, commit `b8ccfe8`): sete
      interesses do catálogo (múltipla escolha, ao menos um) e ritmo
      (Tranquilo/Equilibrado/Intenso, padrão Equilibrado). Os interesses chegam ao
      formulário tradicional e ao motor; o **ritmo não é usado pelo motor**
      (V1-T3.7). Fotografias temáticas licenciadas **pendentes** (visual com
      ícones por ora). Próxima etapa: Orçamento. Validada localmente; sem commit.
- [x] V1-T3.4 — etapa 4, transporte e `SelectableCard` (D35, commit `6518f12`): chegada ao destino
      (escolha única), cidade de origem opcional (texto livre, validado, não
      verificado) e deslocamentos locais (múltipla escolha, "Ainda não decidi"
      exclusivo). **Só preferências**: sem rotas, distâncias, tarifas ou mapa; o
      motor não as usa (integração em V1-T3.7). Próxima etapa: Interesses.
      Validada localmente; sem commit.
- [x] V1-T3.3 — etapa 3, viajantes (D34, commit `a36d506`): quantidades de adultos
      (padrão 1), crianças e bebês, faixas etárias opcionais, perfil e
      acessibilidade opcionais, tudo preservado entre etapas. **Não personaliza
      o roteiro**: o motor ainda ignora o grupo (integração em V1-T3.7). Próxima
      etapa: Transporte. Validada localmente; sem commit.
- [x] V1-T3.2 — etapa 2, datas e duração (D33, commit `3f5d9e2`): duas opções
      (já tenho as datas / ainda não defini), duração calculada sem erro de fuso,
      validação de datas, atalhos e duração personalizada de 1 a 14 dias,
      navegação voltar/continuar com escolhas preservadas. Etapas 3 a 7
      **pendentes**. Validada localmente; sem commit.
- [ ] **Fotografias dinâmicas (futuro, aprovado, NÃO implementar agora)**: rodízio
      de imagens na Home, fundo contextual conforme o destino escolhido e
      transições suaves (D33).
- [ ] V1-T3.3 e seguintes: demais etapas do planejamento e demais telas — aguardam
      autorização.

## Evolução futura (pós-MVP, fora do escopo atual — NÃO implementar agora)

- Planejamento passo a passo (wizard)
- Seleção de atividades em cards
- Catálogo ampliado de atrações
- Integração com Google Places API
- Dados de fontes oficiais
- Fotografias e avaliações
- Atualização semanal supervisionada da base
- Preservação de roteiros salvos entre versões da base de dados
- Revisão de informações desatualizadas
- Custos de hospedagem e transporte
- Visualização de trajetos
- Compartilhamento de roteiro via URL
- Modo escuro
- Internacionalização
