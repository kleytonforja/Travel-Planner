import { Clock, Wallet } from 'lucide-react'
import { useState } from 'react'

import { ACTIVITY_PHOTOS } from '../data/activityPhotos'
import { INTEREST_LABELS, PERIOD_LABELS } from '../data/labels'
import type { Currency, ScheduledActivity, ScheduledPeriod } from '../types'
import { formatCurrency, formatDuration, formatMinutesToTime } from '../utils/format'
import { CATEGORY_STYLES } from './ui/variants'

interface ActivityCardProps {
  item: ScheduledActivity
  currency: Currency
}

const PERIOD_TEXT_CLASS: Record<ScheduledPeriod, string> = {
  manha: 'text-amber-700',
  tarde: 'text-sky-700',
  noite: 'text-indigo-700',
}

/**
 * Atração do roteiro diário (modelo "Híbrido Travel Planner", M5.1): horário à esquerda, área visual
 * reservada, nome em destaque, descrição objetiva e metadados (categorias, duração e custo ilustrativo).
 *
 * A área visual mostra a fotografia real da atração quando há uma em `ACTIVITY_PHOTOS` (M5.3); sem foto,
 * ou se ela falhar ao carregar, mostra um placeholder discreto — um bloco com o ícone da categoria
 * principal —, nunca uma imagem genérica apresentada como fotografia da atração. O espaço tem tamanho
 * fixo nos dois casos, então a altura do cartão não muda.
 */
export function ActivityCard({ item, currency }: ActivityCardProps) {
  const { activity } = item
  const main = CATEGORY_STYLES[activity.categories[0]]
  const MainIcon = main.icon
  const photo = ACTIVITY_PHOTOS[activity.id]
  const [photoFailed, setPhotoFailed] = useState(false)
  const showPhoto = photo !== undefined && !photoFailed

  return (
    <li className="grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[4rem_5rem_1fr] sm:gap-x-4 sm:px-5">
      <div className="col-start-2 row-start-1 flex flex-wrap items-baseline gap-x-2 sm:col-start-1 sm:block sm:pt-0.5 sm:text-center">
        <p className="text-sm font-bold leading-tight text-slate-900">
          {formatMinutesToTime(item.startMinutes)}
        </p>
        <p className="text-xs text-slate-600">
          <span className="sm:sr-only">–&nbsp;</span>
          <span className="sr-only">até </span>
          {formatMinutesToTime(item.endMinutes)}
        </p>
        <p className={`text-[11px] font-medium leading-tight sm:mt-1 ${PERIOD_TEXT_CLASS[item.period]}`}>
          {PERIOD_LABELS[item.period]}
        </p>
      </div>

      {/* Área visual de tamanho fixo: fotografia real (M5.3) ou placeholder discreto, sem imagem genérica. */}
      <div
        data-testid="activity-media"
        {...(showPhoto ? {} : { 'aria-hidden': true })}
        className={`col-start-1 row-span-2 row-start-1 flex h-14 w-14 items-center justify-center self-start overflow-hidden rounded-card sm:col-start-2 sm:row-span-1 sm:h-20 sm:w-20 ${showPhoto ? 'bg-slate-100' : main.tone}`}
      >
        {showPhoto ? (
          <img
            src={photo.small}
            srcSet={`${photo.small} ${photo.smallWidth}w, ${photo.large} ${photo.largeWidth}w`}
            sizes="(min-width: 640px) 80px, 56px"
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <MainIcon className="h-6 w-6 opacity-70 sm:h-7 sm:w-7" />
        )}
      </div>

      <div className="col-start-2 row-start-2 min-w-0 sm:col-start-3 sm:row-span-1 sm:row-start-1">
        <h4 className="text-sm font-bold leading-snug text-slate-900 sm:text-base">{activity.name}</h4>
        <p className="mt-0.5 text-sm leading-snug text-slate-700">{activity.description}</p>

        <ul className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {activity.categories.map((category) => {
            const style = CATEGORY_STYLES[category]
            const Icon = style.icon
            return (
              <li
                key={category}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${style.tone}`}
              >
                <Icon className="h-3 w-3" aria-hidden="true" />
                {INTEREST_LABELS[category]}
              </li>
            )
          })}
          <li className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Duração: </span>
            {formatDuration(activity.durationHours)}
          </li>
          <li className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
            <Wallet className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Custo ilustrativo: </span>
            {activity.estimatedCost === 0 ? 'gratuita' : formatCurrency(activity.estimatedCost, currency)}
          </li>
        </ul>
      </div>
    </li>
  )
}
