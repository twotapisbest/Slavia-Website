<script setup lang="ts">
const props = defineProps<{
  /**
   * drawer — przycisk szuflady (poniżej breakpointu lg)
   * links — środek nagłówka (lg+): publiczne + panel po zalogowaniu
   * public-mobile — pod nagłówkiem (poniżej lg): tylko linki bez logowania
   */
  mode: 'drawer' | 'links' | 'public-mobile'
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
  /** Główny skrót roli (np. SuperAdmin / panel) — delikatnie wyróżniony */
  emphasis?: boolean
}

const items = computed(() => {
  const main = [
    { label: 'Zawodnicy', to: '/zawodnicy' },
    { label: 'Kalendarz', to: '/kalendarz' },
    { label: 'Blog', to: '/blog' },
    { label: 'Kalkulator', to: '/kalkulator-sinclair' }
  ]

  const management: ManagementLink[] = []
  if (auth.isLoggedIn.value) {
    const role = auth.user.value?.role
    if (role === 'SuperAdmin') {
      management.push({ label: 'Panel SuperAdmin', to: '/superadmin', icon: 'i-lucide-shield-check', emphasis: true })
      management.push({ label: 'Panel admina', to: '/admin', icon: 'i-lucide-layout-dashboard' })
      management.push({ label: 'Panel trenera', to: '/trainer', icon: 'i-lucide-dumbbell' })
      management.push({ label: 'Moje konto', to: '/profil', icon: 'i-lucide-user-circle' })
    } else if (role === 'Admin') {
      management.push({ label: 'Panel admina', to: '/admin', icon: 'i-lucide-layout-dashboard', emphasis: true })
      management.push({ label: 'Moje konto', to: '/profil', icon: 'i-lucide-user-circle' })
    } else if (role === 'TrainerAdmin') {
      management.push({
        label: 'Panel admin i trener',
        to: '/admin',
        icon: 'i-lucide-layout-dashboard',
        emphasis: true
      })
      management.push({ label: 'Moje konto', to: '/profil', icon: 'i-lucide-user-circle' })
    } else if (role === 'Trainer') {
      management.push({ label: 'Panel trenera', to: '/trainer', icon: 'i-lucide-dumbbell', emphasis: true })
      management.push({ label: 'Moje konto', to: '/profil', icon: 'i-lucide-user-circle' })
    } else if (role === 'Athlete') {
      management.push({ label: 'Profil', to: '/athlete', icon: 'i-lucide-user', emphasis: true })
      management.push({ label: 'Mój kalendarz', to: '/athlete/kalendarz', icon: 'i-lucide-calendar-days' })
      management.push({ label: 'Dziennik', to: '/athlete/dziennik', icon: 'i-lucide-book-open' })
    }
  }

  return { main, management }
})
</script>

<template>
  <!-- Środek nagłówka: zewnętrzny scroll (min-w-0), wewnątrz pełna szerokość treści — bez ucinania etykiet (truncate z motywu przycisku). -->
  <div
    v-if="props.mode === 'links'"
    class="mx-auto min-w-0 w-full max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] py-0.5 [&::-webkit-scrollbar]:hidden"
  >
    <nav
      class="mx-auto flex w-max max-w-none flex-row flex-nowrap items-center gap-2 lg:gap-3 [&_[data-slot=label]]:!overflow-visible [&_[data-slot=label]]:!text-clip [&_[data-slot=label]]:!whitespace-nowrap"
      aria-label="Główna nawigacja"
    >
      <div
        class="flex shrink-0 flex-row flex-nowrap items-center gap-0.5 rounded-full bg-muted/45 px-1 py-1 ring-1 ring-default/55 backdrop-blur-sm dark:bg-muted/25 lg:gap-1 lg:px-1.5 lg:py-1.5"
      >
        <UButton
          v-for="link in items.main"
          :key="link.to"
          :to="link.to"
          variant="ghost"
          color="neutral"
          size="sm"
          class="shrink-0 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-primary/15 hover:text-primary lg:px-3.5 lg:text-[15px]"
          active-class="bg-primary/15 text-primary ring-1 ring-primary/35"
        >
          {{ link.label }}
        </UButton>
      </div>

      <div
        v-if="items.management.length > 0"
        class="flex shrink-0 flex-row flex-nowrap items-center gap-1.5 border-l border-default pl-3 lg:gap-2 lg:pl-4"
      >
        <UButton
          v-for="link in items.management"
          :key="link.to"
          :to="link.to"
          :icon="link.icon"
          variant="outline"
          color="neutral"
          size="sm"
          class="max-w-none shrink-0 rounded-full px-3 font-semibold shadow-none ring-0 transition-colors"
          :class="
            link.emphasis
              ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
              : 'text-muted hover:border-primary/30 hover:bg-primary/5 hover:text-highlighted'
          "
          active-class="border-primary bg-primary/15 text-primary"
        >
          {{ link.label }}
        </UButton>
      </div>
    </nav>
  </div>

  <div
    v-else-if="props.mode === 'public-mobile'"
    class="border-t border-default/80 bg-muted/25 backdrop-blur-md lg:hidden"
  >
    <UContainer class="max-w-full px-3 sm:px-6">
      <nav
        class="-mx-0.5 flex flex-nowrap items-center gap-1.5 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden"
        aria-label="Strony dostępne bez logowania"
      >
        <UButton
          v-for="link in items.main"
          :key="'pub-strip-' + link.to"
          :to="link.to"
          color="neutral"
          variant="subtle"
          size="sm"
          class="shrink-0 rounded-full px-3.5 font-semibold text-highlighted shadow-none ring-1 ring-default/60 hover:bg-primary/12 hover:text-primary hover:ring-primary/35 sm:px-4"
          active-class="bg-primary/18 text-primary ring-primary/45"
        >
          {{ link.label }}
        </UButton>
      </nav>
    </UContainer>
  </div>

  <div v-else-if="props.mode === 'drawer'" class="lg:hidden">
    <UDrawer
      v-model:open="mobileDrawerOpen"
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
        <nav class="flex flex-col gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            block
            class="min-h-12 justify-start rounded-xl text-base font-semibold sm:text-lg"
          >
            Strona Główna
          </UButton>
          
          <p class="px-1 pb-1 text-[11px] leading-snug text-muted">
            Skróty do zawodników, kalendarza, bloga i kalkulatora znajdziesz w belce pod logo — możesz ją przewinąć w poziomie.
          </p>

          <template v-if="items.management.length > 0">
            <USeparator class="my-2" />
            <p class="mb-1 px-1 text-[11px] font-bold uppercase tracking-wider text-muted">
              Panel / konto
            </p>
            <UButton
              v-for="link in items.management"
              :key="link.to + '-m-adm'"
              :to="link.to"
              :icon="link.icon"
              variant="outline"
              color="neutral"
              size="lg"
              block
              class="min-h-12 justify-start rounded-xl font-semibold shadow-none"
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
              class="min-h-12 rounded-xl justify-center"
            >
              Zaloguj się
            </UButton>
          </template>
          <template v-else>
            <div class="mb-4 rounded-xl bg-muted/30 px-3 py-3">
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
              class="min-h-12 rounded-xl justify-center"
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
