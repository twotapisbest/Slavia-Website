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
  getDay
} from 'date-fns'
import { pl } from 'date-fns/locale'

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

// Import zewnętrznych zawodów
const { competitions: externalCompetitions, loading: externalLoading, fetchAll: fetchExternalCompetitions } = useExternalCompetitions()

const isAdmin = computed(() => auth.isAdmin.value || auth.isSuperAdmin.value)
const { data: competitions, refresh, pending } = await useAsyncData('competitions', () => apiFetch('/api/competitions').catch(() => []))

// Stan kalendarza
const currentDate = ref(new Date())
const monthStart = computed(() => startOfMonth(currentDate.value))
const monthEnd = computed(() => endOfMonth(monthStart.value))
const calendarStart = computed(() => startOfWeek(monthStart.value, { weekStartsOn: 1 }))
const calendarEnd = computed(() => endOfWeek(monthEnd.value, { weekStartsOn: 1 }))

const days = computed(() => {
  return eachDayOfInterval({
    start: calendarStart.value,
    end: calendarEnd.value
  })
})

const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

// Treningi: Poniedziałki, Środy, Piątki 15:00 - 18:00
const getTrainingsForDay = (date: Date) => {
  const day = getDay(date) // 0: Ndz, 1: Pon, ..., 5: Pt
  if ([1, 3, 5].includes(day)) {
    return [{
      id: `training-${format(date, 'yyyy-MM-dd')}`,
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
  const comps = (competitions.value || []).filter((e: any) => e.date.startsWith(dateStr)).map((e: any) => ({
    ...e,
    type: 'competition'
  }))
  
  // Zewnętrzne zawody z PZPC/SLPC
  const external = externalCompetitions.value
    .filter((e: any) => e.date.startsWith(dateStr))
    .map((e: any) => ({
      ...e,
      type: 'external'
    }))
  
  return [...getTrainingsForDay(date), ...comps, ...external]
}

// Zarządzanie wydarzeniami
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<string | null>(null)
const formState = reactive({
  title: '',
  date: '',
  location: '',
  description: '',
  category: 'club_event'
})

const categories = [
  { value: 'championship', label: '🏆 Mistrzostwa', desc: 'ogólnopol. / śląskie' },
  { value: 'league', label: '🥈 Liga', desc: 'zawody ligowe' },
  { value: 'club_event', label: '🌿 Wydarzenie klubowe', desc: 'obóz, zgrupowanie' },
]

function getEventClasses(event: any) {
  if (event.type === 'training')
    return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  const cat = event.category || 'club_event'
  if (cat === 'championship') return 'bg-red-500/15 border-red-500/40 text-red-400 font-bold'
  if (cat === 'league') return 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
  return 'bg-teal-500/15 border-teal-500/40 text-teal-400 font-bold'
}

function getEventIcon(event: any) {
  if (event.type === 'training') return 'i-lucide-dumbbell'
  const cat = event.category || 'club_event'
  if (cat === 'championship') return 'i-lucide-trophy'
  if (cat === 'league') return 'i-lucide-medal'
  return 'i-lucide-star'
}

function openModal(date?: Date, event?: any) {
  if (!isAdmin.value) return

  if (event && event.type === 'competition') {
    editingId.value = event.id
    formState.title = event.title
    formState.date = event.date.substring(0, 10)
    formState.location = event.location
    formState.description = event.description || ''
    formState.category = event.category || 'club_event'
  } else {
    editingId.value = null
    formState.title = ''
    formState.date = date ? format(date, 'yyyy-MM-dd') : ''
    formState.location = ''
    formState.description = ''
    formState.category = 'club_event'
  }
  isModalOpen.value = true
}

async function saveEvent() {
  if (!isAdmin.value) {
    toast.add({ title: 'Brak uprawnień', color: 'error' })
    return
  }

  if (!formState.title || !formState.date || !formState.location) {
    toast.add({ title: 'Uzupełnij wymagane pola', color: 'error' })
    return
  }
  isSubmitting.value = true
  try {
    if (editingId.value) {
      await apiFetch(`/api/competitions/${editingId.value}`, { method: 'PATCH', body: formState })
      toast.add({ title: 'Zaktualizowano', color: 'success' })
    } else {
      await apiFetch('/api/competitions', { method: 'POST', body: formState })
      toast.add({ title: 'Dodano wydarzenie', color: 'success' })
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
  if (!isAdmin.value) {
    toast.add({ title: 'Brak uprawnień', color: 'error' })
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

const nextMonth = () => currentDate.value = addMonths(currentDate.value, 1)
const prevMonth = () => currentDate.value = subMonths(currentDate.value, 1)
const goToToday = () => currentDate.value = new Date()

function handleDayClick(day: Date) {
  if (!isAdmin.value || !isSameMonth(day, monthStart.value)) return
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
          v-if="isAdmin" 
          icon="i-lucide-refresh-ccw" 
          size="lg" 
          color="neutral" 
          variant="ghost"
          :loading="externalLoading"
          @click="fetchExternalCompetitions().then(() => toast.add({ title: 'Zewnętrzne zawody załadowane', color: 'success' }))"
        >
          Importuj z PZPC
        </UButton>
        <UButton v-if="isAdmin" icon="i-lucide-plus" size="lg" @click="openModal()">
          Dodaj Zawody
        </UButton>
      </div>
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
              v-if="isAdmin && isSameMonth(day, monthStart)" 
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
              @click.stop="event.type === 'competition' ? openModal(undefined, event) : openModal(day)"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="truncate">{{ event.title }}</span>
                <UIcon :name="getEventIcon(event)" class="size-2.5 shrink-0 opacity-80" />
              </div>
              <span class="opacity-60">{{ event.time || event.location }}</span>
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
    <UModal v-model:open="isModalOpen" :title="editingId ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'">
      <template #content>
        <div class="p-6 space-y-4">
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
                @click="formState.category = cat.value"
              >
                {{ cat.label }}
              </button>
            </div>
          </UFormField>

          <UFormField label="Nazwa" required>
            <UInput v-model="formState.title" placeholder="Mistrzostwa Polski..." class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Data" required>
              <UInput v-model="formState.date" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Lokalizacja" required>
              <UInput v-model="formState.location" placeholder="Ruda Śląska" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Opis">
            <UTextarea v-model="formState.description" placeholder="Szczegóły..." :rows="3" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-3 mt-6">
            <UButton v-if="editingId" color="error" variant="ghost" icon="i-lucide-trash-2" @click="editingId && deleteEvent(editingId)">Usuń</UButton>
            <div class="flex-1"></div>
            <UButton color="neutral" variant="soft" @click="isModalOpen = false">Anuluj</UButton>
            <UButton :loading="isSubmitting" @click="saveEvent">Zapisz</UButton>
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
