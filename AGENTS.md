# AGENTS.md — Regras de Trabalho para Agentes

## Escopo

Este arquivo define as regras obrigatórias para qualquer agente de IA que
trabalhe neste repositório.

## Regras gerais

1. **Não executar mudanças fora da pasta do projeto** (`C:\ProjetosDev\Travel-Planner`).
2. **Não executar comandos destrutivos** (ex.: `rm -rf` em diretórios do sistema,
   formatação, alteração de configurações globais).
3. **Não executar mutações de Git sem autorização explícita**: `git push`,
   `git commit`, `git reset`, `git rebase`, `gh repo create`, criação de
   repositórios remotos ou publicação pública.
4. **Solicitar autorização antes de operações externas** (deploys, chamadas a
   serviços externos, publicações).
5. Responder em **português brasileiro**, salvo instrução contrária.

## Stack obrigatória

- React + TypeScript + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Lucide React (ícones)
- Vitest (testes)
- Persistência: LocalStorage
- Hospedagem: GitHub Pages (via GitHub Actions)

## Proibições

- Supabase, Firebase, backend próprio, Docker, WSL
- APIs pagas e serviços externos de IA
- Dependências desnecessárias
- Credenciais ou segredos no código
- Apresentar informações fictícias como fatos reais (custos e durações da base
  são **ilustrativos** e devem ser rotulados como tal na interface)

## Organização do código

```
src/
  components/   # Componentes de interface reutilizáveis
  pages/        # Páginas da aplicação
  data/         # Base local de destinos e atividades (tipada)
  services/     # Regras de negócio (gerador de roteiros, persistência, exportação)
  hooks/        # Hooks React
  types/        # Tipos de domínio
  utils/        # Funções utilitárias
  tests/        # Testes com Vitest
```

- Separar interface, dados, regras de negócio, persistência e tipos.
- O algoritmo do gerador de roteiros deve ficar fora dos componentes.
- Evitar componentes excessivamente grandes.

## Validação antes de concluir tarefas

- `npm run typecheck` sem erros
- `npm run test:run` passando
- `npm run build` funcional
- Não registrar funcionalidades como concluídas sem validação

## Arquivos canônicos

`AGENTS.md`, `PROJECT.md`, `ROADMAP.md`, `DECISIONS.md` e `TASKS.md` devem
sempre refletir o estado real da implementação. Ao modificar estrutura,
estilos, configurações ou fluxos, atualizar os arquivos correspondentes.
