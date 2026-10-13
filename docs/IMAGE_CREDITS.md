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
