# 🔍 Accéder au Pipeline CI/CD sur GitHub

## 📍 Où Trouver le Pipeline

### Option 1 : Via la Sidebar (Recommandé)

1. **Allez sur votre repository GitHub** :
   - https://github.com/imedbrahmi/MERN_HOSPITAL_MANAGMENT

2. **Cliquez sur l'onglet "Actions"** (en haut)

3. **Dans la sidebar gauche**, sous "All workflows", vous verrez :
   - ✅ **CI/CD Pipeline - MedFlow** ← **Cliquez ici !**
   - ✅ **Manual Deploy to Kubernetes**
   - ⚠️ pages-build-deployment (ancien workflow)

4. **Cliquez sur "CI/CD Pipeline - MedFlow"**

### Option 2 : Lien Direct

Allez directement sur :
```
https://github.com/imedbrahmi/MERN_HOSPITAL_MANAGMENT/actions/workflows/ci-cd.yml
```

---

## 📊 Ce Que Vous Devriez Voir

### Si le Pipeline s'est Déclenché :

1. **Liste des exécutions** :
   - Le workflow le plus récent en haut
   - Statut : 🟡 (en cours) ou 🟢 (réussi) ou 🔴 (échec)
   - Date et heure d'exécution

2. **Cliquez sur une exécution** pour voir :
   - **Jobs** :
     - ✅ Tests et Validation
     - 🏗️ Build Images
     - 📦 Push to Registry
     - 🚀 Deploy to Kubernetes
     - ✅ Health Check

### Si le Pipeline ne s'est PAS Déclenché :

1. **Vérifiez la branche** :
   - Le workflow se déclenche sur `main` ou `develop`
   - Vous avez poussé sur `master` ?
   - Solution : Renommez la branche ou modifiez le workflow

2. **Déclenchez manuellement** :
   - Cliquez sur "Run workflow" (en haut à droite)
   - Sélectionnez la branche `master`
   - Cliquez sur "Run workflow"

---

## 🔧 Si Vous Ne Voyez Pas le Workflow

### Vérification 1 : Le Fichier Existe-t-il ?

Le fichier doit être présent :
```
.github/workflows/ci-cd.yml
```

### Vérification 2 : La Branche est Correcte

Le workflow se déclenche sur :
- `main` (par défaut)
- `develop`

Si vous êtes sur `master`, deux options :

**Option A : Modifier le Workflow** (Recommandé)
```yaml
on:
  push:
    branches:
      - main
      - develop
      - master  # Ajoutez cette ligne
```

**Option B : Renommer la Branche**
```bash
git branch -m master main
git push origin main
```

---

## ✅ Checklist

- [ ] Onglet "Actions" ouvert
- [ ] "CI/CD Pipeline - MedFlow" visible dans la sidebar
- [ ] Workflow cliqué
- [ ] Exécutions visibles
- [ ] Jobs visibles (si exécution en cours/terminée)

---

**Cliquez sur "CI/CD Pipeline - MedFlow" dans la sidebar pour voir votre pipeline !** 🚀

