import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testFirestoreConnection } from '../services/firebase';
import { UserProfile, VehicleType, ApplicationStatus } from '../types';
import { requestPushNotificationPermission } from '../services/fcm';
import { normalizeIvorianPhone, formatIvorianPhone } from '../services/phoneUtils';

export function generateDriverCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = array[0] % 1000000;
  return `GNG-${num.toString().padStart(6, '0')}`;
}

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
  loginWithGoogle: () => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDriverProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export interface RegisterParams {
  email?: string;
  password: string;
  displayName: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  photoUrl?: string;
  hasLicense?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const heartbeatTimerRef = useRef<any>(null);
  const isRegisteringRef = useRef<boolean>(false);

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
            const rawStatus: ApplicationStatus = data.applicationStatus || (data.isApprovedDriver || data.approved ? 'approved' : 'pending');
            const isApproved = (data.isApprovedDriver === true || data.approved === true) && rawStatus !== 'suspended' && rawStatus !== 'rejected';

            setUserProfile({
              uid: user.uid,
              displayName: data.displayName || user.displayName || 'Chauffeur Dabou',
              email: data.email || user.email || '',
              phone: data.phone || '',
              role: data.role || 'driver_pending',
              isApprovedDriver: isApproved,
              approved: isApproved,
              applicationStatus: rawStatus,
              driverCode: data.driverCode || undefined,
              hasLicense: data.hasLicense ?? true,
              rejectionReason: data.rejectionReason || null,
              suspensionReason: data.suspensionReason || null,
              checklist: data.checklist || {},
              adminNote: data.adminNote || undefined,
              cardType: data.cardType,
              cardNumber: data.cardNumber,
              cardValidFrom: data.cardValidFrom,
              cardValidUntil: data.cardValidUntil,
              reviewedBy: data.reviewedBy,
              reviewedAt: data.reviewedAt,
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
            // If explicit registration is in progress, skip auto-heal to avoid race condition
            if (isRegisteringRef.current) {
              return;
            }

            // Profile doesn't exist yet: self-heal by reserving driverCode and creating Firestore document
            const reservedCode = generateDriverCode();
            const defaultProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'Chauffeur Dabou',
              email: user.email || '',
              phone: '',
              role: 'driver_pending',
              applicationStatus: 'pending',
              isApprovedDriver: false,
              approved: false,
              driverCode: reservedCode,
              hasLicense: true,
              vehicleNumber: '',
              vehicleType: 'voiture',
              isOnline: false,
              ratingAverage: 5.0,
              ratingCount: 0,
              totalRatingSum: 0
            };
            setUserProfile(defaultProfile);

            // Provision missing profile and driver code atomically
            const batch = writeBatch(db);
            batch.set(doc(db, 'driverCodes', reservedCode), {
              code: reservedCode,
              driverId: user.uid,
              driverName: user.displayName || 'Chauffeur Dabou',
              driverPhone: '',
              createdAt: serverTimestamp(),
            });
            batch.set(userDocRef, {
              uid: user.uid,
              displayName: user.displayName || 'Chauffeur Dabou',
              email: user.email || '',
              phone: '',
              role: 'driver_pending',
              applicationStatus: 'pending',
              isApprovedDriver: false,
              approved: false,
              driverCode: reservedCode,
              hasLicense: true,
              checklist: {
                licenseVerified: false,
                insuranceVerified: false,
                technicalInspectionVerified: false,
                identityVerified: false,
              },
              vehicleType: 'voiture',
              vehicleNumber: '',
              isOnline: false,
              ratingAverage: 5.0,
              ratingCount: 0,
              totalRatingSum: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            batch.commit().catch((healErr) => {
              console.warn('Could not auto-provision missing profile document:', healErr);
            });
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
      console.warn("Impossible de passer hors ligne avec une course en cours.");
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

  // Login (supports either Email or Ivorian Phone Number)
  const login = async (identifier: string, pass: string): Promise<void> => {
    setIsLoading(true);
    try {
      const trimmed = identifier.trim();
      if (!trimmed) {
        throw new Error("Veuillez saisir votre numéro de téléphone ou votre adresse email.");
      }

      let authEmail: string;
      if (trimmed.includes('@')) {
        authEmail = trimmed.toLowerCase();
      } else {
        const cleanPhone = normalizeIvorianPhone(trimmed);
        authEmail = `${cleanPhone}@driver.allodabou.ci`;
      }

      try {
        await signInWithEmailAndPassword(auth, authEmail, pass);
      } catch (firstErr: any) {
        // Fallback for older accounts registered with raw unstripped digits
        if (!trimmed.includes('@')) {
          const rawDigits = trimmed.replace(/\D/g, '');
          if (rawDigits && rawDigits !== normalizeIvorianPhone(trimmed)) {
            const fallbackEmail = `${rawDigits}@driver.allodabou.ci`;
            await signInWithEmailAndPassword(auth, fallbackEmail, pass);
            return;
          }
        }
        throw firstErr;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-in for instant access without password friction
  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (gErr: any) {
      if (
        gErr.code === 'auth/popup-closed-by-user' || 
        gErr.code === 'auth/cancelled-popup-request' ||
        gErr.message?.includes('popup-closed-by-user')
      ) {
        return;
      }
      throw gErr;
    } finally {
      setIsLoading(false);
    }
  };

  // Register Driver (email and vehicleNumber are optional)
  const register = async (params: RegisterParams): Promise<void> => {
    setIsLoading(true);
    isRegisteringRef.current = true;
    try {
      const cleanPhone = normalizeIvorianPhone(params.phone);
      if (!cleanPhone || cleanPhone.length < 8) {
        throw new Error("Veuillez saisir un numéro de téléphone valide à 10 chiffres (ex: 07 08 09 10 11).");
      }

      if (!params.password || params.password.length < 8) {
        throw new Error("Le mot de passe doit comporter au moins 8 caractères pour sécuriser votre compte chauffeur.");
      }

      const rawEmail = params.email ? params.email.trim() : '';
      let providedEmail = '';
      if (rawEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rawEmail)) {
          throw new Error("L'adresse email saisie n'a pas un format valide. Laissez ce champ vide si vous n'avez pas d'email.");
        }
        providedEmail = rawEmail.toLowerCase();
      }

      // Generate consistent authentication email
      const authEmail = providedEmail !== '' ? providedEmail : `${cleanPhone}@driver.allodabou.ci`;

      let user: User;

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          authEmail, 
          params.password
        );
        user = userCredential.user;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use' || authErr.message?.includes('email-already-in-use')) {
          // Attempt automatic login with the provided password
          try {
            const loginCred = await signInWithEmailAndPassword(auth, authEmail, params.password);
            user = loginCred.user;
          } catch (loginErr) {
            const formatted = formatIvorianPhone(cleanPhone);
            throw new Error(`Un compte chauffeur existe déjà avec ces coordonnées (${formatted}). Veuillez vous connecter avec votre mot de passe.`);
          }
        } else if (authErr.code === 'auth/operation-not-allowed' || authErr.message?.includes('operation-not-allowed')) {
          throw new Error("L'inscription par mot de passe n'est pas encore activée sur le projet Firebase. Veuillez utiliser la connexion avec Google ou contacter le régulateur Allô Dabou.");
        } else if (authErr.code === 'auth/invalid-email') {
          throw new Error("Format d'identifiant ou d'email invalide. Veuillez vérifier votre saisie.");
        } else if (authErr.code === 'auth/weak-password') {
          throw new Error("Le mot de passe doit comporter au moins 8 caractères.");
        } else {
          throw authErr;
        }
      }

      // Update Firebase Auth profile
      try {
        await updateProfile(user, {
          displayName: params.displayName.trim(),
          photoURL: params.photoUrl || undefined
        });
      } catch (profileErr) {
        console.warn('Could not update auth profile:', profileErr);
      }

      // Safe Firestore user document creation or update with driverCode reservation
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const existingDoc = await getDoc(userDocRef);
        if (!existingDoc.exists()) {
          const reservedCode = generateDriverCode();
          const batch = writeBatch(db);

          // Reserve driver code in driverCodes collection
          batch.set(doc(db, 'driverCodes', reservedCode), {
            code: reservedCode,
            driverId: user.uid,
            driverName: params.displayName.trim(),
            driverPhone: cleanPhone,
            createdAt: serverTimestamp(),
          });

          // Create driver profile document in users collection
          batch.set(userDocRef, {
            uid: user.uid,
            displayName: params.displayName.trim(),
            email: providedEmail,
            phone: cleanPhone,
            role: 'driver_pending',
            applicationStatus: 'pending',
            isApprovedDriver: false,
            approved: false,
            driverCode: reservedCode,
            hasLicense: params.hasLicense ?? true,
            checklist: {
              licenseVerified: false,
              insuranceVerified: false,
              technicalInspectionVerified: false,
              identityVerified: false,
            },
            vehicleType: params.vehicleType,
            vehicleNumber: params.vehicleNumber ? params.vehicleNumber.trim().toUpperCase() : '',
            photoUrl: params.photoUrl || null,
            isOnline: false,
            ratingAverage: 5.0,
            ratingCount: 0,
            totalRatingSum: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          await batch.commit();
        } else {
          // Document exists: update editable fields without violating RBAC rules
          const existingData = existingDoc.data() || {};
          const updatePayload: Record<string, any> = {
            displayName: params.displayName.trim(),
            email: providedEmail,
            phone: cleanPhone,
            vehicleType: params.vehicleType,
            vehicleNumber: params.vehicleNumber ? params.vehicleNumber.trim().toUpperCase() : '',
            photoUrl: params.photoUrl || null,
            hasLicense: params.hasLicense ?? true,
            updatedAt: serverTimestamp()
          };

          // If existing profile was missing driverCode, reserve one
          if (!existingData.driverCode) {
            const reservedCode = generateDriverCode();
            try {
              await setDoc(doc(db, 'driverCodes', reservedCode), {
                code: reservedCode,
                driverId: user.uid,
                driverName: params.displayName.trim(),
                driverPhone: cleanPhone,
                createdAt: serverTimestamp(),
              });
              updatePayload.driverCode = reservedCode;
            } catch (dcErr) {
              console.warn('Could not reserve driverCode on existing account:', dcErr);
            }
          }

          await updateDoc(userDocRef, updatePayload);
        }
      } catch (firestoreError) {
        console.error('Error saving user profile in Firestore:', firestoreError);
        // H1: Do not swallow the error!
        throw new Error("L'inscription a été interrompue lors de l'enregistrement de votre dossier chauffeur. Veuillez vérifier votre connexion et réessayer.");
      }
    } finally {
      isRegisteringRef.current = false;
      setIsLoading(false);
    }
  };

  // Logout with offline cleanup
  const logout = async (): Promise<void> => {
    if (activeRideId) {
      console.warn("Attention: Course active en cours.");
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
  const resetPassword = async (identifier: string): Promise<void> => {
    const trimmed = identifier.trim();
    if (!trimmed.includes('@')) {
      throw new Error("Pour réinitialiser par email, veuillez saisir votre adresse email ou contacter le dispatch (01 01 68 25 35).");
    }
    await sendPasswordResetEmail(auth, trimmed);
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
        loginWithGoogle,
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
