<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Superadmin — Slavia',
  robots: 'noindex, nofollow'
})

const tabItems = [
  { label: 'Zawodnicy', icon: 'i-lucide-users', value: 'players', slot: 'players' },
  { label: 'Administratorzy', icon: 'i-lucide-user-cog', value: 'admins', slot: 'admins' }
]
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">
        Superadministrator
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Zarządzanie klubem
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Pełny dostęp: kadra oraz konta administratorów. Operacje są wykonywane na zewnętrznym API.
      </p>
    </div>

    <UTabs
      :items="tabItems"
      default-value="players"
      variant="link"
      class="w-full"
    >
      <template #players>
        <div class="pt-6">
          <ClubPlayersManager />
        </div>
      </template>
      <template #admins>
        <div class="pt-6">
          <ClubAdminsManager />
        </div>
      </template>
    </UTabs>
  </UContainer>
</template>
