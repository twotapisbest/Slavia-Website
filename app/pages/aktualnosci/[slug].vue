<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { isProbablyRichHtml, stripHtmlTags } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'
import { parseBlogPostId } from '~/utils/slug'

const route = useRoute()
const apiFetch = useApi()
const auth = useAuth()

const rawSlug = String(route.params.slug || '')
const postId = parseBlogPostId(rawSlug)

interface BlogPost {
  title: string
  content: string
  created_at: string
  image_url?: string
}

const isAdmin = computed(() => auth.isAdmin.value || auth.isSuperAdmin.value)

const { data: post, error } = await useAsyncData(`aktualnosci-post-${postId}`, () => {
  const endpoint = isAdmin.value ? `/api/posts/manage/${encodeURIComponent(String(postId))}` : `/api/posts/${encodeURIComponent(String(postId))}`
  return apiFetch<BlogPost>(endpoint)
})

if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const plainExcerpt = stripHtmlTags(sanitizeRichHtml(post.value?.content ?? '')).slice(0, 168)

const sanitizedPostContent = computed(() => sanitizeRichHtml(post.value?.content ?? ''))

useSeoMeta({
  title: `${post.value?.title} — Slavia Ruda Śląska`,
  description: plainExcerpt ? `${plainExcerpt}…` : post.value?.title,
  ogImage: post.value?.image_url || '/logo.png'
})

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: pl })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return dateStr
  }
}
</script>

<template>
  <article
    v-if="post"
    class="animate-page-in py-8 sm:py-12 lg:py-16"
  >
    <UContainer class="max-w-3xl px-2 sm:px-0">
      <NuxtLink
        to="/aktualnosci"
        class="mb-8 inline-flex items-center text-sm font-medium text-muted transition-colors hover:text-primary"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="mr-1 size-4"
        />
        Wróć do aktualności
      </NuxtLink>

      <header class="mb-10 text-center">
        <p class="mb-4 flex items-center justify-center gap-1.5 text-sm font-medium text-primary">
          <UIcon
            name="i-lucide-calendar"
            class="size-4"
          />
          Opublikowano {{ formatDate(post.created_at) }}
        </p>
        <h1 class="text-3xl font-extrabold tracking-tight text-highlighted sm:text-4xl md:text-5xl">
          {{ post.title }}
        </h1>
      </header>

      <div class="mb-12 w-full overflow-hidden rounded-2xl shadow-inner ring-1 ring-default/40">
        <img
          v-if="post.image_url"
          :src="post.image_url"
          :alt="`Zdjęcie wpisu ${post.title}`"
          class="h-64 w-full object-cover md:h-96"
        >
        <div
          v-else
          class="flex h-64 items-center justify-center rounded-2xl bg-linear-to-br from-primary/15 via-muted/30 to-neutral-900/80 md:h-96 dark:from-primary/25 dark:to-neutral-950"
        >
          <UIcon
            name="i-lucide-camera"
            class="size-16 text-primary/35"
          />
        </div>
      </div>

      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="isProbablyRichHtml(post.content)" class="slavia-rich-content prose prose-lg prose-neutral max-w-none leading-relaxed dark:prose-invert" v-html="sanitizedPostContent" />
      <div
        v-else
        class="prose prose-neutral max-w-none text-muted dark:prose-invert prose-lg leading-relaxed"
      >
        <p class="whitespace-pre-wrap">
          {{ post.content }}
        </p>
      </div>
    </UContainer>
  </article>
</template>
