# 🚀 Plan CI/CD pour MedFlow avec Kubernetes

## 📋 Vue d'ensemble

**CI/CD** (Continuous Integration / Continuous Deployment) est un processus automatisé qui :
- ✅ **CI** : Intègre automatiquement le code (build, tests)
- ✅ **CD** : Déploie automatiquement l'application (sur Kubernetes)

## 🎯 Objectifs CI/CD pour MedFlow

### Pipeline CI/CD Complet

```
┌─────────────────────────────────────────────────────────┐
│                    Pipeline CI/CD                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Code Push (Git)                                      │
│     ↓                                                     │
│  2. Build & Test (CI)                                    │
│     ├── Tests unitaires                                  │
│     ├── Tests d'intégration                              │
│     └── Build Docker images                              │
│     ↓                                                     │
│  3. Push Images (Registry)                               │
│     └── Docker Hub / GitHub Container Registry           │
│     ↓                                                     │
│  4. Deploy to Kubernetes (CD)                            │
│     ├── Update ConfigMaps/Secrets                       │
│     ├── Update Deployments                               │
│     └── Rolling Update                                  │
│     ↓                                                     │
│  5. Health Check & Verification                          │
│     └── Tests de régression                             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Outils CI/CD à Utiliser

### Option 1 : GitHub Actions (Recommandé)
- ✅ Gratuit pour les repos publics
- ✅ Intégré à GitHub
- ✅ Facile à configurer
- ✅ Support Kubernetes natif

### Option 2 : GitLab CI/CD
- ✅ Intégré à GitLab
- ✅ Pipeline très puissant
- ✅ Bon pour projets privés

### Option 3 : Jenkins
- ✅ Open-source
- ✅ Très flexible
- ⚠️ Plus complexe à configurer

## 📦 Composants du Pipeline

### 1. Build Stage
- Build des images Docker (backend, dashboard, frontend)
- Tagging des images (version, latest)
- Tests unitaires avant build

### 2. Test Stage
- Tests unitaires
- Tests d'intégration
- Linting (ESLint)
- Security scanning

### 3. Push Stage
- Push vers Docker Hub / GitHub Container Registry
- Tagging avec version (git tag)

### 4. Deploy Stage
- Mise à jour des manifests Kubernetes
- Application avec kubectl ou Helm
- Rolling update automatique

### 5. Verify Stage
- Health checks
- Smoke tests
- Rollback automatique si échec

## 🔄 Workflows GitHub Actions

### Workflow 1 : Build & Test (sur chaque push)
```yaml
name: CI - Build & Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test
      
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test
```

### Workflow 2 : Build & Push Docker Images (sur tag)
```yaml
name: CD - Build & Push Images

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            yourusername/medflow-backend:latest
            yourusername/medflow-backend:${{ github.ref_name }}
      
      - name: Build and push dashboard
        uses: docker/build-push-action@v4
        with:
          context: ./dashboard
          push: true
          tags: |
            yourusername/medflow-dashboard:latest
            yourusername/medflow-dashboard:${{ github.ref_name }}
      
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: |
            yourusername/medflow-frontend:latest
            yourusername/medflow-frontend:${{ github.ref_name }}
```

### Workflow 3 : Deploy to Kubernetes (sur release)
```yaml
name: CD - Deploy to Kubernetes

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Setup Minikube (ou connexion au cluster)
        uses: medyagh/setup-minikube@latest
      
      - name: Update Kubernetes manifests
        run: |
          # Mettre à jour les images dans les manifests
          sed -i "s|image:.*medflow-backend.*|image: yourusername/medflow-backend:${{ github.ref_name }}|g" k8s/*.yaml
      
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/namespace.yaml
          kubectl apply -f k8s/configmap.yaml
          kubectl apply -f k8s/secrets.yaml
          kubectl apply -f k8s/backend-deployment.yaml
          kubectl apply -f k8s/backend-service.yaml
          kubectl apply -f k8s/frontend-deployment.yaml
          kubectl apply -f k8s/frontend-service.yaml
          kubectl apply -f k8s/ingress.yaml
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/backend-deployment -n medflow
          kubectl rollout status deployment/frontend-deployment -n medflow
      
      - name: Health check
        run: |
          kubectl get pods -n medflow
          kubectl get services -n medflow
```

## 🔐 Secrets Management

### Secrets GitHub
- `DOCKER_USERNAME` : Nom d'utilisateur Docker Hub
- `DOCKER_PASSWORD` : Token Docker Hub
- `KUBECONFIG` : Configuration Kubernetes (pour déploiement)
- `MONGO_URI` : URI MongoDB (pour tests)
- `JWT_SECRET_KEY` : Clé secrète JWT

## 📊 Stratégies de Déploiement

### 1. Rolling Update (Par défaut)
- Mise à jour progressive
- Pas d'interruption de service
- Rollback automatique si échec

### 2. Blue/Green Deployment
- Deux environnements identiques
- Basculement instantané
- Facile à rollback

### 3. Canary Deployment
- Déploiement progressif (10% → 50% → 100%)
- Tests sur un petit pourcentage
- Rollback si problèmes

## 🧪 Tests Automatisés

### Tests Unitaires
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Tests d'Intégration
```bash
# Tests API
npm run test:integration
```

### Tests E2E (End-to-End)
```bash
# Tests avec Cypress ou Playwright
npm run test:e2e
```

## 📝 Structure des Fichiers CI/CD

```
MedFlow/
├── .github/
│   └── workflows/
│       ├── ci-build-test.yml      # Build & Test
│       ├── cd-build-push.yml      # Build & Push Images
│       └── cd-deploy-k8s.yml      # Deploy to Kubernetes
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   └── ingress.yaml
└── scripts/
    ├── build.sh
    ├── test.sh
    └── deploy.sh
```

## 🎯 Prochaines Étapes

1. **Créer les workflows GitHub Actions**
2. **Configurer Docker Hub / GitHub Container Registry**
3. **Créer les scripts de déploiement**
4. **Configurer les secrets GitHub**
5. **Tester le pipeline complet**

---

**Note :** Cette section sera intégrée dans la formation complète comme **Section 16 : CI/CD avec GitHub Actions**

