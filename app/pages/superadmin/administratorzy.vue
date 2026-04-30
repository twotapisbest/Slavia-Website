<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Superadmin — Zarządzanie Administratorami',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-red-500">
        <UIcon name="i-lucide-shield-alert" class="size-4" />
        SuperAdministracja
      </div>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Konta Administratorów
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Tutaj możesz zarządzać dostępem do panelu admina. Tylko superadministrator może tworzyć i usuwać inne konta administracyjne.
      </p>
    </div>

    <ClubAdminsManager />
  </UContainer>
</template>
