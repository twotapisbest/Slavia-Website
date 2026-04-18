<script setup lang="ts">
const auth = useAuth()
const route = useRoute()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

useSeoMeta({
  title: 'Logowanie — Slavia Ruda Śląska',
  description: 'Logowanie do panelu klubowego LKS Slavia.'
})

async function submit () {
  loading.value = true
  try {
    const user = await auth.login(email.value.trim(), password.value)
    const raw = route.query.redirect
    const redirect = typeof raw === 'string' ? raw : undefined
    if (redirect) {
      await navigateTo(redirect)
    } else if (user.role === 'superadmin') {
      await navigateTo('/superadmin')
    } else if (user.role === 'admin') {
      await navigateTo('/admin/zawodnicy')
    } else {
      await navigateTo('/')
    }
  } catch (e) {
    toast.add({
      title: 'Błąd logowania',
      description: getApiErrorMessage(e, 'Sprawdź dane logowania i połączenie z API.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="flex min-h-[60vh] flex-col items-center justify-center py-16">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex justify-center">
          <span
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary"
          >
            <UIcon
              name="i-lucide-shield"
              class="size-6"
            />
          </span>
        </div>
        <h1 class="text-2xl font-bold text-highlighted">
          Strefa klubu
        </h1>
        <p class="mt-2 text-muted">
          Zaloguj się, aby wejść do panelu administratora lub superadministratora.
        </p>
      </div>

      <UCard>
        <form
          class="space-y-4"
          @submit.prevent="submit"
        >
          <UFormField
            label="E-mail"
            required
          >
            <UInput
              v-model="email"
              type="email"
              autocomplete="username"
              size="lg"
            />
          </UFormField>
          <UFormField
            label="Hasło"
            required
          >
            <UInput
              v-model="password"
              type="password"
              autocomplete="current-password"
              size="lg"
            />
          </UFormField>
          <UButton
            type="submit"
            block
            size="lg"
            :loading="loading"
            trailing-icon="i-lucide-arrow-right"
          >
            Zaloguj
          </UButton>
        </form>
      </UCard>

      <p class="mt-6 text-center text-sm text-muted">
        <NuxtLink
          to="/"
          class="font-medium text-primary hover:underline"
        >
          ← Wróć na stronę główną
        </NuxtLink>
      </p>
    </div>
  </UContainer>
</template>
