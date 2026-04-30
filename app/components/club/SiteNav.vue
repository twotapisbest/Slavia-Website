<script setup lang="ts">
const auth = useAuth()

async function logoutFromMenu() {
  auth.logout()
  await navigateTo('/')
}

const items = computed(() => {
  const main = [
    { label: 'Strona główna', to: '/' },
    { label: 'Zawodnicy', to: '/zawodnicy' },
    { label: 'Kalendarz', to: '/kalendarz' },
    { label: 'Blog', to: '/blog' },
    { label: 'Ranking', to: '/ranking' }
  ]
  
  if (auth.isLoggedIn.value) {
    if (auth.isSuperAdmin.value) {
      main.push({ label: 'Superadmin', to: '/superadmin' })
    } else if (auth.isAdmin.value) {
      main.push({ label: 'Panel admina', to: '/admin' })
    } else {
      main.push({ label: 'Mój Panel', to: '/athlete' })
    }
  }
  
  main.push({ label: 'Kalkulator', to: '/kalkulator-sinclair' })
  
  return main
})
</script>

<template>
  <nav
    class="hidden items-center gap-0.5 md:flex"
    aria-label="Główna nawigacja"
  >
    <UButton
      v-for="link in items"
      :key="link.to"
      :to="link.to"
      variant="ghost"
      color="neutral"
      class="font-medium"
    >
      {{ link.label }}
    </UButton>
  </nav>

  <UDrawer
    class="md:hidden"
    title="Menu"
  >
    <UButton
      icon="i-lucide-menu"
      color="neutral"
      variant="ghost"
      aria-label="Otwórz menu"
    />

    <template #body>
      <nav class="flex flex-col gap-1 p-2">
        <UButton
          v-for="link in items"
          :key="link.to + '-m'"
          :to="link.to"
          variant="ghost"
          color="neutral"
          block
          class="justify-start"
        >
          {{ link.label }}
        </UButton>
        <USeparator class="my-2" />
        <UButton
          v-if="!auth.isLoggedIn.value"
          to="/logowanie"
          icon="i-lucide-log-in"
          block
        >
          Zaloguj się
        </UButton>
        <UButton
          v-else
          color="neutral"
          variant="outline"
          icon="i-lucide-log-out"
          block
          @click="logoutFromMenu"
        >
          Wyloguj
        </UButton>
      </nav>
    </template>
  </UDrawer>
</template>
