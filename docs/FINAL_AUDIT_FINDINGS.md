# Achados da auditoria independente final — Travel Planner

## 1. Origem, escopo e parecer

Este documento registra integralmente os achados AUD-01 a AUD-07 da auditoria independente de integridade, segurança e persistência e de sua consolidação posterior. Sua fonte é exclusivamente a evidência já produzida nessas duas etapas. Não constitui nova auditoria, implementação de correções ou resultado de novos testes.

O estado auditado inclui as alterações locais do checkpoint P3 ainda não commitadas. As referências de linhas correspondem ao estado examinado na auditoria; podem mudar após correções. Os caminhos são relativos à raiz do projeto.

**Parecer registrado: NO-GO técnico.** A suíte existente passou, mas os ensaios independentes reproduziram perda de uma nova quarentena por confirmação desatualizada, inconsistências financeiras e comunicação incorreta de preservação. Os 12 critérios de aceite não foram integralmente atendidos.

A perda da nova quarentena e o descarte com confirmação desatualizada são o mesmo defeito, AUD-01. Não são dois achados independentes.

### Estado dos problemas originais

| Problema | Estado registrado | Fundamentação |
| --- | --- | --- |
| TP-02 — Dados inválidos | Parcial | Validação ampliada funciona, mas aceita os dois casos financeiros de AUD-03 e AUD-04. |
| TP-03 — Colisão de identificadores | Corrigido nos ensaios | Uma colisão verdadeira reconstruída com o fingerprint exigido preservou os dois registros; o par original continua indisponível. |
| TP-04 — Falhas de armazenamento | Parcial | O serviço preserva dados nos casos exercitados e distingue incerteza; a interface ainda pode afirmar falsamente que nada mudou. |
| TP-05 — Sobrescrita após corrupção | Parcial | Escritas normais inseguras foram bloqueadas, mas a integração permite apagar uma nova quarentena com confirmação antiga. |

## 2. Evidências independentes já executadas

Os ensaios utilizaram os módulos reais da aplicação em processos locais, fixtures sintéticas próprias, injeção de falhas, comparação do conteúdo bruto das chaves e interações com os componentes reais em jsdom. Não se basearam exclusivamente nos testes existentes.

Chaves examinadas:

- Principal: travel-planner:saved-itineraries:v1.
- Quarentena: travel-planner:saved-itineraries:v1:quarentena.
- Lock de mutação: travel-planner:storage:v1.

| Cenário | Resultado observado na auditoria |
| --- | --- |
| Primeira leitura falha | Falha explícita, zero escritas e conteúdo preservado. |
| Segunda leitura falha, após escrita | Resultado uncertain, uma escrita, sem repetição ou rollback. |
| Confirmação encontra conteúdo divergente | Resultado incerto. |
| QuotaExceededError ao salvar, substituir e excluir | Chave principal exatamente preservada. |
| Leituras e escritas falham consecutivamente | Nenhuma conversão de falha em lista vazia usada para gravar. |
| Quarentena diferente ou contendo string vazia | Recuperação bloqueada; ambas as chaves preservadas. |
| Leitura, escrita ou confirmação do backup falha | Nenhuma escrita principal. |
| Backup confirmado, escrita principal falha | Principal original e backup mantidos. |
| Quota efetiva do jsdom: backup não cabe, substituição caberia | Recuperação bloqueada; original intacto. |
| JSON inválido, string vazia, formato desconhecido e corrupção parcial | Escritas normais bloqueadas; recuperação preserva o texto original. |
| IDs duplicados | Exclusão bloqueada; recuperação mantém os registros com IDs novos e distintos. |
| Ações desatualizadas enviadas diretamente ao serviço | Bloqueadas sem mutação. |
| Confirmação desatualizada através da interface | Falhou: a nova quarentena foi apagada, conforme AUD-01. |
| Web Locks ausente ou aquisição rejeitada | Todas as mutações bloqueadas. |
| Concorrência | 20 salvamentos em dois workers com LockManager nativo do Node: 21 registros finais, incluindo o histórico inicial, sem atualização perdida. |

A concorrência também foi exercitada com lock simulado. O ensaio nativo utilizou memória compartilhada entre workers; não equivale a um teste em duas abas reais de navegador.

### Resultados de validação registrados

| Verificação | Resultado |
| --- | --- |
| npm run typecheck | Passou. |
| npm run test:run | 190 de 190 testes passaram, em 12 arquivos. |
| npm run lint | Zero erros e zero avisos. |
| npm run build | Passou. |
| Matriz independente do serviço | 70 cenários: 68 aprovados e duas reprovações de requisitos financeiros. |
| Verificações adicionais da interface | Quatro violações confirmadas: AUD-01, AUD-02, AUD-05 e AUD-06. |
| Colisão exata reconstruída e concorrência nativa | Passaram. |

Os números acima pertencem à auditoria anterior. Nenhum desses comandos foi executado novamente para criar este documento.

### Colisão verdadeira reconstruída

Foram reconstruídos dois planejamentos sintéticos distintos que geram exatamente **roteiro-2cd27b6e**:

| Campo | Planejamento A | Planejamento B |
| --- | --- | --- |
| destinationId | florianopolis | florianopolis |
| days | 1 | 1 |
| style | economico | economico |
| budget | 95263682 | 97062267 |
| interests | natureza, cultura, relaxamento | gastronomia, natureza, cultura, aventura, relaxamento |

Os dois roteiros foram válidos nos ensaios. O registro legado A foi armazenado com ID roteiro-2cd27b6e. Salvar B acrescentou um registro com UUID, preservou integralmente A e deixou dois registros na coleção.

Esses são dados sintéticos reconstruídos na auditoria, não os dois planejamentos originais da auditoria anterior. A ausência dos originais não foi preenchida com informação inventada.

### Preservação histórica exercitada

Históricos sintéticos mantiveram IDs, datas, nomes, descrições, valores e campos adicionais ao salvar outros roteiros, excluir outros registros e recuperar corrupção parcial. Registros sobrepostos foram rejeitados operacionalmente e preservados integralmente na quarentena, sem reagendamento automático.

A amostra original de 64.851 registros válidos e 837 sobrepostos não estava disponível. Os ensaios sintéticos não permitem afirmar ausência de rejeições adicionais nessa população.

## 3. A — Defeitos comprovados

### AUD-01 — Alta: confirmação desatualizada apaga uma nova quarentena

**Classificação:** defeito funcional bloqueador, com perda de dados comprovada.

**Arquivos e linhas afetadas:**

- src/pages/HomePage.tsx:70 — confirmação de descarte representada por booleano.
- src/pages/HomePage.tsx:72–75 — recarga atualiza o conteúdo da quarentena.
- src/pages/HomePage.tsx:202–208 — handler captura quarantine.raw no momento da confirmação.
- src/pages/HomePage.tsx:378–384 — abertura do painel de confirmação.

**Causa raiz comprovada:** a confirmação não guarda o conteúdo autorizado quando o painel abre. Guarda apenas um booleano. Uma recarga pode atualizar quarantine.raw e manter a confirmação aberta. Ao confirmar, a interface envia o novo conteúdo ao serviço, substituindo implicitamente o alvo da autorização anterior.

O serviço verifica o conteúdo recebido corretamente. A falha está na integração: a interface troca esse conteúdo antes de enviar a ação.

**Evidência independente:** interação com HomePage real em jsdom, serviço real e armazenamento sintético. O ensaio foi confirmado também com descarte e recuperação intermediários executados pelos métodos do serviço. As mutações do serviço utilizaram o mesmo nome de lock.

**Cenário exato de reprodução:**

1. A chave principal contém um roteiro válido; a quarentena contém a cópia A.
2. Na primeira sessão, abrir “Descartar cópia definitivamente”, deixando o painel de confirmação aberto.
3. Em outra sessão, descartar A pelo serviço.
4. Introduzir uma coleção parcialmente corrompida e recuperá-la pelo serviço. Essa recuperação cria a cópia B na quarentena e conserva o roteiro válido na principal.
5. Na primeira sessão, excluir o roteiro válido. A operação recarrega a quarentena para B, mas mantém o painel antigo de descarte aberto.
6. Clicar em “Confirmar descarte definitivo”.

No ensaio, B continha um registro inválido com conteúdo sintético que permaneceu exclusivamente no backup após a recuperação.

**Resultado observado:** B foi removida. A principal ficou com []. A interface informou “Cópia de segurança descartada definitivamente deste navegador. A remoção foi confirmada.” O conteúdo inválido preservado exclusivamente em B desapareceu.

**Resultado correto esperado:** cancelar a autorização antiga; B deve permanecer integralmente preservada. Uma nova cópia não pode ser descartada com uma confirmação iniciada para A.

**Correção mínima recomendada:** capturar o texto bruto da quarentena ao abrir a confirmação e passá-lo ao serviço. Invalidar a confirmação quando uma releitura observar conteúdo diferente. Não usar o conteúdo atualizado como substituto automático daquele que originou a confirmação.

**Teste de regressão obrigatório:** reproduzir a sequência completa na interface, incluindo a recarga intermediária. Comparar exatamente B antes e depois da tentativa; verificar ausência de remoção de B e ausência de mensagem de sucesso para a ação desatualizada.

### AUD-02 — Média: mensagem falsa de preservação após resultado incerto

**Classificação:** defeito funcional bloqueador de conformidade com o contrato de resultados.

**Arquivos e linhas afetadas:**

- src/pages/HomePage.tsx:98 — releitura após a mutação.
- src/pages/HomePage.tsx:252–260 — alerta genérico de indisponibilidade, incluindo “Nenhum dado foi alterado”.

**Causa raiz comprovada:** o alerta genérico de indisponibilidade afirma ausência de alteração sem considerar que uma escrita anterior já ocorreu. A mensagem depende apenas do estado da leitura seguinte, não da evidência sobre a mutação anterior.

**Evidência independente:** interação com HomePage real em jsdom; a escrita principal ocorreu efetivamente e as leituras posteriores foram forçadas a falhar. O conteúdo principal foi inspecionado diretamente no armazenamento sintético.

**Cenário exato de reprodução:**

1. A principal contém o último roteiro salvo.
2. Solicitar sua exclusão.
3. Permitir que setItem grave [] na chave principal.
4. Fazer a leitura de confirmação falhar.
5. Fazer também a releitura seguinte, iniciada pela interface, falhar.

**Resultado observado:** a principal foi alterada para []. A interface exibiu simultaneamente:

> Não foi possível confirmar a operação. Recarregue os roteiros antes de tentar novamente.

> Nenhum dado foi alterado.

O segundo texto integra o alerta de indisponibilidade da lista.

**Resultado correto esperado:** informar incerteza e indisponibilidade da releitura, sem afirmar que a escrita não aconteceu.

**Correção mínima recomendada:** retirar a afirmação absoluta do alerta genérico ou condicioná-la à evidência de interrupção anterior à escrita. Preservar a mensagem própria de resultado incerto.

**Teste de regressão obrigatório:** escrita efetiva seguida de falhas persistentes de leitura. Verificar mensagem de incerteza, ausência da falsa afirmação de preservação, uma única escrita principal e nenhum rollback ou repetição automática.

**Delimitação:** o serviço retornou corretamente uncertain nesse cenário. Não foi comprovado um defeito separado no estado de resultado incerto do serviço.

### AUD-03 — Média: custo superior ao orçamento é aceito dentro da tolerância

**Classificação:** defeito funcional bloqueador de integridade financeira.

**Arquivo e linha afetada:** src/services/itineraryStorage.ts:557.

**Causa raiz comprovada:** a condição de rejeição exige que custo − orçamento ultrapasse EPSILON. O plano exige rejeitar custo superior ao orçamento; a tolerância das relações financeiras não autoriza ultrapassá-lo.

**Evidência independente:** um roteiro sintético estruturalmente válido foi submetido ao validador, à leitura de dados persistidos e ao salvamento pelo serviço real. Os três caminhos aceitaram o caso.

**Cenário exato de reprodução:**

- Uma atividade de custo 10.
- Um dia.
- Orçamento 9.9999995.
- Custo estimado 10.
- Saldo declarado 0.
- Média por dia 10.
- Demais campos do roteiro válidos.

A subtração orçamento − custo resultou em aproximadamente −5.000000005139782e-7.

**Resultado observado:** validateSavedItinerary retornou { ok: true, reasons: [] }; loadSavedItineraries retornou status ok; saveItinerary confirmou o salvamento.

**Resultado correto esperado:** rejeitar custo acima do orçamento, inclusive quando a diferença é inferior a 1e-6.

**Correção mínima recomendada:** comparar estritamente custo e orçamento. Manter a tolerância apenas nas relações financeiras que a admitem.

**Teste de regressão obrigatório:** testar o caso na validação, leitura e salvamento. Na tentativa de salvar, verificar zero escritas e preservação exata das duas chaves.

### AUD-04 — Média: saldo incorreto é aceito pela perda de precisão na soma

**Classificação:** defeito funcional bloqueador de integridade financeira.

**Arquivo e linha afetada:** src/services/itineraryStorage.ts:560.

**Causa raiz comprovada:** o código valida custo + saldo aproximadamente igual ao orçamento, em vez de validar saldo aproximadamente igual a orçamento − custo, como especificado. Com valores grandes, a soma pode absorver um saldo incorreto pela precisão numérica.

**Evidência independente:** o validador, a leitura e o salvamento do serviço real aceitaram um saldo que difere do resultado da subtração por 1, acima da tolerância absoluta de 1e-6.

**Cenário exato de reprodução:**

- Orçamento 10000000000000000.
- Custo da única atividade 10000000000000000.
- Custo estimado total 10000000000000000.
- Saldo declarado 1.
- Um dia.
- Média por dia 10000000000000000.
- Demais campos válidos.

O saldo calculado por orçamento − custo é 0.

**Resultado observado:** validação aprovada, leitura com status ok e salvamento confirmado.

**Resultado correto esperado:** rejeitar a discrepância de 1 entre o saldo declarado e o calculado.

**Correção mínima recomendada:** comparar diretamente o saldo declarado com orçamento − custo, mantendo tolerância absoluta de 1e-6, verificações de finitude e não negatividade.

**Teste de regressão obrigatório:** exercitar o caso na validação, leitura e salvamento; exigir rejeição e nenhuma escrita na tentativa de salvar. Manter um controle válido com saldo 0.

### AUD-05 — Média: falta exportação bruta da principal corrompida

**Classificação:** defeito funcional bloqueador do fluxo de recuperação previsto.

**Arquivos e linhas afetadas:**

- src/pages/HomePage.tsx:224 — download conectado apenas à quarentena.
- src/pages/HomePage.tsx:264–285 — painel de corrupção e ação de recuperação.
- src/services/itineraryExport.ts:123 — exportador de recuperação existente, disponível para reutilização.

**Causa raiz comprovada:** o exportador de recuperação existe, mas a interface o conecta somente ao conteúdo da quarentena. Não há ação para exportar diretamente o conteúdo bruto observado da principal corrompida.

**Evidência independente:** renderização e inspeção das ações da HomePage real em jsdom, com corrupção na principal e quarentena ausente. Um ensaio separado de quota efetiva do jsdom confirmou que a recuperação pode ser bloqueada quando o backup não cabe, mesmo que a substituição principal coubesse.

**Cenário exato de reprodução:**

1. Armazenar {invalid na chave principal.
2. Manter a quarentena ausente.
3. Abrir a página inicial.
4. Inspecionar as ações disponíveis no painel de corrupção.

Para o impacto sob quota, considerar o ensaio separado em que a criação do backup não cabe e a recuperação é corretamente interrompida.

**Resultado observado:** há ação de recuperação, mas nenhum botão para baixar o conteúdo bruto da principal. Sob quota insuficiente para o backup, não há essa saída de exportação na interface.

**Resultado correto esperado:** permitir exportar o conteúdo bruto observado antes da recuperação, inclusive quando não há espaço para criar a quarentena.

**Correção mínima recomendada:** conectar o exportador existente a storage.raw da principal corrompida, identificando corretamente a chave de origem. Não afirmar que o usuário guardou o arquivo apenas porque o download foi iniciado.

**Teste de regressão obrigatório:** corrupção com quarentena ausente e backup bloqueado por quota. Verificar envelope de recuperação, chave de origem, igualdade exata de raw e zero mutações nas duas chaves.

**Delimitação:** a ausência da ação foi comprovada; o bloqueio por quota foi comprovado em ensaio separado. Não se afirma que houve perda de dados nesse caso.

### AUD-06 — Média: restauração corrige IDs sem aviso prévio

**Classificação:** defeito funcional bloqueador das informações exigidas para confirmação.

**Arquivo e linhas afetadas:** src/pages/HomePage.tsx:393; texto e ação de confirmação em 395–407.

**Causa raiz comprovada:** o painel de restauração é genérico e não apresenta as alterações de identidade que o serviço realizará.

**Evidência independente:** renderização da HomePage real em jsdom, com dois registros individualmente válidos compartilhando o mesmo ID na quarentena. O texto da confirmação não mencionou identificadores. Os ensaios do serviço confirmaram a atribuição de IDs novos e distintos aos integrantes de grupos duplicados.

**Cenário exato de reprodução:**

1. Principal contém [].
2. Quarentena contém dois registros individualmente válidos com o mesmo ID.
3. Abrir “Restaurar registros da cópia”.
4. Inspecionar o painel antes de confirmar.

Texto observado:

> Restaurar os registros válidos da cópia de segurança para a lista de roteiros salvos? A cópia será mantida na quarentena.

**Resultado observado:** a confirmação não informa que os IDs serão alterados. O serviço corrige esses IDs durante a restauração.

**Resultado correto esperado:** informar previamente quantos registros receberão novos identificadores.

**Correção mínima recomendada:** apresentar essa análise no painel e vincular a confirmação ao conteúdo analisado.

**Teste de regressão obrigatório:** verificar o aviso antes da confirmação, IDs novos e distintos após restauração, preservação dos demais campos e manutenção integral da quarentena.

### AUD-07 — Média, documental: declaração de aceite excede as evidências

**Classificação:** pendência bloqueadora da declaração de aceite final; não é um defeito adicional de execução.

**Arquivos e linhas afetadas:**

- TASKS.md:387 — declaração de cobertura dos critérios de aceite.
- src/tests/itineraryStorageIdentity.test.ts:76 — teste denominado “colisão real”.
- src/tests/fixtures/savedItineraries.ts:13 — ressalva sobre ausência dos planejamentos originais.

**Causa raiz comprovada:** aprovação da suíte foi tratada como cobertura integral dos casos obrigatórios, apesar de cenários ausentes e artefatos originais indisponíveis.

**Evidência independente:** confronto entre a declaração de cobertura dos critérios 1–11, as reproduções de AUD-01 a AUD-06 e a construção da fixture existente. Essa fixture atribui a um registro o fingerprint de outro planejamento; não demonstra dois planejamentos distintos efetivamente produzindo o mesmo hash.

**Cenário exato de reprodução documental:**

1. Ler a declaração de cobertura dos critérios 1–11 em TASKS.md.
2. Confrontá-la com os casos comprovados AUD-01 a AUD-06.
3. Inspecionar o teste de colisão e a ressalva da fixture.
4. Verificar a indisponibilidade do par original e da amostra histórica original.

**Resultado observado:** a documentação afirma cobertura integral; os casos independentes revelaram violações. A fixture existente não contém o par original nem comprova dois hashes calculados iguais.

**Resultado correto esperado:** distinguir testes existentes aprovados, reproduções independentes, defeitos abertos e verificações pendentes.

**Correção mínima recomendada:** ajustar a declaração de aceite e incorporar a colisão verdadeira reconstruída como regressão, identificando sua origem sintética. Não apresentá-la como o par original.

**Teste de regressão/verificação obrigatório:** o teste de colisão deve calcular ambos os fingerprints, comprovar sua igualdade e preservar os dois registros. A revisão documental deve corresponder aos resultados efetivamente executados e manter explícitas as verificações não realizadas.

## 4. Problemas bloqueadores e não bloqueadores

### Bloqueadores

| Achado | Motivo do bloqueio |
| --- | --- |
| AUD-01 | Perda comprovada de uma nova quarentena por autorização antiga. |
| AUD-02 | Falsa afirmação de preservação após escrita efetiva e resultado incerto. |
| AUD-03 | Custo superior ao orçamento aceito. |
| AUD-04 | Saldo financeiramente inconsistente aceito. |
| AUD-05 | Saída de exportação da principal corrompida ausente. |
| AUD-06 | Mudanças de IDs não informadas antes da confirmação. |
| AUD-07 | Aceite documental excede a evidência e não pode ser declarado integral. |

### Não bloqueadores

A auditoria e a consolidação não classificaram nenhum defeito funcional comprovado como não bloqueador. Não se rebaixa aqui a classificação de AUD-01 a AUD-06.

Os comportamentos corretos do serviço de resultado incerto, de bloqueio de escritas em corrupção e de preservação sob falhas de backup não constituem defeitos. As limitações aceitas pelo plano são registradas na seção 6.

## 5. B — Riscos potenciais não reproduzidos

- Comportamento em duas abas reais de navegador: a concorrência foi exercitada com mock e LockManager nativo do Node, não com abas.
- Rejeições adicionais na população histórica original: os históricos sintéticos passaram, mas não permitem concluir sobre toda a amostra.
- Outros efeitos de confirmações abertas durante recargas: o descarte foi reproduzido; não há evidência para declarar todos os demais fluxos defeituosos.

Esses pontos exigem verificação. Não devem ser descritos como perdas já demonstradas.

## 6. C — Limitações aceitas pelo plano técnico

- Abas antigas e scripts que ignoram o lock da versão corrigida.
- Limpeza do armazenamento pelo usuário, navegador, sistema ou extensões.
- Ausência de garantia de durabilidade física após desligamento abrupto.
- Quarentena com uma única cópia; conteúdo diferente bloqueia nova recuperação.
- Bloqueio de mutações quando Web Locks não está disponível.
- Ausência de reparo automático de sobreposições, importação geral e mesclagem.
- Alterações futuras de catálogo que tornem um destino indisponível.
- Download iniciado não comprova que o arquivo foi guardado.

A perda de B por autorização referente a A não está coberta por essas limitações: AUD-01 é uma falha comprovada da integração atual.

A auditoria também registrou a limitação da substituição confirmada quanto a extensões desconhecidas do registro substituído: elas não são mantidas. Esse comportamento foi documentado na implementação como resolução da ambiguidade nº 7 do plano, não como nova perda reproduzida neste conjunto de achados.

## 7. D — Testes que não puderam ser executados

| Verificação | Motivo e limite da evidência |
| --- | --- |
| Par original da colisão roteiro-2cd27b6e | Os dois planejamentos originais não estavam disponíveis. A colisão verdadeira reconstruída passou, mas não substitui a rastreabilidade do par original. |
| Amostra original: 64.851 válidos e 837 sobrepostos | Corpus e procedimento original não estavam disponíveis. Não foi comprovada ausência de rejeições adicionais nessa população. |
| Concorrência em duas abas reais | Não foi executada em navegador. Houve ensaio nativo com dois workers e ensaio com lock simulado. |

Nenhuma informação ausente sobre os planejamentos originais ou o corpus histórico foi inventada.

## 8. Causas compartilhadas e trabalho conjunto

| Grupo | Achados | Relação comprovada e possibilidade de correção conjunta |
| --- | --- | --- |
| Confirmação vinculada ao conteúdo | AUD-01 e AUD-06 | Ambos envolvem o contexto que deve ser apresentado e autorizado antes da ação. AUD-01 perde o vínculo com o conteúdo; AUD-06 omite a informação de alteração de IDs. Podem ser tratados na revisão mínima dos painéis, mas não são a mesma causa raiz. |
| Comunicação baseada em evidência | AUD-02 e AUD-06 | AUD-02 afirma ausência de alteração sem evidência; AUD-06 não informa previamente uma alteração prevista. A revisão de mensagens pode ser conjunta. |
| Validação financeira compartilhada | AUD-03 e AUD-04 | Ambos estão no mesmo validador usado na leitura e antes da escrita. São comparações inadequadas distintas e podem ser corrigidas e testadas juntas, sem alterar o formato persistido. |
| Recuperação e aceite | AUD-05 e AUD-07 | A saída de recuperação ausente precisa de regressão e de registro documental fiel. A correção do fluxo e a atualização do aceite devem corresponder às evidências reais. |
| Perda e confirmação antiga | AUD-01 | “Descarte com confirmação desatualizada” e “perda da nova quarentena” descrevem a causa e o efeito do mesmo achado. |

As lacunas de regressão explicam por que a suíte aprovada não detectou esses cenários, mas não substituem as causas raízes específicas dos defeitos.

## 9. Ordem mínima de correção

1. **Eliminar a perda da quarentena — AUD-01.** Capturar o conteúdo autorizado, invalidar confirmações desatualizadas e adicionar a reprodução completa da interface.
2. **Corrigir mensagens e confirmação de restauração — AUD-02 e AUD-06.** Evitar falsa preservação em resultado incerto e informar mudanças de IDs previamente.
3. **Fechar a validação financeira — AUD-03 e AUD-04.** Corrigir as duas comparações no validador compartilhado e testar leitura e escrita.
4. **Completar a saída de recuperação — AUD-05.** Reutilizar o exportador existente para a principal corrompida, com raw exato e origem correta.
5. **Consolidar o aceite — AUD-07.** Incorporar as regressões, reconciliar os documentos com os resultados e obter os artefatos originais pendentes.

O plano recomenda a menor correção completa, sem novo armazenamento, backend, dependências ou mudança do formato v1.

Esta ordem é uma recomendação registrada. A criação deste documento não autoriza implementar nenhuma etapa.

## 10. Critérios objetivos para nova auditoria

### Critérios por achado

- AUD-01: a sequência de confirmação antiga, troca de quarentena, recarga e confirmação deve terminar sem alterar B e sem mensagem de sucesso da ação desatualizada.
- AUD-02: escrita efetiva seguida de falhas persistentes de leitura deve exibir incerteza sem afirmar que nada mudou; deve haver uma única escrita, sem rollback ou repetição.
- AUD-03: o caso orçamento 9.9999995 e custo 10 deve ser rejeitado na validação, leitura e antes de salvar.
- AUD-04: o caso orçamento e custo 10000000000000000 com saldo 1 deve ser rejeitado; o controle com saldo 0 deve permanecer válido.
- AUD-05: a principal corrompida deve ser exportável antes da recuperação, inclusive sob quota insuficiente para backup; o envelope deve conter a origem correta e raw exatamente igual ao observado, sem mutações.
- AUD-06: a confirmação deve informar previamente a quantidade de IDs que serão corrigidos; após restauração, registros e quarentena devem permanecer preservados conforme o contrato.
- AUD-07: documentação e teste de colisão devem representar a evidência real, distinguindo o par sintético reconstruído dos originais ainda pendentes.

### Reavaliação dos 12 critérios do plano

| Nº | Critério objetivo | Resultado registrado na auditoria |
| --- | --- | --- |
| 1 | Todos os casos obrigatórios passam. | Não atendido: lacunas e violações independentes. |
| 2 | Colisão real deixa de substituir registros. | Parcial: fingerprint exato passou; par original indisponível. |
| 3 | Falhas anteriores à gravação preservam a principal. | Atendido nos ensaios. |
| 4 | Falha de backup impede escrita principal. | Atendido nos ensaios. |
| 5 | Principal nunca é removida antes da substituição. | Atendido. |
| 6 | Sucesso depende de confirmação; incerteza tem estado e mensagem próprios. | Parcial: serviço atende; interface contradiz a incerteza. |
| 7 | Ações desatualizadas não modificam nenhuma chave. | Não atendido: descarte pela interface. |
| 8 | Históricos válidos permanecem utilizáveis. | Parcial: fixtures passaram; amostra original pendente. |
| 9 | Incompatíveis permanecem preservados e identificáveis. | Parcial: preservação funciona, mas a nova quarentena pode ser perdida. |
| 10 | Interface não promete preservação sem evidência. | Não atendido. |
| 11 | Typecheck, testes, lint e build passam. | Atendido na execução anterior. |
| 12 | Verificação independente não encontra caminhos de perda. | Não atendido: perda reproduzida na integração. |

A nova auditoria deverá:

1. Comparar o conteúdo bruto das duas chaves antes e depois de cada cenário.
2. Repetir os casos comprovados AUD-01 a AUD-06 contra as correções.
3. Revalidar falhas de primeira leitura, confirmação, quota, backup, quarentena ocupada, corrupção parcial, JSON inválido, IDs duplicados, ações desatualizadas e concorrência.
4. Executar as regressões e npm run typecheck, npm run test:run, npm run lint e npm run build.
5. Validar o par original e o corpus histórico quando os artefatos forem disponibilizados, sem substituir sua origem por dados inventados.
6. Reavaliar cada um dos 12 critérios com evidência suficiente e documentação correspondente.

**GO técnico somente quando não houver defeito bloqueador aberto e cada critério tiver evidência suficiente.** Até lá, permanece NO-GO.

## 11. Limites deste registro

Esta tarefa cria somente docs/FINAL_AUDIT_FINDINGS.md. Não implementa correções, não modifica código-fonte ou outros documentos, não executa novos testes, não instala dependências e não realiza commit, push ou publicação.

O risco bloqueador permanece: uma nova quarentena pode ser apagada usando uma confirmação antiga.
