<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Konta kadry — Slavia',
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
        Konta kadry
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Dwie tabele: kadra administracyjna oraz trenerzy i zawodnicy. Możesz edytować login, e-mail i hasło (wg uprawnień). Zmianę ról wykonuje superadministrator.
      </p>
    </div>

    <ClubAdminsManager />
  </UContainer>
</template>
