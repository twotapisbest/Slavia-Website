<script setup lang="ts">
import type { Athlete, CompetitionResult } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Starty zawodników — Slavia',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()
const toast = useToast()

const { data: rawResults, pending, refresh } = await useAsyncData(
  'staff-results-all',
  () => apiFetch<CompetitionResult[]>('/api/results/all').catch(() => [] as CompetitionResult[])
)

const { data: athletes } = await useAsyncData(
  'staff-athletes-wyniki',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes').catch(() => [])
    }
  }
)

const athleteSelectOptions = computed(() => {
  const list = (athletes.value || []) as Athlete[]
  return [...list]
    .filter(a => a.is_active !== false)
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'pl'))
})

const nameById = computed(() => {
  const m = new Map<string, string>()
  for (const a of athletes.value || []) {
    m.set(a.id, a.full_name)
  }
  return m
})

const rows = computed(() => {
  const list = rawResults.value || []
  return [...list].sort((a, b) => b.date.localeCompare(a.date))
})

const modalOpen = ref(false)
const editing = ref<CompetitionResult | null>(null)
const form = reactive({
  snatch: 0,
  clean_and_jerk: 0,
  total: 0,
  date: '',
  status: 'Approved' as 'Pending' | 'Approved'
})
const saving = ref(false)

const addModalOpen = ref(false)
const savingAdd = ref(false)
const formAdd = reactive({
  athlete_id: '',
  snatch: 0,
  clean_and_jerk: 0,
  total: 0,
  date: ''
})

function defaultDateStr() {
  return new Date().toISOString().slice(0, 10)
}

function openAddModal() {
  formAdd.athlete_id = athleteSelectOptions.value[0]?.id ?? ''
  formAdd.snatch = 0
  formAdd.clean_and_jerk = 0
  formAdd.total = 0
  formAdd.date = defaultDateStr()
  addModalOpen.value = true
}

async function submitAdd() {
  if (!formAdd.athlete_id) {
    toast.add({ title: 'Wybierz zawodnika', color: 'warning' })
    return
  }
  if (formAdd.snatch <= 0 || formAdd.clean_and_jerk <= 0) {
    toast.add({ title: 'Podaj dodatnie ciężary (rwanie i podrzut)', color: 'warning' })
    return
  }
  savingAdd.value = true
  try {
    await apiFetch<CompetitionResult>('/api/results', {
      method: 'POST',
      body: {
        athlete_id: formAdd.athlete_id,
        snatch: formAdd.snatch,
        clean_and_jerk: formAdd.clean_and_jerk,
        total: formAdd.snatch + formAdd.clean_and_jerk,
        date: formAdd.date
      }
    })
    toast.add({
      title: 'Start zapisany',
      description: 'Wpis kadry jest od razu zatwierdzany — bez kolejki oczekujących.',
      color: 'success'
    })
    addModalOpen.value = false
    await refresh()
  } catch (e) {
    toast.add({
      title: 'Nie udało się dodać startu',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    savingAdd.value = false
  }
}

function openEdit(r: CompetitionResult) {
  editing.value = r
  form.snatch = r.snatch
  form.clean_and_jerk = r.clean_and_jerk
  form.total = r.total
  form.date = r.date.slice(0, 10)
  form.status = r.status
  modalOpen.value = true
}

async function saveEdit() {
  if (!editing.value) {
    return
  }
  saving.value = true
  try {
    await apiFetch(`/api/results/${editing.value.id}`, {
      method: 'PATCH',
      body: {
        snatch: form.snatch,
        clean_and_jerk: form.clean_and_jerk,
        total: form.snatch + form.clean_and_jerk,
        date: form.date,
        status: form.status
      }
    })
    toast.add({ title: 'Zapisano start', color: 'success' })
    modalOpen.value = false
    await refresh()
  } catch (e) {
    toast.add({
      title: 'Błąd zapisu',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function removeRow(r: CompetitionResult) {
  if (!confirm(`Usunąć start z dnia ${r.date}?`)) {
    return
  }
  try {
    await apiFetch(`/api/results/${r.id}`, { method: 'DELETE' })
    toast.add({ title: 'Usunięto', color: 'success' })
    await refresh()
  } catch (e) {
    toast.add({
      title: 'Nie udało się usunąć',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

watch([() => form.snatch, () => form.clean_and_jerk], () => {
  form.total = form.snatch + form.clean_and_jerk
})

watch([() => formAdd.snatch, () => formAdd.clean_and_jerk], () => {
  formAdd.total = formAdd.snatch + formAdd.clean_and_jerk
})
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16 animate-page-in">
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-primary">
          Kadra
        </p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
          Wszystkie starty zawodników
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          Pełna lista zgłoszeń (oczekujących i zatwierdzonych). Jako kadra możesz
          <strong class="text-highlighted">dodać start od razu jako zatwierdzony</strong>
          — bez kolejki akceptacji. Edycja i usuwanie jak dotąd.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-plus-circle"
          @click="openAddModal"
        >
          Dodaj start (zatwierdzony)
        </UButton>
        <UButton
          icon="i-lucide-refresh-ccw"
          variant="soft"
          :loading="pending"
          @click="refresh()"
        >
          Odśwież
        </UButton>
      </div>
    </div>

    <UCard :ui="{ body: 'p-0 overflow-x-auto' }">
      <table class="w-full min-w-[760px] text-sm">
        <thead class="border-b border-default bg-muted/30">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-muted">
              Data
            </th>
            <th class="px-4 py-3 text-left font-semibold text-muted">
              Zawodnik
            </th>
            <th class="px-4 py-3 text-right font-semibold text-muted">
              Rwanie
            </th>
            <th class="px-4 py-3 text-right font-semibold text-muted">
              Podrzut
            </th>
            <th class="px-4 py-3 text-right font-semibold text-muted">
              Razem
            </th>
            <th class="px-4 py-3 text-left font-semibold text-muted">
              Status
            </th>
            <th class="px-4 py-3 text-right font-semibold text-muted">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-if="pending">
            <td
              colspan="7"
              class="px-4 py-10 text-center text-muted"
            >
              <UIcon
                name="i-lucide-loader-2"
                class="inline size-6 animate-spin"
              />
            </td>
          </tr>
          <tr v-else-if="rows.length === 0">
            <td
              colspan="7"
              class="px-4 py-10 text-center text-muted"
            >
              Brak zapisanych startów.
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="r in rows"
              :key="r.id"
              class="hover:bg-muted/15 transition-colors"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                {{ r.date.slice(0, 10) }}
              </td>
              <td class="px-4 py-3">
                {{ nameById.get(r.athlete_id) || r.athlete_id }}
              </td>
              <td class="px-4 py-3 text-right tabular-nums">
                {{ r.snatch }}
              </td>
              <td class="px-4 py-3 text-right tabular-nums">
                {{ r.clean_and_jerk }}
              </td>
              <td class="px-4 py-3 text-right font-semibold tabular-nums">
                {{ r.total }}
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="r.status === 'Approved' ? 'success' : 'warning'"
                  variant="subtle"
                >
                  {{ r.status === 'Approved' ? 'Zatwierdzony' : 'Oczekuje' }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <UButton
                    size="xs"
                    variant="soft"
                    icon="i-lucide-pencil"
                    @click="openEdit(r)"
                  />
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    @click="removeRow(r)"
                  />
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </UCard>

    <UModal
      v-model:open="modalOpen"
      title="Edytuj start"
      :ui="{ overlay: 'z-[190]', content: 'z-[200]' }"
    >
      <template #content>
        <div class="slavia-form-modal">
          <div class="slavia-form-panel">
            <div class="slavia-form-panel__header">
              <div class="slavia-form-panel__title">
                <span class="slavia-form-panel__icon">
                  <UIcon
                    name="i-lucide-pencil"
                    class="size-4"
                  />
                </span>
                Wynik startu
              </div>
            </div>
            <div class="slavia-form-panel__body">
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Rwanie (kg)">
                  <UInput
                    v-model.number="form.snatch"
                    type="number"
                    step="0.5"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
                <UFormField label="Podrzut (kg)">
                  <UInput
                    v-model.number="form.clean_and_jerk"
                    type="number"
                    step="0.5"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
              </div>
              <UFormField label="Data">
                <UInput
                  v-model="form.date"
                  type="date"
                  size="lg"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Status">
                <select
                  v-model="form.status"
                  class="slavia-select w-full py-3 text-[15px]"
                >
                  <option value="Pending">
                    Oczekuje na akceptację
                  </option>
                  <option value="Approved">
                    Zatwierdzony
                  </option>
                </select>
              </UFormField>
              <p class="text-xs text-muted">
                Suma (auto): <strong class="tabular-nums text-highlighted">{{ form.total }}</strong> kg
              </p>
            </div>
          </div>
          <div class="slavia-form-actions border-t border-default/60 pt-4">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              @click="modalOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              size="lg"
              :loading="saving"
              @click="saveEdit"
            >
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="addModalOpen"
      title="Nowy start (kadra)"
      :ui="{ overlay: 'z-[190]', content: 'z-[200]' }"
    >
      <template #content>
        <div class="slavia-form-modal">
          <p class="rounded-xl border border-default/60 bg-muted/15 px-4 py-3 text-sm text-muted dark:bg-muted/10">
            Start zapisany przez trenera lub administratora trafia od razu jako
            <strong class="text-highlighted">zatwierdzony</strong> i liczy się w rankingu oraz na karcie zawodnika.
          </p>
          <div class="slavia-form-panel">
            <div class="slavia-form-panel__header">
              <div class="slavia-form-panel__title">
                <span class="slavia-form-panel__icon">
                  <UIcon
                    name="i-lucide-plus"
                    class="size-4"
                  />
                </span>
                Dane startu
              </div>
            </div>
            <div class="slavia-form-panel__body">
              <UFormField label="Zawodnik">
                <select
                  v-model="formAdd.athlete_id"
                  class="slavia-select w-full py-3 text-[15px]"
                >
                  <option
                    disabled
                    value=""
                  >
                    — wybierz —
                  </option>
                  <option
                    v-for="a in athleteSelectOptions"
                    :key="a.id"
                    :value="a.id"
                  >
                    {{ a.full_name }}
                  </option>
                </select>
              </UFormField>
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Rwanie (kg)">
                  <UInput
                    v-model.number="formAdd.snatch"
                    type="number"
                    step="0.5"
                    min="0"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
                <UFormField label="Podrzut (kg)">
                  <UInput
                    v-model.number="formAdd.clean_and_jerk"
                    type="number"
                    step="0.5"
                    min="0"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
              </div>
              <UFormField label="Data startu">
                <UInput
                  v-model="formAdd.date"
                  type="date"
                  size="lg"
                  class="w-full"
                />
              </UFormField>
              <p class="text-xs text-muted">
                Dwubój (auto): <strong class="tabular-nums text-highlighted">{{ formAdd.total }}</strong> kg
              </p>
            </div>
          </div>
          <div class="slavia-form-actions border-t border-default/60 pt-4">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              @click="addModalOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              size="lg"
              :loading="savingAdd"
              @click="submitAdd"
            >
              Zapisz start
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
