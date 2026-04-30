<script lang="ts" setup>
export interface Athlete {
  name: string
  birthYear: number
  weightCategory: number
  snatch: number
  cleanAndJerk: number
  total: number
  sinclair: number
  description: string
  photo?: string // Dodałem opcjonalne zdjęcie
  history: number[]
  maxHistory: number
}

// Model - używamy Object as PropType dla pełnego wsparcia TS
const athlete = defineModel<Athlete>({
  required: true
})
</script>

<template>
  <UCard class="overflow-hidden border-default/50 hover:border-primary/50 transition-colors shadow-lg bg-linear-to-br from-highlighted/5 to-transparent">
    <div class="grid gap-6 md:grid-cols-12">
      <div class="md:col-span-4 flex flex-col items-center text-center">
        <div class="relative group">
          <img
            :src="athlete.photo || 'https://via.placeholder.com/300?text=Brak+zdjęcia'"
            :alt="athlete.name"
            class="h-48 w-48 rounded-xl object-cover border-2 border-primary/20 group-hover:border-primary transition-all shadow-md"
          >
          <div class="absolute -bottom-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            Kat. {{ athlete.weightCategory }}kg
          </div>
        </div>

        <h3 class="mt-6 text-xl font-bold text-highlighted leading-tight">
          {{ athlete.name }}
        </h3>
        <p class="text-sm text-muted font-medium">
          Rocznik: {{ athlete.birthYear }}
        </p>

        <div class="mt-4 p-3 rounded-lg bg-muted/20 text-xs text-left text-muted italic">
          "{{ athlete.description }}"
        </div>
      </div>

      <div class="md:col-span-8 space-y-6">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-3 rounded-xl bg-muted/10 border border-default/50 text-center">
            <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
              Rwanie
            </p>
            <p class="text-xl font-mono font-bold text-primary">
              {{ athlete.snatch }}kg
            </p>
          </div>
          <div class="p-3 rounded-xl bg-muted/10 border border-default/50 text-center">
            <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
              Podrzut
            </p>
            <p class="text-xl font-mono font-bold text-primary">
              {{ athlete.cleanAndJerk }}kg
            </p>
          </div>
          <div class="p-3 rounded-xl bg-primary/10 border border-primary/30 text-center">
            <p class="text-[10px] uppercase tracking-wider text-primary font-bold">
              Total
            </p>
            <p class="text-xl font-mono font-bold text-highlighted">
              {{ athlete.total }}kg
            </p>
          </div>
          <div class="p-3 rounded-xl bg-highlighted/10 border border-highlighted/30 text-center">
            <p class="text-[10px] uppercase tracking-wider text-highlighted font-bold">
              Sinclair
            </p>
            <p class="text-xl font-mono font-bold text-highlighted">
              {{ athlete.sinclair }} pkt
            </p>
          </div>
        </div>

        <div class="h-40 w-full bg-muted/5 rounded-xl border border-default/30 p-4">
          <p class="text-xs font-medium text-muted mb-2 flex items-center gap-2">
            <UIcon
              name="i-lucide-trending-up"
              class="text-primary"
            />
            Progres Totalu (ostatnie starty)
          </p>
          <div class="flex items-end justify-between h-24 gap-1 px-2">
            <div
              v-for="(val, i) in athlete.history"
              :key="i"
              class="bg-primary/40 w-full rounded-t-sm hover:bg-primary transition-colors relative group"
              :style="{ height: `${(val / athlete.maxHistory) * 100}%` }"
            >
              <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] hidden group-hover:block font-mono bg-default p-1 rounded">
                {{ val }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
