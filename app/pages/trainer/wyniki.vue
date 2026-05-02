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
  'staff-athletes-admin',
  () => apiFetch<Athlete[]>('/api/athletes/admin').catch(() => [] as Athlete[])
)

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

function openEdit (r: CompetitionResult) {
  editing.value = r
  form.snatch = r.snatch
  form.clean_and_jerk = r.clean_and_jerk
  form.total = r.total
  form.date = r.date.slice(0, 10)
  form.status = r.status
  modalOpen.value = true
}

async function saveEdit () {
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

async function removeRow (r: CompetitionResult) {
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
</script>

<template>
  <UContainer class="py-10 md:py-14 animate-page-in">
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-primary">
          Kadra
        </p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
          Wszystkie starty zawodników
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          Pełna lista zgłoszeń (oczekujących i zatwierdzonych). Możesz poprawić ciężary, datę lub status oraz usunąć błędny wpis.
        </p>
      </div>
      <UButton icon="i-lucide-refresh-ccw" variant="soft" :loading="pending" @click="refresh()">
        Odśwież
      </UButton>
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
            <td colspan="7" class="px-4 py-10 text-center text-muted">
              <UIcon name="i-lucide-loader-2" class="inline size-6 animate-spin" />
            </td>
          </tr>
          <tr v-else-if="rows.length === 0">
            <td colspan="7" class="px-4 py-10 text-center text-muted">
              Brak zapisanych startów.
            </td>
          </tr>
          <template v-else>
            <tr v-for="r in rows" :key="r.id" class="hover:bg-muted/15 transition-colors">
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
                <UBadge :color="r.status === 'Approved' ? 'success' : 'warning'" variant="subtle">
                  {{ r.status }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <UButton size="xs" variant="soft" icon="i-lucide-pencil" @click="openEdit(r)" />
                  <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="removeRow(r)" />
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </UCard>

    <UModal v-model:open="modalOpen" title="Edytuj start" :ui="{ overlay: 'z-[190]', content: 'z-[200]' }">
      <template #content>
        <div class="space-y-4 p-4 sm:p-6">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Rwanie (kg)">
              <UInput v-model.number="form.snatch" type="number" step="0.5" class="w-full" />
            </UFormField>
            <UFormField label="Podrzut (kg)">
              <UInput v-model.number="form.clean_and_jerk" type="number" step="0.5" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Data">
            <UInput v-model="form.date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Status">
            <select
              v-model="form.status"
              class="slavia-select w-full"
            >
              <option value="Pending">
                Pending
              </option>
              <option value="Approved">
                Approved
              </option>
            </select>
          </UFormField>
          <p class="text-xs text-muted">
            Suma (auto): <strong>{{ form.total }}</strong> kg
          </p>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="outline" @click="modalOpen = false">
              Anuluj
            </UButton>
            <UButton :loading="saving" @click="saveEdit">
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
