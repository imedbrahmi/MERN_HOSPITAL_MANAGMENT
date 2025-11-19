# Script pour ajouter les hosts MedFlow
# Executer en tant qu'administrateur : clic droit > Executer en tant qu'administrateur

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostsToAdd = @(
    "127.0.0.1 medflow.local",
    "127.0.0.1 api.medflow.local",
    "127.0.0.1 dashboard.medflow.local",
    "127.0.0.1 grafana.medflow.local",
    "127.0.0.1 prometheus.medflow.local",
    "127.0.0.1 mongo.medflow.local"
)

Write-Host "Ajout des hosts MedFlow..." -ForegroundColor Green

# Verifier si les hosts existent deja
$hostsContent = Get-Content $hostsPath
$needsUpdate = $false

foreach ($hostEntry in $hostsToAdd) {
    if ($hostsContent -notcontains $hostEntry) {
        $needsUpdate = $true
        Add-Content -Path $hostsPath -Value $hostEntry -Force
        Write-Host "[OK] Ajoute: $hostEntry" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Deja present: $hostEntry" -ForegroundColor Yellow
    }
}

if ($needsUpdate) {
    Write-Host "`n[SUCCESS] Hosts configures avec succes!" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant acceder a:" -ForegroundColor Cyan
    Write-Host "  - http://medflow.local (Frontend)" -ForegroundColor White
    Write-Host "  - http://dashboard.medflow.local (Dashboard)" -ForegroundColor White
    Write-Host "  - http://api.medflow.local/api/v1/health (API)" -ForegroundColor White
    Write-Host "  - http://grafana.medflow.local (Grafana Monitoring)" -ForegroundColor White
    Write-Host "  - http://prometheus.medflow.local (Prometheus)" -ForegroundColor White
    Write-Host "  - http://mongo.medflow.local (MongoDB Express)" -ForegroundColor White
} else {
    Write-Host "`n[SUCCESS] Tous les hosts sont deja configures!" -ForegroundColor Green
}
