# Script pour ajouter les hosts MedFlow
# Exécuter en tant qu'administrateur : clic droit > Exécuter en tant qu'administrateur

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostsToAdd = @(
    "127.0.0.1 medflow.local",
    "127.0.0.1 api.medflow.local",
    "127.0.0.1 dashboard.medflow.local"
)

Write-Host "Ajout des hosts MedFlow..." -ForegroundColor Green

# Vérifier si les hosts existent déjà
$hostsContent = Get-Content $hostsPath
$needsUpdate = $false

foreach ($host in $hostsToAdd) {
    if ($hostsContent -notcontains $host) {
        $needsUpdate = $true
        Add-Content -Path $hostsPath -Value $host -Force
        Write-Host "✓ Ajouté: $host" -ForegroundColor Green
    } else {
        Write-Host "→ Déjà présent: $host" -ForegroundColor Yellow
    }
}

if ($needsUpdate) {
    Write-Host "`n✅ Hosts configurés avec succès!" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant accéder à:" -ForegroundColor Cyan
    Write-Host "  - http://medflow.local (Frontend)" -ForegroundColor White
    Write-Host "  - http://dashboard.medflow.local (Dashboard)" -ForegroundColor White
    Write-Host "  - http://api.medflow.local/api/v1/health (API)" -ForegroundColor White
} else {
    Write-Host "`n✅ Tous les hosts sont déjà configurés!" -ForegroundColor Green
}


