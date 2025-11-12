# Guide de Connexion - MedFlow

## 📋 Vue d'ensemble

Ce guide explique comment créer et se connecter avec différents rôles pour tester toutes les interfaces.

## 🔐 Méthodes de connexion

### 1. **SuperAdmin** (Dashboard)
- **URL**: `http://localhost:5174/login`
- **Rôle**: `Admin` (dans le formulaire, mais accepte SuperAdmin)
- **Email**: `superadmin@zeecare.com`
- **Password**: `SuperAdmin123`
- **Accès**: Toutes les fonctionnalités

### 2. **Admin** (Dashboard)
- **URL**: `http://localhost:5174/login`
- **Rôle**: `Admin` (dans le formulaire)
- **Création**: Via SuperAdmin → "Add New Admin"
- **Accès**: Gestion de sa clinique uniquement

### 3. **Doctor** (Dashboard)
- **URL**: `http://localhost:5174/login`
- **Rôle**: `Admin` (dans le formulaire, mais accepte Doctor)
- **Création**: Via Admin/SuperAdmin → "Add New Doctor"
- **Accès**: Ses propres rendez-vous uniquement

### 4. **Receptionist** (Dashboard)
- **URL**: `http://localhost:5174/login`
- **Rôle**: `Admin` (dans le formulaire, mais accepte Receptionist)
- **Création**: Via Admin/SuperAdmin → API endpoint (voir ci-dessous)
- **Accès**: Gestion de sa clinique (appointments, patients, messages)

### 5. **Patient** (Frontend)
- **URL**: `http://localhost:5173/` (frontend)
- **Création**: Via formulaire d'inscription public
- **Accès**: Prendre rendez-vous, voir ses rendez-vous

---

## 🛠️ Création d'utilisateurs de test

### Option 1: Via l'interface Dashboard (Recommandé)

#### Créer un Doctor:
1. Connectez-vous en tant que **SuperAdmin** ou **Admin**
2. Allez dans le SideBar → Cliquez sur l'icône "Add New Doctor" (👤+)
3. Remplissez le formulaire avec:
   - Photo du docteur
   - Tous les champs requis
   - Le `clinicId` sera assigné automatiquement si vous êtes Admin

#### Créer un Receptionist:
Utilisez l'API directement ou créez un composant frontend (voir Option 2)

### Option 2: Via API (Postman/Thunder Client)

#### Créer un Receptionist:
```http
POST http://localhost:4000/api/v1/user/receptionist/addnew
Content-Type: application/json
Cookie: adminToken=YOUR_TOKEN

{
  "firstName": "John",
  "lastName": "Receptionist",
  "phone": "12345678",
  "CIN": "12345678",
  "email": "receptionist@test.com",
  "dob": "1990-01-01",
  "gender": "Male",
  "password": "Receptionist123",
  "clinicId": "CLINIC_ID_HERE" // Optionnel pour SuperAdmin, requis pour Admin
}
```

#### Créer un Doctor (via API):
```http
POST http://localhost:4000/api/v1/user/doctor/addnew
Content-Type: multipart/form-data
Cookie: adminToken=YOUR_TOKEN

Form Data:
- firstName: "Dr. Jane"
- lastName: "Smith"
- phone: "12345678"
- CIN: "12345678"
- email: "doctor@test.com"
- dob: "1985-05-15"
- gender: "Female"
- password: "Doctor123"
- doctorDepartment: "Cardiology"
- docAvatar: [FILE]
- clinicId: "CLINIC_ID_HERE" // Optionnel
```

#### Créer un Patient:
```http
POST http://localhost:4000/api/v1/user/patient/register
Content-Type: application/json

{
  "firstName": "Patient",
  "lastName": "Test",
  "phone": "12345678",
  "CIN": "12345678",
  "email": "patient@test.com",
  "dob": "1995-03-20",
  "gender": "Male",
  "password": "Patient123",
  "confirmPassword": "Patient123",
  "role": "Patient"
}
```

---

## 📝 Exemples de comptes de test

### SuperAdmin
- **Email**: `superadmin@zeecare.com`
- **Password**: `SuperAdmin123`
- **Dashboard**: `http://localhost:5174/login`

### Admin (à créer)
- **Email**: `admin@clinic1.com`
- **Password**: `Admin123`
- **Dashboard**: `http://localhost:5174/login`
- **Rôle dans formulaire**: `Admin`

### Doctor (à créer)
- **Email**: `doctor@test.com`
- **Password**: `Doctor123`
- **Dashboard**: `http://localhost:5174/login`
- **Rôle dans formulaire**: `Admin` (mais le système reconnaît Doctor)

### Receptionist (à créer)
- **Email**: `receptionist@test.com`
- **Password**: `Receptionist123`
- **Dashboard**: `http://localhost:5174/login`
- **Rôle dans formulaire**: `Admin` (mais le système reconnaît Receptionist)

### Patient (à créer)
- **Email**: `patient@test.com`
- **Password**: `Patient123`
- **Frontend**: `http://localhost:5173/`

---

## 🔍 Vérification des rôles

Après connexion, vous pouvez vérifier votre rôle dans:
- **Dashboard**: Le SideBar affiche différentes icônes selon le rôle
- **Console**: `user.role` dans le Context React

---

## ⚠️ Notes importantes

1. **Tous les utilisateurs du dashboard** (SuperAdmin, Admin, Doctor, Receptionist) utilisent le **même formulaire de login** avec `role: 'Admin'`
2. Le backend vérifie automatiquement le vrai rôle de l'utilisateur
3. Les **Patients** utilisent un frontend séparé (`http://localhost:5173/`)
4. Assurez-vous d'avoir créé une **Clinic** avant de créer des Admins/Doctors/Receptionists qui en ont besoin
5. Les **Receptionists** et **Admins** doivent avoir un `clinicId` assigné pour fonctionner correctement

---

## 🚀 Quick Start

1. **Démarrer le backend**: `cd backend && npm run dev`
2. **Démarrer le dashboard**: `cd dashboard && npm run dev`
3. **Démarrer le frontend**: `cd frontend && npm run dev`
4. **Se connecter en SuperAdmin**: `http://localhost:5174/login`
5. **Créer une Clinic** (si nécessaire)
6. **Créer des utilisateurs de test** via l'interface ou l'API
7. **Tester chaque interface** en se connectant avec différents comptes

