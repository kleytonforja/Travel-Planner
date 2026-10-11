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

## CHECKPOINT 2 — Interface Inicial ⬜ Pendente

- [ ] Header com identidade Travel Planner
- [ ] Hero com título e chamada para ação
- [ ] Formulário de planejamento com validação e mensagens em pt-BR
- [ ] Área de destinos disponíveis
- [ ] Seção "como funciona"
- [ ] Footer
- [ ] Layout responsivo (desktop, tablet, smartphone) e acessível

## CHECKPOINT 3 — Roteiro, Persistência e Exportação ✅ Concluído

- [x] Gerador de roteiros determinístico em `services/`
- [x] Página do roteiro (dias, atividades, resumo financeiro, avisos)
- [x] Persistência em LocalStorage (salvar, reabrir, excluir, novo)
- [x] Tratamento de dados inválidos/corrompidos no LocalStorage
- [x] Exportação do roteiro em JSON

## CHECKPOINT 4 — Qualidade e Publicação ✅ Concluído

- [x] Suíte completa de testes (validação, filtragem, distribuição,
      orçamento, atividades insuficientes, persistência, exportação)
- [x] Build de produção validado
- [x] Workflow `.github/workflows/deploy.yml` (typecheck → testes → lint →
      build → GitHub Pages, permissões mínimas)
- [x] Inicialização do Git local e `.gitignore` (sem commit/push — requer
      autorização)

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
- [ ] **Auditoria independente final**: TP-02 a TP-05 e AUD-01 a AUD-07
      só serão declarados corrigidos após nova verificação independente
      (critério 12 do plano; parecer atual NO-GO). Detalhes e riscos
      remanescentes em TASKS.md.

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
