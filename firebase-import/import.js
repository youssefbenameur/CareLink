import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const dataFilePath = path.join(__dirname, '..', 'carelink_test_data.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Missing serviceAccountKey.json in firebase-import/.');
  console.error('Download it from Firebase Console and save it as firebase-import/serviceAccountKey.json');
  process.exit(1);
}

if (!fs.existsSync(dataFilePath)) {
  console.error('Missing carelink_test_data.json in project root.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const rawData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function convertTimestamps(value) {
  if (Array.isArray(value)) {
    return value.map(convertTimestamps);
  }
  if (value && typeof value === 'object') {
    if ('_seconds' in value && '_nanoseconds' in value) {
      return admin.firestore.Timestamp.fromMillis(
        value._seconds * 1000 + Math.floor(value._nanoseconds / 1e6)
      );
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, convertTimestamps(item)])
    );
  }
  return value;
}

async function importData() {
  for (const [collectionName, collectionDocs] of Object.entries(rawData)) {
    for (const [docId, docData] of Object.entries(collectionDocs)) {
      const convertedDoc = convertTimestamps(docData);
      await db.collection(collectionName).doc(docId).set(convertedDoc);
      console.log(`Imported ${collectionName}/${docId}`);
    }
  }
  console.log('Import finished successfully.');
}

importData().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
