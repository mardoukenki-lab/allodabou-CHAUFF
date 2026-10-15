import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  runTransaction, 
  serverTimestamp, 
  arrayUnion, 
  addDoc,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Ride, RideStatus, ServiceType, EarningsSummary } from '../types';
import { useAuth } from './AuthContext';
import { playNewRideAlert } from '../services/audio';

interface RideContextType {
  pendingRides: Ride[];
  activeRide: Ride | null;
  completedRides: Ride[];
  earnings: {
    day: EarningsSummary;
    week: EarningsSummary;
    month: EarningsSummary;
  };
  isLoadingRides: boolean;
  acceptRide: (rideId: string) => Promise<{ success: boolean; message?: string }>;
  ignoreRide: (rideId: string) => Promise<void>;
  advanceRideStatus: (rideId: string) => Promise<void>;
  cancelRide: (rideId: string, reason: string) => Promise<void>;
  markPaymentReceived: (rideId: string) => Promise<void>;
  serviceFilter: string;
  setServiceFilter: (service: string) => void;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, setActiveRideId } = useAuth();
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [completedRides, setCompletedRides] = useState<Ride[]>([]);
  const [isLoadingRides, setIsLoadingRides] = useState(true);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  
  const knownPendingIdsRef = useRef<Set<string>>(new Set());
  const initialLoadCompletedRef = useRef(false);

  // Sync active ride id with AuthContext to prevent going offline during a ride
  useEffect(() => {
    setActiveRideId(activeRide ? activeRide.id : null);
  }, [activeRide, setActiveRideId]);

  // 1. Listen to PENDING rides in real-time
  useEffect(() => {
    if (!currentUser) {
      setPendingRides([]);
      setIsLoadingRides(false);
      return;
    }

    const ridesRef = collection(db, 'rides');
    const q = query(ridesRef, where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Ride[] = [];
      let hasNewRide = false;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const rideId = docSnap.id;

        // Rule: Hide rides where driver UID is in declinedBy
        if (data.declinedBy && Array.isArray(data.declinedBy) && data.declinedBy.includes(currentUser.uid)) {
          return;
        }

        // Rule: Compatibility with vehicle type (if specified)
        const driverVehicle = userProfile?.vehicleType;
        if (driverVehicle === 'moto' && data.vehicleTypeRequested === 'voiture') {
          return;
        }
        if (driverVehicle === 'voiture' && data.vehicleTypeRequested === 'moto') {
          return;
        }

        const ride: Ride = {
          id: rideId,
          userId: data.userId || '',
          userName: data.userName || 'Client Dabou',
          userPhone: data.userPhone || '',
          userEmail: data.userEmail || '',
          pickupAddress: data.pickupAddress || 'Dabou',
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          destinationAddress: data.destinationAddress || 'Dabou',
          destinationLat: data.destinationLat,
          destinationLng: data.destinationLng,
          distanceKm: data.distanceKm || 2.5,
          durationMin: data.durationMin || 8,
          priceFcfa: data.priceFcfa || 1000,
          serviceType: data.serviceType || 'vtc',
          vehicleTypeRequested: data.vehicleTypeRequested,
          packageDetails: data.packageDetails,
          recipientPhone: data.recipientPhone,
          conciergeTask: data.conciergeTask,
          notes: data.notes,
          status: data.status,
          driverId: data.driverId,
          driverName: data.driverName,
          driverPhone: data.driverPhone,
          driverVehiclePlate: data.driverVehiclePlate,
          driverVehicleType: data.driverVehicleType,
          declinedBy: data.declinedBy || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        list.push(ride);

        if (initialLoadCompletedRef.current && !knownPendingIdsRef.current.has(rideId)) {
          hasNewRide = true;
        }
      });

      // Update known ids
      knownPendingIdsRef.current = new Set(list.map((r) => r.id));

      // Trigger audio & vibration alert if new ride arrived and driver is online
      if (hasNewRide && userProfile?.isOnline) {
        playNewRideAlert();
      }

      initialLoadCompletedRef.current = true;
      setPendingRides(list);
      setIsLoadingRides(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rides (pending query)');
      setIsLoadingRides(false);
    });

    return () => unsubscribe();
  }, [currentUser, userProfile?.vehicleType, userProfile?.isOnline]);

  // 2. Listen to driver's ACTIVE ride in real-time
  useEffect(() => {
    if (!currentUser) {
      setActiveRide(null);
      return;
    }

    const ridesRef = collection(db, 'rides');
    const q = query(
      ridesRef,
      where('driverId', '==', currentUser.uid),
      where('status', 'in', ['confirmed', 'driver_arriving', 'driver_arrived', 'in_progress'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        setActiveRide({
          id: docSnap.id,
          userId: data.userId,
          userName: data.userName || 'Client Dabou',
          userPhone: data.userPhone || '',
          userEmail: data.userEmail,
          pickupAddress: data.pickupAddress,
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          destinationAddress: data.destinationAddress,
          destinationLat: data.destinationLat,
          destinationLng: data.destinationLng,
          distanceKm: data.distanceKm || 3.0,
          durationMin: data.durationMin || 10,
          priceFcfa: data.priceFcfa || 1500,
          serviceType: data.serviceType || 'vtc',
          vehicleTypeRequested: data.vehicleTypeRequested,
          packageDetails: data.packageDetails,
          recipientPhone: data.recipientPhone,
          conciergeTask: data.conciergeTask,
          notes: data.notes,
          status: data.status,
          driverId: data.driverId,
          driverName: data.driverName,
          driverPhone: data.driverPhone,
          driverVehiclePlate: data.driverVehiclePlate,
          driverVehicleType: data.driverVehicleType,
          acceptedAt: data.acceptedAt,
          arrivingAt: data.arrivingAt,
          arrivedAt: data.arrivedAt,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          paymentStatus: data.paymentStatus || 'unpaid',
          paymentMethod: data.paymentMethod || 'cash',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      } else {
        setActiveRide(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rides (active ride query)');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Listen to driver's COMPLETED rides for earnings & history
  useEffect(() => {
    if (!currentUser) {
      setCompletedRides([]);
      return;
    }

    const ridesRef = collection(db, 'rides');
    const q = query(
      ridesRef,
      where('driverId', '==', currentUser.uid),
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Ride[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: data.userId,
          userName: data.userName,
          userPhone: data.userPhone,
          pickupAddress: data.pickupAddress,
          destinationAddress: data.destinationAddress,
          distanceKm: data.distanceKm || 0,
          durationMin: data.durationMin || 0,
          priceFcfa: data.priceFcfa || 0,
          serviceType: data.serviceType,
          status: data.status,
          driverId: data.driverId,
          acceptedAt: data.acceptedAt,
          completedAt: data.completedAt,
          paymentStatus: data.paymentStatus || 'paid',
          paymentMethod: data.paymentMethod || 'cash',
          rating: data.rating,
          ratingComment: data.ratingComment,
          ratedAt: data.ratedAt,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });

      // Sort descending by completedAt or updatedAt
      list.sort((a, b) => {
        const timeA = a.completedAt?.toMillis ? a.completedAt.toMillis() : (a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0);
        const timeB = b.completedAt?.toMillis ? b.completedAt.toMillis() : (b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0);
        return timeB - timeA;
      });

      setCompletedRides(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rides (completed rides query)');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Compute Earnings Dashboard stats
  const earnings = React.useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon = 0
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const summaryDay: EarningsSummary = { period: 'day', totalEarningsFcfa: 0, ridesCount: 0, totalDistanceKm: 0 };
    const summaryWeek: EarningsSummary = { period: 'week', totalEarningsFcfa: 0, ridesCount: 0, totalDistanceKm: 0 };
    const summaryMonth: EarningsSummary = { period: 'month', totalEarningsFcfa: 0, ridesCount: 0, totalDistanceKm: 0 };

    completedRides.forEach((ride) => {
      const rideDate = ride.completedAt?.toMillis ? ride.completedAt.toMillis() : (ride.createdAt?.toMillis ? ride.createdAt.toMillis() : Date.now());
      const amount = Number(ride.priceFcfa) || 0;
      const km = Number(ride.distanceKm) || 0;

      if (rideDate >= startOfDay) {
        summaryDay.totalEarningsFcfa += amount;
        summaryDay.ridesCount += 1;
        summaryDay.totalDistanceKm += km;
      }
      if (rideDate >= startOfWeek) {
        summaryWeek.totalEarningsFcfa += amount;
        summaryWeek.ridesCount += 1;
        summaryWeek.totalDistanceKm += km;
      }
      if (rideDate >= startOfMonth) {
        summaryMonth.totalEarningsFcfa += amount;
        summaryMonth.ridesCount += 1;
        summaryMonth.totalDistanceKm += km;
      }
    });

    return { day: summaryDay, week: summaryWeek, month: summaryMonth };
  }, [completedRides]);

  // 4. ATOMIC ACCEPTANCE TRANSACTION
  const acceptRide = async (rideId: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, message: 'Veuillez vous connecter pour accepter une course.' };
    }

    if (activeRide) {
      return { success: false, message: 'Vous avez déjà une course en cours ! Terminez-la avant.' };
    }

    const rideDocRef = doc(db, 'rides', rideId);

    try {
      await runTransaction(db, async (transaction) => {
        const rideSnap = await transaction.get(rideDocRef);
        if (!rideSnap.exists()) {
          throw new Error('Course introuvable');
        }

        const data = rideSnap.data();
        if (data.status !== 'pending' || (data.driverId && data.driverId !== '')) {
          throw new Error('Course déjà prise par un autre chauffeur');
        }

        transaction.update(rideDocRef, {
          status: 'confirmed',
          driverId: currentUser.uid,
          driverName: userProfile.displayName,
          driverPhone: userProfile.phone,
          driverVehiclePlate: userProfile.vehicleNumber,
          driverVehicleType: userProfile.vehicleType || 'voiture',
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      return { success: true };
    } catch (err: any) {
      const msg = err.message?.includes('Course déjà prise') 
        ? 'Course déjà prise par un autre chauffeur' 
        : (err.message || "Erreur lors de l'acceptation de la course");
      return { success: false, message: msg };
    }
  };

  // 5. Ignore Ride
  const ignoreRide = async (rideId: string): Promise<void> => {
    if (!currentUser) return;
    try {
      const rideRef = doc(db, 'rides', rideId);
      await updateDoc(rideRef, {
        declinedBy: arrayUnion(currentUser.uid),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rides/${rideId}`);
    }
  };

  // 6. Single Contextual Action Progression
  const advanceRideStatus = async (rideId: string): Promise<void> => {
    if (!activeRide || activeRide.id !== rideId) return;

    const rideRef = doc(db, 'rides', rideId);
    let nextStatus: RideStatus | null = null;
    const payload: Record<string, any> = { updatedAt: serverTimestamp() };

    switch (activeRide.status) {
      case 'confirmed':
        nextStatus = 'driver_arriving';
        payload.arrivingAt = serverTimestamp();
        break;
      case 'driver_arriving':
        nextStatus = 'driver_arrived';
        payload.arrivedAt = serverTimestamp();
        break;
      case 'driver_arrived':
        nextStatus = 'in_progress';
        payload.startedAt = serverTimestamp();
        break;
      case 'in_progress':
        nextStatus = 'completed';
        payload.completedAt = serverTimestamp();
        payload.paymentStatus = 'unpaid';
        break;
      default:
        break;
    }

    if (nextStatus) {
      payload.status = nextStatus;
      try {
        await updateDoc(rideRef, payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `rides/${rideId}`);
      }
    }
  };

  // 7. Cancel Ride with Mandatory Reason
  const cancelRide = async (rideId: string, reason: string): Promise<void> => {
    if (!currentUser) return;
    const rideRef = doc(db, 'rides', rideId);

    try {
      if (activeRide && activeRide.status === 'in_progress') {
        // Already started -> cancel permanently
        await updateDoc(rideRef, {
          status: 'cancelled',
          cancelledBy: 'driver',
          cancelReason: reason,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Revert back to pending for other drivers, detach current driver
        await updateDoc(rideRef, {
          status: 'pending',
          driverId: null,
          driverName: null,
          driverPhone: null,
          driverVehiclePlate: null,
          driverVehicleType: null,
          cancelledBy: 'driver',
          cancelReason: reason,
          declinedBy: arrayUnion(currentUser.uid),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rides/${rideId}`);
    }
  };

  // 8. Mark Cash Payment Received
  const markPaymentReceived = async (rideId: string): Promise<void> => {
    try {
      const rideRef = doc(db, 'rides', rideId);
      await updateDoc(rideRef, {
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rides/${rideId}`);
    }
  };

  return (
    <RideContext.Provider
      value={{
        pendingRides,
        activeRide,
        completedRides,
        earnings,
        isLoadingRides,
        acceptRide,
        ignoreRide,
        advanceRideStatus,
        cancelRide,
        markPaymentReceived,
        serviceFilter,
        setServiceFilter,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRides = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRides must be used within a RideProvider');
  }
  return context;
};
