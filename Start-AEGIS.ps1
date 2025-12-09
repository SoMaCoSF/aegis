# ==============================================================================
# file_id: SOM-SCR-0062-v1.0.0
# name: Start-AEGIS.ps1
# description: Smart AEGIS launcher - handles all services and prerequisites
# project_id: AEGIS
# category: script
# tags: [launcher, dashboard, tauri, startup]
# created: 2025-12-09
# modified: 2025-12-09
# version: 1.0.0
# agent_id: AGENT-PRIME-001
# execution: .\Start-AEGIS.ps1 [-Web] [-Desktop] [-All] [-Status] [-Stop]
# ==============================================================================

<#
.SYNOPSIS
    AEGIS Smart Launcher - One command to start everything.

.PARAMETER Web
    Start web dashboard only (localhost:4242 + API on :4243)

.PARAMETER Desktop
    Start Tauri desktop app (requires Rust)

.PARAMETER All
    Start both web dashboard and desktop app

.PARAMETER Status
    Check status of all services

.PARAMETER Stop
    Stop all running AEGIS services

.PARAMETER Install
    Install all dependencies

.EXAMPLE
    .\Start-AEGIS.ps1 -Web
    Start web dashboard at http://localhost:4242

.EXAMPLE
    .\Start-AEGIS.ps1 -Status
    Check what's running
#>

param(
    [switch]$Web,
    [switch]$Desktop,
    [switch]$All,
    [switch]$Status,
    [switch]$Stop,
    [switch]$Install
)

# ==============================================================================
# Configuration
# ==============================================================================

$ErrorActionPreference = "Continue"
$AegisRoot = $PSScriptRoot
$DashboardDir = Join-Path $AegisRoot "packages\dashboard"
$DesktopDir = Join-Path $AegisRoot "packages\desktop"

# Colors
$C_GREEN = "Green"
$C_RED = "Red"
$C_YELLOW = "Yellow"
$C_CYAN = "Cyan"
$C_WHITE = "White"
$C_GRAY = "DarkGray"

# ==============================================================================
# Helper Functions
# ==============================================================================

function Write-Banner {
    Write-Host ""
    Write-Host "    _    _____ ____ ___ ____  " -ForegroundColor $C_CYAN
    Write-Host "   / \  | ____/ ___|_ _/ ___| " -ForegroundColor $C_CYAN
    Write-Host "  / _ \ |  _|| |  _ | |\___ \ " -ForegroundColor $C_CYAN
    Write-Host " / ___ \| |__| |_| || | ___) |" -ForegroundColor $C_CYAN
    Write-Host "/_/   \_\_____\____|___|____/ " -ForegroundColor $C_CYAN
    Write-Host ""
    Write-Host "  Privacy Suite v1.0.0" -ForegroundColor $C_GRAY
    Write-Host ""
}

function Write-Status {
    param([string]$Label, [string]$Value, [string]$Color = $C_WHITE)
    Write-Host "  $Label" -NoNewline -ForegroundColor $C_GRAY
    Write-Host "$Value" -ForegroundColor $Color
}

function Write-Ok { param([string]$Msg) Write-Host "  [OK] $Msg" -ForegroundColor $C_GREEN }
function Write-Err { param([string]$Msg) Write-Host "  [!!] $Msg" -ForegroundColor $C_RED }
function Write-Warn { param([string]$Msg) Write-Host "  [**] $Msg" -ForegroundColor $C_YELLOW }
function Write-Info { param([string]$Msg) Write-Host "  [--] $Msg" -ForegroundColor $C_GRAY }

function Test-Port {
    param([int]$Port)
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

function Get-NodeVersion {
    try {
        $ver = & node --version 2>$null
        if ($ver -match 'v(\d+)') { return [int]$matches[1] }
    } catch {}
    return 0
}

function Get-RustPath {
    # Check standard PATH first
    $rustc = Get-Command rustc -ErrorAction SilentlyContinue
    if ($rustc) { return $rustc.Source }

    # Check default Cargo location
    $cargoRustc = Join-Path $env:USERPROFILE ".cargo\bin\rustc.exe"
    if (Test-Path $cargoRustc) { return $cargoRustc }

    return $null
}

function Add-CargoToPath {
    $cargoPath = Join-Path $env:USERPROFILE ".cargo\bin"
    if (Test-Path $cargoPath) {
        if ($env:PATH -notlike "*$cargoPath*") {
            $env:PATH = "$cargoPath;$env:PATH"
            return $true
        }
    }
    return $false
}

# ==============================================================================
# Status Check
# ==============================================================================

function Show-Status {
    Write-Banner
    Write-Host "  SERVICE STATUS" -ForegroundColor $C_WHITE
    Write-Host "  --------------" -ForegroundColor $C_GRAY

    # Dashboard (4242)
    if (Test-Port 4242) {
        Write-Ok "Dashboard:    http://localhost:4242"
    } else {
        Write-Err "Dashboard:    Not running"
    }

    # API (4243)
    if (Test-Port 4243) {
        Write-Ok "API Server:   http://localhost:4243"
        # Try to get status
        try {
            $status = Invoke-RestMethod -Uri "http://localhost:4243/api/status" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($status.dmbt.connected) {
                Write-Info "  DMBT: $($status.dmbt.stats.domains) domains, $($status.dmbt.stats.asns) ASNs"
            }
            if ($status.ghostShell.connected) {
                Write-Info "  Ghost_Shell: Connected"
            }
        } catch {}
    } else {
        Write-Err "API Server:   Not running"
    }

    Write-Host ""
    Write-Host "  PREREQUISITES" -ForegroundColor $C_WHITE
    Write-Host "  -------------" -ForegroundColor $C_GRAY

    # Node.js
    $nodeVer = Get-NodeVersion
    if ($nodeVer -ge 20) {
        Write-Ok "Node.js:      v$nodeVer (>= 20 required)"
    } elseif ($nodeVer -gt 0) {
        Write-Warn "Node.js:      v$nodeVer (v20+ recommended)"
    } else {
        Write-Err "Node.js:      Not installed"
    }

    # Rust (for Desktop)
    Add-CargoToPath | Out-Null
    $rustPath = Get-RustPath
    if ($rustPath) {
        try {
            $rustVer = & $rustPath --version 2>$null
            Write-Ok "Rust:         $rustVer"
        } catch {
            Write-Warn "Rust:         Installed but version check failed"
        }
    } else {
        Write-Warn "Rust:         Not installed (needed for Desktop app)"
        Write-Info "  Install: https://rustup.rs"
    }

    Write-Host ""
}

# ==============================================================================
# Start Web Dashboard
# ==============================================================================

function Start-WebDashboard {
    Write-Host ""
    Write-Host "  Starting Web Dashboard..." -ForegroundColor $C_CYAN

    # Check if already running
    if (Test-Port 4242) {
        Write-Ok "Dashboard already running at http://localhost:4242"
        return $true
    }

    # Check Node.js
    if ((Get-NodeVersion) -lt 18) {
        Write-Err "Node.js 18+ required. Install from https://nodejs.org"
        return $false
    }

    # Check node_modules
    $nodeModules = Join-Path $DashboardDir "node_modules"
    if (-not (Test-Path $nodeModules)) {
        Write-Info "Installing dependencies..."
        Push-Location $AegisRoot
        npm install 2>&1 | Out-Null
        Pop-Location
    }

    # Start dashboard
    Write-Info "Launching dashboard..."
    $job = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        npm run dev 2>&1
    } -ArgumentList $DashboardDir

    # Wait for startup
    $attempts = 0
    while ($attempts -lt 15) {
        Start-Sleep -Seconds 1
        if (Test-Port 4242) {
            Write-Ok "Dashboard ready at http://localhost:4242"
            Write-Ok "API ready at http://localhost:4243"

            # Open browser
            Start-Process "http://localhost:4242"
            return $true
        }
        $attempts++
        Write-Host "." -NoNewline -ForegroundColor $C_GRAY
    }

    Write-Err "Dashboard failed to start. Check logs."
    return $false
}

# ==============================================================================
# Start Desktop App
# ==============================================================================

function Start-DesktopApp {
    Write-Host ""
    Write-Host "  Starting Desktop App..." -ForegroundColor $C_CYAN

    # Add Cargo to PATH if needed
    if (Add-CargoToPath) {
        Write-Info "Added Cargo to PATH"
    }

    # Check Rust
    $rustPath = Get-RustPath
    if (-not $rustPath) {
        Write-Err "Rust not found. Install from https://rustup.rs"
        Write-Info "After installing, restart your terminal."
        return $false
    }

    # Ensure web dashboard is running (Tauri loads it)
    if (-not (Test-Port 4242)) {
        Write-Info "Starting web dashboard first..."
        if (-not (Start-WebDashboard)) {
            return $false
        }
    }

    # Check desktop node_modules
    $nodeModules = Join-Path $DesktopDir "node_modules"
    if (-not (Test-Path $nodeModules)) {
        Write-Info "Installing desktop dependencies..."
        Push-Location $DesktopDir
        npm install 2>&1 | Out-Null
        Pop-Location
    }

    # Start Tauri dev
    Write-Info "Launching Tauri app..."
    Push-Location $DesktopDir
    npm run dev
    Pop-Location

    return $true
}

# ==============================================================================
# Stop Services
# ==============================================================================

function Stop-AegisServices {
    Write-Host ""
    Write-Host "  Stopping AEGIS services..." -ForegroundColor $C_CYAN

    # Find and kill node processes on our ports
    $procs = Get-NetTCPConnection -LocalPort 4242,4243 -ErrorAction SilentlyContinue |
             Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($pid in $procs) {
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc -and $proc.Name -eq "node") {
                Stop-Process -Id $pid -Force
                Write-Ok "Stopped process $pid ($($proc.Name))"
            }
        } catch {}
    }

    # Also stop any background jobs
    Get-Job | Where-Object { $_.State -eq "Running" } | Stop-Job
    Get-Job | Remove-Job -Force

    Write-Ok "Services stopped"
}

# ==============================================================================
# Install Dependencies
# ==============================================================================

function Install-Dependencies {
    Write-Host ""
    Write-Host "  Installing dependencies..." -ForegroundColor $C_CYAN

    # Root
    Write-Info "Installing root packages..."
    Push-Location $AegisRoot
    npm install 2>&1 | Out-Null
    Pop-Location
    Write-Ok "Root packages installed"

    # Desktop
    if (Test-Path $DesktopDir) {
        Write-Info "Installing desktop packages..."
        Push-Location $DesktopDir
        npm install 2>&1 | Out-Null
        Pop-Location
        Write-Ok "Desktop packages installed"
    }

    Write-Ok "All dependencies installed"
}

# ==============================================================================
# Main
# ==============================================================================

Write-Banner

# Handle parameters
if ($Status -or (-not $Web -and -not $Desktop -and -not $All -and -not $Stop -and -not $Install)) {
    Show-Status

    if (-not $Status) {
        Write-Host "  USAGE" -ForegroundColor $C_WHITE
        Write-Host "  -----" -ForegroundColor $C_GRAY
        Write-Host "  .\Start-AEGIS.ps1 -Web      " -NoNewline -ForegroundColor $C_CYAN
        Write-Host "Start web dashboard" -ForegroundColor $C_GRAY
        Write-Host "  .\Start-AEGIS.ps1 -Desktop  " -NoNewline -ForegroundColor $C_CYAN
        Write-Host "Start Tauri desktop app" -ForegroundColor $C_GRAY
        Write-Host "  .\Start-AEGIS.ps1 -All      " -NoNewline -ForegroundColor $C_CYAN
        Write-Host "Start everything" -ForegroundColor $C_GRAY
        Write-Host "  .\Start-AEGIS.ps1 -Status   " -NoNewline -ForegroundColor $C_CYAN
        Write-Host "Check service status" -ForegroundColor $C_GRAY
        Write-Host "  .\Start-AEGIS.ps1 -Stop     " -NoNewline -ForegroundColor $C_CYAN
        Write-Host "Stop all services" -ForegroundColor $C_GRAY
        Write-Host "  .\Start-AEGIS.ps1 -Install  " -NoNewline -ForegroundColor $C_CYAN
        Write-Host "Install dependencies" -ForegroundColor $C_GRAY
        Write-Host ""
    }
    exit 0
}

if ($Stop) {
    Stop-AegisServices
    exit 0
}

if ($Install) {
    Install-Dependencies
    exit 0
}

if ($Web -or $All) {
    Start-WebDashboard
}

if ($Desktop -or $All) {
    Start-DesktopApp
}

Write-Host ""
