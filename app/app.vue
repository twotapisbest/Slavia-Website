<script setup lang="ts">
const auth = useAuth()

const title = 'CKS Slavia Ruda Śląska — podnoszenie ciężarów'
const description = 'Klub sportowy Slavia Ruda Śląska: zawodnicy, wyniki i społeczność skupiona wokół sportów siłowych.'

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
  twitterCard: 'summary_large_image'
})

async function logout() {
  auth.logout()
  await navigateTo('/')
}
</script>

<template>
  <UApp>
    <UHeader class="border-b border-default">
      <template #left>
        <div class="flex items-center gap-4 lg:gap-8">
          <ClubBrand />
          <SiteNav />
        </div>
      </template>

      <template #right>
        <div class="hidden items-center gap-2 sm:flex">
          <template v-if="auth.isLoggedIn.value">
            <span class="max-w-35 truncate text-xs text-muted lg:max-w-50 lg:text-sm">
              {{ auth.user.value?.username }}
            </span>
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-log-out"
              @click="logout"
            >
              Wyloguj
            </UButton>
          </template>
          <UButton
            v-else
            to="/logowanie"
            icon="i-lucide-log-in"
            size="sm"
          >
            Zaloguj
          </UButton>
        </div>
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter class="border-t border-default">
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} CKS Slavia Ruda Śląska. Wszystkie prawa zastrzeżone.
        </p>
      </template>
      <template #right>
        <p class="text-xs text-muted">
          Frontend Nuxt · API zewnętrzne
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
