<script setup lang="ts">
import type { Athlete } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import { eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns'
import { pl } from 'date-fns/locale'

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
const status = ref<'obecny' | 'nieobecny'>('obecny')
const note = ref('')
const sessionDate = ref(new Date().toISOString().slice(0, 10))
const records = ref<AttendanceRecord[]>([])
const monthRef = ref(new Date())
const attendanceModalOpen = ref(false)
const selectedTrainingDay = ref<Date | null>(null)

const recurringOverrides = ref<Array<{ session_date: string, status: string }>>([])

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

const monthStart = computed(() => startOfMonth(monthRef.value))
const monthEnd = computed(() => endOfMonth(monthRef.value))
const gridStart = computed(() => startOfWeek(monthStart.value, { weekStartsOn: 1 }))
const gridEnd = computed(() => endOfWeek(monthEnd.value, { weekStartsOn: 1 }))
const days = computed(() => eachDayOfInterval({ start: gridStart.value, end: gridEnd.value }))
const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

const recordsByDate = computed(() => {
  const map = new Map<string, AttendanceRecord>()
  for (const r of records.value) {
    map.set(r.session_date.slice(0, 10), r)
  }
  return map
})

const recurringStatusByDate = computed(() => {
  const map = new Map<string, string>()
  for (const r of recurringOverrides.value) {
    map.set(r.session_date.slice(0, 10), r.status || 'cancelled')
  }
  return map
})

function isTrainingDay(date: Date) {
  return [1, 3, 5].includes(getDay(date))
}

function trainingStatusForDate(date: Date) {
  const key = format(date, 'yyyy-MM-dd')
  return recurringStatusByDate.value.get(key) ?? 'scheduled'
}

function openDay(date: Date) {
  sessionDate.value = format(date, 'yyyy-MM-dd')
  const rec = recordsByDate.value.get(sessionDate.value)
  if (rec?.status === 'obecny' || rec?.status === 'nieobecny') {
    status.value = rec.status
  } else {
    status.value = 'obecny'
  }
  note.value = rec?.note || ''
}

function openTrainingModal(date: Date) {
  if (!isTrainingDay(date)) return
  selectedTrainingDay.value = date
  openDay(date)
  attendanceModalOpen.value = true
}

function statusColor(s: string) {
  if (s === 'obecny') return 'success'
  return 'error'
}

async function refreshHistory() {
  if (!selectedAthleteId.value) {
    records.value = []
    return
  }
  records.value = await api<AttendanceRecord[]>(apiRoutes.attendance.athlete(selectedAthleteId.value)).catch(() => [])
}

async function refreshTrainingOverrides() {
  recurringOverrides.value = await api<Array<{ session_date: string, status: string }>>(
    apiRoutes.competitions.recurringTrainingCancellations
  ).catch(() => [])
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
  void refreshTrainingOverrides()
})
</script>

<template>
  <UContainer class="py-6 sm:py-10">
    <h1 class="mb-4 text-2xl font-bold text-highlighted">Obecność (kalendarz treningowy)</h1>
    <UCard class="mb-4">
      <div class="grid gap-3 md:grid-cols-4">
        <UFormField label="Zawodnik">
          <USelect v-model="selectedAthleteId" :items="(athletes || []).map(a => ({ label: a.full_name, value: a.id }))" />
        </UFormField>
        <UFormField label="Data">
          <UInput v-model="sessionDate" type="date" />
        </UFormField>
        <UFormField label="Status">
          <USelect v-model="status" :items="[{label:'Obecny',value:'obecny'},{label:'Nieobecny',value:'nieobecny'}]" />
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
      <div class="mb-3 flex items-center justify-between gap-2">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">Kalendarz obecności</p>
        <div class="flex gap-2">
          <UButton size="xs" variant="ghost" icon="i-lucide-chevron-left" @click="monthRef = new Date(monthRef.getFullYear(), monthRef.getMonth() - 1, 1)" />
          <UButton size="xs" variant="ghost">{{ format(monthRef, 'LLLL yyyy', { locale: pl }) }}</UButton>
          <UButton size="xs" variant="ghost" icon="i-lucide-chevron-right" @click="monthRef = new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 1)" />
        </div>
      </div>

      <div class="grid grid-cols-7 border border-default/60 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
        <div v-for="w in weekDays" :key="w" class="border-r border-default/40 py-2 last:border-r-0">{{ w }}</div>
      </div>
      <div class="grid grid-cols-7 border-x border-b border-default/60">
        <button
          v-for="day in days"
          :key="day.toISOString()"
          type="button"
          class="min-h-[92px] border-r border-t border-default/40 p-2 text-left last:border-r-0"
          :class="[
            isSameMonth(day, monthStart) ? 'bg-card' : 'bg-muted/10 opacity-60',
            isToday(day) ? 'ring-1 ring-primary/35' : ''
          ]"
          @click="openTrainingModal(day)"
        >
          <div class="mb-1 text-xs font-semibold text-highlighted">{{ format(day, 'd') }}</div>
          <div v-if="isTrainingDay(day)" class="text-[10px] text-muted">
            Trening:
            <span :class="trainingStatusForDate(day) === 'scheduled' ? 'text-success' : 'text-warning'">
              {{ trainingStatusForDate(day) === 'scheduled' ? 'planowy' : trainingStatusForDate(day) }}
            </span>
          </div>
          <UBadge
            v-if="recordsByDate.get(format(day, 'yyyy-MM-dd'))"
            size="xs"
            variant="subtle"
            class="mt-2"
            :color="statusColor(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || 'nieobecny')"
          >
            {{ recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status }}
          </UBadge>
        </button>
      </div>

      <div class="mt-4 space-y-2">
        <div v-for="r in records" :key="r.id" class="rounded-lg border border-default/60 px-3 py-2 text-sm">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge size="xs" variant="subtle" color="primary">{{ r.session_date }}</UBadge>
            <UBadge size="xs" variant="subtle">{{ r.status }}</UBadge>
            <UBadge size="xs" variant="subtle" :color="r.verification_state === 'verified' ? 'success' : 'warning'">{{ r.verification_state }}</UBadge>
          </div>
          <p v-if="r.note" class="mt-1 text-muted">{{ r.note }}</p>
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="attendanceModalOpen"
      :title="selectedTrainingDay ? `Trening · ${format(selectedTrainingDay, 'dd.MM.yyyy')}` : 'Zapis obecności'"
      :ui="{ content: 'max-w-lg' }"
    >
      <template #content>
        <div class="space-y-4 p-4 sm:p-5">
          <UAlert
            v-if="selectedTrainingDay"
            color="primary"
            variant="subtle"
            :title="`Status treningu: ${trainingStatusForDate(selectedTrainingDay) === 'scheduled' ? 'planowy' : trainingStatusForDate(selectedTrainingDay)}`"
            description="Treningi są importowane z bazy wydarzeń (siatka Pn/Śr/Pt + wyjątki)."
          />
          <UFormField label="Data treningu">
            <UInput v-model="sessionDate" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Status obecności">
            <USelect
              v-model="status"
              :items="[
                { label: 'Obecny', value: 'obecny' },
                { label: 'Nieobecny', value: 'nieobecny' }
              ]"
            />
          </UFormField>
          <UFormField label="Notatka">
            <UInput v-model="note" placeholder="opcjonalnie" />
          </UFormField>
          <div class="flex justify-end gap-2 border-t border-default/60 pt-3">
            <UButton variant="ghost" color="neutral" @click="attendanceModalOpen = false">
              Zamknij
            </UButton>
            <UButton
              icon="i-lucide-check"
              @click="
                submitAttendance();
                attendanceModalOpen = false
              "
            >
              Zapisz obecność
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
