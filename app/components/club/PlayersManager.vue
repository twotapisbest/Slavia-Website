<script setup lang="ts">
import { apiRoutes, urlAdminPlayer } from '~/config/api'
import type { Competition, Player } from '~/types/models'

const api = useApi()
const toast = useToast()

const players = ref<Player[]>([])
const loading = ref(true)
const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const pendingDelete = ref<Player | null>(null)
const saving = ref(false)
const deleting = ref(false)

const editingId = ref<string | null>(null)

const form = reactive({
  full_name: '',
  birth_year: null,
  gender: 'male',
  weight_category: null,
  bodyweight: null,
  best_snatch_kg: null,
  best_clean_jerk_kg: null,
  total_kg: null,
  image_url: null,
  notes: null,
  is_active: true,
  // Account fields
  create_account: false,
  username: '',
  password: ''
})

const uploadLoading = ref(false)

const competitionsCatalog = ref<Competition[]>([])
const assignedCompetitionIds = ref<string[]>([])
const assignmentsLoading = ref(false)

async function loadAthleteAssignments(athleteId: string) {
  assignmentsLoading.value = true
  try {
    const mine = await api<Competition[]>(apiRoutes.athletes.competitions(athleteId))
    assignedCompetitionIds.value = mine.map(c => c.id)
  } catch {
    assignedCompetitionIds.value = []
  } finally {
    assignmentsLoading.value = false
  }
}

watch(modalOpen, async (open) => {
  if (!open) {
    return
  }
  if (!editingId.value) {
    competitionsCatalog.value = []
    assignedCompetitionIds.value = []
    return
  }
  try {
    const rows = await api<Competition[]>(apiRoutes.competitions.collection)
    competitionsCatalog.value = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    competitionsCatalog.value = []
  }
  await loadAthleteAssignments(editingId.value)
})

function resetForm() {
  editingId.value = null
  form.full_name = ''
  form.birth_year = null
  form.gender = 'male'
  form.weight_category = null
  form.bodyweight = null
  form.best_snatch_kg = null
  form.best_clean_jerk_kg = null
  form.total_kg = null
  form.image_url = null
  form.notes = null
  form.is_active = true
  form.create_account = false
  form.username = ''
  form.password = ''
  assignedCompetitionIds.value = []
}

watch(() => [form.best_snatch_kg, form.best_clean_jerk_kg], ([snatch, cj]) => {
  form.total_kg = (snatch || 0) + (cj || 0)
})

const currentYear = new Date().getFullYear()

/** Rok jako liczba całkowita bez separatorów (UInputNumber potrafiło pokazywać „2 010”). */
function setBirthYear(v: string | number | null | undefined) {
  if (v === null || v === undefined) {
    form.birth_year = null
    return
  }
  const s = String(v)
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/\s/g, '')
    .replace(/,/g, '')
  if (s === '') {
    form.birth_year = null
    return
  }
  const n = Number.parseInt(s, 10)
  form.birth_year = Number.isFinite(n) ? n : null
}

async function loadPlayers() {
  loading.value = true
  try {
    players.value = await api<Player[]>(apiRoutes.athletes.listAdmin)
  } catch (e) {
    toast.add({
      title: 'Nie udało się wczytać zawodników',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  resetForm()
  modalOpen.value = true
}

function openEdit(p: Player) {
  editingId.value = p.id
  form.full_name = p.full_name
  form.birth_year = p.birth_year ?? null
  form.gender = p.gender || 'male'
  form.weight_category = p.weight_category ?? null
  form.bodyweight = p.bodyweight ?? null
  form.best_snatch_kg = p.best_snatch_kg ?? null
  form.best_clean_jerk_kg = p.best_clean_jerk_kg ?? null
  form.total_kg = p.total_kg ?? null
  form.image_url = p.image_url || null
  form.notes = p.notes ?? null
  form.is_active = p.is_active !== false
  modalOpen.value = true
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  const formData = new FormData()
  formData.append('file', file)

  uploadLoading.value = true
  try {
    const res = await api<{ url: string }>(apiRoutes.upload, {
      method: 'POST',
      body: formData
    })
    form.image_url = res.url
    toast.add({ title: 'Zdjęcie przesłane', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Błąd uploadu', description: getApiErrorMessage(err), color: 'error' })
  } finally {
    uploadLoading.value = false
  }
}

async function savePlayer() {
  if (!form.full_name.trim()) {
    toast.add({ title: 'Uzupełnij nazwisko i imię', color: 'warning' })
    return
  }
  saving.value = true
  const wasEditing = !!editingId.value
  try {
    const body: Record<string, unknown> = {
      full_name: form.full_name.trim(),
      birth_year: form.birth_year,
      gender: form.gender,
      weight_category: form.weight_category || null,
      bodyweight: form.bodyweight,
      best_snatch_kg: form.best_snatch_kg,
      best_clean_jerk_kg: form.best_clean_jerk_kg,
      total_kg: form.total_kg,
      image_url: form.image_url,
      notes: form.notes || null,
      is_active: form.is_active,
      username: form.create_account ? form.username : undefined,
      password: form.create_account ? form.password : undefined
    }
    let athleteId: string
    if (editingId.value) {
      await api(urlAdminPlayer(editingId.value), { method: 'PATCH', body })
      athleteId = editingId.value
      toast.add({ title: 'Zapisano zmiany', color: 'success', icon: 'i-lucide-check' })
    } else {
      const created = await api<Player>(apiRoutes.admin.players, { method: 'POST', body })
      athleteId = created.id
      toast.add({ title: 'Dodano zawodnika', color: 'success', icon: 'i-lucide-check' })
    }

    if (wasEditing) {
      try {
        await api(apiRoutes.athletes.competitions(athleteId), {
          method: 'PUT',
          body: { competition_ids: [...assignedCompetitionIds.value] }
        })
      } catch (e) {
        toast.add({
          title: 'Zapisano zawodnika — nie zapisano przypisań do zawodów',
          description: getApiErrorMessage(e),
          color: 'warning'
        })
      }
    }

    modalOpen.value = false
    resetForm()
    await loadPlayers()
  } catch (e) {
    toast.add({
      title: 'Operacja nie powiodła się',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function askDelete(p: Player) {
  pendingDelete.value = p
  deleteModalOpen.value = true
}

function cancelDelete() {
  deleteModalOpen.value = false
  pendingDelete.value = null
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  deleting.value = true
  try {
    await api(urlAdminPlayer(pendingDelete.value.id), { method: 'DELETE' })
    toast.add({ title: 'Usunięto zawodnika', color: 'success' })
    pendingDelete.value = null
    deleteModalOpen.value = false
    await loadPlayers()
  } catch (e) {
    toast.add({
      title: 'Nie udało się usunąć',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadPlayers()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-muted">
        Zarządzaj rekordami zgodnie z danymi w systemie klubowym.
      </p>
      <UButton
        icon="i-lucide-plus"
        @click="openCreate"
      >
        Dodaj zawodnika
      </UButton>
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead class="border-b border-default bg-muted/30">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-muted">
                Zawodnik
              </th>
              <th class="px-4 py-3 text-center font-semibold text-muted">
                Rok ur.
              </th>
              <th class="px-4 py-3 text-center font-semibold text-muted">
                Kat.
              </th>
              <th class="px-4 py-3 text-center font-semibold tabular-nums text-muted">
                Rw.
              </th>
              <th class="px-4 py-3 text-center font-semibold tabular-nums text-muted">
                Podrzut
              </th>
              <th class="px-4 py-3 text-center font-semibold tabular-nums text-muted">
                Suma
              </th>
              <th class="px-4 py-3 text-center font-semibold text-muted">
                Aktywny
              </th>
              <th class="px-4 py-3 text-right font-semibold text-muted">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-if="loading">
              <td
                colspan="8"
                class="px-4 py-10 text-center text-muted"
              >
                <UIcon
                  name="i-lucide-loader-2"
                  class="size-6 animate-spin"
                />
              </td>
            </tr>
            <tr
              v-for="p in players"
              v-else
              :key="p.id"
              class="hover:bg-muted/20"
            >
              <td class="px-4 py-3 font-medium">
                <div class="flex items-center gap-3">
                  <UAvatar
                    :src="(p as any).image_url"
                    size="xs"
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <p>{{ p.full_name }}</p>
                      <UTooltip
                        v-if="p.user_id"
                        text="Konto powiązane"
                      >
                        <UIcon
                          name="i-lucide-user-check"
                          class="size-3.5 text-primary"
                        />
                      </UTooltip>
                    </div>
                    <p class="text-[10px] uppercase font-bold text-muted">
                      {{ (p as any).gender === 'male' ? 'Mężczyzna' : 'Kobieta' }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-center tabular-nums text-muted">
                {{ p.birth_year ?? '—' }}
              </td>
              <td class="px-4 py-3 text-center text-muted">
                {{ p.weight_category ?? '—' }}
                <span
                  v-if="(p as any).bodyweight"
                  class="block text-[10px]"
                >({{ (p as any).bodyweight }} kg)</span>
              </td>
              <td class="px-4 py-3 text-center tabular-nums">
                {{ p.best_snatch_kg ?? '—' }}
              </td>
              <td class="px-4 py-3 text-center tabular-nums">
                {{ p.best_clean_jerk_kg ?? '—' }}
              </td>
              <td class="px-4 py-3 text-center tabular-nums font-medium">
                {{ p.total_kg ?? '—' }}
              </td>
              <td class="px-4 py-3 text-center">
                <UBadge
                  v-if="p.is_active !== false"
                  color="success"
                  variant="subtle"
                >
                  Tak
                </UBadge>
                <UBadge
                  v-else
                  color="neutral"
                  variant="subtle"
                >
                  Nie
                </UBadge>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <UButton
                    icon="i-lucide-pencil"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    @click="openEdit(p)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="askDelete(p)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!loading && players.length === 0"
          class="px-4 py-10 text-center text-muted"
        >
          Brak zawodników — dodaj pierwszego rekord.
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Edycja zawodnika' : 'Nowy zawodnik'"
    >
      <template #content>
        <div class="slavia-form-modal">
          <form
            class="slavia-form-stack"
            @submit.prevent="savePlayer"
          >
            <div class="slavia-form-panel">
              <div class="slavia-form-panel__header">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon">
                    <UIcon
                      name="i-lucide-user"
                      class="size-4"
                    />
                  </span>
                  Dane podstawowe
                </div>
              </div>
              <div class="slavia-form-panel__body">
                <UFormField
                  label="Nazwisko i imię"
                  required
                >
                  <UInput
                    v-model="form.full_name"
                    autocomplete="name"
                    placeholder="np. Kowalski Jan"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>
                <div class="grid gap-5 sm:grid-cols-2">
                  <UFormField
                    label="Płeć"
                    required
                  >
                    <select
                      v-model="form.gender"
                      class="slavia-select w-full py-3 text-[15px]"
                    >
                      <option value="male">
                        Mężczyzna
                      </option>
                      <option value="female">
                        Kobieta
                      </option>
                    </select>
                  </UFormField>
                  <UFormField label="Zdjęcie (URL lub wgrywanie)">
                    <div class="flex flex-wrap items-center gap-2">
                      <UInput
                        v-model="form.image_url"
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
                </div>
              </div>
            </div>

            <div class="slavia-form-panel">
              <div class="slavia-form-panel__header">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon">
                    <UIcon
                      name="i-lucide-dumbbell"
                      class="size-4"
                    />
                  </span>
                  Parametry sportowe
                </div>
                <p class="slavia-form-panel__desc">
                  Rok urodzenia jako cztery cyfry — bez przecinka ani spacji.
                </p>
              </div>
              <div class="slavia-form-panel__body">
                <div class="grid gap-5 sm:grid-cols-3">
                  <UFormField label="Rok urodzenia">
                    <UInput
                      :model-value="form.birth_year === null || form.birth_year === undefined ? '' : String(form.birth_year)"
                      type="number"
                      inputmode="numeric"
                      size="lg"
                      class="w-full tabular-nums"
                      :min="1950"
                      :max="currentYear"
                      placeholder="np. 2010"
                      @update:model-value="setBirthYear"
                    />
                  </UFormField>
                  <UFormField label="Kategoria wagowa">
                    <UInput
                      v-model="form.weight_category"
                      placeholder="np. 73 kg"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Waga ciała (kg)">
                    <UInputNumber
                      v-model="form.bodyweight"
                      :min="0"
                      :max="300"
                      step="0.1"
                      placeholder="np. 72.5"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                </div>
                <div class="grid gap-5 sm:grid-cols-3">
                  <UFormField label="Rwanie (kg)">
                    <UInputNumber
                      v-model="form.best_snatch_kg"
                      :min="0"
                      placeholder="—"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Podrzut (kg)">
                    <UInputNumber
                      v-model="form.best_clean_jerk_kg"
                      :min="0"
                      placeholder="—"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Suma (kg)">
                    <UInputNumber
                      v-model="form.total_kg"
                      :min="0"
                      placeholder="—"
                      size="lg"
                      class="w-full"
                      disabled
                    />
                  </UFormField>
                </div>
              </div>
            </div>

            <div class="slavia-form-panel">
              <div class="slavia-form-panel__header">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon">
                    <UIcon
                      name="i-lucide-key-round"
                      class="size-4"
                    />
                  </span>
                  Konto i dostęp
                </div>
              </div>
              <div class="slavia-form-panel__body space-y-5">
                <div v-if="!editingId || !(players.find(p => p.id === editingId)?.user_id)">
                  <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-default/60 bg-muted/20 px-4 py-3 dark:bg-muted/10">
                    <div>
                      <p class="text-sm font-bold text-highlighted">
                        Utwórz konto logowania
                      </p>
                      <p class="text-xs text-muted">
                        Zawodnik zaloguje się do panelu i edytuje swój profil.
                      </p>
                    </div>
                    <USwitch v-model="form.create_account" />
                  </div>
                  <div
                    v-if="form.create_account"
                    class="mt-5 grid gap-5 sm:grid-cols-2"
                  >
                    <UFormField
                      label="Login"
                      required
                    >
                      <UInput
                        v-model="form.username"
                        placeholder="np. jgawron"
                        size="lg"
                        class="w-full"
                      />
                    </UFormField>
                    <UFormField label="Hasło (opcjonalnie)">
                      <UInput
                        v-model="form.password"
                        type="password"
                        placeholder="Domyślnie: Slavia2026"
                        size="lg"
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                </div>
                <div
                  v-else
                  class="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3"
                >
                  <UIcon
                    name="i-lucide-user-check"
                    class="size-5 shrink-0 text-primary"
                  />
                  <div>
                    <p class="text-sm font-bold text-primary">
                      Konto powiązane
                    </p>
                    <p class="text-xs text-muted">
                      Ten zawodnik ma już konto w systemie.
                    </p>
                  </div>
                </div>

                <template v-if="editingId">
                  <div class="rounded-xl border border-default/70 bg-muted/10 p-4 dark:bg-muted/5">
                    <p class="text-sm font-bold text-highlighted">
                      Przypisania do zawodów
                    </p>
                    <p class="mt-1 text-xs text-muted">
                      Zaznaczone pozycje trafiają do osobistego kalendarza zawodnika.
                    </p>
                    <div
                      v-if="assignmentsLoading"
                      class="mt-4 flex items-center gap-2 text-sm text-muted"
                    >
                      <UIcon
                        name="i-lucide-loader-2"
                        class="size-4 animate-spin shrink-0"
                      />
                      Wczytywanie…
                    </div>
                    <div
                      v-else-if="!competitionsCatalog.length"
                      class="mt-3 text-xs text-muted"
                    >
                      Brak wpisów w kalendarzu — dodaj wydarzenie w zakładce Kalendarz.
                    </div>
                    <div
                      v-else
                      class="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1"
                    >
                      <label
                        v-for="c in competitionsCatalog"
                        :key="c.id"
                        class="flex cursor-pointer items-start gap-3 rounded-lg border border-default/60 bg-background/80 px-3 py-2.5 transition-colors hover:border-primary/35 hover:bg-primary/5"
                      >
                        <input
                          v-model="assignedCompetitionIds"
                          type="checkbox"
                          :value="c.id"
                          class="mt-1 size-4 rounded border-default text-primary focus:ring-primary/40"
                        >
                        <span class="text-sm leading-snug">
                          <span class="font-semibold text-highlighted">{{ c.title }}</span>
                          <span class="block text-xs text-muted tabular-nums">{{ (c.date || '').slice(0, 10) }} · {{ c.location }}</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <div class="slavia-form-panel">
              <div class="slavia-form-panel__header">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon">
                    <UIcon
                      name="i-lucide-sticky-note"
                      class="size-4"
                    />
                  </span>
                  Notatki i status
                </div>
              </div>
              <div class="slavia-form-panel__body">
                <UFormField label="Notatki wewnętrzne">
                  <UTextarea
                    v-model="form.notes"
                    :rows="3"
                    autoresize
                    placeholder="Opcjonalnie…"
                    class="w-full"
                  />
                </UFormField>
                <div class="flex flex-col gap-6 border-t border-default/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex items-center gap-3">
                    <USwitch v-model="form.is_active" />
                    <span class="text-sm font-semibold text-highlighted">Aktywny w kadrze</span>
                  </div>
                  <div class="slavia-form-actions w-full sm:w-auto">
                    <UButton
                      type="button"
                      color="neutral"
                      variant="outline"
                      size="lg"
                      @click="modalOpen = false"
                    >
                      Anuluj
                    </UButton>
                    <UButton
                      type="submit"
                      size="lg"
                      :loading="saving"
                    >
                      Zapisz
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="deleteModalOpen"
      title="Usunąć zawodnika?"
      description="Tej operacji nie cofniesz."
    >
      <template #content>
        <div class="slavia-form-modal">
          <p
            v-if="pendingDelete"
            class="text-muted leading-relaxed"
          >
            Czy na pewno usunąć „{{ pendingDelete.full_name }}”?
          </p>
          <div class="slavia-form-actions border-t border-default/60 pt-4">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              @click="cancelDelete"
            >
              Wróć
            </UButton>
            <UButton
              color="error"
              size="lg"
              :loading="deleting"
              @click="confirmDelete"
            >
              Usuń
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
