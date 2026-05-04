<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

interface PublicResultBoardRow {
  id: string
  athlete_id: string
  athlete_name: string
  competition_id?: string | null
  competition_title?: string | null
  snatch: number
  clean_and_jerk: number
  total: number
  date: string
  squat_kg?: number | null
  bench_kg?: number | null
  deadlift_kg?: number | null
}

useSeoMeta({
  title: 'Wyniki zawodów — Slavia Ruda Śląska',
  description: 'Zatwierdzone starty naszych zawodników — podgląd publiczny.',
  robots: 'index, follow'
})

const apiFetch = useApi()
const auth = useAuth()

const canEditResults = computed(() => auth.isTrainer.value)

const { data: rows, pending } = await useAsyncData(
  'public-results-board',
  () =>
    apiFetch<PublicResultBoardRow[]>('/api/results/public-board').catch(
      () => [] as PublicResultBoardRow[]
    ),
  { default: () => [] as PublicResultBoardRow[] }
)

function formatDate(d: string) {
  try {
    return format(parseISO(d.slice(0, 10)), 'd MMM yyyy', { locale: pl })
  } catch {
    return d.slice(0, 10)
  }
}

function formatKg(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return '—'
  return `${v}`
}

function formatPlTriple(r: PublicResultBoardRow) {
  const has = r.squat_kg != null || r.bench_kg != null || r.deadlift_kg != null
  if (!has) return '—'
  return `${formatKg(r.squat_kg)} / ${formatKg(r.bench_kg)} / ${formatKg(r.deadlift_kg)}`
}
</script>

<template>
  <UContainer class="animate-page-in py-8 sm:py-12 lg:py-14">
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl lg:text-4xl">
          Wyniki zawodów
        </h1>
        <p class="mt-2 text-sm text-muted sm:text-base lg:leading-relaxed">
          Lista zatwierdzonych wyników z bazy klubu. Edycja i dodawanie wpisów odbywa się w panelu kadry (trener / administrator).
        </p>
      </div>
      <UButton
        v-if="canEditResults"
        to="/trainer/wyniki"
        icon="i-lucide-pencil-line"
        variant="outline"
        color="neutral"
        class="min-h-11 w-full shrink-0 justify-center md:w-auto"
      >
        Edytuj w panelu trenera
      </UButton>
    </div>

    <div
      v-if="pending"
      class="flex justify-center py-14"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-primary"
      />
    </div>

    <div
      v-else-if="!rows?.length"
      class="rounded-2xl border border-dashed border-default bg-muted/10 px-6 py-14 text-center text-muted"
    >
      Brak opublikowanych wyników w bazie.
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-2xl border border-default"
    >
      <table class="w-full min-w-[880px] text-left text-sm">
        <thead class="border-b border-default bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3">
              Data
            </th>
            <th class="px-4 py-3">
              Zawodnik
            </th>
            <th class="px-4 py-3">
              Zawody
            </th>
            <th class="px-4 py-3 text-right">
              Rwanie
            </th>
            <th class="px-4 py-3 text-right">
              Podrzut
            </th>
            <th class="px-4 py-3 text-right font-semibold text-highlighted">
              Razem
            </th>
            <th class="hidden px-4 py-3 text-right lg:table-cell" title="Przysiad / wycisk / martwy">
              Siła (kg)
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="r in rows"
            :key="r.id"
            class="bg-card hover:bg-muted/20"
          >
            <td class="whitespace-nowrap px-4 py-3 text-muted">
              {{ formatDate(r.date) }}
            </td>
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ r.athlete_name }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ r.competition_title || '—' }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums">
              {{ r.snatch }} kg
            </td>
            <td class="px-4 py-3 text-right tabular-nums">
              {{ r.clean_and_jerk }} kg
            </td>
            <td class="px-4 py-3 text-right tabular-nums font-semibold text-primary">
              {{ r.total }} kg
            </td>
            <td class="hidden px-4 py-3 text-right text-xs tabular-nums text-muted lg:table-cell">
              {{ formatPlTriple(r) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UContainer>
</template>
