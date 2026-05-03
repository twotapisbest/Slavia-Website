<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Superadmin — Zarządzanie kontami',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="max-sm:px-3 py-6 sm:py-8 md:py-14 lg:py-16">
    <header class="relative mb-8 overflow-hidden rounded-2xl border border-default/60 bg-linear-to-br from-card via-muted/10 to-transparent px-4 py-6 shadow-sm ring-1 ring-white/5 max-sm:rounded-[1.35rem] sm:mb-10 sm:rounded-[1.75rem] sm:px-6 sm:py-8 md:mb-12 md:px-10 md:py-10 dark:from-elevated dark:via-card/80">
      <div class="pointer-events-none absolute right-0 top-0 size-40 translate-x-1/4 -translate-y-1/4 rounded-full bg-red-500/10 blur-3xl" />
      <div class="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div class="min-w-0 max-w-3xl space-y-3">
          <div class="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
            <UIcon
              name="i-lucide-shield-alert"
              class="size-3.5"
            />
            SuperAdministracja
          </div>
          <h1 class="text-2xl font-black tracking-tight text-highlighted sm:text-3xl md:text-4xl">
            Zarządzanie kontami
          </h1>
          <p class="max-w-2xl text-[15px] leading-relaxed text-muted md:text-base">
            Jedna lista kont systemowych z filtrami ról i wyszukiwarką. Tworzenie kont, zmiana ról i usuwanie kont są dostępne wyłącznie dla superadministratora. Zwykły administrator nie ma dostępu z API ani z UI do kont mających rolę SuperAdmin (nie są mu listowane); pozostałym kontom może zmieniać wyłącznie login, e-mail i hasło.
          </p>
        </div>
      </div>
    </header>

    <ClubAdminsManager />
  </UContainer>
</template>
