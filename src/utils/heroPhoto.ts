import { HERO_FALLBACK_PHOTO, HERO_PHOTOS, type HeroPhotoEntry } from '../data/heroPhotos'

/** Chave (própria) com o identificador da última fotografia exibida na Hero. Só uma conveniência: o app não depende dela. */
export const HERO_LAST_KEY = 'travel-planner:hero-last'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null // acesso ao armazenamento bloqueado
  }
}

/** Lê o último identificador; qualquer falha (bloqueio, modo privado, valor inválido) vira `null`. */
export function readLastHeroId(storage: StorageLike | null = browserStorage()): string | null {
  try {
    return storage?.getItem(HERO_LAST_KEY) ?? null
  } catch {
    return null
  }
}

/** Registra o identificador exibido; falhas são ignoradas. */
export function writeLastHeroId(id: string, storage: StorageLike | null = browserStorage()): void {
  try {
    storage?.setItem(HERO_LAST_KEY, id)
  } catch {
    // sem armazenamento: a próxima visita apenas sorteia entre todas
  }
}

/**
 * Escolhe uma fotografia, evitando repetir `lastId` quando houver outra opção. `random` devolve um valor em [0, 1)
 * (injetável nos testes).
 */
export function pickHeroPhoto(
  photos: readonly HeroPhotoEntry[],
  lastId: string | null,
  random: () => number = Math.random,
): HeroPhotoEntry {
  if (photos.length === 0) return HERO_FALLBACK_PHOTO
  const candidates = photos.length > 1 ? photos.filter((photo) => photo.id !== lastId) : photos
  const pool = candidates.length > 0 ? candidates : photos
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))
  return pool[index]
}

// Fotografia da visita atual: escolhida na primeira leitura após o carregamento da página e mantida durante toda a
// navegação (home ↔ planejamento ↔ roteiro). Só a próxima visita (novo carregamento) sorteia de novo.
let current: HeroPhotoEntry | null = null
const listeners = new Set<() => void>()

export function getCurrentHeroPhoto(): HeroPhotoEntry {
  if (current === null) {
    current = pickHeroPhoto(HERO_PHOTOS, readLastHeroId())
    writeLastHeroId(current.id)
  }
  return current
}

/** A fotografia escolhida não carregou: troca para a substituta técnica (os créditos acompanham a troca). */
export function reportHeroPhotoFailure(): void {
  if (current === null || current.id === HERO_FALLBACK_PHOTO.id) return
  current = HERO_FALLBACK_PHOTO
  for (const listener of listeners) listener()
}

export function subscribeHeroPhoto(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Somente para testes: esquece a escolha atual, como numa nova visita. */
export function resetHeroPhotoForTests(): void {
  current = null
}
