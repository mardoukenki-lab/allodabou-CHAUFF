import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Car, 
  Bike, 
  ShieldCheck, 
  Edit3, 
  LogOut, 
  MessageSquare, 
  PhoneCall, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Camera, 
  AlertCircle,
  ExternalLink,
  Bell,
  Volume2,
  Copy,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VehicleType } from '../types';
import { 
  getNotificationPermissionStatus, 
  requestPushNotificationPermission, 
  triggerTestPushNotification, 
  NotificationPermissionState 
} from '../services/fcm';

interface ProfileTabProps {
  onOpenHelp: () => void;
  onOpenFCMConfig?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onOpenHelp, onOpenFCMConfig }) => {
  const { currentUser, userProfile, updateDriverProfile, logout } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [vehicleNumber, setVehicleNumber] = useState(userProfile?.vehicleNumber || '');
  const [vehicleType, setVehicleType] = useState<VehicleType>(userProfile?.vehicleType || 'voiture');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // FCM Push Notifications State
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>(getNotificationPermissionStatus());
  const [isActivatingNotif, setIsActivatingNotif] = useState(false);
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleActivateNotifications = async () => {
    if (!currentUser) return;
    setIsActivatingNotif(true);
    try {
      const res = await requestPushNotificationPermission(currentUser.uid);
      setNotifPermission(getNotificationPermissionStatus());
      if (res.error) {
        alert(res.error);
      } else {
        alert("Notifications push activées avec succès !");
      }
    } finally {
      setIsActivatingNotif(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTestingNotif(true);
    try {
      await triggerTestPushNotification();
    } finally {
      setIsTestingNotif(false);
    }
  };

  const handleCopyToken = () => {
    if (userProfile?.fcmToken) {
      navigator.clipboard.writeText(userProfile.fcmToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDriverProfile({
        displayName: displayName.trim(),
        phone: phone.trim(),
        vehicleNumber: vehicleNumber.trim() ? vehicleNumber.trim().toUpperCase() : '',
        vehicleType,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  const dispatchPhone = "0101682535";
  const dispatchWhatsAppUrl = `https://wa.me/2250101682535?text=${encodeURIComponent(
    `Bonjour Dispatch Allô Dabou, je suis le chauffeur ${userProfile?.displayName || ''} (Véhicule: ${userProfile?.vehicleNumber || ''}). J'ai besoin d'une assistance.`
  )}`;

  const faqItems = [
    {
      q: "Comment fonctionne le règlement des courses ?",
      a: "Toutes les courses sont payées directement en espèces (Cash) par le client à bord à la fin du trajet. Vous encaissez 100% de la somme."
    },
    {
      q: "Quelles sont les zones couvertes à Dabou ?",
      a: "Dabou Centre, Grand Marché, Quartier TP, Armebé, Kpass, Débrimou, Agneby, Gbougbo et la route principale Dabou-Abidjan."
    },
    {
      q: "Que faire si un client ne se présente pas ?",
      a: "Après 5 minutes d'attente au point de prise en charge et au moins 2 tentatives d'appels, vous pouvez annuler avec le motif 'Client injoignable'."
    },
    {
      q: "Comment contacter le dispatch en cas d'urgence ?",
      a: "Le dispatch Allô Dabou est joignable 7j/7 au 01 01 68 25 35 par appel ou WhatsApp direct."
    }
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-3 space-y-4 pb-28">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-neutral-800 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#0D631B] text-white flex items-center justify-center font-black text-2xl shadow-md overflow-hidden">
              {userProfile?.photoUrl ? (
                <img src={userProfile.photoUrl} alt="Photo chauffeur" className="w-full h-full object-cover" />
              ) : (
                <span>{userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'D'}</span>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-neutral-900 shadow-xs">
              {userProfile?.vehicleType === 'moto' ? (
                <Bike className="w-4 h-4 text-amber-500" />
              ) : (
                <Car className="w-4 h-4 text-emerald-600" />
              )}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-neutral-900 dark:text-white truncate">
                {userProfile?.displayName || 'Chauffeur Dabou'}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {userProfile?.phone || 'Numéro non renseigné'}
            </p>

            <div className="flex items-center gap-2 mt-1.5">
              {userProfile?.isApprovedDriver ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#0D631B] dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Chauffeur vérifié</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <AlertCircle className="w-3 h-3" />
                  <span>Dossier en attente</span>
                </span>
              )}
              <span className="text-[10px] font-bold uppercase bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-300">
                {userProfile?.vehicleNumber || 'Sans plaque'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200 active:scale-95 transition"
            title="Modifier le profil"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSave} className="pt-3 border-t border-neutral-100 dark:border-neutral-700 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Nom complet</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase">Téléphone (Côte d'Ivoire)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 0708091011"
                required
                className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase">Type de véhicule</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                >
                  <option value="voiture">Voiture (VTC / Taxi)</option>
                  <option value="moto">Moto (Express / Colis)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase">Immatriculation (Optionnel)</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Ex: 1234-HJ-01 (Facultatif)"
                  className="w-full mt-1 p-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white uppercase"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 text-xs font-black rounded-xl bg-[#0D631B] text-white hover:bg-[#0a4d15] flex items-center justify-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Enregistré !</span>
                  </>
                ) : (
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FCM Push Notifications Configuration Card */}
      <div className="bg-white dark:bg-neutral-800 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-[#0D631B] dark:text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                Notifications Push (FCM)
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                Alertes instantanées des courses à Dabou
              </p>
            </div>
          </div>

          <div>
            {notifPermission === 'granted' ? (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-[#0D631B] dark:bg-emerald-950 dark:text-emerald-300">
                Actives
              </span>
            ) : notifPermission === 'denied' ? (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                Bloquées
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                À autoriser
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          Permet de faire sonner et vibrer votre téléphone dès qu'un client ou commerçant de Dabou soumet une course, même si votre écran est éteint.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {notifPermission !== 'granted' ? (
            <button
              onClick={handleActivateNotifications}
              disabled={isActivatingNotif}
              className="col-span-2 py-3 px-3 rounded-2xl bg-[#0D631B] hover:bg-[#0a4d15] text-white font-black text-xs uppercase tracking-wider active:scale-95 transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Bell className="w-4 h-4 text-amber-300" />
              <span>{isActivatingNotif ? 'Activation...' : 'Activer les notifications push'}</span>
            </button>
          ) : (
            <button
              onClick={handleActivateNotifications}
              disabled={isActivatingNotif}
              className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs hover:bg-neutral-200 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600" />
              <span>Actualiser le jeton</span>
            </button>
          )}

          <button
            onClick={handleTestNotification}
            disabled={isTestingNotif}
            className={`${
              notifPermission !== 'granted' ? 'col-span-2' : ''
            } py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs hover:bg-neutral-200 active:scale-95 transition flex items-center justify-center gap-1.5`}
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-500" />
            <span>{isTestingNotif ? 'Test...' : 'Tester son & notification'}</span>
          </button>
        </div>

        {/* Registered Token preview */}
        {userProfile?.fcmToken && (
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="truncate max-w-[200px]">
              Jeton : <code className="text-[10px] bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded font-mono">{userProfile.fcmToken.slice(0, 16)}...</code>
            </span>
            <button
              onClick={handleCopyToken}
              className="text-[#0D631B] dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedToken ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
        )}

        {/* Advanced FCM Config & Cloud Function Guide */}
        {onOpenFCMConfig && (
          <button
            onClick={onOpenFCMConfig}
            className="w-full mt-1 py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition flex items-center justify-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-[#0D631B] dark:text-emerald-400" />
            <span>Paramètres avancés FCM & Code Cloud Function</span>
          </button>
        )}
      </div>

      {/* Dispatch Support Card */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-4 rounded-3xl space-y-3">
        <div className="flex items-center gap-2 text-[#0D631B] dark:text-emerald-400 font-black text-sm">
          <HelpCircle className="w-5 h-5" />
          <span>Assistance & Dispatch Dabou</span>
        </div>
        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          Une urgence sur la route ? Un litige client ? Le centre de régulation Allô Dabou est à votre écoute en continu.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={`tel:${dispatchPhone}`}
            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white font-bold text-xs border border-neutral-200 dark:border-neutral-700 active:scale-95 transition shadow-xs"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <span>Appel ({dispatchPhone})</span>
          </a>

          <a
            href={dispatchWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-[#0D631B] text-white font-bold text-xs hover:bg-[#0a4d15] active:scale-95 transition shadow-xs"
          >
            <MessageSquare className="w-4 h-4 text-amber-300" />
            <span>WhatsApp Dispatch</span>
          </a>
        </div>
      </div>

      {/* Short FAQ for Dabou Drivers */}
      <div className="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
          Questions fréquentes (FAQ Chauffeur)
        </h3>

        {faqItems.map((item, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div key={idx} className="border-b border-neutral-100 dark:border-neutral-700/60 last:border-none pb-2">
              <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200"
              >
                <span>{item.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </button>
              {isOpen && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 pt-1 pb-1 leading-relaxed">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Log Out Button */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full min-h-[48px] py-3 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter de la session</span>
        </button>
      </div>
    </div>
  );
};
