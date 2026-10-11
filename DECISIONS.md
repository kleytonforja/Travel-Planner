# DECISIONS.md — Decisões Técnicas e Justificativas

## D1 — Tailwind CSS v4 via plugin Vite

**Decisão**: usar `@tailwindcss/vite` com `@import 'tailwindcss'` no CSS, sem
arquivo `tailwind.config.js`.

**Justificativa**: é o modo oficial da v4, elimina configuração extra e
integra-se nativamente ao pipeline do Vite.

## D2 — Vitest com jsdom e Testing Library

**Decisão**: Vitest configurado dentro do `vite.config.ts`
(`/// <reference types="vitest/config" />`), ambiente `jsdom`, `globals: true`
e setup em `src/tests/setup.ts`.

**Justificativa**: compartilha a configuração do Vite (aliases, plugins),
evitando duplicidade. `globals: true` reduz boilerplate nos testes; o tipo é
declarado em `tsconfig.app.json`.

## D3 — Caminho base do Vite: `/Travel-Planner/`

**Decisão**: `base: '/Travel-Planner/'` no `vite.config.ts`.

**Justificativa**: o GitHub Pages publica repositórios de projeto em
`https://<usuario>.github.io/<repo>/`. O valor pressupõe que o repositório se
chamará `Travel-Planner` (nome da pasta local). **Ajustar se o nome do
repositório remoto for diferente.**

## D4 — Custos e durações ilustrativos na base de dados

**Decisão**: os campos `estimatedCost` e `durationHours` são valores fixos,
definidos manualmente, e a interface deve rotulá-los como ilustrativos.

**Justificativa**: o MVP não usa APIs de preços em tempo real. Rotular evita
apresentar informações fictícias como fatos.

## D5 — Moeda por destino

**Decisão**: cada destino declara sua moeda (`Currency` com código ISO,
símbolo e locale). Florianópolis e Rio de Janeiro usam BRL; Lisboa usa EUR.

**Justificativa**: atende ao requisito de "uma moeda declarada para cada
destino" sem conversão cambial (fora de escopo no MVP).

## D6 — Gerador de roteiros determinístico, fora da interface

**Decisão**: o algoritmo ficará em `src/services/`, puro e determinístico
(mesma entrada → mesma saída), sem dependência de componentes React.

**Justificativa**: facilita testes unitários do comportamento e cumpre o
requisito de separação entre regras de negócio e interface.

## D7 — Persistência apenas em LocalStorage

**Decisão**: roteiros salvos ficam no LocalStorage do navegador, com validação
na leitura para tratar dados inválidos/corrompidos.

**Justificativa**: exigência do MVP (sem backend). A validação na leitura
evita quebras silenciosas por dados corrompidos ou versões antigas.

## D8 — Sem roteador no MVP

**Decisão**: a navegação entre "página inicial" e "página do roteiro" será
feita por estado interno do React, sem `react-router`.

**Justificativa**: o MVP tem apenas duas visões; um roteador seria uma
dependência desnecessária. Pode ser revisto no pós-MVP.

## D9 — Navegação por âncoras e rótulos centralizados

**Decisão**: a navegação interna usa âncoras (`#planejar`, `#destinos`,
`#como-funciona`) com `scroll-behavior: smooth` e `scroll-mt` para compensar
o header fixo. Os textos de categorias, estilos e períodos ficam
centralizados em `src/data/labels.ts`.

**Justificativa**: âncoras são nativas, acessíveis e dispensam JavaScript de
navegação. Rótulos centralizados evitam divergência de textos em pt-BR.

## D10 — Validação do formulário como regra de negócio em `services/`

**Decisão**: `validatePlanningInput` (em `src/services/planningValidation.ts`)
é uma função pura que recebe o `PlanningInput` e retorna erros por campo em
pt-BR. O componente `PlanningForm` apenas converte o estado do formulário e
exibe os resultados.

**Justificativa**: cumpre a separação entre regras de negócio e interface e
permite testes unitários de comportamento sem renderizar componentes.

## D11 — Envio do formulário no Checkpoint 2

**Decisão**: neste checkpoint o botão de envio se chama "Validar
planejamento" e, quando os dados são válidos, exibe um resumo do
planejamento com aviso de que a geração do roteiro chega na próxima etapa.

**Justificativa**: o gerador de roteiros pertence ao Checkpoint 3; a
interface não simula uma funcionalidade ainda inexistente. O texto do botão
e o painel de resultado serão revistos quando o gerador for conectado.

**Revisão (Checkpoint 3)**: substituída pela D15.

## D12 — Modelo de agenda por janelas de período

**Decisão**: cada dia do roteiro tem três janelas de horário sugerido —
manhã (09:00–12:30), tarde (14:00–18:30) e noite (19:00–23:00) — com
intervalo de almoço entre manhã e tarde e pausa de 30 minutos entre
atividades consecutivas. Atividades com mais de 4,5 h são tratadas como
"passeio de dia inteiro": começam às 09:00 e empurram o início dos
períodos seguintes. A distribuição prioriza o dia com menos atividades
para equilibrar a agenda.

**Justificativa**: janelas fixas tornam o gerador simples, determinístico
e livre de sobreposições por construção (cursores por período), sem
inventar horários reais de funcionamento — os horários são sugestões
rotuladas como ilustrativas.

**Revisão (correção TP-01)**: os cursores por período, sozinhos, **não**
garantiam ausência de sobreposição — um passeio de dia inteiro podia ser
inserido sobre uma atividade da tarde já posicionada. `trySchedule` passou
a verificar conflitos contra todas as atividades já agendadas no dia,
independentemente do período, antes de alocar (intervalos que apenas se
tocam não configuram sobreposição). O modelo de janelas e cursores foi
mantido.

## D13 — Seleção de atividades: ordenação determinística + orçamento ganancioso

**Decisão**: as atividades elegíveis (interesses ∩ categorias ≠ ∅ e estilo
adequado) são ordenadas por quantidade de interesses atendidos, custo
(crescente; decrescente no estilo confortável) e id. A seleção percorre a
lista somando apenas o que couber no orçamento; atividades gratuitas
sempre cabem. Atividades excluídas pelo orçamento ou pela agenda viram
avisos na página do roteiro.

**Justificativa**: determinismo total (mesma entrada → mesma saída),
respeito explícito ao orçamento e transparência com o usuário quando
preferências ou orçamento limitam o resultado.

## D14 — Persistência versionada com identificador determinístico

**Decisão**: roteiros salvos ficam na chave
`travel-planner:saved-itineraries:v1`. O id é um hash (djb2) do
`PlanningInput`, então salvar o mesmo planejamento substitui o registro
anterior. A leitura valida a estrutura de cada entrada e descarta dados
inválidos/corrompidos sem quebrar a aplicação.

**Justificativa**: id determinístico evita duplicatas sem depender de
valores aleatórios; a validação estrutural na leitura protege contra
edições manuais, versões antigas e corrupção do LocalStorage.

**Revisão (correções TP-02 a TP-05)**: substituída parcialmente pela D21.
O hash do planejamento deixou de ser a identidade do registro (colisões
substituíam roteiros diferentes silenciosamente) e a leitura passou a
distinguir vazio/válido/corrompido/indisponível, com validação semântica
profunda e quarentena de dados ilegíveis.

## D21 — Endurecimento da persistência (TP-02 a TP-05)

**Decisão**: `src/services/itineraryStorage.ts` foi reestruturado em
quatro frentes:

1. **Validação estrutural e semântica (TP-02)**: `isSavedItinerary`
   valida data ISO real, identificador não vazio, destino existente na
   base local, quantidade e numeração dos dias, atividades completas
   (categorias, estilos e períodos conhecidos; duração e custo finitos e
   coerentes), horários dentro do dia e coerentes com a duração, sem
   sobreposição dentro do dia (invariante TP-01) e consistência
   financeira (totais fecham com as atividades agendadas e com o
   orçamento). Registros inválidos não são renderizados; a interface
   informa quantos foram ignorados.
2. **Identidade separada de comparação (TP-03)**: o registro recebe id
   único (`crypto.randomUUID()`, com fallback). A antiga função de hash
   virou `buildPlanningFingerprint`, usada apenas para detectar
   planejamentos equivalentes — que substituem o registro anterior
   **preservando o id original**, inclusive de registros legados cujo id
   é o hash (compatibilidade com o formato v1).
3. **Erros de armazenamento como resultado (TP-04)**: salvar, excluir e
   descartar retornam `{ ok: true, ... } | { ok: false, message }` e
   nunca lançam exceções para a interface. `QuotaExceededError` tem
   mensagem própria; falhas preservam o estado anterior (a escrita é
   atômica: ou substitui a chave inteira ou não altera nada).
4. **Dados corrompidos nunca sobrescritos (TP-05)**: a leitura distingue
   `empty`/`ok`/`corrupted`/`unavailable`. Escritas movem payload ilegível
   (ou com registros descartados) para a chave de quarentena
   `travel-planner:saved-itineraries:v1:quarentena` antes de gravar. O
   descarte definitivo só ocorre por ação explícita do usuário
   (`discardCorruptedData`), sem migração destrutiva automática.

**Justificativa**: a auditoria comprovou registros inválidos quebrando a
renderização, colisão de ids, exceções não tratadas e sobrescrita
silenciosa de JSON corrompido. A estratégia mantém a arquitetura
(LocalStorage, sem dependências novas) e preserva os registros válidos
já existentes — eles satisfazem todas as invariantes validadas.

**Limitações restantes**: a quarentena guarda apenas o último payload
ilegível; se ela própria falhar (ex.: quota esgotada), o salvamento
seguinte pode sobrescrever o conteúdo corrompido original. Registros
salvos antes da correção TP-01 que contenham sobreposição de horários
são rejeitados pela validação (ficam invisíveis na lista, mas o payload
permanece no armazenamento até escrita ou descarte).

**Revisão (remediação P1)**: ver D22. TP-02 a TP-05 permanecem em
remediação até a integração final (P2) e nova auditoria.

## D22 — Remediação da persistência, checkpoint P1: identidade e validação

**Decisão**: primeira etapa da implementação de
`docs/PERSISTENCE_REMEDIATION_PLAN.md`, restrita a identidade,
equivalência e validação, sem alterar o fluxo de produção:

1. **Identidade**: registros novos usam exclusivamente
   `crypto.randomUUID()`, com cada candidato confrontado com os IDs já
   existentes na coleção (limite de 10 tentativas; esgotamento ou
   indisponibilidade retorna erro, sem escrita). O fallback de
   horário/Math.random foi removido. O hash djb2
   (`buildPlanningFingerprint`) não participa de nenhuma decisão de
   persistência — resta apenas como sufixo do nome do arquivo na
   exportação de roteiro não salvo, uso explicitamente permitido pelo
   plano (não concede identidade nem autorização).
2. **Equivalência**: `arePlanningsEquivalent` compara diretamente os
   campos normalizados — destino, dias, estilo, orçamento numérico exato
   (sem arredondamento) e conjunto de interesses independentemente da
   ordem. Mais de um equivalente bloqueia a substituição automática
   (mensagem de ambiguidade, sem escrita). Um único equivalente ainda é
   substituído preservando o id (comportamento pré-existente; a
   confirmação vinculada ao conteúdo observado é dependência de P2).
3. **Validação**: datas reais por comparação de componentes UTC
   (rejeita 30/02, 24:00 etc.); id não vazio nem só de espaços; dias em
   quantidade exata e sequenciais; atividades completas, únicas no
   roteiro e compatíveis com estilo/interesses; horários inteiros,
   coerentes com a duração, dentro das `SLOT_WINDOWS` (com a exceção do
   passeio longo às 09:00) e sem sobreposição; relações financeiras com
   tolerância ABSOLUTA de 1e-6, rejeitando custo acima do orçamento,
   saldo negativo e valores/somas não finitos. A mesma validação é
   aplicada na leitura e antes de gravar. A leitura expõe motivos de
   rejeição (`rejections`) e classifica como corrompida a coleção com
   IDs duplicados (`duplicateIds`), sem expor integrantes do grupo a
   ações individuais.

**Justificativa**: o plano exige identidade separada de equivalência,
sem hash em decisões de persistência, e validação integral única. As
partes inseparáveis do novo fluxo de gravação (confirmação de
substituição, releitura de confirmação, Web Locks, bloqueio de escrita
em coleção corrompida, recuperação explícita) NÃO foram integradas
parcialmente: ficam registradas como dependências de P2 em TASKS.md.

**Limitações desta etapa**: coleção parcialmente válida continua
classificada como `ok` + `discardedCount` (a reclassificação para
`corrupted` exige o fluxo de recuperação do P2 para não deixar o usuário
sem caminho seguro); a substituição de equivalente único ainda não pede
confirmação; mutações seguem síncronas e sem coordenação entre abas.

**Revisão (remediação P2)**: ver D23. TP-02 a TP-05 permanecem em
remediação até a auditoria independente final.

## D23 — Remediação da persistência, checkpoint P2: operações seguras, concorrência e recuperação

**Decisão**: segunda etapa de `docs/PERSISTENCE_REMEDIATION_PLAN.md`,
integrando o novo fluxo de gravação e adaptando os consumidores (a
mudança de contrato era inseparável da adaptação mínima da interface):

1. **Fluxo de gravação (TP-04)**: cada mutação executa UMA leitura de
   decisão (`readForDecision`, que interpreta exatamente o conteúdo bruto
   lido — nunca uma segunda leitura), constrói e valida o novo estado
   integralmente em memória (`isValidCollection`: registros válidos e
   IDs únicos), executa UM único `setItem` na chave principal e confirma
   por releitura com igualdade exata. Resultados tri-estado: sucesso
   confirmado, `failure` (sem alteração da chave principal) e
   `uncertain` (escrita retornou, confirmação falhou ou divergiu — sem
   repetição nem rollback, com a mensagem fixa do plano). `removeItem`
   na chave principal é proibido: excluir o último roteiro grava `[]`.
2. **Concorrência (TP-04)**: todas as mutações são assíncronas e rodam
   sob o lock exclusivo Web Locks `travel-planner:storage:v1`. Sem a API
   (ou se a aquisição falhar), as mutações são bloqueadas com mensagem
   explicativa — não há fallback de escrita sem coordenação; leitura e
   exportação permanecem utilizáveis. A confirmação do usuário acontece
   fora do lock; ao confirmar, o conteúdo é revalidado dentro dele.
3. **Estados e classificação (TP-05)**: string vazia armazenada é
   corrompida (não ausência de dados); coleção parcialmente válida é
   `corrupted` (registros íntegros expostos só para consulta); escrita
   normal em coleção corrompida é bloqueada, sem quarentena automática
   como efeito colateral — a função antiga `discardCorruptedData` foi
   removida e substituída pela recuperação explícita.
4. **Quarentena (TP-05)**: `preserveInQuarantine` guarda o conteúdo
   bruto original sem filtrar nem reserializar; reutiliza cópia
   idêntica; bloqueia diante de cópia diferente (inclusive string
   vazia); falha de leitura, escrita ou confirmação do backup interrompe
   a operação ANTES de tocar a chave principal. Cópia adicional remanescente
   após falha não é limpa automaticamente.
5. **Recuperação explícita (TP-05)**: `previewRecovery` (somente
   leitura) informa recuperáveis, ilegíveis e IDs a corrigir;
   `recoverCorruptedStorage(expectedRaw)` revalida o conteúdo e o estado
   corrompido, preserva o backup, grava a coleção recuperada e confirma.
   Registros individualmente válidos são preservados (id, savedAt e
   campos desconhecidos intactos); TODOS os integrantes de grupos com
   IDs duplicados recebem UUIDs novos e distintos. `restoreQuarantineCopy`
   só restaura com a chave principal vazia e mantém a quarentena;
   `discardQuarantineCopy` descarta a cópia com confirmação vinculada ao
   conteúdo dela, sem tocar a chave principal, e confirma a remoção por
   releitura (falha → erro ou incerto, nunca falso sucesso).
6. **Vínculo de confirmações (TP-03/TP-05)**: substituição, exclusão,
   recuperação, restauração e descarte carregam o conteúdo bruto
   observado (`expectedRaw`); se o armazenamento mudou, a operação é
   cancelada e exige nova análise — nenhuma autorização anterior é
   reutilizada. A confirmação de substituição informa destino, dias e
   data do alvo e preserva o ID dele.
7. **Exportação de recuperação**: envelope JSON com `formato`
   (`travel-planner:recuperacao-armazenamento`), `versao` (1),
   `chaveOrigem` e `raw` — valores literais definidos aqui, pois o plano
   os deixou abertos (ambiguidade nº 2). Distinto da exportação normal.
   A interface não afirma que o download foi guardado.

**Ambiguidades do plano resolvidas nesta etapa** (registradas conforme a
seção 15): nº 2 — valores do envelope de recuperação (acima); nº 5 —
exclusão de ID ausente em snapshot válido retorna falha sem escrita
("roteiro não encontrado"); nº 10 — confirmações como painéis inline
acessíveis (`role="alert"` onde há decisão destrutiva), sem diálogo
nativo.

**Justificativa**: o plano exige que nenhuma falha de leitura vire lista
vazia, que a gravação seja confirmada por evidência, que o backup seja
pré-condição comprovada da alteração principal e que a coordenação entre
abas não tenha fallback inseguro.

**Limitações desta etapa**: abas executando versões antigas ignoram o
lock (limitação explícita do plano); o resultado incerto exige releitura
manual (a interface recarrega a lista após cada mutação, mas a decisão
seguinte é do usuário); testes de interação da interface (alertas,
painéis de confirmação) ficam para o checkpoint de interface (P3); a
substituição confirmada gera um registro novo preservando apenas o ID —
extensões desconhecidas do registro substituído não são mantidas
(ambiguidade nº 7, não exigida pelo plano).

## D24 — Integração final da interface com a persistência (P3)

**Decisão**: terceira etapa de `docs/PERSISTENCE_REMEDIATION_PLAN.md`
(seção 8.5), revisando a integração da interface com o serviço e
fechando dois pontos de conformidade:

1. **Sucesso confirmado explícito**: a HomePage passou a exibir feedback
   de sucesso (`role="status"`, tom esmeralda, distinto dos alertas de
   erro) SOMENTE após o serviço confirmar a operação por releitura —
   exclusão, recuperação (com contagens de recuperados, ilegíveis e IDs
   corrigidos), restauração e descarte da quarentena. Nenhuma mensagem
   promete preservação sem evidência: a recuperação só afirma a cópia de
   segurança porque ela é pré-condição comprovada da escrita principal.
2. **Lista vazia nunca confundida com falha de leitura**: a mensagem
   "Nenhum roteiro salvo ainda" só aparece quando a leitura comprovou
   ausência de registros (`empty`) ou coleção íntegra (`ok`). Em
   `corrupted` ou `unavailable`, a seção de salvos não afirma
   inexistência — os alertas da página explicam a situação (plano, 8.1:
   "não informa que os registros inexistem quando eles apenas não
   puderam ser lidos").

**Justificativa**: o P2 já havia integrado os fluxos (exclusão vinculada
ao conteúdo, confirmação de substituição, painéis de recuperação e
quarentena, bloqueio de ações durante operações e em estados
incompatíveis); o P3 revisou essa integração, corrigiu as lacunas de
mensagem acima e cobriu os comportamentos com testes de interação
(Testing Library + user-event, dados sintéticos, mocks de Web Locks e de
falhas do LocalStorage), conforme a dependência registrada no P2.

**Limitações**: inalteradas em relação à D23 — ver TASKS.md, relatório
do P3. TP-02 a TP-05 NÃO são declarados corrigidos sem a auditoria
independente final (critério 12 do plano).

## D15 — Formulário conectado ao gerador (substitui D11)

**Decisão**: o botão do formulário passou a se chamar "Gerar roteiro" e,
com os dados válidos, aciona `generateItinerary`. O painel de "resumo
validado" do Checkpoint 2 foi removido; falhas de geração (ex.: orçamento
insuficiente, sem atividades compatíveis) aparecem como alerta no próprio
formulário.

**Justificativa**: cumpre o previsto na D11 para o Checkpoint 3 sem
simular funcionalidade e sem reconstruir o formulário existente.

## D16 — Orientações de transporte como texto por destino

**Decisão**: cada destino declara `transportNote`, um texto geral e
orientativo sobre deslocamentos (sem linhas, trajetos ou horários
reais), exibido no resumo da viagem com rótulo de conteúdo ilustrativo.

**Justificativa**: atende ao requisito de informações de transporte sem
inventar trajetos reais, mantendo a coerência com a regra de não
apresentar dados fictícios como fatos.

## D17 — Ano do rodapé calculado em nível de módulo

**Decisão**: o ano exibido no `Footer` é calculado uma única vez no
carregamento do módulo (`const CURRENT_YEAR = new Date().getFullYear()`),
fora da renderização.

**Justificativa**: elimina o aviso de pureza do oxlint
(`react/purity`: função impura em render) sem alterar o comportamento
percebido — o ano de um rodapé não precisa mudar durante a sessão.

## D18 — Resumo financeiro com quatro conceitos e gastos não contemplados

**Decisão**: o resumo financeiro da página de resultado apresenta quatro
cartões distintos — orçamento informado, custo estimado das atividades,
saldo não alocado e custo médio das atividades por dia — cada um com
descrição, além de um bloco "Gastos não contemplados nas estimativas"
(hospedagem, alimentação, transporte e passagens) listado apenas como
texto, sem valores.

**Justificativa**: evita que o custo das atividades seja lido como custo
total da viagem e cumpre a regra de não inventar valores de hospedagem,
alimentação, transporte ou passagens. Os cálculos anteriores foram
preservados e agora são cobertos por testes de cálculo e de apresentação.

## D19 — Workflow de CI/CD em dois jobs com permissões mínimas

**Decisão**: `.github/workflows/deploy.yml` tem um job `quality`
(instalação → typecheck → testes → lint → build → upload do artefato) e
um job `deploy` (GitHub Pages) que só roda se o primeiro passar. As
permissões globais são `contents: read`; `pages: write` e
`id-token: write` ficam restritas ao job de deploy. Gatilhos: push na
`main` e execução manual.

**Justificativa**: menor privilégio possível por job, publicação
condicionada à qualidade e sem etapas desnecessárias. O caminho base do
Vite (`/Travel-Planner/`) foi confirmado conforme a D3.

## D20 — Git local sem commits até autorização

**Decisão**: o repositório Git local foi inicializado (`git init`) e o
`.gitignore` criado, mas nenhum commit, push ou publicação foi executado.

**Justificativa**: as regras do projeto exigem autorização explícita para
mutações de Git e operações externas; a preparação local não depende
delas.
