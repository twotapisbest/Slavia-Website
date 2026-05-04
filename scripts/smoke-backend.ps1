param(
  [string]$BaseUrl = $env:SLAVIA_API_BASE_URL
)
$ErrorActionPreference = 'Stop'
if (-not $BaseUrl) {
  $BaseUrl = 'http://127.0.0.1:8080'
}
$BaseUrl = $BaseUrl.TrimEnd('/')

$r1 = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -TimeoutSec 15
if ($r1.StatusCode -ne 200) {
  throw "GET / zwróciło $($r1.StatusCode)"
}

$r2 = Invoke-WebRequest -Uri "$BaseUrl/api/athletes" -UseBasicParsing -TimeoutSec 15
if ($r2.StatusCode -ne 200) {
  throw "GET /api/athletes zwróciło $($r2.StatusCode)"
}

Write-Host "Smoke OK: $BaseUrl/ oraz $BaseUrl/api/athletes (HTTP 200)."
