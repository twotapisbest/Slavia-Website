<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Panel admina — Changelog',
  robots: 'noindex, nofollow'
})

const updates = [
  {
    version: 'v1.1.0',
    date: '30 Kwi 2026',
    title: 'Wielka Aktualizacja Funkcjonalności',
    features: [
      'Dodano zupełnie nowe Dashboardy dla Administratorów i Superadministratorów.',
      'Dodano globalny Changelog wewnątrz panelu, aby informować o nowościach.',
      'Utworzono systemowy Kalendarz Wydarzeń i Zawodów.',
      'Zaimplementowano publiczny Blog klubu z wpisami informacyjnymi.',
      'Dodano nowy publiczny Ranking wszystkich zawodników na podstawie wyników.',
      'Wdrożono zaawansowane zarządzanie autoryzacją i prawami w API i Frontendzie.'
    ],
    type: 'feature'
  },
  {
    version: 'v1.0.1',
    date: '17 Kwi 2026',
    title: 'Poprawki stabilności logowania',
    features: [
      'Rozwiązano problemy z przekierowaniami przy logowaniu.',
      'Zaktualizowano JWT Tokens aby unikać przypadkowego wylogowania po czasie.',
      'Ulepszono UI formularza logowania - wprowadzono responsywne błędy i powiadomienia toast.'
    ],
    type: 'bugfix'
  },
  {
    version: 'v1.0.0',
    date: '10 Kwi 2026',
    title: 'Uruchomienie Systemu',
    features: [
      'Stworzenie i migracja bazy danych Turso.',
      'Podstawowe zarządzanie wynikami i zawodnikami.',
      'Backend gotowy pod hostowanie na platformie Shuttle.'
    ],
    type: 'release'
  }
]
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-2">
        <UIcon name="i-lucide-file-text" class="size-5 text-primary" />
        <p class="text-sm font-medium uppercase tracking-wider text-primary">
          Administracja
        </p>
      </div>
      <h1 class="text-3xl font-bold tracking-tight text-highlighted">
        Changelog (Dziennik Zmian)
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Bądź na bieżąco z najnowszymi aktualizacjami w systemie zarządzania klubem CKS Slavia.
      </p>
    </div>

    <div class="space-y-8 max-w-4xl">
      <UCard v-for="(update, index) in updates" :key="index" class="relative overflow-hidden border-l-4" :class="{
        'border-l-primary': update.type === 'feature',
        'border-l-yellow-500': update.type === 'bugfix',
        'border-l-blue-500': update.type === 'release'
      }">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
              {{ update.version }}
            </span>
            <h3 class="text-xl font-bold text-highlighted">{{ update.title }}</h3>
          </div>
          <p class="text-sm text-muted mt-2 sm:mt-0 font-medium">
            {{ update.date }}
          </p>
        </div>
        
        <ul class="space-y-2 text-muted">
          <li v-for="(feature, fIndex) in update.features" :key="fIndex" class="flex items-start gap-2">
            <UIcon name="i-lucide-check-circle-2" class="size-5 text-emerald-500 shrink-0 mt-0.5" />
            <span>{{ feature }}</span>
          </li>
        </ul>
      </UCard>
    </div>
  </UContainer>
</template>
