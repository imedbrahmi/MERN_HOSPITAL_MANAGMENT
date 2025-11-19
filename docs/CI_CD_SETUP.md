# 🚀 Guide de Configuration CI/CD - MedFlow

## 📋 Vue d'ensemble

Ce guide vous explique comment finaliser la configuration du pipeline CI/CD pour déployer automatiquement MedFlow sur Kubernetes via GitHub Actions.

## ✅ Prérequis

1. **Repository GitHub** : Votre code doit être sur GitHub
2. **Kubernetes Cluster** : Minikube (local) ou cluster distant
3. **GitHub Actions** : Activé par défaut sur votre repository

## 🔐 Configuration des Secrets GitHub

### Étape 1 : Accéder aux Secrets

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Secrets and variables** > **Actions**

### Étape 2 : Ajouter le Secret KUBECONFIG

Pour déployer sur Kubernetes, GitHub Actions a besoin de la configuration Kubernetes.

#### Option A : Pour Minikube Local (Développement)

Si vous utilisez Minikube en local, vous devez exposer votre cluster ou utiliser un tunnel.

**⚠️ Note** : Pour la production, utilisez un cluster Kubernetes distant (GKE, EKS, AKS, etc.)

#### Option B : Pour un Cluster Kubernetes Distant

1. **Générer le KUBECONFIG** :

   ```powershell
   # Windows PowerShell
   .\.github\scripts\generate-kubeconfig-secret.ps1
   ```

   Ce script va :
   - Lire votre fichier `~/.kube/config`
   - L'encoder en base64
   - Afficher la commande pour l'ajouter à GitHub

2. **Ajouter le secret dans GitHub** :
   - Nom du secret : `KUBECONFIG`
   - Valeur : Le contenu base64 généré

### Étape 3 : Vérifier les Secrets Disponibles

Les secrets suivants sont utilisés par le pipeline :

| Secret | Description | Requis | Source |
|--------|-------------|--------|--------|
| `KUBECONFIG` | Configuration Kubernetes (base64) | ✅ Oui | Généré via script |
| `GITHUB_TOKEN` | Token GitHub (automatique) | ✅ Oui | Automatique |

## 📦 Configuration du Registry Docker

Le pipeline utilise **GitHub Container Registry (ghcr.io)** par défaut.

### Format des Images

Les images seront publiées sous :
```
ghcr.io/<votre-username>/medflow-backend:latest
ghcr.io/<votre-username>/medflow-frontend:latest
ghcr.io/<votre-username>/medflow-dashboard:latest
```

### Permissions du Registry

1. Allez dans **Settings** > **Packages**
2. Vérifiez que les packages peuvent être créés automatiquement
3. Si nécessaire, configurez les permissions dans **Settings** > **Actions** > **General** > **Workflow permissions**

## 🔄 Workflows Disponibles

### 1. Pipeline Principal (`ci-cd.yml`)

**Déclencheurs** :
- Push vers `main` ou `develop`
- Pull Request vers `main`
- Déclenchement manuel

**Étapes** :
1. ✅ Tests et validation
2. 🏗️ Build des images Docker
3. 📦 Push vers GitHub Container Registry
4. 🚀 Déploiement sur Kubernetes
5. ✅ Health checks

### 2. Déploiement Manuel (`manual-deploy.yml`)

**Déclencheurs** :
- Déclenchement manuel uniquement

**Options** :
- Choix de l'environnement (staging/production)
- Choix de la branche
- Choix des composants à déployer

## 🚀 Utilisation

### Déploiement Automatique

1. **Push vers `main`** :
   ```bash
   git add .
   git commit -m "feat: nouvelle fonctionnalité"
   git push origin main
   ```

2. **Vérifier le pipeline** :
   - Allez dans l'onglet **Actions** de votre repository
   - Vous verrez le workflow en cours d'exécution

3. **Suivre les logs** :
   - Cliquez sur le workflow en cours
   - Cliquez sur chaque job pour voir les détails

### Déploiement Manuel

1. Allez dans **Actions** > **Manual Deploy**
2. Cliquez sur **Run workflow**
3. Sélectionnez :
   - **Environment** : staging ou production
   - **Branch** : La branche à déployer
   - **Components** : Backend, Frontend, Dashboard (ou tous)

## 🔍 Vérification Post-Déploiement

### Vérifier les Pods

```bash
kubectl get pods -n medflow
```

### Vérifier les Services

```bash
kubectl get svc -n medflow
```

### Vérifier l'Ingress

```bash
kubectl get ingress -n medflow
```

### Vérifier les Logs

```bash
# Logs du backend
kubectl logs -n medflow -l app=backend --tail=50

# Logs du frontend
kubectl logs -n medflow -l app=frontend --tail=50
```

## 🐛 Dépannage

### Le Pipeline Échoue lors du Build

**Problème** : Erreur lors de la construction des images Docker

**Solutions** :
1. Vérifier que les Dockerfiles sont corrects
2. Vérifier les dépendances dans `package.json`
3. Vérifier les logs du job "Build Images"

### Le Pipeline Échoue lors du Déploiement

**Problème** : Erreur lors de l'application des manifests Kubernetes

**Solutions** :
1. Vérifier que `KUBECONFIG` est correctement configuré
2. Vérifier que le cluster Kubernetes est accessible
3. Vérifier les permissions du service account

### Les Images ne sont pas Publiées

**Problème** : Erreur lors du push vers le registry

**Solutions** :
1. Vérifier les permissions GitHub Actions
2. Vérifier que `GITHUB_TOKEN` est disponible
3. Vérifier les permissions du repository

### Le Déploiement Réussit mais l'Application ne Fonctionne Pas

**Problème** : Les pods sont en erreur ou l'application ne répond pas

**Solutions** :
1. Vérifier les logs des pods : `kubectl logs -n medflow <pod-name>`
2. Vérifier les événements : `kubectl get events -n medflow`
3. Vérifier les ressources : `kubectl describe pod -n medflow <pod-name>`

## 📝 Personnalisation

### Modifier les Triggers

Éditez `.github/workflows/ci-cd.yml` :

```yaml
on:
  push:
    branches:
      - main
      - develop  # Ajoutez d'autres branches
  pull_request:
    branches:
      - main
```

### Modifier les Environnements

Éditez `.github/workflows/manual-deploy.yml` pour ajouter des environnements personnalisés.

### Ajouter des Tests

Ajoutez des tests dans le job `test` :

```yaml
- name: 🧪 Run Custom Tests
  run: |
    npm test
    npm run lint
```

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne jamais commiter les secrets** : Utilisez toujours GitHub Secrets
2. **Limiter les permissions** : Utilisez des tokens avec des permissions minimales
3. **Auditer les workflows** : Vérifiez régulièrement les logs des workflows
4. **Mettre à jour les dépendances** : Maintenez les actions GitHub à jour

### Rotation des Secrets

Changez régulièrement les secrets, surtout `KUBECONFIG` si vous utilisez un cluster de production.

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---

## ✅ Checklist de Configuration

- [ ] Repository GitHub créé
- [ ] Code poussé sur GitHub
- [ ] Secret `KUBECONFIG` ajouté (si cluster distant)
- [ ] Permissions GitHub Actions configurées
- [ ] Premier push vers `main` effectué
- [ ] Pipeline exécuté avec succès
- [ ] Application déployée et accessible

---

**Note** : Pour un environnement de développement local avec Minikube, le déploiement automatique via GitHub Actions nécessite que votre cluster soit accessible depuis Internet. Pour la production, utilisez un cluster Kubernetes géré (GKE, EKS, AKS).

