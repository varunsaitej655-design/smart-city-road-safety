export interface UserProfile {
  userId: string;
  mobileNumber: string;
  email: string;
  createdAt: string;
  lastLoginAt: string;
  totalLocationsChosen?: number;
}

export interface UserLocationRecord {
  id: string;
  userId: string;
  mobileNumber: string;
  email: string;
  currentLocation: string;
  destination: string;
  speed: number;
  vehicleType: string;
  weatherCondition: string;
  surfaceQuality: string;
  riskLevel: string;
  accidentProbabilityScore: number;
  alternateRouteCorridor?: string;
  timestamp: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
  error?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  generatedOtp?: string;
  expiresAt?: string;
  mobileNumber?: string;
  email?: string;
  error?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
  error?: string;
}

export interface DbStatusResponse {
  success: boolean;
  targetUri: string;
  databaseName: string;
  isMongoConnected: boolean;
  connectionError?: string | null;
  engine: string;
  totalUsers?: number | null;
  totalLocationRecords?: number | null;
}
