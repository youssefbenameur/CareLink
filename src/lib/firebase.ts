
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User, 
  sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
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
import { getStorage } from "firebase/storage";


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYxiXMhW7ZDo7MGpjxkGubjUT4EUEvEf8",
  authDomain: "sereneminds-db66f.firebaseapp.com",
  projectId: "sereneminds-db66f",
  storageBucket: "sereneminds-db66f.firebasestorage.app",
  messagingSenderId: "1094579647659",
  appId: "1:1094579647659:web:3f5708e08a20f9a789b3ee",
  measurementId: "G-08L9SRYGHN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
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

// Auth helper functions
export const registerUser = async (email: string, password: string, userData: any) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Make sure we preserve the role from userData
    const userRole = userData.role || 'patient';
    console.log(`Registering user with role: ${userRole}`); // Debugging
    
    // Save additional user data to Firestore
    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      role: userRole, // Ensure role is explicitly set
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

export const getAllDoctors = async () => {
  try {
    const q = query(collection(db, 'users'), where("role", "==", "doctor"));
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
