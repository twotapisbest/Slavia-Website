<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

useSeoMeta({
  title: 'Blog klubowy — Slavia Ruda Śląska',
  description: 'Aktualności, relacje z zawodów i nowości z życia klubu CKS Slavia.'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()

const isAdmin = computed(() => auth.isLoggedIn.value && ['admin', 'superadmin'].includes(auth.user.value?.role || ''))

const { data: posts, refresh, pending } = await useAsyncData('posts', () => apiFetch('/api/posts') as Promise<any[]>)

const isModalOpen = ref(false)
const isSubmitting = ref(false)
const formState = reactive({
  title: '',
  content: ''
})

function openModal() {
  formState.title = ''
  formState.content = ''
  isModalOpen.value = true
}

async function savePost() {
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
  } catch (error) {
    toast.add({ title: 'Wystąpił błąd', description: String(error), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

async function deletePost(id: string) {
  if (!confirm('Czy na pewno usunąć ten wpis?')) return
  
  try {
    await apiFetch(`/api/posts/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Wpis usunięty', color: 'success' })
    await refresh()
  } catch (error) {
    toast.add({ title: 'Błąd usuwania', color: 'error' })
  }
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'dd MMMM yyyy, HH:mm', { locale: pl })
  } catch (e) {
    return dateStr
  }
}
</script>

<template>
  <UContainer class="py-12">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-highlighted">Aktualności</h1>
        <p class="mt-2 text-muted">Najnowsze informacje i relacje z zawodów naszego klubu.</p>
      </div>
      <UButton v-if="isAdmin" icon="i-lucide-pen-tool" color="primary" @click="openModal">
        Dodaj wpis
      </UButton>
    </div>

    <div v-if="pending" class="flex justify-center py-10">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-primary" />
    </div>

    <div v-else-if="!posts || posts.length === 0" class="text-center py-20 border border-dashed border-default rounded-xl bg-muted/5">
      <UIcon name="i-lucide-newspaper" class="size-12 mx-auto text-muted/50 mb-4" />
      <h3 class="text-lg font-medium text-highlighted">Brak wpisów</h3>
      <p class="text-muted mt-1">Zaglądaj tu wkrótce po nowości ze świata ciężarów.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <UCard v-for="post in posts" :key="post.id" class="flex flex-col group overflow-hidden border-transparent hover:border-primary/50 transition-colors">
        <!-- Zamiast zdjęcia dajemy ładny gradient placeholder -->
        <div class="h-48 -mx-4 -mt-4 mb-4 bg-gradient-to-br from-primary/20 to-neutral-800 flex items-center justify-center relative overflow-hidden">
          <UIcon name="i-lucide-image" class="size-12 text-primary/20 absolute rotate-12 scale-150" />
        </div>
        
        <div class="flex-1 flex flex-col">
          <p class="text-xs font-medium text-primary mb-2 flex items-center gap-1.5">
            <UIcon name="i-lucide-calendar" class="size-3.5" />
            {{ formatDate(post.created_at) }}
          </p>
          <h3 class="text-xl font-bold text-highlighted mb-3 line-clamp-2">{{ post.title }}</h3>
          <p class="text-muted text-sm line-clamp-3 mb-4">{{ post.content }}</p>
          
          <div class="mt-auto pt-4 flex items-center justify-between border-t border-default">
            <UButton :to="`/blog/${post.id}`" variant="link" color="primary" trailing-icon="i-lucide-arrow-right" class="px-0">
              Czytaj więcej
            </UButton>
            
            <UButton v-if="isAdmin" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="deletePost(post.id)">
              Usuń
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Modal do dodawania -->
    <UModal v-model="isModalOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-highlighted">Nowy wpis</h3>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="-my-1" @click="isModalOpen = false" />
          </div>
        </template>
        
        <form @submit.prevent="savePost" class="space-y-4">
          <UFormField label="Tytuł" required>
            <UInput v-model="formState.title" placeholder="Wpisz chwytliwy tytuł..." />
          </UFormField>
          
          <UFormField label="Treść" required>
            <UTextarea v-model="formState.content" placeholder="O czym chcesz napisać?" :rows="8" />
          </UFormField>
          
          <div class="flex justify-end gap-3 mt-6">
            <UButton color="neutral" variant="soft" @click="isModalOpen = false">Anuluj</UButton>
            <UButton type="submit" color="primary" :loading="isSubmitting">Opublikuj</UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </UContainer>
</template>
