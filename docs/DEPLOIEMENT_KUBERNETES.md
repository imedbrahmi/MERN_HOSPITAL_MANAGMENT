# Guide de Déploiement MedFlow sur Kubernetes

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Déploiement](#déploiement)
6. [Vérification](#vérification)
7. [Maintenance](#maintenance)

---

## 🔧 Prérequis

### Outils Requis

- **Minikube** : Cluster Kubernetes local
- **kubectl** : Client Kubernetes
- **Docker** : Pour construire les images
- **PowerShell** (Windows) ou Bash (Linux/Mac)

### Vérification

```bash
# Vérifier Minikube
minikube version

# Vérifier kubectl
kubectl version --client

# Vérifier Docker
docker version
```

---

## 🏗️ Architecture

### Composants Déployés

```
┌─────────────────────────────────────────────────┐
│              Ingress Controller                  │
│  (medflow.local, api.medflow.local, etc.)       │
└──────────────┬──────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐         ┌─────▼────┐
│Frontend│         │ Dashboard │
│ (2-8)  │         │  (2-8)    │
└───┬────┘         └─────┬─────┘
    │                    │
    └──────────┬─────────┘
               │
         ┌─────▼─────┐
         │  Backend  │
         │  (2-10)   │
         └─────┬─────┘
               │
         ┌─────▼─────┐
         │  MongoDB  │
         │ (Stateful)│
         └───────────┘
```

### Ressources Kubernetes

- **Deployments** : Frontend, Dashboard, Backend
- **StatefulSet** : MongoDB (avec volumes persistants)
- **Services** : ClusterIP pour chaque composant
- **Ingress** : Routage externe
- **HPA** : Auto-scaling pour Frontend et Backend
- **ConfigMaps** : Configuration non-sensible
- **Secrets** : Données sensibles (JWT, MongoDB, Cloudinary)

---

## 📦 Installation

### 1. Démarrer Minikube

```bash
# Démarrer Minikube
minikube start

# Activer metrics-server (pour HPA)
minikube addons enable metrics-server

# Vérifier le statut
minikube status
```

### 2. Créer le Namespace

```bash
kubectl create namespace medflow
```

### 3. Configurer le Fichier Hosts

**Windows** : `C:\Windows\System32\drivers\etc\hosts`

Ajouter :
```
127.0.0.1 medflow.local
127.0.0.1 api.medflow.local
127.0.0.1 dashboard.medflow.local
```

**Linux/Mac** : `/etc/hosts`

### 4. Activer Minikube Tunnel

```bash
# Dans un terminal séparé (laisser tourner)
minikube tunnel
```

---

## ⚙️ Configuration

### 1. Construire les Images Docker

**Important** : Construire directement dans Minikube !

```bash
# Frontend
minikube image build -t medflow-frontend:latest \
  --build-opt="build-arg=VITE_API_BASE_URL=http://api.medflow.local/api/v1" \
  ./frontend

# Dashboard
minikube image build -t medflow-dashboard:latest \
  --build-opt="build-arg=VITE_API_BASE_URL=http://api.medflow.local/api/v1" \
  ./dashboard

# Backend
minikube image build -t medflow-backend:latest ./backend
```

### 2. Configurer les Secrets

Éditer `k8s/secret.yaml` avec vos valeurs (encodées en base64) :

```bash
# Encoder une valeur
echo -n "votre-valeur" | base64
```

### 3. Appliquer les Configurations

```bash
# ConfigMap et Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
```

---

## 🚀 Déploiement

### Ordre de Déploiement

1. **MongoDB** (StatefulSet)
2. **Backend** (dépend de MongoDB)
3. **Frontend et Dashboard** (dépendent du Backend)
4. **Ingress** (routage externe)

### Commandes

```bash
# 1. MongoDB
kubectl apply -f k8s/mongodb-service.yaml
kubectl apply -f k8s/mongodb-statefulset.yaml

# 2. Backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# 3. Frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# 4. Dashboard
kubectl apply -f k8s/dashboard-deployment.yaml
kubectl apply -f k8s/dashboard-service.yaml

# 5. Ingress
kubectl apply -f k8s/ingress.yaml

# 6. HPA (Auto-scaling)
kubectl apply -f k8s/backend-hpa.yaml
kubectl apply -f k8s/frontend-hpa.yaml
```

### Déploiement en Une Commande

```bash
kubectl apply -f k8s/
```

---

## ✅ Vérification

### 1. Vérifier les Pods

```bash
kubectl get pods -n medflow
```

Tous les pods doivent être `Running` et `READY 1/1`.

### 2. Vérifier les Services

```bash
kubectl get svc -n medflow
```

### 3. Vérifier l'Ingress

```bash
kubectl get ingress -n medflow
```

### 4. Vérifier les HPA

```bash
kubectl get hpa -n medflow
```

### 5. Tester les Applications

- **Frontend** : http://medflow.local
- **Dashboard** : http://dashboard.medflow.local
- **API** : http://api.medflow.local/api/v1/health

### 6. Vérifier MongoDB

```bash
# Se connecter à MongoDB
kubectl exec -it -n medflow mongodb-0 -- mongosh \
  -u admin -p MedFlow2024Secure! \
  --authenticationDatabase admin

# Lister les bases de données
show dbs
```

---

## 🔧 Maintenance

### Redémarrer un Déploiement

```bash
kubectl rollout restart deployment/backend-deployment -n medflow
```

### Voir les Logs

```bash
# Logs d'un pod spécifique
kubectl logs -n medflow <pod-name>

# Logs de tous les pods d'un déploiement
kubectl logs -n medflow -l app=backend --tail=50
```

### Mettre à Jour une Image

```bash
# 1. Reconstruire l'image dans Minikube
minikube image build -t medflow-backend:latest ./backend

# 2. Redémarrer le déploiement
kubectl rollout restart deployment/backend-deployment -n medflow
```

### Scaler Manuellement

```bash
# Augmenter le nombre de pods
kubectl scale deployment/backend-deployment --replicas=5 -n medflow

# Réduire le nombre de pods
kubectl scale deployment/backend-deployment --replicas=2 -n medflow
```

### Vérifier les Ressources

```bash
# Utilisation CPU/Mémoire des pods
kubectl top pods -n medflow

# Utilisation CPU/Mémoire des nodes
kubectl top nodes
```

### Sauvegarder MongoDB

```bash
# Exporter les données
kubectl exec -n medflow mongodb-0 -- mongodump \
  -u admin -p MedFlow2024Secure! \
  --authenticationDatabase admin \
  --out /tmp/backup

# Copier le backup localement
kubectl cp medflow/mongodb-0:/tmp/backup ./mongodb-backup
```

---

## 🐛 Dépannage

### Pod en Erreur

```bash
# Voir les détails du pod
kubectl describe pod <pod-name> -n medflow

# Voir les logs
kubectl logs <pod-name> -n medflow
```

### Problème de Connexion MongoDB

```bash
# Vérifier que MongoDB est accessible
kubectl exec -n medflow mongodb-0 -- mongosh \
  -u admin -p MedFlow2024Secure! \
  --authenticationDatabase admin \
  --eval "db.adminCommand('ping')"
```

### Problème d'Ingress

```bash
# Vérifier que minikube tunnel est actif
# Dans un autre terminal :
minikube tunnel

# Vérifier l'Ingress
kubectl describe ingress -n medflow
```

### HPA ne Fonctionne Pas

```bash
# Vérifier metrics-server
kubectl get pods -n kube-system | grep metrics-server

# Vérifier les métriques
kubectl top pods -n medflow
```

---

## 📊 Monitoring

### Métriques Disponibles

- **CPU** : Utilisation par pod
- **Mémoire** : Utilisation par pod
- **HPA** : Nombre de pods (min/max/actuel)
- **Pods** : Statut et redémarrages

### Commandes Utiles

```bash
# Vue d'ensemble
kubectl get all -n medflow

# Métriques en temps réel
watch kubectl get pods -n medflow

# Logs en streaming
kubectl logs -f -n medflow -l app=backend
```

---

## 🔐 Sécurité

### Bonnes Pratiques

1. **Secrets** : Ne jamais commiter les secrets en clair
2. **RBAC** : Limiter les permissions
3. **Network Policies** : Isoler les pods si nécessaire
4. **Updates** : Maintenir les images à jour

### Rotation des Secrets

```bash
# Mettre à jour un secret
kubectl create secret generic medflow-secrets \
  --from-literal=jwt-secret-key='nouvelle-valeur' \
  --dry-run=client -o yaml | kubectl apply -f -

# Redémarrer les pods pour prendre en compte
kubectl rollout restart deployment/backend-deployment -n medflow
```

---

## 📝 Notes Importantes

1. **MongoDB Local** : Les données sont stockées dans un volume persistant (10Gi)
2. **Auto-scaling** : HPA ajuste automatiquement le nombre de pods
3. **Health Checks** : Liveness et Readiness probes configurés
4. **Ressources** : Limites CPU/Mémoire définies pour chaque pod

---

## 🎯 Prochaines Étapes

- [ ] Ajouter Prometheus/Grafana pour le monitoring avancé
- [ ] Configurer CI/CD avec GitHub Actions
- [ ] Créer des Helm Charts pour simplifier le déploiement
- [ ] Ajouter des tests automatisés
- [ ] Configurer des sauvegardes automatiques

---

**Dernière mise à jour** : 18 Novembre 2025

