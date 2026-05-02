<script setup lang="ts">
const auth = useAuth()
/** Krótki splash tylko przy pierwszym paint — długi overlay blokował interakcję i powodował „trzeba odświeżyć”. */
const isAppLoading = ref(true)
const config = useRuntimeConfig()

onMounted(() => {
  if (auth.token.value) {
    auth.fetchMe()
  }
  requestAnimationFrame(() => {
    isAppLoading.value = false
  })
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
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
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
    <!-- Splash Screen -->
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-700 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isAppLoading" class="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background">
        <div class="relative flex flex-col items-center">
          <div class="absolute -inset-8 animate-pulse rounded-full bg-primary/20 blur-2xl" />
          <img src="/logo.png" alt="Slavia Logo" class="relative h-32 w-auto animate-bounce mb-8" />
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="animation-delay: 0.1s" />
            <div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="animation-delay: 0.2s" />
            <div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="animation-delay: 0.3s" />
          </div>
          <p class="mt-4 text-sm font-bold uppercase tracking-[0.3em] text-primary italic">Ładowanie...</p>
        </div>
      </div>
    </Transition>

    <UHeader class="border-b border-default backdrop-blur-md bg-background/80 sticky top-0 z-50">
      <template #left>
        <div class="flex items-center gap-4 lg:gap-8">
          <ClubBrand />
          <ClubSiteNav />
        </div>
      </template>

      <template #right>
        <div class="flex items-center gap-3">
          <template v-if="auth.isLoggedIn.value">
            <div class="hidden items-center gap-4 sm:flex">
              <NuxtLink 
                :to="dashboardLink"
                class="group flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 transition-all hover:bg-primary/10 ring-1 ring-primary/20"
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
          <div v-else class="hidden sm:block">
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

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter class="border-t border-default bg-muted/5 py-8">
      <template #left>
        <div class="flex flex-col gap-2">
          <p class="text-sm font-bold text-highlighted uppercase tracking-widest">
            CKS Slavia Ruda Śląska
          </p>
          <div class="flex flex-col text-xs text-muted">
            <span class="flex items-center gap-2"><UIcon name="i-lucide-map-pin" class="size-3" /> ul. Konopnickiej 13, 41-700 Ruda Śląska</span>
            <span class="flex items-center gap-2"><UIcon name="i-lucide-calendar" class="size-3" /> Treningi: Pn, Śr, Pt (15:00 - 18:00)</span>
          </div>
        </div>
      </template>

      <template #right>
        <div class="flex flex-col items-end gap-2 text-right">
          <p class="text-xs text-muted">
            © {{ new Date().getFullYear() }} Slavia Ruda Śląska.
          </p>
          <p class="text-[10px] text-muted/50">
            Realizacja: Neution Studio · Jakub Gawron
          </p>
        </div>
      </template>
    </UFooter>
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
