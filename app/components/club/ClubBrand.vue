<template>
  <NuxtLink
    to="/"
    class="flex shrink-0 items-center gap-2.5 rounded-lg outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary"
  >
    <span
      class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary"
      aria-hidden="true"
    >
      <UIcon
        name="i-lucide-dumbbell"
        class="size-5"
      />
    </span>
    <span class="leading-tight">
      <span class="block font-bold tracking-tight text-highlighted">Slavia</span>
      <span class="block text-[11px] font-medium text-muted uppercase tracking-widest">Ruda Śląska</span>
    </span>
  </NuxtLink>
</template>
