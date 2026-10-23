import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Navigation, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  User, 
  Package, 
  HelpCircle,
  ExternalLink,
  X,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useRides } from '../context/RideContext';
import { RideStatus } from '../types';

interface ActiveRideTabProps {
  onGoToDemandes: () => void;
}

export const ActiveRideTab: React.FC<ActiveRideTabProps> = ({ onGoToDemandes }) => {
  const { 
    activeRide, 
    advanceRideStatus, 
    cancelRide, 
    markPaymentReceived 
  } = useRides();

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  if (!activeRide) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-[#0D631B] dark:text-emerald-400">
          <Navigation className="w-8 h-8 opacity-70" />
        </div>
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
          Aucune course en cours
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
          Vous n'avez pas de mission active. Rendez-vous dans l'onglet des demandes pour accepter une course.
        </p>
        <button
          onClick={onGoToDemandes}
          className="px-6 py-3 bg-[#0D631B] hover:bg-[#0a4d15] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition"
        >
          Voir les demandes en attente
        </button>
      </div>
    );
  }

  // Sanitize phone for tel: and wa.me
  const cleanPhone = (activeRide.userPhone || '').replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('225') ? cleanPhone : `225${cleanPhone}`;

  // WhatsApp pre-filled text
  let waMessage = `Bonjour ${activeRide.userName}, je suis votre chauffeur Allô Dabou. `;
  if (activeRide.status === 'confirmed' || activeRide.status === 'driver_arriving') {
    waMessage += `Je suis en route pour vous récupérer à : ${activeRide.pickupAddress}.`;
  } else if (activeRide.status === 'driver_arrived') {
    waMessage += `Je suis bien arrivé au point de rendez-vous : ${activeRide.pickupAddress}. Je vous attends.`;
  } else {
    waMessage += `Je vous contacte concernant votre course Allô Dabou.`;
  }
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;

  // Google Maps / Waze direction URL
  const targetDestination = (activeRide.status === 'in_progress')
    ? (activeRide.destinationLat && activeRide.destinationLng 
        ? `${activeRide.destinationLat},${activeRide.destinationLng}` 
        : activeRide.destinationAddress + ', Dabou, Côte d\'Ivoire')
    : (activeRide.pickupLat && activeRide.pickupLng 
        ? `${activeRide.pickupLat},${activeRide.pickupLng}` 
        : activeRide.pickupAddress + ', Dabou, Côte d\'Ivoire');

  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(targetDestination)}`;

  // Handle single action advance
  const handleAdvance = async () => {
    setIsAdvancing(true);
    setActionError(null);
    try {
      await advanceRideStatus(activeRide.id);
    } catch (err: any) {
      setActionError("Échec de la mise à jour : " + (err.message || 'Vérifiez votre connexion.'));
    } finally {
      setIsAdvancing(false);
    }
  };

  // Handle cancellation (H3: Supports in_progress cancellation by assigned driver)
  const handleConfirmCancel = async () => {
    setCancelError(null);
    if (!cancelReason.trim()) {
      setCancelError("Veuillez sélectionner ou indiquer un motif d'annulation.");
      return;
    }
    setIsCancelling(true);
    try {
      await cancelRide(activeRide.id, cancelReason.trim());
      setShowCancelModal(false);
    } catch (err: any) {
      setCancelError("Impossible d'annuler la course : " + (err.message || 'Erreur réseau ou de permission.'));
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Cash Payment
  const handlePayment = async () => {
    setIsMarkingPaid(true);
    try {
      await markPaymentReceived(activeRide.id);
    } finally {
      setIsMarkingPaid(false);
    }
  };

  // Get primary button label & styling based on status
  const getContextualAction = () => {
    switch (activeRide.status) {
      case 'confirmed':
        return {
          label: 'Je pars vers le client',
          subLabel: 'Notifier le client de votre départ',
          color: 'bg-[#0D631B] hover:bg-[#0a4d15]',
        };
      case 'driver_arriving':
        return {
          label: 'Je suis arrivé au point de RDV',
          subLabel: 'Le client sera informé de votre arrivée',
          color: 'bg-amber-600 hover:bg-amber-500',
        };
      case 'driver_arrived':
        return {
          label: 'Démarrer la course',
          subLabel: 'Le client est monté à bord',
          color: 'bg-emerald-600 hover:bg-emerald-500',
        };
      case 'in_progress':
        return {
          label: 'Terminer la course',
          subLabel: 'Arrivée à destination finale',
          color: 'bg-rose-600 hover:bg-rose-500',
        };
      default:
        return null;
    }
  };

  const action = getContextualAction();

  // Status Stepper indicator
  const steps: { key: RideStatus; label: string }[] = [
    { key: 'confirmed', label: 'Acceptée' },
    { key: 'driver_arriving', label: 'En route' },
    { key: 'driver_arrived', label: 'Arrivé' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'completed', label: 'Terminée' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === activeRide.status);

  return (
    <div className="max-w-md mx-auto px-4 py-3 space-y-4 pb-28">
      {/* Lifecycle Progression Tracker */}
      <div className="bg-white dark:bg-neutral-800 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2">
          <span>PROGRESSION DE LA COURSE</span>
          <span className="text-[#0D631B] dark:text-emerald-400 uppercase font-black">
            {steps[currentStepIdx]?.label || activeRide.status}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {steps.map((step, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1">
                <div
                  className={`w-full h-2 rounded-full transition-all duration-300 ${
                    isDone
                      ? 'bg-[#0D631B] dark:bg-emerald-400'
                      : isCurrent
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
                <span className={`text-[9px] font-bold truncate max-w-full ${
                  isCurrent ? 'text-neutral-900 dark:text-white font-black' : 'text-neutral-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="p-1 text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Client Information Card (REVEALED AFTER ACCEPTANCE) */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-emerald-500/40 p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0D631B] dark:text-emerald-400 font-black text-lg">
              {activeRide.userName ? activeRide.userName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Client Allô Dabou</span>
              <h3 className="text-base font-black text-neutral-900 dark:text-white leading-tight">
                {activeRide.userName}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                {activeRide.userPhone}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-black text-[#0D631B] dark:text-emerald-400">
              {activeRide.priceFcfa?.toLocaleString('fr-FR')} F
            </span>
            <p className="text-[10px] text-neutral-500 font-semibold">Espèces</p>
          </div>
        </div>

        {/* Delivery / Package Details if any */}
        {(activeRide.packageDetails || activeRide.conciergeTask || activeRide.recipientPhone) && (
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 p-3 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
              <Package className="w-4 h-4" />
              <span>Détails livraison / coursier :</span>
            </div>
            {activeRide.packageDetails && (
              <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                <strong>Colis :</strong> {activeRide.packageDetails}
              </p>
            )}
            {activeRide.recipientPhone && (
              <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                <strong>Destinataire :</strong> {activeRide.recipientPhone}
              </p>
            )}
            {activeRide.conciergeTask && (
              <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                <strong>Mission :</strong> {activeRide.conciergeTask}
              </p>
            )}
          </div>
        )}

        {/* Client Notes if any */}
        {activeRide.notes && (
          <p className="text-xs bg-neutral-100 dark:bg-neutral-700/50 p-2.5 rounded-xl text-neutral-700 dark:text-neutral-300 italic">
            « {activeRide.notes} »
          </p>
        )}

        {/* Direct Action Buttons: Call, WhatsApp, Itinerary */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <a
            href={`tel:${activeRide.userPhone}`}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-neutral-100 dark:bg-neutral-700/80 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white font-bold text-xs active:scale-95 transition min-h-[50px]"
          >
            <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Appeler</span>
          </a>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold text-xs active:scale-95 transition min-h-[50px]"
          >
            <MessageSquare className="w-5 h-5 text-[#0D631B] dark:text-emerald-400" />
            <span>WhatsApp</span>
          </a>

          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold text-xs active:scale-95 transition min-h-[50px]"
          >
            <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Itinéraire</span>
          </a>
        </div>
      </div>

      {/* Itinerary Summary */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">
          Itinéraire à Dabou
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-[#0D631B] dark:bg-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase">Départ / Prise en charge</p>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {activeRide.pickupAddress}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
              <MapPin className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase">Destination</p>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {activeRide.destinationAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 pt-2 border-t border-neutral-100 dark:border-neutral-700">
          <span>Distance : <strong>{activeRide.distanceKm} km</strong></span>
          <span>Durée estimée : <strong>~{activeRide.durationMin} min</strong></span>
        </div>
      </div>

      {/* SINGLE CONTEXTUAL ACTION BUTTON */}
      {action && (
        <div className="space-y-2 pt-2">
          <button
            onClick={handleAdvance}
            disabled={isAdvancing}
            className={`w-full min-h-[58px] py-4 px-6 rounded-2xl text-white font-black text-base uppercase tracking-wider shadow-xl active:scale-98 transition flex flex-col items-center justify-center gap-0.5 ${action.color}`}
          >
            {isAdvancing ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin my-1" />
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <span>{action.label}</span>
                  <ArrowRight className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-normal opacity-90">{action.subLabel}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* COMPLETED RIDE SCREEN & PAYMENT RECEIVED */}
      {activeRide.status === 'completed' && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-[#0D631B] p-5 rounded-2xl text-center space-y-4 shadow-lg">
          <div className="w-14 h-14 bg-[#0D631B] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-neutral-900 dark:text-white">
              Course terminée !
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Veuillez percevoir le règlement en espèces auprès du client.
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium">Prix de la course :</span>
              <span className="text-lg font-black text-[#0D631B] dark:text-emerald-400">
                {activeRide.priceFcfa?.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium">Mode de paiement :</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">Espèces (Cash)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium">Distance effectuée :</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">{activeRide.distanceKm} km</span>
            </div>
          </div>

          {activeRide.paymentStatus !== 'paid' ? (
            <button
              onClick={handlePayment}
              disabled={isMarkingPaid}
              className="w-full min-h-[52px] py-3.5 px-6 bg-[#0D631B] hover:bg-[#0a4d15] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5 text-amber-300" />
              <span>{isMarkingPaid ? 'Validation...' : 'Paiement reçu en espèces'}</span>
            </button>
          ) : (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Paiement validé avec succès !</span>
            </div>
          )}
        </div>
      )}

      {/* Cancel Action (Only allowed before in_progress, or emergency) */}
      {activeRide.status !== 'completed' && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setShowCancelModal(true)}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold underline underline-offset-4 py-2"
          >
            Annuler la course (motif obligatoire)
          </button>
        </div>
      )}

      {/* Mandatory Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <span>Motif d'annulation</span>
              </h3>
              <button onClick={() => setShowCancelModal(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Pour des raisons de qualité de service à Dabou, un motif est exigé. Si la course n'a pas démarré, elle sera remise à disposition des autres chauffeurs.
            </p>

            <div className="space-y-2">
              {[
                'Client injoignable après plusieurs appels',
                'Client a annulé la demande',
                'Panne mécanique ou crevaison',
                'Embouteillage majeur / Voie bloquée',
                'Adresse introuvable',
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setCancelReason(reason)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold border transition ${
                    cancelReason === reason
                      ? 'border-[#0D631B] bg-emerald-50 dark:bg-emerald-950/60 text-[#0D631B] dark:text-emerald-300'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Autre raison spécifique..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            />

            {/* Cancel Error Feedback */}
            {cancelError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold leading-relaxed">
                {cancelError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="py-2.5 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300"
              >
                Retour
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling || !cancelReason.trim()}
                className="py-2.5 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
              >
                {isCancelling ? 'Annulation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
