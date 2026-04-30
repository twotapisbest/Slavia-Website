<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

useSeoMeta({
  title: 'Ranking Zawodników — Slavia Ruda Śląska',
  description: 'Tabela wyników z zawodów zawodników sekcji podnoszenia ciężarów.'
})

const apiFetch = useApi()

// Pobieranie wszystkich zawodników i wyników (żeby móc wyświetlić imię i nazwisko)
const [{ data: results, pending: resultsPending }, { data: athletes, pending: athletesPending }] = await Promise.all([
  useAsyncData('results', () => apiFetch('/api/results/')),
  useAsyncData('athletes', () => apiFetch('/api/athletes'))
])

const pending = computed(() => resultsPending.value || athletesPending.value)

// Łączenie danych
const enrichedResults = computed((): any[] => {
  if (!results.value || !athletes.value || !Array.isArray(results.value) || !Array.isArray(athletes.value)) return []

  const mapped = results.value.map((res: any) => {
    const athlete = (athletes.value as any[]).find((a: any) => a.id === res.athlete_id)
    return {
      ...res,
      fullName: athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Nieznany Zawodnik',
    }
  })

  // Sortowanie po "total" (dwubój) - najwyższy na górze
  const sorted = mapped.sort((a: any, b: any) => b.total - a.total)
  return sorted.map((res: any, index: number) => ({
    ...res,
    rank: index + 1
  }))
})

// Definicja kolumn dla UTable z jawnym typowaniem
const columns: any[] = [
  { key: 'rank', label: '#' },
  { key: 'fullName', label: 'Zawodnik', sortable: true },
  { key: 'snatch', label: 'Rwanie (kg)', sortable: true },
  { key: 'clean_and_jerk', label: 'Podrzut (kg)', sortable: true },
  { key: 'total', label: 'Dwubój (kg)', sortable: true },
  { key: 'date', label: 'Data uzyskania', sortable: true }
]

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: pl })
  } catch (e) {
    return dateStr
  }
}
</script>

<template>
  <UContainer class="py-12">
    <div class="mb-10 text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <UIcon name="i-lucide-trophy" class="size-8" />
      </div>
      <h1 class="text-3xl font-bold tracking-tight text-highlighted">Ranking Klubu</h1>
      <p class="mt-2 text-muted max-w-2xl mx-auto">Zestawienie najlepszych oficjalnych wyników uzyskanych przez zawodników CKS Slavia na atestowanych pomostach.</p>
    </div>

    <UCard>
      <div v-if="pending" class="flex justify-center py-10">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-primary" />
      </div>
      
      <div v-else-if="enrichedResults.length === 0" class="text-center py-12 text-muted">
        <UIcon name="i-lucide-clipboard-x" class="size-12 mx-auto text-muted/30 mb-3" />
        <p>Brak zatwierdzonych wyników w bazie.</p>
      </div>

      <UTable 
        v-else 
        :rows="enrichedResults" 
        :columns="columns"
        :empty-state="{ icon: 'i-lucide-database', label: 'Brak danych' }"
      >
        <!-- Customizing specific columns -->
        <template #rank-data="{ row }: any">
          <span class="font-bold text-muted" :class="{
            'text-yellow-500 text-lg': row.rank === 1,
            'text-gray-400 text-lg': row.rank === 2,
            'text-amber-700 text-lg': row.rank === 3,
          }">
            {{ row.rank }}
          </span>
        </template>
        
        <template #fullName-data="{ row }: any">
          <span class="font-medium text-highlighted">{{ row.fullName }}</span>
        </template>

        <template #total-data="{ row }: any">
          <span class="font-bold text-primary">{{ row.total }} kg</span>
        </template>
        
        <template #date-data="{ row }: any">
          <span class="text-sm text-muted">{{ formatDate(row.date) }}</span>
        </template>
      </UTable>
    </UCard>
  </UContainer>
</template>
