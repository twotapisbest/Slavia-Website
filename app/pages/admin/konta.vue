<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Konta kadry — Slavia',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">
        Administracja
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Konta kadry
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Edycja loginu, e-maila i hasła dla kont trenerów i administratorów. Zmianę ról pozostawia superadministrator.
      </p>
    </div>

    <ClubAdminsManager />
  </UContainer>
</template>
