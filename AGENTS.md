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

## Fluxo multiagente

Claude Code, OpenAI Codex e Kimi K3 (via OpenCode) compartilham o mesmo
working tree. As regras abaixo valem para todos.

1. **Um único agente executor por tarefa.** A tarefa ativa, o responsável, os
   arquivos previstos e o status ficam na seção "Fila atual" do `TASKS.md`.
   Se já houver tarefa ativa com outro responsável, não iniciar alterações:
   avisar o usuário.
2. **Consultar o `TASKS.md` antes de iniciar alterações** e registrar na
   "Fila atual" a tarefa assumida e os arquivos previstos (somente se houver
   autorização para escrever em `TASKS.md`).
3. **Não sobrescrever alterações de outros agentes.** Verificar `git status`
   antes de começar; não reverter, formatar ou limpar mudanças que não sejam
   suas; reler o arquivo antes de editá-lo; não usar `git checkout`/`restore`,
   `stash`, `clean` ou `reset` para descartar trabalho. Em `TASKS.md` e
   `DECISIONS.md`, apenas acrescentar seções, sem reordenar, renumerar ou
   reescrever texto alheio. Mudança inesperada em arquivo previsto: parar e
   perguntar.
4. **Sem commit, push ou publicação sem autorização explícita** do usuário,
   específica para a ação pedida (complementa a regra geral 3).
5. **Ao finalizar, registrar** os testes executados (com resultado real) e as
   pendências no `TASKS.md` e na resposta de entrega, e atualizar a "Fila
   atual".
6. **Auditorias independentes são somente leitura**, salvo autorização
   explícita: o auditor não altera código, testes, documentos nem Git, e
   registra achados fora do repositório ou onde o usuário indicar.
7. Cada agente pode ter um arquivo complementar (`CLAUDE.md` para o Claude
   Code). Ele não substitui este arquivo; em divergência, prevalece o
   `AGENTS.md`.

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

São **obrigatórias**, todas as quatro, antes de considerar concluída qualquer
tarefa que altere código, testes, dependências ou configurações (os mesmos
passos rodam no CI):

- `npm run typecheck` sem erros
- `npm run test:run` passando
- `npm run lint` sem erros
- `npm run build` funcional
- Não registrar funcionalidades como concluídas sem validação

Tarefas somente de documentação não exigem a execução, mas a entrega deve
declarar que ela não foi feita.

## Arquivos canônicos

`AGENTS.md`, `PROJECT.md`, `ROADMAP.md`, `DECISIONS.md` e `TASKS.md` devem
sempre refletir o estado real da implementação. Ao modificar estrutura,
estilos, configurações ou fluxos, atualizar os arquivos correspondentes.

## Documentos técnicos de persistência

Em `docs/`, e obrigatórios como referência para qualquer mudança em
`src/services/itineraryStorage.ts` ou nas telas que a consomem:

- `docs/PERSISTENCE_REMEDIATION_PLAN.md` — plano de remediação (TP-02 a TP-05)
- `docs/FINAL_AUDIT_FINDINGS.md` — achados da auditoria independente final
  (AUD-01 a AUD-07)
