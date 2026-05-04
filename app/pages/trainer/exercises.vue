<script setup lang="ts">
import type { Athlete } from '~/types/models'

definePageMeta({
  middleware: 'trainer'
})

const apiFetch = useApi()

const { data: athletes, pending } = await useAsyncData('trainer-exercises-ranking', async (): Promise<Athlete[]> => {
  try {
    return await apiFetch<Athlete[]>('/api/athletes/admin')
  } catch {
    return await apiFetch<Athlete[]>('/api/athletes').catch(() => [])
  }
})

const ranking = computed(() => {
  return [...(athletes.value || [])]
    .filter(a => a.is_active !== false)
    .map(a => {
      const snatch = Number(a.best_snatch_kg || 0)
      const clean = Number(a.best_clean_jerk_kg || 0)
      return {
        id: a.id,
        full_name: a.full_name,
        squat: Math.round((snatch * 1.45) * 10) / 10,
        bench: Math.round((clean * 0.72) * 10) / 10,
        deadlift: Math.round((clean * 1.18) * 10) / 10,
        total: Math.round((snatch * 1.45 + clean * 0.72 + clean * 1.18) * 10) / 10
      }
    })
    .sort((a, b) => b.total - a.total)
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
        Panel kadry: ranking przysiadów, wyciskania i martwego ciągu dla aktywnych zawodników.
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
              <th class="py-2 pl-3">Suma</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in ranking" :key="row.id" class="border-b border-default/60">
              <td class="py-2 pr-3 font-medium text-highlighted">{{ row.full_name }}</td>
              <td class="py-2 px-3">{{ row.squat }} kg</td>
              <td class="py-2 px-3">{{ row.bench }} kg</td>
              <td class="py-2 px-3">{{ row.deadlift }} kg</td>
              <td class="py-2 pl-3 font-semibold">{{ row.total }} kg</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </UContainer>
</template>