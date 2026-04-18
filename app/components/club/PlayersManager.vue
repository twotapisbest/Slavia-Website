<script setup lang="ts">
import { apiRoutes, urlAdminPlayer } from '~/config/api'
import type { Player, PlayerPayload } from '~/types/models'

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

const form = reactive<PlayerPayload>({
  full_name: '',
  birth_year: null,
  weight_category: null,
  best_snatch_kg: null,
  best_clean_jerk_kg: null,
  total_kg: null,
  notes: null,
  is_active: true
})

function resetForm () {
  editingId.value = null
  form.full_name = ''
  form.birth_year = null
  form.weight_category = null
  form.best_snatch_kg = null
  form.best_clean_jerk_kg = null
  form.total_kg = null
  form.notes = null
  form.is_active = true
}

async function loadPlayers () {
  loading.value = true
  try {
    players.value = await api<Player[]>(apiRoutes.players.list)
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
  form.weight_category = p.weight_category ?? null
  form.best_snatch_kg = p.best_snatch_kg ?? null
  form.best_clean_jerk_kg = p.best_clean_jerk_kg ?? null
  form.total_kg = p.total_kg ?? null
  form.notes = p.notes ?? null
  form.is_active = p.is_active !== false
  modalOpen.value = true
}

async function savePlayer () {
  if (!form.full_name.trim()) {
    toast.add({ title: 'Uzupełnij nazwisko i imię', color: 'warning' })
    return
  }
  saving.value = true
  try {
    const body: PlayerPayload = {
      full_name: form.full_name.trim(),
      birth_year: form.birth_year,
      weight_category: form.weight_category || null,
      best_snatch_kg: form.best_snatch_kg,
      best_clean_jerk_kg: form.best_clean_jerk_kg,
      total_kg: form.total_kg,
      notes: form.notes || null,
      is_active: form.is_active
    }
    if (editingId.value) {
      await api(urlAdminPlayer(editingId.value), { method: 'PATCH', body })
      toast.add({ title: 'Zapisano zmiany', color: 'success', icon: 'i-lucide-check' })
    } else {
      await api(apiRoutes.admin.players, { method: 'POST', body })
      toast.add({ title: 'Dodano zawodnika', color: 'success', icon: 'i-lucide-check' })
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
                {{ p.full_name }}
              </td>
              <td class="px-4 py-3 text-center tabular-nums text-muted">
                {{ p.birth_year ?? '—' }}
              </td>
              <td class="px-4 py-3 text-center text-muted">
                {{ p.weight_category ?? '—' }}
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

    <UModal v-model:open="modalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <h3 class="text-lg font-semibold text-highlighted">
                {{ editingId ? 'Edycja zawodnika' : 'Nowy zawodnik' }}
              </h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="modalOpen = false"
              />
            </div>
          </template>

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
              />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Rok urodzenia">
                <UInputNumber
                  v-model="form.birth_year"
                  :min="1950"
                  :max="new Date().getFullYear()"
                  placeholder="np. 2010"
                />
              </UFormField>
              <UFormField label="Kategoria wagowa">
                <UInput
                  v-model="form.weight_category"
                  placeholder="np. 73 kg"
                />
              </UFormField>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <UFormField label="Rwanie (kg)">
                <UInputNumber
                  v-model="form.best_snatch_kg"
                  :min="0"
                  placeholder="—"
                />
              </UFormField>
              <UFormField label="Podrzut (kg)">
                <UInputNumber
                  v-model="form.best_clean_jerk_kg"
                  :min="0"
                  placeholder="—"
                />
              </UFormField>
              <UFormField label="Suma (kg)">
                <UInputNumber
                  v-model="form.total_kg"
                  :min="0"
                  placeholder="—"
                />
              </UFormField>
            </div>

            <UFormField label="Notatki">
              <UTextarea
                v-model="form.notes"
                :rows="3"
                autoresize
                placeholder="Opcjonalnie…"
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
        </UCard>
      </template>
    </UModal>

    <UModal v-model:open="deleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-highlighted">
              Usunąć zawodnika?
            </h3>
          </template>
          <p
            v-if="pendingDelete"
            class="text-muted"
          >
            Czy na pewno usunąć „{{ pendingDelete.full_name }}”? Tej operacji nie cofniesz.
          </p>
          <template #footer>
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
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
