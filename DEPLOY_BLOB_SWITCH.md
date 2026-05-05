# Deploy: globalny przełącznik backendu (Vercel/Netlify)

## 1) Wymagane zmienne środowiskowe (frontend)

- `NUXT_PUBLIC_API_BASE_URL_LEAPCELL=https://...`
- `NUXT_PUBLIC_API_BASE_URL_RENDER=https://...`
- `NUXT_PUBLIC_API_BASE_URL=https://...` (fallback)
- `DEFAULT_BACKEND_PROVIDER=leapcell` (lub `render`)

## 2) Storage bez bazy danych

W tym projekcie przełącznik jest zapisywany globalnie przez endpoint Nuxt:

- `GET /api/system/backend-provider`
- `PATCH /api/system/backend-provider`

Persistencja:

- Netlify runtime: `@netlify/blobs`
- Vercel runtime: `@vercel/blob` (`BLOB_READ_WRITE_TOKEN`)

## 3) Vercel

1. Utwórz/aktywuj Blob Store.
2. Dodaj `BLOB_READ_WRITE_TOKEN` do Environment Variables.
3. Ustaw zmienne z sekcji 1.
4. Wykonaj redeploy.

## 4) Netlify

1. Włącz Blobs dla witryny.
2. Ustaw zmienne z sekcji 1.
3. Wykonaj redeploy.

## 5) Użycie w panelu

1. Zaloguj się jako `SuperAdmin`.
2. Otwórz `/superadmin/developer`.
3. Wybierz provider i kliknij „Zapisz globalnie”.
