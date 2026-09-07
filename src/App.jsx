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

const DEFAULT_SHRED_DATA = {
  fastingHours: 16,
  proteinTarget: 180,
  currentWeight: 203,
  fastingActive: true,
  fastStartTime: new Date().toISOString(),
  mealsLogged: [],
  workoutsCompleted: []
};

const WHOLE_FOOD_STAPLES = [
  "Whole Eggs & Veggies",
  "Canned Tuna & Olive Oil",
  "Grass-fed Steak",
  "Pistachios & Berries"
];

const CONDITIONING_PROTOCOLS = [
  "Busy Dad Burpee Protocol",
  "Armstrong Pull-Up Routine",
  "Grease-the-Groove Push-Ups",
  "Leo Moves Mobility & Flow"
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [shredData, setShredData] = useState(DEFAULT_SHRED_DATA);

  // Listen for Auth State & Sync with Firestore & LocalStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(collection(db, "users"), currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            setShredData(prev => ({ ...DEFAULT_SHRED_DATA, ...docSnap.data() }));
          } else {
            const initialData = { 
              email: currentUser.email,
              ...DEFAULT_SHRED_DATA,
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
          } else {
            setShredData({
              email: currentUser.email,
              ...DEFAULT_SHRED_DATA,
              initializedAt: new Date().toISOString()
            });
          }
        }
      } else {
        setShredData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-neutral-400 text-sm animate-pulse">Loading Keto Shred Tracker...</p>
        </div>
      </div>
    );
  }

  // Google Sign-In Gate
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Keto Shred Tracker</h1>
            <p className="text-sm text-neutral-400">Sign in with Google to access your secure high-protein & fasting protocol.</p>
          </div>
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  const currentData = shredData || DEFAULT_SHRED_DATA;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-neutral-800 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Keto Shred Tracker</span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium">Synced</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">Connected as <span className="text-neutral-200">{user.email}</span></p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {['dashboard', 'nutrition', 'fasting', 'workouts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={handleSignOut}
            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-medium rounded-lg transition-all border border-neutral-800 ml-auto sm:ml-2"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto space-y-6">
        {activeTab === 'dashboard' && (
          <>
            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Fasting Protocol</p>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-2xl font-bold text-white">{currentData.fastingHours}h Window</p>
                  <span className="text-xs text-emerald-400 font-medium">Active</span>
                </div>
                <p className="text-xs text-neutral-400 mt-2">Intermittent fasting schedule locked</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Protein Target</p>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-2xl font-bold text-white">{currentData.proteinTarget}g</p>
                  <span className="text-xs text-emerald-400 font-medium">Whole Foods</span>
                </div>
                <p className="text-xs text-neutral-400 mt-2">Zero powders or processed shakes</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Current Weight</p>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-2xl font-bold text-white">{currentData.currentWeight} lbs</p>
                  <button 
                    onClick={() => {
                      const newWt = prompt("Update current weight (lbs):", currentData.currentWeight);
                      if (newWt) updateShredData({ ...currentData, currentWeight: Number(newWt) });
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-xs text-neutral-400 mt-2">Shred target progression</p>
              </div>
            </div>

            {/* Quick Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Today's Meals</h2>
                  <span className="text-xs text-neutral-400">{currentData.mealsLogged.length} Logged</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {currentData.mealsLogged.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic py-4 text-center">No meals logged yet today.</p>
                  ) : (
                    currentData.mealsLogged.map((m, idx) => (
                      <div key={idx} className="text-xs bg-black p-3 rounded-lg border border-neutral-800 text-neutral-300 flex items-center justify-between">
                        <span>{m}</span>
                        <span className="text-emerald-400 font-medium">Logged</span>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('nutrition')}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-all border border-neutral-700"
                >
                  Manage Nutrition Log
                </button>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Conditioning Sessions</h2>
                  <span className="text-xs text-neutral-400">{currentData.workoutsCompleted.length} Completed</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {currentData.workoutsCompleted.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic py-4 text-center">No workouts completed yet today.</p>
                  ) : (
                    currentData.workoutsCompleted.map((w, idx) => (
                      <div key={idx} className="text-xs bg-black p-3 rounded-lg border border-neutral-800 text-neutral-300 flex items-center justify-between">
                        <span>{w}</span>
                        <span className="text-emerald-400 font-medium">Done</span>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('workouts')}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-all border border-neutral-700"
                >
                  View Workouts & Conditioning
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'nutrition' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Whole Food Nutrition Protocols</h2>
              <p className="text-xs text-neutral-400 mt-1">High-protein structure relying exclusively on whole food sources. Protein powders, tempeh, and smoothies excluded.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WHOLE_FOOD_STAPLES.map((staple, idx) => (
                <div key={idx} className="bg-black border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm text-neutral-200 font-medium">{staple}</span>
                  <button
                    onClick={() => {
                      const entry = `${staple} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
                      updateShredData({ ...currentData, mealsLogged: [...currentData.mealsLogged, entry] });
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-all shadow"
                  >
                    Log Meal
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Today's Logged Meals</h3>
              <div className="space-y-2">
                {currentData.mealsLogged.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">No meals recorded yet.</p>
                ) : (
                  currentData.mealsLogged.map((m, idx) => (
                    <div key={idx} className="text-xs bg-black p-3 rounded-lg border border-neutral-800 text-neutral-300 flex items-center justify-between">
                      <span>{m}</span>
                      <button 
                        onClick={() => {
                          const updated = currentData.mealsLogged.filter((_, i) => i !== idx);
                          updateShredData({ ...currentData, mealsLogged: updated });
                        }}
                        className="text-neutral-500 hover:text-red-400 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fasting' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Intermittent Fasting Schedule</h2>
              <p className="text-xs text-neutral-400 mt-1">Track your daily fasting window and metabolic fat-burning blocks.</p>
            </div>

            <div className="bg-black border border-neutral-800 rounded-xl p-6 text-center space-y-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wider">Target Fasting Window</p>
              <p className="text-4xl font-bold text-white">{currentData.fastingHours} Hours</p>
              <div className="flex justify-center gap-3 pt-2">
                {[16, 18, 20].map((hrs) => (
                  <button
                    key={hrs}
                    onClick={() => updateShredData({ ...currentData, fastingHours: hrs })}
                    className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                      currentData.fastingHours === hrs
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    {hrs}:{(24 - hrs)} Protocol
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Conditioning & Mobility Protocols</h2>
              <p className="text-xs text-neutral-400 mt-1">High-volume pull-ups, push-ups, burpee conditioning, jogging, and mobility training.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONDITIONING_PROTOCOLS.map((protocol, idx) => (
                <div key={idx} className="bg-black border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm text-neutral-200 font-medium">{protocol}</span>
                  <button
                    onClick={() => {
                      const entry = `${protocol} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
                      updateShredData({ ...currentData, workoutsCompleted: [...currentData.workoutsCompleted, entry] });
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-all shadow"
                  >
                    Complete
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Completed Sessions Today</h3>
              <div className="space-y-2">
                {currentData.workoutsCompleted.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">No conditioning sessions logged yet today.</p>
                ) : (
                  currentData.workoutsCompleted.map((w, idx) => (
                    <div key={idx} className="text-xs bg-black p-3 rounded-lg border border-neutral-800 text-neutral-300 flex items-center justify-between">
                      <span>{w}</span>
                      <button 
                        onClick={() => {
                          const updated = currentData.workoutsCompleted.filter((_, i) => i !== idx);
                          updateShredData({ ...currentData, workoutsCompleted: updated });
                        }}
                        className="text-neutral-500 hover:text-red-400 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
