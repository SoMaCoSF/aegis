# ==============================================================================
# file_id: SOM-SCR-0061-v1.0.0
# name: build-aegis-desktop.ps1
# description: AEGIS Desktop - Tauri build and launch script with validation
# project_id: AEGIS
# category: script
# tags: [tauri, build, installer, desktop]
# created: 2025-12-09
# modified: 2025-12-09
# version: 1.0.0
# agent_id: AGENT-PRIME-001
# execution: .\build-aegis-desktop.ps1 [-Dev] [-Build] [-Install] [-Launch] [-Verbose]
# ==============================================================================

<#
.SYNOPSIS
    AEGIS Desktop Builder - Validates environment, builds, and launches the Tauri app.

.DESCRIPTION
    This script provides a guided experience for building and running the AEGIS
    desktop application. It validates all prerequisites, provides clear feedback,
    and handles common issues automatically.

.PARAMETER Dev
    Run in development mode with hot reload.

.PARAMETER Build
    Build release installer (NSIS/MSI).

.PARAMETER Install
    Install dependencies only (npm + cargo).

.PARAMETER Launch
    Launch the built application.

.PARAMETER Clean
    Clean build artifacts before building.

.PARAMETER Verbose
    Show detailed output for all operations.

.PARAMETER Help
    Show this help message.

.EXAMPLE
    .\build-aegis-desktop.ps1 -Dev
    Run in development mode.

.EXAMPLE
    .\build-aegis-desktop.ps1 -Build -Verbose
    Build release installer with detailed logging.

.EXAMPLE
    .\build-aegis-desktop.ps1 -Install
    Install all dependencies without building.
#>

param(
    [switch]$Dev,
    [switch]$Build,
    [switch]$Install,
    [switch]$Launch,
    [switch]$Clean,
    [switch]$Verbose,
    [switch]$Help
)

# ==============================================================================
# Configuration
# ==============================================================================

$ErrorActionPreference = "Stop"
$ScriptRoot = $PSScriptRoot
$AegisRoot = (Get-Item $ScriptRoot).Parent.Parent.FullName
$DesktopRoot = $ScriptRoot
$DashboardRoot = Join-Path $AegisRoot "packages\dashboard"
$TauriRoot = Join-Path $DesktopRoot "src-tauri"
$LogDir = Join-Path $AegisRoot "logs"
$LogFile = Join-Path $LogDir "desktop-build-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log"

# Minimum versions
$MinNodeVersion = [version]"20.0.0"
$MinRustVersion = [version]"1.70.0"

# ==============================================================================
# Logging Functions
# ==============================================================================

function Initialize-Logging {
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    "AEGIS Desktop Build Log - $(Get-Date)" | Out-File $LogFile
    "=" * 60 | Out-File $LogFile -Append
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logLine = "[$timestamp] [$Level] $Message"
    $logLine | Out-File $LogFile -Append

    if ($Verbose -or $Level -eq "ERROR") {
        Write-Host $logLine -ForegroundColor $(
            switch ($Level) {
                "ERROR" { "Red" }
                "WARN"  { "Yellow" }
                "OK"    { "Green" }
                default { "Gray" }
            }
        )
    }
}

# ==============================================================================
# UI Functions
# ==============================================================================

function Write-Banner {
    $banner = @"

    ╔═══════════════════════════════════════════════════════════════════════╗
    ║                                                                       ║
    ║     █████╗ ███████╗ ██████╗ ██╗███████╗                              ║
    ║    ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝                              ║
    ║    ███████║█████╗  ██║  ███╗██║███████╗                              ║
    ║    ██╔══██║██╔══╝  ██║   ██║██║╚════██║                              ║
    ║    ██║  ██║███████╗╚██████╔╝██║███████║                              ║
    ║    ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝                              ║
    ║                                                                       ║
    ║              Desktop Application Builder v1.0.0                       ║
    ║                        Powered by Tauri                               ║
    ╚═══════════════════════════════════════════════════════════════════════╝

"@
    Write-Host $banner -ForegroundColor Cyan
}

function Write-Step {
    param(
        [int]$Step,
        [int]$Total,
        [string]$Description
    )
    Write-Host ""
    Write-Host "  ┌─────────────────────────────────────────────────────────────────┐" -ForegroundColor DarkCyan
    Write-Host "  │  STEP $Step of $Total`: $Description" -ForegroundColor Cyan
    Write-Host "  └─────────────────────────────────────────────────────────────────┘" -ForegroundColor DarkCyan
    Write-Host ""
    Write-Log "STEP $Step/$Total: $Description"
}

function Write-Status {
    param(
        [string]$Item,
        [string]$Status,
        [string]$Detail = ""
    )
    $statusIcon = switch ($Status) {
        "OK"      { "[  OK  ]"; $color = "Green" }
        "WARN"    { "[ WARN ]"; $color = "Yellow" }
        "FAIL"    { "[ FAIL ]"; $color = "Red" }
        "SKIP"    { "[ SKIP ]"; $color = "DarkGray" }
        "INFO"    { "[ INFO ]"; $color = "Cyan" }
        "WAIT"    { "[ .... ]"; $color = "White" }
        default   { "[  --  ]"; $color = "Gray" }
    }

    $line = "    $statusIcon $Item"
    if ($Detail) {
        $line += " - $Detail"
    }
    Write-Host $line -ForegroundColor $color
    Write-Log "$Status: $Item $Detail" -Level $Status
}

function Write-Progress-Bar {
    param(
        [int]$Percent,
        [string]$Activity
    )
    $width = 40
    $complete = [math]::Floor($width * $Percent / 100)
    $remaining = $width - $complete

    $bar = "█" * $complete + "░" * $remaining
    Write-Host "`r    [$bar] $Percent% - $Activity" -NoNewline -ForegroundColor Cyan

    if ($Percent -eq 100) {
        Write-Host ""
    }
}

function Write-Instruction {
    param(
        [string]$Title,
        [string[]]$Steps
    )
    Write-Host ""
    Write-Host "    ┌─ $Title " -ForegroundColor Yellow -NoNewline
    Write-Host ("─" * (60 - $Title.Length)) -ForegroundColor DarkYellow
    $i = 1
    foreach ($step in $Steps) {
        Write-Host "    │  $i. $step" -ForegroundColor White
        $i++
    }
    Write-Host "    └" -ForegroundColor DarkYellow -NoNewline
    Write-Host ("─" * 64) -ForegroundColor DarkYellow
    Write-Host ""
}

# ==============================================================================
# Validation Functions
# ==============================================================================

function Test-Command {
    param([string]$Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Get-NodeVersion {
    try {
        $versionString = & node --version 2>$null
        if ($versionString -match 'v(\d+\.\d+\.\d+)') {
            return [version]$matches[1]
        }
    } catch {}
    return $null
}

function Get-RustVersion {
    try {
        $versionString = & rustc --version 2>$null
        if ($versionString -match '(\d+\.\d+\.\d+)') {
            return [version]$matches[1]
        }
    } catch {}
    return $null
}

function Test-Prerequisites {
    Write-Step -Step 1 -Total 5 -Description "Validating Prerequisites"

    $allPassed = $true

    # Node.js
    Write-Status -Item "Checking Node.js..." -Status "WAIT"
    $nodeVersion = Get-NodeVersion
    if ($nodeVersion) {
        if ($nodeVersion -ge $MinNodeVersion) {
            Write-Status -Item "Node.js" -Status "OK" -Detail "v$nodeVersion (required: v$MinNodeVersion+)"
        } else {
            Write-Status -Item "Node.js" -Status "FAIL" -Detail "v$nodeVersion (required: v$MinNodeVersion+)"
            $allPassed = $false
        }
    } else {
        Write-Status -Item "Node.js" -Status "FAIL" -Detail "Not installed"
        Write-Instruction -Title "Install Node.js" -Steps @(
            "Download from https://nodejs.org/",
            "Run the installer",
            "Restart this terminal",
            "Run this script again"
        )
        $allPassed = $false
    }

    # npm
    if (Test-Command "npm") {
        $npmVersion = & npm --version 2>$null
        Write-Status -Item "npm" -Status "OK" -Detail "v$npmVersion"
    } else {
        Write-Status -Item "npm" -Status "FAIL" -Detail "Not found (comes with Node.js)"
        $allPassed = $false
    }

    # Rust
    Write-Status -Item "Checking Rust..." -Status "WAIT"
    $rustVersion = Get-RustVersion
    if ($rustVersion) {
        if ($rustVersion -ge $MinRustVersion) {
            Write-Status -Item "Rust" -Status "OK" -Detail "v$rustVersion (required: v$MinRustVersion+)"
        } else {
            Write-Status -Item "Rust" -Status "WARN" -Detail "v$rustVersion (recommended: v$MinRustVersion+)"
        }
    } else {
        Write-Status -Item "Rust" -Status "FAIL" -Detail "Not installed or not in PATH"
        Write-Instruction -Title "Install Rust" -Steps @(
            "Download rustup from https://rustup.rs/",
            "Run: rustup-init.exe",
            "Select default installation",
            "IMPORTANT: Open a NEW terminal after installation",
            "Verify with: rustc --version"
        )
        $allPassed = $false
    }

    # Cargo
    if (Test-Command "cargo") {
        $cargoVersion = & cargo --version 2>$null
        if ($cargoVersion -match '(\d+\.\d+\.\d+)') {
            Write-Status -Item "Cargo" -Status "OK" -Detail "v$($matches[1])"
        }
    } else {
        Write-Status -Item "Cargo" -Status "FAIL" -Detail "Not found (comes with Rust)"
        $allPassed = $false
    }

    # WebView2 (Windows)
    if ($env:OS -eq "Windows_NT") {
        $webview2 = Get-ItemProperty -Path "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue
        if ($webview2) {
            Write-Status -Item "WebView2 Runtime" -Status "OK" -Detail "Installed"
        } else {
            # Check user install
            $webview2User = Get-ItemProperty -Path "HKCU:\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue
            if ($webview2User) {
                Write-Status -Item "WebView2 Runtime" -Status "OK" -Detail "Installed (user)"
            } else {
                Write-Status -Item "WebView2 Runtime" -Status "WARN" -Detail "May need installation"
                Write-Host "      WebView2 is usually pre-installed on Windows 10/11" -ForegroundColor DarkGray
                Write-Host "      If app fails to launch, download from:" -ForegroundColor DarkGray
                Write-Host "      https://developer.microsoft.com/en-us/microsoft-edge/webview2/" -ForegroundColor DarkGray
            }
        }
    }

    # Git (optional but useful)
    if (Test-Command "git") {
        $gitVersion = & git --version 2>$null
        Write-Status -Item "Git" -Status "OK" -Detail $gitVersion
    } else {
        Write-Status -Item "Git" -Status "SKIP" -Detail "Optional - not required for build"
    }

    return $allPassed
}

function Test-ProjectStructure {
    Write-Step -Step 2 -Total 5 -Description "Validating Project Structure"

    $allPassed = $true

    # Check critical directories
    $requiredDirs = @(
        @{ Path = $AegisRoot; Name = "AEGIS Root" }
        @{ Path = $DashboardRoot; Name = "Dashboard Package" }
        @{ Path = $DesktopRoot; Name = "Desktop Package" }
        @{ Path = $TauriRoot; Name = "Tauri Source" }
    )

    foreach ($dir in $requiredDirs) {
        if (Test-Path $dir.Path) {
            Write-Status -Item $dir.Name -Status "OK" -Detail $dir.Path
        } else {
            Write-Status -Item $dir.Name -Status "FAIL" -Detail "Directory not found"
            $allPassed = $false
        }
    }

    # Check critical files
    $requiredFiles = @(
        @{ Path = (Join-Path $TauriRoot "Cargo.toml"); Name = "Cargo.toml" }
        @{ Path = (Join-Path $TauriRoot "tauri.conf.json"); Name = "tauri.conf.json" }
        @{ Path = (Join-Path $TauriRoot "src\main.rs"); Name = "main.rs" }
        @{ Path = (Join-Path $DashboardRoot "package.json"); Name = "Dashboard package.json" }
    )

    foreach ($file in $requiredFiles) {
        if (Test-Path $file.Path) {
            Write-Status -Item $file.Name -Status "OK"
        } else {
            Write-Status -Item $file.Name -Status "FAIL" -Detail "File not found: $($file.Path)"
            $allPassed = $false
        }
    }

    return $allPassed
}

function Install-Dependencies {
    Write-Step -Step 3 -Total 5 -Description "Installing Dependencies"

    # Dashboard npm dependencies
    Write-Host ""
    Write-Host "    Installing Dashboard dependencies..." -ForegroundColor White
    Write-Log "Installing dashboard npm dependencies"

    Push-Location $DashboardRoot
    try {
        $output = & npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status -Item "Dashboard npm packages" -Status "OK"
        } else {
            Write-Status -Item "Dashboard npm packages" -Status "FAIL" -Detail "npm install failed"
            Write-Log "npm install output: $output" -Level "ERROR"
            return $false
        }
    } finally {
        Pop-Location
    }

    # Desktop npm dependencies
    Write-Host ""
    Write-Host "    Installing Desktop dependencies..." -ForegroundColor White
    Write-Log "Installing desktop npm dependencies"

    Push-Location $DesktopRoot
    try {
        $output = & npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status -Item "Desktop npm packages" -Status "OK"
        } else {
            Write-Status -Item "Desktop npm packages" -Status "FAIL" -Detail "npm install failed"
            Write-Log "npm install output: $output" -Level "ERROR"
            return $false
        }
    } finally {
        Pop-Location
    }

    # Rust/Cargo dependencies (fetch only)
    Write-Host ""
    Write-Host "    Fetching Rust dependencies (this may take a few minutes on first run)..." -ForegroundColor White
    Write-Log "Fetching cargo dependencies"

    Push-Location $TauriRoot
    try {
        $output = & cargo fetch 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status -Item "Rust crates" -Status "OK"
        } else {
            Write-Status -Item "Rust crates" -Status "WARN" -Detail "cargo fetch had warnings"
            Write-Log "cargo fetch output: $output" -Level "WARN"
        }
    } finally {
        Pop-Location
    }

    return $true
}

function Start-DevMode {
    Write-Step -Step 4 -Total 5 -Description "Starting Development Mode"

    Write-Host ""
    Write-Host "    ┌─────────────────────────────────────────────────────────────────┐" -ForegroundColor Green
    Write-Host "    │  Development mode will:                                         │" -ForegroundColor Green
    Write-Host "    │    1. Start Vite dev server (React frontend)                   │" -ForegroundColor White
    Write-Host "    │    2. Compile Rust code (first time ~2-5 minutes)              │" -ForegroundColor White
    Write-Host "    │    3. Launch Tauri window pointing to localhost:4242           │" -ForegroundColor White
    Write-Host "    │    4. Enable hot-reload for frontend changes                   │" -ForegroundColor White
    Write-Host "    │                                                                 │" -ForegroundColor Green
    Write-Host "    │  NOTE: You also need the API server running separately:        │" -ForegroundColor Yellow
    Write-Host "    │        cd $AegisRoot" -ForegroundColor Yellow
    Write-Host "    │        npm run dashboard                                        │" -ForegroundColor Yellow
    Write-Host "    └─────────────────────────────────────────────────────────────────┘" -ForegroundColor Green
    Write-Host ""

    Write-Log "Starting Tauri dev mode"

    Push-Location $DesktopRoot
    try {
        Write-Host "    Starting Tauri development server..." -ForegroundColor Cyan
        Write-Host "    (Press Ctrl+C to stop)" -ForegroundColor DarkGray
        Write-Host ""

        & npm run dev
    } finally {
        Pop-Location
    }
}

function Start-Build {
    Write-Step -Step 4 -Total 5 -Description "Building Release Installer"

    Write-Host ""
    Write-Host "    ┌─────────────────────────────────────────────────────────────────┐" -ForegroundColor Green
    Write-Host "    │  Building release installer:                                    │" -ForegroundColor Green
    Write-Host "    │    1. Build React frontend (production)                        │" -ForegroundColor White
    Write-Host "    │    2. Compile Rust (release mode, optimized)                   │" -ForegroundColor White
    Write-Host "    │    3. Bundle into NSIS installer (.exe)                        │" -ForegroundColor White
    Write-Host "    │    4. Bundle into MSI installer (.msi)                         │" -ForegroundColor White
    Write-Host "    │                                                                 │" -ForegroundColor Green
    Write-Host "    │  This process takes 5-15 minutes on first build.               │" -ForegroundColor Yellow
    Write-Host "    └─────────────────────────────────────────────────────────────────┘" -ForegroundColor Green
    Write-Host ""

    if ($Clean) {
        Write-Host "    Cleaning previous build artifacts..." -ForegroundColor Yellow
        $targetDir = Join-Path $TauriRoot "target"
        if (Test-Path $targetDir) {
            Remove-Item -Recurse -Force $targetDir
            Write-Status -Item "Cleaned target directory" -Status "OK"
        }
    }

    Write-Log "Starting Tauri build"

    Push-Location $DesktopRoot
    try {
        Write-Host "    Building..." -ForegroundColor Cyan
        Write-Host ""

        $buildStart = Get-Date
        & npm run build
        $buildEnd = Get-Date
        $buildTime = $buildEnd - $buildStart

        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Status -Item "Build completed" -Status "OK" -Detail "Time: $($buildTime.ToString('mm\:ss'))"

            # Show output location
            $bundleDir = Join-Path $TauriRoot "target\release\bundle"
            Write-Host ""
            Write-Host "    ┌─ Build Output " -ForegroundColor Green -NoNewline
            Write-Host ("─" * 50) -ForegroundColor DarkGreen

            if (Test-Path (Join-Path $bundleDir "nsis")) {
                $nsisExe = Get-ChildItem (Join-Path $bundleDir "nsis") -Filter "*.exe" | Select-Object -First 1
                if ($nsisExe) {
                    Write-Host "    │  NSIS Installer: $($nsisExe.FullName)" -ForegroundColor White
                    Write-Host "    │  Size: $([math]::Round($nsisExe.Length / 1MB, 2)) MB" -ForegroundColor DarkGray
                }
            }

            if (Test-Path (Join-Path $bundleDir "msi")) {
                $msiFile = Get-ChildItem (Join-Path $bundleDir "msi") -Filter "*.msi" | Select-Object -First 1
                if ($msiFile) {
                    Write-Host "    │  MSI Installer:  $($msiFile.FullName)" -ForegroundColor White
                    Write-Host "    │  Size: $([math]::Round($msiFile.Length / 1MB, 2)) MB" -ForegroundColor DarkGray
                }
            }

            Write-Host "    └" -ForegroundColor DarkGreen -NoNewline
            Write-Host ("─" * 64) -ForegroundColor DarkGreen

        } else {
            Write-Status -Item "Build failed" -Status "FAIL"
            return $false
        }
    } finally {
        Pop-Location
    }

    return $true
}

function Start-Application {
    Write-Step -Step 5 -Total 5 -Description "Launching AEGIS Desktop"

    $exePath = Join-Path $TauriRoot "target\release\aegis-desktop.exe"

    if (Test-Path $exePath) {
        Write-Host ""
        Write-Host "    Launching AEGIS Desktop..." -ForegroundColor Cyan
        Write-Log "Launching application: $exePath"

        Start-Process $exePath

        Write-Host ""
        Write-Host "    ┌─────────────────────────────────────────────────────────────────┐" -ForegroundColor Green
        Write-Host "    │  AEGIS Desktop is starting!                                     │" -ForegroundColor Green
        Write-Host "    │                                                                 │" -ForegroundColor Green
        Write-Host "    │  • Window will appear shortly                                  │" -ForegroundColor White
        Write-Host "    │  • Look for shield icon in system tray                         │" -ForegroundColor White
        Write-Host "    │  • Close minimizes to tray (right-click tray to quit)          │" -ForegroundColor White
        Write-Host "    │                                                                 │" -ForegroundColor Green
        Write-Host "    │  Make sure the API server is running:                          │" -ForegroundColor Yellow
        Write-Host "    │    npm run dashboard (from aegis root)                         │" -ForegroundColor Yellow
        Write-Host "    └─────────────────────────────────────────────────────────────────┘" -ForegroundColor Green

        return $true
    } else {
        Write-Status -Item "Application executable" -Status "FAIL" -Detail "Not found. Run -Build first."
        return $false
    }
}

function Show-Summary {
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║                           BUILD COMPLETE                               ║" -ForegroundColor Cyan
    Write-Host "  ╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    Log file: $LogFile" -ForegroundColor DarkGray
    Write-Host ""
}

function Show-Help {
    Write-Banner
    Get-Help $MyInvocation.PSCommandPath -Full
}

# ==============================================================================
# Main Execution
# ==============================================================================

if ($Help) {
    Show-Help
    exit 0
}

# Default to -Dev if no action specified
if (-not $Dev -and -not $Build -and -not $Install -and -not $Launch) {
    $Dev = $true
}

Write-Banner
Initialize-Logging

Write-Host "    Mode: $(if ($Dev) { 'Development' } elseif ($Build) { 'Build Release' } elseif ($Install) { 'Install Only' } else { 'Launch' })" -ForegroundColor White
Write-Host "    Log:  $LogFile" -ForegroundColor DarkGray
Write-Host ""

# Step 1: Prerequisites
if (-not (Test-Prerequisites)) {
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "  ║  PREREQUISITES NOT MET - Please install missing dependencies above    ║" -ForegroundColor Red
    Write-Host "  ╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Step 2: Project structure
if (-not (Test-ProjectStructure)) {
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "  ║  PROJECT STRUCTURE INVALID - Missing required files                   ║" -ForegroundColor Red
    Write-Host "  ╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Step 3: Install dependencies
if (-not (Install-Dependencies)) {
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "  ║  DEPENDENCY INSTALLATION FAILED - Check log for details               ║" -ForegroundColor Red
    Write-Host "  ╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    exit 1
}

if ($Install) {
    Show-Summary
    Write-Host "    Dependencies installed successfully!" -ForegroundColor Green
    Write-Host "    Run with -Dev or -Build to continue." -ForegroundColor White
    Write-Host ""
    exit 0
}

# Step 4: Dev or Build
if ($Dev) {
    Start-DevMode
} elseif ($Build) {
    if (-not (Start-Build)) {
        exit 1
    }

    if ($Launch) {
        Start-Application
    }
}

# Step 5: Launch only
if ($Launch -and -not $Build) {
    Start-Application
}

Show-Summary
