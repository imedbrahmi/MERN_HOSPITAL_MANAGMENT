# 🎨 Guide d'Utilisation du Design System MedFlow

## 📋 Comment Utiliser les Maquettes et le Design System

### 1. **Fichiers de Design Disponibles**

```
docs/
├── mockups/
│   ├── screen-mockups.md          # Maquettes ASCII des écrans
│   ├── design-system.css          # CSS du Design System
│   └── GUIDE_UTILISATION.md       # Ce fichier
└── uml/
    ├── use-case-diagram.puml      # Diagramme de cas d'utilisation
    ├── class-diagram.puml         # Diagramme de classes
    ├── sequence-diagram-appointment.puml  # Diagramme de séquence
    └── erd-diagram.puml           # Schéma de base de données
```

---

## 🚀 Implémentation du Design

### **Option 1 : Utiliser le CSS du Design System**

#### Étape 1 : Copier le fichier CSS

Copiez le contenu de `docs/mockups/design-system.css` dans vos fichiers CSS existants :

- **Dashboard** : `dashboard/src/App.css`
- **Frontend** : `frontend/src/App.css`

Ou créez un nouveau fichier et importez-le :

```javascript
// dashboard/src/index.css ou App.css
import './design-system.css';
```

#### Étape 2 : Utiliser les classes CSS

Utilisez les classes définies dans le design system :

```jsx
// Exemple : Carte de statistique
<div className="stat-card">
  <div className="stat-value">150</div>
  <div className="stat-label">Appointments</div>
</div>

// Exemple : Bouton
<button className="btn btn-primary">Créer</button>

// Exemple : Formulaire
<div className="form-group">
  <label className="form-label required">Prénom</label>
  <input type="text" className="form-input" />
</div>
```

---

### **Option 2 : Utiliser les Variables CSS**

Importez les variables CSS dans vos composants :

```css
/* dashboard/src/App.css */
@import url('../docs/mockups/design-system.css');

/* Utiliser les variables */
.my-component {
  background-color: var(--color-primary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
}
```

---

### **Option 3 : Créer un Fichier de Styles Global**

Créez un fichier `styles.css` à la racine de votre projet :

```bash
# Dashboard
dashboard/src/styles/design-system.css

# Frontend
frontend/src/styles/design-system.css
```

Puis importez-le dans `main.jsx` :

```javascript
// dashboard/src/main.jsx
import './styles/design-system.css';
```

---

## 📱 Utilisation des Maquettes

### **1. Référence Visuelle**

Les maquettes dans `screen-mockups.md` servent de **référence visuelle** pour :
- Comprendre la structure de chaque page
- Identifier les composants nécessaires
- Voir la disposition des éléments

### **2. Exemple d'Implémentation**

Pour la **Page Dashboard** :

```jsx
// dashboard/src/components/Dashboard.jsx
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="main-content">
      {/* Section Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">150</div>
          <div className="stat-label">Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">25</div>
          <div className="stat-label">Doctors</div>
        </div>
        {/* ... */}
      </div>

      {/* Section Appointments Récents */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Rendez-vous Récents</h3>
        </div>
        <div className="card-body">
          {/* Liste des appointments */}
        </div>
      </div>
    </div>
  );
};
```

---

## 🎨 Structure des Composants

### **1. Carte (Card)**

```jsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Titre</h3>
  </div>
  <div className="card-body">
    {/* Contenu */}
  </div>
  <div className="card-footer">
    {/* Actions */}
  </div>
</div>
```

### **2. Formulaire**

```jsx
<div className="form-group">
  <label className="form-label required">Prénom</label>
  <input 
    type="text" 
    className="form-input"
    placeholder="Entrez votre prénom"
  />
  <span className="form-error">Message d'erreur</span>
</div>
```

### **3. Bouton**

```jsx
<button className="btn btn-primary">Créer</button>
<button className="btn btn-secondary">Annuler</button>
<button className="btn btn-danger">Supprimer</button>
<button className="btn btn-outline">Voir plus</button>
```

### **4. Badge**

```jsx
<span className="badge badge-success">Accepted</span>
<span className="badge badge-pending">Pending</span>
<span className="badge badge-danger">Rejected</span>
```

---

## 📐 Layout Principal

### **Dashboard Layout**

```jsx
<div className="dashboard-container">
  {/* SideBar */}
  <aside className="sidebar">
    <div className="sidebar-item active">
      <span className="sidebar-icon">🏠</span>
      <span>Dashboard</span>
    </div>
    {/* ... autres items */}
  </aside>

  {/* Main Content */}
  <main className="main-content">
    {/* Contenu de la page */}
  </main>
</div>
```

### **Frontend Layout**

```jsx
<div className="frontend-container">
  {/* NavBar */}
  <nav className="navbar">
    <div className="navbar-brand">🏥 MedFlow</div>
    <ul className="navbar-nav">
      <li><a href="/" className="navbar-link">Home</a></li>
      {/* ... autres liens */}
    </ul>
  </nav>

  {/* Page Content */}
  <main>
    {/* Contenu de la page */}
  </main>

  {/* Footer */}
  <footer className="footer">
    {/* Footer content */}
  </footer>
</div>
```

---

## 🎯 Exemples Concrets

### **Exemple 1 : Page de Statistiques**

```jsx
const Dashboard = () => {
  return (
    <div className="main-content">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">150</div>
          <div className="stat-label">Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">25</div>
          <div className="stat-label">Doctors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">8</div>
          <div className="stat-label">Clinics</div>
        </div>
      </div>
    </div>
  );
};
```

### **Exemple 2 : Formulaire de Création**

```jsx
const CreateAppointment = () => {
  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Prendre un Rendez-vous</h2>
        </div>
        
        <div className="card-body">
          <div className="form-group">
            <label className="form-label required">Prénom</label>
            <input type="text" className="form-input" />
          </div>
          
          <div className="form-group">
            <label className="form-label required">Nom</label>
            <input type="text" className="form-input" />
          </div>
          
          {/* ... autres champs */}
        </div>
        
        <div className="card-footer">
          <button className="btn btn-secondary">Annuler</button>
          <button className="btn btn-primary">Créer</button>
        </div>
      </div>
    </div>
  );
};
```

### **Exemple 3 : Liste avec Tableau**

```jsx
const Doctors = () => {
  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Docteurs</h2>
          <button className="btn btn-primary">+ Ajouter</button>
        </div>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Département</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dr. Ahmed Ben Ali</td>
                <td>ahmed@example.com</td>
                <td>Cardiology</td>
                <td>
                  <button className="btn btn-sm btn-primary">Modifier</button>
                  <button className="btn btn-sm btn-danger">Supprimer</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔧 Personnalisation

### **Modifier les Couleurs**

Éditez les variables CSS dans `design-system.css` :

```css
:root {
  --color-primary: #4A90E2;  /* Changez cette couleur */
  --color-secondary: #50C878; /* Changez cette couleur */
  /* ... */
}
```

### **Ajouter de Nouvelles Classes**

Ajoutez vos propres classes dans votre fichier CSS :

```css
.my-custom-card {
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
}
```

---

## 📚 Ressources

- **Maquettes** : `docs/mockups/screen-mockups.md`
- **Design System CSS** : `docs/mockups/design-system.css`
- **Diagrammes UML** : `docs/uml/`

---

## ✅ Checklist d'Implémentation

- [ ] Copier `design-system.css` dans le projet
- [ ] Importer le CSS dans `main.jsx` ou `App.jsx`
- [ ] Utiliser les classes CSS dans les composants
- [ ] Appliquer le layout principal (SideBar + Main Content)
- [ ] Tester sur différentes tailles d'écran (responsive)
- [ ] Personnaliser les couleurs si nécessaire

---

**Besoin d'aide ?** Consultez les maquettes dans `screen-mockups.md` pour voir la structure exacte de chaque page.

