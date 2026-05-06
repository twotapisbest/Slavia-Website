<script setup lang="ts">
import type { OpsEvent } from '~/types/models'

definePageMeta({ middleware: 'trainer' })

const apiFetch = useApi()
const filter = ref<'all' | 'results' | 'attendance' | 'recovery'>('all')

const { data: events, refresh, pending } = await useAsyncData(
  'trainer-event-feed',
  () => apiFetch<OpsEvent[]>('/api/system/event-feed').catch(() => []),
  { default: () => [] }
)

const filtered = computed(() => {
  const list = events.value || []
  if (filter.value === 'all') return list
  return list.filter(e => e.source === filter.value)
})
</script>

<template>
  <UContainer class="py-8">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-2xl font-bold text-highlighted">Wydarzenia operacyjne</h1>
      <UButton size="sm" variant="soft" icon="i-lucide-refresh-cw" :loading="pending" @click="() => void refresh()">Odśwież</UButton>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <UButton size="xs" :variant="filter === 'all' ? 'solid' : 'outline'" @click="filter = 'all'">Wszystkie</UButton>
      <UButton size="xs" :variant="filter === 'results' ? 'solid' : 'outline'" @click="filter = 'results'">Wyniki</UButton>
      <UButton size="xs" :variant="filter === 'attendance' ? 'solid' : 'outline'" @click="filter = 'attendance'">Obecność</UButton>
      <UButton size="xs" :variant="filter === 'recovery' ? 'solid' : 'outline'" @click="filter = 'recovery'">Regeneracja</UButton>
    </div>

    <div class="space-y-2">
      <UCard v-for="(e, idx) in filtered" :key="`${e.source}-${e.at}-${idx}`">
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <UBadge size="xs" variant="subtle">{{ e.source }}</UBadge>
          <span class="font-mono text-muted">{{ e.at }}</span>
        </div>
        <p class="mt-1 font-semibold text-highlighted">{{ e.title }}</p>
        <p class="mt-1 text-sm text-muted">{{ e.detail }}</p>
      </UCard>
      <p v-if="filtered.length === 0" class="text-sm text-muted">Brak zdarzeń dla wybranego filtra.</p>
    </div>
  </UContainer>
</template>
