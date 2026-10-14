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
- [~] **M7.2 — fotografias aprovadas e Hero dinâmica** (D55): cabeçalhos com Rio (Corcovado) e Florianópolis (ponte) aprovados e Lisboa mantida; Hero da home
      alterna entre visitas (sem repetir a anterior, estável na sessão, só uma foto baixada), créditos conforme a imagem exibida. Inclui o M7 (D54) e a curadoria do M7.1.
      Validada localmente; **sem commit**.
- [x] **M6 — validação final do MVP** (D53): matriz de 27 roteiros e regressões em Chromium, 879 testes; **sem P0/P1**; P2 registrados. Publicação
      recomendada, aguardando autorização do usuário (push/deploy) e decisão sobre o risco jurídico das fotos.
- [x] **M5.5 — fotografias de Florianópolis e Lisboa** (D52, commit `4fd1f07`): 15 de 20 atrações com foto do Wikimedia Commons (8 + 7), 5 com
      placeholder; créditos no roteiro e no rodapé. Revisão jurídica **pendente**.
- [x] **M5.3 — fotografias das atrações do Rio** (D51, commit `5a9688b`): 9 de 10 atrações com foto do Wikimedia Commons (CC BY/CC BY-SA),
      créditos no roteiro e no rodapé; Feira Hippie com placeholder.
- [x] **M5.1 — cards do roteiro diário** (D50, commit `b52e377`): `ActivityCard` com área visual reservada (placeholder, sem foto), horário, categorias,
      duração e custo ilustrativo; fotografias entregues no M5.3.
- [x] **M4.5 — validação integrada do M4** (D49): fluxo completo em 375/768/1366/1920 px sem regressão; foto da Revisão sem
      `lazy`. **M4 concluído**; pendente apenas o teste manual do teclado virtual em Android real. Sem push/deploy.
- [x] **M4.4 — Revisão no modelo Híbrido Tabi** (D48, commit `d8861ce`): cabeçalho com foto, grupos compactos com "Editar", avisos
      consolidados e "Gerar meu roteiro" na barra de navegação (bloco de 2.199 → 1.044 px em 375 px).
- [x] **M4.3 — compactação das etapas 1 a 6 e barra fixa no celular** (D47, commit `9478c10`): filtros, opcionais e origem recolhíveis,
      cards compactos, orçamento em controle segmentado, resumo de uma linha e barra Voltar/Continuar fixa até 768 px (blocos
      de 666 a 1.287 px em 375 px, antes 690 a 2.099). A Revisão foi tratada no M4.4.
- [x] **M4.2 — padronização dos cards selecionáveis** (D46, commit `b828af7`): variante compacta e variante radio do
      `SelectableCard`; Perfil da viagem e modos de Datas com o mesmo estado selecionado (fundo, borda de 2 px, check).
      Compactação, barra fixa e opcionais recolhíveis entregues no M4.3; redesign da Revisão pendente.
- [x] **M3 — ritmo da viagem no motor** (D45, commit `b9737f1`): limite de atividades por dia (Tranquilo 2, Equilibrado 3, Intenso
      sem limite), com distribuição antes do descarte, aviso das excluídas, gravação do ritmo nos roteiros e
      regressão idêntica sem ritmo. Catálogo de 10 atividades por destino continua limitando viagens longas. Validada
      localmente; sem commit.
- [x] **M2.6 — validação integrada do esquema v2** (D44, commit `0893712`): esquema v2 concluído e validado (801 testes, Chromium 22/22 +
      18/18 + 15/15, regressão financeira 432/432 contra o motor anterior, teste de downgrade em ambiente isolado).
      Ritmo no motor entregue no M3 (D45).
- [x] **M2.5 — geração sem orçamento e integração financeira** (D43, commit `eda5188`): o orçamento é opcional na geração
      (sem teto, sem saldo, sem valor fictício), com a revisão, o resultado e a importação mostrando "Orçamento não
      informado"; com orçamento o resultado é idêntico ao anterior (432 cenários). Ritmo no motor (M3) e validação
      integrada/publicação (M2.6) **pendentes**. Validada localmente; sem commit.
- [x] M2.4 — exportação e importação JSON v2 (D42, commit `0338fe8`): `schemaVersion: 2` com orçamento, saldo e ritmo
      opcionais (omitidos quando ausentes); importação de arquivos v1 (inalterada) e v2 com validação estrita.
      Geração sem orçamento (M2.5), ritmo no motor (M3) e validação integrada (M2.6) **pendentes**. Validada
      localmente; sem commit.
- [x] M2.3 — persistência compatível com o esquema v2 (D41, commit `7ed1ef0`): o armazenamento aceita orçamento e
      saldo ausentes e ritmo opcional, rejeita `null`/0/negativos/não finitos, saldo sem orçamento e orçamento
      sem saldo, e a equivalência considera ritmo e orçamento. Geração sem orçamento (M2.5) e import/export v2
      (M2.4) **pendentes**. Validada localmente; sem commit.
- [x] M2.2 — contratos de tipos do esquema v2 (D40, commit `b5b45af`): `budget?`, `pace?` e
      `unallocatedBudget?` nos tipos, com validação de contrato. Comportamento atual preservado: geração e
      persistência ainda exigem orçamento. M2.3 (persistência), M2.4 (import/export v2), M2.5 (geração sem
      orçamento e interface) e M2.6 (validação integrada) **pendentes**. Validada localmente; sem commit.
- [x] **V1-T3.8 — planejamento progressivo concluído; formulário tradicional removido** (D39):
      o fluxo de sete etapas é a única forma de criar roteiros; a home tem a seção "Planeje
      sua viagem" e os cards de destino abrem o planejamento. Pendências: orçamento ausente
      bloqueia a geração; ritmo, viajantes, transporte, perfil e acessibilidade não influenciam
      nem são persistidos no roteiro; fotografias dinâmicas, imagens das atrações, mapas e
      rotas **não implementados**. Validada localmente; sem commit.
- [x] **V1-T3.7 — etapa 7, revisão e geração direta** (D38): cards de
      revisão com "Editar" por seção e geração do roteiro pelo fluxo progressivo
      (adaptador para o contrato do motor, mesma função de geração, página de
      resultado atual). Só destino, duração, interesses, estilo e orçamento por
      pessoa influenciam o roteiro; viajantes, transporte, ritmo, perfil e
      acessibilidade não, e não são salvos. Sem orçamento a geração é bloqueada.
      Validada localmente; commit `a7ba23f`.
- [x] V1-T3.6 — etapa 6, orçamento (D37, commit `0d6bcc5`): estilo financeiro (mesmos
      valores do motor, padrão Equilibrado) e orçamento opcional em valor total ou
      por pessoa, em centavos, na moeda do destino, sem câmbio nem descontos
      presumidos; a revisão converte o orçamento em valor por pessoa para o motor.
      Hospedagem, alimentação e transporte **não** são calculados. Geração do
      roteiro pelo fluxo e etapa 7 (Revisão) entregues no V1-T3.7. Validada localmente; sem commit.
- [x] V1-T3.5 — etapa 5, interesses e ritmo (D36, commit `b8ccfe8`): sete
      interesses do catálogo (múltipla escolha, ao menos um) e ritmo
      (Tranquilo/Equilibrado/Intenso, padrão Equilibrado). Os interesses chegam ao
      roteiro gerado; o **ritmo não é usado pelo motor**
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

## Próximas fases (decididas em 2026-10-13 — planejamento; nada disto foi implementado)

1. **Avaliação comercial e monetização** — **próxima fase do projeto**: levantar público, proposta de valor, modelos de receita e custos
   (incluindo licenças de imagem e dados), sem alterar o produto até haver decisão.
2. **Expansão gradual do catálogo turístico** — novos destinos e atrações, um de cada vez, com curadoria de dados e de fotografias
   (mesmo processo de verificação de licenças do M5) e entrada em `HEADER_PHOTOS`/`ACTIVITY_PHOTOS`.
3. **Avaliação da "Claude Skills Founder" para a Skill Library global** — **somente avaliar**: nenhuma skill foi instalada e a biblioteca
   global **não** foi alterada.

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
