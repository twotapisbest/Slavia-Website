<script setup lang="ts">
definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Panel trenera — Zawodnicy',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">
        Panel trenera
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Zawodnicy
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Dodawaj i edytuj profile zawodników oraz przypisania do zawodów. Konta logowania możesz utworzyć tylko przy roli administratora — jako sam trener wysyłasz prośbę do kadry administracyjnej.
      </p>
    </div>

    <ClubPlayersManager />
  </UContainer>
</template>
