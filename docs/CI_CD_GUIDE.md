# Guide CI/CD - MedFlow

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du Pipeline](#architecture-du-pipeline)
3. [Configuration](#configuration)
4. [Utilisation](#utilisation)
5. [Workflows Disponibles](#workflows-disponibles)
6. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Le pipeline CI/CD de MedFlow automatise :
- ✅ **Tests** : Validation du code
- ✅ **Build** : Construction des images Docker
- ✅ **Déploiement** : Mise en production sur Kubernetes
- ✅ **Health Checks** : Vérification post-déploiement

---

## 🏗️ Architecture du Pipeline

```
┌─────────────────────────────────────────────────┐
│           Push/PR vers GitHub                    │
└───────────────┬─────────────────────────────────┘
                │
    ┌───────────▼──────────┐
    │  1. Tests & Lint     │
    │  - Backend           │
    │  - Frontend          │
    │  - Dashboard         │
    └───────────┬──────────┘
                │
    ┌───────────▼──────────┐
    │  2. Build Images      │
    │  - Docker Build       │
    │  - Push to Registry   │
    └───────────┬──────────┘
                │
    ┌───────────▼──────────┐
    │  3. Deploy K8s       │
    │  - Update Manifests  │
    │  - Apply Resources   │
    │  - Rollout Status    │
    └───────────┬──────────┘
                │
    ┌───────────▼──────────┐
    │  4. Health Check     │
    │  - Backend API       │
    │  - Frontend          │
    │  - Dashboard         │
    └──────────────────────┘
```

---

## ⚙️ Configuration

### 1. Secrets GitHub Requis

Dans votre repository GitHub, allez dans **Settings → Secrets and variables → Actions** et ajoutez :

#### Pour le Build et Push d'Images

- `GITHUB_TOKEN` : Automatiquement disponible (pas besoin de l'ajouter)

#### Pour le Déploiement Kubernetes

- `KUBECONFIG` : Configuration Kubernetes (encodée en base64)
  ```bash
  # Générer le secret
  cat ~/.kube/config | base64 -w 0
  ```

#### Pour les Variables d'Environnement

- `VITE_API_BASE_URL` : URL de l'API (optionnel, valeur par défaut utilisée)

### 2. Configuration du Registry

Le pipeline utilise **GitHub Container Registry (ghcr.io)** par défaut.

**Format des images** :
```
ghcr.io/<votre-username>/medflow-backend:latest
ghcr.io/<votre-username>/medflow-frontend:latest
ghcr.io/<votre-username>/medflow-dashboard:latest
```

### 3. Branches

- **`main`** : Déploiement automatique en production
- **`develop`** : Déploiement en staging (optionnel)

---

## 🚀 Utilisation

### Déclenchement Automatique

Le pipeline se déclenche automatiquement sur :

1. **Push vers `main`** :
   - Tests → Build → Deploy → Health Check

2. **Push vers `develop`** :
   - Tests → Build (pas de déploiement automatique)

3. **Pull Request vers `main`** :
   - Tests uniquement (pas de build ni déploiement)

### Déclenchement Manuel

1. Allez dans **Actions** sur GitHub
2. Sélectionnez **"Manual Deploy to Kubernetes"**
3. Cliquez sur **"Run workflow"**
4. Choisissez :
   - **Environment** : development, staging, ou production
   - **Component** : all, backend, frontend, ou dashboard

---

## 📝 Workflows Disponibles

### 1. `ci-cd.yml` - Pipeline Principal

**Déclencheurs** :
- Push vers `main` ou `develop`
- Pull Request vers `main`
- Déclenchement manuel

**Jobs** :
1. **test** : Tests et validation
2. **build** : Build des images Docker
3. **deploy** : Déploiement sur Kubernetes
4. **health-check** : Vérification post-déploiement

### 2. `manual-deploy.yml` - Déploiement Manuel

**Déclencheurs** :
- Déclenchement manuel uniquement

**Fonctionnalités** :
- Choix de l'environnement (dev/staging/prod)
- Choix du composant à déployer
- Déploiement sélectif

---

## 🔍 Détails des Jobs

### Job 1: Tests

```yaml
- Installation des dépendances
- Exécution des tests (backend, frontend, dashboard)
- Linting du code
```

**Durée estimée** : 2-5 minutes

### Job 2: Build

```yaml
- Login au registry Docker
- Build des images avec cache
- Push vers GitHub Container Registry
- Tagging automatique (latest, sha, branch)
```

**Durée estimée** : 5-10 minutes par composant

### Job 3: Deploy

```yaml
- Configuration kubectl
- Mise à jour des tags d'images dans les manifests
- Application des ressources Kubernetes
- Attente du rollout
- Vérification du statut
```

**Durée estimée** : 3-5 minutes

### Job 4: Health Check

```yaml
- Vérification de l'endpoint /health du backend
- Vérification de la disponibilité du frontend
- Vérification de la disponibilité du dashboard
```

**Durée estimée** : 1-2 minutes

---

## 🛠️ Dépannage

### Le Pipeline Échoue au Build

**Problème** : Erreur d'authentification au registry

**Solution** :
```bash
# Vérifier que GITHUB_TOKEN est disponible
# Il est automatiquement disponible, pas besoin de le configurer
```

### Le Pipeline Échoue au Déploiement

**Problème** : Erreur de connexion à Kubernetes

**Solution** :
1. Vérifier que `KUBECONFIG` est configuré dans les secrets
2. Vérifier que le cluster Kubernetes est accessible
3. Vérifier les permissions du service account

```bash
# Tester la connexion manuellement
kubectl get nodes
```

### Les Images ne sont pas Trouvées

**Problème** : Les tags d'images ne correspondent pas

**Solution** :
1. Vérifier que les images sont bien pushées dans le registry
2. Vérifier que les tags dans les manifests sont corrects
3. Vérifier les permissions de pull sur le registry

### Les Tests Échouent

**Problème** : Tests non configurés ou échecs

**Solution** :
1. Les tests sont actuellement en mode `continue-on-error: true`
2. Ajouter de vrais tests dans chaque composant
3. Configurer les scripts de test dans `package.json`

---

## 📊 Monitoring du Pipeline

### Voir l'Historique

1. Allez dans **Actions** sur GitHub
2. Sélectionnez le workflow
3. Consultez les runs précédents

### Voir les Logs

1. Cliquez sur un run
2. Cliquez sur un job
3. Consultez les logs de chaque étape

### Notifications

Configurez les notifications GitHub pour être alerté :
- En cas d'échec du pipeline
- En cas de succès du déploiement

---

## 🔐 Sécurité

### Bonnes Pratiques

1. **Secrets** : Ne jamais commiter les secrets
2. **Permissions** : Limiter les permissions du GITHUB_TOKEN
3. **Images** : Scanner les images pour les vulnérabilités
4. **Kubernetes** : Utiliser des service accounts avec permissions minimales

### Scanner les Images

Ajoutez une étape de scan dans le workflow :

```yaml
- name: 🔍 Scan Image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ steps.meta.outputs.tags }}
    format: 'sarif'
    output: 'trivy-results.sarif'
```

---

## 🚀 Améliorations Futures

- [ ] Ajouter des tests unitaires et d'intégration
- [ ] Configurer le linting automatique
- [ ] Ajouter le scan de sécurité des images
- [ ] Configurer les notifications Slack/Email
- [ ] Ajouter le rollback automatique en cas d'échec
- [ ] Configurer les environnements multiples (dev/staging/prod)
- [ ] Ajouter le blue-green deployment
- [ ] Configurer les tests de charge

---

## 📝 Exemple de Workflow Complet

```yaml
# Exemple de commit qui déclenche le pipeline
git add .
git commit -m "feat: Add new feature"
git push origin main

# Le pipeline s'exécute automatiquement :
# 1. Tests (2 min)
# 2. Build (10 min)
# 3. Deploy (5 min)
# 4. Health Check (1 min)
# Total: ~18 minutes
```

---

**Dernière mise à jour** : 18 Novembre 2025

