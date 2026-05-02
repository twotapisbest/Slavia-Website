<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

const route = useRoute()
const apiFetch = useApi()

const postId = route.params.id as string

const { data: post, pending, error } = await useAsyncData(`post-${postId}`, () => apiFetch(`/api/posts/${postId}`) as Promise<any>)

if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

useSeoMeta({
  title: `${post.value?.title} — Slavia Ruda Śląska`,
  description: post.value?.content.substring(0, 160) + '...'
})

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: pl })
  } catch (e) {
    return dateStr
  }
}
</script>

<template>
  <article v-if="post" class="py-8 sm:py-12 lg:py-16">
    <UContainer class="max-w-3xl px-2 sm:px-0">
      <NuxtLink to="/blog" class="inline-flex items-center text-sm font-medium text-muted hover:text-primary mb-8 transition-colors">
        <UIcon name="i-lucide-arrow-left" class="size-4 mr-1" />
        Wróć do aktualności
      </NuxtLink>

      <header class="mb-10 text-center">
        <p class="text-sm font-medium text-primary mb-4 flex items-center justify-center gap-1.5">
          <UIcon name="i-lucide-calendar" class="size-4" />
          Opublikowano {{ formatDate(post.created_at) }}
        </p>
        <h1 class="text-3xl font-extrabold tracking-tight text-highlighted sm:text-4xl md:text-5xl">
          {{ post.title }}
        </h1>
      </header>

      <div class="w-full h-64 md:h-96 rounded-2xl bg-gradient-to-br from-primary/20 to-neutral-900 flex items-center justify-center mb-12 shadow-inner">
        <UIcon name="i-lucide-camera" class="size-16 text-primary/30" />
      </div>

      <div class="prose prose-invert prose-lg max-w-none text-muted leading-relaxed">
        <!-- Renderowanie treści na ten moment bez edytora WYSIWYG, więc po prostu p -->
        <p class="whitespace-pre-wrap">{{ post.content }}</p>
      </div>
    </UContainer>
  </article>
</template>
