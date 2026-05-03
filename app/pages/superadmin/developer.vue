<script setup lang="ts">
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { useBrowserNotifications } from '~/composables/useBrowserNotifications'
import type { DevSuperadminLogLevel } from '~/composables/useDevSuperadminLogs'
import { useDevSuperadminLogs } from '~/composables/useDevSuperadminLogs'
import { usePwaInstall } from '~/composables/usePwaInstall'
import { DEV_TOOL_LINK_GROUPS } from '~/data/devToolsCatalog'
import type { ExperimentalFeatureId } from '~/data/experimentalFeaturesCatalog'
import type { CompetitionResult } from '~/types/models'

definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Ustawienia developera — Superadmin',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()
const experimental = useExperimentalFeatures()

function resetExperimentalDefaults() {
  experimental.resetAllToDefaults()
  toast.add({ title: 'Przywrócono domyślne wartości funkcji eksperymentalnych', color: 'success' })
}

/** Spłaszczone wartości dla USwitch (vue-tsc indeksuje poprawnie niż zagnieżdżony ComputedRef). */
const experimentalResolved = computed(() => experimental.enabledMap.value)

const experimentalKillDeploy = computed(() => experimental.killSwitchRaw.value)

function setExperimentalFlag(id: string, value: boolean) {
  if (experimental.isForcedOffByDeploy(id)) {
    toast.add({
      title: 'Funkcja wyłączona na deployu',
      description: `Zmienna NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH blokuje „${id}”. Usuń ten identyfikator z listy i przebuduj aplikację.`,
      color: 'warning'
    })
    return
  }
  experimental.setFlag(id as ExperimentalFeatureId, value)
}

function isExperimentalLocked(id: string) {
  return experimental.isForcedOffByDeploy(id)
}
const config = useRuntimeConfig()
const { enabled, permission, supported, requestPermission, setEnabled, notify } = useBrowserNotifications()
const { supported: pwaSupported, canPrompt, promptInstall, installed } = usePwaInstall()
const pwaExperimentEnabled = useExperimentalFlag('pwa_service_worker')

const userAgentDisplay = ref('')
const systemLogs = useDevSuperadminLogs()

const systemLogRows = computed(() => systemLogs.items.value)

const buildMeta = computed(() => `Środowisko: ${import.meta.dev ? 'development' : 'production'} · klient`)

const devLinkGroups = DEV_TOOL_LINK_GROUPS

const apiPingMs = ref<number | null>(null)

function isExternalHref(to: string) {
  return /^https?:\/\//i.test(to)
}

onMounted(() => {
  systemLogs.load()
  if (import.meta.client) {
    userAgentDisplay.value = navigator.userAgent
  }
})

function formatLogTs(ts: number) {
  return format(ts, 'dd.MM.yyyy HH:mm:ss', { locale: pl })
}

function logLevelColor(level: DevSuperadminLogLevel) {
  if (level === 'error') {
    return 'error'
  }
  if (level === 'warn') {
    return 'warning'
  }
  if (level === 'change') {
    return 'primary'
  }
  return 'neutral'
}

function downloadLogsExport() {
  if (!import.meta.client) {
    return
  }
  const blob = new Blob([systemLogs.exportJson()], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `slavia-dev-logs-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: 'Wyeksportowano logi JSON', color: 'success' })
}

function toggleReducedMotionDev() {
  if (!import.meta.client) {
    return
  }
  const on = document.documentElement.classList.toggle('slavia-dev-force-reduced-motion')
  toast.add({
    title: on ? 'Włączono symulację „reduced motion”' : 'Wyłączono symulację „reduced motion”',
    color: 'info'
  })
}

function logRouteSummary() {
  if (!import.meta.client) {
    return
  }
  systemLogs.push({
    level: 'info',
    title: `Podgląd ścieżki: ${window.location.pathname}`,
    detail: window.location.href
  })
  toast.add({ title: 'Dodano wpis logu (ścieżka)', color: 'success' })
}

const {
  data: status,
  refresh: refreshDeveloperStatus,
  pending: developerStatusPending
} = await useAsyncData('superadmin-developer-status', async () => {
  const [posts, athletes, competitions, pending] = await Promise.all([
    apiFetch('/api/posts').catch(() => []),
    apiFetch('/api/athletes/admin').catch(() => []),
    apiFetch('/api/competitions').catch(() => []),
    apiFetch<CompetitionResult[]>('/api/results/pending').catch(() => [])
  ])

  return {
    postsCount: Array.isArray(posts) ? posts.length : 0,
    athletesCount: Array.isArray(athletes) ? athletes.length : 0,
    competitionsCount: Array.isArray(competitions) ? competitions.length : 0,
    pendingCount: Array.isArray(pending) ? pending.length : 0
  }
})

async function sendTestNotification() {
  if (!import.meta.client || !supported) {
    toast.add({ title: 'Twoja przeglądarka nie obsługuje systemowych powiadomień', color: 'warning' })
    return
  }

  const permissionResult = permission.value === 'granted' ? 'granted' : await requestPermission()
  if (permissionResult !== 'granted') {
    toast.add({ title: 'Powiadomienia blokowane', description: 'Ustaw uprawnienia przeglądarki, aby otrzymać testowe powiadomienie.', color: 'warning' })
    return
  }

  setEnabled(true)
  notify('Testowe powiadomienie', {
    body: 'To jest testowe powiadomienie systemowe z panelu developera.',
    icon: '/logo.png'
  })
  toast.add({ title: 'Testowe powiadomienie wysłane', color: 'success' })
}

async function installPwa() {
  if (!import.meta.client) {
    return
  }
  if (!pwaExperimentEnabled.value) {
    toast.add({
      title: 'PWA wyłączone',
      description: 'Włącz funkcję „PWA — service worker” w sekcji eksperymentalnej lub usuń wpis z kill switcha deployu.',
      color: 'warning'
    })
    return
  }
  if (installed.value) {
    toast.add({ title: 'Aplikacja jest już zainstalowana', color: 'info' })
    return
  }
  if (!canPrompt.value) {
    toast.add({
      title: 'Instalacja niedostępna',
      description: pwaSupported
        ? 'Spełnij kryteria PWA (HTTPS, manifest, service worker) i poczekaj na prompt przeglądarki — na desktopie działa m.in. Chrome i Edge.'
        : 'Ta przeglądarka nie wyświetla instalacji ze strony (np. Firefox lub Safari).',
      color: 'warning'
    })
    return
  }

  const accepted = await promptInstall()
  toast.add({
    title: accepted ? 'Aplikacja zainstalowana' : 'Instalacja anulowana',
    color: accepted ? 'success' : 'info'
  })
}

async function copyToClipboard(text: string, successTitle: string) {
  if (!import.meta.client || !text) {
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: successTitle, color: 'success' })
  } catch {
    toast.add({ title: 'Nie udało się skopiować do schowka', color: 'error' })
  }
}

function copyCurrentUrl() {
  if (!import.meta.client) {
    return
  }
  void copyToClipboard(window.location.href, 'Skopiowano adres bieżącej strony')
}

function copySiteUrl() {
  const base = config.public.siteUrl?.replace(/\/$/, '') ?? ''
  void copyToClipboard(base, 'Skopiowano publiczny URL strony (siteUrl)')
}

function copyApiBase() {
  const base = config.public.apiBase?.replace(/\/$/, '') ?? ''
  void copyToClipboard(base, 'Skopiowano API base URL')
}

function hardReload() {
  if (!import.meta.client) {
    return
  }
  window.location.reload()
}

async function clearWebStorage() {
  if (!import.meta.client) {
    return
  }
  const ok = window.confirm('Wyczyścić localStorage i sessionStorage dla tej domeny? Wyloguje to sesje oparte o pamięć przeglądarki.')
  if (!ok) {
    return
  }
  try {
    localStorage.clear()
    sessionStorage.clear()
    toast.add({ title: 'Pamięć lokalna wyczyszczona', description: 'Odśwież stronę, jeśli coś działa nietypowo.', color: 'success' })
  } catch {
    toast.add({ title: 'Nie udało się wyczyścić pamięci', color: 'error' })
  }
}

async function unregisterServiceWorkers() {
  if (!import.meta.client || !('serviceWorker' in navigator)) {
    toast.add({ title: 'Brak service workerów w tej przeglądarce', color: 'warning' })
    return
  }
  try {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map(r => r.unregister()))
    toast.add({
      title: 'Service workery wyrejestrowane',
      description: regs.length ? `Liczba: ${regs.length}. Odśwież stronę, aby załadować SW od nowa.` : 'Nie znaleziono aktywnych rejestracji.',
      color: 'success'
    })
  } catch {
    toast.add({ title: 'Nie udało się wyrejestrować SW', color: 'error' })
  }
}

function buildEnvDump(): Record<string, unknown> {
  const u = auth.user.value
  return {
    capturedAt: new Date().toISOString(),
    build: import.meta.dev ? 'development' : 'production',
    siteUrl: config.public.siteUrl ?? null,
    apiBase: config.public.apiBase ?? null,
    path: import.meta.client ? window.location.pathname : null,
    href: import.meta.client ? window.location.href : null,
    online: import.meta.client ? navigator.onLine : null,
    language: import.meta.client ? navigator.language : null,
    userAgent: import.meta.client ? navigator.userAgent : null,
    viewport: import.meta.client
      ? {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        }
      : null,
    user: u
      ? {
          id: u.id,
          username: u.username,
          role: u.role,
          email: u.email
        }
      : null
  }
}

async function copyEnvDumpJson() {
  await copyToClipboard(JSON.stringify(buildEnvDump(), null, 2), 'Skopiowano JSON środowiska (bez sekretów)')
}

async function copyNavigatorSummary() {
  if (!import.meta.client) {
    return
  }
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string, downlink?: number }
    deviceMemory?: number
  }
  const payload = {
    language: nav.language,
    languages: [...(nav.languages || [])],
    cookieEnabled: nav.cookieEnabled,
    platform: nav.platform,
    hardwareConcurrency: nav.hardwareConcurrency,
    maxTouchPoints: nav.maxTouchPoints,
    deviceMemory: nav.deviceMemory,
    connection: nav.connection
      ? {
          effectiveType: nav.connection.effectiveType,
          downlink: nav.connection.downlink
        }
      : undefined
  }
  await copyToClipboard(JSON.stringify(payload, null, 2), 'Skopiowano podsumowanie Navigator')
}

async function copyLocalStorageKeys() {
  if (!import.meta.client) {
    return
  }
  const keys = Object.keys(localStorage).sort()
  await copyToClipboard(keys.join('\n') || '(pusto)', 'Skopiowano klucze localStorage')
}

function copyViewportString() {
  if (!import.meta.client) {
    return
  }
  const s = `${window.innerWidth}×${window.innerHeight}px · DPR ${window.devicePixelRatio}`
  void copyToClipboard(s, 'Skopiowano rozmiar viewport')
}

async function copyMemoryHint() {
  if (!import.meta.client) {
    return
  }
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number, totalJSHeapSize: number, jsHeapSizeLimit: number } }
  if (!perf.memory) {
    toast.add({ title: 'performance.memory niedostępne (np. Firefox)', color: 'warning' })
    return
  }
  const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = perf.memory
  const lines = [
    `usedJSHeapSize: ${usedJSHeapSize}`,
    `totalJSHeapSize: ${totalJSHeapSize}`,
    `jsHeapSizeLimit: ${jsHeapSizeLimit}`
  ]
  await copyToClipboard(lines.join('\n'), 'Skopiowano metryki heap (Chrome)')
}

async function pingApiLatency() {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
  try {
    await apiFetch('/api/posts').catch(() => [])
    const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0)
    apiPingMs.value = ms
    systemLogs.push({
      level: 'info',
      title: `Ping GET /api/posts`,
      detail: `${ms} ms (czas do pierwszej odpowiedzi)`
    })
    toast.add({ title: `API ~${ms} ms`, color: 'success' })
  } catch (e) {
    apiPingMs.value = null
    toast.add({ title: 'Żądanie nie powiodło się', description: String(e), color: 'error' })
  }
}

async function clearBrowserCachesApi() {
  if (!import.meta.client || !('caches' in window)) {
    toast.add({ title: 'Cache Storage niedostępny', color: 'warning' })
    return
  }
  try {
    const keys = await caches.keys()
    await Promise.all(keys.map(k => caches.delete(k)))
    toast.add({
      title: 'Cache Storage wyczyszczony',
      description: keys.length ? `Liczba wpisów: ${keys.length}` : 'Brak wpisów cache.',
      color: 'success'
    })
  } catch {
    toast.add({ title: 'Nie udało się wyczyścić Cache Storage', color: 'error' })
  }
}

function logOnlineStatus() {
  if (!import.meta.client) {
    return
  }
  systemLogs.push({
    level: 'info',
    title: `Navigator.onLine = ${navigator.onLine}`,
    detail: window.location.href
  })
  toast.add({ title: 'Status połączenia zapisany w logach', color: 'success' })
}

const DEV_LS_SELFTEST = 'slavia-developer-ls-selftest'
const DEV_SS_SELFTEST = 'slavia-developer-ss-selftest'

function testLocalStorageRoundtrip() {
  if (!import.meta.client) {
    return
  }
  try {
    const val = `ok@${Date.now()}`
    localStorage.setItem(DEV_LS_SELFTEST, val)
    const read = localStorage.getItem(DEV_LS_SELFTEST)
    localStorage.removeItem(DEV_LS_SELFTEST)
    const ok = read === val
    systemLogs.push({
      level: ok ? 'info' : 'error',
      title: 'Test localStorage (zapis / odczyt / kasowanie)',
      detail: ok ? 'Wynik zgodny z zapisem.' : `Oczekiwano „${val}”, odczyt: „${read ?? '(null)'}”.`
    })
    toast.add({
      title: ok ? 'localStorage działa poprawnie' : 'localStorage — niezgodność odczytu',
      color: ok ? 'success' : 'error'
    })
  } catch (e) {
    systemLogs.push({
      level: 'error',
      title: 'Test localStorage — wyjątek',
      detail: String(e)
    })
    toast.add({ title: 'localStorage niedostępny lub zablokowany', description: String(e), color: 'error' })
  }
}

function testSessionStorageRoundtrip() {
  if (!import.meta.client) {
    return
  }
  try {
    const val = `ss@${Date.now()}`
    sessionStorage.setItem(DEV_SS_SELFTEST, val)
    const read = sessionStorage.getItem(DEV_SS_SELFTEST)
    sessionStorage.removeItem(DEV_SS_SELFTEST)
    const ok = read === val
    systemLogs.push({
      level: ok ? 'info' : 'error',
      title: 'Test sessionStorage',
      detail: ok ? 'OK' : `Oczekiwano „${val}”, odczyt: „${read ?? '(null)'}”.`
    })
    toast.add({
      title: ok ? 'sessionStorage OK' : 'sessionStorage — błąd',
      color: ok ? 'success' : 'error'
    })
  } catch (e) {
    toast.add({ title: 'sessionStorage — wyjątek', description: String(e), color: 'error' })
  }
}

async function runApiSmokeTests() {
  const endpoints: { path: string, label: string }[] = [
    { path: '/api/posts', label: 'Blog (lista publiczna)' },
    { path: '/api/competitions', label: 'Zawody' },
    { path: '/api/auth/me', label: 'Sesja (/auth/me)' },
    { path: '/api/notifications', label: 'Powiadomienia (skrzynka)' }
  ]
  for (const { path, label } of endpoints) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    try {
      await apiFetch(path).catch(() => null)
      const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0)
      systemLogs.push({
        level: 'info',
        title: `Smoke API: ${label}`,
        detail: `${path} · ~${ms} ms`
      })
    } catch (e) {
      systemLogs.push({
        level: 'warn',
        title: `Smoke API: ${label}`,
        detail: `${path} · ${String(e)}`
      })
    }
  }
  toast.add({
    title: 'Smoke API — wykonano',
    description: 'Cztery żądania zapisane w logach lokalnych (patrz sekcja na dole strony).',
    color: 'success'
  })
}

function logMediaAndUiCaps() {
  if (!import.meta.client) {
    return
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const darkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  const contrastMore = window.matchMedia('(prefers-contrast: more)').matches
  const standalone =
    typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches
  const lines = [
    `prefers-reduced-motion: ${reducedMotion ? 'reduce' : 'no-preference'}`,
    `prefers-color-scheme: ${darkScheme ? 'dark' : 'light'}`,
    `prefers-contrast: ${contrastMore ? 'more' : 'normal'}`,
    `display-mode standalone: ${standalone ? 'tak' : 'nie'}`,
    `visibilityState: ${document.visibilityState}`,
    `document.hasFocus(): ${document.hasFocus()}`
  ].join('\n')
  systemLogs.push({
    level: 'info',
    title: 'Preferencje wyświetlania i stan dokumentu',
    detail: lines
  })
  toast.add({ title: 'Zapisano preferencje UI w logach', color: 'success' })
}

function logScreenGeometry() {
  if (!import.meta.client) {
    return
  }
  const so = screen.orientation?.type ?? '(brak API)'
  const angle = screen.orientation?.angle ?? NaN
  const detail = [
    `screen: ${screen.width}×${screen.height}`,
    `avail: ${screen.availWidth}×${screen.availHeight}`,
    `window (inner): ${window.innerWidth}×${window.innerHeight}`,
    `devicePixelRatio: ${window.devicePixelRatio}`,
    `orientation: ${so}${Number.isFinite(angle) ? ` (${angle}°)` : ''}`
  ].join('\n')
  systemLogs.push({ level: 'info', title: 'Geometria ekranu / okna', detail })
  toast.add({ title: 'Geometria ekranu — wpis w logach', color: 'success' })
}

async function toggleFullscreenDev() {
  if (!import.meta.client) {
    return
  }
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      toast.add({ title: 'Pełny ekran włączony', color: 'info' })
    } else {
      await document.exitFullscreen()
      toast.add({ title: 'Pełny ekran wyłączony', color: 'info' })
    }
  } catch (e) {
    toast.add({ title: 'Fullscreen niedostępny', description: String(e), color: 'warning' })
  }
}

function toastStorageApisAvailability() {
  if (!import.meta.client) {
    return
  }
  const idb = 'indexedDB' in window
  const caches = 'caches' in window
  const share = typeof navigator !== 'undefined' && 'share' in navigator
  const geo = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const vibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  const detail = `indexedDB: ${idb ? 'tak' : 'nie'}\ncaches: ${caches ? 'tak' : 'nie'}\nnavigator.share: ${share ? 'tak' : 'nie'}\ngeolocation: ${geo ? 'tak' : 'nie'}\nvibrate: ${vibrate ? 'tak' : 'nie'}`
  systemLogs.push({ level: 'info', title: 'Dostępność API przeglądarki', detail })
  toast.add({ title: 'API (IDB / cache / share / geo / vibrate)', description: 'Szczegóły w logach.', color: 'success' })
}

function testVibrateShort() {
  if (!import.meta.client || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    toast.add({ title: 'navigator.vibrate niedostępny', description: 'Typowo desktop lub przeglądarka bez API.', color: 'warning' })
    return
  }
  navigator.vibrate(40)
  toast.add({ title: 'Wysłano krótką wibrację', color: 'success' })
}

function openCurrentUrlNewTab() {
  if (!import.meta.client) {
    return
  }
  window.open(window.location.href, '_blank', 'noopener,noreferrer')
  toast.add({ title: 'Otwarto duplikat karty', color: 'info' })
}

function downloadDevSelftestFile() {
  if (!import.meta.client) {
    return
  }
  const blob = new Blob(
    [`Slavia developer tools — test pobrania pliku\n`, `czas UTC: ${new Date().toISOString()}\n`, `href: ${window.location.href}\n`],
    { type: 'text/plain;charset=utf-8' }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `slavia-dev-download-test-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: 'Rozpoczęto pobieranie pliku testowego', color: 'success' })
}
</script>

<template>
  <UContainer class="py-8 sm:py-12 lg:py-16">
    <div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.25em] text-primary">Ustawienia developera</p>
        <h1 class="mt-3 text-3xl font-black tracking-tight text-highlighted sm:text-4xl">
          Superadmin developer tools
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Szybkie narzędzia dla testów i weryfikacji działania aplikacji bez przełączania paneli.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton to="/superadmin" variant="soft" color="neutral" icon="i-lucide-arrow-left">
          Powrót do głównego panelu
        </UButton>
      </div>
    </div>

    <!-- Siatka: na xl trzy kolumny — większość kart obok siebie zamiast jednej długiej kolumny -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:items-start">
        <UCard class="rounded-3xl border-default/60 p-5 shadow-md md:col-span-2 xl:col-span-3 sm:p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.18em] text-muted">Statystyki API</p>
              <p class="mt-2 max-w-xl text-xs leading-relaxed text-muted">
                Zliczenia list z backendu — przydatne przy smoke testach po deployu.
              </p>
            </div>
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              icon="i-lucide-refresh-cw"
              :loading="developerStatusPending"
              @click="refreshDeveloperStatus()"
            >
              Odśwież liczniki
            </UButton>
          </div>
          <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl border border-default/60 bg-muted/10 p-4 text-center">
              <p class="text-xs uppercase tracking-[0.2em] text-muted">Wpisy blogowe</p>
              <p class="mt-3 text-3xl font-black text-highlighted">{{ status?.postsCount ?? 0 }}</p>
            </div>
            <div class="rounded-2xl border border-default/60 bg-muted/10 p-4 text-center">
              <p class="text-xs uppercase tracking-[0.2em] text-muted">Zawodnicy</p>
              <p class="mt-3 text-3xl font-black text-highlighted">{{ status?.athletesCount ?? 0 }}</p>
            </div>
            <div class="rounded-2xl border border-default/60 bg-muted/10 p-4 text-center">
              <p class="text-xs uppercase tracking-[0.2em] text-muted">Zawody</p>
              <p class="mt-3 text-3xl font-black text-highlighted">{{ status?.competitionsCount ?? 0 }}</p>
            </div>
            <div class="rounded-2xl border border-default/60 bg-muted/10 p-4 text-center">
              <p class="text-xs uppercase tracking-[0.2em] text-muted">Wyniki oczekujące</p>
              <p class="mt-3 text-3xl font-black text-highlighted">{{ status?.pendingCount ?? 0 }}</p>
            </div>
          </div>
          <p
            v-if="apiPingMs != null"
            class="mt-4 text-center font-mono text-xs text-muted"
          >
            Ostatni ping <span class="text-highlighted">GET /api/posts</span>: {{ apiPingMs }} ms
          </p>
        </UCard>

        <UCard class="rounded-3xl border-default/60 p-5 shadow-md xl:col-span-1 sm:p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.18em] text-muted">Funkcje eksperymentalne</p>
              <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Przełączniki dla funkcji w fazie rozwoju. Domyślnie zapis w tej przeglądarce (localStorage).
                Na produkcji możesz wymusić wyłączenie poza przeglądarką przez zmienną środowiskową przy buildzie.
              </p>
              <UAlert
                v-if="experimentalKillDeploy"
                class="mt-4 text-xs"
                color="warning"
                variant="subtle"
                title="Aktywny kill switch (deploy)"
              >
                <p class="leading-relaxed">
                  <code class="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH</code>
                  =
                  <span class="font-mono text-highlighted">{{ experimentalKillDeploy }}</span>
                </p>
                <p class="mt-2 text-muted">
                  Te funkcje są zablokowane niezależnie od przełączników — usuń identyfikator z listy i wykonaj nowy deploy.
                </p>
              </UAlert>
            </div>
            <UButton
              v-if="experimental.definitions.length > 0"
              size="sm"
              variant="soft"
              color="neutral"
              icon="i-lucide-rotate-ccw"
              @click="resetExperimentalDefaults"
            >
              Domyślne wartości
            </UButton>
          </div>

          <div
            v-if="experimental.definitions.length === 0"
            class="mt-6 rounded-xl border border-dashed border-default/60 bg-muted/10 px-4 py-8 text-center text-sm text-muted"
          >
            Brak zarejestrowanych flag — dodaj wpisy w pliku
            <code class="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">app/data/experimentalFeaturesCatalog.ts</code>.
          </div>

          <ul
            v-else
            class="mt-6 divide-y divide-default/50 rounded-xl border border-default/60 bg-muted/5"
          >
            <li
              v-for="def in experimental.definitions"
              :key="def.id"
              class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-highlighted">
                  {{ def.label }}
                </p>
                <p class="mt-1 text-xs leading-relaxed text-muted">
                  {{ def.description }}
                </p>
                <p class="mt-2 font-mono text-[10px] text-muted/80">
                  {{ def.id }}
                  <span class="text-muted">
                    · domyślnie {{ def.defaultEnabled ? 'włączone' : 'wyłączone' }}
                  </span>
                  <UBadge
                    v-if="isExperimentalLocked(def.id)"
                    class="ml-2 align-middle"
                    color="warning"
                    variant="subtle"
                    size="xs"
                  >
                    deploy OFF
                  </UBadge>
                </p>
              </div>
              <USwitch
                :disabled="isExperimentalLocked(def.id)"
                :model-value="experimentalResolved[def.id] ?? def.defaultEnabled"
                @update:model-value="setExperimentalFlag(def.id, $event)"
              />
            </li>
          </ul>
        </UCard>

        <UCard class="rounded-3xl border-default/60 p-5 shadow-md md:col-span-2 xl:col-span-2 sm:p-6">
          <p class="text-xs uppercase tracking-[0.18em] text-muted">Testy funkcjonalności</p>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            Powiadomienia i PWA oraz szybkie testy API, magazynów przeglądarki i możliwości UI — wpisy trafiają do logów lokalnych na tej stronie.
          </p>
          <div class="mt-5 grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <div class="flex flex-col gap-3">
              <p class="text-[11px] font-bold uppercase tracking-wider text-muted">
                Powiadomienia i PWA
              </p>
              <UButton
                color="primary"
                block
                @click="sendTestNotification"
              >
                Wyślij testowe powiadomienie
              </UButton>
              <UButton
                color="secondary"
                block
                :disabled="!pwaExperimentEnabled"
                @click="installPwa"
              >
                Uruchom instalację PWA
              </UButton>
            </div>
            <div class="flex flex-col gap-3">
              <UAlert color="info" variant="subtle" title="Powiadomienia przeglądarki" class="text-sm">
                <p>Obsługiwane: {{ supported ? 'tak' : 'nie' }}</p>
                <p>Uprawnienia: {{ permission }}</p>
                <p>Systemowe powiadomienia włączone: {{ enabled ? 'tak' : 'nie' }}</p>
              </UAlert>
              <UAlert color="neutral" variant="subtle" title="PWA / instalacja" class="text-sm">
                <p>API <code class="text-xs">beforeinstallprompt</code>: {{ pwaSupported ? 'tak' : 'nie' }}</p>
                <p>Prompt przeglądarki gotowy: {{ canPrompt ? 'tak' : 'nie' }}</p>
                <p>Oznaczenie zainstalowanej aplikacji (sesja): {{ installed ? 'tak' : 'nie' }}</p>
              </UAlert>
            </div>
          </div>

          <div class="mt-8 border-t border-default/50 pt-6">
            <p class="text-[11px] font-bold uppercase tracking-wider text-muted">
              Backend — smoke (zalogowana sesja)
            </p>
            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <UButton color="neutral" variant="outline" icon="i-lucide-zap" block @click="runApiSmokeTests">
                Smoke: 4 endpointy → logi
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-wifi" block @click="pingApiLatency">
                Ping wyłącznie GET /api/posts
              </UButton>
            </div>
          </div>

          <div class="mt-6 border-t border-default/50 pt-6">
            <p class="text-[11px] font-bold uppercase tracking-wider text-muted">
              Magazyn w przeglądarce
            </p>
            <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <UButton color="neutral" variant="outline" icon="i-lucide-database" block @click="testLocalStorageRoundtrip">
                Test localStorage (zapis/odczyt)
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-layers" block @click="testSessionStorageRoundtrip">
                Test sessionStorage
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-package-search" block @click="toastStorageApisAvailability">
                Dostępność IDB / Cache / Share…
              </UButton>
            </div>
          </div>

          <div class="mt-6 border-t border-default/50 pt-6">
            <p class="text-[11px] font-bold uppercase tracking-wider text-muted">
              UI i urządzenie
            </p>
            <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <UButton color="neutral" variant="outline" icon="i-lucide-contrast" block @click="logMediaAndUiCaps">
                Preferencje (motion / motyw / focus)
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-monitor" block @click="logScreenGeometry">
                Geometria ekranu i orientacja
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-maximize" block @click="toggleFullscreenDev">
                Przełącz pełny ekran
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-smartphone" block @click="testVibrateShort">
                Krótka wibracja (mobile)
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-external-link" block @click="openCurrentUrlNewTab">
                Duplikat tej strony (nowa karta)
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-download" block @click="downloadDevSelftestFile">
                Pobierz plik .txt (blob)
              </UButton>
            </div>
          </div>
        </UCard>

        <UCard class="rounded-3xl border-default/60 p-5 shadow-md md:col-span-2 xl:col-span-3 sm:p-6">
          <div class="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <p class="text-xs uppercase tracking-[0.18em] text-muted">Sesja</p>
              <p class="mt-3 text-sm leading-relaxed text-muted">
                Zalogowany jako <span class="font-medium text-highlighted">{{ auth.user.value?.username }}</span>
                <span v-if="auth.user.value?.role"> ({{ auth.user.value.role }})</span>.
                Stąd sprawdzisz powiadomienia, PWA i adresy bez zmiany panelu.
              </p>
            </div>
            <div class="border-t border-default/50 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <p class="text-xs uppercase tracking-[0.18em] text-muted">Ulubione skróty</p>
              <div class="mt-4 grid gap-2 sm:grid-cols-3">
                <UButton to="/superadmin" variant="outline" color="neutral" size="sm" block icon="i-lucide-crown">
                  Panel SuperAdmin
                </UButton>
                <UButton to="/admin/changelog" variant="outline" color="neutral" size="sm" block icon="i-lucide-file-text">
                  Changelog
                </UButton>
                <UButton to="/trainer/analiza-sztangi" variant="outline" color="neutral" size="sm" block icon="i-lucide-scan-line">
                  Analiza sztangi
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="rounded-3xl border-default/60 p-5 shadow-md md:col-span-2 xl:col-span-2 sm:p-6">
          <p class="text-xs uppercase tracking-[0.18em] text-muted">Narzędzia przeglądarki</p>
          <p class="mt-2 text-sm leading-relaxed text-muted">
            Krótkie narzędzia diagnostyczne — działają lokalnie w tej przeglądarce (bez wywołań API poza schowkiem).
          </p>
          <div class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div class="space-y-1.5">
              <UButton color="neutral" variant="outline" icon="i-lucide-link" block @click="copyCurrentUrl">
                Skopiuj URL tej strony
              </UButton>
              <p class="text-xs leading-snug text-muted">
                Pełny adres z parametrami — wygodnie do ticketów lub komunikacji z zespołem.
              </p>
            </div>
            <div class="space-y-1.5">
              <UButton color="neutral" variant="outline" icon="i-lucide-globe" block @click="copySiteUrl">
                Skopiuj siteUrl (NUXT_PUBLIC_SITE_URL)
              </UButton>
              <p class="text-xs leading-snug text-muted">
                Publiczny URL strony z konfiguracji Nuxt — canonical, OG, linki zewnętrzne.
              </p>
            </div>
            <div class="space-y-1.5">
              <UButton color="neutral" variant="outline" icon="i-lucide-server" block @click="copyApiBase">
                Skopiuj API base
              </UButton>
              <p class="text-xs leading-snug text-muted">
                Bazowy adres backendu z runtime — szybka weryfikacja środowiska i proxy.
              </p>
            </div>
            <div class="space-y-1.5">
              <UButton color="neutral" variant="outline" icon="i-lucide-refresh-ccw" block @click="hardReload">
                Twarde odświeżenie strony
              </UButton>
              <p class="text-xs leading-snug text-muted">
                Pełny reload dokumentu — pomaga po zmianach SW, cache lub „zawieszonej” hydracji.
              </p>
            </div>
            <div class="space-y-1.5">
              <UButton color="warning" variant="soft" icon="i-lucide-trash-2" block @click="clearWebStorage">
                Wyczyść localStorage i sessionStorage
              </UButton>
              <p class="text-xs leading-snug text-muted">
                Kasuje dane tej domeny w pamięci przeglądarki (m.in. preferencje nie zapisane na koncie).
              </p>
            </div>
            <div class="space-y-1.5">
              <UButton color="warning" variant="soft" icon="i-lucide-rotate-ccw" block @click="unregisterServiceWorkers">
                Wyrejestruj service workery
              </UButton>
              <p class="text-xs leading-snug text-muted">
                Usuwa rejestracje SW dla originu — przydatne przy debugowaniu PWA i aktualizacji cache.
              </p>
            </div>
            <div class="space-y-1.5">
              <UButton color="neutral" variant="outline" icon="i-lucide-accessibility" block @click="toggleReducedMotionDev">
                Symulacja „reduced motion”
              </UButton>
              <p class="text-xs leading-snug text-muted">
                Przełącza klasę na <code class="font-mono text-[11px]">html</code> aby sprawdzić UI bez animacji (symulacja dostępności).
              </p>
            </div>
            <div class="space-y-1.5">
              <UButton color="neutral" variant="outline" icon="i-lucide-git-branch" block @click="logRouteSummary">
                Zapisz ścieżkę do logów
              </UButton>
              <p class="text-xs leading-snug text-muted">
                Dodaje wpis z aktualnym URL do panelu logów (localStorage) — ślad kroków reprodukcji.
              </p>
            </div>
            <div class="space-y-1.5">
              <UButton color="neutral" variant="outline" icon="i-lucide-maximize-2" block @click="copyViewportString">
                Skopiuj rozmiar viewport
              </UButton>
              <p class="text-xs leading-snug text-muted">
                Wewnętrzna szerokość i wysokość okna oraz devicePixelRatio — layout i media queries.
              </p>
            </div>
            <div class="space-y-1.5">
              <UButton color="neutral" variant="outline" icon="i-lucide-cpu" block @click="copyMemoryHint">
                Skopiuj heap (Chrome)
              </UButton>
              <p class="text-xs leading-snug text-muted">
                <code class="font-mono text-[11px]">performance.memory</code> — tylko Chromium; do diagnozy wycieków po długiej sesji.
              </p>
            </div>
          </div>
          <div class="mt-6 rounded-xl border border-default/60 bg-muted/10 p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">User-Agent</p>
            <pre class="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs text-highlighted">{{ userAgentDisplay || '—' }}</pre>
          </div>
        </UCard>

        <div class="flex flex-col gap-6 md:col-span-2 xl:col-span-1">
          <UCard class="rounded-3xl border-default/60 p-5 shadow-md sm:p-6">
            <p class="text-xs uppercase tracking-[0.18em] text-muted">Zrzuty do schowka</p>
            <p class="mt-2 text-sm leading-relaxed text-muted">
              JSON i listy — bez tokenów sesji; do ticketów i Slacka.
            </p>
            <div class="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <UButton color="neutral" variant="outline" icon="i-lucide-braces" block @click="copyEnvDumpJson">
                JSON środowiska
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-navigation" block @click="copyNavigatorSummary">
                Navigator (JSON)
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-list-tree" block @click="copyLocalStorageKeys">
                Klucze localStorage
              </UButton>
              <UButton color="neutral" variant="outline" icon="i-lucide-activity" block @click="logOnlineStatus">
                onLine → logi
              </UButton>
            </div>
          </UCard>

          <UCard class="rounded-3xl border-default/60 p-5 shadow-md sm:p-6">
            <p class="text-xs uppercase tracking-[0.18em] text-muted">Sieć i Cache Storage</p>
            <p class="mt-2 text-sm leading-relaxed text-muted">
              Ping API oraz <code class="font-mono text-[11px]">caches</code> (nie mylić z service workerem).
            </p>
            <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <UButton color="primary" variant="soft" icon="i-lucide-wifi" block @click="pingApiLatency">
                Ping GET /api/posts
              </UButton>
              <UButton color="warning" variant="soft" icon="i-lucide-database-zap" block @click="clearBrowserCachesApi">
                Wyczyść Cache Storage
              </UButton>
            </div>
          </UCard>
        </div>
    </div>

    <UCard class="mt-6 rounded-3xl border-default/60 p-5 shadow-md sm:p-6">
      <p class="text-xs uppercase tracking-[0.18em] text-muted">Mapa aplikacji</p>
      <p class="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        Wszystkie istotne trasy frontu w jednym miejscu — w tym dokumentacja zewnętrzna (nowa karta).
      </p>
      <div class="mt-8 grid gap-10 lg:grid-cols-2 xl:gap-12">
        <div
          v-for="group in devLinkGroups"
          :key="group.title"
          class="rounded-2xl border border-default/40 bg-muted/5 p-4 sm:p-5"
        >
          <h2 class="text-base font-bold text-highlighted">
            {{ group.title }}
          </h2>
          <p
            v-if="group.description"
            class="mt-1 text-xs leading-relaxed text-muted"
          >
            {{ group.description }}
          </p>
          <div class="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            <UButton
              v-for="link in group.links"
              :key="`${group.title}-${link.label}`"
              :to="link.to"
              variant="outline"
              color="neutral"
              class="h-auto min-h-14 flex-col items-start gap-1 py-3 whitespace-normal text-left"
              :target="isExternalHref(link.to) ? '_blank' : undefined"
              :rel="isExternalHref(link.to) ? 'noopener noreferrer' : undefined"
            >
              <span class="flex w-full items-center gap-2 font-semibold text-highlighted">
                <UIcon
                  :name="link.icon"
                  class="size-4 shrink-0 text-primary"
                />
                {{ link.label }}
              </span>
              <span class="w-full text-xs font-normal leading-snug text-muted">{{ link.description }}</span>
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <UCard class="mt-6 rounded-3xl border-default/60 p-5 shadow-md sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-[0.18em] text-muted">Logi systemowe (podgląd)</p>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Zdarzenia informacyjne, ostrzeżenia, błędy i zmiany — zapis wyłącznie lokalnie w tej przeglądarce (bez backendu).
          </p>
          <p class="mt-2 font-mono text-[11px] text-muted">
            {{ buildMeta }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2 lg:justify-end">
          <UButton size="sm" variant="soft" @click="systemLogs.demoPush('change')">
            + zmiana
          </UButton>
          <UButton size="sm" variant="soft" @click="systemLogs.demoPush('info')">
            + info
          </UButton>
          <UButton size="sm" variant="soft" color="warning" @click="systemLogs.demoPush('warn')">
            + ostrzeżenie
          </UButton>
          <UButton size="sm" variant="soft" color="error" @click="systemLogs.demoPush('error')">
            + błąd
          </UButton>
          <UButton size="sm" variant="outline" icon="i-lucide-download" @click="downloadLogsExport">
            Eksport JSON
          </UButton>
          <UButton size="sm" color="error" variant="ghost" @click="systemLogs.clear">
            Wyczyść
          </UButton>
        </div>
      </div>

      <div class="mt-5 max-h-[min(440px,56vh)] overflow-auto rounded-2xl border border-default/60 bg-muted/10">
        <div
          v-for="entry in systemLogRows"
          :key="entry.id"
          class="border-b border-default/45 px-4 py-3 font-mono text-xs last:border-b-0"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-muted">{{ formatLogTs(entry.ts) }}</span>
            <UBadge size="sm" variant="subtle" :color="logLevelColor(entry.level)">
              {{ entry.level }}
            </UBadge>
          </div>
          <p class="mt-1.5 font-sans text-sm font-semibold text-highlighted">
            {{ entry.title }}
          </p>
          <p
            v-if="entry.detail"
            class="mt-1 font-sans text-xs leading-relaxed text-muted"
          >
            {{ entry.detail }}
          </p>
        </div>
        <p
          v-if="systemLogRows.length === 0"
          class="px-4 py-8 text-center text-sm text-muted"
        >
          Brak wpisów — dodaj demo lub wyczyść i wczytaj domyślny zestaw przy następnym wejściu.
        </p>
      </div>
    </UCard>
  </UContainer>
</template>
