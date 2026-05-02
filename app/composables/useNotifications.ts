export interface ClubNotification {
  id: string
  kind: string
  title: string
  body: string
  payload?: string | null
  created_at: string
}

export function useNotifications () {
  const auth = useAuth()
  const api = useApi()

  const items = ref<ClubNotification[]>([])
  const loading = ref(false)

  async function refresh () {
    if (!auth.isLoggedIn.value) return
    loading.value = true
    try {
      items.value = await api<ClubNotification[]>('/api/notifications')
    } finally {
      loading.value = false
    }
  }

  async function remove (id: string) {
    await api(`/api/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' })
    items.value = items.value.filter(i => i.id !== id)
  }

  function clearLocal () {
    items.value = []
  }

  return { items, loading, refresh, remove, clearLocal }
}
