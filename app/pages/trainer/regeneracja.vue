<script setup lang="ts">
import type { Athlete, RecoveryLog } from '~/types/models'

definePageMeta({ middleware: 'trainer' })

const apiFetch = useApi()

const { data: athletes } = await useAsyncData(
  'trainer-recovery-athletes',
  () => apiFetch<Athlete[]>('/api/athletes').catch(() => []),
  { default: () => [] }
)

const selectedAthleteId = ref('')
const logs = ref<RecoveryLog[]>([])
const loading = ref(false)

async function loadLogs() {
  if (!selectedAthleteId.value) {
    logs.value = []
    return
  }
  loading.value = true
  try {
    logs.value = await apiFetch<RecoveryLog[]>(`/api/recovery/athlete/${selectedAthleteId.value}`).catch(() => [])
  } finally {
    loading.value = false
  }
}

watch(selectedAthleteId, () => {
  void loadLogs()
})
</script>

<template>
  <UContainer class="py-8">
    <h1 class="mb-5 text-2xl font-bold text-highlighted">Regeneracja zawodników</h1>

    <UCard class="mb-6">
      <USelect
        v-model="selectedAthleteId"
        :items="[{ label: 'Wybierz zawodnika', value: '' }, ...((athletes || []).map(a => ({ label: a.full_name, value: a.id })))]"
      />
    </UCard>

    <div v-if="loading" class="text-sm text-muted">Ładowanie check-inów…</div>
    <div v-else class="space-y-3">
      <UCard v-for="r in logs" :key="r.id">
        <p class="font-semibold text-highlighted">{{ r.date }}</p>
        <p class="text-sm text-muted">
          Sen: {{ r.sleep_hours }}h · Zmęczenie: {{ r.fatigue_level }}/10 · Ból: {{ r.soreness_level }}/10 · Gotowość: {{ r.readiness_level }}/10
        </p>
        <p v-if="r.note" class="mt-1 text-sm text-muted">{{ r.note }}</p>
      </UCard>
      <p v-if="logs.length === 0" class="text-sm text-muted">Brak wpisów dla wybranego zawodnika.</p>
    </div>
  </UContainer>
</template>
