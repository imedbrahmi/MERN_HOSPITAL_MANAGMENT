# 📊 Guide d'Utilisation - Prometheus & Grafana pour MedFlow

## 🎯 Vue d'ensemble

Ce guide vous explique comment utiliser Prometheus et Grafana pour monitorer votre application MedFlow déployée sur Kubernetes.

---

## 🔍 Partie 1 : Utiliser Prometheus

### Accès
- **URL** : http://prometheus.medflow.local
- **Interface** : Query, Alerts, Status

### Requêtes PromQL Essentielles pour MedFlow

#### 1. Vérifier que Prometheus collecte les métriques

```promql
up{job="medflow-backend"}
```

**Résultat attendu** : `1` (si le backend est accessible)

#### 2. CPU des Pods Backend

```promql
rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m])
```

**Explication** : Taux d'utilisation CPU des pods backend sur 5 minutes

#### 3. Mémoire des Pods Backend

```promql
container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*"}
```

**Explication** : Mémoire utilisée par chaque pod backend en bytes

#### 4. Nombre de Pods Backend Actifs

```promql
count(kube_pod_info{namespace="medflow", pod=~"backend.*"})
```

**Explication** : Nombre total de pods backend

#### 5. CPU Moyenne de Tous les Pods Backend

```promql
avg(rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m]))
```

**Explication** : CPU moyenne de tous les pods backend

#### 6. Mémoire Moyenne de Tous les Pods Backend

```promql
avg(container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*"})
```

**Explication** : Mémoire moyenne de tous les pods backend

#### 7. Métriques du Backend (via endpoint /api/v1/metrics)

```promql
medflow_uptime_seconds{job="medflow-backend"}
```

**Explication** : Temps de fonctionnement du backend en secondes

#### 8. État des Pods MedFlow

```promql
kube_pod_status_phase{namespace="medflow"}
```

**Explication** : État de tous les pods (Running, Pending, Failed, etc.)

#### 9. Requêtes HTTP (si implémenté)

```promql
rate(medflow_http_requests_total[5m])
```

**Explication** : Taux de requêtes HTTP par seconde

#### 10. CPU et Mémoire des Pods Frontend

```promql
# CPU Frontend
rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"frontend.*"}[5m])

# Mémoire Frontend
container_memory_working_set_bytes{namespace="medflow", pod=~"frontend.*"}
```

### Comment Utiliser Prometheus

1. **Ouvrir Prometheus** : http://prometheus.medflow.local
2. **Aller dans l'onglet "Query"**
3. **Taper une requête PromQL** dans le champ de recherche
4. **Cliquer sur "Execute"**
5. **Voir les résultats** :
   - **Table** : Valeurs numériques
   - **Graph** : Graphique temporel

### Exemple Pratique : Monitorer le CPU Backend

1. Tapez : `rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m])`
2. Cliquez sur "Graph"
3. Vous verrez l'évolution du CPU dans le temps

---

## 📈 Partie 2 : Utiliser Grafana

### Accès
- **URL** : http://grafana.medflow.local
- **Identifiants** : `admin` / `admin123`

### Première Connexion

1. Connectez-vous avec `admin` / `admin123`
2. **Changez le mot de passe** (recommandé)
3. Prometheus est déjà configuré comme source de données

### Créer un Dashboard pour MedFlow

#### Dashboard 1 : Vue d'Ensemble Backend

1. **Créer un nouveau dashboard** :
   - Cliquez sur **+** (en haut à droite)
   - Sélectionnez **Create Dashboard**
   - Cliquez sur **Add visualization**

2. **Panel 1 : CPU Backend (Graphique)**

   - **Titre** : "CPU Usage - Backend Pods"
   - **Requête PromQL** :
     ```promql
     rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m]) * 100
     ```
   - **Unité** : Percent (0-100)
   - **Légende** : `{{pod}}`

3. **Panel 2 : Mémoire Backend (Graphique)**

   - **Titre** : "Memory Usage - Backend Pods"
   - **Requête PromQL** :
     ```promql
     container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*"} / 1024 / 1024
     ```
   - **Unité** : MB
   - **Légende** : `{{pod}}`

4. **Panel 3 : Nombre de Pods Backend (Stat)**

   - **Titre** : "Backend Pods Count"
   - **Requête PromQL** :
     ```promql
     count(kube_pod_info{namespace="medflow", pod=~"backend.*"})
     ```
   - **Type** : Stat
   - **Unité** : short

5. **Panel 4 : Uptime Backend (Stat)**

   - **Titre** : "Backend Uptime"
   - **Requête PromQL** :
     ```promql
     medflow_uptime_seconds{job="medflow-backend"}
     ```
   - **Type** : Stat
   - **Unité** : seconds

6. **Sauvegarder le dashboard** :
   - Cliquez sur **Save dashboard** (en haut)
   - Nom : "MedFlow - Backend Overview"
   - Dossier : "MedFlow"

#### Dashboard 2 : Vue d'Ensemble Frontend

Créez un dashboard similaire pour le frontend :

1. **Panel 1 : CPU Frontend**
   ```promql
   rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"frontend.*"}[5m]) * 100
   ```

2. **Panel 2 : Mémoire Frontend**
   ```promql
   container_memory_working_set_bytes{namespace="medflow", pod=~"frontend.*"} / 1024 / 1024
   ```

3. **Panel 3 : Nombre de Pods Frontend**
   ```promql
   count(kube_pod_info{namespace="medflow", pod=~"frontend.*"})
   ```

#### Dashboard 3 : HPA (Auto-scaling)

1. **Panel 1 : Nombre de Pods Backend (HPA)**
   ```promql
   count(kube_pod_info{namespace="medflow", pod=~"backend.*"})
   ```
   - **Type** : Graphique avec lignes de référence
   - **Ligne min** : 2 (minReplicas)
   - **Ligne max** : 10 (maxReplicas)

2. **Panel 2 : CPU Moyenne (pour HPA)**
   ```promql
   avg(rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m])) * 100
   ```
   - **Ligne de référence** : 70% (seuil HPA)

3. **Panel 3 : Mémoire Moyenne (pour HPA)**
   ```promql
   avg(container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*"}) / 1024 / 1024
   ```
   - **Ligne de référence** : 80% du limit

#### Dashboard 4 : État des Pods

1. **Panel 1 : État des Pods (Table)**
   ```promql
   kube_pod_status_phase{namespace="medflow"}
   ```
   - **Type** : Table
   - **Colonnes** : pod, phase

2. **Panel 2 : Pods par État (Pie Chart)**
   ```promql
   count by (phase) (kube_pod_status_phase{namespace="medflow"})
   ```
   - **Type** : Pie chart

### Importer un Dashboard Existant

Grafana propose des dashboards prêts à l'emploi :

1. **Allez dans Dashboards** > **Import**
2. **Entrez un ID de dashboard** :
   - **315** : Kubernetes Cluster Monitoring
   - **8588** : Kubernetes / Compute Resources / Cluster
   - **6417** : Kubernetes Deployment Statefulset Daemonset metrics
3. **Sélectionnez Prometheus** comme source de données
4. **Cliquez sur Import**

### Créer une Alerte

#### Exemple : Alerte CPU Élevé

1. **Créez un dashboard** avec un graphique CPU
2. **Cliquez sur le graphique** > **Edit**
3. **Onglet Alert** :
   - **Condition** : `WHEN avg() OF query(A, 5m, now) IS ABOVE 0.7`
   - **Evaluation** : Every 5m for 5m
   - **Notifications** : (configurez un contact point)
4. **Sauvegardez**

---

## 🎯 Scénarios d'Utilisation pour MedFlow

### Scénario 1 : Vérifier la Santé de l'Application

1. **Prometheus** :
   ```promql
   up{namespace="medflow"}
   ```
   - Tous les services doivent retourner `1`

2. **Grafana** :
   - Créez un panel avec cette requête
   - Si une valeur est `0`, le service est down

### Scénario 2 : Monitorer l'Auto-scaling

1. **Grafana Dashboard HPA** :
   - Observez le nombre de pods backend
   - Si CPU > 70%, le HPA devrait créer plus de pods
   - Si CPU < 70%, le HPA devrait réduire les pods

2. **Vérifier dans Kubernetes** :
   ```bash
   kubectl get hpa -n medflow -w
   ```

### Scénario 3 : Détecter une Surcharge

1. **Prometheus** :
   ```promql
   avg(rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m])) > 0.7
   ```
   - Si `true`, le backend est surchargé

2. **Grafana** :
   - Créez une alerte sur cette métrique
   - Configurez une notification (email, Slack, etc.)

### Scénario 4 : Analyser les Performances

1. **Grafana Dashboard** :
   - CPU par pod : Identifiez les pods les plus chargés
   - Mémoire par pod : Détectez les fuites mémoire
   - Uptime : Vérifiez la stabilité

---

## 🔧 Commandes Utiles

### Vérifier que Prometheus collecte les métriques

```bash
# Dans Prometheus, exécutez :
up{job="medflow-backend"}
```

### Vérifier les métriques du backend

```bash
# Tester l'endpoint de métriques
curl http://api.medflow.local/api/v1/metrics
```

### Voir les targets Prometheus

Dans Prometheus :
1. Allez dans **Status** > **Targets**
2. Vérifiez que tous les targets sont "UP"

---

## 📝 Checklist d'Utilisation

### Prometheus
- [ ] Accès à http://prometheus.medflow.local
- [ ] Test d'une requête PromQL simple
- [ ] Vérification des targets (Status > Targets)
- [ ] Création d'une requête pour CPU backend
- [ ] Création d'une requête pour mémoire backend

### Grafana
- [ ] Connexion avec admin/admin123
- [ ] Vérification de la source de données Prometheus
- [ ] Création d'un dashboard Backend
- [ ] Création d'un dashboard Frontend
- [ ] Import d'un dashboard Kubernetes (optionnel)
- [ ] Création d'une alerte (optionnel)

---

## 🎓 Ressources

- **PromQL** : https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Grafana Dashboards** : https://grafana.com/grafana/dashboards/
- **Documentation Prometheus** : https://prometheus.io/docs/

---

## 💡 Astuces

1. **Utilisez des variables** dans Grafana pour rendre les dashboards dynamiques
2. **Créez des annotations** pour marquer les déploiements
3. **Exportez vos dashboards** pour les partager
4. **Configurez des alertes** pour être notifié des problèmes

---

**Note** : Les métriques sont collectées toutes les 15 secondes. Les graphiques montrent l'évolution dans le temps.

