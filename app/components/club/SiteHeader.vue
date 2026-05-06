<script setup lang="ts">
const config = useRuntimeConfig()

/** Jedno źródło: `package.json` → `runtimeConfig.public.appVersion` (np. v2.3.1-beta). */
const showNavBetaBadge = computed(() => /\bbeta\b/i.test(String(config.public.appVersion ?? '')))
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-default/50 bg-background/92 backdrop-blur-xl supports-backdrop-filter:bg-background/80 dark:border-default/40"
  >
    <!-- Jedna belka: marka | nawigacja (desktop) | akcje. Bez drugiego rzędu i bez poziomego paska pod spodem na mobile. -->
    <div
      class="mx-auto flex w-full max-w-[1440px] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 lg:min-h-[3.5rem] lg:gap-5 lg:px-8 lg:py-0"
    >
      <div class="flex shrink-0 items-center gap-2 sm:gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <ClubBrand />
          <UBadge
            v-if="showNavBetaBadge"
            color="warning"
            variant="subtle"
            size="sm"
            class="shrink-0 font-bold uppercase tracking-wide"
            title="Aplikacja w fazie beta — funkcje i dane mogą się zmieniać."
          >
            <span class="sr-only">Wersja beta aplikacji. </span>
            Beta
          </UBadge>
        </div>
        <ClubSiteNav
          mode="drawer"
          class="lg:hidden"
        />
      </div>

      <div class="hidden min-w-0 flex-1 lg:flex lg:items-center">
        <ClubSiteNav mode="desktop-inline" />
      </div>

      <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
