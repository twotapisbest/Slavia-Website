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

async function loadAthleteAssignments (athleteId: string) {
  assignmentsLoading.value = true
  try {
    const mine = await api<Competition[]>(`/api/athletes/${athleteId}/competitions`)
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
    const rows = await api<Competition[]>('/api/competitions')
    competitionsCatalog.value = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    competitionsCatalog.value = []
  }
  await loadAthleteAssignments(editingId.value)
})

function resetForm () {
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

async function loadPlayers () {
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

function openCreate () {
  resetForm()
  modalOpen.value = true
}

function openEdit (p: Player) {
  editingId.value = p.id
  form.full_name = p.full_name
  form.birth_year = p.birth_year ?? null
  form.gender = (p as any).gender || 'male'
  form.weight_category = p.weight_category ?? null
  form.bodyweight = (p as any).bodyweight ?? null
  form.best_snatch_kg = p.best_snatch_kg ?? null
  form.best_clean_jerk_kg = p.best_clean_jerk_kg ?? null
  form.total_kg = p.total_kg ?? null
  form.image_url = (p as any).image_url || null
  form.notes = p.notes ?? null
  form.is_active = p.is_active !== false
  modalOpen.value = true
}

async function onFileChange (e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  const formData = new FormData()
  formData.append('file', file)
  
  uploadLoading.value = true
  try {
    const res = await api<{ url: string }>('/api/upload', {
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

async function savePlayer () {
  if (!form.full_name.trim()) {
    toast.add({ title: 'Uzupełnij nazwisko i imię', color: 'warning' })
    return
  }
  saving.value = true
  const wasEditing = !!editingId.value
  try {
    const body: any = {
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
        await api(`/api/athletes/${athleteId}/competitions`, {
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

function askDelete (p: Player) {
  pendingDelete.value = p
  deleteModalOpen.value = true
}

function cancelDelete () {
  deleteModalOpen.value = false
  pendingDelete.value = null
}

async function confirmDelete () {
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
                  <UAvatar :src="(p as any).image_url" size="xs" />
                  <div>
                    <div class="flex items-center gap-2">
                      <p>{{ p.full_name }}</p>
                      <UTooltip v-if="p.user_id" text="Konto powiązane">
                        <UIcon name="i-lucide-user-check" class="size-3.5 text-primary" />
                      </UTooltip>
                    </div>
                    <p class="text-[10px] uppercase font-bold text-muted">{{ (p as any).gender === 'male' ? 'Mężczyzna' : 'Kobieta' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-center tabular-nums text-muted">
                {{ p.birth_year ?? '—' }}
              </td>
              <td class="px-4 py-3 text-center text-muted">
                {{ p.weight_category ?? '—' }}
                <span v-if="(p as any).bodyweight" class="block text-[10px]">({{ (p as any).bodyweight }} kg)</span>
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
        <div class="p-4 sm:p-6 space-y-4">
          <form
            class="space-y-4"
            @submit.prevent="savePlayer"
          >
            <UFormField
              label="Nazwisko i imię"
              required
            >
              <UInput
                v-model="form.full_name"
                autocomplete="name"
                class="w-full"
              />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Płeć" required>
                <select v-model="form.gender" class="slavia-select w-full">
                  <option value="male">
                    Mężczyzna
                  </option>
                  <option value="female">
                    Kobieta
                  </option>
                </select>
              </UFormField>
              <UFormField label="Zdjęcie (URL lub Upload)">
                <div class="flex gap-2 items-center">
                  <UInput v-model="form.image_url" placeholder="https://..." class="grow" />
                  <UButton icon="i-lucide-upload" color="neutral" variant="ghost" :loading="uploadLoading" @click="$refs.fileInput.click()" />
                  <input ref="fileInput" type="file" hidden accept="image/*" @change="onFileChange" />
                </div>
              </UFormField>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <UFormField label="Rok urodzenia">
                <UInputNumber
                  v-model="form.birth_year"
                  :min="1950"
                  :max="new Date().getFullYear()"
                  placeholder="np. 2010"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Kategoria wagowa">
                <UInput
                  v-model="form.weight_category"
                  placeholder="np. 73 kg"
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
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <UFormField label="Rwanie (kg)">
                <UInputNumber
                  v-model="form.best_snatch_kg"
                  :min="0"
                  placeholder="—"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Podrzut (kg)">
                <UInputNumber
                  v-model="form.best_clean_jerk_kg"
                  :min="0"
                  placeholder="—"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Suma (kg)">
                <UInputNumber
                  v-model="form.total_kg"
                  :min="0"
                  placeholder="—"
                  class="w-full"
                  disabled
                />
              </UFormField>
            </div>

            <USeparator />

            <!-- Account Section -->
            <div v-if="!editingId || !(players.find(p => p.id === editingId)?.user_id)" class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-sm font-bold text-highlighted">Konto użytkownika</h4>
                  <p class="text-xs text-muted">Umożliwia zawodnikowi logowanie i edycję profilu.</p>
                </div>
                <USwitch v-model="form.create_account" />
              </div>

              <div v-if="form.create_account" class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Login" required>
                  <UInput v-model="form.username" placeholder="np. jgawron" class="w-full" />
                </UFormField>
                <UFormField label="Hasło (opcjonalnie)">
                  <UInput v-model="form.password" type="password" placeholder="Domyślnie: Slavia2026" class="w-full" />
                </UFormField>
              </div>
            </div>
            <div v-else class="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
              <UIcon name="i-lucide-user-check" class="size-5 text-primary" />
              <div>
                <p class="text-sm font-bold text-primary">Konto powiązane</p>
                <p class="text-xs text-muted">Ten zawodnik posiada już konto w systemie.</p>
              </div>
            </div>

            <template v-if="editingId">
              <USeparator />
              <div class="rounded-xl border border-default bg-muted/10 p-4 space-y-3">
                <div>
                  <h4 class="text-sm font-bold text-highlighted">
                    Przypisania do zawodów (kalendarz klubu)
                  </h4>
                  <p class="text-xs text-muted mt-0.5">
                    Dostępne po utworzeniu rekordu — zaznaczone pozycje trafiają do osobistego kalendarza zawodnika.
                  </p>
                </div>
                <div v-if="assignmentsLoading" class="flex items-center gap-2 text-sm text-muted py-2">
                  <UIcon name="i-lucide-loader-2" class="size-4 animate-spin shrink-0" />
                  Wczytywanie listy i przypisań…
                </div>
                <div v-else-if="!competitionsCatalog.length" class="text-xs text-muted py-1">
                  Brak wpisów w kalendarzu zawodów — dodaj wydarzenie w zakładce Kalendarz.
                </div>
                <div v-else class="max-h-52 overflow-y-auto space-y-2 pr-1">
                  <label
                    v-for="c in competitionsCatalog"
                    :key="c.id"
                    class="flex gap-3 cursor-pointer items-start rounded-lg border border-default/60 bg-background/80 px-3 py-2.5 transition-colors hover:border-primary/35 hover:bg-primary/5"
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

            <UFormField label="Notatki">
              <UTextarea
                v-model="form.notes"
                :rows="3"
                autoresize
                placeholder="Opcjonalnie…"
                class="w-full"
              />
            </UFormField>

            <div class="flex items-center justify-between gap-4">
              <UFormField label="Aktywny w kadrze">
                <USwitch v-model="form.is_active" />
              </UFormField>
              <div class="flex gap-2">
                <UButton
                  type="button"
                  color="neutral"
                  variant="outline"
                  @click="modalOpen = false"
                >
                  Anuluj
                </UButton>
                <UButton
                  type="submit"
                  :loading="saving"
                >
                  Zapisz
                </UButton>
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
        <div class="p-4 sm:p-6 space-y-4">
          <p
            v-if="pendingDelete"
            class="text-muted"
          >
            Czy na pewno usunąć „{{ pendingDelete.full_name }}”?
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="outline"
              @click="cancelDelete"
            >
              Wróć
            </UButton>
            <UButton
              color="error"
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
