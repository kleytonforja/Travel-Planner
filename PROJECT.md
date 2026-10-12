# PROJECT.md — Travel Planner

## Objetivo

Aplicação web de **planejamento personalizado de viagens**. O usuário informa
destino, quantidade de dias, interesses, estilo de viagem e orçamento; a
aplicação gera um **roteiro organizado por dia** com base em dados locais e
regras determinísticas.

O MVP **não** utiliza inteligência artificial generativa nem serviços de
preços em tempo real.

## Escopo do MVP

### Incluído

- Formulário de planejamento com validação (destino, 1–14 dias, interesses,
  estilo, orçamento).
- Base local com 3 destinos (Florianópolis, Rio de Janeiro, Lisboa), cada um
  com pelo menos 8 atividades tipadas.
- Gerador de roteiros determinístico (filtro por interesses, estilo e
  orçamento; distribuição por dias sem sobreposição de horários).
- Página de roteiro com resumo financeiro e avisos.
- Persistência em LocalStorage (salvar, reabrir, excluir, novo planejamento).
- Exportação do roteiro em JSON.
- Testes automatizados com Vitest.
- Pipeline de CI/CD para GitHub Pages (GitHub Actions).
- Aviso visível e acessível de demonstração experimental nas duas páginas,
  sem sincronização ou garantia de preservação permanente dos roteiros.

### Fora de escopo

- IA generativa, recomendações em tempo real.
- Cotações, horários oficiais ou disponibilidade real (custos e durações da
  base são **ilustrativos** e rotulados como tal na interface).
- Backend, autenticação, banco de dados remoto.

## Stack

| Camada        | Tecnologia                          |
| ------------- | ----------------------------------- |
| UI            | React 19 + TypeScript + Vite        |
| Estilo        | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Ícones        | Lucide React                        |
| Testes        | Vitest + Testing Library + jsdom    |
| Persistência  | LocalStorage                        |
| Hospedagem    | GitHub Pages                        |
| CI/CD         | GitHub Actions                      |

## Arquitetura

```
src/
  components/   # Componentes de interface reutilizáveis
  pages/        # Páginas da aplicação (inicial, roteiro)
  data/         # Base local de destinos e atividades (tipada)
  services/     # Regras de negócio: gerador de roteiros, persistência, exportação
  hooks/        # Hooks React
  types/        # Tipos de domínio (Destination, Activity, TravelStyle, ...)
  utils/        # Funções utilitárias (formatação, etc.)
  tests/        # Testes com Vitest + setup
```

Princípios:

- **Separação de responsabilidades**: interface, dados, regras de negócio,
  persistência e tipos em módulos distintos.
- O **algoritmo do gerador de roteiros** vive em `services/`, fora de
  componentes, e é determinístico (mesma entrada → mesma saída).
- Componentes pequenos e compostos.

## Comandos

```bash
npm run dev         # ambiente de desenvolvimento
npm run test:run    # testes (execução única)
npm run typecheck   # verificação de tipos
npm run lint        # análise estática (oxlint)
npm run build       # build de produção
```
