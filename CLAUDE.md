# CLAUDE.md — Claude Code no Travel Planner

Este arquivo complementa os documentos canônicos; não os substitui nem os
repete. Em caso de divergência, **prevalece o `AGENTS.md`** (regras
obrigatórias para todos os agentes: Claude Code, OpenAI Codex e Kimi K3 via
OpenCode). Responda em português brasileiro.

## Documentos canônicos (ler antes de agir)

| Arquivo        | Use para                                                      |
| -------------- | ------------------------------------------------------------- |
| `AGENTS.md`    | Regras, stack, proibições, organização do código, validação   |
| `PROJECT.md`   | Escopo do MVP, arquitetura, comandos                          |
| `ROADMAP.md`   | Checkpoints e o que está fora de escopo (pós-MVP)             |
| `DECISIONS.md` | Decisões técnicas (D1…); consultar antes de mudar um desenho  |
| `TASKS.md`     | Tarefas, status e relatórios; é o registro de trabalho        |

Persistência: `docs/PERSISTENCE_REMEDIATION_PLAN.md` e
`docs/FINAL_AUDIT_FINDINGS.md` são a referência para qualquer mudança em
`src/services/itineraryStorage.ts` e nas telas que a consomem.

## Execução de tarefas

1. **Consulte `TASKS.md` antes de começar** (seção "Fila atual", status, critérios de aceite e
   relatórios mais recentes, que ficam no fim do arquivo). Se a tarefa pedida
   não estiver lá, ou o status contradisser o pedido, informe e confirme antes
   de implementar.
2. Faça somente o que foi pedido. Itens de "Evolução futura" do `ROADMAP.md`
   não devem ser implementados.
3. Respeite a stack e as proibições do `AGENTS.md`; não adicione dependências
   sem autorização.
4. Não declare nada como corrigido ou concluído sem validação. Achados da
   auditoria (AUD-xx, TP-xx) só são "corrigidos" após reauditoria
   independente; registre-os como "implementado e validado localmente".
5. Mantenha os canônicos fiéis à implementação: ao mudar comportamento,
   atualize `TASKS.md` (relatório da tarefa) e, se houver decisão técnica
   nova, `DECISIONS.md` (próximo número livre — verifique o maior `D` já
   usado, pois a numeração não está em ordem no arquivo).

## Testes e validação

Após qualquer alteração em código, execute e relate o resultado real:

```
npm run typecheck
npm run test:run
npm run lint
npm run build
```

Os quatro são obrigatórios antes de concluir tarefa que altere código, testes,
dependências ou configurações (ver "Validação antes de concluir tarefas" no
`AGENTS.md`). Só documentação dispensa a execução, mas diga isso na entrega.
Se algo falhar, reporte a saída; não oculte nem marque a tarefa como concluída.

## Fluxo multiagente, Git e operações externas

As regras compartilhadas (um executor por tarefa, "Fila atual" do `TASKS.md`,
não sobrescrever o trabalho alheio, sem commit/push/publicação sem
autorização, registro de testes e pendências, auditorias somente leitura) estão
na seção **"Fluxo multiagente"** do `AGENTS.md`. Aplique-as integralmente.

Complementos específicos do Claude Code:

- Alterações já presentes no `git status` que você não fez pertencem a outro
  agente ou ao usuário.
- Também exigem autorização explícita: `merge`, `stash`, `checkout`/`restore`
  de arquivos, `clean`, criação de remoto e deploy.
- Não instale dependências nem faça chamadas externas sem autorização.
- Não edite configurações de outros agentes (`.codex/`, `.opencode/`,
  `opencode.json`, etc.).
- Em auditoria, trabalhe somente em leitura.
- Branch atual: `master`, com remoto `origin` configurado (o workflow de
  deploy também usa `master`). Estado e evidências em `TASKS.md`, "Fila atual".

## Procedimento de entrega

Ao terminar, responda com:

1. **Resumo** — o que mudou e por quê, com os arquivos tocados.
2. **Testes** — comandos executados e resultado real (ou o motivo de não
   terem sido executados).
3. **Pendências e riscos** — o que ficou por fazer, limitações, e ações que
   dependem de autorização (commit, push, publicação).

Depois disso, aguarde autorização antes de qualquer etapa adicional.
