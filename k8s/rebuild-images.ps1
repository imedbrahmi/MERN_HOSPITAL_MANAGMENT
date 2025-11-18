# Script pour reconstruire les images dans Minikube avec la bonne URL API

Write-Host "=== Configuration de l'environnement Docker de Minikube ===" -ForegroundColor Cyan

# Obtenir les variables d'environnement Docker de Minikube
$dockerEnv = minikube -p minikube docker-env

# Parser et définir les variables d'environnement
$dockerEnv | ForEach-Object {
    if ($_ -match '^export (.+)=(.+)$') {
        $key = $matches[1]
        $value = $matches[2] -replace '"', ''
        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        Write-Host "Set $key = $value" -ForegroundColor Green
    }
}

Write-Host "`n=== Reconstruction de l'image Frontend ===" -ForegroundColor Cyan
docker build --build-arg VITE_API_BASE_URL=http://api.medflow.local/api/v1 -t medflow-frontend:latest ./frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Échec de la construction de l'image frontend" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Reconstruction de l'image Dashboard ===" -ForegroundColor Cyan
docker build --build-arg VITE_API_BASE_URL=http://api.medflow.local/api/v1 -t medflow-dashboard:latest ./dashboard

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Échec de la construction de l'image dashboard" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Images reconstruites avec succès! ===" -ForegroundColor Green
Write-Host "Les images sont maintenant dans Minikube avec l'URL: http://api.medflow.local/api/v1" -ForegroundColor Yellow

