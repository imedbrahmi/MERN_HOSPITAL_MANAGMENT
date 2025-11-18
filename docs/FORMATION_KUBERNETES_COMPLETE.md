# 📚 Formation Complète : Kubernetes & Minikube pour MedFlow

## 🎯 Objectif
Maîtriser Kubernetes et Minikube étape par étape, avec tous les détails nécessaires pour déployer MedFlow.

---

## 📋 Table des Matières

1. [Introduction et Concepts Fondamentaux](#1-introduction-et-concepts-fondamentaux)
2. [Installation et Configuration](#2-installation-et-configuration)
3. [Architecture Kubernetes en Détail](#3-architecture-kubernetes-en-détail)
4. [Composants Kubernetes - Détails Complets](#4-composants-kubernetes---détails-complets)
5. [Services Kubernetes](#5-services-kubernetes)
6. [ConfigMaps et Secrets](#6-configmaps-et-secrets)
7. [Ingress - Routage HTTP/HTTPS](#7-ingress---routage-httphttps)
8. [StatefulSets et PersistentVolumes](#8-statefulsets-et-persistentvolumes)
9. [Health Checks et Probes](#9-health-checks-et-probes)
10. [Horizontal Pod Autoscaler (HPA)](#10-horizontal-pod-autoscaler-hpa)
11. [Helm - Package Manager](#11-helm---package-manager)
12. [ELK Stack - Monitoring et Logs](#12-elk-stack---monitoring-et-logs)
13. [Terraform - Infrastructure as Code](#13-terraform---infrastructure-as-code)
14. [Ansible - Automatisation](#14-ansible---automatisation)
15. [Déploiement de MedFlow - Guide Complet](#15-déploiement-de-medflow---guide-complet)

---

## 1. Introduction et Concepts Fondamentaux

### 1.1 Qu'est-ce que Kubernetes ?

**Définition technique :**
Kubernetes (K8s) est un système open-source d'orchestration de conteneurs développé par Google. Il automatise le déploiement, la mise à l'échelle et la gestion des applications conteneurisées.

**Pourquoi Kubernetes ?**
- **Haute disponibilité** : Redémarre automatiquement les conteneurs qui plantent
- **Scalabilité** : Ajoute/supprime des instances selon la charge
- **Auto-healing** : Détecte et corrige les problèmes automatiquement
- **Rolling updates** : Mises à jour sans interruption de service
- **Gestion des ressources** : Optimise l'utilisation CPU/RAM

### 1.2 Architecture Kubernetes

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │   Master Node    │      │   Worker Node    │         │
│  │                  │      │                  │         │
│  │  - API Server    │      │  - Kubelet       │         │
│  │  - etcd          │      │  - Kube-proxy    │         │
│  │  - Scheduler     │      │  - Container     │         │
│  │  - Controller    │      │    Runtime       │         │
│  │    Manager       │      │  - Pods          │         │
│  └──────────────────┘      └──────────────────┘         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Composants du Master :**
- **API Server** : Point d'entrée pour toutes les commandes
- **etcd** : Base de données distribuée (stocke l'état du cluster)
- **Scheduler** : Décide sur quel nœud placer les pods
- **Controller Manager** : Surveille et corrige l'état du cluster

**Composants du Worker :**
- **Kubelet** : Agent qui communique avec le Master
- **Kube-proxy** : Gère le réseau et les règles de routage
- **Container Runtime** : Docker, containerd, etc.

### 1.3 Qu'est-ce que Minikube ?

**Définition :**
Minikube est un outil qui crée un cluster Kubernetes local sur une seule machine. Il utilise une VM (VirtualBox, Hyper-V) ou Docker pour héberger le cluster.

**Avantages :**
- ✅ Installation simple
- ✅ Cluster complet en local
- ✅ Idéal pour apprendre et tester
- ✅ Gratuit et open-source

**Limitations :**
- ⚠️ Un seul nœud (pas de vraie haute disponibilité)
- ⚠️ Performance limitée par votre machine
- ⚠️ Pas pour la production

---

## 2. Installation et Configuration

### 2.1 Prérequis

**Système d'exploitation :**
- Windows 10/11 (64-bit)
- macOS 10.15+
- Linux (Ubuntu 20.04+, Debian 10+, etc.)

**Ressources minimales :**
- CPU : 2 cores minimum
- RAM : 4 GB minimum (8 GB recommandé)
- Disque : 20 GB libres

**Logiciels requis :**
1. **Docker Desktop** (ou équivalent)
2. **kubectl** (client Kubernetes)
3. **Minikube**

### 2.2 Installation sur Windows

#### Étape 1 : Installer Docker Desktop

1. Télécharger Docker Desktop depuis : https://www.docker.com/products/docker-desktop
2. Installer et redémarrer
3. Vérifier l'installation :
```bash
docker --version
# Doit afficher : Docker version 24.x.x
```

#### Étape 2 : Installer kubectl

**Méthode 1 : Via Chocolatey (recommandé)**
```bash
choco install kubernetes-cli
```

**Méthode 2 : Via PowerShell**
```powershell
# Télécharger kubectl
curl.exe -LO "https://dl.k8s.io/release/v1.28.0/bin/windows/amd64/kubectl.exe"

# Ajouter au PATH
# Copier kubectl.exe dans C:\Windows\System32\
```

**Vérifier :**
```bash
kubectl version --client
```

#### Étape 3 : Installer Minikube

**Méthode 1 : Via Chocolatey**
```bash
choco install minikube
```

**Méthode 2 : Téléchargement direct**
```powershell
# Télécharger l'installateur
Invoke-WebRequest -OutFile minikube-installer.exe https://github.com/kubernetes/minikube/releases/latest/download/minikube-installer.exe

# Exécuter l'installateur
.\minikube-installer.exe
```

**Vérifier :**
```bash
minikube version
```

### 2.3 Démarrer Minikube

#### Première démarrage

```bash
# Démarrer Minikube avec Docker comme driver
minikube start --driver=docker

# Vérifier le statut
minikube status

# Voir les nœuds
kubectl get nodes
```

**Explication détaillée :**
- `minikube start` : Crée et démarre une VM avec Kubernetes
- `--driver=docker` : Utilise Docker comme runtime de conteneurs
- Le processus prend 2-5 minutes la première fois

#### Commandes utiles

```bash
# Arrêter Minikube
minikube stop

# Redémarrer
minikube start

# Supprimer le cluster
minikube delete

# Voir les logs
minikube logs

# Accéder au dashboard
minikube dashboard
```

### 2.4 Configuration de kubectl

**Vérifier la connexion :**
```bash
kubectl cluster-info
```

**Configurer l'alias (optionnel) :**
```bash
# Dans PowerShell, ajouter à $PROFILE
Set-Alias -Name k -Value kubectl
```

---

## 3. Architecture Kubernetes en Détail

### 3.1 Concepts Clés

#### Pod
**Définition :**
Un Pod est la plus petite unité déployable dans Kubernetes. C'est un groupe d'un ou plusieurs conteneurs qui partagent :
- Le même réseau (même IP)
- Le même stockage (volumes)
- Le même namespace

**Exemple concret :**
```
Pod "backend-abc123"
├── Container: backend-app (Node.js)
└── Container: backend-logger (sidecar)
```

**Caractéristiques :**
- Éphémère (peut être recréé à tout moment)
- Une IP unique dans le cluster
- Peut contenir plusieurs conteneurs (rare, généralement 1)

#### Deployment
**Définition :**
Un Deployment décrit l'état désiré de votre application. Il gère :
- Le nombre de réplicas (copies) de pods
- La stratégie de mise à jour (rolling update)
- Le rollback en cas de problème

**Exemple :**
```yaml
Deployment "backend"
├── Réplique 1: Pod backend-abc123
├── Réplique 2: Pod backend-def456
└── Réplique 3: Pod backend-ghi789
```

**Avantages :**
- ✅ Gère automatiquement les pods
- ✅ Redémarre les pods qui plantent
- ✅ Mise à jour sans interruption
- ✅ Rollback automatique

#### Service
**Définition :**
Un Service expose un ensemble de Pods comme un service réseau. Il fournit :
- Une IP stable (même si les pods changent)
- Un nom DNS (ex: `backend-service`)
- Répartition de charge entre les pods

**Types de Services :**
1. **ClusterIP** : Accessible uniquement dans le cluster
2. **NodePort** : Expose sur un port de chaque nœud
3. **LoadBalancer** : IP externe (cloud providers)
4. **ExternalName** : Alias vers un service externe

#### Namespace
**Définition :**
Un Namespace est une isolation logique des ressources. Comme des dossiers dans un système de fichiers.

**Namespaces par défaut :**
- `default` : Ressources sans namespace spécifié
- `kube-system` : Composants système Kubernetes
- `kube-public` : Ressources publiques
- `kube-node-lease` : Heartbeats des nœuds

**Utilisation :**
```bash
# Créer un namespace
kubectl create namespace medflow

# Lister les namespaces
kubectl get namespaces

# Utiliser un namespace
kubectl get pods -n medflow
```

---

## 4. Composants Kubernetes - Détails Complets

### 4.1 Pod - Structure YAML

**Fichier : `pod-example.yaml`**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend-pod
  labels:
    app: backend
    version: v1
spec:
  containers:
  - name: backend-container
    image: medflow-backend:latest
    ports:
    - containerPort: 4000
    env:
    - name: PORT
      value: "4000"
    - name: NODE_ENV
      value: "production"
    resources:
      requests:
        memory: "256Mi"
        cpu: "250m"
      limits:
        memory: "512Mi"
        cpu: "500m"
```

**Explication ligne par ligne :**

- `apiVersion: v1` : Version de l'API Kubernetes
- `kind: Pod` : Type de ressource (Pod, Deployment, Service, etc.)
- `metadata.name` : Nom unique du pod
- `metadata.labels` : Étiquettes pour sélectionner le pod
- `spec.containers` : Liste des conteneurs dans le pod
- `image` : Image Docker à utiliser
- `ports` : Ports exposés par le conteneur
- `env` : Variables d'environnement
- `resources` : Limites CPU/RAM

**Créer le pod :**
```bash
kubectl apply -f pod-example.yaml
```

**Vérifier :**
```bash
kubectl get pods
kubectl describe pod backend-pod
kubectl logs backend-pod
```

### 4.2 Deployment - Structure YAML

**Fichier : `deployment-backend.yaml`**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
  namespace: medflow
  labels:
    app: backend
spec:
  replicas: 3  # Nombre de pods
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
        version: v1
    spec:
      containers:
      - name: backend
        image: medflow-backend:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 4000
          name: http
        env:
        - name: PORT
          value: "4000"
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: medflow-secrets
              key: mongo-uri
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 4000
          initialDelaySeconds: 10
          periodSeconds: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

**Explication détaillée :**

**Section `spec` :**
- `replicas: 3` : Crée 3 copies du pod
- `selector.matchLabels` : Sélectionne les pods avec ces labels
- `template` : Définition du pod à créer

**Section `strategy` :**
- `RollingUpdate` : Mise à jour progressive
- `maxSurge: 1` : Crée 1 pod supplémentaire pendant la mise à jour
- `maxUnavailable: 0` : Aucun pod indisponible pendant la mise à jour

**Probes (Health Checks) :**
- `livenessProbe` : Vérifie si le conteneur est vivant
- `readinessProbe` : Vérifie si le conteneur est prêt à recevoir du trafic

**Créer le deployment :**
```bash
kubectl apply -f deployment-backend.yaml
```

**Commandes utiles :**
```bash
# Voir les deployments
kubectl get deployments

# Voir les pods créés
kubectl get pods -l app=backend

# Mettre à jour l'image
kubectl set image deployment/backend-deployment backend=medflow-backend:v2

# Voir l'historique des déploiements
kubectl rollout history deployment/backend-deployment

# Rollback
kubectl rollout undo deployment/backend-deployment
```

---

## 5. Services Kubernetes

### 5.1 Service ClusterIP

**Définition :**
Service accessible uniquement à l'intérieur du cluster. Les pods peuvent communiquer entre eux via ce service.

**Fichier : `service-backend-clusterip.yaml`**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: medflow
spec:
  type: ClusterIP  # Type par défaut
  selector:
    app: backend
  ports:
  - port: 80        # Port du service
    targetPort: 4000 # Port du conteneur
    protocol: TCP
    name: http
```

**Utilisation :**
- Les pods peuvent accéder via : `http://backend-service:80`
- DNS automatique : `backend-service.medflow.svc.cluster.local`

### 5.2 Service NodePort

**Définition :**
Expose le service sur un port (30000-32767) de chaque nœud. Accessible depuis l'extérieur.

**Fichier : `service-backend-nodeport.yaml`**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service-nodeport
  namespace: medflow
spec:
  type: NodePort
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 4000
    nodePort: 30080  # Port externe (optionnel, sinon aléatoire)
    protocol: TCP
```

**Accès :**
- Depuis l'extérieur : `http://<NODE_IP>:30080`
- Avec Minikube : `minikube service backend-service-nodeport -n medflow`

### 5.3 Service LoadBalancer

**Définition :**
Crée un équilibreur de charge externe (nécessite un cloud provider).

**Fichier : `service-backend-loadbalancer.yaml`**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service-lb
  namespace: medflow
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 4000
    protocol: TCP
```

**Avec Minikube :**
```bash
# Activer le LoadBalancer
minikube tunnel

# Dans un autre terminal
kubectl apply -f service-backend-loadbalancer.yaml
```

---

## 6. ConfigMaps et Secrets

### 6.1 ConfigMap - Configuration Non Sensible

**Définition :**
Stocke des données de configuration sous forme de paires clé-valeur.

**Création via fichier YAML :**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: medflow-config
  namespace: medflow
data:
  PORT: "4000"
  NODE_ENV: "production"
  FRONTEND_URL: "http://localhost:5173"
  DASHBOARD_URL: "http://localhost:5174"
  JWT_EXPIRES: "7d"
  COOKIE_EXPIRE: "7"
```

**Création via ligne de commande :**
```bash
kubectl create configmap medflow-config \
  --from-literal=PORT=4000 \
  --from-literal=NODE_ENV=production \
  -n medflow
```

**Utilisation dans un Pod :**
```yaml
spec:
  containers:
  - name: backend
    envFrom:
    - configMapRef:
        name: medflow-config
    # OU individuellement
    env:
    - name: PORT
      valueFrom:
        configMapKeyRef:
          name: medflow-config
          key: PORT
```

### 6.2 Secret - Données Sensibles

**Définition :**
Stocke des données sensibles (mots de passe, clés API) de manière sécurisée (base64 encodé).

**Création via fichier YAML :**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: medflow-secrets
  namespace: medflow
type: Opaque
data:
  # Les valeurs doivent être en base64
  jwt-secret-key: ZGZlcmV0YnZkZmJydHloeW51aWtk  # "dferetbvdfbrtyhyynuikd"
  mongo-uri: bW9uZ29kYitzcnY6Ly9pbWVkQlJBSE1JOm...  # Encodé en base64
  cloudinary-cloud-name: ZGFxdm5mc285  # "daqvnfso9"
  cloudinary-api-key: MjkzNDg4MjQzNTg2NDU3  # "293488243586457"
  cloudinary-api-secret: ZUgyb2ZmRnBGaTJwa2hCRG1HRWJReGVWcnhY  # Encodé
```

**Encoder en base64 :**
```bash
# Windows PowerShell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("votre-valeur"))

# Linux/Mac
echo -n "votre-valeur" | base64
```

**Création via ligne de commande :**
```bash
kubectl create secret generic medflow-secrets \
  --from-literal=jwt-secret-key=dferetbvdfbrtyhyynuikd \
  --from-literal=mongo-uri=mongodb+srv://... \
  -n medflow
```

**Utilisation dans un Pod :**
```yaml
spec:
  containers:
  - name: backend
    env:
    - name: JWT_SECRET_KEY
      valueFrom:
        secretKeyRef:
          name: medflow-secrets
          key: jwt-secret-key
    - name: MONGO_URI
      valueFrom:
        secretKeyRef:
          name: medflow-secrets
          key: mongo-uri
```

**Voir les secrets (décodés) :**
```bash
kubectl get secret medflow-secrets -n medflow -o yaml
kubectl get secret medflow-secrets -n medflow -o jsonpath='{.data.jwt-secret-key}' | base64 -d
```

---

## 7. Ingress - Routage HTTP/HTTPS

### 7.1 Qu'est-ce qu'Ingress ?

**Définition :**
Ingress expose les services HTTP/HTTPS à l'extérieur du cluster. Il gère le routage basé sur :
- Le chemin URL (`/api/*`, `/dashboard/*`)
- Le nom de domaine (`api.medflow.com`, `dashboard.medflow.com`)

**Architecture :**
```
Internet
   ↓
Ingress Controller (Nginx, Traefik, etc.)
   ↓
Ingress Rules
   ↓
Services (ClusterIP)
   ↓
Pods
```

### 7.2 Installation de l'Ingress Controller

**Avec Minikube :**
```bash
# Activer l'addon Ingress
minikube addons enable ingress

# Vérifier
kubectl get pods -n ingress-nginx
```

### 7.3 Configuration Ingress

**Fichier : `ingress-medflow.yaml`**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: medflow-ingress
  namespace: medflow
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  ingressClassName: nginx
  rules:
  # Route pour l'API Backend
  - host: api.medflow.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
  
  # Route pour le Dashboard
  - host: dashboard.medflow.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dashboard-service
            port:
              number: 80
  
  # Route pour le Frontend Patient
  - host: medflow.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

**Explication :**
- `host` : Nom de domaine (ajouter dans `/etc/hosts` ou `C:\Windows\System32\drivers\etc\hosts`)
- `path` : Chemin URL
- `pathType: Prefix` : Correspond à tous les chemins commençant par `/`
- `backend.service` : Service Kubernetes cible

**Ajouter les hosts (Windows) :**
```powershell
# Ouvrir en tant qu'administrateur
notepad C:\Windows\System32\drivers\etc\hosts

# Ajouter :
127.0.0.1 medflow.local
127.0.0.1 api.medflow.local
127.0.0.1 dashboard.medflow.local
```

**Trouver l'IP de Minikube :**
```bash
minikube ip
# Utiliser cette IP au lieu de 127.0.0.1
```

**Appliquer :**
```bash
kubectl apply -f ingress-medflow.yaml
```

**Vérifier :**
```bash
kubectl get ingress -n medflow
kubectl describe ingress medflow-ingress -n medflow
```

---

## 8. StatefulSets et PersistentVolumes

### 8.1 Pourquoi StatefulSet pour MongoDB ?

**Deployment vs StatefulSet :**
- **Deployment** : Pods identiques, interchangeables (stateless)
- **StatefulSet** : Pods avec identité stable, ordre de démarrage, stockage persistant (stateful)

**MongoDB nécessite StatefulSet car :**
- ✅ Identité stable (nom de pod prévisible)
- ✅ Stockage persistant (données ne doivent pas être perdues)
- ✅ Ordre de démarrage (important pour les réplicas)

### 8.2 PersistentVolume (PV) et PersistentVolumeClaim (PVC)

**Définition :**
- **PV** : Ressource de stockage dans le cluster (disque, NFS, etc.)
- **PVC** : Demande de stockage par un pod (comme une "réservation")

**Fichier : `pvc-mongodb.yaml`**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
  namespace: medflow
spec:
  accessModes:
    - ReadWriteOnce  # Un seul pod peut monter en écriture
  resources:
    requests:
      storage: 10Gi  # Taille demandée
  storageClassName: standard  # Type de stockage
```

**Créer :**
```bash
kubectl apply -f pvc-mongodb.yaml
kubectl get pvc -n medflow
```

### 8.3 StatefulSet MongoDB

**Fichier : `statefulset-mongodb.yaml`**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
  namespace: medflow
spec:
  serviceName: mongodb-service
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
          name: mongodb
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: medflow-secrets
              key: mongo-username
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: medflow-secrets
              key: mongo-password
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
  volumeClaimTemplates:
  - metadata:
      name: mongodb-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
```

**Service Headless pour StatefulSet :**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
  namespace: medflow
spec:
  clusterIP: None  # Headless service
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
```

**Explication :**
- `serviceName` : Doit correspondre au service headless
- `volumeClaimTemplates` : Crée un PVC pour chaque pod
- `clusterIP: None` : Service headless (pas d'IP, juste DNS)

**Créer :**
```bash
kubectl apply -f statefulset-mongodb.yaml
kubectl get statefulset -n medflow
kubectl get pods -l app=mongodb -n medflow
```

---

## 9. Health Checks et Probes

### 9.1 Types de Probes

**1. Liveness Probe :**
- **Rôle** : Vérifie si le conteneur est vivant
- **Action si échec** : Redémarre le conteneur
- **Quand utiliser** : Détecter les deadlocks, boucles infinies

**2. Readiness Probe :**
- **Rôle** : Vérifie si le conteneur est prêt à recevoir du trafic
- **Action si échec** : Retire le pod du Service (pas de trafic)
- **Quand utiliser** : Application qui met du temps à démarrer

**3. Startup Probe :**
- **Rôle** : Vérifie si l'application a démarré
- **Action si échec** : Continue à vérifier jusqu'à succès
- **Quand utiliser** : Applications avec démarrage lent

### 9.2 Types de Checks

**HTTP GET :**
```yaml
livenessProbe:
  httpGet:
    path: /api/v1/health
    port: 4000
    httpHeaders:
    - name: Custom-Header
      value: Awesome
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

**TCP Socket :**
```yaml
livenessProbe:
  tcpSocket:
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 10
```

**Exec Command :**
```yaml
livenessProbe:
  exec:
    command:
    - cat
    - /tmp/healthy
  initialDelaySeconds: 30
  periodSeconds: 10
```

**Paramètres :**
- `initialDelaySeconds` : Délai avant la première vérification
- `periodSeconds` : Intervalle entre les vérifications
- `timeoutSeconds` : Timeout pour chaque vérification
- `failureThreshold` : Nombre d'échecs avant action
- `successThreshold` : Nombre de succès pour considérer "healthy"

### 9.3 Exemple Complet pour Backend

**Endpoint de santé à créer dans le backend :**
```javascript
// backend/app.js ou server.js
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});
```

**Configuration dans le Deployment :**
```yaml
livenessProbe:
  httpGet:
    path: /api/v1/health
    port: 4000
  initialDelaySeconds: 40
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/v1/health
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

---

## 10. Horizontal Pod Autoscaler (HPA)

### 10.1 Qu'est-ce que HPA ?

**Définition :**
HPA ajuste automatiquement le nombre de pods selon :
- L'utilisation CPU
- L'utilisation mémoire
- Des métriques personnalisées

**Exemple :**
- Charge faible : 2 pods
- Charge moyenne : 5 pods
- Charge élevée : 10 pods

### 10.2 Configuration HPA

**Fichier : `hpa-backend.yaml`**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: medflow
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
```

**Explication :**
- `minReplicas: 2` : Minimum 2 pods
- `maxReplicas: 10` : Maximum 10 pods
- `averageUtilization: 70` : Scale si CPU > 70%
- `scaleDown` : Réduire progressivement
- `scaleUp` : Augmenter rapidement

**Prérequis :**
```bash
# Activer metrics-server dans Minikube
minikube addons enable metrics-server

# Vérifier
kubectl get pods -n kube-system | grep metrics-server
```

**Créer :**
```bash
kubectl apply -f hpa-backend.yaml
kubectl get hpa -n medflow
kubectl describe hpa backend-hpa -n medflow
```

**Tester la mise à l'échelle :**
```bash
# Générer de la charge (dans un autre terminal)
kubectl run -it --rm load-generator --image=busybox --restart=Never -- /bin/sh
# Dans le conteneur :
while true; do wget -q -O- http://backend-service:80/api/v1/health; done
```

---

## 11. Helm - Package Manager

### 11.1 Qu'est-ce que Helm ?

**Définition :**
Helm est le "package manager" de Kubernetes. Il permet de :
- ✅ Empaqueter des applications (Charts)
- ✅ Gérer les dépendances
- ✅ Faciliter les mises à jour
- ✅ Réutiliser des configurations

**Concepts :**
- **Chart** : Package d'application Kubernetes
- **Release** : Instance d'un Chart déployé
- **Repository** : Dépôt de Charts

### 11.2 Installation de Helm

**Windows (Chocolatey) :**
```bash
choco install kubernetes-helm
```

**Ou téléchargement direct :**
```powershell
# Télécharger
Invoke-WebRequest -OutFile helm-installer.exe https://get.helm.sh/helm-v3.12.0-windows-amd64.zip

# Extraire et ajouter au PATH
```

**Vérifier :**
```bash
helm version
```

### 11.3 Structure d'un Chart

```
medflow-chart/
├── Chart.yaml          # Métadonnées du chart
├── values.yaml         # Valeurs par défaut
├── templates/          # Templates Kubernetes
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── ingress.yaml
└── charts/             # Dépendances (sous-charts)
```

### 11.4 Créer un Chart

**Créer un nouveau chart :**
```bash
helm create medflow-chart
cd medflow-chart
```

**Structure générée :**
```
medflow-chart/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── serviceaccount.yaml
│   └── _helpers.tpl
└── charts/
```

**Chart.yaml :**
```yaml
apiVersion: v2
name: medflow
description: A Helm chart for MedFlow application
type: application
version: 0.1.0
appVersion: "1.0.0"
```

**values.yaml (exemple) :**
```yaml
# Backend Configuration
backend:
  image:
    repository: medflow-backend
    tag: latest
  replicas: 3
  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"

# Frontend Configuration
frontend:
  image:
    repository: medflow-frontend
    tag: latest
  replicas: 2

# MongoDB Configuration
mongodb:
  enabled: true
  storage: 10Gi
```

**Template (exemple) : `templates/deployment-backend.yaml`**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "medflow.fullname" . }}-backend
  namespace: {{ .Values.namespace }}
spec:
  replicas: {{ .Values.backend.replicas }}
  selector:
    matchLabels:
      app: {{ include "medflow.name" . }}-backend
  template:
    metadata:
      labels:
        app: {{ include "medflow.name" . }}-backend
    spec:
      containers:
      - name: backend
        image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
        ports:
        - containerPort: 4000
        resources:
          {{- toYaml .Values.backend.resources | nindent 10 }}
```

### 11.5 Déployer avec Helm

**Installer le chart :**
```bash
# Depuis le répertoire du chart
helm install medflow-release ./medflow-chart -n medflow

# Avec des valeurs personnalisées
helm install medflow-release ./medflow-chart -n medflow -f my-values.yaml

# Vérifier
helm list -n medflow
helm status medflow-release -n medflow
```

**Mettre à jour :**
```bash
helm upgrade medflow-release ./medflow-chart -n medflow
```

**Désinstaller :**
```bash
helm uninstall medflow-release -n medflow
```

---

## 12. ELK Stack - Monitoring et Logs

### 12.1 Qu'est-ce que ELK Stack ?

**Composants :**
- **Elasticsearch** : Base de données de recherche et d'analyse
- **Logstash** : Collecte et transforme les logs
- **Kibana** : Interface de visualisation

**Architecture :**
```
Pods (Applications)
    ↓ (logs)
Logstash
    ↓ (indexe)
Elasticsearch
    ↓ (visualise)
Kibana
```

### 12.2 Déploiement ELK Stack

**Namespace :**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: logging
```

**Elasticsearch StatefulSet :**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
  namespace: logging
spec:
  serviceName: elasticsearch
  replicas: 1
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
        env:
        - name: discovery.type
          value: "single-node"
        - name: ES_JAVA_OPTS
          value: "-Xms512m -Xmx512m"
        ports:
        - containerPort: 9200
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
```

**Kibana Deployment :**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kibana
  namespace: logging
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kibana
  template:
    metadata:
      labels:
        app: kibana
    spec:
      containers:
      - name: kibana
        image: docker.elastic.co/kibana/kibana:8.10.0
        env:
        - name: ELASTICSEARCH_HOSTS
          value: "http://elasticsearch:9200"
        ports:
        - containerPort: 5601
```

**Services :**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: elasticsearch
  namespace: logging
spec:
  selector:
    app: elasticsearch
  ports:
  - port: 9200
---
apiVersion: v1
kind: Service
metadata:
  name: kibana
  namespace: logging
spec:
  type: NodePort
  selector:
    app: kibana
  ports:
  - port: 5601
    nodePort: 30601
```

**Accéder à Kibana :**
```bash
minikube service kibana -n logging
```

### 12.3 Collecte de Logs depuis les Pods

**Fluentd DaemonSet (collecteur de logs) :**
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging.svc.cluster.local"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

---

## 13. Terraform - Infrastructure as Code

### 13.1 Qu'est-ce que Terraform ?

**Définition :**
Terraform est un outil d'Infrastructure as Code (IaC) qui permet de :
- ✅ Définir l'infrastructure en code
- ✅ Versionner l'infrastructure
- ✅ Déployer de manière reproductible
- ✅ Gérer plusieurs environnements

### 13.2 Installation

**Windows (Chocolatey) :**
```bash
choco install terraform
```

**Vérifier :**
```bash
terraform version
```

### 13.3 Structure Terraform pour Kubernetes

**Fichier : `terraform/main.tf`**
```hcl
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "minikube"
}

# Namespace
resource "kubernetes_namespace" "medflow" {
  metadata {
    name = "medflow"
  }
}

# ConfigMap
resource "kubernetes_config_map" "medflow_config" {
  metadata {
    name      = "medflow-config"
    namespace = kubernetes_namespace.medflow.metadata[0].name
  }

  data = {
    PORT         = "4000"
    NODE_ENV     = "production"
    FRONTEND_URL = "http://localhost:5173"
  }
}

# Secret
resource "kubernetes_secret" "medflow_secrets" {
  metadata {
    name      = "medflow-secrets"
    namespace = kubernetes_namespace.medflow.metadata[0].name
  }

  data = {
    jwt-secret-key = base64encode("dferetbvdfbrtyhyynuikd")
    mongo-uri      = base64encode("mongodb+srv://...")
  }

  type = "Opaque"
}

# Deployment Backend
resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "backend-deployment"
    namespace = kubernetes_namespace.medflow.metadata[0].name
  }

  spec {
    replicas = 3

    selector {
      match_labels = {
        app = "backend"
      }
    }

    template {
      metadata {
        labels = {
          app = "backend"
        }
      }

      spec {
        container {
          name  = "backend"
          image = "medflow-backend:latest"

          port {
            container_port = 4000
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.medflow_config.metadata[0].name
            }
          }

          env {
            name = "JWT_SECRET_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.medflow_secrets.metadata[0].name
                key  = "jwt-secret-key"
              }
            }
          }
        }
      }
    }
  }
}
```

**Initialiser Terraform :**
```bash
cd terraform
terraform init
```

**Planifier :**
```bash
terraform plan
```

**Appliquer :**
```bash
terraform apply
```

**Détruire :**
```bash
terraform destroy
```

---

## 14. Ansible - Automatisation

### 14.1 Qu'est-ce qu'Ansible ?

**Définition :**
Ansible est un outil d'automatisation qui permet de :
- ✅ Configurer des serveurs
- ✅ Déployer des applications
- ✅ Gérer des configurations
- ✅ Automatiser des tâches répétitives

**Avantages :**
- Pas d'agent (utilise SSH)
- Configuration en YAML
- Idempotent (peut être exécuté plusieurs fois)

### 14.2 Installation

**Windows (via WSL ou pip) :**
```bash
pip install ansible
```

**Vérifier :**
```bash
ansible --version
```

### 14.3 Playbook Ansible pour Kubernetes

**Fichier : `ansible/playbook.yml`**
```yaml
---
- name: Deploy MedFlow to Kubernetes
  hosts: localhost
  connection: local
  tasks:
    - name: Create namespace
      kubernetes.core.k8s:
        name: medflow
        api_version: v1
        kind: Namespace
        state: present

    - name: Create ConfigMap
      kubernetes.core.k8s:
        definition:
          apiVersion: v1
          kind: ConfigMap
          metadata:
            name: medflow-config
            namespace: medflow
          data:
            PORT: "4000"
            NODE_ENV: "production"

    - name: Create Secret
      kubernetes.core.k8s:
        definition:
          apiVersion: v1
          kind: Secret
          metadata:
            name: medflow-secrets
            namespace: medflow
          type: Opaque
          data:
            jwt-secret-key: "{{ jwt_secret_key | b64encode }}"
        state: present

    - name: Deploy Backend
      kubernetes.core.k8s:
        definition:
          apiVersion: apps/v1
          kind: Deployment
          metadata:
            name: backend-deployment
            namespace: medflow
          spec:
            replicas: 3
            selector:
              matchLabels:
                app: backend
            template:
              metadata:
                labels:
                  app: backend
              spec:
                containers:
                - name: backend
                  image: medflow-backend:latest
                  ports:
                  - containerPort: 4000
        state: present
```

**Variables : `ansible/vars.yml`**
```yaml
jwt_secret_key: "dferetbvdfbrtyhyynuikd"
mongo_uri: "mongodb+srv://..."
backend_replicas: 3
```

**Exécuter :**
```bash
ansible-playbook playbook.yml -e @vars.yml
```

---

## 15. Déploiement de MedFlow - Guide Complet

### 15.1 Architecture Complète

```
┌─────────────────────────────────────────────────────────┐
│                    Minikube Cluster                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Namespace: medflow                                       │
│  ├── Backend (Deployment, 3 replicas)                    │
│  ├── Dashboard (Deployment, 2 replicas)                 │
│  ├── Frontend (Deployment, 2 replicas)                   │
│  ├── MongoDB (StatefulSet, 1 replica)                     │
│  ├── Services (ClusterIP)                                │
│  ├── Ingress (Routage HTTP)                              │
│  ├── ConfigMaps (Configuration)                         │
│  ├── Secrets (Données sensibles)                         │
│  └── HPA (Auto-scaling)                                  │
│                                                           │
│  Namespace: logging                                      │
│  ├── Elasticsearch (StatefulSet)                         │
│  ├── Kibana (Deployment)                                 │
│  └── Fluentd (DaemonSet)                                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 15.2 Étapes de Déploiement

**Étape 1 : Préparer les Images Docker**
```bash
# Build des images
docker build -t medflow-backend:latest ./backend
docker build -t medflow-dashboard:latest ./dashboard
docker build -t medflow-frontend:latest ./frontend

# Charger dans Minikube
minikube image load medflow-backend:latest
minikube image load medflow-dashboard:latest
minikube image load medflow-frontend:latest
```

**Étape 2 : Créer le Namespace**
```bash
kubectl create namespace medflow
```

**Étape 3 : Créer les Secrets**
```bash
kubectl create secret generic medflow-secrets \
  --from-literal=jwt-secret-key=dferetbvdfbrtyhyynuikd \
  --from-literal=mongo-uri=mongodb+srv://... \
  -n medflow
```

**Étape 4 : Créer les ConfigMaps**
```bash
kubectl create configmap medflow-config \
  --from-literal=PORT=4000 \
  --from-literal=NODE_ENV=production \
  -n medflow
```

**Étape 5 : Déployer MongoDB**
```bash
kubectl apply -f k8s/mongodb-statefulset.yaml
kubectl apply -f k8s/mongodb-service.yaml
```

**Étape 6 : Déployer le Backend**
```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
```

**Étape 7 : Déployer les Frontends**
```bash
kubectl apply -f k8s/dashboard-deployment.yaml
kubectl apply -f k8s/dashboard-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

**Étape 8 : Configurer l'Ingress**
```bash
minikube addons enable ingress
kubectl apply -f k8s/ingress.yaml
```

**Étape 9 : Configurer HPA**
```bash
minikube addons enable metrics-server
kubectl apply -f k8s/hpa-backend.yaml
```

**Étape 10 : Vérifier**
```bash
kubectl get all -n medflow
kubectl get ingress -n medflow
```

### 15.3 Commandes de Vérification

```bash
# Voir tous les pods
kubectl get pods -n medflow

# Voir les services
kubectl get services -n medflow

# Voir les logs
kubectl logs -f deployment/backend-deployment -n medflow

# Décrire un pod
kubectl describe pod <pod-name> -n medflow

# Accéder à un pod
kubectl exec -it <pod-name> -n medflow -- sh

# Voir les événements
kubectl get events -n medflow --sort-by='.lastTimestamp'
```

---

## 🎓 Résumé et Prochaines Étapes

### Concepts Maîtrisés

✅ **Kubernetes de base** : Pods, Deployments, Services
✅ **Services avancés** : ClusterIP, NodePort, LoadBalancer, Ingress
✅ **Configuration** : ConfigMaps, Secrets
✅ **Stockage** : PersistentVolumes, StatefulSets
✅ **Santé** : Liveness, Readiness, Startup Probes
✅ **Scalabilité** : Horizontal Pod Autoscaler
✅ **Packaging** : Helm Charts
✅ **Monitoring** : ELK Stack
✅ **IaC** : Terraform, Ansible

### Prochaines Étapes Pratiques

1. **Installer Minikube et kubectl**
2. **Créer les Dockerfiles** pour chaque service
3. **Créer les manifests Kubernetes** (YAML)
4. **Déployer progressivement** : MongoDB → Backend → Frontends
5. **Configurer l'Ingress** pour le routage
6. **Ajouter le monitoring** avec ELK
7. **Automatiser** avec Helm, Terraform, Ansible

---

## 📚 Ressources Supplémentaires

- **Documentation Kubernetes** : https://kubernetes.io/docs/
- **Minikube** : https://minikube.sigs.k8s.io/docs/
- **Helm** : https://helm.sh/docs/
- **Terraform Kubernetes** : https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs
- **Ansible Kubernetes** : https://docs.ansible.com/ansible/latest/collections/kubernetes/core/

---

**Formation créée le :** 17 Novembre 2025
**Version :** 1.0.0
**Pour :** Projet MedFlow - DevOps 3

