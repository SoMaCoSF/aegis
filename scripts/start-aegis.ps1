# ==============================================================================
# file_id: SOM-SCR-0050-v1.0.0
# name: start-aegis.ps1
# description: AEGIS Privacy Suite v1.0 - Unified launcher script
# project_id: AEGIS
# category: script
# tags: [launcher, powershell, startup]
# created: 2025-12-08
# modified: 2025-12-08
# version: 1.0.0
# agent_id: AGENT-PRIME-001
# execution: .\scripts\start-aegis.ps1
# ==============================================================================

param(
    [switch]$Dashboard,
    [switch]$DMBT,
    [switch]$Ghost,
    [switch]$All,
    [switch]$Status
)

$ErrorActionPreference = "Stop"
$AegisRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  AEGIS Privacy Suite v1.0 Launcher" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Helper function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("127.0.0.1", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check status of all services
if ($Status -or (-not $Dashboard -and -not $DMBT -and -not $Ghost -and -not $All)) {
    Write-Host "Checking service status..." -ForegroundColor Yellow
    Write-Host ""

    # Dashboard API
    if (Test-Port 4243) {
        Write-Host "[OK] Dashboard API (localhost:4243)" -ForegroundColor Green
    } else {
        Write-Host "[--] Dashboard API (localhost:4243)" -ForegroundColor Gray
    }

    # Dashboard UI
    if (Test-Port 4242) {
        Write-Host "[OK] Dashboard UI (localhost:4242)" -ForegroundColor Green
    } else {
        Write-Host "[--] Dashboard UI (localhost:4242)" -ForegroundColor Gray
    }

    # DMBT Agent
    if (Test-Port 8088) {
        Write-Host "[OK] DMBT Agent (localhost:8088)" -ForegroundColor Green
    } else {
        Write-Host "[--] DMBT Agent (localhost:8088)" -ForegroundColor Gray
    }

    # Ghost_Shell Proxy
    if (Test-Port 8080) {
        Write-Host "[OK] Ghost_Shell Proxy (localhost:8080)" -ForegroundColor Green
    } else {
        Write-Host "[--] Ghost_Shell Proxy (localhost:8080)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "Usage: .\start-aegis.ps1 [-Dashboard] [-DMBT] [-Ghost] [-All]" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# Start Dashboard
if ($Dashboard -or $All) {
    Write-Host "Starting AEGIS Dashboard..." -ForegroundColor Yellow
    $dashboardPath = Join-Path $AegisRoot "packages\dashboard"

    if (Test-Port 4243) {
        Write-Host "  Dashboard API already running on port 4243" -ForegroundColor Yellow
    } else {
        Push-Location $dashboardPath
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
        Pop-Location
        Write-Host "  Dashboard started (API: 4243, UI: 4242)" -ForegroundColor Green
    }
}

# Start DMBT
if ($DMBT -or $All) {
    Write-Host "Starting DMBT Collector..." -ForegroundColor Yellow
    $dmbtPath = Join-Path $AegisRoot "DMBT"

    if (Test-Path (Join-Path $dmbtPath ".venv")) {
        Push-Location $dmbtPath
        Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\.venv\Scripts\activate.ps1; python collector\collector.py"
        Pop-Location
        Write-Host "  DMBT Collector started" -ForegroundColor Green
    } else {
        Write-Host "  DMBT venv not found. Run: cd DMBT; uv venv .venv; uv pip install -r collector\requirements.txt" -ForegroundColor Red
    }
}

# Start Ghost_Shell
if ($Ghost -or $All) {
    Write-Host "Starting Ghost_Shell Proxy..." -ForegroundColor Yellow
    $ghostPath = Join-Path $AegisRoot "Ghost_Shell"

    if (Test-Port 8080) {
        Write-Host "  Ghost_Shell Proxy already running on port 8080" -ForegroundColor Yellow
    } elseif (Test-Path (Join-Path $ghostPath ".venv")) {
        Push-Location $ghostPath
        Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\.venv\Scripts\activate.ps1; python ghost_shell\launcher.py"
        Pop-Location
        Write-Host "  Ghost_Shell Proxy started (port 8080)" -ForegroundColor Green
        Write-Host "  Configure browser proxy: 127.0.0.1:8080" -ForegroundColor Cyan
    } else {
        Write-Host "  Ghost_Shell venv not found. Run: cd Ghost_Shell; uv venv .venv; uv pip install -r requirements.txt" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  AEGIS Privacy Suite Started" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dashboard: http://localhost:4242" -ForegroundColor White
Write-Host "API:       http://localhost:4243" -ForegroundColor White
Write-Host "Proxy:     127.0.0.1:8080" -ForegroundColor White
Write-Host ""
