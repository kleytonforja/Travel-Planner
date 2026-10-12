import { Menu, Plane, X } from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '#planejar', label: 'Planejar' },
  { href: '#roteiros-salvos', label: 'Roteiros salvos' },
  { href: '#destinos', label: 'Destinos' },
  { href: '#como-funciona', label: 'Como funciona' },
] as const

interface HeaderProps {
  /** Ação ao clicar no logo (usado fora da página inicial, ex.: voltar). */
  onHomeClick?: () => void
  /** Oculta os links de âncora (usado em páginas sem as seções da home). */
  hideNav?: boolean
  /** "dark": cabeçalho integrado ao fundo azul-escuro da nova home. */
  tone?: 'light' | 'dark'
}

const TONES = {
  light: {
    header: 'border-b border-slate-200 bg-white/90 backdrop-blur',
    focus: 'focus-ring',
    brand: 'text-slate-900',
    link: 'text-slate-600 hover:bg-blue-50 hover:text-blue-700 focus-ring',
    toggle: 'text-slate-600 hover:bg-slate-100 focus-ring',
    mobile: 'border-t border-slate-200 bg-white',
    mobileLink: 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-ring',
  },
  dark: {
    header: 'border-b border-white/10 bg-night-950',
    focus: 'focus-ring-on-dark',
    brand: 'text-white',
    link: 'text-night-ink hover:bg-white/10 hover:text-white focus-ring-on-dark',
    toggle: 'text-night-ink hover:bg-white/10 focus-ring-on-dark',
    mobile: 'border-t border-white/10 bg-night-950',
    mobileLink: 'text-night-ink hover:bg-white/10 hover:text-white focus-ring-on-dark',
  },
} as const

/** Cabeçalho fixo com identidade do Travel Planner e navegação por âncoras. */
export function Header({ onHomeClick, hideNav = false, tone = 'light' }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const styles = TONES[tone]

  function handleLogoClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (onHomeClick) {
      event.preventDefault()
      onHomeClick()
    }
  }

  return (
    <header className={`sticky top-0 z-50 ${styles.header}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#inicio"
          onClick={handleLogoClick}
          className={`flex items-center gap-2 rounded-lg focus-visible:outline-offset-4 ${styles.focus}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Plane className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className={`text-lg font-bold tracking-tight ${styles.brand}`}>
            Travel Planner
          </span>
        </a>

        {!hideNav && (
          <nav aria-label="Navegação principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${styles.link}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {!hideNav && (
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-lg md:hidden ${styles.toggle}`}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {!hideNav && menuOpen && (
        <nav
          id="menu-mobile"
          aria-label="Navegação principal móvel"
          className={`md:hidden ${styles.mobile}`}
        >
          <ul className="space-y-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-base font-medium ${styles.mobileLink}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
