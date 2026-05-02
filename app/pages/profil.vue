<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Moje konto — Slavia',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()

const form = reactive({
  email: '',
  avatar_url: '',
  newPassword: '',
  confirmPassword: ''
})

watch(
  () => auth.user.value,
  (u) => {
    if (!u) {
      return
    }
    form.email = u.email || ''
    form.avatar_url = u.avatar_url || ''
  },
  { immediate: true }
)

/** Podgląd: najpierw wpisywany URL, potem zapisane na koncie (np. zanim zapiszesz zmianę). */
const profileAvatarSrc = computed(() => {
  const typed = form.avatar_url?.trim()
  if (typed) {
    return typed
  }
  const saved = auth.user.value?.avatar_url?.trim()
  return saved || ''
})

const avatarBroken = ref(false)

watch(() => form.avatar_url, () => {
  avatarBroken.value = false
})

watch(
  () => auth.user.value?.avatar_url,
  () => {
    avatarBroken.value = false
  }
)

const saving = ref(false)

onMounted(() => {
  if (auth.token.value) {
    auth.fetchMe()
  }
})

async function save () {
  if (form.newPassword && form.newPassword !== form.confirmPassword) {
    toast.add({ title: 'Hasła się nie zgadzają', color: 'warning' })
    return
  }
  saving.value = true
  try {
    const payload: Record<string, string> = {}
    const em = form.email.trim()
    payload.email = em
    const av = form.avatar_url.trim()
    payload.avatar_url = av
    if (form.newPassword) {
      payload.password = form.newPassword
    }
    await apiFetch('/api/auth/profile', { method: 'PATCH', body: payload })
    await auth.fetchMe()
    form.newPassword = ''
    form.confirmPassword = ''
    toast.add({ title: 'Konto zaktualizowane', color: 'success' })
  } catch (e) {
    toast.add({
      title: 'Nie udało się zapisać',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 md:py-16 max-w-lg animate-page-in">
    <p class="text-xs font-bold uppercase tracking-wider text-primary">
      Konto użytkownika
    </p>
    <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
      Moje konto
    </h1>
    <p class="mt-2 text-sm text-muted leading-relaxed">
      Login:
      <span class="font-semibold text-highlighted">{{ auth.user.value?.username }}</span>
      · rola:
      <span class="font-semibold text-highlighted">{{ auth.user.value?.role }}</span>
    </p>
    <p class="mt-2 text-xs text-muted">
      Zmiana loginu innych osób jest w panelu administratorów; tutaj edytujesz wyłącznie swoje dane.
    </p>

    <UCard class="mt-8 overflow-hidden">
      <div class="flex flex-col gap-6 p-4 sm:p-6 sm:flex-row sm:items-start">
        <div class="flex flex-col items-center gap-3 shrink-0 sm:items-start">
          <div
            class="relative size-32 overflow-hidden rounded-2xl ring-2 ring-default shadow-xl bg-muted sm:size-36"
          >
            <img
              v-if="profileAvatarSrc && !avatarBroken"
              :src="profileAvatarSrc"
              :alt="`Zdjęcie profilowe ${auth.user.value?.username || ''}`"
              class="size-full object-cover"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="avatarBroken = true"
            >
            <div
              v-else
              class="flex size-full flex-col items-center justify-center gap-2 bg-linear-to-br from-muted to-muted/60 px-3 text-center"
            >
              <UIcon name="i-lucide-user-round" class="size-14 text-muted opacity-80" />
              <span class="text-[11px] font-medium leading-tight text-muted">Brak zdjęcia lub niepoprawny adres URL</span>
            </div>
          </div>
          <p class="max-w-44 text-center text-[11px] text-muted leading-snug sm:text-left">
            Podgląd odświeża się po zmianie pola URL — po „Zapisz” trafia na konto.
          </p>
        </div>

        <div class="min-w-0 flex-1 space-y-4">
        <UFormField label="E-mail">
          <UInput v-model="form.email" type="email" autocomplete="email" class="w-full" />
        </UFormField>
        <UFormField label="URL avatara">
          <UInput v-model="form.avatar_url" type="url" placeholder="https://..." class="w-full" />
        </UFormField>
        <UFormField label="Nowe hasło (opcjonalnie)">
          <UInput v-model="form.newPassword" type="password" autocomplete="new-password" class="w-full" />
        </UFormField>
        <UFormField label="Powtórz hasło">
          <UInput v-model="form.confirmPassword" type="password" autocomplete="new-password" class="w-full" />
        </UFormField>
        <div class="flex flex-wrap gap-2 pt-2">
          <UButton :loading="saving" @click="save">
            Zapisz
          </UButton>
          <UButton color="neutral" variant="ghost" to="/">
            Wróć na stronę główną
          </UButton>
        </div>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
