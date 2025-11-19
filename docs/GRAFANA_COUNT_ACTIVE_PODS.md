# 🔢 Compter les Pods Actifs dans Grafana

## Problème

La requête `count by (pod)` liste tous les pods qui ont des métriques, y compris les anciens pods supprimés dont les métriques persistent dans Prometheus.

## Solution : Compter Seulement les Pods Actifs

### Option 1 : Via Uptime (Recommandé - Le Plus Fiable)

Cette requête compte uniquement les pods qui répondent activement :

```promql
count(medflow_uptime_seconds{job="medflow-backend"})
```

**Avantages** :
- ✅ Compte seulement les pods actifs qui répondent
- ✅ Exclut automatiquement les pods supprimés
- ✅ Simple et fiable

**Utilisation dans Grafana** :
- Type de visualisation : **Stat**
- Requête : `count(medflow_uptime_seconds{job="medflow-backend"})`
- Unité : `short`

### Option 2 : Via Container Metrics avec Filtre Temporel

Compte les pods qui ont des métriques récentes (moins de 5 minutes) :

```promql
count(count by (pod) (container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*", container!="POD"}))
```

**Note** : Cette requête peut encore inclure des anciens pods si leurs métriques sont récentes.

### Option 3 : Filtrer par Pods Actifs (Plus Complexe)

Pour lister les pods actifs uniquement :

```promql
count by (pod) (container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*", container!="POD"}) 
AND on(pod) 
medflow_uptime_seconds{job="medflow-backend"} > 0
```

Cette requête ne garde que les pods qui ont :
1. Des métriques CPU
2. ET un uptime actif

## Configuration dans Grafana

### Panel "Backend Pods Count"

1. **Type** : **Stat** (pas Pie Chart pour le count)

2. **Requête** :
   ```promql
   count(medflow_uptime_seconds{job="medflow-backend"})
   ```

3. **Options Stat** :
   - **Value options** > **Stat** : `Last`
   - **Color mode** : `Value`
   - **Thresholds** :
     - `2` (Green) - Nombre attendu minimum
     - `10` (Red) - Nombre maximum (maxReplicas HPA)

### Si Vous Voulez Voir la Liste des Pods (Pie Chart)

Si vous voulez vraiment un pie chart avec la liste des pods actifs :

1. **Type** : **Pie chart**

2. **Requête** :
   ```promql
   count by (pod) (container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*", container!="POD"}) 
   AND on(pod) 
   medflow_uptime_seconds{job="medflow-backend"} > 0
   ```

3. **Label** : Utilisez `{{pod}}` pour afficher le nom du pod

## Vérification

Pour vérifier combien de pods sont actifs :

```bash
kubectl get pods -n medflow -l app=backend
```

Le nombre devrait correspondre à la valeur affichée dans Grafana avec la requête `count(medflow_uptime_seconds{job="medflow-backend"})`.

## Recommandation

**Utilisez toujours** :
```promql
count(medflow_uptime_seconds{job="medflow-backend"})
```

C'est la méthode la plus fiable pour compter les pods actifs, car elle vérifie que le pod répond réellement à l'endpoint de métriques.

