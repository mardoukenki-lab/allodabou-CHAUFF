import React, { useState } from 'react';
import { 
  Car, 
  Bike, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  Phone, 
  Mail, 
  Lock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth, RegisterParams } from '../context/AuthContext';
import { VehicleType } from '../types';

export const AuthModal: React.FC = () => {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('voiture');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMessage('Email ou mot de passe incorrect.');
      } else {
        setErrorMessage(err.message || 'Erreur lors de la connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const params: RegisterParams = {
        email,
        password,
        displayName,
        phone,
        vehicleType,
        vehicleNumber,
        photoUrl: photoUrl.trim() || undefined
      };
      await register(params);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('Cette adresse email est déjà utilisée par un autre compte.');
      } else {
        setErrorMessage(err.message || "Erreur lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMessage('Un lien de réinitialisation vous a été envoyé par email.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d\'envoyer le lien de réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900/90 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl p-6 space-y-5 border border-neutral-200 dark:border-neutral-700">
        {/* Brand header */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-[#0D631B] text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Car className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-[#0D631B] dark:text-emerald-400">
            Allô Dabou Chauffeur
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            Portail officiel des chauffeurs et coursiers de Dabou
          </p>
        </div>

        {/* Tab switch */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-2xl">
            <button
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className={`py-2.5 text-xs font-black rounded-xl transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-neutral-800 text-[#0D631B] dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-500'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMessage(null); }}
              className={`py-2.5 text-xs font-black rounded-xl transition ${
                mode === 'register'
                  ? 'bg-white dark:bg-neutral-800 text-[#0D631B] dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-500'
              }`}
            >
              Nouveau Chauffeur
            </button>
          </div>
        )}

        {/* Feedback messages */}
        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-700 dark:text-rose-200 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Mode: Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Adresse Email</label>
              <div className="relative mt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chauffeur@allodabou.ci"
                  required
                  className="w-full p-3 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white pl-9"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-neutral-500 uppercase">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMessage(null); setSuccessMessage(null); }}
                  className="text-[11px] font-bold text-[#0D631B] dark:text-emerald-400 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative mt-1">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full p-3 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white pl-9"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] py-3.5 bg-[#0D631B] hover:bg-[#0a4d15] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Nom complet</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Koffi Emmanuel"
                required
                className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase">Téléphone (CI)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0708091011"
                  required
                  className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase">Immatriculation</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Ex: 5678-KL-01"
                  required
                  className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Type de véhicule</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setVehicleType('voiture')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    vehicleType === 'voiture'
                      ? 'border-[#0D631B] bg-emerald-50 dark:bg-emerald-950 text-[#0D631B] dark:text-emerald-300 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Voiture (VTC / Taxi)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleType('moto')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    vehicleType === 'moto'
                      ? 'border-[#0D631B] bg-emerald-50 dark:bg-emerald-950 text-[#0D631B] dark:text-emerald-300 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>Moto (Colis / Express)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Adresse Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="koffi@gmail.com"
                required
                className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                required
                className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] py-3.5 bg-[#0D631B] hover:bg-[#0a4d15] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Soumettre mon dossier</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode: Forgot Password */}
        {mode === 'forgot' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="text-left space-y-1">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Réinitialisation du mot de passe
              </h3>
              <p className="text-xs text-neutral-500">
                Saisissez votre email pour recevoir les instructions de réinitialisation.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Adresse Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chauffeur@allodabou.ci"
                required
                className="w-full mt-1 p-3 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-3 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#0D631B] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
