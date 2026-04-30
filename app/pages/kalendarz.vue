<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

useSeoMeta({
  title: 'Kalendarz wydarzeń — Slavia Ruda Śląska',
  description: 'Kalendarz zawodów i wydarzeń w klubie podnoszenia ciężarów CKS Slavia.'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()

const isAdmin = computed(() => auth.isLoggedIn.value && ['admin', 'superadmin'].includes(auth.user.value?.role || ''))

const { data: events, refresh, pending } = await useAsyncData('competitions', () => apiFetch('/api/competitions'))

// Event management state
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<string | null>(null)

const formState = reactive({
  title: '',
  date: '',
  location: '',
  description: ''
})

function openModal(event?: any) {
  if (event) {
    editingId.value = event.id
    formState.title = event.title
    formState.date = event.date.substring(0, 10) // Format dla input type="date"
    formState.location = event.location
    formState.description = event.description || ''
  } else {
    editingId.value = null
    formState.title = ''
    formState.date = ''
    formState.location = ''
    formState.description = ''
  }
  isModalOpen.value = true
}

async function saveEvent() {
  if (!formState.title || !formState.date || !formState.location) {
    toast.add({ title: 'Wypełnij wszystkie wymagane pola', color: 'error' })
    return
  }

  isSubmitting.value = true
  try {
    if (editingId.value) {
      await apiFetch(`/api/competitions/${editingId.value}`, {
        method: 'PATCH',
        body: formState
      })
      toast.add({ title: 'Wydarzenie zaktualizowane', color: 'success' })
    } else {
      await apiFetch('/api/competitions', {
        method: 'POST',
        body: formState
      })
      toast.add({ title: 'Wydarzenie dodane', color: 'success' })
    }
    isModalOpen.value = false
    await refresh()
  } catch (error) {
    toast.add({ title: 'Wystąpił błąd', description: String(error), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

async function deleteEvent(id: string) {
  if (!confirm('Czy na pewno chcesz usunąć to wydarzenie?')) return
  
  try {
    await apiFetch(`/api/competitions/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Wydarzenie usunięte', color: 'success' })
    await refresh()
  } catch (error) {
    toast.add({ title: 'Wystąpił błąd podczas usuwania', color: 'error' })
  }
}

// Sortowanie i grupowanie
const sortedEvents = computed(() => {
  if (!events.value || !Array.isArray(events.value)) return []
  return [...events.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

const upcomingEvents = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return sortedEvents.value.filter(e => new Date(e.date) >= now)
})

const pastEvents = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return sortedEvents.value.filter(e => new Date(e.date) < now).reverse()
})

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: pl })
  } catch (e) {
    return dateStr
  }
}
</script>

<template>
  <UContainer class="py-12">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-highlighted">Kalendarz Wydarzeń</h1>
        <p class="mt-2 text-muted">Zawody, zgrupowania i ważne daty w naszym klubie.</p>
      </div>
      <UButton v-if="isAdmin" icon="i-lucide-plus" color="primary" @click="openModal()">
        Dodaj wydarzenie
      </UButton>
    </div>

    <div v-if="pending" class="flex justify-center py-10">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-primary" />
    </div>

    <div v-else-if="!sortedEvents.length" class="text-center py-20 border border-dashed border-default rounded-xl bg-muted/5">
      <UIcon name="i-lucide-calendar-x" class="size-12 mx-auto text-muted/50 mb-4" />
      <h3 class="text-lg font-medium text-highlighted">Brak wydarzeń</h3>
      <p class="text-muted mt-1">Obecnie nie ma zaplanowanych żadnych wydarzeń.</p>
    </div>

    <div v-else class="space-y-16">
      <!-- Nadchodzące -->
      <section v-if="upcomingEvents.length > 0">
        <h2 class="text-xl font-semibold text-highlighted mb-6 flex items-center gap-2">
          <UIcon name="i-lucide-calendar-clock" class="size-5 text-primary" />
          Nadchodzące wydarzenia
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard v-for="event in upcomingEvents" :key="event.id" class="flex flex-col relative group overflow-hidden border-primary/20 bg-primary/5">
            <div class="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            
            <div class="flex-1">
              <div class="text-sm font-bold text-primary mb-2 flex items-center gap-1.5">
                <UIcon name="i-lucide-calendar" class="size-4" />
                {{ formatDate(event.date) }}
              </div>
              <h3 class="text-xl font-bold text-highlighted mb-2">{{ event.title }}</h3>
              <p class="text-muted text-sm mb-4 line-clamp-3">{{ event.description }}</p>
              
              <div class="flex items-center text-sm font-medium text-muted gap-1.5 mt-auto">
                <UIcon name="i-lucide-map-pin" class="size-4" />
                {{ event.location }}
              </div>
            </div>

            <!-- Admin controls -->
            <div v-if="isAdmin" class="mt-6 pt-4 border-t border-default flex items-center justify-end gap-2">
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-edit" @click="openModal(event)">Edytuj</UButton>
              <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="deleteEvent(event.id)">Usuń</UButton>
            </div>
          </UCard>
        </div>
      </section>

      <!-- Zakończone -->
      <section v-if="pastEvents.length > 0">
        <h2 class="text-xl font-semibold text-highlighted mb-6 flex items-center gap-2">
          <UIcon name="i-lucide-history" class="size-5 text-muted" />
          Zakończone wydarzenia
        </h2>
        <div class="space-y-4">
          <UCard v-for="event in pastEvents" :key="event.id" class="opacity-75 hover:opacity-100 transition-opacity">
            <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 class="text-lg font-bold text-highlighted">{{ event.title }}</h3>
                <div class="flex items-center text-sm text-muted gap-4 mt-1">
                  <span class="flex items-center gap-1"><UIcon name="i-lucide-calendar" class="size-3.5" /> {{ formatDate(event.date) }}</span>
                  <span class="flex items-center gap-1"><UIcon name="i-lucide-map-pin" class="size-3.5" /> {{ event.location }}</span>
                </div>
              </div>
              
              <div v-if="isAdmin" class="flex items-center gap-2">
                <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-edit" @click="openModal(event)">Edytuj</UButton>
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="deleteEvent(event.id)">Usuń</UButton>
              </div>
            </div>
          </UCard>
        </div>
      </section>
    </div>

    <!-- Event Modal -->
    <UModal v-model:open="isModalOpen" :title="editingId ? 'Edytuj wydarzenie' : 'Dodaj nowe wydarzenie'">
      <template #content>
        <div class="p-4 sm:p-6 space-y-4">
          <form
            class="space-y-4"
            @submit.prevent="saveEvent"
          >
            <UFormField
              label="Nazwa wydarzenia"
              required
            >
              <UInput
                v-model="formState.title"
                placeholder="Np. Mistrzostwa Śląska"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Data"
              required
            >
              <UInput
                v-model="formState.date"
                type="date"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Lokalizacja"
              required
            >
              <UInput
                v-model="formState.location"
                placeholder="Np. Piekary Śląskie"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Opis">
              <UTextarea
                v-model="formState.description"
                placeholder="Dodatkowe informacje..."
                :rows="4"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3 mt-6">
              <UButton
                color="neutral"
                variant="soft"
                @click="isModalOpen = false"
              >
                Anuluj
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="isSubmitting"
              >
                {{ editingId ? 'Zapisz zmiany' : 'Dodaj' }}
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
