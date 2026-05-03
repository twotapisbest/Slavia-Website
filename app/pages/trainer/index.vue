<script setup lang="ts">
import type { Athlete, CompetitionResult } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Panel trenera — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()

const { data: athletes } = await useAsyncData(
  'trainer-athletes',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes').catch(() => [])
    }
  }
)
const { data: pendingResults, refresh: refreshPending } = await useAsyncData(
  'trainer-pending-results',
  async (): Promise<CompetitionResult[]> =>
    apiFetch<CompetitionResult[]>('/api/results/pending').catch(() => [])
)
const { data: competitions } = await useAsyncData('trainer-competitions', () => apiFetch('/api/competitions').catch(() => []))

const toast = useToast()

const athleteNameById = computed(() => {
  const m = new Map<string, string>()
  for (const a of (athletes.value || []) as Athlete[]) {
    m.set(a.id, a.full_name)
  }
  return m
})

function labelForResult(r: CompetitionResult) {
  return athleteNameById.value.get(r.athlete_id) || r.athlete_id
}

const athletesCount = computed(() => {
  const list = athletes.value
  if (!Array.isArray(list)) {
    return 0
  }
  return list.filter(a => a.is_active !== false).length
})
const pendingCount = computed(() => (Array.isArray(pendingResults.value) ? pendingResults.value.length : 0))
const competitionsCount = computed(() => (Array.isArray(competitions.value) ? competitions.value.length : 0))

const quickLinks = computed(() => {
  const admin = auth.isAdmin.value
  const links = [
    {
      title: admin ? 'Zawodnicy (panel admina)' : 'Baza zawodników',
      description: admin
        ? 'Pełna edycja z możliwością tworzenia kont logowania'
        : 'Edycja profili i zawodów — konto dla zawodnika tworzy administrator po Twojej prośbie',
      icon: 'i-lucide-users',
      to: admin ? '/admin/zawodnicy' : '/trainer/zawodnicy',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Kalendarz',
      description: 'Sprawdzaj i planuj zawody oraz treningi',
      icon: 'i-lucide-calendar',
      to: '/kalendarz',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Zgłoszenia wyników',
      description: 'Przejdź do listy oczekujących lub dodaj start na stronie „Wszystkie starty”',
      icon: 'i-lucide-check-circle',
      to: admin ? '/admin#wyniki-oczekujace' : '/trainer#wyniki-oczekujace',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Wszystkie starty',
      description: 'Lista zapisanych startów z edycją',
      icon: 'i-lucide-list-checks',
      to: '/trainer/wyniki',
      color: 'text-teal-500',
      bg: 'bg-teal-500/10'
    },
    {
      title: 'Dzienniki treningów',
      description: 'Wybierz zawodnika i prowadź wpisy po jednostkach',
      icon: 'i-lucide-book-marked',
      to: '/trainer/dziennik',
      color: 'text-cyan-600',
      bg: 'bg-cyan-500/10'
    },
    {
      title: 'Analiza toru sztangi',
      description: 'Wideo + AI w przeglądarce: tor ruchu i komunikaty techniczne',
      icon: 'i-lucide-scan-line',
      to: '/trainer/analiza-sztangi',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      title: 'Aktualności klubu',
      description: 'Aktualności, ogłoszenia i wpisy na stronie',
      icon: 'i-lucide-newspaper',
      to: '/aktualnosci',
      color: 'text-amber-600',
      bg: 'bg-amber-500/10'
    },
    ...(admin
      ? [{
          title: 'Changelog systemu',
          description: 'Historia zmian widoczna dla administratorów',
          icon: 'i-lucide-file-text',
          to: '/admin/changelog',
          color: 'text-emerald-600',
          bg: 'bg-emerald-500/10'
        }]
      : []),
    {
      title: 'Moje konto',
      description: 'E-mail, avatar i hasło',
      icon: 'i-lucide-user-cog',
      to: '/profil',
      color: 'text-neutral-500',
      bg: 'bg-neutral-500/10'
    }
  ]
  return links
})

async function approveResult(id: string) {
  try {
    await apiFetch(`/api/results/${id}/approve`, { method: 'PATCH' })
    toast.add({ title: 'Wynik zatwierdzony', color: 'success' })
    await refreshPending()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zatwierdzić',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">
        Panel Trenera
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Witaj, {{ auth.user.value?.username || 'Trenerze' }}!
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Tutaj możesz przeglądać zawodników, sprawdzać zgłoszenia wyników i koordynować harmonogramy.
      </p>
    </div>

    <div class="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <UIcon
              name="i-lucide-users"
              class="size-6"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">
              Zawodnicy (aktywni)
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ athletesCount }}
            </p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <UIcon
              name="i-lucide-activity"
              class="size-6"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">
              Wyniki oczekujące
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ pendingCount }}
            </p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <UIcon
              name="i-lucide-calendar"
              class="size-6"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">
              Wydarzenia w kalendarzu
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ competitionsCount }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Wyniki oczekujące — zawsze w DOM (kotwica z „Zgłoszenia wyników”), także przy 0 pozycji -->
    <div
      id="wyniki-oczekujace"
      class="mb-12 scroll-mt-24 rounded-2xl border border-default bg-card p-6"
    >
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-xl font-semibold text-highlighted">
          <UIcon
            name="i-lucide-clipboard-clock"
            class="mr-2 inline"
          />
          Wyniki do zatwierdzenia ({{ pendingCount }})
        </h2>
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="soft"
            size="sm"
            icon="i-lucide-refresh-ccw"
            @click="refreshPending()"
          >
            Odśwież listę
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            to="/trainer/wyniki"
          >
            Wszystkie starty / dodaj wpis
          </UButton>
        </div>
      </div>
      <div
        v-if="pendingCount === 0"
        class="rounded-xl border border-dashed border-default/70 bg-muted/10 px-4 py-8 text-center text-sm text-muted"
      >
        Brak oczekujących zgłoszeń. Możesz dodać start od razu jako zatwierdzony na stronie
        <NuxtLink
          to="/trainer/wyniki"
          class="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Wszystkie starty
        </NuxtLink>
        .
      </div>
      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="result in pendingResults || []"
          :key="result.id"
          class="flex flex-col gap-3 rounded-xl border border-default/50 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="font-medium text-highlighted">
              {{ labelForResult(result) }}
            </p>
            <p class="text-sm text-muted">
              Rwanie {{ result.snatch }} kg · Podrzut {{ result.clean_and_jerk }} kg · Razem {{ result.total }} kg · {{ result.date.slice(0, 10) }}
            </p>
          </div>
          <UButton
            size="sm"
            class="shrink-0"
            @click="approveResult(result.id)"
          >
            Zatwierdź
          </UButton>
        </div>
      </div>
    </div>

    <h2 class="mb-4 text-xl font-semibold text-highlighted">
      Szybki dostęp
    </h2>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="group block transition-transform hover:-translate-y-1"
      >
        <UCard class="h-full border border-default transition-colors group-hover:border-primary/50 group-hover:shadow-md">
          <div class="flex flex-col items-center text-center p-4">
            <div :class="['mb-3 flex h-14 w-14 items-center justify-center rounded-full', link.bg, link.color]">
              <UIcon
                :name="link.icon"
                class="size-7"
              />
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
