import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testFirestoreConnection } from '../services/firebase';
import { UserProfile, VehicleType } from '../types';
import { requestPushNotificationPermission } from '../services/fcm';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isOnline: boolean;
  activeRideId: string | null;
  setActiveRideId: (rideId: string | null) => void;
  toggleOnlineStatus: () => Promise<boolean>;
  setOnlineStatus: (status: boolean) => Promise<boolean>;
  login: (email: string, pass: string) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDriverProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export interface RegisterParams {
  email: string;
  password: string;
  displayName: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  photoUrl?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const heartbeatTimerRef = useRef<any>(null);

  // Test connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);

        // Real-time listener for user profile
        unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserProfile({
              uid: user.uid,
              displayName: data.displayName || user.displayName || 'Chauffeur Dabou',
              email: data.email || user.email || '',
              phone: data.phone || '',
              role: data.role || 'driver_pending',
              isApprovedDriver: data.isApprovedDriver === true || data.approved === true,
              approved: data.approved === true,
              vehicleNumber: data.vehicleNumber || '',
              vehicleType: data.vehicleType || 'voiture',
              isOnline: data.isOnline ?? false,
              lastSeenAt: data.lastSeenAt,
              photoUrl: data.photoUrl || user.photoURL || null,
              ratingAverage: data.ratingAverage ?? 5.0,
              ratingCount: data.ratingCount ?? 0,
              totalRatingSum: data.totalRatingSum ?? 0,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            });
          } else {
            // Profile doesn't exist yet, populate default driver profile
            const defaultProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'Chauffeur Dabou',
              email: user.email || '',
              phone: '',
              role: 'driver_pending',
              isApprovedDriver: false,
              approved: false,
              vehicleNumber: '',
              vehicleType: 'voiture',
              isOnline: false,
              ratingAverage: 5.0,
              ratingCount: 0,
              totalRatingSum: 0
            };
            setUserProfile(defaultProfile);
          }
          setIsLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          setIsLoading(false);
        });

        // Request Push notification permission
        requestPushNotificationPermission(user.uid);
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  // Heartbeat signal every 60s when online
  useEffect(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }

    if (currentUser && userProfile?.isOnline) {
      // Send initial heartbeat
      const sendHeartbeat = async () => {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            lastSeenAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.warn('Heartbeat update failed:', e);
        }
      };

      sendHeartbeat();
      heartbeatTimerRef.current = setInterval(sendHeartbeat, 60000); // Every 60s
    }

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, [currentUser, userProfile?.isOnline]);

  // Set Online Status with Active Ride Guard
  const setOnlineStatus = async (targetStatus: boolean): Promise<boolean> => {
    if (!currentUser || !userProfile) return false;

    // RULE: Impossible to go offline with an active ride!
    if (!targetStatus && activeRideId) {
      alert("Impossible de passer hors ligne avec une course en cours ! Terminez ou annulez d'abord la course.");
      return false;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        isOnline: targetStatus,
        lastSeenAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      return false;
    }
  };

  const toggleOnlineStatus = async (): Promise<boolean> => {
    const current = userProfile?.isOnline ?? false;
    return await setOnlineStatus(!current);
  };

  // Login
  const login = async (email: string, pass: string): Promise<void> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } finally {
      setIsLoading(false);
    }
  };

  // Register Driver
  const register = async (params: RegisterParams): Promise<void> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        params.email.trim(), 
        params.password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: params.displayName.trim(),
        photoURL: params.photoUrl || undefined
      });

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        displayName: params.displayName.trim(),
        email: params.email.trim(),
        phone: params.phone.trim(),
        role: 'driver_pending',
        isApprovedDriver: false,
        approved: false,
        vehicleType: params.vehicleType,
        vehicleNumber: params.vehicleNumber.trim().toUpperCase(),
        photoUrl: params.photoUrl || null,
        isOnline: false,
        ratingAverage: 5.0,
        ratingCount: 0,
        totalRatingSum: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout with offline cleanup
  const logout = async (): Promise<void> => {
    if (activeRideId) {
      alert("Attention: Vous avez une course active. Veuillez la terminer avant de vous déconnecter.");
      return;
    }
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          isOnline: false,
          lastSeenAt: serverTimestamp()
        });
      } catch (e) {
        // ignore on logout
      }
    }
    await signOut(auth);
  };

  // Password reset
  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // Update profile
  const updateDriverProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        isOnline: userProfile?.isOnline ?? false,
        activeRideId,
        setActiveRideId,
        toggleOnlineStatus,
        setOnlineStatus,
        login,
        register,
        logout,
        resetPassword,
        updateDriverProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
