/**
 * Rejestr funkcji eksperymentalnych — przełączniki na `/superadmin/developer`.
 *
 * Diagnostyka motywów (presety `data-slavia-preset`, tryb jasny/ciemny, JSON do schowka)
 * jest na tej samej stronie w sekcji „Motyw i wygląd” — nie wymaga osobnej flagi.
 *
 * Przy dodawaniu nowej funkcji w fazie rozwoju:
 * 1. Dodaj wpis tutaj (`id` stabilny, snake_case).
 * 2. Używaj `useExperimentalFlag(id)` lub `enabledMap` w UI / pluginach.
 *
 * **localStorage** (`EXPERIMENTAL_FEATURES_STORAGE_KEY`) — nadpisania per przeglądarka.
 *
 * **Kill switch (deploy, poza przeglądarką)** — zmienna środowiskowa build/runtime:
 * `NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH` — lista `id` rozdzielonych przecinkami, które są
 * **zawsze wyłączone** (ignoruje localStorage i „włączone” domyślnie). Ratunek przy problemach na produkcji.
 *
 * Przykład wyłączenia PWA i analizy sztangi:
 * `NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH=pwa_service_worker,barbell_pose_analysis`
 */

export const EXPERIMENTAL_FEATURES_STORAGE_KEY = 'slavia-experimental-features'

export interface ExperimentalFeatureDefinition {
  id: string
  label: string
  description: string
  /** Gdy brak wpisu w localStorage — ta wartość jest używana (o ile nie ma kill switcha). */
  defaultEnabled: boolean
}

/** Lista edytowalna — przy nowej fladze dopisz identyfikator także do typu `ExperimentalFeatureId`. */
export const EXPERIMENTAL_FEATURES: ExperimentalFeatureDefinition[] = [
  {
    id: 'club_notification_bell',
    label: 'Dzwonek powiadomień w nagłówku',
    description:
      'Panel powiadomień klubu w belce (lista, polling, opcjonalne powiadomienia systemowe przy nowych wpisach).',
    defaultEnabled: true
  },
  {
    id: 'pwa_service_worker',
    label: 'PWA — service worker i cache offline',
    description:
      'Rejestracja service workera (Vite PWA): aktualizacje w tle, cache, tryb offline. Wyłącz przy problemach z wdrożeniem lub „zaciętym” cache.',
    defaultEnabled: true
  },
  {
    id: 'data_import_from_federations',
    label: 'Import danych z federacji (PZPC, Śląski Związek, podnoszenieciezarów.pl)',
    description:
      'Po stronie API flaga jest przekazywana jako dev_mode: włączone = zapis nowych wyników do bazy (Approved); wyłączone = tylko podgląd raportu (parsowanie i dopasowanie bez INSERT).',
    defaultEnabled: false
  }
]

export type ExperimentalFeatureId =
  | 'club_notification_bell'
  | 'pwa_service_worker'
  | 'barbell_pose_analysis'
  | 'data_import_from_federations'
