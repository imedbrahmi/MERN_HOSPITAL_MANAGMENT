# 📋 Plan d'Implémentation - Fonctionnalités Avancées

## ✅ Modèles Créés

### 1. **Schedule (Agenda)** ✅
- **Fichier**: `backend/models/scheduleSchema.js`
- **Champs**: doctorId, dayOfWeek, startTime, endTime, duration, isAvailable, clinicId
- **Index**: doctorId + dayOfWeek, clinicId

### 2. **MedicalRecord (Dossier Médical)** ✅
- **Fichier**: `backend/models/medicalRecordSchema.js`
- **Champs**: patientId, doctorId, appointmentId, visitDate, diagnosis, symptoms, examination, treatment, notes, vitalSigns, clinicId
- **Index**: patientId, doctorId, clinicId, visitDate

### 3. **Prescription (Ordonnance)** ✅
- **Fichier**: `backend/models/prescriptionSchema.js`
- **Champs**: patientId, doctorId, appointmentId, medicalRecordId, prescriptionDate, medications[], notes, pdfUrl, pdfPublicId, clinicId
- **Index**: patientId, doctorId, clinicId, prescriptionDate

### 4. **Invoice (Facture)** ✅
- **Fichier**: `backend/models/invoiceSchema.js`
- **Champs**: invoiceNumber (auto-généré), patientId, appointmentId, items[], subtotal, tax, discount, total, status, payments[], dueDate, notes, clinicId, createdBy
- **Index**: patientId, clinicId, invoiceNumber, status, createdAt
- **Auto-génération**: Numéro de facture unique (INV-YYYY-MMDD-NNNN)

---

## 🔴 À IMPLÉMENTER - Priorité Haute

### 👨‍⚕️ **1. MÉDECIN (Doctor)**

#### 1.1 Gestion Agenda
**Backend:**
- [ ] `POST /api/v1/schedule/create` - Créer un horaire
- [ ] `GET /api/v1/schedule/doctor/:doctorId` - Récupérer les horaires d'un docteur
- [ ] `PUT /api/v1/schedule/:id` - Modifier un horaire
- [ ] `DELETE /api/v1/schedule/:id` - Supprimer un horaire
- [ ] `GET /api/v1/schedule/available/:doctorId?date=YYYY-MM-DD` - Horaires disponibles pour une date

**Frontend Dashboard:**
- [ ] Page `Schedule.jsx` - Interface de gestion d'agenda
- [ ] Formulaire création/modification horaires
- [ ] Calendrier avec horaires disponibles
- [ ] Route `/schedule` dans App.jsx
- [ ] Icône dans SideBar pour Doctor

#### 1.2 Dossiers Médicaux
**Backend:**
- [ ] `POST /api/v1/medical-record/create` - Créer un dossier médical
- [ ] `GET /api/v1/medical-record/patient/:patientId` - Dossiers d'un patient
- [ ] `GET /api/v1/medical-record/:id` - Détails d'un dossier
- [ ] `PUT /api/v1/medical-record/:id` - Modifier un dossier
- [ ] `GET /api/v1/medical-record/doctor/:doctorId` - Dossiers créés par un docteur

**Frontend Dashboard:**
- [ ] Page `MedicalRecords.jsx` - Liste des dossiers médicaux
- [ ] Page `MedicalRecordDetails.jsx` - Détails d'un dossier
- [ ] Formulaire création/édition dossier médical
- [ ] Route `/medical-records` et `/medical-records/:id` dans App.jsx
- [ ] Icône dans SideBar pour Doctor

#### 1.3 Ordonnances
**Backend:**
- [ ] `POST /api/v1/prescription/create` - Créer une ordonnance
- [ ] `GET /api/v1/prescription/patient/:patientId` - Ordonnances d'un patient
- [ ] `GET /api/v1/prescription/:id` - Détails d'une ordonnance
- [ ] `GET /api/v1/prescription/:id/pdf` - Télécharger PDF
- [ ] Génération PDF avec bibliothèque (pdfkit ou puppeteer)
- [ ] Upload PDF sur Cloudinary

**Frontend Dashboard:**
- [ ] Page `Prescriptions.jsx` - Liste des ordonnances
- [ ] Page `CreatePrescription.jsx` - Formulaire création ordonnance
- [ ] Formulaire avec ajout dynamique de médicaments
- [ ] Route `/prescriptions` et `/prescriptions/create` dans App.jsx
- [ ] Icône dans SideBar pour Doctor

---

### 👩‍💼 **2. RÉCEPTIONNISTE (Receptionist)**

#### 2.1 Enregistrement Patients
**Backend:**
- [ ] `POST /api/v1/user/patient/register-by-receptionist` - Créer patient (Receptionist)
- [ ] Validation et assignation automatique au clinicId

**Frontend Dashboard:**
- [ ] Page `RegisterPatient.jsx` - Formulaire d'enregistrement
- [ ] Route `/patients/register` dans App.jsx
- [ ] Icône dans SideBar pour Receptionist

#### 2.2 Facturation
**Backend:**
- [ ] `POST /api/v1/invoice/create` - Créer une facture
- [ ] `GET /api/v1/invoice/patient/:patientId` - Factures d'un patient
- [ ] `GET /api/v1/invoice/:id` - Détails d'une facture
- [ ] `PUT /api/v1/invoice/:id/payment` - Enregistrer un paiement
- [ ] `GET /api/v1/invoice/:id/pdf` - Télécharger PDF facture
- [ ] Génération PDF facture
- [ ] Calcul automatique du total, tax, etc.

**Frontend Dashboard:**
- [ ] Page `Invoices.jsx` - Liste des factures
- [ ] Page `CreateInvoice.jsx` - Formulaire création facture
- [ ] Page `InvoiceDetails.jsx` - Détails et paiements
- [ ] Formulaire avec ajout dynamique d'items
- [ ] Route `/invoices`, `/invoices/create`, `/invoices/:id` dans App.jsx
- [ ] Icône dans SideBar pour Receptionist

---

### 👤 **3. PATIENT (Portail)**

#### 3.1 Réservation/Modification Appointments
**Backend:**
- [ ] `GET /api/v1/appointment/patient/my-appointments` - Mes appointments
- [ ] `PUT /api/v1/appointment/:id` - Modifier un appointment (Patient)
- [ ] `DELETE /api/v1/appointment/:id` - Annuler un appointment (Patient)
- [ ] Validation : Patient ne peut modifier que ses propres appointments

**Frontend Public:**
- [ ] Page `MyAppointments.jsx` - Liste des appointments du patient
- [ ] Bouton modifier appointment
- [ ] Bouton annuler appointment
- [ ] Route `/my-appointments` dans App.jsx
- [ ] Lien dans NavBar pour Patient authentifié

#### 3.2 Paiement
**Backend:**
- [ ] `GET /api/v1/invoice/patient/my-invoices` - Mes factures
- [ ] `POST /api/v1/invoice/:id/pay` - Payer une facture
- [ ] Intégration passerelle de paiement (Stripe, PayPal, ou système local)
- [ ] Webhook pour confirmation de paiement

**Frontend Public:**
- [ ] Page `MyInvoices.jsx` - Liste des factures du patient
- [ ] Page `Payment.jsx` - Formulaire de paiement
- [ ] Intégration interface de paiement
- [ ] Route `/my-invoices` et `/payment/:invoiceId` dans App.jsx
- [ ] Lien dans NavBar pour Patient authentifié

#### 3.3 Téléchargement Ordonnances PDF
**Backend:**
- [ ] `GET /api/v1/prescription/patient/my-prescriptions` - Mes ordonnances
- [ ] `GET /api/v1/prescription/:id/pdf` - Télécharger PDF (vérifier que c'est le patient)

**Frontend Public:**
- [ ] Page `MyPrescriptions.jsx` - Liste des ordonnances du patient
- [ ] Bouton télécharger PDF pour chaque ordonnance
- [ ] Route `/my-prescriptions` dans App.jsx
- [ ] Lien dans NavBar pour Patient authentifié

---

## 📦 Dépendances à Installer

### Backend
```bash
npm install pdfkit  # Pour génération PDF
# ou
npm install puppeteer  # Alternative pour PDF
```

### Frontend
```bash
# Si intégration Stripe
npm install @stripe/stripe-js @stripe/react-stripe-js

# Pour affichage PDF
npm install react-pdf
```

---

## 🔧 Ordre d'Implémentation Recommandé

### Phase 1 : Backend Core (1-2 jours)
1. ✅ Créer les modèles (FAIT)
2. Contrôleurs Schedule
3. Contrôleurs MedicalRecord
4. Contrôleurs Prescription (avec génération PDF)
5. Contrôleurs Invoice

### Phase 2 : Backend Patient (1 jour)
6. Endpoints Patient (my-appointments, my-invoices, my-prescriptions)
7. Validation et sécurité

### Phase 3 : Frontend Doctor (2-3 jours)
8. Interface Schedule
9. Interface MedicalRecords
10. Interface Prescriptions

### Phase 4 : Frontend Receptionist (1-2 jours)
11. Interface RegisterPatient
12. Interface Invoices

### Phase 5 : Frontend Patient (2-3 jours)
13. Interface MyAppointments (avec modification/annulation)
14. Interface MyInvoices (avec paiement)
15. Interface MyPrescriptions (avec téléchargement PDF)

### Phase 6 : Intégration Paiement (1-2 jours)
16. Intégration passerelle de paiement
17. Tests et validation

---

## 📝 Notes Techniques

### Génération PDF
- **Option 1**: `pdfkit` - Simple, léger, bon pour ordonnances/factures
- **Option 2**: `puppeteer` - Plus puissant, peut générer depuis HTML
- **Recommandation**: `pdfkit` pour ce projet

### Paiement
- **Option 1**: Stripe - International, bien documenté
- **Option 2**: PayPal - Populaire
- **Option 3**: Système local - Pour développement/test
- **Recommandation**: Commencer par système local, puis intégrer Stripe

### Sécurité
- Vérifier que chaque utilisateur ne peut accéder qu'à ses propres données
- Validation des permissions à chaque endpoint
- Isolation multi-tenant maintenue

---

## 🎯 Prochaines Étapes Immédiates

1. **Créer les contrôleurs backend** pour Schedule, MedicalRecord, Prescription, Invoice
2. **Créer les routes** dans les routers
3. **Tester les endpoints** avec Postman/Thunder Client
4. **Créer les interfaces frontend** une par une
5. **Intégrer la génération PDF**
6. **Intégrer le système de paiement**

---

**Dernière mise à jour** : Après création des modèles

