# Créditos e licenças das fotografias

Registro da procedência das imagens do aplicativo. **Home** (V1-T2.1): todas as
fotografias vêm do **Unsplash** e estão sob a
[Unsplash License](https://unsplash.com/license): uso livre, inclusive
comercial e sem exigência legal de atribuição; **não** é permitido vender as
fotografias sem modificação nem montar um serviço concorrente com elas. O
crédito é exibido no rodapé por cortesia e transparência.

Verificação feita em 2026-10-12 nas páginas de cada fotografia (a licença
"Free to use under the Unsplash License" aparece em cada uma; nenhuma é
Unsplash+ nem patrocinada). Pexels foi tentado, mas o acesso automatizado foi
recusado (HTTP 403); nenhuma imagem do Pexels foi usada.

| Uso | Arquivo(s) em `public/images/` | Fotógrafo | Página de origem | Dados verificados |
| --- | --- | --- | --- | --- |
| Hero (capa) | `hero/rio-de-janeiro-hero-1920.webp`, `-960.webp` | Mauro Lima ([@limamauro23](https://unsplash.com/@limamauro23)) | https://unsplash.com/photos/gcj__gzMick | "the sun is setting over a large city"; Mirante Dona Marta, Santa Teresa, Rio de Janeiro; publicada em 01/06/2022 |
| Card Florianópolis | `destinations/florianopolis-640.webp`, `-1200.webp` | Henrique Pereira ([@henrique_f](https://unsplash.com/@henrique_f)) | https://unsplash.com/photos/TtM_u4bX_2s | "Cars driving on a suspension bridge under blue sky"; tag florianopolis; publicada em 13/11/2025 |
| Card Rio de Janeiro | `destinations/rio-de-janeiro-640.webp`, `-1200.webp` | Lucas Campoi ([@campoilucas](https://unsplash.com/@campoilucas)) | https://unsplash.com/photos/pHnzdSAEkRM | "aerial photography on city near body of water"; Baía de Guanabara, Rio de Janeiro; publicada em 12/03/2019 |
| Card Lisboa | `destinations/lisboa-640.webp`, `-1200.webp` | Sarah Markstaller ([@sarahmarkstaller](https://unsplash.com/@sarahmarkstaller)) | https://unsplash.com/photos/a-yellow-tram-travels-down-a-street-in-lisbon-r_ShROkN3E8 | "A yellow tram travels down a street in lisbon"; Lisboa, Portugal; publicada em 23/07/2025 |

## Tratamento aplicado
- Conversão para WebP e redimensionamento pelo serviço de imagens do Unsplash
  (parâmetros `fm=webp`, `w`, `h`, `fit=crop` com ponto focal), sem edição
  criativa. Hero: 960 e 1920 px de largura (proporção original 3:2). Cards:
  640×360 e 1200×675 (16:9).
- Nenhuma chave de API foi usada; as imagens foram obtidas do CDN público
  (`images.unsplash.com`) e ficam hospedadas localmente.

## Ressalvas
- **Florianópolis**: a página não nomeia a Ponte Hercílio Luz; a identificação
  como ponte suspensa de Florianópolis se baseia na etiqueta "florianopolis"
  da página e no aspecto da torre de aço. O texto alternativo é, por isso,
  genérico ("ponte suspensa em Florianópolis"). Uma fotografia que nomeie a
  Hercílio Luz pode substituí-la futuramente.
- **Rio de Janeiro (card)**: é uma imagem HDR de contraste forte; foi mantida
  por mostrar o Pão de Açúcar e a paisagem urbana.
- Fotografias das atrações individuais **não** foram incorporadas (fase
  posterior, começando pelas dez atrações do Rio de Janeiro).

## Substituição ou remoção
Para trocar uma fotografia, registre aqui a nova origem e licença e atualize
`src/data/photos.ts`. Em caso de falha de carregamento, a interface usa as
ilustrações originais de `src/components/ui/scenes.tsx` como substitutas.

## Fotografias das atrações (M5.3)

Nove das dez atrações do Rio de Janeiro têm fotografia, todas do **Wikimedia Commons**, cada uma sob a licença registrada na
**página do próprio arquivo** (licença, autor e metadados lidos pela API do Commons em 2026-10-13; a plataforma não tem licença
única). Todas exigem **atribuição** (CC BY ou CC BY-SA); nenhuma é CC0 nem domínio público. As imagens foram abertas e
**conferidas visualmente** em 2026-10-13. **Não houve revisão jurídica.**

| ID da atração | Arquivo no Commons (página: `https://commons.wikimedia.org/wiki/File:<arquivo>`) | Autor | Licença | Original | O que a imagem mostra |
| --- | --- | --- | --- | --- | --- |
| rio-cristo-redentor | Rio_de_Janeiro_-_Cristo_Redentor_01.jpg | Arturdiasr | CC BY-SA 4.0 | 3760×2388 | a estátua, de braços abertos, contra o céu |
| rio-pao-de-acucar | Pão_de_Açúcar_-_Rio_de_Janeiro,_Brasil.jpg | Nico Kaiser (Flickr) | CC BY 2.0 | 3648×2432 | o Pão de Açúcar e a baía, vistos do Corcovado |
| rio-praia-copacabana | Rio_de_janeiro_copacabana_beach_2010.JPG | chensiyuan | CC BY-SA 4.0 | 4288×2848 | a praia e a orla, vistas do Pão de Açúcar |
| rio-museu-do-amanha | Museu_do_Amanhã_rio.jpg | Arne Müseler | CC BY-SA 3.0 DE | 5664×3778 | vista aérea do museu no Píer Mauá |
| rio-trilha-dois-irmaos | Praia_do_Vidigal_+_Morro_Dois_Irmãos_by_Diego_Baravelli.jpg | Diego Baravelli | CC BY-SA 4.0 | 5400×3600 | o morro visto do mar (**não mostra a trilha**) |
| rio-confeitaria-colombo | Confeitaria_Colombo_(2)_(6738795079).jpg | Leandro Neumann Ciuffo | CC BY 2.0 | 2896×1944 | o salão, com espelhos e vitrines |
| rio-lapa | Arcos_da_Lapa_colorido.jpg | AlexandreLuizOliveira | CC BY-SA 4.0 | 4096×2304 | os Arcos à noite, com pessoas (**não mostra bares ou shows**) |
| rio-jardim-botanico | Rio_de_Janeiro_Botanical_Garden_(001).jpg | LubovGorshkova | CC BY-SA 4.0 | 3488×2616 | Jardim Japonês do Jardim Botânico, com palmeiras-imperiais |
| rio-santa-teresa-selaron | Escadaria_do_Selarón_(9603331584).jpg | Collectif Les Enfants | CC BY 2.0 | 1920×1200 | detalhe do mosaico da escadaria |

Contagem conferida arquivo a arquivo: **3 CC BY 2.0** (Pão de Açúcar, Confeitaria Colombo, Selarón), **5 CC BY-SA 4.0** (Cristo,
Copacabana, Dois Irmãos, Lapa, Jardim Botânico) e **1 CC BY-SA 3.0 DE** (Museu do Amanhã) — 9 fotografias, 3 CC BY e 6 CC BY-SA.
(O quadro de candidatas do M5.2 tinha 4 CC BY e 5 CC BY-SA, e o texto dizia "5 e 5" por engano; a troca de Museu e Dois Irmãos
mudou a distribuição.)

**Sem foto**: `rio-feira-ipanema` (Feira Hippie de Ipanema) — nenhuma imagem livre e verificável encontrada; mantém o placeholder.

### Tratamento aplicado
Download do arquivo original da página de cada imagem; recorte **quadrado** (posição horizontal escolhida por imagem para manter o
assunto) e conversão para WebP com `ffmpeg`/libwebp (qualidade 72; Selarón 60), em **480 e 960 px**, sem outra edição e sem
metadados. Arquivos: `public/images/activities/<id>-480.webp` e `-960.webp` (480 px: 10–61 KB; 960 px: 25–225 KB). Mapeamento,
autor, página, licença, link da licença e alterações em `src/data/activityPhotos.ts`; créditos acessíveis em cada roteiro
("Créditos das fotografias") e nota no rodapé. Nas licenças BY-SA, as versões derivadas (WebP) permanecem sob a mesma licença;
isso não se estende ao código do aplicativo.

### Rejeitadas e pendências
- **Morro Dois Irmãos — Tony Cavalcanti (CC BY-SA 3.0)**: a imagem, na verdade, mostra a **Pedra da Gávea**; rejeitada por
  correspondência incorreta e substituída pela de Diego Baravelli (VRTS confirmado na página).
- **Museu do Amanhã — Ciuffo (interior)** e **Jardim Botânico — Eugenio Hansen (pedras) / Betadg**: não adotadas; a vista aérea e o
  Jardim Japonês identificam melhor o lugar.
- **Direitos sobre obras em espaço público** (estátua do Cristo, edifício do Museu do Amanhã, mosaico de Selarón): o Commons as
  hospeda com base na liberdade de panorama brasileira, mas isso **não foi revisado juridicamente**.
- **Pessoas**: aparecem incidentalmente (Confeitaria Colombo e Arcos da Lapa); o recorte da Lapa evita as pessoas em primeiro plano.
- **Sem validação de cada licença no site da Creative Commons além da leitura da página do arquivo**; reverificar antes de publicar
  se houver mudança nas páginas de origem.

## Fotografias de Florianópolis e Lisboa (M5.5)

Quinze das vinte atrações têm fotografia, todas do **Wikimedia Commons**. Em 2026-10-13, a página de cada arquivo foi consultada
pela API do Commons e o script de incorporação **só prosseguiu se a licença e o autor batiam** com os registrados abaixo; os
originais (JPEG) foram baixados da página documentada e **inspecionados visualmente** antes do recorte. As licenças permitem uso
comercial, armazenamento local, redimensionamento e conversão; exigem atribuição (exceto CC0) e, nas BY-SA, a mesma licença nas
versões derivadas. Nada foi considerado liberado apenas por estar no Commons, e **não houve revisão jurídica**.

| ID da atração | Arquivo no Commons (`https://commons.wikimedia.org/wiki/File:<arquivo>`) | Autor | Licença | Original | O que a imagem mostra |
| --- | --- | --- | --- | --- | --- |
| fln-trilha-lagoinha-do-leste | Praia_da_Lagoinha_do_Leste,_Florianópolis.jpg | Papa Pic (via Flickr) | CC0 | 4066×2287 | a praia vista do alto da trilha, com bromélias |
| fln-jurere-internacional | Praia_de_Jurerê_Internacional.JPG | Rafael Bernardino Mattei | CC BY-SA 3.0 | 4608×2540 | a praia e a faixa de areia (**não mostra beach clubs**) |
| fln-mercado-publico | Mercado_Público_de_Florianópolis_(3887553534).jpg | Rodrigo Soldon | CC BY 2.0 | 3264×2448 | a fachada, com as duas torres |
| fln-santo-antonio-de-lisboa | Santo_Antonio_de_Lisboa,_Florianópolis_06.jpg | Simone Balster | CC BY-SA 4.0 | 5472×3648 | pedras da orla e a baía (**não mostra casario nem ostras**) |
| fln-ilha-do-campeche | Ilha_do_Campeche_(3444645238).jpg | Rodrigo Soldon | CC BY 2.0 | 3264×2448 | a ilha vista do mar |
| fln-lagoa-da-conceicao | Florianópolis_SC_Brasil_-_Lagoa_da_Conceição_-_panoramio.jpg | Josue Marinho | CC BY 3.0 | 4608×3456 | barco num trapiche da lagoa, com morros |
| fln-shopping-beiramar | Fachada_Beiramar_dez_2016.jpg | Rachmaninoff | CC BY-SA 4.0 | 5312×2988 | a fachada à noite, com decoração natalina |
| fln-fortaleza-sao-jose | Fortaleza_de_São_José_da_Ponta_Grossa_SC_(3950234623).jpg | Luiz Pantoja | CC BY 2.0 | 3008×2000 | muralhas e edificações de pedra |
| lis-torre-de-belem | Torre_de_Belem_-_Outside.jpg | Ingo Mehling | CC BY-SA 4.0 | 6000×4000 | a torre, do lado do rio |
| lis-mosteiro-jeronimos | Cloister_of_the_Jerónimos_Monastery_in_Belém,_Lisbon,_20250604_1309_9188.jpg | Jakub Hałun | CC BY 4.0 | 5954×3949 | o claustro (**não a fachada**) |
| lis-alfama-santa-luzia | Miradouro_de_Santa_Luzia_View_over_Alfama,_Lisbon_(54733651122).jpg | Dale Cruse | CC BY 4.0 | 11656×8742 | telhados de Alfama e o Tejo |
| lis-castelo-sao-jorge | Lisbon_Castelo_de_São_Jorge_BW_2018-10-03_11-13-09.jpg | Berthold Werner | CC BY-SA 4.0 | 6475×6360 | a torre e as muralhas |
| lis-oceanario | The_size_of_Lisbon_Oceanarium.jpg | Sonse (via Flickr) | CC BY 2.0 | 5472×3494 | o tanque central, com a silhueta de um visitante |
| lis-bairro-alto | Lisboa_Bairro_Alto_(53893930842).jpg | Jorge Franganillo | CC BY 2.0 | 5948×3965 | uma rua ao anoitecer (**não mostra bares nem fado**) |
| lis-sintra-palacio-pena | Pena_Palace,_Sintra,_Portugal,_20250606_1036_0001.jpg | Jakub Hałun | CC BY 4.0 | 6056×4016 | muralhas e torres do Palácio da Pena |

Contagem (15): **1 CC0**, **5 CC BY 2.0** (Mercado, Campeche, Fortaleza, Oceanário, Bairro Alto), **1 CC BY 3.0** (Lagoa),
**3 CC BY 4.0** (Jerónimos, Santa Luzia, Pena), **1 CC BY-SA 3.0** (Jurerê) e **4 CC BY-SA 4.0** (Santo Antônio, Beiramar, Torre,
Castelo). Com o Rio (9): 24 fotografias — 1 CC0, 8 CC BY 2.0, 1 CC BY 3.0, 3 CC BY 4.0, 1 CC BY-SA 3.0, 1 CC BY-SA 3.0 DE e 9 CC BY-SA 4.0.

### Tratamento (igual ao M5.3)
Recorte quadrado (posição horizontal escolhida por imagem; os recortes de Lagoa e Jurerê excluem a data e a marca d'água gravadas
nas fotos) e conversão para WebP com `ffmpeg`/libwebp (qualidade 74, sem metadados) em **480 e 960 px**. Todos os arquivos de
480 px têm de 15 a 46 KB (meta ≤ 60 KB); os de 960 px, de 49 a 150 KB. Mapeamento e créditos em `src/data/activityPhotos.ts`;
créditos acessíveis no roteiro ("Créditos das fotografias") e nota no rodapé.

### Atrações que continuam com placeholder
- **fln-noite-lagoa** (Bares da Lagoa): nenhuma imagem do circuito de bares encontrada.
- **fln-passeio-escuna** (Passeio de escuna): a única imagem não comprova que é o passeio da Baía Sul.
- **lis-pasteis-de-belem**: foto do pastel de nata, sem evidência de ter sido tirada na confeitaria original.
- **lis-lx-factory**: imagens mostram arte de rua/grafite ou multidão; liberdade de panorama em Portugal **não verificada**.
- **lis-time-out-market**: interior de estabelecimento comercial, com pessoas e logotipo em destaque.
- **rio-feira-ipanema**: nenhuma imagem livre e verificável.

### Ressalvas desta etapa
- **Pessoas**: nenhuma foto mostra rostos reconhecíveis; Mercado, Santa Luzia, Castelo, Jerónimos e Bairro Alto têm pessoas pequenas ou
  distantes (em Santa Luzia, o recorte deixa só uma fatia de um visitante na borda esquerda); o Oceanário mostra uma silhueta.
- **Obras e marcas**: monumentos antigos (Torre, Jerónimos, Castelo, Pena, Mercado, Fortaleza) não oferecem risco de direitos de obra;
  **Beiramar** mostra decoração natalina e a marca do shopping, e o **Oceanário** (interior) não mostra a arquitetura moderna. Liberdade
  de panorama: Brasil (Lei 9.610/98, art. 48) **sem revisão jurídica**; Portugal **não verificada**.
- **Imagens do Ministério do Turismo (MTur)** marcadas como "domínio público" no Commons, mas com "crédito obrigatório" na descrição,
  foram descartadas por ambiguidade.
- **Lagoa da Conceição**: crédito original do Panoramio (arquivo recuperado pelo Commons); qualidade modesta.

## Cabeçalho do roteiro e Hero da home (M7 e M7.2)

O cabeçalho da página do roteiro (`src/data/headerPhotos.ts`, chave = ID do destino; sem entrada, cabeçalho azul) e a Hero da home
(`src/data/heroPhotos.ts`, uma foto por visita) usam estas fotografias. A de **Rio** e a de **Florianópolis** são as mesmas nos dois lugares
(atribuição compartilhada). Créditos acessíveis: no próprio cabeçalho do roteiro e, na home, no rodapé ("Foto da capa", sempre igual à imagem exibida).

| Uso | Arquivos em `public/images/` | Autor | Fonte (página original) | Licença | Alterações |
| --- | --- | --- | --- | --- | --- |
| Rio — cabeçalho e Hero | `headers/rio-de-janeiro-corcovado-640|1200.webp`; `hero/rio-de-janeiro-corcovado-960|1920.webp` | Artyominc | https://commons.wikimedia.org/wiki/File:Christ_on_Corcovado_mountain.JPG | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | arquivo do Commons já recortado/corrigido por outro usuário; aqui, recorte 16:9 e WebP (qualidade 74–76) |
| Florianópolis — cabeçalho e Hero | `headers/florianopolis-ponte-640|1200.webp`; `hero/florianopolis-ponte-960|1920.webp` | Rodneycruz | https://commons.wikimedia.org/wiki/File:Cores_ap%C3%B3s_o_p%C3%B4r-do-sol.JPG | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | recorte 16:9 e WebP (qualidade 74–76) |
| Lisboa — cabeçalho | `destinations/lisboa-640|1200.webp` (existentes) | Sarah Markstaller | https://unsplash.com/photos/a-yellow-tram-travels-down-a-street-in-lisbon-r_ShROkN3E8 | [Unsplash License](https://unsplash.com/license) | já recortada e em WebP (V1-T2.1) |
| Lisboa — Hero | `hero/lisboa-bonde-960|1920.webp` | Sarah Markstaller | a mesma página do Unsplash | [Unsplash License](https://unsplash.com/license) | a mesma foto, obtida do CDN público do Unsplash em 960 e 1920 px (recorte 16:9, `fm=webp`, qualidade 50/42) |
| Hero — substituta técnica | `hero/rio-de-janeiro-hero-960|1920.webp` (existentes) | Mauro Lima | https://unsplash.com/photos/gcj__gzMick | [Unsplash License](https://unsplash.com/license) | já recortada e em WebP (V1-T2.1); só aparece se a foto escolhida falhar |

### Verificação de autoria e licença (2026-10-13)
- **Rio — "Christ on Corcovado mountain.JPG"** (a ambiguidade apontada no M7.1 foi **resolvida**). Histórico do arquivo no Commons: o usuário **Artyominc** enviou
  o original em 2010-02-19, com o modelo `{{self|cc-by-sa-3.0|GFDL}}` (obra própria, **CC BY-SA 3.0** e GFDL) e `Author=[[User:Artyominc]]`; a versão atual
  (3702×2088) foi **recortada, girada e corrigida por Piisamson** (2010-11-12) e reenviada por Chronus (2012-12-14), mantendo a licença — é obra derivada sob a mesma licença.
  O campo "fonte" traz `{{Artyom Sharbatyan}}`, um **modelo que não existe** (daí o "crédito" estranho exibido pela API): é o nome que acompanha o autor, não outro autor, mas
  **não foi possível confirmar** que "Artyom Sharbatyan" é a mesma pessoa. Decisão: o crédito exibido segue o **campo "autor" (Artyominc)**, com a licença CC BY-SA 3.0, o link da página e
  a menção de que o arquivo já tinha sido recortado e corrigido. Ressalvas: a autoria "obra própria" é declaração do uploader (não verificada de forma independente); GFDL ignorada (usamos só CC BY-SA 3.0);
  a atribuição segue o campo do autor e pode ser ajustada se o autor indicar outra forma. Imagem aberta e conferida: estátua, Pão de Açúcar, Botafogo e baía; pessoas minúsculas ou ausentes.
- **Florianópolis — "Cores após o pôr-do-sol.JPG"**: enviado por **Rodneycruz** em 2015-09-07 (UploadWizard, campanha Wiki Loves Monuments 2015 Brasil), `{{own}}` (obra própria),
  `{{self|cc-by-sa-4.0}}`, descrição original "Ponte Hercílio Luz" e identificador do patrimônio (`Cultural Heritage Brazil 1137`); data 2014-12-27 20:17. A versão atual foi reenviada
  em 2022-01-05 por R8cocin8 (mesmas dimensões 5184×3456, tamanho menor — provável otimização, **sem registro do motivo conferido**). Imagem aberta e conferida (ponte iluminada ao crepúsculo).
  A descrição atual do arquivo é genérica (modelo de monumento); a identificação se apoia na descrição original, no identificador do patrimônio e na imagem.
- **Lisboa**: a mesma fotografia já usada no card (Unsplash License); a página do Unsplash passou a bloquear o acesso automatizado (HTTP 401), então a **licença foi reconfirmada só pelo registro anterior**
  (2026-10-12) e o arquivo foi obtido do CDN público a partir do identificador já documentado.
- **Direitos de terceiros**: a licença da foto não libera obras em espaço público (a estátua do Cristo, a ponte), marcas nem pessoas; o Commons as hospeda amparado na liberdade de panorama brasileira
  (Lei 9.610/98, art. 48), **sem revisão jurídica**. BY-SA: as versões derivadas (WebP) permanecem sob a mesma licença; isso não se estende ao código.
- **Descartadas/substituídas**: a fotografia do Cristo Redentor de Chensiyuan (R1, CC BY-SA 4.0), usada provisoriamente no M7 (não commitado), **não foi aprovada** e seus WebP foram removidos;
  a fotografia anterior do cabeçalho de Florianópolis (Henrique Pereira) continua apenas no card da home.

### Pesos (WebP)
Cabeçalhos: 24–110 KB (640/1200 px). Hero: 41–235 KB (960/1920 px); só **uma** é baixada por visita.

### Pendências
Sem revisão jurídica; identidade "Artyom Sharbatyan" × "Artyominc" não confirmada; licença do Unsplash de Lisboa reconfirmada sem acesso à página; novos destinos exigem nova verificação.
