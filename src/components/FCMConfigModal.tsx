import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  Sliders, 
  Code2, 
  Smartphone,
  Radio,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getNotificationPermissionStatus, 
  requestPushNotificationPermission, 
  triggerTestPushNotification, 
  getFCMDiagnostics,
  getChauffeurNotifSettings,
  saveChauffeurNotifSettings,
  ChauffeurNotifSettings,
  FCMConfigState
} from '../services/fcm';
import { playNewRideAlert } from '../services/audio';
import { CLOUD_FUNCTION_SNIPPET } from '../services/fcmBackendGuide';

interface FCMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateNewRide?: () => void;
}

export const FCMConfigModal: React.FC<FCMConfigModalProps> = ({ 
  isOpen, 
  onClose,
  onSimulateNewRide 
}) => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'preferences' | 'cloudFunction'>('diagnostic');
  const [diag, setDiag] = useState<FCMConfigState | null>(null);
  const [settings, setSettings] = useState<ChauffeurNotifSettings>(getChauffeurNotifSettings());
  const [isActivating, setIsActivating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadDiagnostics = async () => {
    if (!currentUser) return;
    const res = await getFCMDiagnostics(currentUser.uid);
    setDiag(res);
  };

  useEffect(() => {
    if (isOpen) {
      loadDiagnostics();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleActivate = async () => {
    if (!currentUser) return;
    setIsActivating(true);
    setStatusMessage(null);
    try {
      const res = await requestPushNotificationPermission(currentUser.uid);
      await loadDiagnostics();
      if (res.error) {
        setStatusMessage(res.error);
      } else {
        setStatusMessage('✅ Notifications push et jeton FCM activés avec succès !');
      }
    } catch (err: any) {
      setStatusMessage('Erreur : ' + (err.message || 'Échec de l\'activation'));
    } finally {
      setIsActivating(false);
    }
  };

  const handleTestAlert = async () => {
    setIsTesting(true);
    try {
      await triggerTestPushNotification();
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyToken = () => {
    const tokenToCopy = userProfile?.fcmToken || diag?.token;
    if (tokenToCopy) {
      navigator.clipboard.writeText(tokenToCopy);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CLOUD_FUNCTION_SNIPPET);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSettingChange = <K extends keyof ChauffeurNotifSettings>(
    key: K, 
    value: ChauffeurNotifSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveChauffeurNotifSettings(updated);
  };

  const currentPermission = getNotificationPermissionStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0D631B] text-white p-4 flex items-center justify-between border-b border-[#084212]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">
                Configuration Push FCM
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                Alertes instantanées des courses soumises à Dabou
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 active:scale-95 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'diagnostic'
                ? 'bg-white dark:bg-neutral-800 text-[#0D631B] dark:text-emerald-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Diagnostic & Tests</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'preferences'
                ? 'bg-white dark:bg-neutral-800 text-[#0D631B] dark:text-emerald-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Sons & Vibreur</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudFunction')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'cloudFunction'
                ? 'bg-white dark:bg-neutral-800 text-[#0D631B] dark:text-emerald-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Cloud Function</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* TAB 1: DIAGNOSTIC & TESTS */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-4">
              {/* Status Overview Card */}
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-neutral-600 dark:text-neutral-300">Support Navigateur Web Push :</span>
                  {diag?.isSupported ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Compatible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Non supporté
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-neutral-600 dark:text-neutral-300">Permission Notifications :</span>
                  {currentPermission === 'granted' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accordée
                    </span>
                  ) : currentPermission === 'denied' ? (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Bloquée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                      <Radio className="w-3.5 h-3.5" /> En attente
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-neutral-600 dark:text-neutral-300">Service Worker FCM (/firebase-messaging-sw.js) :</span>
                  {diag?.hasServiceWorker ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-neutral-500 font-bold">
                      Prêt au démarrage
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-neutral-600 dark:text-neutral-300">Clé VAPID Firebase Push :</span>
                  {diag?.hasVapidKey ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Configurée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                      Optionnelle (Locale active)
                    </span>
                  )}
                </div>
              </div>

              {/* Status Feedback Message */}
              {statusMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  {statusMessage}
                </div>
              )}

              {/* Action: Activate / Refresh Token */}
              <div className="space-y-2">
                <button
                  onClick={handleActivate}
                  disabled={isActivating}
                  className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#0D631B] hover:bg-[#0a4d15] text-white font-black text-xs uppercase tracking-wider active:scale-98 transition flex items-center justify-center gap-2 shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 ${isActivating ? 'animate-spin' : ''}`} />
                  <span>
                    {isActivating
                      ? 'Configuration en cours...'
                      : currentPermission === 'granted'
                      ? 'Réactualiser le jeton FCM chauffeur'
                      : 'Activer les notifications push (FCM)'}
                  </span>
                </button>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center">
                  Enregistre le jeton dans votre profil chauffeur Firestore (<code>users/{userProfile?.displayName ? '...' : 'uid'}.fcmTokens</code>).
                </p>
              </div>

              {/* Action Buttons: Test Sound & Push */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleTestAlert}
                  disabled={isTesting}
                  className="py-3 px-3 rounded-2xl border-2 border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition flex items-center justify-center gap-1.5 min-h-[48px]"
                >
                  <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Tester son & vibreur</span>
                </button>

                {onSimulateNewRide && (
                  <button
                    onClick={() => {
                      onSimulateNewRide();
                      onClose();
                    }}
                    className="py-3 px-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#084212] font-black text-xs uppercase tracking-wide active:scale-95 transition flex items-center justify-center gap-1.5 shadow-xs min-h-[48px]"
                  >
                    <Play className="w-4 h-4" />
                    <span>Simuler course Dabou</span>
                  </button>
                )}
              </div>

              {/* Driver FCM Token Card */}
              {(userProfile?.fcmToken || diag?.token) && (
                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-200">
                    <span>Jeton d'appareil FCM Chauffeur :</span>
                    <button
                      onClick={handleCopyToken}
                      className="inline-flex items-center gap-1 text-[#0D631B] dark:text-emerald-400 font-bold hover:underline"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 font-mono text-[10px] text-neutral-600 dark:text-neutral-300 break-all select-all">
                    {userProfile?.fcmToken || diag?.token}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREFERENCES (SOUND, VIBRATION, REPEAT) */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Réglez le comportement sonore et vibratoire lors de la réception d'une nouvelle course à Dabou (idéal pour la circulation ou les trajets en deux-roues).
              </div>

              {/* Volume setting */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                  Volume de l'alarme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'high', label: 'Plein soleil / Fort' },
                    { id: 'medium', label: 'Standard' },
                    { id: 'low', label: 'Discret' },
                  ].map((vol) => (
                    <button
                      key={vol.id}
                      onClick={() => handleSettingChange('soundVolume', vol.id as any)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition border min-h-[44px] ${
                        settings.soundVolume === vol.id
                          ? 'bg-[#0D631B] text-white border-[#0D631B] shadow-xs'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {vol.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibration setting */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                  Modèle de vibration (Mobile)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'heavy', label: 'Intense (Moto)' },
                    { id: 'standard', label: 'Normal' },
                    { id: 'continuous', label: 'Rythmé' },
                  ].map((vib) => (
                    <button
                      key={vib.id}
                      onClick={() => handleSettingChange('vibratePattern', vib.id as any)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition border min-h-[44px] ${
                        settings.vibratePattern === vib.id
                          ? 'bg-[#0D631B] text-white border-[#0D631B] shadow-xs'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {vib.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repeat Alarm Switch */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Sonnerie insistante
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Répète la sonnerie jusqu'à acceptation ou expiration
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('repeatAlarm', !settings.repeatAlarm)}
                  className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                    settings.repeatAlarm ? 'bg-[#0D631B]' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.repeatAlarm ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => playNewRideAlert()}
                className="w-full py-2.5 text-xs font-bold text-[#0D631B] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-4 h-4" />
                <span>Tester la sonnerie avec ces réglages</span>
              </button>
            </div>
          )}

          {/* TAB 3: CLOUD FUNCTION SPECIFICATION */}
          {activeTab === 'cloudFunction' && (
            <div className="space-y-3">
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
                <p className="font-bold text-[#0D631B] dark:text-emerald-400">
                  Déclencheur automatique de Push (Backend Firebase) :
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Lorsque l'application client « Allô Dabou VTC » crée une course dans la collection <code>rides</code>, cette Cloud Function envoie automatiquement le push FCM à tous les chauffeurs compatibles connectés.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400">
                  functions/index.js
                </span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D631B] text-white text-xs font-bold hover:bg-[#0a4d15] active:scale-95 transition"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copié !' : 'Copier le code'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-3 rounded-2xl bg-neutral-900 text-emerald-400 font-mono text-[10px] leading-relaxed overflow-x-auto max-h-56 border border-neutral-700">
                  {CLOUD_FUNCTION_SNIPPET}
                </pre>
              </div>

              <div className="text-[11px] text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1">
                <p className="font-bold">Commande de déploiement Firebase CLI :</p>
                <code className="block bg-neutral-900 text-white p-2 rounded-lg font-mono text-[10px]">
                  firebase deploy --only functions:onNewRideSubmitted
                </code>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 font-bold text-xs active:scale-95 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
