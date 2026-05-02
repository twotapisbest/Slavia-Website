// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },

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
  },

  /** Kalendarz: wyłącz SSR — unika 500 przy hydracji dat i braku API po stronie Node. */
  routeRules: {
    '/kalendarz': { ssr: false }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    /** Mniejszy narzut Rollupa na Windows (AV / blokady plików). */
    rollupConfig: {
      maxParallelFileOps: 4
    },
    /** Bez map dla serwera — krótszy etap Nitro. */
    sourcemap: false,
    externals: {
      /**
       * Wyłącza śledzenie plików (@vercel/nft) przy externals — na Windows potrafi
       * dramatycznie spowalniać lub wyglądać jak zawieszenie podczas „Building Nitro server”.
       * @see https://github.com/nuxt/nuxt/issues/34753
       */
      trace: false,
      inline: ['@nuxt/nitro-server']
    }
  },

  vite: {
    esbuild: {
      legalComments: 'none'
    },
    server: {
      warmup: {
        clientFiles: ['./app/app.vue', './app/pages/index.vue']
      }
    },
    build: {
      sourcemap: false,
      /**
       * Domyślnie Vite liczy rozmiary gzip każdego chunka — na dużych appkach
       * wygląda jak „zawieszenie” pod koniec client builda.
       */
      reportCompressedSize: false
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    serverBundle: 'local',
    clientBundle: {
      scan: true
    },
    fetchTimeout: 8000
  }
})
