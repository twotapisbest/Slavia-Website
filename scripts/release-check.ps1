param(
  [string]$ApiBase = $env:SLAVIA_API_BASE_URL
)
$ErrorActionPreference = 'Stop'

Write-Host "== Slavia-frontend release check =="

Write-Host "[1/2] pnpm typecheck"
pnpm typecheck

Write-Host "[2/2] smoke backend"
if ($ApiBase) {
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke-backend.ps1 -BaseUrl $ApiBase
} else {
  pnpm smoke:backend
}

Write-Host "OK: frontend release check completed."
