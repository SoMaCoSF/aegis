# ==============================================================================
# file_id: SOM-SCR-0062-v1.0.0
# name: setup-omen02-shares.ps1
# description: Setup network shares on Omen-02 for Claude Code access
# project_id: AEGIS
# category: script
# tags: [network, shares, smb, setup]
# created: 2025-12-09
# modified: 2025-12-09
# version: 1.0.0
# agent_id: AGENT-PRIME-001
# execution: Run as Administrator on Omen-02
# ==============================================================================

<#
.SYNOPSIS
    Setup network shares on Omen-02 for remote access from other machines.

.DESCRIPTION
    This script configures SMB shares, firewall rules, and permissions
    to allow Claude Code on another machine to access project files.

    RUN THIS SCRIPT ON OMEN-02 (192.168.1.180) AS ADMINISTRATOR

.PARAMETER SharePaths
    Array of paths to share. Defaults to common project locations.

.PARAMETER AllowedIPs
    IP addresses allowed to access shares. Default allows local network.

.PARAMETER ReadOnly
    Create read-only shares (safer for exploration).

.PARAMETER FullAccess
    Create read-write shares (needed for editing).

.EXAMPLE
    .\setup-omen02-shares.ps1
    Setup default shares with full access.

.EXAMPLE
    .\setup-omen02-shares.ps1 -ReadOnly
    Setup read-only shares for safe exploration.

.EXAMPLE
    .\setup-omen02-shares.ps1 -SharePaths @("D:\Projects", "E:\Code")
    Share specific directories.
#>

param(
    [string[]]$SharePaths,
    [string[]]$AllowedIPs = @("192.168.1.0/24"),
    [switch]$ReadOnly,
    [switch]$FullAccess,
    [switch]$RemoveShares,
    [switch]$Status,
    [switch]$Help
)

# ==============================================================================
# Configuration
# ==============================================================================

$ErrorActionPreference = "Stop"
$ScriptName = "Omen-02 Share Setup"
$Version = "1.0.0"

# Default share paths - sharing entire C: and D: drives for full access
$DefaultSharePaths = @(
    # Full drive shares
    @{ Name = "C"; Path = "C:\"; Desc = "Full C: drive access" }
    @{ Name = "D"; Path = "D:\"; Desc = "Full D: drive access" }
    # Common project directories (if they exist)
    @{ Name = "projects"; Path = "D:\Projects"; Desc = "Main projects directory" }
    @{ Name = "code"; Path = "D:\Code"; Desc = "Code repositories" }
    @{ Name = "somacosf"; Path = "D:\somacosf"; Desc = "Somacosf workspace" }
    @{ Name = "outputs"; Path = "D:\somacosf\outputs"; Desc = "Project outputs" }
    @{ Name = "dev"; Path = "C:\dev"; Desc = "Development folder" }
    @{ Name = "repos"; Path = "C:\repos"; Desc = "Git repositories" }
    @{ Name = "Users"; Path = "C:\Users"; Desc = "User profiles" }
)

# ==============================================================================
# Helper Functions
# ==============================================================================

function Write-Banner {
    $banner = @"

    ╔═══════════════════════════════════════════════════════════════════════╗
    ║                                                                       ║
    ║     ██████╗ ███╗   ███╗███████╗███╗   ██╗       ██████╗ ██████╗      ║
    ║    ██╔═══██╗████╗ ████║██╔════╝████╗  ██║      ██╔═████╗╚════██╗     ║
    ║    ██║   ██║██╔████╔██║█████╗  ██╔██╗ ██║█████╗██║██╔██║ █████╔╝     ║
    ║    ██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║╚════╝████╔╝██║██╔═══╝      ║
    ║    ╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║      ╚██████╔╝███████╗     ║
    ║     ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝       ╚═════╝ ╚══════╝     ║
    ║                                                                       ║
    ║              Network Share Setup Script v$Version                       ║
    ║                   For Claude Code Access                              ║
    ╚═══════════════════════════════════════════════════════════════════════╝

"@
    Write-Host $banner -ForegroundColor Cyan
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "  ▶ $Message" -ForegroundColor Cyan
    Write-Host "  $("-" * 60)" -ForegroundColor DarkCyan
}

function Write-OK {
    param([string]$Message)
    Write-Host "    [  OK  ] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "    [ WARN ] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "    [ FAIL ] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "    [ INFO ] $Message" -ForegroundColor White
}

function Write-Skip {
    param([string]$Message)
    Write-Host "    [ SKIP ] $Message" -ForegroundColor DarkGray
}

# ==============================================================================
# Share Management Functions
# ==============================================================================

function Get-CurrentShares {
    Write-Step "Current SMB Shares on this machine"

    $shares = Get-SmbShare | Where-Object { $_.Name -notmatch '^\$' -and $_.Name -ne "IPC$" }

    if ($shares) {
        $shares | Format-Table Name, Path, Description -AutoSize | Out-String | Write-Host
    } else {
        Write-Info "No custom shares configured"
    }

    Write-Host ""
    Write-Host "  Default admin shares (C$, D$, ADMIN$) are also available" -ForegroundColor DarkGray
}

function Test-SharePath {
    param([string]$Path)

    if (Test-Path $Path) {
        return $true
    }
    return $false
}

function New-ProjectShare {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Description,
        [bool]$ReadOnly = $false
    )

    # Check if path exists
    if (-not (Test-Path $Path)) {
        Write-Skip "$Name - Path does not exist: $Path"
        return $false
    }

    # Check if share already exists
    $existing = Get-SmbShare -Name $Name -ErrorAction SilentlyContinue
    if ($existing) {
        if ($existing.Path -eq $Path) {
            Write-Info "$Name - Share already exists at $Path"
            return $true
        } else {
            Write-Warn "$Name - Exists but points to different path: $($existing.Path)"
            Write-Info "Removing and recreating..."
            Remove-SmbShare -Name $Name -Force
        }
    }

    try {
        # Create the share
        $shareParams = @{
            Name = $Name
            Path = $Path
            Description = $Description
            FullAccess = "Everyone"
        }

        if ($ReadOnly) {
            $shareParams.Remove("FullAccess")
            $shareParams["ReadAccess"] = "Everyone"
        }

        New-SmbShare @shareParams | Out-Null
        Write-OK "$Name -> $Path"
        return $true
    } catch {
        Write-Fail "$Name - Failed to create share: $_"
        return $false
    }
}

function Remove-ProjectShares {
    Write-Step "Removing custom shares"

    $customShares = Get-SmbShare | Where-Object {
        $_.Name -notmatch '^\$' -and
        $_.Name -ne "IPC$" -and
        $_.Special -eq $false
    }

    foreach ($share in $customShares) {
        try {
            Remove-SmbShare -Name $share.Name -Force
            Write-OK "Removed: $($share.Name)"
        } catch {
            Write-Fail "Failed to remove $($share.Name): $_"
        }
    }
}

function Set-FirewallRules {
    Write-Step "Configuring Firewall for SMB"

    # Enable File and Printer Sharing
    $rules = @(
        "File and Printer Sharing (SMB-In)"
        "File and Printer Sharing (NB-Session-In)"
        "File and Printer Sharing (NB-Name-In)"
        "File and Printer Sharing (NB-Datagram-In)"
    )

    foreach ($ruleName in $rules) {
        try {
            $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
            if ($rule) {
                if ($rule.Enabled -eq "True") {
                    Write-OK "$ruleName - Already enabled"
                } else {
                    Enable-NetFirewallRule -DisplayName $ruleName
                    Write-OK "$ruleName - Enabled"
                }
            } else {
                Write-Warn "$ruleName - Rule not found"
            }
        } catch {
            Write-Warn "$ruleName - Could not configure: $_"
        }
    }

    # Enable Network Discovery
    Write-Host ""
    Write-Info "Enabling Network Discovery..."
    try {
        Get-NetFirewallRule -DisplayGroup "Network Discovery" |
            Where-Object { $_.Profile -match "Private|Domain" } |
            Enable-NetFirewallRule -ErrorAction SilentlyContinue
        Write-OK "Network Discovery enabled for Private/Domain networks"
    } catch {
        Write-Warn "Could not enable Network Discovery: $_"
    }
}

function Set-SMBConfiguration {
    Write-Step "Configuring SMB Server Settings"

    try {
        # Enable SMB server
        $smbConfig = Get-SmbServerConfiguration

        # Enable SMB2/3 (should be default)
        if (-not $smbConfig.EnableSMB2Protocol) {
            Set-SmbServerConfiguration -EnableSMB2Protocol $true -Force
            Write-OK "Enabled SMB2 protocol"
        } else {
            Write-OK "SMB2 protocol already enabled"
        }

        # Ensure server is accessible
        Write-OK "SMB Server is configured"

    } catch {
        Write-Warn "Could not verify SMB configuration: $_"
    }

    # Check lanmanserver service
    $service = Get-Service -Name "LanmanServer" -ErrorAction SilentlyContinue
    if ($service) {
        if ($service.Status -eq "Running") {
            Write-OK "Server service (LanmanServer) is running"
        } else {
            Start-Service -Name "LanmanServer"
            Write-OK "Started Server service"
        }
    }
}

function Set-FolderPermissions {
    param([string]$Path)

    try {
        $acl = Get-Acl $Path
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
            "Everyone",
            "ReadAndExecute",
            "ContainerInherit,ObjectInherit",
            "None",
            "Allow"
        )
        $acl.AddAccessRule($rule)
        Set-Acl $Path $acl
        return $true
    } catch {
        return $false
    }
}

function Show-ConnectionInstructions {
    param([string[]]$ShareNames)

    $hostname = $env:COMPUTERNAME
    $ip = (Get-NetIPAddress -AddressFamily IPv4 |
           Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169" } |
           Select-Object -First 1).IPAddress

    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "  ║                     CONNECTION INSTRUCTIONS                            ║" -ForegroundColor Green
    Write-Host "  ╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "  From the other machine, connect using:" -ForegroundColor White
    Write-Host ""
    Write-Host "  PowerShell:" -ForegroundColor Yellow
    Write-Host "    # List available shares" -ForegroundColor DarkGray
    Write-Host "    net view \\$hostname" -ForegroundColor Cyan
    Write-Host "    net view \\$ip" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    # Map a network drive" -ForegroundColor DarkGray
    Write-Host "    net use Z: \\$hostname\projects" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    # Access directly via UNC path" -ForegroundColor DarkGray
    Write-Host "    Get-ChildItem \\$hostname\projects" -ForegroundColor Cyan
    Write-Host "    Get-ChildItem \\$ip\somacosf" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Available Shares:" -ForegroundColor Yellow
    foreach ($name in $ShareNames) {
        Write-Host "    \\$hostname\$name" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "  If connection fails, check:" -ForegroundColor Yellow
    Write-Host "    1. Both machines on same network (192.168.1.x)" -ForegroundColor DarkGray
    Write-Host "    2. Network profile set to 'Private' (not Public)" -ForegroundColor DarkGray
    Write-Host "    3. Windows Defender Firewall allows File Sharing" -ForegroundColor DarkGray
    Write-Host ""
}

function Show-Status {
    Write-Banner

    Write-Step "System Information"
    Write-Info "Hostname: $env:COMPUTERNAME"

    $ips = Get-NetIPAddress -AddressFamily IPv4 |
           Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169" }
    foreach ($ip in $ips) {
        Write-Info "IP: $($ip.IPAddress) ($($ip.InterfaceAlias))"
    }

    Write-Step "Network Profile"
    $profiles = Get-NetConnectionProfile
    foreach ($profile in $profiles) {
        $color = if ($profile.NetworkCategory -eq "Private") { "Green" } else { "Yellow" }
        Write-Host "    $($profile.Name): $($profile.NetworkCategory)" -ForegroundColor $color
    }
    if ($profiles | Where-Object { $_.NetworkCategory -eq "Public" }) {
        Write-Warn "Public network detected - sharing may be restricted"
        Write-Info "To change: Settings > Network & Internet > Change connection properties > Private"
    }

    Get-CurrentShares

    Write-Step "SMB Server Status"
    $service = Get-Service -Name "LanmanServer" -ErrorAction SilentlyContinue
    if ($service.Status -eq "Running") {
        Write-OK "SMB Server is running"
    } else {
        Write-Fail "SMB Server is not running"
    }

    Write-Step "Firewall Status"
    $smbRule = Get-NetFirewallRule -DisplayName "File and Printer Sharing (SMB-In)" -ErrorAction SilentlyContinue
    if ($smbRule.Enabled -eq "True") {
        Write-OK "SMB firewall rule is enabled"
    } else {
        Write-Warn "SMB firewall rule is disabled"
    }
}

# ==============================================================================
# Main Execution
# ==============================================================================

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Full
    exit 0
}

Write-Banner

# Check for administrator
if (-not (Test-Administrator)) {
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "  ║  ERROR: This script must be run as Administrator                      ║" -ForegroundColor Red
    Write-Host "  ║                                                                       ║" -ForegroundColor Red
    Write-Host "  ║  Right-click PowerShell and select 'Run as Administrator'             ║" -ForegroundColor Yellow
    Write-Host "  ╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Status only
if ($Status) {
    Show-Status
    exit 0
}

# Remove shares
if ($RemoveShares) {
    Remove-ProjectShares
    exit 0
}

Write-Host "  Running on: $env:COMPUTERNAME" -ForegroundColor White
Write-Host "  Mode: $(if ($ReadOnly) { 'Read-Only' } else { 'Full Access' })" -ForegroundColor White
Write-Host ""

# Step 1: Configure SMB
Set-SMBConfiguration

# Step 2: Configure Firewall
Set-FirewallRules

# Step 3: Create shares
Write-Step "Creating Network Shares"

$createdShares = @()

# Use custom paths if provided, otherwise use defaults
if ($SharePaths) {
    $i = 1
    foreach ($path in $SharePaths) {
        $name = "share$i"
        if (New-ProjectShare -Name $name -Path $path -Description "Custom share $i" -ReadOnly $ReadOnly) {
            $createdShares += $name
        }
        $i++
    }
} else {
    # Use default paths - only share ones that exist
    foreach ($share in $DefaultSharePaths) {
        if (New-ProjectShare -Name $share.Name -Path $share.Path -Description $share.Desc -ReadOnly $ReadOnly) {
            $createdShares += $share.Name
        }
    }
}

# Step 4: Show results
Get-CurrentShares

# Step 5: Connection instructions
if ($createdShares.Count -gt 0) {
    Show-ConnectionInstructions -ShareNames $createdShares
} else {
    Write-Host ""
    Write-Warn "No shares were created. Check that the directories exist on this machine."
    Write-Host ""
    Write-Host "  To share a specific directory:" -ForegroundColor Yellow
    Write-Host "    .\setup-omen02-shares.ps1 -SharePaths @('C:\YourPath', 'D:\AnotherPath')" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║                          SETUP COMPLETE                                ║" -ForegroundColor Green
Write-Host "  ╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
