import React from 'react';
import { Bell, Navigation as NavIcon, Wallet, User as UserIcon } from 'lucide-react';
import { useRides } from '../context/RideContext';

export type TabType = 'demandes' | 'course' | 'gains' | 'profil';

interface NavigationProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, setCurrentTab }) => {
  const { pendingRides, activeRide } = useRides();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-1">
        {/* Tab 1: Demandes */}
        <button
          onClick={() => setCurrentTab('demandes')}
          className={`flex flex-col items-center justify-center gap-1 relative min-h-[48px] transition-colors ${
            currentTab === 'demandes'
              ? 'text-[#0D631B] dark:text-emerald-400 font-black'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 font-medium'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {pendingRides.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                {pendingRides.length}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight">Demandes</span>
          {currentTab === 'demandes' && (
            <span className="absolute bottom-1 w-8 h-1 bg-[#0D631B] dark:bg-emerald-400 rounded-full" />
          )}
        </button>

        {/* Tab 2: Course active */}
        <button
          onClick={() => setCurrentTab('course')}
          className={`flex flex-col items-center justify-center gap-1 relative min-h-[48px] transition-colors ${
            currentTab === 'course'
              ? 'text-[#0D631B] dark:text-emerald-400 font-black'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 font-medium'
          }`}
        >
          <div className="relative">
            <NavIcon className="w-5 h-5" />
            {activeRide && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight">Course</span>
          {currentTab === 'course' && (
            <span className="absolute bottom-1 w-8 h-1 bg-[#0D631B] dark:bg-emerald-400 rounded-full" />
          )}
        </button>

        {/* Tab 3: Gains */}
        <button
          onClick={() => setCurrentTab('gains')}
          className={`flex flex-col items-center justify-center gap-1 relative min-h-[48px] transition-colors ${
            currentTab === 'gains'
              ? 'text-[#0D631B] dark:text-emerald-400 font-black'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 font-medium'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Gains</span>
          {currentTab === 'gains' && (
            <span className="absolute bottom-1 w-8 h-1 bg-[#0D631B] dark:bg-emerald-400 rounded-full" />
          )}
        </button>

        {/* Tab 4: Profil */}
        <button
          onClick={() => setCurrentTab('profil')}
          className={`flex flex-col items-center justify-center gap-1 relative min-h-[48px] transition-colors ${
            currentTab === 'profil'
              ? 'text-[#0D631B] dark:text-emerald-400 font-black'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 font-medium'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Profil</span>
          {currentTab === 'profil' && (
            <span className="absolute bottom-1 w-8 h-1 bg-[#0D631B] dark:bg-emerald-400 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
