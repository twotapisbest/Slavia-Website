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
})

async function openThreadWithAthlete() {
  const athleteId = selectedAthleteId.value
  if (!athleteId) return
  const athlete = (athleteCandidates.value || []).find(a => a.id === athleteId)
  if (!athlete?.user_id) {
    toast.add({ title: 'Ten zawodnik nie ma konta użytkownika', color: 'warning' })
    return
  }
  try {
    await chat.openThread(athlete.user_id, auth.user.value?.id || '')
    toast.add({ title: 'Wątek czatu gotowy', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Nie udało się otworzyć wątku', description: getApiErrorMessage(e), color: 'error' })
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
  <UContainer class="py-8">
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-highlighted">Czat trener–zawodnik</h1>
      <p class="text-sm text-muted">Wiadomości 1:1 w obrębie kont klubowych.</p>
    </div>

    <UCard v-if="auth.isTrainer.value || auth.isAdmin.value || auth.isSuperAdmin.value" class="mb-4">
      <div class="flex flex-wrap items-end gap-2">
        <UFormField label="Rozpocznij wątek z zawodnikiem">
          <USelect v-model="selectedAthleteId" :items="(athleteCandidates || []).map(a => ({ label: a.full_name, value: a.id }))" class="min-w-64" />
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
            <div class="font-medium text-highlighted">{{ t.id.slice(0, 8) }}</div>
            <div class="text-xs text-muted">{{ t.updated_at }}</div>
          </button>
          <p v-if="chat.threads.value.length === 0" class="text-sm text-muted">Brak wątków.</p>
        </div>
      </UCard>

      <UCard class="lg:col-span-8">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Wiadomości</p>
        <div class="mb-3 max-h-[46vh] space-y-2 overflow-auto rounded-lg border border-default/60 p-3">
          <div v-for="m in chat.messages.value" :key="m.id" class="rounded-lg bg-muted/20 px-3 py-2">
            <p class="text-xs text-muted">{{ m.created_at }}</p>
            <p class="text-sm text-highlighted">{{ m.body }}</p>
          </div>
          <p v-if="chat.messages.value.length === 0" class="text-sm text-muted">Brak wiadomości.</p>
        </div>
        <div class="flex gap-2">
          <UInput v-model="messageDraft" class="flex-1" placeholder="Napisz wiadomość..." @keydown.enter="sendMessage" />
          <UButton icon="i-lucide-send" :disabled="!chat.activeThreadId.value" @click="sendMessage">Wyślij</UButton>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
