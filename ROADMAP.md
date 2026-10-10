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
