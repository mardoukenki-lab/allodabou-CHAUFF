import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Volume2, 
  AlertCircle, 
  ShieldCheck, 
  Package, 
  Car, 
  Bike,
  Navigation
} from 'lucide-react';
import { useRides } from '../context/RideContext';
import { useAuth } from '../context/AuthContext';
import { testAlertSound } from '../services/audio';
import { ServiceType } from '../types';

interface PendingRidesTabProps {
  onGoToActiveRide: () => void;
}

export const PendingRidesTab: React.FC<PendingRidesTabProps> = ({ onGoToActiveRide }) => {
  const { 
    pendingRides, 
    activeRide, 
    acceptRide, 
    ignoreRide, 
    isLoadingRides, 
    serviceFilter,
    setServiceFilter
  } = useRides();
  const { isOnline, setOnlineStatus, userProfile } = useAuth();
  
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter rides based on category
  const filteredRides = pendingRides.filter((ride) => {
    if (serviceFilter === 'all') return true;
    return ride.serviceType === serviceFilter;
  });

  const handleAccept = async (rideId: string) => {
    setErrorMessage(null);
    setAcceptingId(rideId);
    const result = await acceptRide(rideId);
    setAcceptingId(null);

    if (result.success) {
      onGoToActiveRide();
    } else {
      setErrorMessage(result.message || 'Course indisponible');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const getServiceLabel = (type: ServiceType) => {
    switch (type) {
      case 'vtc': return { label: 'VTC Climatisé', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300' };
      case 'taxi': return { label: 'Taxi Dabou', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300' };
      case 'delivery': return { label: 'Livraison Colis', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-300' };
      case 'concierge': return { label: 'Course Express', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-300' };
      default: return { label: 'Course', color: 'bg-neutral-100 text-neutral-800' };
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-3 space-y-4 pb-24">
      {/* Active ride reminder banner if exists */}
      {activeRide && (
        <div 
          onClick={onGoToActiveRide}
          className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer hover:bg-emerald-700 active:scale-98 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl animate-pulse">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-100">Course en cours</p>
              <p className="text-sm font-bold truncate max-w-[200px]">{activeRide.destinationAddress}</p>
            </div>
          </div>
          <span className="text-xs font-black bg-white text-[#0D631B] px-3 py-1.5 rounded-full shadow-xs">
            Afficher
          </span>
        </div>
      )}

      {/* Offline Alert Box */}
      {!isOnline && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 p-4 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-7 h-7 text-amber-600 mx-auto" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
            Vous êtes hors ligne
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Pour recevoir les demandes des clients de Dabou en direct, activez votre statut.
          </p>
          <button
            onClick={() => setOnlineStatus(true)}
            className="w-full py-2.5 px-4 bg-[#0D631B] hover:bg-[#0a4d15] text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
          >
            Passer en ligne maintenant
          </button>
        </div>
      )}

      {/* Filter Tabs & Sound Test */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'vtc', label: 'VTC' },
            { id: 'taxi', label: 'Taxi' },
            { id: 'delivery', label: 'Colis' },
            { id: 'concierge', label: 'Express' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setServiceFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition min-h-[36px] ${
                serviceFilter === tab.id
                  ? 'bg-[#0D631B] text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Audio buzzer test button */}
        <button
          onClick={testAlertSound}
          title="Tester la sonnerie d'alerte"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-200 active:scale-95 transition whitespace-nowrap"
        >
          <Volume2 className="w-3.5 h-3.5 text-[#0D631B] dark:text-emerald-400" />
          <span className="hidden xs:inline">Son</span>
        </button>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="bg-rose-500 text-white p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-md animate-shake">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span>Demandes en attente</span>
          <span className="bg-emerald-100 dark:bg-emerald-950 text-[#0D631B] dark:text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full">
            {filteredRides.length}
          </span>
        </h2>
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
          Dabou & Environs
        </span>
      </div>

      {/* Loading State */}
      {isLoadingRides && (
        <div className="py-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#0D631B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">Recherche des courses en cours...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingRides && filteredRides.length === 0 && (
        <div className="bg-white dark:bg-neutral-800/80 rounded-2xl p-6 text-center border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-3">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mx-auto text-[#0D631B] dark:text-emerald-400">
            {userProfile?.vehicleType === 'moto' ? <Bike className="w-7 h-7" /> : <Car className="w-7 h-7" />}
          </div>
          <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
            Aucune demande en attente
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
            Dès qu'un client de Dabou commande une course ou une livraison, elle apparaîtra ici avec une alerte sonore.
          </p>
        </div>
      )}

      {/* Rides List */}
      <div className="space-y-3.5">
        {filteredRides.map((ride) => {
          const serviceStyle = getServiceLabel(ride.serviceType);
          const isAccepting = acceptingId === ride.id;

          return (
            <div
              key={ride.id}
              className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700/80 shadow-md hover:border-[#0D631B] transition p-4 space-y-3"
            >
              {/* Header card: Service badge + Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-md border ${serviceStyle.color}`}>
                    {serviceStyle.label}
                  </span>
                  {ride.vehicleTypeRequested && ride.vehicleTypeRequested !== 'any' && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                      {ride.vehicleTypeRequested === 'moto' ? 'Moto' : 'Voiture'}
                    </span>
                  )}
                </div>
                {/* Highlighted Price for sunny visibility */}
                <div className="text-right">
                  <span className="text-lg font-black text-[#0D631B] dark:text-emerald-400 tracking-tight">
                    {ride.priceFcfa?.toLocaleString('fr-FR')} FCFA
                  </span>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">Espèces</p>
                </div>
              </div>

              {/* Itinerary */}
              <div className="space-y-2.5 pt-1">
                {/* Pickup */}
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#0D631B] dark:bg-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Prise en charge</p>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                      {ride.pickupAddress}
                    </p>
                  </div>
                </div>

                {/* Destination */}
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
                    <MapPin className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Destination</p>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                      {ride.destinationAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics: Distance, Duration, Notes */}
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>~{ride.durationMin} min</span>
                </div>
                <div className="flex items-center gap-1 font-semibold">
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{ride.distanceKm} km</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                  <span>Dabou Centre</span>
                </div>
              </div>

              {/* Privacy Shield Notice (Requirement 9) */}
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-100/70 dark:bg-neutral-900/40 px-2.5 py-1.5 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Nom & téléphone client masqués avant acceptation</span>
              </div>

              {/* Action Buttons: Accepter (Atomique) & Ignorer */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => ignoreRide(ride.id)}
                  className="col-span-1 min-h-[48px] rounded-xl border-2 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700/60 active:scale-95 transition flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                  <span>Ignorer</span>
                </button>

                <button
                  onClick={() => handleAccept(ride.id)}
                  disabled={isAccepting}
                  className="col-span-2 min-h-[48px] rounded-xl bg-[#0D631B] hover:bg-[#0a4d15] text-white font-black text-sm uppercase tracking-wide shadow-md hover:shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                >
                  {isAccepting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Acceptation...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Accepter la course</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
