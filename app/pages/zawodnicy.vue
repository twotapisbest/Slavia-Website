<script setup lang="ts">
import AtheleteCard from '~/components/AtheleteCard.vue'
import type { Athlete as AthleteModel, CompetitionResult } from '~/types/models'
import { sinclairTotal } from '~/utils/sinclair'

const config = useRuntimeConfig()

function publicBase () {
  return String(config.public.apiBase || '').replace(/\/$/, '')
}

const { data: pageBundle, status, error } = await useAsyncData(
  'players-public-bundle',
  async () => {
    const base = publicBase()
    const players = await $fetch<AthleteModel[]>(`${base}/api/athletes`).catch(() => [] as AthleteModel[])
    const resultsByAthlete: Record<string, CompetitionResult[]> = {}
    await Promise.all(
      players.map(async (p) => {
        resultsByAthlete[p.id] = await $fetch<CompetitionResult[]>(`${base}/api/results/athlete/${p.id}`).catch(
          () => []
        )
      })
    )
    return { players, resultsByAthlete }
  },
  { default: () => ({ players: [] as AthleteModel[], resultsByAthlete: {} as Record<string, CompetitionResult[]> }) }
)

const players = computed(() => pageBundle.value?.players ?? [])
const resultsByAthlete = computed(() => pageBundle.value?.resultsByAthlete ?? {})

useSeoMeta({
  title: 'Zawodnicy i Ranking — Slavia Ruda Śląska',
  description: 'Lista zawodników CKS Slavia Ruda Śląska oraz ranking Sinclair.',
  ogTitle: 'Zawodnicy i ranking CKS Slavia',
  ogDescription: 'Poznaj kadrę Slavia i sprawdź aktualną klasyfikację Sinclair.',
  twitterCard: 'summary'
})

/** Mapowanie modelu z API na model komponentu karty */
function mapToCard(p: AthleteModel, rb: Record<string, CompetitionResult[]>) {
  const totalKg = (p.best_snatch_kg || 0) + (p.best_clean_jerk_kg || 0)
  const weightNum = p.weight_category ? parseInt(p.weight_category.replace(/\D/g, '')) : (p.bodyweight || 0)
  const effectiveWeight = p.bodyweight || weightNum
  
  // Obliczamy Sinclaira (zabezpieczenie przed brakiem danych)
  let sc = 0
  if (totalKg > 0 && effectiveWeight > 0 && p.gender) {
    const calculated = sinclairTotal(totalKg, effectiveWeight, p.gender as any)
    if (!isNaN(calculated)) {
      sc = calculated
    }
  }

  // Historia ze zgłoszonych wyników (wszystkie statusy z endpointu zawodnika)
  const athleteResults = (rb[p.id] ?? [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => r.total)

  // Jeśli brak historii, używamy bieżącego totalu jako punkt bazowy
  const history = athleteResults.length > 0 ? athleteResults : [totalKg].filter(v => v > 0)
  const maxHistory = Math.max(...history) * 1.15 || 300

  return {
    id: p.id,
    name: p.full_name,
    birthYear: p.birth_year || 0,
    weightCategory: Math.round(weightNum),
    snatch: p.best_snatch_kg || 0,
    cleanAndJerk: p.best_clean_jerk_kg || 0,
    total: totalKg,
    sinclair: Number(sc.toFixed(2)),
    description: p.notes || 'Zawodnik klubu CKS Slavia Ruda Śląska.',
    photo: p.image_url || undefined,
    history,
    maxHistory
  }
}

const mappedPlayers = computed(() => {
  const rb = resultsByAthlete.value
  return players.value.map(p => mapToCard(p, rb)).sort((a, b) => b.sinclair - a.sinclair)
})

const podium = computed(() => mappedPlayers.value.slice(0, 3))

// Kategorie dla rankingu
const categories = [
  { label: 'Wszyscy', value: 'all' },
  { label: 'Mężczyźni', value: 'male' },
  { label: 'Kobiety', value: 'female' }
]
const selectedCategory = ref('all')

const filteredRankings = computed(() => {
  const rb = resultsByAthlete.value
  if (selectedCategory.value === 'all') return mappedPlayers.value
  const gender = selectedCategory.value
  return players.value.filter(p => p.gender === gender).map(p => mapToCard(p, rb)).sort((a, b) => b.sinclair - a.sinclair)
})
</script>

<template>
  <UContainer class="py-10 md:py-16">
    <!-- Header Section -->
    <div class="mb-16 text-center">
      <div class="flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.3em] text-primary">
        <UIcon name="i-lucide-trophy" class="size-6" />
        Kadra i Ranking
      </div>
      <h1 class="mt-6 text-5xl font-black tracking-tighter text-highlighted sm:text-7xl uppercase italic">
        Elita <span class="text-primary">Slavii</span>
      </h1>
      <p class="mx-auto mt-6 max-w-2xl text-xl font-medium text-muted/80 leading-relaxed">
        Poznaj naszych reprezentantów i zobacz aktualny ranking klubu oparty na punktacji Sinclaira.
      </p>
    </div>

    <!-- Podium Section -->
    <div v-if="podium.length > 0" class="mb-24 pt-12 relative">
      <div class="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 to-transparent blur-3xl opacity-50" />
      <div class="grid grid-cols-1 gap-10 md:grid-cols-3 items-end max-w-4xl mx-auto px-4">
        <!-- 2nd Place -->
        <div v-if="podium[1]" class="order-2 md:order-1 group">
          <div class="flex flex-col items-center">
            <div class="relative mb-4">
              <img :src="podium[1].photo || 'https://via.placeholder.com/300?text=Athlete'" class="size-32 rounded-full border-4 border-slate-400/50 object-cover shadow-xl grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" />
              <div class="absolute -bottom-2 -right-2 bg-slate-400 text-slate-950 size-10 rounded-full flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-background">2</div>
            </div>
            <div class="text-center p-4 bg-slate-400/10 rounded-t-2xl w-full border-t border-x border-slate-400/30 backdrop-blur-md">
              <h3 class="text-base font-black text-highlighted truncate uppercase italic">{{ podium[1].name }}</h3>
              <p class="text-primary font-mono font-black text-lg">{{ podium[1].sinclair }}</p>
            </div>
            <div class="h-24 w-full bg-linear-to-b from-slate-400 to-slate-700 rounded-b-xl shadow-xl flex items-center justify-center">
              <span class="text-white/10 text-4xl font-black tracking-tighter">SILVER</span>
            </div>
          </div>
        </div>

        <!-- 1st Place -->
        <div v-if="podium[0]" class="order-1 md:order-2 group -mt-16">
          <div class="flex flex-col items-center">
            <div class="relative mb-6">
              <div class="absolute -top-12 left-1/2 -translate-x-1/2 text-yellow-500 animate-pulse">
                <UIcon name="i-lucide-crown" class="size-14 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              </div>
              <img :src="podium[0].photo || 'https://via.placeholder.com/300?text=Athlete'" class="size-48 rounded-full border-4 border-yellow-500 object-cover shadow-[0_0_30px_rgba(234,179,8,0.3)] ring-6 ring-yellow-500/10 group-hover:scale-110 transition-all duration-700" />
              <div class="absolute -bottom-2 -right-2 bg-yellow-500 text-yellow-950 size-14 rounded-full flex items-center justify-center font-black text-2xl shadow-xl ring-4 ring-background">1</div>
            </div>
            <div class="text-center p-6 bg-yellow-500/10 rounded-t-2xl w-full border-t border-x border-yellow-500/30 backdrop-blur-md">
              <h3 class="text-xl font-black text-highlighted truncate uppercase italic">{{ podium[0].name }}</h3>
              <p class="text-primary text-2xl font-mono font-black">{{ podium[0].sinclair }}</p>
            </div>
            <div class="h-40 w-full bg-linear-to-b from-yellow-400 to-yellow-600 rounded-b-xl shadow-[0_15px_30px_rgba(234,179,8,0.2)] flex items-center justify-center">
              <span class="text-white/20 text-6xl font-black tracking-tighter">GOLD</span>
            </div>
          </div>
        </div>

        <!-- 3rd Place -->
        <div v-if="podium[2]" class="order-3 md:order-3 group">
          <div class="flex flex-col items-center">
            <div class="relative mb-4">
              <img :src="podium[2].photo || 'https://via.placeholder.com/300?text=Athlete'" class="size-28 rounded-full border-4 border-amber-700/50 object-cover shadow-lg grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" />
              <div class="absolute -bottom-2 -right-2 bg-amber-700 text-white size-8 rounded-full flex items-center justify-center font-black text-lg shadow-lg ring-4 ring-background">3</div>
            </div>
            <div class="text-center p-3 bg-amber-700/10 rounded-t-2xl w-full border-t border-x border-amber-700/30 backdrop-blur-md">
              <h3 class="text-base font-black text-highlighted truncate uppercase italic">{{ podium[2].name }}</h3>
              <p class="text-primary font-mono font-black text-lg">{{ podium[2].sinclair }}</p>
            </div>
            <div class="h-20 w-full bg-linear-to-b from-amber-600 to-amber-900 rounded-b-xl shadow-lg flex items-center justify-center">
              <span class="text-white/10 text-3xl font-black tracking-tighter">BRONZE</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ranking Table Section -->
    <div class="mb-32">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 class="text-3xl font-black text-highlighted uppercase italic tracking-tight flex items-center gap-4">
            <UIcon name="i-lucide-list-ordered" class="text-primary size-8" />
            Tabela Rankingowa
          </h2>
          <p class="mt-2 text-muted font-medium">Oficjalne zestawienie punktacji Sinclair na rok 2025-2028.</p>
        </div>
        <div
          class="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-muted/30 border border-default w-full md:w-auto"
          role="tablist"
        >
          <UButton
            v-for="c in categories"
            :key="c.value"
            size="sm"
            class="min-h-10"
            :variant="selectedCategory === c.value ? 'solid' : 'ghost'"
            :color="selectedCategory === c.value ? 'primary' : 'neutral'"
            @click="selectedCategory = c.value"
          >
            {{ c.label }}
          </UButton>
        </div>
      </div>

      <UCard class="overflow-hidden border-primary/20 shadow-2xl bg-linear-to-b from-primary/5 to-transparent backdrop-blur-md">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/10 bg-white/5">
                <th class="px-6 py-5 text-xs font-black uppercase tracking-widest text-muted">Msc.</th>
                <th class="px-6 py-5 text-xs font-black uppercase tracking-widest text-muted">Zawodnik</th>
                <th class="px-6 py-5 text-xs font-black uppercase tracking-widest text-muted text-right">Waga</th>
                <th class="px-6 py-5 text-xs font-black uppercase tracking-widest text-muted text-right">Dwubój</th>
                <th class="px-6 py-5 text-xs font-black uppercase tracking-widest text-muted text-right">Sinclair</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr 
                v-for="(p, idx) in filteredRankings" 
                :key="p.name"
                class="group transition-all hover:bg-primary/10"
              >
                <td class="px-6 py-6">
                  <span class="font-mono font-black text-lg text-muted/50 group-hover:text-primary transition-colors">
                    {{ (idx + 1).toString().padStart(2, '0') }}
                  </span>
                </td>
                <td class="px-6 py-6">
                  <div class="flex items-center gap-4">
                    <UAvatar :src="p.photo" :alt="p.name" size="sm" class="ring-1 ring-white/10" />
                    <span class="font-bold text-highlighted">{{ p.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-6 text-right font-mono text-muted">
                  {{ p.weightCategory }} kg
                </td>
                <td class="px-6 py-6 text-right font-mono font-bold text-highlighted">
                  {{ p.total }} kg
                </td>
                <td class="px-6 py-6 text-right">
                  <span class="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary font-mono font-black">
                    {{ p.sinclair }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Full Athlete List Section -->
    <div v-if="mappedPlayers.length > 0" class="mb-20">
      <h2 class="mb-12 text-3xl font-black text-highlighted uppercase italic tracking-tight flex items-center gap-4">
        <UIcon name="i-lucide-users" class="text-primary size-8" />
        Karty Zawodników
      </h2>
      <div class="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <AtheleteCard 
          v-for="player in mappedPlayers" 
          :key="player.name"
          :model-value="player"
        />
      </div>
    </div>

    <UAlert
      v-else-if="status !== 'pending' && !error"
      color="info"
      variant="subtle"
      title="Brak zawodników"
      description="Obecnie lista zawodników jest pusta."
      class="mb-12"
    />
  </UContainer>
</template>
