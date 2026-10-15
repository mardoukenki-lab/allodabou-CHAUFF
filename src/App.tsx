import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RideProvider, useRides } from './context/RideContext';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { PendingRidesTab } from './components/PendingRidesTab';
import { ActiveRideTab } from './components/ActiveRideTab';
import { EarningsTab } from './components/EarningsTab';
import { ProfileTab } from './components/ProfileTab';
import { AuthModal } from './components/AuthModal';
import { PendingApprovalView } from './components/PendingApprovalView';
import { OfflineBanner } from './components/OfflineBanner';
import { setupForegroundMessageListener } from './services/fcm';
import { Bell, X, PhoneCall, MessageSquare } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, userProfile, isLoading } = useAuth();
  const { activeRide } = useRides();
  
  const [currentTab, setCurrentTab] = useState<TabType>('demandes');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('allo_dabou_driver_theme') === 'dark';
  });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [pushToast, setPushToast] = useState<{ title: string; body: string } | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('allo_dabou_driver_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('allo_dabou_driver_theme', 'light');
    }
  }, [darkMode]);

  // Foreground push notification listener
  useEffect(() => {
    setupForegroundMessageListener((title, body) => {
      setPushToast({ title, body });
      setTimeout(() => setPushToast(null), 6000);
    });
  }, []);

  // Auto-switch to active ride tab if there's an active ride
  useEffect(() => {
    if (activeRide && currentTab === 'demandes') {
      setCurrentTab('course');
    }
  }, [activeRide?.id]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D631B] flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <h2 className="mt-4 text-lg font-black tracking-wide">Allô Dabou Chauffeur</h2>
        <p className="text-xs text-emerald-200 mt-1">Connexion au réseau de Dabou...</p>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return <AuthModal />;
  }

  // Driver in pending approval
  if (userProfile && !userProfile.isApprovedDriver && userProfile.role === 'driver_pending') {
    return <PendingApprovalView />;
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col">
      {/* Offline Alert Banner */}
      <OfflineBanner />

      {/* Persistent Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* Push Notification In-App Toast */}
      {pushToast && (
        <div className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto bg-neutral-900 text-white p-3.5 rounded-2xl shadow-2xl border border-neutral-700 flex items-start justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0D631B] rounded-xl text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black">{pushToast.title}</p>
              <p className="text-[11px] text-neutral-300">{pushToast.body}</p>
            </div>
          </div>
          <button onClick={() => setPushToast(null)}>
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
      )}

      {/* Main Tab Screen */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'demandes' && (
          <PendingRidesTab onGoToActiveRide={() => setCurrentTab('course')} />
        )}
        {currentTab === 'course' && (
          <ActiveRideTab onGoToDemandes={() => setCurrentTab('demandes')} />
        )}
        {currentTab === 'gains' && <EarningsTab />}
        {currentTab === 'profil' && (
          <ProfileTab onOpenHelp={() => setShowHelpModal(true)} />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Help & Dispatch Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-[#0D631B] dark:text-emerald-400">
                Dispatch Allô Dabou
              </h3>
              <button onClick={() => setShowHelpModal(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Pour toute assistance, problème de géolocalisation ou incident sur la route à Dabou :
            </p>

            <div className="space-y-2 pt-1">
              <a
                href="https://wa.me/2250101682535?text=Bonjour%20Dispatch%20All%C3%B4%20Dabou,%20j'ai%20besoin%20d'aide."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#0D631B] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
              >
                <MessageSquare className="w-4 h-4 text-amber-300" />
                <span>WhatsApp : 01 01 68 25 35</span>
              </a>

              <a
                href="tel:0101682535"
                className="w-full py-3 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Appel téléphonique direct</span>
              </a>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RideProvider>
        <MainApp />
      </RideProvider>
    </AuthProvider>
  );
}
