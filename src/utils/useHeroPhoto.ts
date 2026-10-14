import { useSyncExternalStore } from 'react'

import type { HeroPhotoEntry } from '../data/heroPhotos'
import { getCurrentHeroPhoto, subscribeHeroPhoto } from './heroPhoto'

/** Fotografia da Hero desta visita (M7.2); troca para a substituta técnica se a escolhida falhar. */
export function useHeroPhoto(): HeroPhotoEntry {
  return useSyncExternalStore(subscribeHeroPhoto, getCurrentHeroPhoto, getCurrentHeroPhoto)
}
