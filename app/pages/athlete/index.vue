<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuth()
const apiFetch = useApi()

// Pobieranie danych o zawodniku powiązanym z kontem (opcjonalne)
const { data: athlete } = await useAsyncData('athlete-profile', () => 
  apiFetch(`/api/athletes/me`).catch(() => null)
)

// Pobieranie wyników zawodnika
const { data: results } = await useAsyncData('athlete-results', () => 
  athlete.value ? apiFetch(`/api/results/athlete/${athlete.value.id}`).catch(() => []) : []
)

const title = 'Panel Zawodnika — CKS Slavia Ruda Śląska'
useSeoMeta({
  title,
  robots: 'noindex, nofollow'
})

const stats = computed(() => [
  { label: 'Najlepszy Rwanie', value: athlete.value?.best_snatch_kg ? `${athlete.value.best_snatch_kg} kg` : '—' },
  { label: 'Najlepszy Podrzut', value: athlete.value?.best_clean_jerk_kg ? `${athlete.value.best_clean_jerk_kg} kg` : '—' },
  { label: 'Suma (Biathlon)', value: athlete.value?.total_kg ? `${athlete.value.total_kg} kg` : '—' }
])
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <div class="mb-10">
      <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-primary">
        <UIcon name="i-lucide-user" class="size-4" />
        Panel Zawodnika
      </div>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Witaj, {{ auth.user.value?.username }}!
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        To jest Twój osobisty panel. Tutaj możesz śledzić swoje postępy, wyniki z zawodów oraz zarządzać swoim profilem.
      </p>
    </div>

    <!-- Statystyki zawodnika -->
    <div v-if="athlete" class="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
      <UCard v-for="s in stats" :key="s.label" class="border border-default/50 bg-muted/10">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
          {{ s.label }}
        </p>
        <p class="mt-2 text-3xl font-bold text-primary">
          {{ s.value }}
        </p>
      </UCard>
    </div>

    <div v-else class="mb-12">
      <UAlert
        icon="i-lucide-info"
        title="Brak powiązanego profilu"
        description="Twoje konto nie jest jeszcze powiązane z rekordem zawodnika. Skontaktuj się z administratorem, aby połączyć swoje konto z danymi startowymi."
        color="warning"
        variant="subtle"
      />
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- Ostatnie wyniki -->
      <section>
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
