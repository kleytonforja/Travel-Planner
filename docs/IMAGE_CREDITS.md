# Créditos e licenças das fotografias

Registro da procedência das imagens usadas na home (V1-T2.1). Todas as
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
