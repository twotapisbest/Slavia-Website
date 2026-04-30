<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Panel superadmina — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()

// Pobieranie podstawowych statystyk
const { data: athletes } = await useAsyncData('super-dashboard-athletes', () => apiFetch('/api/athletes').catch(() => []))
const { data: admins } = await useAsyncData('super-dashboard-admins', () => apiFetch('/api/admins').catch(() => []))
const { data: competitions } = await useAsyncData('super-dashboard-competitions', () => apiFetch('/api/competitions').catch(() => []))

const athletesCount = computed(() => Array.isArray(athletes.value) ? athletes.value.length : 0)
const adminsCount = computed(() => Array.isArray(admins.value) ? admins.value.length : 0)
const competitionsCount = computed(() => Array.isArray(competitions.value) ? competitions.value.length : 0)

const quickLinks = [
  {
    title: 'Zarządzanie Adminami',
    description: 'Dodawaj i usuwaj konta administratorów',
    icon: 'i-lucide-shield-alert',
    to: '/superadmin/administratorzy',
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  },
  {
    title: 'Baza Zawodników',
    description: 'Pełny dostęp do edycji bazy zawodników',
    icon: 'i-lucide-users',
    to: '/superadmin/zawodnicy',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    title: 'Kalendarz Systemowy',
    description: 'Edytuj wszystkie wydarzenia na stronie',
    icon: 'i-lucide-calendar',
    to: '/kalendarz',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    title: 'Aktualności (Blog)',
    description: 'Zarządzaj wpisami na blogu',
    icon: 'i-lucide-newspaper',
    to: '/blog',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  }
]
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary flex items-center gap-2">
        <UIcon name="i-lucide-crown" class="size-4" />
        SuperAdministracja
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Witaj, Władco Absolutny! ({{ auth.user.value?.username || 'Superadminie' }})
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        To jest główny panel zarządzania całym systemem klubu. Masz pełne uprawnienia do wszystkich zasobów i ról.
      </p>
    </div>

    <!-- Statystyki -->
    <div class="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <UIcon name="i-lucide-shield-check" class="size-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">Administratorzy</p>
            <p class="text-2xl font-bold text-highlighted">{{ adminsCount }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <UIcon name="i-lucide-users" class="size-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">Zawodnicy</p>
            <p class="text-2xl font-bold text-highlighted">{{ athletesCount }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <UIcon name="i-lucide-calendar" class="size-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">Wydarzenia łącznie</p>
            <p class="text-2xl font-bold text-highlighted">{{ competitionsCount }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <h2 class="mb-4 text-xl font-semibold text-highlighted">Zarządzanie Ostateczne</h2>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="group block transition-transform hover:-translate-y-1"
      >
        <UCard class="h-full border border-default transition-colors group-hover:border-primary/50 group-hover:shadow-md">
          <div class="flex flex-col items-center text-center p-2">
            <div :class="['mb-3 flex h-14 w-14 items-center justify-center rounded-full', link.bg, link.color]">
              <UIcon :name="link.icon" class="size-7" />
            </div>
            <h3 class="font-medium text-highlighted group-hover:text-primary transition-colors">
              {{ link.title }}
            </h3>
            <p class="mt-2 text-xs text-muted">
              {{ link.description }}
            </p>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </UContainer>
</template>
