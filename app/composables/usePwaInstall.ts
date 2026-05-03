import { isPwaLoopbackHost } from '~/utils/pwaOrigin'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

/**
 * Chromium udostępnia instalację przez zdarzenie `beforeinstallprompt`,
 * ale nie dodaje go jako `window.beforeinstallprompt` — sprawdzanie `'beforeinstallprompt' in window`
 * jest więc zawsze fałszywe i myliło komunikaty dla Chrome/Android.
 *
 * Na localhost / 127.0.0.1 instalacja jest **dozwolona tylko w dev** (`import.meta.dev`),
 * żeby `nuxt build && preview` na pętli zwrotnej nie udawał produkcyjnego PWA.
 *
 * Na HTTPS (prawdziwa domena) — normalny flow PWA.
 */
function envAllowsBrowserInstallPrompt(): boolean {
  if (!import.meta.client || typeof window === 'undefined') {
    return false
  }
  try {
    const swOk = 'serviceWorker' in navigator && window.isSecureContext === true
    if (!swOk) {
      return false
    }
    if (isPwaLoopbackHost()) {
      return import.meta.dev === true
    }
    return true
  } catch {
    return false
  }
}

export function usePwaInstall() {
  const installPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const installed = useState<boolean>('pwaInstalled', () => false)

  /** Localhost bez trybu dev — nie pokazujemy „instalowalnego” PWA (plugin nie rejestruje SW). */
  const loopbackWithoutDev = computed(
    () => import.meta.client && isPwaLoopbackHost() && !import.meta.dev
  )

  /** Czy przeglądarka *może* zaproponować instalację (HTTPS / localhost+dev + SW). Nie znaczy, że zdarzenie już przyszło — patrz `canPrompt`. */
  const supported = computed(() => envAllowsBrowserInstallPrompt())

  const canPrompt = computed(
    () => import.meta.client && supported.value && installPrompt.value !== null
  )

  function handleBeforeInstallPrompt(event: Event) {
    if (!import.meta.client) return
    event.preventDefault()
    installPrompt.value = event as BeforeInstallPromptEvent
  }

  async function promptInstall() {
    if (!import.meta.client || !installPrompt.value) return false
    try {
      await installPrompt.value.prompt()
      const choice = await installPrompt.value.userChoice
      if (choice.outcome === 'accepted') {
        installed.value = true
      }
      installPrompt.value = null
      return choice.outcome === 'accepted'
    } catch {
      return false
    }
  }

  onMounted(() => {
    if (!import.meta.client) return
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', () => {
      installed.value = true
      installPrompt.value = null
    })
  })

  onBeforeUnmount(() => {
    if (!import.meta.client) return
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  })

  return {
    supported,
    canPrompt,
    promptInstall,
    installed,
    loopbackWithoutDev
  }
}
