<script setup lang="ts">
import type { Athlete, TrainingLogEntry } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'trainer' })

const route = useRoute()
const apiFetch = useApi()
const toast = useToast()

const athleteId = computed(() => String(route.params.athleteId || ''))

useSeoMeta({
  title: 'Dziennik treningów — trener',
  robots: 'noindex, nofollow'
})

const { data: athletes } = await useAsyncData(
  'trainer-diary-detail-athletes',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes').catch(() => [])
    }
  }
)

const athleteName = computed(() => {
  const a = (athletes.value || []).find(x => x.id === athleteId.value)
  return a?.full_name ?? 'Zawodnik'
})

const entries = ref<TrainingLogEntry[]>([])
const loading = ref(true)

async function loadEntries () {
  if (!athleteId.value) {
    return
  }
  loading.value = true
  try {
    entries.value = await apiFetch<TrainingLogEntry[]>(`/api/athletes/${athleteId.value}/training-log`)
  } catch (e) {
    entries.value = []
    toast.add({
      title: 'Nie udało się wczytać dziennika',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch(athleteId, () => loadEntries(), { immediate: true })

const newForm = reactive({
  session_date: new Date().toISOString().slice(0, 10),
  title: '',
  notes: ''
})
const adding = ref(false)

async function addEntry () {
  const notes = newForm.notes.trim()
  if (!notes) {
    toast.add({ title: 'Uzupełnij treść wpisu', color: 'warning' })
    return
  }
  adding.value = true
  try {
    await apiFetch(`/api/athletes/${athleteId.value}/training-log`, {
      method: 'POST',
      body: {
        session_date: newForm.session_date,
        title: newForm.title.trim() || undefined,
        notes
      }
    })
    toast.add({ title: 'Dodano wpis', color: 'success' })
    newForm.notes = ''
    newForm.title = ''
    await loadEntries()
  } catch (e) {
    toast.add({
      title: 'Nie udało się dodać wpisu',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    adding.value = false
  }
}

const editOpen = ref(false)
const editEntry = ref<TrainingLogEntry | null>(null)
const editForm = reactive({
  session_date: '',
  title: '',
  notes: ''
})
const savingEdit = ref(false)

function openEdit (e: TrainingLogEntry) {
  editEntry.value = e
  editForm.session_date = e.session_date.slice(0, 10)
  editForm.title = e.title || ''
  editForm.notes = e.notes
  editOpen.value = true
}

async function saveEdit () {
  if (!editEntry.value) {
    return
  }
  const notes = editForm.notes.trim()
  if (!notes) {
    toast.add({ title: 'Treść nie może być pusta', color: 'warning' })
    return
  }
  savingEdit.value = true
  try {
    await apiFetch(`/api/athletes/${athleteId.value}/training-log/${editEntry.value.id}`, {
      method: 'PATCH',
      body: {
        session_date: editForm.session_date,
        title: editForm.title.trim(),
        notes
      }
    })
    toast.add({ title: 'Zapisano', color: 'success' })
    editOpen.value = false
    await loadEntries()
  } catch (e) {
    toast.add({
      title: 'Błąd zapisu',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    savingEdit.value = false
  }
}

async function removeEntry (e: TrainingLogEntry) {
  if (!confirm(`Usunąć wpis z dnia ${e.session_date.slice(0, 10)}?`)) {
    return
  }
  try {
    await apiFetch(`/api/athletes/${athleteId.value}/training-log/${e.id}`, { method: 'DELETE' })
    toast.add({ title: 'Usunięto', color: 'success' })
    await loadEntries()
  } catch (err) {
    toast.add({
      title: 'Nie udało się usunąć',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  }
}
</script>

<template>
  <UContainer class="py-10 md:py-14 animate-page-in">
    <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-primary">
          Dziennik treningów
        </p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
          {{ athleteName }}
        </h1>
        <p class="mt-2 text-sm text-muted">
          Zawodnik widzi te wpisy u siebie i może dopisywać własne jednostki.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton to="/trainer/dziennik" variant="soft" color="neutral" icon="i-lucide-users">
          Inny zawodnik
        </UButton>
        <UButton to="/trainer" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
          Panel trenera
        </UButton>
      </div>
    </div>

    <UCard class="mb-10 overflow-hidden">
      <div class="border-b border-default bg-muted/15 px-4 py-3 sm:px-6">
        <h2 class="text-lg font-semibold text-highlighted">
          Nowy wpis
        </h2>
      </div>
      <div class="space-y-4 p-4 sm:p-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Data jednostki" required>
            <UInput v-model="newForm.session_date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Temat (opcjonalnie)">
            <UInput v-model="newForm.title" placeholder="np. Technika rwania" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Treść / obciążenia / uwagi" required>
          <UTextarea v-model="newForm.notes" :rows="5" autoresize placeholder="Opisz przebieg treningu…" class="w-full" />
        </UFormField>
        <UButton :loading="adding" icon="i-lucide-plus" @click="addEntry">
          Dodaj wpis
        </UButton>
      </div>
    </UCard>

    <h2 class="mb-4 text-xl font-bold text-highlighted">
      Historia wpisów
    </h2>

    <div v-if="loading" class="flex items-center gap-2 py-12 text-muted">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" />
      Wczytywanie…
    </div>

    <div v-else-if="entries.length === 0" class="rounded-xl border border-dashed border-default py-14 text-center text-muted">
      Brak wpisów — dodaj pierwszą jednostkę powyżej.
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="e in entries" :key="e.id" class="overflow-hidden">
        <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div class="min-w-0 flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge color="primary" variant="subtle">
                {{ e.session_date.slice(0, 10) }}
              </UBadge>
              <span v-if="e.title" class="font-semibold text-highlighted">{{ e.title }}</span>
            </div>
            <p class="text-sm text-highlighted whitespace-pre-wrap leading-relaxed">
              {{ e.notes }}
            </p>
            <p class="text-[11px] text-muted">
              <span v-if="e.author_username">Dodał: {{ e.author_username }}</span>
              <span v-if="e.created_at"> · {{ e.created_at.slice(0, 16).replace('T', ' ') }}</span>
            </p>
          </div>
          <div class="flex shrink-0 gap-1 sm:flex-col">
            <UButton size="xs" variant="soft" icon="i-lucide-pencil" @click="openEdit(e)">
              Edytuj
            </UButton>
            <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="removeEntry(e)">
              Usuń
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <UModal v-model:open="editOpen" title="Edytuj wpis" :ui="{ overlay: 'z-[190]', content: 'z-[200]' }">
      <template #content>
        <div class="space-y-4 p-4 sm:p-6">
          <UFormField label="Data">
            <UInput v-model="editForm.session_date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Temat">
            <UInput v-model="editForm.title" class="w-full" />
          </UFormField>
          <UFormField label="Treść" required>
            <UTextarea v-model="editForm.notes" :rows="6" autoresize class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="outline" @click="editOpen = false">
              Anuluj
            </UButton>
            <UButton :loading="savingEdit" @click="saveEdit">
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
