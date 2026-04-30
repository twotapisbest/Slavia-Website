<script setup lang="ts">
import { apiRoutes, urlSuperadminAdmin } from '~/config/api'
import type { AdminAccount } from '~/types/models'

const api = useApi()
const toast = useToast()

const admins = ref<AdminAccount[]>([])
const loading = ref(true)

const modalOpen = ref(false)
const saving = ref(false)
const username = ref('')
const password = ref('')

const deleteModalOpen = ref(false)
const pendingDelete = ref<AdminAccount | null>(null)
const deleting = ref(false)

async function loadAdmins () {
  loading.value = true
  try {
    admins.value = await api<AdminAccount[]>(apiRoutes.superadmin.admins)
  } catch (e) {
    toast.add({
      title: 'Nie udało się wczytać administratorów',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function openCreate () {
  username.value = ''
  password.value = ''
  modalOpen.value = true
}

async function saveAdmin () {
  if (!username.value.trim() || !password.value) {
    toast.add({ title: 'Podaj nazwę użytkownika i hasło', color: 'warning' })
    return
  }
  saving.value = true
  try {
    await api(apiRoutes.superadmin.admins, {
      method: 'POST',
      body: { username: username.value.trim(), password: password.value }
    })
    toast.add({ title: 'Dodano administratora', color: 'success', icon: 'i-lucide-check' })
    modalOpen.value = false
    password.value = ''
    await loadAdmins()
  } catch (e) {
    toast.add({
      title: 'Nie udało się dodać konta',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function askDelete (a: AdminAccount) {
  pendingDelete.value = a
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
    await api(urlSuperadminAdmin(pendingDelete.value.id), { method: 'DELETE' })
    toast.add({ title: 'Usunięto administratora', color: 'success' })
    cancelDelete()
    await loadAdmins()
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
  loadAdmins()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-muted">
        Konta z rolą administratora — mogą edytować zawodników. Dostęp superadministratora ustala backend.
      </p>
      <UButton
        icon="i-lucide-user-plus"
        @click="openCreate"
      >
        Nowy administrator
      </UButton>
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[520px] text-sm">
          <thead class="border-b border-default bg-muted/30">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-muted">
                Użytkownik
              </th>
              <th class="px-4 py-3 text-left font-semibold text-muted">
                Rola
              </th>
              <th class="px-4 py-3 text-right font-semibold text-muted">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-if="loading">
              <td
                colspan="3"
                class="px-4 py-10 text-center text-muted"
              >
                <UIcon
                  name="i-lucide-loader-2"
                  class="size-6 animate-spin"
                />
              </td>
            </tr>
            <tr
              v-for="a in admins"
              v-else
              :key="a.id"
              class="hover:bg-muted/20"
            >
              <td class="px-4 py-3 font-medium">
                {{ a.username }}
              </td>
              <td class="px-4 py-3">
                <UBadge
                  color="primary"
                  variant="subtle"
                >
                  {{ a.role }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-right">
                <UButton
                  icon="i-lucide-trash-2"
                  size="xs"
                  color="error"
                  variant="ghost"
                  @click="askDelete(a)"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!loading && admins.length === 0"
          class="px-4 py-10 text-center text-muted"
        >
          Brak kont administratorów — dodaj pierwsze konto.
        </div>
      </div>
    </UCard>

    <UModal v-model:open="modalOpen" title="Nowy administrator">
      <template #content>
        <div class="p-4 sm:p-6 space-y-4">
          <form
            class="space-y-4"
            @submit.prevent="saveAdmin"
          >
            <UFormField
              label="E-mail"
              required
            >
              <UInput
                v-model="username"
                autocomplete="username"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Hasło"
              required
            >
              <UInput
                v-model="password"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>
            <div class="flex justify-end gap-2">
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
                Utwórz
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteModalOpen" title="Usunąć administratora?">
      <template #content>
        <div class="p-4 sm:p-6 space-y-4">
          <p
            v-if="pendingDelete"
            class="text-muted"
          >
            Czy na pewno usunąć konto {{ pendingDelete.username }}?
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
