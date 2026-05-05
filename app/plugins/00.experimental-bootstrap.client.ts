import { EXPERIMENTAL_FEATURES, EXPERIMENTAL_FEATURES_STORAGE_KEY } from '~/data/experimentalFeaturesCatalog'
import { computeExperimentalEnabled, parseExperimentalKillSwitch } from '~/utils/experimentalEffective'

/** Hydracja nadpisań flag z localStorage (musi być przed logiką zależną od stanu). */
export default defineNuxtPlugin({
  name: 'slavia-experimental-bootstrap',
  setup() {
    if (!import.meta.client) {
      return
    }

    const overrides = useState<Record<string, boolean>>('slavia-experimental-overrides', () => ({}))
    const runtimeConfig = useRuntimeConfig()

    try {
      const raw = localStorage.getItem(EXPERIMENTAL_FEATURES_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const cleaned: Record<string, boolean> = {}
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'boolean') {
              cleaned[k] = v
            }
          }
          overrides.value = cleaned
        }
      }
    } catch {
      /* uszkodzony JSON — zostaw domyślne */
    }

    const kill = parseExperimentalKillSwitch(String(runtimeConfig.public.experimentalKillSwitch ?? ''))
    // Bootstrap utrzymany dla innych flag eksperymentalnych.
    void computeExperimentalEnabled('pwa_service_worker', {
      killSwitch: kill,
      overrides: overrides.value,
      defaultEnabled: EXPERIMENTAL_FEATURES.find(f => f.id === 'pwa_service_worker')?.defaultEnabled ?? true
    })
  }
})
