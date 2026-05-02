<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Superadmin — Zarządzanie Administratorami',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-red-500">
        <UIcon
          name="i-lucide-shield-alert"
          class="size-4"
        />
        SuperAdministracja
      </div>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Zarządzanie kontami
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Dwie listy: konta z dostępem administracyjnym (admin, superadmin, admin-trener) oraz pozostałe — trenerzy i zawodnicy. Tylko superadministrator może tworzyć nowe konta adminów i zmieniać role lub usuwać konta.
      </p>
    </div>

    <ClubAdminsManager />
  </UContainer>
</template>
