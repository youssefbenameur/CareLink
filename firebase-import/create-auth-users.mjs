import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
const dataFilePath = path.join(__dirname, "..", "carelink_test_data.json");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const resetPassword = args.has("--reset-password");

const TEMP_PASSWORD =
  process.env.CARELINK_TEMP_PASSWORD || "CareLink@2026!";

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Missing serviceAccountKey.json in firebase-import/.");
  console.error(
    "Download it from Firebase Console and save it as firebase-import/serviceAccountKey.json"
  );
  process.exit(1);
}

if (!fs.existsSync(dataFilePath)) {
  console.error("Missing carelink_test_data.json in project root.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
const rawData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

function normalizeEmail(email) {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
}

async function ensureAuthUser({ uid, email, displayName }) {
  if (!uid) throw new Error("Missing uid");
  if (!email) throw new Error(`Missing email for uid=${uid}`);

  if (dryRun) {
    console.log(
      `[dry-run] Would ${resetPassword ? "create/update" : "create"} auth user uid=${uid} email=${email}`
    );
    return { created: false, skipped: false, dryRun: true };
  }

  try {
    await auth.createUser({
      uid,
      email,
      password: TEMP_PASSWORD,
      displayName: displayName || undefined,
      disabled: false,
    });
    console.log(`Created auth user uid=${uid} email=${email}`);
    return { created: true };
  } catch (e) {
    // If user already exists, we normally skip (so it's safe to re-run).
    if (
      e?.code === "auth/uid-already-exists" ||
      e?.code === "auth/email-already-exists"
    ) {
      if (!resetPassword) {
        console.log(`Skipped (already exists) uid=${uid} email=${email}`);
        return { skipped: true };
      }

      // Reset password of existing account (by uid if possible, otherwise by email)
      let existing;
      try {
        existing = await auth.getUser(uid);
      } catch (getByUidErr) {
        existing = await auth.getUserByEmail(email);
      }

      await auth.updateUser(existing.uid, {
        password: TEMP_PASSWORD,
        displayName: existing.displayName || displayName || undefined,
        disabled: false,
      });
      console.log(`Updated password uid=${existing.uid} email=${email}`);
      return { updated: true };
    }
    throw e;
  }
}

async function main() {
  const users = rawData?.users;
  if (!users || typeof users !== "object") {
    console.error("No 'users' collection found in carelink_test_data.json");
    process.exit(1);
  }

  const entries = Object.entries(users);
  let created = 0;
  let skipped = 0;
  let updated = 0;
  let failed = 0;

  console.log(
    `Creating Firebase Auth users for ${entries.length} Firestore users docs...`
  );
  console.log(
    `Temp password: ${TEMP_PASSWORD} ${dryRun ? "(dry-run mode)" : ""}`
  );
  if (resetPassword) {
    console.log("Mode: --reset-password (will set password even if user exists)");
  }

  for (const [docId, user] of entries) {
    const email = normalizeEmail(user?.email);
    const displayName = user?.name;
    const uid = docId; // IMPORTANT: matches Firestore doc id (e.g. patient_1)

    try {
      const res = await ensureAuthUser({ uid, email, displayName });
      if (res?.created) created += 1;
      else if (res?.skipped) skipped += 1;
      else if (res?.updated) updated += 1;
    } catch (e) {
      failed += 1;
      console.error(`Failed uid=${uid} email=${email}:`, e?.message || e);
    }
  }

  console.log(
    `Done. created=${created} updated=${updated} skipped=${skipped} failed=${failed}`
  );
  if (failed > 0) process.exit(2);
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});

