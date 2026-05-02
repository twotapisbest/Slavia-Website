<script setup lang="ts">
import type { Athlete, CompetitionResult, MyCalendarEntry } from '~/types/models'

definePageMeta({ middleware: 'auth' })

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()

const isAthleteRole = computed(() => auth.user.value?.role === 'Athlete')

type AthleteBundle = { athlete: Athlete | null, results: CompetitionResult[], calendarEntries: MyCalendarEntry[] }

const { data: bundle, refresh: refreshAthletePage } = await useAsyncData(
  'athlete-page-bundle',
  async () => {
    await auth.ensureSession()
    if (auth.user.value?.role !== 'Athlete') {
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

async function refreshResults() {
  await refreshAthletePage()
}

const resultForm = reactive<{
  snatch: number | null
  clean_and_jerk: number | null
  total: number
  date: string
}>({
  snatch: null,
  clean_and_jerk: null,
  total: 0,
  date: new Date().toISOString().substring(0, 10)
})

const profileForm = reactive({
  email: auth.user.value?.email || '',
  avatar_url: auth.user.value?.avatar_url || '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

watch(
  () => auth.user.value,
  (u) => {
    if (!u) return
    profileForm.email = u.email || ''
    profileForm.avatar_url = u.avatar_url || ''
  },
  { immediate: true }
)

const profileLoading = ref(false)
const avatarUploadLoading = ref(false)
const avatarFileInput = ref<HTMLInputElement | null>(null)

async function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('image/')) {
    toast.add({ title: 'Wybierz plik graficzny', color: 'warning' })
    return
  }
  avatarUploadLoading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await apiFetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
    profileForm.avatar_url = res.url
    toast.add({ title: 'Wgrano zdjęcie — zapisz zmiany profilu', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Upload nie powiódł się', description: String(err), color: 'error' })
  } finally {
    avatarUploadLoading.value = false
  }
}

async function updateProfile() {
  if (profileForm.newPassword || profileForm.currentPassword) {
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      toast.add({ title: 'Hasła się nie zgadzają', color: 'error' })
      return
    }
    if (!profileForm.newPassword) {
      toast.add({ title: 'Wpisz nowe hasło', color: 'warning' })
      return
    }
  }

  profileLoading.value = true
  try {
    const payload: Record<string, string> = {}
    if (profileForm.email) payload.email = profileForm.email
    if (profileForm.newPassword) payload.password = profileForm.newPassword
    if (profileForm.avatar_url !== undefined) payload.avatar_url = profileForm.avatar_url

    await apiFetch('/api/auth/profile', { method: 'PATCH', body: payload })
    await auth.fetchMe()
    toast.add({ title: 'Profil zaktualizowany', color: 'success' })
    profileForm.currentPassword = ''
    profileForm.newPassword = ''
    profileForm.confirmPassword = ''
  } catch (e) {
    toast.add({ title: 'Błąd aktualizacji profilu', description: String(e), color: 'error' })
  } finally {
    profileLoading.value = false
  }
}

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
    await apiFetch('/api/results', {
      method: 'POST',
      body: {
        athlete_id: athlete.value.id,
        snatch: resultForm.snatch,
        clean_and_jerk: resultForm.clean_and_jerk,
        total: resultForm.total,
        date: resultForm.date
      }
    })
    toast.add({ title: 'Zgłoszono wynik', description: 'Wynik trafił do oczekujących.', color: 'success' })
    resultForm.snatch = null
    resultForm.clean_and_jerk = null
    resultForm.total = 0
    resultForm.date = new Date().toISOString().substring(0, 10)
    await refreshResults()
  } catch (e) {
    toast.add({ title: 'Błąd zgłoszenia', description: String(e), color: 'error' })
  }
}

useSeoMeta({
  title: 'Profil konta — CKS Slavia Ruda Śląska',
  robots: 'noindex, nofollow'
})

const stats = computed(() => [
  { label: 'Najlepszy Rwanie', value: athlete.value?.best_snatch_kg ? `${athlete.value.best_snatch_kg} kg` : '—' },
  { label: 'Najlepszy Podrzut', value: athlete.value?.best_clean_jerk_kg ? `${athlete.value.best_clean_jerk_kg} kg` : '—' },
  { label: 'Suma (Biathlon)', value: athlete.value?.total_kg ? `${athlete.value.total_kg} kg` : '—' }
])

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

const pageHeading = computed(() =>
  isAthleteRole.value ? 'Panel Zawodnika' : 'Profil konta'
)
const pageLead = computed(() =>
  isAthleteRole.value
    ? 'To jest Twój osobisty panel. Tutaj możesz śledzić swoje postępy, wyniki z zawodów oraz zarządzać swoim profilem.'
    : 'Ustawienia konta (e-mail, hasło, zdjęcie). Funkcje zawodnicze są dostępne tylko dla kont z rolą zawodnika.'
)
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <div class="mb-10">
      <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-primary">
        <UIcon
          name="i-lucide-user"
          class="size-4"
        />
        {{ pageHeading }}
      </div>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Witaj, {{ auth.user.value?.username }}!
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        {{ pageLead }}
      </p>
      <div
        v-if="auth.isAthlete.value"
        class="mt-6 flex flex-wrap items-stretch gap-3"
      >
        <UButton
          to="/athlete/kalendarz"
          icon="i-lucide-calendar-heart"
          color="primary"
          variant="soft"
          class="min-h-11 w-full justify-center sm:w-auto"
        >
          Mój kalendarz startów
        </UButton>
      </div>
    </div>

    <!-- Licznik przypisanych zawodów (bez treningów klubowych) -->
    <div
      v-if="isAthleteRole && athlete"
      class="mb-10"
    >
      <UCard
        class="overflow-hidden border border-primary/25 bg-linear-to-br from-primary/10 via-card to-card"
        :ui="{ body: 'sm:p-6 p-5' }"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-inner">
              <UIcon
                name="i-lucide-calendar-check-2"
                class="size-7"
              />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-wider text-primary">
                Przypisane starty
              </p>
              <p class="mt-1 text-4xl font-black tabular-nums text-highlighted">
                {{ assignedCompetitionStartsCount }}
              </p>
              <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Liczba zawodów i wydarzeń, do których przypisała Cię kadra w systemie.
                Stałe treningi klubowe (pn./śr./pt.) nie wchodzą do tego licznika — są widoczne osobno w kalendarzu.
              </p>
            </div>
          </div>
          <UButton
            to="/athlete/kalendarz"
            trailing-icon="i-lucide-arrow-right"
            color="primary"
            class="shrink-0 self-start sm:self-center"
          >
            Pełny harmonogram
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Statystyki zawodnika -->
    <div
      v-if="isAthleteRole && athlete"
      class="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3"
    >
      <UCard
        v-for="s in stats"
        :key="s.label"
        class="border border-default/50 bg-muted/10"
      >
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
          {{ s.label }}
        </p>
        <p class="mt-2 text-3xl font-bold text-primary">
          {{ s.value }}
        </p>
      </UCard>
    </div>

    <div
      v-else-if="isAthleteRole && !athlete"
      class="mb-12"
    >
      <UAlert
        icon="i-lucide-info"
        title="Brak powiązanego profilu"
        description="Twoje konto nie jest jeszcze powiązane z rekordem zawodnika. Skontaktuj się z administratorem, aby połączyć swoje konto z danymi startowymi."
        color="warning"
        variant="subtle"
      />
    </div>

    <!-- Edycja profilu -->
    <section class="mb-12">
      <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-highlighted">
        <UIcon
          name="i-lucide-shield"
          class="size-5 text-primary"
        />
        Ustawienia konta
      </h2>
      <div class="slavia-form-panel shadow-md">
        <div class="slavia-form-panel__header">
          <div class="slavia-form-panel__title">
            <span class="slavia-form-panel__icon">
              <UIcon
                name="i-lucide-user-round"
                class="size-4"
              />
            </span>
            Dane logowania i zdjęcie
          </div>
        </div>
        <div class="slavia-form-panel__body">
          <div class="grid gap-5 sm:grid-cols-2">
            <UFormField label="Email">
              <UInput
                v-model="profileForm.email"
                type="email"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Zdjęcie profilowe">
              <input
                ref="avatarFileInput"
                type="file"
                accept="image/*"
                class="sr-only"
                @change="onAvatarFileChange"
              >
              <div class="flex flex-wrap items-center gap-2">
                <UInput
                  v-model="profileForm.avatar_url"
                  type="url"
                  placeholder="https://... lub wgraj plik"
                  size="lg"
                  class="min-w-0 flex-1"
                />
                <UButton
                  color="neutral"
                  variant="soft"
                  size="lg"
                  icon="i-lucide-upload"
                  :loading="avatarUploadLoading"
                  @click="avatarFileInput?.click()"
                >
                  Wgraj
                </UButton>
              </div>
              <p class="mt-2 text-xs text-muted">
                Możesz wkleić URL lub wgrać plik (Cloudinary). Poprzednie zdjęcie w Cloudinary jest usuwane przy zapisie, jeśli zmienisz adres.
              </p>
            </UFormField>
            <UFormField label="Nowe hasło (opcjonalnie)">
              <UInput
                v-model="profileForm.newPassword"
                type="password"
                placeholder="Zostaw puste aby nie zmieniać"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Potwierdzenie hasła">
              <UInput
                v-model="profileForm.confirmPassword"
                type="password"
                placeholder="Potwierdzenie nowego hasła"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="slavia-form-actions border-t border-default/60 pt-5">
            <UButton
              color="neutral"
              variant="soft"
              size="lg"
              @click="() => { profileForm.email = auth.user.value?.email || ''; profileForm.newPassword = ''; profileForm.confirmPassword = '' }"
            >
              Anuluj
            </UButton>
            <UButton
              size="lg"
              :loading="profileLoading"
              @click="updateProfile"
            >
              Zapisz zmiany
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="isAthleteRole && athlete"
      class="mb-12"
    >
      <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-highlighted">
        <UIcon
          name="i-lucide-flag"
          class="size-5 text-primary"
        />
        Zgłoś wynik do weryfikacji
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
            Trener zweryfikuje wpis — po akceptacji pojawi się na karcie i w rankingach.
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
            <UFormField label="Suma">
              <UInputNumber
                :value="resultForm.total"
                size="lg"
                class="w-full"
                disabled
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

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- Ostatnie wyniki -->
      <section v-if="isAthleteRole">
        <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-highlighted">
          <UIcon
            name="i-lucide-trophy"
            class="size-5 text-yellow-500"
          />
          Twoje ostatnie starty
        </h2>
        <UCard
          v-if="results && results.length > 0"
          :ui="{ body: 'p-0' }"
        >
          <table class="w-full text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-muted">
                  Data
                </th>
                <th class="px-4 py-3 text-center font-semibold text-muted">
                  Suma
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
                <td class="px-4 py-3 text-center">
                  <UBadge
                    :color="r.status === 'Approved' ? 'success' : 'warning'"
                    variant="subtle"
                    size="sm"
                  >
                    {{ r.status === 'Approved' ? 'Zatwierdzony' : 'Oczekujący' }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </UCard>
        <div
          v-else
          class="rounded-xl border border-dashed border-default p-10 text-center text-muted"
        >
          Nie znaleziono jeszcze żadnych wyników z Twoich startów.
        </div>
      </section>

      <!-- Szybkie akcje -->
      <section>
        <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-highlighted">
          <UIcon
            name="i-lucide-zap"
            class="size-5 text-primary"
          />
          Szybkie działania
        </h2>
        <div class="grid gap-4">
          <UCard
            v-if="isAthleteRole"
            class="hover:bg-muted/10 transition-colors"
          >
            <NuxtLink
              to="/athlete/dziennik"
              class="flex items-center justify-between group"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
                  <UIcon
                    name="i-lucide-book-marked"
                    class="size-5"
                  />
                </div>
                <div>
                  <h3 class="font-medium group-hover:text-cyan-600 transition-colors">Dziennik treningów</h3>
                  <p class="text-xs text-muted">Wpisy trenera po jednostkach</p>
                </div>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 text-muted group-hover:text-cyan-600"
              />
            </NuxtLink>
          </UCard>

          <UCard class="hover:bg-muted/10 transition-colors">
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

          <UCard class="hover:bg-muted/10 transition-colors">
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

          <UCard class="hover:bg-muted/10 transition-colors">
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
  </UContainer>
</template>
