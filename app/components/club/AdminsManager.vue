<script setup lang="ts">
import { apiRoutes, urlAdminAccount, urlSuperadminAdmin } from '~/config/api'
import type { AdminAccount } from '~/types/models'

const api = useApi()
const auth = useAuth()
const toast = useToast()

const canSuper = computed(() => auth.isSuperAdmin.value)
const canEditAccount = computed(() => auth.isAdmin.value)

const admins = ref<AdminAccount[]>([])
const loading = ref(true)

const modalOpen = ref(false)
const saving = ref(false)
const username = ref('')
const password = ref('')

const deleteModalOpen = ref(false)
const pendingDelete = ref<AdminAccount | null>(null)
const deleting = ref(false)

const roleEditId = ref<string | null>(null)
const roleEditValue = ref('')
/** Wszystkie role nadawalne przez SuperAdmina (w tym promocja do SuperAdmin). */
const roles = ['SuperAdmin', 'Admin', 'Trainer', 'TrainerAdmin', 'Athlete'] as const

const accountModalOpen = ref(false)
const accountSaving = ref(false)
const accountTarget = ref<AdminAccount | null>(null)
const accountUsername = ref('')
const accountEmail = ref('')
const accountPassword = ref('')

function canEditAccountFor (a: AdminAccount) {
  if (!canEditAccount.value || auth.user.value?.id === a.id) return false
  if (a.role === 'SuperAdmin' && !canSuper.value) return false
  return true
}

function canEditRoleFor (a: AdminAccount) {
  return canSuper.value && auth.user.value?.id !== a.id
}

function canDeleteAccount (a: AdminAccount) {
  return canSuper.value && auth.user.value?.id !== a.id
}

function startRoleEdit (a: AdminAccount) {
  roleEditId.value = a.id
  roleEditValue.value = a.role
}

function openAccountEdit (a: AdminAccount) {
  accountTarget.value = a
  accountUsername.value = a.username
  accountEmail.value = a.email || ''
  accountPassword.value = ''
  accountModalOpen.value = true
}

async function saveAccountEdit () {
  if (!accountTarget.value) return
  if (!accountUsername.value.trim()) {
    toast.add({ title: 'Login jest wymagany', color: 'warning' })
    return
  }
  accountSaving.value = true
  try {
    const body: Record<string, string> = {
      username: accountUsername.value.trim()
    }
    if (accountEmail.value.trim()) {
      body.email = accountEmail.value.trim()
    } else {
      body.email = ''
    }
    if (accountPassword.value) {
      body.password = accountPassword.value
    }
    await api(urlAdminAccount(accountTarget.value.id), {
      method: 'PATCH',
      body
    })
    toast.add({ title: 'Konto zaktualizowane', color: 'success' })
    accountModalOpen.value = false
    accountPassword.value = ''
    await loadAdmins()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zapisać',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    accountSaving.value = false
  }
}

async function changeRole (adminId: string, newRole: string) {
  try {
    await api(`${apiRoutes.superadmin.admins}/${adminId}/role`, {
      method: 'PATCH',
      body: { role: newRole }
    })
    toast.add({ title: 'Rola zaktualizowana', color: 'success' })
    roleEditId.value = null
    await loadAdmins()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zmienić roli',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function loadAdmins () {
  loading.value = true
  try {
    admins.value = await api<AdminAccount[]>(apiRoutes.superadmin.admins)
  } catch (e) {
    toast.add({
      title: 'Nie udało się wczytać kont',
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
    toast.add({ title: 'Dodano konto', color: 'success', icon: 'i-lucide-check' })
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
    toast.add({ title: 'Usunięto konto', color: 'success' })
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
      <p class="text-sm text-muted max-w-2xl">
        <span v-if="canSuper">Superadministrator: pełne zarządzanie rolami (w tym SuperAdmin i zawodnik), tworzenie i usuwanie kont — bez usuwania ani zmiany roli własnego konta z tej tabeli.</span>
        <span v-else>Administrator: edycja loginu, e-maila i hasła kont kadry. Zmiany ról wykonuje superadministrator.</span>
      </p>
      <UButton
        v-if="canSuper"
        icon="i-lucide-user-plus"
        @click="openCreate"
      >
        Nowe konto
      </UButton>
    </div>

    <UCard :ui="{ body: 'p-0 overflow-visible' }">
      <div class="overflow-x-auto overflow-y-visible">
        <table class="w-full min-w-[640px] text-sm">
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
              <td class="px-4 py-3">
                <p class="font-medium">
                  {{ a.username }}
                </p>
                <p v-if="a.email" class="text-xs text-muted mt-0.5">
                  {{ a.email }}
                </p>
              </td>
              <td class="relative z-20 px-4 py-3 align-top">
                <div v-if="canEditRoleFor(a) && roleEditId === a.id" class="relative z-30 flex flex-wrap items-center gap-2">
                  <select
                    v-model="roleEditValue"
                    class="slavia-select w-40 min-w-[10rem]"
                  >
                    <option v-for="r in roles" :key="r" :value="r">
                      {{ r }}
                    </option>
                  </select>
                  <UButton size="xs" @click="changeRole(a.id, roleEditValue)">
                    Zmień
                  </UButton>
                  <UButton size="xs" color="neutral" variant="ghost" @click="roleEditId = null">
                    Anuluj
                  </UButton>
                </div>
                <div v-else class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <UBadge
                      color="primary"
                      variant="subtle"
                    >
                      {{ a.role }}
                    </UBadge>
                    <UButton
                      v-if="canEditRoleFor(a)"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-edit-2"
                      @click="startRoleEdit(a)"
                    />
                  </div>
                  <p v-if="a.role === 'Athlete'" class="text-[11px] text-muted leading-snug max-w-xs">
                    Konto zawodnika — profil sportowy edytujesz w bazie zawodników.
                  </p>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <UButton
                    v-if="canEditAccountFor(a)"
                    size="xs"
                    variant="soft"
                    icon="i-lucide-key-round"
                    @click="openAccountEdit(a)"
                  >
                    Konto
                  </UButton>
                  <UButton
                    v-if="canDeleteAccount(a)"
                    icon="i-lucide-trash-2"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="askDelete(a)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!loading && admins.length === 0"
          class="px-4 py-10 text-center text-muted"
        >
          Brak kont — superadministrator może dodać pierwsze konto.
        </div>
      </div>
    </UCard>

    <UModal v-model:open="modalOpen" title="Nowe konto administratora">
      <template #content>
        <div class="p-4 sm:p-6 space-y-4">
          <form
            class="space-y-4"
            @submit.prevent="saveAdmin"
          >
            <UFormField
              label="Login (nazwa użytkownika)"
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

    <UModal v-model:open="accountModalOpen" title="Edycja konta">
      <template #content>
        <div class="p-4 sm:p-6 space-y-4">
          <UFormField label="Login" required>
            <UInput v-model="accountUsername" autocomplete="username" class="w-full" />
          </UFormField>
          <UFormField label="E-mail (opcjonalnie)">
            <UInput v-model="accountEmail" type="email" autocomplete="email" class="w-full" />
          </UFormField>
          <UFormField label="Nowe hasło (pozostaw puste, by nie zmieniać)">
            <UInput v-model="accountPassword" type="password" autocomplete="new-password" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="outline" @click="accountModalOpen = false">
              Anuluj
            </UButton>
            <UButton :loading="accountSaving" @click="saveAccountEdit">
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteModalOpen" title="Usunąć konto?">
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
