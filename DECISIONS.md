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

**Revisão (correção C2-A)**: ver D25. A afirmação "nenhuma mensagem
promete preservação sem evidência" estava incorreta no alerta genérico
de indisponibilidade (AUD-02) e a confirmação de restauração não
informava a correção de IDs (AUD-06).

## D25 — Mensagens condicionadas à evidência e restauração com análise prévia (C2-A)

**Decisão**: correção dos achados AUD-02 e AUD-06 da auditoria
independente final, com duas regras novas:

1. **Afirmação de preservação condicionada à evidência (AUD-02)**: o
   alerta genérico de indisponibilidade da HomePage só inclui "Nenhum
   dado foi alterado." quando NENHUMA mutação foi tentada na sessão da
   página (estado `mutationAttempted`). Após qualquer tentativa — mesmo
   uma falha, que pode deixar cópia adicional na quarentena (plano,
   3.2) — o alerta informa a indisponibilidade e orienta recarregar e
   verificar o estado real, sem afirmação absoluta.
2. **Restauração com análise prévia e vínculo (AUD-06)**: nova função
   somente de leitura no serviço, `previewQuarantineRestore`, informa
   registros restauráveis e IDs a corrigir com o conteúdo bruto exato
   observado. O painel de restauração apresenta essa análise ANTES da
   confirmação e a autorização guarda o conteúdo bruto capturado na
   abertura (mesmo padrão da correção AUD-01): a confirmação envia ao
   serviço somente esse conteúdo, releituras que observam conteúdo
   diferente invalidam a autorização e cancelar/concluir/falhar a limpa.

**Justificativa**: a auditoria comprovou afirmação de preservação falsa
após escrita efetiva com resultado incerto (AUD-02) e confirmação de
restauração sem o aviso prévio da alteração de identificadores
(AUD-06). A solução reutiliza o padrão de vínculo já aprovado na
correção AUD-01, sem alterar o fluxo de gravação do serviço (a única
adição é uma leitura) e sem mudar a identidade visual.

**Limitações**: AUD-02 e AUD-06 NÃO são declarados corrigidos sem nova
auditoria independente. Ver TASKS.md, relatório do C2-A.

**Revisão (correção final AUD-02, 2026-10-11)**: a auditoria independente
reproduziu salvamento efetivo com confirmação indisponível na ItineraryPage,
seguido de "Novo planejamento". A App remonta a HomePage, reinicializando
`mutationAttempted` como falso; o alerta voltava a afirmar que nenhum dado
foi alterado. O alerta genérico agora orienta recarregar e verificar o estado
real dos dados, sem afirmar preservação. O estado local e suas atribuições
foram removidos. A regressão usa a App e a navegação real entre as páginas.
A aprovação do AUD-02 continua dependendo de nova auditoria independente.

**Revisão (correção residual AUD-02, 2026-10-12)**: a reauditoria
reproduziu restauração com escrita efetiva e confirmação divergente,
seguida do painel de corrupção afirmando que os dados não foram alterados
nem apagados. Esse painel agora orienta recarregar os roteiros e verificar
o estado real dos dados antes de outra operação, sem garantir preservação.
Somente o texto mudou; contratos e operações do serviço permanecem intactos.
As regressões cobrem confirmação indisponível e divergente, uma única
escrita principal e quarentena intacta. A validação local não declara GO
nem substitui nova verificação independente.

## D26 — Validação financeira estrita e exportação da principal corrompida (C2-B)

**Decisão**: correção dos achados AUD-03, AUD-04, AUD-05 e AUD-07 da
auditoria independente final:

1. **Custo ≤ orçamento sem tolerância (AUD-03)**: a verificação de
   custo superior ao orçamento em `validateSavedItinerary` passou de
   `custo − orçamento > EPSILON` para a comparação ESTRITA
   `custo > orçamento`. A tolerância absoluta de 1e-6 permanece apenas
   nas três relações de igualdade (custo = soma das atividades, saldo =
   orçamento − custo, média = custo ÷ dias), conforme o plano (seção
   5): "Rejeitar custo superior ao orçamento. A tolerância não autoriza
   saldo negativo nem transforma valores não finitos em válidos."
2. **Saldo comparado diretamente com orçamento − custo (AUD-04)**: a
   verificação `custo + saldo ≈ orçamento` foi substituída por
   `saldo ≈ orçamento − custo` (tolerância absoluta de 1e-6). A forma
   anterior absorvia discrepâncias pela precisão numérica com valores
   grandes (1e16 + 1 === 1e16), aceitando saldo incorreto. As
   verificações de finitude e não negatividade preexistentes foram
   mantidas; a subtração de orçamento e custo finitos e não negativos
   é sempre finita, e nenhum valor armazenado é arredondado ou
   convertido (o plano proíbe centavos/arredondamento nesta correção).
3. **Exportação do conteúdo bruto da principal corrompida (AUD-05)**:
   o painel de corrupção da HomePage ganhou a ação "Baixar cópia do
   conteúdo bruto", que reutiliza o exportador de recuperação
   existente (`downloadRecoveryJson`) com o raw observado da chave
   principal e a chave de origem correta (`STORAGE_KEY`). A exportação
   não grava nada — funciona inclusive sem espaço para a quarentena —,
   não altera a chave principal e nunca sobrescreve a quarentena. O
   aviso pós-clique (`role="status"`) registra somente o download
   INICIADO e declara que iniciar o download não confirma que o
   arquivo foi guardado.
4. **Regressões e documentação fiel (AUD-07)**: a colisão verdadeira
   reconstruída pela auditoria (dois planejamentos sintéticos cujos
   fingerprints CALCULADOS são exatamente `roteiro-2cd27b6e`) foi
    incorporada como regressão, com a origem sintética identificada no
    teste — o par original permanece indisponível (ambiguidade nº 9). A
    declaração de cobertura dos critérios 1–11 no relatório do P3
    (TASKS.md) recebeu revisão explícita: ela excedia as evidências.
    **Revisão (encerramento documental AUD-07, 2026-10-11)**: o teste
    antigo de `itineraryStorageIdentity.test.ts`, antes denominado
    "colisão real", foi renomeado para "colisão SIMULADA de
    identificadores" (a fixture atribui o fingerprint de um
    planejamento a outro registro, sem calcular dois hashes iguais);
    sua lógica e verificações foram preservadas integralmente. O teste
    separado `trueCollisionAud07.test.ts` continua calculando ambos os
    fingerprints e comprovando a igualdade. A amostra histórica
    original (64.851 aceitos / 837 sobrepostos) NÃO está disponível
    para reprodução independente; nenhum dado ausente foi inventado e
    nenhuma aprovação da auditoria final é declarada.

**Justificativa**: AUD-03 e AUD-04 estavam no mesmo validador
compartilhado entre leitura e gravação e foram corrigidos juntos, sem
alterar o formato persistido nem o gerador (não havia necessidade
comprovada de mexer nele). A compatibilidade histórica é preservada:
registros produzidos pelo gerador e históricos íntegros satisfazem
exatamente as comparações corrigidas (mesma aritmética). AUD-05 usou o
exportador já aprovado, sem novas dependências nem mudança visual além
do botão no padrão existente.

**Limitações**: AUD-03, AUD-04, AUD-05 e AUD-07 NÃO são declarados
corrigidos sem nova auditoria independente. A amostra histórica
original (64.851/837) segue indisponível — não se afirma ausência de
rejeições adicionais nessa população. Ver TASKS.md, relatório do C2-B.

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

**Revisão (preparação experimental, 2026-10-12)**: o gatilho de push foi
alinhado à branch `master` atualmente utilizada. Execução manual, sequência
de qualidade, artefato `dist/` e permissões permanecem iguais. Ver D27.

## D20 — Git local sem commits até autorização

**Decisão**: o repositório Git local foi inicializado (`git init`) e o
`.gitignore` criado, mas nenhum commit, push ou publicação foi executado.

**Justificativa**: as regras do projeto exigem autorização explícita para
mutações de Git e operações externas; a preparação local não depende
delas.

## D27 — Preparação local da demonstração experimental

**Decisão**: manter a branch `master` e alinhar o workflow a ela. Exibir no
rodapé compartilhado pelas duas páginas o aviso experimental solicitado,
em bloco destacado com identificação acessível. O aviso informa possível
perda dos roteiros, ausência de sincronização e de garantia permanente,
exportação JSON e ausência de importação de arquivos.

**Justificativa**: resolve as pendências locais da revisão de prontidão
sem alterar navegação, regras de negócio, persistência ou formato v1.
Reutilizar o rodapé evita duplicação e novas dependências.

**Limites**: o GO técnico vale para demonstração experimental. O aceite
integral de produção permanece pendente; a ausência dos artefatos
históricos originais é registrada como risco, não como bloqueio automático
da demonstração. Configuração remota, commit, push e publicação exigem
autorização posterior e não fazem parte desta preparação.

## Notas de reconciliação documental (2026-10-12)

Não são novas decisões técnicas. Os identificadores e a ordem das decisões
acima foram preservados; as notas indicam o que vale hoje.

- **D3**: o remoto `origin` é `github.com/kleytonforja/Travel-Planner`; o nome
  do repositório é compatível com `base: '/Travel-Planner/'`. A URL publicada
  ainda não foi validada (ver `TASKS.md`, "Estado do Git e da publicação").
- **D19**: o gatilho vigente do workflow é a branch `master` (revisão da
  própria D19 e D27). A menção a `main` no texto original é histórica.
- **D20**: descreve o estado inicial. Hoje o repositório tem histórico de
  commits e remoto configurado; commits, pushes e publicações seguem
  condicionados à autorização explícita (`AGENTS.md`).
- **D21**: onde diverge da D22 (sem fallback de `randomUUID`, hash fora das
  decisões de persistência) e da D23 (`discardCorruptedData` removida,
  substituída pela recuperação explícita), prevalecem D22 e D23.
- **Referências técnicas de persistência**: `docs/PERSISTENCE_REMEDIATION_PLAN.md`
  (plano) e `docs/FINAL_AUDIT_FINDINGS.md` (achados AUD-01 a AUD-07).

## D28 — Importação de roteiros JSON exportados (C5)

**Decisão**: o aplicativo passa a permitir importar um roteiro exportado por
ele mesmo (JSON, `schemaVersion` 1). A importação não estava no MVP; esta
decisão altera o escopo registrado na D27 ("ausência de importação de
arquivos"), que passa a descrever o estado anterior. Regras:

1. **Serviço puro** (`src/services/itineraryImport.ts`,
   `parseItineraryImport`): trata o texto como entrada não confiável. Limite de
   256 KB (bytes UTF-8), BOM removido, leitura apenas de propriedades próprias
   conhecidas, objetos novos (campos extras e `__proto__` ignorados), avisos
   limitados a 50 itens de até 500 caracteres sem caracteres de controle. Não
   acessa o armazenamento, não gera identificador e não define `savedAt`.
2. **Reconstrução pelo catálogo atual**: destino e atividades são localizados
   pelo nome na base atual; qualquer divergência de custo, duração, categorias,
   país ou moeda **rejeita o arquivo inteiro** (sem adaptação). O resultado é
   validado por `validateSavedItinerary`, o mesmo validador da leitura e da
   gravação (regras de AUD-03 e AUD-04 incluídas).
3. **Interface** (`ImportItinerary`, na página inicial, próxima de "Meus
   roteiros salvos"): arquivo acima do limite é recusado antes da leitura;
   arquivo válido gera pré-visualização; a gravação ocorre somente após
   confirmação e **exclusivamente por `saveItinerary`**. O roteiro vira um
   registro **novo**: identificador (UUID) e `savedAt` são gerados na
   importação; o `id` e a data do arquivo nunca são usados.
4. **Duplicatas**: um planejamento equivalente já salvo só é substituído
   mediante a confirmação vinculada ao conteúdo bruto observado pelo serviço
   (mecanismo existente `ReplaceConfirmation`). A autorização é descartada ao
   cancelar, concluir, falhar ou quando a página observa outro conteúdo.
5. **Resultados**: sucesso somente depois da confirmação por releitura do
   serviço; falha (por exemplo, quota) mantém a pré-visualização para nova
   tentativa; resultado incerto exibe a mensagem fixa do serviço, descarta a
   pré-visualização e não afirma preservação. Importação bloqueada quando o
   armazenamento não está legível (`ok` ou `empty` são os únicos estados que a
   permitem) e durante outras operações.
6. **Sem alterações** em `itineraryStorage.ts` e `itineraryExport.ts`; a
   exportação continua no formato v1 e o envelope de recuperação não é aceito
   pela importação.

**Justificativa**: recuperar um roteiro exportado sem ampliar a superfície de
persistência já auditada. A rejeição por divergência com a base evita gravar
dados reconstruídos de forma ambígua. Não conflita com o plano de remediação,
que deixa fora de escopo apenas a "mesclagem/importação geral de arquivos de
recuperação".

**Limitações**: arquivos exportados com uma base de dados diferente são
rejeitados (a preservação entre versões da base segue como evolução futura);
a data de gravação é a da importação; a nova superfície ainda não passou por
reauditoria independente. Aviso do rodapé atualizado: ele só passou a citar a
importação depois de a funcionalidade estar implementada e validada
localmente.

**Revisão (C5-T4, 2026-10-12)**: a importação foi finalizada. Auditoria
independente do Codex informada pelo usuário como aprovada (148 testes
específicos da importação); o relatório dela não está no repositório. Também
foi adicionado `public/favicon.svg` (ícone de avião da identidade visual, em
fundo azul) referenciado em `index.html`, que elimina o 404 de `/favicon.ico`
sob o caminho base `/Travel-Planner/`. A lógica de importação não foi alterada.

## D29 — Fundamentos do Design System (V1-T1)

**Decisão**: o redesign (identidade moderna e premium: fundo azul-escuro com
gradientes, azul vibrante nos elementos interativos, cards claros e
arredondados, ícones coloridos por categoria) começa por fundamentos
reutilizáveis, sem reconstruir o aplicativo:

1. **Tokens em `@theme` (`src/index.css`)**, que o Tailwind v4 transforma em
   utilitários: marca (`brand-*`), fundo noturno (`night-*`), superfícies,
   linhas e texto (`surface*`, `line*`, `ink*`), foco (`focus`,
   `focus-on-dark`), categorias (`cat-*` e `cat-*-soft`), raios (`control`,
   `card`, `card-lg`), sombras (`card`, `card-hover`, `float`), espaçamentos
   semânticos (`gutter`, `section`) e easing. Marca, superfícies claras e
   texto repetem os valores atuais (blue/slate do Tailwind): a interface
   publicada **não muda de aparência**. Os tokens `night-*` e `cat-*` são novos.
2. **Estilos globais**: foco visível padrão com especificidade zero
   (`:where(...)`), utilitários `focus-ring`, `focus-ring-on-dark` e
   `bg-night-gradient`, e `prefers-reduced-motion` (sem rolagem suave nem
   transições longas).
3. **Primitivos em `src/components/ui/`** (classes de variantes em
   `variants.ts`): `Button` (primary, secondary, soft, onDark), `Card` (light e
   photo), `CategoryBadge` (chip e bloco com ícone colorido), `SearchField` e
   `ProgressSteps`. `Button` e `Card` já são usados por `Hero` e
   `DestinationCard`, com renderização idêntica; os demais ficam preparados
   para as próximas telas (busca de destinos, cards com foto, planejamento em
   etapas, categorias) e não foram aplicados às telas atuais.
4. **Contraste verificado por teste**: `src/tests/designSystem.test.tsx` lê os
   tokens do próprio CSS e confere o contraste WCAG (texto ≥ 4,5:1; elementos de
   interface ≥ 3:1). Uma verificação encontrou que o número branco sobre
   `brand-500` daria 3,76:1; o indicador de progresso usa `brand-600` (5,26:1).

**Justificativa**: base visual consistente e acessível antes de redesenhar as
telas, com risco mínimo para a versão publicada (capturas em Chromium de
1280 px e 375 px idênticas, byte a byte, antes e depois).

**Limitações**: não há fotografias nem novas telas ainda; categorias coloridas
e demais primitivos aguardam adoção; o CSS gerado cresceu (de 28,4 KB para
37,3 KB, cerca de +1,4 KB comprimido); fontes (Inter) continuam sem carregamento
explícito; nada foi publicado.

**Revisão (consolidação do V1-T1, 2026-10-12)**: a imagem
`docs/references/travel-planner-design-approved.png` passa a ser a referência
visual oficial do redesign (alta fidelidade; ver `PROJECT.md`). A skill
`frontend-design` foi ativada de forma seletiva, como auxiliar, para tarefas de
interface da fase de redesign (ver `TASKS.md`). Avatar e perfil local, mapa
interativo, rotas reais, fotografias e planejamento progressivo seguem como
requisitos planejados, não implementados.

## D30 — Nova home (V1-T2) e imagens por ilustração original

**Decisão**: a página inicial passa a seguir a referência visual oficial
(`docs/references/travel-planner-design-approved.png`): cabeçalho escuro
integrado ao hero (`Header tone="dark"`), hero com fundo noturno e cena de
baía ao pôr do sol, mensagem principal, dois CTAs ("Planejar minha viagem" e
"Explorar destinos") e quatro destaques, painel "Destinos em destaque" que
sobrepõe a base do hero e cards com imagem, moeda, país, descrição, número de
atrações, indicadores coloridos de categoria (`CategoryBadge` "dot") e botão
"Selecionar destino". A ordem passa a ser: hero, destinos, formulário atual
(mantido até o V1-T3), roteiros salvos, importação e "Como funciona". Os
alertas de armazenamento continuam no topo, antes do hero.

**Imagens**: não havia imagem local com origem e licença identificáveis, e
obter imagens de terceiros exigiria operação externa não autorizada. Em vez de
usar conteúdo sem procedência, o hero e os cards usam **ilustrações vetoriais
originais do projeto** (`src/components/ui/scenes.tsx`), declaradas como tais
na interface ("As imagens dos destinos são ilustrações do projeto"). As
fotografias reais da referência **não** foram reproduzidas.

**Conteúdo veraz**: os destaques do hero descrevem somente recursos existentes
(roteiro por dia, estimativa ilustrativa de custos, exportar e importar JSON,
dados no navegador). Itens da referência sem função hoje (mapa, rotas, fotos
reais, funcionamento offline, avatar, alternância de tema, "Ver todos") não
foram incluídos para não criar botões decorativos nem prometer recursos.

**Acessibilidade e contraste**: o fundo do hero é decorativo (`aria-hidden`);
as ilustrações dos cards têm texto alternativo; o botão secundário sobre fundo
escuro passou a ter fundo escuro translúcido e o selo, fundo noturno, após
medição do pior caso de contraste atrás do texto (todas as medições em
375, 768, 1366 e 1920 px ficaram ≥ 4,5:1).

**Limitações**: sem fotografias; comparação com a referência feita
visualmente (não pixel a pixel); botão de destino em largura total em vez do
botão circular da referência; a exclusão de roteiros continua sem diálogo de
confirmação (comportamento existente, vinculado ao conteúdo observado).

## D31 — Fotografias reais do Unsplash na home (V1-T2.1)

**Decisão**: o hero e os três cards da home passam a usar fotografias reais do
Unsplash (Unsplash License), no lugar das ilustrações, que permanecem como
substitutas em caso de falha de carregamento. A procedência (fotógrafo, página,
licença e verificações) está em `docs/IMAGE_CREDITS.md` e os créditos aparecem
no rodapé. Foram usadas quatro fotografias: hero (Rio de Janeiro ao pôr do sol,
Mauro Lima) e destinos (Florianópolis, Henrique Pereira; Rio de Janeiro, Lucas
Campoi; Lisboa, Sarah Markstaller).

**Implementação**: arquivos WebP locais em `public/images/hero/` (960 e 1920 px)
e `public/images/destinations/` (640 e 1200 px, 16:9), com `srcset`/`sizes`,
`width`/`height` declarados (CLS medido em 0), hero com `fetchpriority="high"`,
cards com `loading="lazy"`, texto alternativo descritivo e caminho derivado de
`import.meta.env.BASE_URL` (conferido em Chromium sob `/Travel-Planner/`). Dados
em `src/data/photos.ts`; componentes em `src/components/ui/photos.tsx`.

**Contraste**: sobre a fotografia, o hero recebeu camada escura uniforme
(`night-950` a 55% abaixo de `lg` e 30% a partir de `lg`) mais gradiente à
esquerda e na base. A medição (99% dos pixels atrás do texto, 375 a 1920 px)
reprovou antes do ajuste (h1 a 1,7:1 em 375 px) e ficou ≥ 4,5:1 depois; o pior
pixel ficou ≥ 4,9:1. O custo é um hero mais escuro que a referência.

**Escopo**: fotografias das atrações individuais não foram incorporadas; ficam
para fase posterior, começando pelas dez atrações do Rio de Janeiro. Catálogo e
motor de planejamento não foram alterados.

**Limitações**: a fotografia de Florianópolis não nomeia a Ponte Hercílio Luz na
página de origem (identificação por etiqueta e aparência); o acesso ao Pexels foi
recusado (HTTP 403); o Unsplash bloqueia o acesso automatizado às páginas, então a
verificação foi feita pela ferramenta de consulta web, e as imagens vieram do CDN
público, sem chave de API; fidelidade comparada visualmente com a referência.

## D32 — Planejamento progressivo: estrutura de sete etapas e etapa de destino (V1-T3.1)

**Decisão**: o formulário tradicional será substituído gradualmente por um
planejamento em etapas. Esta entrega cria a **estrutura** e implementa
**somente a etapa 1 (destino)**; as etapas 2 a 7 (Datas, Viajantes, Transporte,
Interesses, Orçamento e Revisão) aparecem no indicador de progresso, mas não
existem ainda e não têm controles.

1. **Estrutura extensível** (`src/components/planning/`): `planningSteps.ts`
   declara as sete etapas, o rascunho (`PlanningDraft`, hoje só o destino) e o
   contrato `StepProps`; `stepRegistry.ts` registra as etapas implementadas;
   `PlanningFlow` exibe o indicador, a etapa atual e, enquanto a próxima etapa
   não existir, o aviso "Próximas etapas" com o caminho para o formulário
   tradicional. Entregar uma nova etapa é criar o componente e registrá-lo; o
   indicador e a navegação não são reescritos (há teste com uma etapa fictícia
   registrada).
2. **Etapa de destino** (`DestinationStep`): pergunta "Para onde vamos viajar?",
   `SearchField`, filtros (Todos, países e categorias derivados do catálogo,
   com `aria-pressed`), mensagem de resultados em região `status` e os mesmos
   `DestinationCard` da home (fotografia, resumo e categorias coloridas). A
   seleção é por mouse, toque ou teclado (botões dos cards) e destaca o card
   escolhido. A pesquisa e os filtros são funções puras
   (`src/utils/destinationSearch.ts`) sobre o catálogo existente, sem duplicar
   registros; ignoram acentos e caixa e exigem todos os termos.
3. **Navegação e sessão**: nova tela `PlanningPage` (cabeçalho escuro, botão
   "Voltar para o início"). O rascunho vive no `App`, então a escolha de destino
   é preservada ao alternar entre a home e o planejamento na mesma sessão, e a
   seleção feita na home aparece no planejamento. O botão principal do hero
   ("Planejar minha viagem") abre o planejamento; o formulário tradicional segue
   na home (menu "Planejar"), já preenchido com o destino, e o botão "Continuar
   com o formulário tradicional" leva até ele (desabilitado, com explicação,
   enquanto não há destino).
4. **Sem controles enganosos**: não há botão "Próxima/Continuar" para etapas
   inexistentes nem itens clicáveis no indicador.
5. **Ajuste do indicador**: `ProgressSteps` passou a quebrar linha e a mostrar os
   rótulos das etapas não atuais apenas a partir de `lg`, para caber sete etapas
   em 375 e 768 px.

**Justificativa**: preparar a experiência progressiva inspirada na referência
sem entregar etapas incompletas, mantendo o formulário atual funcional e o
motor de roteiros, a persistência e a importação/exportação intactos.

**Limitações**: etapas 2 a 7 pendentes; o planejamento ainda não gera roteiro;
o rascunho não é persistido entre sessões (apenas na sessão do navegador);
apenas Chromium verificado.

**Revisão (consolidação do V1-T3.1, 2026-10-12)**: os filtros da etapa Destino
foram separados em dois grupos rotulados — **Localização** (Todos e países, com
ícone de local) e **Categorias dos destinos** (ícones coloridos das categorias)
— e uma nota discreta informa que esses controles apenas filtram os destinos
listados e que os interesses de viagem serão escolhidos em etapa própria. O filtro
continua sendo de escolha única e **não** é a seleção múltipla de interesses, que
pertence à etapa 5 (Interesses). **O formulário tradicional será substituído
somente depois da conclusão do planejamento progressivo (etapas 2 a 7)**; até lá
ele permanece disponível na home.

## D33 — Planejamento progressivo: etapa de datas e duração (V1-T3.2)

**Contexto**: a etapa 2 ("Quando começa sua aventura?") precisa aceitar datas
exatas ou apenas a duração, sem erros de fuso e dentro do limite do motor.

**Decisão**:
- O rascunho (`PlanningDraft`, em memória no `App`) ganhou `dateMode`
  (`dates` | `duration`), `startDate`, `endDate` e `durationDays`. Os valores
  dos dois modos coexistem, então alternar o modo não apaga nada. A duração
  efetiva vem de `resolveTripDays` conforme o modo ativo.
- Datas são strings `AAAA-MM-DD` convertidas em **número de dia UTC**
  (`Date.UTC(...)/86400000`), sem `Date` local: virada de mês/ano, bissexto e
  horário de verão não alteram a contagem. A duração é **inclusiva** (12/01 a
  19/01 = 8 dias). A data de início não pode ser anterior a hoje (calendário
  local).
- Limites **1 a 14 dias** reutilizam `MIN_DAYS`/`MAX_DAYS` de
  `planningValidation`; não há segunda fonte da regra. Duração personalizada
  aceita só inteiros; atalhos 3/5/7/10/14.
- Navegação: `STEP_COMPLETION` e `STEP_HINTS` (ao lado de `STEP_REGISTRY`)
  definem quando cada etapa está completa; "Continuar para X" só aparece se a
  etapa X existe e só habilita com a atual completa; "Voltar" preserva tudo.
- O formulário tradicional recebe a duração via `initialDays` (campo
  pré-preenchido) e continua sendo o desfecho até o wizard ser concluído.
- Nada é gravado no LocalStorage; o motor de roteiros e a persistência não foram
  alterados.

**Decisão de produto registrada (NÃO implementada)**: **fotografias dinâmicas**
— rodízio de imagens na Home, fundo contextual conforme o destino escolhido e
transições suaves. Aprovada para fase futura, sem tarefa aberta; deverá respeitar
`prefers-reduced-motion`, contraste e os créditos em `docs/IMAGE_CREDITS.md`.

**Consequências**: etapas 3 a 7 pendentes; apenas Chromium verificado.

## D34 — Planejamento progressivo: etapa de viajantes (V1-T3.3)

**Decisão**: a etapa 3 ("Quem vai viajar com você?") coleta apenas dados
agregados no rascunho em memória (`PlanningDraft.travelers`): adultos
(padrão 1), crianças, bebês, quantidade de crianças por faixa etária (3–5,
6–11, 12–17; opcional), perfil opcional (Individual, Casal, Família, Amigos) e
necessidades de acessibilidade opcionais (mobilidade, escadas/caminhadas,
visual, auditiva). Não há nomes, documentos, datas de nascimento nem cadastro
individual. Regras em `src/utils/travelers.ts`:
- mínimo de 1 adulto; sem negativos nem decimais;
- **máximo de 20 viajantes no total**: evita valores absurdos e mantém o
  planejamento no porte que o produto ilustra; é uma constante (`MAX_TRAVELERS`)
  fácil de revisar;
- **sem regra de um adulto por bebê** (revisão da consolidação): basta haver
  pelo menos 1 adulto; o grupo pode ter mais bebês que adultos, respeitando o
  limite total de 20. A regra anterior (bebês ≤ adultos) foi removida por decisão
  do responsável do projeto; regras de companhia de bebês de companhias aéreas
  ou hospedagens não são validadas aqui. As faixas etárias nunca somam mais que o
  número de crianças e se ajustam ao reduzir crianças;
- o perfil **nunca é inferido** da composição; clicar no perfil escolhido o remove.

**Limitação (registrada para o V1-T3.7)**: o motor de roteiros **não usa**
composição do grupo, faixas etárias, perfil nem acessibilidade; nenhum custo ou
atração é personalizado por viajante, e a tela informa isso. A integração com o
motor é tarefa futura (V1-T3.7). Nada é persistido (apenas sessão).

**Navegação**: "Voltar para Datas"; não existe "Continuar" porque a etapa 4
(Transporte) não está implementada; o formulário tradicional continua como
fallback, com destino e duração. A etapa 3 está sempre completa (1 adulto é o
padrão válido).

## D35 — Planejamento progressivo: etapa de transporte (V1-T3.4)

**Decisão**: a etapa 4 ("Como você pretende viajar?") registra apenas
**preferências declaradas** em `PlanningDraft.transport` (memória da sessão):
- **Chegada ao destino** (escolha única, opcional, clique repetido remove):
  Carro próprio, Avião, Ônibus, Trem, Ainda não decidi.
- **Cidade de origem**: texto livre e opcional, **não verificado**. Validação em
  `src/utils/transport.ts`: espaços normalizados, 2 a 80 caracteres, começa com
  letra e aceita letras (inclusive acentuadas), espaço, hífen, apóstrofo, ponto e
  vírgula. Origem inválida impede avançar; vazia não.
- **Deslocamentos locais** (múltipla escolha): Carro próprio, Carro alugado,
  Táxi ou aplicativo, Transporte público, Caminhada, Combinação de transportes;
  "Ainda não decidi" é **exclusivo** (marcá-lo limpa os demais; marcar outro o
  remove). "Combinação de transportes" é uma opção comum, combinável.
- Todas as escolhas são opcionais; a etapa só fica incompleta com origem inválida.
- Cards são botões com `aria-pressed`, alvo mínimo de 56 px de altura.

**Limitações (registradas para o V1-T3.7)**: não há cálculo de rotas,
distâncias, tempos ou tarifas, nem API externa, nem mapa; o motor de roteiros
**não usa** estas preferências e não otimiza atrações por meio de transporte. A
tela informa isso. Nada é persistido. Etapas 5 a 7 e o fallback do formulário
tradicional seguem como antes.

**Revisão visual (consolidação do V1-T3.4)**: os cards da etapa usam o novo
`SelectableCard` (`src/components/ui/SelectableCard.tsx`), o mesmo visual para
escolha única e múltipla: selecionado = fundo azul-claro (`brand-100`), borda
azul de 2 px (`brand-600`), check no canto superior direito (decorativo,
`aria-hidden`) e sombra de destaque; não selecionado = fundo branco e borda
neutra. Semântica: botão com `aria-pressed`; o anel de foco independe da
seleção. O componente é reutilizável pelas próximas etapas (Interesses) sem
refatoração; os cards de perfil da etapa Viajantes (V1-T3.3) ainda usam o
estilo anterior e podem migrar depois, sem mudar comportamento.

## D36 — Planejamento progressivo: interesses e ritmo (V1-T3.5)

**Decisão**: a etapa 5 ("Que experiências você gostaria de viver?") guarda em
`PlanningDraft` (memória da sessão) `interests` e `pace`, usando
`SelectableCard` (D35):
- **Interesses** (múltipla escolha): exatamente as 7 `InterestCategory` do
  catálogo e do motor (Gastronomia, Natureza, Cultura, Aventura, Compras,
  Relaxamento, Vida noturna), com os ícones de categoria existentes; ordem do
  catálogo mantida; remover um não afeta os outros. A etapa exige **ao menos um**
  interesse (regra do motor/formulário). Não há subcategorias: o catálogo só tem
  categoria por atividade, e nenhuma foi inventada.
- **Ritmo** (escolha única, padrão Equilibrado, nunca vazio): Tranquilo,
  Equilibrado, Intenso.
- Regras em `src/utils/interests.ts`.

**Suporte real do motor**: os **interesses são usados** pelo motor (via formulário
tradicional, que agora abre já com os interesses marcados, `initialInterests`).
O **ritmo NÃO tem suporte**: o gerador não tem parâmetro de ritmo (o `style` do
motor — econômico, equilibrado, confortável — trata de custo e é outra coisa,
coletado no formulário tradicional). O ritmo fica só no estado e a tela informa que
o gerador ainda não ajusta o roteiro por ele. Integração prevista no V1-T3.7.

**Pendência visual**: a referência aprovada usa cards fotográficos de
interesses; esta etapa usa ícones. Fotografias temáticas licenciadas (e sua
curadoria/créditos em `docs/IMAGE_CREDITS.md`) continuam **pendentes**, sem
imagens genéricas fingindo ser de atrações específicas.

**Navegação**: "Voltar para Transporte"; sem "Continuar" (etapa 6 inexistente);
fallback do formulário tradicional habilitado com ao menos um interesse.

## D37 — Planejamento progressivo: orçamento e estilo financeiro (V1-T3.6)

**Decisão**: a etapa 6 ("Quanto você pretende investir na viagem?") guarda em
`PlanningDraft.budget` (memória da sessão): estilo, modo do valor, modalidade e
texto digitado. Regras em `src/utils/budget.ts`:
- **Estilo** (`SelectableCard`, escolha única, padrão **Equilibrado**): são os
  mesmos `TravelStyle` do motor (econômico, equilibrado, confortável). É o
  **estilo financeiro**, distinto do **ritmo** da etapa 5 (D36).
- **Orçamento opcional**: "Informar um valor" ou "Ainda não defini" (padrão). Valor
  vazio ou "Ainda não defini" não bloqueiam; só texto inválido bloqueia.
- **Modalidades**: valor **total da viagem** ou **por pessoa**, sempre explicitada
  na tela e no resumo.
- **Aritmética em centavos inteiros**, lida por regex (sem ponto flutuante);
  aceita `2500`, `2500,50`, `2500.50` (até 2 casas); rejeita negativo, zero,
  letras, separador de milhar, mais de 2 casas. **Teto provisório de entrada:
  10.000.000,00** (o motor só exige valor > 0; o teto evita valores absurdos e
  mantém o total × 20 viajantes em inteiros seguros).
- **Viajantes**: adultos + crianças + bebês contam 1 cada; **sem descontos
  presumidos**. Total → por pessoa divide igualmente e **arredonda para baixo ao
  centavo** (nunca superestima; a tela avisa quando é "cerca de"); por pessoa →
  total é exato. Recalcula ao mudar os viajantes. Valor pequeno demais para dividir
  (< 0,01 por pessoa) é sinalizado.
- **Moeda**: a do destino no catálogo (R$ ou €), `formatCurrency` existente;
  **sem conversão cambial**.

**Integração com o motor (sem alterá-lo)**: `PlanningInput.budget` é o orçamento
**por pessoa** e `style` é o estilo financeiro. Ao usar o formulário tradicional
depois do fluxo progressivo, ele abre com o **estilo** e o **valor por pessoa**
(`initialStyle`, `initialBudget`; sem valor, o campo fica vazio e o formulário o
exige). Sem passar pelo fluxo, o formulário direto da home continua vazio. A
geração de roteiro a partir do fluxo progressivo é a etapa 7 (Revisão).

**Limitações financeiras**: valores de atrações são estimativas ilustrativas; o
orçamento é só um teto para o motor escolher atrações, **não** é dinheiro disponível
para outras despesas; hospedagem, alimentação e transporte **não** são calculados;
sem descontos para crianças/bebês; sem cotações nem câmbio. Nada é persistido.

**Observação de teste (consolidação)**: com o limite padrão de 5 s, os testes que percorrem
as etapas 2 a 6 medem 3–6 s sob carga e 2 de 3 execuções falharam por tempo. Em vez de
alterar o `vite.config.ts` (mantido sem `testTimeout`), os cinco arquivos de etapa
(`datesStep`, `travelersStep`, `transportStep`, `interestsStep`, `budgetStep`) usam
`vi.setConfig({ testTimeout: 20000 })` localmente.

## D38 — Planejamento progressivo: revisão e geração direta (V1-T3.7)

**Checkpoint A — compatibilidade com o motor** (nenhum bloqueio; motor, persistência
e importação/exportação **não** foram alterados):
- **Contrato do motor**: `generateItinerary(PlanningInput, Destination)` com
  `PlanningInput = { destinationId, days (1–14), interests (≥1), style, budget }`;
  `budget` é **por pessoa**, > 0, na moeda do destino. O roteiro salvo guarda esse
  `input` (esquema inalterado).
- **Suportados diretamente**: destino, interesses, estilo financeiro.
- **Conversíveis sem perda de significado**: duração (datas ou dias → `days`) e
  orçamento (valor por pessoa direto; valor total ÷ viajantes em centavos,
  arredondado para baixo, adultos + crianças + bebês contando 1 cada).
- **Não suportados (ainda não influenciam o roteiro)**: datas exatas, composição dos
  viajantes (só entra na conta do orçamento por pessoa), perfil, acessibilidade,
  transporte (chegada, origem, locais) e ritmo.
- **Orçamento ausente**: o motor exige valor > 0; a geração pelo fluxo é **bloqueada**
  com explicação e atalho "Corrigir" para a etapa 6. Nenhum valor é inventado.
- **Riscos tratados**: arredondamento (centavos, para baixo, explicitado na tela);
  alteração de viajantes (recalcula a cada geração, a partir do rascunho); destino,
  duração ou interesses inválidos/incompletos (validação reutilizada
  `validatePlanningInput`, cada problema aponta a etapa certa); perda de preferências
  (o rascunho vive no `App` e nunca é descartado, nem em erro de geração).

**Decisão**: a etapa 7 ("Sua viagem está quase pronta!") mostra cards de revisão
(destino com fotografia, datas/duração, viajantes, transporte de chegada,
deslocamentos locais, interesses, ritmo, estilo e orçamento), cada um com "Editar"
(vai à etapa e oferece "Voltar para a revisão"), e o botão "Gerar roteiro", que usa
`buildPlanningInput` (`planningAdapter.ts`) e a **mesma** função `generateItinerary`
do formulário tradicional, abrindo a página de resultado atual (salvar, exportar,
importar inalterados). Um aviso diz o que é usado e o que não é; as preferências
temporárias **não** são salvas no roteiro nem alteram sua geração. Erro de geração
mostra a mensagem do motor e mantém tudo.

**Limitações de persistência**: o roteiro salvo contém apenas o contrato do motor.
Datas exatas, viajantes, transporte, ritmo, perfil e acessibilidade existem só na
sessão e se perdem ao recarregar. Persistir essas preferências exigiria mudar o
esquema salvo/exportado: **fora de escopo**, decisão futura.

**Próximos passos**: V1-T3.8 remove o formulário tradicional; usar as preferências
não utilizadas na geração exige alterar o motor e o esquema (nova decisão).

## D39 — Planejamento progressivo como único caminho; retirada do formulário tradicional (V1-T3.8)

**Decisão**: o formulário tradicional (`PlanningForm`) foi **removido** da interface e do
código; o planejamento progressivo de sete etapas é a única forma de criar roteiros.
- **Home**: o formulário deu lugar à seção "Planeje sua viagem" (âncora `#planejar`, mantida
  para o cabeçalho, o rodapé e o hero) com o botão "Começar o planejamento". O hero abre o
  planejamento; os cards de destino passaram a dizer "Planejar este destino" e abrem a etapa 1
  com o destino já selecionado (`DestinationCard` ganhou `actionLabel`, o padrão continua
  "Selecionar destino" na etapa 1).
- **Código removido**: `PlanningForm.tsx`, o pré-preenchimento (`initialDays`,
  `initialInterests`, `initialStyle`, `initialBudget`), `onUseLegacyForm`, a âncora de rolagem
  pós-troca de tela e `engineBudgetInput`. Os componentes compartilhados (`DestinationCard`,
  `DestinationsSection`, `HomePage`, `PlanningFlow`) foram mantidos porque têm consumidores.
- **Preservado, sem alteração**: motor de geração, validação (`validatePlanningInput`, agora
  chamada só pelo adaptador), persistência, salvar, listar/abrir, excluir, exportar e importar JSON.
  A exclusão mantém o comportamento existente: vinculada ao conteúdo lido e confirmada por releitura
  (não há diálogo prévio de confirmação).
- **Testes**: os que preenchiam o formulário passaram a usar o fluxo (`helpers/wizardDriver.ts`)
  ou foram trocados por verificações de que o formulário não existe mais.

**Pendências e limitações** (nenhuma delas implementada):
- Orçamento ausente **bloqueia a geração** (o motor exige valor por pessoa > 0).
- O **ritmo** não influencia o roteiro.
- Datas exatas, viajantes (exceto no orçamento por pessoa), transporte, perfil e acessibilidade
  **não influenciam o roteiro e não são persistidos** (exigiria mudar motor e esquema).
- **Fotografias dinâmicas** (rodízio na Home e fundo por destino): decisão futura aprovada (D33).
- **Imagens das atrações**: apenas as fotografias de hero e dos três destinos existem.
- **Mapas e rotas**: não existem; sem cálculo de distâncias ou tempos.
- Após gerar um roteiro, "Novo planejamento" volta à home e o rascunho da sessão é mantido.

## D40 — Esquema v2: contratos de tipos (M2.2) — parcial

**Contexto**: o diagnóstico M1 e o plano M2.1 aprovaram a evolução do esquema (orçamento e ritmo
opcionais, saldo opcional). Esta decisão registra **apenas os contratos de tipos**; o esquema v2
**não** está implementado por completo.

**Contratos adotados (M2.2)**:
- `PlanningInput.budget?: number` e `PlanningInput.pace?: TripPace`; `TripPace = 'tranquilo' |
  'equilibrado' | 'intenso'` (definido em `src/types`, reexportado por `utils/interests`).
- `ItineraryTotals.unallocatedBudget?: number`.
- **Ausência = propriedade omitida**; nunca `null`, 0 ou valor fictício. `budget` presente deve ser
  finito e > 0 (`isValidBudgetValue`); `pace` presente deve ser um dos três valores (`isValidPace`);
  `null`, 0, negativos, NaN/Infinity e ritmo desconhecido são rejeitados por
  `validatePlanningInput` (novo campo de erro `pace`).

**O que NÃO mudou (comportamento atual preservado)**:
- A **geração ainda exige o orçamento**: `validatePlanningInput` mantém o erro de orçamento ausente e o
  motor recusa, com mensagem explícita, um `PlanningInput` sem `budget` (sem teto fictício).
- A **persistência continua rejeitando** registros sem orçamento ou sem saldo (razão explícita
  "planejamento sem orçamento ainda não é suportado"); aceitá-los é a M2.3.
- Importação/exportação inalteradas (versão 1); chaves do LocalStorage, quarentena e migração
  inalteradas. O ritmo **não** é aplicado à distribuição e não é gravado pelo adaptador.
- A interface mostra "Orçamento informado" e "Saldo não alocado" **somente se existirem** (hoje sempre
  existem); não há texto nem valor para o caso ausente (M2.5).

**Dependências identificadas**:
- M2.3 precisa validar `pace` no armazenamento (hoje o validador ignora campos extras, então um
  `pace` desconhecido gravado seria aceito), aceitar orçamento e saldo ausentes com seus invariantes
  e incluir ritmo e ausência de orçamento na equivalência de planejamentos.
- M2.4 precisa da exportação v2 e da importação das versões 1 e 2.
- M2.5 ativa a geração sem orçamento e os textos de interface.

## D41 — Esquema v2: persistência compatível (M2.3) — parcial

**Decisão**: o armazenamento (`itineraryStorage.ts`) passa a aceitar o contrato v2, sem migrar nem
regravar nada e sem alterar chaves (`...:v1`, quarentena, lock):
- **Orçamento**: ausente (propriedade omitida) ou número finito > 0. `null`, 0, negativos, não finitos e
  texto são inválidos. Uma entrada em memória com `budget: undefined` equivale à ausência (some na
  serialização).
- **Saldo** (`unallocatedBudget`): existe **se, e somente se**, existe orçamento. Orçamento presente exige
  saldo finito ≥ 0 e coerente (`≈ orçamento − custo`, tolerância absoluta 1e-6); orçamento ausente exige
  saldo omitido (nunca 0, `null` ou outro valor). `custo ≤ orçamento` (estrito) vale só com orçamento.
  Sem orçamento, custo estimado (soma das atividades) e média por dia seguem validados.
- **Ritmo**: ausente ou `tranquilo`/`equilibrado`/`intenso`; qualquer outro valor (inclusive `null`) é inválido.
- **Equivalência** (substituição com confirmação): compara também o ritmo e a ausência de orçamento;
  **ausente só equivale a ausente**, nunca a um valor explícito (nem a "intenso"). Consequência aceita:
  planejamentos que geram o mesmo roteiro, mas diferem na presença de ritmo, coexistem como registros
  distintos (sem sobrescrita silenciosa).
- **Impressão digital** (apenas nome de arquivo): inalterada para planejamentos legados; ritmo e
  "sem-orcamento" entram só quando existem.
- **Legados**: registros anteriores continuam válidos e byte a byte iguais; a leitura nunca grava.
- **Preservados**: IDs, Web Locks, `expectedRaw`, confirmação de substituição, releitura após gravação,
  quarentena (registros v2 inválidos tornam a coleção corrompida; a recuperação guarda o bruto) e
  recuperação explícita.

**Ainda NÃO feito**: a **geração** continua exigindo orçamento (motor e validação recusam entrada sem
orçamento — M2.5); **importação/exportação** seguem na versão 1 (M2.4); o ritmo não é aplicado nem gravado
pelo adaptador (M3). Portanto o esquema v2 **não** está totalmente implementado.

**Riscos registrados**: (1) **downgrade** — um app anterior que leia registro sem orçamento tratará a coleção
como corrompida e bloqueará escritas (sem apagar; a recuperação guarda o bruto na quarentena), como previsto
no M2.1; (2) o validador agora aceita registros sem orçamento, mas nenhum fluxo da interface os cria ainda.

## D42 — Esquema v2: exportação e importação JSON v2 (M2.4) — parcial

**Decisão**: o arquivo exportado passa a `schemaVersion: 2`; a importação aceita as versões **1 e 2**.
- **Orçamento ausente** (v2): omitem-se `resumo.orcamentoInformado`, `resumoFinanceiro.orcamentoInformado` e
  `resumoFinanceiro.saldoNaoAlocado` (nunca `null`, 0 ou outro valor); `custoEstimadoAtividades` e
  `custoMedioAtividadesPorDia` permanecem. Com orçamento, valores, ordem das chaves e consistência são os de antes
  (inclusive a precisão decimal, ex.: 333,33).
- **Ritmo**: `resumo.ritmo` (`tranquilo`/`equilibrado`/`intenso`) só aparece quando o roteiro tem ritmo válido; um
  ritmo inválido em memória não é exportado.
- **Importação v1**: inalterada. Orçamento (nos dois resumos) e saldo continuam **obrigatórios**; a ausência nunca é
  reinterpretada como opcional (um arquivo sem orçamento rotulado como v1 é rejeitado); `ritmo` é ignorado.
- **Importação v2**: aceita orçamento ausente **somente** quando ambos os resumos o omitem e o saldo também está
  ausente. Rejeita: orçamento em apenas um resumo ou divergente (`validation-failed`), saldo sem orçamento
  (`validation-failed`), orçamento sem saldo ou valor presente não numérico/`null` (`invalid-structure`),
  orçamento ≤ 0 e custo acima do orçamento (`validation-failed`) e ritmo desconhecido ou `null`
  (`invalid-structure`). Custo e média continuam validados contra as atividades mesmo sem orçamento.
- **Preservados**: limite de 256 KB, leitura só de propriedades próprias, descarte de campos extras e proteção
  contra poluição de protótipo, reconstrução das atividades pelo catálogo e rejeição de divergências, códigos de
  erro existentes e confirmação de substituição. A mensagem de versão passa a dizer "versões 1 e 2"; qualquer
  outra versão (3, 0, texto, nulo, ausente) dá `unsupported-version`. A leitura continua delegando ao validador do
  armazenamento (D41).

**Ainda NÃO feito**: a **geração sem orçamento** (M2.5) e a aplicação do **ritmo** no motor (M3). O esquema v2 não
está totalmente implementado.

**Riscos conhecidos**: (1) **downgrade** — um app anterior recusa arquivos v2 com `unsupported-version` (seguro) e,
se ler do armazenamento um registro sem orçamento, trata a coleção como corrompida e bloqueia escritas, sem apagar
dados (a recuperação guarda o bruto na quarentena); (2) arquivos exportados agora **só** abrem em versões que
conheçam a v2.

## D43 — Esquema v2: geração sem orçamento e integração financeira (M2.5)

**Decisão**: o orçamento passa a ser realmente opcional na geração.
- **Motor**: `budget` ausente (propriedade omitida) = **sem teto financeiro informado**. Nenhuma atividade elegível
  é descartada por custo; não há valor fictício nem `Infinity`; nenhum aviso de orçamento (limite ou insuficiência)
  é emitido. Continuam calculados `estimatedActivitiesCost` e `averageCostPerDay`; `unallocatedBudget` é omitido
  (nunca 0). Orçamento **presente** deve ser finito e > 0; `null`, 0, negativo, `NaN`, `Infinity` ou texto são
  recusados pelo motor com a mensagem "O orçamento informado é inválido…" (antes, o motor não validava esse caso;
  a validação de entrada já o impedia). Sem orçamento, o resultado é idêntico ao de um orçamento maior que o custo
  de todas as atividades, exceto pela ausência do saldo.
- **Com orçamento, nada mudou**: seleção, ordem, custos, saldo, avisos e mensagens são idênticos. Comprovado por 432
  cenários (3 destinos × 3 estilos × 4 durações × 3 conjuntos de interesses × 4 orçamentos) gravados **antes** da
  alteração (`tests/fixtures/goldenItineraries.json`, resumos djb2 do resultado completo).
- **Adaptador** (`planningAdapter`): "Ainda não defini" ou campo vazio ⇒ `budget` omitido; valor válido ⇒
  conversão por pessoa em centavos (como antes); texto inválido ou valor pequeno demais para dividir ⇒ não gera,
  com atalho para a etapa 6. O ritmo **não** é repassado ao motor (M3). `validatePlanningInput` aceita a ausência.
- **Interface**: a revisão permite gerar sem orçamento ("Orçamento não informado", sem saldo, texto "o roteiro não
  tem teto de custo"); o resultado, o resumo financeiro e a pré-visualização da importação mostram "Orçamento não
  informado" e ocultam o saldo; custo estimado e média por dia permanecem; nenhuma expressão de "orçamento
  ilimitado". A frase de gastos não contemplados deixa de citar o saldo quando ele não existe.
- **Compatibilidade v1/v2**: inalterada em relação ao D41/D42 (armazenamento e JSON); roteiros antigos continuam
  apresentáveis com orçamento e saldo.

**Limitações restantes**: ritmo não aplicado nem gravado (M3); viajantes, transporte, perfil e acessibilidade não
influenciam o roteiro; sem orçamento o roteiro tende a incluir mais atividades (todas as elegíveis que couberem),
ainda limitado pelo catálogo (4 a 10 atividades por estilo) e pela agenda; hospedagem, alimentação e transporte não
são calculados; risco de downgrade (D41/D42) agora **alcançável** pela interface, pois roteiros sem orçamento passam a
ser criados.

**Pendências do M3**: aplicar o ritmo como limite de atividades por dia, passar `pace` do adaptador ao motor e gravá-lo
no roteiro (com aviso das atividades deixadas de fora pelo ritmo), mantendo roteiros sem ritmo como "sem limite".

## D44 — Esquema v2 concluído e validado de forma integrada (M2.6)

**Estado**: o esquema v2 (orçamento, saldo e ritmo opcionais) está **concluído e validado** nas camadas de contrato
(D40), persistência (D41), JSON (D42) e geração/interface (D43). O **ritmo** existe no esquema, mas **ainda não é
aplicado pelo motor nem gravado pelo fluxo** (M3).

**Validação integrada** (2026-10-12): 801 testes em 43 arquivos (3 execuções completas sem falha); Chromium 22/22 (fluxo
completo com orçamento, salvar, abrir, exportar, excluir, importar), 18/18 (sem orçamento, v1 e v2) e 15/15 (estados
inválidos); 432 cenários de regressão financeira verificados também contra o motor do commit `d63812f` (anterior ao
esquema v2): 432/432 idênticos.

**Compatibilidade v1/v2**: registros e arquivos v1 permanecem válidos e idênticos; a leitura nunca regrava; arquivos v2
só abrem em versões que conheçam a v2.

**Política de downgrade** (testada em ambiente isolado, com o serviço de armazenamento do commit `d63812f` sobre um
`localStorage` em memória; o armazenamento real do usuário não foi tocado):
- Registro v2 **com orçamento** (inclusive com ritmo): lido normalmente pela versão antiga (o ritmo é ignorado).
- Registro v2 **sem orçamento**: a versão antiga o classifica como **inválido** e a coleção como **corrompida**; as
  gravações antigas ficam **bloqueadas**; os bytes originais permanecem intactos; os registros válidos aparecem só para
  consulta.
- **Recuperação explícita** na versão antiga: o conteúdo bruto original (incluindo o roteiro sem orçamento) é copiado
  **byte a byte** para a quarentena; só os registros válidos continuam ativos; nada é apagado em silêncio.
- Ao voltar à versão nova, a coleção recuperada é íntegra, a quarentena continua ocupada e a restauração só é permitida
  sem roteiros ativos (nada é sobrescrito).
- Um arquivo v2 (`schemaVersion: 2`) é recusado pela versão antiga com `unsupported-version`.
**Orientação**: antes de fazer rollback do aplicativo, exporte os roteiros sem orçamento; depois do rollback, use a
recuperação explícita se a coleção aparecer como corrompida.

**Limitações atuais**: ritmo não aplicado; viajantes, transporte, perfil e acessibilidade não influenciam nem são
persistidos; catálogo de 4 a 10 atividades por estilo e destino; sem mapas nem imagens de atrações; apenas Chromium.

**Próxima fase (M3)**: aplicar o ritmo como limite de atividades por dia, passar `pace` do adaptador ao motor e gravá-lo
no roteiro, com aviso das atividades deixadas de fora (roteiros sem ritmo continuam "sem limite").

## D45 — Ritmo da viagem aplicado pelo motor (M3)

**Decisão**: o ritmo passa a limitar a quantidade de atividades **por dia** (`PACE_MAX_ACTIVITIES_PER_DAY`):
**Tranquilo 2**, **Equilibrado 3**, **Intenso sem limite adicional**. O ritmo **não** indica esforço físico nem
acessibilidade (textos da interface e mensagens evitam essa promessa).
- **Distribuição antes do descarte**: a atividade tenta primeiro os dias abaixo do limite (menos carregado primeiro,
  como antes). Só é descartada "pelo ritmo" se não coube em nenhum desses dias **mas caberia** (duração, período e
  ausência de sobreposição) em um dia que já atingiu o limite — uma simulação sem alterar a agenda (`fitsInDay`). Se
  não caberia nem sem o limite, continua sendo "não coube na agenda", como antes.
- **Aviso**: "N atividade(s) compatível(is) ficou/ficaram de fora pelo ritmo X (máximo de K atividades por dia)…". A
  contagem fecha: excluídas pelo ritmo = (colocadas + não couberam no Intenso) − (colocadas + não couberam no ritmo).
- **Sem ritmo**: comportamento exatamente anterior (432 cenários históricos idênticos; gerados antes do esquema v2 e
  conferidos contra o motor `d63812f`). **Intenso** produz o mesmo resultado que sem ritmo (só o campo `pace` é gravado).
- **Persistência/JSON** (esquema v2 inalterado): o validador compartilhado por armazenamento e importação passa a
  rejeitar roteiro cujo dia excede o limite do ritmo declarado (arquivo adulterado); roteiros sem ritmo não são
  limitados. `resumo.ritmo` continua opcional; a deduplicação já considerava o ritmo (D41).
- **Fluxo**: o adaptador envia o ritmo escolhido (padrão do fluxo: Equilibrado, que agora **fica gravado** em todo roteiro
  gerado pelo fluxo). O resultado e a pré-visualização da importação mostram o ritmo; roteiros antigos não mostram nenhum.
- **Orçamento**: regras do M2 inalteradas; o orçamento é aplicado na seleção e o ritmo na distribuição. Atividades
  excluídas pelo ritmo continuam consumindo o orçamento da seleção (como as que não couberam na agenda), o que apenas
  aumenta o saldo exibido.

**Limitações do catálogo**: 10 atividades por destino (4 a 10 por estilo). Com 1 a 3 dias o ritmo muda o resultado
(ex.: Lisboa, econômico, 1 dia: Intenso 4, Equilibrado 3, Tranquilo 2); com 5 ou mais dias o limite quase nunca é
atingido e os dias vazios continuam sendo causados pela falta de atividades, não pelo ritmo. Nenhuma atração é repetida
para preencher dias.

**Riscos**: roteiros salvos antes do M3 não têm ritmo (válidos, sem limite); a regra de limite no validador torna inválido
qualquer roteiro com ritmo e mais atividades por dia que o limite (impossível pelo gerador).

## D46 — Padrão único de cards selecionáveis (M4.2)

**Decisão**: todos os cards de seleção usam a mesma linguagem visual do `SelectableCard`: fundo azul-claro (`brand-100`),
borda azul de 2 px, **check no canto superior direito** (decorativo, `aria-hidden`), sombra de destaque e anel de foco
visível independente da seleção; não selecionado: fundo branco e borda neutra.
- **Variantes** (`src/components/ui/SelectableCard.tsx`): `SelectableCard` (botão com `aria-pressed`; `density="default"`
  mantida **idêntica** à anterior, `density="compact"` nova, ~56 px de altura mínima, ícone de 32 px, texto de 14 px,
  check de 20 px; a descrição aparece visualmente a partir de 640 px e permanece disponível a leitores de tela) e
  `SelectableRadioCard` (nova: `<input type="radio">` nativo com o mesmo visual, para escolha única com setas).
- **Migrações**: o **Perfil da viagem** (Viajantes) agora usa `SelectableCard` compacto em grade 2×2 (4 colunas no desktop),
  com seleção única, remoção ao clicar de novo e preservação do estado; os **modos da etapa Datas** usam
  `SelectableRadioCard` (semântica de radio, navegação por setas). Corrigiu a inconsistência apontada no M4.1: esses cards
  não tinham o check e tinham destaque mais fraco (`brand-50`).
- **Não alterados**: cards de Transporte, Interesses, Orçamento (variante padrão), a Revisão, os filtros e chips; nenhuma
  compactação adicional das etapas (M4.3 em diante).

**Riscos**: o nome acessível dos botões de perfil continua começando pelo rótulo e agora inclui a descrição (já incluía);
o radio de Datas mantém nomes e ordem. O check é o mesmo `data-testid="selected-check"`, então contagens de check em
testes passam a incluir Perfil e Datas.

## D47 — Compactação das etapas 1 a 6 e barra de navegação fixa no celular (M4.3)

**Decisão**: reduzir a altura e as interações das etapas 1 a 6 sem alterar nenhuma regra de negócio, e manter a navegação sempre
acessível no celular. A Revisão (etapa 7), o motor, o armazenamento e o JSON **não** foram alterados.
- **Componentes novos**: `Disclosure` (seção recolhível: botão com `aria-expanded`/`aria-controls`, conteúdo montado com
  `hidden`, então **nada é apagado ao recolher**; abre sozinho quando já há dados) e `stackedOnMobile` no `SelectableCard`
  compacto (ícone sobre o rótulo abaixo de 640 px, para grades de 3 colunas sem estourar a largura).
- **Destino**: busca sempre visível; filtros em "Filtros" (recolhido; abre se houver filtro ativo); `DestinationCard compact` (foto
  4:1 no celular e 2:1 a partir de 640 px, `overflow-hidden` para a foto respeitar a proporção, descrição em até 2 linhas); os três
  destinos continuam acessíveis.
- **Viajantes**: contadores sempre visíveis; "Faixas etárias" e "Acessibilidade e mobilidade" recolhíveis (abrem sozinhos com dados,
  resumo "N marcada(s)"); perfil compacto (M4.2).
- **Transporte**: cards compactos em 2 colunas no celular (3 a partir de 640 px; 5 na chegada em telas largas), nomes acessíveis
  iguais; origem opcional em "Informar a cidade de origem (opcional)" (abre com dados; mostra a cidade no resumo do botão).
- **Interesses**: interesses e ritmo em cards compactos; múltipla escolha, ao menos um interesse e ritmo único preservados.
- **Orçamento**: estilo em 3 cards compactos; orçamento opcional em **controle segmentado de rádios** "Não informar" (padrão) /
  "Por pessoa" / "Valor total" (um clique define modalidade); o campo monetário só aparece com valor; o texto digitado é
  preservado ao alternar; cálculos em centavos e regras financeiras inalterados (substitui os botões "Informar um valor"/"Ainda
  não defini" e a escolha de modalidade em duas etapas).
- **Resumo**: nas etapas 1 a 6, uma única linha (`line-clamp-2`, texto completo em `title` e no DOM, mesmos rótulos); a Revisão mantém
  o resumo anterior (será tratado no M4.7).
- **Barra Voltar/Continuar**: **uma** barra (sem botões duplicados) fixa na base até 768 px (`max-[769px]`, pois o `max-` do
  Tailwind v4 é exclusivo), com botões ≥ 44 px, a dica de validação **dentro** da barra, espaço reservado no conteúdo e na
  página (`pb-24`/`pb-20`) e `scroll-padding-bottom` para o foco nunca ficar atrás dela. Enquanto um campo de texto/número/data
  está em foco (teclado virtual) a barra deixa de ser fixa; a volta à posição fixa é **adiada ~400 ms após o blur** — achado do
  Chromium: sem o atraso, tocar em "Continuar" com um campo focado movia o botão entre o toque e o clique e o clique se perdia.
- **Testes**: botões "Filtros", "Faixas etárias…", "Acessibilidade e mobilidade…" e "Informar a cidade de origem…" precisam ser abertos
  antes de usar o conteúdo; o orçamento passou a usar rádios (`/^Por pessoa/`, `/^Valor total/`, `/^Não informar/`).

**Medidas (375×812, altura do bloco da etapa, antes → depois)**: Destino 2.099 → 1.287 px; Datas 690 → 666; Viajantes 1.406 → 882;
Transporte 1.698 → 997; Interesses 1.440 → 798; Orçamento 950 → 572 (com valor: 1.440 → 782); resumo de 58–198 px → 38–58 px;
Revisão (inalterada) 2.199. "Continuar" visível sem rolagem em todas as etapas 1–6 até 768 px.

**Riscos**: a descrição dos cards compactos só aparece a partir de 640 px (continua no nome acessível); o recolhimento exige um
clique extra para quem quer preencher os opcionais; só Chromium.
