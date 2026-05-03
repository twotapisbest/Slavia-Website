/** Rozszerzenie typów `useRuntimeConfig().public` (np. dla zmiennych z `nuxt.config`). */
declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    /** Lista rozdzielona przecinkami — identyfikatory funkcji eksperymentalnych wymuszonych jako wyłączone. */
    experimentalKillSwitch: string
  }
}

export {}
