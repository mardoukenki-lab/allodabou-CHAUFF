import React, { useState } from 'react';
import { 
  DollarSign, 
  Car, 
  MapPin, 
  Calendar, 
  Star, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { useRides } from '../context/RideContext';
import { useAuth } from '../context/AuthContext';

export const EarningsTab: React.FC = () => {
  const { earnings, completedRides } = useRides();
  const { userProfile } = useAuth();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  const currentSummary = earnings[period];

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return "Aujourd'hui";
      case 'week': return "Cette semaine";
      case 'month': return "Ce mois-ci";
    }
  };

  // Recent reviews with comments from completed rides
  const reviewedRides = completedRides.filter((r) => r.rating || r.ratingComment);

  return (
    <div className="max-w-md mx-auto px-4 py-3 space-y-4 pb-24">
      {/* Period Selector */}
      <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl">
        {[
          { key: 'day', label: 'Jour' },
          { key: 'week', label: 'Semaine' },
          { key: 'month', label: 'Mois' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key as any)}
            className={`py-2 text-xs font-black rounded-xl transition min-h-[40px] ${
              period === tab.key
                ? 'bg-white dark:bg-neutral-900 text-[#0D631B] dark:text-emerald-400 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Earnings KPI Card */}
      <div className="bg-gradient-to-br from-[#0D631B] to-[#073810] text-white p-5 rounded-3xl shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Gains {getPeriodLabel()}
          </span>
          <span className="p-1.5 rounded-lg bg-white/10 text-emerald-200">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>

        <div>
          <div className="text-3xl font-black tracking-tight">
            {currentSummary.totalEarningsFcfa?.toLocaleString('fr-FR')} <span className="text-lg font-bold">FCFA</span>
          </div>
          <p className="text-[11px] text-emerald-100/80 mt-0.5">
            100% perçu directement en espèces
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-200/80">Courses terminées</span>
            <p className="text-base font-black">{currentSummary.ridesCount}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-200/80">Kilomètres parcourus</span>
            <p className="text-base font-black">{currentSummary.totalDistanceKm.toFixed(1)} km</p>
          </div>
        </div>
      </div>

      {/* Driver Rating & Feedback Overview */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700 flex items-center justify-center text-amber-500">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-neutral-900 dark:text-white">
                {(userProfile?.ratingAverage ?? 5.0).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-neutral-400">/ 5.0</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Basé sur {userProfile?.ratingCount ?? 0} avis clients
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-[#0D631B] dark:bg-emerald-950 dark:text-emerald-300">
            Chauffeur Étoile
          </span>
        </div>
      </div>

      {/* Recent Reviews & Comments from Dabou passengers */}
      {reviewedRides.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Derniers avis clients
          </h3>
          <div className="space-y-2">
            {reviewedRides.slice(0, 3).map((r) => (
              <div 
                key={r.id} 
                className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= (r.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {r.destinationAddress.split(',')[0]}
                  </span>
                </div>
                {r.ratingComment && (
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 italic">
                    « {r.ratingComment} »
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Rides History List */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Historique des courses ({completedRides.length})
          </h3>
          <span className="text-[11px] text-neutral-400 font-medium">
            Toutes à Dabou
          </span>
        </div>

        {completedRides.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl text-center border border-neutral-200 dark:border-neutral-700 space-y-2">
            <Calendar className="w-8 h-8 text-neutral-400 mx-auto" />
            <p className="text-xs text-neutral-500">Aucune course terminée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {completedRides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white dark:bg-neutral-800 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#0D631B] dark:text-emerald-400">
                    {ride.priceFcfa?.toLocaleString('fr-FR')} FCFA
                  </span>
                  <div className="flex items-center gap-1.5">
                    {ride.paymentStatus === 'paid' ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                        Espèces reçu
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                        En attente d'encaissement
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="truncate">{ride.pickupAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="truncate">{ride.destinationAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-700/60">
                  <span>{ride.distanceKm} km</span>
                  <span>Service {ride.serviceType?.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
