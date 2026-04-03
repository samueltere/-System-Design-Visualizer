import React from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { LogIn, LogOut, Save, Share2, Layout, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  user: User | null;
  onSave: () => void;
  onLoad: () => void;
  isSaving: boolean;
}

export const Navbar = ({ user, onSave, onLoad, isSaving }: NavbarProps) => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request' ||
          error.code === 'auth/network-request-failed') {
        return;
      }
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-50">
      <div className="flex items-center gap-4">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className="p-2.5 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-200"
        >
          <Zap size={24} fill="currentColor" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-slate-800 leading-none mb-0.5">
            System<span className="text-brand-600">Viz</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
            Architectural Engine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={onLoad}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
              >
                <Share2 size={18} className="rotate-180" />
                Restore
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl shadow-slate-200 active:scale-95"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? 'Syncing...' : 'Save Design'}
              </button>
            </div>
            
            <div className="h-10 w-px bg-slate-200 mx-2" />
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-none mb-1">{user.displayName}</div>
                <div className="text-[10px] font-medium text-slate-400 leading-none">Cloud Architect</div>
              </div>
              <div className="relative group">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                  alt={user.displayName || 'User'}
                  className="w-10 h-10 rounded-2xl border-2 border-slate-100 shadow-sm group-hover:border-brand-400 transition-all duration-300"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={handleLogout}
                  className="absolute -top-1 -right-1 p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  title="Logout"
                >
                  <LogOut size={12} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-all shadow-xl shadow-brand-200 active:scale-95"
          >
            <LogIn size={20} />
            Login with Google
          </button>
        )}
      </div>
    </nav>
  );
};
