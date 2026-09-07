import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyCpvNuz5IehbTALpeeEXd77__o-czl0E3M",
  authDomain: "keto-shred-tracker.firebaseapp.com",
  projectId: "keto-shred-tracker",
  storageBucket: "keto-shred-tracker.firebasestorage.app",
  messagingSenderId: "618970231709",
  appId: "1:618970231709:web:a5eaff86fa83167ec03574",
  measurementId: "G-M0YV8JNGCT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState(null);

  // Listen for Auth State Changes & Sync Firestore Profile safely
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Force a small delay or token refresh assurance for Firestore security context
          await currentUser.getIdToken(true);
          
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setAppData(docSnap.data());
          } else {
            const defaultData = { 
              email: currentUser.email,
              displayName: currentUser.displayName || "User",
              initializedAt: new Date().toISOString() 
            };
            await setDoc(docRef, defaultData);
            setAppData(defaultData);
          }
        } catch (err) {
          console.error("Firestore sync error:", err);
        }
      } else {
        setAppData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign-in error:", err);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <p className="text-slate-400 animate-pulse">Loading Keto Shred Tracker...</p>
      </div>
    );
  }

  // Google Sign-In Gate
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Keto Shred Tracker</h1>
            <p className="text-sm text-slate-400">Sign in with your Google account to access your secure cloud database.</p>
          </div>
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  // Main Authenticated Dashboard & Layout Shell
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <header className="max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Keto Shred Tracker</h1>
          <p className="text-xs text-slate-400 mt-0.5">Connected as: <span className="text-slate-300 font-medium">{user.email}</span></p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-all border border-slate-700"
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-5xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-2">Cloud Database Active</h2>
          <p className="text-sm text-slate-400">
            Firestore cloud synchronization is live. Your profile data and shred logs are securely tied to your Google account.
          </p>
        </div>
      </main>
    </div>
  );
}
