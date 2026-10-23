import React from 'react';
import { 
  XCircle, 
  AlertTriangle, 
  MessageSquare, 
  PhoneCall, 
  LogOut, 
  ShieldAlert,
  FileX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  DISPATCH_PHONE, 
  DISPATCH_PHONE_DISPLAY, 
  getDriverDisputeWhatsAppUrl 
} from '../constants/dispatch';

interface RejectedDriverViewProps {
  rejectionReason?: string | null;
}

export const RejectedDriverView: React.FC<RejectedDriverViewProps> = ({ rejectionReason }) => {
  const { userProfile, logout } = useAuth();

  const whatsAppUrl = getDriverDisputeWhatsAppUrl({
    displayName: userProfile?.displayName || 'Chauffeur',
    driverCode: userProfile?.driverCode,
    phone: userProfile?.phone || '',
    subject: 'Renseignements suite au refus de validation de dossier'
  });

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col justify-between p-4 max-w-md mx-auto">
      <div className="pt-8 space-y-6 text-center">
        {/* Status Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-3xl bg-rose-100 dark:bg-rose-950/60 border-2 border-rose-500 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-lg">
            <XCircle className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-3.5 py-1 rounded-full border border-rose-300 dark:border-rose-800">
            Dossier non validé
          </span>
          <h1 className="text-xl font-black text-neutral-900 dark:text-white pt-2">
            Bonjour {userProfile?.displayName || 'Chauffeur'}
          </h1>
          {userProfile?.driverCode && (
            <p className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400">
              Référence dossier : <span className="text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md">{userProfile.driverCode}</span>
            </p>
          )}
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed px-4">
            Après étude par la commission de régulation Allô Dabou, votre candidature chauffeur n'a pas pu être validée pour le moment.
          </p>
        </div>

        {/* Reason Card */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-left space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <FileX className="w-4 h-4 shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider">
              Motif communiqué par l'administration
            </h3>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-900 dark:text-rose-200 leading-relaxed">
            {rejectionReason || "Pièces justificatives incomplètes ou non conformes aux règlements de transport urbain de Dabou (permis, assurance ou visite technique)."}
          </div>
        </div>

        {/* How to rectify */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-left space-y-2 text-xs text-neutral-600 dark:text-neutral-300 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-neutral-800 dark:text-neutral-100">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Vous pensez qu'il s'agit d'une erreur ?</span>
          </div>
          <p className="leading-relaxed">
            Vous pouvez présenter vos pièces originales ou apporter les compléments d'information requis directement au bureau de dispatch Allô Dabou.
          </p>
        </div>

        {/* Contact dispatch */}
        <div className="space-y-2 pt-1">
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[50px] py-3.5 px-4 rounded-2xl bg-[#0D631B] hover:bg-[#0a4d15] text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5 text-amber-300" />
            <span>Échanger avec le Dispatch sur WhatsApp</span>
          </a>

          <a
            href={`tel:${DISPATCH_PHONE}`}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-white font-bold text-xs active:scale-95 transition flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <span>Appeler le bureau ({DISPATCH_PHONE_DISPLAY})</span>
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
          <span>Se déconnecter / Utiliser un autre compte</span>
        </button>
      </div>
    </div>
  );
};
