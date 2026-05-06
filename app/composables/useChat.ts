import { apiRoutes } from '~/config/api'

export interface ChatThread {
  id: string
  athlete_user_id: string
  trainer_user_id: string
  title?: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  thread_id: string
  sender_user_id: string
  body: string
  created_at: string
  sender_username?: string | null
  sender_photo_url?: string | null
}

export function useChat() {
  const api = useApi()
  const threads = ref<ChatThread[]>([])
  const activeThreadId = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)

  async function refreshThreads() {
    loading.value = true
    try {
      threads.value = await api<ChatThread[]>(apiRoutes.chat.threads).catch(() => [])
      if (!activeThreadId.value && threads.value.length > 0) {
        activeThreadId.value = threads.value[0]!.id
      }
    } finally {
      loading.value = false
    }
  }

  async function openThread(athleteUserId: string, trainerUserId: string, title?: string) {
    const thread = await api<ChatThread>(apiRoutes.chat.threads, {
      method: 'POST',
      body: {
        athlete_user_id: athleteUserId,
        trainer_user_id: trainerUserId,
        title: title?.trim() || undefined
      }
    })
    activeThreadId.value = thread.id
    await refreshThreads()
    await refreshMessages()
    return thread
  }

  async function refreshMessages() {
    if (!activeThreadId.value) {
      messages.value = []
      return
    }
    messages.value = await api<ChatMessage[]>(apiRoutes.chat.messages(activeThreadId.value)).catch(() => [])
  }

  async function sendMessage(body: string) {
    const threadId = activeThreadId.value
    if (!threadId || !body.trim()) return
    await api(apiRoutes.chat.messages(threadId), {
      method: 'POST',
      body: { body }
    })
    await refreshThreads()
    await refreshMessages()
  }

  async function updateThreadTitle(threadId: string, title: string) {
    await api(apiRoutes.chat.thread(threadId), {
      method: 'PATCH',
      body: { title: title.trim() || null }
    })
    await refreshThreads()
  }

  return {
    threads,
    activeThreadId,
    messages,
    loading,
    refreshThreads,
    openThread,
    refreshMessages,
    sendMessage,
    updateThreadTitle
  }
}
