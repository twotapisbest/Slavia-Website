<script setup lang="ts">
import type { RecoveryLog } from '~/types/models'

definePageMeta({ middleware: 'auth' })

const apiFetch = useApi()
const toast = useToast()

const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  sleep_hours: 8,
  fatigue_level: 5,
  soreness_level: 5,
  readiness_level: 5,
  note: ''
})

const { data: logs, refresh, pending } = await useAsyncData(
  'athlete-recovery-logs',
  () => apiFetch<RecoveryLog[]>('/api/recovery').catch(() => []),
  { default: () => [] }
)

const saving = ref(false)
async function saveCheckin() {
  saving.value = true
  try {
    await apiFetch('/api/recovery', { method: 'POST', body: form })
    toast.add({ title: 'Check-in zapisany', color: 'success' })
    await refresh()
  } catch (e) {
    toast.add({ title: 'Błąd zapisu check-in', description: String(e), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UContainer class="py-8">
    <h1 class="mb-5 text-2xl font-bold text-highlighted">Regeneracja</h1>
    <UCard class="mb-6">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <UInput v-model="form.date" type="date" />
        <UInputNumber v-model="form.sleep_hours" :min="0" :max="24" :step="0.5" />
        <UInputNumber v-model="form.fatigue_level" :min="1" :max="10" />
        <UInputNumber v-model="form.soreness_level" :min="1" :max="10" />
        <UInputNumber v-model="form.readiness_level" :min="1" :max="10" />
        <UInput v-model="form.note" placeholder="Notatka (opcjonalnie)" class="sm:col-span-2 lg:col-span-3" />
      </div>
      <div class="mt-3">
        <UButton :loading="saving" color="primary" @click="saveCheckin">Zapisz check-in</UButton>
      </div>
    </UCard>

    <div v-if="pending" class="text-sm text-muted">Ładowanie historii…</div>
    <div v-else class="space-y-3">
      <UCard v-for="r in logs" :key="r.id">
        <p class="font-semibold text-highlighted">{{ r.date }}</p>
        <p class="text-sm text-muted">
          Sen: {{ r.sleep_hours }}h · Zmęczenie: {{ r.fatigue_level }}/10 · Ból: {{ r.soreness_level }}/10 · Gotowość: {{ r.readiness_level }}/10
        </p>
        <p v-if="r.note" class="mt-1 text-sm text-muted">{{ r.note }}</p>
      </UCard>
      <p v-if="(logs || []).length === 0" class="text-sm text-muted">Brak wpisów regeneracji.</p>
    </div>
  </UContainer>
</template>
