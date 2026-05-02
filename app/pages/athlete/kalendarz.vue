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
import type { MyCalendarEntry } from '~/types/models'

definePageMeta({ middleware: 'athlete-calendar' })

useSeoMeta({
  title: 'Mój kalendarz — Slavia',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()

const { data: myData } = await useAsyncData(
  'athlete-my-calendar',
  () => apiFetch<{ entries: MyCalendarEntry[] }>('/api/athletes/my-calendar').catch(() => ({ entries: [] })),
  { default: () => ({ entries: [] }) }
)

const assignedByDate = computed(() => {
  const m = new Map<string, MyCalendarEntry[]>()
  for (const ent of myData.value?.entries ?? []) {
    const d = ent.competition.date?.substring(0, 10)
    if (!d) continue
    const arr = m.get(d) ?? []
    arr.push(ent)
    m.set(d, arr)
  }
  return m
})

const currentDate = ref(new Date())
const monthStart = computed(() => startOfMonth(currentDate.value))
const monthEnd = computed(() => endOfMonth(monthStart.value))
const calendarStart = computed(() => startOfWeek(monthStart.value, { weekStartsOn: 1 }))
const calendarEnd = computed(() => endOfWeek(monthEnd.value, { weekStartsOn: 1 }))

const days = computed(() =>
  eachDayOfInterval({
    start: calendarStart.value,
    end: calendarEnd.value
  })
)

const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

const { getEventClasses, getEventIcon } = useCalendarEventChips()

function getTrainingsForDay (date: Date) {
  const day = getDay(date)
  if ([1, 3, 5].includes(day)) {
    const ds = format(date, 'yyyy-MM-dd')
    return [{
      id: `training-${ds}`,
      type: 'training' as const,
      category: 'training' as const,
      status: 'scheduled' as const,
      title: 'Trening',
      time: '15:00 - 18:00',
      location: '',
      modalHint: 'Trening — wszyscy zawodnicy klubu',
      participantsLine: ''
    }]
  }
  return []
}

function getEventsForDay (date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const assigned = (assignedByDate.value.get(dateStr) ?? []).map((entry) => {
    const names = entry.participants.map(p => p.full_name).join(', ')
    return {
      id: entry.competition.id,
      type: 'competition' as const,
      category: entry.competition.category || 'club_event',
      status: entry.competition.status || 'scheduled',
      external_source: entry.competition.external_source || undefined,
      title: entry.competition.title,
      time: '' as const,
      location: entry.competition.location,
      modalHint: 'Przypisani zawodnicy widzą się nawzajem',
      participantsLine: names ? `Startuje z: ${names}` : ''
    }
  })
  return [...getTrainingsForDay(date), ...assigned]
}

const modalOpen = ref(false)
const selectedEvent = ref<Record<string, unknown> | null>(null)

function openDetail (ev: Record<string, unknown>) {
  selectedEvent.value = ev
  modalOpen.value = true
}

watch(modalOpen, (open) => {
  if (!open) selectedEvent.value = null
})

const nextMonth = () => (currentDate.value = addMonths(currentDate.value, 1))
const prevMonth = () => (currentDate.value = subMonths(currentDate.value, 1))
const goToToday = () => (currentDate.value = new Date())
</script>

<template>
  <UContainer class="py-8 md:py-12 lg:py-14">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">
        Zawodnik
      </p>
      <h1 class="text-3xl font-bold text-highlighted">
        Mój kalendarz
      </h1>
      <p class="mt-2 max-w-xl text-muted text-sm">
        Treningi klubowe (Pn, Śr, Pt) widoczne dla wszystkich.
        Poniżej tylko zawody i wydarzenia, do których trener lub administrator Cię przypisał — zobaczysz też kto jeszcze startuje.
      </p>
      <div class="mt-4">
        <UButton to="/kalendarz" variant="soft" color="neutral" icon="i-lucide-calendar-days">
          Pełny kalendarz klubu
        </UButton>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-2 bg-muted/20 p-1.5 rounded-xl border border-default">
        <UButton icon="i-lucide-chevron-left" variant="ghost" color="neutral" @click="prevMonth" />
        <UButton variant="ghost" color="neutral" class="min-w-[160px] font-bold text-highlighted" @click="goToToday">
          {{ format(currentDate, 'MMMM yyyy', { locale: pl }) }}
        </UButton>
        <UButton icon="i-lucide-chevron-right" variant="ghost" color="neutral" @click="nextMonth" />
      </div>
    </div>

    <div class="border border-default rounded-2xl overflow-hidden bg-card shadow-2xl">
      <div class="grid grid-cols-7 border-b border-default bg-muted/30">
        <div v-for="d in weekDays" :key="d" class="py-4 text-center text-xs font-black uppercase tracking-widest text-muted">
          {{ d }}
        </div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="day in days"
          :key="day.toString()"
          class="min-h-[140px] border-r border-b border-default last:border-r-0 p-2 transition-colors hover:bg-primary/5"
          :class="[
            !isSameMonth(day, monthStart) ? 'bg-muted/10 opacity-30' : '',
            isToday(day) ? 'bg-primary/5' : ''
          ]"
        >
          <div class="flex justify-between items-start mb-2">
            <span
              class="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full"
              :class="isToday(day) ? 'bg-primary text-white shadow-lg' : 'text-muted'"
            >
              {{ format(day, 'd') }}
            </span>
          </div>
          <div class="space-y-1 overflow-y-auto max-h-[100px] scrollbar-hide">
            <button
              v-for="ev in getEventsForDay(day)"
              :key="String(ev.id) + String(ev.type)"
              type="button"
              class="w-full text-left text-[10px] p-1.5 rounded-lg border flex flex-col leading-tight cursor-pointer transition-all hover:brightness-110"
              :class="getEventClasses(ev)"
              @click="openDetail(ev)"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="truncate font-semibold">{{ ev.title }}</span>
                <UIcon :name="getEventIcon(ev)" class="size-2.5 shrink-0 opacity-80" />
              </div>
              <span class="opacity-60">{{ ev.time || ev.location }}</span>
              <span v-if="ev.status && ev.status !== 'scheduled'" class="text-[10px] uppercase tracking-[0.15em] font-semibold mt-1">
                {{ ev.status === 'cancelled' ? 'Odwołane' : ev.status === 'moved' ? 'Przesunięte' : '' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

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

    <UModal
      v-model:open="modalOpen"
      :title="String(selectedEvent?.title ?? 'Szczegóły')"
      :ui="{ overlay: 'z-[190]', content: 'z-[200] max-h-[90vh] overflow-y-auto' }"
    >
      <template #content>
        <div class="p-6 space-y-3 text-sm">
          <p v-if="selectedEvent?.modalHint" class="text-muted">
            {{ selectedEvent.modalHint }}
          </p>
          <p v-if="selectedEvent?.participantsLine" class="text-highlighted whitespace-pre-wrap">
            {{ selectedEvent.participantsLine }}
          </p>
          <p v-if="selectedEvent?.location" class="text-highlighted">
            {{ selectedEvent.location }}
          </p>
          <UButton block color="neutral" variant="soft" @click="modalOpen = false">
            Zamknij
          </UButton>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
