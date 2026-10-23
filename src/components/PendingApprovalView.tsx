import React from 'react';
import { 
  Clock, 
  MessageSquare, 
  PhoneCall, 
  FileCheck, 
  CheckCircle, 
  LogOut,
  ShieldCheck,
  Hash
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  DISPATCH_PHONE, 
  DISPATCH_PHONE_DISPLAY, 
  getDriverValidationWhatsAppUrl 
} from '../constants/dispatch';

export const PendingApprovalView: React.FC = () => {
  const { userProfile, logout } = useAuth();

  const dispatchWhatsAppUrl = getDriverValidationWhatsAppUrl({
    displayName: userProfile?.displayName || 'Chauffeur',
    phone: userProfile?.phone || '',
    driverCode: userProfile?.driverCode,
    vehicleType: userProfile?.vehicleType,
    vehicleNumber: userProfile?.vehicleNumber,
  });

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col justify-between p-4 max-w-md mx-auto">
      <div className="pt-8 space-y-6 text-center">
        {/* Animated Status Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 flex items-center justify-center text-amber-600 shadow-lg">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0D631B] text-white rounded-full flex items-center justify-center shadow-xs">
            <FileCheck className="w-4 h-4" />
          </span>
        </div>

        {/* Title & Explanations */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-3.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">
            Dossier en cours de validation
          </span>
          <h1 className="text-xl font-black text-neutral-900 dark:text-white pt-2">
            Bienvenue {userProfile?.displayName || 'Chauffeur'} !
          </h1>

          {/* Reserved Driver Code */}
          {userProfile?.driverCode && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700">
              <Hash className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Votre Code Chauffeur :</span>
              <span className="text-sm font-mono font-black text-[#0D631B] dark:text-emerald-300 tracking-wider">
                {userProfile.driverCode}
              </span>
            </div>
          )}

          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed px-4">
            Votre inscription a bien été enregistrée. Pour garantir la sécurité des passagers à Dabou, notre équipe dispatch vérifie votre permis de conduire et votre véhicule.
          </p>
        </div>

        {/* Required steps info */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-left space-y-3 shadow-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
            Étapes de validation
          </h3>
          <ul className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Création du compte et code chauffeur réservé</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-amber-500 shrink-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              </div>
              <span>Contrôle pièces (permis, assurance, visite technique)</span>
            </li>
            <li className="flex items-center gap-2 text-neutral-400">
              <div className="w-4 h-4 rounded-full border-2 border-neutral-300 shrink-0" />
              <span>Activation officielle et mise en ligne</span>
            </li>
          </ul>
        </div>

        {/* Dispatch WhatsApp Link */}
        <div className="space-y-2 pt-2">
          <a
            href={dispatchWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[50px] py-3.5 px-4 rounded-2xl bg-[#0D631B] hover:bg-[#0a4d15] text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5 text-amber-300" />
            <span>Contacter le Dispatch sur WhatsApp ({DISPATCH_PHONE_DISPLAY})</span>
          </a>

          <a
            href={`tel:${DISPATCH_PHONE}`}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-white font-bold text-xs active:scale-95 transition flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <span>Appeler le bureau de Dabou</span>
          </a>
        </div>
      </div>

      {/* Logout */}
      <div className="pt-6 pb-4">
        <button
          onClick={logout}
          className="w-full py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Changer de compte ou se déconnecter</span>
        </button>
      </div>
    </div>
  );
};
