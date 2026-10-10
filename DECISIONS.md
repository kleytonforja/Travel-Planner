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
