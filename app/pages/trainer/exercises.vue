<script setup lang="ts">
import type { CompetitionResult, ExerciseBoardRow } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({
  middleware: 'trainer'
})

const { fetchBoard, withTotal } = useExercisesBoard()
const apiFetch = useApi()
const toast = useToast()

const { data: rows, pending } = await useAsyncData('trainer-exercises-ranking', async (): Promise<ExerciseBoardRow[]> => {
  return fetchBoard()
})

const ranking = computed(() => {
  return withTotal([...(rows.value || [])]).sort((a, b) => (b.total || 0) - (a.total || 0))
})

const { data: pendingStrength, refresh: refreshPendingStrength } = await useAsyncData(
  'trainer-strength-pending',
  async (): Promise<CompetitionResult[]> => {
    const all = await apiFetch<CompetitionResult[]>('/api/results/pending').catch(() => [])
    return all.filter(r => (r.squat_kg ?? 0) > 0 || (r.bench_kg ?? 0) > 0 || (r.deadlift_kg ?? 0) > 0)
  }
)

async function approve(id: string) {
  try {
    await apiFetch(`/api/results/${id}/approve`, { method: 'PATCH' })
    toast.add({ title: 'Zatwierdzono wynik', color: 'success' })
    await Promise.all([refreshPendingStrength(), refreshNuxtData('trainer-exercises-ranking')])
  } catch (e) {
    toast.add({ title: 'Błąd zatwierdzania', description: getApiErrorMessage(e), color: 'error' })
  }
}

useSeoMeta({
  title: 'Inne ćwiczenia — Trener',
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
        Panel kadry: rzeczywiste wyniki siłowe + monitoring oczekujących zgłoszeń od zawodników.
      </p>
    </div>

    <div class="space-y-6">
      <UCard>
        <h2 class="mb-3 text-lg font-semibold text-highlighted">Kolejka zgłoszeń do zatwierdzenia</h2>
        <div v-if="!pendingStrength?.length" class="text-sm text-muted">Brak oczekujących zgłoszeń siłowych.</div>
        <div v-else class="space-y-2">
          <div v-for="r in pendingStrength" :key="r.id" class="flex flex-col gap-2 rounded-xl border border-default/60 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-sm">
              <p class="font-semibold text-highlighted">ID zawodnika: {{ r.athlete_id }}</p>
              <p class="text-muted">P {{ r.squat_kg ?? '—' }} · W {{ r.bench_kg ?? '—' }} · M {{ r.deadlift_kg ?? '—' }} · {{ r.date }}</p>
            </div>
            <UButton size="sm" icon="i-lucide-check" @click="approve(r.id)">Zatwierdź</UButton>
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
        Źródło danych: zatwierdzone wpisy siłowe (trainer/admin). Brak estymacji z dwuboju.
      </p>
      </UCard>
    </div>
  </UContainer>
</template>