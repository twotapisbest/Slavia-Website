<script setup lang="ts">
import type { Athlete, CompetitionResult } from '~/types/models'

definePageMeta({ middleware: 'auth' })

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()

const isAthleteRole = computed(() => auth.user.value?.role === 'Athlete')

type AthleteBundle = { athlete: Athlete | null, results: CompetitionResult[] }

const { data: bundle, refresh: refreshAthletePage } = await useAsyncData(
  'athlete-page-bundle',
  async () => {
    await auth.ensureSession()
    if (auth.user.value?.role !== 'Athlete') {
      return { athlete: null, results: [] } satisfies AthleteBundle
    }
    const a = await apiFetch<Athlete | null>(`/api/athletes/me`).catch(() => null)
    const results = a?.id
      ? await apiFetch<CompetitionResult[]>(`/api/results/athlete/${a.id}/submissions`).catch(() => [])
      : []
    return { athlete: a, results } satisfies AthleteBundle
  },
  { default: () => ({ athlete: null, results: [] }) }
)

const athlete = computed(() => bundle.value?.athlete ?? null)
const results = computed(() => bundle.value?.results ?? [])

async function refreshResults () {
  await refreshAthletePage()
}

const resultForm = reactive({
  snatch: null as number | null,
  clean_and_jerk: null as number | null,
  total: 0,
  date: new Date().toISOString().substring(0, 10),
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
        date: resultForm.date,
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
  <UContainer class="py-10 md:py-14">
    <div class="mb-10">
      <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-primary">
        <UIcon name="i-lucide-user" class="size-4" />
        {{ pageHeading }}
      </div>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Witaj, {{ auth.user.value?.username }}!
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        {{ pageLead }}
      </p>
      <div v-if="auth.isAthlete.value" class="mt-6">
        <UButton to="/athlete/kalendarz" icon="i-lucide-calendar-heart" color="primary" variant="soft">
          Mój kalendarz startów
        </UButton>
      </div>
    </div>

    <!-- Statystyki zawodnika -->
    <div v-if="isAthleteRole && athlete" class="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
      <UCard v-for="s in stats" :key="s.label" class="border border-default/50 bg-muted/10">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
          {{ s.label }}
        </p>
        <p class="mt-2 text-3xl font-bold text-primary">
          {{ s.value }}
        </p>
      </UCard>
    </div>

    <div v-else-if="isAthleteRole && !athlete" class="mb-12">
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
        <UIcon name="i-lucide-shield" class="size-5 text-primary" />
        Ustawienia konta
      </h2>
      <UCard class="p-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Email">
            <UInput v-model="profileForm.email" type="email" class="w-full" />
          </UFormField>
          <UFormField label="URL zdjęcia profilowego">
            <UInput v-model="profileForm.avatar_url" type="url" placeholder="https://..." class="w-full" />
            <p class="mt-1 text-xs text-muted">
              Wklej adres po uploadzie (np. Cloudinary) lub zostaw puste.
            </p>
          </UFormField>
          <UFormField label="Nowe hasło (opcjonalnie)">
            <UInput v-model="profileForm.newPassword" type="password" placeholder="Zostaw puste aby nie zmieniać" class="w-full" />
          </UFormField>
          <UFormField label="Potwierdzenie hasła">
            <UInput v-model="profileForm.confirmPassword" type="password" placeholder="Potwierdzenie nowego hasła" class="w-full" />
          </UFormField>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <UButton color="neutral" variant="soft" @click="() => { profileForm.email = auth.user.value?.email || ''; profileForm.newPassword = ''; profileForm.confirmPassword = '' }">
            Anuluj
          </UButton>
          <UButton :loading="profileLoading" @click="updateProfile">
            Zapisz zmiany
          </UButton>
        </div>
      </UCard>
    </section>

    <section v-if="isAthleteRole && athlete" class="mb-12">
      <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-highlighted">
        <UIcon name="i-lucide-flag" class="size-5 text-primary" />
        Zgłoś wynik do weryfikacji
      </h2>
      <UCard class="p-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Rwanie (kg)">
            <UInputNumber v-model="resultForm.snatch" :min="0" step="0.5" class="w-full" />
          </UFormField>
          <UFormField label="Podrzut (kg)">
            <UInputNumber v-model="resultForm.clean_and_jerk" :min="0" step="0.5" class="w-full" />
          </UFormField>
          <UFormField label="Data">
            <UInput v-model="resultForm.date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Suma">
            <UInputNumber :value="resultForm.total" class="w-full" disabled />
          </UFormField>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <UButton color="neutral" variant="soft" @click="submitResult">
            Zgłoś wynik
          </UButton>
        </div>
      </UCard>
    </section>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- Ostatnie wyniki -->
      <section v-if="isAthleteRole">
        <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-highlighted">
          <UIcon name="i-lucide-trophy" class="size-5 text-yellow-500" />
          Twoje ostatnie starty
        </h2>
        <UCard v-if="results && results.length > 0" :ui="{ body: 'p-0' }">
          <table class="w-full text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-muted">Data</th>
                <th class="px-4 py-3 text-center font-semibold text-muted">Suma</th>
                <th class="px-4 py-3 text-center font-semibold text-muted">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="r in results" :key="r.id" class="hover:bg-muted/20">
                <td class="px-4 py-3 text-muted">{{ r.date }}</td>
                <td class="px-4 py-3 text-center font-bold">{{ r.total }} kg</td>
                <td class="px-4 py-3 text-center">
                  <UBadge :color="r.status === 'Approved' ? 'success' : 'warning'" variant="subtle" size="sm">
                    {{ r.status === 'Approved' ? 'Zatwierdzony' : 'Oczekujący' }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </UCard>
        <div v-else class="rounded-xl border border-dashed border-default p-10 text-center text-muted">
          Nie znaleziono jeszcze żadnych wyników z Twoich startów.
        </div>
      </section>

      <!-- Szybkie akcje -->
      <section>
        <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-highlighted">
          <UIcon name="i-lucide-zap" class="size-5 text-primary" />
          Szybkie działania
        </h2>
        <div class="grid gap-4">
          <UCard v-if="isAthleteRole" class="hover:bg-muted/10 transition-colors">
            <NuxtLink to="/athlete/dziennik" class="flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
                  <UIcon name="i-lucide-book-marked" class="size-5" />
                </div>
                <div>
                  <h3 class="font-medium group-hover:text-cyan-600 transition-colors">Dziennik treningów</h3>
                  <p class="text-xs text-muted">Wpisy trenera po jednostkach</p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="size-5 text-muted group-hover:text-cyan-600" />
            </NuxtLink>
          </UCard>

          <UCard class="hover:bg-muted/10 transition-colors">
            <NuxtLink to="/ranking" class="flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UIcon name="i-lucide-trending-up" class="size-5" />
                </div>
                <div>
                  <h3 class="font-medium group-hover:text-primary transition-colors">Ranking Klubowy</h3>
                  <p class="text-xs text-muted">Zobacz jak wypadasz na tle innych zawodników</p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="size-5 text-muted group-hover:text-primary" />
            </NuxtLink>
          </UCard>

          <UCard class="hover:bg-muted/10 transition-colors">
            <NuxtLink to="/kalkulator-sinclair" class="flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <UIcon name="i-lucide-calculator" class="size-5" />
                </div>
                <div>
                  <h3 class="font-medium group-hover:text-emerald-500 transition-colors">Kalkulator Sinclair</h3>
                  <p class="text-xs text-muted">Przelicz swoje wyniki na punkty Sinclaira</p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="size-5 text-muted group-hover:text-emerald-500" />
            </NuxtLink>
          </UCard>

          <UCard class="hover:bg-muted/10 transition-colors">
            <NuxtLink to="/kalendarz" class="flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <UIcon name="i-lucide-calendar" class="size-5" />
                </div>
                <div>
                  <h3 class="font-medium group-hover:text-purple-500 transition-colors">Nadchodzące starty</h3>
                  <p class="text-xs text-muted">Sprawdź kalendarz zawodów klubowych</p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="size-5 text-muted group-hover:text-purple-500" />
            </NuxtLink>
          </UCard>
        </div>
      </section>
    </div>
  </UContainer>
</template>
