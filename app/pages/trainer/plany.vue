<script setup lang="ts">
import type { Athlete, TrainingPlan } from '~/types/models'

definePageMeta({ middleware: 'trainer' })

const apiFetch = useApi()
const toast = useToast()
const NO_ATHLETE = '__none__'

const { data: athletes } = await useAsyncData(
  'trainer-plans-athletes',
  () => apiFetch<Athlete[]>('/api/athletes').catch(() => [])
)

const selectedAthleteId = ref(NO_ATHLETE)
const plans = ref<TrainingPlan[]>([])
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  title: '',
  goal: '',
  week_start: new Date().toISOString().slice(0, 10),
  status: 'planned',
  coach_note: ''
})

async function loadPlans() {
  if (selectedAthleteId.value === NO_ATHLETE) {
    plans.value = []
    return
  }
  loading.value = true
  try {
    plans.value = await apiFetch<TrainingPlan[]>(`/api/training-plans/athlete/${selectedAthleteId.value}`).catch(() => [])
  } finally {
    loading.value = false
  }
}

async function createPlan() {
  if (!selectedAthleteId.value || !form.title.trim()) return
  saving.value = true
  try {
    await apiFetch('/api/training-plans', {
      method: 'POST',
      body: {
        athlete_id: selectedAthleteId.value,
        title: form.title,
        goal: form.goal || null,
        week_start: form.week_start,
        status: form.status,
        coach_note: form.coach_note || null
      }
    })
    toast.add({ title: 'Plan dodany', color: 'success' })
    form.title = ''
    form.goal = ''
    form.coach_note = ''
    await loadPlans()
  } catch (e) {
    toast.add({ title: 'Błąd zapisu planu', description: String(e), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function removePlan(id: string) {
  await apiFetch(`/api/training-plans/${id}`, { method: 'DELETE' })
  await loadPlans()
}

watch(selectedAthleteId, () => {
  void loadPlans()
})
</script>

<template>
  <UContainer class="py-8">
    <h1 class="mb-5 text-2xl font-bold text-highlighted">Plany treningowe</h1>

    <UCard class="mb-6">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <USelect
          v-model="selectedAthleteId"
          :items="[{ label: 'Wybierz zawodnika', value: NO_ATHLETE }, ...((athletes || []).map(a => ({ label: a.full_name, value: a.id })))]"
        />
        <UInput v-model="form.title" placeholder="Tytuł planu" />
        <UInput v-model="form.week_start" type="date" />
        <UInput v-model="form.goal" placeholder="Cel (opcjonalnie)" class="sm:col-span-2" />
        <UInput v-model="form.coach_note" placeholder="Notatka trenera (opcjonalnie)" class="sm:col-span-2" />
        <USelect v-model="form.status" :items="['planned', 'active', 'paused', 'completed']" />
      </div>
      <div class="mt-3">
        <UButton :loading="saving" color="primary" @click="createPlan">Dodaj plan</UButton>
      </div>
    </UCard>

    <div v-if="loading" class="text-sm text-muted">Ładowanie planów…</div>
    <div v-else class="space-y-3">
      <UCard v-for="p in plans" :key="p.id">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-semibold text-highlighted">{{ p.title }}</p>
            <p class="text-xs text-muted">Tydzień od: {{ p.week_start }} · Status: {{ p.status }} · Progres: {{ p.progress_percent }}%</p>
            <p v-if="p.goal" class="mt-1 text-sm text-muted">Cel: {{ p.goal }}</p>
            <p v-if="p.coach_note" class="mt-1 text-sm text-muted">Notatka trenera: {{ p.coach_note }}</p>
            <p v-if="p.athlete_note" class="mt-1 text-sm text-muted">Notatka zawodnika: {{ p.athlete_note }}</p>
          </div>
          <UButton size="xs" color="error" variant="soft" @click="removePlan(p.id)">Usuń</UButton>
        </div>
      </UCard>
      <p v-if="plans.length === 0" class="text-sm text-muted">Brak planów dla wybranego zawodnika.</p>
    </div>
  </UContainer>
</template>
