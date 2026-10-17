import React, { useState } from 'react';
import { 
  Car, 
  Bike, 
  Power, 
  Download, 
  Moon, 
  Sun, 
  HelpCircle,
  PhoneCall,
  Share2,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getNotificationPermissionStatus } from '../services/fcm';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenHelp: () => void;
  onOpenFCMConfig?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  darkMode, 
  setDarkMode, 
  onOpenHelp,
  onOpenFCMConfig
}) => {
  const { userProfile, isOnline, toggleOnlineStatus } = useAuth();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const notifPermission = getNotificationPermissionStatus();

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleOnlineStatus();
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0D631B] text-white shadow-md border-b border-[#084212]">
      {/* Top Bar */}
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
            {userProfile?.vehicleType === 'moto' ? (
              <Bike className="w-5 h-5 text-amber-300" />
            ) : (
              <Car className="w-5 h-5 text-emerald-200" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base tracking-tight leading-none text-white">
                Allô Dabou
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-[#084212] px-1.5 py-0.5 rounded-sm">
                Chauffeur
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/90 font-medium leading-tight">
              {userProfile?.displayName ? userProfile.displayName.split(' ')[0] : 'Conducteur'} • {userProfile?.vehicleNumber || (userProfile?.vehicleType === 'moto' ? 'Moto' : 'Voiture')}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* PWA Install */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              title="Installer l'application"
              className="p-2 rounded-xl bg-amber-400 text-[#084212] font-bold text-xs flex items-center gap-1 hover:bg-amber-300 active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Installer</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              title="Installer sur iOS"
              className="p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Push Notifications Configuration (FCM) */}
          {onOpenFCMConfig && (
            <button
              onClick={onOpenFCMConfig}
              title="Configuration Notifications Push (FCM)"
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 active:scale-95 transition"
            >
              <Bell className="w-5 h-5" />
              {notifPermission === 'granted' ? (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0D631B]" />
              ) : (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse ring-2 ring-[#0D631B]" />
              )}
            </button>
          )}

          {/* Quick Help */}
          <button
            onClick={onOpenHelp}
            title="Assistance & Dispatch"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 active:scale-95 transition"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Basculer thème"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 active:scale-95 transition"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Online / Offline Status Bar */}
      <div className={`px-4 py-2 transition-colors duration-300 border-t ${
        isOnline ? 'bg-emerald-950/70 border-emerald-500/30' : 'bg-neutral-900/80 border-neutral-700/50'
      }`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-neutral-500'
              }`}></span>
            </span>
            <div className="leading-tight">
              <span className="text-xs font-black tracking-wide uppercase">
                {isOnline ? 'VOUS ÊTES EN LIGNE' : 'VOUS ÊTES HORS LIGNE'}
              </span>
              <p className="text-[10px] text-white/70">
                {isOnline ? 'Prêt à recevoir les courses de Dabou' : 'Activez pour recevoir des courses'}
              </p>
            </div>
          </div>

          {/* Large Ergonomic Switch */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm min-h-[44px] ${
              isOnline
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'Se déconnecter' : 'Passer en ligne'}</span>
          </button>
        </div>
      </div>

      {/* iOS Safari PWA Install Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-neutral-900">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-[#0D631B]">Installer sur iPhone / iPad</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              Pour ajouter <strong>Allô Dabou Chauffeur</strong> sur votre écran d'accueil :
            </p>
            <ol className="mt-3 space-y-2 text-sm text-neutral-700 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0D631B] text-white text-xs font-bold flex items-center justify-center">1</span>
                <span>Touchez le bouton <strong>Partager</strong> <Share2 className="w-4 h-4 inline text-blue-600" /> dans Safari.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0D631B] text-white text-xs font-bold flex items-center justify-center">2</span>
                <span>Faites défiler et choisissez <strong>Sur l'écran d'accueil</strong>.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0D631B] text-white text-xs font-bold flex items-center justify-center">3</span>
                <span>Touchez <strong>Ajouter</strong> en haut à droite.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-[#0D631B] py-3 text-sm font-bold text-white hover:bg-[#0a4d15] active:scale-95 transition"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
