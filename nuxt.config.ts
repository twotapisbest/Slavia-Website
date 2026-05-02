// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
       * Publiczny URL strony — używany do canonical/og:url.
       */
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  }
})
