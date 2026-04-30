<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Panel admina — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()

// Pobieranie podstawowych statystyk
const { data: athletes } = await useAsyncData('dashboard-athletes', () => apiFetch('/api/athletes'))
const { data: pendingResults } = await useAsyncData('dashboard-pending', () => apiFetch('/api/results/pending').catch(() => []))
const { data: competitions } = await useAsyncData('dashboard-competitions', () => apiFetch('/api/competitions').catch(() => []))

const athletesCount = computed(() => Array.isArray(athletes.value) ? athletes.value.length : 0)
const pendingCount = computed(() => Array.isArray(pendingResults.value) ? pendingResults.value.length : 0)
const competitionsCount = computed(() => Array.isArray(competitions.value) ? competitions.value.length : 0)

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
    description: 'Przeglądaj i zatwierdzaj wyniki',
    icon: 'i-lucide-trophy',
    to: '/ranking',
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
