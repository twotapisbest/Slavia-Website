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
        Lista kont z backendu (pogrupowana): kadra, trenerzy, zawodnicy. Jako administrator bez roli superadministratora nie widzisz ani nie edytujesz żadnego konta, które ma rolę SuperAdmin — ich zarządzanie jest wyłącznie po zalogowaniu jako SuperAdmin. Reszcie użytkowników możesz zmieniać login, e-mail i hasło; zmianę zestawu ról wykonuje superadministrator.
      </p>
    </div>

    <ClubAdminsManager />
  </UContainer>
</template>
