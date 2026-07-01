#Requires -Version 5.1
<#
.SYNOPSIS
    Dart Native Agent — Developer Install Script (Windows)

.DESCRIPTION
    Compiles the native binary, creates the native messaging host manifest,
    and registers it with Chrome via the Windows Registry.

.USAGE
    .\scripts\dev-install.ps1
    $env:DART_CRX_ID="your-extension-id"; .\scripts\dev-install.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PackageDir = Split-Path -Parent $ScriptDir
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PackageDir)

$BinaryName = "dart-agent.exe"
$HostName = "app.dart.agent"

# ── Build the binary ──
Write-Host "→ Building native binary..." -ForegroundColor Cyan

Push-Location $PackageDir
try {
    # Install deps if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "→ Installing dependencies..." -ForegroundColor Yellow
        Push-Location $RepoRoot
        pnpm install
        Pop-Location
    }

    # Compile with Bun
    bun build --compile src/index.ts --outfile "dist/$BinaryName"
}
finally {
    Pop-Location
}

$BinaryPath = Join-Path $PackageDir "dist" $BinaryName
if (-not (Test-Path $BinaryPath)) {
    Write-Host "✗ Binary not found at: $BinaryPath" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Binary compiled: $BinaryPath" -ForegroundColor Green

# ── Determine CRX ID ──
$CrxId = $env:DART_CRX_ID
if (-not $CrxId) {
    Write-Host ""
    Write-Host "⚠  No CRX_ID set. After loading the extension in Chrome:" -ForegroundColor Yellow
    Write-Host "   1. Go to chrome://extensions"
    Write-Host "   2. Find 'Dart — AI Browser Agent' and copy its ID"
    Write-Host '   3. Re-run: $env:DART_CRX_ID="your-id"; .\scripts\dev-install.ps1'
    Write-Host ""
    Write-Host "   Using placeholder ID for now..." -ForegroundColor Yellow
    $CrxId = "placeholder-extension-id"
}

# ── Create native messaging host manifest ──
$ManifestDir = Join-Path $PackageDir "dist"
$ManifestPath = Join-Path $ManifestDir "$HostName.json"

$Manifest = @{
    name = $HostName
    description = "Dart AI Browser Agent — native messaging host"
    path = $BinaryPath
    type = "stdio"
    allowed_origins = @("chrome-extension://$CrxId/")
} | ConvertTo-Json -Depth 3

# Ensure dist directory exists
if (-not (Test-Path $ManifestDir)) {
    New-Item -ItemType Directory -Path $ManifestDir -Force | Out-Null
}

$Manifest | Out-File -FilePath $ManifestPath -Encoding UTF8 -Force
Write-Host "✓ Manifest created: $ManifestPath" -ForegroundColor Green

# ── Register in Windows Registry ──
$RegPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"

# Create registry key if it doesn't exist
if (-not (Test-Path (Split-Path $RegPath))) {
    New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts" -Force | Out-Null
}

# Set the default value to the manifest path
New-Item -Path $RegPath -Force | Out-Null
Set-ItemProperty -Path $RegPath -Name "(Default)" -Value $ManifestPath
Write-Host "✓ Registry key set: $RegPath" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✓ Dart native agent installed!" -ForegroundColor Green
Write-Host ""
Write-Host "  Host name: $HostName"
Write-Host "  Binary:    $BinaryPath"
Write-Host "  Manifest:  $ManifestPath"
Write-Host "  Registry:  $RegPath"
Write-Host ""
Write-Host "  Restart Chrome for changes to take effect." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
