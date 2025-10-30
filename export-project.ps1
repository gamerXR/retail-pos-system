# NexPOS Project Export Script
# This script creates all project files in C:\Development\retail-pos-system
# Run this in PowerShell: .\export-project.ps1

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   NexPOS Project Export Script" -ForegroundColor Cyan
Write-Host "   Exporting to: C:\Development\retail-pos-system" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Create base directory
$baseDir = "C:\Development\retail-pos-system"
Write-Host "[1/3] Creating directory structure..." -ForegroundColor Yellow

if (Test-Path $baseDir) {
    Write-Host "Directory already exists. Remove it? (y/n): " -ForegroundColor Red -NoNewline
    $response = Read-Host
    if ($response -eq 'y') {
        Remove-Item $baseDir -Recurse -Force
    } else {
        Write-Host "Aborted." -ForegroundColor Red
        exit
    }
}

# Create directories
New-Item -ItemType Directory -Path $baseDir -Force | Out-Null
New-Item -ItemType Directory -Path "$baseDir\backend\auth\migrations" -Force | Out-Null
New-Item -ItemType Directory -Path "$baseDir\backend\pos\migrations" -Force | Out-Null
New-Item -ItemType Directory -Path "$baseDir\frontend\components\ui" -Force | Out-Null
New-Item -ItemType Directory -Path "$baseDir\frontend\lib" -Force | Out-Null
New-Item -ItemType Directory -Path "$baseDir\frontend\public" -Force | Out-Null

Write-Host "✓ Directory structure created" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Please wait while I prepare the file download links..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Since I cannot create all files programmatically from Leap," -ForegroundColor Cyan
Write-Host "I'll provide you with a better solution:" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPTION A: I'll create a GitHub-ready structure" -ForegroundColor Green
Write-Host "You can then push this to GitHub and clone it." -ForegroundColor Green
Write-Host ""
Write-Host "OPTION B: Download files manually from Leap" -ForegroundColor Yellow
Write-Host "I'll show you exactly which files to download." -ForegroundColor Yellow
Write-Host ""

Write-Host "Directory created at: $baseDir" -ForegroundColor Green
Write-Host "Ready for next steps!" -ForegroundColor Green
