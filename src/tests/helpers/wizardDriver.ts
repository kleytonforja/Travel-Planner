import { screen, within } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'

/**
 * Conduz o planejamento progressivo pela interface, da home até a revisão.
 * Serve aos testes que antes preenchiam o formulário tradicional (removido no
 * V1-T3.8) e precisam apenas chegar a um roteiro gerado.
 */
export interface WizardOptions {
  destination?: string
  /** Duração em dias (digitada no campo "Outra duração"). */
  days?: number
  /** Rótulos dos interesses (ex.: 'Cultura'). */
  interests?: string[]
  /** Rótulo do estilo (ex.: 'Econômico'); o padrão do fluxo é Equilibrado. */
  style?: string
  /** Orçamento por pessoa, em texto (ex.: '100'); `null` = não informar orçamento. */
  budgetPerPerson?: string | null
  /** Rótulo do ritmo (ex.: 'Tranquilo'); o padrão do fluxo é Equilibrado. */
  pace?: string
}

export async function driveWizardToReview(
  user: ReturnType<typeof userEvent.setup>,
  { destination = 'Florianópolis', days = 3, interests = ['Cultura'], style, budgetPerPerson = '500', pace }: WizardOptions = {},
) {
  await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
  const card = (await screen.findByRole('heading', { name: destination })).closest('article') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Selecionar destino' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
  await user.click(screen.getByRole('radio', { name: /Ainda não defini as datas/ }))
  await user.type(screen.getByLabelText('Outra duração (dias)'), String(days))
  await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Interesses' }))
  for (const interest of interests) {
    await user.click(screen.getByRole('button', { name: new RegExp(`^${interest}`) }))
  }
  if (pace) await user.click(screen.getByRole('button', { name: new RegExp(`^${pace}`) }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Orçamento' }))
  if (style) await user.click(screen.getByRole('button', { name: new RegExp(`^${style}`) }))
  if (budgetPerPerson !== null) {
    await user.click(screen.getByRole('button', { name: /^Informar um valor/ }))
    await user.click(screen.getByRole('button', { name: /^Valor por pessoa/ }))
    await user.type(screen.getByLabelText(/^Valor por pessoa/), budgetPerPerson)
  }
  await user.click(screen.getByRole('button', { name: 'Continuar para Revisão' }))
  await screen.findByRole('heading', { name: 'Sua viagem está quase pronta!' })
}
