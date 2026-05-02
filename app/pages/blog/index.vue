<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

useSeoMeta({
  title: 'Blog klubowy — Slavia Ruda Śląska',
  description: 'Aktualności, relacje z zawodów i nowości z życia klubu CKS Slavia.',
  ogTitle: 'Blog CKS Slavia',
  ogDescription: 'Aktualności klubowe, relacje z zawodów i życie drużyny Slavia.',
  twitterCard: 'summary_large_image'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()

const isAdmin = computed(() => auth.isAdmin.value || auth.isSuperAdmin.value)

interface BlogPost {
  id: string
  title: string
  content: string
  image_url?: string
  created_at: string
}

const { data: posts, refresh, pending } = await useAsyncData('posts', () => apiFetch<BlogPost[]>('/api/posts'))

const isModalOpen = ref(false)
const isSubmitting = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const formState = reactive({
  title: '',
  content: '',
  image_url: ''
})

const uploadLoading = ref(false)

function openModal() {
  if (!isAdmin.value) return

  formState.title = ''
  formState.content = ''
  formState.image_url = ''
  isModalOpen.value = true
}

async function onFileChange(e: Event) {
  if (!isAdmin.value) {
    toast.add({ title: 'Brak uprawnień', color: 'error' })
    return
  }

  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0] as File | undefined
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  uploadLoading.value = true
  try {
    const res = await apiFetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData
    })
    formState.image_url = res.url
    toast.add({ title: 'Zdjęcie przesłane', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Błąd uploadu', description: String(err), color: 'error' })
  } finally {
    uploadLoading.value = false
  }
}

async function savePost() {
  if (!isAdmin.value) {
    toast.add({ title: 'Brak uprawnień', color: 'error' })
    return
  }

  if (!formState.title || !formState.content) {
    toast.add({ title: 'Wypełnij wszystkie pola', color: 'error' })
    return
  }

  isSubmitting.value = true
  try {
    await apiFetch('/api/posts', {
      method: 'POST',
      body: formState
    })
    toast.add({ title: 'Wpis dodany', color: 'success' })
    isModalOpen.value = false
    await refresh()
  } catch (_error) {
    toast.add({ title: 'Wystąpił błąd', description: String(_error), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

async function deletePost(id: string) {
  if (!isAdmin.value) {
    toast.add({ title: 'Brak uprawnień', color: 'error' })
    return
  }

  if (!confirm('Czy na pewno usunąć ten wpis?')) return

  try {
    await apiFetch(`/api/posts/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Wpis usunięty', color: 'success' })
    await refresh()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    toast.add({ title: 'Błąd usuwania', color: 'error' })
  }
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'dd MMMM yyyy, HH:mm', { locale: pl })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return dateStr
  }
}
</script>

<template>
  <UContainer class="py-8 sm:py-12 lg:py-14">
    <div class="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl lg:text-4xl">
          Aktualności
        </h1>
        <p class="mt-2 text-sm text-muted sm:text-base lg:text-lg lg:leading-relaxed">
          Najnowsze informacje i relacje z zawodów naszego klubu.
        </p>
      </div>
      <UButton
        v-if="isAdmin"
        icon="i-lucide-pen-tool"
        color="primary"
        class="min-h-11 w-full shrink-0 justify-center md:w-auto"
        @click="openModal"
      >
        Dodaj wpis
      </UButton>
    </div>

    <div
      v-if="pending"
      class="flex justify-center py-10"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin size-8 text-primary"
      />
    </div>

    <div
      v-else-if="!posts || posts.length === 0"
      class="text-center py-20 border border-dashed border-default rounded-xl bg-muted/5"
    >
      <UIcon
        name="i-lucide-newspaper"
        class="size-12 mx-auto text-muted/50 mb-4"
      />
      <h3 class="text-lg font-medium text-highlighted">
        Brak wpisów
      </h3>
      <p class="text-muted mt-1">
        Zaglądaj tu wkrótce po nowości ze świata ciężarów.
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-10"
    >
      <UCard
        v-for="post in posts"
        :key="post.id"
        class="group flex flex-col overflow-hidden border-transparent transition-colors hover:border-primary/50"
      >
        <!-- Zdjęcie wpisu -->
        <div class="relative mb-4 flex h-44 items-center justify-center overflow-hidden rounded-lg bg-neutral-800 sm:h-48">
          <img
            v-if="post.image_url"
            :src="post.image_url"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          >
          <div
            v-else
            class="w-full h-full bg-linear-to-br from-primary/20 to-neutral-900 flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-newspaper"
              class="size-16 text-primary/10"
            />
          </div>
        </div>

        <div class="flex-1 flex flex-col">
          <p class="text-xs font-medium text-primary mb-2 flex items-center gap-1.5">
            <UIcon
              name="i-lucide-calendar"
              class="size-3.5"
            />
            {{ formatDate(post.created_at) }}
          </p>
          <h3 class="text-xl font-bold text-highlighted mb-3 line-clamp-2">
            {{ post.title }}
          </h3>
          <p class="text-muted text-sm line-clamp-3 mb-4">
            {{ post.content }}
          </p>

          <div class="mt-auto flex flex-col gap-3 border-t border-default pt-4 sm:flex-row sm:items-center sm:justify-between">
            <UButton
              :to="`/blog/${post.id}`"
              variant="link"
              color="primary"
              trailing-icon="i-lucide-arrow-right"
              class="min-h-10 justify-start px-0"
            >
              Czytaj więcej
            </UButton>

            <UButton
              v-if="isAdmin"
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              class="min-h-10 self-start sm:self-auto"
              @click="deletePost(post.id)"
            >
              Usuń
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Modal do dodawania -->
    <UModal
      v-model:open="isModalOpen"
      title="Nowy wpis"
    >
      <template #content>
        <div class="slavia-form-modal">
          <form
            class="slavia-form-stack"
            @submit.prevent="savePost"
          >
            <div class="slavia-form-panel">
              <div class="slavia-form-panel__header">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon">
                    <UIcon
                      name="i-lucide-file-text"
                      class="size-4"
                    />
                  </span>
                  Treść wpisu
                </div>
              </div>
              <div class="slavia-form-panel__body">
                <UFormField
                  label="Tytuł"
                  required
                >
                  <UInput
                    v-model="formState.title"
                    placeholder="Wpisz chwytliwy tytuł..."
                    size="lg"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Zdjęcie (URL lub upload)">
                  <div class="flex flex-wrap items-center gap-2">
                    <UInput
                      v-model="formState.image_url"
                      placeholder="https://..."
                      size="lg"
                      class="min-w-0 flex-1"
                    />
                    <UButton
                      icon="i-lucide-upload"
                      color="neutral"
                      variant="soft"
                      size="lg"
                      :loading="uploadLoading"
                      @click="$refs.fileInput.click()"
                    />
                    <input
                      ref="fileInput"
                      type="file"
                      hidden
                      accept="image/*"
                      @change="onFileChange"
                    >
                  </div>
                </UFormField>
                <UFormField
                  label="Treść"
                  required
                >
                  <UTextarea
                    v-model="formState.content"
                    placeholder="O czym chcesz napisać?"
                    :rows="8"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>
            <div class="slavia-form-actions border-t border-default/60 pt-4">
              <UButton
                color="neutral"
                variant="soft"
                size="lg"
                @click="isModalOpen = false"
              >
                Anuluj
              </UButton>
              <UButton
                type="submit"
                color="primary"
                size="lg"
                :loading="isSubmitting"
              >
                Opublikuj
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
