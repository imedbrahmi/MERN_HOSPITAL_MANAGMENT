# 📊 Tutoriel : Créer un Dashboard Grafana pour MedFlow

## 🎯 Objectif

Créer un dashboard complet pour monitorer votre application MedFlow avec des graphiques en temps réel.

---

## 📝 Étape 1 : Accéder à Grafana

1. Ouvrez votre navigateur
2. Allez sur : **http://grafana.medflow.local**
3. Connectez-vous avec :
   - **Username** : `admin`
   - **Password** : `admin123`

---

## 🆕 Étape 2 : Créer un Nouveau Dashboard

1. Cliquez sur le **+** (en haut à droite)
2. Sélectionnez **"Create Dashboard"**
3. Cliquez sur **"Add visualization"**

---

## 📈 Étape 3 : Créer le Panel 1 - CPU Backend

### Configuration

1. **Source de données** : Sélectionnez **Prometheus** (déjà configuré)

2. **Requête PromQL** :
   ```promql
   rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m]) * 100
   ```

3. **Titre du panel** :
   - Cliquez sur le titre "Panel title" en haut
   - Renommez en : **"CPU Usage - Backend Pods"**

4. **Unité** :
   - Dans l'onglet **"Standard options"** (à droite)
   - **Unit** : `Percent (0-100)`

5. **Légende** :
   - Dans l'onglet **"Legend"** (à droite)
   - Cochez **"Show legend"**
   - **Legend values** : 
     - Si disponible : Cochez **"Current"** ou **"Last"**
     - Sinon : Laissez vide (la légende affichera juste les noms des séries)

6. **Sauvegarder le panel** :
   - Cliquez sur **"Apply"** (en haut à droite)

---

## 📊 Étape 4 : Créer le Panel 2 - Mémoire Backend

1. Cliquez sur **"Add panel"** > **"Add new panel"**

2. **Requête PromQL** :
   ```promql
   container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*"} / 1024 / 1024
   ```

3. **Titre** : **"Memory Usage - Backend Pods (MB)"**

4. **Unité** :
   - **Unit** : `Megabytes (MB)`

5. **Légende** : Activez la légende

6. **Sauvegarder** : Cliquez sur **"Apply"**

---

## 📈 Étape 5 : Créer le Panel 3 - Uptime Backend

1. Cliquez sur **"Add panel"** > **"Add new panel"**

2. **Type de visualisation** :
   - Changez de "Time series" à **"Stat"** (en haut à droite)

3. **Requête PromQL** :
   ```promql
   medflow_uptime_seconds{job="medflow-backend"}
   ```

4. **Titre** : **"Backend Uptime"**

5. **Unité** :
   - **Unit** : `Seconds (s)`

6. **Options Stat** :
   - **Value options** > **Stat** : `Last`
   - **Color mode** : `Value`

7. **Sauvegarder** : Cliquez sur **"Apply"**

---

## 📊 Étape 6 : Créer le Panel 4 - Nombre de Pods Backend

1. Cliquez sur **"Add panel"** > **"Add new panel"**

2. **Type** : **"Stat"**

3. **Requête PromQL** :
   ```promql
   count(kube_pod_info{namespace="medflow", pod=~"backend.*"})
   ```

4. **Titre** : **"Backend Pods Count"**

5. **Unité** :
   - **Unit** : `short` (pas d'unité)

6. **Options Stat** :
   - **Value options** > **Stat** : `Last`
   - **Color mode** : `Value`

7. **Sauvegarder** : Cliquez sur **"Apply"**

---

## 📈 Étape 7 : Créer le Panel 5 - CPU Moyenne Backend

1. Cliquez sur **"Add panel"** > **"Add new panel"**

2. **Requête PromQL** :
   ```promql
   avg(rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m])) * 100
   ```

3. **Titre** : **"Average CPU - Backend"**

4. **Unité** : `Percent (0-100)`

5. **Ligne de référence** (pour HPA) :
   - Dans l'onglet **"Thresholds"** (à droite)
   - Cliquez sur **"Add threshold"**
   - **Value** : `70`
   - **Color** : Orange (seuil HPA)
   - Cliquez sur **"Add threshold"** à nouveau
   - **Value** : `90`
   - **Color** : Red (alerte)

6. **Sauvegarder** : Cliquez sur **"Apply"**

---

## 📊 Étape 8 : Créer le Panel 6 - Mémoire Moyenne Backend

1. Cliquez sur **"Add panel"** > **"Add new panel"**

2. **Requête PromQL** :
   ```promql
   avg(container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*"}) / 1024 / 1024
   ```

3. **Titre** : **"Average Memory - Backend (MB)"**

4. **Unité** : `Megabytes (MB)`

5. **Ligne de référence** :
   - **Thresholds** :
     - `200` (Orange) - 80% de 256MB
     - `230` (Red) - 90% de 256MB

6. **Sauvegarder** : Cliquez sur **"Apply"**

---

## 💾 Étape 9 : Sauvegarder le Dashboard

1. Cliquez sur **"Save dashboard"** (icône disquette en haut)
2. **Nom du dashboard** : `MedFlow - Backend Overview`
3. **Dossier** : Créez un nouveau dossier `MedFlow`
4. Cliquez sur **"Save"**

---

## 🎨 Étape 10 : Organiser les Panels

1. **Réorganiser les panels** :
   - Cliquez et glissez les panels pour les réorganiser
   - Redimensionnez-les en cliquant sur le coin inférieur droit

2. **Disposition recommandée** :
   ```
   ┌─────────────────┬─────────────────┐
   │  CPU Usage      │  Memory Usage   │
   ├─────────────────┼─────────────────┤
   │  Uptime         │  Pods Count     │
   ├─────────────────┴─────────────────┤
   │  Average CPU                        │
   ├─────────────────────────────────────┤
   │  Average Memory                     │
   └─────────────────────────────────────┘
   ```

---

## 🔄 Étape 11 : Créer un Dashboard Frontend (Optionnel)

Créez un dashboard similaire pour le frontend :

1. **Nouveau dashboard** : `MedFlow - Frontend Overview`

2. **Panels à créer** :
   - CPU Frontend :
     ```promql
     rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"frontend.*"}[5m]) * 100
     ```
   - Mémoire Frontend :
     ```promql
     container_memory_working_set_bytes{namespace="medflow", pod=~"frontend.*"} / 1024 / 1024
     ```
   - Nombre de Pods Frontend :
     ```promql
     count(kube_pod_info{namespace="medflow", pod=~"frontend.*"})
     ```

---

## 📊 Étape 12 : Créer un Dashboard HPA (Auto-scaling)

1. **Nouveau dashboard** : `MedFlow - HPA Monitoring`

2. **Panel 1 : Nombre de Pods Backend (avec seuils HPA)**
   ```promql
   count(kube_pod_info{namespace="medflow", pod=~"backend.*"})
   ```
   - **Thresholds** :
     - `2` (Green) - minReplicas
     - `10` (Red) - maxReplicas

3. **Panel 2 : CPU Moyenne (pour HPA)**
   ```promql
   avg(rate(container_cpu_usage_seconds_total{namespace="medflow", pod=~"backend.*"}[5m])) * 100
   ```
   - **Ligne de référence** : `70%` (seuil HPA CPU)

4. **Panel 3 : Mémoire Moyenne (pour HPA)**
   ```promql
   avg(container_memory_working_set_bytes{namespace="medflow", pod=~"backend.*"}) / 1024 / 1024
   ```
   - **Ligne de référence** : `200 MB` (80% de 256MB)

---

## 🎯 Astuces et Bonnes Pratiques

### 1. Variables de Dashboard

Créez des variables pour rendre le dashboard dynamique :

1. **Settings** > **Variables** > **Add variable**
2. **Name** : `namespace`
3. **Type** : `Query`
4. **Query** : `label_values(kube_pod_info, namespace)`
5. Utilisez `$namespace` dans vos requêtes

### 2. Refresh Automatique

- Cliquez sur l'icône d'horloge (en haut à droite)
- Sélectionnez : **"Last 5 minutes"** avec **"Auto refresh"** : `30s`

### 3. Annotations

Ajoutez des annotations pour marquer les déploiements :

1. **Settings** > **Annotations** > **Add annotation query**
2. **Name** : `Deployments`
3. **Query** : `kube_deployment_spec_replicas{namespace="medflow"}`

### 4. Alertes

Créez des alertes directement depuis les panels :

1. Cliquez sur un panel > **Edit**
2. Onglet **Alert**
3. Configurez la condition et les notifications

---

## 📋 Checklist

- [ ] Dashboard Backend créé
- [ ] 6 panels configurés
- [ ] Dashboard sauvegardé
- [ ] Panels organisés et redimensionnés
- [ ] Refresh automatique configuré
- [ ] Dashboard Frontend créé (optionnel)
- [ ] Dashboard HPA créé (optionnel)

---

## 🎓 Prochaines Étapes

1. **Importer des dashboards existants** :
   - Dashboards > Import
   - ID : `315` (Kubernetes Cluster Monitoring)

2. **Créer des alertes** :
   - Configurez des notifications pour les seuils critiques

3. **Personnaliser** :
   - Ajoutez des variables
   - Créez des dashboards spécifiques à vos besoins

---

**Note** : Les métriques sont mises à jour toutes les 15 secondes. Les graphiques montrent l'évolution dans le temps.

