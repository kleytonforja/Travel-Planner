import { useState } from 'react'

import { DESTINATION_PHOTOS, HERO_PHOTO } from '../../data/photos'
import { DestinationScene, HeroScene } from './scenes'

/**
 * Fotografia do hero: priorizada no carregamento, com dimensões declaradas
 * (sem deslocamento de layout) e, se falhar, a ilustração original como
 * substituta.
 */
export function HeroPhoto() {
  const [failed, setFailed] = useState(false)
  if (failed) return <HeroScene />
  const photo = HERO_PHOTO
  return (
    <img
      src={photo.large}
      srcSet={`${photo.small} ${photo.smallWidth}w, ${photo.large} ${photo.largeWidth}w`}
      sizes="100vw"
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      fetchPriority="high"
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover object-[60%_40%]"
    />
  )
}

interface DestinationPhotoImageProps {
  destinationId: string
  name: string
}

/**
 * Fotografia de um destino: carregamento preguiçoso, proporção fixa e, na
 * ausência da foto ou se o carregamento falhar, a ilustração original.
 */
export function DestinationPhotoImage({ destinationId, name }: DestinationPhotoImageProps) {
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
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  )
}
