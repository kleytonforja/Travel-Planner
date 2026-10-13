import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plane } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SelectableCard, SelectableRadioCard } from '../components/ui/SelectableCard'

/** Variantes do card selecionável (M4.2): padrão preservado, compacta e rádio. */
describe('SelectableCard — variante padrão preservada', () => {
  it('mantém a altura, o ícone, o texto e o check do padrão anterior', () => {
    render(<SelectableCard label="Avião" description="Voo" icon={Plane} selected onClick={vi.fn()} />)
    const card = screen.getByRole('button', { name: /Avião/ })
    expect(card).toHaveClass('min-h-14', 'p-4', 'pr-11', 'rounded-card-lg', 'border-2', 'border-brand-600', 'bg-brand-100')
    expect(screen.getByTestId('selected-check')).toHaveClass('h-6', 'w-6', 'right-3', 'top-3')
    expect(screen.getByText('Avião')).toHaveClass('text-base')
    expect(screen.getByText('Voo')).toHaveClass('text-sm')
  })
})

describe('SelectableCard — variante compacta', () => {
  it('tem ~56 px, ícone e texto compactos e alvo de toque de 44 px ou mais', () => {
    render(<SelectableCard density="compact" label="Casal" description="Viagem a dois." icon={Plane} selected={false} onClick={vi.fn()} />)
    const card = screen.getByRole('button', { name: /Casal/ })
    expect(card).toHaveClass('min-h-14') // 56 px
    expect(card).toHaveClass('py-2', 'pl-2.5', 'pr-9')
    expect(screen.getByText('Casal')).toHaveClass('text-sm') // 14 px: legível
    // A descrição só aparece visualmente a partir de 640 px, mas segue disponível a leitores de tela.
    const description = screen.getByText('Viagem a dois.')
    expect(description).toHaveClass('sr-only', 'sm:not-sr-only')
    expect(card).toHaveAccessibleName(/Casal/)
    expect(card).toHaveAccessibleName(/Viagem a dois\./)
  })

  it('selecionado: fundo azul-claro, borda azul de 2 px, check no canto superior direito e aria-pressed', () => {
    render(<SelectableCard density="compact" label="Casal" icon={Plane} selected onClick={vi.fn()} />)
    const card = screen.getByRole('button', { name: 'Casal' })
    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(card).toHaveClass('border-2', 'border-brand-600', 'bg-brand-100', 'shadow-card-hover')
    const check = screen.getByTestId('selected-check')
    expect(check).toHaveAttribute('aria-hidden', 'true')
    expect(check).toHaveClass('right-2', 'top-2')
    expect(card).toHaveAccessibleName('Casal') // o check não entra no nome
  })

  it('não selecionado: fundo branco, borda neutra, sem check; foco visível em ambos os estados', () => {
    const { rerender } = render(<SelectableCard density="compact" label="Casal" icon={Plane} selected={false} onClick={vi.fn()} />)
    const idle = screen.getByRole('button', { name: 'Casal' })
    expect(idle).toHaveClass('border-line-strong', 'bg-surface', 'focus-ring-on-dark')
    expect(screen.queryByTestId('selected-check')).toBeNull()
    rerender(<SelectableCard density="compact" label="Casal" icon={Plane} selected onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Casal' })).toHaveClass('focus-ring-on-dark')
  })

  it('funciona por teclado (Enter e Espaço) e por clique', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<SelectableCard density="compact" label="Casal" icon={Plane} selected={false} onClick={onClick} />)
    await user.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(3)
  })
})

describe('SelectableRadioCard', () => {
  function Group() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <fieldset>
        <legend>Escolha</legend>
        {['a', 'b', 'c'].map((id) => (
          <SelectableRadioCard
            key={id}
            name="grupo"
            value={id}
            label={`Opção ${id}`}
            description={`Descrição ${id}`}
            icon={Plane}
            selected={value === id}
            onSelect={() => setValue(id)}
          />
        ))}
      </fieldset>
    )
  }

  it('mantém a semântica de radio: escolha única, setas e checked', async () => {
    const user = userEvent.setup()
    render(<Group />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    radios.forEach((radio) => expect(radio).not.toBeChecked())
    expect(screen.queryByTestId('selected-check')).toBeNull()
    await user.click(screen.getByRole('radio', { name: /Opção a/ }))
    expect(screen.getByRole('radio', { name: /Opção a/ })).toBeChecked()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: /Opção b/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Opção a/ })).not.toBeChecked()
    expect(screen.getAllByTestId('selected-check')).toHaveLength(1)
  })

  it('o visual selecionado é igual ao do SelectableCard e o anel de foco aparece com o teclado', async () => {
    const user = userEvent.setup()
    render(<Group />)
    await user.tab()
    const first = screen.getAllByRole('radio')[0]
    expect(first).toHaveFocus()
    const visual = first.nextElementSibling as HTMLElement
    expect(visual).toHaveClass('peer-focus-visible:outline-2')
    await user.keyboard(' ')
    expect(visual).toHaveClass('border-2', 'border-brand-600', 'bg-brand-100', 'shadow-card-hover')
    expect(within(visual).getByTestId('selected-check')).toHaveClass('right-3', 'top-3')
    expect(first).toHaveAccessibleName(/Opção a/)
  })
})
