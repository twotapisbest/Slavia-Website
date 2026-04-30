<script setup lang="ts">
import AtheleteCard from '~/components/AtheleteCard.vue'
import { apiRoutes } from '~/config/api'
import type { Athlete as AthleteModel } from '~/types/models'

const api = useApi()

const { data: players, status, refresh, error } = await useAsyncData(
  'players-public',
  () => api<AthleteModel[]>(apiRoutes.athletes.list),
  { default: () => [] }
)

useSeoMeta({
  title: 'Zawodnicy — Slavia Ruda Śląska',
  description: 'Lista zawodników CKS Slavia Ruda Śląska: kategorie wagowe i wyniki.'
})

/** Mapowanie modelu z API na model komponentu karty */
function mapToCard(p: AthleteModel) {
  // Wyciągamy cyfry z kategorii wagowej (np. "81kg" -> 81)
  const weightNum = p.weight_category ? parseInt(p.weight_category.replace(/\D/g, '')) : 0
  
  return {
    name: p.full_name,
    birthYear: p.birth_year || 0,
    weightCategory: weightNum,
    snatch: p.best_snatch_kg || 0,
    cleanAndJerk: p.best_clean_jerk_kg || 0,
    total: p.total_kg || 0,
    sinclair: 0, // Do obliczenia w przyszłości lub na backendzie
    description: p.notes || 'Zawodnik klubu CKS Slavia Ruda Śląska.',
    photo: undefined,
    history: [p.total_kg || 0], // Uproszczona historia (tylko aktualny wynik)
    maxHistory: (p.total_kg || 0) * 1.2 || 300
  }
}
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <div class="mb-10 max-w-3xl">
      <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-primary">
        <UIcon name="i-lucide-users" class="size-4" />
        Kadra Klubu
      </div>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">
        Nasza Drużyna
      </h1>
      <p class="mt-4 text-lg text-muted">
        Poznaj zawodników CKS Slavia Ruda Śląska. Dane o ich rekordach i kategoriach wagowych są pobierane bezpośrednio z naszego systemu klubowego.
      </p>
    </div>

    <!-- Grid Kart Zawodników -->
    <div v-if="players && players.length > 0" class="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <AtheleteCard 
        v-for="player in players" 
        :key="player.id"
        :model-value="mapToCard(player)"
      />
    </div>

    <UAlert
      v-else-if="status !== 'pending' && !error"
      color="info"
      variant="subtle"
      title="Brak zawodników"
      description="Obecnie lista zawodników jest pusta. Zapraszamy wkrótce!"
      class="mb-12"
    />

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-wifi-off"
      title="Brak połączenia z API"
      description="Nie udało się pobrać listy zawodników. Spróbuj odświeżyć stronę lub sprawdź połączenie."
      class="mb-6"
    />

    <div class="mt-16">
      <h2 class="mb-6 text-2xl font-bold text-highlighted flex items-center gap-3">
        <UIcon name="i-lucide-list" class="size-6 text-primary" />
        Pełne Zestawienie
      </h2>
      <div class="overflow-x-auto rounded-xl ring-1 ring-default shadow-sm bg-muted/5">
        <ClubPlayersPublicTable
          :players="players ?? []"
          :loading="status === 'pending'"
        />
      </div>
    </div>

    <div class="mt-6 flex justify-end">
      <UButton
        v-if="error"
        color="neutral"
        variant="subtle"
        icon="i-lucide-refresh-cw"
        @click="refresh()"
      >
        Odśwież dane
      </UButton>
    </div>
  </UContainer>
</template>
