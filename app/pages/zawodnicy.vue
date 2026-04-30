<script setup lang="ts">
import AtheleteCard, { type Athlete } from '~/components/AtheleteCard.vue'
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

const jacek = ref<Athlete>({
  name: 'Jakub Kowalski',
  birthYear: 1995,
  weightCategory: 81,
  snatch: 120,
  cleanAndJerk: 150,
  total: 270, // 120 + 150
  sinclair: 350.42,
  description: 'Specjalista od technicznych podejść w rwaniu. Wielokrotny medalista Mistrzostw Śląska, znany z niesamowitej dynamiki i spokoju na pomoście.',
  photo: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop', // Przykładowe zdjęcie
  history: [240, 250, 255, 260, 265, 270],
  maxHistory: 300 // Skala wykresu
})
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <div class="mb-10 max-w-3xl">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">
        Kadra
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">
        Zawodnicy
      </h1>
      <p class="mt-4 text-lg text-muted">
        Poniżej znajdziesz aktualną listę zawodników powiązaną z naszym systemem — dane pochodzą z serwera klubowego.
      </p>
    </div>

    <AtheleteCard v-model="jacek"/>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-wifi-off"
      title="Brak połączenia z API"
      description="Sprawdź adres NUXT_PUBLIC_API_BASE_URL i CORS po stronie backendu."
      class="mb-6"
    />

    <div class="overflow-x-auto rounded-xl ring-1 ring-default">
      <ClubPlayersPublicTable
        :players="players ?? []"
        :loading="status === 'pending'"
      />
    </div>

    <div class="mt-6 flex justify-end">
      <UButton
        v-if="error"
        color="neutral"
        variant="subtle"
        icon="i-lucide-refresh-cw"
        @click="refresh()"
      >
        Spróbuj ponownie
      </UButton>
    </div>
  </UContainer>
</template>
