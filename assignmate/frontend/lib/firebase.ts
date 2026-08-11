import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let auth: any = null;
let googleProvider: any = null;
let analytics: any = null;

const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "your_firebase_api_key" && 
  firebaseConfig.apiKey.trim() !== "";

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    // Initialize Analytics only in browser environment
    if (typeof window !== "undefined") {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error);
  }
} else {
  if (typeof window !== "undefined") {
    console.warn(
      "Firebase is not configured or using placeholder credentials. Google Authentication popup will be disabled until credentials are set in .env.local"
    );
  }
}

export { auth, googleProvider, analytics };
export default app;
