type BackendProvider = 'leapcell' | 'render'

const STORE_KEY = 'active_backend_provider'
const VER_CEL_BLOB_PATH = 'slavia-config/active_backend_provider.json'

function normalizeProvider(raw: unknown): BackendProvider {
  if (typeof raw === 'string') {
    const normalized = raw.toLowerCase()
    if (normalized === 'render') {
      return 'render'
    }
  }
  return 'leapcell'
}

async function readFromNetlify(): Promise<BackendProvider | null> {
  if (process.env.NETLIFY !== 'true') return null
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('slavia-config')
    const val = await store.get(STORE_KEY)
    return normalizeProvider(val)
  } catch {
    return null
  }
}

async function writeToNetlify(provider: BackendProvider): Promise<boolean> {
  if (process.env.NETLIFY !== 'true') return false
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('slavia-config')
    await store.set(STORE_KEY, provider)
    return true
  } catch {
    return false
  }
}

async function readFromVercelBlob(): Promise<BackendProvider | null> {
  if (!process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) return null
  try {
    const { list } = await import('@vercel/blob')
    const listed = await list({ prefix: VER_CEL_BLOB_PATH, limit: 1 })
    const blob = listed.blobs[0]
    if (!blob?.url) return null
    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) return null
    const payload = (await res.json()) as { active_provider?: string }
    return normalizeProvider(payload.active_provider)
  } catch {
    return null
  }
}

async function writeToVercelBlob(provider: BackendProvider): Promise<boolean> {
  if (!process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) return false
  try {
    const { put } = await import('@vercel/blob')
    await put(
      VER_CEL_BLOB_PATH,
      JSON.stringify({
        active_provider: provider,
        updated_at: new Date().toISOString()
      }),
      {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json'
      }
    )
    return true
  } catch {
    return false
  }
}

export async function getGlobalBackendProvider(): Promise<BackendProvider> {
  const netlify = await readFromNetlify()
  if (netlify) return netlify
  const vercel = await readFromVercelBlob()
  if (vercel) return vercel
  return normalizeProvider(process.env.DEFAULT_BACKEND_PROVIDER)
}

export async function setGlobalBackendProvider(providerRaw: unknown): Promise<BackendProvider> {
  const provider = normalizeProvider(providerRaw)
  const netlifyOk = await writeToNetlify(provider)
  if (netlifyOk) return provider
  const vercelOk = await writeToVercelBlob(provider)
  if (vercelOk) return provider
  throw createError({
    statusCode: 500,
    statusMessage: 'Brak skonfigurowanego storage (Netlify Blobs / Vercel Blob).'
  })
}

