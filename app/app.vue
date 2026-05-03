<script setup lang="ts">
const auth = useAuth()
const appearance = useSlaviaAppearance()
const clubNotificationBellOn = useExperimentalFlag('club_notification_bell')
/** Krótki splash tylko przy pierwszym paint — długi overlay blokował interakcję i powodował „trzeba odświeżyć”. */
const isAppLoading = ref(true)
const config = useRuntimeConfig()

onMounted(async () => {
  if (import.meta.client && auth.token.value) {
    await auth.fetchMe()
  }
  appearance.hydrate()
  requestAnimationFrame(() => {
    isAppLoading.value = false
  })
})

watch(
  () => auth.token.value,
  async (t) => {
    if (!import.meta.client) {
      return
    }
    if (t) {
      await auth.fetchMe()
    }
    appearance.hydrate()
  }
)

watch(isAppLoading, (loading) => {
  if (!import.meta.client) return
  document.documentElement.classList.toggle('overflow-hidden', loading)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.classList.remove('overflow-hidden')
})

const dashboardLink = computed(() => {
  if (auth.isSuperAdmin.value) return '/superadmin'
  if (auth.isAdmin.value) return '/admin'
  if (auth.isTrainer.value) return '/trainer'
  return '/athlete'
})

const title = 'CKS Slavia Ruda Śląska — podnoszenie ciężarów'
const description = 'Klub sportowy Slavia Ruda Śląska: zawodnicy, wyniki i społeczność skupiona wokół sportów siłowych.'
const siteUrl = computed(() => (config.public.siteUrl as string).replace(/\/$/, ''))
const socialImage = computed(() => `${siteUrl.value}/logo.png`)

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'pl'
  }
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogSiteName: 'CKS Slavia Ruda Śląska',
  ogLocale: 'pl_PL',
  ogUrl: siteUrl,
  ogImage: socialImage,
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: socialImage,
  twitterCard: 'summary_large_image'
})

async function logout() {
  auth.logout()
  await navigateTo('/')
}
</script>

<template>
  <UApp>
    <!-- Splash: pełna nieprzezroczysta warstwa; bez fade-out całego overlay (wtedy „przeświecał” tekst strony). -->
    <div
      v-if="isAppLoading"
      class="fixed inset-0 z-[10050] flex flex-col items-center justify-center bg-[var(--ui-bg)]"
      aria-busy="true"
      aria-live="polite"
    >
      <Transition
        appear
        enter-active-class="transition duration-400 ease-out"
        enter-from-class="opacity-0 scale-[0.97]"
        enter-to-class="opacity-100 scale-100"
      >
        <div class="relative flex flex-col items-center px-6">
          <div class="absolute -inset-8 animate-pulse rounded-full bg-primary/20 blur-2xl" />
          <img
            src="/logo.png"
            alt="Slavia Logo"
            class="relative h-32 w-auto animate-bounce mb-8"
          >
          <div class="flex items-center gap-2">
            <div
              class="h-2 w-2 animate-bounce rounded-full bg-primary"
              style="animation-delay: 0.1s"
            />
            <div
              class="h-2 w-2 animate-bounce rounded-full bg-primary"
              style="animation-delay: 0.2s"
            />
            <div
              class="h-2 w-2 animate-bounce rounded-full bg-primary"
              style="animation-delay: 0.3s"
            />
          </div>
          <p class="mt-4 text-sm font-bold uppercase tracking-[0.3em] text-primary italic">
            Ładowanie...
          </p>
        </div>
      </Transition>
    </div>

    <div
      class="transition-opacity duration-300 ease-out"
      :class="isAppLoading ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'"
    >
      <!-- Na mobile bez border-b na całym UHeader: linia pod belką z 4 linkami „cięła” pierwszą linię treści; odstęp daje belka (SiteNav public-mobile). Od lg zostaje klasyczna linia pod nagłówkiem. -->
      <UHeader
        :toggle="false"
        class="border-default backdrop-blur-md bg-background/80 sticky top-0 z-50 lg:border-b"
      >
        <template #left>
          <div class="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6 xl:gap-8">
            <ClubBrand />
            <ClubSiteNav mode="drawer" />
          </div>
        </template>

        <template #default>
          <ClubSiteNav mode="links" />
        </template>

        <template #bottom>
          <ClubSiteNav mode="public-mobile" />
        </template>

        <template #right>
          <div class="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <template v-if="auth.isLoggedIn.value">
              <ClubNotificationBell v-if="clubNotificationBellOn" />
              <NuxtLink
                :to="dashboardLink"
                class="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-primary/25 transition-colors hover:bg-primary/10 sm:hidden"
                :aria-label="`Panel: ${auth.user.value?.username ?? ''}`"
              >
                <UAvatar
                  :alt="auth.user.value?.username"
                  size="xs"
                  class="ring-1 ring-primary/30"
                />
              </NuxtLink>
              <div class="hidden items-center gap-4 sm:flex lg:gap-5">
                <NuxtLink
                  :to="dashboardLink"
                  class="group flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 transition-all hover:bg-primary/10 ring-1 ring-primary/20 lg:px-5"
                >
                  <UAvatar
                    :alt="auth.user.value?.username"
                    size="xs"
                    class="ring-1 ring-primary/20"
                  />
                  <span class="text-sm font-semibold text-highlighted group-hover:text-primary">
                    {{ auth.user.value?.username }}
                  </span>
                </NuxtLink>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-log-out"
                  class="text-muted hover:text-error"
                  @click="logout"
                />
              </div>
            </template>
            <div
              v-else
              class="hidden sm:block"
            >
              <UButton
                to="/logowanie"
                icon="i-lucide-log-in"
                size="sm"
                variant="solid"
                class="font-bold"
              >
                Zaloguj się
              </UButton>
            </div>
            <UColorModeButton />
          </div>
        </template>
      </UHeader>

      <UMain class="slavia-safe-x">
        <NuxtPage />
      </UMain>

      <UFooter
        class="border-t border-default bg-muted/5 py-8 slavia-safe-bottom slavia-safe-x lg:py-10"
        :ui="{ container: 'flex flex-col gap-8 md:flex-row md:items-center md:justify-between lg:gap-12' }"
      >
        <template #left>
          <div class="flex flex-col gap-2">
            <p class="text-sm font-bold text-highlighted uppercase tracking-widest">
              CKS Slavia Ruda Śląska
            </p>
            <div class="flex flex-col text-xs text-muted">
              <span class="flex items-center gap-2"><UIcon
                name="i-lucide-map-pin"
                class="size-3"
              /> ul. Konopnickiej 13, 41-700 Ruda Śląska</span>
              <span class="flex items-center gap-2"><UIcon
                name="i-lucide-calendar"
                class="size-3"
              /> Treningi: Pn, Śr, Pt (15:00 - 18:00)</span>
            </div>
          </div>
        </template>

        <template #right>
          <div class="flex w-full flex-col gap-2 text-left md:w-auto md:items-end md:text-right">
            <p class="text-xs text-muted">
              © {{ new Date().getFullYear() }} Slavia Ruda Śląska.
            </p>
            <p class="text-[10px] text-muted/50">
              Realizacja: Neution Studio · Jakub Gawron
            </p>
          </div>
        </template>
      </UFooter>
    </div>
  </UApp>
</template>

<style>
/* Globalne przejścia stron */
.page-enter-active,
.page-leave-active {
  transition: all 0.4s ease-out;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
  filter: blur(4px);
}
</style>
