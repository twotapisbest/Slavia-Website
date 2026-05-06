<script setup lang="ts">
import type { Athlete, CompetitionResult, MyCalendarEntry } from '~/types/models'

definePageMeta({ middleware: 'auth' })

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()

/** Konto z przypisaną rolą „Zawodnik” (nie mylić z dostępem SuperAdmin do tej strefy). */
const isAthleteRole = computed(() => auth.isAthlete.value)
const isAthletePortalAsSuperAdminOnly = computed(
  () => auth.isSuperAdmin.value && !auth.isAthlete.value
)

type AthleteBundle = { athlete: Athlete | null, results: CompetitionResult[], calendarEntries: MyCalendarEntry[] }
type AttendanceSummary = {
  athlete_id: string
  present_count: number
  absent_count: number
  pending_count: number
  attendance_percent: number
}

const { data: bundle, refresh: refreshAthletePage } = await useAsyncData(
  'athlete-page-bundle',
  async () => {
    await auth.ensureSession()
    const roles = auth.user.value?.roles ?? []
    if (!roles.includes('Athlete') && !roles.includes('SuperAdmin')) {
      return { athlete: null, results: [], calendarEntries: [] } satisfies AthleteBundle
    }
    const a = await apiFetch<Athlete | null>(`/api/athletes/me`).catch(() => null)
    const results = a?.id
      ? await apiFetch<CompetitionResult[]>(`/api/results/athlete/${a.id}/submissions`).catch(() => [])
      : []
    const cal = await apiFetch<{ entries: MyCalendarEntry[] }>('/api/athletes/my-calendar').catch(() => ({
      entries: [] as MyCalendarEntry[]
    }))
    return {
      athlete: a,
      results,
      calendarEntries: Array.isArray(cal.entries) ? cal.entries : []
    } satisfies AthleteBundle
  },
  { default: () => ({ athlete: null, results: [], calendarEntries: [] }) }
)

const athlete = computed(() => bundle.value?.athlete ?? null)
const results = computed(() => bundle.value?.results ?? [])
const attendanceSummary = ref<AttendanceSummary | null>(null)

async function refreshResults() {
  await refreshAthletePage()
  await refreshAttendanceSummary()
}

async function refreshAttendanceSummary() {
  if (!athlete.value?.id) {
    attendanceSummary.value = null
    return
  }
  attendanceSummary.value = await apiFetch<AttendanceSummary>(`/api/attendance/summary/${athlete.value.id}`).catch(() => null)
}

const resultForm = reactive<{
  snatch: number | null
  clean_and_jerk: number | null
  total: number
  date: string
  squat_kg: number | null
  bench_kg: number | null
  deadlift_kg: number | null
}>({
  snatch: null,
  clean_and_jerk: null,
  total: 0,
  date: new Date().toISOString().substring(0, 10),
  squat_kg: null,
  bench_kg: null,
  deadlift_kg: null
})

watch(
  () => [resultForm.snatch, resultForm.clean_and_jerk],
  ([snatch, clean]) => {
    resultForm.total = (snatch || 0) + (clean || 0)
  }
)

async function submitResult() {
  if (!athlete.value) {
    toast.add({ title: 'Brak profilu zawodnika', color: 'warning' })
    return
  }
  if (!resultForm.snatch || !resultForm.clean_and_jerk) {
    toast.add({ title: 'Podaj wynik', description: 'Wypełnij rwanie i podrzut.', color: 'warning' })
    return
  }

  try {
    const body: Record<string, unknown> = {
      athlete_id: athlete.value.id,
      snatch: resultForm.snatch,
      clean_and_jerk: resultForm.clean_and_jerk,
      total: resultForm.total,
      date: resultForm.date
    }
    if (resultForm.squat_kg != null && resultForm.squat_kg > 0) body.squat_kg = resultForm.squat_kg
    if (resultForm.bench_kg != null && resultForm.bench_kg > 0) body.bench_kg = resultForm.bench_kg
    if (resultForm.deadlift_kg != null && resultForm.deadlift_kg > 0) body.deadlift_kg = resultForm.deadlift_kg

    await apiFetch('/api/results', {
      method: 'POST',
      body
    })
    toast.add({ title: 'Zgłoszono wynik', description: 'Wynik trafił do oczekujących.', color: 'success' })
    resultForm.snatch = null
    resultForm.clean_and_jerk = null
    resultForm.total = 0
    resultForm.date = new Date().toISOString().substring(0, 10)
    resultForm.squat_kg = null
    resultForm.bench_kg = null
    resultForm.deadlift_kg = null
    await refreshResults()
  } catch (e) {
    toast.add({ title: 'Błąd zgłoszenia', description: String(e), color: 'error' })
  }
}

useSeoMeta({
  title: 'Profil konta — CKS Slavia Ruda Śląska',
  robots: 'noindex, nofollow'
})

const welcomeName = computed(
  () => athlete.value?.full_name?.trim() || auth.user.value?.username || 'Zawodniku'
)

const stats = computed(() => [
  {
    label: 'Najlepsze rwanie',
    shortLabel: 'Rwanie',
    value: athlete.value?.best_snatch_kg ? `${athlete.value.best_snatch_kg}` : '—',
    unit: athlete.value?.best_snatch_kg ? 'kg' : '',
    icon: 'i-lucide-arrow-up'
  },
  {
    label: 'Najlepszy podrzut',
    shortLabel: 'Podrzut',
    value: athlete.value?.best_clean_jerk_kg ? `${athlete.value.best_clean_jerk_kg}` : '—',
    unit: athlete.value?.best_clean_jerk_kg ? 'kg' : '',
    icon: 'i-lucide-arrow-down'
  },
  {
    label: 'Suma (dwubój)',
    shortLabel: 'Dwubój',
    value: athlete.value?.total_kg ? `${athlete.value.total_kg}` : '—',
    unit: athlete.value?.total_kg ? 'kg' : '',
    icon: 'i-lucide-trophy'
  }
])

const athleteDashboardTiles = [
  {
    to: '/athlete/kalendarz',
    title: 'Kalendarz startów',
    desc: 'Przypisania zawodów od kadry',
    icon: 'i-lucide-calendar-heart',
    ring: 'ring-primary/25 hover:ring-primary/45',
    iconBg: 'bg-primary/15 text-primary'
  },
  {
    to: '/athlete/analiza-sztangi',
    title: 'Tor sztangi',
    desc: 'Analiza nagrania w przeglądarce',
    icon: 'i-lucide-scan-line',
    ring: 'ring-violet-500/20 hover:ring-violet-500/40',
    iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
  },
  {
    to: '/dziennik',
    title: 'Dziennik treningów',
    desc: 'Wpisy po jednostkach',
    icon: 'i-lucide-book-marked',
    ring: 'ring-cyan-500/25 hover:ring-cyan-500/45',
    iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
  },
  {
    to: '/athlete/exercises',
    title: 'Inne ćwiczenia',
    desc: 'Przysiady, wyciskanie, martwy',
    icon: 'i-lucide-bar-chart-3',
    ring: 'ring-lime-500/25 hover:ring-lime-500/45',
    iconBg: 'bg-lime-500/15 text-lime-700 dark:text-lime-400'
  },
  {
    to: '/aktualnosci',
    title: 'Aktualności klubu',
    desc: 'Aktualności i komunikaty',
    icon: 'i-lucide-newspaper',
    ring: 'ring-amber-500/25 hover:ring-amber-500/45',
    iconBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
  },
  {
    to: '/chat',
    title: 'Czat z trenerem',
    desc: 'Wiadomości 1:1',
    icon: 'i-lucide-messages-square',
    ring: 'ring-sky-500/25 hover:ring-sky-500/45',
    iconBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-400'
  },
  {
    to: '/attendance',
    title: 'Moja obecność',
    desc: 'Zgłoś obecność i sprawdź historię',
    icon: 'i-lucide-user-check',
    ring: 'ring-indigo-500/25 hover:ring-indigo-500/45',
    iconBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400'
  },
  {
    to: '/athlete/timeline',
    title: 'Historia treningów',
    desc: 'Oś czasu: wyniki, obecność, dziennik',
    icon: 'i-lucide-timeline',
    ring: 'ring-fuchsia-500/25 hover:ring-fuchsia-500/45',
    iconBg: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400'
  },
  {
    to: '/athlete/plany',
    title: 'Plany treningowe',
    desc: 'Cele tygodnia i raport progresu',
    icon: 'i-lucide-clipboard-list',
    ring: 'ring-emerald-500/25 hover:ring-emerald-500/45',
    iconBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  },
  {
    to: '/athlete/regeneracja',
    title: 'Regeneracja',
    desc: 'Dzienny check-in snu i zmęczenia',
    icon: 'i-lucide-heart-pulse',
    ring: 'ring-rose-500/25 hover:ring-rose-500/45',
    iconBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
  }
] as const

/** Wydarzenia z przypisań kadry — bez wpisów kategorii „trening” (stałe jednostki w klubie liczą się osobno w kalendarzu). */
const assignedCompetitionStartsCount = computed(() => {
  const entries = bundle.value?.calendarEntries ?? []
  const ids = new Set<string>()
  for (const e of entries) {
    const cat = (e.competition.category || '').toLowerCase()
    if (cat === 'training') continue
    ids.add(e.competition.id)
  }
  return ids.size
})

onMounted(() => {
  void refreshAttendanceSummary()
})

const pageHeading = computed(() => {
  if (isAthletePortalAsSuperAdminOnly.value) return 'Strefa zawodnika'
  return isAthleteRole.value ? 'Panel Zawodnika' : 'Profil konta'
})
const pageLead = computed(() => {
  if (isAthletePortalAsSuperAdminOnly.value) {
    return 'Superadmin ma dostęp do całej aplikacji — tutaj widzisz widok jak dla konta z rolą zawodnika (jeśli masz powiązany profil zawodnika w bazie).'
  }
  return isAthleteRole.value
    ? 'To jest Twój osobisty panel. Tutaj możesz śledzić swoje postępy, wyniki z zawodów oraz zarządzać swoim profilem.'
    : 'Ustawienia konta (e-mail, hasło, zdjęcie). Funkcje zawodnicze są dostępne tylko dla kont z rolą zawodnika.'
})
</script>

<template>
  <UContainer class="py-8 md:py-11 lg:py-14">
    <!-- Hero dashboard -->
    <div
      class="relative mb-8 overflow-hidden rounded-[1.75rem] border border-primary/20 bg-linear-to-br from-primary/[0.14] via-card to-card shadow-sm ring-1 ring-primary/10 sm:rounded-3xl"
    >
      <div class="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-primary/25 blur-3xl" />
      <div class="pointer-events-none absolute -bottom-20 -left-16 size-60 rounded-full bg-primary/10 blur-3xl" />
      <div class="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div class="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div class="relative shrink-0">
            <div class="absolute -inset-1 rounded-full bg-linear-to-br from-primary/40 to-primary/5 opacity-80 blur-sm" />
            <UAvatar
              :src="auth.user.value?.avatar_url || undefined"
              :alt="welcomeName"
              size="xl"
              class="relative size-24 ring-2 ring-background shadow-lg sm:size-28"
            />
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                <UIcon
                  name="i-lucide-dumbbell"
                  class="size-3.5"
                />
                {{ pageHeading }}
              </span>
              <UBadge
                v-if="auth.rolesDisplayShort"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ auth.rolesDisplayShort }}
              </UBadge>
            </div>
            <h1 class="mt-3 text-3xl font-black tracking-tight text-highlighted sm:text-4xl">
              Cześć, {{ welcomeName }}
            </h1>
            <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              {{ pageLead }}
            </p>
          </div>
        </div>

        <!-- Skrócone PB w hero (tylko przy pełnym profilu) -->
        <div
          v-if="auth.canAccessAthletePortal && athlete"
          class="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch xl:flex-row"
        >
          <div
            v-for="s in stats"
            :key="s.shortLabel"
            class="flex items-center gap-3 rounded-2xl border border-default/50 bg-background/80 px-4 py-3 shadow-sm backdrop-blur-sm sm:min-w-38"
          >
            <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <UIcon
                :name="s.icon"
                class="size-5"
              />
            </div>
            <div class="min-w-0">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
                {{ s.shortLabel }}
              </p>
              <p class="truncate text-lg font-black tabular-nums text-highlighted">
                {{ s.value }}<span
                  v-if="s.unit"
                  class="ml-0.5 text-sm font-bold text-primary"
                >{{ s.unit }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Szybkie kafle (bento) -->
    <div
      v-if="auth.canAccessAthletePortal && athlete"
      class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <NuxtLink
        v-for="tile in athleteDashboardTiles"
        :key="tile.to"
        :to="tile.to"
        class="group relative overflow-hidden rounded-2xl border border-default/60 bg-card p-5 shadow-sm ring-1 ring-transparent transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="tile.ring"
      >
        <div class="flex items-start justify-between gap-3">
          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors"
            :class="tile.iconBg"
          >
            <UIcon
              :name="tile.icon"
              class="size-5"
            />
          </div>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-5 shrink-0 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          />
        </div>
        <p class="mt-4 font-bold text-highlighted">
          {{ tile.title }}
        </p>
        <p class="mt-1 text-xs leading-relaxed text-muted">
          {{ tile.desc }}
        </p>
      </NuxtLink>
    </div>

    <!-- Licznik startów + karty rekordów -->
    <div
      v-if="auth.canAccessAthletePortal && athlete"
      class="mb-10 grid gap-6 xl:grid-cols-12 xl:items-stretch"
    >
      <UCard
        class="overflow-hidden border-primary/25 bg-linear-to-br from-primary/11 via-card to-card xl:col-span-5"
        :ui="{ body: 'sm:p-6 p-5' }"
      >
        <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-inner ring-1 ring-primary/20">
              <UIcon
                name="i-lucide-calendar-check-2"
                class="size-7"
              />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Przypisane starty
              </p>
              <p class="mt-1 text-5xl font-black tabular-nums tracking-tight text-highlighted">
                {{ assignedCompetitionStartsCount }}
              </p>
              <p class="mt-3 max-w-md text-xs leading-relaxed text-muted sm:text-sm">
                Zawody i wydarzenia przypisane przez kadrę. Stałe treningi klubowe są osobno w kalendarzu.
              </p>
            </div>
          </div>
          <UButton
            to="/athlete/kalendarz"
            trailing-icon="i-lucide-arrow-right"
            color="primary"
            size="lg"
            class="shrink-0 self-start lg:self-center"
          >
            Harmonogram
          </UButton>
        </div>
      </UCard>

      <div class="grid gap-4 sm:grid-cols-3 xl:col-span-7">
        <UCard
          v-for="s in stats"
          :key="s.label"
          class="relative overflow-hidden border-default/50 bg-muted/5 transition hover:border-primary/20 hover:bg-muted/10"
        >
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <UIcon
                :name="s.icon"
                class="size-[1.15rem]"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
                {{ s.label }}
              </p>
              <p class="mt-1.5 text-2xl font-black tabular-nums text-highlighted sm:text-3xl">
                {{ s.value }}<span
                  v-if="s.unit"
                  class="ml-1 text-base font-bold text-primary sm:text-lg"
                >{{ s.unit }}</span>
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <div
      v-if="auth.canAccessAthletePortal && athlete && attendanceSummary"
      class="mb-10"
    >
      <UCard class="rounded-2xl border-default/70">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-black text-highlighted">Frekwencja treningowa</h2>
          <UBadge color="primary" variant="subtle">
            {{ attendanceSummary.attendance_percent }}%
          </UBadge>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-4">
          <div class="rounded-xl border border-default/50 p-3">
            <p class="text-xs text-muted">Obecności</p>
            <p class="text-2xl font-black text-success">{{ attendanceSummary.present_count }}</p>
          </div>
          <div class="rounded-xl border border-default/50 p-3">
            <p class="text-xs text-muted">Nieobecności</p>
            <p class="text-2xl font-black text-error">{{ attendanceSummary.absent_count }}</p>
          </div>
          <div class="rounded-xl border border-default/50 p-3">
            <p class="text-xs text-muted">Oczekuje</p>
            <p class="text-2xl font-black text-warning">{{ attendanceSummary.pending_count }}</p>
          </div>
          <div class="rounded-xl border border-default/50 p-3">
            <p class="text-xs text-muted">Frekwencja</p>
            <p class="text-2xl font-black text-primary">{{ attendanceSummary.attendance_percent }}%</p>
          </div>
        </div>
      </UCard>
    </div>

    <div
      v-else-if="auth.canAccessAthletePortal && !athlete"
      class="mb-10"
    >
      <UAlert
        icon="i-lucide-info"
        title="Brak powiązanego profilu"
        description="Twoje konto nie jest jeszcze powiązane z rekordem zawodnika. Skontaktuj się z administratorem, aby połączyć swoje konto z danymi startowymi."
        color="warning"
        variant="subtle"
        class="rounded-2xl"
      />
    </div>

    <div class="grid gap-10 xl:grid-cols-12 xl:gap-8">
      <!-- Lewa kolumna: formularze -->
      <div class="space-y-10 xl:col-span-7">
    <section>
      <h2 class="mb-5 flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
          <UIcon
            name="i-lucide-shield"
            class="size-[1.35rem]"
          />
        </span>
        <span class="text-lg font-black tracking-tight text-highlighted sm:text-xl">Ustawienia konta</span>
      </h2>
      <UCard class="rounded-2xl border-default/70 shadow-md ring-1 ring-default/40">
        <div class="space-y-3 p-4 sm:p-6">
          <p class="text-sm text-muted">
            Edycja danych konta została przeniesiona do jednego miejsca, aby uniknąć duplikacji formularzy.
          </p>
          <UButton
            to="/profil"
            color="primary"
            icon="i-lucide-user-round-cog"
            size="lg"
          >
            Przejdź do „Moje konto”
          </UButton>
        </div>
      </UCard>
    </section>

    <section
      v-if="auth.canAccessAthletePortal && athlete"
    >
      <h2 class="mb-5 flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
          <UIcon
            name="i-lucide-flag"
            class="size-[1.35rem]"
          />
        </span>
        <span class="text-lg font-black tracking-tight text-highlighted sm:text-xl">Zgłoś wynik do weryfikacji</span>
      </h2>
      <div class="slavia-form-panel shadow-md">
        <div class="slavia-form-panel__header">
          <div class="slavia-form-panel__title">
            <span class="slavia-form-panel__icon">
              <UIcon
                name="i-lucide-barbell"
                class="size-4"
              />
            </span>
            Wynik startowy
          </div>
          <p class="slavia-form-panel__desc">
            Trener zweryfikuje wpis — po akceptacji pojawi się na karcie i w rankingach. Pola przysiad / wycisk / martwy są opcjonalne.
          </p>
        </div>
        <div class="slavia-form-panel__body">
          <div class="grid gap-5 sm:grid-cols-2">
            <UFormField label="Rwanie (kg)">
              <UInputNumber
                v-model="resultForm.snatch"
                :min="0"
                :step="0.5"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Podrzut (kg)">
              <UInputNumber
                v-model="resultForm.clean_and_jerk"
                :min="0"
                :step="0.5"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Data">
              <UInput
                v-model="resultForm.date"
                type="date"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Suma (dwubój)">
              <UInputNumber
                :value="resultForm.total"
                size="lg"
                class="w-full"
                disabled
              />
            </UFormField>
          </div>
          <div class="grid gap-5 border-t border-default/40 pt-5 sm:grid-cols-3">
            <UFormField
              label="Przysiad (kg)"
              description="Opcjonalnie"
            >
              <UInputNumber
                v-model="resultForm.squat_kg"
                :min="0"
                :step="0.5"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Wyciskanie (kg)"
              description="Opcjonalnie"
            >
              <UInputNumber
                v-model="resultForm.bench_kg"
                :min="0"
                :step="0.5"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Martwy ciąg (kg)"
              description="Opcjonalnie"
            >
              <UInputNumber
                v-model="resultForm.deadlift_kg"
                :min="0"
                :step="0.5"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="slavia-form-actions border-t border-default/60 pt-5">
            <UButton
              color="primary"
              variant="soft"
              size="lg"
              @click="submitResult"
            >
              Zgłoś wynik
            </UButton>
          </div>
        </div>
      </div>
    </section>
      </div>

      <!-- Prawa kolumna: historia + skróty klubu -->
      <div class="space-y-10 xl:col-span-5">
      <!-- Ostatnie wyniki -->
      <section v-if="auth.canAccessAthletePortal">
        <h2 class="mb-5 flex items-center gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/15 text-yellow-600 ring-1 ring-yellow-500/25 dark:text-yellow-400">
            <UIcon
              name="i-lucide-trophy"
              class="size-[1.35rem]"
            />
          </span>
          <span class="text-lg font-black tracking-tight text-highlighted sm:text-xl">Ostatnie zgłoszenia</span>
        </h2>
        <UCard
          v-if="results && results.length > 0"
          class="overflow-hidden rounded-2xl ring-1 ring-default/40"
          :ui="{ body: 'p-0' }"
        >
          <table class="w-full text-sm">
            <thead class="border-b border-default/80 bg-muted/40">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-muted">
                  Data
                </th>
                <th class="px-4 py-3 text-center font-semibold text-muted">
                  Suma
                </th>
                <th class="px-4 py-3 text-center font-semibold text-muted">
                  Siła (opcj.)
                </th>
                <th class="px-4 py-3 text-center font-semibold text-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="r in results"
                :key="r.id"
                class="hover:bg-muted/20"
              >
                <td class="px-4 py-3 text-muted">
                  {{ r.date }}
                </td>
                <td class="px-4 py-3 text-center font-bold">
                  {{ r.total }} kg
                </td>
                <td class="max-w-40 px-4 py-3 text-center text-[11px] text-muted leading-snug">
                  <template v-if="r.squat_kg != null || r.bench_kg != null || r.deadlift_kg != null">
                    P {{ r.squat_kg ?? '—' }} · W {{ r.bench_kg ?? '—' }} · M {{ r.deadlift_kg ?? '—' }}
                  </template>
                  <template v-else>
                    —
                  </template>
                </td>
                <td class="px-4 py-3 text-center">
                  <UBadge
                    :color="r.status === 'Approved' ? 'success' : (r.status === 'Rejected' ? 'error' : 'warning')"
                    variant="subtle"
                    size="sm"
                  >
                    {{ r.status === 'Approved' ? 'Zatwierdzony' : (r.status === 'Rejected' ? 'Odrzucony' : 'Oczekujący') }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </UCard>
        <div
          v-else
          class="rounded-2xl border border-dashed border-default/70 bg-muted/20 px-6 py-12 text-center text-sm text-muted"
        >
          Nie masz jeszcze zgłoszonych wyników — po wysłaniu wpisu pojawią się tutaj ze statusem weryfikacji.
        </div>
      </section>

      <!-- Skróty publiczne (bez duplikatów kafli powyżej) -->
      <section>
        <h2 class="mb-5 flex items-center gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
            <UIcon
              name="i-lucide-compass"
              class="size-[1.35rem]"
            />
          </span>
          <span class="text-lg font-black tracking-tight text-highlighted sm:text-xl">Klub i narzędzia</span>
        </h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <UCard class="rounded-2xl transition-colors hover:bg-muted/15 sm:col-span-2">
            <NuxtLink
              to="/ranking"
              class="flex items-center justify-between group"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UIcon
                    name="i-lucide-trending-up"
                    class="size-5"
                  />
                </div>
                <div>
                  <h3 class="font-medium group-hover:text-primary transition-colors">Ranking Klubowy</h3>
                  <p class="text-xs text-muted">Zobacz jak wypadasz na tle innych zawodników</p>
                </div>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 text-muted group-hover:text-primary"
              />
            </NuxtLink>
          </UCard>

          <UCard class="rounded-2xl transition-colors hover:bg-muted/15">
            <NuxtLink
              to="/kalkulator-sinclair"
              class="flex items-center justify-between group"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <UIcon
                    name="i-lucide-calculator"
                    class="size-5"
                  />
                </div>
                <div>
                  <h3 class="font-medium group-hover:text-emerald-500 transition-colors">Kalkulator Sinclair</h3>
                  <p class="text-xs text-muted">Przelicz swoje wyniki na punkty Sinclaira</p>
                </div>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 text-muted group-hover:text-emerald-500"
              />
            </NuxtLink>
          </UCard>

          <UCard class="rounded-2xl transition-colors hover:bg-muted/15">
            <NuxtLink
              to="/kalendarz"
              class="flex items-center justify-between group"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <UIcon
                    name="i-lucide-calendar"
                    class="size-5"
                  />
                </div>
                <div>
                  <h3 class="font-medium group-hover:text-purple-500 transition-colors">Nadchodzące starty</h3>
                  <p class="text-xs text-muted">Sprawdź kalendarz zawodów klubowych</p>
                </div>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 text-muted group-hover:text-purple-500"
              />
            </NuxtLink>
          </UCard>
        </div>
      </section>
      </div>
    </div>
  </UContainer>
</template>
