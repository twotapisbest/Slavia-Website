<script lang="ts" setup>
export interface Athlete {
  id?: string
  name: string
  birthYear: number
  weightCategory: number
  snatch: number
  cleanAndJerk: number
  total: number
  sinclair: number
  description: string
  photo?: string
  history: number[]
  maxHistory: number
}

const athlete = defineModel<Athlete>({
  required: true
})

// Build SVG polyline from history values
const chartPoints = computed(() => {
  const h = athlete.value.history
  if (!h || h.length < 2) return null
  const w = 300
  const hh = 80
  const max = Math.max(...h) * 1.1 || 1
  const min = Math.min(...h) * 0.9
  const range = max - min || 1
  const points = h.map((v, i) => {
    const x = (i / (h.length - 1)) * w
    const y = hh - ((v - min) / range) * hh
    return `${x},${y}`
  })
  return points.join(' ')
})
</script>

<template>
  <UCard class="overflow-hidden border-default/60 transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 shadow-lg">
    <div class="grid gap-6 md:grid-cols-12">
      <!-- Zdjęcie i dane osobowe -->
      <div class="md:col-span-4 flex flex-col items-center text-center">
        <div class="relative group">
          <div class="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <img
            :src="athlete.photo || 'https://via.placeholder.com/300?text=Slavia'"
            :alt="athlete.name"
            class="relative h-44 w-44 rounded-xl object-cover border-2 border-primary/20 group-hover:border-primary transition-all shadow-md"
          >
          <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
            Kat. {{ athlete.weightCategory }}kg
          </div>
        </div>

        <h3 class="mt-7 text-xl font-bold text-highlighted leading-tight">
          {{ athlete.name }}
        </h3>
        <p class="text-sm text-muted font-medium mt-0.5">
          Rocznik: {{ athlete.birthYear }}
        </p>

        <div class="mt-4 w-full rounded-xl border border-default/40 bg-muted/20 p-3 text-sm text-muted text-left leading-relaxed wrap-break-word">
          {{ athlete.description }}
        </div>
      </div>

      <!-- Statystyki i wykres -->
      <div class="md:col-span-8 space-y-5">
        <!-- Statystyki -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <!-- Rwanie -->
          <div class="min-h-28 rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-3 text-center flex flex-col justify-center gap-1">
            <p class="text-[10px] uppercase tracking-wide text-primary/70 font-bold">Rwanie</p>
            <p class="text-xl sm:text-2xl font-mono font-bold text-primary leading-none wrap-break-word">{{ athlete.snatch }}</p>
            <p class="text-[11px] text-primary/60 font-medium">kg</p>
          </div>

          <!-- Podrzut -->
          <div class="min-h-28 rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-3 text-center flex flex-col justify-center gap-1">
            <p class="text-[10px] uppercase tracking-wide text-primary/70 font-bold">Podrzut</p>
            <p class="text-xl sm:text-2xl font-mono font-bold text-primary leading-none wrap-break-word">{{ athlete.cleanAndJerk }}</p>
            <p class="text-[11px] text-primary/60 font-medium">kg</p>
          </div>

          <!-- Total -->
          <div class="min-h-28 rounded-xl border border-emerald-500/30 bg-linear-to-br from-emerald-500/10 to-primary/10 p-3 text-center flex flex-col justify-center gap-1">
            <p class="text-[10px] uppercase tracking-wide text-emerald-500/80 font-bold">Total</p>
            <p class="text-xl sm:text-2xl font-mono font-bold text-emerald-400 leading-none wrap-break-word">{{ athlete.total }}</p>
            <p class="text-[11px] text-emerald-500/60 font-medium">kg</p>
          </div>

          <!-- Sinclair -->
          <div class="min-h-28 rounded-xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 to-orange-500/10 p-3 text-center flex flex-col justify-center gap-1">
            <p class="text-[10px] uppercase tracking-wide text-amber-400/80 font-bold">Sinclair</p>
            <p class="text-xl sm:text-2xl font-mono font-bold text-amber-300 leading-none wrap-break-word">{{ athlete.sinclair }}</p>
            <p class="text-[11px] text-amber-400/70 font-medium">pkt</p>
          </div>
        </div>

        <!-- Wykres progresji -->
        <div class="rounded-xl border border-default/30 bg-muted/5 p-4">
          <p class="text-xs font-bold text-muted mb-3 flex items-center gap-2 uppercase tracking-wider">
            <UIcon name="i-lucide-trending-up" class="text-primary size-4" />
            Progres Totalu (ostatnie starty)
          </p>

          <!-- SVG sparkline jeśli historia >= 2 punktów -->
          <div v-if="chartPoints" class="h-24 w-full relative">
            <svg viewBox="0 0 300 80" class="w-full h-full" preserveAspectRatio="none">
              <!-- gradient fill pod linią -->
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgb(var(--ui-primary))" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="rgb(var(--ui-primary))" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polyline
                :points="chartPoints"
                fill="none"
                stroke="rgb(var(--ui-primary))"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <!-- punkty na linii -->
              <circle
                v-for="(val, i) in athlete.history"
                :key="i"
                :cx="(i / (athlete.history.length - 1)) * 300"
                :cy="80 - ((val - Math.min(...athlete.history) * 0.9) / ((Math.max(...athlete.history) * 1.1) - (Math.min(...athlete.history) * 0.9)) * 80)"
                r="3"
                fill="rgb(var(--ui-primary))"
              />
            </svg>

            <!-- wartości przy ostatnim punkcie -->
            <div class="absolute bottom-0 right-0 text-xs font-mono text-primary font-bold">
              {{ athlete.history[athlete.history.length - 1] }} kg
            </div>
          </div>

          <!-- Pasek jeśli tylko 1 wynik -->
          <div v-else class="flex items-end justify-center h-24 gap-1 px-2">
            <div
              class="bg-primary/40 rounded-t-md hover:bg-primary transition-colors relative group"
              :style="{ height: `${(athlete.history[0] / athlete.maxHistory) * 100}%`, width: '40px' }"
            >
              <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-primary font-bold whitespace-nowrap">
                {{ athlete.history[0] }} kg
              </span>
            </div>
            <p class="text-xs text-muted self-center ml-2">Brak historii startów</p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
