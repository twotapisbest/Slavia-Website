<script setup lang="ts">
definePageMeta({
  middleware: 'diary-redirect'
})

useSeoMeta({
  title: 'Dziennik — Slavia',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="flex min-h-[40vh] items-center justify-center py-16 text-muted">
    <div class="flex items-center gap-2 text-sm">
      <UIcon
        name="i-lucide-loader-2"
        class="size-5 animate-spin"
      />
      Przekierowanie do dziennika…
    </div>
  </UContainer>
</template>
