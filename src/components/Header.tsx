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
}

/** Cabeçalho fixo com identidade do Travel Planner e navegação por âncoras. */
export function Header({ onHomeClick, hideNav = false }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogoClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (onHomeClick) {
      event.preventDefault()
      onHomeClick()
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#inicio"
          onClick={handleLogoClick}
          className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Plane className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
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
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:hidden"
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
          className="border-t border-slate-200 bg-white md:hidden"
        >
          <ul className="space-y-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
