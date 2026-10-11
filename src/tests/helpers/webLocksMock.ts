/**
 * Mock da API Web Locks para os testes de persistência.
 *
 * As mutações do serviço de armazenamento exigem o lock exclusivo
 * `travel-planner:storage:v1` (sem fallback de escrita sem coordenação).
 * O jsdom não implementa `navigator.locks`, então os testes instalam um
 * gerenciador em memória que:
 *
 * - serializa as operações por nome de lock (FIFO), como a API real;
 * - detecta execução concorrente indevida dentro do lock.
 */

type LockCallback<T> = () => T | Promise<T>

interface NavigatorWithLocks {
  locks?: { request: <T>(name: string, callback: LockCallback<T>) => Promise<T> }
}

/**
 * Instala um `navigator.locks` que executa as operações serializadas por
 * nome de lock, na ordem de chegada.
 */
export function installWebLocksMock(): void {
  const queues = new Map<string, Promise<void>>()
  let running = 0

  const request = async <T>(
    name: string,
    callback: LockCallback<T>,
  ): Promise<T> => {
    const previous = queues.get(name) ?? Promise.resolve()
    let release!: () => void
    const current = new Promise<void>((resolve) => {
      release = resolve
    })
    queues.set(name, previous.then(() => current))
    await previous
    if (running > 0) {
      release()
      throw new Error('Web Locks mock: execução concorrente dentro do lock')
    }
    running += 1
    try {
      return await callback()
    } finally {
      running -= 1
      release()
    }
  }

  Object.defineProperty(window.navigator, 'locks', {
    configurable: true,
    value: { request },
  })
}

/** Instala um `navigator.locks` cuja aquisição sempre falha. */
export function installFailingWebLocksMock(): void {
  Object.defineProperty(window.navigator, 'locks', {
    configurable: true,
    value: {
      request: () =>
        Promise.reject(new DOMException('aquisição abortada', 'AbortError')),
    },
  })
}

/** Remove o mock, deixando a API indisponível (como em navegadores sem Web Locks). */
export function uninstallWebLocksMock(): void {
  const nav = window.navigator as NavigatorWithLocks
  if ('locks' in nav) {
    delete nav.locks
  }
}
