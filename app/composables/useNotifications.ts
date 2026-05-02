import { apiRoutes } from '~/config/api'
import type { ClubNotification } from '~/types/notifications'

export type { ClubNotification } from '~/types/notifications'

export function useNotifications() {
  const auth = useAuth()
  const api = useApi()

  const items = ref<ClubNotification[]>([])
  const loading = ref(false)

  async function refresh() {
    if (!auth.isLoggedIn.value) return
    loading.value = true
    try {
      items.value = await api<ClubNotification[]>(apiRoutes.notifications.collection)
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    await api(apiRoutes.notifications.one(id), { method: 'DELETE' })
    items.value = items.value.filter(i => i.id !== id)
  }

  function clearLocal() {
    items.value = []
  }

  return { items, loading, refresh, remove, clearLocal }
}
