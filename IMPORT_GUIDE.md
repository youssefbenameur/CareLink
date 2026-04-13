# CareLink Tunisia Test Data Import Guide

## Tunisian Healthcare Context

This test data is specifically designed for the Tunisian healthcare system with:

### Doctor Specialties (20 Different Specializations):

1. **Cardiology**
   - Focus: Heart disease, hypertension, and cardiovascular care
   - Languages: Arabic, French, English

2. **Pediatrics**
   - Focus: Child health, vaccinations, and growth monitoring
   - Languages: Arabic, French

3. **Family Medicine**
   - Focus: Primary care, chronic disease management, and preventive medicine
   - Languages: Arabic, French, English

4. **Dermatology**
   - Focus: Skin disorders, acne, eczema, and cosmetic dermatology
   - Languages: Arabic, French, English, Italian

5. **Endocrinology**
   - Focus: Diabetes, thyroid disease, and metabolic health
   - Languages: Arabic, French, English

6. **Orthopedics**
   - Focus: Joint pain, sports injuries, and musculoskeletal care
   - Languages: Arabic, French, English

7. **Neurology**
   - Focus: Headaches, epilepsy, and nerve disorders
   - Languages: Arabic, French, English, Spanish

8. **Ophthalmology**
   - Focus: Eye exams, cataracts, and glaucoma management
   - Languages: Arabic, French

9. **Otolaryngology (ENT)**
   - Focus: Sinus, hearing, and throat conditions
   - Languages: Arabic, French, English

10. **Obstetrics & Gynecology**
    - Focus: Women's health, prenatal care, and reproductive services
    - Languages: Arabic, French, English, German

11. **Gastroenterology**
    - Focus: Digestive health, liver function, and endoscopy
    - Languages: Arabic, French, English

12. **Nephrology**
    - Focus: Kidney disease, dialysis, and blood pressure control
    - Languages: Arabic, French

13. **Pulmonology**
    - Focus: Asthma, COPD, and respiratory care
    - Languages: Arabic, French, English

14. **Rheumatology**
    - Focus: Arthritis, autoimmune disorders, and joint inflammation
    - Languages: Arabic, French, English

15. **Psychiatry**
    - Focus: Mental health diagnosis, medication management, and therapy coordination
    - Languages: Arabic, French, English

16. **Oncology**
    - Focus: Cancer diagnosis, chemotherapy, and survivorship support
    - Languages: Arabic, French

17. **Urology**
    - Focus: Urinary health, kidney stones, and reproductive system care
    - Languages: Arabic, French, English

18. **Radiology**
    - Focus: Diagnostic imaging, X-ray, MRI, and ultrasound interpretation
    - Languages: Arabic, French

19. **Physical Medicine & Rehabilitation**
    - Focus: Recovery after injury, mobility, and pain management
    - Languages: Arabic, French, English

20. **Infectious Diseases**
    - Focus: Infectious illness management, vaccines, and epidemiology
    - Languages: Arabic, French, English

### Patient Profiles (10 Different Mood Patterns):

- **Anxious**: High anxiety levels, panic symptoms
- **Depressive**: Low mood, lack of motivation
- **Improving**: Gradual recovery from depression
- **Stable**: Consistent good mental health
- **Stressful**: Work-related anxiety patterns
- **Seasonal**: Weather-affected mood changes
- **Relationship**: Interpersonal conflict effects
- **Recovery**: Post-trauma healing process
- **Anxious-Depression**: Mixed anxiety and depression
- **Bipolar-like**: Mood cycling patterns

## Tunisian Data Features:

- **Arabic Names**: Authentic Tunisian names (Fatma, Ahmed, Leila, etc.)
- **Tunisian Phone Numbers**: +216 country code with local formats
- **Tunisian Cities**: Tunis, Sfax, Sousse, Bizerte, Gabès, Kairouan, Monastir, Nabeul, Hammamet, Djerba
- **Arabic Text**: Sample chat messages in Arabic
- **Tunisian Universities**: University of Tunis, Faculty of Medicine of Tunis, etc.
- **Local Pricing**: Consultation fees in Tunisian Dinars (70-120 TND)
- **Multilingual**: Arabic, French, English support

## How to Import Data into Firebase Firestore

### Method 1: Firebase Admin SDK (Recommended for Large Datasets)

Use the standalone import helper in `firebase-import/` to avoid changing your app dependencies.

1. Open a terminal in the project root and install the import helper dependencies:

```bash
cd firebase-import
npm install
```

2. Download your Firebase service account JSON key from Firebase Console and save it as:

```bash
firebase-import/serviceAccountKey.json
```

3. Run the importer:

```bash
npm run import
```

4. If you need to re-run later, use:

```bash
cd firebase-import
npm run import
```

---

If you prefer to use a simple script in the app root instead, this is the alternative:

1. **Install Firebase Admin SDK** (if not already installed):

```bash
npm install firebase-admin
```

2. **Create a Node.js script** to import the data:

```javascript
const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./path/to/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sereneminds-db66f.firebaseio.com",
});

const db = admin.firestore();

// Import function
async function importData() {
  const data = require("./carelink_test_data.json");

  for (const [collection, documents] of Object.entries(data)) {
    console.log(
      `Importing ${Object.keys(documents).length} documents to ${collection}...`,
    );

    for (const [docId, docData] of Object.entries(documents)) {
      await db.collection(collection).doc(docId).set(docData);
    }
  }

  console.log("Data import completed!");
}

importData().catch(console.error);
```

3. **Run the script**:

```bash
node import-data.js
```

### Method 2: Firebase CLI

1. **Install Firebase CLI**:

```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:

```bash
firebase login
```

3. **Import the data**:

```bash
firebase firestore:import carelink_test_data.json --project sereneminds-db66f
```

### Method 3: Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (sereneminds-db66f)
3. Go to Firestore Database
4. Manually add documents from the JSON file

## Data Structure

The JSON file contains the following collections:

- `users`: Patient and doctor profiles with Tunisian data
- `moodEntries`: Mood tracking data (sample only - full dataset would be 900 entries)
- `appointments`: Scheduled appointments
- `medicalRecords`: Medical history and notes
- `patientNotes`: Doctor notes on patients
- `messages`: Chat messages (including Arabic text)

## Sample Data Included

- **10 Patients** with authentic Tunisian names and addresses
- **20 Doctors** with diverse Tunisian medical specialties
- **Sample mood entries** showing different mood patterns
- **Appointments** between patients and doctors
- **Medical records** with treatment history
- **Chat conversations** in Arabic and French

## Generating Full Dataset

To generate the complete 3-month mood history for all patients, you would need to create 900 mood entries programmatically. Each patient has a unique mood pattern that affects their data.

The patterns include:

- Anxious, Depressive, Improving, Stable, Stressful
- Seasonal, Relationship, Recovery, Anxious-Depression, Bipolar-like

Each pattern generates realistic mood fluctuations over 90 days with Tunisian cultural context.
