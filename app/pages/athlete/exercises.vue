<script setup lang="ts">
import type { ExerciseBoardRow } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({
  middleware: 'auth'
})

const auth = useAuth()
const { fetchBoard, withTotal } = useExercisesBoard()
const apiFetch = useApi()
const toast = useToast()

const canOpen = computed(() => auth.isAthlete.value || auth.isSuperAdmin.value)

const { data: rows, pending } = await useAsyncData('athlete-exercises-ranking', async (): Promise<ExerciseBoardRow[]> => {
  if (!canOpen.value) {
    return []
  }
  return fetchBoard()
})

const ranking = computed(() => {
  return withTotal([...(rows.value || [])]).sort((a, b) => (b.total || 0) - (a.total || 0))
})

const podium = computed(() => ranking.value.slice(0, 3))
const myAthlete = ref<{ id: string } | null>(null)
const form = reactive({
  squat_kg: null as number | null,
  bench_kg: null as number | null,
  deadlift_kg: null as number | null,
  date: new Date().toISOString().slice(0, 10)
})

onMounted(async () => {
  myAthlete.value = await apiFetch<{ id: string } | null>('/api/athletes/me').catch(() => null)
})

async function submitStrengthResult() {
  if (!myAthlete.value?.id) {
    toast.add({ title: 'Brak powiązanego profilu zawodnika', color: 'warning' })
    return
  }
  if (!form.squat_kg && !form.bench_kg && !form.deadlift_kg) {
    toast.add({ title: 'Podaj minimum jeden wynik', color: 'warning' })
    return
  }
  try {
    await apiFetch('/api/results', {
      method: 'POST',
      body: {
        athlete_id: myAthlete.value.id,
        snatch: 1,
        clean_and_jerk: 1,
        total: 2,
        date: form.date,
        squat_kg: form.squat_kg || undefined,
        bench_kg: form.bench_kg || undefined,
        deadlift_kg: form.deadlift_kg || undefined
      }
    })
    toast.add({ title: 'Wysłano do zatwierdzenia', color: 'success' })
    form.squat_kg = null
    form.bench_kg = null
    form.deadlift_kg = null
    await refreshNuxtData('athlete-exercises-ranking')
  } catch (e) {
    toast.add({ title: 'Błąd wysyłki', description: getApiErrorMessage(e), color: 'error' })
  }
}

useSeoMeta({
  title: 'Inne ćwiczenia — Zawodnik',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-8 sm:py-12 lg:py-14">
    <div class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl lg:text-4xl">
        Inne ćwiczenia
      </h1>
      <p class="mt-2 text-sm text-muted sm:text-base lg:leading-relaxed">
        Rzeczywiste wyniki siłowe z zatwierdzonych wpisów (trener/admin) + status zgłoszeń zawodników.
      </p>
    </div>

    <UAlert
      v-if="!canOpen"
      color="warning"
      variant="subtle"
      title="Brak uprawnień"
      description="Ta sekcja jest dostępna dla zawodnika oraz superadmina."
    />

    <div v-else class="space-y-6">
      <UCard>
        <h2 class="mb-3 text-lg font-semibold text-highlighted">Wyślij wynik do zatwierdzenia</h2>
        <div class="grid gap-3 sm:grid-cols-4">
          <UFormField label="Przysiad (kg)"><UInputNumber v-model="form.squat_kg" :min="0" :step="0.5" class="w-full" /></UFormField>
          <UFormField label="Wyciskanie (kg)"><UInputNumber v-model="form.bench_kg" :min="0" :step="0.5" class="w-full" /></UFormField>
          <UFormField label="Martwy (kg)"><UInputNumber v-model="form.deadlift_kg" :min="0" :step="0.5" class="w-full" /></UFormField>
          <UFormField label="Data"><UInput v-model="form.date" type="date" class="w-full" /></UFormField>
        </div>
        <div class="mt-3">
          <UButton icon="i-lucide-send" @click="submitStrengthResult">Wyślij do trenera</UButton>
        </div>
      </UCard>

      <UCard>
        <h2 class="mb-4 text-lg font-semibold text-highlighted">Podium</h2>
        <div class="grid gap-3 sm:grid-cols-3">
          <div v-for="(p, idx) in podium" :key="p.athlete_id" class="rounded-xl border border-default/60 bg-muted/10 p-4 text-center">
            <p class="text-xs font-bold text-muted">#{{ idx + 1 }}</p>
            <p class="mt-1 font-semibold text-highlighted">{{ p.athlete_name }}</p>
            <p class="text-2xl font-black text-primary">{{ p.total || '—' }}<span class="text-sm"> kg</span></p>
          </div>
        </div>
      </UCard>

      <UCard>
      <div v-if="pending" class="flex items-center gap-2 text-muted">
        <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
        Ładowanie rankingu…
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-default text-left text-muted">
              <th class="py-2 pr-3">Zawodnik</th>
              <th class="py-2 px-3">Przysiad</th>
              <th class="py-2 px-3">Wyciskanie</th>
              <th class="py-2 px-3">Martwy</th>
              <th class="py-2 px-3">Suma</th>
              <th class="py-2 pl-3">Źródła</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in ranking" :key="row.athlete_id" class="border-b border-default/60 align-top">
              <td class="py-2 pr-3 font-medium text-highlighted">{{ row.athlete_name }}</td>
              <td class="py-2 px-3">{{ row.squat ?? '—' }}<span v-if="row.squat != null"> kg</span></td>
              <td class="py-2 px-3">{{ row.bench ?? '—' }}<span v-if="row.bench != null"> kg</span></td>
              <td class="py-2 px-3">{{ row.deadlift ?? '—' }}<span v-if="row.deadlift != null"> kg</span></td>
              <td class="py-2 px-3 font-semibold">{{ row.total ?? '—' }}<span v-if="row.total != null"> kg</span></td>
              <td class="py-2 pl-3">
                <div class="flex flex-wrap gap-1">
                  <UBadge size="xs" variant="subtle" :color="row.source_trainer_direct ? 'success' : 'neutral'">
                    trener: {{ row.source_trainer_direct ? 'tak' : 'brak' }}
                  </UBadge>
                  <UBadge size="xs" variant="subtle" color="warning">
                    pending zawodnika: {{ row.source_athlete_pending_count }}
                  </UBadge>
                  <UBadge size="xs" variant="subtle" color="primary">
                    historia treningów: {{ row.source_training_log_count }}
                  </UBadge>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs text-muted">
        Zasada: wartości ćwiczeń pochodzą wyłącznie z zatwierdzonych wpisów siłowych; zgłoszenia zawodnika są widoczne jako licznik oczekujących.
      </p>
      </UCard>
    </div>
  </UContainer>
</template>