<script setup lang="ts" generic="T = any">
defineOptions({
  name: 'ErrorPage'
})

const error = useError()

const handleError = () => clearError({ redirect: '/' })

const funnyMessages = [
  'Wygląda na to, że ten ciężar był za duży i strona spadła z pomostu.',
  'Brak ciężaru na gryfie! Ta strona nie istnieje w naszej bazie wyników.',
  'Spalona próba! Sędziowie dają trzy czerwone światła dla tego adresu.',
  'Ups! Ktoś zapomniał posmarować gryf magnezją i strona się wyślizgnęła.'
]

const message = computed(() => {
  if (error.value?.statusCode === 404) {
    return funnyMessages[Math.floor(Math.random() * funnyMessages.length)]
  }
  return 'Wystąpił nieoczekiwany błąd. Trener już nad tym pracuje!'
})
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
    <div class="relative mb-8">
      <div class="absolute -inset-10 animate-pulse rounded-full bg-primary/10 blur-3xl" />
      <img
        src="/logo.png"
        alt="Slavia Logo"
        class="relative h-40 w-auto opacity-20 grayscale transition-all hover:opacity-100 hover:grayscale-0"
      >
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-9xl font-black italic tracking-tighter text-highlighted/10">404</span>
      </div>
    </div>

    <h1 class="mb-4 text-4xl font-black uppercase italic tracking-tight text-highlighted sm:text-6xl">
      Błąd <span class="text-primary">{{ error?.statusCode || 404 }}</span>
    </h1>

    <p class="mb-10 max-w-md text-xl font-medium text-muted">
      {{ message }}
    </p>

    <div class="flex flex-col gap-4 sm:flex-row">
      <UButton
        size="xl"
        icon="i-lucide-home"
        class="font-bold"
        @click="handleError"
      >
        Powrót na pomost
      </UButton>
      <UButton
        size="xl"
        variant="ghost"
        color="neutral"
        icon="i-lucide-refresh-cw"
        class="font-bold"
        @click="() => window.location.reload()"
      >
        Spróbuj ponownie
      </UButton>
    </div>

    <div class="mt-20 flex items-center gap-4 text-muted/30">
      <UIcon
        name="i-lucide-dumbbell"
        class="size-10"
      />
      <div class="h-1 w-20 rounded-full bg-current" />
      <UIcon
        name="i-lucide-dumbbell"
        class="size-10"
      />
    </div>
  </div>
</template>
