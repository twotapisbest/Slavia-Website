<script setup lang="ts">
import type { Athlete } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Czat trener–zawodnik',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const api = useApi()
const toast = useToast()
const chat = useChat()

const messageDraft = ref('')
const selectedAthleteId = ref('')
const messagesContainerRef = ref<HTMLElement | null>(null)
const newThreadTitle = ref('')
const threadTitleDraft = ref('')

const { data: athleteCandidates } = await useAsyncData('chat-athlete-candidates', async (): Promise<Athlete[]> => {
  if (!auth.isTrainer.value && !auth.isAdmin.value && !auth.isSuperAdmin.value) return []
  return api<Athlete[]>('/api/athletes/admin').catch(() => [])
})

onMounted(async () => {
  await chat.refreshThreads()
  await chat.refreshMessages()
})

watch(() => chat.activeThreadId.value, async () => {
  await chat.refreshMessages()
  const active = chat.threads.value.find(t => t.id === chat.activeThreadId.value)
  threadTitleDraft.value = active?.title || ''
})

watch(
  () => chat.messages.value.length,
  async () => {
    await nextTick()
    const el = messagesContainerRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
  }
)

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

function userInitials(username?: string | null) {
  const v = (username || '').trim()
  if (!v) return 'U'
  return v.slice(0, 2).toUpperCase()
}

async function openThreadWithAthlete() {
  const athleteId = selectedAthleteId.value
  if (!athleteId) return
  const athlete = (athleteCandidates.value || []).find(a => a.id === athleteId)
  if (!athlete?.user_id) {
    toast.add({ title: 'Ten zawodnik nie ma konta użytkownika', color: 'warning' })
    return
  }
  try {
    await chat.openThread(athlete.user_id, auth.user.value?.id || '', newThreadTitle.value)
    newThreadTitle.value = ''
    toast.add({ title: 'Wątek czatu gotowy', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Nie udało się otworzyć wątku', description: getApiErrorMessage(e), color: 'error' })
  }
}

async function saveThreadTitle() {
  if (!chat.activeThreadId.value) return
  try {
    await chat.updateThreadTitle(chat.activeThreadId.value, threadTitleDraft.value)
    toast.add({ title: 'Zapisano tytuł konwersacji', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Nie udało się zapisać tytułu', description: getApiErrorMessage(e), color: 'error' })
  }
}

async function sendMessage() {
  if (!messageDraft.value.trim()) return
  try {
    await chat.sendMessage(messageDraft.value)
    messageDraft.value = ''
  } catch (e) {
    toast.add({ title: 'Nie udało się wysłać wiadomości', description: getApiErrorMessage(e), color: 'error' })
  }
}
</script>

<template>
  <UContainer class="py-4 sm:py-6 lg:py-8">
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-highlighted">Czat trener–zawodnik</h1>
      <p class="text-sm text-muted">Wiadomości 1:1 w obrębie kont klubowych.</p>
    </div>

    <UCard v-if="auth.isTrainer.value || auth.isAdmin.value || auth.isSuperAdmin.value" class="mb-4">
      <div class="flex flex-wrap items-end gap-2">
        <UFormField label="Rozpocznij wątek z zawodnikiem">
          <USelect v-model="selectedAthleteId" :items="(athleteCandidates || []).map(a => ({ label: a.full_name, value: a.id }))" class="w-full min-w-0 sm:min-w-64" />
        </UFormField>
        <UFormField label="Tytuł konwersacji">
          <UInput v-model="newThreadTitle" placeholder="np. Plan na MP U20" class="w-full min-w-0 sm:min-w-64" />
        </UFormField>
        <UButton icon="i-lucide-message-square-plus" @click="openThreadWithAthlete">Otwórz wątek</UButton>
      </div>
    </UCard>

    <div class="grid gap-4 lg:grid-cols-12">
      <UCard class="lg:col-span-4">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Twoje wątki</p>
        <div class="space-y-2">
          <button
            v-for="t in chat.threads.value"
            :key="t.id"
            type="button"
            class="w-full rounded-lg border border-default/70 px-3 py-2 text-left text-sm hover:bg-muted/20"
            :class="chat.activeThreadId.value === t.id ? 'bg-primary/10 border-primary/40' : ''"
            @click="chat.activeThreadId.value = t.id"
          >
            <div class="font-medium text-highlighted">{{ t.title || 'Konwersacja bez tytułu' }}</div>
            <div class="text-xs text-muted">{{ t.updated_at }}</div>
          </button>
          <p v-if="chat.threads.value.length === 0" class="text-sm text-muted">Brak wątków.</p>
        </div>
      </UCard>

      <UCard class="lg:col-span-8">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Wiadomości</p>
        <div v-if="chat.activeThreadId.value" class="mb-3 flex flex-col gap-2 rounded-lg border border-default/60 bg-muted/10 p-3 sm:flex-row sm:items-end">
          <UFormField label="Tytuł konwersacji" class="min-w-0 flex-1">
            <UInput v-model="threadTitleDraft" class="w-full min-w-0" placeholder="Wpisz tytuł..." />
          </UFormField>
          <UButton icon="i-lucide-save" variant="soft" @click="saveThreadTitle">Zapisz tytuł</UButton>
        </div>
        <div ref="messagesContainerRef" class="mb-3 max-h-[52vh] space-y-3 overflow-auto rounded-lg border border-default/60 bg-muted/10 p-3 sm:p-4">
          <div
            v-for="m in chat.messages.value"
            :key="m.id"
            class="flex w-full gap-2"
            :class="m.sender_user_id === auth.user.value?.id ? 'justify-end' : 'justify-start'"
          >
            <UAvatar
              v-if="m.sender_user_id !== auth.user.value?.id"
              :alt="m.sender_user_id"
              size="2xs"
              :text="m.sender_user_id === auth.user.value?.id ? userInitials(auth.user.value?.username) : 'KT'"
              class="mt-1 shrink-0"
            />
            <div
              class="max-w-[88%] rounded-2xl px-3 py-2 sm:max-w-[78%]"
              :class="m.sender_user_id === auth.user.value?.id ? 'bg-primary/20 text-highlighted rounded-br-md' : 'bg-background text-highlighted rounded-bl-md border border-default/60'"
            >
              <p class="whitespace-pre-wrap break-words text-sm">{{ m.body }}</p>
              <p class="mt-1 text-right text-[10px] text-muted">{{ formatTimestamp(m.created_at) }}</p>
            </div>
            <UAvatar
              v-if="m.sender_user_id === auth.user.value?.id"
              :alt="auth.user.value?.username"
              size="2xs"
              :text="userInitials(auth.user.value?.username)"
              class="mt-1 shrink-0"
            />
          </div>
          <p v-if="chat.messages.value.length === 0" class="text-sm text-muted">Brak wiadomości.</p>
        </div>
        <div class="flex gap-2">
          <UInput v-model="messageDraft" class="min-w-0 flex-1" placeholder="Napisz wiadomość..." @keydown.enter="sendMessage" />
          <UButton icon="i-lucide-send" :disabled="!chat.activeThreadId.value" @click="sendMessage">Wyślij</UButton>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
