<script setup lang="ts">
import type { Athlete, CompetitionResult } from '~/types/models'

definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Panel admina — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()
const isSuperAdmin = computed(() => auth.user.value?.role === 'SuperAdmin')

// Pobieranie podstawowych statystyk
const { data: athletes } = await useAsyncData(
  'dashboard-athletes',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes')
    }
  }
)
const { data: pendingResults, refresh: refreshPending } = await useAsyncData(
  'dashboard-pending',
  async (): Promise<CompetitionResult[]> =>
    apiFetch<CompetitionResult[]>('/api/results/pending').catch(() => [])
)
const { data: competitions } = await useAsyncData('dashboard-competitions', () => apiFetch('/api/competitions').catch(() => []))

const athleteNameById = computed(() => {
  const m = new Map<string, string>()
  for (const a of (athletes.value || []) as Athlete[]) {
    m.set(a.id, a.full_name)
  }
  return m
})

function labelForResult (r: CompetitionResult) {
  return athleteNameById.value.get(r.athlete_id) || r.athlete_id
}

const athletesCount = computed(() => {
  const list = athletes.value
  if (!Array.isArray(list)) {
    return 0
  }
  return list.filter(a => a.is_active !== false).length
})
const pendingCount = computed(() => Array.isArray(pendingResults.value) ? pendingResults.value.length : 0)
const competitionsCount = computed(() => Array.isArray(competitions.value) ? competitions.value.length : 0)

async function approveResult (id: string) {
  await apiFetch(`/api/results/${id}/approve`, { method: 'PATCH' })
  await refreshPending()
}

const quickLinks = [
  {
    title: 'Zawodnicy',
    description: 'Zarządzaj listą zawodników i ich danymi',
    icon: 'i-lucide-users',
    to: '/admin/zawodnicy',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    title: 'Kalendarz',
    description: 'Dodawaj i edytuj wydarzenia oraz zawody',
    icon: 'i-lucide-calendar',
    to: '/kalendarz',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    title: 'Blog',
    description: 'Publikuj nowości z życia klubu',
    icon: 'i-lucide-newspaper',
    to: '/blog',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  {
    title: 'Rankingi',
    description: 'Przeglądaj zawodników i wyniki',
    icon: 'i-lucide-trophy',
    to: '/zawodnicy',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  },
  {
    title: 'Changelog',
    description: 'Zobacz nowości w systemie',
    icon: 'i-lucide-file-text',
    to: '/admin/changelog',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    title: 'Konta kadry',
    description: 'Login, e-mail i hasła kont administracyjnych',
    icon: 'i-lucide-key-round',
    to: '/admin/konta',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10'
  },
  {
    title: 'Wszystkie starty',
    description: 'Historia startów — poprawki i usuwanie wpisów',
    icon: 'i-lucide-list-checks',
    to: '/trainer/wyniki',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10'
  },
  {
    title: 'Dzienniki treningów',
    description: 'Wpisy po jednostkach — widok trenera',
    icon: 'i-lucide-book-marked',
    to: '/trainer/dziennik',
    color: 'text-cyan-600',
    bg: 'bg-cyan-500/10'
  },
  {
    title: 'Moje konto',
    description: 'E-mail, avatar i hasło',
    icon: 'i-lucide-user-cog',
    to: '/profil',
    color: 'text-neutral-500',
    bg: 'bg-neutral-500/10'
  }
]
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">
        Administracja
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Witaj, {{ auth.user.value?.username || 'Adminie' }}!
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        To jest twój panel zarządzania klubem CKS Slavia Ruda Śląska. Tutaj masz dostęp do wszystkich kluczowych modułów.
      </p>
    </div>

    <!-- SuperAdmin Banner -->
    <div v-if="isSuperAdmin" class="mb-8 p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary shrink-0">
          <UIcon name="i-lucide-shield-check" class="size-6" />
        </div>
        <div>
          <p class="text-sm font-bold text-primary uppercase tracking-wider">Tryb SuperAdmin</p>
          <p class="text-sm text-muted">Masz dostęp do zaawansowanych narzędzi systemowych.</p>
        </div>
      </div>
      <UButton to="/superadmin" trailing-icon="i-lucide-arrow-right" size="lg" class="shrink-0">
        Panel SuperAdmin
      </UButton>
    </div>

    <!-- Statystyki -->
    <div class="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <UIcon name="i-lucide-users" class="size-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">Zarejestrowani Zawodnicy</p>
            <p class="text-2xl font-bold text-highlighted">{{ athletesCount }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500">
            <UIcon name="i-lucide-activity" class="size-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">Wyniki oczekujące</p>
            <p class="text-2xl font-bold text-highlighted">{{ pendingCount }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <UIcon name="i-lucide-calendar" class="size-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">Zaplanowane zawody</p>
            <p class="text-2xl font-bold text-highlighted">{{ competitionsCount }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Wyniki oczekujące -->
    <div id="wyniki-oczekujace" v-if="pendingCount > 0" class="mb-12 scroll-mt-24 rounded-2xl border border-default bg-card p-6">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-highlighted">
          <UIcon name="i-lucide-pending" class="mr-2 inline" />
          Wyniki do zatwierdzenia ({{ pendingCount }})
        </h2>
        <UButton @click="refreshPending()">
          Odśwież
        </UButton>
      </div>
      <div class="space-y-3">
        <div v-for="result in pendingResults || []" :key="result.id" class="flex items-center justify-between gap-4 rounded-xl bg-muted/20 p-4 border border-default/50">
          <div>
            <p class="font-medium text-highlighted">{{ labelForResult(result) }}</p>
            <p class="text-sm text-muted">Razem: {{ result.total }}kg ({{ result.date }})</p>
          </div>
          <UButton size="sm" @click="approveResult(result.id)">
            Zatwierdź
          </UButton>
        </div>
      </div>
    </div>

    <h2 class="mb-4 text-xl font-semibold text-highlighted">Szybki dostęp</h2>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="group block transition-transform hover:-translate-y-1"
      >
        <UCard class="h-full border border-default transition-colors group-hover:border-primary/50 group-hover:shadow-md">
          <div class="flex items-start gap-4">
            <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', link.bg, link.color]">
              <UIcon :name="link.icon" class="size-5" />
            </div>
            <div>
              <h3 class="font-medium text-highlighted group-hover:text-primary transition-colors">
                {{ link.title }}
              </h3>
              <p class="mt-1 text-sm text-muted">
                {{ link.description }}
              </p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </UContainer>
</template>
