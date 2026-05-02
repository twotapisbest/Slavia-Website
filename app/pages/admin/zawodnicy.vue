<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Panel admina — zawodnicy',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">
        Administracja
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Zawodnicy
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Dodawaj, edytuj i usuwaj rekordy zawodników. Zmiany trafiają do zewnętrznego API klubu.
      </p>
    </div>

    <ClubPlayersManager />
  </UContainer>
</template>
