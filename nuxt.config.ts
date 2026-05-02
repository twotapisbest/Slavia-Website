// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  /** Kalendarz: wyłącz SSR — unika 500 przy hydracji dat i braku API po stronie Node. */
  routeRules: {
    '/kalendarz': { ssr: false }
  },

  icon: {
    serverBundle: 'local',
    clientBundle: {
      scan: true
    },
    fetchTimeout: 8000
  },
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
  },

  devtools: {
    enabled: true
  },

  nitro: {
    experimental: {
      // Workaround dla zawieszania builda na Windows przy bundlowaniu Nitro.
    },
    externals: {
      inline: ['@nuxt/nitro-server']
    }
  },

  vite: {
    build: {
      sourcemap: false
    }
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
