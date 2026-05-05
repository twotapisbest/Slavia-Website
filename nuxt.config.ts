// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Najnowsze domyślne zachowanie Nitro / presetów modułów dla wybranej osi czasu (bump przy większych upgrade’ach Nuxt).
  compatibilityDate: '2026-05-03',

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      /**
       * Zewnętrzny backend — tylko ten URL; brak proxy Nitro, brak kodu serwera w tym repo.
       * Ustaw w `.env`: NUXT_PUBLIC_API_BASE_URL
       */
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
      /**
       * URL backendu Leapcell (provider przełączany globalnie po stronie API).
       */
      apiBaseLeapcell: process.env.NUXT_PUBLIC_API_BASE_URL_LEAPCELL || process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
      /**
       * URL backendu Render (provider przełączany globalnie po stronie API).
       */
      apiBaseRender:
        process.env.NUXT_PUBLIC_API_BASE_URL_RENDER
        || process.env.NUXT_PUBLIC_API_BASE_URL
        || 'http://127.0.0.1:8000',
      /**
       * Publiczny URL strony — używany do canonical/og:url.
       */
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      /**
       * Lista rozdzielona przecinkami: identyfikatory funkcji eksperymentalnych zawsze wyłączone na buildzie (deploy).
       * Nadpisuje localStorage i domyślne „włączone”. Zob. `app/data/experimentalFeaturesCatalog.ts`.
       *
       * Przykład: `pwa_service_worker,barbell_pose_analysis,club_notification_bell`
       */
      experimentalKillSwitch: process.env.NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH || ''
    }
  }
})
