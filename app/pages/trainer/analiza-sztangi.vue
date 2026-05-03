<script setup lang="ts">
definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Analiza toru sztangi — trener',
  robots: 'noindex, nofollow'
})

const barbellAnalysisOn = useExperimentalFlag('barbell_pose_analysis')

const BarbellLazy = defineAsyncComponent({
  loader: () => import('~/components/club/BarbellPathAnalyzer.client.vue'),
  delay: 80,
  timeout: 120_000
})
</script>

<template>
  <UContainer class="animate-page-in max-w-5xl py-8 md:py-12 lg:py-14">
    <div class="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="relative overflow-hidden rounded-3xl border border-default/60 bg-linear-to-br from-primary/10 via-card to-card px-6 py-7 shadow-sm ring-1 ring-primary/10 sm:px-8">
        <div class="pointer-events-none absolute -right-16 top-0 size-48 rounded-full bg-primary/15 blur-3xl" />
        <div class="relative">
          <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            Narzędzie treningowe
          </p>
          <h1 class="mt-2 text-3xl font-black tracking-tight text-highlighted sm:text-4xl">
            Analiza toru sztangi
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            MoveNet w przeglądarce: tor z nadgarstków, heurystyki pod dwubój — materiał zostaje na urządzeniu.
          </p>
        </div>
      </div>
      <UButton
        to="/trainer"
        variant="soft"
        color="neutral"
        size="lg"
        icon="i-lucide-arrow-left"
        class="shrink-0 self-start lg:self-auto"
      >
        Panel trenera
      </UButton>
    </div>

    <UAlert
      v-if="!barbellAnalysisOn"
      color="warning"
      variant="subtle"
      title="Narzędzie wyłączone"
      class="max-w-2xl"
    >
      Analiza toru sztangi jest wyłączona przez flagę eksperymentalną lub konfigurację deployu
      (<span class="font-mono text-[11px]">barbell_pose_analysis</span>).
    </UAlert>

    <ClientOnly v-else>
      <Suspense>
        <BarbellLazy />
        <template #fallback>
          <div class="flex justify-center py-16 text-muted">
            <UIcon
              name="i-lucide-loader-2"
              class="size-8 animate-spin"
            />
          </div>
        </template>
      </Suspense>
      <template #fallback>
        <div class="rounded-xl border border-default p-8 text-center text-sm text-muted">
          Ładowanie narzędzia analizy…
        </div>
      </template>
    </ClientOnly>
  </UContainer>
</template>
