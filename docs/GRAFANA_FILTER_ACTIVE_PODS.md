# 🔍 Filtrer les Pods Actifs dans Grafana

## Problème

Les métriques CPU et mémoire peuvent montrer des pods qui ne sont plus actifs (pods supprimés mais dont les métriques persistent dans Prometheus).

## Solution : Filtrer par État des Pods

### Requête CPU avec Filtre

Au lieu de :
```promql
rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m]) * 100
```

Utilisez :
```promql
rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*", container!="POD"}[5m]) * 100
```

### Requête Mémoire avec Filtre

Au lieu de :
```promql
container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*"} / 1024 / 1024
```

Utilisez :
```promql
container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*", container!="POD"} / 1024 / 1024
```

### Filtrer par Pods Running

Pour ne voir que les pods actuellement en cours d'exécution :

```promql
# CPU avec filtre pods running
rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*", container!="POD"} * on(pod) group_left kube_pod_status_phase{namespace="medflow", phase="Running"}[5m]) * 100
```

## Solution Simple : Utiliser le Label `pod_name`

L'uptime utilise déjà le label `pod_name` qui est plus fiable. Pour CPU et mémoire, vous pouvez aussi filtrer par les pods qui ont des métriques d'uptime :

```promql
# CPU seulement pour les pods avec uptime
rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*", container!="POD"}[5m]) * 100
AND on(pod_name) 
medflow_uptime_seconds{job="medflow-backend"} > 0
```

## Vérifier les Pods Actifs

Dans Prometheus, exécutez :

```promql
kube_pod_status_phase{namespace="medflow", pod=~"backend.*"}
```

Cela vous montrera l'état de tous les pods backend.

## Solution Recommandée

Pour vos dashboards Grafana, utilisez simplement :

**CPU** :
```promql
rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*", container!="POD"}[5m]) * 100
```

**Mémoire** :
```promql
container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*", container!="POD"} / 1024 / 1024
```

Le filtre `container!="POD"` exclut les conteneurs système et ne garde que les conteneurs applicatifs.

