import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ItineraryDayCard } from '../components/ItineraryDayCard'
import { destinations } from '../data/destinations'
import type { ItineraryDay } from '../types'

const [first, second] = destinations[0].activities.filter((item) => ['fln-noite-lagoa', 'fln-passeio-escuna'].includes(item.id))

const day: ItineraryDay = {
  dayNumber: 2,
  activities: [
    { activity: first, period: 'manha', startMinutes: 540, endMinutes: 540 + first.durationHours * 60 },
    { activity: second, period: 'tarde', startMinutes: 840, endMinutes: 840 + second.durationHours * 60 },
  ],
}

describe('Card da atração do roteiro diário (M5.1)', () => {
  it('mostra horário, nome, descrição, categorias, duração e custo ilustrativo de cada atração, na ordem', () => {
    render(<ItineraryDayCard day={day} currency={destinations[0].currency} />)
    const items = screen.getAllByRole('heading', { level: 4 })
    expect(items.map((item) => item.textContent)).toEqual([first.name, second.name])
    const card = items[0].closest('li') as HTMLElement
    expect(card).toHaveTextContent('09:00')
    expect(card).toHaveTextContent(first.description)
    expect(card).toHaveTextContent(/Duração:/)
    expect(card).toHaveTextContent(/Custo ilustrativo:/)
    expect(screen.getByText(/2 atividades · .* \(ilustrativo\)/)).toBeInTheDocument()
  })

  it('reserva a área visual com placeholder: sem imagem, nada de foto genérica', () => {
    const { container } = render(<ItineraryDayCard day={day} currency={destinations[0].currency} />)
    const media = screen.getAllByTestId('activity-media')
    expect(media).toHaveLength(2)
    media.forEach((area) => {
      expect(area).toHaveAttribute('aria-hidden', 'true')
      expect(within(area).queryByRole('img')).toBeNull()
    })
    expect(container.querySelector('img')).toBeNull()
  })

  it('dia sem atividades mostra o aviso de dia livre', () => {
    render(<ItineraryDayCard day={{ dayNumber: 3, activities: [] }} currency={destinations[0].currency} />)
    expect(screen.getByText('Sem atividades sugeridas')).toBeInTheDocument()
    expect(screen.getByText(/Dia livre/)).toBeInTheDocument()
  })
})
