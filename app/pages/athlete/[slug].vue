<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { Athlete, CompetitionResult } from '~/types/models'
import { parseSlugId } from '~/utils/slug'

const route = useRoute()
const apiFetch = useApi()

const athleteId = computed(() => parseSlugId(String(route.params.slug || '')))

const athleteDetailKey = computed(() => `athlete-detail-${athleteId.value}`)
const { data: athlete, error } = await useAsyncData(
  athleteDetailKey,
  async () => {
    if (!athleteId.value) {
      return null
    }
    return await apiFetch<Athlete>(`/api/athletes/${encodeURIComponent(athleteId.value)}`)
  },
  { watch: [athleteId] }
)

const athleteResultsKey = computed(() => `athlete-results-${athleteId.value}`)
const { data: results } = await useAsyncData(
  athleteResultsKey,
  async () => {
    if (!athleteId.value) {
      return []
    }
    return await apiFetch<CompetitionResult[]>(`/api/results/athlete/${encodeURIComponent(athleteId.value)}`)
  },
  { watch: [athleteId], default: () => [] }
)

if (error.value || !athlete.value) {
  throw createError({ statusCode: 404, statusMessage: 'Zawodnik nie znaleziony', fatal: true })
}

useSeoMeta({
  title: `${athlete.value.full_name} — Slavia`,
  description: athlete.value.notes || `Profil zawodnika ${athlete.value.full_name} w CKS Slavia.`,
  ogTitle: athlete.value.full_name,
  ogDescription: athlete.value.notes || 'Profil zawodnika klubu CKS Slavia',
  ogImage: athlete.value.image_url || '/logo.png'
})

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: pl })
  } catch {
    return dateStr
  }
}

const approvedResults = computed(() => (results.value || []).filter(r => r.status === 'Approved'))
</script>

<template>
  <UContainer class="py-8 sm:py-12 lg:py-16">
    <div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.25em] text-primary">Profil zawodnika</p>
        <h1 class="mt-3 text-3xl font-black tracking-tight text-highlighted sm:text-4xl">
          {{ athlete!.full_name }}
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Pełny profil zawodnika Slavia z ostatnimi zatwierdzonymi wynikami.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton to="/zawodnicy" variant="soft" color="neutral" icon="i-lucide-arrow-left">
          Powrót do listy
        </UButton>
      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-[1.9fr_1.1fr]">
      <div class="space-y-6">
        <UCard class="overflow-hidden border-default/60 shadow-md">
          <div class="relative overflow-hidden rounded-3xl bg-slate-950/80">
            <img
              v-if="athlete!.image_url"
              :src="athlete!.image_url"
              :alt="`Zdjęcie ${athlete!.full_name}`"
              class="h-80 w-full object-cover"
            >
            <div v-else class="flex h-80 items-center justify-center bg-linear-to-br from-primary/20 to-neutral-900">
              <UIcon name="i-lucide-user" class="size-16 text-primary/40" />
            </div>
            <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-6">
              <p class="text-sm uppercase tracking-[0.2em] text-primary/80">Zawodnik klubu</p>
              <h2 class="mt-2 text-3xl font-extrabold text-white">{{ athlete!.full_name }}</h2>
            </div>
          </div>

          <div class="p-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border border-default/60 bg-muted/10 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-muted">Data urodzenia</p>
                <p class="mt-2 text-lg font-semibold text-highlighted">{{ athlete!.birth_year || '—' }}</p>
              </div>
              <div class="rounded-2xl border border-default/60 bg-muted/10 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-muted">Waga</p>
                <p class="mt-2 text-lg font-semibold text-highlighted">{{ athlete!.weight_category || '—' }}</p>
              </div>
            </div>

            <div class="mt-5 rounded-2xl border border-default/60 bg-muted/10 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-muted">Notatki</p>
              <p class="mt-3 text-sm leading-relaxed text-muted">
                {{ athlete!.notes || 'Brak dodatkowych informacji.' }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard class="rounded-3xl border-default/60 p-6 shadow-md">
          <div class="flex items-center justify-between gap-4 mb-5">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">Wyniki</p>
              <p class="text-sm text-muted">Ostatnie zatwierdzone zgłoszenia zawodnika.</p>
            </div>
            <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{{ approvedResults.length }} wpisów</span>
          </div>

          <div class="space-y-4">
            <div
              v-for="result in approvedResults.slice(0, 6)"
              :key="result.id"
              class="rounded-2xl border border-default/60 bg-background/80 p-4"
            >
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-highlighted">{{ formatDate(result.date) }}</p>
                  <p class="text-sm text-muted">Status: {{ result.status }}</p>
                </div>
                <div class="text-right font-mono text-lg font-bold text-primary">
                  {{ result.total }} kg
                </div>
              </div>
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <p class="text-sm text-muted">Rwanie: {{ result.snatch }} kg</p>
                <p class="text-sm text-muted">Podrzut: {{ result.clean_and_jerk }} kg</p>
              </div>
            </div>
            <p v-if="approvedResults.length === 0" class="text-sm text-muted">Brak zatwierdzonych wyników do wyświetlenia.</p>
          </div>
        </UCard>
      </div>

      <aside class="space-y-6">
        <UCard class="rounded-3xl border-default/60 p-6 shadow-md">
          <p class="text-xs uppercase tracking-[0.18em] text-muted">Szybkie akcje</p>
          <div class="mt-4 space-y-3">
            <UButton to="/zawodnicy" color="primary" block>
              Powrót do listy zawodników
            </UButton>
            <UButton to="/profil" variant="outline" color="neutral" block>
              Moje konto
            </UButton>
          </div>
        </UCard>
      </aside>
    </div>
  </UContainer>
</template>
