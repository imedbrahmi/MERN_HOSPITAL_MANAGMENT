# 🚀 Finalisation CI/CD - Guide Pratique

## 📋 Étape par Étape

### ✅ Étape 1 : Vérifier que le Code est sur GitHub

1. **Vérifiez votre repository GitHub** :
   - Allez sur https://github.com
   - Vérifiez que votre repository `MedFlow` existe
   - Si ce n'est pas le cas, créez-le et poussez le code

2. **Pousser le code** (si nécessaire) :
   ```bash
   git add .
   git commit -m "feat: add CI/CD pipeline and monitoring"
   git push origin main
   ```

---

### 🔐 Étape 2 : Générer le Secret KUBECONFIG

**Important** : Pour que GitHub Actions puisse déployer sur votre cluster Kubernetes, il faut lui donner accès.

#### Option A : Minikube Local (Pour Test/Développement)

Si vous utilisez Minikube en local, le déploiement automatique depuis GitHub Actions nécessite que votre cluster soit accessible depuis Internet. Pour un environnement académique, vous pouvez :

1. **Tester le pipeline sans déploiement** :
   - Le pipeline va build les images et les pousser vers GitHub Container Registry
   - Le déploiement Kubernetes sera désactivé (commenté dans le workflow)

2. **Ou utiliser un cluster distant** (GKE, EKS, AKS) pour la production

#### Option B : Cluster Kubernetes Distant (Recommandé pour Production)

1. **Générer le KUBECONFIG** :
   ```powershell
   cd "C:\Users\Imed Brahmi\Desktop\MedFlow"
   .\.github\scripts\generate-kubeconfig-secret.ps1
   ```

2. **Copier la valeur base64** affichée

---

### 🔑 Étape 3 : Configurer les Secrets GitHub

1. **Allez sur votre repository GitHub**
2. **Settings** > **Secrets and variables** > **Actions**
3. **Cliquez sur "New repository secret"**

#### Secret 1 : KUBECONFIG (si cluster distant)

- **Name** : `KUBECONFIG`
- **Value** : Collez la valeur base64 générée par le script
- **Cliquez sur "Add secret"**

#### Vérification des Secrets

Les secrets suivants sont nécessaires :

| Secret | Description | Requis | Source |
|--------|-------------|--------|--------|
| `KUBECONFIG` | Config Kubernetes (base64) | ⚠️ Seulement si déploiement auto | Script |
| `GITHUB_TOKEN` | Token GitHub | ✅ Automatique | GitHub |

**Note** : `GITHUB_TOKEN` est automatiquement disponible, pas besoin de l'ajouter.

---

### 📦 Étape 4 : Configurer les Permissions GitHub Actions

1. **Allez dans Settings** > **Actions** > **General**
2. **Workflow permissions** :
   - Sélectionnez **"Read and write permissions"**
   - Cochez **"Allow GitHub Actions to create and approve pull requests"**
3. **Cliquez sur "Save"**

---

### 🚀 Étape 5 : Tester le Pipeline

#### Option 1 : Déclenchement Automatique

1. **Faites un petit changement** dans le code :
   ```bash
   # Ajoutez un commentaire dans un fichier
   echo "# Test CI/CD" >> README.md
   ```

2. **Commitez et poussez** :
   ```bash
   git add .
   git commit -m "test: trigger CI/CD pipeline"
   git push origin main
   ```

3. **Vérifiez le pipeline** :
   - Allez dans l'onglet **Actions** de votre repository GitHub
   - Vous devriez voir le workflow "CI/CD Pipeline - MedFlow" en cours

#### Option 2 : Déclenchement Manuel

1. **Allez dans Actions** > **CI/CD Pipeline - MedFlow**
2. **Cliquez sur "Run workflow"**
3. **Sélectionnez la branche** (main)
4. **Cliquez sur "Run workflow"**

---

### 📊 Étape 6 : Suivre l'Exécution du Pipeline

1. **Cliquez sur le workflow en cours**
2. **Observez les jobs** :
   - ✅ **Tests et Validation** : Vérifie le code
   - 🏗️ **Build Images** : Construit les images Docker
   - 📦 **Push to Registry** : Publie les images
   - 🚀 **Deploy to Kubernetes** : Déploie sur le cluster (si configuré)
   - ✅ **Health Check** : Vérifie que tout fonctionne

3. **Vérifiez les logs** :
   - Cliquez sur chaque job pour voir les détails
   - Les erreurs seront affichées en rouge

---

### 🔍 Étape 7 : Vérifier les Images Publiées

1. **Allez dans votre repository GitHub**
2. **Packages** (à droite)
3. **Vous devriez voir** :
   - `medflow-backend`
   - `medflow-frontend`
   - `medflow-dashboard`

---

### ⚙️ Étape 8 : Configuration pour Minikube Local

Si vous utilisez Minikube en local et que vous voulez tester le déploiement :

1. **Le pipeline va build et pousser les images** vers GitHub Container Registry
2. **Pour déployer localement**, vous pouvez :
   - Télécharger les images depuis le registry
   - Ou utiliser `minikube image load` après le build

**Note** : Pour un environnement académique, le build et le push des images suffisent généralement.

---

## 🎯 Checklist de Finalisation

- [ ] Code poussé sur GitHub
- [ ] Repository GitHub créé
- [ ] Secret KUBECONFIG ajouté (si cluster distant)
- [ ] Permissions GitHub Actions configurées
- [ ] Premier workflow exécuté
- [ ] Images publiées dans GitHub Container Registry
- [ ] Pipeline fonctionne correctement

---

## 🐛 Dépannage

### Le Pipeline Échoue lors du Build

**Problème** : Erreur lors de la construction des images

**Solutions** :
1. Vérifiez les logs du job "Build Images"
2. Vérifiez que les Dockerfiles sont corrects
3. Vérifiez les dépendances dans `package.json`

### Le Pipeline Échoue lors du Push

**Problème** : Erreur lors du push vers le registry

**Solutions** :
1. Vérifiez les permissions GitHub Actions
2. Vérifiez que `GITHUB_TOKEN` est disponible
3. Vérifiez les permissions du repository

### Le Déploiement Échoue

**Problème** : Erreur lors du déploiement Kubernetes

**Solutions** :
1. Vérifiez que `KUBECONFIG` est correctement configuré
2. Vérifiez que le cluster Kubernetes est accessible
3. Pour Minikube local, le déploiement automatique peut ne pas fonctionner

---

## 📝 Notes Importantes

1. **Pour Minikube Local** :
   - Le pipeline peut build et pousser les images
   - Le déploiement automatique nécessite un cluster accessible depuis Internet
   - Pour la défense, montrer le pipeline qui build et push est suffisant

2. **Pour Production** :
   - Utilisez un cluster Kubernetes géré (GKE, EKS, AKS)
   - Configurez `KUBECONFIG` avec les credentials du cluster
   - Le déploiement automatique fonctionnera

3. **Sécurité** :
   - Ne commitez jamais les secrets
   - Utilisez toujours GitHub Secrets
   - Limitez les permissions au minimum nécessaire

---

## 🎓 Pour la Défense

Vous pouvez démontrer :

1. **Le pipeline GitHub Actions** :
   - Montrer l'onglet Actions avec les workflows
   - Montrer les jobs qui s'exécutent
   - Montrer les images publiées

2. **Les images Docker** :
   - Montrer les packages GitHub Container Registry
   - Expliquer le processus de build

3. **Le déploiement** (si configuré) :
   - Montrer le déploiement automatique
   - Expliquer l'intégration Kubernetes

---

**Prêt à finaliser ? Commencez par l'Étape 1 !** 🚀

