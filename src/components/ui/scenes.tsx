import { useId } from 'react'

/**
 * Ilustrações vetoriais ORIGINAIS do projeto (sem fotografias de terceiros).
 *
 * Origem e licença: desenhadas para este projeto, sem imagens externas,
 * sem recursos de rede e sem direitos de terceiros. São substitutas
 * declaradas das fotografias da referência visual: fotografias reais só
 * entram com origem e licença identificáveis (ver PROJECT.md e TASKS.md).
 */

/** Panorama de baía ao pôr do sol para o fundo do hero (decorativo). */
export function HeroScene() {
  const id = useId()
  const sky = `${id}-sky`
  const sea = `${id}-sea`
  const glow = `${id}-glow`
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12275a" />
          <stop offset="0.4" stopColor="#6a4a8c" />
          <stop offset="0.68" stopColor="#f08a54" />
          <stop offset="1" stopColor="#ffc36b" />
        </linearGradient>
        <linearGradient id={sea} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a6aa8" />
          <stop offset="1" stopColor="#0e2149" />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe3b0" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffb86b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${sky})`} />
      <circle cx="1180" cy="560" r="230" fill={`url(#${glow})`} />
      <circle cx="1180" cy="560" r="84" fill="#ffe3b0" />
      <path d="M0 640 L180 540 L330 600 L520 490 L700 600 L900 560 L1100 620 L1300 500 L1600 610 L1600 710 L0 710Z" fill="#4a2f73" opacity="0.85" />
      <path d="M1240 710 C1290 540 1380 450 1470 460 C1540 470 1590 570 1600 710Z" fill="#2a1850" />
      <path d="M1030 710 C1060 610 1120 555 1190 575 C1240 590 1270 650 1290 710Z" fill="#35205f" />
      <rect y="700" width="1600" height="200" fill={`url(#${sea})`} />
      <path d="M1120 735 H1420 M1160 762 H1380 M1200 790 H1340" stroke="#ffd9a0" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
      <path d="M0 800 C300 750 600 810 900 780 C1200 750 1400 810 1600 780 L1600 900 L0 900Z" fill="#071027" opacity="0.85" />
    </svg>
  )
}

interface SceneProps {
  destinationId: string
  /** Nome do destino, usado no texto alternativo. */
  name: string
}

/** Ilustração original de cada destino (substitui a fotografia, ainda indisponível). */
export function DestinationScene({ destinationId, name }: SceneProps) {
  const id = useId()
  const sky = `${id}-sky`
  const palette: Record<string, [string, string, string]> = {
    florianopolis: ['#4aa8e8', '#bfe6f7', '#18a0a8'],
    'rio-de-janeiro': ['#6b4a9a', '#f0955a', '#1f4f8a'],
    lisboa: ['#f4a259', '#fde2b3', '#2b6cb0'],
  }
  const [top, bottom, water] = palette[destinationId] ?? ['#4a6fa5', '#cfe0f5', '#1f4f8a']

  return (
    <svg
      viewBox="0 0 400 225"
      role="img"
      aria-label={`Ilustração de ${name}`}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill={`url(#${sky})`} />
      {destinationId === 'florianopolis' && (
        <>
          <circle cx="320" cy="55" r="22" fill="#fff6d6" opacity="0.9" />
          <rect y="150" width="400" height="75" fill={water} />
          <path d="M0 150 C80 135 150 150 400 140 L400 150Z" fill="#e8d9a8" />
          <path d="M40 150 V92 M360 150 V92 M40 92 Q200 140 360 92 M90 150 V108 M150 150 V120 M250 150 V120 M310 150 V108" stroke="#c0392b" strokeWidth="3" fill="none" />
          <path d="M40 120 H360" stroke="#c0392b" strokeWidth="3" />
        </>
      )}
      {destinationId === 'rio-de-janeiro' && (
        <>
          <circle cx="90" cy="70" r="20" fill="#ffd9a0" opacity="0.9" />
          <path d="M0 150 L70 120 L130 135 L200 60 C230 50 260 70 270 110 L330 100 L400 140 V160 H0Z" fill="#2c1f4d" />
          <path d="M250 150 C260 100 290 85 320 95 C350 105 365 130 370 150Z" fill="#1d1538" />
          <rect y="150" width="400" height="75" fill={water} />
          <path d="M60 175 H180 M90 195 H150" stroke="#ffd9a0" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {destinationId === 'lisboa' && (
        <>
          <rect x="0" y="95" width="70" height="130" fill="#e07a5f" />
          <rect x="70" y="80" width="60" height="145" fill="#f2cc8f" />
          <rect x="130" y="105" width="70" height="120" fill="#81b29a" />
          <rect x="285" y="85" width="60" height="140" fill="#f4a261" />
          <rect x="345" y="100" width="55" height="125" fill="#e9c46a" />
          <path d="M0 95 L35 70 L70 95Z M130 105 L165 85 L200 105Z M285 85 L315 62 L345 85Z" fill="#9c4f3b" />
          <rect y="190" width="400" height="35" fill="#3d405b" />
          <rect x="165" y="150" width="120" height="42" rx="8" fill="#f2b705" />
          <rect x="178" y="158" width="24" height="16" fill="#fff6d6" />
          <rect x="212" y="158" width="24" height="16" fill="#fff6d6" />
          <rect x="246" y="158" width="24" height="16" fill="#fff6d6" />
          <circle cx="190" cy="196" r="7" fill="#22223b" />
          <circle cx="262" cy="196" r="7" fill="#22223b" />
        </>
      )}
    </svg>
  )
}
