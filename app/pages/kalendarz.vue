<script setup lang="ts">
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  getDay,
  isValid
} from 'date-fns'
import { pl } from 'date-fns/locale'
import type { Athlete } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

useSeoMeta({
  title: 'Kalendarz — Slavia Ruda Śląska',
  description: 'Kalendarz zawodów i treningów CKS Slavia.',
  ogTitle: 'Kalendarz wydarzeń — CKS Slavia',
  ogDescription: 'Sprawdź harmonogram treningów, zawodów i wydarzeń klubowych CKS Slavia.',
  twitterCard: 'summary'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()
const config = useRuntimeConfig()

function publicBase () {
  return String(config.public.apiBase || '').replace(/\/$/, '')
}

// Import zewnętrznych zawodów
const { competitions: externalCompetitions, loading: externalLoading, fetchAll: fetchExternalCompetitions } = useExternalCompetitions()

const canManageEvents = computed(() => auth.isAdmin.value || auth.isTrainer.value || auth.isSuperAdmin.value)

// Bez SSR: na hostingu Node często nie ma dostępu do API / złego apiBase — strona się wywalała u gości.
const { data: competitions, refresh, pending: competitionsPending } = await useAsyncData(
  'competitions-public',
  () => $fetch<unknown[]>(`${publicBase()}/api/competitions`).catch(() => []),
  { default: () => [], server: false, lazy: true }
)

const athletesPickList = ref<Array<{ id: string, full_name: string }>>([])
const participantIds = ref<string[]>([])

async function loadAthletesPickList () {
  try {
    if (!auth.token.value) {
      athletesPickList.value = []
      return
    }
    const rows = await apiFetch<Athlete[]>('/api/athletes/admin').catch(() => null)
    const list = Array.isArray(rows) ? rows : []
    athletesPickList.value = list
      .filter(a => a.is_active !== false)
      .map(a => ({ id: a.id, full_name: a.full_name }))
  } catch {
    athletesPickList.value = []
  }
}

// Stan kalendarza — przechowujemy ms **pierwszego dnia miesiąca** (number),
// żeby uniknąć psucia `Date` przy serializacji payloadu Nuxt (SSR → hydration).
function monthFirstMsFromDate (d: Date | number | string) {
  const dt = d instanceof Date ? d : new Date(d)
  if (!isValid(dt)) {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  }
  const t = new Date(dt.getFullYear(), dt.getMonth(), 1).getTime()
  return Number.isFinite(t) ? t : Date.now()
}

const monthFirstMs = ref(monthFirstMsFromDate(new Date()))

onMounted(() => {
  fetchExternalCompetitions()
  refresh()
  if (!Number.isFinite(monthFirstMs.value)) {
    monthFirstMs.value = monthFirstMsFromDate(new Date())
  }
  if (auth.token.value) {
    auth.fetchMe()
  }
})

const currentDate = computed(() => new Date(monthFirstMs.value))

const monthStart = computed(() => new Date(monthFirstMs.value))
const monthEnd = computed(() => endOfMonth(new Date(monthFirstMs.value)))
const calendarStart = computed(() => startOfWeek(monthStart.value, { weekStartsOn: 1 }))
const calendarEnd = computed(() => endOfWeek(monthEnd.value, { weekStartsOn: 1 }))

const days = computed(() => {
  const start = calendarStart.value
  const end = calendarEnd.value
  if (!isValid(start) || !isValid(end)) {
    const t = monthFirstMsFromDate(new Date())
    const m0 = new Date(t)
    return eachDayOfInterval({
      start: startOfWeek(m0, { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(m0), { weekStartsOn: 1 })
    })
  }
  if (start.getTime() > end.getTime()) {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(start), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(start), { weekStartsOn: 1 })
    })
  }
  return eachDayOfInterval({ start, end })
})

const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

// Treningi: Poniedziałki, Środy, Piątki 15:00 - 18:00
const getTrainingsForDay = (date: Date) => {
  const day = getDay(date) // 0: Ndz, 1: Pon, ..., 5: Pt
  if ([1, 3, 5].includes(day)) {
    const ds = format(date, 'yyyy-MM-dd')
    return [{
      id: `training-${ds}`,
      date: ds,
      title: 'Trening',
      time: '15:00 - 18:00',
      type: 'training'
    }]
  }
  return []
}

const getEventsForDay = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd')
  
  // Lokalne zawody z bazy danych
  const comps = (competitions.value || []).filter((e: any) => typeof e?.date === 'string' && e.date.startsWith(dateStr)).map((e: any) => ({
    ...e,
    type: 'competition'
  }))
  
  // Zewnętrzne zawody z PZPC/SLPC
  const external = externalCompetitions.value
    .filter((e: any) => typeof e?.date === 'string' && e.date.startsWith(dateStr))
    .map((e: any) => ({
      ...e,
      type: 'external'
    }))
  
  return [...getTrainingsForDay(date), ...comps, ...external]
}

/** Kontekst otwartego wpisu (banner w modalu — external/training vs gość). */
const bannerEvent = ref<any>(null)

// Zarządzanie wydarzeniami
const isModalOpen = ref(false)

watch(isModalOpen, (open) => {
  if (!open) {
    bannerEvent.value = null
  }
})

const isSubmitting = ref(false)
const editingId = ref<string | null>(null)
const formState = reactive({
  title: '',
  date: '',
  location: '',
  description: '',
  category: 'club_event',
  status: 'scheduled'
})
const readOnlyEvent = ref(false)

const categories = [
  { value: 'championship', label: '🏆 Mistrzostwa', desc: 'ogólnopol. / śląskie' },
  { value: 'league', label: '🥈 Liga', desc: 'zawody ligowe' },
  { value: 'club_event', label: '🌿 Wydarzenie klubowe', desc: 'obóz, zgrupowanie' },
  { value: 'training', label: '💪 Trening', desc: 'planowany trening lub zgrupowanie' },
]

const { getEventClasses, getEventIcon } = useCalendarEventChips()

async function openModal (date?: Date, event?: any) {
  if (auth.token.value) {
    await auth.fetchMe()
  }

  // Tworzenie nowego zdarzenia - tylko dla uprawniony
  if (!event && !canManageEvents.value) return

  bannerEvent.value = event ?? null

  participantIds.value = []
  readOnlyEvent.value = false
  if (event) {
    formState.title = event.title
    formState.date = event.date ? event.date.substring(0, 10) : (date ? format(date, 'yyyy-MM-dd') : '')
    formState.location = event.location || ''
    formState.description = event.description || ''
    formState.category = event.category || (event.type === 'training' ? 'training' : 'club_event')
    formState.status = event.status || 'scheduled'
    if (event.type === 'external') {
      editingId.value = null
      readOnlyEvent.value = true
    } else if (event.type === 'training') {
      editingId.value = `training-${event.date}`
      readOnlyEvent.value = true
    } else {
      editingId.value = event.id
      readOnlyEvent.value = !canManageEvents.value
      if (canManageEvents.value && event.id) {
        await loadAthletesPickList()
        const parts = await apiFetch<Array<{ athlete_id: string }>>(`/api/competitions/${event.id}/participants`).catch(() => [])
        participantIds.value = parts.map(p => p.athlete_id)
      }
    }
  } else {
    editingId.value = null
    formState.title = ''
    formState.date = date ? format(date, 'yyyy-MM-dd') : ''
    formState.location = ''
    formState.description = ''
    formState.category = 'club_event'
    formState.status = 'scheduled'
    readOnlyEvent.value = false
    participantIds.value = []
    if (canManageEvents.value) {
      await loadAthletesPickList()
    }
  }
  isModalOpen.value = true
}

async function saveEvent() {
  if (!canManageEvents.value) {
    toast.add({ title: 'Brak uprawnień', color: 'error' })
    return
  }

  if (!formState.title || !formState.date || !formState.location) {
    toast.add({ title: 'Uzupełnij wymagane pola', color: 'error' })
    return
  }
  isSubmitting.value = true
  try {
    let competitionId = editingId.value as string | null
    if (editingId.value) {
      await apiFetch(`/api/competitions/${editingId.value}`, { method: 'PATCH', body: formState })
      toast.add({ title: 'Zaktualizowano', color: 'success' })
    } else {
      const created = await apiFetch<{ id: string }>('/api/competitions', { method: 'POST', body: formState })
      competitionId = created?.id ?? null
      toast.add({ title: 'Dodano wydarzenie', color: 'success' })
    }
    if (competitionId && !String(competitionId).startsWith('training-')) {
      try {
        await apiFetch(`/api/competitions/${competitionId}/participants`, {
          method: 'PUT',
          body: { athlete_ids: participantIds.value }
        })
      } catch (pe) {
        toast.add({
          title: 'Wydarzenie zapisane — problem z przypisaniami',
          description: getApiErrorMessage(pe),
          color: 'warning'
        })
      }
    }
    isModalOpen.value = false
    await refresh()
  } catch (err) {
    toast.add({ title: 'Błąd zapisu', description: String(err), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

async function deleteEvent(id: string) {
  if (!canManageEvents.value) {
    toast.add({ title: 'Brak uprawnień', color: 'error' })
    return
  }

  if (id.startsWith('training-')) {
    toast.add({ title: 'Treningi klubowe są generowane automatycznie (Pn, Śr, Pt).', color: 'neutral' })
    return
  }

  if (!confirm('Usunąć?')) return
  try {
    await apiFetch(`/api/competitions/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Usunięto', color: 'success' })
    await refresh()
  } catch (err) {
    toast.add({ title: 'Błąd usuwania', color: 'error' })
  }
}

const nextMonth = () => {
  monthFirstMs.value = monthFirstMsFromDate(addMonths(new Date(monthFirstMs.value), 1))
}
const prevMonth = () => {
  monthFirstMs.value = monthFirstMsFromDate(subMonths(new Date(monthFirstMs.value), 1))
}
const goToToday = () => {
  monthFirstMs.value = monthFirstMsFromDate(new Date())
}

function handleDayClick(day: Date) {
  if (!canManageEvents.value || !isSameMonth(day, monthStart.value)) return
  openModal(day)
}
</script>

<template>
  <UContainer class="py-10">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
      <div>
        <h1 class="text-4xl font-black tracking-tight text-highlighted uppercase italic">
          Kalendarz <span class="text-primary italic">Slavia</span>
        </h1>
        <p class="text-muted mt-1 font-medium">Harmonogram treningów i startów klubowych.</p>
      </div>

      <div class="flex items-center gap-2 bg-muted/20 p-1.5 rounded-xl border border-default">
        <UButton icon="i-lucide-chevron-left" variant="ghost" color="neutral" @click="prevMonth" />
        <UButton variant="ghost" color="neutral" class="min-w-[140px] font-bold text-highlighted" @click="goToToday">
          {{ format(currentDate, 'MMMM yyyy', { locale: pl }) }}
        </UButton>
        <UButton icon="i-lucide-chevron-right" variant="ghost" color="neutral" @click="nextMonth" />
      </div>

      <div class="flex items-center gap-2">
        <UButton 
          v-if="canManageEvents" 
          icon="i-lucide-refresh-ccw" 
          size="lg" 
          color="neutral" 
          variant="ghost"
          :loading="externalLoading"
          @click="fetchExternalCompetitions().then(() => toast.add({ title: 'Zewnętrzne zawody załadowane', color: 'success' }))"
        >
          Importuj z PZPC
        </UButton>
        <UButton v-if="canManageEvents" icon="i-lucide-plus" size="lg" @click="openModal()">
          Dodaj wydarzenie
        </UButton>
      </div>
    </div>

    <div
      v-if="competitionsPending"
      class="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-default bg-muted/20 px-4 py-3 text-sm text-muted"
    >
      <UIcon name="i-lucide-loader-2" class="size-4 shrink-0 animate-spin" />
      Ładowanie wydarzeń z serwera… (treningi i import PZPC są już widoczne)
    </div>

    <!-- Calendar Grid -->
    <div class="border border-default rounded-2xl overflow-hidden bg-card shadow-2xl">
      <!-- Header -->
      <div class="grid grid-cols-7 border-b border-default bg-muted/30">
        <div v-for="day in weekDays" :key="day" class="py-4 text-center text-xs font-black uppercase tracking-widest text-muted">
          {{ day }}
        </div>
      </div>

      <!-- Days -->
      <div class="grid grid-cols-7">
        <div 
          v-for="day in days" 
          :key="day.toString()" 
          class="min-h-[140px] border-r border-b border-default last:border-r-0 p-2 transition-colors hover:bg-primary/5 group relative"
          :class="[
            !isSameMonth(day, monthStart) ? 'bg-muted/10 opacity-30' : '',
            isToday(day) ? 'bg-primary/5' : ''
          ]"
          @click="handleDayClick(day)"
        >
          <div class="flex justify-between items-start mb-2">
            <span 
              class="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full"
              :class="isToday(day) ? 'bg-primary text-white shadow-lg' : 'text-muted'"
            >
              {{ format(day, 'd') }}
            </span>
            <UButton 
              v-if="canManageEvents && isSameMonth(day, monthStart)" 
              icon="i-lucide-plus" 
              variant="ghost" 
              size="xs" 
              class="opacity-0 group-hover:opacity-100 transition-opacity" 
              @click.stop="openModal(day)"
            />
          </div>

          <div class="space-y-1 overflow-y-auto max-h-[100px] scrollbar-hide">
            <div 
              v-for="event in getEventsForDay(day)" 
              :key="event.id"
              class="text-[10px] p-1.5 rounded-lg border flex flex-col leading-tight cursor-pointer transition-all hover:brightness-110"
              :class="getEventClasses(event)"
              @click.stop="openModal(undefined, event)"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="truncate">{{ event.title }}</span>
                <UIcon :name="getEventIcon(event)" class="size-2.5 shrink-0 opacity-80" />
              </div>
              <span class="opacity-60">{{ event.time || event.location }}</span>
              <span v-if="event.status && event.status !== 'scheduled'" class="text-[10px] uppercase tracking-[0.15em] font-semibold mt-1">
                {{ event.status === 'cancelled' ? 'Odwołane' : event.status === 'moved' ? 'Przesunięte' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legenda -->
    <div class="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-2xl bg-muted/10 border border-default">
      <div class="flex items-center gap-3">
        <div class="w-3 h-7 rounded-full bg-blue-500/40 border border-blue-500/50 shrink-0"></div>
        <div>
          <p class="text-xs font-black text-blue-400 uppercase">Trening</p>
          <p class="text-[10px] text-muted">Pn, Śr, Pt 15-18</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-3 h-7 rounded-full bg-red-500/40 border border-red-500/50 shrink-0"></div>
        <div>
          <p class="text-xs font-black text-red-400 uppercase">Mistrzostwa</p>
          <p class="text-[10px] text-muted">ogólnopol. / śląskie</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-3 h-7 rounded-full bg-amber-500/40 border border-amber-500/50 shrink-0"></div>
        <div>
          <p class="text-xs font-black text-amber-400 uppercase">Liga</p>
          <p class="text-[10px] text-muted">zawody ligowe</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-3 h-7 rounded-full bg-teal-500/40 border border-teal-500/50 shrink-0"></div>
        <div>
          <p class="text-xs font-black text-teal-400 uppercase">Wydarzenie klubowe</p>
          <p class="text-[10px] text-muted">obóz, zgrupowanie</p>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <UModal
      v-model:open="isModalOpen"
      :title="readOnlyEvent ? 'Szczegóły wydarzenia' : (editingId ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie')"
      :ui="{ overlay: 'z-[190]', content: 'z-[200] max-h-[90vh] overflow-y-auto' }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <div v-if="readOnlyEvent" class="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
            <template v-if="bannerEvent?.type === 'external'">
              <span v-if="canManageEvents">Import z kalendarza PZPC/SLPC — podgląd tylko do odczytu. Wydarzenia klubu nadal możesz dodawać i edytować przez wpisy z bazy.</span>
              <span v-else>Podgląd importowanych zawodów (PZPC/SLPC). Wydarzenia z bazy klubu mogą dodawać i edytować trener lub administrator — zaloguj się na takie konto.</span>
            </template>
            <template v-else-if="bannerEvent?.type === 'training'">
              <span v-if="canManageEvents">Stałe godziny treningów w grafiku (Pn, Śr, Pt). Te pozycje nie są edytowalne tutaj — dodawaj i zmieniaj osobne wydarzenia z bazy klubu.</span>
              <span v-else>To stały wpis treningowy z grafiku — podgląd bez edycji. Wydarzenia klubu dodaje trener lub administrator po zalogowaniu.</span>
            </template>
            <template v-else>
              Podgląd tylko do odczytu. Zaloguj się jako trener lub administrator, aby dodawać i edytować wydarzenia z bazy klubu.
            </template>
          </div>
          <UFormField label="Kategoria" required>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="cat in categories"
                :key="cat.value"
                type="button"
                class="p-2.5 rounded-xl border-2 text-[11px] font-bold text-center transition-all"
                :class="formState.category === cat.value
                  ? cat.value === 'championship' ? 'bg-red-500/20 border-red-500 text-red-400'
                    : cat.value === 'league' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-teal-500/20 border-teal-500 text-teal-400'
                  : 'border-default bg-muted/10 text-muted hover:bg-muted/30'"
                @click="!readOnlyEvent && (formState.category = cat.value)"
                :disabled="readOnlyEvent"
              >
                {{ cat.label }}
              </button>
            </div>
          </UFormField>

          <UFormField label="Nazwa" required>
            <UInput v-model="formState.title" placeholder="Mistrzostwa Polski..." class="w-full" :disabled="readOnlyEvent" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Data" required>
              <UInput v-model="formState.date" type="date" class="w-full" :disabled="readOnlyEvent" />
            </UFormField>
            <UFormField label="Lokalizacja" required>
              <UInput v-model="formState.location" placeholder="Ruda Śląska" class="w-full" :disabled="readOnlyEvent" />
            </UFormField>
          </div>
          <UFormField label="Status">
            <select
              v-model="formState.status"
              class="slavia-select w-full"
              :disabled="readOnlyEvent"
            >
              <option value="scheduled">Zaplanowane</option>
              <option value="cancelled">Odwołane</option>
              <option value="moved">Przesunięte</option>
            </select>
          </UFormField>
          <div v-if="canManageEvents && !readOnlyEvent && athletesPickList.length" class="rounded-xl border border-default p-3 space-y-2">
            <p class="text-xs font-bold text-muted uppercase tracking-wide">
              Przypisani zawodnicy (startują razem)
            </p>
            <div class="max-h-40 overflow-y-auto space-y-2">
              <label
                v-for="a in athletesPickList"
                :key="a.id"
                class="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  v-model="participantIds"
                  type="checkbox"
                  :value="a.id"
                  class="rounded border-default"
                >
                <span>{{ a.full_name }}</span>
              </label>
            </div>
          </div>
          <UFormField label="Opis">
            <UTextarea v-model="formState.description" placeholder="Szczegóły..." :rows="3" class="w-full" :disabled="readOnlyEvent" />
          </UFormField>
          <div class="flex justify-end gap-3 mt-6">
            <UButton
              v-if="editingId && canManageEvents && !readOnlyEvent && typeof editingId === 'string' && !editingId.startsWith('training-')"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="editingId && deleteEvent(editingId)"
            >
              Usuń
            </UButton>
            <div class="flex-1"></div>
            <UButton color="neutral" variant="soft" @click="isModalOpen = false">Anuluj</UButton>
            <UButton :loading="isSubmitting" :disabled="readOnlyEvent" @click="saveEvent">Zapisz</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
