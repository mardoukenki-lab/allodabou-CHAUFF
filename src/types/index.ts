export type UserRole = 'client' | 'driver_pending' | 'driver' | 'admin';

export type VehicleType = 'moto' | 'voiture';

export type ServiceType = 'vtc' | 'taxi' | 'delivery' | 'concierge';

export type RideStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'driver_arriving' 
  | 'driver_arrived' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid';

export type PaymentMethod = 'cash';

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  phone: string;
  role: UserRole;
  isApprovedDriver: boolean;
  approved?: boolean;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  isOnline?: boolean;
  lastSeenAt?: any;
  photoUrl?: string | null;
  fcmToken?: string;
  fcmTokens?: string[];
  ratingAverage?: number;
  ratingCount?: number;
  totalRatingSum?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Ride {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  destinationAddress: string;
  destinationLat?: number;
  destinationLng?: number;
  distanceKm: number;
  durationMin: number;
  priceFcfa: number;
  serviceType: ServiceType;
  vehicleTypeRequested?: 'moto' | 'voiture' | 'any';
  packageDetails?: string | null;
  recipientPhone?: string | null;
  conciergeTask?: string | null;
  notes?: string | null;
  status: RideStatus;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  driverVehiclePlate?: string | null;
  driverVehicleType?: VehicleType | null;
  declinedBy?: string[];
  acceptedAt?: any;
  arrivingAt?: any;
  arrivedAt?: any;
  startedAt?: any;
  completedAt?: any;
  cancelledBy?: string | null;
  cancelReason?: string | null;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  rating?: number | null;
  ratingComment?: string | null;
  ratedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface EarningsSummary {
  period: 'day' | 'week' | 'month';
  totalEarningsFcfa: number;
  ridesCount: number;
  totalDistanceKm: number;
}
