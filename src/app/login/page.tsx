"use client";

import { useState } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function MemberLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/shop");
    } catch (err: any) {
      setError("Google Login fehlgeschlagen: " + err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/shop");
    } catch (err: any) {
      setError("Fehler: " + err.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 font-sans p-4 sm:p-6">
      <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {isRegister ? "Mitglieds-Konto erstellen" : "Mitglieder-Login"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Vereins-Sammelbestellung
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 text-sm rounded-2xl">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full min-h-[48px] flex items-center justify-center gap-3 bg-white active:bg-gray-50 text-gray-800 font-medium py-3 px-4 border border-gray-200 rounded-2xl shadow-sm transition-all active:scale-[0.98] text-base"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Mit Google fortfahren
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <span className="relative bg-white px-3 text-xs text-gray-400 font-medium">oder per E-Mail</span>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">E-Mail Adresse</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[48px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-base text-gray-900"
              placeholder="name@beispiel.de"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[48px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-base text-gray-900"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-2xl shadow-md transition-all active:scale-[0.98] text-base mt-2"
          >
            {isRegister ? "Konto erstellen" : "Anmelden"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 active:opacity-75 transition-opacity"
          >
            {isRegister ? "Bereits ein Konto? Hier anmelden" : "Noch kein Konto? Jetzt registrieren"}
          </button>
        </div>
      </div>
    </main>
  );
}
