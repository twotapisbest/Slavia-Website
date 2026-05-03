interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function usePwaInstall() {
  const installPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const installed = useState<boolean>('pwaInstalled', () => false)
  const supported = import.meta.client && typeof window !== 'undefined' && 'beforeinstallprompt' in window
  const canPrompt = computed(() => import.meta.client && supported && installPrompt.value !== null)

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
    installed
  }
}
