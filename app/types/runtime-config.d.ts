/** Rozszerzenie typów `useRuntimeConfig().public` (np. dla zmiennych z `nuxt.config`). */
declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    apiBase: string
    apiBaseLeapcell: string
    apiBaseNorthflank: string
    /** Lista rozdzielona przecinkami — identyfikatory funkcji eksperymentalnych wymuszonych jako wyłączone. */
    experimentalKillSwitch: string
  }
}

export {}
