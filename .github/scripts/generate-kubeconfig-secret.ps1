# Script PowerShell pour générer le secret KUBECONFIG
# Usage: .\generate-kubeconfig-secret.ps1

Write-Host "🔐 Génération du secret KUBECONFIG pour GitHub Actions" -ForegroundColor Cyan
Write-Host ""

$kubeconfigPath = "$env:USERPROFILE\.kube\config"

if (Test-Path $kubeconfigPath) {
    $content = Get-Content $kubeconfigPath -Raw
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $encoded = [Convert]::ToBase64String($bytes)
    
    Write-Host "✅ KUBECONFIG encodé (base64):" -ForegroundColor Green
    Write-Host ""
    Write-Host $encoded -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Instructions:" -ForegroundColor Cyan
    Write-Host "1. Allez sur: https://github.com/VOTRE_USERNAME/VOTRE_REPO/settings/secrets/actions"
    Write-Host "2. Cliquez sur 'New repository secret'"
    Write-Host "3. Nom: KUBECONFIG"
    Write-Host "4. Valeur: (copiez la valeur ci-dessus)"
    Write-Host "5. Cliquez sur 'Add secret'"
} else {
    Write-Host "❌ Fichier kubeconfig non trouvé: $kubeconfigPath" -ForegroundColor Red
    Write-Host "Assurez-vous que kubectl est configuré correctement."
}

