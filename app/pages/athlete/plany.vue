<script setup lang="ts">
import type { TrainingPlan } from '~/types/models'

definePageMeta({ middleware: 'auth' })

const apiFetch = useApi()
const toast = useToast()

const { data: plans, refresh, pending } = await useAsyncData(
  'athlete-my-plans',
  () => apiFetch<TrainingPlan[]>('/api/training-plans/my').catch(() => []),
  { default: () => [] }
)

const draft = reactive<Record<string, { status: string, progress_percent: number, athlete_note: string }>>({})
const savingId = ref<string | null>(null)

watch(
  () => plans.value,
  (list) => {
    for (const p of list || []) {
      if (!draft[p.id]) {
        draft[p.id] = {
          status: p.status,
          progress_percent: p.progress_percent,
          athlete_note: p.athlete_note || ''
        }
      }
    }
  },
  { immediate: true }
)

async function saveProgress(id: string) {
  const payload = draft[id]
  if (!payload) return
  savingId.value = id
  try {
    await apiFetch(`/api/training-plans/${id}/my-progress`, {
      method: 'PATCH',
      body: payload
    })
    toast.add({ title: 'Postęp zapisany', color: 'success' })
    await refresh()
  } catch (e) {
    toast.add({ title: 'Błąd zapisu postępu', description: String(e), color: 'error' })
  } finally {
    savingId.value = null
  }
}
</script>

<template>
  <UContainer class="py-8">
    <h1 class="mb-5 text-2xl font-bold text-highlighted">Moje plany treningowe</h1>

    <div v-if="pending" class="text-sm text-muted">Ładowanie planów…</div>
    <div v-else class="space-y-4">
      <UCard v-for="p in (plans || [])" :key="p.id">
        <p class="font-semibold text-highlighted">{{ p.title }}</p>
        <p class="mt-1 text-xs text-muted">Tydzień od: {{ p.week_start }} · Status: {{ p.status }}</p>
        <p v-if="p.goal" class="mt-2 text-sm text-muted">Cel: {{ p.goal }}</p>
        <p v-if="p.coach_note" class="mt-1 text-sm text-muted">Notatka trenera: {{ p.coach_note }}</p>

        <div v-if="draft[p.id]" class="mt-3 grid gap-2 sm:grid-cols-3">
          <USelect v-model="draft[p.id]!.status" :items="['planned', 'active', 'paused', 'completed']" />
          <UInputNumber v-model="draft[p.id]!.progress_percent" :min="0" :max="100" :step="5" />
          <UInput v-model="draft[p.id]!.athlete_note" placeholder="Twoja notatka" />
        </div>
        <div class="mt-3">
          <UButton size="sm" color="primary" :loading="savingId === p.id" @click="saveProgress(p.id)">Zapisz postęp</UButton>
        </div>
      </UCard>
      <p v-if="(plans || []).length === 0" class="text-sm text-muted">Brak przypisanych planów.</p>
    </div>
  </UContainer>
</template>
