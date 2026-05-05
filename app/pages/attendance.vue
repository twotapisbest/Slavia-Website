<script setup lang="ts">
import type { Athlete } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'auth' })

type AttendanceRecord = {
  id: string
  athlete_id: string
  session_date: string
  status: string
  source_role: string
  verification_state: string
  note?: string | null
  created_at: string
}

const auth = useAuth()
const api = useApi()
const toast = useToast()

const selectedAthleteId = ref('')
const status = ref<'obecny' | 'spóźniony' | 'nieobecny'>('obecny')
const note = ref('')
const sessionDate = ref(new Date().toISOString().slice(0, 10))
const records = ref<AttendanceRecord[]>([])

const { data: athletes } = await useAsyncData('attendance-athletes', async (): Promise<Athlete[]> => {
  if (auth.isTrainer.value || auth.isAdmin.value || auth.isSuperAdmin.value) {
    return api<Athlete[]>('/api/athletes/admin').catch(() => [])
  }
  const me = await api<Athlete | null>('/api/athletes/me').catch(() => null)
  return me ? [me] : []
})

watch(
  () => athletes.value,
  (list) => {
    if (!selectedAthleteId.value && Array.isArray(list) && list.length > 0) {
      selectedAthleteId.value = list[0]!.id
    }
  },
  { immediate: true }
)

async function refreshHistory() {
  if (!selectedAthleteId.value) {
    records.value = []
    return
  }
  records.value = await api<AttendanceRecord[]>(apiRoutes.attendance.athlete(selectedAthleteId.value)).catch(() => [])
}

watch(selectedAthleteId, () => { void refreshHistory() })

async function submitAttendance() {
  if (!selectedAthleteId.value) return
  try {
    await api(apiRoutes.attendance.collection, {
      method: 'POST',
      body: {
        athlete_id: selectedAthleteId.value,
        session_date: sessionDate.value,
        status: status.value,
        note: note.value || undefined
      }
    })
    toast.add({ title: 'Zapisano obecność', color: 'success' })
    note.value = ''
    await refreshHistory()
  } catch (e) {
    toast.add({ title: 'Nie udało się zapisać obecności', description: getApiErrorMessage(e), color: 'error' })
  }
}

onMounted(() => {
  void refreshHistory()
})
</script>

<template>
  <UContainer class="py-8">
    <h1 class="mb-4 text-2xl font-bold text-highlighted">Obecność</h1>
    <UCard class="mb-4">
      <div class="grid gap-3 md:grid-cols-4">
        <UFormField label="Zawodnik">
          <USelect v-model="selectedAthleteId" :items="(athletes || []).map(a => ({ label: a.full_name, value: a.id }))" />
        </UFormField>
        <UFormField label="Data">
          <UInput v-model="sessionDate" type="date" />
        </UFormField>
        <UFormField label="Status">
          <USelect v-model="status" :items="[{label:'Obecny',value:'obecny'},{label:'Spóźniony',value:'spóźniony'},{label:'Nieobecny',value:'nieobecny'}]" />
        </UFormField>
        <UFormField label="Notatka">
          <UInput v-model="note" placeholder="opcjonalnie" />
        </UFormField>
      </div>
      <div class="mt-3">
        <UButton icon="i-lucide-check" @click="submitAttendance">Zapisz obecność</UButton>
      </div>
    </UCard>

    <UCard>
      <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Historia obecności</p>
      <div class="space-y-2">
        <div v-for="r in records" :key="r.id" class="rounded-lg border border-default/60 px-3 py-2 text-sm">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge size="xs" variant="subtle" color="primary">{{ r.session_date }}</UBadge>
            <UBadge size="xs" variant="subtle">{{ r.status }}</UBadge>
            <UBadge size="xs" variant="subtle" :color="r.verification_state === 'verified' ? 'success' : 'warning'">{{ r.verification_state }}</UBadge>
          </div>
          <p v-if="r.note" class="mt-1 text-muted">{{ r.note }}</p>
        </div>
        <p v-if="records.length === 0" class="text-sm text-muted">Brak wpisów.</p>
      </div>
    </UCard>
  </UContainer>
</template>
