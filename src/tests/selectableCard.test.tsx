import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plane } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { SelectableCard } from '../components/ui/SelectableCard'

describe('SelectableCard', () => {
  it('não selecionado: fundo branco, borda neutra, sem check', () => {
    render(<SelectableCard label="Avião" icon={Plane} selected={false} onClick={vi.fn()} />)
    const card = screen.getByRole('button', { name: 'Avião' })
    expect(card).toHaveAttribute('aria-pressed', 'false')
    expect(card).toHaveClass('bg-surface', 'border-2', 'border-line-strong')
    expect(card).not.toHaveClass('border-brand-600')
    expect(screen.queryByTestId('selected-check')).toBeNull()
  })

  it('selecionado: azul-claro, borda azul de 2 px, sombra e check decorativo', () => {
    render(<SelectableCard label="Avião" icon={Plane} selected onClick={vi.fn()} />)
    const card = screen.getByRole('button', { name: 'Avião' })
    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(card).toHaveClass('border-2', 'border-brand-600', 'bg-brand-100', 'shadow-card-hover')
    const check = screen.getByTestId('selected-check')
    expect(check).toHaveAttribute('aria-hidden', 'true')
    expect(check).toHaveClass('right-3', 'top-3')
    // O check não altera o nome acessível.
    expect(card).toHaveAccessibleName('Avião')
  })

  it('o anel de foco existe nos dois estados e o teclado aciona o card', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<SelectableCard label="Trem" icon={Plane} selected={false} onClick={onClick} />)
    expect(screen.getByRole('button')).toHaveClass('focus-ring-on-dark')
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
    rerender(<SelectableCard label="Trem" icon={Plane} selected onClick={onClick} />)
    expect(screen.getByRole('button')).toHaveClass('focus-ring-on-dark')
  })

  it('mostra a descrição quando informada', () => {
    render(<SelectableCard label="Casal" description="Viagem a dois." icon={Plane} selected={false} onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Casal/ })).toHaveTextContent('Viagem a dois.')
  })
})
