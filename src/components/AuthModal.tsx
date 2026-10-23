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
  Eye, 
  EyeOff,
  Sparkles,
  ArrowRight,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth, RegisterParams } from '../context/AuthContext';
import { VehicleType } from '../types';
import { normalizeIvorianPhone, isValidIvorianPhone, formatIvorianPhone } from '../services/phoneUtils';
import { DISPATCH_PHONE, DISPATCH_PHONE_DISPLAY, getDispatchWhatsAppUrl } from '../constants/dispatch';

export const AuthModal: React.FC = () => {
  const { login, loginWithGoogle, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Independent Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Independent Register form state
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVehicleType, setRegVehicleType] = useState<VehicleType>('voiture');
  const [regVehicleNumber, setRegVehicleNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regHasLicense, setRegHasLicense] = useState(true);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to translate Firebase and system errors to user-friendly French
  const getFriendlyErrorMessage = (err: any): string => {
    if (!err) return "Une erreur s'est produite.";
    const code = err.code || '';
    const msg = err.message || '';

    if (
      code === 'auth/invalid-credential' || 
      code === 'auth/user-not-found' || 
      code === 'auth/wrong-password' ||
      msg.includes('invalid-credential') ||
      msg.includes('user-not-found')
    ) {
      return "Numéro de téléphone ou mot de passe incorrect. Vérifiez votre saisie.";
    }

    if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use') || msg.includes('déjà un compte')) {
      return "Ce numéro ou email est déjà enregistré comme chauffeur. Connectez-vous avec votre mot de passe.";
    }

    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      return "Format d'identifiant ou d'email non reconnu. Vérifiez votre numéro de téléphone.";
    }

    if (code === 'auth/weak-password' || msg.includes('weak-password')) {
      return "Le mot de passe doit comporter au moins 8 caractères.";
    }

    if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
      return "Trop de tentatives infructueuses. Veuillez patienter 1 minute avant de réessayer.";
    }

    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      return "L'authentification par mot de passe n'est pas encore activée sur ce projet. Utilisez le bouton « Continuer avec Google » ou activez Email/Mot de passe dans la console Firebase.";
    }

    if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
      return "Problème de connexion internet. Vérifiez votre connexion à Dabou.";
    }

    return msg || "Une erreur est survenue lors de l'opération.";
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = loginIdentifier.trim();
    if (!trimmed) {
      setErrorMessage("Veuillez saisir votre numéro de téléphone ou votre adresse email.");
      return;
    }

    if (!loginPassword) {
      setErrorMessage("Veuillez saisir votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      await login(trimmed, loginPassword);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validation Nom
    if (!regDisplayName.trim() || regDisplayName.trim().length < 2) {
      setErrorMessage("Veuillez renseigner votre nom complet (Prénom et Nom).");
      return;
    }

    // 2. Validation Téléphone
    const cleanPhone = normalizeIvorianPhone(regPhone);
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage("Veuillez saisir un numéro de téléphone valide à 10 chiffres (ex: 07 08 09 10 11).");
      return;
    }

    // 3. Validation Email (facultatif)
    const trimmedEmail = regEmail.trim();
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setErrorMessage("L'adresse email n'a pas un format valide. Laissez ce champ vide si vous n'avez pas d'email.");
        return;
      }
    }

    // 4. Validation Permis de conduire (Obligatoire pour un chauffeur)
    if (!regHasLicense) {
      setErrorMessage("Vous devez détenir un permis de conduire valide (A ou B) pour vous inscrire comme chauffeur Allô Dabou.");
      return;
    }

    // 5. Validation Mot de passe (8 caractères min)
    if (regPassword.length < 8) {
      setErrorMessage("Le mot de passe doit comporter au moins 8 caractères pour sécuriser votre compte.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas. Veuillez les retaper.");
      return;
    }

    setLoading(true);
    try {
      const params: RegisterParams = {
        email: trimmedEmail || undefined,
        password: regPassword,
        displayName: regDisplayName.trim(),
        phone: cleanPhone,
        vehicleType: regVehicleType,
        vehicleNumber: regVehicleNumber.trim() ? regVehicleNumber.trim().toUpperCase() : undefined,
        hasLicense: regHasLicense,
      };
      await register(params);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = forgotEmail.trim();
    if (!trimmed) {
      setErrorMessage("Veuillez saisir votre adresse email.");
      return;
    }

    if (!trimmed.includes('@')) {
      setErrorMessage("La réinitialisation par lien nécessite une adresse email valide. Si vous n'avez utilisé qu'un numéro de téléphone, contactez le dispatch (01 01 68 25 35).");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(trimmed);
      setSuccessMessage('Un lien de réinitialisation vous a été envoyé par email.');
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Switch to login tab and prefill identifier
  const switchToLoginWithPhone = (phoneNum: string) => {
    setMode('login');
    setLoginIdentifier(phoneNum);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-neutral-900/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 border border-neutral-200 dark:border-neutral-700">
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
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className={`py-2.5 text-xs font-black rounded-xl transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-neutral-800 text-[#0D631B] dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(null); }}
              className={`py-2.5 text-xs font-black rounded-xl transition ${
                mode === 'register'
                  ? 'bg-white dark:bg-neutral-800 text-[#0D631B] dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Créer mon compte
            </button>
          </div>
        )}

        {/* Feedback messages */}
        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-200 p-3 rounded-xl text-xs font-bold flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
            {mode === 'register' && (errorMessage.includes('déjà') || errorMessage.includes('connecter')) && (
              <button
                type="button"
                onClick={() => switchToLoginWithPhone(regPhone || loginIdentifier)}
                className="mt-1 text-left text-[11px] font-black text-[#0D631B] dark:text-emerald-400 underline underline-offset-2 flex items-center gap-1 hover:opacity-80"
              >
                <span>Accéder à la Connexion avec ce numéro</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Mode: Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Téléphone (ou Email)</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="07 08 09 10 11 ou email"
                  required
                  autoComplete="username"
                  className="w-full p-3 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white pl-9 focus:ring-2 focus:ring-[#0D631B] focus:border-transparent outline-none transition"
                />
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
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
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full p-3 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white pl-9 pr-10 focus:ring-2 focus:ring-[#0D631B] focus:border-transparent outline-none transition"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] py-3.5 bg-[#0D631B] hover:bg-[#0a4d15] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
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

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-neutral-800 px-2 text-neutral-400 font-bold">ou</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full min-h-[44px] py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 border border-neutral-300 dark:border-neutral-600"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuer avec Google</span>
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(null); }}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Nouveau à Dabou ? <span className="font-bold text-[#0D631B] dark:text-emerald-400 underline">Créer mon compte chauffeur</span>
              </button>
            </div>
          </form>
        )}

        {/* Mode: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            {/* Nom complet */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase flex items-center justify-between">
                <span>Nom complet (Prénom & Nom)</span>
                <span className="text-[10px] text-emerald-600 font-semibold">*Obligatoire</span>
              </label>
              <input
                type="text"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder="Ex: Koffi Emmanuel"
                required
                className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0D631B] focus:border-transparent outline-none transition"
              />
            </div>

            {/* Téléphone & Immatriculation (Optionnelle) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase flex items-center justify-between">
                  <span>Téléphone (CI)</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">*Obligatoire</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="07 08 09 10 11"
                    required
                    className="w-full p-2.5 pl-8 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0D631B] focus:border-transparent outline-none transition"
                  />
                  <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase flex items-center justify-between">
                  <span>Immatriculation</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Optionnel</span>
                </label>
                <input
                  type="text"
                  value={regVehicleNumber}
                  onChange={(e) => setRegVehicleNumber(e.target.value)}
                  placeholder="Ex: 5678-KL-01"
                  className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white uppercase focus:ring-2 focus:ring-[#0D631B] focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Type de véhicule */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Type de véhicule</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setRegVehicleType('voiture')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    regVehicleType === 'voiture'
                      ? 'border-[#0D631B] bg-emerald-50 dark:bg-emerald-950 text-[#0D631B] dark:text-emerald-300 shadow-xs ring-1 ring-[#0D631B]'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Voiture (Taxi / VTC)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegVehicleType('moto')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    regVehicleType === 'moto'
                      ? 'border-[#0D631B] bg-emerald-50 dark:bg-emerald-950 text-[#0D631B] dark:text-emerald-300 shadow-xs ring-1 ring-[#0D631B]'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>Moto (Colis / Express)</span>
                </button>
              </div>
            </div>

            {/* Email (Optionnel) */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase flex items-center justify-between">
                <span>Adresse Email</span>
                <span className="text-[10px] text-neutral-400 font-normal">Optionnel (facultatif)</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Laissez vide si vous n'avez pas d'email"
                  className="w-full p-2.5 pl-8 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0D631B] focus:border-transparent outline-none transition"
                />
                <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
              </div>
            </div>

            {/* Mots de passe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase flex items-center justify-between">
                  <span>Mot de passe</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">&ge; 8 car.</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Au moins 8 caractères"
                    required
                    autoComplete="new-password"
                    className="w-full p-2.5 pl-8 pr-8 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0D631B] focus:border-transparent outline-none transition"
                  />
                  <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase">Confirmer mot de passe</label>
                <div className="relative mt-1">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    required
                    autoComplete="new-password"
                    className="w-full p-2.5 pl-8 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0D631B] focus:border-transparent outline-none transition"
                  />
                  <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>

            {/* Permis de conduire (Requis selon spécification métier) */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regHasLicense}
                  onChange={(e) => setRegHasLicense(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0D631B] focus:ring-[#0D631B] accent-[#0D631B]"
                />
                <div className="text-xs">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    Je possède un permis de conduire valide (catégorie A ou B)
                  </span>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                    Obligatoire pour l'approbation de votre candidature par le régulateur Allô Dabou.
                  </p>
                </div>
              </label>
            </div>

            {/* Soumettre */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] py-3.5 bg-[#0D631B] hover:bg-[#0a4d15] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Créer mon compte chauffeur</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-neutral-800 px-2 text-neutral-400 font-bold">ou</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full min-h-[44px] py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 border border-neutral-300 dark:border-neutral-600"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuer avec Google</span>
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMessage(null); }}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Déjà inscrit ? <span className="font-bold text-[#0D631B] dark:text-emerald-400 underline">Se connecter</span>
              </button>
            </div>
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
                Saisissez votre email pour recevoir les instructions de réinitialisation. Si vous utilisez uniquement un numéro de téléphone, contactez le dispatch de Dabou.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Adresse Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="chauffeur@allodabou.ci"
                required
                className="w-full mt-1 p-3 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0D631B] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-3 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#0D631B] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md disabled:opacity-70"
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl text-center">
              <p className="text-[11px] text-neutral-500">
                Assistance dispatch immédiate : <a href="tel:0101682535" className="font-bold text-[#0D631B] dark:text-emerald-400">01 01 68 25 35</a>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
