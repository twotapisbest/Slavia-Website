<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { ClubNotification } from '~/composables/useNotifications'

const auth = useAuth()
const toast = useToast()
const { items, loading, refresh, remove, clearLocal } = useNotifications()

const popoverOpen = ref(false)

let pollTimer: ReturnType<typeof setInterval> | undefined

function parsePayload (raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    const o = JSON.parse(raw) as unknown
    if (!o || typeof o !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

/** Opcjonalny skrót do powiązanej podstrony (bez blokowania usuwania). */
function resolveLink (n: ClubNotification): string | null {
  const p = parsePayload(n.payload)
  const competitionId = p.competition_id
  const athleteId = p.athlete_id

  if (competitionId) {
    return '/kalendarz'
  }

  if (
    n.kind === 'training_log_athlete_note'
    || n.kind === 'training_log_trainer_note_staff'
    || (n.kind === 'training_log_trainer_note' && auth.isTrainer.value)
  ) {
    if (athleteId) return `/trainer/dziennik/${athleteId}`
  }

  if (n.kind === 'training_log_trainer_note' && auth.isAthlete.value) {
    return '/athlete/dziennik'
  }

  if (n.kind === 'result_pending' || n.kind === 'result_approved_staff') {
    return '/trainer/wyniki'
  }

  if (n.kind === 'result_approved' && auth.isAthlete.value) {
    return '/athlete'
  }

  if (
    n.kind.startsWith('admin_')
    || n.kind.startsWith('blog_')
  ) {
    if (auth.isSuperAdmin.value) return '/superadmin'
    if (auth.isAdmin.value) return '/admin'
  }

  return null
}

function relativeTime (iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: pl })
  } catch {
    return ''
  }
}

async function onRemove (id: string, e: Event) {
  e.preventDefault()
  e.stopPropagation()
  try {
    await remove(id)
  } catch (err) {
    toast.add({
      title: 'Nie udało się usunąć powiadomienia',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  }
}

function onRowClick (n: ClubNotification) {
  const to = resolveLink(n)
  if (to) {
    popoverOpen.value = false
    navigateTo(to)
  }
}

watch(popoverOpen, (open) => {
  if (open) refresh()
})

watch(
  () => auth.isLoggedIn.value,
  (loggedIn) => {
    if (loggedIn) refresh()
    else clearLocal()
  }
)

onMounted(() => {
  if (auth.isLoggedIn.value) refresh()
  pollTimer = setInterval(() => {
    if (!auth.isLoggedIn.value || !import.meta.client) return
    if (typeof document !== 'undefined' && document.hidden) return
    refresh()
  }, 90_000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <UPopover
    v-if="auth.isLoggedIn.value"
    v-model:open="popoverOpen"
    :content="{ side: 'bottom', align: 'end' }"
    :ui="{ content: 'p-0 overflow-hidden min-w-[min(100vw-2rem,20rem)] max-w-sm' }"
  >
    <div class="relative inline-flex">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-bell"
        :aria-label="'Powiadomienia'"
        :loading="loading && items.length === 0"
      />
      <span
        v-if="items.length > 0"
        class="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white ring-2 ring-bg"
      >
        {{ items.length > 99 ? '99+' : items.length }}
      </span>
    </div>

    <template #content>
      <div class="border-b border-default px-3 py-2">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Powiadomienia
        </p>
      </div>

      <div class="max-h-[min(70vh,22rem)] overflow-y-auto">
        <div
          v-if="!loading && items.length === 0"
          class="px-4 py-8 text-center text-sm text-muted"
        >
          Brak powiadomień
        </div>

        <div
          v-for="n in items"
          :key="n.id"
          role="button"
          tabindex="0"
          class="group flex gap-2 border-b border-default px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/40"
          :class="resolveLink(n) ? 'cursor-pointer' : 'cursor-default'"
          @click="onRowClick(n)"
          @keydown.enter="onRowClick(n)"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-highlighted leading-snug">
              {{ n.title }}
            </p>
            <p class="mt-0.5 text-xs text-muted leading-snug">
              {{ n.body }}
            </p>
            <p class="mt-1 text-[10px] text-muted/80">
              {{ relativeTime(n.created_at) }}
            </p>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            class="shrink-0 opacity-60 hover:opacity-100"
            square
            aria-label="Usuń powiadomienie"
            @click="onRemove(n.id, $event)"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
