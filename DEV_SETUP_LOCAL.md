# Uruchomienie lokalne (DEV) — Slavia

Poniżej masz minimalną instrukcję, jak uruchomić **backend (Rust)** i **frontend (Nuxt)** lokalnie na PC.

## Wymagania

- **Node.js** (zalecane LTS) + **pnpm** (`corepack enable`)
- **Rust** (stable) + `cargo`
- Windows: uruchamiaj polecenia w **PowerShell**

## Backend (Rust) — `Slavia-backend`

### 1) Plik `.env`

W katalogu `Slavia-backend` utwórz plik `.env` na bazie `.env.example`.

Najprostsza konfiguracja dev (SQLite lokalnie w pliku):

```env
# Slavia-backend/.env
PORT=8080

# Lokalna baza SQLite w pliku
DATABASE_MODE=local
DATABASE_LOCAL_PATH=.local/slavia.db

# Jednorazowo możesz ustawić true, żeby odtworzyć bazę i seed:
REBUILD_DB=false

# JWT do logowania
JWT_SECRET=dev_secret_change_me

# Cloudinary (opcjonalnie — wymagane tylko jeśli testujesz upload zdjęć)
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_UPLOAD_PRESET=...   # preset ustawiony jako Unsigned w Cloudinary
# CLOUDINARY_API_KEY=...         # potrzebne do operacji uprzywilejowanych (np. destroy)
# CLOUDINARY_API_SECRET=...
```

Uwagi:
- Jeśli chcesz **zresetować bazę** i mieć dane seed: ustaw `REBUILD_DB=true`, uruchom backend raz, potem wróć na `false` (inaczej skasuje dane przy każdym starcie).
- Nie kopiuj sekretów z `.env.render` do dev “w ciemno” i **nigdy nie commituj** plików `.env`.

### 2) Uruchomienie

W terminalu:

```powershell
cd "c:\Users\jakub\Desktop\Slavia-backend"
cargo run
```

Backend powinien wystartować na `http://127.0.0.1:8080`.

## Frontend (Nuxt) — `Slavia-frontend`

### 1) Instalacja zależności

```powershell
cd "c:\Users\jakub\Desktop\Slavia-frontend"
corepack enable
pnpm install
```

### 2) Plik `.env`

W katalogu `Slavia-frontend` utwórz plik `.env`:

```env
# Slavia-frontend/.env
NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3) Uruchomienie

```powershell
cd "c:\Users\jakub\Desktop\Slavia-frontend"
pnpm dev
```

Frontend wystartuje zwykle na `http://localhost:3000`.

## Szybki test działania

- Wejdź w przeglądarce na `http://localhost:3000`
- Zaloguj się na konto z seed (jeśli robiłeś `REBUILD_DB=true`) albo na istniejące konta w Twojej lokalnej bazie.

## Typowe problemy

- **CORS / brak odpowiedzi z API**: upewnij się, że `NUXT_PUBLIC_API_BASE_URL` wskazuje na port backendu (domyślnie `8080`).
- **Baza się “resetuje” przy każdym starcie**: w backendzie masz `REBUILD_DB=true` — ustaw `false`.
- **SQLite locked / table is locked**: zamknij drugi proces backendu oraz narzędzia trzymające uchwyt do pliku bazy.

