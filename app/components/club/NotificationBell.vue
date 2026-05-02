<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { ClubNotification } from '~/types/notifications'
import { getApiErrorMessage } from '~/composables/useApi'

const auth = useAuth()
const toast = useToast()
const { resolveLink } = useNotificationLinks()
const { items, loading, refresh, remove, clearLocal } = useNotifications()

const popoverOpen = ref(false)

let pollTimer: ReturnType<typeof setInterval> | undefined

function relativeTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: pl })
  } catch {
    return ''
  }
}

async function onRemove(id: string, e: Event) {
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

function onRowClick(n: ClubNotification) {
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
    :ui="{
      content:
        'p-0 overflow-hidden min-w-[min(100vw-2rem,21rem)] max-w-sm rounded-xl shadow-xl ring-1 ring-default/60'
    }"
  >
    <div class="relative inline-flex">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-bell"
        :aria-label="'Powiadomienia'"
        :loading="loading && items.length === 0"
        class="rounded-full"
      />
      <span
        v-if="items.length > 0"
        class="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-bg"
      >
        {{ items.length > 99 ? '99+' : items.length }}
      </span>
    </div>

    <template #content>
      <div class="border-b border-default bg-muted/30 px-4 py-2.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Powiadomienia
        </p>
      </div>

      <div class="max-h-[min(70vh,24rem)] overflow-y-auto overscroll-contain">
        <div
          v-if="!loading && items.length === 0"
          class="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted"
        >
          <UIcon
            name="i-lucide-bell-off"
            class="size-9 opacity-40"
          />
          <span>Brak powiadomień</span>
        </div>

        <div
          v-for="n in items"
          :key="n.id"
          role="button"
          tabindex="0"
          class="group flex gap-2 border-b border-default px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-primary/[0.06]"
          :class="resolveLink(n) ? 'cursor-pointer' : 'cursor-default'"
          @click="onRowClick(n)"
          @keydown.enter="onRowClick(n)"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold leading-snug text-highlighted">
              {{ n.title }}
            </p>
            <p class="mt-1 text-xs leading-snug text-muted">
              {{ n.body }}
            </p>
            <p class="mt-1.5 text-[10px] text-muted/75">
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
            type="button"
            @click.stop="onRemove(n.id, $event)"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
