<script setup lang="ts">
import { blogEditPath, blogPostPath, slugify } from '~/utils/slug'

definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Nowy wpis — Aktualności Slavia',
  robots: 'noindex, nofollow'
})

function goList() {
  navigateTo('/aktualnosci')
}

async function onFormSuccess(e: { published: boolean; postId: string; title: string }) {
  const slug = slugify(e.title) || 'wpis'
  if (e.published) {
    await navigateTo(blogPostPath(slug, e.postId))
  } else {
    await navigateTo(blogEditPath(slug, e.postId))
  }
}
</script>

<template>
  <UContainer class="animate-page-in py-8 sm:py-12 lg:py-14">
    <div class="mx-auto max-w-3xl">
      <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-primary">
            Aktualności klubu
          </p>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
            Nowy wpis
          </h1>
          <p class="mt-2 text-sm text-muted">
            Pełnoekranowy edytor — więcej miejsca na treść i podgląd formatowania.
          </p>
        </div>
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-arrow-left"
          @click="goList"
        >
          Wróć do listy
        </UButton>
      </div>

      <ClientOnly>
        <ClubBlogPostForm
          mode="create"
          editor-min-height="min(78vh, 640px)"
          @success="onFormSuccess"
          @cancel="goList"
        />
        <template #fallback>
          <div class="rounded-xl border border-default p-10 text-center text-muted">
            Ładowanie edytora…
          </div>
        </template>
      </ClientOnly>
    </div>
  </UContainer>
</template>
