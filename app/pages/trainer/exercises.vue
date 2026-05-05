<script setup lang="ts">
import type { ExerciseBoardRow } from '~/types/models'

definePageMeta({
  middleware: 'trainer'
})

const { fetchBoard, withTotal } = useExercisesBoard()

const { data: rows, pending } = await useAsyncData('trainer-exercises-ranking', async (): Promise<ExerciseBoardRow[]> => {
  return fetchBoard()
})

const ranking = computed(() => {
  return withTotal([...(rows.value || [])]).sort((a, b) => (b.total || 0) - (a.total || 0))
})

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
  </UContainer>
</template>