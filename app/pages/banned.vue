<script setup lang="ts">
const auth = useAuth()
</script>

<template>
  <div class="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
    <h1 class="text-3xl font-semibold tracking-tight">Konto zbanowane</h1>
    <p class="mt-4 text-base opacity-90">
      Trener cię zbanował za słabe treningi lub brak składek.
    </p>

    <p v-if="auth.user.value?.banned_reason" class="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
      <span class="font-medium">Powód:</span>
      {{ auth.user.value?.banned_reason }}
    </p>

    <div class="mt-8 flex items-center gap-3">
      <button class="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/15" @click="auth.logout()">
        Wyloguj
      </button>
      <NuxtLink class="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/15" to="/logowanie">
        Zmień konto
      </NuxtLink>
    </div>
  </div>
</template>

