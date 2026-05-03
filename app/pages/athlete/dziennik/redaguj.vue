<script setup lang="ts">
import type { Athlete, TrainingLogEntry } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'
import { stripHtmlTags } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'

definePageMeta({
  middleware: 'athlete-dziennik',
  layout: false
})

const route = useRoute()
const apiFetch = useApi()
const toast = useToast()
const auth = useAuth()

const wpisId = computed(() => String(route.query.wpis || '').trim())

function isEntryMine(e: TrainingLogEntry) {
  const uid = auth.user.value?.id
  return !!uid && e.author_user_id === uid
}

type DiaryBundle = { athlete: Athlete | null, entries: TrainingLogEntry[] }

const { data: bundle } = await useAsyncData(
  'athlete-diary-compose',
  async (): Promise<DiaryBundle> => {
    const athlete = await apiFetch<Athlete>('/api/athletes/me').catch(() => null)
    if (!athlete?.id) {
      return { athlete: null, entries: [] }
    }
    const entries = await apiFetch<TrainingLogEntry[]>(`/api/athletes/${athlete.id}/training-log`).catch(
      () => [] as TrainingLogEntry[]
    )
    return { athlete, entries }
  },
  { default: () => ({ athlete: null, entries: [] }) }
)

const meAthlete = computed(() => bundle.value?.athlete ?? null)
const entries = computed(() => bundle.value?.entries ?? [])
const athleteId = computed(() => meAthlete.value?.id ?? '')

const form = reactive({
  session_date: new Date().toISOString().slice(0, 10),
  title: '',
  notes: '<p></p>'
})

const saving = ref(false)
/** Podgląd HTML bez opuszczania strony — jednym przyciskiem wracasz do edycji. */
const previewOpen = ref(false)

const sanitizedNotesPreview = computed(() => sanitizeRichHtml(form.notes.trim()))

watch([wpisId, entries], () => {
  if (!wpisId.value) {
    form.session_date = new Date().toISOString().slice(0, 10)
    form.title = ''
    form.notes = '<p></p>'
    return
  }
  const e = entries.value.find(x => x.id === wpisId.value)
  if (e) {
    form.session_date = e.session_date.slice(0, 10)
    form.title = e.title || ''
    form.notes = e.notes
  }
}, { immediate: true })

const pageTitle = computed(() => (wpisId.value ? 'Edytuj wpis' : 'Nowy wpis'))

async function save() {
  const aid = athleteId.value
  if (!aid) {
    toast.add({ title: 'Brak profilu zawodnika', color: 'warning' })
    return
  }

  const notes = sanitizeRichHtml(form.notes.trim())
  if (!stripHtmlTags(notes)) {
    toast.add({ title: 'Uzupełnij treść wpisu', color: 'warning' })
    return
  }

  if (wpisId.value) {
    const entry = entries.value.find(x => x.id === wpisId.value)
    if (!entry) {
      toast.add({ title: 'Nie znaleziono wpisu', color: 'error' })
      return
    }
    if (!isEntryMine(entry)) {
      toast.add({
        title: 'Brak uprawnień',
        description: 'Możesz edytować tylko wpisy, które sam utworzyłeś.',
        color: 'warning'
      })
      return
    }
  }

  saving.value = true
  try {
    if (wpisId.value) {
      await apiFetch(`/api/athletes/${aid}/training-log/${wpisId.value}`, {
        method: 'PATCH',
        body: {
          session_date: form.session_date,
          title: form.title.trim(),
          notes
        }
      })
      toast.add({ title: 'Zapisano', color: 'success' })
    } else {
      await apiFetch(`/api/athletes/${aid}/training-log`, {
        method: 'POST',
        body: {
          session_date: form.session_date,
          title: form.title.trim() || undefined,
          notes
        }
      })
      toast.add({ title: 'Dodano wpis', color: 'success' })
    }
    await navigateTo('/athlete/dziennik')
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

function cancel() {
  void navigateTo('/athlete/dziennik')
}

useSeoMeta({
  title: 'Dziennik — redakcja wpisu',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <div class="slavia-diary-compose flex min-h-[100dvh] flex-col bg-background">
    <header class="sticky top-0 z-50 border-b border-default/70 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      <div class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div class="min-w-0">
          <p class="text-[11px] font-bold uppercase tracking-wider text-primary">
            Twój dziennik
          </p>
          <h1 class="truncate text-lg font-bold text-highlighted">
            {{ pageTitle }}
          </h1>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-x"
            @click="cancel"
          >
            Zamknij
          </UButton>
          <UButton
            v-if="previewOpen"
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-pencil"
            @click="previewOpen = false"
          >
            Edycja
          </UButton>
          <UButton
            v-else
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-eye"
            @click="previewOpen = true"
          >
            Podgląd
          </UButton>
          <UButton
            size="sm"
            :loading="saving"
            icon="i-lucide-save"
            @click="save"
          >
            Zapisz
          </UButton>
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div
        v-if="!meAthlete"
        class="mx-auto max-w-md py-16 text-center text-muted"
      >
        Brak profilu zawodnika — nie możesz zapisywać wpisów.
      </div>
      <div
        v-else
        class="mx-auto max-w-3xl space-y-6"
      >
        <UCard
          v-if="previewOpen"
          class="overflow-hidden rounded-2xl ring-1 ring-primary/15"
        >
          <template #header>
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Podgląd wpisu
                </p>
                <p class="mt-1 text-sm text-muted">
                  {{ form.session_date }} · {{ form.title.trim() || 'bez tematu' }}
                </p>
              </div>
              <UButton
                color="primary"
                variant="soft"
                size="sm"
                icon="i-lucide-pencil"
                @click="previewOpen = false"
              >
                Wróć do edycji
              </UButton>
            </div>
          </template>
          <div class="p-4 sm:p-6">
            <!-- eslint-disable vue/no-v-html — sanitizeRichHtml (DOMPurify) -->
            <div
              class="slavia-rich-content prose prose-lg prose-neutral max-w-none leading-relaxed dark:prose-invert"
              v-html="sanitizedNotesPreview"
            />
            <!-- eslint-enable vue/no-v-html -->
          </div>
        </UCard>

        <template v-else>
          <div class="grid gap-5 sm:grid-cols-2">
            <UFormField
              label="Data jednostki"
              required
            >
              <UInput
                v-model="form.session_date"
                type="date"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Temat (opcjonalnie)">
              <UInput
                v-model="form.title"
                placeholder="np. Przysiad / technika"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField
            label="Treść / obciążenia / uwagi"
            description="Pełny edytor na cały ekran — wygodniejszy przy dłuższych notatkach."
            required
          >
            <ClubRichTextEditor
              v-model="form.notes"
              placeholder="Opisz przebieg treningu…"
              min-height="min(72vh, 620px)"
              class="w-full"
            />
          </UFormField>
        </template>
      </div>
    </main>
  </div>
</template>
