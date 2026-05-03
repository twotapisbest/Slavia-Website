<script setup lang="ts">
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { useBrowserNotifications } from '~/composables/useBrowserNotifications'
import type { DevSuperadminLogLevel } from '~/composables/useDevSuperadminLogs'
import { useDevSuperadminLogs } from '~/composables/useDevSuperadminLogs'
import { usePwaInstall } from '~/composables/usePwaInstall'
import { DEV_TOOL_LINK_GROUPS } from '~/data/devToolsCatalog'
import type { ExperimentalFeatureId } from '~/data/experimentalFeaturesCatalog'
import {
  slaviaAppearanceStorageKeys,
  useSlaviaAppearance,
  type SlaviaThemePreset
} from '~/composables/useSlaviaAppearance'
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
const {
  preset: themePreset,
  presets: themePresets,
  setPreset: setThemePreset,
  colorMode: themeColorMode,
  hydrate: hydrateThemeAppearance
} = useSlaviaAppearance()

const activePresetMeta = computed(() => {
  const id = themePreset.value
  return themePresets.find(p => p.id === id)
})

const domDataPresetAttr = ref<string | null>(null)

function refreshDomPresetAttr() {
  if (!import.meta.client) {
    return
  }
  domDataPresetAttr.value = document.documentElement.getAttribute('data-slavia-preset')
}

watch(themePreset, refreshDomPresetAttr)

async function copyThemeDiagnosticsJson() {
  if (!import.meta.client) {
    return
  }
  refreshDomPresetAttr()
  const u = auth.user.value
  const pref = themeColorMode.preference
  const preference = typeof pref === 'string' ? pref : String(pref ?? '')
  const payload = {
    capturedAt: new Date().toISOString(),
    presetActive: themePreset.value,
    presetDomAttr: domDataPresetAttr.value,
    colorModePreference: preference,
    resolvedColorScheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    server: u
      ? {
          ui_theme_preset: u.ui_theme_preset ?? null,
          ui_color_mode: u.ui_color_mode ?? null
        }
      : null,
    localStorageMirror: u
      ? {
          presetKey: localStorage.getItem(slaviaAppearanceStorageKeys(u.id).preset),
          modeKey: localStorage.getItem(slaviaAppearanceStorageKeys(u.id).mode)
        }
      : null
  }
  await copyToClipboard(JSON.stringify(payload, null, 2), 'Skopiowano diagnostykę motywu (JSON)')
}

function clearLocalAppearanceMirror() {
  if (!import.meta.client) {
    return
  }
  const uid = auth.user.value?.id
  if (!uid) {
    toast.add({ title: 'Brak zalogowanego użytkownika', color: 'warning' })
    return
  }
  const keys = slaviaAppearanceStorageKeys(uid)
  localStorage.removeItem(keys.preset)
  localStorage.removeItem(keys.mode)
  hydrateThemeAppearance()
  refreshDomPresetAttr()
  toast.add({
    title: 'Usunięto lokalny mirror motywu',
    description: 'Zsynchronizowano z danymi konta (hydracja).',
    color: 'success'
  })
}

function devSetColorMode(next: 'light' | 'dark' | 'system') {
  themeColorMode.preference = next
  refreshDomPresetAttr()
}

async function devQuickSetPreset(id: SlaviaThemePreset) {
  await setThemePreset(id)
  refreshDomPresetAttr()
}

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
const { supported: pwaSupported, canPrompt, promptInstall, installed, loopbackWithoutDev } = usePwaInstall()
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
    refreshDomPresetAttr()
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
  if (loopbackWithoutDev.value) {
    toast.add({
      title: 'PWA na localhost tylko w dev',
      description:
        'Przy `nuxt build` + podglądzie na 127.0.0.1 nie rejestrujemy SW. Uruchom `nuxt dev` albo HTTPS wdrożenia.',
      color: 'warning'
    })
    return
  }
  if (!canPrompt.value) {
    toast.add({
      title: 'Instalacja z przycisku niedostępna',
      description: pwaSupported.value
        ? 'Manifest + service worker muszą być aktywne; w Chrome sprawdź ⋮ → Zainstaluj aplikację. Na iOS instalacja tylko z Udostępnij.'
        : 'Potrzebny jest bezpieczny kontekst (HTTPS lub localhost w trybie dev). HTTP na samym IP w LAN blokuje PWA w Chromium.',
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
          roles: u.roles,
          email: u.email,
          ui_theme_preset: u.ui_theme_preset ?? null,
          ui_color_mode: u.ui_color_mode ?? null
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
    { path: '/api/competitions/recurring-training-cancellations', label: 'Treningi cykliczne — wyjątki (Pn/Śr/Pt)' },
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
    description: `${endpoints.length} żądań zapisanych w logach lokalnych (patrz sekcja na dole strony).`,
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
  <UContainer class="max-sm:px-3 py-5 sm:py-8 lg:py-10">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Developer
        </p>
        <h1 class="mt-1 text-xl font-black tracking-tight text-highlighted sm:text-2xl md:text-3xl">
          Narzędzia superadmina
        </h1>
        <p class="mt-1 max-w-3xl text-xs leading-snug text-muted sm:text-sm">
          Flagi, motyw, smoke API, PWA, schowek i mapa tras — zwarty układ pod szybki smoke test.
        </p>
      </div>
      <UButton
        to="/superadmin"
        variant="soft"
        color="neutral"
        size="sm"
        icon="i-lucide-arrow-left"
        class="shrink-0"
      >
        Panel
      </UButton>
    </div>

    <!-- lg+: 12-kolumnowa siatka — API + eksperymentalne w jednym rzędzie, mniej „pustych” kolumn -->
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-7">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Statystyki API
          </p>
          <UButton
            size="xs"
            variant="soft"
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="developerStatusPending"
            @click="refreshDeveloperStatus()"
          >
            Odśwież
          </UButton>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Blog
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ status?.postsCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Zawodnicy
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ status?.athletesCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Zawody
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ status?.competitionsCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Oczekujące
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ status?.pendingCount ?? 0 }}
            </p>
          </div>
        </div>
        <p
          v-if="apiPingMs != null"
          class="mt-2 text-center font-mono text-[10px] text-muted"
        >
          Ping GET /api/posts: <span class="text-highlighted">{{ apiPingMs }}</span> ms
        </p>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-5">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
              Eksperymentalne
            </p>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">
              localStorage + opcjonalny <span class="font-mono">NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH</span>.
            </p>
            <UAlert
              v-if="experimentalKillDeploy"
              class="mt-2 text-[11px]"
              color="warning"
              variant="subtle"
              title="Kill switch"
            >
              <span class="break-all font-mono text-[10px]">{{ experimentalKillDeploy }}</span>
            </UAlert>
          </div>
          <UButton
            v-if="experimental.definitions.length > 0"
            size="xs"
            variant="soft"
            color="neutral"
            icon="i-lucide-rotate-ccw"
            class="shrink-0"
            @click="resetExperimentalDefaults"
          >
            Reset
          </UButton>
        </div>

        <div
          v-if="experimental.definitions.length === 0"
          class="mt-3 rounded-lg border border-dashed border-default/60 bg-muted/10 px-3 py-4 text-center text-xs text-muted"
        >
          Brak flag —
          <code class="font-mono text-[10px]">experimentalFeaturesCatalog.ts</code>
        </div>

        <ul
          v-else
          class="mt-3 divide-y divide-default/50 rounded-lg border border-default/60 bg-muted/5"
        >
          <li
            v-for="def in experimental.definitions"
            :key="def.id"
            class="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
          >
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-highlighted">
                  {{ def.label }}
                </p>
                <p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
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

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
              Motyw
            </p>
            <p class="text-[11px] text-muted">
              <span class="font-mono text-[10px]">data-slavia-preset</span>
              ·
              <NuxtLink
                class="font-medium text-primary underline-offset-2 hover:underline"
                to="/profil"
              >
                Profil
              </NuxtLink>
            </p>
          </div>
          <div class="flex flex-wrap gap-1">
            <UButton
              variant="outline"
              color="neutral"
              size="xs"
              icon="i-lucide-refresh-cw"
              @click="
                hydrateThemeAppearance();
                refreshDomPresetAttr();
              "
            >
              Hydracja
            </UButton>
          </div>
        </div>

        <div class="mt-3 grid gap-3 lg:grid-cols-12 lg:items-start">
          <div class="rounded-lg border border-default/60 bg-muted/5 p-3 lg:col-span-3">
            <dl class="space-y-1 text-xs">
              <div class="flex justify-between gap-2">
                <dt class="text-muted">
                  Preset
                </dt>
                <dd class="truncate font-semibold text-highlighted">
                  {{ activePresetMeta?.label ?? themePreset }}
                </dd>
              </div>
              <div class="flex justify-between gap-2 font-mono text-[10px]">
                <dt class="text-muted">
                  ID / DOM
                </dt>
                <dd class="truncate text-right">
                  {{ themePreset }} · {{ domDataPresetAttr ?? '—' }}
                </dd>
              </div>
              <div class="flex justify-between gap-2">
                <dt class="text-muted">
                  Tryb
                </dt>
                <dd class="capitalize">
                  {{ themeColorMode.preference }}
                </dd>
              </div>
              <template v-if="auth.user.value">
                <div class="border-t border-default/40 pt-1 font-mono text-[10px]">
                  <span class="text-muted">srv:</span>
                  {{ auth.user.value.ui_theme_preset ?? '—' }}
                  /
                  {{ auth.user.value.ui_color_mode ?? '—' }}
                </div>
              </template>
            </dl>
          </div>

          <div class="min-w-0 lg:col-span-9">
            <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
              <UButton
                v-for="p in themePresets"
                :key="p.id"
                size="xs"
                class="min-h-9 touch-manipulation justify-start truncate text-left"
                :color="themePreset === p.id ? 'primary' : 'neutral'"
                :variant="themePreset === p.id ? 'solid' : 'outline'"
                :title="p.description"
                @click="devQuickSetPreset(p.id)"
              >
                {{ p.label }}
              </UButton>
            </div>
            <p
              v-if="activePresetMeta?.description"
              class="mt-2 line-clamp-2 text-[11px] leading-snug text-muted"
            >
              {{ activePresetMeta.description }}
            </p>
          </div>
        </div>

        <div class="mt-3 flex flex-col gap-2 border-t border-default/45 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div class="flex flex-wrap gap-1">
            <span class="mr-1 self-center text-[10px] font-bold uppercase text-muted">Tryb</span>
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :variant="themeColorMode.preference === 'light' ? 'solid' : 'outline'"
              @click="devSetColorMode('light')"
            >
              Jasny
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :variant="themeColorMode.preference === 'dark' ? 'solid' : 'outline'"
              @click="devSetColorMode('dark')"
            >
              Ciemny
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :variant="themeColorMode.preference === 'system' ? 'solid' : 'outline'"
              @click="devSetColorMode('system')"
            >
              System
            </UButton>
          </div>
          <div class="flex flex-1 flex-wrap gap-1 sm:justify-end">
            <UButton
              variant="outline"
              color="neutral"
              size="xs"
              icon="i-lucide-clipboard-copy"
              class="touch-manipulation"
              title="Diagnostyka motywu do schowka"
              @click="copyThemeDiagnosticsJson"
            >
              JSON
            </UButton>
            <UButton
              variant="outline"
              color="neutral"
              size="xs"
              icon="i-lucide-eraser"
              class="touch-manipulation"
              title="Usuń lokalny mirror motywu (localStorage)"
              @click="clearLocalAppearanceMirror"
            >
              Mirror
            </UButton>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <div class="grid gap-4 lg:grid-cols-12 lg:items-start">
          <div class="space-y-3 lg:col-span-8">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Powiadomienia · PWA</span>
              <UButton
                color="primary"
                size="xs"
                class="touch-manipulation"
                @click="sendTestNotification"
              >
                Test notify
              </UButton>
              <UButton
                color="secondary"
                size="xs"
                class="touch-manipulation"
                :disabled="!pwaExperimentEnabled || loopbackWithoutDev"
                @click="installPwa"
              >
                Instaluj PWA
              </UButton>
            </div>
            <p class="rounded-lg border border-default/50 bg-muted/10 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-muted">
              obsługa: {{ supported ? 'tak' : 'nie' }} · upr.: {{ permission }} · sys.: {{ enabled ? 'tak' : 'nie' }}
              · pwa: {{ pwaSupported ? 'tak' : 'nie' }} · prompt: {{ canPrompt ? 'tak' : 'nie' }} · app: {{ installed ? 'tak' : 'nie' }}
              <span v-if="loopbackWithoutDev"> · localhost≠dev</span>
            </p>

            <div class="border-t border-default/40 pt-3">
              <p class="mb-2 text-[10px] font-bold uppercase text-muted">
                API · storage · UI
              </p>
              <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-zap" class="touch-manipulation" @click="runApiSmokeTests">
                  <span class="truncate">Smoke API</span>
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-wifi" class="touch-manipulation" @click="pingApiLatency">
                  Ping
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-database" class="touch-manipulation" @click="testLocalStorageRoundtrip">
                  localStorage
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-layers" class="touch-manipulation" @click="testSessionStorageRoundtrip">
                  session
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-package-search" class="touch-manipulation" @click="toastStorageApisAvailability">
                  API przegl.
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-contrast" class="touch-manipulation" @click="logMediaAndUiCaps">
                  Motion/UI
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-monitor" class="touch-manipulation" @click="logScreenGeometry">
                  Ekran
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-maximize" class="touch-manipulation" @click="toggleFullscreenDev">
                  Fullscreen
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-smartphone" class="touch-manipulation" @click="testVibrateShort">
                  Wibracja
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-external-link" class="touch-manipulation" @click="openCurrentUrlNewTab">
                  Nowa karta
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-download" class="touch-manipulation" @click="downloadDevSelftestFile">
                  .txt test
                </UButton>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-default/60 bg-muted/5 p-3 lg:col-span-4">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
              Schowek · sieć
            </p>
            <div class="mt-2 grid grid-cols-2 gap-1.5">
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-braces" class="touch-manipulation" @click="copyEnvDumpJson">
                Env JSON
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-navigation" class="touch-manipulation" @click="copyNavigatorSummary">
                Navigator
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-list-tree" class="touch-manipulation" @click="copyLocalStorageKeys">
                Klucze LS
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-activity" class="touch-manipulation" @click="logOnlineStatus">
                onLine
              </UButton>
              <UButton color="primary" variant="soft" size="xs" icon="i-lucide-wifi" class="touch-manipulation" @click="pingApiLatency">
                Ping
              </UButton>
              <UButton color="warning" variant="soft" size="xs" icon="i-lucide-database-zap" class="touch-manipulation" @click="clearBrowserCachesApi">
                Cache API
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p class="text-sm text-muted">
            <span class="font-semibold text-highlighted">{{ auth.user.value?.username }}</span>
            <span v-if="auth.rolesDisplayShort" class="text-muted"> · {{ auth.rolesDisplayShort }}</span>
          </p>
          <div class="flex flex-wrap gap-1">
            <UButton to="/superadmin" variant="outline" color="neutral" size="xs" icon="i-lucide-crown">
              SuperAdmin
            </UButton>
            <UButton to="/profil" variant="outline" color="neutral" size="xs" icon="i-lucide-palette">
              Profil
            </UButton>
            <UButton to="/aktualnosci/nowy" variant="outline" color="neutral" size="xs" icon="i-lucide-file-plus-2">
              Blog
            </UButton>
            <UButton to="/trainer/analiza-sztangi" variant="outline" color="neutral" size="xs" icon="i-lucide-scan-line">
              Sztanga
            </UButton>
            <UButton to="/admin/changelog" variant="outline" color="neutral" size="xs" icon="i-lucide-file-text">
              Changelog
            </UButton>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Przeglądarka (bez API)
        </p>
        <p class="mt-1 text-[11px] text-muted">
          Najedź na przycisk, aby zobaczyć podpowiedź — wpisy do schowka i akcje lokalne.
        </p>
        <div class="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-link" title="Pełny URL strony" class="touch-manipulation" @click="copyCurrentUrl">
            URL
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-globe" title="NUXT_PUBLIC_SITE_URL" class="touch-manipulation" @click="copySiteUrl">
            siteUrl
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-server" title="API base z runtime" class="touch-manipulation" @click="copyApiBase">
            API base
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-refresh-ccw" title="location.reload()" class="touch-manipulation" @click="hardReload">
            Reload
          </UButton>
          <UButton color="warning" variant="soft" size="xs" icon="i-lucide-trash-2" title="Wyczyść localStorage i sessionStorage" class="touch-manipulation" @click="clearWebStorage">
            Wyczyść LS
          </UButton>
          <UButton color="warning" variant="soft" size="xs" icon="i-lucide-rotate-ccw" title="Wyrejestruj service workery" class="touch-manipulation" @click="unregisterServiceWorkers">
            Wyrej. SW
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-accessibility" title="Symulacja prefers-reduced-motion" class="touch-manipulation" @click="toggleReducedMotionDev">
            Red. motion
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-git-branch" title="Zapisz ścieżkę do logów" class="touch-manipulation" @click="logRouteSummary">
            URL → log
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-maximize-2" title="viewport + DPR" class="touch-manipulation" @click="copyViewportString">
            Viewport
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-cpu" title="performance.memory (Chrome)" class="touch-manipulation" @click="copyMemoryHint">
            Heap
          </UButton>
        </div>
        <div class="mt-3 rounded-lg border border-default/60 bg-muted/10 p-2">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-muted">
            User-Agent
          </p>
          <pre class="mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-all text-[10px] text-highlighted">{{ userAgentDisplay || '—' }}</pre>
        </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
        Mapa aplikacji
      </p>
      <p class="mt-1 text-[11px] text-muted">
        Trasy frontu i linki zewnętrzne (nowa karta).
      </p>
      <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <div
          v-for="group in devLinkGroups"
          :key="group.title"
          class="rounded-xl border border-default/40 bg-muted/5 p-3"
        >
          <h2 class="text-sm font-bold text-highlighted">
            {{ group.title }}
          </h2>
          <p
            v-if="group.description"
            class="mt-0.5 text-[11px] leading-snug text-muted"
          >
            {{ group.description }}
          </p>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <UButton
              v-for="link in group.links"
              :key="`${group.title}-${link.label}`"
              :to="link.to"
              variant="outline"
              color="neutral"
              size="sm"
              class="h-auto min-h-12 flex-col items-start gap-0.5 py-2 whitespace-normal text-left"
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
              <span class="w-full text-[11px] font-normal leading-snug text-muted">{{ link.description }}</span>
            </UButton>
          </div>
        </div>
      </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Logi (localStorage)
          </p>
          <p class="mt-0.5 font-mono text-[10px] text-muted">
            {{ buildMeta }}
          </p>
        </div>
        <div class="flex flex-wrap gap-1">
          <UButton size="xs" variant="soft" @click="systemLogs.demoPush('change')">
            +zm
          </UButton>
          <UButton size="xs" variant="soft" @click="systemLogs.demoPush('info')">
            +info
          </UButton>
          <UButton size="xs" variant="soft" color="warning" @click="systemLogs.demoPush('warn')">
            +warn
          </UButton>
          <UButton size="xs" variant="soft" color="error" @click="systemLogs.demoPush('error')">
            +err
          </UButton>
          <UButton size="xs" variant="outline" icon="i-lucide-download" @click="downloadLogsExport">
            Export
          </UButton>
          <UButton size="xs" color="error" variant="ghost" @click="systemLogs.clear">
            Clear
          </UButton>
        </div>
      </div>

      <div class="mt-3 max-h-[min(360px,48vh)] overflow-auto rounded-xl border border-default/60 bg-muted/10">
        <div
          v-for="entry in systemLogRows"
          :key="entry.id"
          class="border-b border-default/45 px-3 py-2 font-mono text-[10px] last:border-b-0"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-muted">{{ formatLogTs(entry.ts) }}</span>
            <UBadge size="xs" variant="subtle" :color="logLevelColor(entry.level)">
              {{ entry.level }}
            </UBadge>
          </div>
          <p class="mt-1 font-sans text-xs font-semibold text-highlighted">
            {{ entry.title }}
          </p>
          <p
            v-if="entry.detail"
            class="mt-0.5 font-sans text-[11px] leading-relaxed text-muted"
          >
            {{ entry.detail }}
          </p>
        </div>
        <p
          v-if="systemLogRows.length === 0"
          class="px-3 py-6 text-center text-xs text-muted"
        >
          Brak wpisów.
        </p>
      </div>
      </UCard>
    </div>
  </UContainer>
</template>
