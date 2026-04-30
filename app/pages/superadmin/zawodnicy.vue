<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Superadmin — Zarządzanie Zawodnikami',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-red-500">
        <UIcon name="i-lucide-crown" class="size-4" />
        SuperAdministracja
      </div>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Baza Zawodników
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Jako superadministrator masz pełny dostęp do edycji bazy zawodników.
      </p>
    </div>

    <ClubPlayersManager />
  </UContainer>
</template>
