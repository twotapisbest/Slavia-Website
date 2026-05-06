<script setup lang="ts">
definePageMeta({ middleware: 'athlete-calendar' })

type TimelineItem = {
  id: string
  kind: string
  at: string
  title: string
  detail: string
}

const apiFetch = useApi()

const { data: me } = await useAsyncData('athlete-timeline-me', () => apiFetch<{ id: string }>('/api/athletes/me').catch(() => null))

const { data: items, pending, refresh } = await useAsyncData(
  'athlete-timeline-items',
  async (): Promise<TimelineItem[]> => {
    if (!me.value?.id) return []
    return apiFetch<TimelineItem[]>(`/api/athletes/${me.value.id}/timeline`).catch(() => [])
  },
  { default: () => [] }
)

function kindLabel(kind: string) {
  if (kind === 'result') return 'Wynik'
  if (kind === 'attendance') return 'Obecność'
  if (kind === 'training_log') return 'Dziennik'
  return kind
}

useSeoMeta({
  title: 'Historia treningów — Slavia',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">Historia treningów</h1>
        <p class="mt-1 text-sm text-muted">Oś czasu: wyniki, obecności i wpisy dziennika.</p>
      </div>
      <UButton variant="soft" icon="i-lucide-refresh-cw" @click="() => void refresh()">Odśwież</UButton>
    </div>

    <div v-if="pending" class="flex items-center gap-2 text-sm text-muted">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
      Ładowanie osi czasu…
    </div>

    <div v-else class="space-y-3">
      <div v-for="i in items" :key="`${i.kind}-${i.id}-${i.at}`" class="rounded-2xl border border-default/60 bg-card px-4 py-3">
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <UBadge size="xs" variant="subtle" color="primary">{{ kindLabel(i.kind) }}</UBadge>
          <span class="font-mono text-muted">{{ i.at }}</span>
        </div>
        <p class="mt-1 font-semibold text-highlighted">{{ i.title }}</p>
        <p class="mt-1 text-sm text-muted">{{ i.detail }}</p>
      </div>
      <p v-if="(items || []).length === 0" class="text-sm text-muted">Brak wpisów historii.</p>
    </div>
  </UContainer>
</template>
