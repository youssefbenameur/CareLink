
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  Query,
  CollectionReference,
  DocumentData
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


// Firebase configuration loaded from environment variables.
// Copy .env.example to .env and fill in your project values.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics requires a valid apiKey and measurementId — skip silently if either
// is missing (e.g. during local dev before .env is fully populated).
const analytics =
  typeof window !== 'undefined' &&
  firebaseConfig.apiKey &&
  firebaseConfig.measurementId
    ? getAnalytics(app)
    : null;

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, analytics };

// Helper function to safely create composite queries
export const createSafeQuery = (collectionPath: string, conditions: Array<any> = [], limitCount: number | null = null): Query<DocumentData> => {
  try {
    const collectionRef = collection(db, collectionPath);

    // If no conditions, just return the collection reference
    if (conditions.length === 0 && !limitCount) {
      return collectionRef;
    }

    // Apply conditions (where clauses)
    let queryConstraints = [];

    conditions.forEach(condition => {
      if (condition.field && condition.operation && condition.value !== undefined) {
        queryConstraints.push(where(condition.field, condition.operation, condition.value));
      }
    });

    // Add ordering if specified
    const orderByField = conditions.find(c => c.orderBy)?.orderBy;
    const orderDirection = conditions.find(c => c.orderBy)?.direction || 'desc';

    if (orderByField) {
      queryConstraints.push(orderBy(orderByField, orderDirection));
    }

    // Add limit if specified
    if (limitCount) {
      queryConstraints.push(limit(limitCount));
    }

    return query(collectionRef, ...queryConstraints);
  } catch (error) {
    console.error("Error creating query:", error);
    // Return a basic collection reference without constraints if there's an error
    return collection(db, collectionPath);
  }
};

// Compress and convert image to base64 (max ~300KB output)
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const MAX = 1000;
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = url;
  });

// Upload doctor credential documents to Firebase Storage
// Upload doctor credential documents - stores as compressed base64 images
export const uploadDoctorDocuments = async (
  userId: string,
  documents: { doctorLicense?: File; diploma?: File; certification?: File }
): Promise<{ doctorLicense?: string; diploma?: string; certification?: string }> => {
  const result: { doctorLicense?: string; diploma?: string; certification?: string } = {};

  for (const [key, file] of Object.entries(documents)) {
    if (!file) continue;

    try {
      console.log(`Converting ${key} to base64:`, file.name);
      const base64 = await fileToBase64(file);
      (result as Record<string, string>)[key] = base64;
      console.log(`✓ ${key} converted successfully`);
    } catch (error: any) {
      console.error(`Error converting ${key}:`, error);
      throw new Error(`Failed to process ${key}. ${error.message}`);
    }
  }

  if (Object.keys(result).length === 0) {
    throw new Error("No documents were processed successfully.");
  }

  console.log("All documents processed successfully");
  return result;
};

// Auth helper functions
export const registerUser = async (email: string, password: string, userData: any) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRole = userData.role || 'patient';
    console.log(`Registering user with role: ${userRole}`);

    const doctorVerificationStatus = userRole === 'doctor' ? 'pending' : undefined;

    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      role: userRole,
      status: 'active',
      ...(doctorVerificationStatus ? { doctorVerificationStatus } : {}),
      createdAt: Timestamp.now(),
      email
    });

    return user;
  } catch (error) {
    console.error("Error in registerUser:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    // Handle specific error codes with user-friendly messages
    if (error.code === 'auth/invalid-login-credentials' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password') {
      throw new Error("Invalid email or password. Please try again.");
    }
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    // Also clear admin access if it exists
    localStorage.removeItem('adminAccess');
  } catch (error) {
    throw error;
  }
};

export const getUserData = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error("User data not found");
    }
  } catch (error) {
    throw error;
  }
};

export const updateUserSettings = async (userId: string, settings: any) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, settings);
    return true;
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("No user is currently logged in");
    }

    // Re-authenticate the user with their current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update to the new password
    await updatePassword(user, newPassword);
    return true;
  } catch (error: any) {
    console.error("Error changing password:", error);
    if (error.code === "auth/wrong-password" || error.message.includes("password is invalid")) {
      throw new Error("Current password is incorrect");
    }
    if (error.code === "auth/weak-password") {
      throw new Error("New password is too weak. Use at least 6 characters");
    }
    throw error;
  }
};

export const deleteUserAccount = async (password: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("No user is currently logged in");
    }

    // Re-authenticate the user with their password
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Delete user data from Firestore first
    try {
      await updateDoc(doc(db, "users", user.uid), {
        deletedAt: new Date(),
        status: 'deleted'
      });
    } catch (error) {
      console.error("Error marking user as deleted in Firestore:", error);
    }

    // Delete the user account
    await user.delete();
    
    return true;
  } catch (error: any) {
    console.error("Error deleting account:", error);
    if (error.code === "auth/wrong-password" || error.message.includes("password is invalid")) {
      throw new Error("Password is incorrect. Account not deleted.");
    }
    throw error;
  }
};

export const getAllDoctors = async (verificationStatus?: string) => {
  try {
    let q;
    if (verificationStatus) {
      q = query(collection(db, 'users'),
        where("role", "==", "doctor"),
        where("doctorVerificationStatus", "==", verificationStatus)
      );
    } else {
      q = query(collection(db, 'users'), where("role", "==", "doctor"));
    }
    const querySnapshot = await getDocs(q);

    const doctors: any[] = [];
    querySnapshot.forEach((doc) => {
      doctors.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return doctors;
  } catch (error) {
    console.error("Error getting all doctors:", error);
    throw error;
  }
};

export const sendApprovalEmail = async (
  doctorEmail: string,
  doctorName: string,
  status: 'approved' | 'rejected'
): Promise<void> => {
  const loginUrl = `${window.location.origin}/login`;
  const subject = status === 'approved'
    ? 'Your CareLink application has been approved'
    : 'Update on your CareLink application';

  const html = status === 'approved'
    ? `<p>Hi ${doctorName},</p>
       <p>Congratulations! Your doctor account on <strong>CareLink</strong> has been <strong>approved</strong>.</p>
       <p>You can now <a href="${loginUrl}">log in</a> and start providing care.</p>
       <p>Welcome to the CareLink team!</p>`
    : `<p>Hi ${doctorName},</p>
       <p>Thank you for applying to CareLink. Unfortunately, your application was <strong>not approved</strong> at this time.</p>
       <p>If you have questions or would like to follow up, please contact us at
       <a href="mailto:support@carelink.com">support@carelink.com</a>.</p>`;

  await addDoc(collection(db, 'mail'), {
    to: doctorEmail,
    message: { subject, html },
  });
};
