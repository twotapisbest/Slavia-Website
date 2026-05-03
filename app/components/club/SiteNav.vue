<script setup lang="ts">
const props = defineProps<{
  /**
   * drawer — szuflada na węższych ekranach (trigger widoczny gdy rodzic nie ukrywa komponentu)
   * desktop-inline — jeden rząd: linki klubu + dropdown „Panel”
   */
  mode: 'drawer' | 'desktop-inline'
}>()

const auth = useAuth()
const route = useRoute()
const mobileDrawerOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    mobileDrawerOpen.value = false
  }
)

async function logoutFromMenu() {
  mobileDrawerOpen.value = false
  auth.logout()
  await navigateTo('/')
}

type ManagementLink = {
  label: string
  to: string
  icon: string
  emphasis?: boolean
}

const items = computed(() => {
  const main = [
    { label: 'Ogłoszenia', to: '/ogloszenia' },
    { label: 'Aktualności', to: '/aktualnosci' },
    { label: 'Galeria', to: '/galeria' },
    { label: 'Zawodnicy', to: '/zawodnicy' },
    { label: 'Wyniki', to: '/wyniki-zawodow' },
    { label: 'Kalendarz', to: '/kalendarz' },
    { label: 'Kontakt', to: '/kontakt' },
    { label: 'Kalkulator', to: '/kalkulator-sinclair' }
  ]

  const management: ManagementLink[] = []
  if (!auth.isLoggedIn.value) {
    return { main, management }
  }

  const r = new Set(auth.user.value?.roles ?? [])
  const hasSA = r.has('SuperAdmin')
  const hasAdmin = r.has('Admin')
  const hasTrainer = r.has('Trainer')
  const hasAthlete = r.has('Athlete')

  const needsAdminDashboard = hasSA || hasAdmin
  const showTrainerPanel = hasSA || hasTrainer

  let emphasisPending = true
  const pushLink = (link: ManagementLink) => {
    if (emphasisPending) {
      link.emphasis = true
      emphasisPending = false
    }
    management.push(link)
  }

  if (hasSA) {
    pushLink({ label: 'Panel SuperAdmin', to: '/superadmin', icon: 'i-lucide-shield-check' })
  }

  if (needsAdminDashboard) {
    pushLink({ label: 'Panel admina', to: '/admin', icon: 'i-lucide-layout-dashboard' })
  }

  if (showTrainerPanel) {
    pushLink({ label: 'Panel trenera', to: '/trainer', icon: 'i-lucide-dumbbell' })
  }

  if (hasAthlete || hasSA) {
    pushLink({ label: 'Profil zawodnika', to: '/athlete', icon: 'i-lucide-user' })
    management.push({ label: 'Mój kalendarz', to: '/athlete/kalendarz', icon: 'i-lucide-calendar-days' })
    management.push({ label: 'Dziennik', to: '/athlete/dziennik', icon: 'i-lucide-book-open' })
  }

  pushLink({
    label: 'Moje konto',
    to: '/profil',
    icon: 'i-lucide-user-circle'
  })

  return { main, management }
})

/** Dropdown „Panel” — jedna kontrolka zamiast wielu szerokich przycisków przy prawej krawędzi. */
const panelDropdownItems = computed(() =>
  items.value.management.map(link => ({
    label: link.label,
    icon: link.icon,
    to: link.to,
    ...(link.emphasis ? { color: 'primary' as const } : {})
  }))
)
</script>

<template>
  <div
    v-if="props.mode === 'desktop-inline'"
    class="flex min-w-0 flex-1 items-center gap-2 xl:gap-3"
  >
    <nav
      class="flex min-h-10 min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto overflow-y-visible overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] py-0.5 [&::-webkit-scrollbar]:hidden"
      aria-label="Strony klubu"
    >
      <NuxtLink
        v-for="link in items.main"
        :key="'nav-' + link.to"
        :to="link.to"
        class="inline-flex shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-muted/70 hover:text-highlighted xl:px-3 xl:text-sm"
        active-class="bg-primary/14 font-semibold text-primary"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>

    <UDropdownMenu
      v-if="items.management.length > 0"
      :modal="false"
      :items="panelDropdownItems"
      :content="{ align: 'end', collisionPadding: 16 }"
      :ui="{ content: 'min-w-[14rem]' }"
      class="shrink-0"
    >
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        trailing-icon="i-lucide-chevron-down"
        class="h-9 shrink-0 gap-1.5 rounded-lg px-3 text-xs font-bold uppercase tracking-wide xl:h-10 xl:px-3.5 xl:text-[13px]"
      >
        Panel
      </UButton>
    </UDropdownMenu>
  </div>

  <div
    v-else-if="props.mode === 'drawer'"
    class="inline-flex"
  >
    <UDrawer
      v-model:open="mobileDrawerOpen"
      title="Menu Slavia"
    >
      <UButton
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        size="lg"
        square
        class="rounded-xl"
        aria-label="Otwórz menu"
      />

      <template #body>
        <nav class="flex flex-col gap-1 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 sm:px-4">
          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            block
            class="min-h-12 justify-start rounded-xl text-base font-semibold"
          >
            Strona główna
          </UButton>

          <p class="mb-0 px-2 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            Klub
          </p>
          <UButton
            v-for="link in items.main"
            :key="'drawer-main-' + link.to"
            :to="link.to"
            variant="ghost"
            color="neutral"
            block
            class="min-h-11 justify-start rounded-xl text-[15px] font-semibold"
          >
            {{ link.label }}
          </UButton>

          <template v-if="items.management.length > 0">
            <USeparator class="my-3" />
            <p class="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
              Panel i konto
            </p>
            <UButton
              v-for="link in items.management"
              :key="link.to + '-m-adm'"
              :to="link.to"
              :icon="link.icon"
              variant="outline"
              color="neutral"
              block
              class="min-h-11 justify-start rounded-xl font-semibold shadow-none"
              :class="
                link.emphasis
                  ? 'border-primary/45 bg-primary/10 text-primary'
                  : 'text-highlighted'
              "
              active-class="border-primary bg-primary/18 text-primary ring-1 ring-primary/25"
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
              class="min-h-12 rounded-xl justify-center font-bold"
            >
              Zaloguj się
            </UButton>
          </template>
          <template v-else>
            <div class="mb-3 rounded-xl bg-muted/35 px-3 py-3 ring-1 ring-default/40">
              <p class="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                Zalogowany jako
              </p>
              <div class="flex items-center justify-between gap-2">
                <p class="truncate font-semibold text-highlighted">
                  {{ auth.user.value?.username }}
                </p>
                <UBadge
                  size="xs"
                  variant="subtle"
                  color="primary"
                  class="shrink-0 text-[10px] font-semibold"
                >
                  {{ auth.rolesDisplayShort }}
                </UBadge>
              </div>
            </div>
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-log-out"
              size="lg"
              block
              class="min-h-12 rounded-xl justify-center font-semibold"
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
