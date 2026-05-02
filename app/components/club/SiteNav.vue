<script setup lang="ts">
const auth = useAuth()

async function logoutFromMenu() {
  auth.logout()
  await navigateTo('/')
}

const items = computed(() => {
  const main = [
    { label: 'Zawodnicy', to: '/zawodnicy' },
    { label: 'Kalendarz', to: '/kalendarz' },
    { label: 'Blog', to: '/blog' },
    { label: 'Kalkulator', to: '/kalkulator-sinclair' }
  ]

  const management = []
  if (auth.isLoggedIn.value) {
    if (auth.user.value?.role === 'SuperAdmin') {
      management.push({ label: 'SuperAdmin', to: '/superadmin', color: 'primary' })
      management.push({ label: 'Panel Admina', to: '/admin', color: 'neutral' })
      management.push({ label: 'Panel Trenera', to: '/trainer', color: 'secondary' })
      management.push({ label: 'Moje konto', to: '/profil', color: 'primary' })
    } else if (auth.user.value?.role === 'Admin') {
      management.push({ label: 'Panel Admina', to: '/admin', color: 'primary' })
      management.push({ label: 'Moje konto', to: '/profil', color: 'neutral' })
    } else if (auth.user.value?.role === 'TrainerAdmin') {
      management.push({ label: 'Panel Trenera', to: '/trainer', color: 'primary' })
      management.push({ label: 'Moje konto', to: '/profil', color: 'neutral' })
    } else if (auth.user.value?.role === 'Trainer') {
      management.push({ label: 'Panel Trenera', to: '/trainer', color: 'primary' })
      management.push({ label: 'Moje konto', to: '/profil', color: 'neutral' })
    } else if (auth.user.value?.role === 'Athlete') {
      management.push({ label: 'Mój Profil', to: '/athlete', color: 'primary' })
      management.push({ label: 'Mój kalendarz', to: '/athlete/kalendarz', color: 'secondary' })
      management.push({ label: 'Dziennik treningów', to: '/athlete/dziennik', color: 'neutral' })
    }
  }
  
  return { main, management }
})
</script>

<template>
  <nav
    class="hidden items-center gap-1 md:flex"
    aria-label="Główna nawigacja"
  >
    <UButton
      v-for="link in items.main"
      :key="link.to"
      :to="link.to"
      variant="ghost"
      color="neutral"
      class="text-sm font-semibold transition-colors hover:bg-primary/5 hover:text-primary"
      active-class="text-primary bg-primary/10"
    >
      {{ link.label }}
    </UButton>
    
    <div v-if="items.management.length > 0" class="flex items-center gap-1 ml-2 pl-2 border-l border-default">
      <UButton
        v-for="link in items.management"
        :key="link.to"
        :to="link.to"
        variant="subtle"
        :color="link.color as any"
        size="sm"
        class="font-bold"
      >
        {{ link.label }}
      </UButton>
    </div>
  </nav>

  <div class="md:hidden">
    <UDrawer
      title="Menu Slavia"
    >
      <UButton
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        size="lg"
        aria-label="Otwórz menu"
      />

      <template #body>
        <nav class="flex flex-col gap-2 p-4">
          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            block
            class="justify-start text-lg font-medium"
          >
            Strona Główna
          </UButton>
          
          <UButton
            v-for="link in items.main"
            :key="link.to + '-m'"
            :to="link.to"
            variant="ghost"
            color="neutral"
            block
            class="justify-start text-lg font-medium"
          >
            {{ link.label }}
          </UButton>
          
          <template v-if="items.management.length > 0">
            <USeparator class="my-2" />
            <UButton
              v-for="link in items.management"
              :key="link.to + '-m-adm'"
              :to="link.to"
              variant="soft"
              :color="link.color as any"
              block
              class="justify-start text-lg font-bold"
            >
              {{ link.label }}
            </UButton>
          </template>
          
          <USeparator class="my-4" />
          
          <template v-if="!auth.isLoggedIn.value">
            <UButton
              to="/logowanie"
              icon="i-lucide-log-in"
              size="lg"
              block
            >
              Zaloguj się
            </UButton>
          </template>
          <template v-else>
            <div class="mb-4 px-3 py-2 rounded-lg bg-muted/30">
              <p class="text-xs text-muted uppercase font-bold tracking-wider mb-1">Zalogowany jako</p>
              <div class="flex items-center justify-between">
                <p class="font-bold text-highlighted">{{ auth.user.value?.username }}</p>
                <UBadge size="xs" variant="subtle" color="primary" class="uppercase text-[10px]">{{ auth.user.value?.role }}</UBadge>
              </div>
            </div>
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-log-out"
              size="lg"
              block
              @click="logoutFromMenu"
            >
              Wyloguj
            </UButton>
          </template>
        </nav>
      </template>
    </UDrawer>
  </div>
</template>
