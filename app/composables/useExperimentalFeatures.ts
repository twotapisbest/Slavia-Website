import {
  EXPERIMENTAL_FEATURES,
  EXPERIMENTAL_FEATURES_STORAGE_KEY,
  type ExperimentalFeatureId
} from '~/data/experimentalFeaturesCatalog'
import { computeExperimentalEnabled, parseExperimentalKillSwitch } from '~/utils/experimentalEffective'

const OVERRIDES_STATE_KEY = 'slavia-experimental-overrides'

export function useExperimentalFeatures() {
  const runtimeConfig = useRuntimeConfig()
  const overrides = useState<Record<string, boolean>>(OVERRIDES_STATE_KEY, () => ({}))

  const killSwitch = computed(() =>
    parseExperimentalKillSwitch(String(runtimeConfig.public.experimentalKillSwitch ?? ''))
  )

  const enabledMap = computed(() => {
    const kill = killSwitch.value
    const o = overrides.value
    const map: Record<string, boolean> = {}
    for (const def of EXPERIMENTAL_FEATURES) {
      // W dev analiza sztangi ma być domyślnie aktywna, nawet jeśli katalog ma inną wartość.
      const defaultEnabled = def.id === 'barbell_pose_analysis' && import.meta.dev
        ? true
        : def.defaultEnabled
      map[def.id] = computeExperimentalEnabled(def.id, {
        killSwitch: kill,
        overrides: o,
        defaultEnabled
      })
    }
    return map
  })

  function isForcedOffByDeploy(id: string): boolean {
    return killSwitch.value.has(id)
  }

  function persist() {
    if (!import.meta.client) {
      return
    }
    try {
      localStorage.setItem(EXPERIMENTAL_FEATURES_STORAGE_KEY, JSON.stringify(overrides.value))
    } catch {
      /* quota / private mode */
    }
  }

  function setFlag(id: ExperimentalFeatureId, enabled: boolean) {
    if (killSwitch.value.has(id)) {
      return
    }
    const def = EXPERIMENTAL_FEATURES.find(f => f.id === id)
    if (!def) {
      return
    }
    if (enabled === def.defaultEnabled) {
      overrides.value = Object.fromEntries(
        Object.entries(overrides.value).filter(([k]) => k !== id)
      ) as Record<string, boolean>
    } else {
      overrides.value = { ...overrides.value, [id]: enabled }
    }
    persist()
  }

  function resetAllToDefaults() {
    overrides.value = {}
    persist()
  }

  return {
    definitions: EXPERIMENTAL_FEATURES,
    enabledMap,
    killSwitchIds: computed(() => [...killSwitch.value]),
    killSwitchRaw: computed(() => String(runtimeConfig.public.experimentalKillSwitch ?? '').trim()),
    isForcedOffByDeploy,
    setFlag,
    resetAllToDefaults
  }
}

/** Wygodny dostęp reaktywny do jednej flagi (np. w `v-if`). */
export function useExperimentalFlag(id: ExperimentalFeatureId) {
  const { enabledMap } = useExperimentalFeatures()
  return computed(() => !!enabledMap.value[id])
}
