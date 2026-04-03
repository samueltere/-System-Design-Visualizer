import React, { useEffect, useState } from 'react';
import { auth, db, googleProvider } from './firebase';
import { onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import DiagramEditor from './components/DiagramEditor';
import { ReactFlowProvider } from 'reactflow';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, LogIn } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [diagramData, setDiagramData] = useState<any>({ nodes: [], edges: [] });

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request' ||
          error.code === 'auth/network-request-failed') {
        // Silent handle for user cancellation or network issues
        return;
      }
      console.error('Login failed:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Create user profile in Firestore if it doesn't exist
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp(),
          });
        }

        // Load default diagram
        const diagramRef = doc(db, 'diagrams', 'default-diagram');
        const diagramSnap = await getDoc(diagramRef);
        if (diagramSnap.exists()) {
          setDiagramData(diagramSnap.data());
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const payload = {
        id: diagramData.id || 'default-diagram',
        name: 'My System Design',
        nodes: diagramData.nodes,
        edges: diagramData.edges,
        ownerId: user.uid,
      };

      // Try saving to PostgreSQL via our API
      const response = await fetch('/api/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save to PostgreSQL');
      }

      const savedData = await response.json();
      setDiagramData((prev: any) => ({ ...prev, id: savedData.id }));
      
      // Also sync to Firestore for redundancy/backup
      const diagramRef = doc(db, 'diagrams', 'default-diagram');
      await setDoc(diagramRef, {
        ...payload,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      console.log('Diagram saved successfully to both SQL and Firestore!');
    } catch (error) {
      console.error('Save failed:', error);
      // Fallback to Firestore only if SQL fails
      try {
        const diagramRef = doc(db, 'diagrams', 'default-diagram');
        await setDoc(diagramRef, {
          ...diagramData,
          ownerId: user.uid,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        console.log('Saved to Firestore (SQL fallback)');
      } catch (fsError) {
        console.error('Firestore fallback also failed:', fsError);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (id: string) => {
    try {
      const response = await fetch(`/api/design/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDiagramData(data);
      } else {
        // Fallback to Firestore
        const diagramRef = doc(db, 'diagrams', id);
        const diagramSnap = await getDoc(diagramRef);
        if (diagramSnap.exists()) {
          setDiagramData(diagramSnap.data());
        }
      }
    } catch (error) {
      console.error('Load failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full shadow-xl shadow-brand-100"
          />
          <div className="text-center">
            <p className="text-slate-800 font-display font-bold text-xl mb-1">Initializing Engine</p>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Preparing Workspace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Navbar 
        user={user} 
        onSave={handleSave} 
        onLoad={() => handleLoad('default-diagram')}
        isSaving={isSaving} 
      />
      
      <main className="flex-grow flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-grow relative bg-slate-100/30">
          <AnimatePresence mode="wait">
            {!user ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/80 backdrop-blur-md"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="max-w-xl p-12 glass-panel rounded-[2rem] text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 via-brand-600 to-indigo-600" />
                  
                  <div className="mb-8 inline-flex p-4 rounded-3xl bg-brand-50 text-brand-600 shadow-inner">
                    <Zap size={40} fill="currentColor" />
                  </div>
                  
                  <h2 className="text-4xl font-display font-black text-slate-900 mb-4 tracking-tight">
                    Architect Your <span className="text-brand-600">Vision</span>
                  </h2>
                  <p className="text-slate-500 mb-10 text-lg leading-relaxed font-medium">
                    The next-generation system design visualizer. Create, simulate, and optimize your cloud architecture with real-time performance metrics.
                  </p>
                  
                  <div className="space-y-4">
                    <button
                      onClick={handleLogin}
                      className="w-full py-4 px-8 bg-brand-600 text-white rounded-2xl font-bold text-lg hover:bg-brand-700 transition-all shadow-2xl shadow-brand-200 active:scale-95 flex items-center justify-center gap-3"
                    >
                      <LogIn size={20} />
                      Start Designing Now
                    </button>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                      Secure Google Authentication
                    </p>
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xl font-black text-slate-800">∞</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-800">100%</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reactive</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-800">SQL</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Persistence</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <ReactFlowProvider>
            <DiagramEditor 
              initialNodes={diagramData.nodes} 
              initialEdges={diagramData.edges}
              onNodesChange={(nodes) => setDiagramData((prev: any) => ({ ...prev, nodes }))}
              onEdgesChange={(edges) => setDiagramData((prev: any) => ({ ...prev, edges }))}
            />
          </ReactFlowProvider>
        </div>
      </main>

      <footer className="h-10 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-4">
          <span>© 2026 System Design Visualizer</span>
          <div className="h-3 w-px bg-slate-200" />
          <span className="text-brand-600">v2.4.0-stable</span>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Socket.io Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span>PostgreSQL Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
