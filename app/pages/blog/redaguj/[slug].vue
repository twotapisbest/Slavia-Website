<script setup lang="ts">
import { BLOG_POST_UUID_RE, blogPostPath, parseBlogPostId, slugify } from '~/utils/slug'

definePageMeta({ middleware: 'admin' })

const route = useRoute()
const apiFetch = useApi()

/** Musi być reaktywne — ten sam plik `[slug].vue` przy zmianie parametru bez pełnego unmount. */
const postId = computed(() => parseBlogPostId(String(route.params.slug ?? '').trim()))

interface BlogPost {
  id: string
  title: string
  content: string
  image_url?: string
  created_at: string
  published: boolean
}

async function fetchPostForEdit(): Promise<BlogPost> {
  const id = String(postId.value ?? '').trim()
  if (!BLOG_POST_UUID_RE.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Wpis nie znaleziony', fatal: true })
  }
  const enc = encodeURIComponent(id)
  try {
    return await apiFetch<BlogPost>(`/api/posts/manage/${enc}`)
  } catch {
    /* Szkic jest tylko pod /manage; dla opublikowanych przy problemie z uprawnieniami/tokenem spróbuj API publicznego. */
    return await apiFetch<BlogPost>(`/api/posts/${enc}`)
  }
}

const { data: post, error } = await useAsyncData(
  'blog-edit-post',
  fetchPostForEdit,
  { watch: [postId] }
)

if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Wpis nie znaleziony', fatal: true })
}

watch(
  () => post.value?.title,
  title => {
    if (title) {
      useSeoMeta({
        title: `Edycja: ${title} — Blog`,
        robots: 'noindex, nofollow'
      })
    }
  },
  { immediate: true }
)

const toast = useToast()

async function goPost() {
  const p = post.value
  if (!p) {
    return
  }
  if (!p.published) {
    toast.add({
      title: 'Ten wpis jest szkicem',
      description: 'Opublikuj go z poziomu edycji lub podglądu, aby zobaczyć stronę publiczną.',
      color: 'warning'
    })
    return
  }
  await navigateTo(blogPostPath(slugify(p.title) || 'wpis', p.id))
}

function goBlog() {
  navigateTo('/blog')
}

async function onFormSuccess(e: { published: boolean; postId: string; title: string }) {
  const slug = slugify(e.title) || 'wpis'
  if (e.published) {
    await navigateTo(blogPostPath(slug, e.postId))
  } else {
    await navigateTo('/blog')
  }
}
</script>

<template>
  <UContainer
    v-if="post"
    class="animate-page-in py-8 sm:py-12 lg:py-14"
  >
    <div class="mx-auto max-w-3xl">
      <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-primary">
            Edycja wpisu
          </p>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
            {{ post.title }}
          </h1>
          <p class="mt-2 text-sm text-muted">
            Zmiany są sanityzowane (DOMPurify) tak jak przy tworzeniu wpisu.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="outline"
            color="neutral"
            icon="i-lucide-external-link"
            @click="goPost"
          >
            Podgląd publikacji
          </UButton>
          <UButton
            variant="soft"
            color="neutral"
            icon="i-lucide-arrow-left"
            @click="goBlog"
          >
            Lista wpisów
          </UButton>
        </div>
      </div>

      <ClientOnly>
        <ClubBlogPostForm
          mode="edit"
          :post-id="post.id"
          :initial-title="post.title"
          :initial-content="post.content"
          :initial-image-url="post.image_url || ''"
          :initial-published="post.published"
          editor-min-height="min(78vh, 640px)"
          @success="onFormSuccess"
          @cancel="goBlog"
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
