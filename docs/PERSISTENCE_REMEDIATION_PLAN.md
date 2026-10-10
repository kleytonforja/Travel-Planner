# Plano de remediação da persistência — Travel Planner

## Registro da especificação

Este documento registra integralmente o plano técnico aprovado para corrigir TP-02, TP-03, TP-04 e TP-05, elaborado após a auditoria independente de regressão e integridade de dados. Sua fonte é exclusivamente o plano apresentado na conversa anterior. Não constitui implementação das correções nem resultado de novos testes.

A implementação depende de autorização específica. As ambiguidades do plano original estão registradas na seção 15, sem resolução adicional.

Objetivos:

1. Impedir perda silenciosa de roteiros.
2. Impedir sobrescrita por colisão de hash.
3. Validar integralmente os dados persistidos.
4. Garantir tratamento seguro de falhas.
5. Preservar compatibilidade com registros válidos.
6. Evitar mudanças desnecessárias na arquitetura.

## 1. Causas raízes identificadas

Os problemas têm cinco causas relacionadas:

- **Identidade confundida com equivalência:** o hash continua autorizando substituições entre planejamentos diferentes.
- **Leituras inconsistentes:** uma operação lê duas vezes e ignora a falha da segunda leitura.
- **Preservação tratada como tentativa opcional:** a quarentena pode falhar, mas a operação continua.
- **Atomicidade presumida para uma sequência:** setItem substitui uma chave, mas a sequência backup → remoção → gravação não constitui uma transação.
- **Resultados e validação incompletos:** há sucesso sem confirmação, mensagens de preservação sem evidência e inconsistências semânticas aceitas.

A correção deve tratar essas causas em conjunto. Corrigir somente as mensagens ou trocar o algoritmo de hash não resolve a perda de dados.

## 2. Arquitetura de persistência proposta

A solução mantém React, LocalStorage, as duas chaves existentes e o formato v1 dos registros. A mudança concentra-se no contrato de persistência: nenhuma falha de leitura vira lista vazia, nenhuma equivalência depende de hash e nenhuma recuperação remove a chave principal antes da gravação.

O plano inclui apenas as correções e os controles de recuperação necessários para impedir perda de dados.

Chaves mantidas:

- Principal: travel-planner:saved-itineraries:v1.
- Quarentena: travel-planner:saved-itineraries:v1:quarentena.

Diretrizes:

- Manter o array v1 e os campos atuais.
- Concentrar os contratos de identidade, equivalência, validação, leitura, mutação e quarentena no serviço de persistência existente.
- Executar interpretação, construção, validação e serialização em memória antes de escrever.
- Usar um único setItem na chave principal por mutação.
- Confirmar a gravação por leitura posterior.
- Coordenar as mutações da versão corrigida mediante Web Locks.
- Não introduzir backend, novo armazenamento ou framework de persistência.
- Não alterar funcionalmente o gerador, o catálogo, as dependências ou o formato da exportação normal do roteiro.

## 3. Contratos de leitura, gravação e exclusão

### 3.1. Contrato de leitura

A leitura retorna o conteúdo bruto observado, os registros utilizáveis e os motivos de rejeição.

| Estado | Definição | Operações permitidas |
|---|---|---|
| empty | Chave ausente ou array vazio válido | Salvar |
| ok | Todos os registros válidos e IDs únicos | Salvar, substituir com confirmação e excluir |
| corrupted | JSON inválido, formato desconhecido, registros inválidos ou IDs duplicados | Consultar registros seguros, exportar cópia e iniciar recuperação explícita |
| unavailable | Falha ao acessar o armazenamento | Nenhuma mutação; permitir tentar novamente |

Uma string vazia armazenada é conteúdo corrompido, não ausência de dados. Uma coleção parcialmente válida é corrupted, mesmo que alguns roteiros possam ser exibidos.

A leitura e a inicialização não migram, regravam, removem nem corrigem automaticamente dados armazenados.

### 3.2. Resultados das mutações

As mutações terão três resultados distintos:

| Resultado | Significado |
|---|---|
| Sucesso confirmado | A leitura posterior coincide exatamente com o conteúdo pretendido |
| Falha sem alteração da chave principal | A operação foi interrompida antes da escrita ou setItem falhou |
| Resultado incerto | A escrita retornou, mas a leitura de confirmação falhou ou encontrou outro conteúdo |

O resultado também identifica quando é necessária confirmação, quando há conflito de conteúdo e quando o backup foi criado. Uma falha pode deixar uma cópia adicional na quarentena; isso não será descrito como ausência absoluta de alterações.

### 3.3. Fluxo obrigatório de gravação

1. Adquirir a exclusão de escrita descrita na seção 8.
2. Ler a chave principal uma vez e interpretar esse conteúdo.
3. Compará-lo com o conteúdo esperado, quando a ação depende de uma seleção ou confirmação anterior.
4. Interromper em caso de indisponibilidade, corrupção não resolvida ou ação desatualizada.
5. Construir o próximo estado em memória.
6. Validar e serializar integralmente o próximo estado.
7. Executar um único setItem na chave principal.
8. Ler a chave para confirmar igualdade exata com o texto gravado.
9. Retornar o resultado correspondente.

A leitura do passo 8 confirma a gravação; ela não reconstrói uma segunda lista usada para decidir a escrita.

É proibido executar removeItem na chave principal nesse fluxo.

### 3.4. Contrato de salvamento

Salvar aplica as regras de identificação e equivalência da seção 4. Escritas normais são bloqueadas quando a coleção está corrompida; o salvamento não aciona limpeza automática nem quarentena como efeito colateral para permitir a escrita.

Uma substituição somente pode ocorrer após confirmação do alvo e revalidação do conteúdo observado. Registros não selecionados devem ser preservados.

### 3.5. Contrato de exclusão

A exclusão depende do identificador selecionado e do conteúdo bruto observado. O conteúdo precisa ser revalidado antes da mutação. A coleção deve estar válida e ter IDs únicos.

Excluir o último roteiro grava um array vazio, []. Não remove a chave principal.

A exclusão não aciona limpeza automática de corrupção. Grupos com IDs duplicados não recebem ações individuais de exclusão.

### 3.6. Resultado incerto

Em resultado incerto, não executar rollback automático nem repetir a escrita. A interface mostra:

> Não foi possível confirmar a operação. Recarregue os roteiros antes de tentar novamente.

Só a nova leitura permite decidir o próximo passo.

## 4. Identificação e equivalência de roteiros

### 4.1. Identidade do registro

- Registros existentes conservam seus IDs, inclusive IDs legados derivados de hash.
- Registros novos usam crypto.randomUUID().
- Todo candidato a ID é confrontado com os IDs já existentes.
- O limite é de 10 tentativas. Esgotamento ou indisponibilidade da geração retorna erro, sem escrita.
- Remover o fallback baseado em horário e Math.random().
- O hash deixa de participar de qualquer decisão de persistência.
- Seu eventual uso no nome de um arquivo exportado não concede identidade nem autorização para substituição.

### 4.2. Equivalência de planejamentos

Dois planejamentos são equivalentes somente quando coincidem:

1. destinationId.
2. Quantidade de dias.
3. Estilo.
4. Orçamento numérico, sem arredondamento.
5. Conjunto de interesses, independentemente da ordem.

A comparação será direta entre campos. A normalização dos interesses será feita apenas para comparação, sem modificar registros antigos.

### 4.3. Critérios de substituição

| Situação ao salvar | Comportamento |
|---|---|
| Nenhum planejamento equivalente | Acrescentar registro com ID novo |
| Exatamente um equivalente | Solicitar confirmação de substituição |
| Substituição confirmada | Preservar o ID do alvo e substituir somente esse registro |
| Mais de um equivalente | Bloquear substituição automática; informar ambiguidade |
| Conteúdo mudou desde a confirmação | Cancelar a operação e exigir nova análise |

A confirmação informa destino, dias e data do registro que será substituído. Ela fica vinculada ao ID e ao conteúdo bruto observado, não apenas ao fingerprint.

### 4.4. IDs duplicados

A coleção será considerada corrompida. Nenhum integrante do grupo duplicado receberá uma ação individual de exclusão.

Na recuperação explícita, registros individualmente válidos serão preservados; todos os integrantes de grupos duplicados receberão IDs novos e distintos. Essa alteração será informada antes da confirmação.

## 5. Validação estrutural e semântica

A mesma validação será usada na leitura e antes de gravar um novo estado.

| Elemento | Regra |
|---|---|
| ID | String não vazia nem composta apenas de espaços; unicidade verificada na coleção |
| Data | ISO UTC no formato já aceito, com segundos e fração opcional de 1–3 dígitos |
| Calendário | Comparar os componentes originais com os componentes UTC resultantes; rejeitar normalizações como 30/02 e 24:00 |
| Planejamento | Destino conhecido, dias inteiros de 1 a 14, estilo conhecido, interesses conhecidos e orçamento finito positivo |
| Dias | Quantidade exata; numeração sequencial de 1 até input.days; atividades em arrays |
| Atividades | Campos obrigatórios completos; textos não vazios; categorias, estilos e períodos conhecidos |
| Identidade das atividades | Não repetir a mesma atividade no roteiro |
| Compatibilidade | Atividade atende ao estilo e a pelo menos um interesse do planejamento |
| Duração | Finita e positiva; coerente com a diferença entre início e término |
| Horários | Minutos inteiros, início menor que término, dentro do dia e sem sobreposição |
| Janelas | Respeitar SLOT_WINDOWS; manter a exceção existente para passeio longo iniciado às 09:00 |
| Avisos | Array de strings |
| Valores financeiros | Todos os valores e somas intermediárias finitos; custos, saldo e média não negativos |

As três relações financeiras obrigatórias serão:

- Custo estimado = soma das atividades agendadas.
- Saldo = orçamento − custo estimado.
- Média = custo estimado ÷ quantidade de dias.

Usar tolerância absoluta de 1e-6, sem multiplicá-la pelo tamanho dos valores. Rejeitar custo superior ao orçamento. A tolerância não autoriza saldo negativo nem transforma valores não finitos em válidos.

Não converter o formato para centavos nem arredondar valores armazenados nesta correção.

Não comparar nomes, descrições, preços ou durações históricos com os valores atuais do catálogo: isso invalidaria registros antigos legítimos.

## 6. Estratégia de quarentena e recuperação

### 6.1. Preservação não destrutiva

A quarentena guarda o texto original completo, sem filtrar ou reserializar registros.

| Estado da quarentena | Decisão |
|---|---|
| Ausente | Gravar a cópia e confirmar sua leitura |
| Conteúdo exatamente igual ao que será preservado | Reutilizar a cópia |
| Conteúdo diferente, inclusive string vazia | Bloquear a recuperação; preservar ambas as chaves |
| Leitura, escrita ou confirmação falhou | Interromper; não escrever na chave principal |

Salvar e excluir normalmente não acionam limpeza automática de corrupção.

### 6.2. Recuperação explícita da chave principal

A ação “Preservar cópia e recuperar registros válidos” deverá:

1. Apresentar quantos registros serão recuperados, quantos continuarão apenas no backup e quantos IDs precisarão ser corrigidos.
2. Capturar o conteúdo bruto exibido.
3. Solicitar confirmação.
4. Revalidar o conteúdo e o estado corrompido.
5. Criar ou confirmar o backup.
6. Gravar a coleção recuperada diretamente sobre a chave principal.
7. Confirmar a gravação.

Se não houver registros recuperáveis, a confirmação deve dizer claramente que a lista ativa ficará vazia e o conteúdo original permanecerá na quarentena.

Se a criação ou a confirmação do backup falhar, interromper a recuperação e preservar a chave principal.

### 6.3. Quarentena ocupada e descarte definitivo

Oferecer download da cópia existente e descarte definitivo separado.

O descarte exige confirmação explícita vinculada ao conteúdo da própria quarentena. Não alterar a chave principal nessa operação.

### 6.4. Exportação de recuperação

O download de recuperação terá um envelope JSON contendo identificador do formato, versão, chave de origem e a string raw.

Não será confundido com o JSON de exportação normal do roteiro.

Disparar um download não prova que o usuário guardou o arquivo; a interface não poderá afirmar isso.

### 6.5. Restauração da quarentena

Permitida mediante confirmação somente quando a chave principal estiver vazia.

Restaurar os registros individualmente válidos, corrigindo IDs duplicados conforme a seção 4. Manter a quarentena após a restauração.

Se já existirem roteiros ativos, bloquear a restauração e permitir exportar a cópia.

Mesclagem de arquivos e recuperação geral por importação ficam fora deste escopo.

### 6.6. Proteção contra ações desatualizadas

Recuperação, exclusão, substituição, restauração e descarte precisam conferir o conteúdo esperado.

Se o armazenamento mudou, nenhuma autorização anterior será reutilizada.

## 7. Compatibilidade com registros históricos

- Manter o array v1 e os campos atuais.
- Não migrar ou regravar dados na inicialização.
- Preservar IDs e savedAt de registros recuperados, exceto os IDs duplicados explicitamente corrigidos.
- Preservar dados históricos das atividades.
- Campos adicionais desconhecidos não serão removidos de registros mantidos.
- Formatos desconhecidos não serão interpretados por tentativa: preservar e informar incompatibilidade.

Roteiros antigos sobrepostos continuarão fora da lista operacional. Seu conteúdo será preservado e exportável; não serão reagendados, recalculados ou descartados automaticamente.

A amostra histórica da auditoria serve como referência: 64.851 registros sem sobreposição aceitos e 837 sobrepostos identificados.

O endurecimento não poderá introduzir rejeições adicionais nessa amostra sem uma inconsistência demonstrável e registrada.

Esses números são evidências históricas citadas pelo plano; não representam testes executados durante a documentação.

## 8. Tratamento de falhas e concorrência

### 8.1. Falha de leitura

A indisponibilidade bloqueia a mutação. Nenhuma falha de leitura será convertida em armazenamento vazio ou em uma lista vazia usada para gravar.

A interface permite tentar novamente e não informa que os registros inexistem quando eles apenas não puderam ser lidos.

### 8.2. Quota e falhas de escrita

- Falha de setItem na chave principal retorna falha sem alteração dessa chave.
- Falha ao ler, criar ou confirmar a quarentena impede a escrita principal.
- Uma cópia adicional já criada na quarentena pode permanecer após falha da escrita principal.
- Não limpar automaticamente essa cópia nem remover a chave principal.
- As mensagens precisam distinguir preservação comprovada de resultado incerto.

### 8.3. Confirmação real de sucesso

Somente retornar sucesso quando a leitura de confirmação coincidir exatamente com o texto pretendido.

Se a escrita retornar, mas a confirmação falhar ou encontrar outro conteúdo, retornar resultado incerto. Não repetir a escrita nem restaurar um snapshot antigo automaticamente.

### 8.4. Coordenação entre abas

Todas as mutações usarão a API nativa Web Locks, com um único lock exclusivo chamado travel-planner:storage:v1.

Isso torna os métodos de mutação assíncronos.

A confirmação do usuário acontece fora do lock; ao confirmar, o conteúdo é revalidado dentro dele.

Na ausência dessa API ou se sua aquisição falhar, manter leitura/exportação e bloquear mutações com mensagem explicativa. Não criar um fallback de escrita sem coordenação.

Abas executando versões antigas continuam sendo uma limitação explícita.

### 8.5. Interface

- Adaptar os consumidores aos resultados e ao caráter assíncrono das mutações.
- Exibir mensagens compatíveis com o resultado efetivo.
- Não informar salvamento confirmado antes da leitura de confirmação.
- Usar alertas acessíveis para erros e resultados incertos.
- Vincular confirmações ao conteúdo observado.
- Permitir nova tentativa segura após nova leitura.
- Bloquear ações incompatíveis com o estado do armazenamento.

## 9. Sequência de implementação

Cada etapa começa pelo teste que reproduz o defeito, confirma sua falha e termina com a verificação da correção.

| Prioridade | Etapa | Entrega verificável |
|---|---|---|
| P0 | Fixar fixtures e testes adversos da auditoria | Colisão real, leitura intermitente e falhas de quarentena reproduzidas |
| P0 | Corrigir identidade e equivalência | Planejamentos distintos coexistem; substituição exige alvo confirmado |
| P0 | Corrigir validação e classificação da coleção | Dados inconsistentes identificados sem qualquer escrita |
| P0 | Unificar mutações e coordenação | Uma leitura de decisão, uma escrita principal e resultado confirmado/incerto |
| P0 | Corrigir quarentena e recuperação | Falhas e backup ocupado bloqueiam a alteração principal |
| P1 | Adaptar interface e exportação de recuperação | Mensagens corretas, confirmações vinculadas ao conteúdo e nova tentativa segura |
| P1 | Validar compatibilidade e atualizar documentação | Regressões aprovadas e garantias documentadas sem exagero |

Não integrar uma etapa intermediária em uso normal enquanto seus consumidores estiverem com contratos incompatíveis.

## 10. Testes de regressão obrigatórios

| Grupo | Cenário | Resultado obrigatório |
|---|---|---|
| TP-03 | Par real com fingerprint roteiro-2cd27b6e, identificado na auditoria | Dois registros preservados |
| TP-03 | Interesses em ordem diferente | Equivalência reconhecida |
| TP-03 | Mesmo planejamento sem confirmação | Nenhuma substituição |
| TP-03 | Confirmação válida de um alvo | Somente o alvo substituído; ID preservado |
| TP-03 | Mais de um equivalente | Nenhuma escolha automática |
| TP-03 | UUID repetido e esgotamento das 10 tentativas | Gerar alternativa ou falhar sem escrita |
| TP-03 | IDs duplicados persistidos | Exclusão individual bloqueada; recuperação preserva ambos |
| TP-02 | 30/02, 31/04, ano bissexto e horário 24:00 | Datas impossíveis rejeitadas; datas reais aceitas |
| TP-02 | Dias faltantes, duplicados, vazios ou fora de sequência | Rejeição com motivo |
| TP-02 | Atividade incompleta, repetida ou incompatível | Rejeição com motivo |
| TP-02 | Sobreposição; intervalos que apenas se encostam | Rejeitar sobreposição; aceitar contato permitido |
| TP-02 | Saldo −169 com orçamento 1 e custo 170 | Rejeição |
| TP-02 | NaN, Infinity, overflow de soma e discrepância financeira | Rejeição |
| TP-02 | Média periódica e diferenças inferiores à tolerância | Aceitação sem arredondar o armazenamento |
| TP-04 | Falha da leitura inicial | Zero chamadas de escrita |
| TP-04 | Quota ao salvar, substituir ou excluir | Chave principal idêntica ao estado anterior |
| TP-04 | Escrita bem-sucedida, confirmação indisponível | Resultado incerto, sem repetição nem rollback |
| TP-04 | Leituras e escritas falham em tentativas consecutivas | Nenhuma conversão de falha em lista vazia |
| TP-04 | Duas operações concorrentes da versão corrigida | Execução serializada, sem atualização perdida |
| TP-04 | Web Locks indisponível | Mutações bloqueadas; leitura/exportação utilizáveis |
| TP-05 | JSON inválido, string vazia e formato desconhecido | Preservação integral |
| TP-05 | Coleção parcialmente válida | Escritas normais bloqueadas |
| TP-05 | Quota real: backup não cabe, substituição caberia | Operação bloqueada; original intacto |
| TP-05 | Backup existente diferente | Ambas as chaves intactas |
| TP-05 | Backup existente idêntico | Recuperação pode prosseguir |
| TP-05 | Backup confirmado, escrita principal falha | Original principal preservado; backup mantido |
| TP-05 | Falha ao remover a quarentena | Erro ou resultado incerto; nunca falso sucesso |
| Ação desatualizada | Corrupção corrigida entre exibição e confirmação | Cancelar descarte/recuperação |
| Recuperação | Restauração com chave principal não vazia | Bloqueio sem alterações |
| Compatibilidade | Fixtures reais anteriores às correções | Preservar registros válidos e identificar sobrepostos |
| Interface | Erro, confirmação, cancelamento e nova tentativa | Alertas acessíveis; estado visual compatível com o resultado |

Os testes devem comparar o conteúdo bruto das duas chaves antes e depois, não apenas contar registros retornados.

## 11. Os 12 critérios objetivos de aceite

A correção estará pronta para nova auditoria quando:

1. Todos os casos obrigatórios passarem.
2. A colisão real deixar de substituir registros.
3. Falhas prévias à gravação preservarem exatamente a chave principal.
4. Nenhuma falha de backup permitir escrita principal.
5. Nenhuma operação remover a chave principal antes de substituí-la.
6. Sucesso depender de confirmação de leitura; incerteza tiver estado e mensagem próprios.
7. Ações desatualizadas não modificarem nenhuma chave.
8. Registros históricos válidos permanecerem utilizáveis.
9. Registros incompatíveis permanecerem preservados e identificáveis.
10. A interface não prometer preservação, backup ou sucesso sem evidência.
11. npm run typecheck, npm run test:run, npm run lint e npm run build passarem.
12. Uma nova verificação independente não reproduzir os caminhos de perda desta auditoria.

## 12. Riscos explicitamente fora do escopo

- Limpeza do armazenamento pelo usuário, navegador, sistema operacional ou extensões.
- Durabilidade física após desligamento abrupto; leitura de confirmação não equivale a backup externo.
- Abas antigas ou outros scripts que ignorem o lock da versão corrigida.
- Reparo automático de horários sobrepostos ou formatos desconhecidos.
- Mesclagem/importação geral de arquivos de recuperação.
- Alterações futuras de catálogo que tornem um destino indisponível.
- Garantir que um download disparado foi efetivamente guardado pelo usuário.

## 13. Arquivos e responsabilidades na implementação futura

| Arquivo | Alteração planejada |
|---|---|
| src/services/itineraryStorage.ts | Identidade, equivalência, validação, estados, operações seguras, quarentena e contratos de resultado |
| src/pages/HomePage.tsx | Exclusão vinculada ao conteúdo observado, confirmação de recuperação/descarte e tratamento dos novos resultados |
| src/pages/ItineraryPage.tsx | Salvamento assíncrono, confirmação de substituição e resultado incerto |
| src/components/SavedItineraries.tsx | Bloqueio das ações incompatíveis com o estado do armazenamento |
| src/services/itineraryExport.ts | Download de cópia bruta para recuperação, separado da exportação normal do roteiro |
| src/types/index.ts | Corrigir a descrição de identidade; manter o formato persistido |
| src/tests/itineraryStorage.test.ts | Atualizar contratos e ampliar regressões |
| src/tests/itineraryExport.test.ts | Adaptar salvamento assíncrono e testar exportação de recuperação |
| Novos testes em src/tests/ | Cenários adversos e testes de interação de HomePage e ItineraryPage |
| Fixtures em src/tests/fixtures/ | Registros históricos válidos, sobrepostos, IDs duplicados e colisão real |
| DECISIONS.md, TASKS.md, PROJECT.md, ROADMAP.md | Registrar contratos, limitações e resultados efetivamente validados |

O gerador, o catálogo, as dependências e o formato da exportação normal permanecem fora das alterações funcionais. Não haverá backend, novo armazenamento ou framework de persistência.

A relação acima descreve alterações futuras. A tarefa de documentação deste plano autoriza apenas a criação deste arquivo.

## 14. Estratégia de rollback

- Registrar o estado local inicial antes da implementação, incluindo as alterações ainda não commitadas.
- Manter o esquema v1 para evitar uma migração inversa.
- Falhas anteriores à escrita principal exigem apenas interrupção; não precisam de escrita compensatória.
- Backup criado seguido de falha mantém as duas cópias. Não limpar automaticamente a quarentena.
- Resultado incerto exige releitura; restaurar um snapshot antigo automaticamente poderia apagar uma atualização legítima.
- Um rollback de código não poderá reativar os métodos antigos de escrita. Se necessário, voltar temporariamente com salvar/excluir/recuperar desabilitados e leitura/exportação disponíveis.
- Restauração de dados exige verificação do conteúdo atual e autorização específica.
- Não executar git reset, commits ou publicação como parte automática do plano.

## 15. Ambiguidades e detalhes não definidos no plano original

Os pontos abaixo não recebem uma solução nova neste documento. As garantias descritas nas seções anteriores permanecem registradas; onde o plano não especificou representação ou comportamento suficiente, a lacuna está explicitada.

1. **Assinaturas e tipos concretos dos contratos.** O plano define estados, resultados e informações retornadas, mas não fixa as assinaturas finais das funções, os nomes dos campos, os códigos de erro ou a representação da solicitação de confirmação. A implementação não deve tratar uma sugestão de nome neste documento como decisão adicional.

2. **Formato exato da exportação de recuperação.** O plano exige identificador do formato, versão, chave de origem e string raw, mas não fornece o valor literal do identificador, o número da versão ou os nomes dos campos além de raw.

3. **Listagem segura de grupos com IDs duplicados.** O plano bloqueia exclusão individual e determina novos IDs para todos os integrantes válidos durante recuperação explícita. Não define se esses integrantes aparecem antes da recuperação, nem a identidade visual usada para renderizá-los nessa situação.

4. **Registro individualmente válido durante recuperação.** O plano separa validação individual de unicidade na coleção, mas não especifica a estrutura do relatório que permite recuperar todos os integrantes válidos de um grupo com IDs duplicados sem expor ações individuais inseguras.

5. **Exclusão de ID ausente.** A exclusão exige coleção válida, ID selecionado e conteúdo observado. O plano não determina o resultado quando o ID informado não existe no snapshot válido e atualizado.

6. **Regras exatas da exceção de janelas e tolerância de duração.** O plano remete a SLOT_WINDOWS e à exceção existente para passeio longo iniciado às 09:00, sem repetir o limiar e todos os limites da exceção. A tolerância absoluta de 1e-6 foi explicitamente definida para relações financeiras; sua aplicação à comparação entre duração e intervalo de horários não foi especificada.

7. **Campos de texto e preservação de extensões.** O plano determina textos não vazios, proíbe ID composto apenas de espaços e exige preservar campos adicionais desconhecidos em registros mantidos. Não detalha o tratamento de texto composto apenas de espaços nos demais campos nem se as extensões desconhecidas do registro substituído são mantidas na substituição confirmada.

8. **Falhas de leitura da quarentena fora de uma mutação.** O plano determina bloqueio quando a leitura do backup falha durante recuperação. Não define a classificação ou a apresentação quando a chave principal é legível, mas a consulta independente da quarentena está indisponível.

9. **Adaptação exata dos testes de colisão e da amostra histórica.** O plano identifica o fingerprint roteiro-2cd27b6e e remete ao par real da auditoria, mas não transcreve os dois planejamentos completos. Também remete à amostra de 64.851 registros aceitos e 837 sobrepostos sem definir seu empacotamento como fixture ou procedimento executável. Esses valores de entrada não são inventados neste registro.

10. **Mecanismo de confirmação na interface.** O plano exige confirmação explícita, descrição do alvo e vínculo com o conteúdo observado. Não decide entre diálogo nativo, painel ou outro componente de confirmação.

11. **Arquivos novos de testes e fixtures.** O plano identifica as pastas e as responsabilidades, mas não fixa os nomes dos novos arquivos.

12. **Operacionalização do rollback.** O plano exige registrar o estado local inicial e desabilitar mutações caso seja necessário voltar a código anterior inseguro. Não define o mecanismo de registro desse estado nem o mecanismo de desabilitação temporária.

Não completar essas lacunas com decisões arquiteturais silenciosas. Sua existência fica documentada para esclarecimento antes da implementação do ponto correspondente.

## Limites da tarefa de documentação

A criação deste documento não implementa correções, não altera código-fonte, não modifica outros documentos, não instala dependências, não executa testes, não cria commits, não publica e não executa comandos destrutivos.

O risco de perda identificado na auditoria continua presente até que a correção seja implementada e validada.
