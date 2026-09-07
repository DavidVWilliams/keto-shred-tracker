import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';

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
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // App Data State (Meals, Fasting, Workouts)
  const [shredData, setShredData] = useState({
    fastingHours: 16,
    proteinTarget: 180,
    currentWeight: 203,
    mealsLogged: [],
    workoutsCompleted: []
  });

  // Listen for Auth State & Sync with Firestore (with localStorage fallback)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(collection(db, "users"), currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            setShredData(prev => ({ ...prev, ...docSnap.data() }));
          } else {
            const initialData = { 
              email: currentUser.email,
              fastingHours: 16,
              proteinTarget: 180,
              currentWeight: 203,
              mealsLogged: [],
              workoutsCompleted: [],
              initializedAt: new Date().toISOString() 
            };
            await setDoc(userDocRef, initialData);
            setShredData(initialData);
          }
        } catch (err) {
          console.warn("Cloud sync deferred, using local storage cache:", err.message);
          const localCache = localStorage.getItem(`keto_shred_${currentUser.uid}`);
          if (localCache) {
            setShredData(JSON.parse(localCache));
          }
        }
      } else {
        setShredData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Save changes locally and attempt cloud sync
  const updateShredData = async (newData) => {
    setShredData(newData);
    if (user) {
      localStorage.setItem(`keto_shred_${user.uid}`, JSON.stringify(newData));
      try {
        const userDocRef = doc(collection(db, "users"), user.uid);
        await setDoc(userDocRef, newData, { merge: true });
      } catch (err) {
        console.warn("Background cloud sync pending permission review:", err.message);
      }
    }
  };

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
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm animate-pulse">Loading Keto Shred Tracker...</p>
        </div>
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
            <p className="text-sm text-slate-400">Sign in with your Google account to access your high-performance shred dashboard.</p>
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <header className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 mb-8 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Keto Shred Tracker</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-normal">Active</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Connected as: <span className="text-slate-300 font-medium">{user.email}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(activeTab === 'dashboard' ? 'workouts' : 'dashboard')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-medium rounded-lg transition-all border border-slate-800"
          >
            {activeTab === 'dashboard' ? 'View Workouts' : 'Dashboard'}
          </button>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-sm font-medium rounded-lg transition-all border border-slate-800"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-6">
        {activeTab === 'dashboard' ? (
          <>
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fasting Window</p>
                <p className="text-2xl font-bold text-white mt-1">{shredData.fastingHours} Hours</p>
                <p className="text-xs text-emerald-400 mt-1">Intermittent Fasting Active</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Protein Target</p>
                <p className="text-2xl font-bold text-white mt-1">{shredData.proteinTarget}g</p>
                <p className="text-xs text-emerald-400 mt-1">High-Protein Protocol</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Current Weight</p>
                <p className="text-2xl font-bold text-white mt-1">{shredData.currentWeight} lbs</p>
                <p className="text-xs text-slate-400 mt-1">Target Tracking</p>
              </div>
            </div>

            {/* Daily Nutrition & Meal Log Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-3">Daily Nutrition Protocols</h2>
              <p className="text-sm text-slate-400 mb-4">
                Core staples: Whole foods, eggs, canned tuna, vegetables, pistachios, berries, and steak.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateShredData({ ...shredData, mealsLogged: [...shredData.mealsLogged, `Meal @ ${new Date().toLocaleTimeString()}`] })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all"
                >
                  Log Whole Food Meal
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {shredData.mealsLogged.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No meals logged yet today.</p>
                ) : (
                  shredData.mealsLogged.map((meal, idx) => (
                    <div key={idx} className="text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
                      {meal}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-white">Conditioning & Conditioning Protocols</h2>
            <p className="text-sm text-slate-400">
              High-volume bodyweight protocols, burpee protocols, pull-up routines, and mobility tracking.
            </p>
            <button 
              onClick={() => updateShredData({ ...shredData, workoutsCompleted: [...shredData.workoutsCompleted, `Conditioning Session @ ${new Date().toLocaleTimeString()}`] })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all"
            >
              Log Conditioning Session
            </button>
            <div className="space-y-2">
              {shredData.workoutsCompleted.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No workouts logged yet today.</p>
              ) : (
                shredData.workoutsCompleted.map((wo, idx) => (
                  <div key={idx} className="text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
                    {wo}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
