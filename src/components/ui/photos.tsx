import { useState } from 'react'

import { HERO_FALLBACK_PHOTO } from '../../data/heroPhotos'
import { DESTINATION_PHOTOS } from '../../data/photos'
import { reportHeroPhotoFailure } from '../../utils/heroPhoto'
import { useHeroPhoto } from '../../utils/useHeroPhoto'
import { DestinationScene, HeroScene } from './scenes'

/**
 * Fotografia do hero: a escolhida para esta visita (`src/utils/heroPhoto.ts`), priorizada no carregamento
 * (só ela é baixada), com dimensões declaradas (sem deslocamento de layout). Se falhar, entra a fotografia
 * anterior da Hero como substituta técnica e, se esta também falhar, a ilustração original.
 */
export function HeroPhoto() {
  const photo = useHeroPhoto()
  const [sceneOnly, setSceneOnly] = useState(false)
  if (sceneOnly) return <HeroScene />
  return (
    <img
      key={photo.id}
      src={photo.large}
      srcSet={`${photo.small} ${photo.smallWidth}w, ${photo.large} ${photo.largeWidth}w`}
      sizes="100vw"
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      fetchPriority="high"
      decoding="async"
      onError={() => (photo.id === HERO_FALLBACK_PHOTO.id ? setSceneOnly(true) : reportHeroPhotoFailure())}
      style={{ objectPosition: photo.objectPosition }}
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}

interface DestinationPhotoImageProps {
  destinationId: string
  name: string
  /** Foto visível na primeira tela (ex.: cabeçalho da Revisão): carrega sem espera, sem `loading="lazy"`. */
  eager?: boolean
}

/**
 * Fotografia de um destino: carregamento preguiçoso, proporção fixa e, na
 * ausência da foto ou se o carregamento falhar, a ilustração original.
 */
export function DestinationPhotoImage({ destinationId, name, eager = false }: DestinationPhotoImageProps) {
  const [failed, setFailed] = useState(false)
  const photo = DESTINATION_PHOTOS[destinationId]
  if (!photo || failed) {
    return <DestinationScene destinationId={destinationId} name={name} />
  }
  return (
    <img
      src={photo.large}
      srcSet={`${photo.small} ${photo.smallWidth}w, ${photo.large} ${photo.largeWidth}w`}
      sizes="(min-width: 1024px) 360px, (min-width: 768px) 46vw, 92vw"
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  )
}
