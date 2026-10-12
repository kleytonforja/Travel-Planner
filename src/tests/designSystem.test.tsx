/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DestinationCard } from '../components/DestinationCard'
import { Hero } from '../components/Hero'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CategoryBadge } from '../components/ui/CategoryBadge'
import { ProgressSteps } from '../components/ui/ProgressSteps'
import { SearchField } from '../components/ui/SearchField'
import { buttonClasses, CATEGORY_STYLES, cardClasses } from '../components/ui/variants'
import { destinations } from '../data/destinations'
import { INTEREST_LABELS } from '../data/labels'
import type { InterestCategory } from '../types'

/**
 * Design System (V1-T1): tokens, contraste, acessibilidade e variantes.
 * Os tokens são lidos do próprio `src/index.css`, de modo que o teste
 * falha se um valor mudar para uma combinação sem contraste suficiente.
 */

/* ------------------------------ tokens e contraste ------------------------------ */

const css = readFileSync(join(process.cwd(), 'src', 'index.css'), 'utf8')

function tokens(): Map<string, string> {
  const theme = css.slice(css.indexOf('@theme'), css.indexOf('@layer base'))
  const map = new Map<string, string>()
  for (const match of theme.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
    map.set(match[1], match[2].trim())
  }
  return map
}

/** Luminância relativa (WCAG) a partir de #rrggbb ou oklch(L% C h). */
function luminance(value: string): number {
  const hex = /^#([0-9a-f]{6})$/i.exec(value)
  if (hex) {
    const [r, g, b] = [0, 2, 4].map((index) => {
      const channel = parseInt(hex[1].slice(index, index + 2), 16) / 255
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const oklch = /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value)
  if (!oklch) throw new Error(`cor não suportada no teste: ${value}`)
  const lightness = Number(oklch[1]) / 100
  const chroma = Number(oklch[2])
  const hue = (Number(oklch[3]) * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (n: number) => Math.min(1, Math.max(0, n))
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const blue = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return 0.2126 * r + 0.7152 * g + 0.0722 * blue
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground)
  const b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const WHITE = '#ffffff'

describe('Design System — tokens e contraste (WCAG AA)', () => {
  const colors = tokens()
  const color = (name: string) => {
    const value = colors.get(name)
    if (!value) throw new Error(`token ausente: --color-${name}`)
    return value
  }

  it('declara os grupos de tokens aprovados', () => {
    for (const name of [
      'brand-50', 'brand-600', 'brand-700', 'night-950', 'night-900', 'night-800',
      'night-ink', 'night-ink-muted', 'surface', 'surface-muted', 'line', 'ink',
      'ink-muted', 'ink-subtle', 'focus', 'focus-on-dark',
      ...Object.keys(INTEREST_LABELS).flatMap((c) => [`cat-${c}`, `cat-${c}-soft`]),
    ]) {
      expect(colors.has(name), `--color-${name}`).toBe(true)
    }
    for (const token of ['--radius-card', '--radius-control', '--shadow-card', '--shadow-float', '--spacing-section', '--ease-standard']) {
      expect(css).toContain(token)
    }
  })

  it.each([
    ['texto principal sobre superfície', 'ink', 'surface', 4.5],
    ['texto secundário sobre superfície', 'ink-muted', 'surface', 4.5],
    ['texto discreto sobre superfície', 'ink-subtle', 'surface', 4.5],
    ['texto secundário sobre superfície suave', 'ink-muted', 'surface-muted', 4.5],
    ['texto secundário sobre superfície rebaixada', 'ink-muted', 'surface-sunken', 4.5],
    ['texto principal sobre superfície suave', 'ink', 'surface-muted', 4.5],
    ['rótulo do botão suave', 'brand-700', 'brand-50', 4.5],
    ['texto claro sobre fundo noturno', 'night-ink', 'night-900', 4.5],
    ['texto claro sobre o degradê noturno (fim)', 'night-ink', 'night-800', 4.5],
    ['texto atenuado sobre fundo noturno', 'night-ink-muted', 'night-900', 4.5],
    ['texto atenuado sobre o degradê noturno (fim)', 'night-ink-muted', 'night-800', 4.5],
    ['destaque azul sobre fundo noturno', 'brand-300', 'night-900', 4.5],
    ['anel de foco sobre fundo claro', 'focus', 'surface', 3],
    ['anel de foco sobre fundo noturno', 'focus-on-dark', 'night-900', 3],
    ['limite do campo sobre superfície (componente de interface)', 'line-strong', 'surface', 1.2],
  ])('%s', (_label, foreground, background, minimum) => {
    expect(contrast(color(foreground), color(background))).toBeGreaterThanOrEqual(minimum)
  })

  it('texto branco sobre os azuis interativos (botão primário e etapa atual)', () => {
    expect(contrast(WHITE, color('brand-600'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(WHITE, color('brand-700'))).toBeGreaterThanOrEqual(4.5)
  })

  it('o azul interativo é distinguível do fundo noturno (elemento de interface, 3:1)', () => {
    expect(contrast(color('brand-600'), color('night-900'))).toBeGreaterThanOrEqual(3)
  })

  it.each(Object.keys(INTEREST_LABELS))('categoria %s: ícone/texto sobre o fundo suave', (category) => {
    expect(
      contrast(color(`cat-${category}`), color(`cat-${category}-soft`)),
    ).toBeGreaterThanOrEqual(4.5)
  })
})

describe('Design System — estilos globais', () => {
  it('respeita prefers-reduced-motion (sem rolagem suave nem transições longas)', () => {
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(block).toContain('scroll-behavior: auto')
    expect(block).toContain('transition-duration: 0.01ms !important')
    expect(block).toContain('animation-duration: 0.01ms !important')
  })

  it('define foco visível padrão e utilitários de foco', () => {
    expect(css).toMatch(/:where\([^)]*button[^)]*\):focus-visible/)
    expect(css).toContain('outline: 2px solid var(--color-focus)')
    expect(css).toContain('@utility focus-ring ')
    expect(css).toContain('@utility focus-ring-on-dark')
    expect(css).toContain('@utility bg-night-gradient')
  })
})

/* ------------------------------ componentes ------------------------------ */

describe('Button', () => {
  it('tem type="button" por padrão e respeita type="submit"', () => {
    render(
      <>
        <Button>Padrão</Button>
        <Button type="submit">Enviar</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Padrão' })).toHaveAttribute('type', 'button')
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'submit')
  })

  it('aplica variante, tamanho, largura e className extra', () => {
    render(
      <Button variant="soft" size="lg" width="full" className="mt-6">
        Selecionado
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Selecionado' })
    expect(button).toHaveClass('bg-brand-50', 'text-brand-700', 'px-6', 'py-3', 'w-full', 'mt-6', 'focus-ring')
  })

  it('respeita disabled e dispara onClick apenas quando habilitado', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <>
        <Button onClick={onClick}>Ativo</Button>
        <Button onClick={onClick} disabled>
          Inativo
        </Button>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Ativo' }))
    await user.click(screen.getByRole('button', { name: 'Inativo' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Inativo' })).toBeDisabled()
  })

  it('é focável por teclado e ativável com Enter e Espaço', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Ação</Button>)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Ação' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('buttonClasses gera as quatro variantes e as larguras', () => {
    expect(buttonClasses()).toContain('bg-brand-600')
    expect(buttonClasses({ variant: 'secondary' })).toContain('border-line-strong')
    expect(buttonClasses({ variant: 'onDark' })).toContain('focus-ring-on-dark')
    expect(buttonClasses({ width: 'responsive' })).toContain('w-full sm:w-auto')
    expect(buttonClasses({ width: 'auto' })).not.toContain('w-full')
  })
})

describe('Card', () => {
  it('variante clara: borda neutra quando não selecionado e destaque quando selecionado', () => {
    const { rerender } = render(<Card aria-label="Destino">conteúdo</Card>)
    const card = screen.getByRole('article', { name: 'Destino' })
    expect(card).toHaveClass('rounded-card', 'shadow-card', 'border-line')
    expect(card).not.toHaveClass('border-brand-600')
    rerender(
      <Card aria-label="Destino" selected>
        conteúdo
      </Card>,
    )
    expect(screen.getByRole('article', { name: 'Destino' })).toHaveClass('border-brand-600', 'ring-brand-100')
  })

  it('variante com mídia: imagem rente às bordas (sem padding) e recorte arredondado', () => {
    const classes = cardClasses({ variant: 'media' })
    expect(classes).toContain('overflow-hidden')
    expect(classes).toContain('rounded-card')
    expect(classes).not.toContain('p-6')
    expect(cardClasses({ variant: 'media', selected: true })).toContain('border-brand-600')
  })

  it('variante foto: fundo noturno, sombra flutuante e movimento reduzido', () => {
    const classes = cardClasses({ variant: 'photo' })
    expect(classes).toContain('bg-night-900')
    expect(classes).toContain('shadow-float')
    expect(classes).toContain('motion-reduce:transition-none')
    expect(classes).toContain('motion-reduce:hover:translate-y-0')
  })
})

describe('CategoryBadge', () => {
  const categories = Object.keys(INTEREST_LABELS) as InterestCategory[]

  it.each(categories)('chip de %s mostra rótulo e ícone decorativo', (category) => {
    const { container } = render(<CategoryBadge category={category} />)
    expect(screen.getByText(INTEREST_LABELS[category])).toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstElementChild).toHaveClass(CATEGORY_STYLES[category].tone.split(' ')[0])
  })

  it('cada categoria tem ícone e tom próprios', () => {
    const tones = new Set(categories.map((category) => CATEGORY_STYLES[category].tone))
    const icons = new Set(categories.map((category) => CATEGORY_STYLES[category].icon))
    expect(tones.size).toBe(categories.length)
    expect(icons.size).toBe(categories.length)
  })

  it('variante em bloco expõe o nome da categoria a leitores de tela', () => {
    render(<CategoryBadge category="cultura" variant="icon" />)
    expect(screen.getByRole('img', { name: 'Cultura' })).toBeInTheDocument()
  })

  it('variante em círculo pequeno expõe nome e dica de cada categoria', () => {
    render(<CategoryBadge category="aventura" variant="dot" />)
    const dot = screen.getByRole('img', { name: 'Aventura' })
    expect(dot).toHaveAttribute('title', 'Aventura')
    expect(dot).toHaveClass('h-6', 'w-6', 'rounded-full', 'bg-cat-aventura-soft')
  })
})

describe('SearchField', () => {
  function Controlled({ hideLabel = false }: { hideLabel?: boolean }) {
    const [value, setValue] = useState('')
    return (
      <SearchField
        label="Buscar destino"
        value={value}
        onChange={setValue}
        placeholder="Ex.: Lisboa"
        hideLabel={hideLabel}
      />
    )
  }

  it('associa o rótulo ao campo e mantém o nome acessível mesmo com rótulo oculto', () => {
    render(<Controlled hideLabel />)
    const input = screen.getByRole('searchbox', { name: 'Buscar destino' })
    expect(input).toHaveAttribute('placeholder', 'Ex.: Lisboa')
    expect(screen.getByText('Buscar destino')).toHaveClass('sr-only')
  })

  it('só oferece "Limpar pesquisa" com texto digitado; limpar devolve o foco ao campo', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    expect(screen.queryByRole('button', { name: 'Limpar pesquisa' })).toBeNull()

    const input = screen.getByRole('searchbox', { name: 'Buscar destino' })
    await user.type(input, 'Rio')
    expect(input).toHaveValue('Rio')

    await user.click(screen.getByRole('button', { name: 'Limpar pesquisa' }))
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Limpar pesquisa' })).toBeNull()
  })

  it('a ordem de tabulação é campo → limpar', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    await user.type(screen.getByRole('searchbox'), 'a')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Limpar pesquisa' })).toHaveFocus()
  })
})

describe('ProgressSteps', () => {
  const steps = [
    { id: 'destino', label: 'Destino' },
    { id: 'preferencias', label: 'Preferências' },
    { id: 'roteiro', label: 'Roteiro' },
  ]

  it('marca somente a etapa atual com aria-current e descreve o estado de cada etapa', () => {
    render(<ProgressSteps steps={steps} currentIndex={1} label="Progresso do planejamento" />)
    const list = screen.getByRole('list', { name: 'Progresso do planejamento' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).not.toHaveAttribute('aria-current')
    expect(items[1]).toHaveAttribute('aria-current', 'step')
    expect(items[2]).not.toHaveAttribute('aria-current')
    expect(items[0]).toHaveTextContent('Destino (concluída)')
    expect(items[1]).toHaveTextContent('Preferências (etapa atual)')
    expect(items[2]).toHaveTextContent('Roteiro (pendente)')
    // Etapa concluída exibe o ícone de confirmação; as demais, o número.
    expect(items[0].querySelector('svg')).not.toBeNull()
    expect(items[2]).toHaveTextContent('3')
  })

  it('ajusta índices fora do intervalo e não renderiza sem etapas', () => {
    const { rerender, container } = render(<ProgressSteps steps={steps} currentIndex={99} />)
    expect(screen.getAllByRole('listitem')[2]).toHaveAttribute('aria-current', 'step')
    rerender(<ProgressSteps steps={steps} currentIndex={-4} />)
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step')
    rerender(<ProgressSteps steps={steps} currentIndex={Number.NaN} />)
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step')
    rerender(<ProgressSteps steps={[]} currentIndex={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('sobre fundo escuro, etapas concluída e atual usam o azul com contraste AA para o número', () => {
    const { container } = render(<ProgressSteps steps={steps} currentIndex={1} tone="onDark" />)
    const circles = container.querySelectorAll('li > span:first-child')
    expect(circles[0]).toHaveClass('bg-brand-600', 'text-white')
    expect(circles[1]).toHaveClass('bg-brand-600', 'text-white')
    expect(circles[0].className).not.toContain('brand-500')
    expect(circles[2]).toHaveClass('text-night-ink-muted')
  })

  it('em telas pequenas só o rótulo da etapa atual fica visível (as demais continuam acessíveis)', () => {
    render(<ProgressSteps steps={steps} currentIndex={0} />)
    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByText(/Destino/).className).not.toContain('sr-only')
    expect(within(items[1]).getByText(/Preferências/).className).toContain('sr-only')
  })
})

describe('Adoção dos primitivos na home', () => {
  it('Hero usa as variantes de botão (primário e sobre fundo escuro) como links', () => {
    render(<Hero />)
    expect(screen.getByRole('link', { name: 'Planejar minha viagem' })).toHaveClass('bg-brand-600', 'px-6', 'sm:w-auto')
    expect(screen.getByRole('link', { name: 'Explorar destinos' })).toHaveClass('bg-night-900/80', 'ring-white/30', 'focus-ring-on-dark')
  })

  it('DestinationCard usa Card e Button e alterna a variante conforme a seleção', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const destination = destinations[0]
    const { rerender } = render(
      <DestinationCard destination={destination} selected={false} onSelect={onSelect} />,
    )
    const idle = screen.getByRole('button', { name: 'Selecionar destino' })
    expect(idle).toHaveClass('bg-brand-600', 'w-full')
    await user.click(idle)
    expect(onSelect).toHaveBeenCalledWith(destination.id)
    expect(screen.getByRole('article')).toHaveClass('border-line')

    rerender(<DestinationCard destination={destination} selected onSelect={onSelect} />)
    expect(screen.getByRole('button', { name: 'Destino selecionado' })).toHaveClass('bg-brand-50')
    expect(screen.getByRole('article')).toHaveClass('border-brand-600')
  })
})
