# 📊 Guide de Monitoring - Prometheus & Grafana

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser Prometheus et Grafana pour monitorer votre application MedFlow déployée sur Kubernetes.

## 🔗 Accès aux Interfaces

### Prometheus
- **URL** : http://prometheus.medflow.local
- **Fonction** : Collecte et stocke les métriques

### Grafana
- **URL** : http://grafana.medflow.local
- **Identifiants par défaut** :
  - Username: `admin`
  - Password: `admin123`
- **Fonction** : Visualisation des métriques avec des dashboards

## 📝 Configuration du Fichier Hosts

Si vous n'avez pas encore configuré les hosts, exécutez le script :

```powershell
# Exécuter en tant qu'administrateur
.\k8s\add-hosts.ps1
```

Cela ajoutera automatiquement :
- `grafana.medflow.local`
- `prometheus.medflow.local`
- `mongo.medflow.local`

## 🚀 Première Connexion à Grafana

1. Ouvrez votre navigateur et allez sur : http://grafana.medflow.local
2. Connectez-vous avec :
   - Username: `admin`
   - Password: `admin123`
3. **Important** : Changez le mot de passe lors de la première connexion

## 📊 Configuration de la Source de Données Prometheus

Grafana est déjà configuré pour se connecter à Prometheus. La source de données est automatiquement configurée via ConfigMap.

### Vérification

1. Dans Grafana, allez dans **Configuration** > **Data Sources**
2. Vous devriez voir **Prometheus** comme source de données par défaut
3. L'URL devrait être : `http://prometheus-service.monitoring.svc.cluster.local:9090`

## 📈 Métriques Disponibles

### Métriques Kubernetes

Prometheus collecte automatiquement :

- **CPU** : Utilisation CPU par pod/node
- **Mémoire** : Utilisation mémoire par pod/node
- **Réseau** : Trafic réseau
- **Disque** : Utilisation disque

### Métriques Application (Backend)

Le backend expose des métriques via `/api/v1/metrics` :

- `nodejs_heap_size_total_bytes` : Taille totale du heap
- `nodejs_heap_size_used_bytes` : Taille utilisée du heap
- `nodejs_rss_memory_bytes` : Mémoire RSS
- `medflow_uptime_seconds` : Temps de fonctionnement
- `medflow_http_requests_total` : Nombre total de requêtes HTTP

### Métriques HPA

- Nombre de pods (min/max/actuel)
- Utilisation CPU moyenne
- Utilisation mémoire moyenne

## 🎨 Créer un Dashboard dans Grafana

### Dashboard Simple - Métriques Backend

1. Dans Grafana, cliquez sur **+** > **Create Dashboard**
2. Cliquez sur **Add visualization**
3. Sélectionnez **Prometheus** comme source de données
4. Utilisez ces requêtes PromQL :

#### CPU Usage par Pod Backend
```promql
rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m])
```

#### Mémoire par Pod Backend
```promql
container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*"}
```

#### Nombre de Pods Backend
```promql
count(kube_pod_info{namespace="medflow", pod=~"backend.*"})
```

#### Uptime Backend
```promql
medflow_uptime_seconds{job="medflow-backend"}
```

### Dashboard Kubernetes - Vue d'ensemble

1. Importez un dashboard existant :
   - Allez dans **Dashboards** > **Import**
   - Utilisez l'ID : `315` (Kubernetes Cluster Monitoring)
   - Ou `8588` (Kubernetes / Compute Resources / Cluster)

## 🔍 Requêtes PromQL Utiles

### Vérifier que Prometheus collecte les métriques

```promql
up{job="medflow-backend"}
```

### CPU moyenne de tous les pods backend

```promql
avg(rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m]))
```

### Mémoire moyenne de tous les pods backend

```promql
avg(container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*"})
```

### Nombre de requêtes HTTP (si implémenté)

```promql
rate(medflow_http_requests_total[5m])
```

### État des pods

```promql
kube_pod_status_phase{namespace="medflow"}
```

## 🚨 Alertes (Optionnel)

### Créer une Alerte dans Grafana

1. Créez un dashboard avec un graphique
2. Cliquez sur le graphique > **Edit**
3. Allez dans l'onglet **Alert**
4. Configurez :
   - **Condition** : Quand la métrique dépasse un seuil
   - **Evaluation** : Période d'évaluation
   - **Notifications** : Email, Slack, etc.

### Exemple d'Alerte : CPU élevé

- **Métrique** : `avg(rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m]))`
- **Condition** : `IS ABOVE 0.7` (70%)
- **Période** : 5 minutes

## 🔧 Commandes Utiles

### Vérifier l'état des pods de monitoring

```bash
kubectl get pods -n monitoring
```

### Voir les logs de Prometheus

```bash
kubectl logs -n monitoring -l app=prometheus
```

### Voir les logs de Grafana

```bash
kubectl logs -n monitoring -l app=grafana
```

### Accéder à Prometheus via port-forward (si Ingress ne fonctionne pas)

```bash
kubectl port-forward -n monitoring svc/prometheus-service 9090:9090
```

Puis accédez à : http://localhost:9090

### Accéder à Grafana via port-forward

```bash
kubectl port-forward -n monitoring svc/grafana-service 3000:80
```

Puis accédez à : http://localhost:3000

## 📊 Métriques HPA

Pour voir les métriques HPA en temps réel :

```bash
kubectl get hpa -n medflow -w
```

## 🎯 Prochaines Étapes

1. **Créer des dashboards personnalisés** pour votre application
2. **Configurer des alertes** pour les seuils critiques
3. **Exporter plus de métriques** depuis le backend (avec `prom-client`)
4. **Configurer Alertmanager** pour les notifications avancées

## 🔗 Ressources

- [Documentation Prometheus](https://prometheus.io/docs/)
- [Documentation Grafana](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

---

**Note** : Les données de Prometheus sont stockées temporairement (15 jours de rétention). Pour une persistance à long terme, configurez un PersistentVolume.

